#!/usr/bin/env node
'use strict';

/* #456 R3: actual converter code with deterministic fake FBX channels. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../../battle/modules');
const file = '52-fbx-clip-converter.js';
const backend = '53-fbx-soldier-backend.js';
const code = fs.readFileSync(path.join(root, file), 'utf8');
const runtime = fs.readFileSync(path.join(root, backend), 'utf8');
assert.ok(file < backend, 'PHP lexical load order');
assert.match(runtime, /!root\.BattleFbxClipConverter\s*\|\|/);
assert.match(runtime, /root\.BattleFbxClipConverter\.create/);
assert.doesNotMatch(runtime, /function sourceRig\(/);
assert.doesNotMatch(runtime, /function convertClip\(/);
assert.match(runtime, /function encodeClipPack\(/);
assert.match(code, /function sourceRig\(/);
assert.match(code, /function convertClip\(/);

const sandbox = { window: {} };
vm.runInNewContext(code, sandbox, { filename: file });
const owner = sandbox.window.BattleFbxClipConverter;
assert.equal(typeof owner.create, 'function');
vm.runInNewContext(code, sandbox, { filename: file });
assert.equal(sandbox.window.BattleFbxClipConverter, owner, 'idempotent install');

class Vec {
  constructor(x = 0, y = 0, z = 0) {
    Object.assign(this, { x, y, z });
  }
  clone() {
    return new Vec(this.x, this.y, this.z);
  }
}
class Quat {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    Object.assign(this, { x, y, z, w });
  }
  clone() {
    return new Quat(this.x, this.y, this.z, this.w);
  }
  static FromEulerVector() {
    return new Quat();
  }
}
const converter = owner.create({
  Q: Quat,
  V3: Vec,
  FPS: 2,
  rigScheme: names => (names.includes('hips') ? 'test-rig' : 'unknown'),
  canon: name => name
});
const hips = { name: 'hips', position: new Vec(0, 0, 2), rotationQuaternion: new Quat() };
const arm = { name: 'leftarm', position: new Vec(0, 0, 1), rotationQuaternion: new Quat(0, 0, 0, 1) };
const container = {
  transformNodes: [{ name: '__fbx_root__' }, { name: '__fbx_inheritScale' }, hips, arm],
  animationGroups: []
};
const src = converter.sourceRig(container);
assert.deepEqual(Array.from(src.bones), ['hips', 'leftarm']);
assert.equal(src.scheme, 'test-rig');
assert.ok(src.rest.hips.q instanceof Quat && src.rest.hips.p instanceof Vec);
assert.notEqual(src.rest.hips.q, hips.rotationQuaternion, 'original rest pose must be cloned');
assert.equal(src.rest.hips.p.z, 2);
function animation(target, prop, values) {
  return {
    target,
    animation: {
      targetProperty: prop,
      framePerSecond: 2,
      evaluate: frame => values[Math.round(frame)]
    }
  };
}
const rot = [new Quat(0, 0, 0, 1), new Quat(0, 0, -Math.SQRT1_2, -Math.SQRT1_2), new Quat(0, 0, 1, 0)];
const pos = [new Vec(0, 0, 2), new Vec(1, 2, 2.2), new Vec(2, 4, 2.5)];
const group = {
  from: 0,
  to: 2,
  targetedAnimations: [
    animation(hips, 'position', pos),
    animation(hips, 'rotationQuaternion', rot),
    animation(arm, 'visibility', [0, 1, 0]),
    animation({ name: 'not-a-bone' }, 'position', pos)
  ]
};
container.animationGroups = [group];
const clip = converter.convertClip(container, 'walk', ['walk-file', true], src.bones);
assert.equal(clip.key, 'walk');
assert.equal(clip.file, 'walk-file');
assert.equal(clip.loop, true);
assert.equal(clip.frames, 3);
assert.equal(clip.duration, 1);
assert.equal(clip.channels.length, 2);
assert.equal(clip.channels[1], undefined, 'unkeyed bones remain sparse');
assert.equal(clip.channels[0].rot.length, 12);
assert.equal(clip.channels[0].pos.length, 9);
assert.ok(Math.abs(clip.travel - Math.sqrt(20)) < 1e-6, 'original XY travel magnitude / duration');
assert.ok(Math.abs(clip.channels[0].pos[3]) < 1e-6, 'loop horizontal drift removed at midpoint X');
assert.ok(Math.abs(clip.channels[0].pos[4]) < 1e-6, 'loop horizontal drift removed at midpoint Y');
assert.ok(Math.abs(clip.channels[0].pos[6]) < 1e-6, 'loop horizontal drift removed at endpoint X');
assert.ok(Math.abs(clip.channels[0].pos[7]) < 1e-6, 'loop horizontal drift removed at endpoint Y');
assert.ok(Math.abs(clip.channels[0].pos[8] - 2.5) < 1e-6, 'vertical bob retained');
assert.ok(clip.channels[0].rot[7] > 0, 'second quaternion flipped to same hemisphere as previous');
assert.equal(clip.speed, 0, 'speed remains computed by per-model retarget');
const unlooped = converter.convertClip(container, 'one-shot', ['walk-file', false], src.bones);
assert.ok(Math.abs(unlooped.channels[0].pos[6] - 2) < 1e-6, 'one-shot preserves root motion');
assert.ok(Math.abs(unlooped.channels[0].pos[7] - 4) < 1e-6);
const inPlace = converter.convertClip(container, 'in-place', ['walk-file', false, 'inplace'], src.bones);
assert.ok(Math.abs(inPlace.channels[0].pos[6]) < 1e-6, 'explicit in-place root drift removal');
container.animationGroups = [];
assert.throws(() => converter.convertClip(container, 'bad', ['bad', false], src.bones), /no animation/);
container.animationGroups = [{ from: 0, to: 2, targetedAnimations: [] }];
assert.throws(
  () => converter.convertClip(container, 'empty', ['empty', true], src.bones),
  /no usable channels/
);

console.log(
  'PASS #456 R3 source skeleton clone, canonical names, exact FPS interpolation, quaternion sign correction, loop/one-shot/in-place travel and fallback errors'
);
