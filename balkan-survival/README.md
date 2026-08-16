# BALKAN SURVIVAL

Working title. This is a game, a permanent build archive, and a development diary published as one object.

Public route: `/balkan-survival/`

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

A commit may be newer while the public MAIN remains on an older, more stable build. Historical builds stay playable.

## Current stage

PRE-PRODUCTION / SYSTEMS LAB.

Current MAIN: `0.0.2 — Dug nije broj`.

The browser prototypes are not throwaway mockups. They are deterministic systems laboratories used to prove the game's causal grammar before the long-term Unity Web implementation inherits it.

Implemented sequence:

- `0.0.0` — finite preparation, weight, scarcity and socially weighted objects.
- `0.0.1` — deterministic time, crisis timeline, cancellable tasks and structured RunLog.
- `0.0.2` — directional SocialLedger with evidence-backed promises, refusal, lies and reciprocity.

## Design rule

Every mechanic must answer four questions:

1. What does the player physically do?
2. What pressure does the system create?
3. What social relationship does that pressure expose?
4. Why is this a game mechanic instead of a paragraph of lore?

If a feature cannot answer all four, it is optional.

## Causality rule

A relationship number is never sufficient evidence by itself.

Every meaningful social mutation must preserve:
- who affected whom,
- when,
- which action or event caused it,
- which dimensions changed,
- and a human-readable reason.

Future narrative systems must be able to explain why an event occurred from recorded state rather than hiding arbitrary randomness behind prose.
