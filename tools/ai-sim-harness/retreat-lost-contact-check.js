#!/usr/bin/env node
'use strict';
/* Issue #437: A five-man retreat sends an unheard replacement to an isolated
   survivor who has already reached his last adopted retreat position. He knows
   his immutable rear base but not the newly issued Squad Leader rally point. */
const assert = require('node:assert/strict');
const H = require('./harness');

function world(search) {
  H.resetIds();
  const r = H.bootstrap({ search: search || '' });
  const b = H.makeBattle(r, { seed: 437 });
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 120,
    objective: { x: 0, z: 300 },
    seed: 437
  });
  q.home = { x: 0, z: -220 };
  q.baseHome = { x: 0, z: -220 };
  q.orderAnchor = { x: 0, z: 120 };
  q.rally = { x: 0, z: 120 };
  q._orderGoal = { x: 0, z: 120 };
  q.members.slice(5).forEach(s => (s.dead = true));
  q.members.slice(0, 5).forEach((s, i) => {
    s.root.position.x = i * 0.5;
    s.root.position.z = 119 + i * 0.4;
  });
  q.state = 'retreat';
  q.mind = { mean: 0.5, n: 5, max: 0.5 };
  return { r, b, q, C: r.BattleCommandReception, S: r.SquadAI };
}
function tick(w, count) {
  for (let i = 0; i < count; i++) {
    w.b.time += 0.45;
    w.S.updateSquad(w.q, w.b);
  }
}
function point(p) {
  return p && { x: +p.x, z: +p.z };
}
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
function breakContact(w) {
  tick(w, 18);
  const s = w.q.members[4];
  const received = w.C.adopted(s, w.b, 'movement', 'soldier:' + s.id);
  assert.ok(received && received.action === 'retreat', 'soldier once personally adopted retreat');
  const old = point(s.orderDestination);
  assert.ok(old, 'soldier knows first retreat slot');
  s.root.position.x = old.x;
  s.root.position.z = old.z;
  s.destination = point(old);
  H.stepMovement(w.b, s, 0.15);
  assert.equal(s._movementStopReason, 'arrived', 'physical integrator confirms old slot arrival');

  // The squad has moved away. No living teammate can relay a fresh order across this gap.
  for (const other of w.q.members.slice(0, 4)) {
    other.root.position.x = -1;
    other.root.position.z = -120;
  }
  w.q.orderAnchor = { x: 0, z: -120 };
  w.q.rally = { x: 0, z: -120 };
  w.r.BattleLeases.end(w.q, 'retreat-anchor', w.b.time, 'test disconnected fireteam');
  let pending = null;
  for (let i = 0; i < 40; i++) {
    H.stepMovement(w.b, s, 0.15);
    tick(w, 1);
    pending = w.C.peek(s, w.b, 'movement', 'soldier:' + s.id);
    if (pending && pending.unreachable) break;
  }
  assert.ok(
    pending && pending.unreachable,
    'fresh order genuinely cannot reach isolated soldier: ' +
      JSON.stringify({
        pending: pending && {
          action: pending.action,
          phase: pending.phase,
          sourceId: pending.sourceId,
          channel: pending.channel,
          point: pending.point
        },
        state: w.q.state,
        anchor: w.q.orderAnchor,
        leader: w.S.leaderOf(w.q) && w.S.leaderOf(w.q).id,
        candidate: s.id,
        here: point(s.root.position),
        orders: w.q._fireteamOrders
      })
  );
  assert.ok(distance(s.root.position, w.q.orderAnchor) > 100, 'fresh squad rally is distant');
  /* The old personally adopted instruction was replaced in flight while the
     leader walked away. Settle the man at that *actual last adopted* endpoint,
     and let shipping stepMovement report the arrival. The headless fixture does
     not run the physical Movement Resolver's ordinary order-to-destination copy. */
  const lastKnown = point(s.orderDestination);
  assert.ok(lastKnown, 'an adopted retreat endpoint exists');
  s.root.position.x = lastKnown.x;
  s.root.position.z = lastKnown.z;
  s.destination = point(lastKnown);
  H.stepMovement(w.b, s, 0.15);
  assert.equal(s._movementStopReason, 'arrived');
  return { s, old: lastKnown };
}

{
  const w = world('?retreatLostContact=1');
  const { s, old } = breakContact(w);
  for (let i = 0; i < 30; i++) {
    // Real integrator makes the local arrival/movement observation, not a fake stop label.
    H.stepMovement(w.b, s, 0.15);
    tick(w, 1);
  }
  assert.deepEqual(
    point(s.orderDestination),
    point(w.q.baseHome),
    'unreachable retreating soldier must continue independently to the known rear base: ' +
      JSON.stringify({
        state: w.q.state, stop: s._movementStopReason, since: s._lostContactRetreatSince,
        current: w.C.peek(s, w.b, 'movement', 'soldier:' + s.id),
        adopted: w.C.adopted(s, w.b, 'movement', 'soldier:' + s.id),
        adoptedEnvelope: s._fireteamAdoptedEnvelope,
        lastPublishKey: s._fireteamPublishKey, survival: s._survivalMovementKey,
        order: point(s.orderDestination), dest: point(s._fireteamDestination),
        here: point(s.root.position), base: point(w.q.baseHome),
        anchor: point(w.q.orderAnchor)
      })
  );
  assert.ok(s._survivalMovementKey, 'fallback is explicit local survival state, not a received command');
  assert.ok(distance(old, s.orderDestination) > 100, 'not simply another nearby formation slot');
  console.log('PASS disconnected five-man retreat resumes toward already-known base');
}
{
  const w = world('');
  const { s, old } = breakContact(w);
  for (let i = 0; i < 30; i++) {
    H.stepMovement(w.b, s, 0.15);
    tick(w, 1);
  }
  assert.ok(
    distance(s.orderDestination, old) < 1,
    'default-OFF arm preserves old behavior for paired testing'
  );
  console.log('PASS flag-OFF arm preserves legacy reception boundary');
}
console.log('retreat-lost-contact-check: 2 checks passed');
