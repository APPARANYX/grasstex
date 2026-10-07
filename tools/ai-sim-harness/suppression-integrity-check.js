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
  assert.equal(w.E.stateOf(prior).suppressOrder, true, 'previous suppressor retains the job when still eligible');
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

console.log('PASS suppression eligibility, retention and burst accounting');
