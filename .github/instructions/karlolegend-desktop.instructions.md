---
applyTo: "karlolegend-desktop/**,.github/workflows/karlolegend-desktop-release.yml"
---

Read `karlolegend-desktop/AI_CONTEXT.md` before making changes.

Critical invariants:
- `C:` is source/build territory; deployed shell/user world is `K:`.
- `K:\KARLOLEGEND.exe`, `.karlo`, `$RECYCLE.BIN`, and `System Volume Information` are never rendered as desktop content.
- One normal KARLOLEGEND process per Windows user session.
- User data is normal filesystem data; internal state lives under `K:\.karlo`.
- Git may be used as the local version-control engine, but the product must not depend on GitHub collaboration features.
- Supported content types should increasingly open inside KARLOLEGEND; unsupported types fall back to Windows associations.
- Never silently break updater compatibility. Treat package manifests as versioned API contracts.
