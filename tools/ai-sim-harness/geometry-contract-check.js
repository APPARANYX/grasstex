#!/usr/bin/env node
'use strict';
/* A3 of the 2026-10-20 architecture audit: the composed physicality/OBB geometry contract. Loads the
   real obstacle-field, base navigation and the physicality layer (module 39) that replaces
   N.movementClear/findPath at load time, then pins what they promise together: moving and static
   OBBs, move versus sight query modes, the truck self-ignore, and replay determinism. */
const assert = require('node:assert/strict'),
  H = require('./harness'),
  { loadModule, quietConsole } = require('./module-loader');
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function world(opts) {
  opts = opts || {};
  const r = H.bootstrap({ modules: false });
  loadModule(r, 'battle/modules/14-z-ballistic-raycast.js', { console: quietConsole });
  r.BattleModules = { registerSystem() {}, unitsFor: () => [] };
  loadModule(r, 'battle/battle-navigation.js', { console: quietConsole });
  loadModule(r, 'battle/modules/39-navigation-physicality-debug.js', { console: quietConsole });
  assert.ok(r.BattleNavigationPhysicality, 'physicality layer installed');
  const obstacles = [];
  obstacles.__physicalFootprints = opts.statics || [];
  obstacles.__physicalVersion = 1;
  obstacles.__dynamicFootprints = [];
  const sim = H.makeBattle(r, { obstacles });
  r.__battle__ = sim;
  return { r, N: r.BattleNavigation, F: r.BattleObstacleField, sim, obstacles };
}
function wall(id, x, z, hx, hz, angle) {
  const c = Math.cos(angle || 0),
    s = Math.sin(angle || 0);
  return { id, type: 'wall', shape: 'obb', x, z, hx, hz, ux: c, uz: s, vx: -s, vz: c, y: 0, height: 2 };
}
/* Same shape the transport fleet publishes: position and heading are live getters over a vehicle. */
function truckFootprint(v) {
  const fp = { id: v.id, type: 'truck', shape: 'obb', hx: 1.25, hz: 3.1, height: 2.8 };
  Object.defineProperties(fp, {
    x: { enumerable: true, get: () => v.position.x },
    z: { enumerable: true, get: () => v.position.z },
    y: { enumerable: true, get: () => 0 },
    ux: { enumerable: true, get: () => v.heading.z },
    uz: { enumerable: true, get: () => -v.heading.x },
    vx: { enumerable: true, get: () => v.heading.x },
    vz: { enumerable: true, get: () => v.heading.z }
  });
  return fp;
}
const P = (x, z) => ({ x, z });

test('static OBB blocks a crossing step and honours the 0.45 m body margin', () => {
  const { N } = world({ statics: [wall('w', 0, 0, 5, 0.25, 0)] });
  assert.equal(N.movementClear(P(0, -4), P(0, 4)), false, 'crossing the wall');
  assert.equal(N.movementClear(P(-9, 0.25 + 0.4), P(9, 0.25 + 0.4)), false, 'inside the body margin');
  assert.equal(N.movementClear(P(-9, 0.25 + 0.5), P(9, 0.25 + 0.5)), true, 'just outside the margin');
  assert.equal(N.movementClear(P(5.9, -4), P(5.9, 4)), true, 'past the short end');
});

test('rotated OBB is tested as an oriented box, not its bounding box', () => {
  // A thin 10 m wall turned 45 degrees: its AABB is about 7.5 m square, mostly empty.
  const { N } = world({ statics: [wall('d', 0, 0, 5, 0.25, Math.PI / 4)] });
  assert.equal(N.movementClear(P(-4, -4), P(4, 4)), false, 'runs along the long axis, on it');
  assert.equal(N.movementClear(P(-4, -2), P(4, 6)), true, 'parallel 1.4 m off, inside the AABB');
  assert.equal(N.movementClear(P(3, -3), P(3.4, -2.6)), true, 'AABB corner the OBB never reaches');
  assert.equal(N.movementClear(P(-3, 3), P(3, -3)), false, 'crosses the OBB through its middle');
  assert.equal(N.movementClear(P(3.6, -3.6), P(3.6, 3.6)), false, 'clips the OBB end inside the AABB corner');
});

test('moving truck OBB follows the live vehicle, with no stale cached volume', () => {
  const { N, obstacles } = world(),
    v = { id: 'truck-1', position: { x: 0, z: 0 }, heading: { x: 0, z: 1 } };
  obstacles.__dynamicFootprints = [truckFootprint(v)];
  assert.equal(N.movementClear(P(-6, 0), P(6, 0)), false, 'crosses the broadside');
  assert.equal(N.movementClear(P(-6, 8), P(6, 8)), true, 'passes beyond the bonnet');
  v.position.z = 8;
  assert.equal(N.movementClear(P(-6, 0), P(6, 0)), true, 'truck has driven off');
  assert.equal(N.movementClear(P(-6, 8), P(6, 8)), false, 'truck now stands there');
  v.heading = { x: 1, z: 0 }; // turn it 90 degrees so the 6.2 m length lies along x
  assert.equal(N.movementClear(P(3, 5), P(3, 11)), false, 'new heading swung the hull across x = 3');
  assert.equal(N.movementClear(P(-3, 5), P(-3, 11)), false, 'and across x = -3');
  assert.equal(N.movementClear(P(5, 5), P(5, 11)), true, 'x = 5 lies beyond its 3.1 m half length');
  v.heading = { x: 0, z: 1 };
  assert.equal(N.movementClear(P(3, 5), P(3, 11)), true, 'turned back, x = 3 is open');
});

test('only the named carrier is ignored, and only for trucks', () => {
  const { N, obstacles } = world({ statics: [wall('w', 0, 20, 5, 0.25, 0)] }),
    a = { id: 'truck-a', position: { x: 0, z: 0 }, heading: { x: 0, z: 1 } },
    b = { id: 'truck-b', position: { x: 0, z: 10 }, heading: { x: 0, z: 1 } };
  obstacles.__dynamicFootprints = [truckFootprint(a), truckFootprint(b)];
  assert.equal(N.movementClear(P(-3, 0), P(3, 0)), false, 'seat step blocked by own truck by default');
  assert.equal(N.movementClear(P(-3, 0), P(3, 0), { ignoreDynamicId: 'truck-a' }), true, 'self ignored');
  assert.equal(
    N.movementClear(P(-3, 10), P(3, 10), { ignoreDynamicId: 'truck-a' }),
    false,
    'other truck not'
  );
  assert.equal(
    N.movementClear(P(0, 17), P(0, 23), { ignoreDynamicId: 'wall' }),
    false,
    'a wall id is never exempt'
  );
  assert.equal(
    N.movementClear(P(0, 17), P(0, 23), { ignoreDynamicId: 'truck-a' }),
    false,
    'nor static walls'
  );
});

test('line of sight uses the same truck shape, with its height and without the body margin', () => {
  const { F, N, obstacles } = world(),
    v = { id: 'truck-1', position: { x: 0, z: 0 }, heading: { x: 0, z: 1 } };
  obstacles.__dynamicFootprints = [truckFootprint(v)];
  assert.equal(
    F.sightBlocked(obstacles, { x: -6, y: 1.5, z: 0 }, { x: 6, y: 1.5, z: 0 }),
    true,
    'sight at 1.5 m'
  );
  assert.equal(
    F.sightBlocked(obstacles, { x: -6, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }),
    false,
    'over the 2.8 m roof'
  );
  assert.equal(
    F.sightBlocked(
      obstacles,
      { x: -6, y: 1.5, z: 0 },
      { x: 6, y: 1.5, z: 0 },
      { ignoreDynamicId: 'truck-1' }
    ),
    false,
    'the carrier sees out of itself'
  );
  assert.equal(
    F.sightBlocked(
      obstacles,
      { x: -6, y: 1.5, z: 0 },
      { x: 6, y: 1.5, z: 0 },
      { ignoreDynamicId: 'truck-2' }
    ),
    true,
    'another truck id does not'
  );
  // 0.3 m beyond the hull edge (hx = 1.25 along x for a z-facing truck): a body cannot step there, a bullet passes.
  const edge = 1.25 + 0.3;
  assert.equal(N.movementClear(P(edge, -8), P(edge, 8)), false, 'move query keeps the body margin');
  assert.equal(
    F.sightBlocked(obstacles, { x: edge, y: 1.5, z: -8 }, { x: edge, y: 1.5, z: 8 }),
    false,
    'sight query has none'
  );
  const hit = F.sightBlocker(obstacles, { x: -6, y: 1.5, z: 0 }, { x: 6, y: 1.5, z: 0 });
  assert.equal(hit && hit.id, 'truck-1', 'sightBlocker names the dynamic truck');
});

test('a shot is stopped by the truck through the rebuilt ballistic obstacle list', () => {
  // A static footprint forces ballisticObstacles to rebuild (and re-attach) the dynamic set.
  const { r, obstacles, sim } = world({ statics: [wall('far', 80, 80, 1, 1, 0)] }),
    B = r.BattleBallistics,
    v = { id: 'truck-1', position: { x: 0, z: 0 }, heading: { x: 0, z: 1 } };
  obstacles.__dynamicFootprints = [truckFootprint(v)];
  assert.equal(B.ballisticObstacles(obstacles).__dynamicFootprints, obstacles.__dynamicFootprints);
  assert.equal(
    B.environmentLineBlocked({ x: -6, y: 1.5, z: 0 }, { x: 6, y: 1.5, z: 0 }, sim),
    true,
    'through the hull'
  );
  assert.equal(
    B.environmentLineBlocked({ x: -6, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }, sim),
    false,
    'over the roof'
  );
  v.position.z = 20;
  assert.equal(
    B.environmentLineBlocked({ x: -6, y: 1.5, z: 0 }, { x: 6, y: 1.5, z: 0 }, sim),
    false,
    'truck moved on'
  );
  assert.equal(
    B.environmentLineBlocked({ x: -6, y: 1.5, z: 20 }, { x: 6, y: 1.5, z: 20 }, sim),
    true,
    'and blocks there'
  );
});

test('paths route around a truck and stay legal', () => {
  const { N, obstacles } = world(),
    v = { id: 'truck-1', position: { x: 0, z: 0 }, heading: { x: 0, z: 1 } };
  obstacles.__dynamicFootprints = [truckFootprint(v)];
  const path = N.findPath(P(-12, 0), P(12, 0));
  assert.ok(path.length >= 2, 'detour has bends: ' + JSON.stringify(path));
  let prev = P(-12, 0);
  for (const p of path) {
    assert.equal(N.movementClear(prev, p), true, 'leg to ' + p.x + ',' + p.z + ' is clear');
    prev = p;
  }
  assert.ok(Math.hypot(prev.x - 12, prev.z) < 0.5, 'ends at the goal');
});

test('the same query sequence replays identically', () => {
  function run() {
    const { N, F, obstacles } = world({
        statics: [wall('w', 3, 3, 4, 0.3, 0.6), wall('x', -6, 2, 2, 0.3, 2.1)]
      }),
      v = { id: 'truck-1', position: { x: 0, z: 0 }, heading: { x: 0, z: 1 } },
      out = [];
    obstacles.__dynamicFootprints = [truckFootprint(v)];
    for (let i = 0; i < 40; i++) {
      v.position.x = Math.sin(i * 0.7) * 6;
      v.position.z = i * 0.5 - 10;
      v.heading = { x: Math.sin(i * 0.3), z: Math.cos(i * 0.3) };
      const a = P(-10 + (i % 7), -9 + (i % 5)),
        b = P(10 - (i % 3), 9 - (i % 4));
      out.push(
        N.movementClear(a, b),
        F.sightBlocked(obstacles, { ...a, y: 1.5 }, { ...b, y: 1.5 }),
        JSON.stringify(N.findPath(a, b))
      );
    }
    return out;
  }
  assert.deepEqual(run(), run());
});

console.log('geometry contract: ' + n + ' passed');
