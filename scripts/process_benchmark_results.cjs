#!/usr/bin/env node
'use strict';
/* Turns a benchmark run's reports into the one result that is published and read, so nobody downloads and adds up by hand:
 *   node scripts/process_benchmark_results.cjs --mode single|seeds --compare compare.json --off a.json[,b.json] --on a.json[,b.json] --out result/
 *        [--seed S] [--seeds N] [--windows W] [--type meeting] [--query-off Q] [--query-on Q] [--max-seeds 8]
 * Writes into --out:
 *   summary.md      the run, the verdict, the paired table, the seeds that part earliest, and the viewer link (the run summary opens with it)
 *   result.json     the same, for a program: meta, verdict, the whole comparison, the viewer files
 *   off.json on.json  slim records for ai_flow_live.html (seed, type, winner, window, timeline), the full-length record of each scenario;
 *                     in seeds mode the --max-seeds pairs whose timelines part earliest (all of them would be megabytes a run)
 *   compare.json    a copy of the comparison
 *   headline.txt viewer_url.txt viewer_preview_url.txt   one line each, for the notification: the server's viewer, and the viewer of the branch that ran
 * Run facts come from the GitHub environment (GITHUB_RUN_NUMBER, GITHUB_RUN_ID, GITHUB_REPOSITORY, GITHUB_REF_NAME, GITHUB_SHA). */
const fs = require('node:fs');
const path = require('node:path');
const { firstDivergence } = require('./compare_benchmark_arms.cjs');
const { format, verdict } = require('./format_benchmark_compare.cjs');

const PROD = 'https://test.ivandpopov.com/grasstex';
/* The preview slug the preview workflow gives a branch (deploy-50webs-preview.yml), so the link opens the viewer of the branch that ran. */
function previewSlug(ref) {
  return String(ref || '')
    .toLowerCase()
    .replace(/^(work|preview)\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}
function viewerBase(ref) {
  const m = /^(work|preview)\//.test(String(ref || ''));
  return m && previewSlug(ref) ? `${PROD}/preview/${previewSlug(ref)}` : PROD;
}
/* The viewer on the server (production), and the viewer of the branch that ran (the preview): it has the change before it reaches main. */
function viewerUrl({ ref, repo, run, pick = '-end', view = 'brain3d', where = 'production' }) {
  const q = new URLSearchParams();
  q.set('bench', String(run));
  if (repo && repo.toLowerCase() !== 'apparanyx/grasstex') q.set('repo', repo);
  if (pick) q.set('pick', pick);
  q.set('view', view);
  if (where === 'preview') {
    if (!/^(work|preview)\//.test(String(ref || ''))) return null;
    return `${viewerBase(ref)}/ai_flow_live.html?${q.toString()}`;
  }
  return `${PROD}/ai_flow_live.html?${q.toString()}`;
}

function readRecords(list) {
  const out = [];
  for (const file of String(list || '')
    .split(',')
    .filter(Boolean)) {
    const r = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const b of r.battles || []) out.push({ b, build: r.summary && r.summary.build });
  }
  return out;
}
/* One record per scenario: the one whose timeline reaches furthest (a scripted run has one per checkpoint, each a prefix of the last). */
function longestPerScenario(records) {
  const reachOf = b =>
    (b.window && +b.window.closedAt) || (b.timeline && b.timeline.samples && b.timeline.samples.length) || 0;
  const best = new Map();
  for (const { b } of records) {
    const key = b.scenarioSeed || b.seed;
    const have = best.get(key);
    if (!have || reachOf(b) >= reachOf(have)) best.set(key, b);
  }
  return best;
}
const slim = b => ({
  seed: b.seed,
  scenarioSeed: b.scenarioSeed || b.seed,
  battleType: b.battleType || null,
  winner: b.winner,
  winReason: b.winReason || null,
  simulatedSeconds: b.simulatedSeconds,
  window: b.window || null,
  timeline: b.timeline || null
});

function process_(args, env = process.env) {
  const mode = args.mode === 'single' ? 'single' : 'seeds';
  const compare = JSON.parse(fs.readFileSync(args.compare, 'utf8'));
  const offAll = readRecords(args.off),
    onAll = readRecords(args.on);
  const build = (offAll[0] && offAll[0].build) || (onAll[0] && onAll[0].build) || null;
  const off = longestPerScenario(offAll),
    on = longestPerScenario(onAll);
  const maxSeeds = Math.max(1, Number.parseInt(args['max-seeds'] || '8', 10) || 8);

  // rank the scenarios both arms played by where their timelines first part
  const ranked = [];
  for (const [key, a] of off) {
    const b = on.get(key);
    if (!b) continue;
    const d = firstDivergence(a, b);
    ranked.push({ key, t: d ? d.t : null, what: d ? d.what : null });
  }
  ranked.sort(
    (x, y) =>
      (x.t == null) - (y.t == null) || (x.t ?? 0) - (y.t ?? 0) || String(x.key).localeCompare(String(y.key))
  );
  const diverged = ranked.filter(x => x.t != null);
  const pick = (mode === 'single' ? ranked : diverged.length ? diverged : ranked).slice(
    0,
    mode === 'single' ? ranked.length : maxSeeds
  );

  const sha = env.GITHUB_SHA || '';
  const meta = {
    mode,
    run: env.GITHUB_RUN_NUMBER || null,
    runId: env.GITHUB_RUN_ID || null,
    repo: env.GITHUB_REPOSITORY || 'apparanyx/grasstex',
    ref: env.GITHUB_REF_NAME || null,
    sha: sha || null,
    runUrl:
      env.GITHUB_RUN_ID && env.GITHUB_REPOSITORY
        ? `https://github.com/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
        : null,
    seed: args.seed || null,
    seeds: mode === 'single' ? 1 : Number(args.seeds) || null,
    windows: args.windows || null,
    battleType: args.type || 'meeting',
    queryOff: args['query-off'] || '',
    queryOn: args['query-on'] || '',
    build
  };
  const v = verdict(compare, mode);
  const link = where =>
    meta.run
      ? viewerUrl({
          ref: meta.ref,
          repo: meta.repo,
          run: meta.run,
          pick: mode === 'single' ? '-end' : '',
          where
        })
      : null;
  const url = link('production'),
    previewUrl = link('preview');

  const viewerFile = side => ({
    format: 'grasstex-benchmark-viewer-v1',
    summary: { build, flags: side === 'off' ? meta.queryOff : meta.queryOn, run: meta.run },
    battles: pick.map(x => slim((side === 'off' ? off : on).get(x.key))).filter(b => b && b.timeline)
  });

  const md = [];
  md.push(
    `# Benchmark run #${meta.run || '?'} · ${mode === 'single' ? `scripted scenario \`${meta.seed || '?'}\`` : `${meta.seeds || '?'} seeds from \`${meta.seed || '?'}\``} (${meta.battleType}), windows \`${meta.windows || '?'}\``,
    ''
  );
  md.push(`- **OFF** flags: \`${meta.queryOff || 'none'}\` · **ON** flags: \`${meta.queryOn || 'none'}\``);
  md.push(
    `- ${meta.ref || '?'} @ ${sha.slice(0, 7) || '?'}${meta.runUrl ? ` · [run](${meta.runUrl})` : ''}${build ? ` · build ${build}` : ''}`,
    ''
  );
  md.push('## Verdict', '', `**${v.headline}**`, '');
  for (const l of v.lines) md.push(`- ${l}`);
  md.push('', '## Paired comparison (off against on)', '', format(compare), '');
  if (pick.length) {
    md.push(
      `## ${mode === 'single' ? 'Where the arms part' : `The ${pick.length} seed${pick.length === 1 ? '' : 's'} that part earliest`} (simulated seconds)`,
      ''
    );
    md.push(
      pick.map(x => `${x.key}${x.t == null ? ' (identical)' : ` ${x.t} s (${x.what})`}`).join(' · '),
      ''
    );
  }
  if (url)
    md.push(
      '## Viewer',
      '',
      `[Open both arms in the 3D map](${url})${previewUrl ? ` · [the same on this branch's viewer](${previewUrl}) (it has the change before it reaches main)` : ''}`,
      '',
      `The viewer loads \`off.json\` and \`on.json\` from the \`benchmark-results\` branch (\`?bench=${meta.run}\`); ${mode === 'single' ? 'it opens the full-length record (`pick=-end`)' : 'it opens the seed that parts earliest'}, and the dropdowns choose another.`,
      ''
    );

  const result = {
    meta,
    verdict: v,
    compare,
    viewer: { url, previewUrl, seeds: pick.map(x => ({ seed: x.key, firstDivergence: x.t, what: x.what })) }
  };
  return {
    md: md.join('\n'),
    result,
    off: viewerFile('off'),
    on: viewerFile('on'),
    headline: v.headline.replace(/\s+/g, ' '),
    url,
    previewUrl
  };
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[++i];
  return o;
}
if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  for (const need of ['compare', 'off', 'on', 'out']) {
    if (!args[need]) {
      console.error(
        'usage: process_benchmark_results.cjs --mode single|seeds --compare compare.json --off a.json[,..] --on a.json[,..] --out dir'
      );
      process.exit(2);
    }
  }
  const r = process_(args);
  fs.mkdirSync(args.out, { recursive: true });
  const w = (name, text) => fs.writeFileSync(path.join(args.out, name), text);
  w('summary.md', r.md + '\n');
  w('result.json', JSON.stringify(r.result, null, 2) + '\n');
  w('off.json', JSON.stringify(r.off));
  w('on.json', JSON.stringify(r.on));
  w('compare.json', fs.readFileSync(args.compare, 'utf8'));
  w('headline.txt', r.headline + '\n');
  w('viewer_url.txt', (r.url || '') + '\n');
  w('viewer_preview_url.txt', (r.previewUrl || '') + '\n');
  console.log(r.headline);
}
module.exports = { process: process_, viewerUrl, viewerBase, previewSlug, longestPerScenario };
