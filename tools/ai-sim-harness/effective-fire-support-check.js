#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
function world(search = '') {
  const r = H.bootstrap({ search: '?morale=0&stressAct=0&soldierBeliefs=0&commandPosture=0' + search });
  loadModule(r, 'battle/modules/10-effective-ranges.js', { console: quietConsole });
  loadModule(r, 'battle/movement-resolver.js', { console: quietConsole });
  const b = H.makeBattle(r, { seed: 319, obstacles: [] });
  const q = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: 0,
    objective: { x: 0, z: 180 },
    facing: 0
  });
  const enemy = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 160,
    objective: { x: 0, z: 0 },
    facing: Math.PI
  });
  b.time = 20;
  q.commandPhase = 'assault';
  const target = enemy.members[2];
  target.root.position.x = 0;
  target.root.position.z = 151;
  for (const s of q.members) {
    s.root.position.x = 0;
    s.root.position.z = 0;
    s.root.rotation.y = 0;
    s.target = target;
    s.moving = false;
    s.fireCooldown = 0;
    const e = r.BattleEngagement.stateOf(s);
    e.state = 'engage';
    e.fireReadyAt = 0;
    e.stanceUntil = 100;
    e.reviewAt = 100;
  }
  return { r, b, q, target, E: r.BattleEngagement };
}
const w = world();
const leader = w.q.members.find(s => s.role === 'sergeant');
const rifle = w.q.members.find(s => s.role === 'rifleman');
assert.equal(w.r.SquadAI.engageRange(leader), 150);
assert.equal(w.r.SquadAI.engageRange(rifle), 450);
let report = w.E.updateSquad(w.q, w.b);
assert.ok(!report.fireSupport.includes(leader), 'out-of-range MP40 is not supporting fire');
assert.ok(report.fireSupport.includes(rifle), 'in-range Kar98k provides support to the same target');
assert.equal(w.E.supportReady(leader, w.b), false);
assert.equal(w.E.supportReady(rifle, w.b), true);
for (const [name, alter] of [
  [
    'reload',
    s => {
      s.reloading = true;
    }
  ],
  [
    'jam',
    s => {
      s.weapon.jammed = true;
    }
  ],
  [
    'moving',
    s => {
      s.moving = true;
    }
  ],
  [
    'suppressed',
    (s, b) => {
      s.suppressedUntil = b.time + 1;
    }
  ],
  [
    'dazed',
    s => {
      s.eng.state = 'freeze';
    }
  ],
  [
    'fled',
    s => {
      s.eng.fledPhase = 'wait';
    }
  ],
  [
    'settling',
    (s, b) => {
      s.eng.fireReadyAt = b.time + 1;
    }
  ],
  [
    'wrong facing',
    s => {
      s.root.rotation.y = Math.PI;
    }
  ],
  [
    'no target',
    s => {
      s.target = null;
    }
  ]
]) {
  const x = world(),
    s = x.q.members.find(m => m.role === 'rifleman');
  alter(s, x.b);
  assert.equal(x.E.supportReady(s, x.b), false, name + ' cannot manufacture support');
}
const blocked = world(),
  sr = blocked.q.members.find(s => s.role === 'rifleman');
blocked.r.BattleDirectFireLOSGate = { blockReason: () => 'terrain' };
assert.equal(blocked.E.supportReady(sr, blocked.b), false, 'blocked physical firing line is not support');
const unauth = world('&commandPosture=0'),
  su = unauth.q.members.find(s => s.role === 'rifleman');
unauth.q.fireControl = { state: 'hold' };
assert.equal(unauth.E.supportReady(su, unauth.b), false, 'HOLD cannot manufacture supporting fire');
// Native Engagement yields out-of-range visual hold to the existing squad order.
w.E.updateSoldier(leader, w.b);
assert.ok(
  !leader._movementResolver ||
    !leader._movementResolver.combat ||
    leader._movementResolver.combat.kind !== 'hold',
  'visible out-of-range target creates no ineffective combat hold'
);
const before = w.b.events.fired;
w.E.updateSoldier(rifle, w.b);
assert.ok(w.b.events.fired > before, 'capable rifleman actually returns fire');
// Range boundary: no 20% dead band and no 10% return into impossible firing.
const def = world(),
  sd = def.q.members.find(s => s.role === 'sergeant');
def.q.commandPhase = 'support-hold';
def.q.orderAnchor = { x: -20, z: 0 };
sd.eng.state = 'orient';
sd.eng.until = def.b.time;
def.E.updateSoldier(sd, def.b);
assert.equal(sd.eng.state, 'withdraw', '151m threat invokes existing MP40 break-contact fallback');
def.target.root.position.z = 155;
def.b.time += 0.15;
def.E.updateSoldier(sd, def.b);
assert.equal(sd.eng.state, 'withdraw', 'cannot return to engage while still outside 150m');
def.target.root.position.z = 150;
def.b.time += 0.15;
def.E.updateSoldier(sd, def.b);
assert.equal(sd.eng.state, 'orient', 'exact weapon boundary permits reorientation');
const legacy = world('&effectiveFire=0'),
  sl = legacy.q.members.find(s => s.role === 'sergeant');
assert.ok(
  legacy.E.updateSquad(legacy.q, legacy.b).fireSupport.includes(sl),
  'explicit legacy control retains state-only support'
);
console.log(
  'PASS effective fire support, native returned fire, out-of-range hold and exact-range break-contact'
);
