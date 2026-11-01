#!/usr/bin/env node
'use strict';
/* A retreat sets Engagement 'withdraw'; its end must clear it even for a man who still holds an
   adopted HOLD from before the retreat (a leaderless or out-of-earshot man never hears a
   replacement order). ?retreatPosture=0 restores the old behavior. */
const assert = require('node:assert/strict'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));

function world(search) {
  H.resetIds();
  const r = H.bootstrap({ search: search || '?stressAct=0&fireControl=1&commandPosture=1', stats: true });
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  const b = H.makeBattle(r, { seed: 91 });
  const us = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 200 },
    facing: 0
  });
  const ge = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: 100,
    objective: { x: 0, z: -200 },
    facing: Math.PI
  });
  const foe = ge.members[0];
  ge.members.slice(1).forEach(s => (s.dead = true));
  us.commandPhase = 'assault';
  us.members.forEach(s => {
    s.target = foe;
    s.moving = false;
    s.moveSpeed = 0;
    s.suppressedUntil = 0;
  });
  us.contact = {
    unit: foe,
    x: foe.root.position.x,
    z: foe.root.position.z,
    at: b.time,
    seenBy: us.members[2].id,
    stance: 'stand',
    firstHandAt: b.time
  };
  return { r, b, us, E: r.BattleEngagement, Q: r.BattleSquadStability, C: r.BattleCommandReception };
}

function staleCase(search) {
  const w = world(search),
    man = w.us.members[4];
  w.Q.fireAndMovement(w.us, w.b);
  w.b.time = w.C.snapshot(man, w.b).records['posture-fire|squad'].adoptedAt + 0.01;
  assert.equal(
    w.C.adopted(man, w.b, 'posture-fire', 'squad').data.state,
    'hold',
    'man holds an adopted HOLD'
  );
  w.us.state = 'retreat';
  w.E.updateSoldier(man, w.b);
  assert.equal(w.E.stateOf(man).state, 'withdraw', 'the retreat puts him in withdraw');
  w.us.state = 'advance';
  w.b.time += 1;
  w.E.updateSoldier(man, w.b);
  return { w, man, state: w.E.stateOf(man).state };
}

let t = staleCase();
assert.notEqual(t.state, 'withdraw', 'withdraw ends with the retreat even under a pre-retreat HOLD');
assert.equal(t.w.E.fireAuthorized(t.man, t.w.b), true, 'a HOLD adopted before the retreat ended is void');
console.log('PASS a retreat ends the withdraw and voids the earlier HOLD');

t = staleCase('?stressAct=0&fireControl=1&commandPosture=1&retreatPosture=0');
assert.equal(t.state, 'withdraw', '?retreatPosture=0 is the old stale behavior');
console.log('PASS ?retreatPosture=0 restores the old behavior');
