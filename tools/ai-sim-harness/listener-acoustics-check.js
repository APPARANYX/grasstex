#!/usr/bin/env node
'use strict';
/* Focused, audio-only contract: one listener, bounded source work, graceful legacy
   WebAudio fallback, terrain/obstacle muffling, and no writes into combat state. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE = fs.readFileSync(
  path.resolve(__dirname, '../../battle/modules/12a-listener-acoustics.js'),
  'utf8'
);

function world(mode, withGraph, flags) {
  let clock = 1000;
  const timers = [];
  let obstruct = false;
  const state = { touched: 0, random: 0 };
  const context = {
    sampleRate: 12000,
    currentTime: 0,
    destination: { connect() {} },
    createBiquadFilter() {
      return {
        context,
        type: 'allpass',
        frequency: {
          value: 0,
          setTargetAtTime(v) {
            this.value = v;
          }
        },
        connect() {},
        disconnect() {}
      };
    },
    createGain() {
      return {
        context,
        gain: {
          value: 0,
          ramps: 0,
          setTargetAtTime(v) {
            this.value = v;
          },
          cancelScheduledValues() {},
          setValueAtTime(v) {
            this.value = v;
          },
          linearRampToValueAtTime(v) {
            this.ramps++;
            this.value = v;
          }
        },
        connect() {}
      };
    },
    createBuffer(channels, length) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return {
        getChannelData(i) {
          return data[i];
        }
      };
    },
    createConvolver() {
      return { connect() {} };
    }
  };
  const graph = {
    context,
    connect() {},
    disconnect() {}
  };
  const sound = {
    _soundPanner: withGraph ? graph : undefined,
    getSoundGain() {
      return withGraph ? graph : null;
    },
    setVolume(v) {
      this.volume = v;
    }
  };
  const scene = {
    activeCamera: { position: { x: 0, y: 1.6, z: 0 } },
    metadata: { battleScenario: { buildings: [{ x: 10, z: 0, w: 12, d: 10 }] } }
  };
  const sim = {
    scene,
    obstacles: [],
    heightAt() {
      return obstruct ? 6 : -3;
    }
  };
  const ctx = {
    BABYLON: { Engine: { audioEngine: { masterGain: context.destination } } },
    location: { search: '?acoustics=' + mode + (flags || '') },
    console,
    performance: { now: () => clock },
    setTimeout(fn) {
      timers.push(fn);
    },
    BattleObstacleField: {
      sightBlocked() {
        return obstruct;
      }
    },
    BattleModules: { registerSystem() {} },
    window: null
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SOURCE, ctx);
  const api = ctx.BattleListenerAcoustics;
  api.bind(sim);
  return {
    api,
    sound,
    scene,
    state,
    context,
    position: { x: 40, y: 1.6, z: 0 },
    block(v) {
      obstruct = v;
    },
    move(x) {
      scene.activeCamera.position.x = x;
    },
    tick() {
      clock += 250;
      if (timers.length) timers.shift()();
    }
  };
}

{
  const w = world('standard', true);
  assert.equal(w.api.quality, 'standard');
  assert.equal(w.api.prepare(w.sound, w.position, 'gun', 0.2, w.scene), true);
  assert.equal(w.api.active, 1);
  assert.equal(w.api.stats.filtered, 1);
  const openVolume = w.sound.volume;
  const clearHz = w.context.createBiquadFilter().frequency.value; // new filters start neutral
  assert.equal(clearHz, 0);
  w.block(true);
  w.tick();
  assert.ok(w.sound.volume < openVolume, 'occlusion attenuates gunfire');
  assert.ok(w.api.stats.occluded > 0, 'obstruction registered');
  w.block(false);
  w.api.prepare(w.sound, w.position, 'gun', 0.2, w.scene);
  assert.equal(w.api.active, 1, 'a reused sound owns one acoustic slot');
  w.api.reset();
  assert.equal(w.api.active, 0, 'restart invalidates previously active emitters');
}
{
  const w = world('standard', false);
  assert.equal(w.api.prepare(w.sound, w.position, 'voice', 0.24, w.scene), true);
  assert.equal(w.api.stats.filtered, 0, 'unsupported Babylon graph degrades safely');
  assert.equal(w.sound.volume, 0.24, 'fallback retains dry intelligible audio');
}
{
  const w = world('standard', false);
  const bus = w.context.createGain();
  w.scene.mainSoundTrack = { _outputAudioNode: bus };
  w.sound._scene = w.scene;
  w.sound._soundV2 = { _outNode: w.context.createGain() };
  w.sound.getSoundGain = function () {
    return this._soundV2._outNode;
  };
  w.sound.connectToSoundTrackAudioNode = function (node) {
    this.routed = node;
  };
  assert.equal(w.api.prepare(w.sound, w.position, 'voice', 0.24, w.scene), true);
  assert.equal(w.api.stats.filtered, 1, 'AudioV2 SoundTrack rerouting inserts a filter');
  assert.ok(w.sound.routed && w.sound.routed !== bus, 'AudioV2 routes through the filter');
  const filter = w.sound.routed;
  w.api.reset();
  w.api.prepare(w.sound, w.position, 'voice', 0.24, w.scene);
  assert.equal(w.sound.routed, filter, 'restarts reuse the same filter');
  assert.equal(w.api.stats.filtered, 1, 'no duplicate AudioV2 audio nodes');
}
{
  const w = world('off', true);
  assert.equal(w.api.prepare(w.sound, w.position, 'gun', 0.2, w.scene), false);
  assert.equal(w.api.active, 0, 'off causes no audio graph work');
}
{
  const w = world('standard', true);
  for (let i = 0; i < 45; i++) {
    const s = { getSoundGain: w.sound.getSoundGain, _soundPanner: w.sound._soundPanner, setVolume() {} };
    w.api.prepare(s, { x: i + 15, y: 1.6, z: 0 }, 'gun', 0.2, w.scene);
  }
  assert.equal(w.api.active, 96, 'expanded standard cap admits 96 acoustic sources');
}
// prettier-ignore
{
  const w = world('standard', true, '&acousticPriority=1');
  assert.equal(w.api.priorityEnabled, true, 'priority admission is an explicit experiment');
  const sounds = [];
  for (let i = 0; i < 24; i++) {
    const far = {
      getSoundGain: w.sound.getSoundGain,
      _soundPanner: w.sound._soundPanner,
      setVolume(v) { this.volume = v; }
    };
    sounds.push(far);
    w.api.prepare(far, { x: 700 + i, y: 1.6, z: 0 }, 'gunDistant', 0.08, w.scene);
  }
  assert.equal(w.api.active, 24);
  const replaced = {
    getSoundGain: w.sound.getSoundGain,
    _soundPanner: w.sound._soundPanner,
    setVolume(v) { this.volume = v; }
  };
  assert.equal(w.api.prepare(replaced, { x: 15, y: 1.6, z: 0 }, 'gun', 0.2, w.scene), true,
    'close gunfire replaces the least important distant acoustic record');
  assert.equal(w.api.active, 24, 'priority selection never increases filter work budget');
  assert.equal(w.api.stats.replacedCapacity, 1);
  assert.equal(w.api.stats.skippedCapacity, 0);
  assert.equal(w.api.stats.wetSendRamps, 1, 'priority eviction ramps the wet send rather than disconnecting audio nodes');
  assert.ok(sounds.some(s => s._battleAcousticFilter.frequency.value === 20000),
    'evicted source stays audible with neutral dry acoustic filter');
  assert.equal(w.api.prepare(
    { getSoundGain: w.sound.getSoundGain, _soundPanner: w.sound._soundPanner, setVolume() {} },
    { x: 900, y: 1.6, z: 0 }, 'gunDistant', 0.001, w.scene
  ), false, 'low-value distant sounds do not evict more important tracked shots');
  assert.equal(w.api.stats.skippedCapacity, 1);
  assert.equal(w.api.stats.replacedCapacity, 1);
}
// prettier-ignore
{
  const w = world('standard', true);
  assert.equal(w.api.priorityEnabled, false, 'shipping default retains FIFO acoustics');
  for (let i = 0; i < 24; i++) {
    const far = { getSoundGain: w.sound.getSoundGain, _soundPanner: w.sound._soundPanner, setVolume() {} };
    w.api.prepare(far, { x: 700, y: 1.6, z: 0 }, 'gunDistant', 0.08, w.scene);
  }
  assert.equal(w.api.prepare(w.sound, { x: 15, y: 1.6, z: 0 }, 'gun', 0.2, w.scene), false);
  assert.equal(w.api.stats.replacedCapacity, 0);
  assert.equal(w.api.stats.skippedCapacity, 1);
}
// A/B minimum-residence guard: no audio steal or filter rebuild under churn.
// prettier-ignore
{
  const w = world('standard', true, '&acousticPriority=1&acousticHoldMs=250');
  assert.equal(w.api.acousticHoldMs, 250, 'hold guard is controlled by query option');
  for (let i = 0; i < 24; i++) {
    w.api.prepare(
      { getSoundGain: w.sound.getSoundGain, _soundPanner: w.sound._soundPanner, setVolume() {} },
      { x: 700 + i, y: 1.6, z: 0 }, 'gunDistant', 0.08, w.scene
    );
  }
  assert.equal(w.api.prepare(w.sound, { x: 15, y: 1.6, z: 0 }, 'gun', 0.2, w.scene), false,
    'early near shot plays dry rather than displacing recently admitted acoustic sources');
  assert.equal(w.api.stats.replacedCapacity, 0);
  assert.equal(w.api.stats.deniedHold, 1);
  w.tick();
  assert.equal(w.api.prepare(w.sound, { x: 15, y: 1.6, z: 0 }, 'gun', 0.2, w.scene), true,
    'eligible older record can now be displaced');
  assert.equal(w.api.stats.replacedCapacity, 1);
  assert.equal(w.api.active, 24);
}
// Research-only source processing budgets: exercise the actual acoustic tracker
// at 24, 48, 96 and 192 records without altering the 24-slot shipping baseline.
// prettier-ignore
for (const slots of [24, 48, 96, 192]) {
  const w = world('standard', true, '&acousticPriority=1&acousticSlots=' + slots);
  assert.equal(w.api.defaultMaxActive, 96);
  assert.equal(w.api.maxActive, slots);
  assert.equal(w.api.tickIntervalMs, 200);
  const near = { x: 30, y: 1.6, z: 0 };
  for (let i = 0; i < slots; i++) {
    const sound = { getSoundGain: w.sound.getSoundGain,
      _soundPanner: w.sound._soundPanner, setVolume() {} };
    assert.equal(w.api.prepare(sound, { x: near.x + i / 50, y: near.y, z: near.z },
      'gun', 0.12, w.scene), true);
  }
  assert.equal(w.api.active, slots);
  const extra = { getSoundGain: w.sound.getSoundGain, _soundPanner: w.sound._soundPanner, setVolume() {} };
  assert.equal(w.api.prepare(extra, { x: 900, y: 1.6, z: 0 },
    'gunDistant', 0.001, w.scene), false, 'low-priority overflow cannot evict high-value records');
  assert.equal(w.api.stats.skippedCapacity, 1);
  w.tick();
  assert.equal(w.api.stats.acousticTicks, 1);
  assert.ok(w.api.stats.sampled >= slots * 2, 'all tracked sounds receive periodic sampling');
}
assert.equal(world('high', true).api.maxActive, 192);
assert.equal(world('standard', true, '&acousticSlots=50000').api.maxActive, 192);
assert.equal(world('standard', true, '&acousticSlots=1').api.maxActive, 1);
console.log('listener-acoustics-check: PASS');
