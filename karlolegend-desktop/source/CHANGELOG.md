# Changelog

## 0.4.0 — 2026-08-13

### Added

- Internal `.html` / `.htm` viewer hosted inside KARLOLEGEND with Microsoft WebView2.
- Local K: content is exposed to the embedded renderer through the private `https://karlo.local/` virtual host instead of navigating raw `file://` URLs.
- WebView2 profile/cache state is contained under `K:\.karlo\state\webview2`.
- Desktop wallpaper support with wallpaper imported into hidden KARLOLEGEND state instead of depending on an arbitrary external source path.
- Canvas-based desktop icons that can be freely dragged and keep persistent X/Y positions across refreshes and restarts.
- Initial top-to-bottom desktop placement for newly discovered filesystem objects.
- Desktop background context actions for New Folder, wallpaper, Explorer and refresh.
- Item context actions for Open, Open Externally, Rename and Delete to Recycle Bin.
- F2 rename with a native KARLOLEGEND rename dialog.
- Delete sends the selected filesystem item to the Windows recycle bin after confirmation.
- Chrome-free F11/Desktop mode that hides the normal toolbar and status bar.
- Previous executable backup at `K:\.karlo\updates\backup\KARLOLEGEND.previous.exe` before live updater replacement.
- Compact multi-agent repository context for Codex, Claude, GitHub Copilot and other repository-aware agents.
- Concrete `DESKTOP-SPEC.md` and `UPDATE-PLAN.md` documents.
- Separate Windows CI and explicit release workflows.

### Changed

- Supported content can now be owned by KARLOLEGEND presentation instead of always being delegated to Windows Shell associations. HTML is the first internally-owned content type; unsupported files still fall back to Windows.
- The desktop is now treated as presentation state layered over the real filesystem. User files remain ordinary filesystem objects; KARLOLEGEND-only appearance and icon-layout state belongs under `.karlo\state`.
- Rename migrates the stored icon coordinate to the renamed path; recycle-bin delete removes its stored coordinate.
- Update architecture now explicitly reserves previous-build recovery and documents the next hardening steps: channel manifest, schema versioning, health signal, rollback history and release signing.
- Release creation is explicit rather than treating every source commit as a new binary release; an existing semantic version is not silently overwritten.

## 0.3.2 — 2026-08-13

### Fixed

- Fixed the v0.2 bootstrap failure where `.karloupdate` packages were silently ignored because the package manifest used lowercase JSON keys while the original `System.Text.Json` deserializer expected exact PascalCase property names.
- Future update-package manifests are emitted with exact `Version`, `File`, `Sha256`, and `Notes` keys so v0.2 can parse them.
- The current updater also parses update manifests case-insensitively so future package generators cannot reproduce the same casing failure.

## 0.3.1 — 2026-08-13

### Fixed / hardened

- `K:\KARLOLEGEND.exe` is hidden even when the shell is being rendered by a development process launched from C: with `--root K:\`.
- Remote update discovery no longer trusts the repository-wide `releases/latest` pointer. It scans stable releases and selects the highest semantic version that actually contains a `.karloupdate` asset, so unrelated releases in the shared public repository cannot hijack the update channel.

## 0.3.0 — 2026-08-13

### Fixed / changed

- The running `KARLOLEGEND.exe` is no longer rendered as an item on its own desktop.
- `System Volume Information` is filtered from the desktop.
- `$RECYCLE.BIN` is filtered from the desktop.
- Application instances are limited to one per Windows user session.
- A second launch attempts to restore/focus the existing window and then exits.
- Updater argument passing now uses `ProcessStartInfo.ArgumentList` instead of hand-built command-line quoting.

### Added

- Remote update discovery using the public GitHub Releases API.
- Automatic `.karloupdate` package download into `K:\.karlo\updates\inbox`.
- Toolbar update status/check action.
- GitHub Actions release pipeline for Windows self-contained builds.
- Documentation of the v0.2 → v0.3 bootstrap boundary.

## 0.2.0 — 2026-08-13

### Fixed

- Added the missing `System.IO` namespace import that caused `FileSystemWatcher` and `FileSystemEventArgs` to fail compilation in v0.1.
- Added explicit `System.IO` imports in filesystem-dependent files instead of relying on implicit SDK usings.
- Hardened root-boundary checking so a path merely sharing the same prefix cannot escape the selected root.

### Added

- `.karlo` internal application directory.
- Feature Center.
- Local `.karlofeature` package discovery and installation foundation.
- Local `.karloupdate` self-update packages.
- SHA-256 verification for application update payloads.
- Staged self-update process that copies the running EXE to `%TEMP%`, exits, replaces the deployed EXE and restarts it.
- Development-root override disables self-update.
- Development documentation and architecture notes.

## 0.1.0 — 2026-08-13

Initial filesystem-shell prototype.
