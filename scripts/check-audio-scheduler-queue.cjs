#!/usr/bin/env node
'use strict';
/* Execute the real audio propagation scheduler in a deterministic VM. This is
   presentation-only; no combat, Babylon renderer, or licensed clips are needed. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const runtime = fs.readFileSync(path.join(__dirname, '../battle/acoustics.js'), 'utf8');

function fixture(randomValue, mode) {
  let timeMs = 0;
  const callbacks = [];
  const played = [];
  const root = { BattleVoiceScheduler: {}, GTLog() {} };
  const math = Object.create(Math);
  math.random = () => randomValue;
  const audio = { play(kind, pos, gain, rate) { played.push({ kind, timeMs, gain, rate }); } };
  vm.runInNewContext(runtime, {
    window: root,
    BABYLON: {},
    location: { search: mode === 'dual' ? '?audioQueues=dual' : (mode || '') },
    Math: math,
    performance: { now: () => timeMs },
    fetch: () => Promise.reject(new Error('fixture: no external acoustics config')),
    requestAnimationFrame: cb => callbacks.push(cb)
  }, { filename: 'battle/acoustics.js' });
  const camera = { position: { x: 0, y: 0, z: 0 } };
  return {
    scheduler: root.BattleAudioScheduler,
    played,
    enqueue(kind, meters) {
      root.BattleAudioScheduler.enqueue(audio, kind, { x: meters, y: 0, z: 0 }, camera);
    },
    frame(ms) {
      timeMs = ms;
      const current = callbacks.splice(0);
      current.forEach(cb => cb());
    }
  };
}

const isolated = fixture(.99);
assert.equal(isolated.scheduler.limits.maxQueue, 128);
assert.equal(isolated.scheduler.limits.maxPerFrame, 16);
isolated.enqueue('test-rifle', 60);
isolated.frame(100);
assert.equal(isolated.played.length, 0, 'gunshot must respect real travel delay');
isolated.frame(220);
assert.equal(isolated.played.length, 1, 'gunshot must play after travel delay');
assert.equal(isolated.played[0].kind, 'test-rifle');

// Detect a frozen requestAnimationFrame drain while an audio queue is pending.
// This matters when browsers pause RAF for hidden tabs but interval-driven shots continue.
const stalled = fixture(.99);
stalled.enqueue('stalled-near', 60);
stalled.frame(50);
stalled.frame(2200);
assert.ok(stalled.scheduler.stats.maxActiveDrainGapMs >= 2000,
  'RAF stalls are measured independently of pool-busy drops');
assert.ok(stalled.scheduler.stats.maxDueLatenessMs > 1900,
  'late gunshots are attributable to callbacks not draining on time');
assert.ok(stalled.scheduler.stats.drainFrames >= 2, 'scheduler records actual RAF callbacks');

const priority = fixture(.99);
// Production's far-model throttle requires >45 ms on the initial clock.
priority.frame(100);
for (let i = 0; i < 128; i++) priority.enqueue('far-' + i, 780);
assert.equal(priority.scheduler.queued, 128);
priority.enqueue('near', 60);
assert.equal(priority.scheduler.queued, 128, 'bounded queue must remain bounded');
assert.equal(priority.scheduler.stats.evictedPrimary, 1, 'near shot displaces a later-due primary');
priority.frame(330);
assert.equal(priority.played.length, 1, 'near shot is not starved by earlier-arriving distant shots');
assert.equal(priority.played[0].kind, 'near');

const loaded = fixture(.99);
let lastStarts = 0;
for (let i = 0; i < 220; i++) {
  const time = i * 16;
  for (let j = 0; j < 12; j++) loaded.enqueue('rifle', 60);
  loaded.frame(time);
  if (i >= 40) {
    const started = loaded.scheduler.stats.startedPrimary;
    assert.equal(started - lastStarts, 12, '16-start default drains all 12 due primary shots per frame');
  }
  lastStarts = loaded.scheduler.stats.startedPrimary;
  assert.ok(loaded.scheduler.queued <= 128, 'queue must remain bounded');
}
assert.ok(loaded.played.length > 1800, 'sustained fire must not starve playback');
assert.ok(loaded.scheduler.stats.rejectedPrimary > 0, 'admission drops must be explicitly recorded');

const echoes = fixture(0);
for (let i = 0; i < 64; i++) echoes.enqueue('shot-' + i, 60);
assert.equal(echoes.scheduler.queued, 128, 'real echo behavior fills the bounded queue');
echoes.enqueue('new-primary', 60);
assert.ok(echoes.scheduler.stats.evictedEcho > 0, 'new gunshots must evict optional echoes first');
assert.equal(echoes.scheduler.stats.evictedPrimary, 0, 'primary gunshots survive optional echo pressure');

console.log('PASS: propagation delay, 128 bounded slots, near-due priority, default 16 starts/frame, continuous overload playback and primary-over-echo admission');

const dual = fixture(.99, '?audioQueues=dual&audioStarts=2');
dual.frame(100); // make the real far-model throttling window eligible
assert.equal(dual.scheduler.limits.mode, 'dual');
assert.equal(dual.scheduler.limits.nearCapacity, 64);
assert.equal(dual.scheduler.limits.farCapacity, 64);
for (let i = 0; i < 64; i++) {
  dual.enqueue('near-' + i, 60);
  dual.enqueue('far-' + i, 185);
}
assert.equal(dual.scheduler.queued, 128);
assert.equal(dual.scheduler.lanes.near.queued, 64);
assert.equal(dual.scheduler.lanes.far.queued, 64);
dual.enqueue('new-near', 60);
dual.enqueue('new-far', 185);
assert.equal(dual.scheduler.lanes.near.rejected, 1, 'full near lane rejects later due incoming shots');
assert.equal(dual.scheduler.lanes.far.rejected, 1, 'full far lane rejects later due incoming shots');
assert.equal(dual.scheduler.lanes.far.queued, 64, 'near overflow cannot evict far events');
dual.frame(340);
assert.equal(dual.played.length, 2, 'with distant arrivals pending, near lane borrows both starts');
assert.ok(dual.played.every(x => x.kind.startsWith('near-')));
dual.frame(750);
assert.equal(dual.played.length, 4, 'two due lanes still share at most two starts per frame');
assert.ok(dual.played.slice(-2).some(x => x.kind.startsWith('near-')));
assert.ok(dual.played.slice(-2).some(x => x.kind.startsWith('far-')));
assert.equal(dual.scheduler.lanes.near.started, 3);
assert.equal(dual.scheduler.lanes.far.started, 1);
assert.equal(dual.scheduler.stats.startedPrimary, 4);

const dualNoFar = fixture(.99, '?audioQueues=dual&audioStarts=2');
for (let i = 0; i < 5; i++) dualNoFar.enqueue('near-only-' + i, 60);
dualNoFar.frame(250);
assert.equal(dualNoFar.played.length, 2, 'unused far lane capacity returns to near queue');
dualNoFar.frame(270);
assert.equal(dualNoFar.played.length, 4, 'near queue continues using both slots');

console.log('PASS: dual-queue opt-in, 64/64 limits, independent drops, 2 shared starts and per-lane accounting');

// Isolated scheduler stress with higher research-only event limits and start budgets.
const wide = fixture(.99, '?audioQueue=256&audioStarts=4');
assert.equal(wide.scheduler.limits.maxQueue, 256);
assert.equal(wide.scheduler.limits.maxPerFrame, 4);
for (let i = 0; i < 256; i++) wide.enqueue('wide-' + i, 60);
assert.equal(wide.scheduler.queued, 256);
wide.enqueue('overflow', 60);
assert.equal(wide.scheduler.queued, 256, 'higher queue remains bounded');
assert.equal(wide.scheduler.stats.rejectedPrimary, 1);
wide.frame(270);
assert.equal(wide.played.length, 4, 'explicit four-start scheduler budget is enforced');
wide.frame(290);
assert.equal(wide.played.length, 8, 'all queued primary events continue draining');
// An explicit 16-start setting admits 16 (not 2) eligible shots in one frame.
const sixteen = fixture(.99, '?audioStarts=16');
for (let i = 0; i < 32; i++) sixteen.enqueue('primary-' + i, 60);
sixteen.frame(300);
assert.equal(sixteen.played.length, 16, '16-shot budget starts 16 already-due primaries');
sixteen.frame(316);
assert.equal(sixteen.played.length, 32, 'the remaining 16 play on the next render frame');
assert.equal(sixteen.scheduler.limits.maxQueue, 128);
const maxed = fixture(.99, '?audioQueue=9999&audioStarts=9999');
assert.equal(maxed.scheduler.limits.maxQueue, 512, 'untrusted queue override has a ceiling');
assert.equal(maxed.scheduler.limits.maxPerFrame, 32, 'untrusted start override has a ceiling');
console.log('PASS: 256-event queue and 4-start legacy A/B, default 128/16, bounded 512/32 research ceilings');
