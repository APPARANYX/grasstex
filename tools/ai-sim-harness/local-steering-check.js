#!/usr/bin/env node
'use strict';
/* stepMovement's local steering (battle-sim.js steerAroundObstacles) is a soft push away from the
   tactical cover circles; physical navigation (movementClear / resolveStep) keeps bodies out of real
   footprints. A thin wall is sampled as 1.6 m circles every ~2.4 m, and its cover slot sits ~1.9 m
   from two of them, inside both 2.1 m avoidance rings. Men bounding to such a slot jittered in
   place ~2 m short of it for minutes ("the Matrix dodge", live battle live-mulvtaqc-2r6wz, us-3):
   the two pushes outweighed the heading and turned him round, the next frame turned him back.
   Nothing flagged it: movement progress treats 3 m as near enough, and he was always "moving".
   The harness stubs steering out of stepMovement, so this loads the shipping function itself.
   Geometry is wall-5373 from that battle, moved to the origin. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
const src = fs.readFileSync(path.join(H.REPO, 'battle/battle-sim.js'), 'utf8'),
  body = src.slice(src.indexOf('  var AVOID_LOOKAHEAD='), src.indexOf('  function stepMovement('));
assert.ok(body.includes('function steerAroundObstacles('), 'steering source found');
const steer = new Function('root', body + ';return steerAroundObstacles;')({});
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
/* Two of the wall's circles (r 1.6), its slot between them 1.91 m from each, the man's start and the
   navigation waypoint he was steering to (0.9 m short of the slot, outside both rings). */
const O = { x: 25.32, z: -97.88 },
  rel = p => ({ x: p.x - O.x, z: p.z - O.z }),
  circles = [
    { x: 25.32, z: -97.88, radius: 1.6, type: 'wall' },
    { x: 24.24, z: -100.1, radius: 1.6, type: 'wall' }
  ].map(c => Object.assign(c, rel(c))),
  slot = rel({ x: 26.0865, z: -99.6218 }),
  start = rel({ x: 27.92, z: -100.51 }),
  waypoint = rel({ x: 27.0, z: -100.07 });
function unit(from, to) {
  const d = Math.hypot(to.x - from.x, to.z - from.z);
  return { x: (to.x - from.x) / d, z: (to.z - from.z) / d };
}
/* stepMovement's heading: toward the waypoint, steered with the man's destination as the goal. */
function walk(goalFor, seconds) {
  const p = { x: start.x, z: start.z },
    dt = 1 / 30,
    speed = 3.5;
  let t = 0,
    odo = 0,
    passed = false;
  while (t < seconds && Math.hypot(slot.x - p.x, slot.z - p.z) > 0.35) {
    /* Navigation hands him the next waypoint once he has reached the one before. */
    passed = passed || Math.hypot(waypoint.x - p.x, waypoint.z - p.z) <= 0.3;
    const target = passed ? slot : waypoint,
      h = unit(p, target),
      s = steer(circles, p.x, p.z, h.x, h.z, goalFor(target)) || h,
      step = Math.min(Math.hypot(target.x - p.x, target.z - p.z), speed * dt);
    p.x += s.x * step;
    p.z += s.z * step;
    odo += step;
    t += dt;
  }
  return { t, odo, d: Math.hypot(slot.x - p.x, slot.z - p.z) };
}
test('a man bounding to a wall slot between two circles reaches it', () => {
  const r = walk(() => slot, 30);
  assert.ok(
    r.d <= 0.35,
    'stuck ' + r.d.toFixed(2) + ' m short after ' + r.t.toFixed(1) + ' s, walked ' + r.odo.toFixed(0) + ' m'
  );
  assert.ok(r.t < 2, 'took ' + r.t.toFixed(1) + ' s for 2 m');
});
test('the circles his destination hugs never push him, whatever waypoint he is on', () => {
  const h = unit(start, waypoint);
  assert.equal(steer(circles, start.x, start.z, h.x, h.z, slot), null);
});
test('walking past an obstacle to somewhere else, it still steers him round (control)', () => {
  const lone = [{ x: 0, z: 0, radius: 1.6 }],
    s = steer(lone, -3.5, 0.3, 1, 0, { x: 6, z: 0.3 });
  assert.ok(s && Math.abs(s.z) > 0.1 && s.x > 0, 'no avoidance on the way past: ' + JSON.stringify(s));
});
console.log(n + ' local steering checks passed');
