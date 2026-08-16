# BALKAN SURVIVAL / SLEGNUĆE

A game, permanent playable-build archive and literary development diary published as one object.

Public route: `/balkan-survival/`

## Current MAIN

`0.1.0 — Prvi javni rez`

This is the first build treated as a public vertical slice rather than a systems laboratory. It contains a complete one-evening run, canonical cast visuals, variable character presence, character-exclusive actions, a five-token social economy and state-aware endings.

## Architecture

- `index.html` — public project front page; MAIN is always visually dominant.
- `builds/<version>/` — immutable playable builds. Historical builds are never overwritten.
- `data/production.json` — the single pointer to the recommended MAIN build.
- `data/builds.json` — build registry.
- `devlog/` — one literary/critical development entry per meaningful project change.
- `docs/SYSTEMS.md` — implementation backlog and design rationale.
- `scripts/validate.mjs` — archive/manifest integrity checks.

## Release model

`main branch != MAIN game`

A commit may be newer while the public MAIN remains on an older, more stable build. Promotion is explicit through `production.json`.

## Implemented sequence

- `0.0.0` — finite preparation, weight, scarcity and socially weighted objects.
- `0.0.1` — deterministic time, crisis timeline, cancellable tasks and structured RunLog.
- `0.0.2` — directional SocialLedger with evidence-backed promises, refusal, lies and reciprocity.
- `0.1.0` — first full playable evening: variable roster, character-specific affordances, token economy, connected scenarios, visuals and endings.

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
