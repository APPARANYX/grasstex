#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict'),
  H = require('./harness');

function world() {
  H.resetIds();
  const r = H.bootstrap({ search: '?soldierBeliefs=0&stressAct=0' }),
    b = H.makeBattle(r, { seed: 717 }),
    q = H.addSquad(r, b, {
      id: 'us-suppress',
      faction: 'us',
      x: 0,
      z: 0,
      objective: { x: 0, z: 100 }
    });
  r.SquadAI.canSuppress = () => true;
  r.BattleAmmunition = { available: () => true };
  q.members.forEach(s => {
    s.target = null;
    s.suppressedUntil = 0;
    s.isPlayer = false;
    s.moving = false;
    s.crawling = false;
    s.reloading = false;
  });
  return { r, b, q, E: r.BattleEngagement };
}

{
  const w = world(),
    recovered = w.q.members.find(s => s.role === 'rifleman');
  w.q.members.forEach(s => {
    if (s !== recovered) s.dead = true;
  });
  w.q.state = 'advance';
  w.E.stateOf(recovered).state = 'withdraw';
  const chosen = w.E.assignSuppressors(w.q, w.b, w.q.members, { x: 0, z: 50, at: w.b.time });
  assert.equal(chosen, 1, 'released withdrawal does not make a recovered man permanently ineligible');
  assert.equal(w.E.stateOf(recovered).suppressOrder, true);
}

{
  const w = world(),
    riflemen = w.q.members.filter(s => s.role === 'rifleman').slice(0, 3),
    prior = riflemen[2];
  w.q.members.forEach(s => {
    if (!riflemen.includes(s)) s.dead = true;
  });
  riflemen.forEach(s => {
    w.E.stateOf(s).state = 'advance';
  });
  w.E.stateOf(prior).suppressOrder = true;
  const chosen = w.E.assignSuppressors(w.q, w.b, w.q.members, { x: 0, z: 50, at: w.b.time });
  assert.equal(chosen, 2);
  assert.equal(
    w.E.stateOf(prior).suppressOrder,
    true,
    'previous suppressor retains the job when still eligible'
  );
}

{
  const w = world(),
    s = w.q.members.find(m => m.role === 'rifleman'),
    e = w.E.stateOf(s);
  w.b.time = 10;
  e.state = 'advance';
  e.burstLeft = w.E.tuning.SUPPRESS_BURST;
  e.burstPauseUntil = 0;
  e.fireReadyAt = 0;
  let bursts = 0;
  w.r.SquadAI.areaFire = shooter => {
    bursts++;
    shooter.fireCooldown = 0.5;
    return 0;
  };
  for (let i = 0; i < w.E.tuning.SUPPRESS_BURST; i++) {
    s.fireCooldown = 0;
    assert.equal(w.E.suppress(s, w.b, { x: 0, z: 30 }), true, 'empty-sector rounds still count as a burst');
  }
  assert.equal(bursts, w.E.tuning.SUPPRESS_BURST);
  assert.equal(e.burstLeft, w.E.tuning.SUPPRESS_BURST, 'burst counter resets after the configured burst');
  assert.ok(e.burstPauseUntil > w.b.time, 'empty-sector burst starts the normal suppression pause');
}

{
  // ?suppressBelieved=1: with the squad's order open and its own first-hand record fresh, a man whose own
  // sighting is stale may suppress the believed point. Off by default; a relayed-only or closed order gives nothing.
  const build = (search, mutate) => {
    H.resetIds();
    const r = H.bootstrap({ search: '?soldierBeliefs=1&stressAct=0' + search }),
      b = H.makeBattle(r, { seed: 717 }),
      q = H.addSquad(r, b, { id: 'us-bel', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } }),
      ge = H.addSquad(r, b, { id: 'ge-bel', faction: 'ge', x: 0, z: 60, objective: { x: 0, z: -100 } }),
      foe = ge.members[0];
    r.SquadAI.canSuppress = () => true;
    r.BattleAmmunition = { available: () => true };
    q.members.forEach(s => {
      s.target = null;
      s.suppressedUntil = 0;
      s.isPlayer = false;
      s.moving = false;
      s.crawling = false;
      s.reloading = false;
      r.BattleEngagement.stateOf(s).state = 'advance';
    });
    b.time = 20;
    q.fireControl = { state: 'open' };
    q.contact = {
      unit: foe,
      x: 0,
      z: 60,
      at: b.time - 2,
      firstHandAt: b.time - 2,
      seenBy: q.members[1].id,
      source: 'seen'
    };
    // Every man's own sighting went stale long ago.
    r.SquadAI.soldierContact = () => ({ x: 0, z: 60, at: b.time - 30, source: 'seen', confidence: 0.9 });
    if (mutate) mutate(q);
    return { r, b, q };
  };
  const on = build('&suppressBelieved=1');
  assert.ok(
    on.r.BattleEngagement.assignSuppressors(on.q, on.b, on.q.members) > 0,
    'a stale man suppresses the believed point'
  );
  const off = build('');
  assert.equal(
    off.r.BattleEngagement.assignSuppressors(off.q, off.b, off.q.members),
    0,
    'default: stale sighting gives no job'
  );
  const closed = build('&suppressBelieved=1', q => (q.fireControl = { state: 'hold' }));
  assert.equal(
    closed.r.BattleEngagement.assignSuppressors(closed.q, closed.b, closed.q.members),
    0,
    'a closed order gives no job'
  );
  const relayed = build('&suppressBelieved=1', q => {
    q.contact.firstHandAt = null;
    q.contact.relayedFrom = 'ge-9';
  });
  assert.equal(
    relayed.r.BattleEngagement.assignSuppressors(relayed.q, relayed.b, relayed.q.members),
    0,
    'a relayed record gives no job'
  );
}

console.log('PASS suppression eligibility, retention and burst accounting');
