#!/usr/bin/env node
'use strict';
/* Regression for #361 / meeting:hill-0008 GE-4. An otherwise viable physical path
   must not be side-steered back into its previous corner every 0.15 s tick.
   Retain ordinary light avoidance and escape when the physical step is blocked. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

const source = fs.readFileSync(path.join(H.REPO, 'battle/battle-sim.js'), 'utf8');
const body = source.slice(
  source.search(/  var AVOID_LOOKAHEAD\s*=/),
  source.indexOf('  function stepMovement(')
);
assert.ok(body.includes('function preserveClearNavigationLeg('), 'shipping navigation-steering gate exists');
function gate(clear, search) {
  const root = { BattleNavigation: { movementClear: () => clear } };
  return new Function('root', 'location', body + '; return preserveClearNavigationLeg;')(root, {
    search: search || ''
  });
}
const from = { x: 608.38705, z: 382.54349 };
const to = { x: 605.52658, z: 381.39134 };
const length = Math.hypot(to.x - from.x, to.z - from.z);
const dx = (to.x - from.x) / length;
const dz = (to.z - from.z) / length;
/* The actual GE-4 leader alternates between these exact two coordinates,
   walking ~0.77 m in alternating directions at each fixed-step tick. */
const reversePosition = { x: 609.05513, z: 382.15566 };
const reverseLength = Math.hypot(reversePosition.x - from.x, reversePosition.z - from.z);
const reverse = {
  x: (reversePosition.x - from.x) / reverseLength,
  z: (reversePosition.z - from.z) / reverseLength
};
assert.ok(reverse.x * dx + reverse.z * dz < 0, 'observed movement actually reverses physical route');
/* The actual chosen steering vector at (608.387,382.543) is not a 180-degree
   reversal: it is about 42 degrees off the south-west physical route. It sends
   the soldier back into the last near corner, whose subsequent route step sends
   him right back, producing the observed A/B oscillation. */
const lateral = { x: -0.865, z: 0.502 };
const lateralDot = lateral.x * dx + lateral.z * dz;
assert.ok(lateralDot > 0.6 && lateralDot < 0.8, 'measured sideways push is strong, but not reversed');
const route = { blocked: false, points: [to] };
assert.equal(
  gate(true)(lateral, dx, dz, from, 0.5925, route),
  null,
  'clear physical leg defeats the measured 42-degree sideways push'
);
assert.equal(
  gate(false)(lateral, dx, dz, from, 0.5925, route),
  lateral,
  'a blocked step still allows the measured lateral avoidance'
);
const light = { x: dx * 0.95 - dz * 0.312249, z: dz * 0.95 + dx * 0.312249 };
assert.equal(
  gate(true)(light, dx, dz, from, 0.5925, route),
  light,
  'small ordinary cover avoidance is still followed on the clear route'
);
assert.equal(
  gate(true)(reverse, dx, dz, from, 0.5925, route),
  null,
  'clear physical leg wins over a reversing cover-circle push'
);
assert.equal(
  gate(false)(reverse, dx, dz, from, 0.5925, route),
  reverse,
  'collision-blocked direct steps retain evasive reverse steering'
);
assert.equal(
  gate(true)(reverse, dx, dz, from, 0.5925, { blocked: true, points: [to] }),
  reverse,
  'a blocked physical path keeps the legacy escape behavior'
);
assert.equal(
  gate(true)(reverse, dx, dz, from, 0.5925, null),
  reverse,
  'absence of a proven physical leg is not a reason to suppress avoidance'
);
assert.equal(
  gate(true, '?steerNavForward=0')(reverse, dx, dz, from, 0.5925, route),
  reverse,
  'opt-out control exactly preserves legacy reverse steering'
);
let position = { ...from };
for (let i = 0; i < 6; i++) {
  const d = Math.hypot(to.x - position.x, to.z - position.z);
  const ux = (to.x - position.x) / d;
  const uz = (to.z - position.z) / d;
  const steered = gate(true)(reverse, ux, uz, position, Math.min(d, 0.5925), route);
  const chosen = steered || { x: ux, z: uz };
  position = {
    x: position.x + chosen.x * Math.min(d, 0.5925),
    z: position.z + chosen.z * Math.min(d, 0.5925)
  };
}
assert.ok(
  Math.hypot(position.x - from.x, position.z - from.z) >= 2.5,
  'clear physical waypoint makes genuine net progress instead of repeating the two-position loop'
);
console.log(
  'PASS #361 clear physical waypoint defeats measured lateral steering; mild and blocked avoidance preserved'
);
