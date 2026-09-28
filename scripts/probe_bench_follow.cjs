/* Device benchmark follow camera (97-device-benchmark.js, `benchCam=follow`): runs the benchmark with
 * the chase camera and samples it every ~2 s while it measures: the active camera, its distance to its
 * target, and how many living soldiers are within 45 m of the eye (the soldier mesh LOD's full-detail
 * range). Screenshots a few of those moments. Fails if the follow camera is not the active one while
 * measuring, the eye drifts off its distance, no soldier is ever within 45 m, the page's own camera is
 * not restored afterwards, or the page throws.
 *
 *   node scripts/probe_bench_follow.cjs      # local server (see AGENTS.md)
 * Env: BF_URL, BF_SEED (bench1), BF_SECONDS (20), BF_WARMUP (150), BF_DIST (benchFollow, default 25),
 *      BF_OUT (default closeups/bench-follow). */
const path = require('node:path'), fs = require('node:fs');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.BF_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.BF_SEED || 'bench1', SECONDS = Number(process.env.BF_SECONDS || 20), WARMUP = Number(process.env.BF_WARMUP || 150);
const DIST = process.env.BF_DIST || '', OUT = process.env.BF_OUT || 'closeups/bench-follow';

(async () => {
  const { chromium } = loadPlaywright();
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl',
    '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox'] });
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 645 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', route => {
    const req = route.request();
    if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url())) return route.fulfill({ json: {} });
    return route.continue();
  });
  const q = 'seed=' + encodeURIComponent(SEED) + '&bench=1&benchAuto=1&benchCam=follow&benchSeconds=' + SECONDS + '&benchWarmup=' + WARMUP + (DIST ? '&benchFollow=' + DIST : '');
  await page.goto(URL_ + (URL_.includes('?') ? '&' : '?') + q, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__battle__ && window.__battle__.scene.activeCamera && window.__battle__.scene.activeCamera.name === 'benchFollowCam', null, { timeout: 900000, polling: 250 });
  const samples = [];
  let shots = 0;
  while (true) {
    const s = await page.evaluate(() => {
      if (window.__deviceBench) return null;
      const b = window.__battle__, cam = b.scene.activeCamera, eye = cam.globalPosition || cam.position, t = cam.target || cam.getTarget();
      const all = [...b._roster.us, ...b._roster.ge].filter(x => !x.dead);
      const near = all.filter(x => { const p = x.root.position; return Math.hypot(p.x - eye.x, p.y - eye.y, p.z - eye.z) < 45; }).length;
      return { simT: +b.time.toFixed(1), camera: cam.name, dist: +Math.hypot(eye.x - t.x, eye.y - t.y, eye.z - t.z).toFixed(2), near };
    });
    if (!s) break;
    samples.push(s);
    if (shots < 3 && samples.length % 3 === 1) await page.screenshot({ path: path.join(OUT, 'follow-' + (shots++) + '.png') });
    await page.waitForTimeout(2000);
  }
  const res = await page.evaluate(() => ({ camera: __deviceBench.camera, follow: __deviceBench.follow, build: __deviceBench.build,
    fps: __deviceBench.fps, restored: __battle__.scene.activeCamera.name,
    hook: (__deviceBench.breakdown.hooks.find(h => h.name === 'bench follow camera') || {}).msPerFrame }));
  await browser.close();
  const want = Number(DIST || 25), bad = [];
  samples.forEach(s => console.log(JSON.stringify(s)));
  console.log(JSON.stringify(res));
  if (!samples.length) bad.push('no samples while measuring');
  if (samples.some(s => s.camera !== 'benchFollowCam')) bad.push('another camera was active while measuring');
  if (samples.some(s => Math.abs(s.dist - want) > 0.5)) bad.push('eye off its ' + want + ' m distance');
  if (!samples.some(s => s.near > 0)) bad.push('no soldier ever within 45 m');
  if (res.camera !== 'follow' || !res.follow) bad.push('result does not record the follow camera');
  if (res.restored === 'benchFollowCam') bad.push('page camera not restored');
  if (errors.length) bad.push('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'FAIL ' + bad.join('; ') : 'OK: follow camera held ' + want + ' m, soldiers within 45 m in ' + samples.filter(s => s.near > 0).length + '/' + samples.length + ' samples; screenshots in ' + OUT);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
