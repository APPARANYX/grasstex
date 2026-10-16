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
