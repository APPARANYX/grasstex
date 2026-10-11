#!/usr/bin/env node
'use strict';

/* #456 R3: real import lifecycle promises using a fake Babylon loader and clip data. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const base = path.join(__dirname, '../../battle/modules');
const helperFile = '52-fbx-asset-import.js';
const source = fs.readFileSync(path.join(base, helperFile), 'utf8');
const backend = fs.readFileSync(path.join(base, '53-fbx-soldier-backend.js'), 'utf8');
assert.ok(helperFile < '53-fbx-soldier-backend.js');
assert.match(backend, /!root\.BattleFbxAssetImport\s*\|\|/);
assert.match(backend, /root\.BattleFbxAssetImport\.create/);
for (const name of ['assetBase', 'ensureLoader', 'loadContainer', 'loadClipFiles']) {
  assert.doesNotMatch(backend, new RegExp('function ' + name + '\\('));
  assert.match(source, new RegExp('function ' + name + '\\('));
  assert.match(backend, new RegExp(name + ' = FBX_IMPORT\\.' + name));
}
const injected = [];
let installed = false;
const documents = {
  createElement: type => { assert.equal(type, 'script'); return { async: false, src: '', onload: null }; },
  head: { appendChild: el => { injected.push(el); } }
};
const sandbox = { window: {}, document: documents, console, Promise };
vm.runInNewContext(source, sandbox, { filename: helperFile });
const ctor = sandbox.window.BattleFbxAssetImport;
assert.equal(typeof ctor.create, 'function');
vm.runInNewContext(source, sandbox, { filename: helperFile });
assert.equal(sandbox.window.BattleFbxAssetImport, ctor, 'module install must be idempotent');

const timeline = [];
let parseCount = 0, rigCount = 0, progress = 0, tick = 0;
const objects = [];
const babylon = {
  Engine: { Version: '7.55.0' },
  LoadAssetContainerAsync: async (url, scene, opts) => {
    parseCount++;
    assert.equal(scene, 'scene');
    assert.equal(opts.pluginExtension, '.fbx');
    timeline.push(['parse', url]);
    const c = {
      url,
      dispose() { timeline.push(['dispose', url]); }
    };
    objects.push(c);
    return c;
  }
};
const api = ctor.create({
  BABYLON: babylon,
  ASSET: { on: true },
  perfNow: () => ++tick,
  assetLoaded: (kind, file, url, t0) => timeline.push(['loaded', kind, file, url, t0]),
  assetAdd: (...args) => timeline.push(['add', ...args]),
  CLIPS: { idle: ['idle-fbx', true], moving: ['moving-fbx', true], alt: ['moving-fbx', false] },
  sourceRig: c => { rigCount++; return { bones: ['hips', 'arm'], file: c.url }; },
  convertClip: (c, key, spec, bones) => {
    timeline.push(['convert', key, spec[0], bones.length]);
    return { key, file: c.url };
  }
});
sandbox.window.BATTLE_ASSET_BASE = '../Assets/X/';
assert.equal(api.assetBase(), '../Assets/X/');
sandbox.window.BATTLE_SOLDIER_ASSET_BASE = '/preview/assets';
assert.equal(api.assetBase(), '/preview/assets/');
delete sandbox.window.BATTLE_SOLDIER_ASSET_BASE;
delete sandbox.window.BATTLE_ASSET_BASE;
assert.equal(api.assetBase(), '../Assets/');

(async () => {
  const first = api.ensureLoader();
  const second = api.ensureLoader();
  assert.equal(first, second, 'concurrent FBX loader requests share one Promise');
  assert.equal(injected.length, 1, 'exactly one loader script injected');
  assert.equal(injected[0].async, true);
  assert.match(injected[0].src, /babylonjs-loaders@7\.55\.0\/babylonjs\.loaders\.min\.js/);
  babylon.FBXFileLoader = function FBXFileLoader() {};
  injected[0].onload();
  await first;
  await second;
  await api.ensureLoader();
  assert.equal(injected.length, 1, 'installed loader needs no duplicate request');

  const direct = await api.loadContainer('scene', '/test.fbx', 'model', 'soldier.fbx');
  assert.equal(direct.url, '/test.fbx');
  assert.equal(parseCount, 1);
  assert.deepEqual(timeline.slice(0, 2), [
    ['parse', '/test.fbx'], ['loaded', 'model', 'soldier.fbx', '/test.fbx', 1]
  ]);
  const st = { src: null, bones: null };
  const byFile = { 'moving-fbx': ['moving', 'alt'], 'idle-fbx': ['idle'] };
  const converted = await api.loadClipFiles('scene', st, '../Assets/', byFile, () => progress++);
  assert.deepEqual(converted.map(c => c.key), ['moving', 'alt', 'idle']);
  assert.deepEqual(Array.from(st.bones), ['hips', 'arm']);
  assert.equal(rigCount, 1, 'first available animation establishes the source rig');
  assert.equal(parseCount, 3, 'one FBX load per file, not per clip key');
  assert.equal(progress, 2, 'one progress tick after each completed FBX file');
  assert.equal(objects.length, 3);
  assert.equal(timeline.filter(e => e[0] === 'dispose').length, 2, 'every animation container disposed');
  assert.equal(timeline.filter(e => e[0] === 'add' && e[1] === 'clip' && e[3] === 'convert').length, 2);
  assert.equal(timeline.filter(e => e[0] === 'add' && e[1] === 'clip' && e[3] === 'dispose').length, 2);
  await api.loadClipFiles('scene', st, '../Assets/', {}, () => progress++);
  assert.equal(progress, 2, 'empty missing-pack list must not create work');

  const broken = ctor.create({
    BABYLON: babylon,
    ASSET: { on: true },
    perfNow: () => ++tick,
    assetLoaded: () => {},
    assetAdd: (...args) => timeline.push(['add', ...args]),
    CLIPS: { fail: ['broken', true] },
    sourceRig: () => ({ bones: ['hips'] }),
    convertClip: () => { throw new Error('invalid animation'); }
  });
  let cleaned = 0;
  const oldLoad = babylon.LoadAssetContainerAsync;
  babylon.LoadAssetContainerAsync = async () => ({ dispose() { cleaned++; } });
  let callback = 0;
  await assert.rejects(broken.loadClipFiles('scene', { src: null }, '../Assets/', { broken: ['fail'] }, () => callback++),
    /invalid animation/);
  assert.equal(cleaned, 1, 'failed raw FBX converter must still dispose imported container');
  assert.equal(callback, 1, 'failed fallback still advances progress');
  babylon.LoadAssetContainerAsync = oldLoad;

  console.log('PASS #456 R3 FBX loader promise dedup, exact Babylon loader URL, source fallback grouping/disposal, independent asset accounting and error cleanup');
})().catch(e => { console.error(e); process.exitCode = 1; });
