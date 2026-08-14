# Claude Repository Entry Point

For KARLOLEGEND Desktop, treat `karlolegend-desktop/AI_CONTEXT.md` as the canonical compact context and `karlolegend-desktop/source/docs/` as the detailed record.

Do not infer that the whole repository is one application: it also contains unrelated site content.

Before editing `karlolegend-desktop/**`, read:
- `karlolegend-desktop/AI_CONTEXT.md`
- `karlolegend-desktop/AGENTS.md`

Prefer small coherent commits, preserve the filesystem-first design, and validate the Windows CI/publish contract after source changes. Stable release creation is explicit through `karlolegend-desktop/release.json`; do not trigger or overwrite a release merely because source changed.
