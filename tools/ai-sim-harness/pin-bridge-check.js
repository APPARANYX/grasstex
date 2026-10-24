#!/usr/bin/env node
'use strict';
/* ?pinBridge=1: a rifleman's aimed burst and area fire pin until his next trigger pull plus a tail. */
const assert = require('node:assert/strict'),
  H = require('./harness');
function world(search) {
  H.resetIds();
  const r = H.bootstrap({ search: search }),
    b = H.makeBattle(r, { seed: 77 }),
    us = H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: 0,
      objective: { x: 0, z: 100 },
      composition: ['rifleman']
    }),
    ge = H.addSquad(r, b, {
      id: 'ge-0',
      faction: 'ge',
      x: 0,
      z: 40,
      objective: { x: 0, z: -100 },
      composition: ['rifleman']
    }),
    shooter = us.members[0],
    target = ge.members[0];
  shooter.root.position.x = 0;
  shooter.root.position.z = 0;
  target.root.position.x = 0;
  target.root.position.z = 40;
  shooter.fireCooldown = 0;
  target.suppressedUntil = 0;
  return { r, b, shooter, target, S: r.SquadAI };
}
function pinAfter(search, how) {
  const w = world(search),
    p = { x: w.target.root.position.x, z: w.target.root.position.z };
  w.b.time = 5;
  if (how === 'area') w.S.areaFire(w.shooter, p, w.b);
  else {
    w.shooter.target = w.target;
    w.S.tryFire(w.shooter, w.b);
  }
  return { left: w.target.suppressedUntil - w.b.time, cooldown: w.shooter.fireCooldown, dead: w.target.dead };
}
for (const how of ['area', 'aimed']) {
  const off = pinAfter('?stressAct=0', how),
    on = pinAfter('?stressAct=0&pinBridge=1', how);
  if (on.dead) continue;
  assert.ok(on.left >= on.cooldown + 0.6 - 1e-6, how + ': pin covers the next trigger pull plus a tail');
  assert.ok(
    on.left > off.left + 1e-6,
    how + ': longer than the old hold (' + off.left + ' -> ' + on.left + ')'
  );
}
console.log('PASS pinBridge pins through the shooter gap');
