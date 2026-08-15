# BALKAN SURVIVAL — Agent Contract

This folder is an independent long-term game + publication project.

Before changing anything:
1. Read `README.md`.
2. Read `data/production.json` and `data/builds.json`.
3. Read `docs/SYSTEMS.md`.
4. Read the newest file in `devlog/`.

Non-negotiable rules:
- `MAIN` means the build referenced by `data/production.json`, not the newest commit.
- Never overwrite an old build directory. Published builds are historical artifacts.
- Any meaningful change under `balkan-survival/**` must ship with a new `devlog/*.md` entry explaining what changed, why it exists, what social idea it tests, and what failed or remains unresolved.
- No copied third-party game assets, event text, characters, UI layouts, or proprietary code. References are studied as design systems only.
- Prefer deterministic, data-driven gameplay systems over one-off scene logic.
- Performance budgets are product requirements, not cleanup work.
- Do not modify unrelated repository projects unless explicitly requested.

Promotion rule:
A build becomes MAIN only by changing `data/production.json` after validation. Newer does not mean better.