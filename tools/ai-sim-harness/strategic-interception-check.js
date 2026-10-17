#!/usr/bin/env node
'use strict';
/* Deterministic Macro interception: only a true aerial DTO, actual depot vehicle,
   continuous road legs and positive conservative ETA margin can issue an order.
   This harness does NOT claim a natural battle victory. */
const assert = require('node:assert/strict');
const { loadModule } = require('./module-loader');

function make(search = '?strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1') {
  const hooks = {},
    events = [];
  const objs = [
    { id: 'u0', baseFaction: 'us', x: 0, z: -300 },
    { id: 'u1', baseFaction: 'us', x: -1000, z: -300 },
    { id: 'u2', baseFaction: 'us', x: 1000, z: -300 },
    { id: 'g0', baseFaction: 'ge', x: 0, z: 1800 },
    { id: 'g1', baseFaction: 'ge', x: -1000, z: 1800 },
    { id: 'g2', baseFaction: 'ge', x: 1000, z: 1800 },
    { id: 'crossing', x: 0, z: 500 }
  ];
  const edge = (a, b, i) => {
    const x = objs.find(o => o.id === a),
      y = objs.find(o => o.id === b);
    return {
      id: 'r' + i,
      fromObjectiveId: a,
      toObjectiveId: b,
      ax: x.x,
      az: x.z,
      bx: y.x,
      bz: y.z,
      width: 14
    };
  };
  const links = [
    ['u0', 'crossing'],
    ['crossing', 'g0'],
    ['u1', 'u0'],
    ['u2', 'u0'],
    ['g1', 'g0'],
    ['g2', 'g0']
  ];
  const bases = f =>
    [0, 1, 2].map(i => {
      const o = objs.find(o => o.id === f[0] + i);
      return { id: f + '-base-' + i, objectiveId: o.id, x: o.x, z: o.z };
    });
  const town = {
    profile: 'strategic',
    seed: 'intercept-causal-0001',
    map: { width: 5000, depth: 5000 },
    objectives: objs,
    roads: links.map((p, i) => edge(p[0], p[1], i)),
    spawnZones: { us: { bases: bases('us') }, ge: { bases: bases('ge') } }
  };
  const root = {
    location: { search },
    GTLog() {},
    BattleModules: {
      registerSystem: (id, api) => {
        hooks[id] = api;
      }
    },
    BattleNavigation: { movementClear: () => true },
    BattleTelemetry: { record: (kind, payload) => events.push({ kind, payload }) },
    BattleSim: {
      moveTransportPassenger(sim, s, p) {
        Object.assign(s.root.position, p);
        return true;
      }
    },
    BattleMovementResolver: { restoreAfterTransport() {} }
  };
  loadModule(root, 'battle/modules/58-strategic-abstract-transport.js');
  loadModule(root, 'battle/modules/59-strategic-aerial-recon.js');
  loadModule(root, 'battle/modules/59b-strategic-interception.js');
  function squad(id, f, x, z, heading, speed) {
    const sq = {
      id,
      faction: f,
      baseHome: { x, z },
      home: { x, z },
      state: 'advance',
      commandRole: 'maneuver',
      members: [],
      inContact: false,
      _transportUsed: false,
      _macroMission: { owner: 'force-command', status: 'executing', intent: 'capture', version: 1 }
    };
    sq.members = Array.from({ length: 10 }, (_, i) => ({
      id: id + '-' + i,
      dead: false,
      moving: speed > 0,
      moveSpeed: speed,
      suppressedUntil: 0,
      root: { position: { x: x + (i % 2) * 0.1, z: z + Math.floor(i / 2) * 0.1 }, rotation: { y: heading } },
      squad: sq
    }));
    return sq;
  }
  const us = squad('us-main', 'us', 0, -300, 0, 0),
    ge = squad('ge-moving', 'ge', 0, 1500, Math.PI, 1.2);
  const sim = {
    time: 120,
    macroCommandEnabled: true,
    scene: { metadata: { battleScenario: town } },
    factions: { us: { squads: [us] }, ge: { squads: [ge] } },
    heightAt: () => 0
  };
  hooks['strategic-abstract-transport'].onBattleStart(sim);
  hooks['strategic-aerial-recon'].onBattleStart(sim);
  hooks['strategic-interception'].onBattleStart(sim);
  return { root, hooks, sim, us, ge, events };
}

const w = make(),
  T = w.root.BattleSquadTransport,
  I = w.root.BattleStrategicInterception;
assert.equal(
  I.reserveSquad(w.sim, w.us),
  false,
  'no second squad at this base: lone lead must NOT be held in reserve'
);
assert.equal(
  I.reservePending(w.sim, 'us'),
  false,
  'a lone base must not block independent aerial interception'
);
const early = make();
early.sim.time = 39;
assert.equal(
  early.root.BattleAerialRecon.request(early.sim, 'us'),
  null,
  'General cannot launch an interception sortie before its early briefing clock'
);
early.sim.time = 40.5;
assert.ok(
  early.root.BattleAerialRecon.request(early.sim, 'us'),
  'opt-in General launches early enough to see outbound transports'
);
const standalone = make('?strategicInterception=1&aerialRecon=1&motorTransport=1');
standalone.sim.time = 40.5;
assert.equal(
  standalone.root.BattleAerialRecon.request(standalone.sim, 'us'),
  null,
  'standalone aerial reconnaissance still waits to the original 120-second gate'
);
const before = T.fleetSummary(w.sim);
assert.equal(before.length, 12);
assert.ok(before.every(v => v.phase === 'parked'));
const ev = w.root.BattleAerialRecon.request(w.sim, 'us');
assert.equal(ev.contacts.length, 1, 'one real physically moving hostile squad visible in enemy half');
assert.equal(ev.contacts[0].source, 'aerial');
assert.equal(ev.contacts[0].squadId, 'ge-moving');
const forecast = I.choose(w.sim, 'us', ev);
assert.ok(forecast.evaluated > 0, 'public connected roads and heading produce actual corridor candidates');
assert.ok(forecast.best, 'a physically reachable real US vehicle beats conservative enemy ETA');
assert.ok(forecast.best.margin > 20);
assert.ok(forecast.best.enemyETA > forecast.best.friendlyETA);
const origin = forecast.best.spec.point;
assert.ok(origin.z > 500 && origin.z < 1500, 'watch point is AHEAD of contact before corridor fork');
const initiallyIssued = w.us._macroMission;
let issued = 0;
const issue = (sq, spec, reason) => {
  issued++;
  assert.equal(sq, w.us);
  assert.equal(reason, 'aerial-intercept-feasible');
  const m = { ...spec, version: 2, status: 'issued' };
  sq._macroMission = m;
  assert.ok(T.considerMission(w.sim, sq, m), 'actual pre-existing parked truck must be granted');
  return m;
};
const dispatched = I.maybeIssue(w.sim, 'us', issue);
assert.ok(dispatched && dispatched.result === 'dispatched');
assert.equal(issued, 1);
assert.equal(I.reservePending(w.sim, 'us'), false, 'single-base squad has no screen reservation');
assert.equal(w.us._macroMission.intent, 'intercept');
assert.equal(w.us._macroMission.action, 'intercept', 'explicit corridor-hold action, never synthetic fire');
assert.equal(w.us._macroMission.intercept.source, 'aerial');
assert.equal(w.us._transport.phase, 'boarding');
assert.equal(w.us._transport.vehicleId, dispatched.vehicleId);
assert.equal(T.fleetSummary(w.sim).filter(v => v.phase === 'assigned').length, 1);
assert.equal(T.fleetSummary(w.sim).length, 12, 'no randomly spawned thirteenth vehicle');
assert.equal(I.maybeIssue(w.sim, 'us', issue), null, 'one event cannot cause multiple dispatches');
assert.equal(issued, 1);
assert.equal(w.us._transport.position.z, w.us._transport.initialPosition.z);
assert.ok(w.us._transport.total >= 650, 'drive has a real 650m+ public-road journey');
assert.equal(
  initiallyIssued.status,
  'executing',
  'harness does not secretly modify previous mission lifecycle'
);

// Purpose-first screen: each base owns two trucks, but ONLY an actual
// second squad at the SAME base is held for the uncontested forward mission.
const paired = make(),
  P = paired.root.BattleStrategicInterception,
  PT = paired.root.BattleSquadTransport;
const lead = paired.us;
lead.homeBaseObjectiveId = 'u0';
// This forward objective needs a legal >=830 m round trip to leave 180 m
// for infantry dismount; keep the production transport-distance gate intact.
const sampleTown = paired.sim.scene.metadata.battleScenario;
sampleTown.objectives.find(o => o.id === 'u0').z = -650;
sampleTown.spawnZones.us.bases[0].z = -650;
sampleTown.roads.forEach(road => {
  if (road.fromObjectiveId === 'u0') road.az = -650;
  if (road.toObjectiveId === 'u0') road.bz = -650;
});
lead.baseHome = { x: 0, z: -650 };
lead.home = { x: 0, z: -650 };
paired.hooks['strategic-abstract-transport'].onBattleStart(paired.sim);
lead._macroMission = {
  owner: 'force-command',
  intent: 'capture',
  status: 'executing',
  objectiveId: 'crossing',
  point: { x: 0, z: 500 },
  version: 1,
  observations: { at: 0 }
};
const screen = {
  ...lead,
  id: 'us-screen',
  homeBaseObjectiveId: 'u0',
  _macroMission: {
    owner: 'force-command',
    intent: 'reserve',
    action: 'hold',
    interceptReserve: true,
    status: 'executing',
    version: 1
  },
  _transportUsed: false,
  _transport: null,
  members: lead.members.map((m, i) => ({
    ...m,
    id: 'screen-' + i,
    root: { position: { x: 0, z: -650 + i * 0.03 }, rotation: { y: 0 } }
  }))
};
screen.members.forEach(m => {
  m.squad = screen;
});
paired.sim.factions.us.squads.push(screen);
paired.root.BattleTacticalSituation = { compute: () => ({ contacts: [] }) };
paired.sim.objectiveControl = { sectors: { crossing: { owner: 'neutral' } } };
paired.sim.time = 20;
lead.members.forEach(m => {
  m.root.position = { x: 0, z: 500 };
});
assert.equal(P.reserveSquad(paired.sim, screen), true);
assert.equal(P.reserveSquad(paired.sim, lead), false);
assert.equal(P.reservePending(paired.sim, 'us'), true);
assert.equal(
  P.screenOpportunity(paired.sim, 'us', P.pairs(paired.sim, 'us')[0]),
  null,
  'hold the second truck until the 35-second departure delay'
);
paired.sim.time = 40;
paired.sim.objectiveControl.sectors.crossing.owner = 'neutral';
paired.root.BattleTacticalSituation.compute = () => ({
  contacts: [
    {
      squad: 'us-main',
      source: 'seen',
      age: 1,
      x: 0,
      z: 520
    }
  ]
});
assert.equal(
  P.screenOpportunity(paired.sim, 'us', P.pairs(paired.sim, 'us')[0]),
  null,
  'reported enemy presence at objective blocks reckless forward deployment'
);
assert.ok(
  P.supportOpportunity(paired.sim, 'us', P.pairs(paired.sim, 'us')[0]),
  'contested objective gives second truck a real reinforcement purpose'
);
paired.root.BattleTacticalSituation.compute = () => ({ contacts: [] });
const opp = P.screenOpportunity(paired.sim, 'us', P.pairs(paired.sim, 'us')[0]);
assert.ok(
  opp && opp.spec.intent === 'screen',
  'no recent reported threat permits second-truck departure BEFORE capture'
);
assert.ok(opp.spec.point.z > 500 + 200, 'second squad screens past objective, not on it');
assert.equal(
  opp.spec.screen.launchedBeforeCapture,
  true,
  'the objective is still neutral when the delayed second truck is dispatched'
);
assert.equal(opp.spec.screen.standoffMetres, 25);
assert.equal(opp.quote.route.standoffMetres, 25);
assert.ok(opp.quote.route.destination.z > 500, 'screen dismount occurs on the far side of the objective');
assert.equal(opp.quote.vehicle.faction, 'us');
assert.equal(PT.fleetSummary(paired.sim).length, 12, 'screen quote does not invent a vehicle');
let screenCalls = 0;
const publish = (sq, spec, reason) => {
  screenCalls++;
  assert.equal(sq, screen);
  assert.equal(reason, 'forward-screen-uncontested');
  const m = { ...spec, status: 'issued', version: 2 };
  sq._macroMission = m;
  assert.ok(PT.considerMission(paired.sim, sq, m), 'second physical truck must be admitted');
  return m;
};
const issuedScreen = P.maybeScreen(paired.sim, 'us', publish);
assert.ok(issuedScreen && issuedScreen.vehicleId, 'second truck launches forward screen');
assert.equal(screenCalls, 1);
assert.equal(screen._macroMission.screen.securedObjectiveId, 'crossing');
assert.equal(screen._transport.vehicleId, issuedScreen.vehicleId);
assert.equal(PT.fleetSummary(paired.sim).filter(v => v.phase === 'assigned').length, 1);
assert.equal(PT.fleetSummary(paired.sim).length, 12, 'cannot spawn extra trucks during screening');
assert.equal(
  P.maybeScreen(paired.sim, 'us', publish),
  null,
  'screen assignment does not repeat each commander tick'
);
assert.equal(P.reservePending(paired.sim, 'us'), false, 'screen has purpose, no idle reserve remaining');
// Firsthand contact is relayed only after the squad physically reaches its post.
screen._macroMission.status = 'executing';
screen._missionExecution = { screenOnPostAt: 130 };
screen.members.forEach(m => {
  m.root.position = { ...opp.spec.point };
});
paired.sim.time = 134;
paired.root.BattleTacticalSituation.compute = () => ({
  contacts: [
    {
      squad: screen.id,
      provenance: 'member-belief',
      source: 'told',
      targetId: 'hostile-1',
      at: 134,
      age: 0,
      x: 0,
      z: 500,
      confidence: 0.95
    }
  ]
});
P.maybeScreenReport(paired.sim, 'us', () => {
  throw Error('secondhand intel may not authorize intercept');
});
assert.equal(P.summary(paired.sim).us.screen.reportCount, 0, 'ignore hearsay');
paired.root.BattleTacticalSituation.compute = () => ({
  contacts: [
    {
      squad: screen.id,
      provenance: 'member-belief',
      source: 'seen',
      targetId: 'hostile-1',
      at: 134,
      age: 0,
      x: 0,
      z: 1200,
      confidence: 0.8
    }
  ]
});
P.maybeScreenReport(paired.sim, 'us', () => {
  throw Error('one snapshot is insufficient');
});
assert.equal(P.summary(paired.sim).us.screen.reportCount, 1, 'real sighting relayed upward');
assert.ok(
  paired.events.some(e => e.kind === 'strategic-interception-screen-contact-relayed'),
  'friendly firsthand report reaches the General'
);
paired.sim.time = 139;
paired.root.BattleTacticalSituation.compute = () => ({
  contacts: [
    {
      squad: screen.id,
      provenance: 'member-belief',
      source: 'seen',
      targetId: 'hostile-1',
      at: 139,
      age: 0,
      x: 0,
      z: 1195,
      confidence: 0.8
    }
  ]
});
let footOrders = 0;
const foot = P.maybeScreenReport(paired.sim, 'us', (sq, spec, reason) => {
  footOrders++;
  assert.equal(sq, screen);
  assert.equal(reason, 'forward-screen-report-intercept');
  assert.equal(
    spec.intercept.mode,
    'foot',
    'screen may redeploy itself on foot; it must not invent a replacement truck'
  );
  sq._macroMission = { ...spec, version: 3, status: 'issued' };
  return sq._macroMission;
});
assert.ok(
  foot && foot.margin > 25,
  'multiple firsthand sightings justify General-selected feasible interception'
);
assert.equal(footOrders, 1);
assert.equal(screen._macroMission.intent, 'intercept');
assert.equal(screen._macroMission.intercept.source, 'forward-screen');
assert.equal(PT.fleetSummary(paired.sim).length, 12, 'foot ambush never materializes new vehicles');
assert.equal(
  P.maybeScreenReport(paired.sim, 'us', () => {
    throw Error('duplicate');
  }),
  null,
  'superseded screen cannot repeat one-shot report'
);

const denied = make('?strategicInterception=1&motorTransport=1&aerialRecon=1');
denied.root.BattleAerialRecon.request(denied.sim, 'us');
assert.equal(
  denied.root.BattleStrategicInterception.maybeIssue(denied.sim, 'us', () => {
    throw Error('flag off');
  }),
  null
);
const noFleet = make();
noFleet.root.BattleAerialRecon.request(noFleet.sim, 'us');
noFleet.sim._strategicTransportFleet.vehicles.forEach(v => {
  v.phase = 'stopped';
});
assert.equal(
  noFleet.root.BattleStrategicInterception.choose(
    noFleet.sim,
    'us',
    noFleet.root.BattleAerialRecon.forGeneral(noFleet.sim, 'us')
  ).best,
  null
);
assert.equal(
  noFleet.root.BattleStrategicInterception.maybeIssue(noFleet.sim, 'us', () => {
    throw Error('no vehicles');
  }),
  null
);
assert.equal(noFleet.root.BattleStrategicInterception.summary(noFleet.sim).us.last.result, 'declined');
const stale = make();
stale.root.BattleAerialRecon.request(stale.sim, 'us');
stale.sim.time = 170;
assert.equal(
  stale.root.BattleStrategicInterception.maybeIssue(stale.sim, 'us', () => {
    throw Error('stale');
  }),
  null
);
const hidden = make();
hidden.ge.concealed = true;
const h = hidden.root.BattleAerialRecon.request(hidden.sim, 'us');
assert.equal(h.contacts.length, 0);
assert.equal(
  hidden.root.BattleStrategicInterception.maybeIssue(hidden.sim, 'us', () => {
    throw Error('hidden');
  }),
  null
);
assert.ok(!w.events.some(e => /fire|hit|shot/.test(e.kind)), 'No fabricated shots or targeting');
console.log(
  'PASS report-only General corridor inference, real base road quote, 12-truck exclusive dispatch, actual ETA advantage, expiry, hidden and flag-off controls'
);
