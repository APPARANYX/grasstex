#!/usr/bin/env node
'use strict';
/* Regression: strategic 5km camera boost applies to both keyboard Shift
   and gamepad RB through the same free-fly speed selection, never infantry. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../../battle/camera-controls.js'), 'utf8');
const start = src.indexOf('  var FLY_SPEED = '), end = src.indexOf('  var FOLLOW_DEFAULT', start);
assert.ok(start > 0 && end > start, 'free-fly constants are present');
const constants = new Function('global', src.slice(start, end) + '\nreturn {normal: FLY_SPEED, fast: FLY_SPRINT};');
assert.deepEqual(constants({BattleSim:{FIELD_W:5000}}), {normal:68,fast:420},
  '5km strategic camera uses faster sprint');
assert.deepEqual(constants({BattleSim:{FIELD_W:1200}}), {normal:68,fast:175},
  'tactical smaller map unchanged');
assert.deepEqual(constants({}), {normal:68,fast:175},
  'model lab / pages without a battlefield unchanged');
assert.match(src, /padSprint = buttonValue\(pad, 5\) > 0\.5;/,
  'gamepad RB remains fast-fly input');
assert.match(src, /var speed = \(keys\.has\('shift'\) \|\| padSprint \? FLY_SPRINT : FLY_SPEED\) \* throttle;/,
  'keyboard Shift and gamepad RB share the fast-flight speed');
assert.match(src, /if \(padPrecision && !padSprint\) speed \*= PAD_PRECISION;/,
  'precision modifier remains available');
assert.match(src, /camera\.position\.y \+= clamp\(v, -1, 1\) \* speed \* 0\.7 \* dt;/,
  'fast-flight vertical movement scales with the same speed');
console.log('PASS strategic 5km fast-flight 175 -> 420 for keyboard Shift and gamepad RB; tactical and player controls unaffected');
