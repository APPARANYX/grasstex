#!/usr/bin/env node
'use strict';

/* #456 R3: verify the imported FBX rest-pose parent/child retarget calibration,
   not merely the existence or spelling of the extracted helper. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modules = path.join(__dirname, '../../battle/modules');
const quaternionFile = '52-fbx-retarget-quat.js';
const restFile = '52-fbx-retarget-rest.js';
const backendFile = '53-fbx-soldier-backend.js';
assert.ok(quaternionFile < restFile && restFile < backendFile, 'PHP alphabetical dependency order');
const ctx = { window: {} };
const run = file => vm.runInNewContext(fs.readFileSync(path.join(modules, file), 'utf8'), ctx, {
  filename: file
});
run(quaternionFile);
run(restFile);
const rest = ctx.window.BattleFbxRetargetRest;
assert.ok(rest, 'helper installs without Babylon or a scene');
run(restFile);
assert.equal(ctx.window.BattleFbxRetargetRest, rest, 'second install retains the original helper');
assert.equal(Object.keys(rest).length, 2);
const source = fs.readFileSync(path.join(modules, backendFile), 'utf8');
assert.match(source, /!root\.BattleFbxRetargetRest\s*\|\|/);
assert.match(source, /RETARGET_REST\.planOrder\(parent\)/);
assert.match(source, /RETARGET_REST\.quatCalibration\(parent, order, restS, restT\)/);
assert.match(source, /retargetRotations\(frames, n, order, parent, K, rS, rT, srcRot, dstRot\)/);
assert.match(source, /if \(FAST_RETARGET\)/, 'matrix fallback remains independently selectable');
assert.match(source, /function convertClip\(container, key, spec, bones\)/, 'packed clip converter retained');
assert.match(source, /function encodeClipPack\(src, clips, extra\)/, 'prepared clip codec retained');
assert.doesNotMatch(source, /hamilton\(K, i4/, 'correction-matrix loop must live in rest helper');

const EPS = 1e-12;
const close = (a, b, label) => assert.ok(Math.abs(a - b) <= EPS, label + ': ' + a + ' vs ' + b);
function equalVec(actual, expected, label) {
  assert.equal(actual.length, expected.length, label + ' size');
  for (let i = 0; i < expected.length; i++) close(actual[i], expected[i], label + '[' + i + ']');
}
function axis(deg, which) {
  const a = deg * Math.PI / 360;
  const s = Math.sin(a), c = Math.cos(a);
  return which === 'x' ? [s, 0, 0, c] : which === 'y' ? [0, s, 0, c] : [0, 0, s, c];
}
function multiply(a, b) {
  const [x, y, z, w] = a, [u, v, t, h] = b;
  return [x * h + w * u + y * t - z * v, y * h + w * v + z * u - x * t,
    z * h + w * t + x * v - y * u, w * h - x * u - y * v - z * t];
}
function quaternion(a) {
  return { x: a[0], y: a[1], z: a[2], w: a[3] };
}
const inverse = a => [-a[0], -a[1], -a[2], a[3]];
const parent = Int32Array.from([2, -1, 1, 1, 3]);
const originalParent = Array.from(parent);
const order = Array.from(rest.planOrder(parent));
assert.deepEqual(order, [1, 2, 3, 0, 4], 'parents precede children; same-depth siblings keep source order');
assert.deepEqual(Array.from(rest.planOrder(Int32Array.from([-1]))), [0], 'single root');
assert.deepEqual(Array.from(rest.planOrder(Int32Array.from([]))), [], 'empty skeleton');

const s = [
  axis(15, 'x'), axis(-70, 'z'), axis(20, 'y'), axis(35, 'x'), axis(-45, 'z')
];
const t = [
  axis(-30, 'z'), axis(40, 'y'), axis(-25, 'x'), axis(-60, 'z'), axis(90, 'x')
];
// A missing model bone uses the source's rest orientation in backend retargetClips().
t[4] = s[4];
const sourceRest = s.map(quaternion), targetRest = t.map(quaternion);
const beforeSource = JSON.stringify(sourceRest), beforeTarget = JSON.stringify(targetRest);
const plan = rest.quatCalibration(parent, order, sourceRest, targetRest);
const worldSource = [], worldTarget = [];
for (const i of order) {
  const p = parent[i];
  worldSource[i] = p < 0 ? s[i] : multiply(worldSource[p], s[i]);
  worldTarget[i] = p < 0 ? t[i] : multiply(worldTarget[p], t[i]);
  const expected = multiply(inverse(worldSource[i]), worldTarget[i]);
  equalVec(Array.from(plan.rS.subarray(i * 4, i * 4 + 4)), s[i], 'source flat ' + i);
  equalVec(Array.from(plan.rT.subarray(i * 4, i * 4 + 4)), t[i], 'target flat ' + i);
  equalVec(Array.from(plan.K.subarray(i * 4, i * 4 + 4)), expected, 'K correction ' + i);
}
assert.deepEqual(Array.from(parent), originalParent, 'parent indices must remain intact');
assert.equal(JSON.stringify(sourceRest), beforeSource, 'source rest orientations were mutated');
assert.equal(JSON.stringify(targetRest), beforeTarget, 'target rest orientations were mutated');
const second = rest.quatCalibration(parent, order, sourceRest, targetRest);
equalVec(Array.from(second.K), Array.from(plan.K), 'repeatable, separate model calibration');
assert.notEqual(second.K, plan.K, 'per-model correction must not share mutable scratch');

// Identical source/target skeleton requires identity local corrections in every world frame.
const same = rest.quatCalibration(parent, order, sourceRest, sourceRest);
for (let i = 0; i < parent.length; i++) {
  equalVec(Array.from(same.K.subarray(i * 4, i * 4 + 4)), [0, 0, 0, 1], 'matching rest ' + i);
}
console.log('PASS #456 R3 ordered hierarchy, nontrivial world-rest quaternion goldens, missing model rest, identity retarget and immutable per-model plans');
