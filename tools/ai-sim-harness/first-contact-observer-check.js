#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('battle/modules/44a-first-contact-observer.js', 'utf8');
function harness(search) {
  let hook;
  const enemy = { dead: false, root: { position: { x: 0, z: 50 } } };
  const man = { id: 4, faction: 'us', role: 'rifleman', squad: { inContact: false },
    dead: false, hp: 100, maxHp: 100, moving: false, moveSpeed: 0,
    root: { position: { x: 0, z: 0 } }, eng: { state: 'advance' },
    _movementResolver: { goal: { kind: 'formation' } }, target: null };
  const root = { location: { search }, BATTLE_PREVIEW: true,
    BattleModules: { unitsFor: () => [man], registerSystem: (_id, spec) => { hook = spec; } },
    BattleEngagement: { underFireNow: s => !!s.incoming },
    SquadAI: { threatDisposition: () => ({ combatThreat: true }), soldierContact: () => null },
    BattleAmmunition: { shotEvidence: s => s.shot || null } };
  vm.runInNewContext(source, { window: root, globalThis: root, console });
  const sim = { time: 0 };
  return { root, sim, man, enemy, hook, tick: t => { sim.time = t; hook.onSimulationStep(sim); } };
}
{
  const h = harness('?firstContactProbe=1');
  h.tick(0.15);
  assert.equal(h.root.BattleFirstContactObserver.summary(h.sim).response.seen, 0);
  h.man.target = h.enemy;
  h.tick(0.3);
  h.man.target = null;
  h.man.eng.state = 'orient';
  h.tick(0.45);
  h.man.shot = { at: 0.6 };
  h.tick(0.6);
  h.man.eng._urgentCover = true;
  h.man.eng._urgentCoverCause = 'incoming-fire';
  h.man.eng.cover = { x: 4, z: 0 };
  h.man._movementResolver.goal = { kind: 'cover-bound' };
  h.man.moving = true;
  h.man.moveSpeed = 3;
  h.tick(0.75);
  h.man.root.position.x = 2;
  h.tick(0.9);
  h.man.root.position.x = 4;
  h.man.moving = false;
  h.man.eng._urgentCoverArrivedAt = 1.05;
  h.tick(1.05);
  const o = h.root.BattleFirstContactObserver.summary(h.sim);
  assert.equal(o.response.seen, 1);
  assert.equal(o.cueTypes['visual-threat'], 1);
  assert.equal(o.response.shots, 1);
  assert.equal(o.response.protectiveMoves, 1);
  assert.equal(o.response.protectiveArrivals, 1);
  assert.equal(o.response.incomingCoverOrders, 1);
  assert.equal(o.soldiers[0].firstShot, 0.6);
  h.hook.onBattleRestart(h.sim);
  assert.equal(h.root.BattleFirstContactObserver.summary(h.sim).response.seen, 0);
}
{
  const h = harness('?firstContactProbe=1');
  h.man.incoming = true;
  h.tick(0.15);
  assert.equal(h.root.BattleFirstContactObserver.summary(h.sim).cueTypes['incoming-fire'], 1);
}
{
  const h = harness('?firstContactProbe=0');
  h.man.target = h.enemy;
  h.tick(0.15);
  assert.equal(h.root.BattleFirstContactObserver.summary(h.sim).enabled, false);
}
console.log('PASS: cue classification, actual delayed shot, physical cover move, arrival and restart');
