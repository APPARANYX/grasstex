#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const dir = path.join(__dirname, '../../battle/modules');
const code = fs.readFileSync(path.join(dir, '52-fbx-render-pose.js'), 'utf8');
const backend = fs.readFileSync(path.join(dir, '53-fbx-soldier-backend.js'), 'utf8');
assert.match(backend, /!root\.BattleFbxRenderPose\s*\|\|/);
assert.match(backend, /applyPose = RENDER_POSE\.applyPose/);
assert.doesNotMatch(backend, /function applyPose\(/);
assert.doesNotMatch(code, /Math\.random|\bsoldier\.weapon\s*=/);
// Pin the pre-extraction algorithm, normalizing whitespace and the explicit live LOD injection.
// Formatter may wrap the return across lines; use the last return-object boundary instead.
const end = code.lastIndexOf('      return {');
const normalized = code
  .slice(code.indexOf('/* ---- render-side pose writing'), end)
  .replace('deps.lodOn()', 'LOD.on')
  .replace(/\s+/g, '');
assert.equal(
  crypto.createHash('sha256').update(normalized).digest('hex'),
  '7912cafd0e9ec91ba988eedf9a60b154eed90de7dba89e466618e6e74ec7413a'
);
class Vec {
  constructor(x = 0, y = 0, z = 0) {
    Object.assign(this, { x, y, z });
  }
}
class Quat {
  static RotationYawPitchRollToRef(y, x, z, out) {
    Object.assign(out, { x, y, z });
  }
}
class Matrix {
  constructor() {
    this.offset = 0;
  }
  copyFrom(m) {
    this.offset = m.offset;
  }
  multiplyToRef(m, out) {
    out.offset = this.offset + m.offset;
  }
  static ComposeToRef(scale, q, pos, out) {
    out.offset = pos.x;
  }
}
const ctx = { globalThis: {} };
vm.runInNewContext(code, ctx);
const factory = ctx.globalThis.BattleFbxRenderPose;
vm.runInNewContext(code, ctx);
assert.equal(ctx.globalThis.BattleFbxRenderPose, factory);
let lod = false;
const deps = { Q: Quat, V3: Vec, MX: Matrix, lodOn: () => lod };
const pose = factory.create(deps);
const other = factory.create(deps);
assert.notEqual(pose.dialQuat([1, 2, 3]), other.dialQuat([1, 2, 3]), 'scratch belongs to each instance');
const dial = pose.dialQuat([90, 180, 45], 0.5);
assert.equal(dial.x, Math.PI / 4);
assert.equal(dial.y, Math.PI / 2);
assert.equal(dial.z, Math.PI / 8);
const nodes = [1, 2, 4].map(x => ({ position: { x }, scaling: {}, rotationQuaternion: {} }));
const chain = nodes.map(() => new Matrix());
pose.handChain(nodes, chain, 0);
assert.deepEqual(
  chain.map(m => m.offset),
  [1, 3, 7]
);
nodes[1].position.x = 5;
pose.handChain(nodes, chain, 1);
assert.deepEqual(
  chain.map(m => m.offset),
  [1, 6, 10],
  'partial chain retains ancestor matrix'
);
assert.equal(pose.cupEnvelopeWeight(null, 1), 1);
assert.equal(pose.cupEnvelopeWeight({ onset: null }, 1), 1);
const env = { onset: 0.1, settle: 0.8, duration: 1.2 };
assert.equal(pose.cupEnvelopeWeight(env, 0), 1);
assert.equal(pose.cupEnvelopeWeight(env, 0.5), 0);
assert.equal(pose.cupEnvelopeWeight(env, 1.2), 1);
const fx = {
  death: true,
  _poseDt: 0.2,
  holder: { getScene: () => ({ getEngine: () => ({ getDeltaTime: () => 16 }) }) }
};
pose.cupReleaseWeight(fx);
assert.ok(fx.cupW > 0 && fx.cupW < 1);
lod = true;
pose.cupReleaseWeight(fx);
assert.ok(fx.cupRamp < 0.2, 'LOD uses time since last pose');
fx.death = false;
for (let i = 0; i < 5; i++) pose.cupReleaseWeight(fx);
assert.equal(fx.cupW, 1, 'support recaptures after release');
assert.equal(pose.applyPistolCup({ lib: {}, path: [], pathL: [] }, null, 1), null);
console.log(
  'PASS render pose original algorithm SHA, private scratch, dial axes, full/partial hand chains, cup envelope release/recapture and live LOD timing'
);
