#!/usr/bin/env node
'use strict';
/* Static, dependency-free inventory of who READS a soldier's stress (module 17, `BattleSoldierMind`,
   `soldier.mind`, `squad.mind`). It is the read-side sibling of wire-map.js, which inventories writes.
   mind-read-map-check.js holds the answer against `BattleSoldierMind.READERS`, the table module 17 declares
   the readers in, so stress cannot be read from a new place without an edit that a reviewer sees.

   A read is, in any scanned file but module 17 itself:
     - `BattleSoldierMind.<name>`, or `<alias>.<name>` where the file binds an alias (ALIASES): a call or a
       property of the module. The member is `<name>`. A bare `BattleSoldierMind` with no member (an
       existence test, or the binding of an alias) is counted apart, as `bare`, and only tells the check the
       file knows the module;
     - `<anything>.mind`, `<anything>?.mind` and `<anything>['mind']` that is not the target of an
       assignment or a `delete`: the member is `mind`, or `mind.<field>` when a field follows
       (`sq.mind.mean`). The receiver is not classified: `mind` is a rare name, and a soldier's and a
       squad's condition are both stress;
     - the sim-level telemetry names (`_mindSummary`, `_mindSummaryAt`, `_mindSeries`), as themselves.

   Not seen, on purpose: destructuring (`var { mind } = s`), a computed key (`s[key]`), a read through a
   binding the vocabulary does not list, code inside template literals, and an object-literal key
   (`{ mind: x }` names a field, it reads nothing). A new alias for the module is the one way a reader
   slips past: list it in ALIASES. Comments, strings and regular expressions are ignored, by the same
   tokeniser the wire map uses.

   Usage: node tools/ai-sim-harness/mind-read-map.js [--sites]
   GRASSTEX_SOURCE_ROOT scans another checkout. */
const fs = require('node:fs');
const path = require('node:path');
const W = require('./wire-map.js');

/* Module 17 is the owner: its reads of its own state are the module, not a reader of it. */
const OWNER = 'modules/17-soldier-mind.js';
/* Per-file names bound to `BattleSoldierMind`, each read off the variable's binding in that file. */
const ALIASES = {
  'engagement.js': ['M'],
  'modules/16-squad-plan-stability.js': ['M'],
  'modules/40-world-debug-overlay.js': ['Mind']
};
/* `_mindSummary` and friends are what module 17 leaves on the sim for the export and the benchmark. */
const SIM_FIELDS = new Set(['_mindSummary', '_mindSummaryAt', '_mindSeries']);
const ASSIGN = new Set([
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '**=',
  '&=',
  '|=',
  '^=',
  '<<=',
  '>>=',
  '>>>=',
  '&&=',
  '||=',
  '??=',
  '++',
  '--'
]);

function listJs(dir, recurse) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recurse) out.push(...listJs(p, recurse));
    } else if (/\.(?:js|cjs|mjs)$/.test(entry.name)) out.push(p);
  }
  return out;
}
/* Files scanned, relative to the repo root: every runtime file under battle/ but the owner, and the
   scripts that run a battle (the benchmark and the probes). The harness checks under tools/ are tests:
   they read whatever they assert on, and are not readers of the shipping game. */
function files(root) {
  const rel = f => path.relative(root, f).split(path.sep).join('/');
  const runtime = listJs(path.join(root, 'battle'), true)
    .map(rel)
    .filter(f => f !== 'battle/' + OWNER);
  const tooling = listJs(path.join(root, 'scripts'), false)
    .concat(listJs(path.join(root, 'scripts', 'probes'), false))
    .map(rel);
  return { runtime: runtime.sort(), tooling: tooling.sort() };
}

function scan(source, file) {
  const t = W.tokens(source),
    hits = [],
    aliases = new Set(ALIASES[file] || []);
  const v = i => t[i] && t[i].v;
  const ident = i => t[i] && !t[i].quoted && /^[A-Za-z_$][\w$]*$/.test(v(i));
  const punct = (i, s) => t[i] && !t[i].quoted && v(i) === s;
  const dotBefore = i => punct(i - 1, '.') || punct(i - 1, '?.');
  /* The member named at j: `.name`, `?.name`, `['name']` or `?.['name']`. {name, next} or null. */
  function memberAt(j) {
    if ((punct(j, '.') || punct(j, '?.')) && ident(j + 1)) return { name: v(j + 1), next: j + 2 };
    const open = punct(j, '?.') && punct(j + 1, '[') ? j + 1 : j;
    if (punct(open, '[') && t[open + 1] && t[open + 1].quoted && punct(open + 2, ']'))
      return { name: v(open + 1), next: open + 3 };
    return null;
  }
  /* Is the chain that ends at `next - 1` an assignment target, a `delete` operand or a `++` operand?
     `before` is the token just before its last member's name (the dot, or the bracket). */
  function mutated(before, next) {
    if (t[next] && !t[next].quoted && ASSIGN.has(v(next))) return true;
    let j = before;
    while (j >= 0 && (punct(j, '.') || punct(j, '?.') || punct(j, '[') || ident(j))) {
      if (ident(j) && v(j) === 'delete') return true;
      j--;
    }
    return punct(j, '++') || punct(j, '--');
  }
  for (let i = 0; i < t.length; i++) {
    if (t[i].quoted) {
      /* x['mind'] : the quoted name sits between [ and ], after an operand. */
      if (
        v(i) === 'mind' &&
        punct(i - 1, '[') &&
        punct(i + 1, ']') &&
        (ident(i - 2) || punct(i - 2, ')') || punct(i - 2, ']') || punct(i - 2, '?.'))
      ) {
        const field = memberAt(i + 2);
        if (!mutated(i - 1, field ? field.next : i + 2))
          hits.push({ member: field ? 'mind.' + field.name : 'mind', line: t[i].line });
      }
      continue;
    }
    if (!ident(i)) continue;
    const name = v(i);
    if (name === 'BattleSoldierMind' || (aliases.has(name) && !dotBefore(i))) {
      const m = memberAt(i + 1);
      if (m) hits.push({ member: m.name, line: t[i].line });
      else if (name === 'BattleSoldierMind') hits.push({ member: null, line: t[i].line });
      continue;
    }
    if (name === 'mind' && dotBefore(i)) {
      const field = memberAt(i + 1);
      if (!mutated(i - 1, field ? field.next : i + 1))
        hits.push({ member: field ? 'mind.' + field.name : 'mind', line: t[i].line });
      continue;
    }
    if (SIM_FIELDS.has(name) && dotBefore(i) && !mutated(i - 1, i + 1))
      hits.push({ member: name, line: t[i].line });
  }
  return hits;
}

/* {file: {members: {member: [lines]}, bare: [lines]}} for every scanned file that reads stress at all. */
function sites(root) {
  const out = { runtime: {}, tooling: {} },
    found = files(root);
  for (const kind of ['runtime', 'tooling']) {
    for (const file of found[kind]) {
      const name = kind === 'runtime' ? file.replace(/^battle\//, '') : file,
        hits = scan(fs.readFileSync(path.join(root, file), 'utf8'), name);
      if (!hits.length) continue;
      const rec = (out[kind][name] = { members: {}, bare: [] });
      for (const h of hits) {
        if (h.member == null) rec.bare.push(h.line);
        else (rec.members[h.member] ||= []).push(h.line);
      }
    }
  }
  return out;
}

module.exports = { OWNER, ALIASES, SIM_FIELDS, files, scan, sites };

if (require.main === module) {
  const root = process.env.GRASSTEX_SOURCE_ROOT || path.resolve(__dirname, '../..');
  const showSites = process.argv.includes('--sites');
  const map = sites(root);
  for (const kind of ['runtime', 'tooling']) {
    console.log('# ' + kind);
    for (const file of Object.keys(map[kind]).sort()) {
      const rec = map[kind][file];
      console.log(
        file.padEnd(48) +
          Object.keys(rec.members)
            .sort()
            .map(m => m + ':' + rec.members[m].length)
            .join('  ') +
          (rec.bare.length ? '  (bare:' + rec.bare.length + ')' : '')
      );
      if (showSites)
        for (const m of Object.keys(rec.members).sort())
          console.log('    ' + m + ' at ' + rec.members[m].join(', '));
    }
  }
}
