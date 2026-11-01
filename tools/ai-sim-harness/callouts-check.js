#!/usr/bin/env node
'use strict';
/* Tactical callouts (modules/09-tactical-callouts.js, on by default; `?callouts=0` is the old relay).

   - Off (`?callouts=0`): the module changes nothing; a squad still takes a neighbour's sighting within 50 m at once.
   - On, legacy belief arm (`?soldierBeliefs=0&callouts=1`): a squad that sees the enemy first-hand calls it; men of other squads within CALL_RANGE of the caller hear it
     after SPEAK + distance / sound + REACT, and only then does their squad take it as a relayed contact (keeping the
     sighting's age, naming the call). Out of earshot, nobody learns anything; there is no free relay.
   - A frozen or fleeing man does not listen; a dead one hears nothing; a sighting gone stale is not passed on.
   - Misses are deterministic (same battle, same outcome), rarer close by than far off and in gunfire, and nothing
     draws from the combat RNG.
   - A squad that keeps seeing the enemy calls again only after CALL_REPEAT (or for a different enemy).
   - Calls never chain: a relayed contact is not first-hand, so it is never called on. */
const assert = require('node:assert/strict'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function setup(search, squads) {
  H.resetIds();
  const r = H.bootstrap({ search });
  const b = H.makeBattle(r, { seed: 11 });
  const out = squads.map(o =>
    H.addSquad(r, b, {
      id: o.id,
      faction: o.faction,
      x: o.x,
      z: o.z,
      objective: { x: o.x, z: o.z + 100 },
      facing: 0
    })
  );
  return { r, b, S: r.SquadAI, C: r.BattleCallouts, out };
}
/* Squad `a` sees `foe` first-hand at time t, called by its first man. */
function sees(a, foe, t) {
  a.contact = {
    unit: foe,
    x: foe.root.position.x,
    z: foe.root.position.z,
    at: t,
    seenBy: a.members[0].id,
    stance: 'stand'
  };
}
function step(ctx, squads, from, to) {
  for (let t = from; t <= to + 1e-9; t = +(t + 0.15).toFixed(2)) {
    ctx.b.time = t;
    squads.forEach(sq => ctx.S.squadSenses(sq, ctx.b));
  }
}

test('off (?callouts=0): the module is inert and the 50 m relay is as before', () => {
  const ctx = setup('?callouts=0', [
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'us-1', faction: 'us', x: 40, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 200 }
  ]);
  assert.equal(ctx.C.enabled(), false);
  const [a, b, ge] = ctx.out;
  ctx.b.time = 10;
  sees(a, ge.members[0], 9.5);
  ctx.S.squadSenses(a, ctx.b);
  ctx.S.squadSenses(b, ctx.b);
  assert.equal(b.contact && b.contact.relayedFrom, 'us-0', 'free relay at once');
  assert.equal(b.contact.callout, undefined);
  assert.equal(ctx.b._callouts, undefined, 'no state kept');
  assert.equal(ctx.C.telemetry(ctx.b), null);
});

test('on: word passes only once it has been said and heard, keeping the sighting age', () => {
  const ctx = setup('?soldierBeliefs=0&callouts=1', [
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'us-1', faction: 'us', x: 20, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 200 }
  ]);
  const [a, b, ge] = ctx.out,
    T = ctx.C.tuning;
  ctx.b.time = 10;
  sees(a, ge.members[0], 10);
  ctx.S.squadSenses(a, ctx.b);
  ctx.S.squadSenses(b, ctx.b);
  assert.equal(b.contact, null, 'not at once: the call has not been heard yet');
  /* Keep the caller's squad seeing him, so the sighting stays fresh. */
  let heardAt = null;
  for (let t = 10.15; t < 13; t = +(t + 0.15).toFixed(2)) {
    ctx.b.time = t;
    a.contact.at = t;
    ctx.S.squadSenses(a, ctx.b);
    ctx.S.squadSenses(b, ctx.b);
    if (b.contact && heardAt == null) heardAt = t;
  }
  assert.ok(heardAt != null, 'heard within three seconds');
  assert.ok(heardAt - 10 >= T.SPEAK + T.REACT - 1e-9, 'no sooner than it takes to say and hear: ' + heardAt);
  assert.equal(b.contact.relayedFrom, 'us-0');
  assert.ok(b.contact.callout > 0, 'names the call');
  assert.equal(b.contact.seenBy, null, 'relayed, not first-hand');
  const tel = ctx.C.telemetry(ctx.b);
  assert.ok(tel.sent >= 1 && tel.heard >= 1 && tel.applied >= 1, JSON.stringify(tel));
});

test('on: a newer callout may refine the same enemy without erasing this squad\'s first-hand memory', () => {
  const ctx = setup('?soldierBeliefs=0&callouts=1', [
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'us-1', faction: 'us', x: 20, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 200 }
  ]);
  const [a, b, ge] = ctx.out,
    foe = ge.members[0];
  ctx.b.time = 10;
  sees(b, foe, 10);
  assert.equal(ctx.S.hasFirstHandMemory(b.contact, ctx.b), true);
  ctx.S.squadSenses(b, ctx.b);

  /* The other squad keeps a fresher sighting long enough to say it. B no longer sees the man,
     so its own contact is memory by the time the call arrives. */
  let relayedAt = null;
  for (let t = 12.15; t < 16; t = +(t + 0.15).toFixed(2)) {
    ctx.b.time = t;
    sees(a, foe, t);
    ctx.S.squadSenses(a, ctx.b);
    ctx.S.squadSenses(b, ctx.b);
    if (b.contact && b.contact.relayedFrom === 'us-0') {
      relayedAt = t;
      break;
    }
  }
  assert.ok(relayedAt != null, 'the fresher callout eventually updates B');
  assert.equal(b.contact.relayedFrom, 'us-0', 'the CURRENT position is explicitly relayed');
  assert.equal(b.contact.firstHandAt, 10, 'its own earlier sighting remains separate provenance');
  assert.equal(ctx.S.hasFirstHandMemory(b.contact, ctx.b), true, 'same-threat fire-control continuity survives');
  ctx.b.time = 10 + ctx.S.CONTACT_MEMORY + 0.1;
  assert.equal(ctx.S.hasFirstHandMemory(b.contact, ctx.b), false, 'relays cannot extend first-hand authority forever');
});

test('on, legacy audience: out of earshot nobody learns, and there is no free 50 m relay', () => {
  const ctx = setup('?soldierBeliefs=0&callouts=1', [
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'us-1', faction: 'us', x: 80, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 200 }
  ]);
  const [a, b, ge] = ctx.out;
  /* 80 m between centres; the nearest men are still over CALL_RANGE apart. */
  for (let t = 10; t < 20; t = +(t + 0.15).toFixed(2)) {
    ctx.b.time = t;
    sees(a, ge.members[0], t);
    ctx.S.squadSenses(a, ctx.b);
    ctx.S.squadSenses(b, ctx.b);
  }
  assert.equal(b.contact, null);
  assert.equal(ctx.C.telemetry(ctx.b).addressed, 0, 'nobody was in earshot');
});

test('on: a frozen or fleeing man does not listen, a dead man hears nothing', () => {
  for (const what of ['freeze', 'flee', 'dead']) {
    const ctx = setup('?soldierBeliefs=0&callouts=1', [
      { id: 'us-0', faction: 'us', x: 0, z: 0 },
      { id: 'us-1', faction: 'us', x: 15, z: 0 },
      { id: 'ge-0', faction: 'ge', x: 0, z: 200 }
    ]);
    const [a, b, ge] = ctx.out;
    b.members.forEach(s => {
      if (what === 'dead') s.dead = true;
      else s.eng = Object.assign(s.eng || {}, { state: what });
    });
    for (let t = 10; t < 14; t = +(t + 0.15).toFixed(2)) {
      ctx.b.time = t;
      sees(a, ge.members[0], t);
      ctx.S.squadSenses(a, ctx.b);
      ctx.S.squadSenses(b, ctx.b);
    }
    assert.equal(b.contact, null, what);
    const tel = ctx.C.telemetry(ctx.b);
    assert.equal(tel.heard, 0, what);
    if (what === 'dead') assert.equal(tel.addressed, 0, 'the dead are not addressed');
    else assert.ok(tel.notListening > 0, what + ': ' + JSON.stringify(tel));
  }
});

test('on: a sighting gone stale by the time it is heard is not passed on', () => {
  const ctx = setup('?soldierBeliefs=0&callouts=1', [
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'us-1', faction: 'us', x: 20, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 200 }
  ]);
  const [a, b, ge] = ctx.out;
  ctx.b.time = 10;
  /* Seen long ago but still "first-hand" by the clock it was reported on: call it, then let it age. */
  sees(a, ge.members[0], 10);
  ctx.S.squadSenses(a, ctx.b);
  ctx.b.time = 10 + ctx.C.tuning.KEEP + 1;
  ctx.S.squadSenses(b, ctx.b);
  assert.equal(b.contact, null);
  assert.ok(ctx.C.telemetry(ctx.b).stale > 0);
});

test('on: a squad calls again only after CALL_REPEAT, or for another enemy', () => {
  const ctx = setup('?soldierBeliefs=0&callouts=1', [
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 200 }
  ]);
  const [a, ge] = ctx.out,
    R = ctx.C.tuning.CALL_REPEAT;
  for (let t = 10; t < 10 + R - 0.2; t = +(t + 0.15).toFixed(2)) {
    ctx.b.time = t;
    sees(a, ge.members[0], t);
    ctx.S.squadSenses(a, ctx.b);
  }
  assert.equal(ctx.b._callouts.counts.sent, 1, 'one call while it keeps seeing the same man');
  ctx.b.time += 0.15;
  sees(a, ge.members[1], ctx.b.time);
  ctx.S.squadSenses(a, ctx.b);
  assert.equal(ctx.b._callouts.counts.sent, 2, 'a different enemy is a new call');
  ctx.b.time += R + 0.15;
  sees(a, ge.members[1], ctx.b.time);
  ctx.S.squadSenses(a, ctx.b);
  assert.equal(ctx.b._callouts.counts.sent, 3, 'called again after CALL_REPEAT');
});

test('on: calls never chain', () => {
  const ctx = setup('?soldierBeliefs=0&callouts=1', [
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'us-1', faction: 'us', x: 45, z: 0 },
    { id: 'us-2', faction: 'us', x: 90, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 200 }
  ]);
  const [a, b, c, ge] = ctx.out;
  for (let t = 10; t < 20; t = +(t + 0.15).toFixed(2)) {
    ctx.b.time = t;
    sees(a, ge.members[0], t);
    [a, b, c].forEach(sq => ctx.S.squadSenses(sq, ctx.b));
  }
  assert.ok(b.contact && b.contact.relayedFrom === 'us-0', 'the neighbour heard it');
  assert.equal(c.contact, null, 'its neighbour did not hear it second-hand');
});

test('restart clears callout and Perception battle memory before time returns to zero', () => {
  const ctx = setup('?soldierBeliefs=1&callouts=1', [
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'us-1', faction: 'us', x: 20, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 200 }
  ]);
  const [a, b, ge] = ctx.out;
  ctx.b.time = 50;
  sees(a, ge.members[0], 50);
  ctx.S.squadSenses(a, ctx.b);
  ctx.b._gunfire = [{ x: 0, z: 40, faction: 'ge', unit: ge.members[0], at: 50 }];
  ctx.b._gunfirePrunedAt = 50;
  ctx.S.rememberSeen(b.members[0], ge.members[0], ctx.b, true, 'restart-test');
  assert.ok(ctx.b._callouts, 'callout state existed before restart');
  assert.ok(ctx.b._gunfire.length, 'gunfire memory existed before restart');
  assert.ok(b.members[0]._beliefs, 'personal belief existed before restart');

  ctx.C.reset(ctx.b);
  ctx.b.time = 0;
  assert.equal(ctx.b._callouts, undefined, 'callout delivery/pending state is gone');
  assert.equal(ctx.b._gunfire, undefined, 'old gunfire cannot look future-dated after restart');
  assert.equal(ctx.b._gunfirePrunedAt, undefined);
  assert.equal(ctx.b._soldierBeliefStats, undefined);
  assert.equal(a.contact, null);
  assert.equal(b.contact, null);
  assert.equal(b.members[0]._beliefs, undefined, 'per-man belief memory starts unknown');
});

test('on: misses are deterministic, rarer close than far and in quiet than in gunfire; no combat RNG', () => {
  function run(dx, gunfire) {
    const ctx = setup('?soldierBeliefs=0&callouts=1', [
      { id: 'us-0', faction: 'us', x: 0, z: 0 },
      { id: 'us-1', faction: 'us', x: dx, z: 0 },
      { id: 'ge-0', faction: 'ge', x: 0, z: 300 }
    ]);
    const [a, b, ge] = ctx.out;
    let draws = 0;
    const real = ctx.b.random;
    ctx.b.random = function () {
      draws++;
      return real.call(this);
    };
    /* Many calls: a new enemy each tick, so each is a call. */
    for (let i = 0; i < 400; i++) {
      ctx.b.time = 10 + i * 0.15;
      if (gunfire) ctx.b._gunfire = [{ x: dx, z: 5, faction: 'ge', unit: ge.members[0], at: ctx.b.time }];
      sees(a, ge.members[i % 10], ctx.b.time);
      ctx.S.squadSenses(a, ctx.b);
      ctx.S.squadSenses(b, ctx.b);
    }
    ctx.b.time += 5;
    ctx.S.squadSenses(b, ctx.b);
    assert.equal(draws, 0, 'no combat-RNG draw');
    const c = ctx.b._callouts.counts;
    return {
      rate: c.missed / (c.missed + c.heard + c.stale),
      log: ctx.b._callouts.log.map(r => r.outcome).join()
    };
  }
  const near = run(12, false),
    far = run(50, false),
    noisy = run(12, true);
  assert.equal(run(12, false).log, near.log, 'same battle, same outcomes');
  assert.ok(near.rate < far.rate, 'near ' + near.rate.toFixed(2) + ' < far ' + far.rate.toFixed(2));
  assert.ok(near.rate < noisy.rate, 'quiet ' + near.rate.toFixed(2) + ' < gunfire ' + noisy.rate.toFixed(2));
  assert.ok(
    near.rate < 0.2 && far.rate > 0.2,
    'near ' + near.rate.toFixed(2) + ', far ' + far.rate.toFixed(2)
  );
});

console.log(n + ' callout checks passed');
