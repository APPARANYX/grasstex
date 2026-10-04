#!/usr/bin/env node
'use strict';
/* Weapon foley and burst tails (module 15-weapon-foley-audio.js, presentation only).

   Each model's reload is the stage clips it has, in its mechanism's order, at fractions of the
   reload's length; a stoppage clicks then racks clear; a bipod gun deploys going prone and folds
   getting up; a bolt gun cycles its bolt after a shot that leaves a round, a Garand pings out the
   clip that empties it, and an automatic plays one tail after it falls quiet. Handling noise carries
   FOLEY_RANGE, a tail TAIL_RANGE. The module writes nothing on the soldiers, draws no random number,
   and `?weaponFoley=0` installs nothing. Runs against the real Assets/audio/manifest.json, so every
   fielded model must carry the clips its mechanism needs. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'battle/modules/15-weapon-foley-audio.js'), 'utf8');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'Assets/audio/manifest.json'), 'utf8'));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function load(search) {
  const r = { BATTLE_AUDIO_MANIFEST: MANIFEST };
  if (search != null) r.location = { search };
  new Function('window', 'globalThis', 'location', SRC)(r, r, r.location);
  return r.BattleWeaponFoley;
}
const F = load();
const cat = (model) => MANIFEST.categories['weapon.' + model] || {};
const actions = (model) => F.reloadStages(cat(model)).map((s) => s.action);
const FIELDED = ['m1-garand', 'kar98k', 'm1-carbine', 'thompson', 'fg42', 'mp40', 'm1919a6', 'mg42', 'm1911a1', 'p38'];

test('every fielded model has single-round fire, distant fire and stoppage clips', () => {
  for (const m of FIELDED) {
    for (const a of ['fire', 'fireDistant', 'stoppageClick', 'stoppageClear']) assert.ok((cat(m)[a] || []).length >= 2, m + '.' + a);
  }
});
test('each mechanism reloads in its own order, stages in time order', () => {
  assert.deepEqual(actions('mg42'), ['reloadCoverOpen', 'reloadBeltLay', 'reloadCoverClose', 'reloadCharge']);
  assert.deepEqual(actions('m1919a6'), ['reloadCoverOpen', 'reloadBeltLay', 'reloadCoverClose', 'reloadCharge']);
  assert.deepEqual(actions('m1-garand'), ['reloadClipInsert', 'reloadBoltRelease']);
  assert.deepEqual(actions('kar98k'), ['reloadBoltOpen', 'reloadStripperClip', 'reloadBoltClose']);
  for (const m of ['mp40', 'thompson', 'fg42', 'm1-carbine']) assert.deepEqual(actions(m), ['reloadMagOut', 'reloadMagIn', 'reloadCharge'], m);
  for (const m of ['p38', 'm1911a1']) assert.deepEqual(actions(m), ['reloadMagOut', 'reloadMagIn', 'reloadSlideRelease'], m);
  for (const m of FIELDED) {
    const at = F.reloadStages(cat(m)).map((s) => s.at);
    for (let i = 1; i < at.length; i++) assert.ok(at[i] > at[i - 1] && at[i] < 1, m);
  }
  assert.deepEqual(F.reloadStages({}), []);
});
test('a tail waits for TAIL_QUIET cyclic intervals of quiet, never less than 0.15 s', () => {
  assert.equal(F.tailQuiet(20), 0.15);
  assert.ok(Math.abs(F.tailQuiet(8) - 0.1875) < 1e-9);
  assert.equal(F.tailQuiet(0), 0.15);
});

/* A battle of one or two men, a camera, a clock and fake voices that count what plays. */
function rig(men, camAt) {
  let t = 0,
    steps = [],
    timers = [],
    moduleWrites = [],
    inModule = false;
  const played = [];
  const voices = {};
  for (const [name, groups] of Object.entries(MANIFEST.categories)) {
    if (!name.startsWith('weapon.')) continue;
    for (const [action, files] of Object.entries(groups))
      voices[name.slice(7) + '.' + action] = files.map(() => ({
        endsAt: 0,
        sound: { setPosition() {}, setVolume() {}, setPlaybackRate() {}, play: () => played.push(action) }
      }));
  }
  const proxied = men.map(
    (m) =>
      new Proxy(m, {
        set(o, k, v) {
          if (inModule) moduleWrites.push(k);
          o[k] = v;
          return true;
        }
      })
  );
  const sim = {
    time: 0,
    timeScale: 1,
    rosterOf: (f) => proxied.filter((m) => m.faction === f),
    onFire: () => {}
  };
  const run = (fn) => {
    inModule = true;
    const rnd = Math.random;
    Math.random = () => {
      throw new Error('module drew Math.random');
    };
    try {
      fn();
    } finally {
      Math.random = rnd;
      inModule = false;
    }
  };
  F.install(sim, {
    voices,
    now: () => t,
    later: (ms, fn) => timers.push({ at: t + ms, fn }),
    camera: () => ({ position: camAt }),
    observe: (fn) => steps.push(fn)
  });
  return {
    sim,
    men: proxied,
    played,
    moduleWrites,
    /* Frames every 16 ms (the render observer) and every timer due on the way, in time order. */
    advance(ms) {
      const end = t + ms;
      let frame = t;
      for (;;) {
        timers.sort((a, b) => a.at - b.at);
        const next = timers[0],
          nextFrame = Math.min(frame + 16, end);
        if (next && next.at <= nextFrame) {
          t = Math.max(t, next.at);
          timers.shift();
          run(next.fn);
          continue;
        }
        t = frame = nextFrame;
        run(() => steps.forEach((f) => f()));
        if (t >= end) break;
      }
    },
    fire(man) {
      run(() => sim.onFire(man, 0));
    }
  };
}
function man(id, model, kind, extra) {
  return Object.assign(
    {
      id,
      faction: 'ge',
      dead: false,
      reloading: false,
      clearingStoppage: false,
      prone: false,
      root: { position: { x: 5, y: 0, z: 0 } },
      weapon: { kind, profile: model, ammo: 10, stats: { cyclic: kind === 'smg' || kind === 'lmg' ? 10 : 0 } }
    },
    extra || {}
  );
}

test("a reload near the camera plays the model's stages in order, a far one plays nothing", () => {
  const r = rig([man(1, 'mg42', 'lmg')], { x: 0, y: 1.6, z: 0 });
  r.advance(16);
  r.men[0].reloading = true;
  r.men[0].reloadUntil = 4;
  r.advance(5000);
  assert.deepEqual(r.played, ['reloadCoverOpen', 'reloadBeltLay', 'reloadCoverClose', 'reloadCharge']);
  const far = rig([man(2, 'mp40', 'smg', { root: { position: { x: 200, y: 0, z: 0 } } })], { x: 0, y: 1.6, z: 0 });
  far.advance(16);
  far.men[0].reloading = true;
  far.men[0].reloadUntil = 2;
  far.advance(3000);
  assert.deepEqual(far.played, []);
});
test('a man killed mid-reload plays no further stages', () => {
  const r = rig([man(3, 'kar98k', 'rifle')], { x: 0, y: 1.6, z: 0 });
  r.advance(16);
  r.men[0].reloading = true;
  r.men[0].reloadUntil = 3;
  r.advance(600);
  r.men[0].dead = true;
  r.advance(4000);
  assert.deepEqual(r.played, ['reloadBoltOpen']);
});
test('a stoppage clicks, then racks clear; a bipod gun deploys and folds', () => {
  const r = rig([man(4, 'mg42', 'lmg')], { x: 0, y: 1.6, z: 0 });
  r.advance(16);
  r.men[0].clearingStoppage = true;
  r.men[0].stoppageUntil = 2;
  r.advance(2500);
  assert.deepEqual(r.played, ['stoppageClick', 'stoppageClear']);
  r.men[0].clearingStoppage = false;
  r.men[0].prone = true;
  r.advance(100);
  r.men[0].prone = false;
  r.advance(100);
  assert.deepEqual(r.played.slice(2), ['bipodDeploy', 'bipodFold']);
});
test('a bolt gun cycles after a shot with rounds left; the Garand pings out an empty clip', () => {
  const r = rig([man(5, 'kar98k', 'rifle')], { x: 0, y: 1.6, z: 0 });
  r.advance(16);
  r.fire(r.men[0]);
  r.advance(1000);
  assert.deepEqual(r.played, ['boltCycle']);
  const g = rig([man(6, 'm1-garand', 'rifle', { weapon: { kind: 'rifle', profile: 'm1-garand', ammo: 0, stats: { cyclic: 0 } } })], { x: 0, y: 1.6, z: 0 });
  g.advance(16);
  g.fire(g.men[0]);
  g.advance(500);
  assert.deepEqual(g.played, ['clipPing']);
});
test('an automatic plays one tail after it falls quiet, heard well beyond handling range', () => {
  const r = rig([man(7, 'mg42', 'lmg', { root: { position: { x: 150, y: 0, z: 0 } } })], { x: 0, y: 1.6, z: 0 });
  r.advance(16);
  for (let i = 0; i < 6; i++) {
    r.fire(r.men[0]);
    r.advance(50);
  }
  assert.deepEqual(r.played, []);
  r.advance(2000);
  assert.deepEqual(r.played, ['fireTail']);
  r.advance(2000);
  assert.deepEqual(r.played, ['fireTail']);
});
test('the module never writes a soldier field or draws Math.random', () => {
  const r = rig([man(8, 'p38', 'pistol'), man(9, 'mp40', 'smg')], { x: 0, y: 1.6, z: 0 });
  r.advance(16);
  r.men[0].reloading = true;
  r.men[0].reloadUntil = 2;
  r.fire(r.men[1]);
  r.advance(3000);
  assert.ok(r.played.length > 0);
  assert.deepEqual(r.moduleWrites, []);
});
test('?weaponFoley=0 installs nothing', () => {
  const off = load('?weaponFoley=0');
  const fire = () => {};
  const sim = { onFire: fire, rosterOf: () => [] };
  off.install(sim, { voices: {}, observe: () => assert.fail('observed') });
  assert.equal(sim.onFire, fire);
  assert.equal(off.on, false);
});
test('unplayed handling extras and shots are not preloaded by the foley module', () => {
  for (const action of ['fire', 'fireDistant', 'handling', 'grab', 'safety', 'mode']) assert.equal(F.UNPLAYED[action], true, action);
  for (const action of ['fireTail', 'reloadMagIn', 'stoppageClick', 'bipodDeploy', 'clipPing', 'boltCycle']) assert.ok(!F.UNPLAYED[action], action);
});
console.log(`weapon-foley-audio-check: ${n} checks passed`);
