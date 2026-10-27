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
  assert.equal(o.response.localSurvivalAuthorized, 1);
  assert.equal(o.response.localSurvivalAccepted, 1);
  assert.equal(o.response.adoptedCoverOrders, 0, 'local survival cannot count as Meso adoption');
  assert.equal(o.response.mesoAdoptedCoverOrders, 0);
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
{
  const h = harness('?firstContactProbe=1');
  h.man.squad.id = 'us-0';
  h.man.incoming = true;
  h.root.BattleTacticalController = {
    summary: () => ({
      live: [{
        capability: 'combat.bound',
        squad: 'us-0',
        actorId: String(h.man.id),
        actionId: 'bound-123',
        stage: 'published',
        reason: 'published:await-personal-adoption'
      }]
    })
  };
  const rec = {
    envelopeId: 'cmd-7', sourceId: 'leader',
    data: { publishKey: 'controller:bound-123' },
    channel: 'voice-direct', relayId: null, hops: 1, unreachable: false,
    issuedAt: 0.3, receivedAt: 0.5, processedAt: 0.6, adoptedAt: 0.8, phase: 'issued'
  };
  h.root.BattleCommandReception = { peek: () => rec };
  h.root.BattleSquadStability = {
    controllerBound: {
      current: () => ({
        lease: { since: 0.3, until: 1.5, untilReason: 'bounded-window' }
      })
    }
  };
  h.tick(0.3);
  h.man.report = { at: 0.45, x: 0, z: 30, source: 'reported' };
  h.man.eng.state = 'bound';
  h.man.eng.cover = { x: 4, z: 0 };
  h.man._movementResolver.goal = { kind: 'cover-bound', point: { x: 4, z: 0 } };
  h.tick(0.45);
  let out = h.root.BattleFirstContactObserver.summary(h.sim);
  assert.equal(out.response.mesoCoverOrders, 1);
  assert.equal(out.response.mesoAdoptedCoverOrders, 0);
  assert.equal(out.soldiers[0].command.envelopeId, 'cmd-7');
  assert.equal(out.soldiers[0].window.expiresAt, 1.5);
  rec.phase = 'adopted';
  h.root.BattleTacticalController.summary = () => ({
    live: [{
      capability: 'combat.bound',
      squad: 'us-0',
      actorId: String(h.man.id),
      actionId: 'bound-123',
      stage: 'adopted',
      reason: 'personally-adopted'
    }]
  });
  h.tick(0.9);
  out = h.root.BattleFirstContactObserver.summary(h.sim);
  assert.equal(out.response.mesoAdoptedCoverOrders, 1);
  assert.equal(out.soldiers[0].command.phase, 'adopted');
  rec.envelopeId = 'cmd-8';
  h.tick(1.05);
  assert.equal(h.root.BattleFirstContactObserver.summary(h.sim).soldiers[0].commandReplaced, true);
  assert.equal(h.root.BattleFirstContactObserver.summary(h.sim).soldiers[0].command.envelopeId, 'cmd-7');
}

/* Native combat urgency counter contract: serialized counters must not be NaN. */
{
  const urgentSource = fs.readFileSync('battle/modules/44-combat-urgency.js', 'utf8');
  function urgentFixture(suppressed) {
    let afterDrill;
    const b = { time: 1, obstacles: [] };
    const man = {
      id: 8,
      faction: 'us',
      dead: false,
      reloading: false,
      clearingStoppage: false,
      suppressedUntil: suppressed ? 5 : 0,
      incoming: !suppressed,
      squad: { state: 'advance' },
      root: { position: { x: 0, z: 0 } },
      eng: { state: 'advance' },
      report: { x: 0, z: 30, at: 1, source: 'reported' }
    };
    const root = {
      location: { search: '?firstContactResponse=1' },
      BATTLE_PREVIEW: true,
      GTMath: {
        dist: (a, c) => Math.hypot(a.x - c.x, a.z - c.z)
      },
      GTLog: () => {},
      SquadAI: {
        soldierContact: s => s.report,
        threatDisposition: () => ({ combatThreat: true })
      },
      BattleObstacleField: { coverPotentialAt: () => 0.96 },
      BattleModules: {
        unitsFor: () => [man],
        registerSystem: () => {}
      },
      BattleMovementResolver: {
        proposeCombat: (s, point, battle, kind) => ({
          owner: 'engagement',
          kind: kind,
          intentPoint: point
        })
      },
      BattleEngagement: {
        extend: (slot, name, fn) => {
          if (slot === 'afterDrill') afterDrill = fn;
        },
        stateOf: s => s.eng,
        underFireNow: s => !!s.incoming,
        findCover: () => ({ x: 4, z: 0, distance: 4 }),
        requestState: (s, battle) => {
          s.eng.state = 'bound';
          s.eng.until = battle.time + 5;
        },
        markUrgent: () => {},
        commitStance: () => {},
        clearUrgent: () => {}
      }
    };
    vm.runInNewContext(urgentSource, { window: root, globalThis: root, console });
    assert.equal(typeof afterDrill, 'function');
    afterDrill(man, b);
    const first = root.BattleCombatUrgency.summary(b);
    afterDrill(man, b);
    const second = root.BattleCombatUrgency.summary(b);
    return { first, second };
  }
  for (const suppressed of [true, false]) {
    const { first, second } = urgentFixture(suppressed);
    assert.equal(first.urgentCoverStarts, 1, 'one physically eligible urgent cover start');
    assert.equal(second.urgentCoverStarts, 1, 'maintaining an order cannot recount a start');
    for (const key of ['suppressedCoverStarts', 'unsuppressedIncomingCoverStarts']) {
      assert.ok(Number.isFinite(first[key]), key + ' must be finite in serialized telemetry');
      assert.equal(second[key], first[key], key + ' increments exactly once');
    }
    assert.equal(first.suppressedCoverStarts, suppressed ? 1 : 0);
    assert.equal(first.unsuppressedIncomingCoverStarts, suppressed ? 0 : 1);
  }
}
console.log('PASS: independent owner stages, reported/sound cues and late physical arrivals');
