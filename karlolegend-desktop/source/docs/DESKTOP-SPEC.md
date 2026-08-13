# KARLOLEGEND Desktop Product Specification

## Product definition

KARLOLEGEND Desktop is a personal Windows workspace shell whose canonical world is the filesystem rooted at `K:\`.

It is not an alternate OS and is not a security boundary.

The shell should increasingly behave like a small personal desktop environment:
- render real filesystem objects;
- own navigation;
- own presentation of supported content types;
- preserve a clean K: root;
- retain normal Windows interoperability.

## Desktop contract

### Rendered
- user-created folders;
- user-created files;
- executables other than the shell itself;
- projects, builds, writing and assets.

### Never rendered
- `K:\KARLOLEGEND.exe`;
- `K:\.karlo\`;
- `System Volume Information`;
- `$RECYCLE.BIN`.

These objects may exist physically. "Hidden from KARLOLEGEND" is a UI rule, not a deletion rule.

## One process

Only one normal KARLOLEGEND process may own the desktop per Windows user session.

Multiple child windows are allowed inside that process. A single process does **not** mean a single document window forever. HTML viewers, future editors and tools can be child windows or future tabs while global shell state remains uniquely owned.

## Content ownership

Current routing:

| Type | Open behavior |
|---|---|
| Folder | Navigate inside KARLOLEGEND |
| `.html`, `.htm` | Internal WebView2 viewer |
| Other file | Windows Shell association |
| `.exe` | Launch normally |

Planned routing:
- Markdown -> internal reading/editor view;
- plain text -> internal lightweight editor;
- common images -> internal gallery/viewer;
- audio -> internal player;
- Git repository -> Version Control surface;
- KARLOLEGEND project metadata -> Project surface.

Every internal viewer needs an explicit "Open externally" escape hatch.

## HTML

HTML is local content, not the app UI.

The native WPF shell hosts WebView2 only when HTML must be rendered.

K: is mapped to a private virtual origin:

    https://karlo.local/

This lets local HTML resolve relative CSS/JS/images cleanly while retaining a normal web origin.

Browser profile/cache data belongs under:

    K:\.karlo\state\webview2\

not beside the executable.

## Desktop appearance

v0.4 foundation:
- wallpaper;
- full desktop mode;
- icon surface;
- right-click desktop actions.

Next implementation order:
1. free icon positioning;
2. persist icon coordinates keyed by canonical full path;
3. snap-to-grid option;
4. icon scale;
5. selection rectangle;
6. drag/drop file operations;
7. rename;
8. recycle-bin delete;
9. create text/HTML/project items;
10. per-folder layout state.

## Layout state schema target

`K:\.karlo\state\desktop.json` evolves toward:

```json
{
  "schema": 2,
  "wallpaperPath": "K:\\Assets\\wallpaper.png",
  "iconSize": 64,
  "snapToGrid": true,
  "layouts": {
    "K:\\": {
      "K:\\Projects": { "x": 40, "y": 50 },
      "K:\\Writing": { "x": 40, "y": 150 }
    }
  }
}
```

Coordinates are presentation state. Renaming or moving a filesystem item should migrate or discard its old coordinate entry safely; it must never affect the underlying file operation.

## Desktop interaction target

- double-click: open;
- single-click: select;
- Ctrl/Shift: multi-select;
- F2: rename;
- Delete: move to volume recycle bin;
- Shift+Delete: permanent delete with explicit confirmation;
- Ctrl+N: new folder/item palette;
- F5: refresh;
- F11: chrome-free desktop;
- right-click background: desktop actions;
- right-click item: file actions;
- drag background/item: icon layout;
- drag external files onto desktop: copy/move prompt.

## Non-negotiable failure mode

If KARLOLEGEND is deleted or cannot start, all user data must remain understandable and usable from normal Windows Explorer.
