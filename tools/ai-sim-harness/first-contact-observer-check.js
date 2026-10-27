#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('battle/modules/44a-first-contact-observer.js', 'utf8');
function harness(search) {
  let hook;
  const enemy = { dead: false, root: { position: { x: 0, z: 50 } } };
  const man = {
    id: 4,
    faction: 'us',
    role: 'rifleman',
    squad: { inContact: false },
    dead: false,
    hp: 100,
    maxHp: 100,
    moving: false,
    moveSpeed: 0,
    root: { position: { x: 0, z: 0 } },
    eng: { state: 'advance' },
    _movementResolver: { goal: { kind: 'formation' } },
    target: null
  };
  const root = {
    location: { search },
    BATTLE_PREVIEW: true,
    BattleModules: {
      unitsFor: () => [man],
      registerSystem: (_id, spec) => {
        hook = spec;
      }
    },
    BattleEngagement: { underFireNow: s => !!s.incoming },
    SquadAI: {
      threatDisposition: () => ({ combatThreat: true }),
      soldierContact: s => s.report || null
    },
    BattleAmmunition: { shotEvidence: s => s.shot || null },
    BattleObstacleField: { coverPotentialAt: () => 0.96 }
  };
  vm.runInNewContext(source, { window: root, globalThis: root, console });
  const sim = { time: 0 };
  return {
    root,
    sim,
    man,
    enemy,
    hook,
    tick: t => {
      sim.time = t;
      hook.onSimulationStep(sim);
    }
  };
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
  h.man._movementResolver.combat = { kind: 'cover-bound', owner: 'engagement' };
  h.man._movementResolver.last = {
    kind: 'cover-bound',
    owner: 'engagement',
    intentPoint: { x: 4, z: 0 }
  };
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
  assert.equal(o.response.acceptedCoverOrders, 1);
  assert.equal(o.response.selectedCoverOrders, 1);
  assert.equal(o.soldiers[0].coverArrivalEvidence, 'physical-proximity');
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
{
  const h = harness('?firstContactProbe=1');
  h.man.report = { at: 0.3, x: 0, z: 50, source: 'heard' };
  h.tick(0.3);
  assert.equal(h.root.BattleFirstContactObserver.summary(h.sim).cueTypes['sound-only'], 1);
  assert.equal(h.root.BattleFirstContactObserver.summary(h.sim).response.protectiveOrders, 0);
}
{
  const h = harness('?firstContactProbe=1');
  h.man.report = { at: 0.3, x: 0, z: 50, source: 'spoken' };
  h.tick(0.3);
  const out = h.root.BattleFirstContactObserver.summary(h.sim);
  assert.equal(out.cueTypes['reported-sector'], 1);
  assert.equal(out.soldiers[0].reportedDistance, 50);
}
{
  const h = harness('?firstContactProbe=1');
  h.man.incoming = true;
  h.tick(0.15);
  h.man.eng._urgentCover = true;
  h.man.eng.cover = { x: 8, z: 0 };
  h.tick(0.3);
  h.man._movementResolver.combat = { kind: 'contact-reaction', owner: 'engagement' };
  h.man._movementResolver.last = { kind: 'contact-reaction', owner: 'engagement' };
  h.tick(0.45);
  const out = h.root.BattleFirstContactObserver.summary(h.sim);
  assert.equal(out.response.protectiveOrders, 1);
  assert.equal(out.response.acceptedCoverOrders, 0);
  assert.equal(out.response.protectiveArrivals, 0);
  assert.ok(out.soldiers[0].blockers.some(x => x.reason === 'urgent-proposal-not-current'));
}
{
  const h = harness('?firstContactProbe=1');
  h.man.incoming = true;
  h.tick(0.15);
  h.man.eng._urgentCover = true;
  h.man.eng.cover = { x: 5, z: 0 };
  h.man._movementResolver.combat = { kind: 'cover-bound', owner: 'engagement' };
  h.man._movementResolver.last = {
    kind: 'cover-bound',
    owner: 'engagement',
    intentPoint: { x: 5, z: 0 }
  };
  h.tick(0.3);
  h.man.moving = true;
  h.man.root.position.x = 2;
  h.tick(0.6);
  h.man.root.position.x = 5;
  h.man.moving = false;
  h.man.eng._urgentCover = false;
  h.tick(15.3);
  assert.equal(h.root.BattleFirstContactObserver.summary(h.sim).response.lateArrivals, 1);
}
{
  const h = harness('?firstContactProbe=1');
  h.man.incoming = true;
  h.tick(0.15);
  h.man.eng._urgentCover = true;
  h.man.eng.cover = { x: 8, z: 0 };
  h.man._movementResolver.combat = { kind: 'cover-bound', owner: 'engagement' };
  h.man._movementResolver.last = {
    kind: 'cover-bound',
    owner: 'engagement',
    intentPoint: { x: 8, z: 0 }
  };
  h.tick(0.3);
  h.man.eng._urgentCover = false;
  h.root.BattleTacticalController = {
    summary: () => ({
      live: [
        {
          capability: 'combat.bound',
          actorId: String(h.man.id),
          squad: String(h.man.squad.id),
          actionId: 'later-unrelated-bound',
          stage: 'arrived',
          reason: 'physical-arrival'
        }
      ]
    }),
    controls: () => true
  };
  h.tick(0.45);
  const report = h.root.BattleFirstContactObserver.summary(h.sim);
  assert.equal(report.soldiers[0].coverOwner, 'engagement');
  assert.equal(report.response.protectiveArrivals, 0, 'a later controller bound is not this urgent arrival');
}
{
  const h = harness('?firstContactProbe=1');
  h.man.report = { at: 0.3, x: 0, z: 50, source: 'reported' };
  h.man.squad.inContact = true;
  h.root.BattleTacticalController = {
    summary: () => ({ live: [] }),
    controls: () => true
  };
  h.tick(0.3);
  const report = h.root.BattleFirstContactObserver.summary(h.sim);
  assert.equal(report.response.routeWithheldOnContact, 1);
  assert.equal(report.response.protectiveOrders, 0);
}
{
  const h = harness('?firstContactProbe=1');
  h.man.incoming = true;
  h.sim.time = 0.15;
  h.root.BattleFirstContactObserver.coverDecision(h.man, h.sim, 'blocked', 'weapon-cycle');
  h.tick(0.15);
  const report = h.root.BattleFirstContactObserver.summary(h.sim);
  assert.equal(report.soldiers[0].ownerDecisions[0].reason, 'weapon-cycle');
  h.root.BattleFirstContactObserver.coverDecision(h.man, h.sim, 'blocked', 'weapon-cycle');
  assert.equal(
    h.root.BattleFirstContactObserver.summary(h.sim).soldiers[0].ownerDecisions.length,
    1,
    'identical owner rejection is deduplicated'
  );
}
console.log('PASS: independent owner stages, reported/sound cues and late physical arrivals');
