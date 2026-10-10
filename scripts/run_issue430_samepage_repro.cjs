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
const requested = process.env.PARITY_CASES === 'none'
  ? []
  : process.env.PARITY_CASES
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
        if (!sim._fixedClock || !sim._liveCommanderTick) {
          throw new Error('Explicit benchmark clock/commander hook is unavailable');
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
        const hooks = [];
        const oldRunHook = root.BattleModules.runHook;
        root.BattleModules.runHook = function (name) { hooks.push(name); return oldRunHook.apply(this, arguments); };
        try { sim.restart(); } finally { root.BattleModules.runHook = oldRunHook; }
        sim._fixedClock.reset();
        const restartState = {
          time: sim.time,
          medicClock: sim._medicClock == null ? null : sim._medicClock,
          rosterUS: sim._roster.us.length,
          rosterGE: sim._roster.ge.length,
          moduleUnits: root.BattleModules.unitsFor(sim).length
        };
        Object.assign(sim, {
          paused: false,
          manualEnded: false,
          winner: null,
          winReason: null,
          timeScale: mode ? mode.speed : 1,
          timeLimit: seconds
        });
        const checkpoints = {};
        const milestones = [0, 120, 180, 220, 240, 250, 260, 270, 280, 285, 290, 295, 300, 310, 320];
        function mark() { for (const t of milestones) if (sim.time + 0.0001 >= t && !(t in checkpoints)) checkpoints[t] = JSON.stringify(root.BattleStateFingerprint.snapshot(sim)); }
        const causalTrace = [];
        function traceCause() {
          if (sim.time + 1e-9 < 235 || sim.time - 1e-9 > 305) return;
          const soldiers = sim._roster.us.concat(sim._roster.ge).map(s => ({
            id: s.id,
            hp: s.hp,
            maxHp: s.maxHp,
            dead: !!s.dead,
            bleedRate: s.bleedRate || 0,
            squad: s.squad ? s.squad.id : null,
            squadState: s.squad ? s.squad.state : null,
            inContact: !!(s.squad && s.squad.inContact),
            assemblyPhase: s.squad && s.squad._assembly ? s.squad._assembly.phase : null,
            medicEligible: !!(
              !s.dead &&
              s.maxHp > 0 &&
              s.hp < s.maxHp &&
              !(s.bleedRate > 0) &&
              s.squad &&
              s.squad.state === 'retreat' &&
              s.squad.fledId == null &&
              !s.squad.inContact &&
              s.squad._assembly &&
              s.squad._assembly.phase === 'at-base'
            ),
            stress: s.mind ? s.mind.stress : null,
            floor: s.mind ? s.mind.floor : null,
            lost: s.mind ? s.mind.lost : null
          }));
          causalTrace.push({
            t: sim.time,
            medicClock: sim._medicClock == null ? null : sim._medicClock,
            soldiers
          });
        }
        mark();
        traceCause();
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
            mark();
            traceCause();
          }
        } else {
          const frames = Math.ceil((seconds / mode.speed) * mode.fps);
          const wallFrame = seconds / mode.speed / frames;
          for (let i = 0; i < frames && !sim.winner; i++) { sim._fixedClock.advance(wallFrame); mark(); }
        }

        return {
          hooks,
          checkpoints,
          simSeconds: sim.time,
          winner: sim.winner || null,
          aliveUS: sim.factions.us.alive,
          aliveGE: sim.factions.ge.alive,
          fireEvents,
          hitEvents,
          suppressionEvents,
          pendingSeconds: sim._fixedClock.stats.pendingSeconds,
          backloggedFrames: sim._fixedClock.stats.backloggedFrames,
          fingerprint: JSON.stringify(root.BattleStateFingerprint.snapshot(sim)),
          restartState,
          endMedicClock: sim._medicClock == null ? null : sim._medicClock,
          causalTrace
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
    const earliest = Object.keys(baseline.checkpoints).find(t => baseline.checkpoints[t] !== repeated.checkpoints[t]);
    function firstTraceDifference(field) {
      const n = Math.min(baseline.causalTrace.length, repeated.causalTrace.length);
      for (let i = 0; i < n; i++) {
        const a = baseline.causalTrace[i], b = repeated.causalTrace[i];
        if (!Object.is(a[field], b[field])) return { index: i, baseline: a[field], repeated: b[field], at: a.t };
      }
      return null;
    }
    function firstSoldierDifference(fields) {
      const n = Math.min(baseline.causalTrace.length, repeated.causalTrace.length);
      for (let i = 0; i < n; i++) {
        const a = baseline.causalTrace[i], b = repeated.causalTrace[i];
        const m = Math.min(a.soldiers.length, b.soldiers.length);
        for (let j = 0; j < m; j++) {
          const sa = a.soldiers[j], sb = b.soldiers[j];
          for (const field of fields) {
            if (!Object.is(sa[field], sb[field])) {
              return { index: i, at: a.t, soldierIndex: j, soldierId: sa.id, field, baseline: sa, repeated: sb, baselineMedicClock: a.medicClock, repeatedMedicClock: b.medicClock };
            }
          }
        }
      }
      return null;
    }
    function firstMedicEligibleTick(trace) {
      for (const point of trace) {
        const soldier = point.soldiers.find(s => s.medicEligible);
        if (soldier) return { at: point.t, medicClock: point.medicClock, soldier };
      }
      return null;
    }
    const causalEvidence = {
      baselineRestart: baseline.restartState,
      baselineEndMedicClock: baseline.endMedicClock,
      repeatedRestart: repeated.restartState,
      repeatedEndMedicClock: repeated.endMedicClock,
      firstMedicClockDifference: firstTraceDifference('medicClock'),
      firstMedicEligibleBaseline: firstMedicEligibleTick(baseline.causalTrace),
      firstMedicEligibleRepeated: firstMedicEligibleTick(repeated.causalTrace),
      firstHealthDifference: firstSoldierDifference(['hp', 'bleedRate']),
      firstMindDifference: firstSoldierDifference(['floor', 'lost', 'stress']),
      firstContextDifference: firstSoldierDifference(['dead', 'squadState', 'inContact', 'assemblyPhase', 'medicEligible'])
    };
    const initialDiffs = [];
    if (earliest !== undefined) firstDifferences(JSON.parse(baseline.checkpoints[earliest]), JSON.parse(repeated.checkpoints[earliest]), 'battle', initialDiffs);
    if (!samePageEqual) firstDifferences(JSON.parse(baseline.fingerprint), JSON.parse(repeated.fingerprint), 'battle', samePageDiffs);
    const report = {
      scenario: SCENARIO,
      seed: SEED,
      seconds: SECONDS,
      cases: cases.map(x => x.id),
      isolatedPages: false,
      samePageRestart: { sameBattle: samePageEqual, fingerprint: hash(repeated.fingerprint), hooksFirst: baseline.hooks, hooksRepeat: repeated.hooks, firstDifferenceAt: earliest || null, firstDifferences: initialDiffs, differences: samePageDiffs, fireEvents: repeated.fireEvents, causalEvidence },
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
