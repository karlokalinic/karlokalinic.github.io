# Changelog

## 0.3.0 — 2026-08-13

### Fixed / changed

- The running `KARLOLEGEND.exe` is no longer rendered as an item on its own desktop.
- `System Volume Information` is filtered from the desktop.
- `$RECYCLE.BIN` is filtered from the desktop.
- Application instances are limited to one per Windows user session.
- A second launch attempts to restore/focus the existing KARLOLEGEND window and then exits.
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
