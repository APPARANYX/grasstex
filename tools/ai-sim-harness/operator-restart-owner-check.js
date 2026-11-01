#!/usr/bin/env node
'use strict';
// Shipping registry, full operator module and core restart; DOM/roster/telemetry are controlled fixtures.
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
const display = {
  banner: { style: { display: 'flex' } },
  bannerContinue: { hidden: false },
  aiTestStatus: { textContent: 'old' }
};
const document = { getElementById: id => display[id] || null };
const root = { GTLog() {}, BattleAIPolicy: { revision: 7 } };
function Sim(scene) {
  this.scene = scene;
  this._roster = { us: [], ge: [] };
  this.factions = { us: { alive: 1 }, ge: { alive: 1 } };
  this.timeLimit = 600;
  this.paused = false;
}
Sim.prototype.spawnAll = function () {
  events.push('roster');
  this._roster = { us: [], ge: [] };
  this.time = 0;
  this.winner = null;
  this.timeLimit = 600;
};
new Function('root', 'BattleSim', core.slice(from, to))(root, Sim);
root.BattleSim = { start: scene => new Sim(scene) };
root.BattleTelemetry = {
  ensure() {},
  record() {},
  end(sim, reason) {
    events.push('end:' + reason);
  },
  start(sim, kind, data) {
    assert.equal(display.banner.style.display, 'none');
    events.push('start:' + data.scenarioId);
  }
};
const bindings = {
  localStorage: {
    getItem() {
      return null;
    }
  },
  document,
  console: {
    ...quietConsole,
    error(...args) {
      failures.push(args);
    }
  }
};
loadModule(root, 'battle/module-registry.js', bindings);
loadModule(root, 'battle/battle-control.js', bindings);
root.BattleModules.registerSystem('test-command-reset', {
  afterBattleRosterReset() {
    events.push('commander');
  }
});
root.BattleModules.registerSystem('test-terrain-reset', {
  requiredHooks: ['afterBattleRestart'],
  afterBattleRestart() {
    events.push('terrain');
  }
});
const scene = { metadata: { battleScenario: { id: 'a', seed: 'seed-a' } } };
const sim = root.BattleSim.start(scene);
assert.equal(sim.restart, Sim.prototype.restart, 'operator cannot wrap public restart');
sim._operatorTimeLimitSeconds = 1260;
for (const state of [
  { paused: false, manualEnded: false },
  { paused: true, manualEnded: false },
  { paused: true, manualEnded: true }
]) {
  for (let cycle = 0; cycle < 3; cycle++) {
    Object.assign(sim, state, { timeLimit: 17, winner: 'us' });
    events.length = 0;
    display.banner.style.display = 'flex';
    display.bannerContinue.hidden = false;
    assert.equal(sim.restart(), undefined);
    assert.deepEqual(events, ['end:restart', 'roster', 'commander', 'terrain', 'start:a']);
    assert.equal(sim.timeLimit, 1260);
    assert.equal(sim.manualEnded, false);
    assert.equal(sim.paused, state.paused && !state.manualEnded);
    assert.equal(display.banner.style.display, 'none');
    assert.equal(display.bannerContinue.hidden, true);
    assert.match(display.aiTestStatus.textContent, /genome r7/);
  }
}
// Existing benchmark/trainer entry skips ONLY operator finalization, preserving the same core reset.
Object.assign(sim, { manualEnded: true, paused: true, timeLimit: 17 });
events.length = 0;
display.banner.style.display = 'flex';
display.bannerContinue.hidden = false;
sim._controlRawRestart();
assert.deepEqual(events, ['roster', 'commander', 'terrain']);
assert.equal(sim.manualEnded, true);
assert.equal(sim.paused, true);
assert.equal(sim.timeLimit, 600);
assert.equal(display.banner.style.display, 'flex');
assert.equal(display.bannerContinue.hidden, false);
// A failed required reset cannot advertise a new telemetry session or hide the old banner.
const error = new Error('injected required reset failure');
root.BattleModules.registerSystem('test-failure', {
  requiredHooks: ['afterBattleRestart'],
  afterBattleRestart() {
    throw error;
  }
});
events.length = 0;
assert.throws(
  () => sim.restart(),
  e => e === error
);
assert.equal(events[0], 'end:restart');
assert.ok(!events.some(e => e.startsWith('start:')));
assert.equal(display.banner.style.display, 'flex');
assert.equal(failures.length, 1);
console.log(
  'PASS core owns operator restart: ordered telemetry/terrain, pause/terminal/duration/banner contracts, nine cycles, raw bypass and required failure'
);
