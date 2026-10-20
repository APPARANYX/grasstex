#!/usr/bin/env node
'use strict';
/* Deterministic Macro interception: only a true aerial DTO, actual depot vehicle,
   continuous road legs and positive conservative ETA margin can issue an order.
   This harness does NOT claim a natural battle victory. */
const assert = require('node:assert/strict');
const { loadModule } = require('./module-loader');

function make(
  search = '?strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1&reconOverflight=0'
) {
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
{
  const original = JSON.parse(JSON.stringify(sampleTown));
  sampleTown.objectives.push({ id: 'approach', x: 0, z: 0 });
  sampleTown.objectives.find(o => o.id === 'g0').x = 500;
  sampleTown.roads = sampleTown.roads.filter(
    r => !(r.fromObjectiveId === 'u0' && r.toObjectiveId === 'crossing')
  );
  sampleTown.roads.push(
    { fromObjectiveId: 'u0', toObjectiveId: 'approach', width: 14 },
    { fromObjectiveId: 'approach', toObjectiveId: 'crossing', width: 14 }
  );
  sampleTown.roads.forEach(r => {
    const a = sampleTown.objectives.find(o => o.id === r.fromObjectiveId),
      b = sampleTown.objectives.find(o => o.id === r.toObjectiveId);
    Object.assign(r, { ax: a.x, az: a.z, bx: b.x, bz: b.z });
  });
  // missionRouteFor omits the terminal objective: the screen still must drive
  // through that junction to reach the far-side forward observation post.
  paired.root.BattleCommanderRoutes = { missionRouteFor: () => [{ x: 0, z: 0 }] };
  const corner = P.screenOpportunity(paired.sim, 'us', P.pairs(paired.sim, 'us')[0]);
  assert.ok(corner, 'a bent public-road screen remains physically admissible');
  assert.ok(
    corner.quote.route.path.some(p => p.point.x === 0 && p.point.z === 500),
    'screen path retains the secured-objective road junction'
  );
  Object.assign(sampleTown, original);
  delete paired.root.BattleCommanderRoutes;
}
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
// Every truck is committed to another squad. (An idle stopped truck beside a
// squad is a real ride the transport owner may grant; see the report-fed
// section below and its ?reconCorridors=0 control.)
noFleet.sim._strategicTransportFleet.vehicles.forEach(v => {
  v.phase = 'assigned';
  v.squadId = 'us-elsewhere';
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
// Report-fed corridors: the air branch hands the General position, speed,
// heading and the road corridors approximated from those three alone.
const fed = ev.contacts[0];
assert.ok(fed.corridors.length > 0, 'a moving fix arrives with its corridors');
assert.ok(
  fed.corridors.every(c => c.enemyEtaSeconds <= 600 && c.likelihood > 0 && c.likelihood <= 1),
  'corridors stay inside the report horizon with a split likelihood'
);
assert.ok(
  fed.corridors.every(c => !['u1', 'u2'].includes(c.likelyObjectiveId)),
  'the projection stops at the observer base instead of routing through it'
);
assert.equal(forecast.best.enemyETA, 419.3, 'earliest feasible corridor, not the longest margin');
assert.ok(
  fed.corridors.every(c => c.hop === 0 && c.likelyObjectiveId === 'crossing'),
  'every watch point lies between the column and the objective it is heading for'
);
assert.ok(
  fed.corridors.some(c => c.point.z > 500 && c.point.z < 600),
  'the last watch point sits just short of that objective'
);
// A faster column reaches the far side of the crossing inside the horizon.
const fastCorridors = query => {
  const x = make(
    '?strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1&reconOverflight=0' + query
  );
  x.ge.members.forEach(m => {
    m.moveSpeed = 3;
  });
  return x.root.BattleAerialRecon.request(x.sim, 'us').contacts[0].corridors;
};
const nextObjective = fastCorridors('');
assert.ok(
  nextObjective.some(c => c.hop === 1) && nextObjective.every(c => c.hop <= 1),
  'watch points cover the road on to the next objective, and no further'
);
assert.ok(
  nextObjective
    .filter(c => c.hop === 1)
    .every(c => c.likelyObjectiveId === 'u0' && c.point.z < 500 && c.point.z > -300),
  'each onward watch point lies between the first objective and the next one'
);
assert.ok(
  fastCorridors('&ambushNextObjective=0').every(c => c.hop === 0),
  '?ambushNextObjective=0 keeps only the approach to the first objective'
);
assert.ok(
  fastCorridors('&ambushBeforeObjective=0').some(c => c.hop > 0),
  '?ambushBeforeObjective=0 restores corridors past the objective'
);
const picked = fed.corridors.find(c => c.point.z === forecast.best.spec.point.z);
assert.ok(picked.enemyLatestSeconds > picked.enemyEtaSeconds, 'report gives earliest and latest arrival');
assert.ok(
  forecast.best.expiresAt >= fed.observedAt + Math.min(720, picked.enemyLatestSeconds),
  'the post is held until the slowest plausible arrival'
);
// A post another reported formation already holds is not an ambush.
const held = search => {
  const x = make(search);
  const guard = { ...x.ge, id: 'ge-guard', members: [] };
  guard.members = x.ge.members.map((m, i) => ({
    ...m,
    id: 'guard-' + i,
    moving: false,
    moveSpeed: 0,
    squad: guard,
    root: { position: { x: (i % 2) * 0.1, z: 720 + i * 0.1 }, rotation: { y: 0 } }
  }));
  x.sim.factions.ge.squads.push(guard);
  return x;
};
const contested = held();
const contestedEv = contested.root.BattleAerialRecon.request(contested.sim, 'us');
const contestedPick = contested.root.BattleStrategicInterception.choose(contested.sim, 'us', contestedEv);
assert.ok(
  contestedPick.diagnostic.contestedPost > 0,
  'posts on ground another reported formation holds are refused'
);
assert.ok(
  !contestedPick.best ||
    Math.hypot(contestedPick.best.spec.point.x, contestedPick.best.spec.point.z - 720) > 220,
  'the General never sends a truck onto a held post'
);
const uncontested = held(
  '?strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1&reconOverflight=0&contestedPost=0'
);
const uncontestedPick = uncontested.root.BattleStrategicInterception.choose(
  uncontested.sim,
  'us',
  uncontested.root.BattleAerialRecon.request(uncontested.sim, 'us')
);
assert.equal(uncontestedPick.best.spec.point.z, 731.2, '?contestedPost=0 restores the unchecked pick');
const aged = make();
const agedEv = aged.root.BattleAerialRecon.request(aged.sim, 'us');
aged.sim.time += 20;
const agedBest = aged.root.BattleStrategicInterception.choose(aged.sim, 'us', agedEv).best;
assert.ok(
  agedBest &&
    Math.abs(
      agedBest.enemyETA -
        (agedEv.contacts[0].corridors.find(c => c.point.z === agedBest.spec.point.z).enemyEtaSeconds - 20)
    ) < 1e-6,
  'enemy ETA counts from the observation, so a 20 s old report gives 20 s less'
);
const parkedOnly = make();
parkedOnly.ge.members.forEach(m => {
  m.moving = false;
  m.moveSpeed = 0;
});
const still = parkedOnly.root.BattleAerialRecon.request(parkedOnly.sim, 'us');
assert.equal(still.contacts[0].corridors.length, 0, 'a stationary fix has no direction and no corridor');
const selfProjected = make(
  '?strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1&reconOverflight=0&reconCorridors=0'
);
const plain = selfProjected.root.BattleAerialRecon.request(selfProjected.sim, 'us');
assert.equal(plain.contacts[0].corridors, undefined, '?reconCorridors=0 restores corridor-free reports');
assert.ok(
  selfProjected.root.BattleStrategicInterception.choose(selfProjected.sim, 'us', plain).best,
  '?reconCorridors=0 General still projects roads himself'
);
selfProjected.sim._strategicTransportFleet.vehicles.forEach(v => {
  v.phase = 'stopped';
});
assert.equal(
  selfProjected.root.BattleStrategicInterception.choose(selfProjected.sim, 'us', plain).best,
  null,
  '?reconCorridors=0 keeps the old parked-depot-only quote'
);
// Overflight: the doctrine sortie takes three fixes over 30 s and reports the
// track from the last two, so a column that set off mid-pass is reported moving.
const pass = make('?strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1');
const tick = pass.hooks['strategic-aerial-recon'].onCommanderTick;
pass.ge.members.forEach(m => {
  m.moving = false;
  m.moveSpeed = 0;
});
assert.equal(
  pass.root.BattleAerialRecon.request(pass.sim, 'us'),
  null,
  'AI sortie is airborne, no instant report'
);
assert.equal(pass.root.BattleAerialRecon.status(pass.sim, 'us').inFlight, true);
assert.equal(pass.root.BattleAerialRecon.status(pass.sim, 'us').reportDueAt, 150);
assert.equal(
  pass.root.BattleAerialRecon.forGeneral(pass.sim, 'us'),
  null,
  'nothing reaches the General mid-pass'
);
for (const at of [135, 150]) {
  pass.sim.time = at;
  // The column moves off at 1.2 m/s after the first fix (south, toward z < 1500).
  pass.ge.members.forEach(m => {
    m.root.position.z -= 18;
  });
  tick(pass.sim, { macroCommandEnabled: true });
}
const passed = pass.root.BattleAerialRecon.forGeneral(pass.sim, 'us');
assert.ok(passed && passed.observedAt === 150 && passed.overflightSeconds === 30, 'report lands at pass end');
assert.equal(passed.contacts[0].observation, 'moving', 'track is from displacement, not intent');
assert.ok(Math.abs(passed.contacts[0].headingRadians - Math.PI) < 0.3, 'observed heading is south');
assert.ok(passed.contacts[0].corridors.length > 0, 'moving track arrives with corridors');
assert.ok(
  pass.events.some(e => e.kind === 'strategic-aerial-recon' && e.payload.corridors > 0),
  'telemetry counts delivered corridors'
);
assert.ok(!w.events.some(e => /fire|hit|shot/.test(e.kind)), 'No fabricated shots or targeting');
// Front lines: after a line-change sortie, one squad of a held line's garrison may walk out.
function garrisonWorld(search, count) {
  const g = make(search);
  const squads = Array.from({ length: count }, (_, i) => {
    const sq = {
      id: 'us-garrison-' + i,
      faction: 'us',
      state: 'advance',
      inContact: false,
      _preparedDefenseRequest: { objectiveId: 'crossing', point: { x: 0, z: 500 } },
      _macroMission: {
        owner: 'force-command',
        status: 'executing',
        intent: 'defend',
        objectiveId: 'crossing',
        version: 1
      }
    };
    sq.members = Array.from({ length: 8 }, (_, k) => ({
      id: sq.id + '-' + k,
      dead: false,
      suppressedUntil: 0,
      root: { position: { x: 30 * i + (k % 2), z: 260 + k }, rotation: { y: 0 } },
      squad: sq
    }));
    return sq;
  });
  g.sim.factions.us.squads = squads;
  const ev = g.root.BattleAerialRecon.request(g.sim, 'us');
  return { g, squads, ev };
}
{
  const { g, squads, ev } = garrisonWorld(undefined, 2),
    G = g.root.BattleStrategicInterception;
  assert.equal(G.choose(g.sim, 'us', ev).best, null, 'the first sortie never pulls a garrison');
  const line = Object.freeze({ ...ev, sortie: 2 }),
    pick = G.choose(g.sim, 'us', line).best;
  assert.ok(
    pick && pick.mode === 'foot' && squads.includes(pick.squad),
    'a line-change report lets one garrison squad walk out'
  );
  assert.ok(pick.margin > 25 && pick.vehicleId === null, 'on foot, ahead of the column');
  assert.equal(pick.loneGarrison, false, 'its line kept a garrison squad');
  pick.squad._macroMission = { intent: 'intercept', intercept: { garrisonObjectiveId: 'crossing' } };
  assert.equal(
    G.choose(g.sim, 'us', line).best,
    null,
    'a garrison already sending one squad sends no second'
  );
  const lone = garrisonWorld(undefined, 1);
  assert.equal(
    lone.g.root.BattleStrategicInterception.choose(lone.g.sim, 'us', Object.freeze({ ...lone.ev, sortie: 2 }))
      .best,
    null,
    'the last garrison squad never leaves a line the enemy may attack'
  );
  const rear = garrisonWorld(undefined, 1);
  rear.g.root.BattleFrontLines = { active: () => true, attackable: () => false };
  const rearPick = rear.g.root.BattleStrategicInterception.choose(
    rear.g.sim,
    'us',
    Object.freeze({ ...rear.ev, sortie: 2 })
  ).best;
  assert.ok(
    rearPick && rearPick.mode === 'foot',
    'a lone garrison of a line the enemy cannot attack yet may walk out'
  );
  assert.equal(rearPick.loneGarrison, true, 'marked lone, so the General recalls it if the line opens');
  rear.g.root.BattleFrontLines = { active: () => true, attackable: () => true };
  assert.equal(
    rear.g.root.BattleStrategicInterception.choose(rear.g.sim, 'us', Object.freeze({ ...rear.ev, sortie: 2 }))
      .best,
    null,
    'but not from the line the enemy may attack'
  );
  const off = garrisonWorld(
    '?strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1&reconOverflight=0&garrisonAmbush=0',
    2
  );
  assert.equal(
    off.g.root.BattleStrategicInterception.choose(off.g.sim, 'us', Object.freeze({ ...off.ev, sortie: 2 }))
      .best,
    null,
    '?garrisonAmbush=0 keeps every garrison in place'
  );
}
console.log(
  'PASS report-only General corridor inference, real base road quote, 12-truck exclusive dispatch, actual ETA advantage, expiry, hidden and flag-off controls'
);
