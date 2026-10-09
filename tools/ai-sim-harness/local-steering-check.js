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
  body = src.slice(src.search(/\bvar AVOID_LOOKAHEAD\s*=/), src.indexOf('  function stepMovement('));
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
/* The leg he is on. stepMovement steers toward a waypoint and passes it (and its distance): the look-ahead point is
   1.8 m ahead, which past the end of the leg lies inside the ring of the next circle along a wall (1.6 m circles every
   ~2.4 m: the slot is ~1.9 m from two of them and ~2.3 m from the third, outside its 2.1 m ring), and the full-strength
   push turned him round; a step later the point was outside it and the push was gone. In a live battle (300 s meeting
   probe, seed standard-benchmark-meeting-s1-b0001) a scout ran at 3.2 m/s for 1.7 s within 1 m of his slot without
   arriving, and a rifleman stepped back against his facing on the way to a slot 8 m off, whose waypoint sat inside a
   tree's ring: 79% of the reversals in cover bounds came from here. Geometry below is that scout's, moved to the origin. */
const S = { x: -251.4, z: -286.3 },
  R = p => ({ x: p.x + 251.4, z: p.z + 286.3 }),
  M0 = { x: -250.63, z: -286.97 },
  wall = [
    { x: M0.x - 0.12, z: M0.z + 2.31 },
    { x: M0.x - 2.8, z: M0.z + 1.66 },
    { x: M0.x - 5.48, z: M0.z + 1.0 }
  ].map(c => Object.assign({ radius: 1.6, type: 'wall' }, R(c))),
  slot2 = R(S);
function runTo(circles, start, target, useLeg, seconds) {
  const p = { x: start.x, z: start.z },
    dt = 1 / 30,
    speed = 3.2;
  let t = 0,
    reversals = 0,
    last = null;
  while (t < seconds && Math.hypot(target.x - p.x, target.z - p.z) > 0.35) {
    const d = Math.hypot(target.x - p.x, target.z - p.z),
      h = { x: (target.x - p.x) / d, z: (target.z - p.z) / d },
      s = (useLeg ? steer(circles, p.x, p.z, h.x, h.z, target, target, d) : steer(circles, p.x, p.z, h.x, h.z, target)) || h,
      step = Math.min(d, speed * dt),
      mv = { x: s.x * step, z: s.z * step };
    if (last && mv.x * last.x + mv.z * last.z < 0) reversals++;
    last = mv;
    p.x += mv.x;
    p.z += mv.z;
    t += dt;
  }
  return { t, reversals, d: Math.hypot(target.x - p.x, target.z - p.z) };
}
test('a wall slot 2.3 m from the third circle: he arrives without turning round; the old look-ahead orbits it', () => {
  for (const from of [R({ x: -250.63, z: -286.97 }), R({ x: -247.68, z: -288.61 }), R({ x: -249.2, z: -288.9 })]) {
    const now = runTo(wall, from, slot2, true, 5);
    assert.ok(now.d <= 0.35, 'stuck ' + now.d.toFixed(2) + ' m short after ' + now.t.toFixed(1) + ' s');
    assert.equal(now.reversals, 0, 'turned round ' + now.reversals + ' times on the way in');
  }
  const old = runTo(wall, R(M0), slot2, false, 5);
  assert.ok(old.d > 0.35 || old.reversals > 0, 'control: without the leg the failure reproduces (' + JSON.stringify(old) + ')');
});
test('a circle whose ring holds the waypoint he is walking to does not push him; one that does not still does', () => {
  const tree = [{ x: 0.35, z: 1.54, radius: 1.23, type: 'tree' }],
    from = { x: 0.14, z: -0.98 },
    wp = { x: 0, z: 0 },
    far = { x: 8, z: 1 },
    h = { x: -0.14, z: 0.99 };
  assert.ok(steer(tree, from.x, from.z, h.x, h.z, far), 'control: the goal rule alone pushes him off his own leg');
  assert.equal(steer(tree, from.x, from.z, h.x, h.z, far, wp, 0.99), null, 'the ring holds his waypoint: no push');
  const lone = [{ x: 0, z: 0, radius: 1.6 }],
    s = steer(lone, -3.5, 0.3, 1, 0, { x: 9, z: 0.3 }, { x: 6, z: 0.3 }, 9.5);
  assert.ok(s && Math.abs(s.z) > 0.1 && s.x > 0, 'a circle on the way to a distant waypoint still steers him round');
});
test('the look-ahead never passes the end of his leg', () => {
  const ahead = [{ x: 2.6, z: 0, radius: 0.6 }];
  assert.ok(steer(ahead, 0, 0, 1, 0, { x: 9, z: 0 }), 'control: 1.8 m ahead is inside the ring of a circle behind his waypoint');
  assert.equal(steer(ahead, 0, 0, 1, 0, { x: 9, z: 0 }, { x: 1, z: 0 }, 1), null, 'his leg ends at 1 m: what lies past it is not his business');
});
console.log(n + ' local steering checks passed');
