#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
const systems = {},
  r = {};
r.window = r;
r.BattleCommanderAI = { strategicStallReplan: 120 };
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
const squad = f => ({
  id: f + '-0',
  faction: f,
  aliveCount: 8,
  state: 'advance',
  commandRole: 'center',
  targetObjective: 'obj',
  commandPhase: 'assault'
});
const sim = {
  time: 0,
  winner: null,
  factions: { us: { squads: [squad('us')] }, ge: { squads: [squad('ge')] } },
  objectiveControl: { objectives: { obj: { owner: 'neutral', active: null, phase: 'idle', progress: 0 } } }
};
const A = r.BattleAICoordinationHealth;
A.reset(sim);
assert.deepEqual(sim._coordinationHealth.lastObjectiveProgressAt, { us: 0, ge: 0 });
sim.time = 2;
Object.assign(sim.objectiveControl.objectives.obj, { active: 'ge', phase: 'capturing', progress: 4 });
A.sample(sim);
assert.equal(sim._coordinationHealth.lastObjectiveProgressAt.ge, 2);
assert.equal(sim._coordinationHealth.lastObjectiveProgressAt.us, 0);
assert.equal(sim._coordinationHealth.sides.us.objectiveStallSeconds, 2);
assert.equal(sim._coordinationHealth.sides.ge.objectiveStallSeconds, 0);
sim.time = 4;
Object.assign(sim.objectiveControl.objectives.obj, { owner: 'ge', active: null, phase: 'held', progress: 0 });
A.sample(sim);
assert.equal(sim._coordinationHealth.lastObjectiveProgressAt.ge, 4, 'GE capture advances only the GE clock');
assert.equal(
  sim._coordinationHealth.lastObjectiveProgressAt.us,
  0,
  'enemy capture does not reset US progress'
);
sim.time = 6;
Object.assign(sim.objectiveControl.objectives.obj, {
  owner: 'neutral',
  active: 'us',
  phase: 'capturing',
  progress: 3
});
A.sample(sim);
assert.equal(sim._coordinationHealth.lastObjectiveProgressAt.us, 6, 'US progress advances the US clock');
assert.equal(sim._coordinationHealth.lastObjectiveProgressAt.ge, 4);
sim.factions.us.squads[0].state = 'retreat';
sim.time = 8;
A.sample(sim);
assert.equal(
  sim._coordinationHealth.sides.us.activeSquads,
  0,
  'retreat fragments are excluded from assignment health'
);
assert.equal(sim._coordinationHealth.sides.us.unassignedTargets, 0);
console.log('PASS faction-specific objective progress clocks and retreat-fragment filtering');
