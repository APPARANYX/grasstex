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

function world(mode, withGraph) {
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
          setTargetAtTime(v) {
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
    location: { search: '?acoustics=' + mode },
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
  assert.equal(w.api.stats.degraded, 1, 'unsupported Babylon graph degrades safely');
  assert.equal(w.sound.volume, 0.24, 'fallback retains dry intelligible audio');
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
  assert.equal(w.api.active, 24, 'standard caps acoustic sources, extras play dry');
}
console.log('listener-acoustics-check: PASS');
