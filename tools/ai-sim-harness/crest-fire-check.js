#!/usr/bin/env node
'use strict';
/* Fire over a hill crest: permission to fire tests the line the round will fly.

   Sight runs eye to eye; the round flies eye to body centre (~0.7 m lower on a standing man) and
   meets the ground wherever the ballistics' own terrain test says. Over a crest a man can see a
   head while his round would go into the slope. He must still see (and track) that man, but not
   pull the trigger; on open ground or over a crest low enough for the round he fires as before.
   Uses the real trigger-time gate (14-direct-fire-los-gate.js) and ballistics (14-z-ballistic-raycast.js). */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
const RANGE = 120; // inside the base rifle's 140 m
/* A ridge across the line of fire: `top` metres high at z = `at`, flat within `half` of it and
   falling to the plain over `skirt`. */
function ridge(at, top, half, skirt) {
  return (x, z) => {
    const d = Math.abs(z - at);
    if (d <= half) return top;
    if (d >= half + skirt) return 0;
    return top * (1 - (d - half) / skirt);
  };
}
function setup(heightAt) {
  H.resetIds();
  const r = H.bootstrap();
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  load(r, 'battle/modules/14-direct-fire-los-gate.js');
  load(r, 'battle/modules/14-z-ballistic-raycast.js');
  const b = H.makeBattle(r, { seed: 7, heightAt });
  const shots = [];
  b.onShot = (shooter, target, hit, d, meta) => shots.push(meta);
  const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 }, facing: 0 });
  const ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: RANGE, objective: { x: 0, z: -100 }, facing: Math.PI });
  const shooter = us.members.find(s => s.role === 'rifleman'),
    target = ge.members.find(s => s.role === 'rifleman');
  for (const s of [shooter, target]) {
    s.root.position.x = 0;
    s.prone = s.tacticalCrouch = false;
  }
  shooter.root.position.z = 0;
  target.root.position.z = RANGE;
  shooter.root.position.y = heightAt(0, 0);
  target.root.position.y = heightAt(0, RANGE);
  shooter.root.rotation.y = 0;
  shooter.target = target;
  shooter.fireCooldown = 0;
  return { r, b, S: r.SquadAI, shooter, target, shots };
}
function sees(ctx) {
  return ctx.S.hasLineOfSight(ctx.shooter, ctx.target, ctx.b.heightAt, ctx.b.obstacles);
}
function pulls(ctx) {
  return ctx.S.tryFire(ctx.shooter, ctx.b);
}

test('open ground: he sees and fires (control)', () => {
  const ctx = setup(() => 0);
  assert.ok(sees(ctx), 'clear sight on flat ground');
  assert.ok(pulls(ctx), 'trigger pulled');
  assert.ok(ctx.shots.length > 0, 'a round flew');
});

test('a crest that shows the head but takes the round: sight clear, no trigger pull', () => {
  /* Eye line crosses the crest at 1.55 m, the round's line at ~1.22 m: a 1.35 m crest sits between. */
  const ctx = setup(ridge(RANGE / 2, 1.35, 4, 20));
  assert.ok(sees(ctx), 'he still sees the head over the crest (spotting unchanged)');
  assert.equal(pulls(ctx), false, 'no trigger pull');
  assert.equal(ctx.shots.length, 0, 'no round launched into the slope');
  assert.ok(ctx.shooter._crestBlockedFire > 0, 'the refusal is counted as a crest block');
  assert.ok(!ctx.shooter._losBlockedFire, 'and not as a sight block (the benchmark scores those)');
  assert.equal(ctx.shooter.target, ctx.target, 'he keeps the man he sees');
});

test('a crest low enough for the round: he fires', () => {
  const ctx = setup(ridge(RANGE / 2, 1.0, 4, 20));
  assert.ok(sees(ctx));
  assert.ok(pulls(ctx), 'trigger pulled');
});

test('a narrow crest between sight samples still stops the trigger', () => {
  /* Sight samples every RANGE/8 = 15 m (60, 75); a 6 m crest at 67.5 falls between them, while the
     round's terrain test (every RANGE/24 = 5 m) lands on it. */
  const ctx = setup(ridge(67.5, 3, 3, 0.5));
  assert.ok(sees(ctx), 'the coarse sight test misses it (spotting unchanged)');
  assert.equal(pulls(ctx), false, 'the fire line finds it: no trigger pull');
  assert.equal(ctx.shots.length, 0);
});


test('suppressive fire uses the same terrain crest gate', () => {
  const blocked = setup(ridge(RANGE / 2, 1.35, 4, 20));
  assert.equal(blocked.S.canSuppress(blocked.shooter, { x: 0, z: RANGE }, blocked.b), false,
    'remembered contact behind the crest cannot receive suppressive fire');
  assert.ok(blocked.shooter._terrainBlockedSuppressiveFire > 0, 'terrain refusal is counted for diagnostics');
  const clear = setup(ridge(RANGE / 2, 0.9, 4, 20));
  assert.equal(clear.S.canSuppress(clear.shooter, { x: 0, z: RANGE }, clear.b), true,
    'a low crest that clears the suppression line still permits fire');
});

test('no combat-RNG draws from the gate itself', () => {
  const ctx = setup(ridge(RANGE / 2, 1.35, 4, 20));
  let draws = 0;
  const real = ctx.b.random;
  ctx.b.random = () => (draws++, real());
  pulls(ctx);
  assert.equal(draws, 0, 'a refused trigger draws nothing');
});

console.log('crest-fire-check: ' + n + ' passed');
