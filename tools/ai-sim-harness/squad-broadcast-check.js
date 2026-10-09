#!/usr/bin/env node
'use strict';
/* Regression coverage for the shipped squad-broadcast information path. */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

function load(root, rel) {
  const code = fs.readFileSync(path.join(H.REPO, rel), 'utf8');
  new Function('window', 'globalThis', 'console', 'location', code)(
    root,
    root,
    { log() {}, warn() {} },
    root.location || { search: '' }
  );
}
function setup(xs, extraQuery = '') {
  H.resetIds();
  const r = H.bootstrap({ search: '?squadBroadcast=1' + extraQuery }),
    systems = {};
  r.BattleModules.registerSystem = function (id, sys) {
    systems[id] = sys;
  };
  r.BattleTelemetry = { record() {} };
  load(r, 'battle/modules/49-squad-broadcast.js');
  const b = H.makeBattle(r, { seed: 17 }),
    squads = xs.map((x, i) =>
      H.addSquad(r, b, {
        id: 'us-' + i,
        faction: 'us',
        x: x,
        z: 0,
        objective: { x: x, z: 100 },
        facing: 0
      })
    ),
    ge = H.addSquad(r, b, {
      id: 'ge-0',
      faction: 'ge',
      x: 0,
      z: 220,
      objective: { x: 0, z: 0 },
      facing: Math.PI
    });
  return { r, b, squads, foe: ge.members[0], sys: systems['squad-broadcast'] };
}
function seen(w, sq, x, at) {
  sq.contact = {
    unit: w.foe,
    x: x,
    z: 40,
    at: at,
    seenBy: sq.members[0].id,
    firstHandAt: at
  };
}
function heard(w, sq, x, at) {
  sq.contact = {
    unit: w.foe,
    x: x,
    z: 40,
    at: at,
    seenBy: null,
    heard: true,
    firstHandAt: null
  };
}
function tick(w, t) {
  w.b.time = t;
  w.sys.onCommanderTick(w.b);
}

{
  const w = setup([0, 100, 200, 300]),
    [a, b, c, d] = w.squads;
  seen(w, a, 0, 10);
  tick(w, 10);
  assert.ok(b.contact && b.contact.broadcast, 'nearest squad receives the report');
  assert.equal(c.contact, null, 'same tick does not relay through the newly updated neighbour');
  assert.equal(d.contact, null);
  tick(w, 14);
  assert.equal(c.contact, null, 'a received broadcast is not a source on the next tick either');
}

{
  const w = setup([0, 60]),
    [a, b] = w.squads;
  seen(w, a, 0, 10);
  tick(w, 10);
  assert.equal(b.contact.x, 0);
  seen(w, a, 45, 11);
  tick(w, 11);
  assert.equal(b.contact.x, 0, 'cooldown suppresses the immediate update');
  tick(w, 14);
  assert.equal(b.contact.x, 45, 'suppressed update retries after cooldown');
  assert.equal(b.contact.at, 11, 'retry keeps source observation time');
  assert.ok(w.r.BattleSquadBroadcast.summary(w.b).suppressed >= 1);
}

{
  const w = setup([0, 60]),
    [a] = w.squads;
  heard(w, a, 0, 10);
  tick(w, 10);
  assert.equal(w.r.BattleSquadBroadcast.summary(w.b).sent, 1);

  seen(w, a, 0, 11);
  tick(w, 11);
  assert.equal(
    w.r.BattleSquadBroadcast.summary(w.b).sent,
    1,
    'first-hand upgrade remains pending inside cooldown'
  );
  tick(w, 14);
  let summary = w.r.BattleSquadBroadcast.summary(w.b);
  assert.equal(summary.sent, 2, 'same-sector first-hand upgrade retries after cooldown');
  assert.equal(summary.recentBroadcasts[0].kind, 'upgraded-to-firsthand');

  seen(w, a, 0, 35);
  tick(w, 35);
  summary = w.r.BattleSquadBroadcast.summary(w.b);
  assert.equal(summary.sent, 3, 'same-sector observation can be reacquired after TTL');
  assert.equal(summary.recentBroadcasts[0].kind, 're-acquired');
}

{
  const w = setup([0, 60]),
    [a, b] = w.squads;
  seen(w, a, 0, 1);
  b.contact = { unit: null, x: 12, z: 40, at: 9, heard: true, firstHandAt: null };
  tick(w, 10);
  assert.equal(b.contact.at, 9, 'older report does not overwrite fresher local information');
  assert.equal(b.contact.x, 12);
}

{
  const w = setup([0, 60]),
    [a, b] = w.squads;
  seen(w, a, 0, 1);
  tick(w, 10);
  assert.equal(b.contact.at, 1, 'aggregate report keeps the original observation time');
  const man = b.members.find(s => !s.dead),
    c = w.r.SquadAI.soldierContact(man, w.b),
    snap = w.r.SquadAI.beliefSnapshot(man, w.b);
  assert.ok(c && c.source === 'told', 'recipient gets personal reported knowledge');
  assert.equal(c.unit, null, 'reported knowledge is not promoted to a live target');
  assert.equal(c.at, 1);
  assert.ok(snap.beliefs.some(x => x.observedAt === 1 && x.source === 'told'));
  const summary = w.r.BattleSquadBroadcast.summary(w.b);
  assert.ok(summary.beliefsApplied >= 1, JSON.stringify(summary));
}

{
  /* Soldier id 0 is a real id (the first man spawned); a falsy test read it as "no unit". */
  const w = setup([0, 60]),
    [a, b] = w.squads;
  w.foe.id = 0;
  seen(w, a, 0, 1);
  tick(w, 10);
  assert.equal(b.contact.unit, w.foe, 'a contact on soldier id 0 resolves to that soldier');
  assert.equal(w.r.BattleSquadBroadcast.summary(w.b).recentBroadcasts[0].unitId, 0);
}

{
  /* Real distant aimed burst -> victim's squad -> another friendly squad.
     This is contact information, not a live target or an unbounded global reveal. */
  const w = setup([0, 60, 180]),
    [underFire, warned, outOfRange] = w.squads,
    victim = underFire.members[0],
    shooter = w.foe;
  shooter.root.position.x = 0;
  shooter.root.position.z = 260;
  shooter.prone = true;
  shooter.target = victim;
  shooter.fireCooldown = 0;
  victim.target = null;
  w.b.time = 2;
  w.r.SquadAI.extend('shotModel', 'ballistics', () => false);
  assert.equal(w.r.SquadAI.tryFire(shooter, w.b), true, 'an actual 260 m aimed burst was fired');
  assert.ok(underFire.contact && underFire.contact.fireRevealed, 'victim reports incoming-fire origin');
  assert.equal(underFire.contact.precision, 'fire-origin', 'squad preserves origin precision for broadcast');
  assert.equal(underFire.contact.z, 260, 'snapshot is at trigger-time origin');

  w.sys.onCommanderTick(w.b);
  assert.ok(warned.contact && warned.contact.broadcast, 'nearby friendly squad receives warning');
  assert.equal(warned.contact.precision, 'fire-origin', 'source origin precision survives the relay');
  const report = w.r.SquadAI.soldierContact(warned.members[0], w.b);
  assert.ok(report && report.source === 'told', 'receiving soldier has reported, not first-hand, knowledge');
  assert.equal(report.unit, null, 'receiver is not granted a magically tracked live target');
  assert.equal(report.precision, 'fire-origin');
  assert.equal(outOfRange.contact, null, 'no unlimited-range squad broadcast');
  assert.equal(shooter.squad.contact, null, 'the hostile firing squad receives no friendly report');
  shooter.root.position.x = 35;
  assert.equal(warned.contact.x, 0, 'report remains tied to original firing point after shooter moves');
}

{
  /* Switching the explicit shot-origin reveal off must preserve the legacy
     non-magical hearing/spotting path, even when a distant aimed burst fires. */
  const w = setup([0, 60, 180], '&incomingFireReveal=0'),
    [attacked, neighbour, far] = w.squads,
    target = attacked.members[0],
    shooter = w.foe;
  shooter.root.position.z = 260;
  shooter.target = target;
  shooter.fireCooldown = 0;
  target.target = null;
  w.b.time = 2;
  w.r.SquadAI.extend('shotModel', 'ballistics', () => false);
  assert.equal(w.r.SquadAI.incomingFireRevealOn(), false);
  assert.equal(w.r.SquadAI.tryFire(shooter, w.b), true);
  assert.equal(attacked.contact, null, 'old rule does not create an aimed-fire location');
  w.sys.onCommanderTick(w.b);
  assert.equal(neighbour.contact, null, 'no squad voice report without source knowledge');
  assert.equal(far.contact, null);
}

{
  /* A firing attempt blocked before discharge is not a shot. Neither the
     recipient nor his squad can gain a precise firing origin from it. */
  const w = setup([0, 60, 180]),
    [attacked, neighbour] = w.squads,
    target = attacked.members[0],
    shooter = w.foe;
  shooter.root.position.z = 260;
  shooter.target = target;
  shooter.fireCooldown = 0;
  w.b.time = 2;
  shooter.weapon = null;
  assert.equal(w.r.SquadAI.tryFire(shooter, w.b), false, 'no weapon prevents a burst');
  assert.equal(attacked.contact, null, 'failed firing attempt reveals nothing to target squad');
  w.sys.onCommanderTick(w.b);
  assert.equal(neighbour.contact, null, 'nothing can relay to neighbouring friendlies');
}

console.log('PASS squad broadcast source isolation, cooldown retry, freshness, and personal belief delivery');
