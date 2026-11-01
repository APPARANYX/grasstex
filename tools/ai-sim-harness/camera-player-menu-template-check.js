#!/usr/bin/env node
'use strict';

/* #456 R2: freeze the original player-settings HTML/CSS and all controls.
   The refactor must not alter tabs, haptics, possession or volume selectors. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../battle/camera-controls.js'), 'utf8');
const first = source.indexOf('  function playerMenuStyles()');
const last = source.indexOf('  function createDesktopFly(', first);
assert.ok(first > 0 && last > first, 'menu templates are outside createDesktopFly');
const templates = new Function(
  source.slice(first, last) + 'return { css: playerMenuStyles(), html: playerMenuMarkup() };'
)();
function fingerprint(s) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) hash = Math.imul(hash ^ s.charCodeAt(i), 0x01000193);
  return (hash >>> 0).toString(16);
}
assert.equal(templates.css.length, 1756);
assert.equal(fingerprint(templates.css), 'd0817214', 'CSS diverged from shipping main');
assert.equal(templates.html.length, 2217);
assert.equal(fingerprint(templates.html), 'f7853f72', 'HTML diverged from shipping main');
for (const id of [
  'bpmTabPlayer',
  'bpmTabAudio',
  'bpmPlayerPane',
  'bpmAudioPane',
  'bpmFaction',
  'bpmSquad',
  'bpmSoldier',
  'bpmHaptics',
  'bpmMaster',
  'bpmWeapons',
  'bpmVoices',
  'bpmEffects',
  'bpmResetAudio',
  'bpmApply',
  'bpmClose'
]) {
  assert.ok(templates.html.includes('id="' + id + '"'), 'missing settings control ' + id);
}
assert.match(source, /style\.textContent = playerMenuStyles\(\)/);
assert.match(source, /settingsMenu\.innerHTML = playerMenuMarkup\(\)/);
console.log('PASS #456 R2 player menu CSS/HTML fingerprints and all input/control IDs');
