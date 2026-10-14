#!/usr/bin/env node
'use strict';
/* Exercise the actual Engagement -> Resolver -> Individuality handoff, not a
   mocked stance writer. A rejected speed override must retain Micro's stance. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule } = require('./module-loader');

function fixture(personal = false) {
  H.resetIds();
  const r = H.bootstrap({
    search:
      '?soldierBeliefs=' +
      (personal ? '1' : '0') +
      '&commandPosture=0&commandMovement=0&commandRelay=0&fireControl=0'
  });
  loadModule(r, 'battle/movement-resolver.js');
  loadModule(r, 'battle/modules/11-soldier-individuality.js');
  r.BATTLE_AUTONOMOUS_MOVEMENT = true;
  const b = H.makeBattle(r);
  b.time = 10;
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 200 } });
  const s = q.members.find(m => m.role === 'rifleman');
  s.target = null;
  s.eng = null;
  r.BattleEngagement.stateOf(s).stanceUntil = 0;
  const p = s.root.position;
  const goal = { x: p.x, z: p.z + 12 };
  r.BattleMovementResolver.proposeOrder(s, goal, b, false);
  r.BattleMovementResolver.resolve(s, b);
  return { r, b, q, s, goal };
}

{
  const f = fixture(true);
  const enemy = H.addSquad(f.r, f.b, { id: 'ge-0', faction: 'ge', x: 0, z: 100, objective: { x: 0, z: 0 } })
    .members[0];
  f.r.SquadAI.rememberSeen(f.s, enemy, f.b, true, 'recent-personal-warning');
  f.s.target = null;
  f.q.inContact = false;
  f.q.contact = null;
  tick(f);
  assert.equal(f.s.eng.stance, 'crouch', 'personal remembered sight also survives the handoff');
  const until = f.s.eng.advanceLowUntil;
  assert.ok(until > f.b.time);
}

function tick(f) {
  f.r.BattleEngagement.updateSoldier(f.s, f.b);
  f.r.BattleMovementResolver.resolve(f.s, f.b);
}

{
  const f = fixture();
  const e = f.s.eng;
  e.state = 'bound';
  e.until = f.b.time + 10;
  e.cover = { x: f.s.root.position.x, z: f.s.root.position.z + 3, slotId: 'crawl-cover' };
  f.s.suppressedUntil = f.b.time + 5;
  f.s.moveSpeed = 0;
  tick(f);
  assert.equal(e.stance, 'crawl', 'a viable native suppression crawl can start from standing');
  assert.equal(f.r.BattleSoldierIndividuality.desiredGait(f.s, f.b), 'proneFast');
}

{
  const f = fixture();
  f.q.inContact = true;
  f.r.BattleEngagement.updateSoldier(f.s, f.b);
  assert.ok(f.r.BattleEngagement.transitStanceOf(f.s, f.b));
  f.s.eng.state = 'pinned';
  f.r.BattleEngagement.commitStance(f.s, f.b, 'prone', 2, 'suppression');
  f.r.BattleMovementResolver.proposeCombat(f.s, f.s.root.position, f.b, 'hold');
  f.r.BattleMovementResolver.resolve(f.s, f.b);
  assert.equal(f.s.eng.stance, 'prone', 'a later survival state supersedes the queued transit posture');
  assert.equal(f.s.eng.transitStance, null, 'pending stance is consumed, not left for a later move');
}

{
  const f = fixture();
  f.q.inContact = false;
  f.q.contact = { x: 0, z: 100, at: f.b.time, seenBy: 1 };
  tick(f);
  assert.equal(f.s.eng.stance, 'crouch', 'a fresh warning keeps advance low even without live contact');
  assert.equal(f.r.BattleSoldierIndividuality.desiredGait(f.s, f.b), 'crouchWalk');
  assert.equal(f.s._bodyAutonomyIntent, null, 'no speed override was claimed for a quiet warning');
}

{
  const f = fixture();
  const e = f.s.eng;
  e.state = 'bound';
  e.until = f.b.time + 10;
  e.cover = { x: f.s.root.position.x, z: f.s.root.position.z + 1.2, slotId: 'near-cover' };
  tick(f);
  assert.equal(f.s._movementResolver.last.kind, 'cover-bound');
  assert.equal(e.stance, 'crouch', 'the final 1.5m of a bound cannot inherit an upright stance');
  assert.equal(f.r.BattleSoldierIndividuality.desiredGait(f.s, f.b), 'crouchRun');
}

{
  const f = fixture();
  f.q.inContact = true;
  for (let i = 0; i < 12; i++) {
    tick(f);
    assert.equal(f.s.eng.stance, 'stand', 'open contact transit retains the autonomous run');
    assert.equal(f.r.BattleSoldierIndividuality.desiredGait(f.s, f.b), 'run');
    f.b.time += 0.15;
  }
  assert.equal(f.s.eng.stanceTrail.length, 0, 'no crouch/stand intermediate commits or aim-reset churn');
}

console.log('PASS native autonomous movement handoff: warning, final cover approach, stable contact gait');
