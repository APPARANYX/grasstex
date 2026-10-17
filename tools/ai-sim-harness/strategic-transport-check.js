#!/usr/bin/env node
'use strict';
/* Real shipping abstract transport with deterministic physical ticks and
   collider checks; no outcome counters substituted for actual passenger positions. */
const assert = require('node:assert/strict');
const { loadModule } = require('./module-loader');

function make(scenario = 'strategic', flag = '?motorTransport=1', road = true) {
  const hooks = {},
    events = [],
    walls = { after: Infinity };
  const town = {
    profile: scenario,
    map: { width: 5000, depth: 5000 },
    objectives: [
      { id: 'a', x: 0, z: 0 },
      { id: 'b', x: 0, z: 1400 }
    ],
    spawnZones: {
      us: {
        bases: [
          { id: 'us-base-0', objectiveId: 'a', x: 0, z: 0 },
          { id: 'us-base-1', objectiveId: 'us-base-one', x: -1000, z: -1700 },
          { id: 'us-base-2', objectiveId: 'us-base-two', x: 1000, z: -1700 }
        ]
      },
      ge: {
        bases: [
          { id: 'ge-base-0', objectiveId: 'ge-base-zero', x: 0, z: 1700 },
          { id: 'ge-base-1', objectiveId: 'ge-base-one', x: -1000, z: 1700 },
          { id: 'ge-base-2', objectiveId: 'ge-base-two', x: 1000, z: 1700 }
        ]
      }
    },
    roads: road
      ? [
          { fromObjectiveId: 'a', toObjectiveId: 'b', ax: 0, az: 0, bx: 0, bz: 1400, width: 14 },
          ...[
            ['us-base-one', -1000, -1700, -1300],
            ['us-base-two', 1000, -1700, -1300],
            ['ge-base-zero', 0, 1700, 1350],
            ['ge-base-one', -1000, 1700, 1350],
            ['ge-base-two', 1000, 1700, 1350]
          ].map(([id, x, z, farZ]) => ({
            fromObjectiveId: id,
            toObjectiveId: id + '-road',
            ax: x,
            az: z,
            bx: x,
            bz: farZ,
            width: 14
          }))
        ]
      : []
  };
  const root = {
    location: { search: flag },
    GTLog() {},
    BattleModules: {
      registerSystem: (name, hooksForSystem) => (hooks[name] = hooksForSystem)
    },
    BattleNavigation: {
      movementClear(from, to) {
        return from.z <= walls.after && to.z <= walls.after;
      },
      invalidateNavPath() {}
    },
    BattleTelemetry: { record: (type, item) => events.push({ type, item }) },
    /* Unit harness substitutes the declared physical and destination owners.
       The CI wire-map ratchet independently verifies that the shipping module
       does not bypass either owner. */
    BattleSim: {
      moveTransportPassenger(sim, s, at, reason) {
        s.root.position.x = at.x;
        s.root.position.z = at.z;
        s.root.position.y = sim.heightAt(at.x, at.z);
        s.moveSpeed = 0;
        s.moving = false;
        s._movementStopReason = reason;
        return true;
      }
    },
    BattleMovementResolver: {
      restoreAfterTransport(s) {
        s.destination = { x: s.root.position.x, z: s.root.position.z };
        s.orderDestination = { ...s.destination };
      }
    }
  };
  loadModule(root, 'battle/modules/58-strategic-abstract-transport.js');
  const system = hooks['strategic-abstract-transport'];
  const members = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    speed: 2.5,
    dead: false,
    moving: false,
    root: { position: { x: i % 2 ? 1 : -1, z: i - 4.5, y: 0 } },
    suppressedUntil: 0,
    destination: { x: 0, z: 1400 }
  }));
  const squad = {
    id: 'us-1',
    faction: 'us',
    home: { x: 0, z: 0 },
    baseHome: { x: 0, z: 0 },
    members,
    state: 'advance',
    commandPhase: 'approach',
    inContact: false,
    _macroMission: null
  };
  members.forEach(m => {
    m.squad = squad;
  });
  const sim = {
    time: 0,
    scene: { metadata: { battleScenario: town } },
    factions: { us: { squads: [squad] }, ge: { squads: [] } },
    heightAt: () => 0
  };
  system.onBattleStart(sim);
  const api = root.BattleSquadTransport;
  function brief(version = 1) {
    squad._macroMission = {
      owner: 'force-command',
      version,
      status: 'issued',
      intent: 'capture',
      objectiveId: 'b',
      point: { x: 0, z: 1400 },
      route: []
    };
    return squad._macroMission;
  }
  function run(seconds, dt = 0.15) {
    for (let i = 0; i < Math.ceil(seconds / dt); i++) {
      sim.time += dt;
      system.onSimulationStep(sim, { dt });
    }
  }
  return { root, system, api, sim, squad, members, events, walls, town, brief, run };
}

// Flag and scenario isolation. A transport mission cannot be assumed authorized.
for (const args of [
  ['tactical', '?motorTransport=1', true],
  ['strategic', '', true],
  ['strategic', '?motorTransport=1', false]
]) {
  const w = make(...args);
  assert.equal(w.api.considerMission(w.sim, w.squad, w.brief()), false);
  assert.equal(w.squad._transport, null);
}
const w = make();
const initialFleet = w.api.fleetSummary(w.sim);
assert.equal(initialFleet.length, 12, 'all six bases own two parked trucks before the first mission');
assert.equal(new Set(initialFleet.map(v => v.id)).size, 12, 'every truck has a stable unique identity');
for (const f of ['us', 'ge']) {
  assert.equal(initialFleet.filter(v => v.faction === f).length, 6);
  for (let b = 0; b < 3; b++) {
    assert.equal(
      initialFleet.filter(v => v.baseIndex === b && v.faction === f && v.phase === 'parked').length,
      2
    );
  }
}
assert.equal(w.api.tuning.vehiclesPerBase, 2);
assert.equal(w.api.considerMission(w.sim, w.squad, w.brief()), true, 'Macro grant');
assert.equal(w.squad._transport.phase, 'boarding');
assert.equal(w.squad._transport.owner, 'squad-leader');
assert.equal(w.squad._transport.grantedBy, 'force-command');
assert.equal(
  w.squad._transport.path.length,
  3,
  'parked truck joins the road then uses a physical shoulder turnout'
);
assert.equal(w.squad._transport.vehicleId, 'us-base-0-truck-0');
assert.ok(
  Math.hypot(w.squad._transport.position.x, w.squad._transport.position.z) > 10,
  'transport starts at its parked vehicle, not an on-demand truck at the squad'
);
assert.equal(w.api.fleetSummary(w.sim).find(v => v.id === w.squad._transport.vehicleId).phase, 'assigned');
assert.ok(w.squad._transport.total >= 1230 && w.squad._transport.total <= 1245);
const parkedHeading = {
  ...w.api.fleetSummary(w.sim).find(v => v.id === w.squad._transport.vehicleId).heading
};
assert.deepEqual(
  w.squad._transport.heading,
  parkedHeading,
  'driver mounting cannot flip a stationary truck to face the road join'
);
const original = w.members.map(m => ({ ...m.root.position }));
w.run(2);
assert.equal(
  w.squad._transport.phase,
  'boarding',
  'soldiers do not embark or depart before accepting Macro orders'
);
assert.deepEqual(
  w.members.map(m => ({ ...m.root.position })),
  original
);
w.squad._macroMission.status = 'executing';
w.run(3);
assert.equal(w.squad._transport.phase, 'boarding', 'seats fill individually, not as a group');
const earlyCount = w.squad._transport.boardedCount;
w.run(0.9);
assert.ok(
  w.squad._transport.boardedCount - earlyCount <= 2,
  'one driver/seat per boarding interval, no ten-person pop-in'
);
let previousBoarded = w.squad._transport.boardedCount;
while (w.squad._transport.phase === 'boarding' && w.sim.time < 38) {
  w.run(0.15);
  assert.ok(
    w.squad._transport.boardedCount >= previousBoarded &&
      w.squad._transport.boardedCount - previousBoarded <= 1
  );
  previousBoarded = w.squad._transport.boardedCount;
}
assert.equal(w.squad._transport.phase, 'embarked', 'driver-to-rear boarding converges');
const embarkedAt = w.squad._transport.embarkedAt;
let last = w.squad._transport.position.z;
let maxStep = 0;
while (w.squad._transport.phase === 'embarked' && w.sim.time < 190) {
  w.run(0.15);
  const z = w.squad._transport.position.z;
  maxStep = Math.max(maxStep, z - last);
  last = z;
  if (w.squad._transport.phase === 'embarked') {
    const p = w.members.map(m => m.root.position);
    assert.ok(
      Math.max(...p.map(v => v.z)) - Math.min(...p.map(v => v.z)) < 6,
      'actual passengers remain a compact vehicle formation'
    );
    assert.ok(w.api.isPassenger(w.members[1]));
  }
}
assert.equal(w.squad._transport.phase, 'dismounted');
assert.equal(w.squad._transport.endReason, 'arrival');
const usedTruck = w.api.fleetSummary(w.sim).find(v => v.id === w.squad._transport.vehicleId);
assert.equal(usedTruck.phase, 'stopped', 'completed truck remains in the world');
assert.equal(usedTruck.squadId, null);
assert.ok(
  Math.hypot(
    usedTruck.position.x - w.squad._transport.position.x,
    usedTruck.position.z - w.squad._transport.position.z
  ) < 0.01,
  'the dismounted truck stays at its final location, not a fresh garage spawn'
);
assert.ok(
  Math.abs(w.squad._transport.travelled - 1231) < 0.4,
  'carrier completes 180m assault standoff plus physical roadside turnout'
);
assert.ok(maxStep < 2.1 && maxStep > 1.5, 'road speed 12m/s on a 0.15s integrator');
assert.ok(
  w.sim.time - embarkedAt > 95 && w.sim.time - embarkedAt < 115,
  '12m/s road plus slower shoulder turn-in'
);
assert.ok(
  Math.abs(usedTruck.position.x) >= 10,
  'truck actually parks 11m off the public road rather than blocking it'
);
assert.ok(w.members.every(m => !w.api.isPassenger(m) && m._movementStopReason === 'transport-dismounted'));
// A new objective needs a real nearby vehicle, not a second spawn. Use a
// further public road objective and the same parked-offroad truck.
w.town.objectives.push({ id: 'c', x: 0, z: 2450 });
w.town.roads.push({ fromObjectiveId: 'b', toObjectiveId: 'c', ax: 0, az: 1400, bx: 0, bz: 2450, width: 14 });
w.squad._macroMission = {
  owner: 'force-command',
  status: 'issued',
  version: 2,
  intent: 'capture',
  objectiveId: 'c',
  point: { x: 0, z: 2450 },
  route: [{ x: 0, z: 1400 }]
};
assert.ok(
  w.api.considerMission(w.sim, w.squad, w.squad._macroMission),
  'original abandoned truck can be reused at the next objective if physically nearby'
);
assert.equal(
  w.squad._transport.vehicleId,
  usedTruck.id,
  'prefer the very same original truck for onward transport'
);
assert.equal(w.api.fleetSummary(w.sim).length, 12, 'reuse cannot conjure a thirteenth vehicle');

// A forward screening trip should dismount just short of the *forward
// post*, not 180 metres before it (which can be before the held objective).
const screenTrip = make();
const screenBrief = screenTrip.brief();
screenBrief.intent = 'screen';
screenBrief.point = { x: 0, z: 1400 };
screenBrief.screen = { standoffMetres: 25, securedObjectiveId: 'b' };
assert.ok(screenTrip.api.considerMission(screenTrip.sim, screenTrip.squad, screenBrief));
assert.equal(screenTrip.squad._transport.standoffMetres, 25);
assert.ok(
  screenTrip.squad._transport.dismountPoint.z >= 1370,
  'forward screen drives almost to its watch point, then pulls over'
);
assert.ok(Math.abs(screenTrip.squad._transport.dismountPoint.x) >= 10);

// A completed objective may leave the infantry almost 180m ahead of the
// stopped truck. The 200m pickup radius must include that real distance,
// while >200m stays out of range even if a legal road leads onward.
const pickup = make();
pickup.town.objectives.push({ id: 'c', x: 0, z: 2450 });
pickup.town.roads.push({
  fromObjectiveId: 'b',
  toObjectiveId: 'c',
  ax: 0,
  az: 1400,
  bx: 0,
  bz: 2450,
  width: 14
});
const originalTruck = pickup.sim._strategicTransportFleet.vehicles.find(v => v.id === 'us-base-0-truck-0');
originalTruck.phase = 'stopped';
originalTruck.position = { x: 11, z: 1000 };
originalTruck.heading = { x: 0, z: 1 };
pickup.squad._transport = { vehicleId: originalTruck.id, phase: 'dismounted' };
const advanceGroup = z =>
  pickup.members.forEach(m => {
    m.root.position.x = 0;
    m.root.position.z = z;
  });
const onward = {
  owner: 'force-command',
  status: 'issued',
  version: 2,
  intent: 'capture',
  objectiveId: 'c',
  point: { x: 0, z: 2450 },
  route: [{ x: 0, z: 1400 }]
};
advanceGroup(1201);
assert.equal(
  pickup.api.quoteMission(pickup.sim, pickup.squad, onward),
  null,
  'truck more than 200m from squad cannot be claimed'
);
advanceGroup(1198);
const nearQuote = pickup.api.quoteMission(pickup.sim, pickup.squad, onward);
assert.ok(nearQuote, '180m objective dismount must allow pickup at about 200m');
assert.equal(nearQuote.vehicle.id, originalTruck.id);
assert.ok(nearQuote.boardSeconds > 35, 'real 200m walk requires a longer boarding window');
// A nearer unclaimed vehicle does not displace the squad's original truck.
const alternateTruck = pickup.sim._strategicTransportFleet.vehicles.find(v => v.id === 'us-base-0-truck-1');
alternateTruck.phase = 'stopped';
alternateTruck.position = { x: -11, z: 1190 };
assert.equal(
  pickup.api.quoteMission(pickup.sim, pickup.squad, onward).vehicle.id,
  originalTruck.id,
  'prefer squad original truck even when another is closer'
);
pickup.squad._macroMission = onward;
assert.ok(pickup.api.considerMission(pickup.sim, pickup.squad, onward));
assert.ok(pickup.squad._transport.boardTimeoutSeconds > 35);
pickup.squad._macroMission.status = 'executing';
pickup.run(40);
assert.equal(
  pickup.squad._transport.phase,
  'boarding',
  'a 200m pickup must not abort at the former 35-second boarding timeout'
);
pickup.run(80);
assert.equal(
  pickup.squad._transport.phase,
  'embarked',
  'soldiers physically walk to the truck and board in order without spawning'
);
assert.equal(pickup.api.fleetSummary(pickup.sim).length, 12);

// Fleet ownership is per-base, not a random or faction-wide two-task spawn cap.
const pool = make();
const recruit = id => {
  const sq = {
    ...pool.squad,
    id,
    members: pool.members.map(m => ({
      ...m,
      id: id + '-' + m.id,
      root: { position: { ...m.root.position } }
    })),
    _transport: null,
    _transportUsed: false,
    _macroMission: null
  };
  sq.members.forEach(m => {
    m.squad = sq;
  });
  pool.sim.factions.us.squads.push(sq);
  return sq;
};
const second = recruit('us-2');
const third = recruit('us-3');
const capture = sq => {
  sq._macroMission = {
    owner: 'force-command',
    intent: 'capture',
    status: 'issued',
    version: 1,
    point: { x: 0, z: 1400 },
    route: []
  };
  return sq._macroMission;
};
assert.ok(pool.api.considerMission(pool.sim, pool.squad, capture(pool.squad)));
assert.ok(pool.api.considerMission(pool.sim, second, capture(second)));
assert.notEqual(
  pool.squad._transport.vehicleId,
  second._transport.vehicleId,
  'two simultaneous squads cannot claim the same pre-existing truck'
);
assert.equal(
  pool.api.considerMission(pool.sim, third, capture(third)),
  false,
  'a base cannot conjure a third parked truck on demand'
);
pool.api.finish(pool.sim, second, 'mission-not-accepted');
assert.equal(
  pool.api.fleetSummary(pool.sim).find(v => v.id === second._transport.vehicleId).phase,
  'parked',
  'cancelled pre-departure reservation releases the physical truck'
);
assert.ok(
  pool.api.considerMission(pool.sim, third, capture(third)),
  'released parking slot is reclaimed without creating a vehicle'
);
pool.system.onBattleRestart(pool.sim);
assert.equal(
  pool.api.fleetSummary(pool.sim).filter(v => v.phase === 'parked').length,
  12,
  'restart re-establishes exactly two trucks per base, never duplicates'
);

// A new General brief invalidates the carrier task and returns native infantry control.
const changed = make();
assert.ok(changed.api.considerMission(changed.sim, changed.squad, changed.brief()));
changed.squad._macroMission.status = 'executing';
changed.run(25);
assert.equal(changed.squad._transport.phase, 'embarked');
changed.brief(2);
changed.run(0.15);
assert.equal(changed.squad._transport.phase, 'aborted');
assert.equal(changed.squad._transport.endReason, 'mission-changed-or-retreat');

// An issued but never accepted order cannot freeze its squad in boarding forever.
const unaccepted = make();
assert.ok(unaccepted.api.considerMission(unaccepted.sim, unaccepted.squad, unaccepted.brief()));
unaccepted.run(36);
assert.equal(unaccepted.squad._transport.phase, 'aborted');
assert.equal(unaccepted.squad._transport.endReason, 'mission-not-accepted');
assert.ok(unaccepted.members.every(m => !unaccepted.api.isPassenger(m)));

// If an obstacle develops after dispatch, the carrier stops on its last legal
// road coordinate. It cannot phase through the obstruction to finish its trip.
const blocked = make();
blocked.api.considerMission(blocked.sim, blocked.squad, blocked.brief());
blocked.squad._macroMission.status = 'executing';
blocked.run(25);
blocked.run(8);
blocked.walls.after = blocked.squad._transport.position.z + 20;
blocked.run(8);
assert.equal(blocked.squad._transport.phase, 'aborted');
assert.ok(
  ['road-blocked', 'passenger-path-blocked'].includes(blocked.squad._transport.endReason),
  'blocking either the carrier center or an actual passenger stops the vehicle safely'
);
assert.ok(blocked.squad._transport.position.z <= blocked.walls.after + 0.01);
assert.ok(blocked.members.every(m => !blocked.api.isPassenger(m)));

// A squad already in contact cannot mount up in an arbitrary hidden fast mode.
const contact = make();
contact.squad.inContact = true;
assert.equal(contact.api.considerMission(contact.sim, contact.squad, contact.brief()), false);
console.log(
  'PASS six strategic depots with two persistent trucks each, exclusive allocation, real boarding/road travel, preserved parked/stopped trucks, collision-safe dismount and legacy isolation'
);
