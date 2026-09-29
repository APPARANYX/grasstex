#!/usr/bin/env node
'use strict';
/* Mutation test for the wire-map ratchet. A check that cannot fail proves nothing, so this breaks
   things on purpose and requires tools/ai-sim-harness/wire-map-check.js to notice. Each mutant runs
   in a private copy of battle/*.js and the wire-map files under the OS temp directory.

   Two families, both must be fully killed (exit 1 if any survives):

   - ratchet mutants: a new writer file, a second writer for a single-writer field, an Engagement
     record written by a new module, a stale or shrunken entry, an excluded file that writes, and
     every way the baseline can be malformed;
   - scanner mutants: one edit at a time to wire-map.js (a write form, a chain rule, a receiver
     rule, the tokeniser, the file list) that the scanner fixtures must catch.

   The scanner mutants edit exact text in wire-map.js, so a reformat or refactor there makes an
   anchor go missing and this script says which one: update the anchor, do not delete the mutant.
   An equivalent mutant (one no test could tell from the original) is a sign the code has a
   redundant branch: delete the branch.

   Usage: node scripts/probe_wire_map_mutants.cjs [ratchet|scanner]
   Measured 2026-09-29: 21 ratchet mutants and 66 scanner mutants, all killed. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const HARNESS = 'tools/ai-sim-harness';
const which = process.argv[2];
let tmp = null;

function fresh() {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wire-map-mutant-'));
  fs.mkdirSync(path.join(tmp, HARNESS), { recursive: true });
  fs.cpSync(path.join(REPO, 'battle'), path.join(tmp, 'battle'), {
    recursive: true,
    filter: src => (fs.statSync(src).isDirectory() ? !/[\\/]audio$/.test(src) : src.endsWith('.js'))
  });
  for (const f of ['wire-map.js', 'wire-map-check.js'])
    fs.copyFileSync(path.join(REPO, HARNESS, f), path.join(tmp, HARNESS, f));
  fs.cpSync(path.join(REPO, HARNESS, 'fixtures'), path.join(tmp, HARNESS, 'fixtures'), { recursive: true });
}
function run() {
  const r = cp.spawnSync('node', [path.join(tmp, HARNESS, 'wire-map-check.js')], { encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const battle = p => path.join(tmp, 'battle', p);
const baselinePath = () => path.join(tmp, HARNESS, 'fixtures', 'wire-map-baseline.json');
const scannerPath = () => path.join(tmp, HARNESS, 'wire-map.js');
function edit(file, from, to) {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('mutation anchor missing in ' + file + ': ' + from.slice(0, 80));
  fs.writeFileSync(file, s.replace(from, to));
}
function replaceAll(file, from, to) {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('mutation anchor missing in ' + file + ': ' + from.slice(0, 80));
  fs.writeFileSync(file, s.split(from).join(to));
}
const append = (file, text) => fs.appendFileSync(file, '\n' + text + '\n');
function baseline(fn) {
  const j = JSON.parse(fs.readFileSync(baselinePath(), 'utf8'));
  fn(j);
  fs.writeFileSync(baselinePath(), JSON.stringify(j, null, 2));
}
const W21 = 'modules/21-defender-engineers.js';

const ratchet = [
  [
    'new writer file on an existing multi-writer field',
    () => append(battle('modules/13-captain-command-throttle.js'), 'function m(sq) { sq.rally = null; }'),
    /NEW writer .*squad\.rally/
  ],
  [
    'single-writer field gains a second writer',
    () => append(battle('modules/45-stance-transition-crawl.js'), 'function m(s) { s._planPost = null; }'),
    /NEW multi-writer field soldier\._planPost/
  ],
  [
    'Engagement record written by a new module',
    () => append(battle('modules/45-stance-transition-crawl.js'), 'function m(s) { s.eng.cover = null; }'),
    /NEW writer .*eng\.cover/
  ],
  [
    'eng.state written outside Engagement (a Phase 1 regression)',
    () => append(battle('modules/44-combat-urgency.js'), 'function m(e) { e.state = "alert"; }'),
    /eng\.state/
  ],
  [
    'listed writer stops writing (stale entry)',
    () => edit(battle(W21), '      sq.rally = copy(center);\n', ''),
    /no longer writes/
  ],
  [
    'field drops to one writer',
    () => edit(battle(W21), '      sq._orderGoal = null;\n', ''),
    /down to 1 writer/
  ],
  [
    'excluded file writes a new sim field',
    () => append(battle('modules/98-damage-range.js'), 'function m(s) { s.prone = true; }'),
    /writes soldier\.prone but is excluded/
  ],
  [
    'excluded file stops writing a declared field',
    () => replaceAll(battle('modules/11-voice-variation.js'), '_voicePitchProfile', '_voicePitchProfileX'),
    /no longer writes soldier\._voicePitchProfile/
  ],
  [
    'excluded file missing',
    () => fs.rmSync(battle('modules/97-device-benchmark.js')),
    /excluded but missing/
  ],
  [
    'baseline: unknown role',
    () =>
      baseline(j => {
        j.fields['squad.rally'].writers[W21].as = 'setupp';
      }),
    /is not one of/
  ],
  [
    'baseline: missing reason',
    () =>
      baseline(j => {
        delete j.fields['squad.rally'].writers[W21].why;
      }),
    /a reason is required/
  ],
  [
    'baseline: debt without fix',
    () =>
      baseline(j => {
        delete j.fields['squad.rally'].writers['commander-ai.js'].fix;
      }),
    /debt needs fix/
  ],
  [
    'baseline: fix on a non-debt entry',
    () =>
      baseline(j => {
        j.fields['squad.rally'].writers[W21].fix = 'phase 5';
      }),
    /only debt carries a fix/
  ],
  [
    'baseline: owner role on a non-owner file',
    () =>
      baseline(j => {
        j.fields['squad.rally'].writers[W21].as = 'owner';
      }),
    /owner role belongs to the owner file only/
  ],
  [
    'baseline: owner file does not write the field',
    () =>
      baseline(j => {
        j.fields['squad.rally'].owner = 'engagement.js';
      }),
    /is not among the writers|owner role belongs/
  ],
  [
    'baseline: reason key that does not exist',
    () =>
      baseline(j => {
        j.fields['squad.rally'].writers[W21].why = 'no-such-reason';
      }),
    /looks like a reason key that does not exist/
  ],
  [
    'baseline: reason nothing uses',
    () =>
      baseline(j => {
        j.reasons['orphan-reason'] = 'never referenced';
      }),
    /reasons nothing refers to/
  ],
  [
    'baseline: entry with one writer',
    () =>
      baseline(j => {
        delete j.fields['squad.rally'].writers[W21];
      }),
    /needs two or more writers|no longer|NEW writer/
  ],
  [
    'baseline: multi-writer field left out',
    () =>
      baseline(j => {
        delete j.fields['squad.rally'];
      }),
    /NEW multi-writer field squad\.rally/
  ],
  [
    'baseline: writer file that does not exist',
    () =>
      baseline(j => {
        j.fields['squad.rally'].writers['modules/99-nope.js'] = { as: 'setup', why: 'x' };
      }),
    /does not exist/
  ],
  [
    'baseline: debt with a phase that is not one',
    () =>
      baseline(j => {
        j.fields['squad.rally'].writers['commander-ai.js'].fix = 'phase 9';
      }),
    /debt needs fix/
  ]
];

/* [name, text to find in wire-map.js, replacement]. */
const scanner = [
  ['delete detection off', "(t[i - 1] && !t[i - 1].quoted && v(i - 1) === 'delete')", 'false'],
  ['prefix detection off', '\n      prefix ||', ''],
  [
    'prefix: over-specified (receiver must share the ++ line)',
    "const prefix =\n      (punct(i - 1, '++') || punct(i - 1, '--')) &&",
    "const prefix =\n      (punct(i - 1, '++') || punct(i - 1, '--')) && t[i - 1].line === t[i].line &&"
  ],
  [
    'prefix: postfix guard dropped',
    "!(\n        t[i - 2] &&\n        t[i - 2].line === t[i - 1].line &&\n        (ident(i - 2) || punct(i - 2, ')') || punct(i - 2, ']'))\n      );",
    'true;'
  ],
  ['prefix: postfix guard ignores lines', 't[i - 2].line === t[i - 1].line &&\n        (ident', '(ident'],
  ['postfix and assignment detection off', '(t[j] && !t[j].quoted && OPS.has(v(j)))', 'false'],
  ['member receivers accepted', "if (punct(i - 1, '.') || punct(i - 1, '?.')) continue;", ''],
  ['dot chain off', "if ((punct(j, '.') || punct(j, '?.')) && ident(j + 1)) {", 'if (false) {'],
  ['bracket chain off', "} else if (punct(open, '[') && pair.has(open)) {", '} else if (false) {'],
  ['?.[ ignored', "const open = punct(j, '?.') && punct(j + 1, '[') ? j + 1 : j;", 'const open = j;'],
  [
    'string key not read as a name',
    "parts.push(close === open + 2 && t[open + 1].quoted ? v(open + 1) : '[]');",
    "parts.push('[]');"
  ],
  ['string key of any length', 'close === open + 2 &&', ''],
  ['bracket pairing off', "else if (tok.v === ']' && open.length) pair.set(open.pop(), i);", ''],
  [
    'collection guard off',
    "if (parts[0] !== '[]') return null;\n    parts = parts.slice(1);",
    'parts = parts.slice(1);'
  ],
  ['collection not sliced', "parts = parts.slice(1);\n    kind = 'soldier';", "kind = 'soldier';"],
  ['collection stays a collection', "    kind = 'soldier';\n  }", '  }'],
  [
    'computed first key recorded',
    "if (!parts.length || parts[0] === '[]') return null;",
    'if (!parts.length) return null;'
  ],
  ['eng hop computed-key guard off', "parts[1] !== '[]' &&\n      (parts[0]", '(parts[0]'],
  [
    'eng hop off',
    "(parts[0] === 'eng' || parts[0] === 'mind' || parts[0] === 'squad')",
    "(parts[0] === 'mind' || parts[0] === 'squad')"
  ],
  [
    'mind hop off',
    "(parts[0] === 'eng' || parts[0] === 'mind' || parts[0] === 'squad')",
    "(parts[0] === 'eng' || parts[0] === 'squad')"
  ],
  [
    'squad hop off',
    "(parts[0] === 'eng' || parts[0] === 'mind' || parts[0] === 'squad')",
    "(parts[0] === 'eng' || parts[0] === 'mind')"
  ],
  [
    'root.position rule off',
    "if (parts[0] === 'root')\n      return ['position', 'rotation'].includes(parts[1]) ? { kind, field: 'root.' + parts[1] } : null;",
    ''
  ],
  [
    'any root child recorded',
    "['position', 'rotation'].includes(parts[1]) ? { kind, field: 'root.' + parts[1] } : null",
    "{ kind, field: 'root.' + parts[1] }"
  ],
  ['NOT_STATE off', 'if (NOT_STATE.has(parts[0])) return null;', ''],
  [
    'hop applies to squads too',
    "if (kind === 'soldier') {\n    if (\n      parts.length > 1",
    "if (kind === 'soldier' || kind === 'squad') {\n    if (\n      parts.length > 1"
  ],
  [
    'null removes nothing',
    'if (kind === null) names.delete(name);\n    else names.set(name, kind);',
    'names.set(name, kind);'
  ],
  ['no squad names', "SQUAD_NAMES.forEach(n => names.set(n, 'squad'));", ''],
  ['no soldier names', "SOLDIER_NAMES.forEach(n => names.set(n, 'soldier'));", ''],
  ['no collections', "COLLECTIONS.forEach(n => names.set(n, 'collection'));", ''],
  ['no per-file corrections', 'Object.entries(RECEIVERS[file] || {})', '[]'],
  [
    'comments not skipped',
    'if (/^\\s|^\\/\\/|^\\/\\*/.test(raw)) continue;',
    'if (/^\\s/.test(raw)) continue;'
  ],
  ['comment alternatives dropped', '|\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/', ''],
  ['single-quoted strings dropped', "|'(?:\\\\[\\s\\S]|[^'\\\\])*'", ''],
  ['double-quoted strings dropped', '|"(?:\\\\[\\s\\S]|[^"\\\\])*"', ''],
  ['template strings dropped', '|`(?:\\\\[\\s\\S]|[^`\\\\])*`', ''],
  ['regex literals not recognised', "if (raw === '/' && (!out.length ||", 'if (false && (!out.length ||'],
  ['strings not marked quoted', 'quoted: /^[\'"`]/.test(raw)', 'quoted: false'],
  ['string tokens keep their quotes', 'v: /^[\'"`]/.test(raw) ? raw.slice(1, -1) : raw', 'v: raw'],
  [
    'token lines stuck',
    'quoted: /^[\'"`]/.test(raw), line: at });',
    'quoted: /^[\'"`]/.test(raw), line: 1 });'
  ],
  ['files: exclusions ignored', '.filter(f => !EXCLUDED.has(f))', ''],
  [
    'files: modules skipped',
    ".concat(\n      fs\n        .readdirSync(path.join(dir, 'modules'))\n        .filter(f => f.endsWith('.js'))\n        .map(f => 'modules/' + f)\n    )",
    ''
  ],
  [
    'files: non-js accepted',
    ".readdirSync(dir)\n    .filter(f => f.endsWith('.js'))\n    .concat(",
    '.readdirSync(dir)\n    .concat('
  ],
  [
    'sites keep only the last site per file',
    '(byFile[file] ||= []).push({ line: w.line, receiver: w.receiver });',
    '(byFile[file] = []).push({ line: w.line, receiver: w.receiver });'
  ],
  ['sites: wrong receiver recorded', 'receiver: v(i) });', "receiver: 'x' });"],
  ['sites: line off by one', 'line: t[i].line, receiver', 'line: t[i].line + 1, receiver'],
  ['collect unsorted files', 'Object.keys(byFile).sort()', 'Object.keys(byFile).reverse()'],
  [
    'kinds lose mind',
    "const KINDS = ['squad', 'soldier', 'eng', 'mind'];",
    "const KINDS = ['squad', 'soldier', 'eng'];"
  ],
  ['EXCLUDED_WRITES export dropped', '  EXCLUDED,\n  EXCLUDED_WRITES,', '  EXCLUDED,']
];
/* Each operator in the OPS set, removed in turn. */
for (const op of [
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
])
  scanner.push(['OPS loses ' + op, { op }, null]);

function removeOp(op) {
  const s = fs.readFileSync(scannerPath(), 'utf8'),
    m = s.match(/const OPS = new Set\(\[([\s\S]*?)\]\);/);
  const all = m[1]
      .split(',')
      .map(x => x.trim())
      .filter(Boolean),
    list = all.filter(x => x !== "'" + op + "'");
  if (list.length !== all.length - 1) throw new Error('operator not found in OPS: ' + op);
  fs.writeFileSync(scannerPath(), s.replace(m[0], 'const OPS = new Set([' + list.join(', ') + ']);'));
}

let failed = false;
fresh();
const control = run();
if (control.status !== 0) {
  console.error('the unmutated copy fails, so nothing below means anything:\n' + control.out);
  process.exit(2);
}
console.log('control (no mutation): passes');

if (!which || which === 'ratchet') {
  const survivors = [];
  for (const [name, mutate, expect] of ratchet) {
    fresh();
    mutate();
    const r = run();
    const killed = r.status !== 0,
      said = expect.test(r.out);
    if (!killed) survivors.push(name);
    console.log(
      (killed ? 'killed   ' : 'SURVIVED ') +
        name +
        (killed && !said ? '  (failed with an unexpected message)' : '')
    );
    if (killed && !said) survivors.push(name + ' [message]');
  }
  console.log('ratchet mutants: ' + ratchet.length + ', survivors ' + survivors.length);
  failed = failed || survivors.length > 0;
}
if (!which || which === 'scanner') {
  const survivors = [];
  for (const [name, from, to] of scanner) {
    fresh();
    if (typeof from === 'object') removeOp(from.op);
    else edit(scannerPath(), from, to);
    if (run().status === 0) {
      survivors.push(name);
      console.log('SURVIVED ' + name);
    }
  }
  console.log('scanner mutants: ' + scanner.length + ', survivors ' + survivors.length);
  failed = failed || survivors.length > 0;
}
if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
