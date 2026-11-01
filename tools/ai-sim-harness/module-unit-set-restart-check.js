#!/usr/bin/env node
'use strict';
/* A restart replaces sim._moduleUnits; the membership Set must not keep the old roster alive. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');

const r = { GTLog() {} };
new Function('window', fs.readFileSync(path.join(H.REPO, 'battle/module-registry.js'), 'utf8'))(r);
const sim = {},
  oldMan = { id: 1 },
  newMan = { id: 2 };
r.BattleModules.addUnit(sim, oldMan, { unitType: 'infantry' });
sim._moduleUnits = []; // what spawnAll and the trainer's reset do
r.BattleModules.addUnit(sim, newMan, { unitType: 'infantry' });
assert.deepEqual(sim._moduleUnits, [newMan], 'the array holds only the new roster');
assert.equal(sim._moduleUnitSet.has(oldMan), false, 'the Set no longer retains the old soldier');
assert.equal(sim._moduleUnitSet.size, 1);
r.BattleModules.addUnit(sim, newMan, { unitType: 'infantry' });
assert.equal(sim._moduleUnits.length, 1, 'a unit already registered is not added twice');
console.log('PASS module unit Set follows a restart');
