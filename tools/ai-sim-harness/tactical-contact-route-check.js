'use strict';
const assert = require('node:assert/strict');
const { loadModule, quietConsole } = require('./module-loader');

function fixture(cover) {
  const root = {
    BattleNavigation: { movementClear: () => true },
    BattleEngagement: { underFireNow: () => false },
    SquadAI: { hasLineOfSight: () => false },
    BattleCoverPositions: {
      candidates: (_s, _sim, _threat, radius) =>
        cover.filter(
          p => Math.hypot(p.x - root.soldier.root.position.x, p.z - root.soldier.root.position.z) <= radius
        ),
      routeCandidates: () => cover
    }
  };
  loadModule(root, 'battle/modules/13g-tactical-contact-route.js', { console: quietConsole });
  root.soldier = {
    id: 'rifle-1',
    suppressedUntil: 0,
    root: { position: { x: 0, y: 0, z: 0 } }
  };
  const sim = { time: 5, obstacles: [], heightAt: () => 0 };
  const report = [{ x: 0, z: 100, at: 5, confidence: 1 }];
  return { root, soldier: root.soldier, sim, report, skill: root.BattleTacticalContactRoute };
}

const positions = [
  { x: -12, z: -8, quality: 0.1, slotId: 'B-backwards' },
  { x: 0, z: 12, quality: 0.01, slotId: 'dead-end-direct' },
  { x: -28, z: 4, quality: 0.1, slotId: 'C-around-edge' },
  { x: -32, z: 23, quality: 0.1, slotId: 'D-flank' },
  { x: -32, z: 44, quality: 0.1, slotId: 'E-flank' },
  { x: -20, z: 61, quality: 0.1, slotId: 'F-return' },
  { x: -4, z: 73, quality: 0.1, slotId: 'G-near-goal' }
];
const w = fixture(positions);
w.root.BattleNavigation.movementClear = (from, to) => {
  // An authoritative physical hedgerow blocks crossing near the middle.
  const crossed = (from.z < 20 && to.z >= 20) || (to.z < 20 && from.z >= 20);
  return !(crossed && Math.min(from.x, to.x) > -25);
};
const baseline = JSON.stringify({ soldier: w.soldier, obstacles: w.sim.obstacles });
const first = w.skill.pick(w.soldier, w.sim, w.report, { x: 0, z: 80 }, []);
assert.deepEqual(
  first.point,
  { x: -12, z: -8 },
  'whole-route solver must allow a backwards first step to get around the hedgerow'
);
assert.ok(first.waypoints.length >= 5, 'plan retains full connected cover chain');
assert.deepEqual(
  first.waypoints.map(p => p.slotId),
  ['B-backwards', 'C-around-edge', 'D-flank', 'E-flank', 'F-return', 'G-near-goal']
);
for (let i = 1; i < first.waypoints.length; i++)
  assert.ok(
    Math.hypot(
      first.waypoints[i].x - first.waypoints[i - 1].x,
      first.waypoints[i].z - first.waypoints[i - 1].z
    ) <= 26,
    'every hop within real bound range'
  );
assert.equal(
  JSON.stringify({ soldier: w.soldier, obstacles: w.sim.obstacles }),
  baseline,
  'planning cannot move soldier, change objects or issue orders'
);
w.soldier.root.position.x = -12;
w.soldier.root.position.z = -8;
const next = w.skill.pick(w.soldier, w.sim, w.report, { x: 0, z: 80 }, [], {
  waypoints: first.waypoints,
  cursor: 1
});
assert.equal(next.reused, true, 'next physical arrival keeps the original approved chain');
assert.deepEqual(next.point, { x: -28, z: 4 }, 'checkpoint selects next cover, not the objective');
w.root.SquadAI.hasLineOfSight = () => true;
assert.equal(
  w.skill.pick(w.soldier, w.sim, w.report, { x: 0, z: 80 }, []).point,
  null,
  'no uncovered active bound when all starting segments are exposed'
);
/* From a sheltered B the direct segment to C runs through the same
   shelter. A genuine navigator must supply a B1 exit and safe C ingress;
   a straight-line-only tactical graph would reject this reachable slot. */
const egressCover = [
  { x: 8, z: 12, quality: 0.1, slotId: 'C-behind-hedge' },
  { x: 8, z: 30, quality: 0.1, slotId: 'D-next-cover' }
];
const egress = fixture(egressCover);
egress.soldier.root.position.x = 0;
egress.soldier.root.position.z = 12;
let nativeQueries = 0;
egress.root.BattleNavigation.movementClear = (a, b) => {
  // Real blocking cover between the sheltered B and the forward C.
  return !(Math.abs(a.z - 12) < 0.01 && b.x >= 7 && b.z <= 15 && a.x < 1);
};
egress.root.BattleNavigation.findPath = (a, b) => {
  nativeQueries++;
  return [{ x: 0, z: 15.5 }, { x: b.x, z: b.z }];
};
const ingress = egress.skill.evaluate(
  egress.soldier, egress.sim, egressCover[0], egress.report, false
);
assert.equal(ingress.eligible, true, 'B→B1→C should use valid native physical ingress/egress');
assert.equal(ingress.detour, true);
assert.ok(nativeQueries >= 1);
const plannedEgress = egress.skill.pick(egress.soldier, egress.sim, egress.report, { x: 8, z: 35 }, []);
assert.equal(plannedEgress.point?.x, 8, 'graph can choose C through native egress path');
egress.root.BattleNavigation.findPath = () => [{ x: 999, z: 999 }, { x: 8, z: 12 }];
assert.equal(
  egress.skill.evaluate(egress.soldier, egress.sim, egressCover[0], egress.report, false).eligible,
  false,
  'navigation cannot invent a detour that fails physical segment checks'
);
const open = fixture([]);
assert.equal(
  open.skill.pick(open.soldier, open.sim, open.report, { x: 0, z: 80 }, []).point,
  null,
  'empty field cannot invent physical shelter or manufacture a bound'
);
console.log(
  'TACTICAL_CONTACT_ROUTE_CHECK passed',
  JSON.stringify({
    initial: first.point,
    legs: first.waypoints.map(p => p.slotId),
    checkpoint: next.point,
    graph: first.stats,
    emptyCover: true
  })
);
