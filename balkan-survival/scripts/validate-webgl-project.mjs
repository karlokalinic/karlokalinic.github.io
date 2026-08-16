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
for (const token of ['BuildPipeline.BuildPlayer', 'BuildTarget.WebGL', 'BuildOptions.Development', 'PROJECT:Slegnuce', 'SlegnuceSelfTest.RunAll']) {
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

if (failed) process.exit(1);
console.log('SLEGNUCE WEBGL PROJECT CONTRACT OK — Unity 6.3 LTS scaffold, build entrypoint, bridge and self-test are present.');
