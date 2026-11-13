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
- Optional Apply on save: runs on Ctrl+S and on autosave
- Cursor position and scroll are preserved in open files
- Works on desktop and mobile
- UI follows the Obsidian interface language (English and Russian included)

## Commands

| Command | Action |
| --- | --- |
| Normalize tables in current file | Normalize all tables in the active file |
| Normalize tables in all markdown files | Normalize tables across the whole vault |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| Apply on save | off | Normalize tables on every file save (Ctrl+S and autosave) |

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

This project adds the Apply on save option, a settings tab, safe handling of
open files (editor-based rewrite with cursor/scroll preservation and
immediate save), and English/Russian localization.

Background: [Obsidian forum discussion about table
auto-padding](https://forum.obsidian.md/t/add-a-configurable-switch-flag-to-disable-auto-padding-of-table-cells/81531).

## License

MIT. See [LICENSE](LICENSE).
