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

/* Micro alone chooses when an individual rifleman briefly lowers behind real
   cover. The Squad Leader's commands and suppressor assignments are untouched. */
{
  const off = world();
  assert.equal(off.E.fireCoverCycleOn(), false, 'control arm retains its previous firing behavior');
}
{
  H.resetIds();
  const r = H.bootstrap({ search: '?soldierBeliefs=0&stressAct=0&fireCoverCycle=1' }),
    b = H.makeBattle(r, { seed: 717 }),
    us = H.addSquad(r, b, {
      id: 'us-fire-cover',
      faction: 'us',
      x: 0,
      z: 0,
      objective: { x: 0, z: 100 }
    }),
    ge = H.addSquad(r, b, {
      id: 'ge-fire-cover',
      faction: 'ge',
      x: 0,
      z: 90,
      objective: { x: 0, z: 0 }
    }),
    E = r.BattleEngagement,
    s = us.members.find(m => m.role === 'rifleman'),
    gunner = us.members.find(m => r.SquadAI.isMachineGun(m)),
    e = E.stateOf(s),
    F = r.BattleObstacleField;
  b.time = 20;
  s.target = ge.members[0];
  gunner.target = ge.members[0];
  s.moving = false;
  s.reloading = false;
  s.suppressedUntil = 0;
  s.crawling = false;
  assert.equal(E.fireCoverCycleOn(), true);
  F.coverAt = () => 0.55;
  const pulls = 2 + (E.fireCoverVariation(s) % 3);
  assert.equal(E.fireCoverAfterShot(s, b, 0.55, 0), false, 'no actual trigger pull, no counter');
  assert.equal(e.fireCoverPulls, 0);
  for (let i = 0; i < pulls; i++) {
    s.fireCooldown = 0.75;
    E.fireCoverAfterShot(s, b, 0.55, 0);
    s.fireCooldown = 0;
  }
  assert.ok(e.fireCoverUntil > b.time, 'actual repeated pulls lead to individual cover recovery');
  assert.equal(e.fireCoverPulls, 0, 'next firing volley starts a fresh count');
  assert.equal(E.fireCoverRecovering(s, b, 0.55), true);
  assert.equal(E.stateOf(s).stance, 'prone', 'rifleman actually lowers behind cover');
  assert.equal(E.fireCoverAfterShot(gunner, b, 0.55, 0), false, 'MG stays committed to its own burst cycle');
  assert.equal(E.stateOf(gunner).fireCoverUntil, 0);
  const until = e.fireCoverUntil;
  b.time = until + 0.01;
  assert.equal(E.fireCoverRecovering(s, b, 0.55), false, 'recovery ends independently');
  assert.equal(e.fireCoverUntil, 0);
  s.moving = true;
  s.fireCooldown = 0.75;
  assert.equal(E.fireCoverAfterShot(s, b, 0.55, 0), false, 'movement cannot start a voluntary pose drill');
  s.moving = false;
  F.coverAt = () => 1;
  assert.equal(E.fireCoverAfterShot(s, b, 0.55, 0), false, 'no actual protective cover, no fake concealment');
  s.target = null;
  assert.equal(E.fireCoverAfterShot(s, b, 0.55, 0), false, 'no target, no new cycle');
  s.target = ge.members[0];
  F.coverAt = () => 0.55;
  e.suppressOrder = true;
  assert.equal(
    E.fireCoverAfterShot(s, b, 0.55, 0),
    false,
    'assigned base-of-fire rifleman never abandons his personal support task on a fixed timer'
  );
  e.suppressOrder = false;
  const M = r.BattleSoldierMind,
    originalIncoming = M.recentIncoming;
  M.recentIncoming = () => true;
  const threatenedPulls = Math.max(1, pulls - 1);
  for (let i = 0; i < threatenedPulls; i++) {
    s.fireCooldown = 0.75;
    E.fireCoverAfterShot(s, b, 0.55, 0);
    s.fireCooldown = 0;
  }
  assert.ok(e.fireCoverUntil > b.time, 'recent incoming fire shortens the individual exposure interval');
  assert.ok(e.fireCoverUntil - b.time >= 1.05, 'incoming fire extends protected recovery');
  M.recentIncoming = originalIncoming;
  assert.ok(
    E.fireCoverVariation(s) !== E.fireCoverVariation(us.members.find(m => m !== s)),
    'riflemen use their own stable identities rather than a shared squad clock'
  );
}

console.log('PASS suppression eligibility, retention, burst accounting and autonomous covered fire cycle');
