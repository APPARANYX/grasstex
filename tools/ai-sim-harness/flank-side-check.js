#!/usr/bin/env node
'use strict';
/* Strategic recovery's flank point steps off the approach line to a side chosen from the squad's role.
   The side used to come from the parity of the squad id's length, which is 4 for every real squad
   (us-0..us-4), so a 'right' squad flanked the same way as a 'left' one. Left and right now mirror. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');

const r = H.bootstrap({ search: '' });
new Function(
  'window',
  'globalThis',
  'console',
  fs.readFileSync(path.join(H.REPO, 'battle/commander-doctrine.js'), 'utf8')
)(r, r, console);
const D = r.BattleCommanderDoctrine,
  chosen = { point: { x: 100, z: 50 }, instance: { def: { radius: 30 } } },
  town = { center: { x: 0, z: 0 } },
  at = role => D.flankPoint({ id: 'us-3', commandRole: role }, chosen, town);

const left = at('left'),
  right = at('right');
assert.ok(left.x * right.x < 0 || left.z * right.z < 0 || Math.abs(left.x - right.x) > 1, 'sides differ');
assert.ok(
  Math.abs(left.x + right.x - 200) < 1e-6 && Math.abs(left.z + right.z - 100) < 1e-6,
  'left and right mirror about the objective'
);
console.log('flank-side-check ok');
