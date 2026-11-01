#!/usr/bin/env node
'use strict';
// Shipping core restart, registry and full Commander module; roster, routes, objectives and scene
// are controlled fixtures. Full battle equivalence is tested by the GitHub standard benchmark.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadModule, quietConsole } = require('./module-loader');
const core = fs.readFileSync(path.join(__dirname, '../../battle/battle-sim.js'), 'utf8');
const from = core.indexOf('  BattleSim.prototype.restart = function () {');
const to = core.indexOf('  BattleSim.prototype.setTimeScale', from);
assert.ok(from > 0 && to > from);
function fixture() {
  const events = [],
    failures = [];
  const root = { GTLog() {}, SquadAI: {} };
  function Sim(scene) {
    this.scene = scene;
    this.time = 0;
    this.timeScale = 1;
    this.timeLimit = 600;
    this._roster = { us: [], ge: [] };
    this.factions = { us: { alive: 1, squads: [] }, ge: { alive: 1, squads: [] } };
  }
  Sim.prototype._checkWinner = function () {};
  Sim.prototype.spawnAll = function () {
    events.push('roster');
    this._roster = { us: [], ge: [] };
  };
  new Function('root', 'BattleSim', core.slice(from, to))(root, Sim);
  root.BattleSim = { start: scene => new Sim(scene) };
  root.BattleCommanderRoutes = {
    initForce(sim, faction, town) {
      events.push('force:' + faction + ':' + town.id);
    }
  };
  root.BattleCommanderDoctrine = { policyFor: () => ({ decisionSnapshotSeconds: 5 }), forceUnits: () => [] };
  root.BattleObjectiveSystem = {
    definitionsFromTown: town => town.id,
    attach(sim, id) {
      events.push('attach:' + id);
      sim._objectives = [];
    },
    reset(sim, id) {
      events.push('reset:' + id);
    },
    tick() {}
  };
  const bindings = {
    console: {
      ...quietConsole,
      error(...args) {
        failures.push(args);
      }
    }
  };
  loadModule(root, 'battle/module-registry.js', bindings);
  loadModule(root, 'battle/commander-ai.js', bindings);
  root.BattleModules.registerSystem('test-observer', {
    beforeBattleRestart(sim) {
      events.push('before:' + (sim._generals ? sim._generals.us.wakeCount : 'none'));
    },
    onBattleStart(sim, payload) {
      assert.ok(sim._generals);
      events.push('start:' + payload.town.id);
    },
    onBattleRestart(sim, payload) {
      assert.equal(sim._generals.us.wakeCount, 0);
      events.push('ready:' + payload.town.id);
    },
    onCommanderTick(sim, payload) {
      events.push('tick:' + payload.town.id);
    }
  });
  const scene = town => ({
    metadata: town ? { battleScenario: town } : {},
    onBeforeRenderObservable: { add() {} },
    getEngine: () => ({ getDeltaTime: () => 16 })
  });
  return { root, events, failures, Sim, scene };
}
for (const enabled of [true, false]) {
  const { root, events, Sim, scene } = fixture();
  const townA = { id: 'a' },
    townB = { id: 'b' };
  const s = scene(townA);
  const sim = root.BattleSim.start(s, { macroCommandEnabled: enabled });
  assert.deepEqual(events, ['attach:a', 'force:us:a', 'force:ge:a', 'start:a']);
  assert.equal(sim.restart, Sim.prototype.restart, 'Commander must not wrap the core restart');
  for (let cycle = 0; cycle < 3; cycle++) {
    events.length = 0;
    const oldGeneral = sim._generals;
    sim._generals.us.wakeCount = 99;
    sim._commandAccum = 42;
    sim._nextDecisionSnapshot = 44;
    sim._objectiveRecovery.us.count = 8;
    sim._macroMissionState.wakeCount = 9;
    s.metadata = { battleScenario: townB };
    sim.restart();
    assert.deepEqual(events, ['before:99', 'roster', 'reset:b', 'force:us:b', 'force:ge:b', 'ready:b']);
    assert.notEqual(sim._generals, oldGeneral);
    assert.notEqual(sim._generals.us, sim._generals.ge);
    assert.equal(sim._commandAccum, 0);
    assert.equal(sim._nextDecisionSnapshot, 0);
    assert.equal(sim._objectiveRecovery.us.count, 0);
    assert.equal(sim._macroMissionState.wakeCount, 0);
    assert.equal(sim.macroCommandEnabled, enabled);
    assert.equal(sim.restart, Sim.prototype.restart);
  }
  sim.macroCommandEnabled = !enabled;
  sim.restart();
  assert.equal(sim.macroCommandEnabled, !enabled, 'restart preserves the current operator toggle');
  // Metadata can disappear between regenerations; preserve the last valid scenario as before.
  s.metadata = {};
  events.length = 0;
  sim.restart();
  assert.ok(events.includes('ready:b'));
  sim.macroCommandEnabled = false;
  sim._liveCommanderTick(0.45);
  assert.ok(events.includes('tick:b'), 'Commander scheduler must consume the restarted scenario');
  const other = root.BattleSim.start(scene(townA), { macroCommandEnabled: false });
  const otherGeneral = other._generals;
  sim.restart();
  assert.equal(other._generals, otherGeneral, 'restarting one battle must not reset another');
  events.length = 0;
  other._liveCommanderTick(0.45);
  assert.ok(events.includes('tick:a'));
  // Required initialization failures must escape the dispatcher and skip restart-complete hooks.
  const failure = new Error('objective reset failed');
  root.BattleObjectiveSystem.reset = () => {
    throw failure;
  };
  events.length = 0;
  assert.throws(
    () => sim.restart(),
    error => error === failure
  );
  assert.ok(events.includes('roster'));
  assert.ok(!events.some(e => e.startsWith('ready:')));
}
{
  const { root, failures } = fixture();
  let tail = 0;
  const error = new Error('hook fixture');
  const bareScene = { metadata: {}, onBeforeRenderObservable: { add() {} } };
  const bare = root.BattleSim.start(bareScene);
  bare.restart();
  assert.equal(bare._generals, undefined, 'a scenario-less battle must not gain Commander state');
  root.BattleModules.registerSystem('failure-fixture', {
    requiredHooks: ['requiredProbe'],
    requiredProbe() {
      throw error;
    },
    optionalProbe() {
      throw error;
    }
  });
  root.BattleModules.registerSystem('z-tail', {
    requiredProbe() {
      tail++;
    },
    optionalProbe() {
      tail++;
    }
  });
  root.BattleModules.runHook('optionalProbe', {}, {});
  assert.equal(tail, 1, 'observational failure logs and continues');
  assert.equal(failures.length, 1);
  assert.throws(
    () => root.BattleModules.runHook('requiredProbe', {}, {}),
    e => e === error
  );
  assert.equal(tail, 1, 'required failure stops dispatch and preserves the original error');
}
console.log(
  'PASS core-owned Commander restart: shared setup, ordering, scenarios, Macro modes, repeat cycles, battle isolation and required/observational failures'
);
