#!/usr/bin/env node
'use strict';
/* Audio format (module 00-audio-format.js): Opus twins only where a probe decoded one.

   The twins are exactly the weapon.<model> clips of the real manifest (every MP3 with
   `opusTwins: "all"`); the probe tries CAF, then Ogg; until one succeeds, or when both fail (no twin
   served, a browser that decodes neither, no OfflineAudioContext), every URL stays the manifest's MP3;
   after one succeeds a twin's path, bare or joined to the audio base, takes that extension and nothing
   else changes; `?audioFormat=mp3` never probes, `=ogg` probes Ogg only. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'battle/modules/00-audio-format.js'), 'utf8');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'Assets/audio/manifest.json'), 'utf8'));
let n = 0;
const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}
function load(search, base) {
  const r = { BATTLE_AUDIO_MANIFEST: MANIFEST, BATTLE_AUDIO_BASE: base || '/grasstex/Assets/audio/' };
  if (search != null) r.location = { search };
  new Function('window', 'globalThis', 'location', SRC)(r, r, r.location);
  return r.BattleAudioFormat;
}
const SIZE = { caf: 8, ogg: 16, mp3: 24 };
const okFetch = (seen) => (u) => {
  seen && seen.push(u);
  const ext = u.split('.').pop();
  return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(SIZE[ext] || 4)) });
};
/* A browser that decodes only the named containers. */
const decoder = (...exts) =>
  class {
    decodeAudioData(buf, ok, fail) {
      if (exts.some((e) => SIZE[e] === buf.byteLength)) return Promise.resolve({ length: 48000 }).then((d) => (ok(d), d));
      const e = new Error('EncodingError');
      fail(e);
      return Promise.reject(e);
    }
  };
class GoodCtx {
  decodeAudioData(buf, ok) {
    return Promise.resolve({ length: 48000 }).then((d) => (ok(d), d));
  }
}
class BadCtx {
  decodeAudioData(buf, ok, fail) {
    const e = new Error('EncodingError');
    fail(e);
    return Promise.reject(e);
  }
}
const fire = MANIFEST.categories['weapon.mg42'].fire[0];

test('the twins are the weapon.<model> clips and nothing else', () => {
  const F = load(),
    set = F.twinSet(MANIFEST);
  let weapon = 0;
  for (const [name, groups] of Object.entries(MANIFEST.categories))
    for (const files of Object.values(groups))
      for (const f of files) {
        if (name.startsWith('weapon.')) {
          weapon++;
          assert.ok(set[f], f);
        } else assert.ok(!set[f], f);
      }
  assert.equal(Object.keys(set).length, weapon);
  assert.ok(weapon > 800);
});
test('before any probe, every URL is the MP3', () => {
  const F = load();
  assert.equal(F.state, 'mp3');
  assert.equal(F.url(fire), fire);
  assert.equal(F.url('/grasstex/Assets/audio/' + fire), '/grasstex/Assets/audio/' + fire);
});
test('a decoded twin switches the twins, and only the twins, to .caf', async () => {
  const F = load(),
    seen = [];
  assert.equal(await F.probe({ fetch: okFetch(seen), Ctx: GoodCtx }), 'caf');
  assert.equal(seen.length, 1);
  assert.ok(seen[0].endsWith('.caf'));
  assert.equal(F.url(fire), fire.replace(/\.mp3$/, '.caf'));
  assert.equal(F.url('/grasstex/Assets/audio/' + fire), '/grasstex/Assets/audio/' + fire.replace(/\.mp3$/, '.caf'));
  assert.equal(F.url('combat/flyby/crack-01.mp3'), 'combat/flyby/crack-01.mp3');
  assert.equal(F.url('rifle.mp3'), 'rifle.mp3');
});
test('a browser that decodes Ogg but not CAF (Chrome, Firefox) gets the .ogg twins', async () => {
  const F = load(),
    seen = [];
  assert.equal(await F.probe({ fetch: okFetch(seen), Ctx: decoder('ogg') }), 'ogg');
  assert.deepEqual(seen.map((u) => u.split('.').pop()), ['caf', 'ogg']);
  assert.equal(F.url(fire), fire.replace(/\.mp3$/, '.ogg'));
  assert.equal(F.url('combat/flyby/crack-01.mp3'), 'combat/flyby/crack-01.mp3');
});
test('Safari (decodes both) stops at CAF; a browser that decodes neither stays MP3', async () => {
  const s = load(),
    seen = [];
  assert.equal(await s.probe({ fetch: okFetch(seen), Ctx: decoder('caf', 'ogg') }), 'caf');
  assert.equal(seen.length, 1);
  const n = load();
  assert.equal(await n.probe({ fetch: okFetch(), Ctx: decoder() }), 'mp3');
  assert.equal(n.url(fire), fire);
});
test('opusTwins "all" swaps every MP3 the page loads, not only the weapon clips', async () => {
  const r = { BATTLE_AUDIO_MANIFEST: Object.assign({}, MANIFEST, { opusTwins: 'all' }), BATTLE_AUDIO_BASE: '/a/' };
  new Function('window', 'globalThis', 'location', SRC)(r, r, undefined);
  const F = r.BattleAudioFormat;
  assert.equal(await F.probe({ fetch: okFetch(), Ctx: decoder('ogg') }), 'ogg');
  assert.equal(F.url('voices/us/cover-set-01.pitch-low.mp3'), 'voices/us/cover-set-01.pitch-low.ogg');
  assert.equal(F.url('/a/combat/flyby/crack-01.mp3'), '/a/combat/flyby/crack-01.ogg');
  assert.equal(F.url('acoustics.json'), 'acoustics.json');
});
test('?audioFormat=ogg probes Ogg only', async () => {
  const F = load('?audioFormat=ogg'),
    seen = [];
  assert.equal(await F.probe({ fetch: okFetch(seen), Ctx: decoder('caf', 'ogg') }), 'ogg');
  assert.deepEqual(seen.map((u) => u.split('.').pop()), ['ogg']);
});
test('a browser that cannot decode it, a missing twin or no OfflineAudioContext stays MP3', async () => {
  const a = load();
  assert.equal(await a.probe({ fetch: okFetch(), Ctx: BadCtx }), 'mp3');
  assert.equal(a.url(fire), fire);
  const b = load();
  assert.equal(await b.probe({ fetch: () => Promise.resolve({ ok: false }), Ctx: GoodCtx }), 'mp3');
  const c = load();
  assert.equal(await c.probe({ fetch: () => Promise.reject(new Error('offline')), Ctx: GoodCtx }), 'mp3');
  const d = load();
  assert.equal(await d.probe({ fetch: okFetch(), Ctx: null }), 'mp3');
  assert.equal(d.url(fire), fire);
});
test('?audioFormat=mp3 never probes', async () => {
  const F = load('?audioFormat=mp3'),
    seen = [];
  assert.equal(await F.probe({ fetch: okFetch(seen), Ctx: GoodCtx }), 'mp3');
  assert.equal(seen.length, 0);
});
test('ready resolves to the settled format', async () => {
  const F = load();
  const p = F.probe({ fetch: okFetch(), Ctx: GoodCtx });
  assert.equal(F.state, 'probing');
  assert.equal(await F.ready, 'caf');
  await p;
});
(async () => {
  for (const [name, fn] of tests) {
    await fn();
    n++;
    console.log('PASS ' + name);
  }
  console.log(`audio-format-check: ${n} checks passed`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
