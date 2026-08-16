# UNITY WEB PREPARATION CONTRACT

Target: Unity 6 Web build embedded into the existing Slegnuće release/archive model without changing the public route structure.

## What is already prepared

`webgl/Assets/Plugins/WebGL/SlegnuceBridge.jslib`
- Unity -> browser event emission;
- last-run persistence hook;
- browser cursor-state hook.

`webgl/Assets/Scripts/Web/SlegnuceWebBridge.cs`
- one persistent `WebBridge` GameObject;
- C# wrappers around browser calls;
- `ReceiveShellCommand(string)` endpoint for browser -> Unity messages.

`webgl/Assets/WebGLTemplates/Slegnuce/index.html`
- Unity 6 `createUnityInstance()` boot path;
- progress bar;
- build metadata;
- `autoSyncPersistentDataPath`;
- parent-page `postMessage` bridge;
- browser -> Unity `SendMessage` hook.

`webgl/hosting/cloudflare/_headers`
- candidate static-asset MIME/cache rules for a later Cloudflare-hosted release.

## Release topology

Keep these identities separate:

- Git commit: source history.
- Build version: immutable playable artifact.
- MAIN: one pointer in `data/production.json`.
- Unity build: runtime implementation, not the website itself.

A future release should look like:

```
builds/0.3.0/
  index.html        # Unity-generated Slegnuce web template
  Build/
  StreamingAssets/
```

The historical browser-JS builds remain playable.

## Browser/Unity event contract

Unity -> shell examples:

```
RUN_STARTED
SCENE_CHANGED
CHOICE_COMMITTED
RESOURCE_CHANGED
CHARACTER_STATE_CHANGED
RUN_COMPLETE
REQUEST_CURSOR
```

Payload is JSON text.

Shell -> Unity examples:

```
SET_AUDIO_MUTED
SET_TUTORIAL_STATE
REQUEST_RUN_EXPORT
RESTORE_RUN
PAUSE_FROM_SHELL
```

Do not create individual JS functions for every mechanic. Keep one small event channel and version the payload schema.

## Web build settings baseline

For the first Unity integration build:
- IL2CPP / Web target;
- custom `Slegnuce` Web template;
- compression choice must match hosting headers;
- keep Decompression Fallback off when the host can send correct `Content-Encoding` headers;
- use Decompression Fallback only as a compatibility escape hatch on hosts where headers cannot be controlled;
- serve `.wasm` as `application/wasm` to allow WebAssembly streaming compilation;
- do not assume threaded desktop audio/middleware behavior on Web; keep essential audio features inside the supported basic path;
- require a user gesture before expecting audible playback.

## Performance gates before MAIN promotion

Initial budget targets:
- no loading of historical builds until the player selects one;
- canvas only after user chooses PLAY;
- 60 fps target for the 2D shelter scene on desktop;
- zero per-frame JSON serialization;
- browser bridge only on meaningful state transitions;
- atlased character/body parts;
- pooled animated props and UI indicators;
- no LINQ or allocations in hot Update loops;
- test cold load, repeat load and restore-from-local-storage separately.

## Migration order

1. Create Unity project shell and copy `webgl/Assets/` scaffold.
2. Implement one shelter scene using the current 0.1.x resource/roster schema.
3. Mirror one event end-to-end through WebBridge.
4. Export `RUN_COMPLETE` JSON and compare it to browser build output.
5. Add modular character animation.
6. Add production audio clips/mixer only after Web build behavior is verified.
7. Produce an immutable Unity build route.
8. Promote by changing only `production.json`.
