#!/usr/bin/env node
'use strict';
/* Tactical owner adapters (13b): each capability the controller can issue reaches the shipping owner
   (Engagement stance, module 20 stations, Commander mission acceptance, module 58 transport) through
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

test('the adapters cover every contract capability except movement, which is listed as missing', () => {
  const w = world(),
    caps = Object.keys(CONTRACT.capabilities);
  assert.deepEqual(w.OA.missing, MOVEMENT);
  caps.forEach(c =>
    assert.equal(
      MOVEMENT.includes(c) ? w.OA.adapters[c] : typeof w.OA.adapters[c],
      MOVEMENT.includes(c) ? undefined : 'function',
      c
    )
  );
  const spec = {
    id: 'owners-only',
    policies: {},
    adapters: w.OA.adapters,
    lifecycle: w.OA.lifecycle
  };
  w.TC.points.forEach(p => (spec.policies[p] = () => {}));
  w.TC.registerProvider(spec);
  assert.equal(
    w.TC.requestMode(w.b, w.us, 'new', 'owners-only').reason,
    'missing-adapter:movement.move',
    'a provider cannot take a squad on these adapters alone'
  );
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
  w.us._transport.endedAt = b.time + 3;
  const ended = w.us._transport.endedAt;
  w.us._transport = null;
  b.time += 20;
  assert.equal(
    w.TC.summary(b).live.find(a => a.actionId === res.actionId).since,
    ended,
    'released at the tracked ride’s end, even once the squad no longer holds it'
  );
  assert.equal(w.TC.requestMode(b, w.us, 'legacy').reason, 'switched');
  assert.equal(w.TC.summary(b).pending, 0);
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

test('static: the adapters add no timer, RNG draw, movement writer or squad/soldier field', () => {
  const src = fs.readFileSync(path.join(H.REPO, 'battle/modules/13b-tactical-owner-adapters.js'), 'utf8');
  assert.doesNotMatch(src, /setTimeout|setInterval|requestAnimationFrame|Math\.random|\.random\(/);
  assert.doesNotMatch(src, /\.destination\s*=(?!=)|proposeOrder|proposeCombat|\.stance\s*=(?!=)/);
  assert.doesNotMatch(src, /\b(sq|s|squad|soldier|man|t|m)\.[A-Za-z_$]+\s*=[^=]/);
});

console.log(n + ' tactical owner adapter checks passed');
