#!/usr/bin/env node
'use strict';
/* Static contract check: Audio Lab must stay presentation-only and deployable.
   Native audio correctness still requires the Playwright probe on a hosted preview. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function read(p) {
  return fs.readFileSync(path.join(root, p), 'utf8');
}

const lab = read('battle/audio-lab.js');
const html = read('battle/audio_lab.html');
const sim = read('battle/battle-sim.js');
const deploy = read('scripts/prepare_incremental_deploy.py');
const preview = read('preview.php');
const probe = read('scripts/probes/probe_audio_lab.cjs');

new Function(lab);
new Function(probe.replace(/^#![^\n]*\n/, ''));
assert.match(sim, /buildWeaponAudio:\s*buildWeaponAudio/, 'audio lab uses real shared weapon pool factory');
assert.match(
  lab,
  /BattleSim\.buildWeaponAudio\(scene, audioBase, \{ farVoices: farVoices \}\)/,
  'real weapon audio pool instantiated with optional A/B far floor'
);
assert.match(lab, /poolPolicy: \{ farVoices: farVoices/, 'pool experiment recorded in native report');
assert.match(sim, /policy\s*&&\s*policy\.farVoices/, 'shipping far-pool floor is overridden only explicitly');
assert.match(sim, /Math\.min\(64, Math\.floor\(\+policy\.farVoices\)/, 'distant pool override bounded at 64');
assert.match(
  lab,
  /Math\.min\(64, Math\.floor\(Number\(query\.get\('farVoices'\)\)/,
  'lab offers 64 distant voices as stress-only override'
);
assert.match(lab, /BattleAudioScheduler\.enqueue\(audio,/, 'real propagation scheduler used');
assert.doesNotMatch(lab, /BattleSim\.start\(|spawnAll\(|updateSoldier\(/, 'no combat ownership effects');
const full = read('battle/full-audio-stress.js');
new Function(full);
assert.match(lab, /BattleFullAudioStress\.create/, 'new full-mix mode installs real audio owners');
assert.match(lab, /fullMixRunner\.step\(simSeconds\)/, 'audio owners driven under synthetic load');
for (const owner of ['BattleWeaponFoley', 'BattleCombatAudio', 'BattleGrenadeAudio'])
  assert.match(full, new RegExp('root\\.' + owner + '\\.install\\(sim,'), owner + ' production audio code');
assert.match(full, /BattleVoiceScheduler\.enqueue/, 'voice runtime exercised');
assert.match(full, /sim\.onGrenadeBurst/, 'grenade explosion audio invoked');
assert.match(full, /sim\.onShot/, 'ballistic audio invoked');
assert.match(full, /catalogPlayed/, 'catalog coverage separately measured');
assert.match(lab, /audibleOutputSamples:/, 'nonzero master output verification');
assert.match(html, /full-audio-stress\.js/, 'full-mix companion loaded');
assert.match(read('battle/modules/00a-audio-mix.js'), /fullMix=1/, 'lab opt-in uses battle compressor');
assert.match(lab, /us:\s*\['rifle'/);
assert.match(lab, /ge:\s*\['rifle'/);
assert.match(lab, /Number\(query\.get\('squads'\)\) \|\| 5/, 'default five squads per side');
assert.match(lab, /root\.BattleAudioScheduler\.stats/, 'real scheduler admission statistics sampled');
assert.match(lab, /root\.BattleAudioScheduler\.lanes/, 'separate near and distant queues are reported');
const scheduler = read('battle/acoustics.js');
const acoustics = read('battle/modules/12a-listener-acoustics.js');
assert.match(scheduler, /audioQueues=dual/, 'dual-queue experiment is opt-in');
assert.match(scheduler, /maxActiveDrainGapMs/, 'scheduler records RAF stalls under load');
assert.match(scheduler, /maxDueLatenessMs/, 'scheduler records overdue sound playback');
assert.match(lab, /pageVisibility:/, 'report samples tab visibility');
assert.match(lab, /schedulerSinceDrainMs:/, 'report identifies ongoing stalled RAF callbacks');

assert.match(
  scheduler,
  /LANE_CAPACITY = Math\.floor\(MAX_QUEUE \/ 2\)/,
  'dual lanes split the bounded scheduler capacity without changing its default'
);
assert.match(acoustics, /acousticPriority=1/, 'priority acoustics experiment is opt-in');
assert.match(acoustics, /stats\.replacedCapacity\+\+/, 'priority preemption telemetry');
assert.match(acoustics, /acousticHoldMs/, 'bounded optional minimum acoustic record residence');
assert.match(acoustics, /linearRampToValueAtTime/, 'displaced reverb send ramps instead of snapping');
assert.match(
  lab,
  /acousticHoldMs: root\.BattleListenerAcoustics/,
  'lab records acoustic residence A/B option'
);
assert.match(sim, /maxClipSeconds:/, 'lab pool summaries expose decoded weapon sample length');

assert.match(lab, /acousticPriority: !!/, 'acoustic priority mode is reported');
assert.match(acoustics, /acousticSlots=/, 'listener acoustic cap accepts explicit research-only overrides');
assert.match(acoustics, /acousticTickTotalMs/, 'listener acoustic tick CPU cost is measured');
assert.match(scheduler, /audioQueue=/, 'scheduler research queue cap is independently selectable');
assert.match(
  scheduler,
  /audioStarts=/,
  'scheduler research starts-per-frame budget is independently selectable'
);
assert.match(scheduler, /: 16,/, 'single-queue normal battle uses the 16-start budget');
assert.match(scheduler, /Math\.min\(32,/, 'explicit upper ceiling stays bounded');
assert.match(
  lab,
  /maxAcousticActive: max\('acousticActive'\)/,
  'native lab records peak occupied acoustic tracking slots'
);

assert.match(lab, /audio\.detail\(\)/, 'per-model near and distant audio pool pressure included');
assert.match(sim, /detail: function \(\)/, 'shipping model pool exposes read-only detail snapshot');
for (const property of [
  'simulatedShots',
  'audioContextState',
  'activeVoices',
  'droppedBusy',
  'squadsPerSide',
  'schedulerEvictedPrimary',
  'schedulerCulled',
  'occlusionMode',
  'droppedNotReady',
  'propagationQueue',
  'rms',
  'peak',
  'longTasks'
])
  assert.ok(lab.includes(property), 'missing history field: ' + property);
for (const script of [
  'core-runtime.js',
  'weapons.js',
  'acoustics.js',
  'obstacle-field.js',
  'modules/00-audio-format.js',
  'modules/00a-audio-mix.js',
  'modules/12a-listener-acoustics.js',
  'modules/11-voice-variation.js',
  'modules/15-weapon-foley-audio.js',
  'modules/15-combat-audio.js',
  'modules/24a-grenade-audio.js',
  'battle-sim.js',
  'full-audio-stress.js',
  'audio-lab.js'
])
  assert.ok(html.includes('src="' + script + '"'), 'lab missing required runtime: ' + script);
assert.ok(
  !deploy.includes('"audio_lab.html"') && !deploy.includes('"audio-lab.js"'),
  'diagnostic audio lab must stay preview-only'
);
assert.match(preview, /audio_lab\\\.html/, 'preview launcher not staging lab page');
assert.match(probe, /--autoplay-policy=no-user-gesture-required/, 'headless playback requires autoplay');
console.log(
  'PASS: audio lab JS syntax, existing pool ownership, 10v10 roster, telemetry and deploy contract'
);

// Verify test-only backpressure and transport retry without fetching any assets.
(async () => {
  const delivery = require('./lib/audio-test-delivery.cjs');
  let inFlight = 0,
    peak = 0,
    forwarded = 0;
  const limited = delivery(2, async () => {});
  await Promise.all(
    Array.from({ length: 7 }, (_, id) =>
      limited.handle({
        request: () => ({ url: () => 'https://test/clip-' + id }),
        async fetch() {
          inFlight++;
          peak = Math.max(peak, inFlight);
          await new Promise(resolve => setImmediate(resolve));
          inFlight--;
          return { id };
        },
        async fulfill({ response }) {
          assert.equal(response.id, id);
          forwarded++;
        },
        async abort() {
          assert.fail('successful real responses must not be aborted');
        }
      })
    )
  );
  await limited.idle();
  assert.equal(peak, 2);
  assert.equal(forwarded, 7);
  for (const kind of ['recover', 'refused', 'http404', 'other']) {
    const guard = delivery(1, async () => {});
    let calls = 0,
      aborted = 0,
      status;
    await guard.handle({
      request: () => ({ url: () => 'https://test/clip.mp3' }),
      async fetch() {
        calls++;
        if (kind === 'refused' || (kind === 'recover' && calls < 3)) throw Error('ECONNREFUSED');
        if (kind === 'other') throw Error('TLS failure');
        return { status: kind === 'http404' ? 404 : 200 };
      },
      async fulfill({ response }) {
        status = response.status;
      },
      async abort() {
        aborted++;
      }
    });
    assert.equal(calls, ['recover', 'refused'].includes(kind) ? 3 : 1);
    assert.equal(aborted, ['refused', 'other'].includes(kind) ? 1 : 0);
    if (kind === 'http404') assert.equal(status, 404, 'missing files stay failed HTTP responses');
    if (kind === 'recover') assert.equal(status, 200);
    assert.equal(guard.stats.failures.length, aborted);
  }
  console.log('PASS: bounded audio delivery, transient recovery, exhausted refusal and unchanged HTTP 404');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
