#!/usr/bin/env node
'use strict';
/* A man beyond voice and sight of the sender and of his fireteam's relay was "unreachable" even when a squadmate who had
   heard the order stood beside him. ?squadRelay=0 restores the old behaviour. The squadmate repeats only an order he
   received himself; nothing is marked received for a man nobody reached. */
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
  const r = H.bootstrap({ search: search || '?commandReception=1&stressAct=0' });
  const b = H.makeBattle(r, { seed: 81 });
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 120 },
    facing: 0
  });
  q.state = 'advance';
  q.commandPhase = 'approach';
  q.orderAnchor = { x: 0, z: 0 };
  q.rally = { x: 0, z: 0 };
  q.objective = { x: 0, z: 120 };
  const leader = r.SquadAI.leaderOf(q);
  const men = q.members.filter(s => !s.dead && s !== leader);
  const lead = { x: leader.root.position.x, z: leader.root.position.z };
  const place = (s, dz) => {
    s.root.position.x = lead.x;
    s.root.position.z = lead.z + dz;
  };
  men.forEach(s => place(s, 400));
  return { r, b, q, C: r.BattleCommandReception, leader, men, place };
}
function rec(w, s) {
  return w.C.snapshot(s, w.b).records['test|stranded'];
}
function publish(w, s, extra) {
  return w.C.publish(
    w.q,
    w.b,
    'test',
    [s],
    Object.assign(
      {
        scope: 'stranded',
        action: 'order-stranded',
        signature: 'stable-stranded',
        reference: 'point',
        point: { x: 12, z: 30 }
      },
      extra || {}
    )
  );
}
/* stranded man 120 m out, one squadmate at 80 m (visual range of the leader) and 40 m from the stranded man */
function stage(w) {
  const [stranded, mate] = w.men;
  w.place(stranded, 120);
  w.place(mate, 80);
  return { stranded, mate };
}

test('a stranded man hears the order from a squadmate the sender reached', () => {
  const w = world(),
    { stranded, mate } = stage(w);
  publish(w, stranded);
  const r = rec(w, stranded);
  assert.notEqual(r.phase, 'unreachable');
  assert.equal(r.hops, 2);
  assert.equal(r.relayId, String(mate.id));
  assert.ok(
    r.relayReadyAt > w.b.time && r.receivedAt > r.relayReadyAt,
    'he hears it only after the squadmate processed it'
  );
  assert.ok(r.adoptedAt > r.receivedAt);
});

test('?squadRelay=0 restores the unreachable record', () => {
  const w = world('?commandReception=1&stressAct=0&squadRelay=0'),
    { stranded } = stage(w);
  publish(w, stranded);
  const r = rec(w, stranded);
  assert.equal(r.phase, 'unreachable');
  assert.equal(r.adoptedAt, null);
});

test('a squadmate the sender did not reach relays nothing', () => {
  const w = world(),
    { stranded, mate } = stage(w);
  w.place(mate, 200);
  w.place(stranded, 240);
  publish(w, stranded);
  const r = rec(w, stranded);
  assert.equal(r.phase, 'unreachable');
  assert.equal(r.receivedAt, null);
  assert.equal(r.adoptedAt, null);
});

test('an order that may not be relayed stays unreachable', () => {
  const w = world(),
    { stranded } = stage(w);
  publish(w, stranded, { relay: false });
  assert.equal(rec(w, stranded).phase, 'unreachable');
  const v = world(),
    s2 = stage(v).stranded;
  publish(v, s2, { reference: 'none' });
  assert.equal(rec(v, s2).phase, 'unreachable');
});

test('a man the sender reaches directly is unchanged', () => {
  const w = world(),
    [near] = w.men;
  w.place(near, 20);
  publish(w, near);
  const r = rec(w, near);
  assert.equal(r.channel, 'voice-direct');
  assert.equal(r.hops, 1);
  assert.equal(r.relayId, null);
});

test('the squad relay skips a squadmate the sender could not reach and uses the one it did', () => {
  const w = world(),
    [stranded, far, close] = w.men;
  w.place(stranded, 120);
  w.place(far, 80);
  w.place(close, 85);
  far.root.position.x += 60;
  publish(w, stranded);
  const r = rec(w, stranded);
  assert.equal(
    w.C.snapshot(far, w.b).records['test|stranded'],
    undefined,
    'only the stranded man was addressed'
  );
  assert.equal(r.relayId, String(close.id));
});

console.log(n + ' squad-relay checks passed');
