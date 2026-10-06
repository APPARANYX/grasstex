#!/usr/bin/env node
'use strict';
/* Commander strategic-recovery factory ctx + firing (battle/commander-ai.js split 2/2).
   The strategic-recovery machine (stall detection, effort pickers, the reconcile/release/
   main-effort/reset stage machine and the mission issuing it drives) moved verbatim to
   modules/22a-commander-strategic-recovery.js. Same reversed wiring as the other splits:
   commander-ai.js publishes _commanderRecoveryCtx (its closure utilities, the doctrine handle,
   the mission-lifecycle functions the recovery re-tasks through and the COMMAND_TICK /
   STRATEGIC_STALL_* constants, which stay there - the export reads them) and the
   _commanderRecoveryAttach sink, and the module calls its own factory at load time and
   installs runStrategicRecovery, reconsiderMission and wakeReason back. This file pins:

     - install: the module global exists, the factory takes exactly one ctx, every name the
       moved bodies consume reaches it defined (the doctrine handle, telemetry, the stall
       clocks and the seven lifecycle functions);
     - seam: the export still reads the parent-side clocks (same objects the ctx hands over),
       and a bad api is rejected by the attach sink without disturbing the installed one;
     - firing: a full commander tick on a stalled front runs the machine through the seam
       (update reaches the recovery stage machine and records its telemetry, no missing-module
       throw), and an uninstalled chain fails loudly on the same tick;
     - loud failure both ways: the module without commander-ai.js throws at load. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, { log() {}, warn() {} });
}
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
const CTX_KEYS = [
  'COMMAND_TICK', 'D', 'STRATEGIC_STALL_RECOVERY', 'STRATEGIC_STALL_REPLAN',
  'STRATEGIC_STALL_STAGES', 'catalogKey', 'defenseRequest', 'finishMission', 'generalFor',
  'issueMission', 'missionState', 'recordMacroWake', 'reserveDue', 'root', 'telemetry'
];
/* A commander world with Macro on, one US assault squad that never takes its objective: the
   only thing that can move is the stall machine (stall-clock-check's fixture family). */
function world(events) {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: '?morale=0&coa=0&fireControl=0' });
  r.BattleModules = { registerSystem() {}, unitsFor: b => (b._roster.us || []).concat(b._roster.ge || []) };
  r.BattleSim = { start() {} };
  r.BattleTelemetry = { record(type, data) { events.push({ type, data }); } };
  load(r, 'battle/commander-doctrine.js');
  load(r, 'battle/commander-routes.js');
  load(r, 'battle/commander-ai.js');
  load(r, 'battle/modules/22-commander-reconstitution.js');
  load(r, 'battle/modules/22a-commander-strategic-recovery.js');
  const b = H.makeBattle(r);
  b.macroCommandEnabled = true;
  b.objectiveControl = { objectives: {} };
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  Object.assign(q, { commandRole: 'center', targetObjective: 'a', commandPhase: 'assault', aliveCount: 10 });
  return { r, b, q, C: r.BattleCommanderAI };
}

test('the module installs the verbatim set back into commander-ai.js through the ctx sink', () => {
  const events = [],
    w = world(events),
    r = w.r;
  assert.equal(typeof r._commanderStrategicRecovery, 'function', 'module factory global');
  assert.equal(r._commanderStrategicRecovery.length, 1, 'factory takes exactly the ctx');
  const ctx = r._commanderRecoveryCtx();
  assert.deepEqual(Object.keys(ctx).sort(), CTX_KEYS, 'ctx carries exactly the utilities, lifecycle functions and clocks the moved bodies consume');
  Object.keys(ctx).forEach(k => assert.notEqual(ctx[k], undefined, 'ctx.' + k + ' defined at install time'));
  const api = r._commanderStrategicRecovery(ctx);
  assert.equal(typeof api.runStrategicRecovery, 'function', 'factory returns runStrategicRecovery');
  assert.equal(api.runStrategicRecovery.length, 4, 'runStrategicRecovery(sim, faction, squads, town)');
  assert.equal(api.reconsiderMission.length, 6, 'reconsiderMission(sim, sq, town, reason, stalled, forcedObjective)');
  assert.equal(api.wakeReason.length, 2, 'wakeReason(sim, sq)');
});
test('the seam keeps the clocks and the export reads the parent constants', () => {
  const events = [],
    w = world(events),
    { C, r } = w;
  assert.equal(C.strategicStallRecovery, r._commanderRecoveryCtx().STRATEGIC_STALL_RECOVERY, 'the export reads the parent-side recovery clocks');
  assert.equal(C.strategicStallReplan, r._commanderRecoveryCtx().STRATEGIC_STALL_REPLAN, 'the export reads the parent-side replan clock');
  assert.equal(C.commandTick, r._commanderRecoveryCtx().COMMAND_TICK, 'the export reads the parent command tick');
  assert.equal(r._commanderRecoveryAttach({}), false, 'the attach sink rejects an api without runStrategicRecovery/reconsiderMission');
  assert.equal(C.isMacroEnabled(w.b), true, 'the rejected attach did not disturb the installed api');
});

/* The full Macro stack (as fled-man-check builds it): the commander tick needs the
   squad-command owner and the squad modules, so the firing test loads the same set. */
function macroWorld(events, withRecovery) {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: '?morale=0&coa=0&fireControl=0' }),
    systems = {};
  r.BattleModules = {
    registerSystem(id, h) { systems[id] = h; },
    getSystem(id) { return systems[id]; },
    runHook() {},
    registerUnitType() {},
    registerObjectiveType() {},
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  r.BattleSim = { start() {} };
  r.BattleTelemetry = { record(type, data) { events.push({ type, data }); } };
  load(r, 'battle/modules/08-soldier-events.js');
  load(r, 'battle/modules/17-soldier-mind.js');
  load(r, 'battle/commander-doctrine.js');
  load(r, 'battle/commander-routes.js');
  load(r, 'battle/commander-ai.js');
  load(r, 'battle/modules/22-commander-reconstitution.js');
  if (withRecovery !== false) load(r, 'battle/modules/22a-commander-strategic-recovery.js');
  load(r, 'battle/movement-resolver.js');
  for (const m of ['15a-squad-leader-fire-control', '15b-squad-leader-buddy-pairs', '15c-squad-leader-scouts-forward', '15d-squad-leader-leaderless-intent', '15e-squad-leader-morale-coa', '15f-squad-leader-retreat-anchor', '15g-squad-leader-formation', '15h-squad-leader-fireteams', '15i-squad-leader-clear-contact', '15j-squad-leader-fire-and-movement', '15k-squad-leader-reconstitution', '15l-squad-leader-mission-execution', '15m-squad-leader-cohesion-regroup', '16-squad-plan-stability', '46-ammunition-stoppages'])
    load(r, 'battle/modules/' + m + '.js');
  const b = H.makeBattle(r);
  b.macroCommandEnabled = true;
  b.scene = { metadata: {} };
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: -500, objective: { x: 0, z: 0 } });
  q.route = [];
  q.commandRole = 'center';
  q.members.forEach(s => {
    s.root.position.z += 150;
    s.destination = { x: s.root.position.x, z: s.root.position.z };
  });
  return { r, b, q, C: r.BattleCommanderAI, leader: systems['squad-command'], ammo: systems['ammunition-stoppages'] };
}

test('firing: a stalled commander tick runs the recovery machine through the seam', () => {
  const events = [],
    w = macroWorld(events),
    { b, q, C, ammo } = w;
  if (ammo) ammo.onBattleStart(b);
  C.update(b, null, C.commandTick); // a quiet first tick: assignments, nothing stalled yet
  const quiet = events.length;
  assert.ok(quiet > 0, 'the commander tick runs and records through the seam');
  b.time += C.strategicStallReplan + 1; // well past the replan clock on a front that never moved
  if (ammo) ammo.onSimulationStep(b, { dt: H.AI_TICK });
  C.update(b, null, C.commandTick);
  assert.ok(events.length > quiet, 'the stalled tick still runs through the seam (no missing-module throw)');
  assert.ok(
    events.some(e => /stall|recovery|replan|decision|mission/.test(e.type)),
    'the strategic machine recorded its decision telemetry: ' + JSON.stringify(events.map(e => e.type).slice(quiet))
  );
});

test('commander-ai.js without the module fails loudly on the commander tick', () => {
  const events = [],
    w = macroWorld(events, false),
    { b, C, ammo } = w;
  if (ammo) ammo.onBattleStart(b);
  b.time += C.strategicStallReplan + 1;
  if (ammo) ammo.onSimulationStep(b, { dt: H.AI_TICK });
  assert.throws(() => C.update(b, null, C.commandTick), /strategic recovery missing/, 'no silent never-recovering front: the tick reaches the recovery machine and says so');
});

test('the module without commander-ai.js fails loudly at load', () => {
  const r = {};
  r.window = r;
  assert.throws(() => load(r, 'battle/modules/22a-commander-strategic-recovery.js'), /commander-ai\.js must load before/, 'the reversed install needs its parent first');
});

console.log('PASS ' + n + ' strategic-recovery ctx checks');

