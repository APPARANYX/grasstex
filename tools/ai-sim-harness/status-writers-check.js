#!/usr/bin/env node
'use strict';
/* The two soldier status timers that used to be written from several layers now have one writer each
   (phase 2c): `suppressedUntil` (until when fire has him pinned) is written by SquadAI.pin, and
   `_combatUrgentUntil` (until when he moves with urgency) by BattleEngagement.markUrgent / clearUrgent.
   state-ownership-check.js holds that in the source; this holds what the writers do:

   - pin sets now + seconds for a man who was free, extends a hold and never shortens one;
   - area fire pins every enemy inside its spread for the suppressive hold, and no one outside it;
   - a wound that does not drop a man pins him for the shock hold, through the same writer;
   - markUrgent sets now + seconds (an assignment: the assault rush renews it every tick) and clearUrgent
     zeroes it. Mechanism, not dice. */
const assert = require('node:assert/strict'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}

function world() {
  H.resetIds();
  const r = H.bootstrap();
  const b = H.makeBattle(r);
  const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  const ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 200, objective: { x: 0, z: 0 } });
  b.time = 10;
  return { r, b, S: r.SquadAI, E: r.BattleEngagement, us, ge };
}

test('pin holds a free man for the seconds it is given, extends a hold, and never shortens one', () => {
  const { b, S, us } = world(),
    s = us.members[0];
  assert.equal(typeof S.pin, 'function');
  assert.equal(s.suppressedUntil, 0, 'a fresh man is not pinned');
  S.pin(s, b, 1.3);
  assert.equal(s.suppressedUntil, 11.3);
  S.pin(s, b, 0.5);
  assert.equal(s.suppressedUntil, 11.3, 'a shorter hold does not cut the longer one');
  b.time = 10.5;
  S.pin(s, b, 1.3);
  assert.equal(s.suppressedUntil, 11.8, 'a later, longer hold extends it');
  assert.equal(
    S.SUPPRESSION_TIME,
    1.3,
    'the suppressive round hold is the SquadAI constant, not a second literal'
  );
});

test('area fire pins the enemies inside its spread for the suppressive hold and no one else', () => {
  const { b, S, us, ge } = world();
  const gunner = us.members.find(s => s.role === 'gunner');
  gunner.root.position.x = 0;
  gunner.root.position.z = 0;
  ge.members.forEach((s, i) => {
    s.root.position.x = i < 5 ? i : 60 + i;
    s.root.position.z = 120;
  });
  const point = { x: 2, z: 120 };
  assert.ok(S.canSuppress(gunner, point, b), 'the gunner can fire on that point');
  const hit = S.areaFire(gunner, point, b);
  assert.ok(hit > 0);
  const hold = S.SUPPRESSION_TIME * (gunner.weapon.stats.suppressive ? 1.25 : 0.85);
  const pinned = ge.members.filter(s => s.suppressedUntil > 0);
  assert.equal(pinned.length, hit);
  pinned.forEach(s =>
    assert.ok(Math.abs(s.suppressedUntil - (b.time + hold)) < 1e-9, 'held for ' + hold + ' s')
  );
  assert.ok(
    ge.members.filter(s => s.suppressedUntil === 0).length > 0,
    'men outside the spread are not pinned'
  );
});

test('a wound that does not drop a man pins him for the shock hold through the same writer', () => {
  const { r, b, us, ge } = world();
  const shooter = ge.members.find(s => s.role === 'rifleman'),
    men = us.members.filter(s => s.role === 'rifleman');
  let wounded = 0;
  for (const victim of men) {
    victim.hp = 1e6;
    const out = r.BattleWounds.wound(shooter, victim, b, { zone: 'arm', energy: 0.05 });
    if (!out || out.outcome !== 'wounded') continue;
    wounded++;
    assert.ok(Math.abs(victim.suppressedUntil - (b.time + 1.2)) < 1e-9, 'pinned for the wound shock, 1.2 s');
  }
  assert.ok(wounded > 0, 'at least one rifleman was wounded and stayed up');
});

test('markUrgent sets now + seconds, clearUrgent zeroes it', () => {
  const { b, E, us } = world(),
    s = us.members[0];
  assert.equal(typeof E.markUrgent, 'function');
  E.markUrgent(s, b, 0.5);
  assert.equal(s._combatUrgentUntil, 10.5);
  b.time = 10.2;
  E.markUrgent(s, b, 0.5);
  assert.equal(s._combatUrgentUntil, 10.7, 'an assignment, renewed every tick by the assault rush');
  E.clearUrgent(s);
  assert.equal(s._combatUrgentUntil, 0);
});

console.log('status-writers-check: ' + n + ' passed');
