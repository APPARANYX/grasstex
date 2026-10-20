#!/usr/bin/env node
'use strict';
// Shipping registry, relief and core restart; controlled scene/roster fixtures, not a full battle.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadModule, quietConsole } = require('./module-loader');
const core = fs.readFileSync(path.join(__dirname, '../../battle/battle-sim.js'), 'utf8');
const from = core.indexOf('  BattleSim.prototype.restart = function () {');
const to = core.indexOf('  BattleSim.prototype.setTimeScale', from);
assert.ok(from > 0 && to > from);
const events = [],
  failures = [];
const root = { GTLog() {} };
function Sim() {
  this._roster = { us: [], ge: [] };
}
Sim.prototype.spawnAll = function () {
  events.push('spawn');
  this._roster = { us: [{ root: { position: { x: -100, y: -900, z: 42 }, dispose() {} } }], ge: [] };
};
new Function('root', 'BattleSim', core.slice(from, to))(root, Sim);
root.BattleSim = {
  start() {
    const sim = new Sim();
    sim.spawnAll();
    return sim;
  },
  heightAt: (x, z) => x / 50 + z / 100,
  buildTerrain() {},
  applyScenarioTerrain() {}
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
loadModule(root, 'battle/modules/46-macro-relief.js', bindings);
root.BattleModules.registerSystem('test-command-reset', {
  afterBattleRosterReset(sim) {
    events.push('commander');
    // The previous wrapper settled after ALL nested command/module reset writes.
    sim._roster.us[0].root.position.y = -700;
    root.BattleModules.runHook('onBattleRestart', sim, {});
  },
  onBattleRestart(sim) {
    events.push('modules');
    sim._roster.us[0].root.position.y = -800;
  }
});
const sim = root.BattleSim.start();
assert.equal(sim.restart, Sim.prototype.restart, 'terrain must not replace the core restart method');
const settled = () => {
  const p = sim._roster.us[0].root.position;
  assert.equal(sim.heightAt, root.BattleMacroRelief.heightAt);
  assert.equal(p.y, sim.heightAt(p.x, p.z));
};
settled();
for (let i = 0; i < 5; i++) {
  const old = sim._roster.us[0];
  events.length = 0;
  sim.heightAt = () => -123;
  assert.equal(sim.restart(), undefined, 'preserve core return value');
  assert.deepEqual(events, ['spawn', 'commander', 'modules']);
  assert.notEqual(sim._roster.us[0], old);
  settled();
}
const system = root.BattleModules.listSystems().find(s => s.id === 'macro-relief');
assert.deepEqual(system.requiredHooks, ['afterBattleRestart']);
const position = sim._roster.us[0].root.position;
const error = new Error('injected terrain settle failure');
Object.defineProperty(position, 'y', {
  set() {
    throw error;
  }
});
assert.throws(
  () => root.BattleModules.runHook('afterBattleRestart', sim, {}),
  e => e === error
);
assert.equal(failures.length, 1);
console.log(
  'PASS core owns terrain restart: nested reset ordering, five cycles, sampler/height restoration, stable method and required failure'
);
