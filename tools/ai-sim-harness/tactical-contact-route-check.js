'use strict';
const assert = require('node:assert/strict');
const { loadModule, quietConsole } = require('./module-loader');

function makeWorld() {
  const root = {
    BattleNavigation: { movementClear: () => true },
    BattleEngagement: { underFireNow: () => false },
    SquadAI: { hasLineOfSight: () => false },
    BattleCoverPositions: { candidates: () => [] }
  };
  loadModule(root, 'battle/modules/13g-tactical-contact-route.js', { console: quietConsole });
  const soldier = { id: 'rifle-1', suppressedUntil: 0, root: { position: { x: 0, y: 0, z: 0 } } };
  const sim = { time: 5, obstacles: [], heightAt: () => 0 };
  const report = [{ x: 0, z: 80, at: 5, confidence: 1 }];
  return { root, soldier, sim, report };
}

const a = makeWorld();
const skill = a.root.BattleTacticalContactRoute;
assert.ok(skill && typeof skill.pick === 'function', 'contact-route skill must be an isolated module');
let positions = [
  { x: 0, z: 12, quality: 0.75, slotId: 'front' },
  { x: 8, z: 9, quality: 0.1, slotId: 'flank' },
  { x: 0, z: 35, quality: 0.02, slotId: 'too-far' }
];
a.root.BattleCoverPositions.candidates = () => positions;
const before = JSON.stringify({ soldier: a.soldier, obstacles: a.sim.obstacles });
const result = skill.pick(a.soldier, a.sim, a.report, { x: 0, z: 50 }, []);
assert.deepEqual(
  result.point,
  { x: 8, z: 9 },
  'score must prefer safer lateral cover over the shortest direct route'
);
assert.equal(result.stats.total, 3);
assert.equal(result.stats.safe, 2);
assert.equal(
  JSON.stringify({ soldier: a.soldier, obstacles: a.sim.obstacles }),
  before,
  'route planner must not write positions, reservations, stances or orders'
);
a.root.BattleNavigation.movementClear = (from, to) => to.x !== 8;
assert.deepEqual(
  skill.pick(a.soldier, a.sim, a.report, { x: 0, z: 50 }, []).point,
  { x: 0, z: 12 },
  'physical obstruction must reject safer-looking but illegal route'
);
a.root.BattleNavigation.movementClear = () => true;
a.root.SquadAI.hasLineOfSight = () => true;
const highExposure = skill.pick(a.soldier, a.sim, a.report, { x: 0, z: 50 }, []);
assert.equal(highExposure.point, null, 'continuous exposed movement must not be blindly authorized');
assert.equal(highExposure.stats.rejected['excessive-observed-exposure'], 2);
a.root.SquadAI.hasLineOfSight = (_viewer, target) => target.root.position.z > 999;
const retry = skill.pick(a.soldier, a.sim, a.report, { x: 0, z: 50 }, []);
assert.ok(retry.point, 'live threat perception reopens the route opportunity');
console.log(
  'TACTICAL_CONTACT_ROUTE_CHECK passed',
  JSON.stringify({
    first: result.point,
    alternate: retry.point,
    blocked: highExposure.stats.rejected,
    tunables: skill.tuning
  })
);
