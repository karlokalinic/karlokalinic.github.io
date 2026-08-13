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

## Desktop appearance and layout

Implemented in the v0.4 line:
- wallpaper;
- full desktop mode;
- Canvas-based icon surface;
- free mouse positioning of icons;
- persistent X/Y coordinates keyed by canonical filesystem path;
- initial Windows-like top-to-bottom column placement for unseen items;
- right-click desktop actions;
- right-click item actions;
- native rename dialog;
- Delete sends the selected file/folder to the Windows recycle bin;
- F2 rename;
- F11 chrome-free desktop mode.

The filesystem still determines what exists. Coordinates do not create shortcuts or proxy files.

## Layout state

`K:\.karlo\state\desktop.json` uses presentation-only state similar to:

```json
{
  "schema": 2,
  "wallpaperPath": "K:\\.karlo\\state\\wallpaper\\desktop.jpg",
  "openHtmlInsideKarlolegend": true,
  "snapToGrid": false,
  "iconSize": 52,
  "iconPositions": {
    "K:\\PROJECTS": { "x": 16, "y": 16 },
    "K:\\WRITING": { "x": 16, "y": 136 }
  }
}
```

Coordinate keys are normalized canonical paths. Rename migrates the stored coordinate to the renamed filesystem path. Delete removes the corresponding coordinate entry.

Presentation-state persistence must never be allowed to block ordinary filesystem navigation.

## Desktop interaction — current

- double-click: open;
- single-click: select;
- mouse drag item: move desktop icon;
- Enter: open selected item;
- F2: rename selected item;
- Delete: send selected item to recycle bin with confirmation;
- F5: refresh;
- F11: enter/leave chrome-free desktop;
- right-click background: create folder, wallpaper, Explorer, refresh;
- right-click item: open, open externally, rename, recycle-bin delete.

## Desktop interaction — next

1. snap-to-grid UI toggle and icon scale UI;
2. multi-selection and rubber-band selection;
3. drag/drop file operations;
4. create-item palette for text/HTML/project templates;
5. per-directory layout profiles beyond global canonical-path coordinates;
6. keyboard spatial navigation;
7. Shift+Delete permanent-delete path with stronger confirmation;
8. desktop sorting/auto-arrange as optional commands, never mandatory layout.

## Non-negotiable failure mode

If KARLOLEGEND is deleted or cannot start, all user data must remain understandable and usable from normal Windows Explorer.
