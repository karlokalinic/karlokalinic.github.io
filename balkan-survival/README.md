# BALKAN SURVIVAL / SLEGNUĆE

A game, permanent playable-build archive and literary development diary published as one object.

Public route: `/balkan-survival/`

## Current MAIN

`0.1.1 — Nauči sustav, ne tipke`

The first playable vertical slice now has a first-run tutorial, procedural Web Audio SFX/ambience, state-aware motion, reduced-motion behavior and the first committed Unity Web migration contract.

## Architecture

- `index.html` — public project front page; MAIN is always visually dominant.
- `builds/<version>/` — immutable playable builds. Historical builds are never overwritten.
- `data/production.json` — the single pointer to the recommended MAIN build.
- `data/builds.json` — build registry.
- `devlog/` — one literary/critical development entry per meaningful project change.
- `docs/SYSTEMS.md` — implementation backlog and design rationale.
- `docs/AUDIO_TUTORIAL_ANIMATION.md` — polish rules and ownership boundaries.
- `docs/WEBGL_PREP.md` — Unity Web migration and hosting contract.
- `webgl/` — Unity 6 bridge/template scaffolding; not yet a compiled Unity build.
- `scripts/validate.mjs` — archive/manifest integrity checks.

## Release model

`main branch != MAIN game`

A commit may be newer while the public MAIN remains on an older, more stable build. Promotion is explicit through `production.json`.

## Implemented sequence

- `0.0.0` — finite preparation, weight, scarcity and socially weighted objects.
- `0.0.1` — deterministic time, crisis timeline, cancellable tasks and structured RunLog.
- `0.0.2` — directional SocialLedger with evidence-backed promises, refusal, lies and reciprocity.
- `0.1.0` — first full playable evening: variable roster, character-specific affordances, token economy, connected scenarios, visuals and endings.
- `0.1.1` — tutorial, procedural SFX/ambience, motion language and Unity Web integration scaffolding.

## Design rule

Every mechanic must answer four questions:

1. What does the player physically do?
2. What pressure does the system create?
3. What social relationship does that pressure expose?
4. Why is this a game mechanic instead of a paragraph of lore?

If a feature cannot answer all four, it is optional.

## Character rule

A character is not a passive modifier. Presence must change which actions legally exist. Absence therefore changes the rhetoric and strategy of the same scenario.

## Causality rule

A relationship number is never sufficient evidence by itself. Meaningful social mutations should preserve who affected whom, when, which event caused it and why.

## Web runtime rule

Unity will own simulation/rendering. The browser shell will own release routing, archive identity, loading integration, run export and host-level controls. They communicate through a small versioned event bridge rather than duplicated gameplay systems.
