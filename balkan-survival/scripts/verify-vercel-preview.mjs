import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, attempts = 8) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: 'follow', cache: 'no-store' });
      if (response.ok) return response;
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(Math.min(1000 * attempt, 5000));
  }
  throw new Error(`Could not fetch ${url}: ${lastError?.message || 'unknown error'}`);
}

export async function verifyPreview({ url, version, digest }) {
  const base = url.replace(/\/+$/, '');
  const manifestResponse = await fetchWithRetry(`${base}/release-manifest.json`);
  const manifest = await manifestResponse.json();

  if (manifest.schema !== 'slegnuce.release/1') {
    throw new Error(`Unexpected release schema: ${manifest.schema}`);
  }
  if (manifest.version !== version) {
    throw new Error(`Version mismatch: expected ${version}, received ${manifest.version}`);
  }
  if (digest && manifest.artifactDigest !== digest) {
    throw new Error(`Artifact digest mismatch: expected ${digest}, received ${manifest.artifactDigest}`);
  }

  const indexResponse = await fetchWithRetry(`${base}${manifest.route}`);
  const html = await indexResponse.text();
  if (!html.includes('unity-canvas') || !html.includes('createUnityInstance')) {
    throw new Error('Preview index does not look like the Slegnuće Unity Web template.');
  }

  const loader = manifest.files.find(file => /\.loader\.js(?:\..*)?$/i.test(file.path));
  const wasm = manifest.files.find(file => /\.wasm(?:\..*)?$/i.test(file.path));
  if (!loader || !wasm) throw new Error('Release manifest does not contain loader and wasm artifacts.');

  const loaderResponse = await fetchWithRetry(`${base}${manifest.route}${loader.path}`);
  if (!(await loaderResponse.text()).length) throw new Error('Unity loader is empty.');

  const wasmResponse = await fetchWithRetry(`${base}${manifest.route}${wasm.path}`);
  const contentType = wasmResponse.headers.get('content-type') || '';
  if (!contentType.includes('application/wasm')) {
    throw new Error(`Wasm Content-Type must include application/wasm; received ${contentType || '(missing)'}.`);
  }
  const wasmBytes = new Uint8Array(await wasmResponse.arrayBuffer());
  if (wasmBytes.length < 4) throw new Error('Wasm artifact is empty.');

  return manifest;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const required of ['url', 'version']) {
    if (!args[required]) throw new Error(`Missing --${required}`);
  }
  const manifest = await verifyPreview({
    url: args.url,
    version: args.version,
    digest: args.digest,
  });
  console.log(`SLEGNUCE PREVIEW STATIC GATE PASS — ${manifest.version} ${manifest.artifactDigest}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(error => {
    console.error(`SLEGNUCE PREVIEW STATIC GATE FAILED: ${error.message}`);
    process.exit(1);
  });
}
