#!/usr/bin/env node
'use strict';

/* Audit #456 R5: the panel's immutable markup and CSS must be byte-for-byte
   identical to the original shipping expressions, including all controls. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../battle/modules/98-damage-range.js'), 'utf8');
const first = source.indexOf('  function rangePanelCss()');
const last = source.indexOf('  function setup(sim)', first);
assert.ok(first > 0 && last > first, 'templates are pure and outside setup');
const templates = new Function(
  source.slice(first, last) + 'return { css: rangePanelCss(), html: rangePanelMarkup() };'
)();
function fingerprint(s) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) hash = Math.imul(hash ^ s.charCodeAt(i), 0x01000193);
  return (hash >>> 0).toString(16);
}
assert.equal(templates.css.length, 2063, 'CSS length changed from shipping baseline');
assert.equal(fingerprint(templates.css), 'a063532e', 'CSS bytes changed from shipping baseline');
assert.equal(templates.html.length, 1390, 'markup length changed from shipping baseline');
assert.equal(fingerprint(templates.html), 'edd6bab3', 'markup bytes changed from shipping baseline');
for (const id of [
  'rangeControls',
  'rangeTarget',
  'rangeZone',
  'rangeExit',
  'rangeOrbit',
  'rangeAuto',
  'rangeFps',
  'rangeFire',
  'rangeBurst',
  'rangeKill',
  'rangeClear',
  'rangeReset'
]) {
  assert.ok(templates.html.includes('id="' + id + '"'), 'missing range control ' + id);
}
assert.match(source, /style\.textContent = rangePanelCss\(\)/);
assert.match(source, /p\.innerHTML = rangePanelMarkup\(\)/);
console.log('PASS #456 R5 panel templates match original CSS/HTML fingerprints and all control IDs');
