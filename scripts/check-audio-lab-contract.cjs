#!/usr/bin/env node
'use strict';
/* Static contract check: Audio Lab must stay presentation-only and deployable.
   Native audio correctness still requires the Playwright probe on a hosted preview. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8'); }

const lab = read('battle/audio-lab.js');
const html = read('battle/audio_lab.html');
const sim = read('battle/battle-sim.js');
const deploy = read('scripts/prepare_incremental_deploy.py');
const preview = read('preview.php');
const probe = read('scripts/probes/probe_audio_lab.cjs');

new Function(lab);
new Function(probe.replace(/^#![^\n]*\n/, ''));
assert.match(sim, /buildWeaponAudio:\s*buildWeaponAudio/, 'audio lab uses real shared weapon pool factory');
assert.match(lab, /BattleSim\.buildWeaponAudio\(scene, audioBase\)/, 'real weapon audio pool instantiated');
assert.match(lab, /BattleAudioScheduler\.enqueue\(audio,/, 'real propagation scheduler used');
assert.doesNotMatch(lab, /BattleSim\.start\(|spawnAll\(|updateSoldier\(/, 'no combat ownership effects');
assert.match(lab, /us:\s*\['rifle'/);
assert.match(lab, /ge:\s*\['rifle'/);
for (const property of ['simulatedShots', 'audioContextState', 'activeVoices', 'droppedBusy',
  'droppedNotReady', 'propagationQueue', 'rms', 'peak', 'longTasks'])
  assert.ok(lab.includes(property), 'missing history field: ' + property);
for (const script of ['core-runtime.js', 'weapons.js', 'acoustics.js',
  'modules/00-audio-format.js', 'modules/00a-audio-mix.js',
  'modules/12a-listener-acoustics.js', 'battle-sim.js', 'audio-lab.js'])
  assert.ok(html.includes('src="' + script + '"'), 'lab missing required runtime: ' + script);
assert.ok(deploy.includes('"audio_lab.html"') && deploy.includes('"audio-lab.js"'), 'deployment not managed');
assert.match(preview, /audio_lab\\\.html/, 'preview launcher not staging lab page');
assert.match(probe, /--autoplay-policy=no-user-gesture-required/, 'headless playback requires autoplay');
console.log('PASS: audio lab JS syntax, existing pool ownership, 10v10 roster, telemetry and deploy contract');
