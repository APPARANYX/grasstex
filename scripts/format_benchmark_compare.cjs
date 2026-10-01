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
if (require.main === module) {
  if (!process.argv[2]) {
    console.error('usage: format_benchmark_compare.cjs compare.json');
    process.exit(2);
  }
  console.log(format(JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))));
}
module.exports = { format };
