/* Paired report for two standard-benchmark arms run on one seed prefix.
 *   node scripts/compare_benchmark_arms.cjs [--json] [--count path ...] A.json[,A2.json] B.json[,B2.json]
 * Each argument is a merged battle-benchmark.json (a comma list pools several seed prefixes; the two
 * lists must hold the same prefixes in the same order). Battles pair on `seed`. Reported:
 *   - per-battle identity (every field except wall time and run provenance) and how many battles changed at all,
 *     and, when the records carry a `timeline`, the simulated second at which the changed battles first diverge;
 *   - exact two-sided McNemar (binomial on the discordant pairs) for the winner (US vs GE flips),
 *     the time-limit battles and the no-capture battles;
 *   - captures, movement stalls, runtime errors, wall time (median per battle, and the 25% gate).
 *   (`--count` also gives the per-battle sign test: battles with more, with fewer, and the exact two-sided p.)
 * `--count a.b.c` adds a per-battle numeric counter read by path (e.g. `regroups.entries`), summed
 * and paired by mean difference; repeat the flag for more. `--ignore a.b` leaves that field out of the identity
 * test (repeat it, or comma-separate): a build that adds a field to the record is compared with one that does not by
 * ignoring it, so "identical on every existing field" is what the test says (e.g. `--ignore stress`).
 * `--count timeline.stalledOnsets` and `--count timeline.stalledSamples` read the per-second `stalled` series of the
 * record's timeline (module 97): the men newly stalled each second, and the man-seconds stalled. The runner's own
 * `movementStalls` count each man once, when he has not moved 1.5 m for 12 s, but its clock keeps running through the
 * states and phases it skips (a man holding in `cower` is skipped, then reported the moment he is back in `advance`),
 * while the timeline's clock starts again whenever a man stops qualifying. For an arm that holds men in place, read the
 * timeline's numbers: with every reaction off the two agree (39 reports, 45 onsets on main); with `stressAct=cower`
 * 78 reports and 40 onsets.
 * Exit 1 on any runtime error or a median wall-time slowdown above 25%. Nothing is tuned here:
 * it reports, the caller decides what a number means. With ~30 comparisons a p of 0.01 is not a finding. */
'use strict';
const fs = require('node:fs');
const GATE = 1.25;
const NOT_STATE = new Set(['wallSeconds', 'index', 'cpuWallSeconds']);
/* Provenance that names the run and not the battle, left out of identity: the page's BATTLE_REF is
   `local-<mtime of the checkout>`, so the timeline's `ref` differs between any two runs of one commit. */
const NOT_STATE_PATHS = ['timeline.ref', 'timeline.build'];

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
/* Counters derived from the timeline's per-second `stalled` series, summed over both sides. */
function stalledSeries(b) {
  const samples = (b.timeline && b.timeline.samples) || [];
  let onsets = 0,
    manSeconds = 0;
  for (const side of ['us', 'ge']) {
    let prev = 0;
    for (const x of samples) {
      const v = (x[side] && x[side].stalled) | 0;
      if (v > prev) onsets += v - prev;
      manSeconds += v;
      prev = v;
    }
  }
  return { onsets, manSeconds };
}
const DERIVED = {
  'timeline.stalledOnsets': b => stalledSeries(b).onsets,
  'timeline.stalledSamples': b => stalledSeries(b).manSeconds
};
const at = (o, p) => (DERIVED[p] ? DERIVED[p](o) : p.split('.').reduce((v, k) => (v == null ? v : v[k]), o));
/* A copy of `o` without the field at `parts`, sharing everything it does not touch. */
function without(o, parts) {
  if (o == null || typeof o !== 'object' || !(parts[0] in o)) return o;
  const copy = Array.isArray(o) ? o.slice() : { ...o };
  if (parts.length > 1) copy[parts[0]] = without(o[parts[0]], parts.slice(1));
  else delete copy[parts[0]];
  return copy;
}
function stateOf(b, ignore = []) {
  let out = {};
  for (const k of Object.keys(b).sort()) if (!NOT_STATE.has(k)) out[k] = b[k];
  for (const path of NOT_STATE_PATHS.concat(ignore)) out = without(out, path.split('.'));
  return JSON.stringify(out);
}
/* The first simulated second at which two battles' timelines differ (per side, per second: the counts of
   men, phases, briefs, Engagement states and Movement Resolver intents), or at which their stress series
   differ; null when neither carries one or they agree. Wall time never enters: `t` is simulated seconds. */
function firstDivergence(a, b) {
  const rows = (x, key) => (x && x[key] && x[key].samples) || null;
  let first = null;
  const take = (t, what) => {
    if (t != null && (first == null || t < first.t)) first = { t, what };
  };
  const ta = rows(a, 'timeline'),
    tb = rows(b, 'timeline');
  if (ta && tb)
    for (let i = 0; i < Math.min(ta.length, tb.length); i++)
      if (JSON.stringify(ta[i]) !== JSON.stringify(tb[i])) {
        take(ta[i].t, 'timeline');
        break;
      }
  const sa = a.stress && a.stress.series,
    sb = b.stress && b.stress.series;
  if (sa && sb)
    for (let i = 0; i < Math.min(sa.t.length, sb.t.length); i++)
      if (
        sa.t[i] !== sb.t[i] ||
        JSON.stringify([sa.us[i], sa.ge[i]]) !== JSON.stringify([sb.us[i], sb.ge[i]])
      ) {
        take(sa.t[i], 'stress');
        break;
      }
  return first;
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
function compare(aList, bList, counters = [], ignore = []) {
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
    identicalBattles: pairs.filter(([a, b]) => stateOf(a, ignore) === stateOf(b, ignore)).length,
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
    movementStalls: {
      a: pairs.reduce((s, [a]) => s + stalls(a), 0),
      b: pairs.reduce((s, [, b]) => s + stalls(b), 0)
    },
    runtimeErrors: { a: A.errors.length, b: B.errors.length },
    wallSeconds: { medianA: median(wallA), medianB: median(wallB), ratio: +ratio.toFixed(3), gate: GATE },
    counters: {}
  };
  const diverged = pairs
    .filter(([a, b]) => stateOf(a, ignore) !== stateOf(b, ignore))
    .map(([a, b]) => firstDivergence(a, b))
    .filter(Boolean);
  if (diverged.length) {
    const ts = diverged.map(d => d.t).sort((x, y) => x - y);
    out.firstDivergence = {
      battles: diverged.length,
      min: ts[0],
      p10: ts[Math.floor((ts.length - 1) * 0.1)],
      median: median(ts),
      p90: ts[Math.ceil((ts.length - 1) * 0.9)],
      max: ts[ts.length - 1]
    };
  }
  for (const c of counters) {
    const va = pairs.map(([a]) => +at(a, c) || 0),
      vb = pairs.map(([, b]) => +at(b, c) || 0);
    out.counters[c] = {
      a: va.reduce((s, x) => s + x, 0),
      b: vb.reduce((s, x) => s + x, 0),
      meanDiff: +mean(vb.map((x, i) => x - va[i])).toFixed(4),
      battlesChanged: va.filter((x, i) => x !== vb[i]).length,
      /* Per-battle sign test: how many battles had more (B above A) and fewer of it, ties dropped, exact two-sided p. */
      more: va.filter((x, i) => vb[i] > x).length,
      fewer: va.filter((x, i) => vb[i] < x).length,
      signP: +binomTwoSided(
        va.filter((x, i) => vb[i] > x).length,
        va.filter((x, i) => vb[i] !== x).length
      ).toFixed(4)
    };
  }
  out.pass = !out.runtimeErrors.a && !out.runtimeErrors.b && ratio <= GATE;
  return out;
}
if (require.main === module) {
  const args = process.argv.slice(2);
  const counters = [],
    ignore = [];
  let json = false;
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') json = true;
    else if (args[i] === '--count') counters.push(args[++i]);
    else if (args[i] === '--ignore') ignore.push(...String(args[++i]).split(',').filter(Boolean));
    else files.push(args[i]);
  }
  if (files.length !== 2) {
    console.error(
      'usage: compare_benchmark_arms.cjs [--json] [--count path] [--ignore path] A.json[,..] B.json[,..]'
    );
    process.exit(2);
  }
  const r = compare(files[0], files[1], counters, ignore);
  console.log(JSON.stringify(r, null, json ? 0 : 2));
  if (!r.pass) process.exitCode = 1;
}
module.exports = { compare, mcnemar, binomTwoSided, stateOf, firstDivergence };
