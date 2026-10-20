#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const { loadModule } = require('./module-loader');
function fixture() {
  const sq = {
    id: 'ge-4',
    faction: 'ge',
    baseHome: { x: 0, z: 0 },
    members: [{ root: { position: { x: 0, z: 0 } } }],
    state: 'advance',
    _macroMission: { version: 7, intent: 'capture', status: 'executing', objectiveId: 'held' }
  };
  const root = { SquadAI: { retreatGoal: () => sq.baseHome } };
  loadModule(root, 'scripts/probes/strategic-mission-trace.js');
  const probe = root.BattleProbes['strategic-mission-trace'];
  const sim = { time: 0, _sides: { attacker: 'ge' }, factions: { us: { squads: [] }, ge: { squads: [sq] } } };
  probe.start();
  const sample = t => {
    sim.time = t;
    probe.sample(sim);
  };
  const garrison = (objectiveId = 'held') => {
    sq._preparedDefenseRequest = { objectiveId };
  };
  return { sq, sim, probe, sample, garrison };
}
for (const mode of ['capture', 'temporary-security', 'initial']) {
  const a = fixture();
  if (mode === 'temporary-security') {
    Object.assign(a.sq._macroMission, { intent: 'defend', requestKey: 'objective-security|held' });
    a.sq._captureZoneDefenseRequest = {};
  }
  if (mode !== 'initial') a.sample(40);
  a.garrison();
  a.sample(46);
  assert.equal(a.probe.report().invariantViolations[0]?.code, 'attacker-prepared-garrison', mode);
}
{
  const a = fixture();
  a.sq._macroMission.intent = 'defend';
  a.sample(1373.55);
  a.garrison();
  a.sample(1375.65);
  a.sq._macroMission.requestKey = 'prepared-defense|held';
  a.sample(1377.75);
  assert.equal(
    a.probe.report().invariantViolations.length,
    0,
    'explicit General DEFEND authorizes persistent garrison'
  );
  assert.equal(a.probe.report().squadSamples.at(-1).missionRequestKey, 'prepared-defense|held');
  a.garrison('other');
  a.sample(1380);
  assert.equal(
    a.probe.report().invariantViolations.length,
    1,
    'authorization cannot transfer to another objective'
  );
  a.probe.start();
  a.sample(1382);
  assert.equal(a.probe.report().invariantViolations.length, 1, 'restart clears authorization');
}
{
  const a = fixture();
  a.sq._macroMission.intent = 'defend';
  a.sample(10);
  a.garrison();
  a.sample(12);
  a.sq._preparedDefenseRequest = null;
  a.sq._macroMission.intent = 'capture';
  a.sample(20);
  a.garrison();
  a.sample(46);
  assert.equal(
    a.probe.report().invariantViolations.length,
    1,
    'cleared assignment cannot authorize a later capture conversion'
  );
}
for (const mode of ['capture', 'temporary-security']) {
  const a = fixture();
  a.sq._macroMission.intent = 'defend';
  a.sample(40);
  a.sq._macroMission.intent = mode === 'capture' ? 'capture' : 'defend';
  if (mode === 'temporary-security') a.sq._macroMission.requestKey = 'objective-security|held';
  a.garrison();
  a.sample(46);
  assert.equal(
    a.probe.report().invariantViolations.length,
    1,
    'prior defense cannot authorize a replacement ' + mode + ' brief'
  );
}
console.log(
  'PASS strategic forensic garrison provenance: explicit General defense, temporary-security/capture/initial controls, objective scope and restart'
);
