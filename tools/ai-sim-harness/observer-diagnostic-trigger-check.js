#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../battle/modules/97-ai-timeline-recorder.js'),
  'utf8'
);
const hooks = {};
let loopAlerts = [];
const root = {
  console: { log() {} },
  GTLog() {},
  BattleModules: {
    registerSystem(id, api) {
      hooks[id] = api;
    },
    unitsFor(sim) {
      return sim.units || [];
    }
  },
  BattleEngagement: {
    stateOf(soldier) {
      return soldier.eng || { state: 'advance' };
    }
  },
  BattleObjectiveSystem: {
    status() {
      return { owner: 'neutral', us: 0, ge: 0 };
    }
  },
  BattleLeases: {
    get() {
      return null;
    },
    holds() {
      return false;
    }
  },
  BattleAILoopWatch: {
    alerts() {
      return loopAlerts;
    }
  }
};
root.window = root;
vm.createContext(root);
vm.runInContext(source, root);

const timeline = root.BattleAITimeline;
const system = hooks['ai-timeline-recorder'];
assert.ok(timeline && system, 'timeline recorder registered');
assert.equal(typeof timeline.observeEvent, 'function', 'observer exposes an external diagnostic-event hook');

const squad = {
  id: 'US-1',
  faction: 'us',
  commandPhase: 'approach',
  state: 'advance',
  inContact: false,
  _macroMission: { status: 'executing' },
  members: []
};
const man = {
  id: 'u1',
  role: 'rifleman',
  faction: 'us',
  squad,
  dead: false,
  root: { position: { x: 0, z: 0 } },
  destination: { x: 20, z: 0 },
  moving: true,
  moveSpeed: 2,
  target: null,
  eng: { state: 'advance' },
  suppressedUntil: 0,
  _movementResolver: { last: { owner: 'formation', kind: 'formation', reason: 'advance' } }
};
squad.members = [man];
const ge = {
  id: 'GE-1',
  faction: 'ge',
  commandPhase: 'approach',
  state: 'advance',
  inContact: false,
  _macroMission: { status: 'executing' },
  members: []
};
const sim = {
  time: 0,
  seed: 'observer-diagnostic-trigger-check',
  scene: { metadata: {} },
  winner: null,
  units: [man],
  factions: {
    us: { alive: 1, kills: 0, squads: [squad] },
    ge: { alive: 0, kills: 0, squads: [ge] }
  },
  _objectives: []
};
const baseKeys = Object.keys(sim).sort();

system.onBattleStart(sim);
for (let t = 0; t <= 3; t += 0.5) {
  sim.time = t;
  system.onSimulationStep(sim);
}

loopAlerts = [
  {
    kind: 'posture-churn',
    severity: 'warn',
    faction: 'us',
    squadId: 'US-1',
    soldierId: 'u1',
    at: 3,
    key: 'posture-churn|us|US-1|u1',
    message: 'Repeated stance changes',
    stanceChanges: 6,
    travel: 1,
    net: 0.2,
    inContact: true
  }
];
sim.time = 3.5;
system.onSimulationStep(sim);

let snapshot = timeline.snapshot(sim);
const loopMarkers = snapshot.markers.filter(marker => marker.kind === 'loop-alert');
assert.equal(loopMarkers.length, 1, 'one loop alert becomes an exact timeline marker');
assert.equal(loopMarkers[0].diagnosticKind, 'posture-churn');
assert.equal(loopMarkers[0].soldier, 'u1');
assert.equal(snapshot.observer.windows.length, 1, 'loop alert opens a focus window');
assert.ok(
  snapshot.observer.windows[0].reasons.some(reason => reason.kind === 'loop-alert'),
  'loop alert is recorded as a focus reason'
);
assert.ok(snapshot.observer.windows[0].frames.length >= 6, 'focus window retains the pre-alert ring buffer');

/* A producer that refreshes the same semantic alert every sim tick must not flood the timeline.
   Use changing timestamps and no stable key to reproduce the real benchmark symptom from #344. */
loopAlerts = [
  {
    kind: 'posture-churn',
    severity: 'warn',
    faction: 'us',
    squadId: 'US-1',
    soldierId: 'u1',
    at: 3.6,
    message: 'Repeated stance changes',
    stanceChanges: 6,
    travel: 1,
    net: 0.2,
    inContact: true
  }
];
sim.time = 3.6;
system.onSimulationStep(sim);
loopAlerts[0].at = 3.75;
sim.time = 3.75;
system.onSimulationStep(sim);
snapshot = timeline.snapshot(sim);
assert.equal(
  snapshot.markers.filter(marker => marker.kind === 'loop-alert').length,
  1,
  'same semantic loop alert inside one diagnostic episode is collapsed'
);

loopAlerts = [
  {
    kind: 'posture-churn',
    severity: 'warn',
    faction: 'us',
    squadId: 'US-1',
    soldierId: 'u1',
    at: 20,
    key: 'posture-churn|us|US-1|u1',
    message: 'Repeated stance changes again',
    stanceChanges: 5,
    travel: 1.2,
    net: 0.3,
    inContact: true
  }
];
sim.time = 20;
system.onSimulationStep(sim);
snapshot = timeline.snapshot(sim);
assert.equal(
  snapshot.markers.filter(marker => marker.kind === 'loop-alert').length,
  2,
  'the same semantic loop can reappear after the diagnostic episode window'
);

timeline.observeEvent(sim, 'vacant-objective-stall', {
  t: 4,
  side: 'us',
  squad: 'US-1',
  objective: 'obj-2',
  distance: 84.2,
  phase: 'assault'
});
snapshot = timeline.snapshot(sim);
assert.equal(
  snapshot.markers.filter(marker => marker.kind === 'vacant-objective-stall').length,
  1,
  'external benchmark stall becomes an exact timeline marker'
);
assert.equal(
  snapshot.observer.windows.length,
  1,
  'same-squad external trouble extends the active focus window'
);
assert.ok(
  snapshot.observer.windows[0].reasons.some(reason => reason.kind === 'vacant-objective-stall'),
  'external benchmark stall joins the focus reasons'
);
assert.deepEqual(Object.keys(sim).sort(), baseKeys, 'diagnostic triggers write no gameplay state');

console.log('PASS observer focuses exact loop-watch and external benchmark stall diagnostics');
