#!/usr/bin/env node
'use strict';
/* Playtester probe pack: compare two arms of run_probe.cjs output on the same seeds.
 *   node scripts/merge_probe_pack.cjs --off <dir|file>... --on <dir|file>... [--json out.json] [--md out.md]
 * Every numeric leaf of each battle's probe reports becomes a metric (`probe.path`). A battle is paired by
 * type and seed; a metric a battle lacks counts as 0 (counters only appear once something happened). Per metric:
 * both arms' totals, the mean paired difference, how many battles went up or down and an exact two-sided sign
 * test. The markdown lists the metrics whose sign test is below 0.05, strongest first, grouped by probe. */
const fs = require('node:fs'),
  path = require('node:path');

function files(arg) {
  const out = [];
  (function walk(p) {
    if (!fs.existsSync(p)) return;
    const st = fs.statSync(p);
    if (st.isDirectory()) fs.readdirSync(p).forEach(f => walk(path.join(p, f)));
    else if (p.endsWith('.json')) out.push(p);
  })(arg);
  return out;
}
function load(args) {
  const m = new Map();
  for (const a of args)
    for (const f of files(a)) {
      let d;
      try {
        d = JSON.parse(fs.readFileSync(f, 'utf8'));
      } catch (_) {
        continue;
      }
      for (const b of d.battles || []) m.set(b.type + ':' + b.seed, b);
    }
  return m;
}
const SKIP = /(^|\.)(examples|longest|samples|trace|events|list)(\.|$)/;
function flatten(prefix, v, out) {
  if (typeof v === 'number' && Number.isFinite(v)) out[prefix] = v;
  else if (typeof v === 'boolean') out[prefix] = v ? 1 : 0;
  else if (v && typeof v === 'object' && !Array.isArray(v)) {
    if (SKIP.test(prefix)) return;
    for (const k of Object.keys(v)) flatten(prefix ? prefix + '.' + k : k, v[k], out);
  }
}
function metrics(b) {
  const o = {};
  flatten('', b.reports || {}, o);
  o['battle.simSeconds'] = b.simSeconds;
  o['battle.errors'] = (b.errors || []).length;
  return o;
}
function binomP(n, k) {
  // two-sided exact sign test, p = 0.5
  if (!n) return 1;
  const lo = Math.min(k, n - k);
  let c = 1,
    tail = 0;
  for (let i = 0; i <= lo; i++) {
    tail += c;
    c = (c * (n - i)) / (i + 1);
  }
  return Math.min(1, (2 * tail) / Math.pow(2, n));
}
function arg(name) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return [];
  const out = [];
  for (let j = i + 1; j < process.argv.length && !process.argv[j].startsWith('--'); j++)
    out.push(process.argv[j]);
  return out;
}
function compare(offMap, onMap) {
  const keys = [...offMap.keys()].filter(k => onMap.has(k)).sort(),
    byMetric = new Map();
  for (const k of keys) {
    const a = metrics(offMap.get(k)),
      b = metrics(onMap.get(k));
    for (const m of new Set([...Object.keys(a), ...Object.keys(b)])) {
      let row = byMetric.get(m);
      if (!row) byMetric.set(m, (row = { metric: m, off: 0, on: 0, up: 0, down: 0, tie: 0 }));
      const x = a[m] || 0,
        y = b[m] || 0;
      row.off += x;
      row.on += y;
      if (y > x + 1e-9) row.up++;
      else if (y < x - 1e-9) row.down++;
      else row.tie++;
    }
  }
  const rows = [...byMetric.values()].map(r => ({
    ...r,
    off: +r.off.toFixed(3),
    on: +r.on.toFixed(3),
    meanDiff: keys.length ? +((r.on - r.off) / keys.length).toFixed(4) : 0,
    change: r.off ? +((r.on - r.off) / Math.abs(r.off)).toFixed(3) : null,
    p: +binomP(r.up + r.down, r.up).toFixed(4)
  }));
  rows.sort((a, b) => a.p - b.p || Math.abs(b.change || 0) - Math.abs(a.change || 0));
  return {
    pairs: keys.length,
    unpaired: { off: offMap.size - keys.length, on: onMap.size - keys.length },
    metrics: rows
  };
}
function markdown(result) {
  const lines = [];
  lines.push(`## Playtester probe pack: ${result.pairs} paired battles`);
  lines.push('');
  lines.push(
    `Unpaired: off ${result.unpaired.off}, on ${result.unpaired.on}. Sign test on paired battles; a metric missing in a battle counts as 0.`
  );
  const sig = result.metrics.filter(m => m.p < 0.05 && m.up + m.down >= 10);
  if (!sig.length) lines.push('', 'No metric moved at p < 0.05.');
  const groups = {};
  for (const m of sig) (groups[m.metric.split('.')[0]] = groups[m.metric.split('.')[0]] || []).push(m);
  for (const g of Object.keys(groups)) {
    lines.push(
      '',
      `### ${g}`,
      '',
      '| metric | off | on | change | up/down | p |',
      '|---|---|---|---|---|---|'
    );
    for (const m of groups[g].slice(0, 25))
      lines.push(
        `| ${m.metric.slice(g.length + 1)} | ${m.off} | ${m.on} | ${m.change === null ? 'n/a' : (m.change * 100).toFixed(0) + '%'} | ${m.up}/${m.down} | ${m.p} |`
      );
  }
  return lines.join('\n') + '\n';
}
if (require.main === module) {
  const off = load(arg('off')),
    on = load(arg('on')),
    result = compare(off, on);
  const j = arg('json')[0],
    md = arg('md')[0];
  if (j) fs.writeFileSync(j, JSON.stringify(result, null, 1) + '\n');
  const text = markdown(result);
  if (md) fs.writeFileSync(md, text);
  console.log(text);
}
module.exports = { compare, binomP, flatten, markdown };
