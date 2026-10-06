#!/usr/bin/env node
'use strict';
/* Strategic-chain observer contract (module 40, `coordinationHealth.strategicChain`).
   Drives the sampler headless through the wake outcomes the chain must distinguish -
   issueMission dedup leaving the old brief (no-new-brief), a new brief accepted with
   measurable progress (progressed), one superseded before acceptance - plus the
   stalled-mission census and restart. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
const systems = {},
  r = {};
r.window = r;
/* The General's own tuning, read live by the observer (followWindow 120, progressDistance 6). */
r.BattleCommanderAI = { strategicStallReplan: 120, strategicStallRecovery: { progressDistance: 6 } };
r.BattleModules = {
  registerSystem(id, h) {
    systems[id] = h;
  }
};
new Function(
  'window',
  'globalThis',
  'console',
  fs.readFileSync(path.join(H.REPO, 'battle/core-runtime.js'), 'utf8')
)(r, r, { log() {}, warn() {} });
new Function(
  'window',
  'globalThis',
  'console',
  fs.readFileSync(path.join(H.REPO, 'battle/modules/40-ai-coordination-health.js'), 'utf8')
)(r, r, { log() {}, warn() {} });
const A = r.BattleAICoordinationHealth;

/* Two men per squad so the centroid is their mean; positions move by editing the roots. */
function squad(id, faction, x, z) {
  const members = [0, 1].map(k => ({
    dead: false,
    root: { position: { x: x + k, z } }
  }));
  return {
    id,
    faction,
    members,
    aliveCount: 2,
    state: 'advance',
    commandRole: 'center',
    commandPhase: 'assault',
    targetObjective: 'obj',
    _macroMission: null
  };
}
function mission(version, objectiveId, point, extra) {
  return Object.assign(
    {
      version,
      intent: 'capture',
      action: 'assault',
      objectiveId,
      point,
      status: 'issued',
      issuedAt: null,
      acceptedAt: null
    },
    extra || {}
  );
}
const sim = {
  time: 0,
  winner: null,
  factions: { us: { squads: [] }, ge: { squads: [] } },
  objectiveControl: {
    counts: { us: 1, ge: 0 },
    objectives: {
      obj: { owner: 'neutral', active: null, phase: 'idle', progress: 0, vacantOwner: false }
    }
  },
  _macroMissionState: null
};
function stateWith(wakes, total) {
  sim._macroMissionState = {
    /* wakeCount is monotonic in the runtime; recentWakes holds the recent tail. */
    wakeCount: total != null ? total : wakes.length,
    recentWakes: wakes,
    generals: {
      us: { stallRecovery: { completed: 0, episode: '0', history: [] } },
      ge: { stallRecovery: { completed: 1, episode: '0', history: [{ stage: 'reconcile', time: 3.4 }] } }
    }
  };
}
function step(t) {
  sim.time = t;
  A.sample(sim);
}

A.reset(sim);
const chain0 = sim._coordinationHealth.strategicChain;
assert.equal(chain0.version, '1.0-strategic-chain', 'reset builds the chain');
assert.equal(chain0.wakes.length, 0);
assert.equal(chain0.factions.ge.lastMissionChangeAt, null);

/* t=2: first sample baselines the wake counter (past wakes stay in the log) and the distances. */
const ge0 = squad('ge-0', 'ge', 0, 0),
  ge1 = squad('ge-1', 'ge', 200, 200);
sim.factions.ge.squads.push(ge0, ge1);
ge0._macroMission = mission(1, 'obj', { x: 100, z: 0 }, { status: 'executing', issuedAt: 1, acceptedAt: 1 });
ge1._macroMission = mission(1, 'obj', { x: 100, z: 0 }, { status: 'executing', issuedAt: 1, acceptedAt: 1 });
stateWith([]);
step(2);
assert.equal(
  sim._coordinationHealth.strategicChain._squads['ge-0'].checkpoint,
  99.5,
  'first snapshot baselines the distance'
);
assert.equal(
  sim._coordinationHealth.strategicChain.factions.ge.lastMissionAcceptedAt,
  null,
  'acceptance before the chain started is not a fresh link'
);

/* t=4: a strategic-stall wake whose selectMission is deduped (version unchanged). */
stateWith([{ faction: 'ge', squad: 'ge-0', reason: 'strategic-stall', target: 'obj', time: 3.5 }]);
step(4);
let chain = sim._coordinationHealth.strategicChain;
assert.equal(chain.wakes.length, 1, 'strategic wake recorded');
const wk0 = chain.wakes[0];
assert.equal(wk0.missionBefore.version, 1, 'mission before comes from the previous snapshot');
assert.equal(wk0.briefNew, false, 'dedup: version unchanged means no new brief');
assert.equal(wk0.dedupSuppressed, true);
assert.equal(wk0.stageBefore, 'reconcile');
assert.equal(chain.factions.ge.lastStallWakeAt, 3.5);
/* Non-strategic wakes are not recorded. */
stateWith([
  { faction: 'ge', squad: 'ge-0', reason: 'strategic-stall', target: 'obj', time: 3.5 },
  { faction: 'ge', squad: 'ge-1', reason: 'mission-complete', target: 'obj', time: 3.6 }
]);
step(6);
chain = sim._coordinationHealth.strategicChain;
assert.equal(chain.wakes.length, 1, 'non-strategic wakes are ignored');
assert.equal(wk0.closedAt, null, 'still inside the follow window');

/* t=126: past the 120 s window with no new brief and no progress -> closed as no-new-brief. */
step(126);
assert.equal(wk0.closedAt, 126);
assert.equal(wk0.outcome, 'no-new-brief');

/* t=128: a release wake gives ge-0 a NEW brief; it is accepted, the phase changes, and the
   squad then moves 8 m toward the point over the next samples. */
ge0._macroMission = mission(2, 'obj', { x: 100, z: 0 }, { status: 'issued', issuedAt: 127.5 });
stateWith(
  [{ faction: 'ge', squad: 'ge-0', reason: 'strategic-stall-release', target: 'obj', time: 127.5 }],
  3
);
step(128);
chain = sim._coordinationHealth.strategicChain;
const wk1 = chain.wakes[1];
assert.equal(wk1.briefNew, true);
assert.equal(chain.factions.ge.lastMissionChangeAt, 128);
assert.equal(chain.factions.ge.lastMissionIssuedAt, 127.5);
ge0._macroMission.status = 'executing';
ge0._macroMission.acceptedAt = 129;
ge0.commandPhase = 'approach';
ge0.members[0].root.position.x = 8;
ge0.members[1].root.position.x = 8;
step(130);
assert.equal(wk1.acceptedAt, 129, 'fresh acceptance captured');
assert.equal(wk1.phaseChangedAt, 130, 'local phase change captured');
assert.equal(chain.factions.ge.lastMissionAcceptedAt, 129);
step(132);
assert.notEqual(wk1.pointProgressAt, null, '8 m toward the mission point is measurable progress');
assert.equal(chain.factions.ge.lastMissionPointProgressAt, 130);
/* Faction objective progress after the wake counts too. */
sim.objectiveControl.objectives.obj.active = 'ge';
sim.objectiveControl.objectives.obj.phase = 'capturing';
sim.objectiveControl.objectives.obj.progress = 0.5;
step(134);
assert.equal(wk1.objectiveProgressAt, 134);
/* The faction mirrors follow the module's own objective clocks (progress at 134 -> mirrored). */
assert.equal(chain.factions.ge.lastObjectiveProgressAt, 134);

/* ge-1 keeps its old brief and never moves again: past the follow window with no point
   progress the census lists it with owner and vacancy - a measurement, never a verdict.
   (ge-0 progressed at 130 s, so at 200 s it is 70 s stale - inside the window, not censused.) */
step(200);
chain = sim._coordinationHealth.strategicChain;
const census = chain.factions.ge.stalledMissionSquads;
assert.equal(census.length, 1, 'only the unmoving squad is censused');
assert.equal(census[0].squad, 'ge-1');
assert.equal(census[0].objectiveOwner, 'neutral', 'census records the objective owner');
assert.equal(census[0].objectiveVacant, false);

step(250);
assert.equal(wk1.outcome, 'progressed');

/* A superseded-before-acceptance wake: new brief replaced within the window, never executing. */
ge0._macroMission = mission(3, 'obj', { x: 100, z: 0 }, { status: 'issued', issuedAt: 261 });
stateWith([{ faction: 'ge', squad: 'ge-0', reason: 'strategic-reset', target: 'obj', time: 261 }], 4);
step(262);
ge0._macroMission = mission(
  4,
  'obj',
  { x: 100, z: 0 },
  { status: 'executing', issuedAt: 263, acceptedAt: 263 }
);
step(400);
chain = sim._coordinationHealth.strategicChain;
assert.equal(chain.wakes[2].outcome, 'superseded-before-acceptance');
assert.notEqual(chain.wakes[2].supersededAt, null);

/* Restart clears the chain; the summary export is a plain JSON clone that carries it. */
A.reset(sim);
assert.equal(sim._coordinationHealth.strategicChain.wakes.length, 0, 'restart clears wake records');
sim.time = 402;
A.sample(sim);
const exported = A.summary(sim);
assert.deepEqual(
  JSON.parse(JSON.stringify(exported.strategicChain)).factions.ge.lastStallWakeAt,
  null,
  'restart leaves no stale wake timestamp'
);

console.log('PASS strategic-chain observer: wake outcomes, chain clocks, stalled-mission census, restart');
