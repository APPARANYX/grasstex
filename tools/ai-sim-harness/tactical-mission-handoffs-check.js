'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule } = require('./module-loader');
const CONTRACT = require('../../battle/tactical-capability-contract');
let checks = 0;
let failures = 0;
function test(name, fn) {
  try {
    fn();
    checks++;
    console.log('PASS ' + name);
  } catch (error) {
    failures++;
    console.error('FAIL ' + name + ': ' + error.message);
  }
}
function world(intent = 'capture', flags = '', controller = true) {
  H.resetIds();
  const r = H.bootstrap({
    search:
      (controller ? '?tacticalController=new' : '?x=1') +
      '&commandMovement=1&commandRelay=0&stressAct=0&scoutsForward=0' +
      flags
  });
  const systems = {};
  r.BattleModules.registerSystem = (id, hooks) => (systems[id] = hooks);
  r.BattleTacticalCapabilityContract = CONTRACT;
  for (const file of [
    'battle/movement-resolver.js',
    'battle/modules/13a-tactical-controller.js',
    'battle/modules/13b-tactical-owner-adapters.js',
    'battle/modules/13c-tactical-march-provider.js',
    'battle/modules/13d-tactical-contact-skills.js'
  ])
    loadModule(r, file, { location: r.location });
  r.BattleCommanderAI = {
    policyFor: () => ({
      routeArrivalRadius: 8,
      cohesionRadius: 34,
      captureCommitRatio: 0.82,
      supportDelay: 20
    })
  };
  r.BattleObjectiveSystem = { get: () => ({ def: { radius: 30 } }) };
  const b = H.makeBattle(r, { seed: +(process.env.HARNESS_SEED || 57) });
  b.time = 10;
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 300 } });
  q.commandPhase = 'reserve';
  q.state = 'advance';
  q.orderAnchor = { x: 0, z: 0 };
  q._macroMission = {
    version: 1,
    status: 'executing',
    intent,
    objectiveId: 'objective-1',
    point: { x: 0, z: 300 },
    route: [],
    observations: { squad: { position: { x: 0, z: 0 } } }
  };
  if (systems['tactical-march-provider']) systems['tactical-march-provider'].onBattleStart(b);
  return { r, b, q, Q: r.BattleSquadStability, R: r.BattleMovementResolver, TC: r.BattleTacticalController };
}
function tick(w) {
  w.Q.executeMission(w.b, w.q, null);
  w.r.SquadAI.updateSquad(w.q, w.b);
  assert.equal(w.TC.summary(w.b).stats.faults, 0);
}
function placeAll(w, z) {
  w.q.members.forEach(s => {
    s.root.position.x = 0;
    s.root.position.z = z;
  });
}
function record(w, s) {
  return w.r.BattleCommandReception.peek(s, w.b, 'movement', 'soldier:' + s.id);
}

test('a capture brief leaves reserve through the phase owner and enters capture only inside its objective', () => {
  const w = world();
  tick(w);
  assert.equal(w.q.commandPhase, 'assault');
  assert.deepEqual(w.q.objective, { x: 0, z: 300 });
  assert.equal(w.q._commandPhaseTransition.from, 'reserve');
  assert.equal(w.q._commandPhaseTransition.entry, 'mission');
  placeAll(w, 290);
  w.b.time += 0.45;
  tick(w);
  assert.equal(w.q.commandPhase, 'capture');
});

test('mission execution receipts report owner application and release cannot undo a committed brief', () => {
  const w = world();
  let ctx;
  const policies = Object.fromEntries(
    w.TC.points.map(point => [
      point,
      value => {
        ctx = value;
      }
    ])
  );
  const OA = w.r.BattleTacticalOwnerAdapters;
  assert.equal(
    w.TC.registerProvider({
      id: 'mission-receipts',
      policies,
      adapters: OA.adapters,
      lifecycle: OA.lifecycle
    }).ok,
    true
  );
  assert.equal(w.TC.requestMode(w.b, w.q, 'new', 'mission-receipts').ok, true);
  w.Q.executeMission(w.b, w.q, null);
  const params = { leg: 0, phase: 'assault', point: { x: 0, z: 300 } };
  assert.equal(ctx.request('mission.execute', null, { ...params, leg: 99 }).reason, 'owner-rejected');
  const result = ctx.request('mission.execute', null, params);
  assert.equal(result.ok, true);
  assert.equal(ctx.stage(result.actionId).stage, 'applied');
  ctx.finish(result.actionId, 'completed');
  assert.equal(w.TC.summary(w.b).actions, 0);
  assert.equal(w.q.commandPhase, 'assault', 'release never rolls back mission state');
  w.q._macroMission = { ...w.q._macroMission, version: 2 };
  assert.equal(ctx.request('mission.execute', null, params).reason, 'stale-mission');
});

test('reserve, hold and defend briefs convert their final objective without legacy mission policy', () => {
  for (const [intent, phase] of [
    ['reserve', 'reserve'],
    ['hold', 'hold'],
    ['defend', 'assault']
  ]) {
    const w = world(intent);
    tick(w);
    assert.equal(w.q.commandPhase, phase);
    assert.deepEqual(w.q.objective, { x: 0, z: 300 });
    if (intent === 'defend') {
      placeAll(w, 290);
      w.b.time += 0.45;
      tick(w);
      assert.equal(w.q.commandPhase, 'defend');
    }
  }
});

test('mission supersession replaces a hold objective and retreat keeps its own phase', () => {
  const w = world('hold');
  tick(w);
  w.q._macroMission = { ...w.q._macroMission, version: 2, intent: 'capture', point: { x: 200, z: 400 } };
  w.b.time += 0.45;
  tick(w);
  assert.equal(w.q.commandPhase, 'assault');
  assert.deepEqual(w.q.objective, { x: 200, z: 400 });
  w.q.state = 'retreat';
  w.q.commandPhase = 'regroup';
  w.TC.dispatch(w.b, w.q, 'executeMission');
  assert.equal(w.q.commandPhase, 'regroup');
});

test('dismount and abort consume Meso route adoption once and physically resume after the passed corner', () => {
  for (const phase of ['dismounted', 'aborted']) {
    const w = world('screen');
    w.q._macroMission.route = [{ x: 0, z: 150 }];
    tick(w);
    const keys = w.q.members.map(s => record(w, s).data.publishKey);
    placeAll(w, 200);
    w.q.members.forEach(s => w.R.restoreAfterTransport(s));
    w.q._transport = {
      phase,
      missionVersion: 1,
      travelled: 200,
      initialPosition: { x: 0, z: 0 },
      vehicleId: 'truck-1'
    };
    w.b.time += 0.45;
    tick(w);
    assert.equal(w.q.routeIndex, 1, 'native route adoption passed the corner');
    const row = w.r.BattleTacticalMarchProvider.summary(w.b)[0];
    assert.equal(row.leg, 1, 'controller consumes the same native handoff');
    const resumed = w.q.members.map(s => record(w, s).data.publishKey);
    assert.ok(
      resumed.every((key, i) => key !== keys[i]),
      'old action handles released'
    );
    const resumedActions = w.TC.summary(w.b).live.map(action => action.actionId);
    w.b.time += 0.45;
    w.Q.executeMission(w.b, w.q, null);
    assert.deepEqual(
      w.TC.summary(w.b).live.map(action => action.actionId),
      resumedActions,
      'handoff is not repeated'
    );
    // A later squad tick may legitimately publish the next paced formation stride (#662).
    w.r.SquadAI.updateSquad(w.q, w.b);
    for (let step = 0; step < 18; step++) {
      H.run(w.r, w.b, 0.45);
      tick(w);
    }
    assert.ok(
      w.q.members.every(s => s.root.position.z > 202),
      'real infantry movement continues forward'
    );
  }
});

test('a transport reset of a final-leg hold gets a fresh move after native adoption on that same leg', () => {
  const w = world();
  // A route-only endpoint uses controller hold; an objective capture yields to prepared posts (#662).
  delete w.q._macroMission.objectiveId;
  tick(w);
  placeAll(w, 300);
  w.Q.publishAnchor(w.q, { x: 0, z: 300 });
  tick(w);
  const s = w.q.members[3],
    r = record(w, s);
  w.b.time = Math.max(...w.q.members.map(man => record(w, man).adoptedAt)) + 0.01;
  tick(w);
  w.R.resolve(s, w.b);
  s.root.position.x = r.point.x;
  s.root.position.z = r.point.z;
  tick(w);
  assert.equal(s._movementResolver.combat.owner, 'tactical-controller');
  placeAll(w, 200);
  w.q.members.forEach(man => w.R.restoreAfterTransport(man));
  w.q._transport = {
    phase: 'dismounted',
    missionVersion: 1,
    travelled: 200,
    initialPosition: { x: 0, z: 0 }
  };
  w.b.time += 0.45;
  tick(w);
  assert.equal(w.q.routeIndex, 0);
  assert.notEqual(record(w, s).data.publishKey, r.data.publishKey);
  assert.equal(w.TC.summary(w.b).pending, 0);
  assert.equal(w.r.BattleTacticalMarchProvider.summary(w.b)[0].stopped['owner:replaced'], undefined);
  for (let step = 0; step < 18; step++) {
    H.run(w.r, w.b, 0.45);
    tick(w);
  }
  assert.ok(s.root.position.z > 202, 'a terminal old hold does not strand the dismounted man');
});

test('ending Meso movement cannot resurrect its release position after a combat bound', () => {
  const w = world();
  tick(w);
  const s = w.q.members[3];
  const order = w.Q.controllerMovement.publish(w.q, w.b, s, { x: 0, z: 120 }, 'release-probe');
  w.b.time += 3;
  w.r.SquadAI.updateSquad(w.q, w.b);
  w.Q.controllerMovement.end(s, order);
  const released = { x: s.root.position.x, z: s.root.position.z };
  s.eng.state = 'bound';
  w.R.proposeCombat(s, { x: 0, z: -20 }, w.b, 'cover-bound', 10, {
    source: 'engagement',
    reason: 'suppressed cover move'
  });
  w.R.resolve(s, w.b);
  s.root.position.z -= 20;
  s.eng.state = 'advance';
  w.R.clearCombat(s);
  w.b.time += 3;
  const pick = w.R.resolve(s, w.b);
  assert.ok(
    Math.hypot(s.destination.x - released.x, s.destination.z - released.z) > 10,
    'released point is not a fallback command'
  );
  assert.ok(
    Math.hypot(s.destination.x - s.root.position.x, s.destination.z - s.root.position.z) < 1e-6,
    'no owner order means no new travel'
  );
  assert.notEqual(pick.reason, 'squad intent');
  const next = w.R.proposeOrder(s, { x: 10, z: 40 }, w.b, false, 'squad-stability');
  assert.equal(w.R.resolve(s, w.b).owner, next.owner, 'a fresh lawful Meso order still wins');
});
test('?releasedOrder=0 keeps the old release position as the order destination', () => {
  const w = world('capture', '&releasedOrder=0');
  tick(w);
  const s = w.q.members[3];
  const order = w.Q.controllerMovement.publish(w.q, w.b, s, { x: 0, z: 120 }, 'release-probe');
  w.b.time += 3;
  w.r.SquadAI.updateSquad(w.q, w.b);
  s.root.position.z += 7;
  w.Q.controllerMovement.end(s, order);
  assert.ok(s.orderDestination, 'the release position is still stored with the flag off');
  assert.ok(Math.abs(s.orderDestination.z - s.root.position.z) < 1e-6);
});
test('without the controller a released order keeps the release position, exactly as before', () => {
  const w = world('capture', '', false);
  w.b.time += 1;
  const s = w.q.members[3];
  const order = w.R.proposeOrder(s, { x: 0, z: 120 }, w.b, false, 'squad-stability');
  s.root.position.z += 7;
  w.R.endOrder(s, order);
  assert.ok(s.orderDestination, 'legacy release stores the release position');
  assert.ok(Math.abs(s.orderDestination.z - s.root.position.z) < 1e-6);
});
test('a support squad waits at its second leg until the support delay ends or the assault is committed', () => {
  const w = world();
  w.q._macroMission = {
    ...w.q._macroMission,
    route: [
      { x: 0, z: 40 },
      { x: 0, z: 80 },
      { x: 0, z: 150 }
    ]
  };
  w.q.commandRole = 'support';
  w.b.time = 5;
  placeAll(w, 40);
  tick(w);
  tick(w);
  assert.equal(w.q.commandPhase, 'support-hold');
  assert.deepEqual(w.q.objective, { x: 0, z: 80 });
  placeAll(w, 80);
  w.b.time += 0.45;
  tick(w);
  assert.equal(w.q.commandPhase, 'support-hold', 'it does not march past leg 1 while waiting');
  assert.ok(w.q.routeIndex <= 1);
  w.b.time = 21;
  tick(w);
  assert.notEqual(w.q.commandPhase, 'support-hold', 'the delay is over');
  assert.ok(w.q.routeIndex >= 2);
});

test('?supportWait=0 restores the immediate march for support squads', () => {
  const w = world('capture', '&supportWait=0');
  w.q._macroMission = {
    ...w.q._macroMission,
    route: [
      { x: 0, z: 40 },
      { x: 0, z: 80 },
      { x: 0, z: 150 }
    ]
  };
  w.q.commandRole = 'support';
  w.b.time = 5;
  placeAll(w, 80);
  tick(w);
  tick(w);
  assert.notEqual(w.q.commandPhase, 'support-hold');
});

test('a support squad is released early when another squad of its side has committed', () => {
  const w = world();
  w.q._macroMission = {
    ...w.q._macroMission,
    route: [
      { x: 0, z: 40 },
      { x: 0, z: 80 },
      { x: 0, z: 150 }
    ]
  };
  w.q.commandRole = 'support';
  w.b.time = 5;
  placeAll(w, 40);
  tick(w);
  tick(w);
  assert.equal(w.q.commandPhase, 'support-hold');
  const mate = H.addSquad(w.r, w.b, { id: 'us-1', faction: 'us', x: 20, z: 0, objective: { x: 0, z: 300 } });
  mate.routeIndex = 2;
  placeAll(w, 80);
  w.b.time += 0.45;
  tick(w);
  tick(w);
  assert.notEqual(w.q.commandPhase, 'support-hold');
});

test('retained recon keeps the committed route leg until its own owner releases it', () => {
  const w = world();
  w.q._macroMission.route = [
    { x: 0, z: 40 },
    { x: 0, z: 120 }
  ];
  tick(w);
  const before = { ...w.q.objective };
  assert.equal(
    w.Q.startRecon(w.q, w.b, {
      signature: 'route-owner-recon',
      reason: 'unknown-approach',
      from: { x: 0, z: 0 },
      goal: { x: 0, z: 120 },
      point: { x: 0, z: 70 },
      axis: { x: 0, z: 1 },
      goalDistance: 120
    }),
    true
  );
  placeAll(w, 40);
  w.b.time += 0.45;
  tick(w);
  assert.equal(w.q.routeIndex, 0, 'centroid arrival cannot overrule the active scouting task');
  assert.equal(w.r.BattleTacticalMarchProvider.leg(w.q).index, 0, 'selection and committed leg agree');
  assert.deepEqual(w.q.objective, before, 'the route objective is not rewritten behind the scouts');
  assert.equal(w.q._missionHold, 'recon');
  assert.equal(
    w.Q.controllerMission.publish(w.b, w.q, 1, {
      leg: 1,
      phase: 'approach',
      point: { x: 0, z: 120 }
    }),
    false,
    'owner refuses a competing mission write while recon holds it'
  );
  w.Q.endRecon(w.q, w.b, 'test complete');
  w.b.time += 0.45;
  tick(w);
  assert.equal(w.q.routeIndex, 1, 'the same reached leg advances after explicit handback');
});

test('direct mission dispatch cannot advance a route while the retained owner holds regroup or retreat', () => {
  for (const reason of ['regroup', 'retreat']) {
    const w = world();
    w.q._macroMission.route = [
      { x: 0, z: 40 },
      { x: 0, z: 120 }
    ];
    tick(w);
    placeAll(w, 40);
    if (reason === 'regroup')
      w.r.BattleLeases.grant(w.q, 'regroup', 'squad-leader', w.b.time, w.b.time + 30, 'test', 'test', {});
    else w.q.state = 'retreat';
    w.TC.dispatch(w.b, w.q, 'executeMission');
    assert.equal(w.q.routeIndex, 0, reason + ' keeps its committed route');
    assert.equal(w.r.BattleTacticalMarchProvider.leg(w.q).index, 0, reason + ' keeps selection in sync');
  }
});

test('a superseding brief ends the old recon before selecting its new route', () => {
  const w = world();
  tick(w);
  assert.equal(
    w.Q.startRecon(w.q, w.b, {
      signature: 'old-route-recon',
      reason: 'unknown-approach',
      from: { x: 0, z: 0 },
      goal: { x: 0, z: 300 },
      point: { x: 0, z: 70 },
      axis: { x: 0, z: 1 },
      goalDistance: 300
    }),
    true
  );
  w.q._macroMission = { ...w.q._macroMission, version: 2, point: { x: 100, z: 400 } };
  w.b.time += 0.45;
  tick(w);
  assert.equal(w.q._reconTask, null, 'the old task was ended at its owner');
  assert.equal(w.q._reconLast.reason, 'mission-change');
  assert.deepEqual(w.q.objective, { x: 100, z: 400 }, 'new brief is applied in this mission tick');
  assert.deepEqual(w.r.BattleTacticalMarchProvider.leg(w.q).point, w.q.objective);
});

console.log(checks + ' tactical mission handoff checks passed');
process.exitCode = failures ? 1 : 0;
