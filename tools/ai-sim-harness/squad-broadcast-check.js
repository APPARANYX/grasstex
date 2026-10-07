#!/usr/bin/env node
'use strict';
/* Inter-squad broadcast transport contract.

   Broadcast is one hop, preserves the source observation timestamp, retries meaningful changes
   after cooldown, and hands reported facts to Perception instead of writing personal beliefs
   itself. These are the counterexamples from the baseline runtime audit. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');

let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function load(root, rel) {
  new Function(
    'window',
    'globalThis',
    'console',
    'location',
    fs.readFileSync(path.join(H.REPO, rel), 'utf8')
  )(root, root, { log() {}, warn() {} }, root.location);
}
function world(specs) {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: '?soldierBeliefs=1&squadBroadcast=1' }),
    systems = {};
  r.BattleModules = {
    registerSystem(id, hooks) {
      systems[id] = hooks;
    }
  };
  load(r, 'battle/modules/49-squad-broadcast.js');
  const b = H.makeBattle(r, { seed: 707 });
  const squads = specs.map(o =>
    H.addSquad(r, b, {
      id: o.id,
      faction: o.faction || 'us',
      x: o.x,
      z: o.z || 0,
      objective: { x: o.x, z: (o.z || 0) + 100 },
      facing: 0
    })
  );
  return { r, b, squads, tick: () => systems['squad-broadcast'].onCommanderTick(b) };
}
function direct(sq, unit, x, z, at) {
  sq.contact = {
    unit,
    x,
    z,
    at,
    seenBy: sq.members[0].id,
    stance: 'stand',
    firstHandAt: at
  };
}
function heard(sq, unit, x, z, at) {
  sq.contact = {
    unit,
    x,
    z,
    at,
    seenBy: null,
    stance: 'stand',
    heard: true
  };
}

test('broadcast receipt cannot recursively relay across multiple 120 m hops', () => {
  const w = world([
      { id: 'us-a', x: 0 },
      { id: 'us-b', x: 100 },
      { id: 'us-c', x: 200 },
      { id: 'us-d', x: 300 },
      { id: 'ge-0', faction: 'ge', x: 0, z: 150 }
    ]),
    [a, b, c, d, ge] = w.squads,
    enemy = ge.members[0];
  w.b.time = 10;
  direct(a, enemy, 0, 150, 10);
  w.tick();

  assert.ok(b.contact && b.contact.broadcast && b.contact.relayedFrom === 'us-a', 'B receives A');
  assert.equal(c.contact, null, 'B does not become a same-tick rebroadcast source for C');
  assert.equal(d.contact, null, 'D cannot learn A at 300 m through roster-order recursion');
  assert.equal(w.r.BattleSquadBroadcast.summary(w.b).sent, 1, 'only the originating squad transmits');

  w.b.time = 10.45;
  w.tick();
  assert.equal(c.contact, null, 'a relayed broadcast is not a later-tick source either');
  assert.equal(w.r.BattleSquadBroadcast.summary(w.b).sent, 1);
});

test('cooldown-suppressed sector change, first-hand upgrade and reacquisition all retry', () => {
  const w = world([
      { id: 'us-a', x: 0 },
      { id: 'us-b', x: 100 },
      { id: 'ge-0', faction: 'ge', x: 0, z: 150 }
    ]),
    [a, b, ge] = w.squads,
    enemy = ge.members[0];

  w.b.time = 10;
  heard(a, enemy, 0, 150, 10);
  w.tick();
  assert.equal(w.r.BattleSquadBroadcast.summary(w.b).sent, 1);

  w.b.time = 11;
  a.contact.x = 45;
  a.contact.at = 11;
  w.tick();
  let s = w.r.BattleSquadBroadcast.summary(w.b);
  assert.equal(s.sent, 1, 'sector change is suppressed inside cooldown');
  assert.ok(s.suppressed >= 1);

  w.b.time = 14;
  w.tick();
  s = w.r.BattleSquadBroadcast.summary(w.b);
  assert.equal(s.sent, 2, 'the suppressed sector change retries after cooldown');
  assert.equal(s.recentBroadcasts[0].x, 45);
  assert.equal(b.contact.x, 45);

  w.b.time = 15;
  Object.assign(a.contact, {
    at: 15,
    heard: false,
    seenBy: a.members[0].id,
    firstHandAt: 15
  });
  w.tick();
  assert.equal(w.r.BattleSquadBroadcast.summary(w.b).sent, 2, 'first-hand upgrade is initially suppressed');

  w.b.time = 18;
  w.tick();
  s = w.r.BattleSquadBroadcast.summary(w.b);
  assert.equal(s.sent, 3, 'same-sector first-hand upgrade retries despite unchanged signature');
  assert.equal(s.recentBroadcasts[0].kind, 'upgraded-to-firsthand');

  w.b.time = 39;
  a.contact.at = 39;
  a.contact.firstHandAt = 39;
  w.tick();
  s = w.r.BattleSquadBroadcast.summary(w.b);
  assert.equal(s.sent, 4, 'same-sector fresh observation can be reacquired after the TTL');
  assert.equal(s.recentBroadcasts[0].kind, 're-acquired');
});

test('broadcast preserves observation age and cannot overwrite a newer aggregate contact', () => {
  const w = world([
      { id: 'us-a', x: 0 },
      { id: 'us-b', x: 100 },
      { id: 'ge-0', faction: 'ge', x: 0, z: 150 }
    ]),
    [a, b, ge] = w.squads,
    enemy = ge.members[0];
  w.b.time = 10;
  direct(a, enemy, 0, 150, 1);
  heard(b, enemy, 10, 145, 9);
  w.tick();

  assert.equal(b.contact.at, 9, 'receiver keeps its newer observation');
  assert.equal(b.contact.x, 10);
  const log = w.r.BattleSquadBroadcast.summary(w.b).recentBroadcasts[0];
  assert.equal(log.at, 10, 'broadcast record has dispatch time');
  assert.equal(log.observedAt, 1, 'broadcast fact retains source observation time');
});

test('applied broadcast creates personal told beliefs through Perception ownership', () => {
  const w = world([
      { id: 'us-a', x: 0 },
      { id: 'us-b', x: 100 },
      { id: 'ge-0', faction: 'ge', x: 0, z: 150 }
    ]),
    [a, b, ge] = w.squads,
    enemy = ge.members[0],
    receiver = b.members[0];
  w.b.time = 10;
  direct(a, enemy, 0, 150, 10);
  assert.equal(w.r.SquadAI.soldierContact(receiver, w.b), null, 'precondition: receiver has no personal fact');

  w.tick();

  const personal = w.r.SquadAI.soldierContact(receiver, w.b),
    snap = w.r.SquadAI.beliefSnapshot(receiver, w.b);
  assert.ok(personal, 'broadcast is delivered into the personal information model');
  assert.equal(personal.source, 'told');
  assert.equal(personal.unit, null, 'reported information is not promoted to hidden live truth');
  assert.equal(personal.knownUnitId, String(enemy.id));
  assert.equal(personal.at, 10);
  assert.match(personal.reason, /^squad-broadcast:us-a$/);
  assert.equal(snap.beliefs.find(x => x.key === snap.selectedKey).observedAt, 10);
  assert.equal(snap.beliefs.find(x => x.key === snap.selectedKey).reportedAt, 10);
});

console.log(n + ' squad-broadcast checks passed');
