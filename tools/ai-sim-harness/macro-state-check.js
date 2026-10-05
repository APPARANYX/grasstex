/* Macro owns brief lifecycle writes, including the Squad Leader's acceptance request. */
'use strict';
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
function load(r, file) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, file), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
const r = H.bootstrap({ modules: false }),
  events = [];
r.BattleSim = { start() {} };
r.BattleTelemetry = {
  record(type, data) {
    events.push({ type, data });
  }
};
for (const f of ['commander-doctrine', 'commander-routes', 'commander-ai']) load(r, 'battle/' + f + '.js');
load(r, 'battle/modules/22-commander-reconstitution.js');
const C = r.BattleCommanderAI;
assert(
  C.missionStates && C.transitionMission && C.acceptMission,
  'Macro declares and owns the brief lifecycle'
);
const b = H.makeBattle(r, { seed: +(process.env.HARNESS_SEED || 12345) });
const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
for (const def of Object.values(C.missionStates)) {
  for (const k of ['meaning', 'enteredBy', 'exits', 'rate', 'next']) assert(def[k], k);
  for (const next of def.next) assert(C.missionStates[next]);
}
q._macroMission = {
  version: 1,
  intent: 'capture',
  action: 'assault',
  objectiveId: 'a',
  reason: 'initial-mission'
};
const m = q._macroMission;
b.time = 3;
C.transitionMission(b, q, 'issued', m.reason);
assert.equal(m.status, 'issued');
assert.equal(m.issuedAt, 3);
assert.equal(m.acceptedAt, null);
b.time = 4;
C.acceptMission(b, q, false);
assert.equal(m.status, 'executing');
assert.equal(m.acceptedAt, 4);
assert.equal(m.reason, 'initial-mission');
assert.deepEqual(events.at(-1), {
  type: 'decision-mission-accepted',
  data: { faction: 'us', squad: 'us-0', version: 1, intent: 'capture', action: 'assault', objectiveId: 'a' }
});
b.time = 5;
C.acceptMission(b, q, false);
assert.equal(m.acceptedAt, 4, 'ordinary acceptance cannot restart');
b.time = 6;
C.acceptMission(b, q, true);
assert.equal(m.acceptedAt, 6, 'assembly acceptance refreshes executing briefs');
assert.equal(events.at(-1).data.objectiveId, null, 'assembly event preserves its old shape');
assert.equal(m.transition.reason, 'assembly accepted');
for (const terminal of ['completed', 'invalid', 'failed', 'superseded']) {
  m.status = 'executing';
  b.time++;
  C.transitionMission(b, q, terminal, 'finished');
  assert.equal(m.status, terminal);
  assert.equal(m.endedAt, b.time);
  assert.equal(m.endReason, 'finished');
  assert.equal(q._lastMacroMission, m);
  const snapshot = JSON.stringify(m),
    n = events.length;
  b.time++;
  C.transitionMission(b, q, 'failed', 'again');
  C.acceptMission(b, q, true);
  assert.equal(JSON.stringify(m), snapshot);
  assert.equal(events.length, n, 'terminal records are immutable');
}
m.status = 'executing';
assert.throws(() => C.transitionMission(b, q, 'issued', 'invalid'), /transition/);
assert.throws(() => C.transitionMission(b, q, 'unknown', 'invalid'), /state/);
console.log('PASS Macro declared lifecycle, acceptance clocks/events and terminal immutability');
