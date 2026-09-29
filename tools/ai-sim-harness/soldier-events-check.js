#!/usr/bin/env node
'use strict';
/* The soldier event queue (module 08, `BattleSoldierEvents`): what happens to a man reaches the layer
   that reads it by one road, with one declared vocabulary and fixed priorities.

   - The vocabulary is declared data (kind, priority, producer, payload); priorities are distinct and a
     kind outside it is an error to post, read or subscribe to.
   - A kind nobody reads is not queued (`?mind=0` queues nothing).
   - A reader drains only its own kinds, in priority order and then posting order, whatever order they
     were posted in; another reader's kinds stay.
   - The queue is bounded: past its capacity the lowest-priority, oldest event goes and is counted.
   - Casualties are announced once per AI time, to living men of the fallen man's side inside `reach`
     (never the enemy, never the fallen, never the far), and logged once.
   - Producers post what their own writer computed: SquadAI.pin posts the `until` it set after the
     fortitude scale; the wound model posts a wound only for a hit he survives.
   - The module draws nothing from the combat RNG and writes nothing but its own queue and log.
   Mechanism, not dice. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function load(r, file) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, file), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}

function world() {
  H.resetIds();
  const r = H.bootstrap();
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  const b = H.makeBattle(r);
  const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  const ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 30, objective: { x: 0, z: 0 } });
  b.time = 10;
  return { r, b, E: r.BattleSoldierEvents, S: r.SquadAI, us, ge };
}
function put(s, x, z) {
  s.root.position.x = x;
  s.root.position.z = z;
}
const drained = (E, s, reader) => {
  const out = [];
  E.drain(s, reader, (kind, data, at) => out.push({ kind, data, at }));
  return out;
};

test('the vocabulary is declared data with distinct priorities, and an unknown kind is an error', () => {
  const { E } = world();
  assert.deepEqual(Object.keys(E.KINDS), ['casualty', 'wound', 'suppressed', 'aimed']);
  const p = Object.values(E.KINDS).map(k => k.priority);
  assert.deepEqual(
    p,
    [...new Set(p)].sort((a, b) => a - b),
    'distinct and listed in priority order'
  );
  for (const k of Object.values(E.KINDS))
    assert.ok(k.producer && k.payload, 'each kind names its producer and payload');
  const { b, us } = world();
  assert.throws(() => E.post(us.members[0], b, 'panic', {}), /unknown soldier event kind/);
  assert.throws(() => E.subscribe('x', ['panic']), /unknown soldier event kind/);
});

test('a kind nobody reads is not queued; a dead man is not posted to', () => {
  const r = H.bootstrap({ modules: false });
  r.BattleModules = { registerSystem() {}, unitsFor: () => [] };
  load(r, 'battle/modules/08-soldier-events.js');
  const b = H.makeBattle(r),
    s = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } }).members[0];
  assert.equal(r.BattleSoldierEvents.post(s, b, 'wound', { count: 1 }), false);
  assert.equal(r.BattleSoldierEvents.pending(s), 0);
  const { E, b: b2, us } = world();
  E.subscribe('reader', ['wound']);
  const dead = us.members[1];
  dead.dead = true;
  assert.equal(E.post(dead, b2, 'wound', { count: 1 }), false);
  assert.equal(E.post(us.members[0], b2, 'wound', { count: 1 }), true);
});

test('a reader drains its own kinds by priority then posting order; other readers keep theirs', () => {
  const { E, b, us } = world(),
    s = us.members[0];
  E.subscribe('only-aimed', ['aimed']);
  // Posted in the opposite order of priority, two of a kind to show posting order.
  b.time = 11;
  E.post(s, b, 'aimed', { rounds: 1 });
  b.time = 12;
  E.post(s, b, 'aimed', { rounds: 2 });
  E.post(s, b, 'suppressed', { until: 20 });
  E.post(s, b, 'wound', { count: 1 });
  E.post(s, b, 'casualty', { id: 7 });
  const mine = drained(E, s, 'only-aimed');
  assert.deepEqual(
    mine.map(e => [e.kind, e.data.rounds]),
    [
      ['aimed', 1],
      ['aimed', 2]
    ]
  );
  assert.deepEqual(
    mine.map(e => e.at),
    [11, 12],
    'each event keeps the time it was posted'
  );
  assert.equal(E.pending(s), 3, "the mind's kinds are still queued");
  assert.deepEqual(
    drained(E, s, 'soldier-mind').map(e => e.kind),
    ['casualty', 'wound', 'suppressed'],
    'priority order, not posting order'
  );
  assert.equal(E.pending(s), 0);
  assert.deepEqual(drained(E, s, 'soldier-mind'), [], 'and a drained queue is empty');
});

test('the queue is bounded: past capacity the lowest-priority, oldest event goes, and it is counted', () => {
  const { E, b, us } = world(),
    s = us.members[0];
  E.post(s, b, 'casualty', { id: 1 });
  for (let i = 0; i < E.capacity + 5; i++) E.post(s, b, 'aimed', { rounds: i });
  assert.equal(E.pending(s), E.capacity);
  assert.equal(E.stats(b).dropped, 6);
  const got = drained(E, s, 'soldier-mind');
  assert.equal(got[0].kind, 'casualty', 'the highest priority survives');
  const rounds = got.filter(e => e.kind === 'aimed').map(e => e.data.rounds);
  assert.equal(rounds[0], 6, 'the six oldest aimed rounds were the ones dropped');
  assert.equal(rounds[rounds.length - 1], E.capacity + 4);
});

test('a casualty is logged and announced once, to living men of his own side inside reach only', () => {
  const { E, b, us, ge } = world();
  const fallen = us.members[0],
    near = us.members[1],
    far = us.members[2],
    edge = us.members[3],
    enemy = ge.members[0];
  put(fallen, 0, 0);
  put(near, 5, 0);
  put(edge, E.KINDS.casualty.reach - 0.5, 0);
  put(far, E.KINDS.casualty.reach + 5, 0);
  put(enemy, 3, 0);
  for (const s of us.members.concat(ge.members))
    if (![fallen, near, far, edge, enemy].includes(s)) put(s, 900, 900);
  b.killSoldier(fallen);
  E.announceCasualties(b, b.time);
  E.announceCasualties(b, b.time);
  assert.equal(E.stats(b).log.length, 1, 'logged once');
  assert.equal(E.stats(b).casualties, 1);
  assert.equal(E.pending(near), 1, 'his squadmate beside him');
  assert.equal(E.pending(edge), 1, 'a man just inside reach');
  assert.equal(E.pending(far), 0, 'a man beyond it');
  assert.equal(E.pending(enemy), 0, 'the enemy');
  assert.equal(E.pending(fallen), 0, 'and not the fallen');
  const c = drained(E, near, 'soldier-mind')[0].data;
  assert.equal(c.id, fallen.id);
  assert.equal(c.unit, fallen);
  assert.equal(
    c.leader,
    fallen.role === 'sergeant',
    "and whether he was the squad's leader (the sergeant slot)"
  );
  b.time += 0.15;
  E.announceCasualties(b, b.time);
  assert.equal(E.stats(b).log.length, 1, 'a man already announced is not announced again');
});

test('SquadAI.pin posts the hold it set (after the fortitude scale); the queue never recomputes it', () => {
  const { E, b, S, us } = world(),
    s = us.members[0];
  S.pin(s, b, 1.3);
  const held = s.suppressedUntil;
  S.pin(s, b, 0.2); // a shorter pin never shortens the hold
  const got = drained(E, s, 'soldier-mind').filter(e => e.kind === 'suppressed');
  assert.equal(got.length, 2);
  assert.equal(got[0].data.until, held);
  assert.equal(got[1].data.until, held, 'the second event carries the hold that stood after it');
  assert.equal(got[0].data.seconds, 1.3, 'the scale is 1 without the stats module');
});

test('the wound model posts a wound for a hit he survives, and not for one that drops him', () => {
  const { r, b, E, us, ge } = world(),
    shooter = ge.members[0],
    hurt = us.members[0],
    down = us.members[1];
  assert.ok(r.BattleWounds, 'the wound model is loaded in the harness');
  b.random = () => 0.99; // no drop, the middle of the damage spread
  const out = r.BattleWounds.wound(shooter, hurt, b, { zone: 'arm' });
  assert.equal(out.outcome, 'wounded');
  assert.deepEqual(
    drained(E, hurt, 'soldier-mind').map(e => [e.kind, e.data.count]),
    [
      ['wound', 1],
      ['suppressed', undefined]
    ],
    'the wound, then the shock pin (priority order, whichever was posted first)'
  );
  b.random = () => 0; // dropped at once
  const gone = r.BattleWounds.wound(shooter, down, b, { zone: 'chest' });
  assert.notEqual(gone.outcome, 'wounded');
  assert.equal(E.pending(down), 0, 'a man put down is posted nothing');
});

test('the queue draws nothing from the combat RNG', () => {
  const { b, E, S, us, ge } = world();
  let draws = 0;
  const real = b.random;
  b.random = (...a) => (draws++, real.apply(b, a));
  const s = us.members[0];
  E.post(s, b, 'aimed', { rounds: 1, d: 10 });
  S.pin(s, b, 1);
  b.killSoldier(ge.members[0]);
  E.announceCasualties(b, b.time);
  drained(E, s, 'soldier-mind');
  assert.equal(draws, 0);
});

console.log(`${n} soldier-events checks passed`);
