/* Off-screen soldier culling (53-fbx-soldier-backend.js, `BattleFbxSoldier.cull`): disabling the meshes
 * of soldiers outside the view must change nothing on screen. Fast-forwards a battle to combat, pauses
 * it, and for a set of cameras (the page's overview, and chase cameras at 12, 25 and 45 m from men in
 * the fight at eight bearings, some looking along the ground) renders the same frame four times:
 * cull on, cull on again (control), cull off, cull on. Every image must equal the first, byte for byte,
 * and the draw calls and culled soldiers are reported for on vs off. Runs once per viewport.
 *
 *   node scripts/probe_soldier_cull.cjs      # local server (see AGENTS.md)
 * Env: CULL_URL, CULL_SEED (bench1), CULL_WARMUP (150 sim s), CULL_VIEWPORTS (844x343,390x645). */
const path = require('node:path');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.CULL_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.CULL_SEED || 'bench1', WARMUP = Number(process.env.CULL_WARMUP || 150);
const VIEWPORTS = (process.env.CULL_VIEWPORTS || '844x343,390x645').split(',').map(v => v.split('x').map(Number));

async function arm(browser, [width, height]) {
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width, height } });
  const errors = [];
  page.on('pageerror', e => { if (!/\.pitch-(high|low)\.mp3/.test(String(e))) errors.push(String(e)); });
  await page.route('**/*', route => {
    const req = route.request();
    if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url())) return route.fulfill({ json: {} });
    return route.continue();
  });
  await page.goto(URL_ + (URL_.includes('?') ? '&' : '?') + 'seed=' + encodeURIComponent(SEED), { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__battle__ && window.BattleFbxSoldier && BattleFbxSoldier.cull &&
    [...__battle__._roster.us, ...__battle__._roster.ge].every(s => s._fbx), null, { timeout: 600000, polling: 500 });
  await page.addStyleTag({ content: 'body *{visibility:hidden!important} canvas{visibility:visible!important}' });
  const res = await page.evaluate(async (WARMUP) => {
    const b = window.__battle__, scene = b.scene, engine = scene.getEngine(), C = window.BattleCommanderAI, F = window.BattleFbxSoldier, sb = document.getElementById('startBtn');
    if (sb && !sb.hidden) sb.click();
    engine.stopRenderLoop(); b.paused = false;
    let acc = 0;
    for (let t = 0; t < WARMUP && !b.winner; t += .15) { b.step(.15); acc += .15; while (C && acc >= C.commandTick) { acc -= C.commandTick; C.update(b, scene.metadata.battleScenario, C.commandTick); } }
    b.paused = true;
    const all = [...b._roster.us, ...b._roster.ge], alive = all.filter(s => !s.dead);
    // Men in the fight: the living soldiers with the most living soldiers within 60 m, spread out.
    const busy = alive.map(s => ({ s, n: alive.filter(o => BABYLON.Vector3.DistanceSquared(o.root.position, s.root.position) < 3600).length }))
      .sort((a, c) => c.n - a.n).map(x => x.s);
    const picks = []; for (const s of busy) { if (picks.every(p => BABYLON.Vector3.Distance(p.root.position, s.root.position) > 20)) picks.push(s); if (picks.length === 3) break; }
    const dead = all.find(s => s.dead); if (dead) picks.push(dead);
    const pageCam = scene.activeCamera, cams = [{ name: 'overview', cam: pageCam }];
    picks.forEach((s, i) => [12, 25, 45].forEach((r, j) => [0, 1].forEach(k => {
      const a = (i * 3 + j) * Math.PI / 4 + k * Math.PI, beta = k ? 1.45 : 1.15, p = s.root.position;
      const c = new BABYLON.ArcRotateCamera('cullProbe' + cams.length, a, beta, r, new BABYLON.Vector3(p.x, p.y + 1, p.z), scene);
      c.minZ = .25; c.maxZ = pageCam.maxZ || 2600;
      cams.push({ name: (s.dead ? 'dead' : 'man') + s.id + '-' + r + 'm-' + (k ? 'low' : 'high'), cam: c });
    })));
    const si = new BABYLON.SceneInstrumentation(scene), w = engine.getRenderWidth(), h = engine.getRenderHeight();
    const shot = async (on) => {
      F.cull.on = on; scene.render(); scene.render();
      const draws = si.drawCallsCounter.current, culled = all.filter(s => F.lodState(s) && F.lodState(s).culled).length;
      const px = await engine.readPixels(0, 0, w, h);
      return { px: new Uint8Array(px.buffer || px), draws, culled };
    };
    const diff = (a, c) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== c[i] || a[i + 1] !== c[i + 1] || a[i + 2] !== c[i + 2]) n++; return n; };
    const out = [];
    for (const { name, cam } of cams) {
      scene.activeCamera = cam;
      const a = await shot(true), ctl = await shot(true), off = await shot(false), back = await shot(true);
      out.push({ name, control: diff(a.px, ctl.px), off: diff(a.px, off.px), back: diff(a.px, back.px),
        drawsOn: a.draws, drawsOff: off.draws, culledOn: a.culled, culledOff: off.culled });
    }
    scene.activeCamera = pageCam; F.cull.on = true; si.dispose();
    cams.forEach(c => { if (c.cam !== pageCam) c.cam.dispose(); });
    return { size: w + 'x' + h, simT: +b.time.toFixed(1), alive: alive.length, pixels: w * h, out };
  }, WARMUP);
  await page.close();
  return { res, errors };
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl',
    '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox'] });
  const bad = [];
  for (const vp of VIEWPORTS) {
    const { res, errors } = await arm(browser, vp);
    console.log(res.size + ' at sim ' + res.simT + ' s, ' + res.alive + ' alive');
    res.out.forEach(r => {
      console.log('  ' + r.name.padEnd(22) + ' draws ' + String(r.drawsOn).padStart(4) + ' vs ' + String(r.drawsOff).padStart(4) + ' off, culled ' + String(r.culledOn).padStart(3) +
        ', differing pixels: control ' + r.control + ', off ' + r.off + ', back on ' + r.back);
      if (r.control) bad.push(res.size + ' ' + r.name + ': control differs (' + r.control + ' px), the A/B means nothing');
      else if (r.off || r.back) bad.push(res.size + ' ' + r.name + ': culling changed ' + Math.max(r.off, r.back) + ' px');
      if (r.culledOff) bad.push(res.size + ' ' + r.name + ': soldiers culled with cull off');
    });
    const on = res.out.reduce((a, r) => a + r.drawsOn, 0), off = res.out.reduce((a, r) => a + r.drawsOff, 0);
    console.log('  mean draws ' + (on / res.out.length).toFixed(1) + ' culled vs ' + (off / res.out.length).toFixed(1) + ' not');
    if (errors.length) bad.push(res.size + ': page errors ' + errors.slice(0, 3).join(' | '));
  }
  await browser.close();
  console.log(bad.length ? 'FAIL ' + bad.join('; ') : 'OK: culling off-screen soldiers leaves every frame identical');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
