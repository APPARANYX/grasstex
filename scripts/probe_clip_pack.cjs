/* Prepared clips vs FBX clips, in the real battle page. Loads the page twice, once with
 * `?clipPack=0` (every clip parsed from its FBX, as before the pack) and once as shipped (clips from
 * Assets/animations/prepared-clips.bin), and checks:
 *  - every converted clip and every model's retargeted clip is bit-identical between the two
 *    (BattleFbxSoldier.clipPack.digest: metadata plus every sample's bits);
 *  - the shipped load took all clips from the pack and fetched no clip FBX;
 * and reports the load cost each way: soldiers phase, FBX parse, clip files and bytes fetched.
 * Serve the repo first (AGENTS.md "Browser smoke"). Env: CLIPPACK_URL (a battle page, default the
 * local server; a preview.php?ref=<branch> URL works too), CLIPPACK_OUT (summary JSON path).
 */
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}
const URL = process.env.CLIPPACK_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const OUT = process.env.CLIPPACK_OUT || '';

// Private mastered audio is not checked into public runtime builds. Replace only these
// missing samples with silence for browser animation parity, never in production.
function silentWav() {
  const samples = 2205, b = Buffer.alloc(44 + samples * 2);
  b.write('RIFF', 0);
  b.writeUInt32LE(b.length - 8, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(22050, 24);
  b.writeUInt32LE(44100, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(samples * 2, 40);
  return b;
}

async function load(browser, query) {
  /* A fresh context per load: no HTTP cache or memory carried from the other one. */
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 800, height: 600 } });
  const page = await context.newPage();
  const errors = [], fetched = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  const silence = silentWav();
  await page.route('**/*', route => {
    const request = route.request();
    if (request.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(request.url()))
      return route.fulfill({ json: {} });
    if (/\/Assets\/audio\/.*\.(?:mp3|wav|ogg)(?:[?#]|$)/i.test(request.url()))
      return route.fulfill({ status: 200, body: silence, contentType: 'audio/wav' });
    return route.continue();
  });

  page.on('response', r => { const u = decodeURIComponent(r.url()); if (/\/Assets\/animations\//.test(u)) fetched.push(u.slice(u.lastIndexOf('/') + 1)); });
  const t0 = Date.now();
  await page.goto(URL + (URL.includes('?') ? '&' : '?') + 'seed=clip-pack' + (query ? '&' + query : ''), { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__battle__ && window.BattleFbxSoldier && BattleFbxSoldier.status(__battle__.scene).ready, null, { timeout: 300000, polling: 250 });
  const wallMs = Date.now() - t0;
  const out = await page.evaluate(() => {
    const scene = __battle__.scene, snap = BattleAssetTimings.snapshot();
    const phase = id => { const p = snap.page && snap.page.phases.find(x => x.id === id); return p ? p.ms : null; };
    return {
      digest: BattleFbxSoldier.clipPack.digest(scene), state: BattleFbxSoldier.clipPack.state(scene),
      soldiersPhaseMs: phase('soldiers'), libraryWallMs: snap.library.wallMs,
      parseMs: snap.totals.parse, convertMs: snap.totals.convert, byKind: snap.byKind,
    };
  });
  await context.close();
  return Object.assign(out, { wallMs, errors, fetched });
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--ignore-certificate-errors'] });
  let fbx, pack;
  try {
    fbx = await load(browser, 'clipPack=0');
    pack = await load(browser, '');
  } finally { await browser.close(); }

  const fails = [];
  const a = fbx.digest, b = pack.digest;
  if (!a || !b) fails.push('the FBX library never became ready');
  else {
    if (a.bones !== b.bones) fails.push('bone lists differ');
    const keys = Object.keys(a.clips);
    const clipDiff = keys.filter(k => a.clips[k] !== b.clips[k]);
    if (clipDiff.length || keys.length !== Object.keys(b.clips).length) fails.push(`converted clips differ: ${clipDiff.slice(0, 8).join(', ')} (${keys.length} vs ${Object.keys(b.clips).length})`);
    let modelClips = 0;
    for (const f of Object.keys(a.models)) {
      const diff = Object.keys(a.models[f]).filter(k => !b.models[f] || a.models[f][k] !== b.models[f][k]);
      modelClips += Object.keys(a.models[f]).length;
      if (diff.length) fails.push(`${f}: retargeted clips differ: ${diff.slice(0, 5).join(', ')}`);
    }
    console.log(`identical: ${keys.length} converted clips, ${modelClips} retargeted clips over ${Object.keys(a.models).length} models`);
  }
  if (!pack.state || !pack.state.loaded || pack.state.fromFbx) fails.push(`shipped load did not take every clip from the pack: ${JSON.stringify(pack.state)}`);
  const clipFbx = pack.fetched.filter(f => /\.fbx$/i.test(f));
  if (clipFbx.length) fails.push(`shipped load fetched ${clipFbx.length} clip FBX (${clipFbx.slice(0, 3).join(', ')})`);
  for (const [name, r] of [['clipPack=0', fbx], ['pack', pack]]) if (r.errors.length) fails.push(`${name} page errors: ${r.errors.slice(0, 3).join(' | ')}`);

  const row = r => ({
    soldiersPhaseMs: r.soldiersPhaseMs, libraryWallMs: r.libraryWallMs, parseMs: r.parseMs, convertMs: r.convertMs,
    clipFiles: r.byKind.clip ? r.byKind.clip.files : 0, clipMiB: +(((r.byKind.clip ? r.byKind.clip.bytes : 0) + (r.byKind.pack ? r.byKind.pack.bytes : 0)) / 1048576).toFixed(2),
    packFiles: r.byKind.pack ? r.byKind.pack.files : 0, state: r.state,
  });
  const summary = { url: URL, fbx: row(fbx), pack: row(pack), fails };
  console.table({ 'clipPack=0 (FBX)': summary.fbx, 'pack (shipped)': summary.pack });
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(summary, null, 2));
  if (fails.length) { console.error('FAIL\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('PASS');
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
