#!/usr/bin/env node
'use strict';
/* Regression contract: shared shot buffers must retain negotiated audio format and
   wait until format probing finishes before constructing Babylon sounds. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../battle/battle-sim.js'), 'utf8');
const section = source.slice(source.indexOf('function buildWeaponAudio'), source.indexOf('function makeFaction'));
assert.match(section, /clipUrl\(audioBase\+files\[i\]\)/, 'each take uses selected audio format');
assert.match(section, /F\.state==='probing'&&F\.ready/, 'format detection finishes before pools are built');
assert.match(section, /getAudioBuffer/, 'decoded take is reused');
assert.match(section, /new BABYLON\.Sound\(key\+'Sfx'\+k,buf,scene,null,opts\)/, 'extra voices reuse decoded buffer');
assert.match(section, /voices\[k\]=/, 'extra voices keep stable playback slots');
assert.match(section, /if\(!voice\)return/, 'not-yet-ready voices do not crash playback');
console.log('weapon-shot-buffer-check: format and sharing contract passed');
