#!/usr/bin/env node
'use strict';
/* Medic effect (module 14, interim until there are medics): the men of a squad in retreat that is at base and out of contact
   slowly regain health, MEDIC_HP_PER_S each, never above maxHp, only while not bleeding; a man who fled for good, a squad
   still walking home and a squad in contact heal nobody; at full health the wound slowing and shot spread are cleared;
   `?medic=0` heals nobody. */
const assert = require('node:assert/strict'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
function fixture(search) {
  H.resetIds();
  const r = H.bootstrap({ search: search || '' }),
    b = H.makeBattle(r, { seed: 12345 });
  const q = H.addSquad(r, b, { id: 'us-1', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 120 } });
  q.state = 'retreat';
  q.inContact = false;
  q._assembly = { phase: 'at-base', since: 0, missionVersion: null };
  q.members.forEach(m => {
    m.hp = m.maxHp - 30;
    m.bleedRate = 0;
  });
  return { r, b, q };
}
function heal(f, seconds) {
  for (let t = 0; t < seconds; t += 0.25) f.r.BattleWounds.medic(f.b, 0.25);
}
let f = fixture('');
assert.equal(f.r.BattleWounds.medicOn(), true);
heal(f, 10);
f.q.members.forEach(m =>
  assert.ok(Math.abs(m.maxHp - 30 + 3 - m.hp) < 1e-6, 'about 0.3 hp per second: ' + m.hp)
);
heal(f, 200);
f.q.members.forEach(m => assert.equal(m.hp, m.maxHp, 'never above full'));
assert.ok(f.b._wounds.stats.healed > 0);
f = fixture('');
const a = f.q.members[0],
  bl = f.q.members[1],
  dead = f.q.members[2];
a.woundSpeed = 0.6;
a.woundSigma = 1.4;
a.hp = a.maxHp - 0.2;
bl.bleedRate = 0.5;
dead.dead = true;
const bl0 = bl.hp;
heal(f, 5);
assert.equal(a.hp, a.maxHp);
assert.equal(a.woundSpeed, 1, 'full health clears the wound slowing');
assert.equal(a.woundSigma, 1);
assert.equal(bl.hp, bl0, 'a bleeding man is not treated');
f = fixture('');
f.q._assembly.phase = 'to-base';
let h0 = f.q.members[0].hp;
heal(f, 10);
assert.equal(f.q.members[0].hp, h0, 'a squad still walking home is not treated');
f = fixture('');
f.q.inContact = true;
h0 = f.q.members[0].hp;
heal(f, 10);
assert.equal(f.q.members[0].hp, h0, 'a squad in contact is not treated');
f = fixture('');
f.q.fledId = 7;
h0 = f.q.members[0].hp;
heal(f, 10);
assert.equal(f.q.members[0].hp, h0, 'a man who fled for good is not treated');
f = fixture('');
f.q.state = 'advance';
h0 = f.q.members[0].hp;
heal(f, 10);
assert.equal(f.q.members[0].hp, h0, 'a squad that is not in retreat is not treated');
f = fixture('?medic=0');
assert.equal(f.r.BattleWounds.medicOn(), false);
h0 = f.q.members[0].hp;
heal(f, 10);
assert.equal(f.q.members[0].hp, h0, 'the control heals nobody');
console.log('PASS medic effect heals a retreated squad at base, slowly, and nobody else');
