#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const { loadModule } = require('./module-loader');
let published = null;
const start = scene => scene.sim;
const root = { GTLog() {}, BattleSim: { start } };
Object.defineProperty(root, '__battle__', { get: () => published });
function sim(time, seed) {
  return {
    time,
    timeLimit: 600,
    timeScale: 1,
    scene: { metadata: { battleScenario: { seed } } },
    factions: { us: { alive: 1, squads: [] }, ge: { alive: 1, squads: [] } },
    _roster: { us: [], ge: [] },
    _objectives: []
  };
}
loadModule(root, 'battle/modules/99-session-diagnostics-export.js');
const D = root.BattleDiagnosticsExport;
const live = sim(10, 'live');
const unused = sim(20, 'unused');
root.BattleSim.start({ sim: live });
published = live;
assert.equal(D.current(), live);
root.BattleSim.start({ sim: unused });
assert.equal(
  D.current(),
  live,
  'starting an unpublished simulation must not replace the published diagnostics session'
);
const readers = [
  () => D.build(),
  () => D.compact(),
  ...['full', 'loops', 'orders'].map(kind => () => D.snapshot(kind))
];
const state = JSON.stringify(live);
for (const read of readers) assert.equal(read().battle.time, live.time);
assert.equal(JSON.stringify(live), state, 'diagnostic session selection must not mutate the live simulation');
for (const value of [
  D.build(unused),
  D.compact(unused),
  ...['full', 'loops', 'orders'].map(kind => D.snapshot(kind, unused))
]) {
  assert.equal(value.battle.time, unused.time, 'explicit simulation arguments retain priority');
}
assert.equal(D.current(), live, 'explicit exports must not publish another active simulation');
const replacement = sim(30, 'replacement');
published = replacement;
for (const read of readers) assert.equal(read().battle.time, replacement.time);
assert.equal(D.current(), replacement);
assert.equal(root.BattleSim.start, start, 'read-only diagnostics must not wrap simulation startup');
published = null;
assert.equal(D.current(), null);
for (const read of readers) assert.throws(read, /No active battle simulation/);
assert.equal(D.build(live).battle.time, 10, 'explicit offline exports need no published session');
assert.equal(root.__battle__, null, 'exporter must never write the application-owned session');
const late = { GTLog() {}, __battle__: live };
loadModule(late, 'battle/modules/99-session-diagnostics-export.js');
assert.equal(
  late.BattleDiagnosticsExport.current(),
  live,
  'late diagnostics loading reads the existing publisher'
);
assert.equal(late.BattleDiagnosticsExport.build().battle.time, 10);
console.log(
  'PASS diagnostics session ownership: unpublished starts, all export forms, explicit arguments, replacement, clearing and no startup wrapper'
);
