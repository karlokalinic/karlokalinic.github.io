# KARLOLEGEND Desktop — Compact Agent Context

## What this is
A native Windows personal desktop/workspace shell that renders the real filesystem rooted at `K:\`.

It is **not** a VM, alternate OS, security sandbox, remote desktop, Electron app, or database-backed virtual filesystem.

## Territory
- Source/build: `C:\KARLOLEGEND-DESKTOP-SOURCE\`
- Deployed runtime: `K:\KARLOLEGEND.exe`
- User world: normal files/folders under `K:\`
- Internal app state: `K:\.karlo\` (hidden from the shell)

## Core invariant
The filesystem is canonical. If KARLOLEGEND is deleted, user files must remain understandable and usable in Explorer.

Never render:
- `K:\KARLOLEGEND.exe`
- `K:\.karlo\`
- `K:\System Volume Information`
- `K:\$RECYCLE.BIN`

## Runtime model
- C# / WPF / .NET 10 Windows.
- One normal process per Windows user session.
- Multiple child document/tool windows may exist inside that one process.
- Unknown file types open through normal Windows Shell associations.

## Current v0.4 desktop
- Canvas-based movable filesystem icons.
- X/Y positions persist in `.karlo\state\desktop.json` keyed by canonical path.
- F2/native dialog renames real files/folders and migrates the stored layout key.
- Delete sends the selected real item to the Windows recycle bin and removes its layout entry.
- Wallpaper is imported into hidden K: state.
- F11 gives a chrome-free desktop.
- Terminal launcher opens Windows PowerShell in the current directory.

## Content ownership
Current:
- folder -> internal navigation
- `.html` / `.htm` -> internal WebView2 viewer
- other file -> Windows association

Direction:
KARLOLEGEND should increasingly own presentation for Markdown, text, images, audio, project metadata and Git history without becoming a web app.

## HTML rule
WebView2 is an embedded renderer only.
Local K: content maps to `https://karlo.local/`.
WebView2 profile/cache belongs under `K:\.karlo\state\webview2`.

## Desktop next
Priority:
1. snap/grid + icon scale UI;
2. multi-select + rubber-band selection;
3. drag/drop file operations;
4. create-item palette;
5. internal Markdown/text/image viewers;
6. project/version-control surfaces.

Presentation state belongs in `.karlo\state`, never mixed with user files.

## Updates
Current transport: GitHub Releases.
Current package: `.karloupdate`.
Current safeguards: version comparison, staged extraction, executable SHA-256, temporary updater, restart, previous-EXE backup.

Normal source changes run Windows CI. Releases are explicit through `karlolegend-desktop/release.json`; do not silently overwrite an already-published semantic version.

Do not break compatibility casually. Update manifests are API contracts.

Target hardening:
stable channel manifest -> package schema -> signature -> stage -> backup -> swap -> startup health signal -> automatic rollback -> append-only update history.

Never embed a personal GitHub token in the public executable.

## Version control
Goal: GitHub-like local UX without collaboration/social machinery.
Use standard Git as the engine initially.
Expose only what a single developer needs:
repositories, changes, stage, commit, timeline, diff, branches, tags, restore, optional backups/remotes.

Do not reimplement Git object storage unless there is a demonstrated product need.

## Where to look next
Only load deeper context when relevant:
- product/architecture: `source/docs/ARCHITECTURE.md`
- desktop behavior: `source/docs/DESKTOP-SPEC.md`
- updater: `source/docs/UPDATE-PLAN.md`
- version control: `source/docs/VERSION-CONTROL.md`
- chronology/decisions: `source/docs/DEVLOG.md`
- next work: `source/docs/ROADMAP.md`

## Definition of done for code changes
- source compiles in Windows CI;
- publish step succeeds;
- behavior change documented;
- no user content is trapped in app-owned state;
- K: root remains clean;
- updater/release semantics remain recoverable.
