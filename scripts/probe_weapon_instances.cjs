/* Weapon instancing (53-fbx-soldier-backend.js weaponMesh): every soldier's weapon is a GPU instance of
 * one hidden source mesh per weapon model. Loads one seed twice, instances on (default) and off
 * (`?weaponInstances=0`), plays ~30 s of battle, and compares draw calls and active meshes for one
 * frame from a camera over the armies. Two page loads play slightly different battles, so the exact
 * checks run inside the instanced page, on one paused frame: each soldier gets a temporary clone of
 * his weapon's source on the same socket, and
 *   - every instance's world matrix must equal its clone's
 *   - a close-up of one armed soldier drawn with the instance and then with the clone must match
 *     (fails above WI_MAXDIFF of pixels)
 *
 *   node scripts/probe_weapon_instances.cjs      # local server (see AGENTS.md); WI_URL for another page
 * Env: WI_URL, WI_SEED, WI_OUT (default closeups/weapon-instances), WI_MAXDIFF (default 0.002). */
const path = require('node:path'), fs = require('node:fs');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.WI_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.WI_SEED || 'weapon-instances';
const OUT = process.env.WI_OUT || 'closeups/weapon-instances';
const MAXDIFF = Number(process.env.WI_MAXDIFF || 0.002);

async function arm(browser, on) {
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 640, height: 480 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', route => {
    const req = route.request();
    if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url())) return route.fulfill({ json: {} });
    return route.continue();
  });
  const q = 'seed=' + encodeURIComponent(SEED) + (on ? '' : '&weaponInstances=0');
  await page.goto(URL_ + (URL_.includes('?') ? '&' : '?') + q, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__battle__ && [...__battle__._roster.us, ...__battle__._roster.ge].every(s => s._fbx), null, { timeout: 600000, polling: 500 });
  await page.addStyleTag({ content: 'body *{visibility:hidden!important} canvas{visibility:visible!important}' });
  const res = await page.evaluate(() => {
    const b = window.__battle__, scene = b.scene, eng = scene.getEngine(), C = window.BattleCommanderAI, sb = document.getElementById('startBtn');
    if (sb && !sb.hidden) sb.click();
    eng.stopRenderLoop(); b.paused = false;
    let acc = 0; for (let i = 0; i < 200; i++) { b.step(.15); acc += .15; while (C && acc >= C.commandTick) { acc -= C.commandTick; C.update(b, scene.metadata.battleScenario, C.commandTick); } }
    b.paused = true;
    const all = [...b._roster.us, ...b._roster.ge];
    /* One frame over the armies: draw calls and what drew. */
    const cam = new BABYLON.ArcRotateCamera('wiCam', -Math.PI / 2, 1.0, 420, new BABYLON.Vector3(0, 0, 0), scene); cam.minZ = .5; cam.maxZ = 5000; scene.activeCamera = cam;
    const si = new BABYLON.SceneInstrumentation(scene); scene.render(); scene.render();
    const act = scene.getActiveMeshes(); let weaponsActive = 0; for (let i = 0; i < act.length; i++) if (/^weapon/.test(act.data[i].name)) weaponsActive++;
    const draws = si.drawCallsCounter.current; si.dispose();
    /* Exact check on this frame: a clone of each weapon's source on the same socket sits where the instance does. */
    let moved = 0, compared = 0;
    all.forEach(s => { const m = s.weapon && s.weapon.mesh; if (!m || !m.sourceMesh) return;
      const c = m.sourceMesh.clone('wiCmp', m.parent); c.isVisible = true; c.position.copyFrom(m.position); c.computeWorldMatrix(true); m.computeWorldMatrix(true);
      const a = m.getWorldMatrix().m, d = c.getWorldMatrix().m; if (a.some((v, k) => Math.abs(v - d[k]) > 1e-5)) moved++; compared++; c.dispose(); });
    const weapons = { moved, compared };
    /* Close-up of a living armed soldier. */
    const s = all.find(x => !x.dead && x.weapon && x.weapon.mesh && x.weapon.mesh.isEnabled()), p = s.root.position, yaw = s.root.rotation ? s.root.rotation.y : 0;
    const cc = new BABYLON.FreeCamera('wiClose', new BABYLON.Vector3(p.x + Math.sin(yaw + .9) * 2.4, p.y + 1.5, p.z + Math.cos(yaw + .9) * 2.4), scene);
    cc.setTarget(new BABYLON.Vector3(p.x, p.y + 1.1, p.z)); cc.minZ = .05; scene.activeCamera = cc; scene.render(); scene.render();
    window.__wi = { s };
    return { draws, active: act.length, weaponsActive, weapons, soldier: s.id, weaponClass: s.weapon.mesh.getClassName(),
      sources: scene.meshes.filter(m => /^weapon-source\./.test(m.name)).length };
  });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const shot = await page.screenshot();
  let cloneShot = null, pair = null;
  if (on) {
    /* Both pictures in one synchronous step, so nothing (UI timers, the sim) runs between them. */
    pair = await page.evaluate(() => { const w = window.__wi.s.weapon.mesh, scene = w.getScene(), canvas = scene.getEngine().getRenderingCanvas();
      /* The page's own timers can unpause the battle; its sim runs inside scene.render when unpaused. */
      const sim = window.__battle__; sim.paused = true; scene.getEngine().stopRenderLoop(); scene.activeCamera = scene.getCameraByName('wiClose');
      scene.render(); const a = canvas.toDataURL('image/png').split(',')[1];
      const c = w.sourceMesh.clone('wiSwap', w.parent); c.isVisible = true; c.position.copyFrom(w.position); w.setEnabled(false);
      scene.render(); const b = canvas.toDataURL('image/png').split(',')[1]; c.dispose(); w.setEnabled(true); return [a, b]; });
    cloneShot = Buffer.from(pair[1], 'base64');
  }
  await page.close();
  return { res, shot: pair ? Buffer.from(pair[0], 'base64') : shot, cloneShot, errors };
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl',
    '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox'] });
  try {
    fs.mkdirSync(OUT, { recursive: true });
    const off = await arm(browser, false), on = await arm(browser, true);
    fs.writeFileSync(path.join(OUT, 'instance.png'), on.shot); fs.writeFileSync(path.join(OUT, 'clone.png'), on.cloneShot);
    const cmp = await browser.newPage();
    const diff = await cmp.evaluate(async ([a, b]) => {
      const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = 'data:image/png;base64,' + src; });
      const [ia, ib] = await Promise.all([load(a), load(b)]), w = ia.width, h = ia.height, px = img => {
        const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
      const da = px(ia), db = px(ib); let n = 0;
      for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 24) n++;
      return n / (w * h);
    }, [on.cloneShot.toString('base64'), on.shot.toString('base64')]);
    await cmp.close();
    const moved = on.res.weapons.moved;
    const summary = { seed: SEED,
      clones: { draws: off.res.draws, active: off.res.active, weaponsActive: off.res.weaponsActive, class: off.res.weaponClass },
      instances: { draws: on.res.draws, active: on.res.active, weaponsActive: on.res.weaponsActive, class: on.res.weaponClass, sources: on.res.sources },
      weaponsCompared: on.res.weapons.compared, weaponsMoved: moved, closeupSoldier: on.res.soldier, pixelDiff: diff, errors: [...off.errors, ...on.errors] };
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
    const bad = [];
    if (on.res.weaponClass !== 'InstancedMesh') bad.push('weapons are not instances (' + on.res.weaponClass + ')');
    if (moved) bad.push(moved + ' weapons are not where the clones were');
    if (!on.res.weapons.compared) bad.push('no instanced weapon to compare');
    if (diff > MAXDIFF) bad.push('close-up pixel difference ' + (diff * 100).toFixed(3) + '%');
    summary.errors.forEach(e => bad.push('pageerror ' + e));
    console.log(bad.length ? 'FAIL ' + bad.join('; ') : 'OK: weapons draw as instances (' + on.res.draws + ' draw calls vs ' + off.res.draws + '), in the same place, looking the same');
    if (bad.length) process.exitCode = 1;
  } finally { await Promise.race([browser.close(), new Promise(r => setTimeout(r, 5000))]); }
})().catch(e => { console.error('WEAPON INSTANCES PROBE FAIL', e && e.stack || e); process.exit(1); });
