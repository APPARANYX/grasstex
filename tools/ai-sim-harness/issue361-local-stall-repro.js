#!/usr/bin/env node
'use strict';
/* Issue #361 focused local-mission stall evidence; forensic Macro fixture. This exercises shipping commander,
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

/* This purposely excludes physical movement; the target squad's unchanged coordinates
   mean a broken mission, while the independently supplied positive objective reports
   emulate *another* squad's lawful capture progress. Exact physical battle replay is
   a separate #361 acceptance requirement. */
function supplyFriendlyProgress(w) {
  if (w.T % 100 === 0) {
    w.b.objectiveControl.objectives.other = {
      owner: 'neutral', active: 'us', progress: w.T / 100, phase: 'capturing'
    };
  }
}
const w = world();
w.q.targetObjective = 'away';
w.q.commandPhase = 'assault';
drive(w, 2);
const first = w.q._macroMission;
assert.equal(first.intent, 'capture');
w.r.BattleCommanderAI.acceptMission(w.b, w.q, false);
const checkpoints = [];
for (const t of [120, 180, 240, 300, 420]) {
  drive(w, t, supplyFriendlyProgress);
  checkpoints.push(state(w));
}
const general = w.r.BattleCommanderAI.generalFor(w.b,'us');
const stillSame = w.q._macroMission === first;
const neverProgressed = checkpoints.every(x => !x.squadProgress || x.squadProgress.lastProgressAt == null);
const missed = stillSame && neverProgressed && general.stallRecovery.history.length === 0;
console.log('ISSUE361_LOCAL_STALL ' + JSON.stringify({
  baseline: 'controlled supplied progress + physically stationary accepted CAPTURE',
  issued: { version:first.version, objective:first.objectiveId },
  missed, stillSame, neverProgressed,
  checkpoints: checkpoints.map(s=>({
    t:s.time,intent:s.intent,version:s.version,status:s.status,
    factionStall:s.factionStall, lastProgressAt:s.squadProgress && s.squadProgress.lastProgressAt,
    lastExecutionAt:s.squadProgress && s.squadProgress.lastExecutionAt,
    recoveryStages:s.stages.length
  }))
}));
assert.ok(missed,'controlled single-squad starvation was reproduced; if fixed, update this negative-control expectation');
