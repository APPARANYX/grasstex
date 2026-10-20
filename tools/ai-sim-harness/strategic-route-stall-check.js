'use strict';
/* Synthetic contract only: per-tick event capture and observe-only behavior.
 * Real battle and probe/control equivalence remain the Actions benchmark gate.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('scripts/probes/strategic-route-stall.js', 'utf8');
const root = { location: { search: '' }, BattleProbes: {} };
vm.runInNewContext(source, { window: root, URLSearchParams, Map, Math, Number, String, Array, Object, isFinite });
const probe = root.BattleProbes['strategic-route-stall'];
assert.equal(probe.every, 0, 'must sample every fixed simulation tick');
const member = id => ({
  id, dead: false, root: { position: { x: 0, z: 0 } },
  destination: { x: 100, z: 0 }, _movementWaypoint: { x: 100, z: 0 },
  moveSpeed: 0, moving: false, _movementStopReason: 'test-stationary',
  _movementResolver: { last: { owner: 'macro', kind: 'move', point: { x: 100, z: 0 } } }
});
const sq = { id: 'ge-1', faction: 'ge', members: [member(1), member(2)],
  state: 'advance', commandPhase: 'approach', inContact: false,
  targetObjective: null, objective: { x: 100, z: 0 },
  route: [{ x: 100, z: 0 }, { x: 200, z: 0 }], routeIndex: 0,
  _macroMission: { version: 1, intent: 'capture', status: 'executing' } };
const sim = { time: 0, factions: { ge: { squads: [sq] }, us: { squads: [] } } };
probe.start(sim);
for (let k = 0; k < 180; k++) {
  sim.time = +((k + 1) * 0.15).toFixed(4);
  const prior = JSON.stringify(sq);
  probe.sample(sim);
  assert.equal(JSON.stringify(sq), prior, 'observer modified gameplay state');
}
const out = probe.report(sim);
assert.equal(out.schema, 'strategic-route-stall-v1');
assert.equal(out.sampledTicks, 180);
assert.equal(out.recorded, 1);
assert.equal(out.counts.ge, 1);
assert.equal(out.events[0].before.length, 120, 'missing bounded prehistory');
assert.ok(out.events[0].after.length >= 30 && out.events[0].after.length <= 40);
assert.equal(out.events[0].before[0].men.length, 2);
assert.equal(out.omitted, 0);
probe.start(sim);
assert.equal(probe.report(sim).recorded, 0, 'restart leaked old probe state');
console.log('strategic per-tick route-stall probe contract PASS');
