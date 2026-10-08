#!/usr/bin/env node
'use strict';
/* A squad whose leader cannot reach part of it must still move on with the men he can reach.

   The Squad Leader advances the order anchor one stride when enough of his men have arrived at the
   latest movement order (ORDER_COHESION of the commanded men). A man beyond voice and sight of the
   leader and his relay is published as `unreachable`: he cannot hear the order, so he can never
   acknowledge or arrive at it. Counting him in the denominator froze the anchor for good once he was
   more than ORDER_COHESION's share of the squad, and nothing else would move it (issue #368). */
const assert = require('node:assert/strict');
const H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}

function world(search) {
  H.resetIds();
  const r = H.bootstrap({ search: search || '?stressAct=0&commandMovement=1' });
  const b = H.makeBattle(r, { seed: 57 });
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 400 },
    facing: 0
  });
  q.state = 'advance';
  q.commandPhase = 'approach';
  q.orderAnchor = { x: 0, z: 0 };
  q.rally = { x: 0, z: 0 };
  q.objective = { x: 0, z: 400 };
  r.BattleMovementResolver = {
    proposeOrder(s, p) {
      s.orderDestination = { x: p.x, z: p.z };
    }
  };
  return { r, b, q, Q: r.BattleSquadStability, C: r.BattleCommandReception };
}
function live(w) {
  return w.q.members.filter(s => !s.dead);
}
function slot(s) {
  return 'movement|soldier:' + String(s.id);
}
/* Let every man hear and adopt what was published, then put each at his order destination. */
function settleAndArrive(w, only) {
  w.b.time += 12;
  w.Q.updateFireteams(w.q, w.b);
  live(w).forEach(s => {
    if (only && !only.includes(s)) return;
    const d = s.orderDestination;
    if (d && s.root) {
      s.root.position.x = d.x;
      s.root.position.z = d.z;
    }
  });
}
/* A new target objective changes the fireteam signature, so every team is issued afresh whatever its lease says
   (and leaves the goal and formation alone, so the next stride is up to the arrival rule, not forced). */
function republish(w) {
  w.q.targetObjective = w.q.targetObjective === 'obj-a' ? 'obj-b' : 'obj-a';
  w.Q.updateFireteams(w.q, w.b);
}
function strand(w, far) {
  far.forEach((s, i) => {
    s.root.position.x = 300 + i * 4;
    s.root.position.z = 0;
    s.orderDestination = { x: s.root.position.x, z: s.root.position.z };
  });
}

test('men beyond the leader are published unreachable and stay behind the newest order', () => {
  const w = world(),
    men = live(w);
  w.Q.updateFireteams(w.q, w.b);
  settleAndArrive(w);
  const far = men.slice(-5);
  strand(w, far);
  republish(w);
  const rec = s => w.C.snapshot(s, w.b).records[slot(s)];
  assert.ok(
    far.every(s => rec(s) && rec(s).unreachable),
    'stranded men get an unreachable record: ' + JSON.stringify(far.map(s => rec(s) && rec(s).phase))
  );
  assert.ok(
    men.slice(0, 5).every(s => rec(s) && !rec(s).unreachable),
    'men near the leader receive it'
  );
});

test('the anchor advances when the men it can reach have arrived, though half the squad cannot be reached', () => {
  const w = world(),
    men = live(w),
    near = men.slice(0, 5),
    far = men.slice(-5);
  w.Q.updateFireteams(w.q, w.b);
  w.Q.advanceSquadAnchor(w.q, w.b); // consumes the first, forced stride
  settleAndArrive(w);
  strand(w, far);
  republish(w);
  settleAndArrive(w, near);
  strand(w, far);
  const v0 = w.q._orderVersion,
    z0 = w.q.orderAnchor.z;
  w.Q.advanceSquadAnchor(w.q, w.b);
  assert.ok(
    w.q._orderVersion > v0 && w.q.orderAnchor.z > z0,
    'anchor frozen at z=' + w.q.orderAnchor.z + ' (order version ' + w.q._orderVersion + ')'
  );
});

test('a stale acknowledgement from a man who CAN be reached still holds the anchor', () => {
  const w = world(),
    men = live(w);
  w.Q.updateFireteams(w.q, w.b);
  w.Q.advanceSquadAnchor(w.q, w.b); // consumes the first, forced stride
  settleAndArrive(w);
  republish(w); // new order published to everyone, none has heard it yet
  const v0 = w.q._orderVersion;
  w.Q.advanceSquadAnchor(w.q, w.b);
  assert.equal(w.q._orderVersion, v0, 'the squad waits while its men are still processing the new order');
});

test('?unreachableAnchor=0 is the old rule: the unreachable half holds the anchor', () => {
  const w = world('?stressAct=0&commandMovement=1&unreachableAnchor=0'),
    men = live(w),
    near = men.slice(0, 5),
    far = men.slice(-5);
  w.Q.updateFireteams(w.q, w.b);
  w.Q.advanceSquadAnchor(w.q, w.b);
  settleAndArrive(w);
  strand(w, far);
  republish(w);
  settleAndArrive(w, near);
  strand(w, far);
  const v0 = w.q._orderVersion;
  w.Q.advanceSquadAnchor(w.q, w.b);
  assert.equal(w.q._orderVersion, v0, 'flag off keeps the legacy freeze');
});

console.log(n + ' passed');
