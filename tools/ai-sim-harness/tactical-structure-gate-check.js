#!/usr/bin/env node
'use strict';
/* Controlled march and the structure security chain (13c/15j/15l, `?controllerStructure=0` the control), on
   the real chain (15n) and shipping Navigation: the march waits at a building leg until the chain accepts
   the crossing, the chain sees the leg the provider is on (Squad Leader execution publishes it into
   routeIndex), a wait says why and ends at the stall-replan budget, and the gates agree. */
const assert = require('node:assert/strict');
const H = require('./harness');
const CONTRACT = require('../../battle/tactical-capability-contract');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');
/* Entry gate on, structure orders off: the case where the wait must still be able to end. */
const CHAIN = '&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1';
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function world(extra, chain) {
  H.resetIds();
  const r = H.bootstrap({
      modules: false,
      search:
        '?coa=0&fireControl=0&slStress=0&scoutsForward=0&stressAct=0&commandMovement=0&commandRelay=0&tacticalController=new' +
        (chain || CHAIN) +
        (extra || '')
    }),
    systems = {};
  r.BattleTacticalCapabilityContract = CONTRACT;
  r.BattleModules = {
    registerSystem: (id, s) => (systems[id] = s),
    unitsFor: b => b._roster.us.concat(b._roster.ge)
  };
  r.BattleTelemetry = { record() {} };
  r.BattleCommanderDoctrine = {
    policyFor: () => ({ cohesionRadius: 34, captainlessCohesion: 26, routeArrivalRadius: 8 })
  };
  r.BattleCommanderAI = {
    strategicStallReplan: 120,
    policyFor: () => ({ routeArrivalRadius: 8 }),
    acceptMission(b, q) {
      q._macroMission.status = 'executing';
    }
  };
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/movement-resolver.js');
  load('battle/objective-system.js');
  loadSquadCommandStack((root, f) => load(f), r);
  load('battle/modules/13a-tactical-controller.js');
  load('battle/modules/13b-tactical-owner-adapters.js');
  load('battle/modules/13c-tactical-march-provider.js');
  load('battle/modules/13d-tactical-contact-skills.js');
  load('battle/modules/46-ammunition-stoppages.js');
  load('battle/modules/08-soldier-events.js');
  load('battle/modules/17-soldier-mind.js');
  loadModule(r, 'battle/battle-navigation.js', { console: quietConsole, location: r.location });
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 400 } });
  const house = {
    id: 'farmhouse',
    x: 0,
    z: 200,
    w: 16,
    d: 14,
    rot: 0.4,
    openings: [{ id: 'farm-door', type: 'door', side: 'south', offset: 0, width: 2 }]
  };
  const scenario = { buildings: [house], roads: [] };
  b.scene = { metadata: { battleScenario: scenario } };
  r.BattleNavigation.installScenario(scenario);
  q.members.forEach(s => r.BattleAmmunition.initialize(s, b));
  const route = [
    { x: 0, z: 0 },
    { x: 0, z: 200 },
    { x: 0, z: 300 }
  ];
  q._macroMission = {
    version: 1,
    status: 'issued',
    intent: 'capture',
    action: 'assault',
    point: { x: 0, z: 400 },
    route: route.map(p => Object.assign({}, p)),
    objectiveId: 'a'
  };
  b._objectiveById = { a: { id: 'a', def: { radius: 30 }, handler: {}, state: { owner: 'us' } } };
  b._movementRoot = r;
  b.time = 1;
  systems['tactical-march-provider'].onBattleStart(b);
  const S = r.BattleSquadStability;
  S.executeMission(b, q, null);
  return { r, b, q, S, P: S.localPlan, TC: r.BattleTacticalController, MP: r.BattleTacticalMarchProvider };
}
function approach(w) {
  const p = w.r.BattleNavigation.doorPortals[0],
    leader = w.r.SquadAI.leaderOf(w.q);
  w.q.members.forEach(s => {
    s.root.position.x = 0;
    s.root.position.z = 196;
  });
  leader.root.position.x = p.outside.x;
  leader.root.position.z = p.outside.z;
  return { p, leader };
}
function row(w) {
  return w.MP.summary(w.b).find(x => x.squad === 'us:us-0');
}
function step(w) {
  w.b.time += 0.45;
  w.P.update(w.b, w.q);
  w.S.executeMission(w.b, w.q, null);
}
function stepFor(w, seconds) {
  for (let t = 0; t < seconds; t += 0.45) step(w);
}

test('the chain sees the provider’s leg: Squad Leader execution publishes it into routeIndex', () => {
  const w = world();
  assert.equal(w.TC.controls(w.b, w.q), true);
  approach(w);
  step(w);
  step(w);
  assert.equal(row(w).leg, 1);
  assert.equal(w.q.routeIndex, 1, 'routeIndex follows the leg the provider is on');
  assert.equal(w.P.entryRequired(w.b, w.q, w.q.route[1]), true);
});

test('the march waits at the doorway leg, says why, and goes on once the chain accepts the crossing', () => {
  const w = world(),
    g = approach(w);
  stepFor(w, 3);
  assert.equal(row(w).leg, 1, 'exterior proximity does not advance a building-bound leg');
  assert.equal(row(w).waiting, 'entry-pending');
  g.leader.root.position.x = g.p.inside.x;
  g.leader.root.position.z = g.p.inside.z;
  w.b.time += 0.45;
  w.P.update(w.b, w.q);
  assert.equal(w.P.entrySatisfied(w.b, w.q, w.q.route[1]), true, 'the real chain accepted the entry');
  w.S.executeMission(w.b, w.q, null);
  assert.equal(row(w).leg, 2, 'accepted: on to the next leg');
  assert.equal(row(w).waiting, null);
  assert.equal(w.q.routeIndex, 2);
});

test('a wait is bounded by the General’s stall-replan budget and then reports a timeout', () => {
  const w = world();
  approach(w);
  stepFor(w, 100);
  assert.equal(row(w).leg, 1);
  assert.equal(row(w).waiting, 'entry-pending');
  stepFor(w, 30);
  assert.equal(row(w).leg, 2, 'past the budget the march moves on');
});

test('?controllerStructure=0 is the old march: no wait, no routeIndex publication', () => {
  const w = world('&controllerStructure=0');
  approach(w);
  stepFor(w, 3);
  assert.equal(row(w).leg, 2);
  assert.equal(row(w).waiting, null);
});

test('with the entry gate on and structure orders off the chain still updates, so the wait can end', () => {
  const w = world();
  assert.equal(w.P.structureOrdersOn, false);
  assert.equal(w.P.entryGateOn, true);
  approach(w);
  stepFor(w, 1);
  assert.ok(w.q._localTask, 'the chain ran for the controlled squad');
});

test('after a firefight on the building leg the lease is re-granted through the same path, not left to time out', () => {
  const w = world(
    '',
    CHAIN + '&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1'
  );
  approach(w);
  stepFor(w, 1);
  const L = w.r.BattleLeases;
  assert.ok(L.get(w.q, 'route-transition'), 'the leg has its lease');
  w.q.inContact = true;
  step(w);
  assert.equal(L.get(w.q, 'route-transition'), null, 'contact ends it, as for a legacy squad');
  assert.ok(w.q._missionExecution.contactRouteResume, 'and records the resume');
  step(w);
  assert.equal(L.get(w.q, 'route-transition'), null, 'no lease while the firefight lasts');
  w.q.inContact = false;
  step(w);
  const lease = L.get(w.q, 'route-transition');
  assert.ok(lease && /after contact/.test(lease.reason || lease.why || JSON.stringify(lease)), 'resumed');
  assert.equal(lease.data.leg, 1);
  assert.equal(w.q._missionExecution.contactRouteResume, null);
});

console.log(n + ' controller structure checks passed');
