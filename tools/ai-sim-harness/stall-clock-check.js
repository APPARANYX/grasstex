#!/usr/bin/env node
'use strict';
/* One stall clock (Phase 2b). Two constants said how long a side may go without objective progress before a
   replan: REPLAN_AFTER = 12 s in the coordination-health sampler (module 40) and STRATEGIC_STALL_REPLAN = 120 s
   in Force Command (commander-ai.js). Grepping every consumer of `replanDue` shows the runtime never reads it:
   the General wakes on `objectiveStallSeconds >= 120` and `lastObjectiveProgressAt`, and `replanDue` /
   `replanReasons` reach only the export, the benchmark record and the stashed AI Graph UI. So the 120 s clock
   is the authoritative one, and the sampler's threshold is that same number, read from the General when it
   is used, so the export says a replan is due when the General acts and not 108 s before it.

   This check holds the single clock: the sampler's threshold IS the General's constant; the flag flips exactly
   at it; with no General loaded nothing is ever due. GRASSTEX_SOURCE_ROOT points it at another checkout (main
   before the change must fail). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

const REPO = process.env.GRASSTEX_SOURCE_ROOT || H.REPO;
function load(r, file) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(REPO, file), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log('PASS ' + name);
}

/* The health sampler on a bare registry, with or without the General loaded first (as in the page, where
   generic commander code loads before the modules). */
function world({ general = true } = {}) {
  H.resetIds();
  const r = H.bootstrap({ modules: false });
  r.BattleModules = { registerSystem() {}, unitsFor: b => (b._roster.us || []).concat(b._roster.ge || []) };
  r.BattleSim = { start() {} };
  r.BattleTelemetry = { record() {} };
  if (general) {
    load(r, 'battle/commander-doctrine.js');
    load(r, 'battle/commander-routes.js');
    load(r, 'battle/commander-ai.js');
    load(r, 'battle/modules/22-commander-reconstitution.js');
    load(r, 'battle/modules/22a-commander-strategic-recovery.js');
  }
  load(r, 'battle/modules/40-ai-coordination-health.js');
  const b = H.makeBattle(r);
  b.objectiveControl = { objectives: {} };
  /* One side assaulting with roles and targets assigned and no objective ever changing hands: the only
     thing that can make the sampler flag a replan is the stall clock. */
  for (const [f, id] of [
    ['us', 'us-0'],
    ['ge', 'ge-0']
  ]) {
    const q = H.addSquad(r, b, { id, faction: f, x: 0, z: 0, objective: { x: 0, z: 100 } });
    Object.assign(q, {
      commandRole: 'center',
      targetObjective: 'a',
      commandPhase: 'assault',
      aliveCount: 10
    });
  }
  return { r, b, H: r.BattleAICoordinationHealth, C: r.BattleCommanderAI };
}
/* Sample every 2 s like the commander tick does; the first time the US side is flagged for the stall. */
function firstDue(w, until) {
  w.H.reset(w.b);
  for (let t = 2; t <= until; t += 2) {
    w.b.time = t;
    w.H.sample(w.b);
    const side = w.b._coordinationHealth.sides.us;
    if (side.replanDue) return { t, reasons: side.replanReasons, stall: side.objectiveStallSeconds };
  }
  return null;
}

test("one constant: the sampler's threshold is the General's strategic-stall clock", () => {
  const w = world();
  assert.ok(w.C.strategicStallReplan > 0, 'the General exports its stall clock');
  assert.equal(w.H.replanAfter, w.C.strategicStallReplan, 'REPLAN_AFTER is not a second number');
  w.H.reset(w.b);
  assert.equal(
    w.b._coordinationHealth.replanAfter,
    w.C.strategicStallReplan,
    'the export reports that one clock'
  );
});

test('the replan flag flips when the General wakes on the stall, not before', () => {
  const w = world();
  const clock = w.C.strategicStallReplan;
  const due = firstDue(w, clock + 20);
  assert.ok(due, 'a stalled assault is flagged once the clock runs out');
  assert.deepEqual(due.reasons, ['objective-stalled']);
  assert.ok(due.stall >= clock, 'flagged at ' + due.stall + ' s of stall');
  assert.ok(
    due.t - clock <= 2,
    "within one sample of the General's clock (" + clock + ' s), not at ' + due.t + ' s'
  );
});

test('a stalled side whose squads are all defending is flagged too, under its own reason (#361 defect 8)', () => {
  const w = world();
  w.b._roster.us.forEach(s => s.squad && (s.squad.commandPhase = 'defend'));
  const q = w.b.factions.us.squads[0];
  q.commandPhase = 'defend';
  const clock = w.C.strategicStallReplan;
  const due = firstDue(w, clock + 20);
  assert.ok(due, 'an all-defend side reads replanDue while the same stall clock runs');
  assert.deepEqual(due.reasons, ['objective-stalled-no-assault']);
  assert.ok(due.t - clock <= 2, 'flagged at the same clock, not later');
});

test("opponent progress does not reset this side's strategic stall clock", () => {
  const w = world();
  w.H.reset(w.b);
  for (let t = 2; t <= 20; t += 2) {
    w.b.time = t;
    /* GE progresses on an objective; US does not. */
    w.b.objectiveControl.objectives.a = {
      owner: 'neutral',
      active: 'ge',
      phase: 'capturing',
      progress: t * 2
    };
    w.H.sample(w.b);
  }
  const h = w.b._coordinationHealth;
  assert.equal(h.lastObjectiveProgressAt.ge, 20, 'GE clock follows GE progress');
  assert.equal(h.lastObjectiveProgressAt.us, 0, 'US clock is not refreshed by GE progress');
  assert.ok(h.sides.us.objectiveStallSeconds > h.sides.ge.objectiveStallSeconds);
});

test('with no General loaded nobody replans, so no stall is ever due', () => {
  const w = world({ general: false });
  assert.equal(w.H.replanAfter, Infinity);
  assert.equal(firstDue(w, 400), null);
});

console.log('stall-clock-check: ' + count + ' passed');
