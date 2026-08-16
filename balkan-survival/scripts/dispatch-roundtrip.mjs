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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const required of ['url', 'version', 'digest']) {
    if (!args[required]) throw new Error(`Missing --${required}`);
  }

  const token = process.env.GITHUB_RELEASE_TOKEN;
  if (!token) {
    console.log('SLEGNUCE ROUND-TRIP DISPATCH SKIPPED — GITHUB_RELEASE_TOKEN is not configured. Preview remains available for manual workflow dispatch.');
    return;
  }

  const repository = process.env.SLEGNUCE_GITHUB_REPOSITORY || 'karlokalinic/karlokalinic.github.io';
  const response = await fetch(`https://api.github.com/repos/${repository}/dispatches`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      event_type: 'slegnuce-preview-ready',
      client_payload: {
        preview_url: args.url,
        version: args.version,
        digest: args.digest,
        git_commit: args.commit || process.env.GIT_COMMIT || 'unknown',
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub repository dispatch failed: ${response.status} ${response.statusText} ${body.slice(0, 500)}`);
  }

  console.log(`SLEGNUCE ROUND-TRIP DISPATCH PASS — ${repository} · ${args.version}`);
}

main().catch(error => {
  console.error(`SLEGNUCE ROUND-TRIP DISPATCH FAILED: ${error.message}`);
  process.exit(1);
});
