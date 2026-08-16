import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SCHEMA = 'slegnuce.release/1';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    args[key] = value;
    i += 1;
  }
  return args;
}

function assertVersion(version) {
  if (!/^\d+\.\d+\.\d+(?:-(?:dev(?:\.\d+)?|rc\.\d+))?$/.test(version)) {
    throw new Error(`Invalid release version: ${version}`);
  }
}

async function walk(root) {
  const result = [];
  async function visit(current) {
    const entries = await fsp.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile()) result.push(full);
    }
  }
  await visit(root);
  return result.sort((a, b) => a.localeCompare(b));
}

async function sha256(file) {
  const hash = crypto.createHash('sha256');
  const input = fs.createReadStream(file);
  for await (const chunk of input) hash.update(chunk);
  return hash.digest('hex');
}

async function findPlayerRoot(input) {
  const direct = path.join(input, 'index.html');
  if (fs.existsSync(direct)) return input;

  const files = await walk(input);
  const candidates = files.filter(file => path.basename(file).toLowerCase() === 'index.html');
  if (candidates.length !== 1) {
    throw new Error(`Expected exactly one Unity index.html under ${input}; found ${candidates.length}.`);
  }
  return path.dirname(candidates[0]);
}

async function validateUnityOutput(playerRoot) {
  const index = path.join(playerRoot, 'index.html');
  const buildDir = path.join(playerRoot, 'Build');
  if (!fs.existsSync(index)) throw new Error(`Unity output missing ${index}`);
  if (!fs.existsSync(buildDir)) throw new Error(`Unity output missing Build directory: ${buildDir}`);

  const buildFiles = (await walk(buildDir)).map(file => path.basename(file));
  const requirements = [
    ['loader', name => /\.loader\.js(?:\..+)?$/i.test(name)],
    ['framework', name => /\.framework\.js(?:\..+)?$/i.test(name)],
    ['data', name => /\.data(?:\..+)?$/i.test(name)],
    ['wasm', name => /\.wasm(?:\..+)?$/i.test(name)],
  ];
  for (const [label, predicate] of requirements) {
    if (!buildFiles.some(predicate)) throw new Error(`Unity output missing ${label} artifact in Build/.`);
  }
}

async function computeArtifactManifest(playerRoot) {
  const files = await walk(playerRoot);
  const entries = [];
  for (const file of files) {
    const relative = path.relative(playerRoot, file).split(path.sep).join('/');
    const stat = await fsp.stat(file);
    entries.push({
      path: relative,
      bytes: stat.size,
      sha256: await sha256(file),
    });
  }

  const digest = crypto.createHash('sha256');
  for (const entry of entries) {
    digest.update(entry.path);
    digest.update('\0');
    digest.update(entry.sha256);
    digest.update('\0');
    digest.update(String(entry.bytes));
    digest.update('\0');
  }

  return { files: entries, artifactDigest: digest.digest('hex') };
}

async function copyTree(source, destination) {
  await fsp.rm(destination, { recursive: true, force: true });
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  await fsp.cp(source, destination, { recursive: true, force: true });
}

function makeRedirectHtml(version) {
  const target = `/releases/${version}/`;
  return `<!doctype html>
<html lang="hr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0;url=${target}">
<title>Slegnuće ${version}</title>
</head>
<body>
<p>Otvaram Slegnuće ${version}. <a href="${target}">Nastavi</a>.</p>
<script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>
`;
}

function makeVercelConfig() {
  return {
    version: 3,
    routes: [
      {
        src: '/releases/(.*\\.wasm(?:\\..*)?)',
        headers: {
          'Content-Type': 'application/wasm',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
        continue: true,
      },
      {
        src: '/releases/(.*\\.(?:data|js)(?:\\..*)?)',
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
        continue: true,
      },
      {
        src: '/release-manifest.json',
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
        continue: true,
      },
      { handle: 'filesystem' },
    ],
  };
}

export async function packageRelease(options) {
  const input = path.resolve(options.input);
  const output = path.resolve(options.output);
  const version = options.version;
  const channel = options.channel || 'preview';
  const gitCommit = options.commit || 'unknown';
  const unityBuildNumber = options.buildNumber || 'unknown';
  const unityVersion = options.unityVersion || 'unknown';
  const createdAt = options.createdAt || new Date().toISOString();

  assertVersion(version);
  if (!['preview', 'production-candidate'].includes(channel)) {
    throw new Error(`Unsupported channel: ${channel}`);
  }

  const playerRoot = await findPlayerRoot(input);
  await validateUnityOutput(playerRoot);

  const { files, artifactDigest } = await computeArtifactManifest(playerRoot);
  await fsp.rm(output, { recursive: true, force: true });
  const staticRoot = path.join(output, '.vercel', 'output', 'static');
  const releaseRoot = path.join(staticRoot, 'releases', version);
  await copyTree(playerRoot, releaseRoot);

  const manifest = {
    schema: SCHEMA,
    version,
    channel,
    gitCommit,
    unityBuildNumber,
    unityVersion,
    createdAt,
    artifactDigest,
    route: `/releases/${version}/`,
    files,
  };

  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
  await fsp.writeFile(path.join(releaseRoot, 'release-manifest.json'), manifestJson, 'utf8');
  await fsp.writeFile(path.join(staticRoot, 'release-manifest.json'), manifestJson, 'utf8');
  await fsp.writeFile(path.join(staticRoot, 'index.html'), makeRedirectHtml(version), 'utf8');

  const outputRoot = path.join(output, '.vercel', 'output');
  await fsp.writeFile(
    path.join(outputRoot, 'config.json'),
    `${JSON.stringify(makeVercelConfig(), null, 2)}\n`,
    'utf8',
  );

  return { manifest, playerRoot, outputRoot };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const required of ['input', 'output', 'version']) {
    if (!args[required]) throw new Error(`Missing --${required}`);
  }

  const { manifest } = await packageRelease({
    input: args.input,
    output: args.output,
    version: args.version,
    channel: args.channel,
    commit: args.commit,
    buildNumber: args['build-number'],
    unityVersion: args['unity-version'],
    createdAt: args['created-at'],
  });

  process.stdout.write(`${JSON.stringify({
    schema: manifest.schema,
    version: manifest.version,
    artifactDigest: manifest.artifactDigest,
    route: manifest.route,
  })}\n`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(error => {
    console.error(`SLEGNUCE RELEASE PACKAGER FAILED: ${error.message}`);
    process.exit(1);
  });
}
