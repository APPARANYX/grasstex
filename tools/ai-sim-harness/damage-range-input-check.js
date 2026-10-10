#!/usr/bin/env node
'use strict';

/* R5: browser input dispatch must preserve button-edge timing and simultaneous
   action ordering, including an RT hold across orbit -> FPS transition. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../battle/modules/98-damage-range.js'), 'utf8');
const start = source.indexOf('  function shapedAxis(v)');
const end = source.indexOf('  function setup(sim)', start);
assert.ok(start > 0 && end > start, 'input decoders are outside stateful range setup');
const input = new Function(
  "var ZONES = ['head', 'chest', 'abdomen', 'arm', 'leg'];\n" +
    source.slice(start, end) +
    'return { axis: shapedAxis, value: buttonValue, key: rangeKeyboardAction, pad: rangePadCommands };'
)();
const keys = [
  ['Space', ' ', 'fire'],
  ['ArrowLeft', 'ArrowLeft', 'previousTarget'],
  ['ArrowRight', 'ArrowRight', 'nextTarget'],
  ['Digit1', '1', 'zone:head'],
  ['Digit2', '2', 'zone:chest'],
  ['Digit3', '3', 'zone:abdomen'],
  ['Digit4', '4', 'zone:arm'],
  ['Digit5', '5', 'zone:leg'],
  ['KeyE', 'E', 'toggleExit'],
  ['KeyO', 'o', 'toggleOrbit'],
  ['KeyA', 'A', 'toggleAuto'],
  ['KeyF', 'f', 'toggleFps'],
  ['KeyC', 'c', 'clear'],
  ['Digit6', '6', null],
  ['KeyX', 'x', null]
];
keys.forEach(([code, key, want]) => assert.equal(input.key(code, key), want, code));
assert.equal(input.axis(0.18), 0);
assert.equal(input.axis(-0.18), 0);
assert.equal(input.axis('bad'), 0);
assert.ok(Math.abs(input.axis(1) - 1) < 1e-12);
assert.ok(Math.abs(input.axis(-1) + 1) < 1e-12);
assert.equal(input.value({ buttons: [{ pressed: true, value: 0 }] }, 0), 1);
assert.equal(input.value({ buttons: [{ pressed: false, value: 0.6 }] }, 0), 0.6);
assert.equal(input.value({ buttons: [] }, 0), 0);
function pad(...buttons) {
  const data = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
  buttons.forEach(i => (data[i] = { pressed: true, value: 1 }));
  return { buttons: data };
}
const all = pad(0, 7, 1, 2, 3, 4, 5, 8, 9, 11, 12, 13, 14, 15);
const expected = [
  'fire',
  'fire',
  'clear',
  'burst3',
  'toggleAuto',
  'toggleExit',
  'toggleOrbit',
  'togglePanel',
  'toggleFps',
  'kill',
  'previousZone',
  'nextZone',
  'previousTarget',
  'nextTarget'
];
const first = input.pad(all, true, {});
assert.deepEqual(first.actions, expected, 'simultaneous Xbox actions retain original exact order');
assert.deepEqual(input.pad(all, true, first.buttons).actions, [], 'held buttons do not repeat');
assert.deepEqual(input.pad(pad(7), false, {}).actions, [], 'RT cannot fire in orbit');
const rtHeld = input.pad(pad(7), false, {});
assert.deepEqual(input.pad(pad(7), true, rtHeld.buttons).actions, [], 'orbit->FPS must not refire held RT');
const released = input.pad(pad(), true, rtHeld.buttons);
assert.deepEqual(input.pad(pad(7), true, released.buttons).actions, ['fire'], 'RT fires after release');
assert.deepEqual(input.pad(pad(0, 7), false, {}).actions, ['fire'], 'A fires in orbit');
assert.deepEqual(input.pad(pad(0, 7), true, {}).actions, ['fire', 'fire'], 'A and RT both fire in FPS');
assert.equal(Object.keys(first.buttons).length, 17, 'unbound buttons are still tracked every frame');
assert.match(source, /commands\.actions\.forEach\(applyRangeAction\)/, 'gamepad wired to dispatcher');
assert.match(source, /applyRangeAction\(action\)/, 'keyboard wired to dispatcher');
assert.ok(!source.includes('padOnce('), 'old mutable decoder removed');
console.log('PASS #456 R5 keyboard, axes, Xbox edge leases, simultaneous command order and dispatcher wiring');
