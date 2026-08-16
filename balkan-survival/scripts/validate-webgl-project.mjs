import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const repositoryRoot = path.resolve(root, '..');
const project = path.join(root, 'webgl');
let failed = false;

const fail = message => {
  console.error(`SLEGNUCE WEBGL CONTRACT FAILED: ${message}`);
  failed = true;
};

const requireFile = relative => {
  const full = path.join(project, relative);
  if (!fs.existsSync(full)) fail(`missing webgl/${relative}`);
  return full;
};

const read = relative => fs.readFileSync(requireFile(relative), 'utf8');

const projectVersion = read('ProjectSettings/ProjectVersion.txt');
if (!projectVersion.includes('6000.3.16f1')) fail('ProjectVersion.txt must stay pinned to 6000.3.16f1 until an editor upgrade is explicitly committed');

let manifest = {};
try {
  manifest = JSON.parse(read('Packages/manifest.json'));
} catch (error) {
  fail(`Packages/manifest.json is invalid JSON: ${error.message}`);
}
if (!manifest.dependencies || typeof manifest.dependencies !== 'object') fail('Packages/manifest.json must contain dependencies');

for (const dependency of [
  'com.unity.modules.imgui',
  'com.unity.modules.inputlegacy',
  'com.unity.modules.jsonserialize',
  'com.unity.modules.physics',
]) {
  if (!manifest.dependencies?.[dependency]) fail(`manifest missing ${dependency}`);
}

const build = read('Assets/Editor/SlegnuceBuild.cs');
for (const token of [
  'BuildPipeline.BuildPlayer',
  'BuildTarget.WebGL',
  'BuildOptions.Development',
  'PROJECT:Slegnuce',
  'SlegnuceSelfTest.RunAll',
  'PreExportCloud',
  'WebGLCompressionFormat.Disabled',
  '0.2.0-rc.',
  'SHELTER_2_5D_PRESENTATION',
  'SlegnuceCameraRig',
  'ClickToMoveController',
  'give_two_liters',
]) {
  if (!build.includes(token)) fail(`SlegnuceBuild.cs missing contract token: ${token}`);
}

const presentationContracts = [
  ['Assets/Scripts/Presentation/SlegnuceCameraRig.cs', ['orthographic = false', 'fieldOfView']],
  ['Assets/Scripts/Presentation/ShelterVisualRules.cs', ['reserveWaterVisible = state.water >= 7', 'state.neighborHelped']],
  ['Assets/Scripts/Presentation/ShelterPresentationController.cs', ['StateChanged', 'ShelterVisualRules.Evaluate']],
  ['Assets/Scripts/Presentation/CharacterPresentation.cs', ['CharacterVisualState', 'Relieved']],
  ['Assets/Scripts/Interaction/ClickToMoveController.cs', ['Physics.Raycast', 'Input.GetMouseButtonDown']],
  ['Assets/Scripts/Interaction/ScenarioInteractionBinding.cs', ['engine.CanChoose', 'engine.CommitChoice']],
];
for (const [relative, tokens] of presentationContracts) {
  const source = read(relative);
  for (const token of tokens) {
    if (!source.includes(token)) fail(`${relative} missing presentation contract token: ${token}`);
  }
}

const selfTest = read('Assets/Editor/SlegnuceSelfTest.cs');
for (const token of ['round-trip fingerprint', 'schema rejection', 'character gating', 'new run reset', 'PASS — 5/5']) {
  if (!selfTest.includes(token)) fail(`SlegnuceSelfTest.cs missing required proof: ${token}`);
}

const template = read('Assets/WebGLTemplates/Slegnuce/index.html');
for (const token of [
  'createUnityInstance',
  'SendMessage',
  'SLEGNUCE_SHELL',
  'RESTORE_RUN',
  '_eventSeq',
  'eventHistory',
  'clearEvents',
  'slegnuce:unity-event',
]) {
  if (!template.includes(token)) fail(`custom Web template missing: ${token}`);
}

const bridge = read('Assets/Plugins/WebGL/SlegnuceBridge.jslib');
for (const token of ['SlegnuceWeb_Emit', 'SlegnuceWeb_SaveRun', 'localStorage']) {
  if (!bridge.includes(token)) fail(`SlegnuceBridge.jslib missing: ${token}`);
}

const powerShell = read('build-web.ps1');
for (const token of ['-buildTarget WebGL', 'Slegnuce.Editor.SlegnuceBuild.BuildDevelopmentWeb', '6000.3.16f1']) {
  if (!powerShell.includes(token)) fail(`build-web.ps1 missing: ${token}`);
}

const ubaPostBuild = read('cloud/uba-post-build.sh');
for (const token of [
  'OUTPUT_DIRECTORY',
  'SLEGNUCE_VERCEL_PROJECT_PURPOSE',
  'package-vercel-release.mjs',
  'verify-vercel-preview.mjs',
  'dispatch-roundtrip.mjs',
  'vercel@latest deploy',
  '--prebuilt',
  'Production was NOT changed',
]) {
  if (!ubaPostBuild.includes(token)) fail(`uba-post-build.sh missing cloud release contract token: ${token}`);
}

const promote = read('cloud/promote-vercel.sh');
for (const token of [
  'SLEGNUCE_RELEASE_APPROVED',
  'SLEGNUCE_EXPECTED_DIGEST',
  'verify-vercel-preview.mjs',
  'vercel@latest promote',
]) {
  if (!promote.includes(token)) fail(`promote-vercel.sh missing production promotion token: ${token}`);
}

const cloudStatePath = path.join(root, 'data', 'cloud-release.json');
if (!fs.existsSync(cloudStatePath)) fail('missing data/cloud-release.json');
else {
  try {
    const cloudState = JSON.parse(fs.readFileSync(cloudStatePath, 'utf8'));
    if (cloudState.schema !== 'slegnuce.cloud-release/1') fail('data/cloud-release.json schema mismatch');
    if (cloudState.hosting?.productionMode !== 'promote-existing-preview-without-rebuild') {
      fail('cloud release policy must promote an existing Preview without rebuild');
    }
    if (cloudState.gates?.browserRoundTrip !== 'automated-github-playwright-12-of-12-after-preview-dispatch') {
      fail('cloud release policy must route Preview through the automated 12/12 Playwright gate');
    }
  } catch (error) {
    fail(`data/cloud-release.json is invalid JSON: ${error.message}`);
  }
}

for (const relative of [
  'docs/CLOUD_RELEASE.md',
  'docs/ROUNDTRIP_TEST.md',
  'scripts/package-vercel-release.mjs',
  'scripts/verify-vercel-preview.mjs',
  'scripts/test-release-packager.mjs',
  'scripts/headless-roundtrip.mjs',
  'scripts/dispatch-roundtrip.mjs',
]) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) fail(`missing balkan-survival/${relative}`);
}

const roundTripWorkflowPath = path.join(repositoryRoot, '.github', 'workflows', 'slegnuce-roundtrip.yml');
if (!fs.existsSync(roundTripWorkflowPath)) fail('missing .github/workflows/slegnuce-roundtrip.yml');
else {
  const workflow = fs.readFileSync(roundTripWorkflowPath, 'utf8');
  for (const token of [
    'repository_dispatch',
    'workflow_dispatch',
    'slegnuce-preview-ready',
    'playwright@1.62.0',
    'headless-roundtrip.mjs',
    'actions/upload-artifact@v4',
    'slegnuce-production',
    'promote-vercel.sh',
  ]) {
    if (!workflow.includes(token)) fail(`slegnuce-roundtrip.yml missing: ${token}`);
  }
}

if (failed) process.exit(1);
console.log('SLEGNUCE WEBGL PROJECT CONTRACT OK — deterministic simulation/browser evidence remains intact and the generated 2.5D presentation layer is source-wired.');
