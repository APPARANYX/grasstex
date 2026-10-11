'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');
function world(on = true, structures = false, entry = false) {
  H.resetIds();
  const r = H.bootstrap({
      modules: false,
      search:
        '?localPlan=1&localResources=1&localDegrade=1&coa=0&fireControl=0&slStress=0&scoutsForward=0&stressAct=0&commandMovement=0' +
        (on ? '&localTasks=1' : '') +
        (structures ? '&localStructures=1' : '') +
        (entry ? '&localEntry=1' : '')
    }),
    systems = {},
    events = [];
  r.BattleModules = {
    registerSystem(id, s) {
      systems[id] = s;
    },
    unitsFor: b => b._roster.us.concat(b._roster.ge)
  };
  r.BattleTelemetry = {
    record(type, data) {
      events.push({ type, data });
    }
  };
  r.BattleCommanderDoctrine = {
    policyFor() {
      return { cohesionRadius: 34, captainlessCohesion: 26, routeArrivalRadius: 8 };
    }
  };
  r.BattleCommanderAI = {
    strategicStallReplan: 120,
    acceptMission(b, q) {
      q._macroMission.status = 'executing';
    }
  };
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/movement-resolver.js');
  load('battle/objective-system.js');
  loadSquadCommandStack((root, f) => load(f), r);
  load('battle/modules/46-ammunition-stoppages.js');
  load('battle/modules/08-soldier-events.js');
  load('battle/modules/17-soldier-mind.js');
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 400 } });
  q.members.forEach(s => {
    s.root.position.x = 0;
    s.root.position.z = 0;
    r.BattleAmmunition.initialize(s, b);
  });
  q._macroMission = {
    version: 1,
    status: 'issued',
    intent: 'capture',
    action: 'assault',
    point: { x: 0, z: 400 },
    route: [
      { x: 0, z: 0 },
      { x: 0, z: 200 }
    ],
    objectiveId: 'a'
  };
  b._objectiveById = { a: { id: 'a', def: { radius: 30 }, handler: {}, state: { owner: 'us' } } };
  b._movementRoot = r;
  b.time = 1;
  const S = r.BattleSquadStability,
    P = S.localPlan,
    E = r.BattleEngagement,
    L = r.BattleLeases;
  S.executeMission(b, q, null);
  return { r, b, q, S, P, E, L, systems, events };
}
function identity(w) {
  return JSON.stringify([
    w.q._macroMission,
    w.q.commandPhase,
    w.q.route,
    w.q.routeIndex,
    w.q.objective,
    w.q.orderAnchor,
    w.q.members.map(s => [s.destination, s.prone, s.crawling, s.tacticalCrouch])
  ]);
}
const off = world(false);
assert.equal(off.P.tasksOn, false);
assert.equal(off.P.update(off.b, off.q).kind, 'approach');
assert.equal(off.q._localTask.inputs.execution, undefined);
const w = world();
assert.equal(w.q.routeIndex, 1);
const before = identity(w);
assert.equal(w.P.update(w.b, w.q).kind, 'route-transition');
assert.equal(identity(w), before, 'local planner cannot write strategic, movement or stance state');
assert.equal(w.q._localTask.inputs.execution.clearance, 'not-assessed');
const first = JSON.stringify(w.q._localTask);
assert.equal(JSON.stringify(w.P.update(w.b, w.q)), first, 'stable same-time inputs');
const start = w.q.members[1].root.position.z;
H.run(w.r, w.b, 10, () => {
  w.S.executeMission(w.b, w.q, null);
  w.P.update(w.b, w.q);
});
const metres = w.q.members[1].root.position.z - start;
assert.ok(metres > 5, 'shipping formation/resolver/execution physically traverses the mission route');
const progressed = w.q._localTask.inputs.execution;
assert.ok(
  progressed && progressed.distanceMoved > 5 && progressed.distance < 200,
  'actual route owner supplies progress'
);
for (const change of [
  x => {
    x.q._macroMission.version++;
  },
  x => {
    x.q._macroMission.status = 'issued';
  },
  x => {
    x.q.routeIndex = 0;
  },
  x => {
    x.L.get(x.q, 'route-transition').data.target.z = 999;
  },
  x => {
    x.b.time = 122;
  },
  x => {
    x.L.get(x.q, 'route-transition').since = 99;
  }
]) {
  const x = world();
  change(x);
  assert.equal(x.P.execution(x.b, x.q), null, 'invalid or unaccepted route cannot supply local execution');
}
const contact = world();
contact.q.inContact = true;
contact.r.SquadAI.squadContactsMap = () => [{ at: 1, confidence: 0.9, source: 'told' }];
const r = {
  underFire: 0,
  fireSupport: contact.q.members.slice(2),
  effective: 10,
  pinned: 0,
  fled: [],
  contactStarted: false
};
assert.notEqual(
  contact.P.update(contact.b, contact.q, r).kind,
  'route-transition',
  'contact yields to tactical arbitration'
);
assert.equal(contact.P.update(contact.b, contact.q, { ...r, underFire: 10 }).kind, 'protect');
// Objective security requires real accepted defence, objective ownership and own presence.
function defend(on = true) {
  const x = world(on);
  x.q._macroMission = {
    version: 2,
    status: 'issued',
    intent: 'defend',
    action: 'assault',
    objectiveId: 'a',
    point: { x: 0, z: 0 },
    route: []
  };
  x.S.executeMission(x.b, x.q, null);
  assert.equal(x.q.commandPhase, 'defend');
  return x;
}
const d = defend();
assert.equal(d.P.update(d.b, d.q).kind, 'objective-security');
assert.equal(d.q._localTask.inputs.execution.control, 'owned');
assert.equal(d.q._localTask.inputs.execution.clearance, 'not-assessed');
assert.equal(d.q._localTask.reconAllowed, true, 'legitimate defender recon is not suppressed');
const held = identity(d);
d.E.orderBound(d.q.members);
d.q.members[0].isPlayer = true;
d.L.grant(d.q, 'bound', 'squad-leader', 1, 10, 'old bound', 'expiry');
d.S.resolveLeaseConflicts(d.b, d.q);
assert.equal(
  d.L.get(d.q, 'bound'),
  null,
  'real lease/Engagement owners withdraw incompatible pending advance'
);
assert.ok(d.q.members.slice(1).every(s => !s.eng.boundOrder));
assert.equal(d.q.members[0].eng.boundOrder, true, 'possession independent');
assert.equal(identity(d), held);
for (const change of [
  x => {
    x.b._objectiveById.a.state.owner = 'ge';
  },
  x => {
    x.q.members.forEach(s => {
      s.root.position.z = 100;
    });
  },
  x => {
    x.q._macroMission.status = 'issued';
  },
  x => {
    x.q._missionExecution.mission = {};
  },
  x => {
    delete x.r.BattleObjectiveSystem;
  }
]) {
  const x = defend();
  change(x);
  assert.notEqual(x.P.execution(x.b, x.q)?.kind, 'objective-security');
}
// Existing defensive formation actually holds/fire; the policy creates no substitute firing owner.
const fire = defend();
const enemy = H.addSquad(fire.r, fire.b, {
  id: 'ge-0',
  faction: 'ge',
  x: 0,
  z: 40,
  objective: { x: 0, z: 0 },
  composition: ['rifleman']
});
fire.P.update(fire.b, fire.q);
H.run(fire.r, fire.b, 8, () => fire.S.executeMission(fire.b, fire.q, null));
assert.ok(fire.b.events.fired > 0, 'shipping defensive Engagement fires');
assert.equal(fire.q._assaultAuthorized, false);
assert.ok(
  fire.q.members.every(s => !s.eng.boundOrder),
  'security never publishes offensive bounds'
);
assert.equal(fire.q._macroMission.intent, 'defend');
assert.equal(fire.q.commandPhase, 'defend');
// Real rally-recovery lease and existing four-second physical reform dwell.
const recover = world();
Object.assign(recover.r.BattleSoldierMind, {
  squadStress: () => 0.1,
  teamStress: () => 0.1,
  leadStress: () => 0.1
});
const leader = recover.r.SquadAI.leaderOf(recover.q);
recover.q.members
  .filter(s => s !== leader)
  .slice(0, 4)
  .forEach(s => {
    s.dead = true;
  });
const survivors = recover.q.members.filter(s => !s.dead);
survivors.forEach((s, i) => {
  s.root.position.x = i % 2 ? -45 : 45;
  s.root.position.z = 80 + Math.floor(i / 2) * 12;
});
recover.q.state = 'retreat';
recover.q.inContact = false;
recover.E.orderBound(survivors);
recover.L.grant(recover.q, 'bound', 'squad-leader', 1, 10, 'old advance', 'expiry');
recover.r.SquadAI.updateSquad(recover.q, recover.b);
assert.equal(recover.q.state, 'retreat');
assert.equal(recover.q._localTask.kind, 'recover');
assert.equal(recover.q._localTask.inputs.execution.status, 'reforming');
assert.equal(recover.L.get(recover.q, 'bound'), null);
assert.ok(survivors.every(s => !s.eng.boundOrder));
assert.equal(
  recover.P.update(recover.b, recover.q, { underFire: survivors.length }).kind,
  'recover',
  'maximal pressure cannot replace the existing retreat owner with a tied protection choice'
);
const rally = { ...recover.q._moraleRallyPoint };
survivors.forEach((s, i) => {
  s.root.position.x = rally.x + ((i % 3) - 1) * 0.5;
  s.root.position.z = rally.z + (Math.floor(i / 3) - 0.5) * 0.5;
});
recover.b.time = 10;
recover.r.SquadAI.updateSquad(recover.q, recover.b);
assert.equal(recover.q.state, 'retreat');
recover.b.time = 13.9;
recover.r.SquadAI.updateSquad(recover.q, recover.b);
assert.equal(recover.q.state, 'retreat', 'planner cannot shortcut recovery dwell');
recover.b.time = 14.2;
recover.r.SquadAI.updateSquad(recover.q, recover.b);
assert.equal(recover.q.state, 'advance', 'existing owner hands back after actual reform');
assert.notEqual(recover.q._localTask.kind, 'recover');
assert.equal(recover.q._macroMission.version, 1);
const lost = world();
lost.P.update(lost.b, lost.q);
const inherited = lost.q._localTask;
lost.r.SquadAI.leaderOf(lost.q).dead = true;
assert.equal(lost.P.update(lost.b, lost.q), null);
assert.equal(lost.q._localTask, inherited);
assert.equal(
  lost.P.degradation(lost.b, lost.q, { kind: inherited.kind, serial: inherited.serial, missionVersion: 1 })
    .status,
  'inherited',
  'new route task uses existing succession validator'
);
lost.q._macroMission.version++;
assert.equal(
  lost.P.degradation(lost.b, lost.q, { kind: inherited.kind, serial: inherited.serial, missionVersion: 1 })
    .reason,
  'mission-replaced'
);

// A real Navigation doorway, not an objective radius or a world-truth enemy,
// supplies the optional structure handoff. No ownership/clearance is inferred.
function structureWorld(structures = true, entry = false) {
  const x = world(true, structures, entry);
  loadModule(x.r, 'battle/battle-navigation.js', { console: quietConsole, location: x.r.location });
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
  x.b.scene = { metadata: { battleScenario: scenario } };
  x.r.BattleNavigation.installScenario(scenario);
  x.q.members.forEach(s => {
    s.root.position.x = 0;
    s.root.position.z = 180;
  });
  return { ...x, house, scenario };
}
const structureOff = structureWorld(false);
assert.equal(structureOff.P.structuresOn, false);
assert.equal(structureOff.P.update(structureOff.b, structureOff.q).kind, 'route-transition');
assert.equal(structureOff.q._localTask.inputs.execution.structure, undefined);
const structure = structureWorld();
const nav = structure.r.BattleNavigation;
assert.equal(nav.doorPortals.length, 1, 'shipping Navigation supplies the actual door connector');
assert.equal(structure.P.structuresOn, true);
const frozenStructure = identity(structure);
assert.equal(structure.P.update(structure.b, structure.q).kind, 'structure-handoff');
const approach = structure.q._localTask.inputs.execution.structure;
assert.equal(approach.buildingId, 'farmhouse');
assert.equal(approach.doorwayId, 'farm-door');
assert.equal(approach.stage, 'doorway-approach');
assert.equal(approach.control, 'unknown');
assert.equal(approach.clearance, 'not-assessed');
assert.equal(approach.navigationVersion, nav.version);
assert.equal(identity(structure), frozenStructure, 'handoff has no destination, fire or stance writer');
const firstHandoff = JSON.stringify(structure.q._localTask);
assert.equal(
  JSON.stringify(structure.P.update(structure.b, structure.q)),
  firstHandoff,
  'same-time structure evidence is deterministic'
);
// The observation is physical presence, not fictional capture/clearance.
const structureLeader = structure.r.SquadAI.leaderOf(structure.q);
structureLeader.root.position.x = 0;
structureLeader.root.position.z = 200;
assert.equal(structure.P.update(structure.b, structure.q).kind, 'structure-handoff');
assert.equal(structure.q._localTask.inputs.execution.structure.stage, 'friendly-inside-observed');
assert.equal(structure.q._localTask.inputs.execution.structure.control, 'unknown');
// Entry evidence is a separate default-OFF gate. A time/proximity observation
// cannot count as physical entry, and even real entry never asserts clearance.
const entryOff = structureWorld(true);
assert.equal(entryOff.P.entryOn, false);
assert.equal(entryOff.P.update(entryOff.b, entryOff.q).inputs.execution.structure.entryEvidence, undefined);
const entryWorld = structureWorld(true, true);
assert.equal(entryWorld.P.entryOn, true);
const entryNav = entryWorld.r.BattleNavigation;
const entryDoor = entryNav.doorPortals[0];
const entryLeader = entryWorld.r.SquadAI.leaderOf(entryWorld.q);
entryLeader.root.position.x = entryDoor.outside.x;
entryLeader.root.position.z = entryDoor.outside.z;
assert.equal(entryWorld.P.update(entryWorld.b, entryWorld.q).kind, 'structure-handoff');
assert.equal(
  entryWorld.q._localTask.inputs.execution.structure.entryEvidence.entryVerified,
  false,
  'first exterior observation cannot claim entry'
);
const exterior = { ...entryLeader.root.position };
assert.ok(entryNav.movementClear(entryDoor.outside, entryDoor.inside));
assert.ok(!entryNav.movementClear(entryDoor.outside, { x: 8, z: 200 }), 'solid wall is not a doorway');
entryWorld.b.time += 0.45;
entryLeader.root.position.x = entryDoor.inside.x;
entryLeader.root.position.z = entryDoor.inside.z;
assert.equal(entryWorld.P.update(entryWorld.b, entryWorld.q).kind, 'structure-handoff');
const crossed = entryWorld.q._localTask.inputs.execution.structure.entryEvidence;
assert.equal(crossed.entryVerified, true, 'short real-portal crossing confirms entry');
assert.equal(crossed.handoff, 'interior-observation-required');
assert.equal(crossed.enteredAt, entryWorld.b.time);
assert.equal(entryWorld.q._localTask.inputs.execution.structure.clearance, 'not-assessed');
assert.equal(entryWorld.q._localTask.inputs.execution.structure.control, 'unknown');
const priorConfirmed = JSON.stringify(entryWorld.q._localTask);
assert.equal(JSON.stringify(entryWorld.P.update(entryWorld.b, entryWorld.q)), priorConfirmed);
entryWorld.b.time += 0.45;
assert.equal(entryWorld.P.update(entryWorld.b, entryWorld.q).inputs.execution.structure.entryEvidence.enteredAt, crossed.enteredAt);
entryLeader.root.position.x = exterior.x;
entryLeader.root.position.z = exterior.z;
entryWorld.b.time += 0.45;
assert.equal(entryWorld.P.update(entryWorld.b, entryWorld.q).inputs.execution.structure.entryEvidence.entryVerified, false, 'leaving room revokes entry handoff');
const unverified = structureWorld(true, true);
const unverifiedLeader = unverified.r.SquadAI.leaderOf(unverified.q);
unverifiedLeader.root.position.z = 200;
assert.equal(unverified.P.update(unverified.b, unverified.q).inputs.execution.structure.entryEvidence.entryVerified, false, 'first sighting inside is not proven entry');
for (const spoil of [
  x => {
    x.r.SquadAI.leaderOf(x.q).root.position.z = 200;
  },
  x => {
    x.q._macroMission.version++;
  },
  x => {
    x.r.BattleNavigation.installScenario(x.scenario);
  },
  x => {
    x.q.inContact = true;
  }
]) {
  const x = structureWorld(true, true);
  const port = x.r.BattleNavigation.doorPortals[0];
  const actor = x.r.SquadAI.leaderOf(x.q);
  actor.root.position.x = port.outside.x;
  actor.root.position.z = port.outside.z;
  x.P.update(x.b, x.q);
  x.b.time += 0.45;
  spoil(x);
  if (!x.q.inContact && x.q._macroMission.version === 1 && x.r.BattleNavigation.version === 1) {
    // World-distance jump from an exterior observation cannot qualify.
    assert.equal(x.P.update(x.b, x.q).inputs.execution.structure.entryEvidence.entryVerified, false);
  } else {
    const task = x.P.update(x.b, x.q);
    assert.ok(!task || task.kind !== 'structure-handoff' || !task.inputs.execution.structure.entryEvidence.entryVerified);
  }
}
const entryRestart = structureWorld(true, true);
entryRestart.P.update(entryRestart.b, entryRestart.q);
entryRestart.systems['squad-command'].onBattleRestart(entryRestart.b);
assert.equal(entryRestart.q._localTask, null, 'nonempty entry evidence clears on same-page restart');

// Only own stored sightings at a valid age may annotate reported threats.
structure.r.SquadAI.squadContactsMap = () => [
  { x: 0, z: 200, at: structure.b.time, confidence: 0.9, source: 'seen' }
];
assert.equal(structure.P.execution(structure.b, structure.q).structure.reportedThreats, 1);
assert.notEqual(
  structure.P.update(structure.b, structure.q).kind,
  'structure-handoff',
  'reported contact hands tactical arbitration back to existing contact owners'
);
// Invalid topology, stale map installation, mission replacement and a blocked
// connector all fail closed to the unchanged route-task semantics.
for (const breakMap of [
  x => {
    x.r.BattleNavigation.installScenario({ buildings: [x.house] });
  },
  x => {
    x.house.openings = [];
    x.r.BattleNavigation.installScenario(x.scenario);
  },
  x => {
    x.q._macroMission.version++;
  },
  x => {
    x.q.members.forEach(s => {
      s.root.position.z = 0;
    });
  }
]) {
  const x = structureWorld();
  breakMap(x);
  assert.notEqual(x.P.execution(x.b, x.q)?.kind, 'structure-handoff');
}
const restartStructure = structureWorld();
restartStructure.P.update(restartStructure.b, restartStructure.q);
restartStructure.systems['squad-command'].onBattleRestart(restartStructure.b);
assert.equal(
  restartStructure.q._localTask,
  null,
  'same-page restart clears nonempty structure handoff history'
);

const hidden = world(),
  own = JSON.stringify(hidden.P.read(hidden.b, hidden.q));
H.addSquad(hidden.r, hidden.b, {
  id: 'ge-hidden',
  faction: 'ge',
  x: 0,
  z: 2,
  objective: { x: 0, z: 0 }
}).members.forEach(s => {
  s.root.position.z = 10000;
  s.dead = true;
});
assert.equal(JSON.stringify(hidden.P.read(hidden.b, hidden.q)), own);
assert.ok(w.q._localTask.history.length);
w.systems['squad-command'].onBattleRestart(w.b);
assert.equal(w.q._localTask, null);
console.log(
  'PASS mission-linked execution, current-parent eligibility, actual route progress/defensive fire/recovery dwell, possession/succession/isolation/restart ' +
    JSON.stringify({ routeMetres: metres, defensiveShots: fire.b.events.fired })
);
