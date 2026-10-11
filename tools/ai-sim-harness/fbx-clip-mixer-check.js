#!/usr/bin/env node
'use strict';

/* #456 R3: clip clocks, weighted hemisphere-correct quaternion blends and position sampling. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const mod = path.join(__dirname, '../../battle/modules');
const helper = '52-fbx-clip-mixer.js';
const backend = '53-fbx-soldier-backend.js';
const source = fs.readFileSync(path.join(mod, helper), 'utf8');
const shipping = fs.readFileSync(path.join(mod, backend), 'utf8');
assert.ok(helper < backend, 'helper must load before the FBX backend');
assert.match(shipping, /!root\.BattleFbxClipMixer\s*\|\|/);
assert.match(shipping, /root\.BattleFbxClipMixer\.create\(FPS\)/);
for (const name of ['setClip', 'advanceLayer', 'topEntry', 'sampleLayer']) {
  assert.match(shipping, new RegExp(name + ' = MIXER\\.' + name), 'missing delegated ' + name);
  assert.doesNotMatch(shipping, new RegExp('function ' + name + '\\('), 'duplicate ' + name);
}

const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: helper });
const owner = sandbox.window.BattleFbxClipMixer;
assert.ok(owner && owner.create, 'pure mixer must initialize without Babylon or the battle');
vm.runInNewContext(source, sandbox, { filename: helper });
assert.equal(sandbox.window.BattleFbxClipMixer, owner, 'module install should be idempotent');
const mixer = owner.create(2);
assert.notEqual(owner.create(2), mixer, 'mixer state must be per caller');

const S = Math.SQRT1_2;
const q0 = [0, 0, 0, 1],
  q90 = [0, S, 0, S],
  q180 = [0, 1, 0, 0];
const flattened = items => Float32Array.from(items.flat());
const clipA = {
  key: 'walk',
  loop: true,
  duration: 1,
  frames: 3,
  channels: [
    {
      rot: flattened([q0, q90, q180]),
      pos: flattened([
        [0, 0, 0],
        [2, 0, 0],
        [4, 0, 0]
      ])
    }
  ]
};
const clipB = {
  key: 'run',
  loop: true,
  duration: 2,
  frames: 3,
  channels: [
    {
      rot: flattened([q90.map(x => -x), q90.map(x => -x), q90.map(x => -x)]),
      pos: flattened([
        [0, 2, 0],
        [0, 2, 0],
        [0, 2, 0]
      ])
    }
  ]
};
const clipStop = { key: 'stop', loop: false, duration: 1, frames: 3, channels: [] };
const layer = { entries: [], fade: 0 };
let entry = mixer.setClip(layer, clipA, 1, 0.25, false, false);
assert.equal(entry.w, 1);
assert.equal(mixer.topEntry(layer), entry);
mixer.advanceLayer(layer, 0.6);
near(entry.t, 0.6, 'loop clock');
assert.equal(entry.w, 1, 'sole clip retains full weight');
assert.equal(mixer.setClip(layer, clipA, 1.5, 0.25, false, false), entry);
assert.equal(layer.entries.length, 1, 'same clip changes speed without restarting');
assert.equal(entry.rate, 1.5);
mixer.advanceLayer(layer, 0.5);
near(entry.t, 0.35, 'loop wrapping with playback rate');
const b = mixer.setClip(layer, clipB, 1, 0.4, false, true);
near(b.t, 0.7, 'new clip preserves normalized phase');
assert.equal(b.w, 0);
mixer.advanceLayer(layer, 0.1);
near(b.w, 0.25, 'fade-in weight');
near(layer.entries[0].w, 0.75, 'fade-out weight');
near(b.t, 0.8, 'new clip clock');
assert.equal(mixer.topEntry(layer), b);
for (let i = 0; i < 8; i++) {
  mixer.setClip(
    layer,
    { key: 'oneShot' + i, loop: false, duration: 1, frames: 2, channels: [] },
    1,
    0.1,
    true,
    false
  );
}
assert.equal(layer.entries.length, 4, 'only four concurrent entries retained');
const stopLayer = { entries: [], fade: 0 };
const stopped = mixer.setClip(stopLayer, clipStop, 1, 0, false, false);
mixer.advanceLayer(stopLayer, 3);
assert.equal(stopped.t, 1, 'nonloop clip time clamps at the final frame');
const restarted = mixer.setClip(stopLayer, clipStop, 1, 0, true, false);
assert.notEqual(restarted, stopped, 'restart creates a fresh entry');
assert.equal(restarted.t, 0);
mixer.advanceLayer(stopLayer, 1);
assert.equal(mixer.topEntry(stopLayer).w, 1, 'completed fade restores unit weight');

function quat() {
  return {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
    set(x, y, z, w) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    },
    normalize() {
      const d = Math.hypot(this.x, this.y, this.z, this.w) || 1;
      this.x /= d;
      this.y /= d;
      this.z /= d;
      this.w /= d;
    }
  };
}
function vector() {
  return {
    x: 0,
    y: 0,
    z: 0,
    set(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    },
    scaleInPlace(k) {
      this.x *= k;
      this.y *= k;
      this.z *= k;
    }
  };
}
function near(actual, expected, message, epsilon = 1e-6) {
  assert.ok(Math.abs(actual - expected) < epsilon, message + ': ' + actual + ' != ' + expected);
}
let q = quat(),
  p = vector();
let single = { entries: [{ clip: clipA, t: 0.25, w: 1 }] };
assert.equal(mixer.sampleLayer(single, 0, q, p), 2);
near(q.y, Math.sin(Math.PI / 8), 'normalized nlerp yaw component', 2e-4);
near(q.w, Math.cos(Math.PI / 8), 'normalized nlerp scalar component', 2e-4);
near(p.x, 1, 'linear position interpolation');
near(p.y, 0, 'position isolation');
const sourceA = Array.from(clipA.channels[0].rot);
const sourceB = Array.from(clipB.channels[0].rot);
q = quat();
p = vector();
const blend = {
  entries: [
    { clip: clipA, t: 0.5, w: 0.5 },
    { clip: clipB, t: 0.5, w: 0.5 }
  ]
};
assert.equal(mixer.sampleLayer(blend, 0, q, p), 2);
near(q.y, S, 'sign-aligned quaternion blend');
near(q.w, S, 'sign-aligned quaternion blend scalar');
near(p.x, 1, 'weighted A translation');
near(p.y, 1, 'weighted B translation');
assert.deepEqual(Array.from(clipA.channels[0].rot), sourceA, 'sampling must not alter source clip A');
assert.deepEqual(Array.from(clipB.channels[0].rot), sourceB, 'sampling must not alter source clip B');
q = quat();
p = vector();
assert.equal(mixer.sampleLayer({ entries: [{ clip: clipA, t: 0.3, w: 0 }] }, 0, q, p), 0);
assert.equal(q.w, 0, 'empty sample must clear output quaternion');
assert.equal(p.x, 0, 'empty sample must clear output position');
assert.equal(mixer.sampleLayer({ entries: [{ clip: clipStop, t: 0, w: 1 }] }, 0, q, p), 0);

console.log(
  'PASS #456 R3 FBX clip clocks, phase-preserving transitions, fade normalization, cap, restart, interpolation, quaternion hemisphere, source immutability and empty-channel fallbacks'
);
