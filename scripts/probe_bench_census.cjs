/* Device benchmark draw-call census (97-device-benchmark.js meshCensus): the "draw calls by kind" table
 * estimates draws from the active meshes; Babylon's own counter says how many there were. Runs the
 * benchmark (`bench=1&benchAuto=1`) with weapon instances on (default) and off (`?weaponInstances=0`),
 * each in a fresh page, and reports per arm the census total, its weapon row and the measured draw
 * calls. With instances on, the weapon row must be at most the number of weapon source meshes (one
 * draw each), not one per soldier; with clones it is one per active weapon. The census total must sit
 * within BC_TOL (share) of the measured median either way.
 *
 *   node scripts/probe_bench_census.cjs      # local server (see AGENTS.md)
 * Env: BC_URL, BC_SEED (bench1), BC_SECONDS (20), BC_WARMUP (60), BC_TOL (0.25). */
const path = require('node:path');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.BC_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.BC_SEED || 'bench1';
const SECONDS = Number(process.env.BC_SECONDS || 20), WARMUP = Number(process.env.BC_WARMUP || 60);
const TOL = Number(process.env.BC_TOL || 0.25);

async function arm(browser, on) {
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 645 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', route => {
    const req = route.request();
    if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url())) return route.fulfill({ json: {} });
    return route.continue();
  });
  const q = 'seed=' + encodeURIComponent(SEED) + '&bench=1&benchAuto=1&benchSeconds=' + SECONDS + '&benchWarmup=' + WARMUP + (on ? '' : '&weaponInstances=0');
  await page.goto(URL_ + (URL_.includes('?') ? '&' : '?') + q, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__deviceBench, null, { timeout: 900000, polling: 1000 });
  const res = await page.evaluate(() => {
    const r = window.__deviceBench, k = r.meshKinds.kinds, w = k.find(x => x.kind === 'weapons') || { meshes: 0, draws: 0 };
    const sources = window.__battle__.scene.meshes.filter(m => /^weapon-source\./.test(m.name) && m.instances && m.instances.length).length;
    return { build: r.build, samples: r.meshKinds.samples, census: k.reduce((a, x) => a + x.draws, 0), weaponMeshes: w.meshes, weaponDraws: w.draws,
      sources, drawCalls: r.drawCalls && r.drawCalls.median, drawCallsMean: r.drawCalls && r.drawCalls.mean };
  });
  await page.close();
  return { res, errors };
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl',
    '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox'] });
  const bad = [], out = {};
  for (const on of [true, false]) {
    const name = on ? 'instances' : 'clones', { res, errors } = await arm(browser, on);
    out[name] = res;
    console.log(name.padEnd(9), JSON.stringify(res));
    if (errors.length) bad.push(name + ': page errors ' + errors.slice(0, 3).join(' | '));
    if (!res.samples) bad.push(name + ': no census samples (raise BC_SECONDS)');
    if (res.drawCalls && Math.abs(res.census - res.drawCalls) > TOL * res.drawCalls) bad.push(name + ': census ' + res.census.toFixed(1) + ' vs measured ' + res.drawCalls);
    if (on && res.weaponDraws > res.sources + 1e-9) bad.push('instances: ' + res.weaponDraws.toFixed(1) + ' weapon draws for ' + res.sources + ' source meshes');
    if (!on && Math.abs(res.weaponDraws - res.weaponMeshes) > 1e-9) bad.push('clones: weapon draws ' + res.weaponDraws + ' != active weapons ' + res.weaponMeshes);
  }
  await browser.close();
  console.log(bad.length ? 'FAIL ' + bad.join('; ') : 'OK: the census counts instanced weapons once per source mesh and tracks the measured draw calls');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
