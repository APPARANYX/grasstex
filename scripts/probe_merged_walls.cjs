/* Merged building walls (town-objectives.js mergeBuildings): the town's wall and floor pieces are
 * baked into one static mesh per material. This loads the page twice on one seed, with the merge
 * (default) and with `?mergeWalls=0`, and checks that the merge changes draw calls and nothing else:
 *   - building meshes and their draw calls (all, and active from a camera over the town)
 *   - total building vertices and the world bounding box of all building geometry match
 *   - a screenshot of the town from the same camera, sim paused, differs by at most MW_MAXDIFF of pixels
 *
 *   node scripts/probe_merged_walls.cjs     # local server (see AGENTS.md); MW_URL for another page
 * Env: MW_URL, MW_SEED, MW_OUT (screenshots + summary.json), MW_MAXDIFF (default 0.002).
 * Exits non-zero on a geometry mismatch, too large a pixel difference, or a page error. */
const path = require('node:path'), fs = require('node:fs');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.MW_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.MW_SEED || 'merged-walls';
const OUT = process.env.MW_OUT || 'closeups/merged-walls';
const MAXDIFF = Number(process.env.MW_MAXDIFF || 0.002);

async function arm(browser, merge) {
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 960, height: 600 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', route => {
    const req = route.request();
    if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url())) return route.fulfill({ json: {} });
    return route.continue();
  });
  const q = 'seed=' + encodeURIComponent(SEED) + (merge ? '' : '&mergeWalls=0');
  await page.goto(URL_ + (URL_.includes('?') ? '&' : '?') + q, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__battle__ && window.__battle__.scene && window.__battle__.scene.metadata &&
    window.__battle__.scene.metadata.battleScenario, null, { timeout: 300000, polling: 250 });
  const res = await page.evaluate(() => {
    const b = window.__battle__, scene = b.scene, town = scene.metadata.battleScenario;
    b.paused = true;
    const isBuilding = m => /^(wall|floor)-/.test(m.name);
    const meshes = scene.meshes.filter(m => isBuilding(m) && !m.isDisposed());
    let verts = 0; const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    meshes.forEach(m => {
      verts += m.getTotalVertices();
      m.computeWorldMatrix(true); m.refreshBoundingInfo && m.refreshBoundingInfo();
      const bb = m.getBoundingInfo().boundingBox;
      ['x', 'y', 'z'].forEach((k, i) => { lo[i] = Math.min(lo[i], bb.minimumWorld[k]); hi[i] = Math.max(hi[i], bb.maximumWorld[k]); });
    });
    /* Hide soldiers, effects and debug so the picture is the town alone; fixed camera over its centre. */
    scene.meshes.forEach(m => { if (m.skeleton || /^weapon\.|decal|wound|muzzle|tracer|objective-/.test(m.name)) m.setEnabled(false); });
    const c = town.center, r = town.radius || 80;
    const cam = new BABYLON.ArcRotateCamera('mwProbeCam', -Math.PI / 3, 0.9, r * 1.6, new BABYLON.Vector3(c.x, 0, c.z), scene);
    cam.minZ = .5; cam.maxZ = 4000; scene.activeCamera = cam;
    scene.render();
    const act = scene.getActiveMeshes(); let active = 0, draws = 0;
    for (let i = 0; i < act.length; i++) { const m = act.data[i]; if (isBuilding(m)) { active++; draws += m.subMeshes ? m.subMeshes.length : 1; } }
    return { buildings: town.buildings.length, meshes: meshes.length, verts, lo, hi, active, activeDraws: draws,
      names: [...new Set(meshes.map(m => m.name.replace(/[0-9]+/g, '#')))].slice(0, 8) };
  });
  /* Only the 3D canvas: hide the HUD and the load overlay (it fades out on its own clock). */
  await page.addStyleTag({ content: 'body *{visibility:hidden!important;transition:none!important;animation:none!important} canvas{visibility:visible!important}' });
  await page.evaluate(() => new Promise(r => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(r)), 500)));
  const shot = await page.screenshot();
  await page.close();
  return { res, shot, errors };
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl',
    '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox'] });
  try {
    fs.mkdirSync(OUT, { recursive: true });
    const off = await arm(browser, false), on = await arm(browser, true);
    fs.writeFileSync(path.join(OUT, 'separate.png'), off.shot); fs.writeFileSync(path.join(OUT, 'merged.png'), on.shot);
    /* Pixel difference, decoded in a blank page (no PNG library needed). */
    const cmp = await browser.newPage();
    const diff = await cmp.evaluate(async ([a, b]) => {
      const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = 'data:image/png;base64,' + src; });
      const [ia, ib] = await Promise.all([load(a), load(b)]), w = ia.width, h = ia.height, px = img => {
        const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
      const da = px(ia), db = px(ib); let n = 0;
      for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 24) n++;
      return n / (w * h);
    }, [off.shot.toString('base64'), on.shot.toString('base64')]);
    await cmp.close();
    const bad = [];
    if (on.res.verts !== off.res.verts) bad.push('vertex total ' + on.res.verts + ' vs ' + off.res.verts);
    for (let i = 0; i < 3; i++) if (Math.abs(on.res.lo[i] - off.res.lo[i]) > 1e-3 || Math.abs(on.res.hi[i] - off.res.hi[i]) > 1e-3) bad.push('bounds axis ' + i);
    if (on.res.meshes > 3) bad.push('merged page still has ' + on.res.meshes + ' building meshes');
    if (diff > MAXDIFF) bad.push('pixel difference ' + (diff * 100).toFixed(3) + '%');
    [...off.errors, ...on.errors].forEach(e => bad.push('pageerror ' + e));
    const summary = { seed: SEED, separate: off.res, merged: on.res, pixelDiff: diff };
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
    console.log(bad.length ? 'FAIL ' + bad.join('; ') : 'OK: merged walls draw the same town in ' + on.res.activeDraws + ' draw calls instead of ' + off.res.activeDraws);
    if (bad.length) process.exitCode = 1;
  } finally { await Promise.race([browser.close(), new Promise(r => setTimeout(r, 5000))]); }
})().catch(e => { console.error('MERGED WALLS PROBE FAIL', e && e.stack || e); process.exit(1); });
