#!/usr/bin/env node
'use strict';
/* Audio format (module 00-audio-format.js): Opus-in-CAF twins only where a probe decoded one.

   The twins are exactly the weapon.<model> clips of the real manifest; until the probe succeeds,
   or when it fails (no twin served, a browser that cannot decode CAF, no OfflineAudioContext), every
   URL stays the manifest's MP3; after it succeeds a twin's path, bare or joined to the audio base,
   becomes .caf and nothing else changes; `?audioFormat=mp3` never probes. */
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
const okFetch = (seen) => (u) => {
  seen && seen.push(u);
  return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
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
