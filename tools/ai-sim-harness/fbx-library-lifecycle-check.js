#!/usr/bin/env node
'use strict';

/* #456 R3: one-shot scene loading, packed/raw clip selection and readiness wiring. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modulePath = path.join(__dirname, '../../battle/modules');
const name = '52-fbx-library-lifecycle.js';
const backendName = '53-fbx-soldier-backend.js';
const source = fs.readFileSync(path.join(modulePath, name), 'utf8');
const backend = fs.readFileSync(path.join(modulePath, backendName), 'utf8');
assert.ok(name < backendName);
assert.match(backend, /!root\.BattleFbxLibraryLifecycle\s*\|\|/);
assert.match(backend, /root\.BattleFbxLibraryLifecycle\.create/);
assert.match(backend, /loadLibrary = FBX_LIFECYCLE\.loadLibrary/);
assert.doesNotMatch(backend, /function loadLibrary\(/);
assert.match(source, /function loadLibrary\(/);

const logs = [];
const sandbox = { window: { GTLog: s => logs.push(s) }, Promise, console, Date };
vm.runInNewContext(source, sandbox, { filename: name });
const factory = sandbox.window.BattleFbxLibraryLifecycle;
assert.ok(factory && typeof factory.create === 'function');
vm.runInNewContext(source, sandbox, { filename: name });
assert.equal(sandbox.window.BattleFbxLibraryLifecycle, factory, 'module install idempotent');

const CLIPS = {
  aim: ['aim.fbx', true],
  pistolIdle: ['pistol.fbx', true]
};
const makeClip = key => ({ key, channels: [{ rot: new Float32Array([0, 0, 0, 1]) }, null] });
function setup(options = {}) {
  const st = { libs: {}, loading: null, ready: false, error: null, active: [] };
  const events = [];
  let t = 0;
  const ASSET = { on: true, marks: {} };
  const packed = {
    src: { bones: ['hips', 'spine0'], scheme: 'mixamo' },
    clips: {
      aim: { spec: CLIPS.aim, clip: makeClip('aim') }
    }
  };
  if (!options.partial) packed.clips.pistolIdle = { spec: CLIPS.pistolIdle, clip: makeClip('pistolIdle') };
  const deps = {
    sceneState: scene => { assert.equal(scene, options.scene || 'scene'); return st; },
    assetBase: () => '../Assets/',
    assetMark: name => { ASSET.marks[name] = ++t; events.push(['mark', name]); },
    meshoptReady: () => Promise.resolve({}),
    fetchClipPack: async base => { events.push(['pack', base]); return packed; },
    MODELS: { us: { default: 'us.fbx' }, ge: { default: 'ge.fbx' } },
    loadSidecars: async (base, files) => { events.push(['sidecars', base, files.length]); },
    loadProgress: (kind, done, total) => { events.push(['progress', kind, done, total]); },
    ensureLoader: options.fail ? async () => { throw new Error('FBX loader failed'); } : async () => {},
    ASSET,
    wrapFbxParse: () => events.push(['parser wrapped']),
    loadContainer: async (scene, url, kind, file) => {
      events.push(['container', kind, file]);
      return { url, meshes: [], _battleFile: null };
    },
    perfNow: () => ++t,
    prepareModel: c => {
      events.push(['prepare', c._battleFile]);
      return { palms: {}, scale: 1, clips: null };
    },
    assetAdd: (kind, file, field) => events.push(['time', kind, file, field]),
    loadWeapons: async (scene, state) => { state.weapons = { rifle: {} }; events.push(['weapons']); },
    CLIPS,
    CLIP_PACK_ON: true,
    clipsByFile: keys => {
      const out = {};
      keys.forEach(key => { (out[CLIPS[key][0]] || (out[CLIPS[key][0]] = [])).push(key); });
      return out;
    },
    loadClipFiles: async (scene, state, base, byFile, progress) => {
      const files = Object.keys(byFile);
      events.push(['clip fallback', files.length]);
      files.forEach(() => progress());
      return files.flatMap(file => byFile[file].map(key => makeClip(key)));
    },
    retargetClips: (lib, src, clips, bones) => {
      assert.deepEqual(Array.from(bones), ['hips', 'spine0']);
      lib.clips = clips;
      lib.retargeted = true;
      events.push(['retarget', lib.file]);
    },
    BONE: { hips: 'hips', spine0: 'spine0', leftHand: 'leftHand', rightHand: 'rightHand' },
    isUpper: bone => bone === 'spine0',
    SIDE_CONTACTS: {},
    SOLDIER_CONTACTS: {},
    V3: class Vec3 { constructor(x, y, z) { Object.assign(this, { x, y, z }); } },
    weaponFiles: () => [],
    WEAPON_POINTS: { rifle: true },
    solveGrips: (lib, clip, bones, kinds) => {
      assert.ok(clip && clip.key, 'both grip postures must be available before calibration');
      events.push(['grips', lib.file, clip.key, kinds.length]);
    },
    hookRender: () => events.push(['hook render']),
    meshLodInstall: () => events.push(['mesh LOD']),
    MODEL_SET: 'fixtures',
    SMOOTH_NORMALS: false
  };
  return { state: st, events, api: factory.create(deps), ASSET };
}

(async () => {
  const one = setup();
  const promise = one.api.loadLibrary('scene');
  assert.equal(one.api.loadLibrary('scene'), promise, 'concurrent callers must share identical scene promise');
  assert.equal(await promise, true);
  await Promise.resolve();
  assert.equal(one.state.ready, true);
  assert.equal(one.state.error, null);
  assert.deepEqual(Object.keys(one.state.libs).sort(), ['ge.fbx', 'us.fbx']);
  assert.equal(Object.keys(one.state.weapons).length, 1);
  assert.deepEqual(Object.keys(one.state.clips).sort(), ['aim', 'pistolIdle']);
  assert.deepEqual(Array.from(one.state.animated), [0]);
  assert.equal(one.state.hips, 0);
  assert.equal(one.state.spineRoot, 1);
  assert.deepEqual(Array.from(one.state.upper), [false, true]);
  assert.equal(one.state.clipPack.loaded, true);
  assert.equal(one.state.clipPack.fromPack, 2);
  assert.equal(one.state.clipPack.fromFbx, 0);
  assert.equal(one.state.clipPack.fbxFiles, 0);
  assert.equal(one.events.filter(e => e[0] === 'container').length, 2, 'unique model FBXs load once');
  assert.equal(one.events.filter(e => e[0] === 'grips').length, 4, 'each model calibrates two weapon poses');
  assert.equal(one.events.filter(e => e[0] === 'hook render').length, 1);
  assert.equal(one.events.filter(e => e[0] === 'mark' && e[1] === 'ready').length, 1);
  assert.equal(one.ASSET.bindClipsMs >= 0, true);
  assert.equal(one.state.loading, promise, 'scene promise stays cached after readiness');
  assert.equal(await one.api.loadLibrary('scene'), true);

  const fallback = setup({ partial: true });
  assert.equal(await fallback.api.loadLibrary('scene'), true);
  assert.equal(fallback.state.clipPack.fromPack, 1);
  assert.equal(fallback.state.clipPack.fromFbx, 1);
  assert.equal(fallback.state.clipPack.fbxFiles, 1);
  assert.ok(fallback.state.clips.pistolIdle, 'missing packed clip must be populated by raw FBX');
  assert.equal(fallback.events.filter(e => e[0] === 'clip fallback')[0][1], 1);

  const fail = setup({ fail: true });
  const rejected = fail.api.loadLibrary('scene');
  assert.equal(await rejected, false, 'page-level FBX error resolves as not ready');
  assert.match(fail.state.error.message, /FBX loader failed/);
  assert.equal(fail.state.ready, false);
  assert.equal(fail.api.loadLibrary('scene'), rejected, 'failed load promise must not start duplicate retries');
  assert.equal(await rejected, false);
  assert.equal(fail.events.filter(e => e[0] === 'hook render').length, 0);
  console.log('PASS #456 R3 one-scene Promise reuse, pack/fallback arbitration, sidecar+model+weapon ordering, retarget/grip/render readiness, fatal FBX failure and no implicit retry');
})().catch(e => { console.error(e); process.exitCode = 1; });
