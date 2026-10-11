#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const dir = path.resolve(__dirname, '../../battle/modules');
const helper = fs.readFileSync(path.join(dir, '52-fbx-model-retarget.js'), 'utf8');
const backend = fs.readFileSync(path.join(dir, '53-fbx-soldier-backend.js'), 'utf8');
assert.match(backend, /!root\.BattleFbxModelRetarget\s*\|\|/);
assert.match(backend, /retargetClips = MODEL_RETARGET\.retargetClips/);
assert.match(backend, /Z_UP = new V3\(0, 0, 1\)/);
assert.match(backend, /function convertClip\(container, key, spec, bones\)/);
assert.match(backend, /function encodeClipPack\(src, clips, extra\)/);
assert.doesNotMatch(backend, /function retargetClips\(/);
assert.doesNotMatch(backend, /function strideSpeed\(/);
assert.match(helper, /function retargetClips\(/);
assert.match(helper, /function strideSpeed\(/);
assert.match(helper, /if \(FAST_RETARGET\)/);
assert.match(helper, /\/\[\?&\]fastRetarget=0/);
assert.match(helper, /copy\.speed = clip\.travel \* lib\.speedScale/);
assert.match(helper, /lib\.clips = out/);
assert.match(helper, /lib\.retargeted = /);
assert.ok('52-fbx-model-retarget.js' < '53-fbx-soldier-backend.js');

const root = {};
const ctx = { window: root };
vm.runInNewContext(helper, ctx, { filename: '52-fbx-model-retarget.js' });
const first = root.BattleFbxModelRetarget;
assert.ok(first && typeof first.create === 'function');
vm.runInNewContext(helper, ctx, { filename: '52-fbx-model-retarget.js' });
assert.equal(root.BattleFbxModelRetarget, first, 'module installation idempotent');

const src = {
  rest: { hips: { q: { x: 0, y: 0, z: 0, w: 1 }, p: { x: 0, y: 0, z: 1 } } }
};
const model = {
  nodes: { hips: { name: 'hips', parent: null, rotationQuaternion: { x: 0, y: 0, z: 0, w: 1 },
    position: { x: 0, y: 0, z: 1, length: () => 1 } } },
  scheme: 'mixamo',
  hipsHeight: 1
};
const deps = {
  Q: { Dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w },
  V3: class {},
  MX: class {},
  FPS: 30,
  canon: name => name,
  BONE: { leftFoot: 'leftfoot', rightFoot: 'rightfoot' }
};
const a = first.create(deps);
const clips = { walk: { key: 'walk', frames: 3, travel: 2, duration: 0.1, loop: true, channels: [null] } };
const out = a.retargetClips(model, src, clips, ['hips']);
assert.equal(out.walk.speed, 2, 'matching skeleton retains natural clip speed');
assert.equal(out.walk.stride, 0, 'missing foot chains cannot invent stride');
assert.equal(model.retargeted, false);
assert.equal(model.clips, out);
assert.equal(out.walk.channels, clips.walk.channels, 'matching rest reuses packed Float32 channels');
assert.notEqual(out.walk, clips.walk, 'per-model wrapper is distinct');
console.log('PASS #456 R3 model retarget preserves matching rest, clip channels, scale, stride, matrix switch, and lexical ownership');
