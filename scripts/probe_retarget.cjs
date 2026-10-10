/* Quaternion retarget vs the matrix one, in the real battle page. Loads the page twice, each in a
 * fresh browser context, with `?fastRetarget=0` (the matrix loop) and as shipped (quaternions),
 * and compares every model's retargeted clips: every rotation sample (sign-aligned), every hips
 * position sample, each clip's speed and stride, and each model's solved weapon grips. Reports the
 * worst difference of each and the retarget time each way (BattleAssetTimings). Fails above
 * RT_MAX_ROT (default 1e-5 per quaternion component; float32 rounding is ~6e-8 per step) or
 * RT_MAX_POS (default 1e-5 in model units).
 * Serve the repo first (AGENTS.md "Browser smoke"). Env: RT_URL (a battle page, default the local
 * server), RT_MAX_ROT, RT_MAX_POS.
 */
const path = require('node:path');
const { execSync } = require('node:child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}
const URL = process.env.RT_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const MAX_ROT = Number(process.env.RT_MAX_ROT || 1e-5);
const MAX_POS = Number(process.env.RT_MAX_POS || 1e-5);

// Private mastered audio is not checked into the public runtime repository.
 // Replace only these audio fetches in visual/retarget QA, never in shipping code.
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
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 800, height: 600 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  // Exactly the same private-audio isolation as the existing camera browser probe.
  const silence = silentWav();
  await page.route('**/*', route => {
    const request = route.request();
    if (request.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(request.url()))
      return route.fulfill({ json: {} });
    if (/\/Assets\/audio\/.*\.(?:mp3|wav|ogg)(?:[?#]|$)/i.test(request.url()))
      return route.fulfill({ status: 200, body: silence, contentType: 'audio/wav' });
    return route.continue();
  });

  await page.goto(URL + (URL.includes('?') ? '&' : '?') + 'seed=retarget' + (query ? '&' + query : ''), { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__battle__ && window.BattleFbxSoldier && BattleFbxSoldier.status(__battle__.scene).ready, null, { timeout: 300000, polling: 250 });
  const out = await page.evaluate(() => {
    const scene = __battle__.scene, keys = Object.keys(BattleFbxClips.clips), models = Object.keys(BattleFbxSoldier.status(scene).sockets);
    const b64 = a => { const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
    const res = {};
    for (const f of models) {
      const rot = [], pos = [], meta = {};
      for (const k of keys) {
        const c = BattleFbxSoldier.modelClip(scene, f, k); if (!c) continue;
        meta[k] = [c.speed, c.stride == null ? null : c.stride];
        c.channels.forEach(ch => { if (ch && ch.rot) rot.push(ch.rot); if (ch && ch.pos) pos.push(ch.pos); });
      }
      const cat = list => { const n = list.reduce((s, a) => s + a.length, 0), o = new Float32Array(n); let at = 0; list.forEach(a => { o.set(a, at); at += a.length; }); return o; };
      const grips = BattleFbxSoldier.grips(scene, f) || {};
      res[f] = { rot: b64(cat(rot)), pos: b64(cat(pos)), meta, grips: Object.fromEntries(Object.entries(grips).map(([w, m]) => [w, Array.from(m.m || m.asArray())])) };
    }
    const snap = BattleAssetTimings.snapshot();
    const phase = id => { const p = snap.page && snap.page.phases.find(x => x.id === id); return p ? p.ms : null; };
    return { models: res, retargetMs: snap.totals.retarget, soldiersPhaseMs: phase('soldiers'), libraryWallMs: snap.library.wallMs };
  });
  await context.close();
  return Object.assign(out, { errors });
}
const f32 = s => { const b = Buffer.from(s, 'base64'); return new Float32Array(b.buffer, b.byteOffset, b.length / 4); };

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--ignore-certificate-errors'] });
  let matrix, quat;
  try {
    matrix = await load(browser, 'fastRetarget=0');
    quat = await load(browser, '');
  } finally { await browser.close(); }

  const fails = [];
  let rotMax = 0, posMax = 0, speedMax = 0, strideMax = 0, gripMax = 0, samples = 0;
  if (!Object.keys(matrix.models).length) fails.push('No real FBX models were compared');
  for (const f of Object.keys(matrix.models)) {
    const a = matrix.models[f], b = quat.models[f];
    if (!b) { fails.push(`${f} missing from the shipped load`); continue; }
    const ra = f32(a.rot), rb = f32(b.rot), pa = f32(a.pos), pb = f32(b.pos);
    if (ra.length !== rb.length || pa.length !== pb.length) { fails.push(`${f}: channel layout differs`); continue; }
    for (let i = 0; i < ra.length; i += 4) {
      let dp = 0, dm = 0;
      for (let j = 0; j < 4; j++) { dp = Math.max(dp, Math.abs(ra[i + j] - rb[i + j])); dm = Math.max(dm, Math.abs(ra[i + j] + rb[i + j])); }
      rotMax = Math.max(rotMax, Math.min(dp, dm));
    }
    for (let i = 0; i < pa.length; i++) posMax = Math.max(posMax, Math.abs(pa[i] - pb[i]));
    samples += ra.length / 4;
    for (const k of Object.keys(a.meta)) {
      speedMax = Math.max(speedMax, Math.abs(a.meta[k][0] - b.meta[k][0]));
      if (a.meta[k][1] != null) strideMax = Math.max(strideMax, Math.abs(a.meta[k][1] - b.meta[k][1]));
    }
    for (const w of Object.keys(a.grips)) a.grips[w].forEach((v, i) => { gripMax = Math.max(gripMax, Math.abs(v - b.grips[w][i])); });
  }
  if (rotMax > MAX_ROT) fails.push(`rotation differs by ${rotMax.toExponential(2)} (limit ${MAX_ROT})`);
  if (posMax > MAX_POS) fails.push(`hips position differs by ${posMax.toExponential(2)} (limit ${MAX_POS})`);
  if (!samples) fails.push('No loaded FBX animation rotation samples were compared');
  if (speedMax > MAX_POS) fails.push(`clip speed differs by ${speedMax.toExponential(2)}`);
  if (strideMax > MAX_POS) fails.push(`clip stride differs by ${strideMax.toExponential(2)}`);
  if (gripMax > 1e-4) fails.push(`solved weapon grip matrices differ by ${gripMax.toExponential(2)}`);
  for (const [n, r] of [['fastRetarget=0', matrix], ['shipped', quat]]) if (r.errors.length) fails.push(`${n} page errors: ${r.errors.slice(0, 3).join(' | ')}`);
  console.log(`${Object.keys(matrix.models).length} models, ${samples} rotation samples; worst difference: rotation ${rotMax.toExponential(2)}, `
    + `position ${posMax.toExponential(2)}, speed ${speedMax.toExponential(2)} m/s, stride ${strideMax.toExponential(2)} m/s, grip matrix ${gripMax.toExponential(2)}`);
  console.table({
    'matrix (fastRetarget=0)': { retargetMs: matrix.retargetMs, soldiersPhaseMs: matrix.soldiersPhaseMs, libraryWallMs: matrix.libraryWallMs },
    'quaternion (shipped)': { retargetMs: quat.retargetMs, soldiersPhaseMs: quat.soldiersPhaseMs, libraryWallMs: quat.libraryWallMs },
  });
  if (fails.length) { console.error('FAIL\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('PASS');
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
