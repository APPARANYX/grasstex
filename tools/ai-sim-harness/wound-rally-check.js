#!/usr/bin/env node
'use strict';
/* A retreated squad of 5-9 men is too big for the reconstitution pool (1-4 men), so morale recovery is its only road
   back. Wounds leave a permanent stress floor (Soldier Mind), so a squad whose mean stress sits above the rally line
   only because of that floor never rallied (v420 live battle: us-1, 5 men at base for 330 s; sim: a 6-man squad
   at base 430 s with stress frozen at 0.368 on a floor of 0.265). The rally gate reads stress net of the floor for any
   retreated squad; `?woundRally=0` is the old gate (rebuilt squads only). */
const assert = require('node:assert/strict'),
  H = require('./harness');
function fixture(search, stress, floor) {
  H.resetIds();
  const r = H.bootstrap({ search: search || '' }),
    b = H.makeBattle(r, { seed: +(process.env.HARNESS_SEED || 12345) });
  const q = H.addSquad(r, b, { id: 'us-1', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 120 } });
  r.BattleSoldierMind = r.BattleSoldierMind || {};
  r.BattleSoldierMind.squadStress = () => stress;
  r.BattleSoldierMind.squadFloor = () => floor;
  r.BattleSoldierMind.teamStress = () => stress;
  r.BattleSoldierMind.leadStress = () => stress;
  const leader = r.SquadAI.leaderOf(q);
  q.members
    .filter(m => m !== leader)
    .slice(0, 4)
    .forEach(m => {
      m.dead = true;
    });
  q.state = 'retreat';
  q.inContact = false;
  const live = q.members.filter(m => !m.dead);
  assert.equal(live.length, 6);
  live.forEach((m, i) => {
    m.root.position.x = i % 2 ? -3 : 3;
    m.root.position.z = 80 + Math.floor(i / 2) * 3;
  });
  return { r, b, q, live };
}
function run(f) {
  f.b.time = 1;
  f.r.SquadAI.updateSquad(f.q, f.b);
  const p = f.q._moraleRallyPoint;
  if (p)
    f.live.forEach((m, i) => {
      m.root.position.x = p.x + ((i % 3) - 1) * 0.5;
      m.root.position.z = p.z + (Math.floor(i / 3) - 0.5) * 0.5;
    });
  for (let t = 1.2; t < 12; t += 0.3) {
    f.b.time = t;
    f.r.SquadAI.updateSquad(f.q, f.b);
  }
  return f.q.state;
}
// stress 0.37 on a 0.27 floor: net 0.10 is under the 0.15 rally line, raw 0.37 is not
assert.equal(
  run(fixture('', 0.37, 0.27)),
  'advance',
  'a wound-floor-pinned 6-man squad rallies and resumes the mission'
);
assert.equal(
  run(fixture('?woundRally=0', 0.37, 0.27)),
  'retreat',
  'the control keeps the old gate: pinned in retreat'
);
// stress that is not the floor still holds a squad in retreat
assert.equal(run(fixture('', 0.5, 0.27)), 'retreat', 'real stress above the floor still blocks the rally');
// no wounds: unchanged
assert.equal(run(fixture('', 0.37, 0)), 'retreat', 'unwounded but shaken men do not rally on the floor rule');
console.log('PASS retreated 5-9 man squads rally on stress net of wound floors');
