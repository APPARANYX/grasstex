#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');

function load(root, file) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, file), 'utf8'))(
    root,
    root,
    { log() {}, warn() {} }
  );
}

H.resetIds();
const r = H.bootstrap();
load(r, 'battle/movement-resolver.js');
const b = H.makeBattle(r, { seed: 707, obstacles: [] }),
  us = H.addSquad(r, b, {
    id: 'us-withdraw',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 120 },
    facing: 0
  }),
  ge = H.addSquad(r, b, {
    id: 'ge-target',
    faction: 'ge',
    x: 0,
    z: 400,
    objective: { x: 0, z: 0 },
    facing: Math.PI
  }),
  s = us.members[1],
  foe = ge.members[1],
  E = r.BattleEngagement;

function put(unit, x, z) {
  unit.root.position.x = x;
  unit.root.position.z = z;
}

b.time = 20;
put(s, 0, 0);
const range = r.SquadAI.engageRange(s);
put(foe, 0, range * 1.6);
us.state = 'advance';
us.commandPhase = 'support-hold';
us.orderAnchor = { x: -24, z: 0 };
us.rally = { x: -24, z: 0 };
s.target = foe;
let e = E.stateOf(s);
e.state = 'orient';
e.until = b.time;

E.updateSoldier(s, b);
assert.equal(e.state, 'withdraw', 'out-of-range/no-cover decision enters local withdrawal');
assert.deepEqual(e.withdrawPoint, us.orderAnchor, 'local withdrawal snapshots the squad anchor');
assert.ok(s._movementResolver && s._movementResolver.combat, 'withdrawal publishes combat movement');
assert.equal(s._movementResolver.combat.kind, 'withdraw');
assert.deepEqual(s._movementResolver.combat.intentPoint, us.orderAnchor);

b.time += 0.15;
E.updateSoldier(s, b);
assert.equal(e.state, 'withdraw', 'local withdrawal remains a real state across ticks');
assert.equal(
  s._movementResolver.combat.kind,
  'withdraw',
  'resolver continues receiving the break-contact move'
);

put(foe, 0, range * 0.8);
b.time += 0.15;
E.updateSoldier(s, b);
assert.equal(e.state, 'orient', 'closing back into effective range ends the local withdrawal');
assert.equal(e.withdrawPoint, null, 'leaving withdrawal clears the local break-contact point');

s.target = null;
us.state = 'advance';
e.state = 'withdraw';
e.withdrawPoint = null;
b.time += 0.15;
E.updateSoldier(s, b);
assert.equal(e.state, 'advance', 'a finished squad retreat exits the Engagement withdraw state');

console.log('PASS local break-contact owns movement and retreat exit clears stale withdraw state');
