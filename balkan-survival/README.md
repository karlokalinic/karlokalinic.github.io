# BALKAN SURVIVAL

Working title. This is a game, a permanent build archive, and a development diary published as one object.

Public route: `/balkan-survival/`

## Architecture

- `index.html` — public project front page; MAIN is always visually dominant.
- `builds/<version>/` — immutable playable builds. The first build is a browser systems prototype; later builds may be Unity Web exports.
- `data/production.json` — the single pointer to the recommended MAIN build.
- `data/builds.json` — build registry.
- `devlog/` — one literary/critical development entry per meaningful project change.
- `docs/SYSTEMS.md` — implementation backlog and design rationale.
- `scripts/validate.mjs` — archive/manifest integrity checks.

## Release model

`main branch != MAIN game`

A commit may be newer while the public MAIN remains on an older, more stable build. Historical builds stay playable.

## Current stage

PRE-PRODUCTION / SYSTEMS LAB.

Build `0.0.0` is intentionally small. It proves the archive, MAIN pointer, resource-choice grammar, social scoring, and devlog workflow before a Unity project is allowed to become large.

## Design rule

Every mechanic must answer four questions:

1. What does the player physically do?
2. What pressure does the system create?
3. What social relationship does that pressure expose?
4. Why is this a game mechanic instead of a paragraph of lore?

If a feature cannot answer all four, it is optional.