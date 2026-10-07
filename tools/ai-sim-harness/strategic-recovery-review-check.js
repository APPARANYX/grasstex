#!/usr/bin/env node
'use strict';
/* Strategic-recovery review lifecycle (the strategic-freeze fix at the owning 22a layer).
   Both sides of the invariant, driven deterministically through the real commander tick and the
   module 40 sampler (which owns the stall clock the General reads):

     - freeze side: a genuinely stalled assault (executing capture brief, no objective progress,
       no measurable movement) runs the reconcile/release/main-effort/reset ladder, the reset
       re-briefs the SAME objective through a varied approach instead of deduping into a no-op,
       and once the one-shot ladder is exhausted review passes recur every STRATEGIC_STALL_REPLAN
       of continued stall - in a static world they dedup into recorded ineffective wakes (no
       churn), and when the world changes they issue a materially new brief again. Objective
       progress re-keys the episode and re-arms the fresh ladder.
     - stability side: a useful defender (owned objective, in contact) and a squad with a
       measurable-progress pulse receive no strategic re-tasking at all, while the same faction's
       stalled effort goes through stages and review passes.
     - adoption hold: when two stages cross in one tick, the second holds while the first's brief
       is still young and unaccepted, and is released by acceptance. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
/* The commander chain (like strategic-recovery-ctx-check's macroWorld) plus the objective system
   and the coordination-health sampler that owns the stall clocks. */
function world(events, defs) {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: '?morale=0&coa=0&fireControl=0' }),
    systems = {};
  r.BattleModules = {
    registerSystem(id, h) {
      systems[id] = h;
    },
    getSystem: id => systems[id],
    runHook() {},
    registerUnitType() {},
    registerObjectiveType(t, h) {
      objectiveTypes[t] = h;
    },
    getObjectiveType: t => objectiveTypes[t],
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  const objectiveTypes = {};
  r.BattleSim = { start() {} };
  r.BattleTelemetry = {
    record(type, data) {
      events.push({ type, data });
    }
  };
  load(r, 'battle/modules/08-soldier-events.js');
  load(r, 'battle/modules/17-soldier-mind.js');
  load(r, 'battle/modules/01-capture-zone.js');
  load(r, 'battle/commander-doctrine.js');
  load(r, 'battle/commander-routes.js');
  load(r, 'battle/commander-ai.js');
  load(r, 'battle/modules/22-commander-reconstitution.js');
  load(r, 'battle/modules/22a-commander-strategic-recovery.js');
  load(r, 'battle/modules/16-squad-plan-stability.js');
  load(r, 'battle/objective-system.js');
  load(r, 'battle/modules/40-ai-coordination-health.js');
  const b = H.makeBattle(r);
  b.macroCommandEnabled = true;
  b.scene = { metadata: {} };
  r.BattleObjectiveSystem.attach(b, defs, {});
  return { r, b, C: r.BattleCommanderAI, A: r.BattleAICoordinationHealth, T: 0 };
}
/* Two simulated seconds per step: the sampler then the commander tick, the order the battle loop
   uses. hooks(w) runs between them so a driver can move squads or flip objective state. */
function drive(w, until, hooks) {
  for (; w.T < until; w.T += 2) {
    w.b.time = w.T;
    w.A.sample(w.b);
    if (hooks) hooks(w);
    w.C.update(w.b, null, w.C.commandTick);
  }
}
function history(w, faction) {
  return w.C.generalFor(w.b, faction).stallRecovery.history;
}
function strategicWakes(events, squad) {
  return events.filter(
    e =>
      e.type === 'decision-macro-replan' &&
      String(e.data.reason).indexOf('strategic-') === 0 &&
      (squad == null || e.data.squad === squad)
  );
}
function moveToward(w, sq, dx, dz) {
  sq.members.forEach(s => {
    s.root.position.x += dx;
    s.root.position.z += dz;
  });
}

/* ------------------------------------------------------------------------------------------- */
test('freeze side: a stalled assault is reset through a varied approach at the same objective, then reviewed on a cadence', () => {
  const events = [],
    w = world(events, [{ id: 'obj-a', type: 'capture-zone', x: 0, z: 120, radius: 30, value: 1 }]);
  const q = H.addSquad(w.r, w.b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 120 } });
  Object.assign(q, { commandRole: 'center', targetObjective: 'obj-a', commandPhase: 'assault' });
  drive(w, 4);
  const m1 = q._macroMission;
  assert.ok(m1 && m1.intent === 'capture' && m1.objectiveId === 'obj-a', 'initial brief assaults obj-a');
  assert.equal(m1.route.length, 0, 'the plain doctrine assault has no approach legs');
  w.C.acceptMission(w.b, q, false);
  assert.equal(m1.status, 'executing');
  /* The squad never moves and the objective never changes hands: a genuinely stalled front. */
  drive(w, 302);
  const names = history(w, 'us').map(h => h.stage);
  assert.deepEqual(
    names,
    ['reconcile', 'release', 'main-effort', 'reset'],
    'the one-shot ladder ran to exhaustion'
  );
  const m2 = q._macroMission;
  assert.ok(m2 !== m1 && m2.version === 2, 'the reset issued a new brief, not a dedup no-op');
  assert.equal(m2.objectiveId, 'obj-a', 'the reset kept the still-only-reachable objective');
  assert.equal(m2.route.length, 1, 'the reset varied the approach: one flank leg instead of none');
  w.C.acceptMission(w.b, q, false);
  /* Ladder exhausted, world static: a review pass must still come, dedup, and change nothing. */
  drive(w, 422);
  let review = history(w, 'us').filter(h => h.stage === 'review');
  assert.equal(review.length, 1, 'one review pass at reset + STRATEGIC_STALL_REPLAN of continued stall');
  assert.equal(review[0].pass, 1);
  assert.deepEqual(
    [review[0].issued, review[0].ineffective],
    [0, 1],
    'the static world deduped the review into one recorded ineffective wake'
  );
  assert.equal(q._macroMission, m2, 'a static world produces no churn: the same brief object stays');
  /* The decision space changes: a second objective opens while the faction is still stalled.
     The exhausted ladder must still be able to make a materially new decision - the next review
     moves the effort instead of deduping - recovery stays possible, not just observed. */
  w.r.BattleObjectiveSystem.attach(
    w.b,
    [
      { id: 'obj-a', type: 'capture-zone', x: 0, z: 120, radius: 30, value: 1 },
      { id: 'obj-b', type: 'capture-zone', x: 140, z: 20, radius: 30, value: 1 }
    ],
    {}
  );
  drive(w, 542);
  review = history(w, 'us').filter(h => h.stage === 'review');
  assert.equal(review.length, 2, 'the second review pass came on the same cadence');
  assert.deepEqual(
    [review[1].issued, review[1].ineffective],
    [1, 0],
    'the opened effort got a materially new brief'
  );
  const m3 = q._macroMission;
  assert.ok(
    m3 !== m2 && m3.version === 3 && m3.objectiveId === 'obj-b',
    'the review switched the stalled effort to obj-b'
  );
  /* Objective progress re-keys the episode: the review lifecycle and the ladder both re-arm. */
  Object.assign(w.b.objectiveControl.objectives['obj-a'], {
    owner: 'us',
    active: 'us',
    phase: 'capturing',
    progress: 0.5
  });
  drive(w, 560);
  const recovery = w.C.generalFor(w.b, 'us').stallRecovery;
  assert.equal(recovery.passes, 0, 'progress resets the review pass counter');
  assert.equal(recovery.completed, 0, 'progress re-arms the fresh ladder');
  assert.equal(
    w.C.generalFor(w.b, 'us').lastAdoptionHold,
    null,
    'no adoption hold: stages crossed one per tick'
  );
});

/* ------------------------------------------------------------------------------------------- */
test('stability side: legitimate static defense and a progressing effort are not churned by stages or review passes', () => {
  const events = [],
    w = world(events, [
      { id: 'obj-a', type: 'capture-zone', x: 0, z: 120, radius: 30, value: 1 },
      { id: 'obj-d', type: 'capture-zone', x: -160, z: 0, radius: 30, value: 1 }
    ]);
  w.b.objectiveControl.objectives['obj-d'].owner = 'us';
  const stalled = H.addSquad(w.r, w.b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: 0,
      objective: { x: 0, z: 120 }
    }),
    defender = H.addSquad(w.r, w.b, {
      id: 'us-1',
      faction: 'us',
      x: -160,
      z: 0,
      objective: { x: -160, z: 0 }
    }),
    moving = H.addSquad(w.r, w.b, { id: 'us-2', faction: 'us', x: 30, z: -60, objective: { x: 0, z: 120 } });
  /* A truthy (empty) route keeps ensureAssignments from re-rolling index-based roles, so none of
     the three is a support or reserve: the assaulter and the progressing squad stay center. */
  [stalled, defender, moving].forEach(q => {
    Object.assign(q, { commandRole: 'center', commandPhase: 'assault', route: [] });
  });
  stalled.targetObjective = 'obj-a';
  /* A prepared-defense request, as 00-defense-plan plants it: the defender gets and keeps a
     defend brief on the owned objective, in contact. */
  defender._preparedDefenseRequest = { objectiveId: 'obj-d', point: { x: -160, z: 0 } };
  defender.inContact = true;
  moving.targetObjective = 'obj-a';
  drive(w, 4);
  const defendBrief = defender._macroMission;
  assert.ok(
    defendBrief && defendBrief.intent === 'defend' && defendBrief.objectiveId === 'obj-d',
    'defender holds the prepared-defense brief'
  );
  w.C.acceptMission(w.b, defender, false);
  w.C.acceptMission(w.b, moving, false);
  w.C.acceptMission(w.b, stalled, false);
  /* The progressing squad keeps a measurable-progress pulse toward its mission point; the
     stalled one never moves. The faction still never takes an objective, so stages and review
     passes keep firing for the stalled effort. */
  drive(w, 622, ww => {
    const p = moving._macroMission && moving._macroMission.point;
    if (!p) return;
    const dx = p.x - moving.members[0].root.position.x,
      dz = p.z - moving.members[0].root.position.z,
      d = Math.hypot(dx, dz) || 1;
    moveToward(ww, moving, (dx / d) * 0.5, (dz / d) * 0.5);
  });
  const reviews = history(w, 'us').filter(h => h.stage === 'review');
  assert.ok(reviews.length >= 1, 'the faction went through review passes while stalled');
  assert.equal(defender._macroMission, defendBrief, 'the useful defender kept the exact same brief object');
  assert.deepEqual(
    strategicWakes(events, 'us-1'),
    [],
    'no strategic wake ever re-tasked the legitimate defender'
  );
  const churnReasons = strategicWakes(events, 'us-2').map(e => e.data.reason);
  churnReasons.forEach(reason =>
    assert.ok(
      reason === 'strategic-main-effort',
      'the progressing squad was not reset or reconciled, only massed by the pre-existing main-effort rule, not ' +
        reason
    )
  );
  const stalledWakes = strategicWakes(events, 'us-0').map(e => e.data.reason);
  assert.ok(stalledWakes.indexOf('strategic-reset') >= 0, 'the stalled effort itself was reset');
});

/* ------------------------------------------------------------------------------------------- */
test('adoption hold: a young unaccepted brief from one stage holds the next stage until acceptance', () => {
  const events = [],
    w = world(events, [
      { id: 'obj-a', type: 'capture-zone', x: 0, z: 120, radius: 30, value: 1 },
      { id: 'obj-b', type: 'capture-zone', x: 140, z: 20, radius: 30, value: 1 }
    ]);
  const q = H.addSquad(w.r, w.b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 120 } });
  Object.assign(q, { commandRole: 'center', targetObjective: 'obj-a', commandPhase: 'assault' });
  drive(w, 116);
  const first = q._macroMission;
  assert.ok(first && first.objectiveId === 'obj-a');
  w.C.acceptMission(w.b, q, false);
  /* A late detection: one tick where reconcile, release and main-effort all cross together.
     Reconcile switches the stalled effort to obj-b and publishes a fresh unaccepted brief; the
     next stage must hold instead of superseding it before reception could take it. */
  w.T = 250;
  w.b.time = 250;
  w.A.sample(w.b);
  w.C.update(w.b, null, w.C.commandTick);
  assert.deepEqual(
    history(w, 'us').map(h => h.stage),
    ['reconcile'],
    'only the first stage ran'
  );
  const switched = q._macroMission;
  assert.ok(
    switched !== first && switched.status === 'issued' && switched.objectiveId === 'obj-b',
    'reconcile published a new brief'
  );
  const hold = w.C.generalFor(w.b, 'us').lastAdoptionHold;
  assert.ok(
    hold && hold.stage === 'release' && hold.squad === 'us-0',
    'the release stage held on the in-flight adoption'
  );
  drive(w, 262);
  assert.deepEqual(
    history(w, 'us').map(h => h.stage),
    ['reconcile'],
    'the hold persists while the brief stays unaccepted'
  );
  w.C.acceptMission(w.b, q, false);
  drive(w, 266);
  const stages = history(w, 'us').map(h => h.stage);
  assert.ok(stages.indexOf('release') >= 0, 'acceptance released the held stage: ' + stages.join(','));
});

/* A timestamp of exactly zero is valid history from the coordination sampler, not "missing".
   A static defender with no later progress must therefore become eligible for strategic recovery. */
test('initial defender progress timestamp zero still ages into strategic recovery', () => {
  const events = [],
    w = world(events, [
      { id: 'obj-home', type: 'capture-zone', x: 0, z: 0, radius: 30, value: 1 },
      { id: 'obj-away', type: 'capture-zone', x: 0, z: 160, radius: 30, value: 1 }
    ]);
  w.b.objectiveControl.objectives['obj-home'].owner = 'us';
  const q = H.addSquad(w.r, w.b, {
    id: 'us-def',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 0 }
  });
  Object.assign(q, { commandRole: 'center', commandPhase: 'defend', route: [] });
  q._preparedDefenseRequest = { objectiveId: 'obj-home', point: { x: 0, z: 0 } };
  drive(w, 4);
  assert.ok(q._macroMission && q._macroMission.intent === 'defend', 'precondition: initial owned-objective defense');
  w.C.acceptMission(w.b, q, false);
  const sampled = w.A.summary(w.b);
  assert.equal(sampled.lastObjectiveProgressAt.us, 0, 'coordination health initializes progress at t=0');

  drive(w, 540);
  assert.ok(
    q._macroMission && q._macroMission.intent === 'capture' && q._macroMission.objectiveId === 'obj-away',
    'the idle defender is eventually re-tasked instead of being protected forever by falsy timestamp zero'
  );
});
console.log('PASS ' + n + ' strategic-recovery review checks');
