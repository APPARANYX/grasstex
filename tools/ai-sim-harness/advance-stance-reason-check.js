#!/usr/bin/env node
'use strict';
/* Loop Watch's posture-churn diagnosis reads the reason on each committed stance change. An advancing
   man's changes all used to read as the generic "state:advance", so a squad following contact up and
   down could not be told apart from a real stand/crouch flutter. Advance now names why he is low
   (the squad is on the enemy's heels, or the quiet-gap grace after it) or standing (a quiet march).
   Reasons are diagnostic only: this changes no stance. */
const assert = require('node:assert/strict'),
  H = require('./harness');

function oneMan() {
  H.resetIds();
  const r = H.bootstrap({ search: '?soldierBeliefs=0&commandPosture=0&commandMovement=0&commandRelay=0' }),
    b = H.makeBattle(r),
    q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 200 } });
  H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 120, objective: { x: 0, z: 0 } });
  return { r, b, s: q.members.find(m => m.role === 'rifleman') };
}

const { r, b, s } = oneMan(),
  E = r.BattleEngagement;
s.target = null;
s.eng = null;
E.stateOf(s).stanceUntil = 0;
s.squad.inContact = false;
E.updateSoldier(s, b);
assert.equal(s.eng.state, 'advance');
assert.equal(s.eng.stance, 'stand', 'a quiet march stands');
b.time += 2;
s.squad.inContact = true;
E.updateSoldier(s, b);
assert.equal(s.eng.stance, 'crouch', 'the squad is on the enemy: low');
b.time += 4;
s.squad.inContact = false;
s.suppressedUntil = 0;
E.updateSoldier(s, b);
assert.equal(s.eng.stance, 'stand', 'contact gone and the grace spent: up again');
assert.deepEqual(
  s.eng.stanceTrail.map(x => x.reason),
  ['advance:contact-low', 'advance:quiet'],
  'advance stance changes name why he is low or standing'
);
console.log('PASS advance stance changes carry their reason');
