#!/usr/bin/env node
'use strict';
/* Native wall-broadphase parity: compare the shipping module with the same
   exact geometry/collision routines running the original full wall scan.
   The second instance disables only the static index, not the safety rules. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const filename = path.resolve(__dirname, '../../battle/battle-navigation.js');
const original = fs.readFileSync(filename, 'utf8');
assert.ok(original.includes('    rebuildWallIndex();'), 'scenario rebuild includes the spatial index');
assert.ok(
  original.includes('var w = walls[candidates ? candidates[i] : i];'),
  'wall scan preserves native wall order'
);
function navigation(fullScan) {
  let src = original.replace(
    'var w = walls[candidates ? candidates[i] : i];',
    'var w = walls[candidates ? candidates[i] : i];\n      root._wallVisits++;'
  );
  if (fullScan) src = src.replace('    rebuildWallIndex();', '    wallIndex = null;');
  const root = {
    _wallVisits: 0,
    GTLog() {},
    GTMath: {
      clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
      }
    }
  };
  new Function('window', 'globalThis', 'location', src)(root, root, { search: '' });
  return { root, nav: root.BattleNavigation };
}
const fast = navigation(false);
const slow = navigation(true);
let seed = 115271;
function rand() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
function scene(offset) {
  const buildings = [];
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++) {
      const id = 'test-' + row + '-' + col;
      buildings.push({
        id,
        x: (col - 1.5) * 115 + offset,
        z: (row - 1.5) * 115 - offset,
        w: 12 + (col % 2) * 4,
        d: 14 + (row % 2) * 3,
        rot: ((row + col) % 4) * 0.23,
        openings: [
          { id: id + '-door', side: 'north', offset: 0, width: 1.8, type: 'door' },
          { id: id + '-window', side: 'east', offset: 1, width: 1.1, type: 'window', bottom: 0.7, top: 1.9 }
        ]
      });
    }
  return { buildings, profile: 'default', objectives: [], roads: [] };
}
function compare(a, b) {
  assert.equal(
    fast.nav.movementClear(a, b),
    slow.nav.movementClear(a, b),
    'movement AABB/index query cannot skip a native building wall'
  );
  assert.equal(
    !!fast.nav.lineOfSightBlocked(a, b, 1.5, 1.5),
    !!slow.nav.lineOfSightBlocked(a, b, 1.5, 1.5),
    'LOS still respects native window/door aperture rules'
  );
  assert.deepEqual(
    fast.nav.resolveStep(a, b),
    slow.nav.resolveStep(a, b),
    'same first blocking wall and slide'
  );
}
for (const offset of [0, 57, -85]) {
  const scenario = scene(offset);
  fast.nav.installScenario(scenario);
  slow.nav.installScenario(scenario);
  assert.equal(fast.nav.walls.length, slow.nav.walls.length);
  for (let i = 0; i < 2800; i++) {
    const a = { x: (rand() - 0.5) * 680, z: (rand() - 0.5) * 680 };
    const length = i % 10 === 0 ? 1000 : i % 7 === 0 ? 50 : 0.1 + rand() * 12;
    const angle = rand() * 2 * Math.PI;
    const b = { x: a.x + Math.cos(angle) * length, z: a.z + Math.sin(angle) * length };
    compare(a, b);
  }
  // Near boundaries, the native start-skin, door opening and crossing order matter.
  for (const building of scenario.buildings) {
    const a = { x: building.x - 15, z: building.z };
    const b = { x: building.x + 15, z: building.z };
    compare(a, b);
    compare(b, a);
    compare(a, a);
  }
}
// Replacing a populated scenario must invalidate the old grid completely.
fast.nav.installScenario({ buildings: [], profile: 'default' });
slow.nav.installScenario({ buildings: [], profile: 'default' });
for (let i = 0; i < 100; i++) compare({ x: i - 50, z: i }, { x: -i, z: -i });
assert.ok(
  fast.root._wallVisits < slow.root._wallVisits * 0.45,
  'index must materially reduce visited walls on short, realistic movement queries: indexed=' +
    fast.root._wallVisits +
    ' full=' +
    slow.root._wallVisits
);
console.log(
  'PASS indexed wall scan matches unindexed native movement, LOS and wall slides across 8,000+ pairs and scenario resets; wall visits ' +
    fast.root._wallVisits +
    '/' +
    slow.root._wallVisits
);
