#!/usr/bin/env node
'use strict';
// Execute the shipping registry, clock and core restart body. Spawning/rendering are fixtures;
// this checks reset ownership/order, not geometry, animation or a full browser battle.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const rootPath = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(rootPath, 'battle', name), 'utf8');
const core = read('battle-sim.js');
const start = core.indexOf('  BattleSim.prototype.restart = function () {');
const end = core.indexOf('  BattleSim.prototype.setTimeScale', start);
assert.ok(start > 0 && end > start);
function world(search) {
  const root = { GTLog() {} };
  const observers = [];
  const scene = {
    onBeforeRenderObservable: {
      add(fn) {
        observers.push(fn);
        return fn;
      },
      remove(fn) {
        observers.splice(observers.indexOf(fn), 1);
      }
    }
  };
  function Sim() {
    this._roster = { us: [], ge: [] };
    this.timeScale = 1;
    this.spawnCount = 0;
    this._renderObserver = scene.onBeforeRenderObservable.add(() => {});
  }
  Sim.prototype.step = function () {};
  Sim.prototype.spawnAll = function () {
    if (this._fixedClock) {
      assert.equal(this._fixedClock.stats.pendingSeconds, 0, 'clock debt reset before roster replacement');
      assert.equal(this._fixedClock.stats.totalSteps, 0, 'clock counters reset before roster replacement');
    }
    this.spawnCount++;
  };
  new Function('root', 'BattleSim', core.slice(start, end))(root, Sim);
  root.BattleSim = { AI_TICK: 0.15, start: () => new Sim() };
  new Function('window', read('module-registry.js'))(root);
  new Function('window', 'location', read('modules/00-fixed-step-clock.js'))(root, { search });
  return { root, sim: root.BattleSim.start(scene), observers, restart: Sim.prototype.restart };
}
for (const search of ['', '?fixedClock=all', '?fixedClock=0']) {
  const { root, sim, observers, restart } = world(search);
  const clock = sim._fixedClock;
  const observerCount = observers.length;
  for (let i = 0; i < 5; i++) {
    if (clock) {
      clock.advance(3.1);
      assert.ok(clock.stats.pendingSeconds > 0);
      assert.ok(clock.stats.totalSteps > 0);
    }
    sim.restart();
    assert.equal(observers.length, observerCount, 'restart must not replace or add render observers');
    if (clock) {
      assert.equal(clock.stats.backloggedFrames, 0);
      assert.equal(clock.stats.lastSteps, 0);
    }
  }
  assert.equal(sim.spawnCount, 5);
  assert.equal(sim.restart, restart, 'clock must use the core restart lifecycle, without a wrapper');
  assert.equal(root.BattleModules.listSystems().filter(s => s.id === 'fixed-step-clock').length, 1);
}
const first = world('');
const second = world('');
first.sim._fixedClock.advance(3.1);
second.sim._fixedClock.advance(3.1);
first.sim.restart();
assert.ok(second.sim._fixedClock.stats.pendingSeconds > 0, 'restart must not reset another battle clock');
console.log(
  'PASS fixed clock uses core restart hook: default/forced/disabled, debt before respawn, five cycles, stable observers and battle isolation'
);
