#!/usr/bin/env node
'use strict';
/* Execute the real audio propagation scheduler in a deterministic VM. This is
   presentation-only; no combat, Babylon renderer, or licensed clips are needed. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const runtime = fs.readFileSync(path.join(__dirname, '../battle/acoustics.js'), 'utf8');

function fixture(randomValue) {
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
assert.equal(isolated.scheduler.limits.maxPerFrame, 2);
isolated.enqueue('test-rifle', 60);
isolated.frame(100);
assert.equal(isolated.played.length, 0, 'gunshot must respect real travel delay');
isolated.frame(220);
assert.equal(isolated.played.length, 1, 'gunshot must play after travel delay');
assert.equal(isolated.played[0].kind, 'test-rifle');

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
    assert.equal(started - lastStarts, 2, 'saturated queue must continue delivering imminent shots per frame');
  }
  lastStarts = loaded.scheduler.stats.startedPrimary;
  assert.ok(loaded.scheduler.queued <= 128, 'queue must remain bounded');
}
assert.ok(loaded.played.length > 350, 'sustained fire must not starve playback');
assert.ok(loaded.scheduler.stats.rejectedPrimary > 0, 'admission drops must be explicitly recorded');

const echoes = fixture(0);
for (let i = 0; i < 64; i++) echoes.enqueue('shot-' + i, 60);
assert.equal(echoes.scheduler.queued, 128, 'real echo behavior fills the bounded queue');
echoes.enqueue('new-primary', 60);
assert.ok(echoes.scheduler.stats.evictedEcho > 0, 'new gunshots must evict optional echoes first');
assert.equal(echoes.scheduler.stats.evictedPrimary, 0, 'primary gunshots survive optional echo pressure');

console.log('PASS: propagation delay, 128 bounded slots, near-due priority, 2 starts/frame, continuous overload playback and primary-over-echo admission');
