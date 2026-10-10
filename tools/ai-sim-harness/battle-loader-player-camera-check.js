#!/usr/bin/env node
'use strict';
/* Both entry points must mount the controller camera, not the ArcRotate fallback. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '../..');
const remote = fs.readFileSync(path.join(dir, 'battle_sim.php'), 'utf8');
const local = fs.readFileSync(path.join(dir, 'battle_sim_local.php'), 'utf8');
const html = fs.readFileSync(path.join(dir, 'battle/battle_sim.html'), 'utf8');
assert.match(html, /var target=new BABYLON\.Vector3\(scenario\.center/);
assert.match(html, /WASD pan enabled/);
assert.ok(local.includes('BattleDesktopCamera.create('), 'local menu');
assert.match(remote, /\$cameraPattern\s*=/, 'camera matcher');
assert.match(remote, /preg_replace\(\$cameraPattern,\s*\$cameraReplacement/, 'camera swap');
assert.ok(remote.includes('BattleDesktopCamera.create('), 'remote menu');
assert.ok(remote.includes("array('camera-controls.js','acoustics.js'"), 'module order');
assert.match(remote, /\$replacementCount === 1 && \$cameraCount === 1/, 'fail closed');
console.log('battle-loader-player-camera-check: PASS');
