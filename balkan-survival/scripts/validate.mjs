import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const readJson = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const fail = msg => { console.error(`BALKAN SURVIVAL VALIDATION FAILED: ${msg}`); process.exitCode = 1; };

const production = readJson('data/production.json');
const registry = readJson('data/builds.json');
const builds = registry.builds ?? [];
const versions = builds.map(b => b.version);

if (!production.version) fail('production.version missing');
if (!versions.includes(production.version)) fail(`MAIN ${production.version} is not registered`);
if (new Set(versions).size !== versions.length) fail('duplicate build versions');

for (const build of builds) {
  const cleanRoute = build.route.replace(/^\.\//, '');
  const buildIndex = path.join(root, cleanRoute, 'index.html');
  if (!cleanRoute.startsWith('builds/')) fail(`${build.version}: route must live under builds/`);
  if (!fs.existsSync(buildIndex)) fail(`${build.version}: missing ${buildIndex}`);

  const cleanDevlog = build.devlog.replace(/^\.\//, '');
  if (!cleanDevlog.startsWith('devlog/')) fail(`${build.version}: devlog must live under devlog/`);
  if (!fs.existsSync(path.join(root, cleanDevlog))) fail(`${build.version}: missing devlog ${cleanDevlog}`);
}

if (!process.exitCode) console.log(`BALKAN SURVIVAL OK — MAIN ${production.version}, ${builds.length} archived build(s).`);
