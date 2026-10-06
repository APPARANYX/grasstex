#!/usr/bin/env node
'use strict';
/* Read-map ratchet for soldier stress (AGENTS.md: soldier condition; one owner per responsibility).
   mind-read-map.js scans the source for every read of `BattleSoldierMind`, `soldier.mind` and `squad.mind`;
   this check holds the answer against `BattleSoldierMind.READERS`, the table module 17 declares its readers
   in (layer, file, reader, what stress becomes there):

   - a file that reads stress and is not in the table fails, and so does a member it reads that the table
     does not list for that file, or reads more often than the table says: a new reader is an edit to the
     table that a reviewer sees, never a side effect;
   - a listed read that the source no longer makes fails until the row is fixed, so the table cannot keep
     a reader that is gone;
   - every lever module 17 declares has a row that reads it; every `BattleSoldierMind` function a row names
     exists; every row says what stress becomes there;
   - tooling (scripts) is held to the file, not to the count: probes read what they measure.

   The scanner is tested here on fixtures (what it must find, what it must ignore) and against the real
   reads it was written from. GRASSTEX_SOURCE_ROOT points the check at another checkout (a negative
   control: a tree with an unlisted reader must fail). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = require('./mind-read-map.js');

const REPO = process.env.GRASSTEX_SOURCE_ROOT || path.resolve(__dirname, '../..');
const KINDS = new Set(['lever', 'status', 'telemetry', 'display', 'export', 'tooling']);
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log('PASS ' + name);
}

/* Module 17 loaded from the tree under test, on stubs: all it needs of the world is to register itself. */
function loadMind(repo) {
  const root = {
    SquadAI: { extend() {} },
    BattleModules: { registerSystem() {}, unitsFor: () => [] },
    BattleSoldierEvents: { subscribe() {} }
  };
  root.window = root;
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(repo, 'battle/core-runtime.js'), 'utf8'))(root, root, { log() {}, warn() {} });
  const source = fs.readFileSync(path.join(repo, 'battle/modules/17-soldier-mind.js'), 'utf8');
  new Function('window', 'globalThis', 'console', source)(root, root, { log() {}, warn() {} });
  assert.ok(root.BattleSoldierMind, 'module 17 loads from ' + repo);
  return root.BattleSoldierMind;
}

/* Problems between the declared table and what the scan found: [] when they agree. `found` is
   {runtime: {file: {members: {name: [lines]}, bare: [lines]}}, tooling: {...}}, as R.sites gives it. */
function problems(M, found, exists) {
  const out = [];
  const declared = {};
  const tooling = [];
  for (const row of M.READERS) {
    if (row.kind === 'tooling') {
      tooling.push(row.file);
      continue;
    }
    const at = (declared[row.file] ||= { members: {}, rows: 0 });
    at.rows++;
    for (const [member, n] of Object.entries(row.reads || {}))
      at.members[member] = (at.members[member] || 0) + n;
  }
  for (const [file, rec] of Object.entries(found.runtime)) {
    const d = declared[file];
    if (!d) {
      out.push(
        'unlisted reader file: ' +
          file +
          ' reads ' +
          Object.keys(rec.members)
            .concat(rec.bare.length ? ['BattleSoldierMind'] : [])
            .join(', ')
      );
      continue;
    }
    for (const [member, lines] of Object.entries(rec.members))
      if (d.members[member] == null)
        out.push('unlisted read: ' + file + ' reads ' + member + ' (line ' + lines[0] + ')');
      else if (d.members[member] !== lines.length)
        out.push(
          'read count: ' +
            file +
            ' reads ' +
            member +
            ' ' +
            lines.length +
            ' times, the table says ' +
            d.members[member]
        );
  }
  for (const [file, d] of Object.entries(declared)) {
    if (!exists(file)) out.push('row for a file that does not exist: ' + file);
    const rec = found.runtime[file];
    for (const member of Object.keys(d.members))
      if (!rec || !rec.members[member]) out.push('stale row: ' + file + ' no longer reads ' + member);
  }
  /* A tooling row names a file, or a directory's files with one `*` (`scripts/probes/*.js`). */
  const match = (file, pattern) =>
    new RegExp(
      '^' +
        pattern
          .split('*')
          .map(x => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
          .join('[^/]*') +
        '$'
    ).test(file);
  for (const file of Object.keys(found.tooling))
    if (!tooling.some(p => match(file, p))) out.push('unlisted tooling reader: ' + file);
  for (const pattern of tooling)
    if (!Object.keys(found.tooling).some(f => match(f, pattern)))
      out.push('stale tooling row: ' + pattern + ' reads nothing');
  return out;
}

/* ---------------------------------------------------------------------------------------------- */
/* The scanner: what it must find. */

const members = (src, file) => R.scan(src, file || 'x.js').map(h => h.member);

test('finds a function of the module by its global, an alias and an optional chain', () => {
  assert.deepEqual(members('var a = root.BattleSoldierMind.reactScale(s);'), ['reactScale']);
  assert.deepEqual(members('if (root.BattleSoldierMind) x = BattleSoldierMind.aimSigma(s);'), [
    null,
    'aimSigma'
  ]);
  assert.deepEqual(members('root.BattleSoldierMind?.telemetry?.(sim);'), ['telemetry']);
  assert.deepEqual(members("root.BattleSoldierMind['snapshot'](s);"), ['snapshot']);
  assert.deepEqual(members('var M = mind(); M.hesitation(s);', 'engagement.js'), ['hesitation']);
  assert.deepEqual(
    members('var M = mind(); M.hesitation(s);', 'other.js'),
    [],
    'M is an alias only in a file that binds it'
  );
  assert.deepEqual(members('Mind.shockUntil(s) > t;', 'modules/40-world-debug-overlay.js'), ['shockUntil']);
  assert.deepEqual(members('x.M.hesitation(s);', 'engagement.js'), [], 'a property named M is not the alias');
});

test('finds a read of soldier.mind and squad.mind, by field, in every spelling', () => {
  assert.deepEqual(members('x = sq.mind.mean;'), ['mind.mean']);
  assert.deepEqual(members('x = sq?.mind?.mean;'), ['mind.mean']);
  assert.deepEqual(members("x = s['mind'].stress;"), ['mind.stress']);
  assert.deepEqual(members("x = s?.['mind']?.['band'];"), ['mind.band']);
  assert.deepEqual(members('x = (sq.mind && sq.mind.mean) || 0;'), ['mind', 'mind.mean']);
  assert.deepEqual(members('if (!o.mind) continue; y = o.mind.stress + o.mind.band;'), [
    'mind',
    'mind.stress',
    'mind.band'
  ]);
  assert.deepEqual(members('f(units[i].mind);'), ['mind']);
  assert.deepEqual(members('return s.mind ? s.mind.band : 0;'), ['mind', 'mind.band']);
  assert.deepEqual(members('safe(sq.mind, 3);'), ['mind']);
  assert.deepEqual(members('x = sim._mindSummary; y = sim._mindSeries.t;'), ['_mindSummary', '_mindSeries']);
});

test('a read through a longer chain counts once, at the first field after mind', () => {
  assert.deepEqual(members('x = s.squad.mind.mean;'), ['mind.mean']);
  assert.deepEqual(members('x = a.b.c.mind.decided.react.changed;'), ['mind.decided']);
});

/* ---------------------------------------------------------------------------------------------- */
/* The scanner: what it must ignore. */

test('ignores writes, deletes and increments of mind and its fields', () => {
  const writes = [
    's.mind = null;',
    'units[i].mind = {};',
    'sq.mind = { n: 0 };',
    's.mind.stress = 0.4;',
    's.mind.stress += 0.1;',
    's.mind.hesitations++;',
    '++s.mind.hesitations;',
    'delete s.mind;',
    'delete s.mind.stress;',
    "s['mind'] = 1;",
    "delete s['mind'];",
    's.mind ||= fresh(s);',
    'sim._mindSummary = null;',
    'sim._mindSummaryAt = 4;'
  ];
  for (const src of writes) assert.deepEqual(members(src), [], src);
  assert.deepEqual(
    members('s.mind || (s.mind = fresh(s));'),
    ['mind'],
    'the test in front of a write is a read'
  );
  assert.deepEqual(members('if (s.mind == null) x = 1; if (s.mind === y) z = 2;'), ['mind', 'mind']);
  assert.deepEqual(members('x = s.mind.mean >= 0.3 && s.mind.mean <= 1;'), ['mind.mean', 'mind.mean']);
});

test('ignores comments, strings, regular expressions and object-literal keys', () => {
  const quiet = [
    '// sq.mind.mean and BattleSoldierMind.reactScale in a comment',
    '/* root.BattleSoldierMind.aimSigma(s) */',
    "var a = 'BattleSoldierMind.reactScale(s) and s.mind';",
    'var b = "s.mind.stress";',
    'var c = /s\\.mind\\.stress/.test(x);',
    'var d = { mind: root.other, band: 1 };',
    'var e = { mind };',
    'var mind = compute(); use(mind);',
    'function mind() { return 1; } mind();',
    'x.minded.stress; x.remind.band; x.mindset;'
  ];
  for (const src of quiet) assert.deepEqual(members(src), [], src);
});

/* ---------------------------------------------------------------------------------------------- */
/* The table against the tree. */

const M = loadMind(REPO);
const found = R.sites(REPO);
const exists = file => fs.existsSync(path.join(REPO, 'battle', file));

test('every row is complete, has a known kind and names what stress becomes there', () => {
  assert.ok(Array.isArray(M.READERS) && M.READERS.length >= 10, 'the table is declared and exported');
  const seen = new Set();
  for (const row of M.READERS) {
    const id = row.file + ' / ' + row.reader;
    assert.ok(KINDS.has(row.kind), 'kind of ' + id + ': ' + row.kind);
    for (const key of ['layer', 'file', 'reader', 'unit', 'flag'])
      assert.ok(row[key] && typeof row[key] === 'string', key + ' of ' + id);
    assert.ok(row.lever === null || M.LEVERS.includes(row.lever), 'lever of ' + id + ': ' + row.lever);
    if (row.kind === 'tooling') assert.equal(row.reads, null, 'tooling is held to the file: ' + id);
    else {
      assert.ok(row.reads && Object.keys(row.reads).length, 'a row reads something: ' + id);
      for (const [member, n] of Object.entries(row.reads)) {
        assert.ok(Number.isInteger(n) && n > 0, 'read count of ' + member + ' in ' + id);
        if (!/^mind(\.|$)/.test(member) && !R.SIM_FIELDS.has(member))
          assert.equal(typeof M[member], 'function', member + ' is a function of BattleSoldierMind: ' + id);
      }
    }
    if (row.kind === 'lever' || row.kind === 'telemetry')
      assert.ok(row.lever, 'a ' + row.kind + ' row names its lever: ' + id);
    assert.ok(!seen.has(id), 'no row twice: ' + id);
    seen.add(id);
  }
});

test('every lever has a row that reads it and a row that counts what it did', () => {
  for (const lever of M.LEVERS) {
    const rows = M.READERS.filter(r => r.lever === lever);
    assert.ok(
      rows.some(r => r.kind === 'lever'),
      lever + ' has a reader'
    );
    assert.ok(
      rows.some(r => r.kind === 'telemetry' || r.kind === 'tooling'),
      lever +
        " has a row that counts its decisions (a man's lever in the record, the Squad Leader's morale in its probe)"
    );
    if (M.DECIDED.includes(lever))
      assert.ok(
        rows.some(r => r.kind === 'telemetry'),
        lever + " is a man's decision and is counted in the benchmark record"
      );
  }
});

test('the source reads stress exactly where the table says, file by file and member by member', () => {
  assert.deepEqual(problems(M, found, exists), []);
});

test('the runtime readers are the declared decision, command-observer, display and export layers only', () => {
  assert.deepEqual(Object.keys(found.runtime).sort(), [
    'engagement.js',
    'modules/14-z-ballistic-raycast.js',
    'modules/15e-squad-leader-morale-coa.js',
    'modules/15j-squad-leader-fire-and-movement.js',
    'modules/18-command-reception.js',
    'modules/19a-engagement-stress-reactions.js',
    'modules/19b-engagement-fire-stance.js',
    'modules/40-world-debug-overlay.js',
    'modules/99-session-diagnostics-export.js'
  ]);
  const decides = M.READERS.filter(r => r.kind === 'lever' || r.kind === 'status').map(r => r.layer);
  assert.deepEqual([...new Set(decides)].sort(), [
    'Command Reception (observe-only Phase 0A)',
    'Meso (Squad Leader)',
    'Micro (Engagement)',
    'Micro (shot model)'
  ]);
  for (const file of ['engagement.js', 'modules/14-z-ballistic-raycast.js'])
    assert.ok(
      !('mind' in found.runtime[file].members),
      file + ' never reads the roll-up: it reads functions of the module'
    );
});

/* ---------------------------------------------------------------------------------------------- */
/* The ratchet has teeth: a tree with a reader the table does not know must fail, and one that lost
   a listed reader must fail. Each mutant is the real scan of a real file with one line added or cut. */

function mutated(file, edit) {
  const copy = JSON.parse(JSON.stringify(found));
  const name = file;
  const real = fs.readFileSync(path.join(REPO, 'battle', name), 'utf8');
  const hits = R.scan(edit(real), name);
  const rec = { members: {}, bare: [] };
  for (const h of hits) (h.member == null ? rec.bare : (rec.members[h.member] ||= [])).push(h.line);
  copy.runtime[name] = rec;
  return copy;
}
function mutatedNew(file, source) {
  const copy = JSON.parse(JSON.stringify(found));
  const rec = { members: {}, bare: [] };
  for (const h of R.scan(source, file))
    (h.member == null ? rec.bare : (rec.members[h.member] ||= [])).push(h.line);
  if (Object.keys(rec.members).length || rec.bare.length) copy.runtime[file] = rec;
  return copy;
}
const fails = (copy, re, why) => {
  const p = problems(M, copy, () => true);
  assert.ok(
    p.some(x => re.test(x)),
    why + ': ' + JSON.stringify(p)
  );
};

test('a new file that reads stress fails until the table lists it', () => {
  fails(
    mutatedNew('modules/60-new-reader.js', 'var s1 = root.BattleSoldierMind.stress(s);'),
    /unlisted reader file: modules\/60-new-reader/,
    'a new module'
  );
  fails(
    mutatedNew('commander-ai.js', 'var x = sq.mind.mean;'),
    /unlisted reader file: commander-ai\.js/,
    'the General'
  );
  fails(
    mutatedNew('movement-resolver.js', "var x = s['mind'].band;"),
    /unlisted reader file: movement-resolver\.js/,
    'the resolver, by bracket'
  );
  fails(
    mutatedNew('squad-ai.js', 'var x = BattleSoldierMind;'),
    /unlisted reader file: squad-ai\.js/,
    'a bare reference'
  );
});

test('a listed file that starts reading something else fails', () => {
  fails(
    mutated('modules/15j-squad-leader-fire-and-movement.js', src => src + '\nvar x = sq.mind.max;'),
    /unlisted read: modules\/15j-squad-leader-fire-and-movement\.js reads mind\.max/,
    'the Squad Leader reads the max'
  );
  fails(
    mutated('modules/15e-squad-leader-morale-coa.js', src => src + '\nvar x = sq.mind.mean;'),
    /read count: modules\/15e-squad-leader-morale-coa\.js reads mind\.mean 2 times/,
    'a second read of the mean'
  );
  fails(
    mutated('engagement.js', src => src + '\nvar y = M.snapshot(s);'),
    /unlisted read: engagement\.js reads snapshot/,
    'Engagement through its alias'
  );
  fails(
    mutated('modules/14-z-ballistic-raycast.js', src => src + '\nvar y = root.BattleSoldierMind.band(s);'),
    /unlisted read: modules\/14-z-ballistic-raycast\.js reads band/,
    'the shot model reads the band'
  );
});

test('a listed read that is gone fails', () => {
  fails(
    mutated('modules/15e-squad-leader-morale-coa.js', src => src.replace(/sq\.mind\.mean/g, 'sq.other.mean')),
    /stale row: modules\/15e-squad-leader-morale-coa\.js no longer reads mind\.mean/,
    'the roll-up is no longer read'
  );
  fails(
    mutated('modules/19b-engagement-fire-stance.js', src => src.replace(/M\.hesitation\(s\)/g, '0')),
    /stale row: modules\/19b-engagement-fire-stance\.js no longer reads hesitation/,
    'the hesitation lever is gone from the fire/stance module'
  );
});

test('an unlisted script that reads stress fails, and a tooling row that reads nothing fails', () => {
  const copy = JSON.parse(JSON.stringify(found));
  copy.tooling['scripts/new_probe.cjs'] = { members: { mind: [3] }, bare: [] };
  assert.ok(
    problems(M, copy, () => true).some(x => /unlisted tooling reader: scripts\/new_probe\.cjs/.test(x))
  );
  const none = JSON.parse(JSON.stringify(found));
  for (const file of Object.keys(none.tooling))
    if (file.startsWith('scripts/probes/')) delete none.tooling[file];
  assert.ok(problems(M, none, () => true).some(x => /stale tooling row: scripts\/probes\/\*\.js/.test(x)));
});

test('a table with a row for a file that does not exist fails', () => {
  const p = problems(M, found, file => file !== 'modules/99-session-diagnostics-export.js');
  assert.ok(
    p.some(x => /row for a file that does not exist: modules\/99-session-diagnostics-export\.js/.test(x)),
    JSON.stringify(p)
  );
});

console.log('\n' + count + ' checks passed');
