#!/usr/bin/env node
'use strict';
/* ?talkingGuns=1: the second suppressor starts half the first man's real firing cycle after him. */
const assert = require('node:assert/strict'),
  H = require('./harness');

function run(search) {
  H.resetIds();
  const r = H.bootstrap({ search: search }),
    b = H.makeBattle(r, { seed: 717 }),
    q = H.addSquad(r, b, { id: 'us-tg', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  r.SquadAI.canSuppress = () => true;
  r.BattleAmmunition = { available: () => true };
  const men = q.members
    .filter(s => s.role === 'rifleman')
    .sort((a, c) => (+a.slotIndex || 0) - (+c.slotIndex || 0))
    .slice(0, 2);
  q.members.forEach(s => {
    s.target = null;
    s.suppressedUntil = 0;
    s.isPlayer = false;
    s.moving = false;
    s.crawling = false;
    s.reloading = false;
    if (!men.includes(s)) s.dead = true;
  });
  men.forEach(s => {
    r.BattleEngagement.stateOf(s).state = 'advance';
  });
  const lead = r.BattleEngagement.stateOf(men[0]),
    follower = r.BattleEngagement.stateOf(men[1]);
  lead.cycleStart = 10;
  lead.cycleLen = 4;
  b.time = 11;
  r.BattleEngagement.assignSuppressors(q, b, q.members, { x: 0, z: 50, at: b.time });
  return { follower, lead };
}

{
  const off = run('?soldierBeliefs=0&stressAct=0');
  assert.equal(off.follower.burstPauseUntil, 0, 'off: both men start together');
  const on = run('?soldierBeliefs=0&stressAct=0&talkingGuns=1');
  assert.equal(on.follower.burstPauseUntil, 12, 'on: follower starts half a cycle after the lead began');
  assert.equal(on.lead.burstPauseUntil, 0, 'the lead is not delayed');
}
console.log('PASS talking guns stagger the second suppressor');
