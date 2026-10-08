#!/usr/bin/env node
'use strict';
/* A man who fled with his pistol in his hands (BattleWeapons.abandon drops the primary and the holstered
   sidearm, whichever one is drawn) and is issued his loadout again at base (SquadAI.rearm) is a man with
   his primary in his hands and the pistol holstered. Module 47 kept `_sidearmSince` across the flight, so
   its next step "put away" the pistol he no longer had: it equipped his new holstered sidearm and left him
   fighting with the pistol as his primary. A fresh deal carries no drawn-sidearm state. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}

H.resetIds();
const r = H.bootstrap();
r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
load(r, 'battle/modules/46-ammunition-stoppages.js');
load(r, 'battle/modules/10-effective-ranges.js');
load(r, 'battle/modules/47-sidearm-switch.js');
const b = H.makeBattle(r, { seed: 4 }),
  us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } }),
  ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 200, objective: { x: 0, z: -100 } });
[...us.members, ...ge.members].forEach(s => r.BattleAmmunition.initialize(s, b));
const mg = us.members.find(s => s.role === 'gunner'),
  foe = ge.members[0];
foe.root.position.x = mg.root.position.x;
foe.root.position.z = mg.root.position.z + 5;
mg.target = foe;
const primary = mg.weapon.kind;
b.time += H.AI_TICK;
r.BattleSidearm.step(mg, b);
assert.notEqual(mg.weapon.kind, primary, "at arm's length the gunner draws his pistol");
assert.ok(mg._sidearmSince != null, 'the draw is on record');

assert.ok(r.BattleWeapons.abandon(mg), 'he flees and leaves his weapons');
b.time += 60;
assert.equal(r.SquadAI.rearm(mg, null, b), true, 'at base he is issued his loadout again');
assert.equal(mg.weapon.kind, primary, 'the fresh deal puts his primary in his hands');
assert.ok(mg.secondary, 'and the pistol in the holster');

mg.target = null;
b.time += H.AI_TICK;
r.BattleSidearm.step(mg, b);
b.time += H.AI_TICK;
r.BattleSidearm.step(mg, b);
assert.equal(mg.weapon.kind, primary, 'no stale draw puts the pistol in the hands of a re-armed man');
assert.equal(r.BattleSidearm.stats(b).returns, 0, 'nothing is "put away"');
console.log('PASS a re-armed man does not inherit the sidearm drawn before he fled');
