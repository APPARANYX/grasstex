/* Gait vs locomotion clip: which FBX clip family each moving soldier actually plays for the gait the
 * sim chose (11-soldier-individuality.js: walk / run / sprint / crouchWalk / crouchRun / crawl), and
 * at what playback rate. The backend (53-fbx-soldier-backend.js familyOf) picks the family whose
 * natural clip speed is closest to the measured ground speed, so a walk gait should play the walk
 * family near rate 1. Also prints each model's natural clip speeds, which that choice depends on.
 * Observe-only, same fixed 0.15 s fast-forward and write blocking as closeup_battle.cjs.
 *
 *   GAIT_URL='https://test.ivandpopov.com/grasstex/preview.php?ref=<branch>' node scripts/probe_gait_clips.cjs
 *
 * Env: GAIT_URL (default production), GAIT_SEED (default gait), GAIT_SECONDS (sim seconds, default 180),
 *      GAIT_OUT (summary JSON path, optional).
 */
const fs = require('node:fs');
const path = require('node:path');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.GAIT_URL || 'https://test.ivandpopov.com/grasstex/battle_sim.php';
const SEED = process.env.GAIT_SEED || 'gait';
const SECONDS = Number(process.env.GAIT_SECONDS || 180);

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl',
      '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox'] });
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 800, height: 600 } });
    await page.route('**/*', route => {
      const req = route.request();
      if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url())) return route.fulfill({ json: {} });
      return route.continue();
    });
    await page.goto(URL_ + (URL_.includes('?') ? '&' : '?') + 'seed=' + encodeURIComponent(SEED), { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__battle__, null, { timeout: 180000 });
    await page.waitForFunction(() => {
      const r = window.__battle__ && window.__battle__._roster;
      return r && [...r.us, ...r.ge].some(s => s._fbx) || (window.BattleFbxSoldier && window.BattleFbxSoldier.failed);
    }, null, { timeout: 90000 }).catch(() => {});
    await page.getByText('Start battle').first().click().catch(() => {});
    const result = await page.evaluate(seconds => {
      const b = window.__battle__, C = window.BattleCommanderAI, tick = (C && C.commandTick) || .45;
      const scenario = b.scene.metadata && b.scene.metadata.battleScenario;
      b.scene.getEngine().stopRenderLoop(); b.paused = false; b.timeScale = 1;
      const all = () => [...b._roster.us, ...b._roster.ge];
      // Natural clip speeds per model library (m/s after retargeting).
      const libs = {};
      for (const s of all()) {
        const lib = s._fbx && s._fbx.lib; if (!lib || !lib.clips) continue;
        const name = s._fbx.file || s._fbx.model || (s.faction + '/' + s.role);
        if (libs[name]) continue;
        const sp = {}; for (const k of ['walk0', 'run0', 'sprint0', 'crouch0', 'crouchRun0', 'pistolWalk0', 'pistolRun0', 'proneForward'])
          if (lib.clips[k]) sp[k] = +(lib.clips[k].speed || 0).toFixed(2);
        libs[name] = sp;
      }
      // The backend's own clip-speed diagnostic (speed used, root travel, foot stride) per model file.
      const F = window.BattleFbxSoldier, st = F && F.status ? F.status(b.scene) : null, diag = {};
      for (const file of Object.keys((st && st.sockets) || {})) {
        const sp = F.speeds(b.scene, file), row = {};
        for (const k of ['walk0', 'run0', 'sprint0', 'crouch0', 'crouchRun0']) if (sp[k]) row[k] = sp[k];
        diag[file] = row;
      }
      // gait -> family -> {n, rate sum, speed sum}
      const table = {}; let acc = 0, fbx = 0, proc = 0;
      for (let t = 0; t < seconds && !b.winner; t += .15) {
        b.step(.15); acc += .15;
        while (C && acc + 1e-9 >= tick && !b.winner) { acc -= tick; C.update(b, scenario, tick); }
        for (const s of all()) {
          if (s.dead || !s.moving) continue;
          const fx = s._fbx; if (!fx) { proc++; continue; } fbx++;
          const gait = (s._locomotionGait || '?') + (s.woundSpeed > 0 && s.woundSpeed < 1 ? '+wounded' : '');
          const top = fx.lower && fx.lower.entries && fx.lower.entries[fx.lower.entries.length - 1];
          const fam = fx.moving ? (fx.family || (top && top.clip && top.clip.key) || 'none') : 'not-moving(anim)';
          const row = (table[gait] = table[gait] || {}), c = (row[fam] = row[fam] || { n: 0, rate: 0, speed: 0 });
          c.n++; c.rate += top ? (+top.rate || 0) : 0; c.speed += fx.speed || 0;
        }
      }
      for (const g in table) for (const f in table[g]) {
        const c = table[g][f]; c.rate = +(c.rate / c.n).toFixed(2); c.speed = +(c.speed / c.n).toFixed(2);
      }
      return { time: +b.time.toFixed(1), libs, diag, table, samples: { fbx, procedural: proc } };
    }, SECONDS);
    console.log('URL ' + page.url() + '  sim ' + result.time + ' s  samples ' + JSON.stringify(result.samples));
    console.log('Natural clip speeds (m/s):');
    for (const [m, sp] of Object.entries(result.libs)) console.log('  ' + m + '  ' + JSON.stringify(sp));
    console.log('Backend clip-speed diagnostic (speed used / root travel / foot stride):');
    for (const [m, sp] of Object.entries(result.diag)) console.log('  ' + m + '  ' + Object.entries(sp)
      .map(([k, c]) => `${k} ${c.speed}/${c.travel}/${c.stride}`).join('  '));
    console.log('Gait -> clip family played (share of moving samples, mean playback rate, mean ground speed):');
    for (const [g, fams] of Object.entries(result.table)) {
      const tot = Object.values(fams).reduce((a, c) => a + c.n, 0);
      console.log('  ' + g.padEnd(18) + Object.entries(fams).sort((a, b) => b[1].n - a[1].n)
        .map(([f, c]) => `${f} ${(100 * c.n / tot).toFixed(0)}% x${c.rate} @${c.speed}m/s`).join(' | ') + `  (n=${tot})`);
    }
    if (process.env.GAIT_OUT) fs.writeFileSync(process.env.GAIT_OUT, JSON.stringify(result, null, 2));
  } finally { await Promise.race([browser.close(), new Promise(r => setTimeout(r, 5000))]); }
})().catch(e => { console.error('GAIT PROBE FAIL', e && e.message || e); process.exit(1); });
