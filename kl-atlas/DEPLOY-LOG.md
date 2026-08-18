# KL//ATLAS Public Runtime Correction Log

## 2026-08-18 — Playground Zero: scene flow + camera ownership

### Problem observed

The original browser micro-world activated gameplay immediately on page load and used mouse drag as the primary camera control. Its drag implementation applied vertical delta with the wrong sign for the rendered camera convention, so dragging upward moved the view downward and dragging downward moved it upward.

### Corrections

- Added an explicit MAIN MENU state before gameplay.
- MENU owns navigation only; WASD and camera input are disabled there.
- ENTER or the START GAME button transitions MENU -> GAME.
- GAME uses desktop Pointer Lock mouse-look as the primary camera control.
- Corrected vertical camera direction: mouse up looks up; mouse down looks down.
- ESC releases Pointer Lock without destroying the current GAME state.
- Clicking the GAME viewport reacquires mouse capture.
- Drag-look remains only as a fallback for touch input or browsers without Pointer Lock support.
- Added a visible MENU button for deterministic return/testing.
- Updated tutorial copy so it no longer teaches drag as normal desktop game behavior.
- Added source comments explaining why drag existed, why it is demoted, and how scene/input ownership maps conceptually to Unity.
- Added browser console correction logs under `[KL//ATLAS][Playground Zero]`.

### Design rule going forward

A teaching viewport must not steal gameplay input merely because the web page loaded. Gameplay controls become active only after an explicit game-state transition. Browser convenience fallbacks must not be presented as canonical Unity/game input behavior.

### Unity correspondence

This browser implementation is a deterministic teaching model, not a Unity runtime. The conceptual mapping is:

`MENU scene -> explicit Start action -> GAME scene -> gameplay input ownership`

In an actual Unity project the same responsibility boundary would normally be represented by separate scenes or an equally explicit state/flow controller.
