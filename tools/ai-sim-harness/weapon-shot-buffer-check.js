#!/usr/bin/env node
'use strict';
/* Regression contract: shared shot buffers must retain negotiated audio format and
   wait until format probing finishes before constructing Babylon sounds. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../battle/battle-sim.js'), 'utf8');
const section = source.slice(
  source.indexOf('function buildWeaponAudio'),
  source.indexOf('function makeFaction')
);
const compact = section.replace(/\s+/g, '');
assert.match(compact, /clipUrl\(audioBase\+files\[i\]\)/, 'each take uses selected audio format');
assert.match(compact, /F\.state==='probing'&&F\.ready/, 'format detection finishes before pools are built');
assert.match(compact, /getAudioBuffer/, 'decoded take is reused');
assert.match(
  compact,
  /newBABYLON\.Sound\(key\+'Sfx'\+k,buf,scene,null,opts\)/,
  'extra voices reuse decoded buffer'
);
assert.match(compact, /voices\[k\]=/, 'extra voices keep stable playback slots');
assert.match(compact, /if\(!voice\)return/, 'not-yet-ready voices do not crash playback');
console.log('weapon-shot-buffer-check: format and sharing contract passed');
