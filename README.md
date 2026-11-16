# Pipe Space Normalizer

English | [Русский](README.ru.md)

Removes extra padding spaces from Markdown tables in Obsidian.

Obsidian automatically pads table cells with spaces to align columns in the
source text. It looks tidy in the editor, but inflates your files and makes
git history noisy: editing a single cell re-pads the whole table, so every
row shows up in the diff.

Pipe Space Normalizer collapses the padding back to a single space around
each cell, keeping files compact and diffs clean.

## Before and after

Before:

```markdown
| Name  | Value |
| ----- | ----- |
| alpha | 1     |
| beta  | 22    |
```

After:

```markdown
| Name | Value |
| --- | --- |
| alpha | 1 |
| beta | 22 |
```

## Features

- Single space around cell content: `| cell |`
- Separator rows collapsed to `---`, alignment markers preserved
  (`:---`, `---:`, `:---:`)
- Escaped pipes `\|`, wikilinks `[[note|alias]]` and inline code are handled
  correctly
- Code fences (``` and ~~~) are left untouched
- Apply on save: formats tables when you press Ctrl+S / Cmd+S
- Never runs on background autosave — no cursor jumps while typing in
  Live Preview
- Compatible with Linter and other plugins: the original save command is
  always executed, nothing is blocked
- Cursor position, scroll and undo history are preserved (line-by-line
  replacement instead of a full document rewrite)
- Works on desktop and mobile
- UI follows the Obsidian interface language (English and Russian included)

## Commands

| Command | Action |
| --- | --- |
| Normalize tables in current file | Normalize all tables in the active file |
| Normalize tables in all markdown files | Normalize tables across the whole vault |

Both commands can be assigned custom hotkeys in Settings → Hotkeys.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| Apply on save | on | Normalize tables when saving with Ctrl+S / Cmd+S. Background autosave is not affected. |

No hotkey configuration is required: the standard save shortcut works as usual.

## Installation

### Via BRAT

1. Install and enable the BRAT plugin.
2. Run the command "BRAT: Add a beta plugin for testing".
3. Paste `https://github.com/vitalexbel/pipe-space-normalizer` and confirm.
4. Enable Pipe Space Normalizer in Settings → Community plugins.

### Manual

1. Download `main.js` and `manifest.json` from the latest release.
2. Create the folder `YOUR_VAULT/.obsidian/plugins/pipe-space-normalizer/`
   and put both files there.
3. Enable the plugin in Settings → Community plugins.

## Notes

- Only lines that start and end with `|` are treated as table rows.
- The plugin is plain JavaScript, no build step required.
- Normalization is idempotent: running it twice changes nothing.

## Attribution

The table normalization core is taken from
[table-autopadding-remover](https://github.com/ar-siddiqui/table-autopadding-remover)
by Abdul Raheem Siddiqui (MIT License).

This project adds the Apply on save option (a hook on the built-in save
command, autosave untouched), a settings tab, safe line-by-line rewriting
of open files with cursor/scroll preservation, and English/Russian
localization.

Background: [Obsidian forum discussion about table
auto-padding](https://forum.obsidian.md/t/add-a-configurable-switch-flag-to-disable-auto-padding-of-table-cells/81531).

## License

MIT. See [LICENSE](LICENSE).
