#!/usr/bin/env node
'use strict';
/* #456 R3: ensure presentation LOD helpers own state and preserve mesh switching. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const rootDir = path.resolve(__dirname, '../../battle/modules');
const read = file => fs.readFileSync(path.join(rootDir, file), 'utf8');
const backend = read('53-fbx-soldier-backend.js');
assert.match(backend, /!root\.BattleFbxMeshLod\s*\|\|/);
assert.match(backend, /!root\.BattleFbxRenderLod\s*\|\|/);
assert.match(backend, /root\.BattleFbxMeshLod\.create/);
assert.match(backend, /root\.BattleFbxRenderLod\.create/);
assert.doesNotMatch(backend, /function meshLodInstall\(/);
assert.doesNotMatch(backend, /function hookRender\(/);
assert.doesNotMatch(backend, /function lodShadowInView\(/);
assert.ok('52-fbx-mesh-lod.js' < '53-fbx-soldier-backend.js');
assert.ok('52-fbx-render-lod.js' < '53-fbx-soldier-backend.js');
class SubMesh {
  constructor(materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh) {
    Object.assign(this, { materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh });
  }
}
class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    Object.assign(this, { x, y, z });
  }
  copyFrom(other) {
    Object.assign(this, other);
    return this;
  }
}
class Matrix {}
class Plane {}
const Babylon = { SubMesh, Vector3, Matrix, Plane };
const ctx = { window: {}, Promise, Uint8Array, Float32Array, Uint32Array, Set };
vm.runInNewContext(read('52-fbx-mesh-lod.js'), ctx);
vm.runInNewContext(read('52-fbx-render-lod.js'), ctx);
const meshFactory = ctx.window.BattleFbxMeshLod;
const renderFactory = ctx.window.BattleFbxRenderLod;
assert.ok(meshFactory && renderFactory);
vm.runInNewContext(read('52-fbx-mesh-lod.js'), ctx);
vm.runInNewContext(read('52-fbx-render-lod.js'), ctx);
assert.equal(ctx.window.BattleFbxMeshLod, meshFactory, 'mesh helper initialization idempotent');
assert.equal(ctx.window.BattleFbxRenderLod, renderFactory, 'render helper initialization idempotent');
const mesh = meshFactory.create({
  BABYLON: Babylon,
  ASSET: { on: false },
  perfNow: () => 0,
  assetAdd: () => {}
});
assert.equal(mesh.MESH_LOD.far, 45);
assert.equal(mesh.MESH_LOD.ratio, 0.12);
assert.equal(mesh.MESH_LOD.error, 0.08);
assert.equal(mesh.MESH_LOD.band, 3);
assert.equal(typeof mesh.meshoptReady, 'function');
assert.equal(typeof mesh.meshLodInstall, 'function');
const inputMesh = {
  geometry: { _fbxLod: { start: 100, count: 12 } },
  subMeshes: [new SubMesh(0, 0, 50, 0, 100)],
  getTotalVertices: () => 50
};
const sample = mesh.meshLodBind([inputMesh]);
assert.equal(sample.length, 1);
assert.equal(sample[0].far[0].indexStart, 100);
assert.equal(sample[0].far[0].indexCount, 12);
assert.equal(sample[0].full[0].indexCount, 100);
const fx = { meshLod: sample };
mesh.meshLodApply(fx, true);
assert.equal(fx._meshFar, true);
assert.equal(inputMesh.subMeshes, sample[0].far);
mesh.meshLodApply(fx, true);
assert.equal(inputMesh.subMeshes, sample[0].far, 'repeat no-op');
mesh.meshLodApply(fx, false);
assert.equal(fx._meshFar, false);
assert.equal(inputMesh.subMeshes, sample[0].full);

const t = renderFactory.create({
  BABYLON: Babylon,
  MX: Matrix,
  V3: Vector3,
  MESH_LOD: mesh.MESH_LOD,
  meshLodApply: mesh.meshLodApply,
  perfNow: () => 0,
  POSE: { on: false },
  poseMix: () => 0,
  poseClipSig: () => 0,
  poseWeaponSig: () => 0,
  topEntry: () => null,
  applyPose: () => {
    throw Error('empty scene must not pose');
  },
  poseSoldier: () => {},
  poseFrame: () => {}
});
assert.equal(t.LOD.near, 35);
assert.equal(t.LOD.mid, 100);
assert.equal(t.LOD.midHz, 30);
assert.equal(t.LOD.farHz, 10);
assert.equal(t.LOD.radius, 1.6);
assert.equal(t.CULL.radius, 3);
assert.equal(t.CULL.on, true);
const observers = [];
const scene = {
  activeCamera: null,
  onBeforeRenderObservable: { add: fn => observers.push(fn) },
  getEngine: () => ({ getDeltaTime: () => 16.7 })
};
const st = { active: [] };
t.hookRender(scene, st);
t.hookRender(scene, st);
assert.equal(observers.length, 1, 'a scene must have only one render observer');
observers[0]();
assert.equal(t.LOD.screenScale, 1);
assert.equal(mesh.MESH_LOD.screenScale, 1);
console.log(
  'PASS #456 R3 rendering LOD config, instance mesh far/full switching, ownership, duplicate hook protection'
);
