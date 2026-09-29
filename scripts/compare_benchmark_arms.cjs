/* Paired report for two standard-benchmark arms run on one seed prefix.
 *   node scripts/compare_benchmark_arms.cjs [--json] [--count path ...] A.json[,A2.json] B.json[,B2.json]
 * Each argument is a merged battle-benchmark.json (a comma list pools several seed prefixes; the two
 * lists must hold the same prefixes in the same order). Battles pair on `seed`. Reported:
 *   - per-battle identity (every field except wall time) and how many battles changed at all;
 *   - exact two-sided McNemar (binomial on the discordant pairs) for the winner (US vs GE flips),
 *     the time-limit battles and the no-capture battles;
 *   - captures, movement stalls, runtime errors, wall time (median per battle, and the 25% gate).
 * `--count a.b.c` adds a per-battle numeric counter read by path (e.g. `regroups.entries`), summed
 * and paired by mean difference; repeat the flag for more.
 * Exit 1 on any runtime error or a median wall-time slowdown above 25%. Nothing is tuned here:
 * it reports, the caller decides what a number means. With ~30 comparisons a p of 0.01 is not a finding. */
'use strict';
const fs = require('node:fs');
const GATE = 1.25;
const NOT_STATE = new Set(['wallSeconds', 'index', 'cpuWallSeconds']);

function binomTwoSided(k, n) {
  if (!n) return 1;
  // P(X <= min(k, n-k)) for X ~ Bin(n, 1/2), doubled, in log space so n in the hundreds is safe.
  const lf = [0];
  for (let i = 1; i <= n; i++) lf[i] = lf[i - 1] + Math.log(i);
  const pmf = i => Math.exp(lf[n] - lf[i] - lf[n - i] - n * Math.LN2);
  let p = 0;
  for (let i = 0; i <= Math.min(k, n - k); i++) p += pmf(i);
  return Math.min(1, 2 * p);
}
function mcnemar(pairs) {
  let ab = 0,
    ba = 0;
  for (const [a, b] of pairs) {
    if (a && !b) ab++;
    else if (!a && b) ba++;
  }
  return { aOnly: ab, bOnly: ba, discordant: ab + ba, p: +binomTwoSided(ab, ab + ba).toFixed(4) };
}
const median = xs => {
  const s = xs.filter(Number.isFinite).sort((x, y) => x - y);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const at = (o, p) => p.split('.').reduce((v, k) => (v == null ? v : v[k]), o);
function stateOf(b) {
  const out = {};
  for (const k of Object.keys(b).sort()) if (!NOT_STATE.has(k)) out[k] = b[k];
  return JSON.stringify(out);
}
function load(list) {
  const battles = [];
  const errors = [];
  for (const file of list.split(',')) {
    const r = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const b of r.battles || []) battles.push(b);
    errors.push(...(r.runtimeErrors || []));
  }
  return { battles, errors };
}
function compare(aList, bList, counters = []) {
  const A = load(aList),
    B = load(bList);
  const bySeed = new Map(B.battles.map(b => [b.seed, b]));
  const pairs = [];
  for (const a of A.battles) if (bySeed.has(a.seed)) pairs.push([a, bySeed.get(a.seed)]);
  const win = (b, s) => b.winner === s;
  const winnerFlips = pairs.filter(([a, b]) => a.winner !== b.winner);
  const noCap = b => (b.captures || 0) === 0;
  const stalls = b => (b.movementStalls?.length ?? b.movementStalls ?? 0) | 0;
  const wallA = pairs.map(([a]) => a.wallSeconds),
    wallB = pairs.map(([, b]) => b.wallSeconds);
  const ratio = median(wallB) / median(wallA);
  const out = {
    pairs: pairs.length,
    unpaired: { a: A.battles.length - pairs.length, b: B.battles.length - pairs.length },
    identicalBattles: pairs.filter(([a, b]) => stateOf(a) === stateOf(b)).length,
    winners: {
      a: { us: A.battles.filter(b => win(b, 'us')).length, ge: A.battles.filter(b => win(b, 'ge')).length },
      b: { us: B.battles.filter(b => win(b, 'us')).length, ge: B.battles.filter(b => win(b, 'ge')).length },
      flips: winnerFlips.length,
      // discordant on "US won": flips to GE and flips to US, ignoring draws' direction.
      mcnemarUsWon: mcnemar(pairs.map(([a, b]) => [win(a, 'us'), win(b, 'us')]))
    },
    timeLimit: {
      a: pairs.filter(([a]) => a.timeoutReached).length,
      b: pairs.filter(([, b]) => b.timeoutReached).length,
      mcnemar: mcnemar(pairs.map(([a, b]) => [a.timeoutReached, b.timeoutReached]))
    },
    noCapture: {
      a: pairs.filter(([a]) => noCap(a)).length,
      b: pairs.filter(([, b]) => noCap(b)).length,
      mcnemar: mcnemar(pairs.map(([a, b]) => [noCap(a), noCap(b)]))
    },
    captures: {
      a: +mean(pairs.map(([a]) => a.captures || 0)).toFixed(3),
      b: +mean(pairs.map(([, b]) => b.captures || 0)).toFixed(3)
    },
    movementStalls: { a: pairs.reduce((s, [a]) => s + stalls(a), 0), b: pairs.reduce((s, [, b]) => s + stalls(b), 0) },
    runtimeErrors: { a: A.errors.length, b: B.errors.length },
    wallSeconds: { medianA: median(wallA), medianB: median(wallB), ratio: +ratio.toFixed(3), gate: GATE },
    counters: {}
  };
  for (const c of counters) {
    const va = pairs.map(([a]) => +at(a, c) || 0),
      vb = pairs.map(([, b]) => +at(b, c) || 0);
    out.counters[c] = {
      a: va.reduce((s, x) => s + x, 0),
      b: vb.reduce((s, x) => s + x, 0),
      meanDiff: +mean(vb.map((x, i) => x - va[i])).toFixed(4),
      battlesChanged: va.filter((x, i) => x !== vb[i]).length
    };
  }
  out.pass = !out.runtimeErrors.a && !out.runtimeErrors.b && ratio <= GATE;
  return out;
}
if (require.main === module) {
  const args = process.argv.slice(2);
  const counters = [];
  let json = false;
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') json = true;
    else if (args[i] === '--count') counters.push(args[++i]);
    else files.push(args[i]);
  }
  if (files.length !== 2) {
    console.error('usage: compare_benchmark_arms.cjs [--json] [--count path] A.json[,..] B.json[,..]');
    process.exit(2);
  }
  const r = compare(files[0], files[1], counters);
  console.log(JSON.stringify(r, null, json ? 0 : 2));
  if (!r.pass) process.exitCode = 1;
}
module.exports = { compare, mcnemar, binomTwoSided };
