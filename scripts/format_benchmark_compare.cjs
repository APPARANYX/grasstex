#!/usr/bin/env node
'use strict';
/* The paired report of compare_benchmark_arms.cjs as markdown, for a run summary:
 *   node scripts/format_benchmark_compare.cjs compare.json
 * a = the OFF arm, b = the ON arm. `more` and `fewer` are the pairs (one seed, one window) where the ON arm counted more and fewer
 * of it, ties dropped, and `p` is the exact two-sided sign test on them. */
const fs = require('node:fs');
function format(r) {
  const out = [];
  const w = r.wallSeconds || {};
  out.push(
    `- **${r.pairs}** pairs (unpaired: off ${r.unpaired?.a ?? 0}, on ${r.unpaired?.b ?? 0}) · identical in every field: **${r.identicalBattles}** · runtime errors off ${r.runtimeErrors?.a ?? 0} / on ${r.runtimeErrors?.b ?? 0} · wall time on/off x${w.ratio ?? '?'} (gate ${w.gate ?? '?'})`
  );
  if (r.firstDivergence) {
    const d = r.firstDivergence;
    out.push(
      `- the ${d.battles} changed records first part at simulated second: min ${d.min}, p10 ${d.p10}, median ${d.median}, p90 ${d.p90}, max ${d.max}`
    );
  } else out.push('- no record has a timeline or stress series that parts');
  const rows = Object.entries(r.counters || {});
  if (rows.length) {
    out.push(
      '',
      '| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |',
      '|---|---:|---:|---:|---:|---:|---:|---:|'
    );
    for (const [name, c] of rows)
      out.push(
        `| \`${name}\` | ${c.a} | ${c.b} | ${c.meanDiff} | ${c.battlesChanged} | ${c.more} | ${c.fewer} | ${c.signP} |`
      );
    out.push(
      '',
      'With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.'
    );
  }
  return out.join('\n');
}
/* What the numbers say, mechanically: whether the arms are the same battle, when they part, and which counters moved with a sign
 * test under 0.05 (and under 0.05 / counters tested, the Bonferroni line). A verdict is a reading aid and not a gate: with this many
 * counters about one in twenty is under 0.05 by chance. `mode` single is one battle per arm, where nothing is a finding. */
function pct(a, b) {
  return a ? `${b >= a ? '+' : '-'}${(Math.abs((b - a) / a) * 100).toFixed(1)}%` : b ? 'new' : '0%';
}
function verdict(r, mode = 'seeds') {
  const entries = Object.entries(r.counters || {});
  const tested = entries.filter(([, c]) => c.more + c.fewer > 0);
  const k = entries.length;
  const changed = (r.pairs || 0) - (r.identicalBattles || 0);
  const unpaired = ((r.unpaired && r.unpaired.a) || 0) + ((r.unpaired && r.unpaired.b) || 0);
  const fd = r.firstDivergence;
  const desc = ([n, c]) => `${n} ${c.a} to ${c.b} (${pct(c.a, c.b)}, p ${c.signP})`;
  const lines = [];
  let kind, headline;
  if (!r.pairs) {
    kind = 'empty';
    headline = 'no pairs: the arms share no record';
  } else if (!changed && unpaired) {
    kind = 'incomplete';
    headline = `INCOMPLETE: all ${r.pairs} paired records identical, but ${unpaired} record${unpaired === 1 ? '' : 's'} unpaired (off ${r.unpaired?.a ?? 0}, on ${r.unpaired?.b ?? 0})`;
  } else if (!changed) {
    kind = 'inert';
    headline = `INERT: all ${r.pairs} pairs identical in every field`;
  } else if (mode === 'single') {
    kind = 'single';
    const cas = r.counters && r.counters.casualties;
    lines.push(
      'The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.'
    );
    headline = `one battle per arm, ${changed} of ${r.pairs} records changed${fd ? `, first part at ${fd.min} s` : ''}${cas ? `, casualties ${cas.a} to ${cas.b}` : ''}: sizes, not findings`;
  } else {
    const sig = tested.filter(([, c]) => c.signP < 0.05).sort((x, y) => x[1].signP - y[1].signP);
    const strong = sig.filter(([, c]) => c.signP < 0.05 / Math.max(1, k));
    kind = strong.length ? 'moved' : sig.length ? 'weak' : 'quiet';
    const cas = r.counters && r.counters.casualties;
    headline = `${kind.toUpperCase()}: ${changed} of ${r.pairs} pairs changed${fd ? ` (median first part ${fd.median} s)` : ''}; ${sig.length} of ${k} counters under p 0.05 (about ${(k * 0.05).toFixed(1)} by chance)${strong.length ? `, ${strong.length} under ${(0.05 / k).toFixed(4)}` : ''}${cas ? `; casualties ${pct(cas.a, cas.b)} (p ${cas.signP})` : ''}`;
    if (strong.length)
      lines.push(
        `Clears the Bonferroni line (p < ${(0.05 / k).toFixed(4)}): ${strong.map(desc).join('; ')}.`
      );
    const rest = sig.filter(x => !strong.includes(x));
    if (rest.length) lines.push(`Under 0.05 only: ${rest.map(desc).join('; ')}.`);
    if (!sig.length)
      lines.push(
        'No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.'
      );
  }
  if (r.wallSeconds && r.wallSeconds.ratio > r.wallSeconds.gate)
    lines.push(`Wall time on/off x${r.wallSeconds.ratio} is over the ${r.wallSeconds.gate} gate.`);
  if (((r.runtimeErrors && r.runtimeErrors.a) || 0) + ((r.runtimeErrors && r.runtimeErrors.b) || 0))
    lines.push(`Runtime errors: off ${r.runtimeErrors.a}, on ${r.runtimeErrors.b}.`);
  if (r.unpaired && (r.unpaired.a || r.unpaired.b))
    lines.push(
      `Unpaired records: off ${r.unpaired.a}, on ${r.unpaired.b} (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).`
    );
  return { kind, headline, lines };
}
if (require.main === module) {
  if (!process.argv[2]) {
    console.error('usage: format_benchmark_compare.cjs compare.json');
    process.exit(2);
  }
  console.log(format(JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))));
}
module.exports = { format, verdict };
