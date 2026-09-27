/* Animation LOD vs shadows: a soldier just outside the view whose shadow falls into it must keep
 * being posed (a held pose would freeze his shadow), and must still be held when he casts no
 * shadow or his shadow falls away from the view. The battle has no shadows today, so the probe adds
 * a directional light + ShadowGenerator itself and aims a narrow top-down camera at the ground
 * where one soldier's shadow falls, with the soldier himself outside the frustum.
 *
 * Cases (the soldier is stepped between them so his pose is never static):
 *   no-caster        light and generator exist, soldier not a caster        -> held 'offscreen'
 *   caster-toward    soldier is a caster, shadow falls into the view        -> posed (shadow kept)
 *   caster-away      same caster, light flipped so the shadow falls away     -> held 'offscreen'
 *   predicate        no listed casters, but the generator selects casters by a predicate the LOD
 *                    cannot see into, shadow toward the view                  -> posed
 *
 *   node scripts/probe_lod_shadows.cjs          # local server (see AGENTS.md); LODSHADOW_URL for another page
 * Exits non-zero if any case disagrees or the page never binds FBX soldiers. */
const path = require('node:path');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.LODSHADOW_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl',
    '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox'] });
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.route('**/*', route => {
      const req = route.request();
      if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url())) return route.fulfill({ json: {} });
      return route.continue();
    });
    await page.goto(URL_ + (URL_.includes('?') ? '&' : '?') + 'seed=lod-shadows', { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(() => window.__battle__ && window.BattleFbxSoldier && BattleFbxSoldier.lodState &&
      [...__battle__._roster.us].some(s => s._fbx), null, { timeout: 300000, polling: 250 });
    const results = await page.evaluate(() => {
      const b = window.__battle__, scene = b.scene, engine = scene.getEngine(), F = window.BattleFbxSoldier;
      engine.stopRenderLoop();
      const s = b._roster.us.find(x => x._fbx && !x.dead);
      const meshes = s.root.getChildMeshes(false).filter(m => m.getTotalVertices && m.getTotalVertices() > 0);
      const sun = new BABYLON.DirectionalLight('lodProbeSun', new BABYLON.Vector3(1, -.3, 0), scene);
      const gen = new BABYLON.ShadowGenerator(512, sun);
      const cam = new BABYLON.FreeCamera('lodProbeCam', new BABYLON.Vector3(0, 50, 0), scene);
      cam.fov = .1; cam.minZ = .1; scene.activeCamera = cam;
      const H = 2, out = [];
      const run = (name, dirX, setup, expect) => {
        setup();
        b.paused = false; b.step(.05); b.paused = true;             // move the clip clock: not static
        sun.direction.set(dirX, -.3, 0);
        const d = sun.direction.clone().normalize(), p = s.root.position, k = H / -d.y;
        // Camera straight down over where the head's shadow falls for a light toward +x.
        const tip = new BABYLON.Vector3(p.x + Math.abs(d.x) * k, p.y, p.z);
        cam.position.set(tip.x, p.y + 20, tip.z + .001); cam.setTarget(tip);
        scene.render();
        const st = F.lodState(s), ok = expect === 'posed' ? st.hold === null : st.hold === expect;
        out.push({ name, expect, hold: st.hold, shadowKept: st.shadowKept, ok });
      };
      run('no-caster', 1, () => {}, 'offscreen');
      run('caster-toward', 1, () => meshes.forEach(m => gen.addShadowCaster(m, false)), 'posed');
      run('caster-away', -1, () => {}, 'offscreen');
      run('predicate', 1, () => { meshes.forEach(m => gen.removeShadowCaster(m, false)); gen.getShadowMap().renderListPredicate = () => true; }, 'posed');
      gen.dispose(); sun.dispose();
      return { soldier: s.id, casters: meshes.length, lod: F.lod.on, out };
    });
    console.log(JSON.stringify(results, null, 2));
    const bad = results.out.filter(r => !r.ok);
    if (!results.lod) bad.push({ name: 'LOD is off on this page' });
    if (errors.length) bad.push(...errors.map(e => ({ name: 'pageerror ' + e })));
    console.log(bad.length ? 'FAIL ' + bad.map(r => r.name).join(', ') : 'OK: shadow-casting soldiers stay posed while their shadow is in view');
    if (bad.length) process.exitCode = 1;
  } finally { await Promise.race([browser.close(), new Promise(r => setTimeout(r, 5000))]); }
})().catch(e => { console.error('LOD SHADOW PROBE FAIL', e && e.stack || e); process.exit(1); });
