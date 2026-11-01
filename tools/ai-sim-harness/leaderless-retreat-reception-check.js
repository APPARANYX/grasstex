#!/usr/bin/env node
'use strict';
/* Leaderless retreat reception: a 5+ man squad that is already retreating loses its leader. The
   succession gap (SUCCESSION_DELAY) must not strand the men on their pre-retreat destinations.
   Command Reception routes a movement order through its sender, and with no living leader the
   publisher found none, so every retreat recipient was recorded 'unreachable' and never adopted
   the order. A retreat from a leaderless squad is now sent by the senior living man (no orders
   from a dead general: the dead leader never speaks; the senior man's voice carries it), while
   non-retreat movement from a leaderless squad stays unreachable. relay and commandMovement are
   default on, as shipped. */
const assert = require('node:assert/strict');
const H = require('./harness');
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}

function world() {
  H.resetIds();
  const r = H.bootstrap({ search: '' });
  const b = H.makeBattle(r, { seed: 41 });
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 100, objective: { x: 0, z: 260 } });
  q.home = { x: 0, z: 0 };
  q.baseHome = { x: 0, z: 0 };
  q.orderAnchor = { x: 0, z: 100 };
  q.rally = { x: 0, z: 100 };
  q._orderGoal = { x: 0, z: 100 };
  q.commandPhase = 'approach';
  q.members.forEach((s, i) => {
    s.root.position.x = (i % 2 ? -1 : 1) * (1 + i * 0.4);
    s.root.position.z = 100 + (i % 3);
  });
  return { r, b, q, S: r.SquadAI, Q: r.BattleSquadStability, C: r.BattleCommandReception };
}
function live(q) {
  return q.members.filter(s => !s.dead);
}
function startRetreat(w) {
  /* An ordinary squad retreat of five-plus men: not the 1-4 man extraction path. */
  w.q.members.slice(6).forEach(s => (s.dead = true));
  w.q.state = 'retreat';
  w.q.mind = { mean: 0.5, n: live(w.q).length, max: 0.5 };
}
function killLeader(w) {
  const l = w.S.leaderOf(w.q);
  assert.ok(l, 'leader required');
  w.b.killSoldier(l, null);
  w.Q.leaderDown(w.q);
  return l;
}
function recordFor(w, s) {
  const v = w.C.snapshot(s, w.b);
  return v && v.records && v.records['movement|soldier:' + s.id];
}
function tick(w, secs) {
  for (let t = 0; t < secs; t += 0.25) {
    w.b.time += 0.25;
    w.r.SquadAI.updateSquad(w.q, w.b);
  }
}

test('relay and movement adoption ship on', () => {
  const w = world();
  assert.equal(w.C.movementEnabled(), true);
});

test('retreat ordered after the leader dies is delivered, not recorded unreachable', () => {
  const w = world();
  w.b.time = 10;
  tick(w, 6);
  startRetreat(w);
  assert.ok(live(w.q).length >= 5, 'ordinary retreat, not remnant extraction');
  const dead = killLeader(w);
  assert.equal(w.S.leaderOf(w.q), null, 'no successor yet');
  tick(w, 1);
  assert.equal(w.q.state, 'retreat');
  const men = live(w.q);
  let unreachable = 0,
    retreatRecords = 0;
  for (const s of men) {
    const rec = recordFor(w, s);
    if (!rec || rec.action !== 'retreat') continue;
    retreatRecords++;
    if (rec.unreachable) unreachable++;
    assert.notEqual(String(rec.sourceId), String(dead.id), 'the dead leader is never the sender');
  }
  assert.ok(retreatRecords >= men.length, 'every man received a retreat envelope: ' + retreatRecords);
  assert.equal(unreachable, 0, unreachable + ' retreat orders recorded unreachable');
});

test('men adopt a new retreat destination during the succession gap', () => {
  const w = world();
  w.b.time = 10;
  tick(w, 6);
  const before = new Map(live(w.q).map(s => [s.id, s._fireteamDestination && { ...s._fireteamDestination }]));
  startRetreat(w);
  killLeader(w);
  /* Adoption takes recognition + orientation time, well under the 6 s succession delay. */
  tick(w, 5);
  assert.equal(w.S.leaderOf(w.q), null, 'still leaderless');
  let moved = 0;
  for (const s of live(w.q)) {
    const d = s._fireteamDestination,
      p = before.get(s.id);
    if (d && (!p || Math.hypot(d.x - p.x, d.z - p.z) > 1)) moved++;
  }
  assert.equal(moved, live(w.q).length, 'every survivor holds a new retreat destination: ' + moved);
});

test('non-retreat movement from a leaderless squad is still not ordered by a dead general', () => {
  const w = world();
  w.b.time = 10;
  tick(w, 6);
  const died = w.b.time;
  killLeader(w);
  tick(w, 1);
  let seen = 0;
  for (const s of live(w.q)) {
    const rec = recordFor(w, s);
    if (rec && rec.action !== 'retreat' && rec.issuedAt >= died) seen++;
    if (rec && rec.action !== 'retreat' && rec.issuedAt >= died)
      assert.equal(rec.unreachable, true, 'ordinary movement stays unreachable');
  }
  /* Direct probe: an ordinary (non-retreat) publish from the leaderless squad has no sender. */
  const man = live(w.q)[0];
  w.C.publish(w.q, w.b, 'movement', [man], { scope: 'probe', action: 'formation', point: { x: 0, z: 150 } });
  const probe = w.C.snapshot(man, w.b).records['movement|probe'];
  assert.ok(
    probe && probe.unreachable,
    'ordinary leaderless order is unreachable (seen ' + seen + ' in-flow)'
  );
});

console.log(n + ' leaderless retreat reception checks passed');
