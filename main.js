/*
 * Pipe Space Normalizer
 * Copyright (c) 2026 vitalexbel
 * Based on table-autopadding-remover by Abdul Raheem Siddiqui (MIT License)
 * https://github.com/ar-siddiqui/table-autopadding-remover
 */

const obsidian = require("obsidian");
const { Plugin, TFile, MarkdownView, PluginSettingTab, Setting } = obsidian;

const DEFAULT_SETTINGS = {
  applyOnSave: false,
};

/* ===== Localization (English default, Russian for ru UI) ===== */

const STRINGS = {
  en: {
    cmdCurrentFile: "Normalize tables in current file",
    cmdAllFiles: "Normalize tables in all markdown files",
    applyOnSave: "Apply on save",
    applyOnSaveDesc:
      "Normalize tables every time a file is saved (Ctrl+S and autosave).",
  },
  ru: {
    cmdCurrentFile: "Нормализовать таблицы в текущем файле",
    cmdAllFiles: "Нормализовать таблицы во всех Markdown-файлах",
    applyOnSave: "Применять при сохранении",
    applyOnSaveDesc:
      "Нормализовать таблицы при каждом сохранении файла (Ctrl+S и автосохранение).",
  },
};

function getStrings() {
  let locale = "en";
  try {
    if (typeof obsidian.getLanguage === "function") {
      locale = obsidian.getLanguage(); // official API, newer Obsidian versions
    } else {
      locale =
        window.localStorage.getItem("language") ||
        (window.moment && window.moment.locale()) ||
        "en";
    }
  } catch (_) {
    locale = "en";
  }
  const lang = String(locale || "en").toLowerCase().split("-")[0];
  return STRINGS[lang] || STRINGS.en;
}

/* ===== Table normalization core (from table-autopadding-remover, MIT) ===== */

function isFenceLine(trimmed) {
  return trimmed.startsWith("```") || trimmed.startsWith("~~~");
}

function countBackticks(line, start) {
  let count = 0;
  while (start + count < line.length && line[start + count] === "`") {
    count++;
  }
  return count;
}

function splitByPipes(line) {
  const cells = [];
  let current = "";
  let i = 0;
  let inWikilink = false;
  let inCode = false;
  let codeTicks = 0;

  while (i < line.length) {
    const ch = line[i];
    const next = i + 1 < line.length ? line[i + 1] : "";

    if (!inCode && !inWikilink && ch === "\\" && next === "|") {
      current += "\\|";
      i += 2;
      continue;
    }

    if (!inCode && ch === "[" && next === "[") {
      inWikilink = true;
      current += "[[";
      i += 2;
      continue;
    }

    if (inWikilink && ch === "]" && next === "]") {
      inWikilink = false;
      current += "]]";
      i += 2;
      continue;
    }

    if (!inWikilink && ch === "`") {
      const ticks = countBackticks(line, i);
      current += "`".repeat(ticks);
      i += ticks;
      if (!inCode) {
        inCode = true;
        codeTicks = ticks;
      } else if (ticks === codeTicks) {
        inCode = false;
        codeTicks = 0;
      }
      continue;
    }

    if (!inCode && !inWikilink && ch === "|") {
      cells.push(current);
      current = "";
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  cells.push(current);
  return cells;
}

function formatCell(text) {
  if (text.length === 0) return " ";
  return ` ${text} `;
}

function isSeparatorCell(text) {
  return /^:?-{3,}:?$/.test(text);
}

function normalizeSeparatorCell(text) {
  const trimmed = text.trim();
  const left = trimmed.startsWith(":");
  const right = trimmed.endsWith(":");
  if (left && right) return ":---:";
  if (left) return ":---";
  if (right) return "---:";
  return "---";
}

function normalizeTableLine(line) {
  const prefixMatch = line.match(/^(\s*(?:>+\s*)*)/);
  const prefix = prefixMatch ? prefixMatch[1] : "";
  const content = line.slice(prefix.length);
  const trimmed = content.trim();

  if (!trimmed.includes("|")) return line;
  if (!(trimmed.startsWith("|") && trimmed.endsWith("|"))) return line;

  const rawCells = splitByPipes(trimmed);
  if (rawCells.length < 3) return line;

  let cells = rawCells;
  cells = cells.slice(1, cells.length - 1);
  const normalizedCells = cells.map((cell) => cell.trim());
  const isSeparatorRow = normalizedCells.every(isSeparatorCell);
  const finalCells = isSeparatorRow
    ? normalizedCells.map(normalizeSeparatorCell)
    : normalizedCells;
  const normalized = `${prefix}|${finalCells.map(formatCell).join("|")}|`;

  return normalized;
}

function normalizeTables(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  let inFence = false;
  let fenceMarker = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (isFenceLine(trimmed)) {
      if (!inFence) {
        inFence = true;
        fenceMarker = trimmed.startsWith("```") ? "```" : "~~~";
      } else if (trimmed.startsWith(fenceMarker)) {
        inFence = false;
        fenceMarker = "";
      }
      result.push(line);
      continue;
    }

    if (inFence) {
      result.push(line);
      continue;
    }

    result.push(normalizeTableLine(line));
  }

  return result.join("\n");
}

/* ===== Settings tab ===== */

class PipeSpaceNormalizerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    const s = getStrings();
    containerEl.empty();

    new Setting(containerEl)
      .setName(s.applyOnSave)
      .setDesc(s.applyOnSaveDesc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.applyOnSave)
          .onChange(async (value) => {
            this.plugin.settings.applyOnSave = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

/* ===== Plugin ===== */

module.exports = class PipeSpaceNormalizer extends Plugin {
  async onload() {
    this.processing = new Set();
    await this.loadSettings();
    this.addSettingTab(new PipeSpaceNormalizerSettingTab(this.app, this));

    const s = getStrings();

    // "Apply on save": fires after the file is written to disk
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (!this.settings.applyOnSave) return;
        if (!(file instanceof TFile) || file.extension !== "md") return;
        if (this.processing.has(file.path)) return;
        this.normalizeFile(file).catch((err) =>
          console.error("PipeSpaceNormalizer:", err)
        );
      })
    );

    this.addCommand({
      id: "normalize-current-file",
      name: s.cmdCurrentFile,
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (checking) return true;
        this.normalizeFile(file);
        return true;
      },
    });

    this.addCommand({
      id: "normalize-all-files",
      name: s.cmdAllFiles,
      callback: () => this.normalizeAllFiles(),
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  findMarkdownView(file) {
    let found = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (found) return;
      const view = leaf.view;
      if (
        view instanceof MarkdownView &&
        view.file &&
        view.file.path === file.path
      ) {
        found = view;
      }
    });
    return found;
  }

  async normalizeFile(file) {
    if (!(file instanceof TFile)) return;
    if (file.extension !== "md") return;
    if (this.processing.has(file.path)) return;

    const view = this.findMarkdownView(file);
    const text = view ? view.editor.getValue() : await this.app.vault.read(file);
    const normalized = normalizeTables(text);
    if (normalized === text) return;

    this.processing.add(file.path);
    try {
      if (view) {
        // Open file: rewrite via editor so a pending autosave cannot
        // overwrite the result; preserve cursor and scroll
        const editor = view.editor;
        const cursor = editor.getCursor();
        const scroll = editor.getScrollInfo();

        editor.setValue(normalized);

        const line = Math.min(cursor.line, editor.lineCount() - 1);
        const ch = Math.min(cursor.ch, editor.getLine(line).length);
        editor.setCursor({ line, ch });
        editor.scrollTo(scroll.left, scroll.top);

        await view.save(); // flush to disk immediately
      } else {
        await this.app.vault.modify(file, normalized);
      }
    } finally {
      this.processing.delete(file.path);
    }
  }

  async normalizeAllFiles() {
    const files = this.app.vault.getMarkdownFiles();
    for (const file of files) {
      // Sequential to avoid heavy vault churn
      // eslint-disable-next-line no-await-in-loop
      await this.normalizeFile(file);
    }
  }
};