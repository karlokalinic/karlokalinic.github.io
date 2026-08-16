import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { verifyPreview } from './verify-vercel-preview.mjs';

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

const clone = value => JSON.parse(JSON.stringify(value));
const stable = value => JSON.stringify(value);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function compareStateAfterGiveTwo(before, after) {
  const expected = clone(before);
  expected.water -= 2;
  expected.biljeg += 1;
  expected.neighborHelped = true;
  expected.log = [
    ...(expected.log || []),
    {
      scenarioIndex: before.scenarioIndex,
      scenarioId: 'two_liters',
      choiceId: 'give_two_liters',
      result: after.log?.at(-1)?.result,
    },
  ];
  assert(stable(after) === stable(expected), 'Legal choice changed fields outside water, biljeg, neighborHelped and RunLog.');
}

async function shellSeq(page) {
  return page.evaluate(() => window.SLEGNUCE_SHELL?._eventSeq || 0);
}

async function clearEvents(page) {
  await page.evaluate(() => window.SLEGNUCE_SHELL.clearEvents());
}

async function command(page, type, payload = '') {
  const accepted = await page.evaluate(({ type, payload }) => window.SLEGNUCE_SHELL.command(type, payload), { type, payload });
  assert(accepted === true, `Shell rejected command ${type}.`);
}

async function waitEvent(page, type, afterSeq, timeout = 30000) {
  await page.waitForFunction(
    ({ eventType, seq }) => window.SLEGNUCE_SHELL?.eventHistory?.some(event => event.seq > seq && event.type === eventType),
    { eventType: type, seq: afterSeq },
    { timeout },
  );
  return page.evaluate(
    ({ eventType, seq }) => window.SLEGNUCE_SHELL.eventHistory.find(event => event.seq > seq && event.type === eventType),
    { eventType: type, seq: afterSeq },
  );
}

async function startRun(page, seed) {
  const seq = await shellSeq(page);
  await command(page, 'START_RUN', seed);
  const started = await waitEvent(page, 'RUN_STARTED', seq);
  const scene = await waitEvent(page, 'SCENE_CHANGED', seq);
  return { started, scene };
}

async function requestState(page) {
  const seq = await shellSeq(page);
  await command(page, 'REQUEST_STATE', '');
  return waitEvent(page, 'STATE_SNAPSHOT', seq);
}

async function findSeedWithMiraNotActive(page) {
  for (let i = 0; i < 96; i += 1) {
    const seed = `HEADLESS-MIRA-${i}`;
    const { started } = await startRun(page, seed);
    const mira = started.payload.characters?.find(character => character.id === 1);
    if (mira && mira.presence !== 2) return { seed, state: started.payload };
  }
  throw new Error('Could not find a deterministic seed with Mira not Active in 96 attempts.');
}

function writeCheck(report, number, title, evidence = {}) {
  report.checks.push({ number, title, status: 'pass', evidence });
}

export async function runRoundTrip({ url, version, digest, reportPath }) {
  const manifest = await verifyPreview({ url, version, digest });
  const report = {
    schema: 'slegnuce.roundtrip-report/1',
    status: 'running',
    previewUrl: url,
    version,
    artifactDigest: manifest.artifactDigest,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    checks: [],
    browserConsole: [],
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    page.on('console', message => {
      const entry = `[${message.type()}] ${message.text()}`;
      report.browserConsole.push(entry);
      if (report.browserConsole.length > 200) report.browserConsole.shift();
    });
    page.on('pageerror', error => report.browserConsole.push(`[pageerror] ${error.message}`));

    const base = url.replace(/\/+$/, '');
    const gameUrl = `${base}${manifest.route}?debug=1`;
    await page.goto(gameUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.SLEGNUCE_SHELL?.unityReady === true, null, { timeout: 180000 });
    await clearEvents(page);

    const explicit = await startRun(page, 'HEADLESS-CONTRACT-START');
    assert(explicit.started.type === 'RUN_STARTED', 'RUN_STARTED did not reach the browser.');
    writeCheck(report, 1, 'RUN_STARTED reaches browser', { seq: explicit.started.seq, seed: explicit.started.payload.seed });

    assert(explicit.scene.payload.scenarioId === 'two_liters', `Expected two_liters, received ${explicit.scene.payload.scenarioId}.`);
    writeCheck(report, 2, 'SCENE_CHANGED identifies two_liters', { seq: explicit.scene.seq, scenarioId: explicit.scene.payload.scenarioId });

    const miraCase = await findSeedWithMiraNotActive(page);
    const rejectSeq = await shellSeq(page);
    await command(page, 'COMMIT_CHOICE', '1');
    const rejected = await waitEvent(page, 'CHOICE_REJECTED', rejectSeq);
    assert(rejected.payload.choiceIndex === 1, 'Rejected choice index was not the Mira-specific choice.');
    assert(String(rejected.payload.reason).toLowerCase().includes('mira'), 'Character-gated rejection did not explain that Mira was unavailable.');
    writeCheck(report, 3, 'Character-gated choice explains absence', { seed: miraCase.seed, reason: rejected.payload.reason });

    const legal = await startRun(page, 'HEADLESS-GIVE-TWO');
    const before = clone(legal.started.payload);
    const choiceSeq = await shellSeq(page);
    await command(page, 'COMMIT_CHOICE', '0');
    const committed = await waitEvent(page, 'CHOICE_COMMITTED', choiceSeq);
    const after = clone(committed.payload.state);
    compareStateAfterGiveTwo(before, after);
    writeCheck(report, 4, 'Legal choice changes only expected fields', {
      beforeWater: before.water,
      afterWater: after.water,
      beforeBiljeg: before.biljeg,
      afterBiljeg: after.biljeg,
    });

    assert(typeof committed.payload.fingerprint === 'string' && committed.payload.fingerprint.length > 0, 'CHOICE_COMMITTED missing fingerprint.');
    assert(committed.payload.state?.schema === 'slegnuce.run/1', 'CHOICE_COMMITTED missing full state snapshot.');
    writeCheck(report, 5, 'CHOICE_COMMITTED carries fingerprint and state', { fingerprint: committed.payload.fingerprint });

    const advanceSeq = await shellSeq(page);
    await command(page, 'ADVANCE', '');
    const complete = await waitEvent(page, 'RUN_COMPLETE', advanceSeq);
    const completeMeta = await waitEvent(page, 'RUN_COMPLETE_META', advanceSeq);
    assert(complete.payload.scenarioIndex === 1, 'Completed run did not advance beyond the only scenario.');
    writeCheck(report, 6, 'Closing scenario emits RUN_COMPLETE', { seq: complete.seq, scenarioIndex: complete.payload.scenarioIndex });

    const savedText = await page.evaluate(() => localStorage.getItem('slegnuce:last-unity-run'));
    assert(typeof savedText === 'string' && savedText.length > 10, 'Browser storage does not contain slegnuce:last-unity-run.');
    const saved = JSON.parse(savedText);
    assert(saved.neighborHelped === true && saved.water === 5, 'Saved run does not contain committed consequence.');
    writeCheck(report, 7, 'Browser storage contains completed run', { bytes: savedText.length });

    await startRun(page, 'HEADLESS-DISTURB');
    const disturbSeq = await shellSeq(page);
    await command(page, 'COMMIT_CHOICE', '3');
    await waitEvent(page, 'CHOICE_COMMITTED', disturbSeq);

    const restoreSeq = await shellSeq(page);
    const restoreAccepted = await page.evaluate(() => window.SLEGNUCE_SHELL.restoreLastRun());
    assert(restoreAccepted === true, 'restoreLastRun() could not send RESTORE_RUN.');
    const restored = await waitEvent(page, 'RUN_RESTORED', restoreSeq);
    writeCheck(report, 8, 'restoreLastRun produces RUN_RESTORED', { seq: restored.seq });

    assert(stable(restored.payload.state) === stable(saved), 'Restored state does not exactly match saved run JSON.');
    writeCheck(report, 9, 'Restored run preserves schema, seed, resources, flags, roster and log', { seed: restored.payload.state.seed });

    assert(completeMeta.payload.fingerprint === restored.payload.fingerprint, 'Pre-save and post-restore fingerprints differ.');
    writeCheck(report, 10, 'Pre-save and post-restore fingerprints match', { fingerprint: restored.payload.fingerprint });

    const baselineSnapshot = await requestState(page);
    const baselineFingerprint = baselineSnapshot.payload.fingerprint;

    const malformedSeq = await shellSeq(page);
    await command(page, 'RESTORE_RUN', 'not-json');
    const malformed = await waitEvent(page, 'RUN_RESTORE_REJECTED', malformedSeq);
    assert(malformed.payload.code === 'invalid_json' || malformed.payload.code === 'invalid_state', `Unexpected malformed JSON rejection code: ${malformed.payload.code}`);

    const unsupported = clone(saved);
    unsupported.schema = 'slegnuce.run/999';
    const unsupportedSeq = await shellSeq(page);
    await command(page, 'RESTORE_RUN', JSON.stringify(unsupported));
    const schemaRejected = await waitEvent(page, 'RUN_RESTORE_REJECTED', unsupportedSeq);
    assert(schemaRejected.payload.code === 'unsupported_schema', `Unexpected schema rejection code: ${schemaRejected.payload.code}`);

    const afterReject = await requestState(page);
    assert(afterReject.payload.fingerprint === baselineFingerprint, 'Rejected restore mutated the current run.');
    writeCheck(report, 11, 'Malformed JSON and unsupported schema are rejected without mutation', {
      malformedCode: malformed.payload.code,
      schemaCode: schemaRejected.payload.code,
      fingerprint: baselineFingerprint,
    });

    const fresh = await startRun(page, 'HEADLESS-FRESH-AFTER-RESTORE');
    const freshState = fresh.started.payload;
    assert(freshState.water === 7, `Fresh run water should be 7, received ${freshState.water}.`);
    assert(freshState.biljeg === 0, `Fresh run biljeg should be 0, received ${freshState.biljeg}.`);
    assert(freshState.neighborHelped === false, 'Fresh run inherited neighborHelped.');
    assert(freshState.lied === false, 'Fresh run inherited lied flag.');
    assert(Array.isArray(freshState.log) && freshState.log.length === 0, 'Fresh run inherited old RunLog entries.');
    assert(freshState.scenarioIndex === 0, 'Fresh run did not reset scenarioIndex.');
    writeCheck(report, 12, 'Fresh run after restore has no old state residue', { seed: freshState.seed });

    assert(report.checks.length === 12, `Expected 12 checks, recorded ${report.checks.length}.`);
    report.status = 'pass';
    report.finishedAt = new Date().toISOString();
    if (reportPath) {
      await fs.mkdir(path.dirname(path.resolve(reportPath)), { recursive: true });
      await fs.writeFile(path.resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    }
    console.log(`SLEGNUCE HEADLESS ROUND-TRIP PASS — 12/12 · ${version} · ${manifest.artifactDigest}`);
    return report;
  } catch (error) {
    report.status = 'fail';
    report.finishedAt = new Date().toISOString();
    report.error = error.stack || error.message;
    if (reportPath) {
      await fs.mkdir(path.dirname(path.resolve(reportPath)), { recursive: true });
      await fs.writeFile(path.resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    }
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const required of ['url', 'version']) {
    if (!args[required]) throw new Error(`Missing --${required}`);
  }
  await runRoundTrip({
    url: args.url,
    version: args.version,
    digest: args.digest,
    reportPath: args.report,
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(error => {
    console.error(`SLEGNUCE HEADLESS ROUND-TRIP FAILED: ${error.message}`);
    process.exit(1);
  });
}
