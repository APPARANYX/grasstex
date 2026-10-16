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
    roads: road
      ? [{ fromObjectiveId: 'a', toObjectiveId: 'b', ax: 0, az: 0, bx: 0, bz: 1400, width: 14 }]
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
    BattleTelemetry: { record: (type, item) => events.push({ type, item }) }
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
assert.equal(w.api.considerMission(w.sim, w.squad, w.brief()), true, 'Macro grant');
assert.equal(w.squad._transport.phase, 'boarding');
assert.equal(w.squad._transport.owner, 'squad-leader');
assert.equal(w.squad._transport.grantedBy, 'force-command');
assert.equal(w.squad._transport.path.length, 1);
assert.ok(w.squad._transport.total >= 1200 && w.squad._transport.total <= 1230);
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
w.run(12);
assert.equal(w.squad._transport.phase, 'embarked', 'real boarding converges seats');
const embarkedAt = w.squad._transport.embarkedAt;
let last = w.squad._transport.position.z;
let maxStep = 0;
while (w.squad._transport.phase === 'embarked' && w.sim.time < 160) {
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
assert.ok(
  Math.abs(w.squad._transport.travelled - 1220) < 0.1,
  'actual carrier path distance and 180m infantry approach'
);
assert.ok(maxStep < 2.1 && maxStep > 1.5, 'road speed 12m/s on a 0.15s integrator');
assert.ok(w.sim.time - embarkedAt > 95 && w.sim.time - embarkedAt < 110, 'physical 12m/s travel time');
assert.ok(w.members.every(m => !w.api.isPassenger(m) && m._movementStopReason === 'transport-dismounted'));
assert.equal(
  w.api.considerMission(w.sim, w.squad, w.brief(2)),
  false,
  'one-way allocated transport cannot be spawned again at the destination'
);

// A new General brief invalidates the carrier task and returns native infantry control.
const changed = make();
assert.ok(changed.api.considerMission(changed.sim, changed.squad, changed.brief()));
changed.squad._macroMission.status = 'executing';
changed.run(12);
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
blocked.run(12);
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
  'PASS opt-in General grant, physical boarding, 12m/s real road travel, compact passengers, safe dismount, dynamic road block and legacy isolation'
);
