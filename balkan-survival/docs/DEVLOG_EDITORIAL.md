# DEVLOG EDITORIAL STANDARD

The devlog is not a changelog with better sentences. It is part of the work.

Every substantial project change should produce a column that can be read by someone who does not have the repository open, while still containing enough implementation detail that a developer can reconstruct the design decision from the text.

## Required shape

A strong entry normally contains six movements, not necessarily six headings:

1. **Concrete technical object** — name the actual thing that changed: class, schema, event channel, rendering pass, asset convention, build rule, memory constraint, algorithm or data model.
2. **Problem before implementation** — explain what was structurally wrong, not merely what feature was missing.
3. **Implementation** — show the data flow and important identifiers. Include code fragments when they reveal the architecture rather than decorate the article.
4. **Second meaning** — derive the social, philosophical or existential argument from the technical mechanism itself. Do not paste a metaphor on top of unrelated code.
5. **Counterpressure** — state what the model cannot represent, what becomes harder, what could fail, and what trade-off was accepted.
6. **Next falsifiable experiment** — identify what the next build must prove. Avoid vague roadmaps.

## Prose rules

Write paragraphs, not a stack of slogans. A short standalone sentence is useful only when the preceding paragraph has earned it. Do not use more than one aphoristic one-line paragraph in a section unless the rhythm has a clear functional reason.

Prefer an argument that develops across 4–8 sentences to repeated thesis fragments. The target is a column, not release-note poetry.

Use technical nouns precisely: `RunState`, `ScenarioDefinition`, `WebBridge`, `AudioContext`, `ScriptableObject`, `JsonUtility`, `localStorage`, `Content-Encoding`, `SpriteAtlas`. If a technical term matters, explain what responsibility it carries in this project.

Do not write “this is more realistic” without specifying which causal relation became representable. Do not write “society” when the actual subject is ownership, access, institutional memory, labor, family obligation, information asymmetry, class, or another narrower mechanism.

Philosophical language must survive contact with the implementation. If the article says that promises behave like reserved inventory, there must be a state representation capable of reserving a future resource. If it says that institutions remember, there must be persisted evidence or a ledger that can be queried later.

## Technical minimum

For source-heavy commits, the column should normally identify:

- the authoritative state owner;
- inputs and outputs;
- mutation boundary;
- serialization boundary;
- deterministic vs random behavior;
- failure behavior;
- what the UI is allowed to know versus own;
- what will be tested before promotion to MAIN.

For art-heavy commits, replace the above with canonical asset identity, modular layers, state derivation, scale/anchor rules, naming/versioning, runtime cost and failure cases such as identity drift.

## Tone

The voice can be polemical, dry, intimate or socially critical, but it should remain original. The point is not to imitate a living columnist. The point is to write a development column that has enough pressure to be literature and enough specificity to be engineering documentation.

The recurring test is simple: remove the rhetorical sentences. If the article no longer documents the design, it is too literary. Remove the code and identifiers. If nothing remains except a changelog, it is not literary enough.
