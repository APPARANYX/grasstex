#!/usr/bin/env node
'use strict';
/* A wall wider than the route corridor: the detour starts at a corner the corridor never listed. The plan
   must widen once and find the way round the wall's end instead of staying blocked. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const quiet = { log() {}, warn() {}, error() {} };
function load(root, rel) {
  const c = fs.readFileSync(path.join(REPO, rel), 'utf8');
  new Function('window', 'globalThis', 'console', 'BABYLON', c + '\n//# sourceURL=' + rel)(
    root,
    root,
    quiet,
    root.BABYLON
  );
}
const r = { console: quiet };
r.window = r;
r.BABYLON = {
  Color3: function () {},
  MeshBuilder: {
    CreateLines: () => ({ dispose() {} }),
    CreateSphere: () => ({ position: { set() {} }, dispose() {} })
  },
  StandardMaterial: function () {}
};
r.BattleModules = {
  systems: {},
  registerSystem(id, s) {
    s.id = id;
    this.systems[id] = s;
  },
  getSystem(id) {
    return this.systems[id];
  },
  listSystems() {
    return Object.values(this.systems);
  }
};
load(r, 'battle/core-runtime.js');
load(r, 'battle/battle-navigation.js');
load(r, 'battle/modules/39-navigation-physicality-debug.js');
const N = r.BattleNavigation,
  P = r.BattleNavigationPhysicality;

function hedge(id, x, z, hx, hz) {
  return { id, type: 'hedge', shape: 'obb', x, z, hx, hz, ux: 1, uz: 0, vx: 0, vz: 1 };
}
function world(shapes) {
  const scenario = { buildings: [] },
    sim = {
      time: 0,
      heightAt: () => 0,
      obstacles: [],
      _roster: { us: [], ge: [] },
      scene: { metadata: { battleScenario: scenario } }
    };
  sim.obstacles.__physicalFootprints = shapes;
  N.installScenario(scenario);
  r.BattleModules.getSystem('navigation-physicality-debug').onBattleStart(sim);
  return sim;
}
function clearPath(start, points, shapes, margin) {
  let p = start;
  for (const q of points) {
    if (shapes.some(fp => P.shapeHit(p, q, fp, margin))) return false;
    p = q;
  }
  return true;
}

/* A line of 1.6 m hedge circles every 2.5 m across z = 0, x from -20 to 20 (17 of them, so the 32-shape cap never bites):
   the straight line from (0,-10) to (0,10) runs through the middle of it, and only the circles within 12 m of that line
   are listed as route shapes. */
const wall = [];
for (let x = -20; x <= 20; x += 2.5)
  wall.push({ id: 'wall' + x, type: 'hedge', shape: 'circle', x, z: 0, radius: 1.6 });
const sim = world(wall),
  start = { x: 0, z: -10 },
  goal = { x: 0, z: 10 },
  plan = P.planPath(sim, start, goal);
assert.ok(plan.length > 0, 'a way round the wall end is found, not a blocked plan');
assert.ok(
  clearPath(start, plan.concat([goal]), wall, P.routeMargin),
  'and the route reaches the goal, not a corner that leads nowhere'
);

/* Control: a wall that fits the corridor is planned exactly as before. */
const short = wall.filter(h => Math.abs(h.x) <= 5),
  s2 = world(short),
  p2 = P.planPath(s2, start, goal);
assert.ok(p2.length > 0 && clearPath(start, p2, short, P.routeMargin), 'a narrow wall is still passed');

/* A wall with no end (the whole map width) stays blocked and does not hang. */
const full = [];
for (let x = -110; x <= 110; x += 2.5)
  full.push({ id: 'full' + x, type: 'hedge', shape: 'circle', x, z: 0, radius: 1.6 });
const s3 = world(full),
  p3 = P.planPath(s3, start, goal);
assert.ok(
  !clearPath(start, p3.concat([goal]), full, P.routeMargin),
  'an unbroken wall has no complete route'
);
console.log('PASS plan-local widening finds the way round a wall wider than the corridor');
