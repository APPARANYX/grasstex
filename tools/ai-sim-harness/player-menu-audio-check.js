#!/usr/bin/env node
'use strict';
/* Static menu/controller contract alongside player-control-check's real 650ms
   Start gesture: two tabs and four persistent mix faders, no game logic changes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const camera = fs.readFileSync(path.join(__dirname, '../../battle/camera-controls.js'), 'utf8');
const mix = fs.readFileSync(path.join(__dirname, '../../battle/modules/00a-audio-mix.js'), 'utf8');
assert.match(
  camera,
  /menuHoldGesture\(menuHoldState,[\s\S]*?buttonValue\(pad, 9\)/,
  'Start-hold still drives the original modal'
);
assert.match(camera, /padPressedOnce\(pad, 4\)\) showMenuTab\(menuTab - 1\)/, 'LB previous tab');
assert.match(camera, /padPressedOnce\(pad, 5\)\) showMenuTab\(menuTab \+ 1\)/, 'RB next tab');
assert.match(camera, /var rows = menuFields\(\)/, 'D-pad navigation scopes to active tab');
assert.match(camera, /if \(menuTab === 1\)/, 'audio input path distinct from possession path');
assert.match(camera, /changeMenuAudio\(\s*key,[\s\S]{0,500}delta \* 5/, 'D-pad adjusts by 5%');
assert.match(
  camera,
  /if \(padPressedOnce\(pad, 0\)\) changeMenuAudio\(key, 100\)/,
  'A resets focused audio slider'
);
assert.match(camera, /if \(padPressedOnce\(pad, 1\)\)[\s\S]*?closePlayerMenu\(\)/, 'B closes settings');
assert.match(camera, /#bpmPlayerPane/, 'player selectors remain a distinct tab');
assert.match(camera, /#bpmAudioPane/, 'audio levels have a distinct tab');
['bpmMaster', 'bpmWeapons', 'bpmVoices', 'bpmEffects'].forEach(id =>
  assert.ok(camera.includes('id="' + id + '"'), 'missing input: ' + id)
);
assert.match(
  camera,
  /\.addEventListener\('input',[\s\S]*?changeMenuAudio/,
  'touch/mouse sliders change the mix immediately'
);
assert.match(mix, /localStorage\.setItem/, 'audio levels persisted locally');
assert.match(
  camera,
  /if \(menuOpen\) \{[\s\S]*?stepPlayerMenuPad\(pad\)/,
  'menu intercepts pad before firing / sprint'
);

// Skills Lab Play/Step has its own control path: it must unlock audio before
// resuming/advancing, independently of the ordinary battle Start button.
const html = fs.readFileSync(path.join(__dirname, '../../battle/battle_sim.html'), 'utf8');
const skills = fs.readFileSync(path.join(__dirname, '../../battle/skills-lab.js'), 'utf8');
const sim = fs.readFileSync(path.join(__dirname, '../../battle/battle-sim.js'), 'utf8');
assert.match(html, /window\.__battleUnlockAudio__=unlockAudio/, 'shared browser audio activation exported');
assert.match(
  html,
  /await Promise\.all\(\[resuming,unlocking\]\)/,
  'native resume and engine unlock complete before running'
);
assert.match(html, /window\.__battleAudioDiagnostics__=/, 'live audio diagnostics exposed');
assert.match(
  skills,
  /play\.onclick = async function \(\)[\s\S]*?await root\.__battleUnlockAudio__\(\)[\s\S]*?setRunning/,
  'Skills Lab Play unlocks audio before resuming'
);
assert.match(
  skills,
  /#skillStep'[\s\S]*?await root\.__battleUnlockAudio__\(\)[\s\S]*?advance\(1\)/,
  'Skills Lab Step unlocks audio before simulating'
);
assert.match(
  sim,
  /ctx \? ctx\.state !== 'running' : ae && ae\.unlocked === false/,
  'running WebAudio context does not discard shots on stale unlocked flag'
);

console.log('player-menu-audio-check: PASS');

// Execute the real startup function: void unlock(), native resume, and missing context.
const unlockSource = html.slice(
  html.indexOf('  async function unlockAudio(){'),
  html.indexOf('  window.__battleUnlockAudio__')
);
async function checkUnlock() {
  const calls = [];
  let resolveResume;
  const ctx = {
    state: 'suspended',
    resume() {
      calls.push('resume');
      return new Promise(resolve => {
        resolveResume = resolve;
      });
    }
  };
  const ae = {
    audioContext: ctx,
    unlocked: false,
    unlock() {
      calls.push('unlock');
      if (ctx.state === 'running') this.unlocked = true;
    }
  };
  const getUnlock = engine =>
    new Function(
      'BABYLON',
      'window',
      'console',
      'enableLiveAudioMeter',
      unlockSource + '; return unlockAudio;'
    )({ Engine: { audioEngine: engine } }, {}, { log() {}, warn() {}, error() {} }, () => {});
  const promise = getUnlock(ae)();
  assert.deepEqual(calls, ['resume', 'unlock'], 'both calls happen synchronously inside the gesture');
  ctx.state = 'running';
  resolveResume();
  assert.equal(await promise, true);
  assert.equal(ae.unlocked, true, 'Babylon flag synchronized after native resume');
  assert.equal(await getUnlock({ unlock() {} })(), false, 'missing context is not successful audio startup');
  assert.equal(
    await getUnlock({ audioContext: { state: 'suspended', resume: async () => {} }, unlock() {} })(),
    false
  );
  assert.equal(
    await getUnlock({
      audioContext: {
        state: 'closed',
        resume: async () => {
          throw Error('closed');
        }
      },
      unlock() {}
    })(),
    false
  );
  console.log('audio startup lifecycle: PASS');
}
checkUnlock().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
