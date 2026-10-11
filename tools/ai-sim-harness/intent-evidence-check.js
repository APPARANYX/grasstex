'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const r = H.bootstrap({ modules: false }),
  events = [];
r.BattleSim = { start() {} };
r.BattleModules = {
  registerSystem() {},
  listSystems() {
    return [];
  },
  unitsFor(b) {
    return Object.values(b.factions).flatMap(f => f.squads.flatMap(q => q.members));
  }
};
r.BattleTelemetry = {
  record(type, data) {
    events.push({ type, data });
  }
};
for (const f of ['commander-doctrine', 'commander-routes', 'commander-ai'])
  loadModule(r, 'battle/' + f + '.js', { console: quietConsole });
for (const f of ['54-tactical-situation', '99-session-diagnostics-export'])
  loadModule(r, 'battle/modules/' + f + '.js', { console: quietConsole });
const issue = r._commanderRecoveryCtx().issueMission;
const b = H.makeBattle(r, { seed: 12345 });
const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
const ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 80, objective: { x: 0, z: 0 } });
const spec = {
  intent: 'capture',
  action: 'assault',
  objectiveId: 'a',
  point: { x: 0, z: 100 },
  route: [],
  role: 'assault'
};
b.time = 10;
q.contact = { x: 4, z: 40, at: 9, seenBy: q.members[0].id };
r.SquadAI.squadContact = () => {
  throw Error('issue metadata must not invoke a mutating report reader');
};
const first = issue(b, q, spec, 'initial-mission');
assert.equal(first.confidence, 0);
assert.equal(first.observations.unknownConfidenceReports, 1);
assert.equal(first.observations.faction, 'us');
assert.equal(first.observations.at, 10);
assert.equal(first.observations.contacts[0].age, 1);
assert.equal(b._tacticalSituation, undefined, 'issue metadata does not enable collection');
const frozen = JSON.stringify(first.observations);
events.at(-1).data.observations.contacts[0].x = 999;
assert.equal(JSON.stringify(first.observations), frozen, 'telemetry cannot edit the issued evidence');
ge.contact = { x: 999, z: 999, at: 10 };
ge.members[0].root.position.x = 500;
b.time = 11;
q.contact.x = 77;
assert.strictEqual(issue(b, q, spec, 'strategic-stall'), first, 'evidence change does not reissue a brief');
assert.equal(JSON.stringify(first.observations), frozen, 'unchanged brief retains issue-time evidence');
assert.equal(first.reason, 'initial-mission');
r.SquadAI.squadContactsMap = sq =>
  sq === q
    ? [{ x: 8, z: 8, at: 10, source: 'seen', confidence: 0.8, sourceSoldier: q.members[0].id, targetId: 10 }]
    : [];
const next = issue(b, q, { ...spec, point: { x: 20, z: 100 } }, 'objective-control-changed');
assert.equal(next.version, 2);
assert.equal(next.confidence, 0.8);
assert.equal(next.observations.quantifiedReports, 1);
assert.equal(next.observations.contacts[0].provenance, 'member-belief');
assert.equal(first.status, 'superseded');
assert.equal(JSON.stringify(first.observations), frozen, 'terminal evidence never rewrites');
const compact = r.BattleDiagnosticsExport.compact(b);
assert.deepEqual(compact.squads.find(s => s.id === q.id).mission.observations, next.observations);
compact.squads[0].mission.observations.contacts[0].x = 1000;
assert.equal(next.observations.contacts[0].x, 8);
const full = r.BattleDiagnosticsExport.snapshot('full', b);
assert.deepEqual(full.factions.us.squads[0].mission.observations, next.observations);
r.SquadAI.squadContactsMap = () => [];
delete q._macroMission;
delete q._lastMacroMission;
delete q.contact;
b.time = 0;
const reset = issue(b, q, spec, 'initial-mission');
assert.equal(reset.version, 1);
assert.equal(reset.observations.reportedContacts, 0);
assert.equal(reset.observations.at, 0);
assert.equal(reset.confidence, 0);
delete r.BattleTacticalSituation;
const unavailable = issue(b, q, { ...spec, point: { x: 12, z: 12 } }, 'strategic-stall');
assert.equal(unavailable.observations.available, false);
assert.equal(unavailable.observations.reportedContacts, null);
assert.equal(unavailable.confidence, 0, 'no enemy-truth fallback if observer API is absent');
console.log(
  'PASS General issue-time evidence, unknown confidence, version coalescing, faction isolation and detached diagnostics'
);
