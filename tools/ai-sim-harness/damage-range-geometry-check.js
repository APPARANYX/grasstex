#!/usr/bin/env node
'use strict';

/* #456 R5: compare the extracted pure geometry against precise impact,
   wounded-victim, entry/exit and no-through-shot contracts. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../battle/modules/98-damage-range.js'), 'utf8');
const first = source.indexOf('  function rangeZonePoint(');
const last = source.indexOf('  function setup(sim)', first);
assert.ok(first > 0 && last > first, 'pure geometry sits outside the stateful range setup');
const geometry = new Function(
  source.slice(first, last) + 'return { zone: rangeZonePoint, shot: rangeShot };'
)();
const target = { id: 'ge-gunner', root: { position: { x: 2, y: 40, z: 100 } } };
assert.deepEqual(geometry.zone(target, 'head', 0), { x: 2, y: 41.7, z: 100 });
assert.deepEqual(geometry.zone(target, 'chest', 0), { x: 2, y: 41.34, z: 100 });
assert.deepEqual(geometry.zone(target, 'abdomen', 0), { x: 2, y: 41.06, z: 100 });
assert.deepEqual(geometry.zone(target, 'arm', 0), { x: 1.72, y: 41.33, z: 100 });
assert.deepEqual(geometry.zone(target, 'arm', 1), { x: 2.28, y: 41.33, z: 100 });
assert.deepEqual(geometry.zone(target, 'leg', 0), { x: 1.87, y: 40.69, z: 100 });
assert.deepEqual(geometry.zone(target, 'leg', 1), { x: 2.13, y: 40.69, z: 100 });
const point = geometry.zone(target, 'chest', 0),
  dir = { x: 0, y: 0, z: 1 };
const through = geometry.shot(target, 'chest', point, dir, true, 111.2);
assert.equal(through.mode, 'raycast');
assert.equal(through.victim, target);
assert.equal(through.zone, 'chest');
assert.deepEqual(
  through.passes.map(x => x.victim),
  [target]
);
assert.deepEqual(through.impact, { x: 2, y: 41.34, z: 99.78 });
assert.deepEqual(through.passes[0].exit, { x: 2, y: 41.34, z: 100.22 });
assert.equal(through.passes[0].direction, dir);
assert.deepEqual(through.final.impact, { x: 2, y: 41.34, z: 111.06 });
const stopped = geometry.shot(target, 'chest', point, dir, false, 111.2);
assert.equal(stopped.passes[0].exit, null);
assert.equal(stopped.passes[0].exitDirection, undefined);
assert.equal(stopped.final, null);
console.log(
  'PASS #456 R5 pure body zones, alternating limbs and through-shot geometry match shipping contracts'
);
