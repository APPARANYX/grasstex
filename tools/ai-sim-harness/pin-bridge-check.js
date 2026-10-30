#!/usr/bin/env node
'use strict';
/* Default-on PinBridge: real aimed/area bursts carry the pin through the next
   trigger window plus 0.6s, while ?pinBridge=0 restores the legacy hold. */
const assert = require('node:assert/strict'),
  H = require('./harness');

function world(search) {
  H.resetIds();
  const r = H.bootstrap({ search }),
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
  /* Make the intended aim target survive even a lucky shot: the comparison
     concerns suppression timing, not RNG-dependent lethal wound outcomes. */
  target.hp = 1e6;
  shooter.fireCooldown = 0;
  target.suppressedUntil = 0;
  return { r, b, shooter, target, S: r.SquadAI };
}

function pinAfter(search, how) {
  const w = world(search),
    p = { x: w.target.root.position.x, z: w.target.root.position.z };
  w.b.time = 5;
  let rounds = 0;
  const oldOnFire = w.b.onFire;
  w.b.onFire = function () {
    rounds++;
    if (oldOnFire) return oldOnFire.apply(this, arguments);
  };
  if (how === 'area') w.S.areaFire(w.shooter, p, w.b);
  else {
    w.shooter.target = w.target;
    assert.equal(w.S.tryFire(w.shooter, w.b), true, 'aimed trigger accepted');
  }
  return {
    left: w.target.suppressedUntil - w.b.time,
    cooldown: w.shooter.fireCooldown,
    holdScale:
      w.r.BattleSoldierStats && w.r.BattleSoldierStats.scale
        ? w.r.BattleSoldierStats.scale(w.target, 'hold')
        : 1,
    rounds,
    dead: w.target.dead
  };
}
for (const how of ['area', 'aimed']) {
  const disabled = pinAfter('?stressAct=0&pinBridge=0', how),
    baseline = pinAfter('?stressAct=0', how),
    explicitOn = pinAfter('?stressAct=0&pinBridge=1', how);
  for (const arm of [disabled, baseline, explicitOn]) {
    assert.ok(arm.rounds > 0, how + ': a real round was discharged');
    assert.ok(!arm.dead, how + ': target remained alive');
  }
  assert.ok(
    baseline.left >= (baseline.cooldown + 0.6) * baseline.holdScale - 1e-6,
    how + ': pin spans the trigger cooldown plus tail (fortitude-scaled)'
  );
  assert.ok(
    baseline.left > disabled.left + 1e-6,
    how + ': default-on pin exceeds the legacy hold'
  );
  assert.ok(
    Math.abs(baseline.left - explicitOn.left) < 1e-9,
    how + ': explicit on and shipping default are identical'
  );
}
console.log('PASS PinBridge is default-on with verified explicit opt-out and fire evidence');
