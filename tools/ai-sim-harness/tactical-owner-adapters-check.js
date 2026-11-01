#!/usr/bin/env node
'use strict';
/* Tactical owner adapters (13b): each capability the controller can issue reaches the shipping owner
   (Meso personal movement, the Movement Resolver, Engagement stance, module 20 stations, Commander
   mission acceptance, module 58 transport) through
   that owner's own call, reports its stage from the owner's state, and is cancelled and released by
   the owner when the controller switches back or the action is interrupted. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness'),
  { loadModule } = require('./module-loader');
const CONTRACT = require('../../battle/tactical-capability-contract');
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
const MOVEMENT = ['movement.move', 'movement.hold'];
function world() {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: '?stressAct=0' }),
    systems = {};
  r.BattleModules = {
    registerSystem(id, s) {
      systems[id] = s;
    },
    getSystem: id => systems[id],
    runHook() {},
    registerUnitType() {},
    registerObjectiveType() {},
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  r.BattleTacticalCapabilityContract = CONTRACT;
  loadModule(r, 'battle/modules/13a-tactical-controller.js');
  loadModule(r, 'battle/modules/13b-tactical-owner-adapters.js');
  loadModule(r, 'battle/movement-resolver.js');
  /* The Commander only needs BattleSim to wrap its start; acceptMission is the real transition. */
  r.BattleSim = r.BattleSim || { start() {} };
  loadModule(r, 'battle/commander-doctrine.js');
  loadModule(r, 'battle/commander-routes.js');
  loadModule(r, 'battle/commander-ai.js');
  const b = H.makeBattle(r, { seed: 7 });
  b.time = 10;
  const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 300 } });
  us._macroMission = { owner: 'force-command', intent: 'capture', status: 'issued', version: 1 };
  const policies = {},
    log = [];
  r.BattleTacticalController.points.forEach(p => (policies[p] = ctx => log.push(ctx)));
  const OA = r.BattleTacticalOwnerAdapters,
    adapters = Object.assign({}, OA.adapters);
  MOVEMENT.forEach(c => (adapters[c] = () => false));
  const spec = { id: 'owners', policies, adapters, lifecycle: OA.lifecycle };
  assert.equal(r.BattleTacticalController.registerProvider(spec).ok, true);
  return { r, b, us, TC: r.BattleTacticalController, OA, log, systems };
}
function owned(w) {
  assert.equal(w.TC.requestMode(w.b, w.us, 'new', 'owners').reason, 'switched');
  w.TC.dispatch(w.b, w.us, 'fireAndMovement');
  return w.log[w.log.length - 1];
}
function rifleman(w) {
  return w.us.members.find(m => m.role === 'rifleman');
}

test('the adapters cover every contract capability, so a provider can take a squad on them alone', () => {
  const w = world(),
    caps = Object.keys(CONTRACT.capabilities);
  assert.deepEqual(w.OA.missing, []);
  caps.forEach(c => assert.equal(typeof w.OA.adapters[c], 'function', c));
  const spec = {
    id: 'owners-only',
    policies: {},
    adapters: w.OA.adapters,
    lifecycle: w.OA.lifecycle
  };
  w.TC.points.forEach(p => (spec.policies[p] = () => {}));
  assert.equal(w.TC.registerProvider(spec).ok, true);
  assert.equal(w.TC.requestMode(w.b, w.us, 'new', 'owners-only').reason, 'switched');
});

test('posture.lower goes through the Engagement stance owner, for its own hold time', () => {
  const w = world(),
    ctx = owned(w),
    s = rifleman(w);
  const res = ctx.request('posture.lower', s.id, { stance: 'prone' });
  assert.equal(res.reason, 'owner-accepted');
  assert.equal(s.eng.stance, 'prone');
  assert.ok(
    Math.abs(s.eng.stanceUntil - (w.b.time + w.r.BattleEngagement.tuning.PRONE_HOLD)) < 1e-9,
    'the hold time is the owner’s'
  );
  const raise = ctx.request('posture.lower', s.id, { stance: 'crouch' });
  assert.equal(raise.reason, 'resource-conflict', 'one posture action per man at a time');
  const other = w.us.members.find(m => m !== s && m.role === 'rifleman');
  other.eng = null;
  w.r.BattleEngagement.stateOf(other).stance = 'prone';
  assert.equal(
    ctx.request('posture.lower', other.id, { stance: 'crouch' }).reason,
    'owner-rejected',
    'the owner only lowers'
  );
});

test('station.claim reserves the canonical post through module 20; switching back releases it there', () => {
  const w = world(),
    post = { id: 'w-1', x: 4, z: 6, building: 'b-1', facing: 0 };
  w.r.BattleNavigation = {
    firingStations: [post],
    movementClear: () => true,
    rejectedWindows: [],
    invalidateNavPath() {}
  };
  w.r.BattleTacticalRoute = { createIngress: () => ({ door: 'd-1' }), cancel() {} };
  loadModule(w.r, 'battle/modules/20-building-hardpoints.js');
  w.systems['building-hardpoints'].onBattleStart(w.b);
  w.us.state = 'engaged';
  const ctx = owned(w),
    s = rifleman(w),
    P = w.r.BattleTacticalPositions;
  const res = ctx.request('station.claim', s.id, { stationId: 'w-1', threat: { x: 0, z: 90 } });
  assert.equal(res.reason, 'owner-accepted');
  const task = P.current(s);
  assert.equal(task.station, 'w-1');
  assert.equal(w.TC.summary(w.b).actions, 1);
  const other = w.us.members.find(m => m !== s && m.role === 'rifleman');
  assert.equal(
    ctx.request('station.claim', other.id, { stationId: 'w-1', threat: { x: 0, z: 90 } }).reason,
    'resource-conflict',
    'the same physical slot is refused before the owner sees it'
  );
  assert.equal(w.TC.requestMode(w.b, w.us, 'legacy').reason, 'switched');
  assert.equal(P.current(s), null, 'the owner released the post on the switch');
  assert.equal(task.releaseReason, 'controller:controller-switched');
  assert.equal(w.TC.summary(w.b).actions, 0);
});

test('mission.accept is the Commander’s transition; a newer brief supersedes the action', () => {
  const w = world(),
    ctx = owned(w);
  const res = ctx.request('mission.accept', null, { version: 1 });
  assert.equal(res.reason, 'owner-accepted');
  assert.equal(w.us._macroMission.status, 'executing');
  assert.equal(w.us._macroMission.transition.reason, 'Squad Leader accepted');
  w.us._macroMission = { owner: 'force-command', intent: 'capture', status: 'issued', version: 2 };
  w.TC.dispatch(w.b, w.us, 'fireAndMovement');
  assert.equal(w.TC.summary(w.b).actions, 0, 'the mission change cancelled the old acceptance');
});

test('stage reports the owner’s progress with its reason, read without changing anything', () => {
  const w = world(),
    s = rifleman(w),
    seen = [];
  const keep = w.OA.adapters['posture.lower'];
  w.OA.adapters['posture.lower'] = function (req, sim) {
    seen.push(req);
    return keep(req, sim);
  };
  w.TC.registerProvider({
    id: 'watching',
    policies: Object.fromEntries(w.TC.points.map(p => [p, c => w.log.push(c)])),
    adapters: Object.assign({}, w.OA.adapters, {
      'movement.move': () => false,
      'movement.hold': () => false
    }),
    lifecycle: w.OA.lifecycle
  });
  assert.equal(w.TC.requestMode(w.b, w.us, 'new', 'watching').reason, 'switched');
  w.TC.dispatch(w.b, w.us, 'fireAndMovement');
  w.log[w.log.length - 1].request('posture.lower', s.id, { stance: 'crouch' });
  const before = JSON.stringify(s.eng.stanceTrail);
  const st = w.OA.stage(seen[0]);
  assert.deepEqual(st, { stage: 'committed', reason: 'committed', at: w.b.time });
  assert.equal(JSON.stringify(s.eng.stanceTrail), before, 'reading a stage writes nothing');
  assert.equal(w.OA.stage({}), null, 'an unknown request has no stage');
});

test('transport.consider and transport.cancel run the module 58 journey owner', () => {
  const w = world(),
    r = w.r,
    b = w.b;
  r.location = { search: '?motorTransport=1' };
  b.scene = {
    metadata: {
      battleScenario: {
        profile: 'strategic',
        objectives: [
          { id: 'a', x: 0, z: 0 },
          { id: 'b', x: 0, z: 1400 }
        ],
        roads: [{ fromObjectiveId: 'a', toObjectiveId: 'b', ax: 0, az: 0, bx: 0, bz: 1400, width: 14 }],
        spawnZones: { us: { bases: [{ id: 'us-base-0', objectiveId: 'a', x: 0, z: 0 }] }, ge: { bases: [] } }
      }
    }
  };
  r.BattleSim = { moveTransportPassenger: () => true };
  r.BattleNavigation = { movementClear: () => true, invalidateNavPath() {} };
  loadModule(r, 'battle/modules/58-strategic-abstract-transport.js');
  w.systems['strategic-abstract-transport'].onBattleStart(b);
  w.us._macroMission = {
    owner: 'force-command',
    intent: 'capture',
    status: 'issued',
    version: 1,
    objectiveId: 'b',
    point: { x: 0, z: 1400 },
    route: []
  };
  const ctx = owned(w);
  assert.equal(ctx.request('transport.consider', null, {}).reason, 'owner-accepted');
  assert.equal(w.us._transport.phase, 'boarding');
  assert.equal(
    ctx.request('transport.cancel', null, {}).reason,
    'resource-conflict',
    'a cancel waits until the ride action ends'
  );
  assert.equal(w.TC.requestMode(b, w.us, 'legacy').reason, 'switched');
  assert.ok(
    !w.us._transport || ['boarding', 'embarked'].indexOf(w.us._transport.phase) < 0,
    'switching back ended the ride through its owner'
  );
});

test('transport.cancel stays unreleased while the squad dismounts, so its resources are not reused', () => {
  const w = world(),
    r = w.r,
    b = w.b;
  r.location = { search: '?motorTransport=1' };
  b.scene = {
    metadata: {
      battleScenario: {
        profile: 'strategic',
        objectives: [
          { id: 'a', x: 0, z: 0 },
          { id: 'b', x: 0, z: 1400 }
        ],
        roads: [{ fromObjectiveId: 'a', toObjectiveId: 'b', ax: 0, az: 0, bx: 0, bz: 1400, width: 14 }],
        spawnZones: { us: { bases: [{ id: 'us-base-0', objectiveId: 'a', x: 0, z: 0 }] }, ge: { bases: [] } }
      }
    }
  };
  r.BattleSim = Object.assign(r.BattleSim, { moveTransportPassenger: () => true });
  r.BattleNavigation = { movementClear: () => true, invalidateNavPath() {} };
  loadModule(r, 'battle/modules/58-strategic-abstract-transport.js');
  w.systems['strategic-abstract-transport'].onBattleStart(b);
  const m = {
    owner: 'force-command',
    intent: 'capture',
    status: 'executing',
    version: 1,
    objectiveId: 'b',
    point: { x: 0, z: 1400 },
    route: []
  };
  w.us._macroMission = m;
  assert.ok(r.BattleSquadTransport.considerMission(b, w.us, m), 'legacy started the ride');
  /* The walk to the truck needs a running battle; seat the first man in the boarding order directly. */
  const t = w.us._transport;
  t.access = true;
  t.boardedIds = [t.boardingOrder[0]];
  t.boardedCount = 1;
  const ctx = owned(w);
  const res = ctx.request('transport.cancel', null, {});
  assert.equal(res.reason, 'owner-accepted');
  assert.equal(w.us._transport.phase, 'disembarking');
  const live = w.TC.summary(b).live.find(a => a.actionId === res.actionId);
  assert.equal(live.stage, 'accepted', 'not released while the squad dismounts');
  assert.equal(
    w.TC.requestMode(b, w.us, 'legacy').reason,
    'cleanup-pending',
    'no switch while the dismount still holds the squad'
  );
  assert.equal(w.TC.mode(b, w.us), 'new');
  assert.equal(w.TC.summary(b).pending, 1);
  /* The owner finishes the dismount; the next request completes the release and the switch. */
  w.us._transport.phase = 'aborted';
  assert.equal(w.TC.requestMode(b, w.us, 'legacy').reason, 'switched');
  assert.equal(w.TC.summary(b).pending, 0);
});

test('a ride cancel left to finish reports its release at that ride’s end time', () => {
  const w = world(),
    r = w.r,
    b = w.b,
    ride = { phase: 'embarked', missionVersion: 1, access: false, boardedCount: 0 };
  r.BattleSquadTransport = {
    finish(sim, sq) {
      sq._transport.phase = 'disembarking';
    }
  };
  w.us._macroMission.status = 'executing';
  w.us._transport = ride;
  const ctx = owned(w),
    res = ctx.request('transport.cancel', null, {});
  assert.equal(res.reason, 'owner-accepted');
  ride.phase = 'aborted';
  ride.endedAt = b.time + 3;
  w.us._transport = null;
  b.time += 20;
  const live = w.TC.summary(b).live.find(a => a.actionId === res.actionId);
  assert.equal(live.stage, 'released');
  assert.equal(live.since, ride.endedAt, 'the tracked ride’s end, not the time of the read');
});

test('the controller summary lists each live action with the stage and reason its owner reports', () => {
  const w = world(),
    post = { id: 'w-2', x: 4, z: 6, building: 'b-1', facing: 0 };
  w.r.BattleNavigation = {
    firingStations: [post],
    movementClear: () => true,
    rejectedWindows: [],
    invalidateNavPath() {}
  };
  w.r.BattleTacticalRoute = { createIngress: () => ({ door: 'd-1' }), cancel() {} };
  loadModule(w.r, 'battle/modules/20-building-hardpoints.js');
  w.systems['building-hardpoints'].onBattleStart(w.b);
  w.us.state = 'engaged';
  const ctx = owned(w),
    s = rifleman(w);
  const res = ctx.request('station.claim', s.id, { stationId: 'w-2', threat: { x: 0, z: 90 } });
  assert.deepEqual(w.TC.summary(w.b).live, [
    {
      squad: 'us-0',
      actionId: res.actionId,
      capability: 'station.claim',
      actorId: String(s.id),
      provider: 'owners',
      cleanupPending: false,
      stage: 'assigned',
      reason: 'assigned',
      since: w.b.time
    }
  ]);
});

test('a stage carries the owner’s own time for the change, however late it is read', () => {
  const w = world(),
    post = { id: 'w-3', x: 4, z: 6, building: 'b-1', facing: 0 };
  w.r.BattleNavigation = {
    firingStations: [post],
    movementClear: () => true,
    rejectedWindows: [],
    invalidateNavPath() {}
  };
  w.r.BattleTacticalRoute = { createIngress: () => ({ door: 'd-1' }), cancel() {} };
  loadModule(w.r, 'battle/modules/20-building-hardpoints.js');
  w.systems['building-hardpoints'].onBattleStart(w.b);
  w.us.state = 'engaged';
  const ctx = owned(w),
    s = rifleman(w);
  ctx.request('station.claim', s.id, { stationId: 'w-3', threat: { x: 0, z: 90 } });
  const task = w.r.BattleTacticalPositions.current(s);
  task.occupiedAt = w.b.time + 2;
  w.b.time += 30;
  const live = w.TC.summary(w.b).live[0];
  assert.equal(live.stage, 'occupied');
  assert.equal(live.since, task.occupiedAt, 'since is when the owner saw it, not when it was read');
});

/* Movement needs the shipping Squad Command stack (module 16), Command Reception and the resolver. */
function moving(search) {
  H.resetIds();
  const r = H.bootstrap({ search: search || '?stressAct=0&commandRelay=0' });
  r.BattleTacticalCapabilityContract = CONTRACT;
  loadModule(r, 'battle/movement-resolver.js');
  loadModule(r, 'battle/modules/13a-tactical-controller.js');
  loadModule(r, 'battle/modules/13b-tactical-owner-adapters.js');
  const b = H.makeBattle(r, { seed: 57 });
  b.time = 10;
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 120 },
    facing: 0
  });
  q.state = 'advance';
  q.commandPhase = 'approach';
  q.orderAnchor = { x: 0, z: 0 };
  q.rally = { x: 0, z: 0 };
  q.objective = { x: 0, z: 120 };
  q._macroMission = { owner: 'force-command', intent: 'capture', status: 'executing', version: 1 };
  const TC = r.BattleTacticalController,
    OA = r.BattleTacticalOwnerAdapters,
    log = [],
    seen = [],
    adapters = {};
  Object.keys(OA.adapters).forEach(
    c =>
      (adapters[c] = function (req, sim) {
        seen.push(req);
        return OA.adapters[c](req, sim);
      })
  );
  const policies = {};
  TC.points.forEach(p => (policies[p] = ctx => log.push(ctx)));
  assert.equal(TC.registerProvider({ id: 'owners', policies, adapters, lifecycle: OA.lifecycle }).ok, true);
  assert.equal(TC.requestMode(b, q, 'new', 'owners').reason, 'switched');
  r.SquadAI.updateSquad(q, b);
  const s = q.members.find(m => m.role === 'rifleman');
  return { r, b, q, TC, OA, log, seen, s, ctx: log[log.length - 1] };
}
function at(s, p) {
  s.root.position.x = p.x;
  s.root.position.z = p.z;
}
function slotOf(s) {
  return 'movement|soldier:' + String(s.id);
}

test('movement.move is a Meso personal order: published, adopted, applied, resolved, arrived', () => {
  const w = moving(),
    CR = w.r.BattleCommandReception,
    R = w.r.BattleMovementResolver,
    goal = { x: 8, z: 30 };
  assert.equal(CR.movementEnabled(), true);
  const res = w.ctx.request('movement.move', w.s.id, { point: goal });
  assert.equal(res.reason, 'owner-accepted');
  const req = w.seen[w.seen.length - 1],
    rec = CR.peek(w.s, w.b, 'movement', 'soldier:' + String(w.s.id));
  assert.equal(rec.data.publishKey, 'controller:' + res.actionId, 'Meso published the controller’s order');
  assert.deepEqual(w.OA.stage(req), { stage: 'published', reason: rec.phase, at: rec.issuedAt });
  assert.notEqual(w.s._fireteamPublishKey, rec.data.publishKey, 'not applied before the man adopts it');

  w.b.time = rec.adoptedAt + 0.01;
  assert.deepEqual(w.OA.stage(req), { stage: 'adopted', reason: 'adopted', at: rec.adoptedAt });
  w.r.SquadAI.updateSquad(w.q, w.b);
  assert.equal(w.s._fireteamAdoptedEnvelope, rec.envelopeId, 'Squad Command carried it on its own tick');
  assert.equal(w.s._fireteamPublishKey, rec.data.publishKey);
  R.resolve(w.s, w.b);
  assert.equal(w.OA.stage(req).stage, 'resolved');
  at(w.s, w.s._movementResolver.last.intentPoint);
  assert.equal(w.OA.stage(req).stage, 'arrived');
  const live = w.TC.summary(w.b).live.find(a => a.actionId === res.actionId);
  assert.equal(live.stage, 'arrived');
});

test('a controller order is carried by Squad Command, not by the legacy fireteam slots', () => {
  const w = moving(),
    goal = { x: -12, z: 40 },
    res = w.ctx.request('movement.move', w.s.id, { point: goal }),
    CR = w.r.BattleCommandReception;
  const first = CR.peek(w.s, w.b, 'movement', 'soldier:' + String(w.s.id));
  w.b.time += 0.2;
  w.r.SquadAI.updateSquad(w.q, w.b);
  const again = CR.peek(w.s, w.b, 'movement', 'soldier:' + String(w.s.id));
  assert.equal(again.envelopeId, first.envelopeId, 'the pending order is not replaced while he processes it');
  assert.equal(again.data.publishKey, 'controller:' + res.actionId, 'no fireteam slot was published over it');
});

test('switching back ends the controller order at its owner; legacy fireteams publish again', () => {
  const w = moving(),
    res = w.ctx.request('movement.move', w.s.id, { point: { x: 5, z: 20 } }),
    req = w.seen[w.seen.length - 1],
    CR = w.r.BattleCommandReception;
  assert.equal(w.TC.requestMode(w.b, w.q, 'legacy').reason, 'switched');
  assert.equal(w.TC.summary(w.b).actions, 0);
  assert.equal(w.OA.stage(req).stage, 'cancelled');
  assert.equal(w.r.BattleSquadStability.controllerMovement.current(w.s, null), false);
  w.b.time += 0.5;
  w.r.SquadAI.updateSquad(w.q, w.b);
  const rec = CR.peek(w.s, w.b, 'movement', 'soldier:' + String(w.s.id));
  assert.notEqual(rec.data.publishKey, 'controller:' + res.actionId, 'Meso’s own slot replaced it');
});

test('movement.move is refused for a man in survival movement; the owner keeps it', () => {
  const w = moving();
  w.s._survivalMovementKey = 'survival';
  assert.equal(w.ctx.request('movement.move', w.s.id, { point: { x: 5, z: 20 } }).reason, 'owner-rejected');
});

test('without personal adoption the order applies at once and says so', () => {
  const w = moving('?stressAct=0&commandRelay=0&commandMovement=0'),
    res = w.ctx.request('movement.move', w.s.id, { point: { x: 3, z: 25 } }),
    req = w.seen[w.seen.length - 1];
  assert.equal(res.reason, 'owner-accepted');
  assert.equal(w.s._fireteamPublishKey, 'controller:' + res.actionId);
  assert.deepEqual(w.OA.stage(req), { stage: 'applied', reason: 'adoption-off', at: w.b.time });
});

test('movement.hold is one native resolver hold the resolver ends itself', () => {
  const w = moving(),
    R = w.r.BattleMovementResolver,
    here = { x: w.s.root.position.x, z: w.s.root.position.z };
  const res = w.ctx.request('movement.hold', w.s.id, { point: here }),
    req = w.seen[w.seen.length - 1],
    p = w.s._movementResolver.combat;
  assert.equal(res.reason, 'owner-accepted');
  assert.equal(p.owner, 'tactical-controller');
  assert.equal(p.kind, 'hold');
  assert.equal(p.until, Infinity, 'no expiry of its own; nothing refreshes it');
  R.resolve(w.s, w.b);
  assert.equal(w.s._movementResolver.last.owner, 'tactical-controller');
  assert.equal(w.OA.stage(req).stage, 'holding');
  w.b.time += 60;
  R.resolve(w.s, w.b);
  assert.equal(w.OA.stage(req).stage, 'holding', 'still held a minute later without any refresh');
  w.q.commandPhase = 'assault';
  R.resolve(w.s, w.b);
  assert.deepEqual(
    [w.OA.stage(req).stage, w.OA.stage(req).reason],
    ['cancelled', 'owner:replaced'],
    'a new squad phase ended the hold at the resolver'
  );
  assert.equal(w.OA.lifecycle.release(req), true);
});

test('movement.hold reports when a higher authority outranks it, and cancel withdraws only its own hold', () => {
  const w = moving(),
    R = w.r.BattleMovementResolver,
    here = { x: w.s.root.position.x, z: w.s.root.position.z };
  w.ctx.request('movement.hold', w.s.id, { point: here });
  const req = w.seen[w.seen.length - 1],
    p = w.s._movementResolver.combat;
  w.r.BattleTacticalPositions = { update: () => ({ position: { x: 30, z: 30 } }), waypoint: () => null };
  R.resolve(w.s, w.b);
  assert.deepEqual(w.OA.stage(req).reason, 'outranked:firing-station');
  assert.equal(w.s._movementResolver.combat, p, 'the post outranks the hold without discarding it');
  assert.equal(w.TC.requestMode(w.b, w.q, 'legacy').reason, 'switched');
  assert.equal(w.s._movementResolver.combat, null, 'the switch withdrew the controller hold');
  const other = w.q.members.find(m => m !== w.s && m.role === 'rifleman');
  const theirs = R.proposeCombat(other, { x: 1, z: 1 }, w.b, 'hold', 2, { source: 'test' });
  w.OA.lifecycle.cancel(req, 'cancelled');
  assert.equal(other._movementResolver.combat, theirs, 'another man’s hold is untouched');
});

test('finishing an action ends its order, hold or post at the owner, so nothing stays pending', () => {
  const w = moving(),
    R = w.r.BattleMovementResolver,
    M = w.r.BattleSquadStability.controllerMovement,
    other = w.q.members.find(m => m !== w.s && m.role === 'rifleman');
  const move = w.ctx.request('movement.move', w.s.id, { point: { x: 5, z: 20 } }),
    order = w.seen[w.seen.length - 1];
  const hold = w.ctx.request('movement.hold', other.id, {
      point: { x: other.root.position.x, z: other.root.position.z }
    }),
    proposal = other._movementResolver.combat;
  assert.equal(w.ctx.finish(move.actionId, 'completed'), true);
  assert.equal(w.ctx.finish(hold.actionId, 'completed'), true);
  assert.equal(w.TC.summary(w.b).pending, 0, 'nothing left waiting for cleanup');
  assert.equal(M.current(w.s, order.order), false);
  assert.notEqual(other._movementResolver.combat, proposal, 'the hold was withdrawn at the resolver');
  assert.equal(
    w.ctx.request('movement.hold', w.s.id, { point: { x: 1, z: 1 } }).reason,
    'owner-accepted',
    'the man’s locomotion is free again'
  );
  assert.equal(w.TC.requestMode(w.b, w.q, 'legacy').reason, 'switched');
  assert.equal(R.arrival, 1.8);
});

test('finishing a station claim releases the post at module 20', () => {
  const w = world(),
    post = { id: 'w-4', x: 4, z: 6, building: 'b-1', facing: 0 };
  w.r.BattleNavigation = {
    firingStations: [post],
    movementClear: () => true,
    rejectedWindows: [],
    invalidateNavPath() {}
  };
  w.r.BattleTacticalRoute = { createIngress: () => ({ door: 'd-1' }), cancel() {} };
  loadModule(w.r, 'battle/modules/20-building-hardpoints.js');
  w.systems['building-hardpoints'].onBattleStart(w.b);
  w.us.state = 'engaged';
  const ctx = owned(w),
    s = rifleman(w),
    P = w.r.BattleTacticalPositions;
  const res = ctx.request('station.claim', s.id, { stationId: 'w-4', threat: { x: 0, z: 90 } });
  const task = P.current(s);
  task.occupiedAt = w.b.time;
  assert.equal(ctx.finish(res.actionId, 'completed'), true);
  assert.equal(P.current(s), null, 'the owner released the post');
  assert.equal(task.releaseReason, 'controller:completed');
  assert.equal(w.TC.summary(w.b).pending, 0);
  assert.equal(w.TC.requestMode(w.b, w.us, 'legacy').reason, 'switched');
});

test('static: the adapters add no timer, RNG draw, movement writer or squad/soldier field', () => {
  const src = fs.readFileSync(path.join(H.REPO, 'battle/modules/13b-tactical-owner-adapters.js'), 'utf8');
  assert.doesNotMatch(src, /setTimeout|setInterval|requestAnimationFrame|Math\.random|\.random\(/);
  assert.doesNotMatch(src, /\.destination\s*=(?!=)|proposeOrder|publishPersonalMovement|\.stance\s*=(?!=)/);
  /* The one resolver proposal is the native hold, under the controller's own source name. */
  assert.equal((src.match(/proposeCombat\(/g) || []).length, 1);
  assert.match(
    src,
    /proposeCombat\(s, req\.params\.point, sim, 'hold', Infinity, \{\s*source: 'tactical-controller'/
  );
  assert.doesNotMatch(src, /\b(sq|s|squad|soldier|man|t|m)\.[A-Za-z_$]+\s*=[^=]/);
});

console.log(n + ' tactical owner adapter checks passed');
