#!/usr/bin/env node
'use strict';

/* Audit #456 R2: protect the input event registration order and
   free-fly/player frame ordering when splitting the desktop camera controller. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../../battle/camera-controls.js'), 'utf8');
function region(open, close) {
  const a = src.indexOf(open);
  assert.ok(a >= 0, 'missing ' + open);
  const b = src.indexOf(close, a + open.length);
  assert.ok(b > a, 'missing ' + close);
  return src.slice(a + open.length, b);
}
function normalized(s) {
  return s
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}
function fingerprint(s) {
  let hash = 0x811c9dc5;
  for (const ch of s) hash = Math.imul(hash ^ ch.charCodeAt(0), 0x01000193);
  return (hash >>> 0).toString(16);
}
/* Listener owners are now tracked by listen(target,...); reconstruct the old
   registration spelling (including split-line calls) to preserve the existing
   byte-level handler-order fingerprint rather than dropping the parity check. */
const events = normalized(
  region('    function bindDesktopEvents() {\n', '    }\n    function stepFreeFly(')
).replace(
  /\blisten\(\s*(canvas|document|window),\s*/g,
  (match, target) => target + '.addEventListener(' + (match.includes('\n') ? '\n' : '')
);
const freefly = normalized(
  region('    function stepFreeFly(pad, dt) {\n', '    }\n    function stepDesktopFrame()')
);
const orchestration = normalized(
  region('    function stepDesktopFrame() {\n', '      stepFreeFly(pad, dt);')
);
assert.equal(
  fingerprint(events),
  '73ac680a',
  'event/handler bodies or listener ordering changed since the death-tour input baseline'
);
assert.equal(fingerprint(freefly), '5cb26236', 'the original free-fly movement, speed or geometry changed');
/* Preserve the prior byte-level frame-order oracle after isolating the single
   new roster guard. Do not simply rebaseline the entire function: everything
   after the guard (Menu, death skip, possession and frame handoff) must remain
   identical to the accepted controller-A baseline. */
const restartGuard = /\/\* Restarts reuse[\s\S]*?leavePlayer\('battle roster replaced'\);\n/;
assert.match(
  orchestration,
  restartGuard,
  'stale player ownership must be checked before menu/gamepad dispatch'
);
assert.ok(
  orchestration.indexOf("leavePlayer('battle roster replaced');") < orchestration.indexOf('menuHoldGesture('),
  'restart guard must execute before the menu/death/controller input branch'
);
/* Deliberately allow ONLY the map's non-gameplay gate. Reverse that exact
   insertion before checking the death-tour-era frame-order fingerprint.
   An unrelated Menu/possession/control change must still fail this ratchet. */
const mapDeclaration = 'pad = activeGamepad(),\ntacticalMap = global.BattleTacticalMap;';
assert.ok(
  orchestration.includes(mapDeclaration),
  'map gate must capture the currently loaded map presentation system'
);
const mapGuardStart = orchestration.indexOf('/* D-pad right toggles the full map');
const mapGuardEnd = orchestration.indexOf('/* Restarts reuse', mapGuardStart);
assert.ok(mapGuardStart > 0 && mapGuardEnd > mapGuardStart, 'map-only input guard precedes roster guard');
const mapGuard = orchestration.slice(mapGuardStart, mapGuardEnd);
assert.match(
  mapGuard,
  /if \(pad && tacticalMap && !menuOpen && padPressedOnce\(pad, 15\)\)/,
  'D-pad right opens/closes the map without colliding with settings controls'
);
assert.match(
  mapGuard,
  /tacticalMap\.setOpen\(!tacticalMap\.isOpen\(\)\)/,
  'map gamepad toggle must stay a presentation toggle'
);
assert.match(
  mapGuard,
  /if \(tacticalMap && tacticalMap\.isOpen\(\)\) {[\s\S]*?keys\.clear\(\);[\s\S]*?mouseFire = false;[\s\S]*?return;/,
  'opening the map suppresses movement and weapon input'
);
const originalOrchestration = orchestration
  .replace(mapDeclaration, 'pad = activeGamepad();')
  .replace(mapGuard, '');
assert.equal(
  fingerprint(originalOrchestration.replace(restartGuard, '')),
  'a5a33693',
  'prior Menu/player frame ordering remains unchanged outside the audited tactical-map input gate'
);
assert.match(src, /menuHoldState\.long = false;/, 'disconnect clears the held Menu gesture');
assert.match(src, /menuHoldState\.since = 0;/, 'disconnect resets Menu hold duration');
assert.equal(src.match(/bindDesktopEvents\(\);/g)?.length, 1, 'listeners must attach only once');
assert.equal(src.match(/scene\.onBeforeRenderObservable\.add\(stepDesktopFrame\)/g)?.length, 1);
assert.equal(src.match(/stepFreeFly\(pad, dt\);/g)?.length, 1);
const keyboard =
  'function keyName(event) {' + region('  function keyName(event) {', '  function createDesktopFly(');
const input = new Function(
  keyboard + '\nreturn {keyName, editableTarget, movementKey, playerMovementKey};'
)();
assert.equal(input.keyName({ key: ' ' }), ' ');
assert.equal(input.keyName({ key: 'W' }), 'w');
assert.equal(input.keyName({ key: 'Escape' }), 'escape');
for (const tagName of ['INPUT', 'SELECT', 'TEXTAREA']) assert.equal(input.editableTarget({ tagName }), true);
assert.equal(input.editableTarget({ tagName: 'DIV', isContentEditable: true }), true);
assert.equal(input.editableTarget({ tagName: 'DIV' }), false);
for (const k of ['w', 'a', 's', 'd', 'shift']) {
  assert.equal(input.movementKey(k), true, k);
  assert.equal(input.playerMovementKey(k), true, k);
}
for (const k of ['q', 'e']) {
  assert.equal(input.movementKey(k), true, k);
  assert.equal(input.playerMovementKey(k), false, k);
}
for (const k of ['g', 'b', 'c', 'z', 'v', 'p', 'o', 'escape']) {
  assert.equal(input.movementKey(k), false, k);
  assert.equal(input.playerMovementKey(k), false, k);
}
console.log(
  'PASS #456 R2 event order, free-fly frame parity, menu/possession ordering and focus/movement key guards'
);
