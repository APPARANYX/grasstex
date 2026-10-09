/* Issue #430 forensic: intentionally retain one browser document between full 600s
 * replays to identify state that survives the shipping restart lifecycle.
 *
 * Requires Playwright and the local battle PHP server:
 *   PARITY_SECONDS=600 node scripts/run_timescale_parity_benchmark.cjs
 * Env: PARITY_URL, PARITY_SEED, PARITY_SCENARIO, PARITY_SECONDS, PARITY_CASES, PARITY_OUT
 * PARITY_CASES: comma-separated 1x@20,1x@120,4x@30,4x@60,8x@20,8x@120 etc.
 */
'use strict';

const { chromium } = require('playwright');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const URL_ = process.env.PARITY_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.PARITY_SEED || 'timescale-parity';
const SCENARIO = process.env.PARITY_SCENARIO || 'meeting';
const SECONDS = Math.max(15, Number(process.env.PARITY_SECONDS || 600));
const OUT = process.env.PARITY_OUT || '';
const DEFENDER = { meeting: '', 'us-defend': 'us', 'ge-defend': 'ge' };
if (!(SCENARIO in DEFENDER)) throw new Error('Invalid scenario ' + SCENARIO);

const allCases = [];
for (const speed of [1, 4, 8]) {
  for (const fps of [20, 30, 60, 120]) allCases.push({ speed, fps, id: speed + 'x@' + fps });
}
const requested = process.env.PARITY_CASES
  ? process.env.PARITY_CASES.split(',').map(v => v.trim()).filter(Boolean)
  : allCases.map(x => x.id);
const cases = requested.map(id => {
  const found = allCases.find(x => x.id === id);
  if (!found) throw new Error('Unknown PARITY_CASES case ' + id);
  return found;
});
if (new Set(cases.map(x => x.id)).size !== cases.length) throw new Error('Duplicate parity cases');

function firstDifferences(left, right, at, out) {
  if (out.length >= 12 || Object.is(left, right)) return;
  const a = left && typeof left === 'object';
  const b = right && typeof right === 'object';
  if (a && b && Array.isArray(left) === Array.isArray(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of Array.from(keys).sort()) {
      firstDifferences(left[key], right[key], at + '.' + key, out);
      if (out.length >= 12) break;
    }
  } else {
    out.push({
      path: at,
      expected: String(JSON.stringify(left)).slice(0, 120),
      actual: String(JSON.stringify(right)).slice(0, 120)
    });
  }
}
const hash = s => createHash('sha256').update(s).digest('hex');

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
  const context = await browser.newContext({ viewport: { width: 960, height: 540 }, ignoreHTTPSErrors: true });
  context.setDefaultTimeout(180000);
  await context.route('**/*', route =>
    ['media', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue()
  );
  const q = new URLSearchParams({ seed: SEED });
  if (DEFENDER[SCENARIO]) q.set('defender', DEFENDER[SCENARIO]);
  const target = URL_ + (URL_.includes('?') ? '&' : '?') + q;
  const errors = [];
  let sharedPage = null;

  async function replay(mode) {
    const label = mode ? mode.id : 'fixed-benchmark';
    const firstPage = !sharedPage;
    const page = sharedPage || (sharedPage = await context.newPage());
    const pageErrors = [];
    page.on('pageerror', e => {
      const message = String((e && e.stack) || e);
      if (/^Uncaught \(in promise\) Error: HTTP 404 loading '\/grasstex\/Assets\/audio\/[A-Za-z0-9/_-]+\.mp3': Not Found/.test(message)) return;
      pageErrors.push(message.slice(0, 350));
    });
    try {
      if (firstPage) await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 180000 });
      await page.waitForFunction(
        () => !!(window.__battle__ && window.BattleCommanderAI && window.BattleAIPolicy && window.BattleModules),
        null,
        { timeout: 180000 }
      );
      if (firstPage) await page.addScriptTag({ path: path.join(__dirname, 'probes/state-fingerprint.js') });
      const data = await page.evaluate(async ({ seconds, mode }) => {
        const root = window;
        const sim = root.__battle__;
        const engine = sim.scene.getEngine();
        engine.stopRenderLoop();
        sim.pause();
        if (!sim._fixedClockInstalled || !sim._fixedClock || !sim._liveCommanderTick) {
          throw new Error('Shipping fixed-step clock/commander hook is not installed');
        }

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
        sim.restart();
        sim._fixedClock.reset();
        Object.assign(sim, {
          paused: false,
          manualEnded: false,
          winner: null,
          winReason: null,
          timeScale: mode ? mode.speed : 1,
          timeLimit: seconds
        });
        let fireEvents = 0;
        let hitEvents = 0;
        let suppressionEvents = 0;
        sim.onFire = function () {
          fireEvents++;
        };
        sim.onShot = function (shooter, target, hit) {
          if (hit) hitEvents++;
        };
        sim.onSuppressiveShot = function () {
          suppressionEvents++;
        };
        sim.onCallout = sim.onUpdate = function () {};

        if (!mode) {
          const tick = root.BattleCommanderAI.commandTick || 0.45;
          const fixedStep = root.BattleSim.AI_TICK;
          let commandDebt = 0;
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
        } else {
          const frames = Math.ceil((seconds / mode.speed) * mode.fps);
          const wallFrame = seconds / mode.speed / frames;
          for (let i = 0; i < frames && !sim.winner; i++) sim._fixedClock.advance(wallFrame);
        }

        return {
          simSeconds: sim.time,
          winner: sim.winner || null,
          aliveUS: sim.factions.us.alive,
          aliveGE: sim.factions.ge.alive,
          fireEvents,
          hitEvents,
          suppressionEvents,
          pendingSeconds: sim._fixedClock.stats.pendingSeconds,
          backloggedFrames: sim._fixedClock.stats.backloggedFrames,
          fingerprint: JSON.stringify(root.BattleStateFingerprint.snapshot(sim))
        };
      }, { seconds: SECONDS, mode });
      errors.push(...pageErrors.map(message => ({ label, message })));
      console.log(label + ': sim=' + data.simSeconds.toFixed(2) + ' fire=' + data.fireEvents + ' hits=' + data.hitEvents);
      return { label, ...data };
    } finally {
      // Intentionally preserve the live document and all its battle-scoped state.
    }
  }

  try {
    const baseline = await replay(null);
    const repeated = await replay(null);
    const samePageEqual = baseline.fingerprint === repeated.fingerprint;
    const samePageDiffs = [];
    if (!samePageEqual) firstDifferences(JSON.parse(baseline.fingerprint), JSON.parse(repeated.fingerprint), 'battle', samePageDiffs);
    const report = {
      scenario: SCENARIO,
      seed: SEED,
      seconds: SECONDS,
      cases: cases.map(x => x.id),
      isolatedPages: false,
      samePageRestart: { sameBattle: samePageEqual, fingerprint: hash(repeated.fingerprint), differences: samePageDiffs, fireEvents: repeated.fireEvents },
      baseline: {
        label: baseline.label,
        simSeconds: baseline.simSeconds,
        winner: baseline.winner,
        aliveUS: baseline.aliveUS,
        aliveGE: baseline.aliveGE,
        fireEvents: baseline.fireEvents,
        hitEvents: baseline.hitEvents,
        suppressionEvents: baseline.suppressionEvents,
        fingerprint: hash(baseline.fingerprint)
      },
      variants: [],
      errors
    };
    for (const mode of cases) {
      const run = await replay(mode);
      const sameBattle = run.fingerprint === baseline.fingerprint;
      const differences = [];
      if (!sameBattle) {
        firstDifferences(JSON.parse(baseline.fingerprint), JSON.parse(run.fingerprint), 'battle', differences);
      }
      report.variants.push({
        label: run.label,
        sameBattle,
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
        differences
      });
    }
    if (OUT) {
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
    }
    console.log(JSON.stringify(report, null, 2));
    if (errors.length || !report.baseline.fireEvents || !samePageEqual || report.variants.some(x => !x.sameBattle)) {
      process.exitCode = 1;
    }
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
