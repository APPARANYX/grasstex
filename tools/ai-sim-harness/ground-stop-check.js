#!/usr/bin/env node
'use strict';
/* Ground stop: a round is stopped by a rise it would fly into, not only by one it happens to be sampled on.

   `groundStop` (14-z) walks the round's line in GROUND_STEPS steps and asks the terrain at each.
   `resolve` tests a round over the weapon's whole range, so 24 steps of a 450 m rifle are one sample every
   18.75 m: a rise a dozen metres wide between two samples stops nothing. The trigger gate
   (`fireLineBlocked`) tests only the span to the target, so it is finer, with the same blind spot at the
   same ratio. `?groundSteps=<n>` (12 to 96, default 48; 24 is the sampling before) sets the count, read
   once at load.

   The module is loaded from its shipping source with a stub `location`, so nothing here is a copy.

     node tools/ai-sim-harness/ground-stop-check.js            assertions
     node tools/ai-sim-harness/ground-stop-check.js --measure  also: how many rounds 48 steps change, and the cost */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const repo = path.resolve(__dirname, '../..'),
  MEASURE = process.argv.includes('--measure'),
  SRC = fs.readFileSync(path.join(repo, 'battle/modules/14-z-ballistic-raycast.js'), 'utf8'),
  FIELD = fs.readFileSync(path.join(repo, 'battle/obstacle-field.js'), 'utf8');
function load(search) {
  const r = { console: { log() {}, warn() {} } };
  r.window = r;
  if (search != null) r.location = { search };
  r.SquadAI = {
    applyHit() { return null; },
    stanceOf: s => s.stance || 'stand',
    eyeHeight: s => ({ prone: 0.42, crouch: 1.05 }[s.stance] || 1.55),
    isMachineGun: () => false
  };
  vm.createContext(r);
  vm.runInContext(FIELD, r, { filename: 'battle/obstacle-field.js' });
  vm.runInContext(SRC, r, { filename: 'battle/modules/14-z-ballistic-raycast.js' });
  return r;
}
const coarse = load('?groundSteps=24'), fine = load('?groundSteps=48'), shipped = load('');

/* 0. The flag: 48 unless a count from 12 to 96 is asked for; 24 is the sampling before. */
const parsed = ['', '?seed=1', '?groundSteps=48', '?x=1&groundSteps=36', '?groundSteps=96', '?groundSteps=24', '?groundSteps=7', '?groundSteps=200', '?groundSteps=abc', '?groundSteps=']
  .map(q => load(q).BattleBallistics.groundSteps());
assert.deepEqual(parsed, [48, 48, 48, 36, 96, 24, 48, 48, 48, 48]);
assert.equal(load(null).BattleBallistics.groundSteps(), 48, 'with no location the default is 48');
console.log('PASS ?groundSteps=<n> is 12 to 96 and defaults to 48: ' + JSON.stringify(parsed));

function unit(x, z, stance) {
  return { root: { position: { x, y: 0, z }, rotation: { y: 0 } }, hp: 100, faction: 'ge', stance };
}
function shooterAt(x, z, stance, range) {
  const s = unit(x, z, stance);
  s.faction = 'us';
  s.weapon = { kind: 'rifle', stats: { range, accuracy: 0.98, falloffStart: range, damage: 10 } };
  return s;
}
function shoot(r, shooter, target, ground) {
  const out = {};
  r.BattleBallistics.resolve(shooter, target, { time: 1, obstacles: [], heightAt: ground, random: () => 0.25, rosterOf: () => [target],
    onShot(a, b, hit, d, meta) { out.meta = meta; }, killSoldier() {} });
  const m = out.meta;
  return m && { stoppedBy: m.stoppedBy, blocker: m.blocker, travel: +m.travel.toFixed(2) };
}

/* 1. A ridge that sits between two 24-step samples of a 450 m rifle, 38.5 to 50.5 m out on a 100 m shot
      (samples at 37.5 and 56.25 m; at 48 steps there is one at 46.9 m). */
const ridge = (x, z) => (x >= 38.5 && x <= 50.5 ? 4 : 0);
function ridgeShot(r) { return shoot(r, shooterAt(0, 0, 'stand', 450), unit(100, 0), ridge); }
const through = ridgeShot(coarse), stopped = ridgeShot(fine);
assert.equal(through.stoppedBy, 'soldier', '24 steps step over the ridge: the round reaches the man');
assert.equal(stopped.blocker, 'ground', '48 steps stop the round at the ridge');
assert.deepEqual(ridgeShot(shipped), stopped, 'the shipped default is the 48-step scan');
assert.ok(Math.abs(stopped.travel - 37.72) < 0.2, 'at the ridge face: 38.5 m out less the 0.78 m muzzle offset (' + stopped.travel + ' m)');
console.log('PASS a ridge between two 24-step samples: 24 steps ' + JSON.stringify(through) + ', 48 steps ' + JSON.stringify(stopped));

/* 2. The trigger gate over the same kind of ridge: span 99.2 m from the muzzle, samples 4.13 m (24) or 2.07 m (48) apart. */
const thin = (x, z) => (x >= 46.7 && x <= 49.9 ? 4 : 0);
const gate = r => r.BattleBallistics.fireLineBlocked(shooterAt(0, 0, 'stand', 450), unit(100, 0), { heightAt: thin, obstacles: [] });
assert.equal(gate(coarse), false, '24 steps let the man fire across a 3.2 m ridge');
assert.equal(gate(fine), true, '48 steps refuse the shot');
console.log('PASS the trigger gate: 24 steps let a 3.2 m ridge through, 48 refuse the shot');

/* 3. Every 24-step sample is also a 48-step sample, so a finer scan only ever stops more rounds. */
function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function terrain(rand) {
  const hills = [];
  for (let i = 0; i < 24; i++) hills.push({ x: (rand() - 0.5) * 900, z: (rand() - 0.5) * 900, h: 2 + rand() * (i < 4 ? 12 : 6), s: 8 + rand() * 32 });
  return (x, z) => {
    let y = Math.sin(x * 0.013) * 1.7 + Math.cos(z * 0.011) * 1.3;
    for (const k of hills) y += k.h * Math.exp(-((x - k.x) ** 2 + (z - k.z) ** 2) / (2 * k.s * k.s));
    return y;
  };
}
const SHOTS = MEASURE ? 6000 : 500, rand = rng(20260930), ground = terrain(rand), stances = ['stand', 'crouch', 'prone'], set = [];
for (let i = 0; i < SHOTS; i++) {
  const x = (rand() - 0.5) * 600, z = (rand() - 0.5) * 600, a = rand() * Math.PI * 2, d = 30 + rand() * 390;
  set.push({ s: shooterAt(x, z, stances[(rand() * 3) | 0], 450), t: unit(x + Math.cos(a) * d, z + Math.sin(a) * d) });
}
let groundCoarse = 0, groundFine = 0, lost = 0, otherBlocker = 0, moved = 0;
for (const { s, t } of set) {
  const a = shoot(coarse, s, t, ground), b = shoot(fine, s, t, ground);
  if (a.blocker === 'ground') groundCoarse++;
  if (b.blocker === 'ground') groundFine++;
  if (a.blocker === 'ground' && b.blocker !== 'ground') lost++;
  if (a.blocker !== b.blocker) otherBlocker++;
  else if (Math.abs(a.travel - b.travel) > 1) moved++;
}
assert.equal(lost, 0, lost + ' rounds stopped by the ground at 24 steps were not at 48');
assert.ok(groundFine > groundCoarse, 'test geometry: the finer scan must take some rounds the coarse one misses (' + groundCoarse + ' against ' + groundFine + ')');
console.log('PASS on ' + SHOTS + ' rolling-ground shots the finer scan stops every round the coarse one does (' + groundCoarse + ' by ground at 24 steps, ' + groundFine + ' at 48)');

if (MEASURE) {
  console.log('\nMEASURE of ' + SHOTS + ' shots, ' + otherBlocker + ' (' + (100 * otherBlocker / SHOTS).toFixed(2) + '%) are stopped by something else at 48 steps than at 24; ' + moved + ' more stop more than 1 m earlier or later');
  // timed in turn over several rounds (the first one timed pays the JIT warm-up); median of the rounds
  const names = ['coarse', 'fine'], rounds = { coarse: [], fine: [] }, r = { coarse, fine };
  for (let round = 0; round < 9; round++)
    for (const name of names) {
      const t0 = process.hrtime.bigint();
      for (const { s, t } of set) shoot(r[name], s, t, ground);
      rounds[name].push(Number(process.hrtime.bigint() - t0) / 1e3 / set.length);
    }
  const median = a => a.slice(1).sort((x, y) => x - y)[(a.length - 1) >> 1];
  for (const name of names) console.log('MEASURE ' + (name === 'coarse' ? '24 steps' : '48 steps') + ' ' + median(rounds[name]).toFixed(1) + ' us per shot (median of 8 rounds after a warm-up round)');
}
console.log('ground-stop-check: passed');
