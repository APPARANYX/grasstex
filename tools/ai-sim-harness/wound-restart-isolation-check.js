#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const systems = {};
const root = {
  console: { log() {}, warn() {}, error() {} },
  location: { search: '' },
  GTMath: {
    clamp(value, low, high) {
      return Math.max(low, Math.min(high, value));
    }
  },
  SquadAI: {
    extend() {},
    pin() {}
  },
  BattleModules: {
    registerSystem(id, spec) {
      systems[id] = spec;
    }
  }
};
root.window = root;
root.globalThis = root;

const file = path.join(__dirname, '..', '..', 'battle', 'modules', '14-wound-model.js');
vm.createContext(root);
vm.runInContext(fs.readFileSync(file, 'utf8'), root, { filename: file });

const wound = systems['wound-model'];
assert.ok(wound, 'wound model should register its lifecycle hooks');

const soldier = {
  id: 37,
  hp: 50,
  maxHp: 100,
  dead: false,
  bleedRate: 0,
  woundSpeed: 0.8,
  woundSigma: 1.2
};
const squad = {
  state: 'retreat',
  fledId: null,
  inContact: false,
  _assembly: { phase: 'at-base' },
  members: [soldier]
};
soldier.squad = squad;

const sim = {
  time: 0,
  _medicClock: 0.45,
  factions: {
    us: { squads: [squad] },
    ge: { squads: [] }
  }
};

wound.onBattleRestart(sim, {});
assert.equal(sim._medicClock, 0, 'restart must clear the prior battle medic remainder');

wound.onSimulationStep(sim, { dt: 0.6 });
assert.equal(
  soldier.hp,
  50,
  'a restarted battle must not heal before a fresh one-second medic interval has elapsed'
);
assert.equal(sim._medicClock, 0.6, 'the new battle should own only its own elapsed medic time');

wound.onSimulationStep(sim, { dt: 0.45 });
assert.ok(soldier.hp > 50, 'healing should resume once the fresh battle reaches its medic interval');
assert.equal(sim._medicClock, 0, 'the medic accumulator should wrap after the fresh interval');

console.log('PASS wound-model restart owns and resets medic timing state');
