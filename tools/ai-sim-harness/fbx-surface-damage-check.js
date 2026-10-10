#!/usr/bin/env node
'use strict';

/* #456 R3: FBX skin anchor and UV wound projection ownership + delayed frame safety. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dir = path.resolve(__dirname, '../../battle/modules');
const name = '52-fbx-surface-damage.js';
const source = fs.readFileSync(path.join(dir, name), 'utf8');
const backend = fs.readFileSync(path.join(dir, '53-fbx-soldier-backend.js'), 'utf8');
assert.ok(name < '53-fbx-soldier-backend.js', 'lexical PHP loader must install skin owner first');
assert.match(backend, /!root\.BattleFbxSurfaceDamage\s*\|\|/);
assert.match(backend, /root\.BattleFbxSurfaceDamage\.create/);
assert.match(backend, /skinAnchor: skinAnchor/);
assert.match(backend, /paintSurfaceWound: paintSurfaceWound/);
assert.doesNotMatch(backend, /function skinAnchor\(/);
assert.doesNotMatch(backend, /function surfaceDamageMap\(/);
const identity = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  scaleInPlace(k) { this.x *= k; this.y *= k; this.z *= k; return this; }
  static TransformCoordinatesToRef(v, world, out) {
    const m = world.m;
    const x = v.x, y = v.y, z = v.z;
    out.x = x * m[0] + y * m[4] + z * m[8] + m[12];
    out.y = x * m[1] + y * m[5] + z * m[9] + m[13];
    out.z = x * m[2] + y * m[6] + z * m[10] + m[14];
    return out;
  }
}
const VB = { PositionKind: 'position', NormalKind: 'normal', UVKind: 'uv',
  MatricesIndicesKind: 'idx', MatricesIndicesExtraKind: 'idx2',
  MatricesWeightsKind: 'weights', MatricesWeightsExtraKind: 'weights2' };
let frame = 8;
const pending = [], projections = [], cleared = [];
const scene = { getFrameId: () => frame, getEngine: () => ({}) };
class Renderer {
  constructor(mesh, sceneArg, options) {
    this.mesh = mesh;
    this.scene = sceneArg;
    this.options = options;
    this.isReady = () => true;
    projections.length = projections.length;
  }
  renderTexture(stamp, pos, normal, size) {
    projections.push({ stamp, pos: [pos.x, pos.y, pos.z], normal: [normal.x, normal.y, normal.z],
      size: [size.x, size.y, size.z] });
  }
  clear() { cleared.push(true); }
}
class Color4 {}
const B = { VertexBuffer: VB, MeshUVSpaceRenderer: Renderer, Color4 };
const context = { window: { setTimeout: cb => pending.push(cb), location: { search: '' } } };
vm.runInNewContext(source, context, { filename: name });
const moduleOwner = context.window.BattleFbxSurfaceDamage;
assert.ok(moduleOwner);
vm.runInNewContext(source, context, { filename: name });
assert.equal(moduleOwner, context.window.BattleFbxSurfaceDamage, 'module install idempotent');
let posed = 0;
const surface = moduleOwner.create({ BABYLON: B, V3: Vector3, applyPose: () => posed++ });
assert.equal(surface.surfaceDamageResolution, 512, 'desktop UV resolution');
const data = {
  position: Float32Array.from([0, 0, 0, 0.2, 0, 0]),
  normal: Float32Array.from([0, 1, 0, 0, 1, 0]),
  uv: Float32Array.from([0, 0, 1, 1]),
  idx: Float32Array.from([0, 0, 0, 0, 0, 0, 0, 0]),
  weights: Float32Array.from([1, 0, 0, 0, 1, 0, 0, 0])
};
let enabled = true;
const mesh = {
  name: 'test-soldier-body',
  skeleton: { prepare() {}, getTransformMatrices: () => identity },
  getVerticesData: kind => data[kind] || null,
  getWorldMatrix: () => ({ m: identity }),
  computeWorldMatrix() {},
  getScene: () => scene,
  isDisposed: () => false,
  isEnabled: () => enabled
};
const soldier = { _fbx: { meshes: [mesh], poseRef: { serial: 2 } } };
const found = surface.skinAnchor(soldier, { x: 0.201, y: 0, z: 0 });
assert.ok(found, 'nearest real skinned mesh vertex found');
assert.equal(found.vertex, 1);
assert.equal(found.distance < 0.002, true);
assert.equal(posed, 1, 'sample pose updated exactly once at hit time');
assert.equal(soldier._fbx.poseRef.serial, 3, 'wound event invalidated skeleton cache');
const p = new Vector3(), normal = new Vector3();
assert.equal(surface.skinSample(found, p, normal), true);
assert.ok(Math.abs(p.x - 0.2) < 1e-6);
assert.deepEqual([normal.x, normal.y, normal.z], [0, 1, 0]);
const stamp = { name: 'bullet wound' };
const hit = surface.paintSurfaceWound(found, stamp, null, 0.11, 0, 0.28);
assert.ok(hit?.pending, 'first shader-ready frame is not ready for UV projection');
assert.equal(hit.resolution, 512);
assert.equal(pending.length, 1);
assert.equal(projections.length, 0);
frame++;
pending.shift()();
assert.equal(projections.length, 1, 'first wound painted on the following frame');
assert.ok(Math.abs(projections[0].pos[0] - 0.2) < 1e-6);
assert.ok(Math.abs(projections[0].size[0] - 0.11) < 1e-6);
const hit2 = surface.paintSurfaceWound(found, stamp, null, 0.11, 0, 0.28);
assert.equal(hit2.pending, false, 'subsequent marks can paint synchronously');
assert.equal(hit2.renderer, hit.renderer, 'the same mesh retains one private UV target');
assert.equal(projections.length, 2);
enabled = false;
const culled = surface.paintSurfaceWound(found, stamp, null, 0.11, 0, 0.28);
assert.equal(culled.pending, true, 'off-screen mesh cannot paint and will retry');
assert.equal(projections.length, 2);
assert.equal(surface.clearSurfaceDamage(soldier), 1);
assert.equal(cleared.length, 1);
assert.equal(mesh._battleSurfaceDamage.wounds, 0);
frame++;
enabled = true;
pending.shift()();
assert.equal(projections.length, 2, 'cleared stale wound must never reproject after reset');
// Force the phone path without installing DOM, texture APIs, or modifying gameplay.
const phone = { window: { location: { search: '?woundMap=256' } } };
vm.runInNewContext(source, phone);
assert.equal(phone.window.BattleFbxSurfaceDamage.create({
  BABYLON: B, V3: Vector3, applyPose: () => {}
}).surfaceDamageResolution, 256);
console.log('PASS #456 R3 skin weighted vertex anchor, deferred UV projection, shared renderer, cull/restart cleanup and phone resolution');
