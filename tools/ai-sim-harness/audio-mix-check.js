#!/usr/bin/env node
'use strict';
/* Contract for local mix gain, persistence, transient clamping and a single
   safe compressor insertion into Babylon's main SoundTrack. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../../battle/modules/00a-audio-mix.js'), 'utf8');

function fixture(query) {
  const saved = {};
  const calls = [];
  const timers = [];
  const ctx = {
    createDynamicsCompressor() {
      calls.push('compressor');
      return {
        threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 0 },
        attack: { value: 0 }, release: { value: 0 },
        connect(to) { calls.push('compressor.connect'); this.to = to; },
        disconnect() { calls.push('compressor.disconnect'); }
      };
    }
  };
  const master = {};
  const track = {
    disconnect(to) { assert.equal(to, master); calls.push('track.disconnect'); },
    connect(to) { calls.push('track.connect'); this.to = to; }
  };
  const scene = { mainSoundTrack: { _outputAudioNode: null } };
  const win = {
    BABYLON: { Engine: { audioEngine: { audioContext: ctx, masterGain: master } } },
    location: { search: query || '' },
    localStorage: {
      getItem(key) { return saved[key] || null; },
      setItem(key, v) { saved[key] = v; }
    },
    setTimeout(fn) { timers.push(fn); },
    window: null
  };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(code, win);
  return {
    api: win.BattleAudioMix, calls, scene, track, ctx, master, saved,
    supply() { scene.mainSoundTrack._outputAudioNode = track; },
    timers,
    flush() { while (timers.length) timers.shift()(); }
  };
}
const w = fixture();
const a = w.api;
assert.equal(a.get().master, 100, '100% is the louder default mix');
assert.equal(a.gain('weapon', 0.10).toFixed(3), '0.180', 'near shots gain +5.1 dB');
assert.equal(a.gain('voice', 0.10).toFixed(3), '0.165', 'voice presence rises');
assert.equal(a.gain('combat', 0.10).toFixed(3), '0.130', 'combat is less boosted');
assert.equal(a.gain('foley', 0.10).toFixed(3), '0.125', 'handling remains below reports');
assert.equal(a.gain('weapon', 5), 1, 'no individual emitter exceeds unity');
a.set('master', 50);
assert.equal(a.gain('weapon', 0.1), 0.09, 'master affects weapons');
assert.equal(a.gain('voice', 0.2), 0.165, 'master affects voices');
a.set('weapons', 0);
assert.equal(a.gain('weapon', 0.2), 0, 'weapons mute independently');
assert.ok(JSON.parse(w.saved['grasstex.audioMix.v1']).weapons === 0, 'settings persist');
a.set('voices', 9999);
assert.equal(a.get().voices, 150, 'out-of-range values constrained');
a.reset();
assert.equal(a.get().master, 100, 'reset restores louder mix');
assert.equal(a.get().weapons, 100, 'reset restores weapon fader');
a.ensureLimiter(w.scene);
assert.equal(w.calls.length, 0, 'before track initialization no rewiring');
w.supply();
w.flush();
assert.equal(a.stats.routed, 1, 'lazy limiter installed after track readiness');
assert.equal(w.calls.filter(x => x === 'track.disconnect').length, 1, 'one direct connection removed');
assert.equal(w.track.to.threshold.value, -16, 'conservative compression threshold');
assert.equal(w.track.to.ratio.value, 2.5, 'mild compression ratio');
assert.equal(w.track.to.to, w.master, 'compressor returns to original bus');
a.ensureLimiter(w.scene);
assert.equal(w.calls.filter(x => x === 'track.disconnect').length, 1, 'no duplicate compressor');
const legacy = fixture('?audioMix=legacy');
legacy.supply();
assert.equal(legacy.api.gain('weapon', 0.11, legacy.scene), 0.11, 'URL bypass preserves dry baseline');
assert.equal(legacy.calls.length, 0, 'legacy mode does not rewire audio');
console.log('audio-mix-check: PASS');
