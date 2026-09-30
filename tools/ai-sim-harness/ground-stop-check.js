#!/usr/bin/env node
'use strict';
/* Ground stop: a round is stopped by a rise it would fly into, not only by one it happens to be sampled on.

   `groundStop` (14-z) walks the round's line in GROUND_STEPS steps and asks the terrain at each. A
   round is tested over the weapon's whole range (`resolve`), so 24 steps of a 450 m rifle are one
   sample every 18.75 m: a rise a dozen metres wide between two samples stopped nothing. The trigger
   gate (`fireLineBlocked`) tests only the span to the target, so it is finer, but the same blind spot
   exists at the same ratio.

   The file also holds the fast path (12 coarse samples; if the round is more than 5 m above the ground
   at every one, skip the fine scan) to account: it must answer exactly as the full scan, and
   `--measure` says how often it fires at all and what each variant costs. The module is loaded from
   its shipping source; the variants are that source with one edit each, so nothing here is a copy.

     node tools/ai-sim-harness/ground-stop-check.js            assertions
     node tools/ai-sim-harness/ground-stop-check.js --measure  also: early-return rate, disagreements, timings */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const repo = path.resolve(__dirname, '../..'),
  MEASURE = process.argv.includes('--measure'),
  SRC = fs.readFileSync(path.join(repo, 'battle/modules/14-z-ballistic-raycast.js'), 'utf8'),
  FIELD = fs.readFileSync(path.join(repo, 'battle/obstacle-field.js'), 'utf8');
const FAST = /var clear = true;[\s\S]*?if \(clear\) return maxT;/;
const variants = {
  shipped: SRC,
  // the same source with the sampling that shipped before this check (24 steps), if it is 48 now
  steps24: SRC.replace(/GROUND_STEPS = \d+/, 'GROUND_STEPS = 24'),
  // the same source with the fast path cut out (a no-op if there is none)
  noFast: SRC.replace(FAST, ''),
  // the shipped source counting groundStop calls and fast-path early returns
  counting: SRC.replace('function groundStop(o, d, maxT, battle) {',
    'function groundStop(o, d, maxT, battle) { root.__calls = (root.__calls || 0) + 1;')
    .replace('if (clear) return maxT;', 'if (clear) { root.__fast = (root.__fast || 0) + 1; return maxT; }')
};
function load(source) {
  const r = { console: { log() {}, warn() {} } };
  r.window = r;
  r.SquadAI = {
    applyHit() { return null; },
    stanceOf: s => s.stance || 'stand',
    eyeHeight: s => ({ prone: 0.42, crouch: 1.05 }[s.stance] || 1.55),
    isMachineGun: () => false
  };
  vm.createContext(r);
  vm.runInContext(FIELD, r, { filename: 'battle/obstacle-field.js' });
  vm.runInContext(source, r, { filename: 'battle/modules/14-z-ballistic-raycast.js' });
  return r;
}
const built = Object.fromEntries(Object.entries(variants).map(([k, v]) => [k, load(v)]));
function unit(x, z, stance) {
  return { root: { position: { x, y: 0, z }, rotation: { y: 0 } }, hp: 100, faction: 'ge', stance };
}
function shooterAt(x, z, stance, range) {
  const s = unit(x, z, stance);
  s.faction = 'us';
  s.weapon = { kind: 'rifle', stats: { range, accuracy: 0.98, falloffStart: range, damage: 10 } };
  return s;
}
function battleOf(ground, target) {
  const out = {};
  return { out, b: { time: 1, obstacles: [], heightAt: ground, random: () => 0.25, rosterOf: () => [target],
    onShot(a, b, hit, d, meta) { out.meta = meta; }, killSoldier() {} } };
}
function shoot(r, shooter, target, ground) {
  const { out, b } = battleOf(ground, target);
  r.BattleBallistics.resolve(shooter, target, b);
  const m = out.meta;
  return m && { stoppedBy: m.stoppedBy, blocker: m.blocker, travel: +m.travel.toFixed(2) };
}

/* 1. A ridge that sits between two 24-step samples of a 450 m rifle, 40 to 50 m out on a 100 m shot. */
const ridge = (x, z) => (x >= 38.5 && x <= 50.5 ? 4 : 0);
function ridgeShot(r) { return shoot(r, shooterAt(0, 0, 'stand', 450), unit(100, 0), ridge); }
const old = ridgeShot(built.steps24), now = ridgeShot(built.shipped);
assert.notEqual(old.blocker, 'ground', 'test geometry: 24 samples must step over this ridge (samples at 37.5 and 56.25 m)');
assert.equal(old.stoppedBy, 'soldier', 'at 24 steps the round flies through the ridge into the man');
assert.equal(now.blocker, 'ground', 'the shipped sampling stops the round at the ridge');
assert.ok(Math.abs(now.travel - 37.72) < 0.2, 'and stops it at the ridge face: 38.5 m out less the 0.78 m muzzle offset (' + now.travel + ' m)');
console.log('PASS a ridge between two 24-step samples stops the round: ' + JSON.stringify(now));

/* 2. The trigger gate over the same kind of ridge: span 99.2 m from the muzzle, samples 4.13 m (24) or 2.07 m (48) apart. */
const thin = (x, z) => (x >= 46.7 && x <= 49.9 ? 4 : 0);
function gate(r) { return r.BattleBallistics.fireLineBlocked(shooterAt(0, 0, 'stand', 450), unit(100, 0), { heightAt: thin, obstacles: [] }); }
assert.equal(gate(built.steps24), false, 'test geometry: 24 samples over 100 m step over a 3.5 m ridge');
assert.equal(gate(built.shipped), true, 'the trigger gate sees the 3.5 m ridge at the shipped sampling');
console.log('PASS the trigger gate refuses a shot the 3.5 m ridge would take');

/* 3. The fast path answers exactly as the full scan, on rolling ground with hills and from high ground. */
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
const SHOTS = MEASURE ? 6000 : 500, rand = rng(20260930), ground = terrain(rand), stances = ['stand', 'crouch', 'prone'];
const set = [];
for (let i = 0; i < SHOTS; i++) {
  const x = (rand() - 0.5) * 600, z = (rand() - 0.5) * 600, a = rand() * Math.PI * 2, d = 30 + rand() * 390;
  set.push({ s: shooterAt(x, z, stances[(rand() * 3) | 0], 450), t: unit(x + Math.cos(a) * d, z + Math.sin(a) * d) });
}
let differ = 0, blockedByGround = 0, first = null;
for (const { s, t } of set) {
  const a = shoot(built.shipped, s, t, ground), b = shoot(built.noFast, s, t, ground);
  if (a && a.blocker === 'ground') blockedByGround++;
  if (JSON.stringify(a) !== JSON.stringify(b)) { differ++; first = first || { fast: a, full: b }; }
}
assert.equal(differ, 0, differ + ' of ' + SHOTS + ' shots differ between the fast path and the full scan, e.g. ' + JSON.stringify(first));
assert.ok(blockedByGround > SHOTS * 0.05, 'test geometry: the terrain must take some rounds (' + blockedByGround + ' of ' + SHOTS + ')');
console.log('PASS the fast path gives the full scan\'s answer on ' + SHOTS + ' rolling-ground shots (' + blockedByGround + ' stopped by ground)');

if (MEASURE) {
  for (const { s, t } of set) shoot(built.counting, s, t, ground);
  const c = built.counting, calls = c.__calls || 0, fast = c.__fast || 0;
  console.log('\nMEASURE groundStop calls ' + calls + ', fast-path early returns ' + fast + ' (' + (calls ? ((100 * fast) / calls).toFixed(2) : 0) + '%)');
  // Variants are timed in turn over several rounds (the first one timed pays the JIT warm-up), median of the rounds.
  const names = ['steps24', 'noFast', 'shipped'], rounds = { steps24: [], noFast: [], shipped: [] };
  for (let round = 0; round < 9; round++)
    for (const name of names) {
      const t0 = process.hrtime.bigint();
      for (const { s, t } of set) shoot(built[name], s, t, ground);
      rounds[name].push(Number(process.hrtime.bigint() - t0) / 1e3 / set.length);
    }
  const median = a => a.slice(1).sort((x, y) => x - y)[(a.length - 1) >> 1];
  for (const name of names) console.log('MEASURE ' + name.padEnd(8) + ' ' + median(rounds[name]).toFixed(1) + ' us per shot (median of 8 rounds after a warm-up round)');
}
console.log('ground-stop-check: passed');
