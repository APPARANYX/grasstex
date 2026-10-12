'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');
function world(
  on = true,
  structures = false,
  entry = false,
  entryGate = false,
  survey = false,
  watch = false,
  contactResume = false,
  continuity = false,
  structureOrders = false
) {
  H.resetIds();
  const r = H.bootstrap({
      modules: false,
      search:
        '?localPlan=1&localResources=1&localDegrade=1&coa=0&fireControl=0&slStress=0&scoutsForward=0&stressAct=0&commandMovement=0' +
        (on ? '&localTasks=1' : '') +
        (structures ? '&localStructures=1' : '') +
        (entry ? '&localEntry=1' : '') +
        (entryGate ? '&localEntryGate=1' : '') +
        (survey ? '&localSurvey=1' : '') +
        (watch ? '&localWatch=1' : '') +
        (contactResume ? '&localContactResume=1' : '') +
        (continuity ? '&localContinuity=1' : '') +
        (structureOrders ? '&localStructureOrders=1' : '')
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
function structureWorld(
  structures = true,
  entry = false,
  entryGate = false,
  survey = false,
  watch = false,
  contactResume = false,
  continuity = false,
  structureOrders = false
) {
  const x = world(
    true,
    structures,
    entry,
    entryGate,
    survey,
    watch,
    contactResume,
    continuity,
    structureOrders
  );
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
assert.equal(
  entryWorld.P.update(entryWorld.b, entryWorld.q).inputs.execution.structure.entryEvidence.enteredAt,
  crossed.enteredAt
);
entryLeader.root.position.x = exterior.x;
entryLeader.root.position.z = exterior.z;
entryWorld.b.time += 0.45;
assert.equal(
  entryWorld.P.update(entryWorld.b, entryWorld.q).inputs.execution.structure.entryEvidence.entryVerified,
  false,
  'leaving room revokes entry handoff'
);
const unverified = structureWorld(true, true);
const unverifiedLeader = unverified.r.SquadAI.leaderOf(unverified.q);
unverifiedLeader.root.position.z = 200;
assert.equal(
  unverified.P.update(unverified.b, unverified.q).inputs.execution.structure.entryEvidence.entryVerified,
  false,
  'first sighting inside is not proven entry'
);
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
    assert.ok(
      !task ||
        task.kind !== 'structure-handoff' ||
        !task.inputs.execution.structure.entryEvidence.entryVerified
    );
  }
}
const entryRestart = structureWorld(true, true);
entryRestart.P.update(entryRestart.b, entryRestart.q);
entryRestart.systems['squad-command'].onBattleRestart(entryRestart.b);
assert.equal(entryRestart.q._localTask, null, 'nonempty entry evidence clears on same-page restart');

// A known building route leg must not be consumed merely because the main
// body is within the old generous route arrival radius of the exterior wall.
function routeApproach(w, isNear = true) {
  const p = w.r.BattleNavigation.doorPortals[0];
  const leader = w.r.SquadAI.leaderOf(w.q);
  w.q.members.forEach(s => {
    s.root.position.x = 0;
    s.root.position.z = isNear ? 196 : 180;
  });
  leader.root.position.x = p.outside.x;
  leader.root.position.z = p.outside.z;
  return { p, leader };
}
const legacyRoute = structureWorld(true, true, false);
routeApproach(legacyRoute);
assert.equal(legacyRoute.P.entryGateOn, false);
legacyRoute.P.update(legacyRoute.b, legacyRoute.q);
legacyRoute.S.executeMission(legacyRoute.b, legacyRoute.q, null);
assert.equal(legacyRoute.q.routeIndex, 2, 'existing localEntry behavior remains unchanged without new gate');
const gate = structureWorld(true, true, true);
const gatePosition = routeApproach(gate);
assert.equal(gate.P.entryGateOn, true);
assert.equal(gate.P.entryRequired(gate.b, gate.q, gate.q.route[1]), true);
assert.equal(gate.P.entrySatisfied(gate.b, gate.q, gate.q.route[1]), false);
gate.P.update(gate.b, gate.q);
const lockedLease = gate.L.get(gate.q, 'route-transition');
gate.S.executeMission(gate.b, gate.q, null);
assert.equal(gate.q.routeIndex, 1, 'exterior proximity cannot advance a building-bound route');
assert.equal(gate.L.get(gate.q, 'route-transition'), lockedLease, 'mission owner preserves its route lease');
assert.equal(gate.q.objective.z, 200, 'goal remains published by the existing mission owner');
gatePosition.leader.root.position.x = gatePosition.p.inside.x;
gatePosition.leader.root.position.z = gatePosition.p.inside.z;
gate.b.time += 0.45;
gate.P.update(gate.b, gate.q);
assert.equal(gate.P.entrySatisfied(gate.b, gate.q, gate.q.route[1]), true);
const accepted = gate.q._localTask.inputs.execution.structure.entryEvidence;
assert.equal(accepted.entryVerified, true);
gate.S.executeMission(gate.b, gate.q, null);
assert.equal(gate.q.routeIndex, 2, 'valid crossing hands the leg back to the single mission owner');
assert.equal(gate.L.get(gate.q, 'route-transition')?.data.leg, 2);
assert.equal(gate.q._macroMission.version, 1, 'handoff does not invent a strategic mission');
assert.equal(gate.q._localTask.inputs.execution.structure.control, 'unknown');
assert.equal(gate.q._localTask.inputs.execution.structure.clearance, 'not-assessed');
const skipped = structureWorld(true, true, true);
const skipLeader = skipped.r.SquadAI.leaderOf(skipped.q);
skipped.q.members.forEach(s => {
  s.root.position.z = 196;
});
skipLeader.root.position.z = 200;
skipped.P.update(skipped.b, skipped.q);
skipped.S.executeMission(skipped.b, skipped.q, null);
assert.equal(skipped.q.routeIndex, 1, 'initial inside sighting is not a proven crossing');
const teleport = structureWorld(true, true, true);
routeApproach(teleport);
teleport.P.update(teleport.b, teleport.q);
teleport.b.time += 0.45;
const jumper = teleport.r.SquadAI.leaderOf(teleport.q);
jumper.root.position.x = 0;
jumper.root.position.z = 200;
teleport.P.update(teleport.b, teleport.q);
assert.equal(teleport.P.entrySatisfied(teleport.b, teleport.q, teleport.q.route[1]), false);
teleport.S.executeMission(teleport.b, teleport.q, null);
assert.equal(teleport.q.routeIndex, 1, 'unphysical outside-to-interior jump cannot release route leg');
const staleGate = structureWorld(true, true, true);
const staleApproach = routeApproach(staleGate);
staleGate.P.update(staleGate.b, staleGate.q);
staleGate.b.time += 0.45;
staleApproach.leader.root.position.x = staleApproach.p.inside.x;
staleApproach.leader.root.position.z = staleApproach.p.inside.z;
staleGate.P.update(staleGate.b, staleGate.q);
staleGate.q._macroMission.version++;
assert.equal(
  staleGate.P.entrySatisfied(staleGate.b, staleGate.q, staleGate.q.route[1]),
  false,
  'old mission evidence cannot advance new mission'
);
const retreatGate = structureWorld(true, true, true);
const retreatApproach = routeApproach(retreatGate);
retreatGate.P.update(retreatGate.b, retreatGate.q);
retreatGate.b.time += 0.45;
retreatApproach.leader.root.position.x = retreatApproach.p.inside.x;
retreatApproach.leader.root.position.z = retreatApproach.p.inside.z;
retreatGate.P.update(retreatGate.b, retreatGate.q);
retreatGate.q.state = 'retreat';
retreatGate.S.executeMission(retreatGate.b, retreatGate.q, null);
assert.equal(retreatGate.q.routeIndex, 1, 'retreat cannot consume an offensive structure route');
const gateReset = structureWorld(true, true, true);
routeApproach(gateReset);
gateReset.P.update(gateReset.b, gateReset.q);
gateReset.systems['squad-command'].onBattleRestart(gateReset.b);
assert.equal(gateReset.q._localTask, null);
assert.equal(gateReset.P.entrySatisfied(gateReset.b, gateReset.q, gateReset.q.route[1]), false);

// Two live witnesses must actually be inside and looking along clear
// Navigation/terrain sightlines. A successful survey is evidence of ground
// footprint observation only; neither contacts nor clearance are inferred.
function surveyFixture(watch = false, contactResume = false, continuity = false, structureOrders = false) {
  const x = structureWorld(true, true, true, true, watch, contactResume, continuity, structureOrders);
  const door = x.r.BattleNavigation.doorPortals[0],
    leader = x.r.SquadAI.leaderOf(x.q),
    buddy = x.q.members.find(s => s !== leader),
    others = x.q.members.filter(s => s !== leader && s !== buddy);
  x.q.members.forEach(s => {
    s.root.position.x = 0;
    s.root.position.z = 196;
  });
  others.forEach(s => {
    s.root.position.z = 180;
  });
  leader.root.position.x = door.outside.x;
  leader.root.position.z = door.outside.z;
  buddy.root.position.x = 0;
  buddy.root.position.z = 180;
  x.P.update(x.b, x.q);
  x.b.time += 0.45;
  leader.root.position.x = door.inside.x;
  leader.root.position.z = door.inside.z;
  x.P.update(x.b, x.q);
  return { ...x, leader, buddy, door, others };
}
function surveyPoint(x, i) {
  const xy = [
    [-0.23, -0.23],
    [0.23, -0.23],
    [-0.23, 0.23],
    [0.23, 0.23]
  ][i];
  const b = x.house,
    c = Math.cos(b.rot),
    si = Math.sin(b.rot);
  return { x: b.x + xy[0] * b.w * c + xy[1] * b.d * si, z: b.z - xy[0] * b.w * si + xy[1] * b.d * c };
}
function face(s, p) {
  s.root.rotation.y = Math.atan2(p.x - s.root.position.x, p.z - s.root.position.z);
}
const surveyOff = structureWorld(true, true, true, false);
assert.equal(surveyOff.P.surveyOn, false);
surveyOff.P.update(surveyOff.b, surveyOff.q);
assert.equal(surveyOff.q._localTask.inputs.execution.structure.survey, undefined);
const survey = surveyFixture();
assert.equal(survey.P.surveyOn, true);
assert.equal(survey.q._localTask.inputs.execution.structure.entryEvidence.entryVerified, true);
assert.equal(survey.q._localTask.inputs.execution.structure.survey.status, 'insufficient-interior-observers');
assert.equal(survey.P.entrySatisfied(survey.b, survey.q, survey.q.route[1]), false);
survey.S.executeMission(survey.b, survey.q, null);
assert.equal(survey.q.routeIndex, 1, 'crossing by one man cannot finish an interior survey');
survey.buddy.root.position.x = 0;
survey.buddy.root.position.z = 200;
for (let i = 0; i < 4; i++) {
  const target = surveyPoint(survey, i);
  const witness = i < 2 ? survey.leader : survey.buddy;
  const other = i < 2 ? survey.buddy : survey.leader;
  face(witness, target);
  other.root.rotation.y = faceAway(other, target);
  survey.b.time += 0.45;
  survey.P.update(survey.b, survey.q);
}
function faceAway(s, p) {
  return Math.atan2(p.x - s.root.position.x, p.z - s.root.position.z) + Math.PI;
}
const done = survey.q._localTask.inputs.execution.structure.survey;
assert.equal(done.observedSectors, 4, 'all four real inside rays were sampled');
assert.equal(done.contributors.length, 2, 'two distinct live men actually looked into footprint sectors');
assert.equal(done.complete, true);
assert.equal(done.status, 'ground-footprint-surveyed');
assert.equal(done.clearance, 'not-assessed');
assert.equal(done.control, 'unknown');
const surveyedIdentity = identity(survey);
assert.equal(survey.P.entrySatisfied(survey.b, survey.q, survey.q.route[1]), true);
assert.equal(
  identity(survey),
  surveyedIdentity,
  'survey never writes fire, stance, movement or mission state'
);
survey.S.executeMission(survey.b, survey.q, null);
assert.equal(survey.q.routeIndex, 2, 'single mission owner hands back only after actual survey');

// Geometry/facing, own-team composition, contact and mission freshness cannot
// be replaced by timers or presence. No enemies are read from world transforms.
const secondWitness = surveyFixture();
secondWitness.buddy.root.position.x = 0;
secondWitness.buddy.root.position.z = 200;
const nativeLOS = secondWitness.r.SquadAI.hasLineOfSight;
secondWitness.r.SquadAI.hasLineOfSight = (a, b, c, d) => a !== secondWitness.buddy && nativeLOS(a, b, c, d);
// A single sentry can visually inspect every sample, but that alone does not
// establish corroboration. A later second witness may confirm an already
// observed sector rather than requiring an artificial new fifth sector.
for (let i = 0; i < 4; i++) {
  const target = surveyPoint(secondWitness, i);
  face(secondWitness.leader, target);
  secondWitness.buddy.root.rotation.y = faceAway(secondWitness.buddy, target);
  secondWitness.b.time += 0.45;
  secondWitness.P.update(secondWitness.b, secondWitness.q);
}
assert.equal(secondWitness.q._localTask.inputs.execution.structure.survey.observedSectors, 4);
assert.equal(secondWitness.q._localTask.inputs.execution.structure.survey.contributors.length, 1);
secondWitness.r.SquadAI.hasLineOfSight = nativeLOS;
assert.equal(
  secondWitness.P.entrySatisfied(secondWitness.b, secondWitness.q, secondWitness.q.route[1]),
  false
);
const reaffirm = surveyPoint(secondWitness, 0);
face(secondWitness.buddy, reaffirm);
secondWitness.leader.root.rotation.y = faceAway(secondWitness.leader, reaffirm);
secondWitness.b.time += 0.45;
secondWitness.P.update(secondWitness.b, secondWitness.q);
assert.equal(secondWitness.q._localTask.inputs.execution.structure.survey.contributors.length, 2);
assert.equal(
  secondWitness.P.entrySatisfied(secondWitness.b, secondWitness.q, secondWitness.q.route[1]),
  true
);

const blocked = surveyFixture();
blocked.buddy.root.position.x = 0;
blocked.buddy.root.position.z = 200;
blocked.r.SquadAI.hasLineOfSight = () => false;
for (let i = 0; i < 4; i++) {
  face(blocked.leader, surveyPoint(blocked, i));
  blocked.b.time += 0.5;
  blocked.P.update(blocked.b, blocked.q);
}
assert.equal(blocked.q._localTask.inputs.execution.structure.survey.observedSectors, 0);
assert.equal(blocked.P.entrySatisfied(blocked.b, blocked.q, blocked.q.route[1]), false);
const contactSurvey = surveyFixture();
contactSurvey.buddy.root.position.z = 200;
contactSurvey.q.inContact = true;
contactSurvey.P.update(contactSurvey.b, contactSurvey.q);
assert.equal(
  contactSurvey.P.entrySatisfied(contactSurvey.b, contactSurvey.q, contactSurvey.q.route[1]),
  false
);
const staleSurvey = surveyFixture();
staleSurvey.q._macroMission.version += 1;
assert.equal(staleSurvey.P.entrySatisfied(staleSurvey.b, staleSurvey.q, staleSurvey.q.route[1]), false);
const lostSurvey = surveyFixture();
lostSurvey.leader.dead = true;
assert.equal(lostSurvey.P.entrySatisfied(lostSurvey.b, lostSurvey.q, lostSurvey.q.route[1]), false);
const restartedSurvey = surveyFixture();
restartedSurvey.systems['squad-command'].onBattleRestart(restartedSurvey.b);
assert.equal(restartedSurvey.q._localTask, null);
assert.equal(
  restartedSurvey.P.entrySatisfied(restartedSurvey.b, restartedSurvey.q, restartedSurvey.q.route[1]),
  false
);

// Only the original mission owner releases a building leg when two separate
// real men physically cover both the actual doorway and interior. A survey
// alone or stationary timer alone is not security; combat always interrupts.
const watchOff = surveyFixture();
assert.equal(watchOff.P.watchOn, false);
assert.equal(watchOff.q._localTask.inputs.execution.structure.watch, undefined);
const security = surveyFixture(true);
assert.equal(security.P.watchOn, true);
security.buddy.root.position.x = 3;
security.buddy.root.position.z = 200;
for (let i = 0; i < 4; i++) {
  const marker = surveyPoint(security, i),
    actor = i < 2 ? security.leader : security.buddy;
  face(actor, marker);
  security.b.time += 0.45;
  security.P.update(security.b, security.q);
}
assert.equal(security.q._localTask.inputs.execution.structure.survey.complete, true);
assert.equal(
  security.P.entrySatisfied(security.b, security.q, security.q.route[1]),
  false,
  'full footprint survey alone cannot release watched doorway leg'
);
security.S.executeMission(security.b, security.q, null);
assert.equal(security.q.routeIndex, 1);
const guardFacing = { x: security.door.outside.x, z: security.door.outside.z },
  interiorFacing = { x: security.house.x, z: security.house.z };
face(security.leader, guardFacing);
face(security.buddy, interiorFacing);
security.b.time += 0.45;
security.P.update(security.b, security.q);
const firstWatch = security.q._localTask.inputs.execution.structure.watch;
assert.equal(firstWatch.doorGuardId, String(security.leader.id));
assert.equal(firstWatch.interiorGuardId, String(security.buddy.id));
assert.equal(firstWatch.ready, false);
const watchIdentity = identity(security);
security.b.time += 0.75;
security.P.update(security.b, security.q);
assert.equal(security.q._localTask.inputs.execution.structure.watch.ready, true);
assert.equal(security.q._localTask.inputs.execution.structure.watch.status, 'doorway-watch-confirmed');
assert.equal(security.q._localTask.inputs.execution.structure.watch.clearance, 'not-assessed');
assert.equal(security.q._localTask.inputs.execution.structure.watch.control, 'unknown');
assert.equal(identity(security), watchIdentity, 'security observation cannot write route, stance or fire');
assert.equal(security.P.entrySatisfied(security.b, security.q, security.q.route[1]), true);
security.S.executeMission(security.b, security.q, null);
assert.equal(security.q.routeIndex, 2, 'existing Mission Execution handback after real watch');

// No valid doorway LOS means no false security claim; no posed/stationary man
// can authorize handback simply by waiting. Contact and changed map must deny.
const watchBlocked = surveyFixture(true);
watchBlocked.buddy.root.position.x = 3;
watchBlocked.buddy.root.position.z = 200;
const watchSight = watchBlocked.r.SquadAI.hasLineOfSight;
watchBlocked.r.SquadAI.hasLineOfSight = (s, marker, h, obs) =>
  marker.root.position.x === watchBlocked.door.outside.x &&
  marker.root.position.z === watchBlocked.door.outside.z
    ? false
    : watchSight(s, marker, h, obs);
for (let i = 0; i < 4; i++) {
  face(i < 2 ? watchBlocked.leader : watchBlocked.buddy, surveyPoint(watchBlocked, i));
  watchBlocked.b.time += 0.45;
  watchBlocked.P.update(watchBlocked.b, watchBlocked.q);
}
face(watchBlocked.leader, watchBlocked.door.outside);
face(watchBlocked.buddy, watchBlocked.house);
watchBlocked.b.time += 1.5;
watchBlocked.P.update(watchBlocked.b, watchBlocked.q);
assert.equal(watchBlocked.q._localTask.inputs.execution.structure.watch.ready, false);
assert.equal(watchBlocked.P.entrySatisfied(watchBlocked.b, watchBlocked.q, watchBlocked.q.route[1]), false);
const contactWatch = surveyFixture(true);
contactWatch.q.inContact = true;
contactWatch.P.update(contactWatch.b, contactWatch.q);
assert.equal(contactWatch.P.entrySatisfied(contactWatch.b, contactWatch.q, contactWatch.q.route[1]), false);
const restartWatch = surveyFixture(true);
restartWatch.systems['squad-command'].onBattleRestart(restartWatch.b);
assert.equal(restartWatch.q._localTask, null);
assert.equal(restartWatch.P.entrySatisfied(restartWatch.b, restartWatch.q, restartWatch.q.route[1]), false);

// Combat closes the existing structure route-transition lease without
// permitting proximity arrival. Once Engagement's tactical plan has fully
// closed, the SAME Mission Execution owner can rearm that leg, but never
// reuses old physical entry, footprint survey or doorway watch.
function interruptStructureRoute(resume = true) {
  const w = surveyFixture(true, resume);
  w.q._engagementPlan = { missionVersion: 1, status: 'active' };
  w.q.inContact = true;
  w.S.executeMission(w.b, w.q, null);
  assert.equal(w.L.get(w.q, 'route-transition'), null, 'real contact closes the route lease');
  assert.equal(w.q.routeIndex, 1, 'firefight cannot fast-forward the route');
  w.P.update(w.b, w.q); // the commander tick replaces the old entry evidence
  return w;
}
const contactOff = interruptStructureRoute(false);
assert.equal(contactOff.P.contactResumeOn, false);
assert.equal(contactOff.q._missionExecution.contactRouteResume, undefined, 'flag off remains unchanged');
contactOff.q.inContact = false;
contactOff.q._engagementPlan = null;
contactOff.b.time += 2;
contactOff.S.executeMission(contactOff.b, contactOff.q, null);
assert.equal(contactOff.L.get(contactOff.q, 'route-transition'), null);
const contactRearm = interruptStructureRoute();
assert.equal(contactRearm.P.contactResumeOn, true);
const interrupted = contactRearm.q._missionExecution.contactRouteResume;
assert.ok(interrupted && interrupted.leg === 1 && interrupted.missionVersion === 1);
assert.equal(interrupted.navigationVersion, contactRearm.r.BattleNavigation.version);
assert.equal(interrupted.target.z, 200);
contactRearm.q.inContact = false;
contactRearm.q._engagementPlan.status = 'quiet';
contactRearm.b.time += 0.5;
contactRearm.S.executeMission(contactRearm.b, contactRearm.q, null);
assert.equal(
  contactRearm.L.get(contactRearm.q, 'route-transition'),
  null,
  'a quiet tactical plan must finish before returning mission control'
);
contactRearm.q._engagementPlan = null;
contactRearm.b.time += 0.5;
contactRearm.S.executeMission(contactRearm.b, contactRearm.q, null);
const newLeg = contactRearm.L.get(contactRearm.q, 'route-transition');
assert.ok(newLeg, 'original Mission Execution reissues lost contact route lease');
assert.equal(newLeg.data.leg, 1);
assert.equal(newLeg.data.missionVersion, 1);
assert.equal(contactRearm.q._missionExecution.contactRouteResume, null);
assert.equal(contactRearm.q.routeIndex, 1);
assert.equal(contactRearm.q._macroMission.version, 1);
contactRearm.P.update(contactRearm.b, contactRearm.q);
assert.equal(
  contactRearm.q._localTask.inputs.execution.structure.entryEvidence.entryVerified,
  false,
  'contact must never fabricate or restore an unobserved portal crossing'
);
assert.equal(contactRearm.q._localTask.inputs.execution.structure.survey.complete, false);
assert.equal(contactRearm.q._localTask.inputs.execution.structure.watch.ready, false);
assert.equal(contactRearm.P.entrySatisfied(contactRearm.b, contactRearm.q, contactRearm.q.route[1]), false);
assert.equal(contactRearm.events.filter(x => x.type === 'decision-route-transition-resume').length, 1);
contactRearm.S.executeMission(contactRearm.b, contactRearm.q, null);
assert.equal(
  contactRearm.q.routeIndex,
  1,
  'reissued lease needs independently fresh physical entry evidence'
);
for (const spoil of [
  w => {
    w.q._macroMission.version++;
  },
  w => {
    w.q.routeIndex = 2;
  },
  w => {
    w.r.BattleNavigation.installScenario(w.scenario);
  },
  w => {
    w.q._macroMission.status = 'issued';
  },
  w => {
    w.q._macroMission.route[1].z = 201;
    w.q.route[1].z = 201;
  },
  w => {
    w.q.state = 'retreat';
  },
  w => {
    w.systems['squad-command'].onBattleRestart(w.b);
  }
]) {
  const w = interruptStructureRoute();
  w.q.inContact = false;
  w.q._engagementPlan = null;
  w.b.time += 0.5;
  spoil(w);
  w.S.executeMission(w.b, w.q, null);
  assert.equal(
    w.L.get(w.q, 'route-transition'),
    null,
    'superseded mission, target, map, route, retreat or restart cannot replay a contact leg'
  );
}

// Separate, continuously corroborated interior provenance survives contact;
// no physical crossing or prior survey/watch completion is synthesized.
function continuityFixture(presecured = false) {
  const x = surveyFixture(true, true, true);
  x.buddy.root.position.x = 0;
  x.buddy.root.position.z = 200;
  x.b.time += 0.45;
  x.P.update(x.b, x.q);
  // Seed and corroborate before Engagement takes ownership.
  x.b.time += 0.45;
  x.P.update(x.b, x.q);
  if (presecured) {
    for (let i = 0; i < 4; i++) {
      face(i < 2 ? x.leader : x.buddy, surveyPoint(x, i));
      x.b.time += 0.45;
      x.P.update(x.b, x.q);
    }
    x.buddy.root.position.x = 3;
    face(x.leader, x.door.outside);
    face(x.buddy, x.house);
    x.b.time += 0.45;
    x.P.update(x.b, x.q);
    x.b.time += 0.75;
    x.P.update(x.b, x.q);
    assert.equal(x.P.entrySatisfied(x.b, x.q, x.q.route[1]), true, 'pre-contact security actually complete');
  }
  x.q.inContact = true;
  x.q._engagementPlan = { missionVersion: 1, status: 'active' };
  // Exercise the real local-before-mission commander order.
  for (let i = 0; i < 3; i++) {
    x.b.time += 0.45;
    x.P.update(x.b, x.q);
    x.S.executeMission(x.b, x.q, null);
  }
  assert.equal(x.L.get(x.q, 'route-transition'), null);
  assert.equal(x.q.routeIndex, 1);
  return x;
}
function rearmContinuity(x) {
  x.q.inContact = false;
  x.q._engagementPlan.status = 'quiet';
  x.b.time += 0.45;
  x.P.update(x.b, x.q);
  x.S.executeMission(x.b, x.q, null);
  assert.equal(x.L.get(x.q, 'route-transition'), null);
  assert.equal(x.P.entrySatisfied(x.b, x.q, x.q.route[1]), false);
  x.q._engagementPlan = null;
  x.b.time += 0.45;
  x.P.update(x.b, x.q);
  x.S.executeMission(x.b, x.q, null);
  assert.equal(x.q.routeIndex, 1, 'rearm tick cannot approve from earlier survey');
  x.b.time += 0.45;
  x.P.update(x.b, x.q);
  return x.q._localTask.inputs.execution.structure;
}
const continuity = continuityFixture(true);
const resumedPresence = rearmContinuity(continuity);
assert.equal(resumedPresence.entryEvidence.entryVerified, false, 'no new physical entry event');
assert.equal(resumedPresence.presenceEvidence.presenceVerified, true);
assert.equal(resumedPresence.presenceEvidence.provenance, 'continuous-interior-presence');
assert.ok(resumedPresence.presenceEvidence.physicalEntryAt < resumedPresence.presenceEvidence.enteredAt);
assert.equal(resumedPresence.survey.complete, false);
assert.equal(resumedPresence.watch.ready, false);
// Freshly execute the four facing samples, then independently re-establish posts.
for (let i = 0; i < 4; i++) {
  face(i < 2 ? continuity.leader : continuity.buddy, surveyPoint(continuity, i));
  continuity.b.time += 0.45;
  continuity.P.update(continuity.b, continuity.q);
}
assert.equal(continuity.q._localTask.inputs.execution.structure.survey.complete, true);
continuity.buddy.root.position.x = 3;
face(continuity.leader, continuity.door.outside);
face(continuity.buddy, continuity.house);
continuity.b.time += 0.45;
continuity.P.update(continuity.b, continuity.q);
assert.equal(continuity.q._localTask.inputs.execution.structure.watch.ready, false);
continuity.b.time += 0.75;
continuity.P.update(continuity.b, continuity.q);
assert.equal(continuity.P.entrySatisfied(continuity.b, continuity.q, continuity.q.route[1]), true);
continuity.S.executeMission(continuity.b, continuity.q, null);
assert.equal(continuity.q.routeIndex, 2, 'same mission owner hands back with fresh security');
for (const spoil of [
  x => {
    x.b.time += 2;
  },
  x => {
    x.b.time -= 1;
  },
  x => {
    x.leader.isPlayer = true;
  },
  x => {
    x.leader.dead = true;
  },
  x => {
    x.buddy.dead = true;
  },
  x => {
    x.buddy.isPlayer = true;
  },
  x => {
    x.buddy.root.position.z = 180;
  },
  x => {
    x.leader.root.position.x = 5;
  },
  x => {
    x.r.SquadAI.hasLineOfSight = () => false;
  },
  x => {
    x.q._macroMission.version++;
  },
  x => {
    x.q.route[1].z++;
  },
  x => {
    x.r.BattleNavigation.installScenario(x.scenario);
  },
  x => {
    x.q.state = 'retreat';
  },
  x => {
    x.systems['squad-command'].onBattleRestart(x.b);
  }
]) {
  const x = continuityFixture();
  x.b.time += 0.05;
  spoil(x);
  x.P.update(x.b, x.q);
  x.q.inContact = false;
  x.q._engagementPlan = null;
  x.b.time += 0.45;
  x.S.executeMission(x.b, x.q, null);
  x.P.update(x.b, x.q);
  assert.ok(
    !x.q._localTask?.inputs.execution?.structure?.presenceEvidence,
    'lost continuity, identity, Navigation, possession or restart fails closed'
  );
  assert.equal(x.P.entrySatisfied(x.b, x.q, x.q.route[1]), false);
}
const loss = continuityFixture();
loss.buddy.root.position.z = 180;
loss.b.time += 0.45;
loss.P.update(loss.b, loss.q);
loss.buddy.root.position.z = 200;
assert.ok(
  !rearmContinuity(loss).presenceEvidence,
  'returning witness cannot repair the lost observation chain'
);
const noEntry = structureWorld(true, true, true, true, true, true, true);
noEntry.q.members.forEach(s => {
  s.root.position.x = 0;
  s.root.position.z = 200;
});
for (let i = 0; i < 5; i++) {
  noEntry.b.time += 0.45;
  noEntry.P.update(noEntry.b, noEntry.q);
}
assert.ok(
  !noEntry.q._localTask.inputs.execution.structure.presenceEvidence,
  'spawned-inside timer never creates provenance'
);
assert.equal(noEntry.P.entrySatisfied(noEntry.b, noEntry.q, noEntry.q.route[1]), false);

// No position/facing injection after scenario setup: shipping fireteam orders,
// Micro stance/facing, resolver and movement must execute the building lifecycle.
const autonomous = structureWorld(true, true, true, true, true, true, true, true);
assert.equal(autonomous.P.structureOrdersOn, true);
const stages = new Set(),
  physicalStart = autonomous.q.members.map(s => ({ ...s.root.position }));
let physicalEntry = null,
  naturalSurvey = null,
  naturalWatch = null,
  handedBackAt = null;
H.run(autonomous.r, autonomous.b, 45, () => {
  const q = autonomous.q,
    t = q._localTask;
  if (t?.inputs.structureExecution) stages.add(t.inputs.structureExecution.stage);
  const st = t?.inputs.execution?.structure;
  if (st?.entryEvidence.entryVerified && !physicalEntry) physicalEntry = { ...st.entryEvidence };
  if (st?.survey.complete && !naturalSurvey) naturalSurvey = JSON.parse(JSON.stringify(st.survey));
  if (st?.watch.ready && !naturalWatch) naturalWatch = JSON.parse(JSON.stringify(st.watch));
  autonomous.S.executeMission(autonomous.b, q, null);
  if (q.routeIndex === 2 && handedBackAt == null) handedBackAt = autonomous.b.time;
});
assert.ok(physicalEntry, 'shipping movement physically crosses the Navigation portal');
assert.ok(naturalSurvey?.complete, 'AI actually turns two witnesses toward all four sectors');
assert.ok(naturalWatch?.ready, 'AI actually establishes the doorway/interior watch');
assert.ok(handedBackAt != null, 'original mission owner advances after actual security');
assert.ok(
  stages.has('approach-door') &&
    stages.has('cross-door') &&
    stages.has('observe-footprint') &&
    stages.has('watch-doorway')
);
assert.equal(physicalEntry.entryVerified, true);
assert.equal(autonomous.q._macroMission.version, 1);
assert.ok(
  autonomous.q.members.some(
    (s, i) => Math.hypot(s.root.position.x - physicalStart[i].x, s.root.position.z - physicalStart[i].z) > 5
  )
);

// A real own report engages the structure security task; hidden live world
// movement cannot change the reported threat point or manufacture a rifle target.
const reportedStructure = structureWorld(true, true, true, true, true, true, true, true);
H.run(reportedStructure.r, reportedStructure.b, 10, () =>
  reportedStructure.S.executeMission(reportedStructure.b, reportedStructure.q, null)
);
const reporter = reportedStructure.r.SquadAI.leaderOf(reportedStructure.q);
reportedStructure.r.SquadAI.rememberReportedContact(reporter, reportedStructure.b, {
  x: 0,
  z: 200,
  observedAt: reportedStructure.b.time,
  confidence: 0.9,
  sourceId: 'friendly-witness',
  targetId: 'reported-interior',
  otherFaction: 'ge',
  reportId: 'valid-interior-report'
});
const reportTask = reportedStructure.P.update(reportedStructure.b, reportedStructure.q, {
  fireSupport: reportedStructure.q.members.slice(3),
  underFire: 0
});
assert.equal(reportTask.kind, 'structure-security');
assert.equal(reportTask.boundsAllowed, false);
assert.equal(reportTask.inputs.structureExecution.stage, 'contact-security');
assert.ok(
  reportTask.inputs.structureExecution.orders.every(o => {
    const s = reportedStructure.q.members.find(s => String(s.id) === o.soldierId);
    return Math.hypot(s.root.position.x - o.point.x, s.root.position.z - o.point.z) < 0.7;
  }),
  'contact retains reached posts/current positions rather than inventing exposed moves'
);
assert.equal(reporter.target, null, 'reported interior position is not a hidden target object');
reportedStructure.E.orderBound(reportedStructure.q.members);
reportedStructure.L.grant(
  reportedStructure.q,
  'bound',
  'squad-leader',
  reportedStructure.b.time,
  reportedStructure.b.time + 10,
  'incompatible bound'
);
reportedStructure.S.resolveLeaseConflicts(reportedStructure.b, reportedStructure.q);
assert.equal(reportedStructure.L.get(reportedStructure.q, 'bound'), null);
assert.ok(reportedStructure.q.members.every(s => !s.eng.boundOrder));
// Shipping Perception/Engagement encounter an actual hostile in the footprint.
const hostileStructure = structureWorld(true, true, true, true, true, true, true, true);
H.run(hostileStructure.r, hostileStructure.b, 10, () =>
  hostileStructure.S.executeMission(hostileStructure.b, hostileStructure.q, null)
);
const hostile = H.addSquad(hostileStructure.r, hostileStructure.b, {
  id: 'ge-interior',
  faction: 'ge',
  x: 0,
  z: 200,
  objective: { x: 0, z: 200 },
  composition: ['rifleman']
});
const enemyActor = hostile.members[0];
// Scenario setup places the hostile in a real room footprint; no own tactical observation is injected.
enemyActor.root.position.x = 0;
enemyActor.root.position.z = 200;
let ownShots = 0,
  observedSecurity = false,
  confirmedLOS = false;
const originalFire = hostileStructure.b.onFire;
hostileStructure.b.onFire = s => {
  if (s.faction === 'us') ownShots++;
  originalFire(s);
};
H.run(hostileStructure.r, hostileStructure.b, 5, () => {
  hostileStructure.S.executeMission(hostileStructure.b, hostileStructure.q, null);
  if (hostileStructure.q._localTask?.kind === 'structure-security') observedSecurity = true;
  if (
    hostileStructure.q.members.some(
      s =>
        s.target === enemyActor &&
        hostileStructure.r.SquadAI.hasLineOfSight(
          s,
          enemyActor,
          hostileStructure.b.heightAt,
          hostileStructure.b.obstacles
        )
    )
  )
    confirmedLOS = true;
});
assert.ok(confirmedLOS, 'real inside hostile is witnessed through native LOS');
assert.ok(ownShots > 0, 'Engagement reacts with actual shots, not a planner score');
assert.ok(observedSecurity, 'reported/seen interior contact reaches structure security task');
assert.equal(hostileStructure.q.routeIndex, 1, 'active hostile response cannot hand back the mission route');
console.log(
  'PASS autonomous structure movement/security and native hostile response',
  JSON.stringify({
    stages: [...stages],
    enteredAt: physicalEntry.enteredAt,
    surveyedAt: naturalSurvey.observedAt,
    watchedAt: naturalWatch.observedAt,
    handedBackAt,
    ownShots,
    confirmedLOS
  })
);

for (const spoil of [
  x => {
    x.q._macroMission.version++;
  },
  x => {
    x.q.route[1].z++;
  },
  x => {
    x.r.BattleNavigation.installScenario(x.scenario);
  },
  x => {
    x.r.SquadAI.leaderOf(x.q).isPlayer = true;
  },
  x => {
    x.r.SquadAI.leaderOf(x.q).dead = true;
  },
  x => {
    x.q.state = 'retreat';
  },
  x => {
    x.b.time += 1;
  },
  x => {
    x.systems['squad-command'].onBattleRestart(x.b);
  }
]) {
  const x = structureWorld(true, true, true, true, true, true, true, true);
  x.P.update(x.b, x.q);
  assert.ok(x.P.currentStructureOrders(x.b, x.q));
  spoil(x);
  assert.equal(
    x.P.currentStructureOrders(x.b, x.q),
    null,
    'stale/possessed/retreating structure orders are unreadable'
  );
}
const pressureOrders = structureWorld(true, true, true, true, true, true, true, true);
pressureOrders.P.update(pressureOrders.b, pressureOrders.q, { underFire: pressureOrders.q.members.length });
assert.equal(pressureOrders.P.currentStructureOrders(pressureOrders.b, pressureOrders.q), null);
const legacyOrders = structureWorld(true, true, true, true, true, true, true, false);
assert.equal(legacyOrders.P.structureOrdersOn, false);
assert.equal(legacyOrders.P.currentStructureOrders(legacyOrders.b, legacyOrders.q), null);
assert.equal(legacyOrders.P.update(legacyOrders.b, legacyOrders.q).inputs.structureExecution, undefined);

for (const role of ['leader', 'buddy']) {
  const rapid = continuityFixture();
  rapid[role].isPlayer = true;
  rapid.E.commitStance(rapid[role], rapid.b, 'stand', 0.45, 'player-possession');
  rapid[role].isPlayer = false;
  assert.ok(
    !rearmContinuity(rapid).presenceEvidence,
    'actual possession-entry epoch revokes presence even if release precedes the next AI tick'
  );
}

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
