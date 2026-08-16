import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { packageRelease } from './package-vercel-release.mjs';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'slegnuce-release-test-'));
const unity = path.join(root, 'unity-output');
const build = path.join(unity, 'Build');
await fs.mkdir(build, { recursive: true });

await fs.writeFile(
  path.join(unity, 'index.html'),
  '<canvas id="unity-canvas"></canvas><script>createUnityInstance(document.querySelector("#unity-canvas"), {});</script>',
);
await fs.writeFile(path.join(build, 'slice.loader.js'), 'console.log("loader");');
await fs.writeFile(path.join(build, 'slice.framework.js'), 'console.log("framework");');
await fs.writeFile(path.join(build, 'slice.data'), 'DATA');
await fs.writeFile(path.join(build, 'slice.wasm'), Buffer.from([0x00, 0x61, 0x73, 0x6d]));

const first = path.join(root, 'bundle-a');
const second = path.join(root, 'bundle-b');
const options = {
  input: unity,
  version: '0.2.0-rc.17',
  channel: 'preview',
  commit: 'abc123',
  buildNumber: '17',
  unityVersion: '6000.3.16f1',
};

const resultA = await packageRelease({ ...options, output: first, createdAt: '2026-08-16T00:00:00.000Z' });
const resultB = await packageRelease({ ...options, output: second, createdAt: '2026-08-16T01:00:00.000Z' });

assert.equal(resultA.manifest.artifactDigest, resultB.manifest.artifactDigest, 'Unity artifact digest must not depend on packaging timestamp.');
assert.equal(resultA.manifest.files.length, 5);
assert.equal(resultA.manifest.version, '0.2.0-rc.17');
assert.equal(resultA.manifest.schema, 'slegnuce.release/1');

const config = JSON.parse(await fs.readFile(path.join(first, '.vercel', 'output', 'config.json'), 'utf8'));
assert.equal(config.version, 3);
assert.ok(config.routes.some(route => String(route.src).includes('wasm')), 'Vercel output must include explicit wasm route headers.');

const immutableIndex = path.join(first, '.vercel', 'output', 'static', 'releases', '0.2.0-rc.17', 'index.html');
const rootManifest = path.join(first, '.vercel', 'output', 'static', 'release-manifest.json');
assert.ok((await fs.stat(immutableIndex)).isFile());
assert.ok((await fs.stat(rootManifest)).isFile());

await assert.rejects(
  () => packageRelease({ ...options, output: path.join(root, 'bad'), version: '../production' }),
  /Invalid release version/,
);

await fs.rm(root, { recursive: true, force: true });
console.log('SLEGNUCE RELEASE PACKAGER TEST PASS — immutable path, stable artifact digest, Vercel Build Output API contract.');
