#!/usr/bin/env node
'use strict';
/* Real shipping abstract transport with deterministic physical ticks and
   collider checks; no outcome counters substituted for actual passenger positions. */
const assert = require('node:assert/strict');
const { loadModule } = require('./module-loader');

function make(
  scenario = 'strategic',
  flag = '?motorTransport=1&truckAccess=0&truckCollision=0',
  road = true
) {
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
  loadModule(root, 'battle/core-runtime.js');
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
    obstacles: [],
    _roster: { us: members, ge: [] },
    scene: { metadata: { battleScenario: town } },
    factions: { us: { squads: [squad] }, ge: { squads: [] } },
    heightAt: () => 0
  };
  if (flag.includes('truckCollision=1')) {
    loadModule(root, 'battle/obstacle-field.js');
    loadModule(root, 'battle/battle-navigation.js');
    root.BattleNavigation.installScenario(town);
    root.__battle__ = sim;
    loadModule(root, 'battle/modules/39-navigation-physicality-debug.js');
  }
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
  ['tactical', '?motorTransport=1&truckAccess=0&truckCollision=0', true],
  ['strategic', '?motorTransport=0', true],
  ['strategic', '?motorTransport=1&truckAccess=0&truckCollision=0', false]
]) {
  const w = make(...args);
  assert.equal(w.api.considerMission(w.sim, w.squad, w.brief()), false);
  assert.equal(w.squad._transport, null);
}
const defaultTransport = make('strategic', '');
assert.equal(
  defaultTransport.api.fleetSummary(defaultTransport.sim).length,
  12,
  'strategic transport fleet is default-on'
);
assert.equal(
  defaultTransport.sim.obstacles.__dynamicFootprints.length,
  12,
  'physical truck colliders are default-on'
);
const noCollision = make('strategic', '?truckCollision=0');
assert.equal(
  noCollision.sim.obstacles.__dynamicFootprints.length,
  0,
  'explicit opt-out removes dynamic truck footprints'
);
// This preserves the exact constant-speed carrier contract for historical handling controls.
const w = make(undefined, '?motorTransport=1&truckPhysics=0&truckAccess=0&truckCollision=0');
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

// A man on board with an enemy in his own sight stops the truck; ?crewEyes=0 keeps passengers blind.
for (const [flag, stops] of [
  ['?motorTransport=1&truckAccess=0&truckCollision=0', true],
  ['?motorTransport=1&crewEyes=0&truckAccess=0&truckCollision=0', false]
]) {
  const seen = make('strategic', flag);
  assert.ok(seen.api.considerMission(seen.sim, seen.squad, seen.brief()));
  seen.squad._macroMission.status = 'executing';
  seen.run(25);
  assert.equal(seen.squad._transport.phase, 'embarked');
  seen.squad.members[3].target = { id: 'enemy' };
  seen.run(0.15);
  assert.equal(seen.squad._transport.phase, stops ? 'aborted' : 'embarked', flag);
  if (stops) assert.equal(seen.squad._transport.endReason, 'crew-sighting');
}

// Truck handling (Ivan 10-19): the truck turns into its heading, speeds up and brakes, and holds
// its lane with small corrections; seeded and identical run to run. ?truckPhysics=0 above keeps
// the exact constant-speed carrier.
function handledTrip() {
  const h = make('strategic', '?motorTransport=1&truckAccess=0&truckCollision=0');
  assert.ok(h.api.considerMission(h.sim, h.squad, h.brief()));
  h.squad._macroMission.status = 'executing';
  while (h.squad._transport.phase === 'boarding' && h.sim.time < 60) h.run(0.15);
  assert.equal(h.squad._transport.phase, 'embarked');
  const trace = [];
  let prev = { ...h.squad._transport.position },
    prevHeading = { ...h.squad._transport.heading };
  while (h.squad._transport.phase === 'embarked' && h.sim.time < 400) {
    h.run(0.15);
    const t = h.squad._transport,
      p = t.position,
      turn = Math.acos(Math.max(-1, Math.min(1, t.heading.x * prevHeading.x + t.heading.z * prevHeading.z)));
    trace.push({ x: p.x, z: p.z, v: Math.hypot(p.x - prev.x, p.z - prev.z) / 0.15, turn, phase: t.phase });
    prev = { ...p };
    prevHeading = { ...t.heading };
  }
  return { h, trace };
}
{
  const { h, trace } = handledTrip(),
    t = h.squad._transport,
    R = h.api.tuning.turnRadius;
  assert.equal(t.endReason, 'arrival', 'the handled truck still arrives');
  assert.ok(trace[0].v < 2, 'pulls away from a standstill, not at road speed: ' + trace[0].v.toFixed(2));
  assert.ok(Math.max(...trace.map(s => s.v)) > 11, 'reaches its road speed');
  const moving = trace.slice(0, -1);
  assert.ok(
    moving.every((s, i) => s.turn <= ((i ? moving[i - 1].v : s.v) / R) * 0.15 + 0.02),
    'turns no faster than its tightest circle allows: never a snap'
  );
  const road = trace.filter(s => s.z > 150 && s.z < 1100),
    across = road.map(s => s.x);
  assert.ok(Math.max(...across) - Math.min(...across) > 0.3, 'the driver drifts and corrects in his lane');
  assert.ok(Math.max(...across.map(Math.abs)) < 14 / 10 + 1, 'and stays well inside the road');
  const accel = trace.slice(1).map((s, i) => (s.v - trace[i].v) / 0.15);
  assert.ok(Math.min(...accel) < -1, 'brakes before the stop');
  assert.ok(
    trace.slice(-3).every(s => s.v < 4),
    'arrives slowly'
  );
  const again = handledTrip().trace;
  assert.deepEqual(again, trace, 'seeded: the same trip twice is identical');
}

// Two trucks briefed down the same road do not stop in one turnout (Ivan's 10-19 "clone" truck);
// ?truckSpacing=0 restores the shared spot.
for (const [flag, apart] of [
  ['?motorTransport=1&truckAccess=0&truckCollision=0', true],
  ['?motorTransport=1&truckSpacing=0&truckAccess=0&truckCollision=0', false]
]) {
  const two = make('strategic', flag);
  assert.ok(two.api.considerMission(two.sim, two.squad, two.brief()));
  const other = {
    ...two.squad,
    id: 'us-2',
    _transport: null,
    _macroMission: { ...two.squad._macroMission, version: 1 },
    members: two.members.map((m, i) => ({
      ...m,
      id: 20 + i,
      root: { position: { x: m.root.position.x, z: m.root.position.z, y: 0 } }
    }))
  };
  other.members.forEach(m => {
    m.squad = other;
  });
  two.sim.factions.us.squads.push(other);
  assert.ok(two.api.considerMission(two.sim, other, other._macroMission), 'the base twin is granted');
  const a = two.squad._transport.dismountPoint,
    b = other._transport.dismountPoint,
    gap = Math.hypot(a.x - b.x, a.z - b.z);
  assert.equal(gap >= two.api.tuning.turnoutMetres - 0.01, apart, flag + ': gap ' + gap.toFixed(1));
}

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

// A waypoint the truck can never drive over exactly (Ivan's 10-19 export: "trucks doing donuts around
// objectives"): out of a bay with the road's join beside it, the old steering circled the waypoint on
// full lock until something moved it on. ?truckReach=0 restores the old steering.
function bayExit(flag) {
  const h = make('strategic', flag);
  assert.ok(h.api.considerMission(h.sim, h.squad, h.brief()));
  h.squad._macroMission.status = 'executing';
  while (h.squad._transport.phase === 'boarding' && h.sim.time < 60) h.run(0.15);
  const t = h.squad._transport,
    at = { ...t.position },
    off = (x, z) => ({ x: at.x + x, z: at.z + z });
  // The geometry of us-2's bay on seed meeting-0004: the join 12 m to the truck's right, the road's
  // start 12 m on behind it, then the road at right angles to where the truck faces.
  t.heading = { x: Math.sin(1.19), z: Math.cos(1.19) };
  t.path = [
    { point: off(4.5, -11.1), speed: 3.8 },
    { point: off(-6.6, -15.6), speed: 12 },
    { point: off(-15, 300), speed: 12 }
  ];
  t.leg = 0;
  let yaw = 0,
    prev = { ...t.heading };
  while (t.phase === 'embarked' && h.sim.time < 200) {
    h.run(0.15);
    yaw += Math.abs(
      Math.atan2(prev.x * t.heading.z - prev.z * t.heading.x, prev.x * t.heading.x + prev.z * t.heading.z)
    );
    prev = { ...t.heading };
  }
  return { t, turns: yaw / (2 * Math.PI) };
}
{
  const on = bayExit('?motorTransport=1&truckAccess=0&truckCollision=0');
  assert.equal(on.t.endReason, 'arrival', 'out of the bay and down the road');
  assert.ok(
    on.turns < 1.5,
    'one loop out of the bay at most, never circling: ' + on.turns.toFixed(2) + ' turns'
  );
  const off = bayExit('?motorTransport=1&truckReach=0&truckAccess=0&truckCollision=0');
  assert.ok(off.turns > 3, '?truckReach=0: the old steering circles the waypoint: ' + off.turns.toFixed(2));
}

// A truck reused where it stood stays there when the squad's new trip ends before it moves
// (Ivan's 10-19 export: ge-3 came back to its truck, the order changed while it mounted, and the
// truck vanished to its base bay). ?truckStaysPut=0 restores the jump back to the bay.
for (const [flag, staysPut] of [
  ['?motorTransport=1&truckAccess=0&truckCollision=0', true],
  ['?motorTransport=1&truckStaysPut=0&truckAccess=0&truckCollision=0', false]
]) {
  const r = make(undefined, flag);
  r.town.objectives.push({ id: 'c', x: 0, z: 2450 });
  r.town.roads.push({
    fromObjectiveId: 'b',
    toObjectiveId: 'c',
    ax: 0,
    az: 1400,
    bx: 0,
    bz: 2450,
    width: 14
  });
  const truck = r.sim._strategicTransportFleet.vehicles.find(v => v.id === 'us-base-0-truck-0');
  Object.assign(truck, { phase: 'stopped', position: { x: 11, z: 1000 }, heading: { x: 0, z: 1 } });
  r.squad._transport = { vehicleId: truck.id, phase: 'dismounted' };
  r.members.forEach(m => Object.assign(m.root.position, { x: 0, z: 1100 }));
  const order = {
    owner: 'force-command',
    status: 'issued',
    version: 2,
    intent: 'capture',
    objectiveId: 'c',
    point: { x: 0, z: 2450 },
    route: [{ x: 0, z: 1400 }]
  };
  r.squad._macroMission = order;
  assert.ok(r.api.considerMission(r.sim, r.squad, order), 'the stopped truck is claimed again');
  r.run(3);
  r.squad._macroMission = { ...order, version: 3 };
  r.run(0.3);
  assert.equal(r.squad._transport.endReason, 'mission-changed-or-retreat');
  assert.equal(r.squad._transport.travelled, 0, 'ended before the truck moved');
  const at = staysPut ? { x: 11, z: 1000 } : truck.parking;
  assert.ok(
    Math.hypot(truck.position.x - at.x, truck.position.z - at.z) < 0.01,
    staysPut ? 'the truck stays on the road where it stood' : '?truckStaysPut=0: back to its bay'
  );
  assert.equal(truck.phase, staysPut ? 'stopped' : 'parked');
}

// A squad already in contact cannot mount up in an arbitrary hidden fast mode.
const contact = make();
contact.squad.inContact = true;
assert.equal(contact.api.considerMission(contact.sim, contact.squad, contact.brief()), false);
// An existing, accepted foot mission can discover a truck after it was briefed.
// Boarding remains tied to that mission and never repeatedly retries an ended ride.
{
  const p = make();
  const m = p.brief();
  m.status = 'executing';
  assert.ok(
    p.api.considerMission(p.sim, p.squad, m),
    'accepted marching mission can claim a nearby free truck'
  );
  assert.strictEqual(p.squad._macroMission, m, 'pickup does not replace the accepted objective');
  const t = p.squad._transport;
  assert.equal(p.api.considerMission(p.sim, p.squad, m), false, 'one active ride per mission');
  p.api.finish(p.sim, p.squad, 'road-blocked');
  assert.equal(p.api.considerMission(p.sim, p.squad, m), false, 'aborted ride cannot create a boarding loop');
  assert.strictEqual(p.squad._transport, t);
}
// A prone/crawling soldier cannot run prone into a truck: Engagement owns the
// upright transition before the physical boarding movement/animation starts.
{
  const p = make();
  const prone = p.members[0],
    crouched = p.members[1],
    transitions = [];
  prone.prone = true;
  prone.crawling = true;
  crouched.tacticalCrouch = true;
  p.root.BattleEngagement = {
    commitStance(s, sim, stance, seconds, reason) {
      transitions.push({ id: s.id, stance, reason });
      s.prone = false;
      s.crawling = false;
      s.tacticalCrouch = false;
    }
  };
  const m = p.brief();
  assert.ok(p.api.considerMission(p.sim, p.squad, m));
  m.status = 'executing';
  p.run(0.3);
  assert.equal(prone.prone, false, 'prone passenger stood before boarding');
  assert.equal(prone.crawling, false, 'crawl pose cleared');
  assert.equal(crouched.tacticalCrouch, false, 'crouching passenger also stands');
  assert.ok(transitions.some(t => t.id === prone.id && t.reason === 'transport-boarding'));
}
console.log(
  'PASS six strategic depots with two persistent trucks each, exclusive allocation, real boarding/road travel, preserved parked/stopped trucks, collision-safe dismount and legacy isolation'
);

// Default-on door/tailgate access: physical single-file queue, immediate serial seating,
// then serial ground exits and an outside-body walk to the rear staging line.
for (const [collision, endReason] of [
  [false, 'arrival'],
  [false, 'crew-sighting'],
  [true, 'arrival'],
  [true, 'crew-sighting']
]) {
  const a = make('strategic', '?motorTransport=1&truckAccess=1&truckCollision=' + (collision ? '1' : '0'));
  if (endReason === 'crew-sighting')
    a.sim._strategicTransportFleet.vehicles.forEach(v => {
      v.heading = { x: 1, z: 0 };
    });
  const m = a.brief();
  assert.ok(a.api.considerMission(a.sim, a.squad, m));
  m.status = 'executing';
  const t = a.squad._transport;
  assert.deepEqual(t.boardingOrder, [0, 9, 1, 2, 3, 4, 5, 6, 7, 8]);
  const local = p => {
    const x = p.x - t.position.x,
      z = p.z - t.position.z;
    return { x: x * t.heading.z - z * t.heading.x, z: x * t.heading.x + z * t.heading.z };
  };
  // Begin outside the body. Approach can start from either side or behind it.
  a.members.forEach((s, i) => {
    s.root.position.x = t.position.x + t.heading.z * (i === 0 ? -4 : i === 9 ? 4 : 0) + t.heading.x * -12;
    s.root.position.z = t.position.z - t.heading.x * (i === 0 ? -4 : i === 9 ? 4 : 0) + t.heading.z * -12;
  });
  let prevCount = 0;
  while (t.phase === 'boarding' && a.sim.time < 90) {
    a.run(0.15);
    assert.ok(t.boardedCount - prevCount <= 1, 'one seat per fixed tick, never whole-squad placement');
    for (const s of a.members) {
      if (t.boardedIds.indexOf(s.id) >= 0) continue;
      const p = local(s.root.position);
      assert.ok(
        Math.abs(p.x) >= 1.59 || Math.abs(p.z) >= 3.24,
        'waiting infantry cannot walk through the truck'
      );
    }
    prevCount = t.boardedCount;
  }
  assert.equal(t.phase, 'embarked', 'door and tailgate queue converges');
  const seated = a.events.filter(e => e.type === 'strategic-transport-seat-occupied');
  assert.deepEqual(
    seated.map(e => e.item.detail.entry).sort(),
    ['driver-door', 'passenger-door', ...Array(8).fill('tailgate')].sort()
  );
  // Stop exactly where the truck stands; all seats remain occupied until their own exit.
  a.api.finish(a.sim, a.squad, endReason);
  assert.equal(t.phase, 'disembarking');
  const truck = a.api.fleetSummary(a.sim).find(v => v.id === t.vehicleId);
  assert.equal(truck.squadId, a.squad.id, 'truck remains reserved while people exit');
  a.run(0.15);
  assert.equal(t.exitedIds.length, 1, 'free driver exit releases immediately');
  a.run(0.15);
  assert.equal(t.exitedIds.length, 2, 'independent passenger door releases on the next tick');
  assert.ok(local(a.members[0].root.position).z > -5.2, 'next exit does not wait for rear staging');
  const started = a.sim.time;
  let exited = 2;
  while (t.phase === 'disembarking' && a.sim.time < 150) {
    a.run(0.15);
    assert.ok(t.exitedIds.length - exited <= 1, 'one soldier exits at a time');
    if (t.exitedIds.length > exited) {
      const newest = a.members.find(s => s.id === t.exitedIds.at(-1)).root.position;
      for (const id of t.exitedIds.slice(0, -1)) {
        const earlier = a.members.find(s => s.id === id).root.position;
        assert.ok(
          Math.hypot(newest.x - earlier.x, newest.z - earlier.z) >= 0.9 - 1e-8,
          'next exit is body-clear'
        );
      }
    }
    for (const id of t.exitedIds) {
      const p = local(a.members.find(s => s.id === id).root.position);
      assert.ok(Math.abs(p.x) >= 1.59 || p.z <= -3.24, 'visible dismount is outside truck footprint');
    }
    exited = t.exitedIds.length;
  }
  assert.equal(t.phase, endReason === 'arrival' ? 'dismounted' : 'aborted');
  assert.ok(a.sim.time - started < 20, 'parallel rear staging keeps the release bounded');
  assert.deepEqual(t.exitedIds, t.boardingOrder);
  assert.ok(
    a.members.every(s => local(s.root.position).z < -5.2),
    'everyone assembles behind the truck'
  );
  assert.ok(
    a.members.every(s => !a.api.isPassenger(s)),
    'normal infantry ownership resumes'
  );
  assert.equal(a.api.fleetSummary(a.sim).find(v => v.id === t.vehicleId).squadId, null);
  const releases = a.events.filter(e => e.type === 'strategic-transport-seat-vacated');
  assert.deepEqual(
    releases.map(e => e.item.detail.exit),
    ['driver-door', 'passenger-door', ...Array(8).fill('tailgate')]
  );
}
console.log('PASS truck access: door/tailgate queue, serial seats, outside-body exits and rear staging');
{
  const a = make('strategic', '?motorTransport=1&truckAccess=1');
  const m = a.brief();
  a.api.considerMission(a.sim, a.squad, m);
  m.status = 'executing';
  const t = a.squad._transport,
    passenger = a.members[9];
  a.members.forEach(s => {
    s.root.position.x = t.position.x - t.heading.x * 50;
    s.root.position.z = t.position.z - t.heading.z * 50;
  });
  passenger.root.position.x = t.position.x + t.heading.z * 1.85 + t.heading.x * 0.7;
  passenger.root.position.z = t.position.z - t.heading.x * 1.85 + t.heading.z * 0.7;
  a.run(0.15);
  assert.deepEqual(
    t.boardedIds,
    [passenger.id],
    'touching passenger door boards immediately while driver is still approaching'
  );
  a.api.finish(a.sim, a.squad, 'crew-sighting');
  a.run(0.15);
  assert.equal(
    a.events.filter(e => e.type === 'strategic-transport-seat-vacated').at(-1).item.detail.exit,
    'passenger-door',
    'partial boarding preserves the actual occupied exit'
  );
  a.run(20);
  assert.equal(t.phase, 'aborted');
}
console.log('PASS arrival at either door admits immediately; partial pickup exits the occupied door');

// Unrelated infantry and actual ballistic rounds share the same live volume.
{
  const a = make('strategic', '?motorTransport=1&truckAccess=1&truckCollision=1');
  const N = a.root.BattleNavigation,
    F = a.root.BattleObstacleField;
  const vehicle = a.sim._strategicTransportFleet.vehicles[0];
  const fp = a.sim.obstacles.__dynamicFootprints[0];
  assert.equal(a.sim.obstacles.__dynamicFootprints.length, 12);
  assert.equal(make().sim.obstacles.__dynamicFootprints.length, 0, 'control has no new geometry');
  for (const h of [
    { x: 0, z: 1 },
    { x: 1, z: 0 }
  ]) {
    vehicle.heading = h;
    const from = { x: fp.x - h.z * 8, z: fp.z + h.x * 8 };
    const to = { x: fp.x + h.z * 8, z: fp.z - h.x * 8 };
    assert.equal(N.movementClear(from, to), false, 'truck blocks a crossing');
    assert.equal(
      N.movementClear(from, to, { ignoreDynamicId: vehicle.id }),
      true,
      'carrier-only self exemption'
    );
    const path = N.findPath(from, to);
    assert.ok(path.length > 1, 'physical navigation supplies a real detour');
    let p = from;
    for (const q of path) {
      assert.ok(N.movementClear(p, q), 'every detour segment clears the body');
      p = q;
    }
    assert.ok(Math.hypot(p.x - to.x, p.z - to.z) < 0.5, 'route reaches the original goal');
    assert.equal(F.sightBlocked(a.sim.obstacles, { ...from, y: 1.55 }, { ...to, y: 1.55 }), true);
    assert.equal(
      F.sightBlocked(a.sim.obstacles, { ...from, y: 3 }, { ...to, y: 3 }),
      false,
      'above roof stays clear'
    );
    const H = require('./harness'),
      r = H.bootstrap({ modules: false });
    loadModule(r, 'battle/modules/14-z-ballistic-raycast.js');
    const b = H.makeBattle(r, { obstacles: a.sim.obstacles });
    const shooter = {
      faction: 'us',
      root: { position: { ...from, y: 0 }, rotation: { y: 0 } },
      weapon: { kind: 'rifle', stats: { range: 120, combatSigmaAt100: 0.000001, damage: 10, power: 1 } }
    };
    const target = { faction: 'ge', hp: 100, root: { position: { ...to, y: 0 }, rotation: { y: 0 } } };
    b._roster.ge.push(target);
    b.factions.ge.alive = 1;
    b.random = () => 0.5;
    let shot;
    b.onShot = (s, t, hit, d, m) => (shot = m);
    r.BattleBallistics.resolve(shooter, target, b);
    assert.notEqual(shot.victim, target, 'no hit through truck');
    assert.ok(
      shot.impact && Math.hypot(shot.impact.x - from.x, shot.impact.z - from.z) < 9,
      'round ends at near face'
    );
  }
  vehicle.position = { x: 40, z: 40 };
  assert.equal(fp.x, 40, 'collision follows the real carrier without rebuilding terrain');
  assert.equal(N.movementClear({ x: 4, z: 12 }, { x: 20, z: 12 }), true, 'old parked position clears');
  a.system.onBattleRestart(a.sim);
  assert.equal(
    a.sim.obstacles.__dynamicFootprints.length,
    12,
    'restart replaces rather than duplicates volumes'
  );
  const mission = a.brief();
  assert.ok(a.api.considerMission(a.sim, a.squad, mission));
  mission.status = 'executing';
  a.run(350);
  assert.equal(
    a.squad._transport.phase,
    'dismounted',
    'own body does not deadlock boarding/driving/dismount'
  );
}
console.log(
  'PASS live rotated truck blocks infantry and rounds, preserves detours, roof clearance and complete transport'
);

// A blocked cab door cannot strand the bed occupants or the other cab occupant.
// ?blockedExit=0 keeps the old rule: the driver waits seated on his own door.
{
  const a = make('strategic', '?motorTransport=1&truckAccess=1&blockedExit=0');
  const mission = a.brief();
  assert(a.api.considerMission(a.sim, a.squad, mission));
  mission.status = 'executing';
  for (let i = 0; i < 800 && a.squad._transport.phase === 'boarding'; i++) a.run(0.15);
  const t = a.squad._transport;
  assert.equal(t.phase, 'embarked');
  a.api.finish(a.sim, a.squad, 'crew-sighting');
  const blocker = {
    id: 'door-blocker',
    root: {
      position: {
        x: t.position.x - t.heading.z * 1.85 + t.heading.x * 0.7,
        z: t.position.z + t.heading.x * 1.85 + t.heading.z * 0.7
      }
    }
  };
  a.sim._roster.ge.push(blocker);
  a.run(20);
  assert.equal(t.exitedIds.length, 9, 'other exits drain while driver remains safely seated');
  assert(!t.exitedIds.includes(t.boardingOrder[0]));
  blocker.root.position = { x: 2000, z: 2000 };
  a.run(20);
  assert.equal(t.phase, 'aborted');
  assert(a.members.every(s => !a.api.isPassenger(s)));
}
// A man standing at the driver door for good must not hold the driver in the cab: the owner
// of the dismount sends him out of another exit. =0 leaves him seated (checked above).
{
  const a = make('strategic', '?motorTransport=1&truckAccess=1');
  const mission = a.brief();
  assert(a.api.considerMission(a.sim, a.squad, mission));
  mission.status = 'executing';
  for (let i = 0; i < 800 && a.squad._transport.phase === 'boarding'; i++) a.run(0.15);
  const t = a.squad._transport;
  a.api.finish(a.sim, a.squad, 'crew-sighting');
  const door = { x: -1.85, z: 0.7 };
  a.sim._roster.ge.push({
    id: 'door-blocker',
    root: {
      position: {
        x: t.position.x + t.heading.z * door.x + t.heading.x * door.z,
        z: t.position.z - t.heading.x * door.x + t.heading.z * door.z
      }
    }
  });
  a.run(30);
  assert.equal(t.exitedIds.length, 10, 'driver leaves by another exit while the door stays blocked');
  assert.equal(t.phase, 'aborted');
  assert(a.members.every(s => !a.api.isPassenger(s)));
  const driver = a.events
    .filter(e => e.type === 'strategic-transport-seat-vacated')
    .find(e => e.item.detail.soldierId === t.boardingOrder[0]);
  assert.notEqual(driver.item.detail.exit, 'driver-door');
}
// A parked vehicle behind the tailgate can block the usual assembly line.
{
  const a = make('strategic', '?motorTransport=1&truckAccess=1');
  const mission = a.brief();
  assert(a.api.considerMission(a.sim, a.squad, mission));
  mission.status = 'executing';
  for (let i = 0; i < 800 && a.squad._transport.phase === 'boarding'; i++) a.run(0.15);
  const t = a.squad._transport;
  a.api.finish(a.sim, a.squad, 'contact');
  const original = a.root.BattleNavigation.movementClear;
  a.root.BattleNavigation.movementClear = (from, to) =>
    original(from, to) && from.z >= t.position.z - 5 && to.z >= t.position.z - 5;
  a.run(40);
  assert.equal(t.phase, 'aborted', 'reachable flank assembly restores infantry ownership');
  assert(a.members.every(s => s.root.position.z >= t.position.z - 5));
}
console.log('PASS independent safe exits and reachable dismount assembly around blocked rear space');
