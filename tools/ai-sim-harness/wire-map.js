#!/usr/bin/env node
'use strict';
/* Static, dependency-free ownership inventory. This is a conservative source ratchet,
   not a JavaScript type checker: its receiver vocabulary is explicit and audited.

   It answers one question: which source files write which field of a squad, a soldier, a
   soldier's Engagement record (`soldier.eng`) or a soldier's condition (`soldier.mind`).
   wire-map-check.js holds the answer against a committed baseline, so a field can only gain a
   writer file by an edit that a reviewer sees. state-ownership-check.js is the strict sibling: it
   proves exactly one owner for a few protected fields with alias tracking; this map is the wide net
   over everything else.

   A write is `recv.field = v`, `recv['field'] = v`, any compound assignment, `recv.field++`,
   `++recv.field` and `delete recv.field`. A chain counts against the first field that is not a
   record of its own: `s.weapon.ammo = 1` writes `weapon`; `s.eng.cover = null` writes `eng.cover`
   (Engagement's record), `s.mind.stress` writes `mind.stress`, and `s.squad.f = v` writes
   `squad.f`. A soldier's body position is tracked as `root.position` / `root.rotation`.

   Receivers are identifiers, classified by SQUAD_NAMES and SOLDIER_NAMES, then corrected per file
   by RECEIVERS (`e` is the Engagement record in engagement.js and an enemy in squad-ai.js).
   Indexed receivers (`members[i].f`) go through COLLECTIONS.

   Not seen, on purpose: method calls that mutate (`position.set`, `arr.push`, `Object.assign` onto
   state), `Object.defineProperty`, destructuring targets, code inside template literals, and a
   write through an alias the vocabulary does not list. A new receiver name in a scanned file is the
   one way a writer slips past: list it here. Scanner recall was measured against a TypeScript AST
   scan when this was written (see wire-map-check.js).

   Usage: node tools/ai-sim-harness/wire-map.js [--multi] [--sites] [kind.field-substring]
   GRASSTEX_SOURCE_ROOT scans another checkout. */
const fs = require('node:fs');
const path = require('node:path');

/* Not scanned: UI, overlays, exporters, rendering, audio, the headless trainer's match teardown and
   the damage-range lab mode. They run in the page or the tooling rather than the fixed AI tick, and
   their writes are DOM, Babylon, disposal or laboratory setup.
   Everything else is scanned, including diagnostics (which must stay observe-only), module 39
   (Navigation despite its debug name: it sets `_physicalPath`) and the few presentation modules
   that run inside the tick and do write sim fields (12, 45, 52-visual). */
const EXCLUDED = new Set([
  'ai-trainer.js',
  'camera-controls.js',
  'acoustics.js',
  'battle-control.js',
  'battle-telemetry.js',
  'modules/09-voice-runtime.js',
  'modules/11-voice-variation.js',
  'modules/13-combat-fx-consistency.js',
  'modules/15-bullet-impact-fx.js',
  'modules/30-ai-graph-editor.js',
  'modules/30-macro-command-control.js',
  'modules/31-ai-graph-logic.js',
  'modules/33-ai-graph-usability.js',
  'modules/34-ai-timing-map.js',
  'modules/35-ai-command-hierarchy.js',
  'modules/37-lease-panel.js',
  'modules/38-ai-diagnostics-export.js',
  'modules/40-world-debug-overlay.js',
  'modules/42-control-mode-toast.js',
  'modules/47-contextual-voice-behavior.js',
  'modules/50-tactical-voice-awareness.js',
  'modules/53-fbx-clip-table.js',
  'modules/53-fbx-soldier-backend.js',
  'modules/97-device-benchmark.js',
  'modules/98-damage-range.js',
  'modules/99-session-diagnostics-export.js'
]);
/* The fields an excluded file is known to write on a classified receiver. wire-map-check.js fails
   when an excluded file writes anything else, so an exclusion cannot hide a new sim write. */
const EXCLUDED_WRITES = {
  /* UI possession owns this one lifetime flag; AI layers only read it. */
  'camera-controls.js': ['soldier.isPlayer'],
  'modules/11-voice-variation.js': ['soldier._voicePitchProfile'],
  'modules/15-bullet-impact-fx.js': ['soldier._uvWoundMarks'],
  'modules/35-ai-command-hierarchy.js': ['soldier.id'],
  'modules/38-ai-diagnostics-export.js': ['soldier.id'],
  'modules/47-contextual-voice-behavior.js': ['soldier.voiceCooldown'],
  'modules/53-fbx-soldier-backend.js': ['soldier._fbx'],
  'modules/98-damage-range.js': [
    'soldier._faceHint',
    'soldier.destination',
    'soldier.moveSpeed',
    'soldier.moving',
    'soldier.reloadUntil',
    'soldier.reloading',
    'soldier.root.position',
    'soldier.root.rotation',
    'soldier.target',
    'soldier.weapon'
  ]
};
const SQUAD_NAMES = new Set(['sq', 'squad']);
const SOLDIER_NAMES = new Set([
  'soldier',
  's',
  'man',
  'member',
  'leader',
  'enemy',
  'victim',
  'shooter',
  'target',
  'ally',
  'other',
  'actor',
  'unit',
  'gunner',
  'scout'
]);
/* Names whose indexed elements are soldiers: `members[i].destination = p`. */
const COLLECTIONS = new Set(['members', 'men', 'units', 'soldiers']);
/* Per-file corrections, each read off the variable's binding in that file. null removes a name. */
const RECEIVERS = {
  'commander-ai.js': { survivor: 'squad' },
  'engagement.js': { e: 'eng' },
  'squad-ai.js': { e: 'soldier' },
  'modules/00-battle-sides.js': { s: null },
  'modules/16-squad-plan-stability.js': { q: 'squad', next: 'soldier' },
  'modules/17-soldier-mind.js': { m: 'mind' },
  'modules/44-combat-urgency.js': { e: 'eng', a: 'collection' },
  'modules/47-sidearm-switch.js': { e: 'eng' },
  'modules/52-survival-tactical-route.js': { a: 'collection' }
};
/* Babylon / DOM fields reached through a soldier-named receiver that is really a mesh or a node. */
const NOT_STATE = new Set([
  'poseRoot',
  'weaponSocket',
  'rig',
  'material',
  'isPickable',
  'parent',
  'alpha',
  'diffuseColor',
  'emissiveColor',
  'specularColor',
  'textContent',
  'alwaysSelectAsActiveMesh',
  'renderingGroupId',
  'doNotSyncBoundingInfo',
  'isVisible',
  'visibility',
  'animationBinding',
  'style'
]);
const KINDS = ['squad', 'soldier', 'eng', 'mind'];
const OPS = new Set([
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

function files(root) {
  const dir = path.join(root, 'battle');
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.js'))
    .concat(
      fs
        .readdirSync(path.join(dir, 'modules'))
        .filter(f => f.endsWith('.js'))
        .map(f => 'modules/' + f)
    )
    .filter(f => !EXCLUDED.has(f))
    .sort();
}

function tokens(source) {
  const out = [];
  const re =
    /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*"|`(?:\\[\s\S]|[^`\\])*`|(?:[A-Za-z_$][\w$]*)|(?:\d+(?:\.\d*)?)|(?:>>>=|\*\*=|<<=|>>=|===|!==|&&=|\|\|=|\?\?=|=>|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|&&|\|\||\?\?|\?\.|\.\.\.)|./gy;
  let m,
    line = 1;
  while ((m = re.exec(source))) {
    const raw = m[0],
      at = line;
    line += (raw.match(/\n/g) || []).length;
    if (/^\s|^\/\/|^\/\*/.test(raw)) continue;
    if (raw === '/' && (!out.length || /^(?:[=(:,!&|?;{]|return|case|=>)$/.test(out[out.length - 1].v))) {
      let end = re.lastIndex,
        inClass = false;
      for (; end < source.length; end++) {
        if (source[end] === '\\') {
          end++;
          continue;
        }
        if (source[end] === '[') inClass = true;
        if (source[end] === ']') inClass = false;
        if (source[end] === '/' && !inClass) break;
      }
      if (end < source.length) {
        while (/[a-z]/i.test(source[end + 1] || '')) end++;
        re.lastIndex = end + 1;
        out.push({ v: '<regexp>', line: at });
        continue;
      }
    }
    out.push({ v: /^['"`]/.test(raw) ? raw.slice(1, -1) : raw, quoted: /^['"`]/.test(raw), line: at });
  }
  return out;
}

function vocabulary(file) {
  const names = new Map();
  SQUAD_NAMES.forEach(n => names.set(n, 'squad'));
  SOLDIER_NAMES.forEach(n => names.set(n, 'soldier'));
  COLLECTIONS.forEach(n => names.set(n, 'collection'));
  for (const [name, kind] of Object.entries(RECEIVERS[file] || {})) {
    if (kind === null) names.delete(name);
    else names.set(name, kind);
  }
  return names;
}

/* What a chain of names after the receiver writes: {kind, field} or null. */
function target(kind, parts) {
  if (kind === 'collection') {
    if (parts[0] !== '[]') return null;
    parts = parts.slice(1);
    kind = 'soldier';
  }
  if (!parts.length || parts[0] === '[]') return null;
  if (kind === 'soldier') {
    if (
      parts.length > 1 &&
      parts[1] !== '[]' &&
      (parts[0] === 'eng' || parts[0] === 'mind' || parts[0] === 'squad')
    )
      return { kind: parts[0], field: parts[1] };
    if (parts[0] === 'root')
      return ['position', 'rotation'].includes(parts[1]) ? { kind, field: 'root.' + parts[1] } : null;
    if (NOT_STATE.has(parts[0])) return null;
  }
  return { kind, field: parts[0] };
}

function scan(source, file) {
  const t = tokens(source),
    result = [],
    vocab = vocabulary(file);
  const v = i => t[i] && t[i].v;
  const ident = i => t[i] && !t[i].quoted && /^[A-Za-z_$][\w$]*$/.test(v(i));
  const punct = (i, s) => t[i] && !t[i].quoted && v(i) === s;
  const pair = new Map(),
    open = [];
  t.forEach((tok, i) => {
    if (tok.quoted) return;
    if (tok.v === '[') open.push(i);
    else if (tok.v === ']' && open.length) pair.set(open.pop(), i);
  });
  for (let i = 0; i < t.length - 1; i++) {
    if (!ident(i) || !vocab.has(v(i))) continue;
    if (punct(i - 1, '.') || punct(i - 1, '?.')) continue;
    const parts = [];
    let j = i + 1;
    for (;;) {
      const open = punct(j, '?.') && punct(j + 1, '[') ? j + 1 : j;
      if ((punct(j, '.') || punct(j, '?.')) && ident(j + 1)) {
        parts.push(v(j + 1));
        j += 2;
      } else if (punct(open, '[') && pair.has(open)) {
        const close = pair.get(open);
        parts.push(close === open + 2 && t[open + 1].quoted ? v(open + 1) : '[]');
        j = close + 1;
      } else break;
    }
    /* `++` before the receiver is a prefix increment unless it is the postfix of the operand before
       it. JavaScript forbids a line break between an operand and its postfix `++`, so only a
       same-line operand makes it one: `a++` newline `s.b` is a postfix then a read, and `y` newline
       `++s.n` is a prefix. Tokens keep their line to tell them apart. */
    const prefix =
      (punct(i - 1, '++') || punct(i - 1, '--')) &&
      !(
        t[i - 2] &&
        t[i - 2].line === t[i - 1].line &&
        (ident(i - 2) || punct(i - 2, ')') || punct(i - 2, ']'))
      );
    const written =
      (t[j] && !t[j].quoted && OPS.has(v(j))) ||
      prefix ||
      (t[i - 1] && !t[i - 1].quoted && v(i - 1) === 'delete');
    if (!written) continue;
    const hit = target(vocab.get(v(i)), parts);
    if (hit) result.push({ kind: hit.kind, field: hit.field, file, line: t[i].line, receiver: v(i) });
  }
  return result;
}

/* {kind: {field: {file: [{line, receiver}]}}} */
function sites(root) {
  const map = Object.fromEntries(KINDS.map(k => [k, {}]));
  for (const file of files(root)) {
    for (const w of scan(fs.readFileSync(path.join(root, 'battle', file), 'utf8'), file)) {
      const byFile = (map[w.kind][w.field] ||= {});
      (byFile[file] ||= []).push({ line: w.line, receiver: w.receiver });
    }
  }
  return map;
}

/* {kind: {field: [writer files]}}, fields and files sorted. */
function collect(root) {
  const map = sites(root);
  return Object.fromEntries(
    Object.entries(map).map(([kind, fields]) => [
      kind,
      Object.fromEntries(
        Object.entries(fields)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([field, byFile]) => [field, Object.keys(byFile).sort()])
      )
    ])
  );
}

module.exports = {
  EXCLUDED,
  EXCLUDED_WRITES,
  KINDS,
  RECEIVERS,
  files,
  tokens,
  vocabulary,
  target,
  scan,
  sites,
  collect
};

if (require.main === module) {
  const args = process.argv.slice(2),
    root = process.env.GRASSTEX_SOURCE_ROOT || path.resolve(__dirname, '../..');
  const filter = args.find(a => !a.startsWith('--')),
    multiOnly = args.includes('--multi'),
    showSites = args.includes('--sites');
  const map = sites(root);
  let fields = 0,
    multi = 0;
  for (const kind of KINDS) {
    for (const field of Object.keys(map[kind]).sort()) {
      const byFile = map[kind][field],
        key = kind + '.' + field,
        writers = Object.keys(byFile);
      fields++;
      if (writers.length > 1) multi++;
      if ((filter && !key.includes(filter)) || (multiOnly && writers.length < 2)) continue;
      console.log(
        key.padEnd(40) + writers.map(f => f.replace('modules/', '') + ':' + byFile[f].length).join('  ')
      );
      if (showSites)
        for (const f of writers)
          for (const w of byFile[f]) console.log('    ' + f + ':' + w.line + '  ' + w.receiver);
    }
  }
  console.log('\n' + fields + ' fields, ' + multi + ' with more than one writer file');
}
