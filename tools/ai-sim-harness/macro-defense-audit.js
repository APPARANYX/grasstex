#!/usr/bin/env node
'use strict';
/* Forensic Macro lifecycle scenarios for issue #361. This exercises shipping commander,
 * objective, coordination-health and engineer code. It deliberately does not integrate
 * movement or claim that a changed brief resolves the real hill stalemate.
 * Run: node tools/ai-sim-harness/macro-defense-audit.js [<git-ref>]
 * GRASSTEX_SOURCE_ROOT=<checkout> loads all runtime files from another source tree.
 * An optional ref replaces only module 22a, isolating PR #359's behavioral changes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const H = require('./harness');
const ref = process.argv[2];
const SOURCE = process.env.GRASSTEX_SOURCE_ROOT || H.REPO;
function load(r, p) {
  const source =
    ref && p === 'battle/modules/22a-commander-strategic-recovery.js'
      ? cp.execFileSync('git', ['show', ref + ':' + p], { cwd: H.REPO, encoding: 'utf8' })
      : fs.readFileSync(path.join(SOURCE, p), 'utf8');
  new Function('window', 'globalThis', 'console', 'BABYLON', source)(
    r,
    r,
    { log() {}, warn() {} },
    r.BABYLON
  );
}
function world() {
  H.resetIds();
  const log = console.log;
  let r;
  try {
    console.log = () => {};
    r = H.bootstrap({ modules: false, search: '?morale=0&coa=0&fireControl=0' });
  } finally {
    console.log = log;
  }
  r.GTLog = () => {};
  const systems = {},
    objectiveTypes = {},
    events = [];
  r.BattleModules = {
    registerSystem(id, hooks) {
      systems[id] = hooks;
    },
    getSystem(id) {
      return systems[id];
    },
    registerUnitType() {},
    registerObjectiveType(id, hooks) {
      objectiveTypes[id] = hooks;
    },
    getObjectiveType(id) {
      return objectiveTypes[id];
    },
    unitsFor(b) {
      return b._roster.us.concat(b._roster.ge);
    },
    runHook() {}
  };
  r.BattleSim = { start() {} };
  r.BattleTelemetry = {
    record(type, data) {
      events.push({ type, data });
    }
  };
  for (const p of [
    'battle/modules/08-soldier-events.js',
    'battle/modules/17-soldier-mind.js',
    'battle/modules/01-capture-zone.js',
    'battle/commander-doctrine.js',
    'battle/commander-routes.js',
    'battle/commander-ai.js',
    'battle/modules/22-commander-reconstitution.js',
    'battle/modules/22a-commander-strategic-recovery.js',
    'battle/modules/16-squad-plan-stability.js',
    'battle/objective-system.js',
    'battle/modules/40-ai-coordination-health.js'
  ])
    load(r, p);
  const b = H.makeBattle(r);
  b.macroCommandEnabled = true;
  b.scene = { metadata: {} };
  r.BattleObjectiveSystem.attach(
    b,
    [
      { id: 'home', type: 'capture-zone', x: 0, z: 0, radius: 30, value: 1, initialOwner: 'us' },
      { id: 'away', type: 'capture-zone', x: 0, z: 160, radius: 30, value: 1, initialOwner: 'ge' }
    ],
    {}
  );
  const q = H.addSquad(r, b, { id: 'us-audit', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 0 } });
  q.commandRole = 'center';
  q.commandPhase = 'defend';
  q.route = [];
  return { r, b, q, events, systems, T: 0 };
}
function drive(w, until, beforeSample) {
  for (; w.T <= until; w.T += 2) {
    w.b.time = w.T;
    if (beforeSample) beforeSample(w);
    w.r.BattleAICoordinationHealth.sample(w.b);
    w.r.BattleCommanderAI.update(w.b, null, w.r.BattleCommanderAI.commandTick);
  }
}
function state(w) {
  const m = w.q._macroMission;
  const health = w.b._coordinationHealth;
  return {
    time: w.b.time,
    intent: m.intent,
    action: m.action,
    objective: m.objectiveId,
    objectiveOwner: w.r.BattleObjectiveSystem.status(w.b, m.objectiveId).owner,
    version: m.version,
    status: m.status,
    preparedPin: !!w.q._preparedDefenseRequest,
    issuedAt: m.issuedAt,
    acceptedAt: m.acceptedAt,
    route: m.route,
    factionStall: health.sides.us.objectiveStallSeconds,
    replanDue: health.sides.us.replanDue,
    replanReasons: health.sides.us.replanReasons,
    squadProgress: w.r.BattleCommanderAI.generalFor(w.b, 'us').stallRecovery.progress[String(w.q.id)] || null,
    stages: w.r.BattleCommanderAI.generalFor(w.b, 'us').stallRecovery.history.map(h => ({
      stage: h.stage,
      time: h.time,
      affected: h.affected
    }))
  };
}
function seedDefender(w, pinned) {
  w.q._preparedDefenseRequest = { objectiveId: 'home', point: { x: 0, z: 0 } };
  drive(w, 2);
  assert.equal(w.q._macroMission.intent, 'defend');
  w.r.BattleCommanderAI.acceptMission(w.b, w.q, false);
  if (!pinned) {
    w.q._preparedDefenseRequest = null;
    // This creates an ordinary assigned defender, matching the existing review fixture.
    w.q._macroMission.requestKey = null;
  }
}
const evidence = { sourceRoot: SOURCE, recoverySource: ref || 'working-tree', scenarios: [] };
function supplyOtherEffortProgress(fixture) {
  if (fixture.T % 100 === 0) {
    fixture.b.objectiveControl.objectives.other = {
      owner: 'neutral',
      active: 'us',
      progress: fixture.T / 100,
      phase: 'capturing'
    };
  }
}
{
  const w = world();
  seedDefender(w, false);
  const checkpoints = [];
  for (const t of [120, 180, 240, 300, 420]) {
    drive(w, t);
    checkpoints.push(state(w));
    // Isolate decisions after a genuine Meso acceptance; no movement is simulated.
    w.r.BattleCommanderAI.acceptMission(w.b, w.q, false);
  }
  evidence.scenarios.push({ name: 'ordinary-assigned-defender', checkpoints });
}
{
  const w = world();
  seedDefender(w, true);
  const before = w.q._macroMission;
  drive(w, 120);
  w.r.BattleObjectiveSystem.get(w.b, 'home').state.owner = 'ge';
  drive(w, 122);
  const afterLoss = state(w);
  assert.ok(
    w.events.some(e => e.type === 'decision-macro-replan' && e.data.reason === 'objective-control-changed')
  );
  assert.equal(
    w.q._macroMission,
    before,
    'owner loss is deduped because the standing pin still derives the same brief'
  );
  drive(w, 420);
  evidence.scenarios.push({ name: 'prepared-pin-after-owner-loss', afterLoss, at420: state(w) });
}
{
  const w = world();
  // Attacking faction US in a GE-defend battle, still physically inside a captured zone,
  // with its new mission attacking away. Only the engineer advances its build clock.
  w.q.targetObjective = 'away';
  drive(w, 2);
  assert.equal(w.q._macroMission.intent, 'capture');
  w.r.BattleCommanderAI.acceptMission(w.b, w.q, false);
  const before = state(w);
  load(w.r, 'battle/modules/00-battle-sides.js');
  load(w.r, 'battle/modules/00-defense-plan.js');
  load(w.r, 'battle/modules/21-defender-engineers.js');
  w.b.scene = null; // Disable presentation only; construction geometry stays real.
  w.b._sides = w.r.BattleSides.build(
    {
      center: { x: 0, z: 80 },
      objectives: w.b._objectives.map(o => o.def)
    },
    { defender: 'ge' }
  );
  w.b._defensePlans = { us: w.r.BattleDefensePlan.empty('us'), ge: w.r.BattleDefensePlan.empty('ge') };
  w.q.members[0].role = 'engineer';
  w.q.members[0].root.position.x = 0;
  w.q.members[0].root.position.z = 0;
  w.systems['defender-engineers'].onCommanderTick(w.b, { dt: 11 });
  assert.equal(w.b._engineerBuild.counts['us|home'], 1, 'attacking engineer constructs real fortification');
  assert.ok(w.q._preparedDefenseRequest, 'construction publishes a standing prepared-defense pin');
  drive(w, 4);
  const afterBuild = state(w);
  assert.equal(afterBuild.intent, 'defend');
  w.r.BattleCommanderAI.acceptMission(w.b, w.q, false);
  drive(w, 420);
  evidence.scenarios.push({
    name: 'attacking-engineer-converts-squad-to-standing-garrison',
    before,
    afterBuild,
    at420: state(w)
  });
}
{
  const w = world();
  seedDefender(w, false);
  const initial = w.q._macroMission;
  // Another effort reports periodic positive US capture progress. No opposing truth is read.
  drive(w, 420, supplyOtherEffortProgress);
  assert.equal(w.q._macroMission, initial);
  assert.equal(w.r.BattleCommanderAI.generalFor(w.b, 'us').stallRecovery.history.length, 0);
  evidence.scenarios.push({ name: 'other-effort-progress-masks-stationary-squad', at420: state(w) });
}
{
  const w = world();
  w.q.targetObjective = 'away';
  w.q.commandPhase = 'assault';
  drive(w, 2);
  const initial = w.q._macroMission;
  assert.equal(initial.intent, 'capture');
  w.r.BattleCommanderAI.acceptMission(w.b, w.q, false);
  const checkpoints = [];
  for (const t of [120, 180, 240, 300, 420]) {
    drive(w, t, supplyOtherEffortProgress);
    checkpoints.push(state(w));
  }
  assert.equal(w.q._macroMission, initial);
  assert.equal(w.r.BattleCommanderAI.generalFor(w.b, 'us').stallRecovery.history.length, 0);
  assert.equal(state(w).squadProgress.lastProgressAt, null);
  evidence.scenarios.push({
    name: 'supplied-other-effort-progress-masks-stationary-capture',
    faultInjection: 'Positive same-faction objective reports every 100s; no soldier movement integrator.',
    checkpoints
  });
}
{
  const w = world();
  seedDefender(w, false);
  // Deliberately force a policy action rather than claiming that the shipping default
  // rules organically select DEFEND for this no-contact enemy-objective context.
  w.r.BattleCommanderDoctrine.ruleFor = () => ({ id: 'audit-forced-defend', action: 'defend', when: [] });
  const checkpoints = [];
  for (const t of [120, 180, 240, 300, 420, 540, 660]) {
    drive(w, t);
    checkpoints.push(state(w));
    w.r.BattleCommanderAI.acceptMission(w.b, w.q, false);
  }
  evidence.scenarios.push({
    name: 'forced-defend-doctrine-during-ordinary-defender-recovery',
    faultInjection:
      'ruleFor always returns DEFEND; each checkpoint manually accepts the current brief; no movement integrator.',
    checkpoints
  });
}
{
  const w = world();
  const objective = w.r.BattleObjectiveSystem.get(w.b, 'home');
  const point = { x: objective.def.x, z: objective.def.z };
  const flank = w.r.BattleCommanderDoctrine.flankPoint(
    w.q,
    { point, instance: objective },
    { center: { ...point } }
  );
  assert.deepEqual(flank, point, 'a coincident town center degenerates the varied approach');
  evidence.scenarios.push({
    name: 'flank-at-town-center-has-no-spatial-variation',
    point,
    flank,
    displacement: Math.hypot(flank.x - point.x, flank.z - point.z)
  });
}
console.log(JSON.stringify(evidence, null, 2));
