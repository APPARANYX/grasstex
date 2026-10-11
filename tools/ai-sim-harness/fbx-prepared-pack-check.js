#!/usr/bin/env node
'use strict';

/* #456 R3: original GCP1 binary decoding, pack fallback and builder order stay exact. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const mod = path.join(__dirname, '../../battle/modules');
const helperFile = '52-fbx-prepared-pack.js';
const backendFile = '53-fbx-soldier-backend.js';
const helper = fs.readFileSync(path.join(mod, helperFile), 'utf8');
const backend = fs.readFileSync(path.join(mod, backendFile), 'utf8');
assert.ok(helperFile < backendFile, 'module must load before backend');
assert.match(backend, /!root\.BattleFbxPreparedPack\s*\|\|/);
assert.match(backend, /root\.BattleFbxPreparedPack\.create\(/);
assert.match(backend, /function encodeClipPack\(/, 'hashed encoder must remain in backend');
assert.match(backend, /function convertClip\(/, 'hashed converter must remain in backend');
assert.doesNotMatch(backend, /function decodeClipPack\(/, 'decoder now belongs only to pack module');

const warnings = [], requests = [], telemetry = [], sources = [];
let mockResponse = null, loaderCalls = 0, builderCalls = 0, builderInput = null, t = 0;
const sandbox = {
  window: {}, TextEncoder, TextDecoder,
  console: { warn: (...items) => warnings.push(items.map(String).join(' ')) },
  fetch: async (url, options) => { requests.push([url, options]); return mockResponse; }
};
vm.runInNewContext(helper, sandbox, { filename: helperFile });
const factory = sandbox.window.BattleFbxPreparedPack;
assert.ok(factory && factory.create, 'pack module installs without Babylon or a scene');
vm.runInNewContext(helper, sandbox, { filename: helperFile });
assert.equal(sandbox.window.BattleFbxPreparedPack, factory, 'module must install idempotently');

class Quaternion { constructor(x, y, z, w) { Object.assign(this, { x, y, z, w }); } }
class Vector3 { constructor(x, y, z) { Object.assign(this, { x, y, z }); } }
const specs = { walk: ['Walk', true], run: ['Walk', false], idle: ['Idle', true] };
const config = {
  Q: Quaternion, V3: Vector3, FPS: 30, CLIP_PACK_FORMAT: 1,
  CLIP_PACK_FILE: 'prepared-clips.bin', CLIP_PACK_ON: true, CLIPS: specs,
  ASSET: { on: true },
  perfNow: () => ++t,
  assetLoaded: (...args) => telemetry.push(['loaded', ...args]),
  assetAdd: (...args) => telemetry.push(['add', ...args]),
  assetEntry: (...args) => { sources.push(args); return { bytes: 0 }; },
  ensureLoader: async () => { loaderCalls++; },
  assetBase: () => '../Assets/',
  loadClipFiles: async (scene, st, base, byFile) => {
    builderCalls++;
    assert.equal(scene, 'scene');
    assert.equal(base, '../Assets/');
    assert.deepEqual(JSON.parse(JSON.stringify(byFile)), { Walk: ['walk', 'run'], Idle: ['idle'] });
    st.src = { bones: ['hips'], rest: {} };
    return [{ key: 'idle' }, { key: 'run' }, { key: 'walk' }];
  },
  encodeClipPack: (src, list, extra) => {
    builderInput = { src, keys: list.map(x => x.key), extra };
    return 'GCP1-builder';
  }
};
const pack = factory.create(config);
assert.notEqual(factory.create(config), pack, 'consumer owns its own factory references');

function gcp1(header, floatValues) {
  const json = new TextEncoder().encode(JSON.stringify(header));
  const padded = Math.ceil(json.length / 4) * 4;
  const bytes = new Uint8Array(8 + padded + floatValues.length * 4);
  bytes.set([71, 67, 80, 49]);
  const view = new DataView(bytes.buffer);
  view.setUint32(4, padded, true);
  bytes.set(json, 8);
  bytes.fill(32, 8 + json.length, 8 + padded);
  floatValues.forEach((v, i) => view.setFloat32(8 + padded + i * 4, v, true));
  return bytes.buffer;
}
const floatValues = [...Array(12).keys()].map(x => x / 10)
  .concat([...Array(9).keys()].map(x => x / 3), [...Array(9).keys()].map(x => -x));
const header = {
  format: 1, fps: 30,
  src: { bones: ['hips', 'spine'], scheme: 'mixamo', rest: {
    hips: { q: [0, 0, 0, 1], p: [0, 0, 2] },
    spine: { q: [0, 0.5, 0, 0.866], p: [0, 0, 0.5] }
  } },
  clips: [{ key: 'walk', spec: specs.walk, loop: true, frames: 3, duration: 2 / 30,
    travel: 0.7, turnRate: 0.2, channels: [[0, 0, 12], [1, -1, 21]] }],
  sources: { Walk: 'test-sha' }
};
const binary = gcp1(header, floatValues);
const before = Buffer.from(binary).toString('hex');
const result = pack.decodeClipPack(binary);
assert.equal(result.src.bones.length, 2);
assert.equal(result.src.scheme, 'mixamo');
assert.ok(result.src.rest.hips.q instanceof Quaternion);
assert.ok(result.src.rest.hips.p instanceof Vector3);
assert.equal(result.src.rest.hips.p.z, 2);
assert.deepEqual(JSON.parse(JSON.stringify(result.sources)), { Walk: 'test-sha' });
assert.deepEqual(JSON.parse(JSON.stringify(result.clips.walk.spec)), specs.walk);
assert.equal(result.clips.walk.clip.file, 'Walk');
assert.equal(result.clips.walk.clip.loop, true);
assert.equal(result.clips.walk.clip.speed, 0);
assert.equal(result.clips.walk.clip.turnRate, 0.2);
assert.equal(result.clips.walk.clip.channels.length, 2);
assert.equal(result.clips.walk.clip.channels[0].rot.length, 12);
assert.equal(result.clips.walk.clip.channels[0].pos.length, 9);
assert.equal(result.clips.walk.clip.channels[1].rot, null);
assert.equal(result.clips.walk.clip.channels[1].pos.length, 9);
assert.equal(result.clips.walk.clip.channels[0].rot[0], 0);
assert.ok(Math.abs(result.clips.walk.clip.channels[0].pos[2] - floatValues[14]) < 1e-6);
assert.equal(Buffer.from(binary).toString('hex'), before, 'decoder must not alter packed source bytes');
assert.throws(() => pack.decodeClipPack(new ArrayBuffer(4)), /not a clip pack/);
const badMagic = binary.slice(0);
new Uint8Array(badMagic)[0] = 0;
assert.throws(() => pack.decodeClipPack(badMagic), /not a clip pack/);
const wrongFormat = gcp1({ ...header, format: 2 }, floatValues);
assert.throws(() => pack.decodeClipPack(wrongFormat), /clip pack format 2 at 30 fps/);
const wrongFps = gcp1({ ...header, fps: 24 }, floatValues);
assert.throws(() => pack.decodeClipPack(wrongFps), /runtime wants 1 at 30/);
const wrongPadding = binary.slice(0);
new DataView(wrongPadding).setUint32(4, 9, true);
assert.throws(() => pack.decodeClipPack(wrongPadding), /not a clip pack/);

(async () => {
  mockResponse = { ok: true, arrayBuffer: async () => binary };
  const downloaded = await pack.fetchClipPack('../Assets/');
  assert.deepEqual(JSON.parse(JSON.stringify(downloaded.sources)), { Walk: 'test-sha' });
  assert.deepEqual(JSON.parse(JSON.stringify(requests[0])), [
    '../Assets/animations/prepared-clips.bin', { cache: 'no-cache' }
  ]);
  assert.equal(telemetry[0][0], 'loaded');
  assert.deepEqual(telemetry[1].slice(0, 3), ['add', 'pack', 'prepared-clips.bin']);
  assert.equal(sources.length, 2, 'missing asset byte count invokes assetEntry in original path twice');
  mockResponse = { ok: false, status: 404 };
  assert.equal(await pack.fetchClipPack('../Assets/'), null, 'HTTP failure must fall back to raw FBX');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /HTTP 404/);
  const disabled = factory.create({ ...config, CLIP_PACK_ON: false });
  const count = requests.length;
  assert.equal(await disabled.fetchClipPack('../Assets/'), null);
  assert.equal(requests.length, count, 'explicit ?clipPack=0 must skip fetch');
  assert.deepEqual(JSON.parse(JSON.stringify(pack.clipsByFile(['idle', 'run', 'walk']))), {
    Idle: ['idle'], Walk: ['run', 'walk']
  });
  assert.equal(await pack.buildClipPack('scene', { converter: 'hash' }), 'GCP1-builder');
  assert.equal(loaderCalls, 1);
  assert.equal(builderCalls, 1);
  assert.deepEqual(builderInput.keys, ['walk', 'run', 'idle'], 'builder must restore CLIPS table order');
  assert.equal(builderInput.extra.converter, 'hash');
  assert.deepEqual(builderInput.src.bones, ['hips']);
  console.log('PASS #456 R3 GCP1 binary offsets, quaternion/rest reconstruction, full metadata, invalid pack/fps/format, no-cache fetch, raw-FBX fallback, pack-disabled switch and offline builder order');
})().catch(e => { console.error(e); process.exitCode = 1; });
