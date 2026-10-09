/* Probe runner: full headless battles with observe-only probes from scripts/probes/ attached.
 *
 * A probe is a question asked of real battles ("do two men ever stand on one firing station?").
 * Write it once as scripts/probes/<name>.js and keep it: this runner plays the same fixed-step
 * battle the standard benchmark plays (procedural rig, 0.15 s step, Force Command on the 0.45 s
 * tick, telemetry off) and hands every probe the live sim.
 *
 * Probe contract (plain browser JS, no imports):
 *   (window.BattleProbes = window.BattleProbes || {})['<name>'] = {
 *     every: 0.5,              // sample period in simulated seconds (0 = every step)
 *     start(sim) {},           // after the restart, before the first step
 *     sample(sim) {},          // read-only: never write sim state or draw from battle.random
 *     report(sim) { return {...} }  // JSON-able result for this battle
 *   };
 * A probe that changes the battle is a bug in the probe. `sameBattle` in the output compares
 * the end state with a probe-free control when PROBE_CONTROL=1.
 *
 * Run (serve the repo first, see AGENTS.md "Browser smoke"; start php with PHP_CLI_SERVER_WORKERS=4,
 * or a page load can queue behind the previous battle's downloads and stall until the 180 s retry):
 *   PROBE=station-occupancy NODE_PATH=$(npm root -g) node scripts/run_probe.cjs
 * Env:
 *   PROBE          comma-separated probe names (files in scripts/probes/), required
 *   PROBE_BATTLES  comma-separated <type>:<seed>; type is meeting | us-defend | ge-defend.
 *                  Default: one standard-benchmark seed per type.
 *   PROBE_SECONDS  simulated seconds per battle (default 600, the benchmark length)
 *   PROBE_STEP     fixed step (default 0.15)
 *   PROBE_URL      page (default http://127.0.0.1:8765/grasstex/battle_sim_local.php)
 *   PROBE_OUTPUT   JSON path for the full report (default: stdout only)
 *   PROBE_CONTROL  1 = also run each battle with no probe and report whether it matched
 *   PROBE_BROWSER  optional Chromium/Chrome executable (uses Playwright's browser by default)
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const NAMES = String(process.env.PROBE || '').split(',').map(s => s.trim()).filter(Boolean);
const BATTLES = (process.env.PROBE_BATTLES ||
  'meeting:standard-benchmark-meeting-s1-b0001-0001,us-defend:standard-benchmark-us-defend-s1-b0001-0001,ge-defend:standard-benchmark-ge-defend-s1-b0001-0001')
  .split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const i = s.indexOf(':');
    return i < 0 ? { type: 'meeting', seed: s } : { type: s.slice(0, i), seed: s.slice(i + 1) };
  });
const SECONDS = Math.max(5, +process.env.PROBE_SECONDS || 600);
const STEP = Math.max(.05, Math.min(.3, +process.env.PROBE_STEP || .15));
const URL = process.env.PROBE_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const DEFENDER = { meeting: '', 'us-defend': 'us', 'ge-defend': 'ge' };

async function battle(browser, { type, seed }, probes) {
  if (!(type in DEFENDER)) throw new Error(`unknown battle type ${type}`);
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, ignoreHTTPSErrors: true });
  const errors = [], assetErrors = { count: 0, examples: [] };
  page.on('pageerror', e => {
    const message = String(e && e.stack || e).slice(0, 400);
    // Local browser probes lack the production's private audio library. An exact
    // audio-mp3 404 is known asset noise, not a simulation exception. Never
    // suppress unrelated page errors, even ones originating from Babylon.
    if (/^Uncaught \(in promise\) Error: HTTP 404 loading '\/grasstex\/Assets\/audio\/[A-Za-z0-9/_-]+\.mp3': Not Found/.test(message)) {
      assetErrors.count++;
      if (assetErrors.examples.length < 3) assetErrors.examples.push(message.split('\\n')[0]);
    } else errors.push(message);
  });
  page.setDefaultTimeout(180000);
  // Probe battles use the procedural rig (as the benchmark does). The page itself waits for its FBX
  // soldiers (no fallback since #86), so let them load; on a local PHP dev server that is slow, but
  // aborting them leaves the page on its load error. Media and fonts are never needed.
  await page.route('**/*', r => ['media', 'font'].includes(r.request().resourceType()) ? r.abort() : r.continue());
  const q = new URLSearchParams({ seed });
  if (DEFENDER[type]) q.set('defender', DEFENDER[type]);
  // The single-threaded PHP dev server can stall a load behind another page's asset downloads.
  for (let attempt = 1; ; attempt++) {
    try {
      await page.goto(`${URL}${URL.includes('?') ? '&' : '?'}${q}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
      await page.waitForFunction(() => !!(window.__battle__ && window.BattleCommanderAI && window.BattleAIPolicy && window.BattleModules), null, { timeout: 180000 });
      break;
    } catch (e) { if (attempt >= 3) throw e; console.error(`${type} ${seed}: retrying load after ${String(e.message).split('\n')[0]}`); }
  }
  // The read-only snapshot helper is also present in the probe-free control arm.
  for (const name of new Set(['state-fingerprint', ...probes])) {
    const base = path.join(__dirname, 'probes', name);
    const file = fs.existsSync(base + '.js') ? base + '.js' : base + '.cjs';
    await page.addScriptTag({ path: file });
  }
  const result = await page.evaluate(async ({ names, STEP, SECONDS }) => {
    const root = window, sim = root.__battle__, engine = sim.scene && sim.scene.getEngine && sim.scene.getEngine();
    if (engine && root.__battleRenderLoop__) engine.stopRenderLoop(root.__battleRenderLoop__);
    sim.pause();
    const tel = root.BattleTelemetry;
    if (tel) { try { if (tel.end) await tel.end(sim, 'probe-start'); } catch (_) {}
      tel.record = tel.start = tel.ensure = function () {}; tel.end = tel.checkpoint = tel.flush = async () => true; }
    const policy = root.BattleAIPolicy.get();
    root.BattleAIPolicy.setMatchPolicies(sim, policy, policy);
    sim.trainingMode = true;
    if (root.BattleSoldierModel && root.BattleSoldierModel.setImportedEnabled) root.BattleSoldierModel.setImportedEnabled(sim.scene, false);
    (sim._controlRawRestart || sim.restart.bind(sim))();
    Object.assign(sim, { manualEnded: false, winner: null, winReason: null, paused: false, timeScale: 1, timeLimit: SECONDS });
    const probes = names.map(n => {
      const p = root.BattleProbes && root.BattleProbes[n];
      if (!p) throw new Error('probe ' + n + ' did not register');
      if (p.start) p.start(sim);
      return { n, p, next: 0 };
    });
    const tick = +root.BattleCommanderAI.commandTick || .45, wall = performance.now();
    let acc = 0, steps = 0;
    while (!sim.winner && sim.time < SECONDS + .5 && steps < Math.ceil((SECONDS + 2) / STEP)) {
      sim._trainerStepActive = true;
      try { sim.step ? sim.step(STEP) : sim._frame(STEP); } finally { sim._trainerStepActive = false; }
      steps++; acc += STEP;
      while (acc + 1e-9 >= tick && !sim.winner) { acc -= tick; root.BattleCommanderAI.update(sim, root.__scenario__ || (sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario) || null, tick); }
      for (const q of probes) if (q.p.sample && sim.time + 1e-9 >= q.next) { q.p.sample(sim); q.next = sim.time + (+q.p.every || 0); }
    }
    if (!sim.winner && sim._checkWinner) sim._checkWinner();
    const fingerprint = JSON.stringify(root.BattleStateFingerprint.snapshot(sim));
    const reports = {};
    for (const q of probes) reports[q.n] = q.p.report ? q.p.report(sim) : null;
    return {
      simSeconds: +(+sim.time).toFixed(2), wallSeconds: +((performance.now() - wall) / 1000).toFixed(1), steps,
      winner: sim.winner || null, fingerprint, reports
    };
  }, { names: probes, STEP, SECONDS });
  result._endState = JSON.parse(result.fingerprint);
  result.fingerprint = createHash('sha256').update(result.fingerprint).digest('hex');
  await page.close();
  return { type, seed, ...result, errors, assetErrors };
}

(async () => {
  if (!NAMES.length) throw new Error('PROBE=<name>[,<name>] is required; probes: ' +
    fs.readdirSync(path.join(__dirname, 'probes')).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)).join(', '));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PROBE_BROWSER || undefined,
    args: ['--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--ignore-certificate-errors'] });
  const out = { probes: NAMES, step: STEP, seconds: SECONDS, url: URL, battles: [] };
  try {
    for (const b of BATTLES) {
      const r = await battle(browser, b, NAMES);
      if (process.env.PROBE_CONTROL === '1') {
        const c = await battle(browser, b, []);
        r.sameBattle = c.fingerprint === r.fingerprint;
        r.controlFingerprint = c.fingerprint;
        if (!r.sameBattle) { r.controlState = c._endState; r.probeState = r._endState; }
      }
      delete r._endState;
      out.battles.push(r);
      console.error(`${b.type} ${b.seed}: ${r.simSeconds}s sim in ${r.wallSeconds}s, winner ${r.winner}` +
        (r.sameBattle == null ? '' : `, same battle as control: ${r.sameBattle}`) + (r.errors.length ? `, ${r.errors.length} runtime errors` : '') + (r.assetErrors.count ? `, ${r.assetErrors.count} expected audio 404s` : ''));
    }
  } finally { await browser.close(); }
  const text = JSON.stringify(out, null, 1);
  if (process.env.PROBE_OUTPUT) fs.writeFileSync(process.env.PROBE_OUTPUT, text + '\n');
  console.log(text);
  if (out.battles.some(b => b.errors.length || b.sameBattle === false)) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
