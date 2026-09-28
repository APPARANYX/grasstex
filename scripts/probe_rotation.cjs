/* Rotating the phone after load (battle_sim.html canvas resize): iOS fires `resize` and
 * `orientationchange` before it reports the rotated size, so a page that resizes only on that event
 * keeps the old canvas width (844×797 in portrait was seen on an iPhone). Chromium reports the new size
 * first, so this imitates iOS: it fires both events while the viewport still has its old size, then
 * rotates the viewport with the real `resize` event swallowed. The canvas's drawing buffer must match
 * its box a second later, portrait → landscape → portrait. Fails on a stale canvas or a page error.
 * Run it against `main`'s preview as the negative control (before the fix it stays stale).
 *
 *   ROT_URL='https://test.ivandpopov.com/grasstex/preview.php?ref=<branch>' node scripts/probe_rotation.cjs
 * Env: ROT_URL, ROT_SEED (bench1), ROT_PORTRAIT (390x797), ROT_LANDSCAPE (844x390), ROT_SETTLE (ms, 1000). */
const path = require('node:path');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.ROT_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.ROT_SEED || 'bench1', SETTLE = Number(process.env.ROT_SETTLE || 1000);
const size = s => { const [width, height] = s.split('x').map(Number); return { width, height }; };
const PORTRAIT = size(process.env.ROT_PORTRAIT || '390x797'), LANDSCAPE = size(process.env.ROT_LANDSCAPE || '844x390');

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl',
    '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox'] });
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: PORTRAIT, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => { if (!/\.pitch-(high|low)\.mp3/.test(String(e))) errors.push(String(e)); });
  await page.route('**/*', route => {
    const req = route.request();
    if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url())) return route.fulfill({ json: {} });
    return route.continue();
  });
  // Registered before the page's own listeners, so it runs first and can hide the late `resize`.
  await page.addInitScript(() => {
    window.__swallowResize = false;
    window.addEventListener('resize', e => { if (window.__swallowResize) e.stopImmediatePropagation(); }, true);
  });
  await page.goto(URL_ + (URL_.includes('?') ? '&' : '?') + 'seed=' + encodeURIComponent(SEED), { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__battle__ && window.__battle__.scene, null, { timeout: 600000, polling: 250 });

  const measure = () => page.evaluate(() => {
    const c = document.getElementById('renderCanvas'), e = window.__battle__.scene.getEngine(), k = 1 / e.getHardwareScalingLevel();
    return { box: [c.clientWidth, c.clientHeight], buffer: [c.width, c.height], want: [Math.floor(c.clientWidth * k), Math.floor(c.clientHeight * k)] };
  });
  const rotate = async (to, name) => {
    await page.evaluate(() => { window.dispatchEvent(new Event('resize')); window.dispatchEvent(new Event('orientationchange')); });
    await page.evaluate(() => { window.__swallowResize = true; });
    await page.setViewportSize(to);
    await page.waitForTimeout(SETTLE);
    await page.evaluate(() => { window.__swallowResize = false; });
    const m = await measure();
    m.name = name;
    m.ok = Math.abs(m.buffer[0] - m.want[0]) <= 1 && Math.abs(m.buffer[1] - m.want[1]) <= 1;
    return m;
  };

  const start = await measure();
  start.name = 'loaded';
  start.ok = Math.abs(start.buffer[0] - start.want[0]) <= 1 && Math.abs(start.buffer[1] - start.want[1]) <= 1;
  const steps = [start, await rotate(LANDSCAPE, 'to landscape'), await rotate(PORTRAIT, 'back to portrait')];
  for (const s of steps) console.log((s.ok ? 'ok    ' : 'STALE ') + s.name.padEnd(17) + ' box ' + s.box.join('×') + '  buffer ' + s.buffer.join('×') + '  want ' + s.want.join('×'));
  if (errors.length) console.log('page errors:\n  ' + errors.join('\n  '));
  await browser.close();
  const ok = steps.every(s => s.ok) && !errors.length;
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
