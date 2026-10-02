#!/usr/bin/env node
'use strict';
/* Bullet flyby audio (module 15-combat-audio.js, presentation only).

   A round whose drawn line passes within RANGE of the camera plays one clip: a crack for a
   supersonic round within CRACK_WITHIN, a whiz beyond it or for a .45; nothing past RANGE and
   nothing for a round still within MUZZLE_SKIP of its muzzle (the shooter's own report, the
   possessed soldier's own fire). One round never plays two clips; at most MAX_VOICES sound at
   once and starts are GAP ms apart, so a burst past the camera is not a wall of noise. A delayed
   round of a burst plays when its tracer shows (presentAfter). The module reads no combat RNG
   and writes nothing on the soldiers or the shot; `?flyby=0` installs nothing. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'battle/modules/15-combat-audio.js'), 'utf8');
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function load(search) {
  const r = {};
  if (search != null) r.location = { search };
  new Function('window', 'globalThis', 'location', SRC)(r, r, r.location);
  return r.BattleCombatAudio;
}
const F = load();
const cam = { x: 0, y: 1.6, z: 0 };
/* A round flying along x at height 1.6, passing `miss` metres from the camera on z. */
const line = (miss, x0 = -200, x1 = 200) => [
  { x: x0, y: 1.6, z: miss },
  { x: x1, y: 1.6, z: miss }
];
const rifle = Object.freeze({ id: 1, weapon: Object.freeze({ kind: 'rifle', profile: 'kar98k' }) });
const thompson = Object.freeze({ id: 2, weapon: Object.freeze({ kind: 'smg', profile: 'thompson' }) });
const colt = Object.freeze({ id: 3, weapon: Object.freeze({ kind: 'pistol', profile: 'm1911a1' }) });
const mp40 = Object.freeze({ id: 4, weapon: Object.freeze({ kind: 'smg', profile: 'mp40' }) });

test('a supersonic round cracks close, zips farther out, plays nothing past the range', () => {
  assert.equal(F.flyby(...line(2), cam, rifle).kind, 'crack');
  assert.equal(F.flyby(...line(F.CRACK_WITHIN - 0.1), cam, mp40).kind, 'crack');
  assert.equal(F.flyby(...line(F.CRACK_WITHIN + 0.5), cam, rifle).kind, 'whiz');
  assert.equal(F.flyby(...line(F.GROUPS.flyby.range - 0.1), cam, rifle).kind, 'whiz');
  assert.equal(F.flyby(...line(F.GROUPS.flyby.range + 0.1), cam, rifle), null);
  assert.equal(F.GROUPS.flyby.range, 10);
});
test('a .45 (Thompson, M1911A1) only whizzes', () => {
  assert.equal(F.flyby(...line(1), cam, thompson).kind, 'whiz');
  assert.equal(F.flyby(...line(1), cam, colt).kind, 'whiz');
});
test('closer is louder', () => {
  const g = [1, 3, 5, 7, 9.5].map((m) => F.flyby(...line(m), cam, rifle).gain);
  for (let i = 1; i < g.length; i++) assert.ok(g[i] < g[i - 1], g.join());
  assert.ok(g[g.length - 1] > 0);
});
test("the shooter's own round (camera at his muzzle, or behind him) is not a flyby", () => {
  assert.equal(F.flyby({ x: 1, y: 1.6, z: 0 }, { x: 300, y: 1.6, z: 0 }, cam, rifle), null);
  assert.equal(F.flyby({ x: 3, y: 1.6, z: 0.5 }, { x: 300, y: 1.6, z: 0.5 }, cam, rifle), null);
  /* Fired from beside the camera but passing within the skip distance of the muzzle. */
  assert.equal(F.flyby({ x: -4, y: 1.6, z: 2 }, { x: 300, y: 1.6, z: 2 }, cam, rifle), null);
});
test('a round that ends near the camera counts at its end point; one that ends short does not', () => {
  assert.equal(F.flyby({ x: -200, y: 1.6, z: 0 }, { x: -3, y: 1.6, z: 0 }, cam, rifle).kind, 'crack');
  assert.equal(F.flyby({ x: -200, y: 1.6, z: 0 }, { x: -30, y: 1.6, z: 0 }, cam, rifle), null);
});

function rig(opts = {}) {
  let t = 0;
  const played = [],
    later = [],
    travel = [];
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
        played.push({ key, i, p: this.p, g: this.g, t });
      }
    }
  });
  const keys = ['flyby.crack', 'flyby.whiz', 'ricochet.whine', 'flesh.hit', 'pain.wounded', 'pain.down'].concat(
    ['dirt', 'masonry', 'wood', 'metal', 'vegetation'].map((k) => 'impacts.' + k)
  );
  const voices = {};
  for (const k of keys) voices[k] = opts.empty ? [] : [0, 1, 2, 3].map((i) => voice(k, i));
  const sim = {
    scene: null,
    presentAfter(delay, fn) {
      later.push({ delay, fn });
    },
    heightAt: () => 0
  };
  Object.defineProperty(sim, 'random', {
    get() {
      throw new Error('combat audio read the combat RNG');
    }
  });
  const shots = [];
  sim.onShot = (...a) => shots.push(a);
  F.install(sim, {
    voices,
    now: () => t,
    camera: () => ({ position: cam }),
    later: (ms, fn) => (opts.instant ? fn() : travel.push({ ms, fn }))
  });
  return {
    sim,
    played,
    later,
    travel,
    shots,
    advance(ms) {
      t += ms;
    },
    keys: () => played.map((p) => p.key)
  };
}
const far = (x) => ({ x: x, y: 1.6, z: 300 });
const shot = (miss, extra = {}) => {
  const [a, b] = line(miss);
  return Object.freeze({ mode: 'raycast', origin: a, impact: b, stoppedBy: 'spent', delay: 0, ...extra });
};

test('one round plays one clip, at the pass point, and the old onShot still runs', () => {
  const R = rig();
  R.sim.onShot(rifle, null, false, 400, shot(2));
  assert.deepEqual(R.keys(), ['flyby.crack']);
  assert.deepEqual(R.played[0].p, { x: 0, y: 1.6, z: 2 });
  assert.equal(R.shots.length, 1);
});
test('a burst arriving at one instant is one sound, not a cacophony', () => {
  const R = rig();
  for (let i = 0; i < 8; i++) R.sim.onShot(rifle, null, false, 400, shot(2 + i * 0.1));
  assert.equal(R.played.length, 1);
  assert.equal(R.sim._combatAudio.dropped.flyby, 7);
});
test('rounds a gap apart play in turn, never more than the cap at once', () => {
  const R = rig(),
    G = F.GROUPS.flyby;
  for (let i = 0; i < 12; i++) {
    R.sim.onShot(rifle, null, false, 400, shot(3));
    R.advance(G.gap + 1);
  }
  const starts = R.played.map((p) => p.t);
  for (const s of starts) assert.ok(starts.filter((u) => u <= s && s < u + G.len.crack * 1000).length <= G.voices);
  assert.ok(R.played.length >= 4 && R.played.length < 12, String(R.played.length));
  for (let i = 1; i < starts.length; i++) assert.ok(starts[i] - starts[i - 1] >= G.gap);
});
test('a clip is not restarted while it sounds, and variants rotate', () => {
  const R = rig();
  for (let i = 0; i < 20; i++) {
    R.sim.onShot(rifle, null, false, 400, shot(3));
    R.advance(400);
  }
  assert.equal(R.played.length, 20);
  assert.ok(new Set(R.played.map((p) => p.i)).size > 1);
});
test('a delayed round of a burst plays when its tracer shows', () => {
  const R = rig();
  R.sim.onShot(rifle, null, false, 400, shot(2, { delay: 0.1 }));
  assert.equal(R.played.length, 0);
  assert.equal(R.later[0].delay, 0.1);
  R.later[0].fn();
  assert.equal(R.played.length, 1);
});
test('a far round, or no clips on disk yet, plays nothing and throws nothing', () => {
  const R = rig();
  R.sim.onShot(rifle, null, false, 400, shot(30));
  assert.equal(R.played.length + R.travel.length, 0);
  const E = rig({ empty: true, instant: true });
  E.sim.onShot(rifle, null, false, 400, shot(2));
  assert.equal(E.played.length, 0);
});
test('a suppressive burst past the camera is one flyby', () => {
  const R = rig();
  const shooter = { id: 9, weapon: { kind: 'lmg', profile: 'mg42' }, root: { position: { x: -200, y: 0.2, z: 1 } } };
  R.sim.onSuppressiveShot(shooter, { x: 200, z: 1 }, 0, 7);
  assert.deepEqual(R.keys(), ['flyby.crack']);
});

test('surfaces are told apart; a body is flesh', () => {
  assert.equal(F.surface({ stoppedBy: 'soldier' }), 'flesh');
  assert.equal(F.surface({ blocker: 'ground' }), 'dirt');
  assert.equal(F.surface({ surface: 'steel' }), 'metal');
  assert.equal(F.surface({ surface: 'tree' }), 'wood');
  assert.equal(F.surface({ surface: 'hedge' }), 'vegetation');
  assert.equal(F.surface({ surface: 'building' }), 'masonry');
});
test('a round ending near the camera plays one impact, after the sound arrives; far off nothing', () => {
  const R = rig();
  R.sim.onShot(rifle, null, false, 400, Object.freeze({ mode: 'raycast', origin: far(-300), impact: { x: 20, y: 0, z: 0 }, blocker: 'ground', stoppedBy: 'terrain' }));
  assert.equal(R.played.length, 0);
  assert.equal(R.travel.length, 1);
  assert.ok(Math.abs(R.travel[0].ms - (Math.hypot(20, 1.6) / 343) * 1000) < 1);
  R.travel[0].fn();
  assert.deepEqual(R.keys(), ['impacts.dirt']);
  const Q = rig({ instant: true });
  Q.sim.onShot(rifle, null, false, 400, Object.freeze({ origin: far(-300), impact: { x: 45, y: 0, z: 0 }, blocker: 'ground' }));
  assert.equal(Q.played.length, 0);
});
test('stone and metal ricochet instead of an impact, never both, and the choice is a fixed hash', () => {
  const pick = (x, extra = {}) => {
    const R = rig({ instant: true });
    R.sim.onShot(rifle, null, false, 400, Object.freeze({ origin: far(-300), impact: { x, y: 1, z: 5 }, surface: 'building', ...extra }));
    return R.keys().filter((k) => !k.startsWith('flyby'));
  };
  const outcomes = [];
  for (let x = 0; x < 30; x += 0.5) {
    const k = pick(x);
    assert.equal(k.length, 1, k.join());
    assert.deepEqual(pick(x), k);
    outcomes.push(k[0]);
  }
  const ric = outcomes.filter((k) => k === 'ricochet.whine').length;
  assert.ok(ric > 0 && ric < outcomes.length / 2, String(ric));
  /* Dirt never ricochets. */
  for (let x = 0; x < 30; x += 0.5) assert.deepEqual(pick(x, { surface: '', blocker: 'ground' }), ['impacts.dirt']);
  /* Grazing makes it likelier. */
  let graze = 0;
  for (let x = 0; x < 30; x += 0.5)
    if (pick(x, { direction: { x: 1, y: 0, z: 0.1 }, normal: { x: 0, y: 0, z: 1 } })[0] === 'ricochet.whine') graze++;
  assert.ok(graze > ric, graze + ' vs ' + ric);
});
const victim = (id, x) => ({ id, root: { position: { x, y: 0, z: 0 } } });
const bodyShot = (outcome, zone, extra = {}) =>
  Object.freeze({
    mode: 'raycast',
    origin: far(-300),
    impact: { x: 15, y: 1.2, z: 0 },
    stoppedBy: 'soldier',
    passes: [{ victim: victim(7, 15), entry: { x: 15, y: 1.2, z: 0 }, wound: { outcome, zone } }],
    ...extra
  });
test('a man hit plays one flesh hit and one cry; a round stopped in him plays no impact', () => {
  const R = rig({ instant: true });
  R.sim.onShot(rifle, null, true, 400, bodyShot('wounded', 'arm'));
  assert.deepEqual(R.keys().sort(), ['flesh.hit', 'pain.wounded']);
  const D = rig({ instant: true });
  D.sim.onShot(rifle, null, true, 400, bodyShot('dropped', 'chest'));
  assert.deepEqual(D.keys().sort(), ['flesh.hit', 'pain.down']);
  const K = rig({ instant: true });
  K.sim.onShot(rifle, null, true, 400, bodyShot('killed', 'head'));
  assert.deepEqual(K.keys(), ['flesh.hit']);
});
test('a round through one man into the next: two hits, one cry (the gap), then the impact where it ended', () => {
  const R = rig({ instant: true });
  R.sim.onShot(
    rifle,
    null,
    true,
    400,
    Object.freeze({
      origin: far(-300),
      impact: { x: 10, y: 1.2, z: 0 },
      stoppedBy: 'soldier',
      passes: [
        { victim: victim(1, 10), entry: { x: 10, y: 1.2, z: 0 }, wound: { outcome: 'wounded', zone: 'arm' } },
        { victim: victim(2, 12), entry: { x: 12, y: 1.2, z: 0 }, wound: { outcome: 'wounded', zone: 'leg' } }
      ],
      final: { impact: { x: 18, y: 0, z: 0 }, blocker: 'ground', stoppedBy: 'terrain' }
    })
  );
  R.advance(0);
  const k = R.keys().sort();
  assert.equal(k.filter((x) => x === 'impacts.dirt').length, 1);
  assert.equal(k.filter((x) => x === 'flesh.hit').length + R.sim._combatAudio.dropped.flesh, 2);
  assert.equal(k.filter((x) => x === 'pain.wounded').length, 1); /* two men, but within the gap: one cry plays */
});
test('the same man does not cry again within PAIN_REPEAT', () => {
  const R = rig({ instant: true });
  R.sim.onShot(rifle, null, true, 400, bodyShot('wounded', 'arm'));
  R.advance(500);
  R.sim.onShot(rifle, null, true, 400, bodyShot('wounded', 'leg'));
  assert.equal(R.keys().filter((k) => k.startsWith('pain')).length, 1);
  R.advance(F.PAIN_REPEAT);
  R.sim.onShot(rifle, null, true, 400, bodyShot('wounded', 'leg'));
  assert.equal(R.keys().filter((k) => k.startsWith('pain')).length, 2);
});
test('?combatAudio=0 installs nothing', () => {
  const off = load('?combatAudio=0');
  assert.equal(off.on, false);
  const sim = { onShot() {} },
    before = sim.onShot;
  off.install(sim, { voices: {} });
  assert.equal(sim.onShot, before);
});

console.log(`combat-audio-check: ${n} passed`);
