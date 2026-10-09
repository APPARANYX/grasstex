/* Real-battle fixed-step parity: replay the same seed under 1x/4x/8x and
 * synthetic 20/30/60/120fps wall-clock cadences. The full soldier, squad,
 * combat and commander state must match the ordinary 0.15s benchmark.
 *
 * Run with a local battle PHP server:
 *   NODE_PATH=$(npm root -g) node scripts/run_timescale_parity_benchmark.cjs
 * Env: PARITY_URL, PARITY_SEED, PARITY_SCENARIO, PARITY_SECONDS, PARITY_OUT.
 */
'use strict';

const { chromium } = require('playwright');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const URL_ = process.env.PARITY_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.PARITY_SEED || 'timescale-parity';
const SCENARIO = process.env.PARITY_SCENARIO || 'meeting';
const SECONDS = Math.max(15, +process.env.PARITY_SECONDS || 600);
const OUT = process.env.PARITY_OUT || '';
const ONLY = process.env.PARITY_ONLY || '';
const DEFENDER = { meeting: '', 'us-defend': 'us', 'ge-defend': 'ge' };
if (!Object.prototype.hasOwnProperty.call(DEFENDER, SCENARIO)) {
  throw new Error('Invalid scenario ' + SCENARIO);
}

(async function () {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--no-sandbox',
      '--ignore-certificate-errors'
    ]
  });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, ignoreHTTPSErrors: true });
  page.setDefaultTimeout(180000);
  const errors = [];
  page.on('pageerror', e => {
    const message = String((e && e.stack) || e);
    if (/^Uncaught \(in promise\) Error: HTTP 404 loading '\/grasstex\/Assets\/audio\/[A-Za-z0-9/_-]+\.mp3': Not Found/.test(message)) return;
    errors.push(message.slice(0, 400));
  });
  await page.route('**/*', route =>
    ['media', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue()
  );

  try {
    const query = new URLSearchParams({ seed: SEED });
    if (DEFENDER[SCENARIO]) query.set('defender', DEFENDER[SCENARIO]);
    await page.goto(URL_ + (URL_.includes('?') ? '&' : '?') + query, {
      waitUntil: 'domcontentloaded',
      timeout: 180000
    });
    await page.waitForFunction(
      () => !!(window.__battle__ && window.BattleCommanderAI && window.BattleAIPolicy && window.BattleModules),
      null,
      { timeout: 180000 }
    );
    await page.addScriptTag({ path: path.join(__dirname, 'probes/state-fingerprint.js') });
    const results = await page.evaluate(async ({ seconds, only }) => {
      const root = window;
      const sim = root.__battle__;
      if (!sim._fixedClockInstalled || !sim._fixedClock || !sim._liveCommanderTick) {
        throw new Error('The shipping fixed-step clock/commander hook is not installed');
      }
      const engine = sim.scene.getEngine();
      engine.stopRenderLoop();
      sim.pause();
      const telemetry = root.BattleTelemetry;
      if (telemetry) {
        try {
          if (telemetry.end) await telemetry.end(sim, 'parity-start');
        } catch (_) {}
        telemetry.record = telemetry.start = telemetry.ensure = function () {};
        telemetry.end = telemetry.checkpoint = telemetry.flush = async () => true;
      }
      const policy = root.BattleAIPolicy.get();
      root.BattleAIPolicy.setMatchPolicies(sim, policy, policy);
      sim.trainingMode = true;
      if (root.BattleSoldierModel && root.BattleSoldierModel.setImportedEnabled) {
        root.BattleSoldierModel.setImportedEnabled(sim.scene, false);
      }

      let fireCount = 0;
      let hitCount = 0;
      let suppressionCount = 0;
      function reset() {
        (sim._controlRawRestart || sim.restart.bind(sim))();
        sim._fixedClock.reset();
        Object.assign(sim, {
          paused: false,
          manualEnded: false,
          winner: null,
          winReason: null,
          timeScale: 1,
          timeLimit: seconds
        });
        fireCount = hitCount = suppressionCount = 0;
        sim.onFire = function () {
          fireCount++;
        };
        sim.onShot = function (shooter, target, hit) {
          if (hit) hitCount++;
        };
        sim.onSuppressiveShot = function () {
          suppressionCount++;
        };
        sim.onCallout = sim.onUpdate = function () {};
      }

      function snapshot(label) {
        return {
          label: label,
          simSeconds: sim.time,
          winner: sim.winner || null,
          aliveUS: sim.factions.us.alive,
          aliveGE: sim.factions.ge.alive,
          fireEvents: fireCount,
          hitEvents: hitCount,
          suppressionEvents: suppressionCount,
          fingerprint: JSON.stringify(root.BattleStateFingerprint.snapshot(sim)),
          pendingSeconds: sim._fixedClock.stats.pendingSeconds,
          backloggedFrames: sim._fixedClock.stats.backloggedFrames
        };
      }

      reset();
      const tick = root.BattleCommanderAI.commandTick || 0.45;
      let commandDebt = 0;
      const fixedStep = root.BattleSim.AI_TICK;
      while (!sim.winner && sim.time + 1e-9 < seconds) {
        sim._trainerStepActive = true;
        try {
          sim.step(fixedStep);
        } finally {
          sim._trainerStepActive = false;
        }
        commandDebt += fixedStep;
        while (commandDebt + 1e-9 >= tick && !sim.winner) {
          commandDebt -= tick;
          root.BattleCommanderAI.update(sim, sim.scene.metadata.battleScenario, tick);
        }
      }
      const baseline = snapshot('fixed-benchmark');
      const baselineState = JSON.parse(baseline.fingerprint);
      function differences(left, right, location, out) {
        if (out.length >= 12 || Object.is(left, right)) return;
        const a = left && typeof left === 'object';
        const b = right && typeof right === 'object';
        if (a && b && Array.isArray(left) === Array.isArray(right)) {
          const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
          for (const key of Array.from(keys).sort()) {
            if (out.length >= 12) break;
            differences(left[key], right[key], location + '.' + key, out);
          }
          return;
        }
        out.push({
          path: location,
          expected: String(JSON.stringify(left)).slice(0, 150),
          actual: String(JSON.stringify(right)).slice(0, 150)
        });
      }
      const variants = [];
      for (const speed of [1, 4, 8]) {
        for (const fps of [20, 30, 60, 120]) {
          const label = speed + 'x @ ' + fps + 'fps';
          if (only && only !== label) continue;
          reset();
          sim.timeScale = speed;
          const count = Math.ceil((seconds / speed) * fps);
          const wallFrame = seconds / speed / count;
          for (let i = 0; i < count && !sim.winner; i++) sim._fixedClock.advance(wallFrame);
          const result = snapshot(label);
          result.differences = [];
          if (result.fingerprint !== baseline.fingerprint) {
            differences(baselineState, JSON.parse(result.fingerprint), 'battle', result.differences);
          }
          variants.push(result);
        }
      }
      return { baseline: baseline, variants: variants };
    }, { seconds: SECONDS, only: ONLY });

    const standard = results.baseline;
    const hash = source => createHash('sha256').update(source).digest('hex');
    const report = {
      scenario: SCENARIO,
      seed: SEED,
      seconds: SECONDS,
      baseline: {
        simSeconds: standard.simSeconds,
        winner: standard.winner,
        aliveUS: standard.aliveUS,
        aliveGE: standard.aliveGE,
        fireEvents: standard.fireEvents,
        hitEvents: standard.hitEvents,
        suppressionEvents: standard.suppressionEvents,
        fingerprint: hash(standard.fingerprint)
      },
      variants: results.variants.map(run => ({
        label: run.label,
        sameBattle: run.fingerprint === standard.fingerprint,
        simSeconds: run.simSeconds,
        winner: run.winner,
        aliveUS: run.aliveUS,
        aliveGE: run.aliveGE,
        fireEvents: run.fireEvents,
        hitEvents: run.hitEvents,
        suppressionEvents: run.suppressionEvents,
        pendingSeconds: run.pendingSeconds,
        backloggedFrames: run.backloggedFrames,
        fingerprint: hash(run.fingerprint),
        differences: run.differences
      })),
      only: ONLY || 'all',
      errors: errors
    };
    if (OUT) {
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
    }
    console.log(JSON.stringify(report, null, 2));
    if (errors.length || !report.baseline.fireEvents || report.variants.some(v => !v.sameBattle)) {
      process.exitCode = 1;
    }
  } finally {
    await page.close();
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
