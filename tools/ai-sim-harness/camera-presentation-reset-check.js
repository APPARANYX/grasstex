#!/usr/bin/env node
'use strict';

/* #456 R2: possession must own presentation-state reset without mutating
   sim-side wounds, hit counters or authority leases. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../battle/camera-controls.js'), 'utf8');
function region(start, end) {
  const a = source.indexOf(start);
  assert.ok(a >= 0, 'missing ' + start);
  const b = source.indexOf(end, a + start.length);
  assert.ok(b > a, 'missing ' + end);
  return source.slice(a, b);
}
const helpers = region('    function resetPlayerPresentation(next) {', '    function leavePlayer(reason) {');
const run = new Function(
  `
  var playerStamina = 7,
    playerExhausted = true,
    lastWoundCount = 18,
    damageAt = 123,
    damageOrigin = { x: 1, z: 3 },
    lastShotPulse = 9,
    lastConfirmedHits = 15,
    hitMarkerAt = 19,
    shotImpactAt = 10,
    shotImpact = { x: 2 },
    lastBorePreview = 999,
    borePreview = { impact: { x: 9 } },
    boreScreenPos = { x: 4, y: 5 },
    borePaintAt = 340,
    grenadeKeyDown = true,
    playerBoreDot = { style: { display: 'block' } },
    hitMarker = { style: { opacity: '1' } },
    playerDamage = { style: { opacity: '1' } },
    playerHud = { style: { display: 'block' } },
    reticle = { style: { display: 'block' } };
  function clearGrenadeReady() { grenadeKeyDown = false; }
  function ensureReticle() { return reticle; }
` +
    helpers +
    `
  return {
    enter: resetPlayerPresentation,
    transient: hideTransientPlayerFeedback,
    leave: hidePlayerPresentation,
    snapshot: function () {
      return {
        playerStamina: playerStamina, playerExhausted: playerExhausted,
        wounds: lastWoundCount, damageAt: damageAt, damageOrigin: damageOrigin,
        pulse: lastShotPulse, hits: lastConfirmedHits, hitAt: hitMarkerAt,
        shotAt: shotImpactAt, shot: shotImpact, lastBore: lastBorePreview,
        bore: borePreview, screen: boreScreenPos, paintAt: borePaintAt,
        grenadeDown: grenadeKeyDown, boreDisplay: playerBoreDot.style.display,
        marker: hitMarker.style.opacity, damage: playerDamage.style.opacity,
        hud: playerHud.style.display, reticle: reticle.style.display
      };
    }
  };
`
)();
const first = { wounds: [{}, {}], _playerConfirmedHits: 6, isPlayer: true };
const second = { wounds: [{}], _playerConfirmedHits: 0, isPlayer: true };
run.enter(first);
run.transient();
let state = run.snapshot();
assert.equal(state.playerStamina, 100);
assert.equal(state.playerExhausted, false);
assert.equal(state.wounds, 2);
assert.equal(state.hits, 6);
assert.equal(state.damageOrigin, null);
assert.equal(state.bore, null);
assert.equal(state.screen, null);
assert.equal(state.lastBore, 0);
assert.equal(state.marker, '0');
assert.equal(state.damage, '0');
assert.equal(state.boreDisplay, 'none');
assert.equal(first.wounds.length, 2, 'must not mutate the soldier wound list');
assert.equal(first._playerConfirmedHits, 6, 'must not mutate authoritative hits');
run.enter(second);
run.transient();
state = run.snapshot();
assert.equal(state.wounds, 1);
assert.equal(state.hits, 0, 'previous soldier hits cannot carry into new possession');
assert.equal(state.hitAt, 0, 'old flash must not carry into new possession');
run.leave();
state = run.snapshot();
assert.equal(state.reticle, 'none');
assert.equal(state.hud, 'none');
assert.equal(state.boreDisplay, 'none');
assert.equal(state.marker, '0');
assert.equal(state.damage, '0');
const transfer = region(
  '    function possessSoldier(next, preservePause) {',
  '    function setPlayerStance(b, stance) {'
);
assert.ok(
  transfer.indexOf('resetPlayerPresentation(next);') < transfer.indexOf('commitPlayerOwnership(next, b);'),
  'feedback reset must precede new lease acquisition'
);
assert.ok(
  transfer.indexOf('hideTransientPlayerFeedback();') < transfer.indexOf('ensurePlayerFeedback();'),
  'stale flash/preview cleared before player HUD becomes visible'
);
const exit = region('    function leavePlayer(reason) {', '    function possessRandom() {');
assert.match(exit, /hidePlayerPresentation\(\)/);
console.log('PASS #456 R2 presentation transfer reset, stale hit/damage/shot clearing and leave cleanup');
