#!/usr/bin/env node
'use strict';
/* Regression contract: shared shot buffers must retain negotiated audio format and
   wait until format probing finishes before constructing Babylon sounds. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../battle/battle-sim.js'), 'utf8');
const section = source.slice(
  source.indexOf('function buildWeaponAudio'),
  source.indexOf('function makeFaction')
);
assert.match(section, /clipUrl\(audioBase\s*\+\s*files\[i\]\)/, 'each take uses selected audio format');
assert.match(
  section,
  /F\.state\s*===\s*'probing'\s*&&\s*F\.ready/,
  'format detection finishes before pools are built'
);
assert.match(section, /getAudioBuffer/, 'decoded take is reused');
assert.match(
  section,
  /new BABYLON\.Sound\(key\s*\+\s*'Sfx'\s*\+\s*k,\s*buf,\s*scene,\s*null,\s*opts\)/,
  'extra voices reuse decoded buffer'
);
assert.match(section, /voices\[k\]\s*=/, 'extra voices keep stable playback slots');
assert.match(section, /if\s*\(!voice\)\s*(?:return|\{)/, 'not-yet-ready voices are guarded');

/* Babylon 9's Sound.play() can create another underlying instance while
   isPlaying is true. Instrument that behavior rather than treating a Sound
   object as an implicit one-voice cap. Pool reuse must also leave the prior
   report's spatial position and gain untouched until it actually ends. */
function poolFixture(policy) {
  const sounds = [];
  const engine = { unlocked: true };
  class Sound {
    constructor(name, input, scene, ready, opts) {
      this.name = name;
      this.ready = false;
      this.onReady = ready;
      this.isPlaying = false;
      this.plays = 0;
      this.busyWrites = 0;
      this.options = opts;
      sounds.push(this);
    }
    isReady() {
      return this.ready;
    }
    getAudioBuffer() {
      return { duration: 2 };
    }
    setPosition(position) {
      if (this.isPlaying) this.busyWrites++;
      this.position = { ...position };
    }
    setVolume(gain) {
      if (this.isPlaying) this.busyWrites++;
      this.gain = gain;
    }
    setPlaybackRate() {
      if (this.isPlaying) this.busyWrites++;
    }
    play() {
      this.plays++;
      this.isPlaying = true;
    }
  }
  const root = {
    BATTLE_AUDIO_MANIFEST: {
      categories: {
        'weapon.m1-garand': {
          fire: ['near-1.mp3', 'near-2.mp3', 'near-3.mp3'],
          fireDistant: ['far-1.mp3', 'far-2.mp3', 'far-3.mp3']
        }
      }
    },
    BattleWeapons: { PROFILES: { us: { rifle: { model: 'm1-garand' } } } }
  };
  const ctx = { root, BABYLON: { Sound, Engine: { audioEngine: engine } } };
  vm.createContext(ctx);
  vm.runInContext(
    source.slice(source.indexOf('var POOL_SIZE ='), source.indexOf('function makeFaction')),
    ctx
  );
  const audio = ctx.buildWeaponAudio({ activeCamera: { position: { x: 0, y: 2, z: 0 } } }, 'audio/', policy);
  return {
    audio,
    engine,
    sounds,
    load() {
      // Shared-buffer extras are constructed by the first take's ready callback.
      for (let i = 0; i < sounds.length; i++) {
        sounds[i].ready = true;
        if (sounds[i].onReady) sounds[i].onReady();
      }
    },
    shoot(distance, count) {
      for (let i = 0; i < count; i++) audio.play('m:m1-garand', { x: i, y: 1.4, z: distance }, 0.2, 1);
    },
    plays() {
      return sounds.reduce((n, s) => n + s.plays, 0);
    }
  };
}

for (const [distance, capacity] of [
  [40, 6],
  [200, 30],
  [100, 36]
]) {
  const w = poolFixture();
  w.load();
  w.shoot(distance, 30);
  assert.equal(w.plays(), capacity, distance + 'm: dense fire remains within ready near/far slots');
  assert.equal(w.audio.summary().active, capacity, 'diagnostics reflect actual playing Sound slots');
  assert.ok(
    w.sounds.every(s => s.plays <= 1),
    'busy Sound never acquires overlapping playback'
  );
  assert.ok(
    w.sounds.every(s => s.busyWrites === 0),
    'prior shots retain position, gain and rate'
  );
  if (distance === 40) {
    const nearPool = w.audio.detail()['m:m1-garand'];
    assert.equal(nearPool.capacity, 6, 'near-pool telemetry preserves the existing capacity');
    assert.equal(nearPool.maxClipSeconds, 2, 'per-model clip duration reflects actual decoded buffer');
    assert.equal(nearPool.minClipSeconds, 2, 'per-model sample variation is measured, not assumed');
    assert.equal(nearPool.attempts, 30, 'every near-pool request is accounted for');
    assert.equal(nearPool.started, 6, 'real successful near starts are tracked per model');
    assert.equal(nearPool.droppedBusy, 24, 'saturated near-pool drops are reported per model');
    const available = w.sounds.find(s => s.name === 'm:m1-garandSfx2');
    available.isPlaying = false; // real completion, later than the old 0.9s estimate
    w.shoot(distance, 1);
    assert.equal(available.plays, 2, 'find a completed slot even when the cursor points to a busy one');
    assert.equal(w.plays(), capacity + 1, 'new fire resumes as soon as a slot completes');
  }
}
{
  const w = poolFixture();
  w.shoot(40, 10);
  assert.equal(w.plays(), 0, 'unready sounds cannot accumulate deferred playback');
  assert.equal(w.audio.summary().droppedNotReady, 10);
  w.load();
  w.shoot(40, 1);
  assert.equal(w.plays(), 1, 'loading completion permits the first actual report');
}
{
  const w = poolFixture();
  w.load();
  w.engine.unlocked = false;
  w.shoot(40, 30);
  assert.equal(w.plays(), 0, 'locked audio cannot build a deferred-start backlog outside the pool cap');
  assert.equal(w.audio.summary().droppedLocked, 30);
  w.engine.unlocked = true;
  w.shoot(40, 1);
  assert.equal(w.plays(), 1, 'normal fire resumes after the audio gesture unlock');
}
// prettier-ignore
{
  const w = poolFixture({ farVoices: 64 });
  w.load();
  w.shoot(200, 90);
  const far = w.audio.detail()['m:m1-garand:far'];
  assert.equal(far.capacity, 64, '64 distant voices are available only when explicitly requested');
  assert.equal(far.started, 64, 'each distant voice may play once, without overlapping Sound instances');
  assert.equal(far.droppedBusy, 26, 'overflow beyond 64 is bounded and accounted for');
  assert.equal(w.audio.summary().active, 64);
  assert.ok(w.sounds.every(s => s.plays <= 1 && s.busyWrites === 0));
}
// prettier-ignore
{
  const w = poolFixture({ farVoices: 1024 });
  assert.equal(w.audio.detail()['m:m1-garand:far'].capacity, 64,
    'even an untrusted override cannot exceed the 64-slot cap');
}
// prettier-ignore
{
  const w = poolFixture();
  assert.equal(w.audio.detail()['m:m1-garand:far'].capacity, 32,
    'normal battle default uses measured 32-voice distant model pool');
}
console.log('weapon-shot-buffer-check: format, sharing and bounded dense playback passed');
