'use strict';

const BASELINE_DOMAINS = [
  ['project-anatomy', 'UNITY PROJECT ANATOMY'], ['scene-flow', 'SCENES / BOOT FLOW'], ['runtime-flow', 'C# RUNTIME FLOW'],
  ['serialization', 'SERIALIZATION / REFERENCES'], ['input', 'INPUT'], ['movement', 'PLAYER MOVEMENT'], ['interaction', 'INTERACTION'],
  ['animation', 'ANIMATION'], ['navigation', 'THREAT / NAVIGATION'], ['audio', 'AUDIO'], ['rendering', 'LIGHTING / RENDERING'], ['release', 'BUILD / RELEASE']
];

const TIP_BANK = {
  foundation: [
    'Do not begin with the most impressive system. Begin with the first dependency that makes later systems possible.',
    'A Unity scene is not a picture. Treat it as a serialized dependency container.',
    'When a field is public or serialized, ask which scene or prefab is responsible for supplying it.',
    'Separate engine service, project abstraction, gameplay rule and presentation. They fail for different reasons.'
  ],
  bridge: [
    'The useful question is not “what does this class do?” but “what gives it data, what state can it change, and who observes the change?”',
    'A bridge system has disproportionate value because removing it makes otherwise-correct systems unable to communicate.',
    'Trace verbs across files. Input reads; movement consumes; controller moves; audio reports. That chain is more memorable than isolated syntax.'
  ],
  system: [
    'State booleans are not automatically bad. First identify which object owns the truth and which transitions are legal.',
    'For an interaction, prove four things: detection, eligibility, command, visible consequence.',
    'Before adding polish, build a minimal observable version of the system and make its state transitions boringly explicit.'
  ],
  atmosphere: [
    'Atmosphere is a system stack: geometry + materials + light + camera + post + sound + pacing. Do not debug “the vibe” as one variable.',
    'Ambient audio is world state, not decoration. Map each loop to the place, transition or machine state that justifies it.',
    'A render profile should be reproducible from settings and assets, not remembered as a sequence of editor clicks.'
  ],
  release: [
    'A build that opens is evidence; it is not proof of a complete gameplay route.',
    'Make the release test describe player-observable behavior: menu opens, start enters play, interaction works, finale returns or exits cleanly.',
    'Validation scripts are part of the architecture because they define what “working” means in executable form.'
  ]
};

const PAUKTUNEL_MODULES = [
  {
    id: 'contract', order: 0, title: 'PROJECT CONTRACT', domains: ['project-anatomy', 'serialization', 'release'],
    thesis: 'Before writing gameplay, establish what kind of Unity project you are rebuilding and what counts as a valid reconstruction.',
    why: 'Engine version, packages, render pipeline, build targets, scenes and validation rules constrain every later implementation choice.',
    breaks: 'Without a contract, later bugs become ambiguous: code, package version, input backend, scene registration and rendering can all be wrong at once.',
    prereqs: [], unlocks: ['boot'], concepts: ['Unity project', 'Packages', 'ProjectSettings', 'build scenes', 'validation'],
    evidence: ['README.md', 'ProjectSettings/', 'Packages/', 'Assets/scenes/menu.unity', 'Assets/scenes/main.unity'],
    tasks: ['Create/open a Unity 6000.4.0f1 project.', 'Confirm the project uses the New Input System and the intended render/post stack.', 'Create two empty scenes named menu and main and register them in build order.', 'Write down the smallest smoke test that will later define success.'],
    doneWhen: 'A blank project opens with the intended engine/package assumptions, both scenes are registered, and you can state the release proof before gameplay exists.',
    metrics: { downstream: .90, bootstrap: 1, bridge: .75, depth: 1, salience: .75 }, tip: 'foundation'
  },
  {
    id: 'boot', order: 1, title: 'BOOT / SCENE FLOW', domains: ['scene-flow', 'serialization'],
    thesis: 'Make the game enter the right world before teaching it how to behave inside that world.',
    why: 'Menu-to-game flow creates the first observable lifecycle boundary and gives every runtime system a predictable scene context.',
    breaks: 'A perfect movement script is irrelevant if the player never reaches the scene that owns it.',
    prereqs: ['contract'], unlocks: ['input', 'interface'], concepts: ['menu.unity', 'main.unity', 'SceneManager', 'scene references'],
    evidence: ['Assets/scenes/menu.unity', 'Assets/scenes/main.unity', 'Assets/Scripts/Assembly-CSharp/RuntimeSceneReferences.cs'],
    tasks: ['Build a minimal menu scene with one start action.', 'Create a main scene with a visible spatial landmark.', 'Wire the start action to the main scene using a single explicit scene-flow responsibility.', 'Return to the menu and verify the transition repeatedly.'],
    doneWhen: 'Launching the project always opens the menu and the start action deterministically enters main without missing-reference errors.',
    metrics: { downstream: .92, bootstrap: .95, bridge: .82, depth: .95, salience: .9 }, tip: 'foundation'
  },
  {
    id: 'input', order: 2, title: 'INPUT VOCABULARY', domains: ['input', 'runtime-flow'],
    thesis: 'Define what the player can ask the game to do before any gameplay object interprets those requests.',
    why: 'Pauktunel centralizes Move, Look, Interact, Jump, Sprint, Menu, Advance and Flashlight semantics in GameInput instead of scattering raw device reads through gameplay.',
    breaks: 'If gameplay scripts read devices independently, remapping and debugging become duplicated, and every later system learns hardware instead of intent.',
    prereqs: ['contract'], unlocks: ['player', 'contact', 'interface'], concepts: ['GameInput', 'Move', 'Look', 'InteractPressed', 'SprintHeld', 'JumpPressed'],
    evidence: ['Assets/Scripts/Assembly-CSharp/GameInput.cs'],
    tasks: ['Create a static input abstraction.', 'Expose normalized Move and Look values.', 'Expose frame-edge actions separately from held actions.', 'Support keyboard/mouse first; add gamepad without changing consumers.'],
    doneWhen: 'A temporary debug panel can show Move/Look and every action state without PlayerMovement or interaction code knowing which device produced them.',
    metrics: { downstream: 1, bootstrap: .88, bridge: 1, depth: .9, salience: .95 }, tip: 'bridge'
  },
  {
    id: 'player', order: 3, title: 'PLAYER BODY', domains: ['movement', 'runtime-flow', 'serialization'],
    thesis: 'Turn abstract player intent into a body with collision, orientation, gravity, grounding and readable motion state.',
    why: 'PlayerMovement consumes GameInput, drives CharacterController, computes grounded/moving/sprinting state and coordinates footstep timing.',
    breaks: 'Without a stable body, interaction distances, spatial audio, triggers, camera expectations and threat behavior have no trustworthy subject.',
    prereqs: ['input', 'boot'], unlocks: ['contact', 'threat', 'audio'], concepts: ['PlayerMovement', 'CharacterController', 'MouseLook', 'groundCheck', 'gravity', 'footstep'],
    evidence: ['Assets/Scripts/Assembly-CSharp/PlayerMovement.cs', 'Assets/Scripts/Assembly-CSharp/MouseLook.cs'],
    tasks: ['Add a CharacterController to the player root.', 'Consume GameInput.Move and translate relative to player orientation.', 'Add gravity and an explicit ground check.', 'Add Look as a separate camera/body concern.', 'Expose moving and sprinting state before connecting sound.'],
    doneWhen: 'In main, the player can look, walk, sprint and stop against collision; grounded state is inspectable and movement does not depend on raw keyboard reads.',
    metrics: { downstream: .96, bootstrap: .85, bridge: .92, depth: .84, salience: 1 }, tip: 'bridge'
  },
  {
    id: 'contact', order: 4, title: 'CONTACT / INTERACTION', domains: ['interaction', 'runtime-flow', 'serialization'],
    thesis: 'Teach the world to answer a deliberate player action through a traceable detection → eligibility → command → consequence chain.',
    why: 'Buttons, crosshair feedback and airlock actions are where abstract input becomes an object-specific world change.',
    breaks: 'If interaction logic is implicit, every clickable object invents its own rules and the player cannot form a reliable model of what “use” means.',
    prereqs: ['input', 'player'], unlocks: ['machine', 'interface'], concepts: ['ButtonPress', 'crosshair', 'airlockOpener', 'InteractPressed', 'target'],
    evidence: ['Assets/Scripts/Assembly-CSharp/ButtonPress.cs', 'Assets/Scripts/Assembly-CSharp/crosshair.cs', 'Assets/Scripts/Assembly-CSharp/airlockOpener.cs'],
    tasks: ['Choose one interactable button.', 'Detect a candidate target from the player/camera.', 'Gate the action with one explicit eligibility condition.', 'Invoke the target command only on InteractPressed.', 'Provide one visible or audible confirmation.'],
    doneWhen: 'You can point to the exact line/step where the player target becomes eligible and the exact command that changes the target state.',
    metrics: { downstream: .88, bootstrap: .7, bridge: .96, depth: .75, salience: .95 }, tip: 'system'
  },
  {
    id: 'machine', order: 5, title: 'MACHINE STATE', domains: ['runtime-flow', 'interaction', 'audio'],
    thesis: 'Build one stateful machine whose movement is legal only when explicit gates allow it.',
    why: 'The crane controller is a compact lesson in owned state: operating gates the loop; direction flags request movement; canMove flags constrain it; audio reports axis motion.',
    breaks: 'Without owned machine state, input, collision and sound can each believe a different thing about whether the machine is moving.',
    prereqs: ['contact'], unlocks: ['animation', 'audio'], concepts: ['craneController', 'operating', 'canMove', 'collisionChecker', 'AudioSource'],
    evidence: ['Assets/Scripts/Assembly-CSharp/craneController.cs', 'Assets/Scripts/Assembly-CSharp/craneBreaker.cs', 'Assets/Scripts/Assembly-CSharp/collisionChecker.cs'],
    tasks: ['Create a machine root transform.', 'Model requested movement separately from allowed movement.', 'Move one axis first and prove the gate.', 'Add collision/failsafe inhibition.', 'Attach movement audio only after motion truth is reliable.'],
    doneWhen: 'The machine cannot move through a blocked direction, stops when operation ends, and its sound state follows actual requested/allowed movement.',
    metrics: { downstream: .74, bootstrap: .55, bridge: .86, depth: .66, salience: .83 }, tip: 'system'
  },
  {
    id: 'threat', order: 6, title: 'THREAT / NAVIGATION', domains: ['navigation', 'runtime-flow', 'animation'],
    thesis: 'Introduce threat only after the player and spatial rules are stable; separate verified trigger behavior from unverified pathfinding assumptions.',
    why: 'The current Pauktunel snapshot contains spider trigger/animation assets and spatial trigger scripts, but this curriculum has not verified a canonical NavMeshAgent controller in the repository.',
    breaks: 'Calling every moving threat “AI pathfinding” makes the mental model false. Triggered animation, pursuit steering, waypoint motion and NavMesh pathfinding are different architectures.',
    prereqs: ['player', 'boot'], unlocks: ['animation', 'audio'], concepts: ['cliffspiderTrigger', 'spider animation', 'trigger volume', 'navigation evidence'],
    evidence: ['Assets/Scripts/Assembly-CSharp/cliffspiderTrigger.cs', 'Assets/AnimationClip/spider anim.anim', 'Assets/AnimationClip/final spider anim.anim', 'Assets/scenes/main.unity'],
    tasks: ['Create a trigger volume that detects the player.', 'Drive one threat presentation transition from that trigger.', 'Classify the movement model you actually implement: animation-only, direct steering, waypoint, or NavMesh.', 'If a NavMesh source is available locally, import it as evidence before labeling the system pathfinding.'],
    doneWhen: 'The threat reacts predictably to player spatial state and the UI accurately names the navigation model that is actually evidenced.',
    caveat: 'PATHFINDING STATUS: NOT VERIFIED IN THE CURRENT CANONICAL SNAPSHOT. The course intentionally refuses to upgrade trigger evidence into a NavMesh claim.',
    metrics: { downstream: .52, bootstrap: .35, bridge: .62, depth: .58, salience: .86 }, tip: 'system'
  },
  {
    id: 'animation', order: 7, title: 'ANIMATION STATE', domains: ['animation', 'serialization'],
    thesis: 'Treat animation as an observable state machine that represents gameplay truth rather than as files that merely play.',
    why: 'Pauktunel contains paired open/close/idle clips for lids, doors, hatches and spider sequences plus AnimatorController assets.',
    breaks: 'If animation state is not tied to gameplay state, collision, interaction availability and visible pose can contradict one another.',
    prereqs: ['contact'], unlocks: ['atmosphere'], concepts: ['AnimationClip', 'AnimatorController', 'open/close state', 'door', 'hatch'],
    evidence: ['Assets/AnimationClip/', 'Assets/AnimatorController/', 'Assets/AnimationClip/button lid open.anim', 'Assets/AnimationClip/door_craneside open.anim', 'Assets/AnimationClip/hatch open anim.anim'],
    tasks: ['Pick one binary object such as a lid or door.', 'Define closed, opening/open and closing states explicitly.', 'Connect the interaction command to animation state.', 'Make collision/eligibility agree with the visible state.', 'Only then generalize the pattern to other animated machines.'],
    doneWhen: 'The chosen object cannot be visually open while logically closed, and repeated interaction does not desynchronize animation from gameplay.',
    metrics: { downstream: .62, bootstrap: .34, bridge: .69, depth: .55, salience: .82 }, tip: 'system'
  },
  {
    id: 'audio', order: 8, title: 'AUDIO / SIGNAL', domains: ['audio', 'serialization'],
    thesis: 'Build sound as evidence of place and state: ambience establishes location; one-shots confirm transitions; loops report machines.',
    why: 'The repository contains dedicated airlock ambience, room/outside ambience, beeps and machine-direction AudioSources.',
    breaks: 'When audio is added as a final wallpaper pass, it stops teaching the player where they are and whether the world accepted an action.',
    prereqs: ['player'], unlocks: ['atmosphere'], concepts: ['AudioSource', 'ambient loop', 'confirmation', 'footstep', 'machine loop'],
    evidence: ['Assets/AudioClip/airlock ambience.ogg', 'Assets/AudioClip/ambience hum.ogg', 'Assets/AudioClip/ambience outside edited.ogg', 'Assets/AudioClip/beep confirmation.ogg', 'Assets/Scripts/Assembly-CSharp/craneController.cs'],
    tasks: ['Create one continuous location ambience.', 'Add footsteps driven by actual player motion state.', 'Add one interaction confirmation one-shot.', 'Add one stateful machine loop that starts/stops with machine truth.', 'Balance so signals remain legible over ambience.'],
    doneWhen: 'With eyes closed, entering a space, walking, confirming an interaction and operating a machine produce distinguishable state information.',
    metrics: { downstream: .48, bootstrap: .22, bridge: .72, depth: .4, salience: .9 }, tip: 'atmosphere'
  },
  {
    id: 'interface', order: 9, title: 'INTERFACE / SETTINGS', domains: ['scene-flow', 'interaction', 'release'],
    thesis: 'Expose only the controls needed to enter, pause, configure and recover the runtime without allowing UI state to trap the player.',
    why: 'Production restoration explicitly hardened menu/options/finale behavior, so interface is part of game-state safety rather than a cosmetic overlay.',
    breaks: 'A settings screen that steals input, a manual that cannot close or a finale that leaves the cursor/state wrong can invalidate an otherwise complete build.',
    prereqs: ['boot', 'input'], unlocks: ['release'], concepts: ['menu', 'settings', 'pause', 'cursor state', 'defaultOptions'],
    evidence: ['Assets/Scripts/Assembly-CSharp/defaultOptions.cs', 'Assets/scenes/menu.unity', 'README.md'],
    tasks: ['Implement Start and Quit first.', 'Add pause with explicit time/input/cursor ownership.', 'Add settings only for values the runtime actually consumes.', 'Prove every overlay has a deterministic exit path.', 'Test UI transitions with mouse/keyboard and gamepad where supported.'],
    doneWhen: 'The player can always enter play, pause/unpause, leave every overlay and finish/exit without an input or cursor soft-lock.',
    metrics: { downstream: .58, bootstrap: .5, bridge: .8, depth: .48, salience: .87 }, tip: 'release'
  },
  {
    id: 'atmosphere', order: 10, title: 'ATMOSPHERE / RENDER', domains: ['rendering', 'audio', 'serialization'],
    thesis: 'Reconstruct the look as a reproducible stack, not as a mood remembered from screenshots.',
    why: 'Pauktunel’s production pass explicitly restores authored color grade, vignette, ambient occlusion, render-target behavior and quality policy; the repo also stores post profiles, materials, shaders, render textures and lighting scripts.',
    breaks: 'If atmosphere is one opaque “make it darker” step, every lighting change destabilizes readability and no one can explain which layer created the final image.',
    prereqs: ['contract', 'boot'], unlocks: ['release'], concepts: ['PostProcessProfile', 'ambient occlusion', 'color grade', 'RenderTexture', 'lighting', 'quality'],
    evidence: ['Assets/MonoBehaviour/post processing Profile.asset', 'Assets/MonoBehaviour/post processing Profile 1.asset', 'Assets/RenderTexture/', 'Assets/Material/', 'Assets/Shader/', 'Assets/Scripts/Assembly-CSharp/emergencyLight.cs', 'Assets/Editor/PauktunelProductionReady.cs', 'Assets/Editor/PauktunelMaxQuality.cs'],
    tasks: ['Establish readable neutral lighting first.', 'Rebuild materials and emissive signals.', 'Add authored post-processing one effect at a time.', 'Verify render target/resolution policy at native resolution.', 'Compare the final stack against the neutral baseline and document each layer’s purpose.'],
    doneWhen: 'You can disable any single render/post layer and predict the visual difference before pressing Play; restoring the documented pass returns the intended frame consistently.',
    metrics: { downstream: .44, bootstrap: .26, bridge: .64, depth: .42, salience: 1 }, tip: 'atmosphere'
  },
  {
    id: 'release', order: 11, title: 'RELEASE / PROOF', domains: ['release', 'project-anatomy', 'runtime-flow'],
    thesis: 'Finish by converting “it worked in the editor” into a repeatable production claim.',
    why: 'Pauktunel’s repository treats production pass, build tooling and a two-scene runtime smoke test as first-class artifacts.',
    breaks: 'Without executable proof, the project can regress silently in scene references, input modules, rendering resources or end-state behavior.',
    prereqs: ['interface', 'atmosphere'], unlocks: [], concepts: ['build', 'smoke test', 'production pass', 'validation', 'Windows player'],
    evidence: ['Assets/Editor/PauktunelProductionReady.cs', 'Assets/Editor/PauktunelDeployPolish.cs', 'Assets/Editor/CopilotProductionTools.cs', 'Assets/Scripts/Assembly-CSharp/CopilotSmokeRuntime.cs', 'README.md'],
    tasks: ['Run the production-ready pass from a known project state.', 'Build Windows x64 outside Assets.', 'Launch the player instead of relying on editor Play Mode.', 'Execute the menu → main runtime smoke route.', 'Record failures as a reproducible test before patching them.'],
    doneWhen: 'A clean build launches, traverses the two-scene smoke route with zero logged runtime errors, and the same validation procedure can be repeated after the next change.',
    metrics: { downstream: .3, bootstrap: .18, bridge: .92, depth: .72, salience: 1 }, tip: 'release'
  }
];

const FIRSTLIGHT_MODULES = [{
  id: 'micro', order: 0, title: 'MICRO COMPONENT LOOP', domains: ['runtime-flow', 'serialization'],
  thesis: 'Use one tiny component to learn how KL//ATLAS separates dependency, lifecycle and externally callable behavior.',
  why: 'The public fixture is intentionally small enough that every graph edge can be checked by eye.',
  breaks: 'If this micro model is unclear, a full Unity project will feel like hundreds of unrelated files rather than the same dependency pattern repeated at scale.',
  prereqs: [], unlocks: [], concepts: ['MonoBehaviour', 'SerializeField', 'Start', 'public method'], evidence: ['examples/sources/OnStart.cs', 'examples/lessons/on-start.kl'],
  tasks: ['Read the serialized fields as inputs.', 'Read Start as the automatic lifecycle entry.', 'Read the public method as an externally callable transition.', 'Use Source X-Ray to prove all three relationships.'],
  doneWhen: 'You can predict which object reference is required, what Start changes, and what later caller can reverse that state.',
  metrics: { downstream: .6, bootstrap: 1, bridge: .75, depth: 1, salience: .8 }, tip: 'foundation'
}];

const BORN_FORENSIC_MODULES = [{
  id: 'evidence-gap', order: 0, title: 'EVIDENCE GAP / IL2CPP', domains: ['runtime-flow', 'project-anatomy', 'release'],
  thesis: 'Learn to distinguish a project that compiles from a project whose original gameplay logic has actually been recovered.',
  why: 'BORN is useful precisely because compilation/startup evidence and gameplay-parity evidence do not currently mean the same thing.',
  breaks: 'If missing method bodies are treated as implementation, the reconstruction graph becomes confident fiction.',
  prereqs: [], unlocks: [], concepts: ['IL2CPP', 'method body', 'compile', 'runtime parity', 'provenance'], evidence: ['RECONSTRUCTION_LOG.md'],
  tasks: ['Locate the explicit reconstruction limitations.', 'Classify which claims are build evidence versus gameplay evidence.', 'Choose one missing behavior and state what additional evidence would be required before implementing it.'],
  doneWhen: 'You can explain why a clean compile/start does not prove production parity and identify the exact evidence gap without guessing the original method body.',
  caveat: 'FORENSIC STARTER: intentionally incomplete. It teaches uncertainty management, not how to copy a complete reference game.',
  metrics: { downstream: .55, bootstrap: .9, bridge: .9, depth: .95, salience: .7 }, tip: 'release'
}];

const STARTER_PROJECTS = {
  pauktunel: {
    id: 'pauktunel', label: 'PAUK-TUNEL / CONTROL ROOM ALPHA', short: 'PAUK-TUNEL', status: 'PRODUCTION-VALIDATED',
    repo: 'karlokalinic/control-room-alpha-production', ref: 'main', engine: 'Unity 6000.4.0f1', target: 'Windows x64', render: 'Built-in + Post-Processing Stack v2', input: 'New Input System',
    summary: 'Canonical reconstruction course: a small complete Unity game with menu/main scene flow, input abstraction, player controller, interactions, stateful machinery, animation, audio, atmosphere/render tooling and executable production validation.',
    sourcePolicy: 'The curriculum stores only source paths and derived instructional facts. Private source bodies/assets stay in the private repository or in files you explicitly open locally in the browser.',
    facts: ['2 build scenes: menu → main', 'Windows player build: PASS', 'two-scene runtime smoke test: PASS / 0 errors', 'production-ready editor pass exists', 'source, art, audio, animation and render assets are present'], modules: PAUKTUNEL_MODULES
  },
  firstlight: {
    id: 'firstlight', label: 'FIRST LIGHT / MICRO FIXTURE', short: 'FIRST LIGHT', status: 'SAFE MICRO SAMPLE', repo: 'KL//ATLAS built-in fixture', ref: 'local', engine: 'Unity concept sample', target: 'Browser lesson', render: 'N/A', input: 'N/A',
    summary: 'Tiny source fixture for learning the KL interface itself before inspecting a full game.', sourcePolicy: 'Bundled original fixture only.', facts: ['one C# component', 'one dependency/reveal loop', 'safe public source fixture'], modules: FIRSTLIGHT_MODULES
  },
  born: {
    id: 'born', label: 'BORN / FORENSIC RECONSTRUCTION', short: 'BORN', status: 'ADVANCED / PARITY UNVERIFIED', repo: 'karlokalinic/born', ref: 'main', engine: 'Unity reconstruction', target: 'Forensic course', render: 'Recovered project', input: 'Project-specific',
    summary: 'Advanced later-stage forensic course. The repository can compile/start, but full gameplay parity is not a valid beginner baseline because recovered IL2CPP method bodies remain incomplete.', sourcePolicy: 'Private source remains private. Use this starter only to learn evidence gaps and reconstruction uncertainty.', facts: ['compiles/starts', 'IL2CPP method-body gaps remain', 'production parity not established'], modules: BORN_FORENSIC_MODULES
  }
};