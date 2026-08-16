import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
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

for (const dependency of ['com.unity.modules.imgui', 'com.unity.modules.jsonserialize']) {
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
]) {
  if (!build.includes(token)) fail(`SlegnuceBuild.cs missing contract token: ${token}`);
}

const selfTest = read('Assets/Editor/SlegnuceSelfTest.cs');
for (const token of ['round-trip fingerprint', 'schema rejection', 'character gating', 'new run reset', 'PASS — 5/5']) {
  if (!selfTest.includes(token)) fail(`SlegnuceSelfTest.cs missing required proof: ${token}`);
}

const template = read('Assets/WebGLTemplates/Slegnuce/index.html');
for (const token of ['createUnityInstance', 'SendMessage', 'SLEGNUCE_SHELL', 'RESTORE_RUN']) {
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
  } catch (error) {
    fail(`data/cloud-release.json is invalid JSON: ${error.message}`);
  }
}

for (const relative of [
  'docs/CLOUD_RELEASE.md',
  'scripts/package-vercel-release.mjs',
  'scripts/verify-vercel-preview.mjs',
  'scripts/test-release-packager.mjs',
]) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) fail(`missing balkan-survival/${relative}`);
}

if (failed) process.exit(1);
console.log('SLEGNUCE WEBGL PROJECT CONTRACT OK — Unity 6.3 LTS buildability, UBA hooks, immutable Vercel Preview packaging and promote-without-rebuild policy are present.');
