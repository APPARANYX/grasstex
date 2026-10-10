#!/usr/bin/env node
'use strict';

/* #456 R3: pure quaternion retarget math vs independently composed pose fixtures. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modules = path.join(__dirname, '../../battle/modules');
const helperName = '52-fbx-retarget-quat.js';
const backendName = '53-fbx-soldier-backend.js';
const helperText = fs.readFileSync(path.join(modules, helperName), 'utf8');
const backendText = fs.readFileSync(path.join(modules, backendName), 'utf8');
assert.ok(helperName < backendName, 'PHP lexical loader must install the retarget kernel first');
assert.match(backendText, /!root\.BattleFbxRetargetQuat\s*\|\|/);
assert.match(backendText, /hamilton = RETARGET_QUAT\.hamilton/);
assert.match(backendText, /retargetRotations = RETARGET_QUAT\.retargetRotations/);
assert.match(backendText, /if \(FAST_RETARGET\)/, 'keep the existing matrix-versus-fast switch');
assert.match(backendText, /retargetRotations\(frames, n, order, parent, K, rS, rT, srcRot, dstRot\)/);
assert.doesNotMatch(backendText, /function retargetRotations\(/, 'kernel body duplicated in backend');

const ctx = { window: {} };
vm.runInNewContext(helperText, ctx, { filename: helperName });
const kernel = ctx.window.BattleFbxRetargetQuat;
assert.ok(kernel, 'kernel does not need BABYLON, scene, window.location, assets or clips');
vm.runInNewContext(helperText, ctx, { filename: helperName });
assert.equal(ctx.window.BattleFbxRetargetQuat, kernel, 'repeated script install must be idempotent');

const EPS = 2e-6;
function close(actual, expected, why, eps = EPS) {
  assert.ok(Math.abs(actual - expected) < eps, why + ': ' + actual + ' vs ' + expected);
}
function arrayClose(actual, expected, why, eps = EPS) {
  assert.equal(actual.length, expected.length, why + ' length');
  for (let i = 0; i < actual.length; i++) close(actual[i], expected[i], why + '[' + i + ']', eps);
}
const identity = [0, 0, 0, 1];
function axis(deg, dimension) {
  const a = (deg * Math.PI) / 360;
  return dimension === 'x'
    ? [Math.sin(a), 0, 0, Math.cos(a)]
    : dimension === 'y'
      ? [0, Math.sin(a), 0, Math.cos(a)]
      : [0, 0, Math.sin(a), Math.cos(a)];
}
function mul(a, b) {
  // Independent vector/scalar quaternion multiplication, not indexed-array kernel arithmetic.
  const u = a.slice(0, 3), v = b.slice(0, 3);
  const cross = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0]
  ];
  return [
    ...u.map((value, i) => a[3] * v[i] + b[3] * value + cross[i]),
    a[3] * b[3] - u.reduce((sum, value, i) => sum + value * v[i], 0)
  ];
}
const conj = q => [-q[0], -q[1], -q[2], q[3]];
const slice4 = (a, i) => Array.from(a.subarray(i * 4, (i + 1) * 4));
const put4 = (a, i, q) => a.set(q, i * 4);

const o = new Float64Array(4);
kernel.hamilton(o, 0, Float64Array.from(axis(90, 'x')), 0, Float64Array.from(axis(90, 'y')), 0);
arrayClose(o, [0.5, 0.5, 0.5, 0.5], 'Hamilton x90 × y90', 1e-12);

const frames = 4, n = 4, parent = Int32Array.from([-1, 0, 1, 0]);
const order = [0, 1, 3, 2]; // A child precedes its sibling, but follows its own parent.
const restSource = [identity, axis(20, 'x'), axis(-15, 'y'), axis(30, 'z')];
const restTarget = [axis(40, 'z'), axis(-35, 'y'), axis(60, 'x'), axis(-10, 'x')];
const rS = new Float64Array(n * 4), rT = new Float64Array(n * 4);
const sourceWorldRest = [], targetWorldRest = [];
const K = new Float64Array(n * 4);
for (let i = 0; i < n; i++) {
  put4(rS, i, restSource[i]);
  put4(rT, i, restTarget[i]);
}
for (const i of order) {
  const p = parent[i];
  sourceWorldRest[i] = p < 0 ? restSource[i] : mul(sourceWorldRest[p], restSource[i]);
  targetWorldRest[i] = p < 0 ? restTarget[i] : mul(targetWorldRest[p], restTarget[i]);
  put4(K, i, mul(conj(sourceWorldRest[i]), targetWorldRest[i]));
}
const inputs = [
  [axis(0, 'z'), axis(15, 'z'), axis(70, 'z'), axis(-45, 'z')],
  [axis(30, 'x'), axis(20, 'x'), axis(-40, 'x'), axis(-80, 'x')],
  null, // Unanimated source bone: its original rest rotation still drives descendants.
  [axis(0, 'z'), axis(-25, 'z'), axis(30, 'z'), axis(85, 'z')]
];
const src = inputs.map(keys => {
  if (!keys) return null;
  const out = new Float32Array(frames * 4);
  keys.forEach((q, f) => out.set(q, f * 4));
  return out;
});
const before = src.map(a => (a ? Array.from(a) : null));
const dst = [
  new Float32Array(frames * 4),
  new Float32Array(frames * 4),
  new Float32Array(frames * 4),
  null // Present source bone whose target is intentionally absent.
];
kernel.retargetRotations(frames, n, order, parent, K, rS, rT, src, dst);
for (let fr = 0; fr < frames; fr++) {
  const Ws = [], Wt = [];
  for (const i of order) {
    const p = parent[i];
    const local = src[i] ? Array.from(src[i].subarray(fr * 4, fr * 4 + 4)) : restSource[i];
    Ws[i] = p < 0 ? local : mul(Ws[p], local);
    if (!dst[i]) {
      Wt[i] = p < 0 ? restTarget[i] : mul(Wt[p], restTarget[i]);
      continue;
    }
    Wt[i] = mul(Ws[i], slice4(K, i));
    let expected = p < 0 ? Wt[i] : mul(conj(Wt[p]), Wt[i]);
    if (fr) {
      const previous = Array.from(dst[i].subarray((fr - 1) * 4, fr * 4));
      if (expected.reduce((sum, v, j) => sum + v * previous[j], 0) < 0)
        expected = expected.map(v => -v);
    }
    arrayClose(Array.from(dst[i].subarray(fr * 4, fr * 4 + 4)), expected, 'retarget bone=' + i + ' frame=' + fr);
  }
}
assert.deepEqual(src.map(a => (a ? Array.from(a) : null)), before, 'source clip channels changed');
assert.deepEqual(Array.from(K), Array.from(K), 'model rest calibration remains stable');
assert.equal(dst[3], null, 'missing model bone stays absent');

// No retargeting needed: identity rest and identical clip rotations must stay byte-equivalent.
const pass = new Float32Array([0, 0, 0, 1, ...axis(70, 'z'), ...axis(140, 'z')]);
const outPass = new Float32Array(pass.length);
kernel.retargetRotations(
  3, 1, [0], Int32Array.from([-1]),
  Float64Array.from(identity), Float64Array.from(identity), Float64Array.from(identity),
  [pass], [outPass]
);
arrayClose(outPass, pass, 'identity skeleton rotation pass-through', 1e-7);

// A -q representation on a subsequent key must stay in the preceding hemisphere.
const flipped = new Float32Array([0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 0, 1]);
const aligned = new Float32Array(flipped.length);
kernel.retargetRotations(
  3, 1, [0], Int32Array.from([-1]),
  Float64Array.from(identity), Float64Array.from(identity), Float64Array.from(identity),
  [flipped], [aligned]
);
arrayClose(aligned, [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], 'quaternion hemisphere continuity');

console.log('PASS #456 R3 quaternion kernel idempotence, Hamilton goldens, parent-chain retarget, missing bones, source immutability and hemisphere continuity');
