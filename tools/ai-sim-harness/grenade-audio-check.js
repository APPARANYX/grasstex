#!/usr/bin/env node
'use strict';
/* Grenade audio (module 24a-grenade-audio.js, presentation only).

   A man who commits a throw arms his grenade once, during the wind-up: the US Mk 2's pin, the German
   M24's cap and cord (`igniter`). A released Mk 2 throws its lever (`spoon`); an M24 has none. A burst
   plays one `explosion` where it lands, after the sound has travelled. Arming foley carries
   FOLEY_RANGE, the burst EXPLOSION_RANGE. The grenade owner's own hooks still run, the module reads
   no RNG and writes nothing on the soldiers; `?grenadeAudio=0` and `?grenades=0` install nothing. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'battle/modules/24a-grenade-audio.js'), 'utf8');
const CORE = fs.readFileSync(path.join(__dirname, '..', '..', 'battle/core-runtime.js'), 'utf8');
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
const pending = new Set();
function load(search) {
  const r = {};
  if (search != null) r.location = { search };
  new Function('window', 'globalThis', 'location', CORE)(r, r, r.location);
  r.BattleGrenades = {
    parseOn: s => {
      const m = /[?&]grenades=([^&#]*)/.exec(s || '');
      return !m || m[1] === '1';
    },
    on: () => true,
    pendingOf: s => (pending.has(s) ? {} : null)
  };
  new Function('window', 'globalThis', 'location', SRC)(r, r, r.location);
  return r.BattleGrenadeAudio;
}
const A = load();
const cam = { x: 0, y: 1.6, z: 0 };

test('arming foley carries FOLEY_RANGE, a burst EXPLOSION_RANGE, and closer is louder', () => {
  assert.equal(A.cue('pin', { x: A.FOLEY_RANGE - 1, y: 1, z: 0 }, cam).kind, 'pin');
  assert.equal(A.cue('pin', { x: A.FOLEY_RANGE + 1, y: 1, z: 0 }, cam), null);
  assert.equal(A.cue('explosion', { x: A.EXPLOSION_RANGE - 5, y: 0, z: 0 }, cam).kind, 'explosion');
  assert.equal(A.cue('explosion', { x: A.EXPLOSION_RANGE + 5, y: 0, z: 0 }, cam), null);
  const g = [2, 10, 40, 200, 700].map(x => A.cue('explosion', { x, y: 0, z: 0 }, cam).gain);
  for (let i = 1; i < g.length; i++) assert.ok(g[i] < g[i - 1], g.join());
  assert.ok(g[g.length - 1] > 0);
  const f = [1, 10, 25].map(x => A.cue('spoon', { x, y: 1, z: 0 }, cam).gain);
  for (let i = 1; i < f.length; i++) assert.ok(f[i] < f[i - 1], f.join());
  assert.equal(A.cue('throw', { x: 1, y: 1, z: 0 }, cam), null);
});
test('the Mk 2 arms with its pin and throws its spoon; the M24 arms with its cord and has no lever', () => {
  assert.deepEqual(A.ARMING, { mk2: 'pin', m24: 'igniter' });
  assert.deepEqual(A.RELEASE, { mk2: 'spoon' });
});

function man(id, faction, x) {
  const s = { id, faction, dead: false, root: { position: Object.freeze({ x, y: 0, z: 0 }) } };
  return Object.freeze(s);
}
function rig() {
  pending.clear();
  const played = [],
    travel = [],
    calls = [];
  let step = null;
  const voice = (key, i) => ({
    endsAt: 0,
    sound: {
      setPosition(p) {
        this.p = p;
      },
      setVolume(g) {
        this.g = g;
      },
      setPlaybackRate() {},
      play() {
        played.push({ key, i, p: this.p, g: this.g });
      }
    }
  });
  const voices = {};
  for (const k of Object.keys(A.KINDS)) voices[k] = [0, 1, 2].map(i => voice(k, i));
  const us = man(1, 'us', 5),
    ge = man(2, 'ge', -8),
    farUs = man(3, 'us', 200);
  const sim = {
    scene: null,
    rosterOf: f => (f === 'us' ? [us, farUs] : [ge]),
    onGrenade: (...a) => calls.push(['release', a]),
    onGrenadeBurst: (...a) => calls.push(['burst', a])
  };
  Object.defineProperty(sim, 'random', {
    get() {
      throw new Error('grenade audio read the RNG');
    }
  });
  A.install(sim, {
    voices,
    now: () => 0,
    camera: () => ({ position: cam }),
    later: (ms, fn) => {
      travel.push(ms);
      fn();
    },
    observe: fn => (step = fn)
  });
  return {
    sim,
    us,
    ge,
    farUs,
    played,
    travel,
    calls,
    step: () => step(),
    keys: () => played.map(p => p.key)
  };
}

test("a committed throw arms once per wind-up, by the thrower's grenade kind", () => {
  const R = rig();
  R.step();
  assert.deepEqual(R.keys(), []);
  pending.add(R.us);
  pending.add(R.ge);
  R.step();
  R.step();
  assert.deepEqual(R.keys().sort(), ['igniter', 'pin']);
  pending.clear();
  R.step();
  pending.add(R.us);
  R.step();
  assert.deepEqual(R.keys().sort(), ['igniter', 'pin', 'pin'], 'a second throw arms again');
});
test('a man out of earshot arms silently', () => {
  const R = rig();
  pending.add(R.farUs);
  R.step();
  assert.deepEqual(R.keys(), []);
});
test('release throws the Mk 2 spoon only, and the owner hook still runs', () => {
  const R = rig();
  const mk2 = Object.freeze({
    id: 7,
    kind: 'mk2',
    from: Object.freeze({ x: 4, y: 1.4, z: 0 }),
    to: { x: 30, y: 0, z: 0 }
  });
  const m24 = Object.freeze({
    id: 8,
    kind: 'm24',
    from: Object.freeze({ x: -4, y: 1.4, z: 0 }),
    to: { x: -30, y: 0, z: 0 }
  });
  R.sim.onGrenade(mk2, R.us);
  R.sim.onGrenade(m24, R.ge);
  assert.deepEqual(R.keys(), ['spoon']);
  assert.deepEqual(
    R.calls.map(c => c[0]),
    ['release', 'release']
  );
});
test('a burst plays one explosion where it lands, after the sound has travelled', () => {
  const R = rig();
  const g = Object.freeze({
    id: 9,
    kind: 'm24',
    from: { x: 0, y: 1, z: 0 },
    to: Object.freeze({ x: 343, y: 0, z: 0 })
  });
  R.sim.onGrenadeBurst(g, { wounded: [], suppressed: 0 });
  assert.deepEqual(R.keys(), ['explosion']);
  assert.equal(R.played[0].p.x, 343);
  assert.ok(Math.abs(R.travel[R.travel.length - 1] - 1000) < 15, String(R.travel));
  assert.deepEqual(
    R.calls.map(c => c[0]),
    ['burst']
  );
  R.sim.onGrenadeBurst(Object.freeze({ id: 10, kind: 'mk2', to: { x: 2000, y: 0, z: 0 } }));
  assert.deepEqual(R.keys(), ['explosion'], 'out of earshot');
});
test('three explosions at once use three takes; a fourth while all sound is dropped', () => {
  const R = rig();
  for (let i = 0; i < 4; i++)
    R.sim.onGrenadeBurst(Object.freeze({ id: i, kind: 'mk2', to: { x: 10 + i, y: 0, z: 0 } }));
  assert.equal(R.played.length, 3);
  assert.deepEqual(R.played.map(p => p.i).sort(), [0, 1, 2]);
  assert.equal(R.sim._grenadeAudio.dropped, 1);
});
test('?grenadeAudio=0 and ?grenades=0 install nothing', () => {
  for (const q of ['?grenadeAudio=0', '?grenades=0']) {
    const off = load(q);
    assert.equal(off.on, false, q);
    const sim = { onGrenade: null };
    off.install(sim, { voices: {}, observe: () => assert.fail('observed') });
    assert.equal(sim.onGrenade, null, q);
  }
  assert.equal(load('?grenadeAudio=1').on, true);
});
console.log(`grenade-audio-check: ${n} passed`);
