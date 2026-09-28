/* Soldier mesh LOD (53-fbx-soldier-backend.js, BattleFbxSoldier.meshLod): each model's full and far
 * (simplified) triangle and vertex counts, and one soldier shot at full detail and with the far list
 * from several distances, sim paused, the same camera for both. Output per distance: a side-by-side
 * PNG (full | far, cropped around the soldier) and the share of pixels in that crop that differ, so
 * the switch distance (`meshLod.far`) is tuned from pictures, not guessed.
 *
 *   node scripts/probe_soldier_mesh_lod.cjs      # local server (see AGENTS.md); SMLOD_URL for another page
 * Env: SMLOD_URL, SMLOD_SEED, SMLOD_DIST (metres, default 15,30,45,60,90,150), SMLOD_VIEW (WxH, default
 * 390x645, the iPhone canvas), SMLOD_FOV (radians, default the page camera's), SMLOD_OUT (default
 * closeups/soldier-mesh-lod). Fails if no model gets a far list, or on a page error. */
const path = require('node:path'), fs = require('node:fs');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.SMLOD_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.SMLOD_SEED || 'soldier-lod';
const DISTS = (process.env.SMLOD_DIST || '15,30,45,60,90,150').split(',').map(Number);
const [VW, VH] = (process.env.SMLOD_VIEW || '390x645').split('x').map(Number);
const OUT = process.env.SMLOD_OUT || 'closeups/soldier-mesh-lod';

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl',
    '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox'] });
  try {
    fs.mkdirSync(OUT, { recursive: true });
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: VW, height: VH } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.route('**/*', route => {
      const req = route.request();
      if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url())) return route.fulfill({ json: {} });
      return route.continue();
    });
    await page.goto(URL_ + (URL_.includes('?') ? '&' : '?') + 'seed=' + encodeURIComponent(SEED), { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(() => window.__battle__ && window.BattleFbxSoldier && BattleFbxSoldier.meshLod &&
      [...__battle__._roster.us, ...__battle__._roster.ge].every(s => s._fbx) &&
      (Object.keys(BattleFbxSoldier.meshLod.models).length || BattleFbxSoldier.meshLod.failed || !BattleFbxSoldier.meshLod.on), null, { timeout: 600000, polling: 500 });
    await page.addStyleTag({ content: 'body *{visibility:hidden!important} canvas{visibility:visible!important}' });
    const info = await page.evaluate((fov) => {
      const b = window.__battle__, scene = b.scene, F = window.BattleFbxSoldier, L = F.meshLod;
      /* Play ~20 s of battle first so the soldiers are posed (moving, aiming), not in the bind pose. */
      b.paused = false; for (let i = 0; i < 135; i++) b.step(.15); b.paused = true; scene.render();
      const s = b._roster.us.find(x => !x.dead && x._fbx);
      const cam0 = scene.activeCamera;
      const cam = new BABYLON.FreeCamera('smlodCam', new BABYLON.Vector3(0, 0, 0), scene);
      cam.fov = fov || cam0.fov || 0.8; cam.minZ = 0.1; cam.maxZ = 5000; scene.activeCamera = cam;
      window.__smlod = { s, cam };
      return { soldier: s.id, role: s.role, fov: cam.fov, models: L.models, failed: L.failed, far: L.far, state: F.meshLodState(s) };
    }, process.env.SMLOD_FOV ? +process.env.SMLOD_FOV : null);
    console.log(JSON.stringify({ models: info.models, failed: info.failed, soldier: info.soldier, role: info.role, fov: info.fov }, null, 2));
    const shots = [];
    for (const d of DISTS) {
      const pair = {};
      for (const mode of ['full', 'far']) {
        const box = await page.evaluate(([d, mode]) => {
          const { s, cam } = window.__smlod, F = window.BattleFbxSoldier, scene = s.root.getScene(), p = s.root.position;
          F.meshLod.far = mode === 'far' ? 0 : 1e9; F.meshLod.band = 0;
          const yaw = s.root.rotation ? s.root.rotation.y : 0;   // look at his front-quarter
          cam.position.set(p.x + Math.sin(yaw + .6) * d, p.y + 1.6 + d * .08, p.z + Math.cos(yaw + .6) * d);
          cam.setTarget(new BABYLON.Vector3(p.x, p.y + .9, p.z));
          scene.render(); scene.render();
          const eng = scene.getEngine(), w = eng.getRenderWidth(), h = eng.getRenderHeight();
          const pr = (y) => BABYLON.Vector3.Project(new BABYLON.Vector3(p.x, p.y + y, p.z), BABYLON.Matrix.Identity(), scene.getTransformMatrix(), cam.viewport.toGlobal(w, h));
          const top = pr(1.9), bot = pr(-0.05), hpx = Math.max(8, bot.y - top.y), cx = (top.x + bot.x) / 2;
          return { x: Math.max(0, cx - hpx * .6), y: Math.max(0, top.y - hpx * .1), w: hpx * 1.2, h: hpx * 1.2, heightPx: hpx, state: F.meshLodState(s) };
        }, [d, mode]);
        const clip = { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.max(8, Math.min(VW - Math.floor(box.x), Math.ceil(box.w))), height: Math.max(8, Math.min(VH - Math.floor(box.y), Math.ceil(box.h))) };
        pair[mode] = { png: await page.screenshot({ clip }), box, far: box.state.far };
      }
      const cmp = await page.evaluate(async ([a, b, scale]) => {
        const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = 'data:image/png;base64,' + src; });
        const [ia, ib] = await Promise.all([load(a), load(b)]), w = ia.width, h = ia.height, px = img => {
          const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
        const da = px(ia), db = px(ib); let n = 0;
        for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 36) n++;
        /* Side by side, scaled up so a 10-pixel soldier can be looked at. */
        const k = Math.max(1, Math.round(scale / h)), c = document.createElement('canvas'); c.width = (w * 2 + 4) * k; c.height = h * k;
        const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(ia, 0, 0, w * k, h * k); g.drawImage(ib, (w + 4) * k, 0, w * k, h * k);
        return { diff: n / (w * h), side: c.toDataURL('image/png').split(',')[1] };
      }, [pair.full.png.toString('base64'), pair.far.png.toString('base64'), 360]);
      fs.writeFileSync(path.join(OUT, `d${d}m.png`), Buffer.from(cmp.side, 'base64'));
      const row = { distance: d, soldierPx: +pair.full.box.heightPx.toFixed(1), diffShare: +cmp.diff.toFixed(4), switchedFar: pair.far.far && !pair.full.far };
      shots.push(row); console.log(JSON.stringify(row));
    }
    const summary = { url: URL_, seed: SEED, view: [VW, VH], soldier: info.soldier, fov: info.fov, models: info.models, failed: info.failed, shots, errors };
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
    const bad = [];
    if (!info.models || !Object.keys(info.models).length) bad.push('no model got a far list' + (info.failed ? ': ' + info.failed : ''));
    if (shots.some(r => !r.switchedFar)) bad.push('the soldier did not switch to the far list');
    errors.forEach(e => bad.push('pageerror ' + e));
    console.log(bad.length ? 'FAIL ' + bad.join('; ') : 'OK: side-by-side shots (full | far) in ' + OUT);
    if (bad.length) process.exitCode = 1;
  } finally { await Promise.race([browser.close(), new Promise(r => setTimeout(r, 5000))]); }
})().catch(e => { console.error('SOLDIER MESH LOD PROBE FAIL', e && e.stack || e); process.exit(1); });
