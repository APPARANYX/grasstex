#!/usr/bin/env node
'use strict';
/* GitHub-served battle must use exactly the same player/controller bootstrap
   as the local deployed page, otherwise Start-hold menu never loads live. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '../..');
const remote = fs.readFileSync(path.join(dir, 'battle_sim.php'), 'utf8');
const local = fs.readFileSync(path.join(dir, 'battle_sim_local.php'), 'utf8');
const html = fs.readFileSync(path.join(dir, 'battle/battle_sim.html'), 'utf8');
assert.match(html, /var target=new BABYLON\.Vector3\(scenario\.center/);
assert.match(html, /WASD pan enabled/);
assert.match(local, /BattleDesktopCamera\.create\(/, 'local bootstrap already hosts controller menu');
assert.match(remote, /\$cameraPattern\s*=/, 'remote loader recognizes original camera bootstrap');
assert.match(remote, /\$body\s*=\s*preg_replace\(\$cameraPattern,\s*\$cameraReplacement/, 'remote loader replaces fallback camera');
assert.match(remote, /BattleDesktopCamera\.create\(/, 'remote loader mounts player camera controls');
assert.match(remote, /array\('camera-controls\.js','acoustics\.js'/, 'camera controls are loaded before the battle opens');
assert.match(remote, /\$replacementCount === 1 && \$cameraCount === 1/, 'remote loader verifies camera injection');
console.log('battle-loader-player-camera-check: PASS');
