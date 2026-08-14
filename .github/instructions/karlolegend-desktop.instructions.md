---
applyTo: "karlolegend-desktop/**,.github/workflows/karlolegend-desktop-*.yml"
---

Read `karlolegend-desktop/AI_CONTEXT.md` before making changes.

Critical invariants:
- GitHub is canonical source/build territory; a local checkout is optional and may live anywhere.
- Production deployment is `K:\KARLOLEGEND.exe`; a production machine must not depend on source or build artifacts on `C:`.
- `karlolegend-desktop/install.ps1` is the canonical zero-source bootstrap for the latest stable GitHub Release.
- `K:\KARLOLEGEND.exe`, `.karlo`, `$RECYCLE.BIN`, and `System Volume Information` are never rendered as desktop content.
- One normal KARLOLEGEND process per Windows user session.
- User data is normal filesystem data; internal state lives under `K:\.karlo`.
- Git may be used as the local version-control engine, but the product must not depend on GitHub collaboration features.
- Supported content types should increasingly open inside KARLOLEGEND; unsupported types fall back to Windows associations.
- Ordinary source changes run CI; stable releases are explicit through matching project/release.json versions.
- Never silently break updater compatibility. Treat package manifests as versioned API contracts.
