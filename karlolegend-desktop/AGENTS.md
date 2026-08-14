# KARLOLEGEND Desktop Agent Instructions

Read `AI_CONTEXT.md` first. It is intentionally short and should be enough for most tasks.

Source root: `karlolegend-desktop/source/`

Build/release:
- Canonical source/build lives in GitHub; never require a fixed local `C:` source path.
- Target: `net10.0-windows`, WPF, `win-x64`.
- Publish: self-contained, single-file.
- Ordinary source changes trigger `.github/workflows/karlolegend-desktop-ci.yml` only.
- Stable release creation is explicit: `karlolegend-desktop/release.json` must match the project version and then `.github/workflows/karlolegend-desktop-release.yml` creates the immutable versioned release assets.
- `karlolegend-desktop/install.ps1` is the canonical zero-source production bootstrap and must keep working from Windows PowerShell.
- Do not claim a build is valid until CI/publish succeeds.

Code rules:
- Use native WPF/.NET for shell behavior.
- WebView2 is allowed only as an embedded renderer for HTML/web content; do not turn the application into an Electron/web-shell architecture.
- Keep all application-generated state under `K:\.karlo`.
- Do not create visible runtime helper files in the K: root.
- Never store the canonical list of user files in a database. Enumerate the filesystem.
- Route supported content internally; keep an explicit external-open escape hatch.
- Preserve single-instance semantics; updater mode is the intentional exception.
- Update `CHANGELOG.md` and `docs/DEVLOG.md` for behavior changes.

Primary docs:
- `source/docs/ARCHITECTURE.md`
- `source/docs/DESKTOP-SPEC.md`
- `source/docs/UPDATE-PLAN.md`
- `source/docs/VERSION-CONTROL.md`
- `source/docs/ROADMAP.md`
