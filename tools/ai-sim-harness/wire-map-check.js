#!/usr/bin/env node
'use strict';
/* Writer-file ratchet for squad, soldier, Engagement-record and mind fields (AGENTS.md, one owner
   per responsibility). wire-map.js scans battle/ for every write; this check holds the result
   against fixtures/wire-map-baseline.json, which lists each field that more than one file writes
   and says why:

   - a field that gains a writer file, or a new field that starts with two, fails until the baseline
     is edited with a role and a reason, so growth is a reviewed decision;
   - a listed writer that stopped writing, or a field that is down to one writer, fails until the
     entry is removed, so a fix locks in and the baseline only shrinks;
   - every entry carries a role (owner, layer, setup, fallback, slot, body, debt); debt names the
     phase that removes it or says unscheduled;
   - an excluded file (UI, rendering, audio) may write only what EXCLUDED_WRITES declares, so an
     exclusion cannot hide a new sim write.

   The scanner is tested here on fixtures (what it must find, what it must ignore) and against
   real writes it once missed. Its recall against a TypeScript AST scan (scripts/probe_wire_map_recall.cjs,
   which needs the global typescript package and so is not run in CI) was 618 writes, 344 file/field
   cells, 0 differing, when this was written. GRASSTEX_SOURCE_ROOT points the check at another
   checkout (a negative control: main before a fix must fail). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const W = require('./wire-map.js');

const REPO = process.env.GRASSTEX_SOURCE_ROOT || path.resolve(__dirname, '../..');
const ROLES = new Set(['owner', 'layer', 'setup', 'fallback', 'slot', 'body', 'debt']);
const FIX = /^(unscheduled|phase (2[a-d]|3[a-c]|4|5))$/;
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log('PASS ' + name);
}

const keys = hits => hits.map(h => h.kind + '.' + h.field).sort();
function scanKeys(source, file) {
  return keys(W.scan(source, file || 'engagement.js'));
}

/* ---------------------------------------------------------------------------------------------- */
/* The scanner: what it must find. */

test('finds every write form on a soldier, squad, eng and mind receiver', () => {
  const cases = [
    ['s.prone = true;', ['soldier.prone']],
    ["soldier['prone'] = true;", ['soldier.prone']],
    [
      's.hp -= 3; s.count *= 2; s.flag ||= 1; s.flag &&= 2; s.flag ??= 3;',
      ['soldier.count', 'soldier.flag', 'soldier.flag', 'soldier.flag', 'soldier.hp']
    ],
    [
      's.shots++; s.shots--; ++s.shots; --s.shots;',
      ['soldier.shots', 'soldier.shots', 'soldier.shots', 'soldier.shots']
    ],
    ['delete s._tacticalRoute;', ['soldier._tacticalRoute']],
    ["delete sq?.rally; delete s?.['prone']; delete s?.[key];", ['soldier.prone', 'squad.rally']],
    ['y = z\n++s.count;', ['soldier.count']],
    ['++\ns.count;', ['soldier.count']],
    ['a++\ns.count;', []],
    ['a\n--s.count;', ['soldier.count']],
    ['a = b++ + c; d = --s.count;', ['soldier.count']],
    ['sq.rally = sq.orderAnchor = p;', ['squad.orderAnchor', 'squad.rally']],
    ["if (x) soldier.destination = p; else squad.state = 'a';", ['soldier.destination', 'squad.state']],
    ['for (;;) { s.target = null }', ['soldier.target']],
    ['s.prone /* why */ = true; sq.rally // note\n = p;', ['soldier.prone', 'squad.rally']],
    [
      's.mask <<= 1; s.mask >>= 1; s.mask >>>= 1; s.mask |= 1; s.mask &= 1; s.mask ^= 1; s.mask **= 2; s.mask %= 2; s.mask /= 2;',
      Array(9).fill('soldier.mask')
    ]
  ];
  for (const [src, want] of cases) assert.deepEqual(scanKeys(src, 'x.js'), want, src);
});

test('a chain counts against the first field that is not a record of its own', () => {
  const cases = [
    ['s.weapon.ammo = 1; s.weapon.jammed = false;', ['soldier.weapon', 'soldier.weapon']],
    ['s.destination.x = 4;', ['soldier.destination']],
    ['s.eng.cover = null;', ['eng.cover']],
    ["s.eng['cover'] = null;", ['eng.cover']],
    ['s.mind.stress = 0.4;', ['mind.stress']],
    ['s.eng = null;', ['soldier.eng']],
    [
      's.eng[key] = 1; s.mind[key] = 1; soldier.squad[key] = 1; sq[key] = 1;',
      ['soldier.eng', 'soldier.mind', 'soldier.squad']
    ],
    ['s.mind = {};', ['soldier.mind']],
    ['soldier.squad.captainAlive = false;', ['squad.captainAlive']],
    ['s.root.position.x = 1; s.root.rotation.y = 2;', ['soldier.root.position', 'soldier.root.rotation']],
    ['s.squad.mind.stress = 1;', ['squad.mind']],
    ["sq._macroMission.status = 'x';", ['squad._macroMission']],
    ['sq._fireteamOrders[key] = {};', ['squad._fireteamOrders']],
    ['sq.mind.stress = 1; sq.eng.x = 1; sq.squad.y = 1;', ['squad.eng', 'squad.mind', 'squad.squad']]
  ];
  for (const [src, want] of cases) assert.deepEqual(scanKeys(src, 'x.js'), want, src);
});

test('indexed receivers and per-file aliases resolve to the right record', () => {
  assert.deepEqual(scanKeys('members[i].destination = p; units[k].eng.cover = null;', 'x.js'), [
    'eng.cover',
    'soldier.destination'
  ]);
  assert.deepEqual(
    scanKeys('members.length = 0; members.cache.x = 1; units.list.n++; men.total += 1;', 'x.js'),
    [],
    'a collection is not a soldier until it is indexed'
  );
  assert.deepEqual(scanKeys('units[i].squad.mind = null;', 'x.js'), ['squad.mind']);
  assert.deepEqual(
    scanKeys('a[i]._combatUrgentUntil = 0; a[i].eng._urgentCover = false;', 'modules/44-combat-urgency.js'),
    ['eng._urgentCover', 'soldier._combatUrgentUntil']
  );
  assert.deepEqual(scanKeys("e.state = 'bound';", 'engagement.js'), ['eng.state']);
  assert.deepEqual(scanKeys('e.suppressedUntil = 1;', 'squad-ai.js'), ['soldier.suppressedUntil']);
  assert.deepEqual(
    scanKeys("e.state = 'bound';", 'commander-ai.js'),
    [],
    'e means nothing in a file with no entry for it'
  );
  assert.deepEqual(scanKeys('m.stress = 1;', 'modules/17-soldier-mind.js'), ['mind.stress']);
  assert.deepEqual(scanKeys('survivor.rally = p;', 'commander-ai.js'), ['squad.rally']);
  assert.deepEqual(scanKeys('q.contact = null; next.slotIndex = 0;', 'modules/16-squad-plan-stability.js'), [
    'soldier.slotIndex',
    'squad.contact'
  ]);
  assert.deepEqual(scanKeys("s.role = 'main';", 'modules/00-battle-sides.js'), [], 's is a side there');
  assert.deepEqual(
    scanKeys('s._planPost = p;', 'modules/00-defense-plan.js'),
    ['soldier._planPost'],
    's is a soldier in claimPost / holdPost'
  );
});

/* ---------------------------------------------------------------------------------------------- */
/* The scanner: what it must ignore. */

test('ignores comments, strings, regular expressions and template text', () => {
  const src = [
    '// s.prone = true;',
    '/* sq.rally = 1; */',
    'var a = \'s.prone = true\'; var b = "sq.rally = 1";',
    'var c = /s.prone = 1/g; var d = x / s.prone / y;',
    'var t = `s.prone = ${1}`;',
    'var u = a ? /sq.rally = 2/.test(z) : 0;'
  ].join('\n');
  assert.deepEqual(scanKeys(src, 'x.js'), []);
});

test('ignores reads, comparisons, declarations, calls and property-of-property receivers', () => {
  const src = [
    'if (s.prone == true || s.prone === false || s.hp >= 1 || s.hp <= 2 || s.hp != 3 || s.hp !== 4) go();',
    'var x = s.prone; var s = 1; let sq = null; const soldier = other;',
    'var f = s => s.target; var g = (s) => s.hp;',
    's.root.position.set(1, 2, 3); s.list.push(4); s.eng.cover.slice();',
    'foo.s.prone = true; bar().s.hp = 1; a.b.sq.rally = 1;',
    'player.prone = true; player.hp = 1; cam.target.x = 2; box.style.x = 1;',
    "s.poseRoot.position.x = 1; s.material.alpha = 1; s.rig.hips = 1; s.textContent = 'x';",
    's.root.scaling.x = 1;',
    "s['pro' + 'ne'] = true; s[k] = 1; s[k]['x'] = 1; s[a.b] = 2;",
    'var { prone } = s; [s.a, s.b] = [1, 2];'
  ].join('\n');
  assert.deepEqual(scanKeys(src, 'x.js'), []);
});

test('a name is only a receiver where it is not a member of something else', () => {
  assert.deepEqual(scanKeys('state.s.prone = 1; x.sq.rally = 2; y?.soldier.hp = 3;', 'x.js'), []);
});

test('sites, collect and files report every writer file with its lines and receivers', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wire-map-'));
  try {
    fs.mkdirSync(path.join(dir, 'battle', 'modules'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'battle', 'a.js'), 'sq.rally = 1;\nsq.rally = 2; s.prone = true;\n');
    fs.writeFileSync(
      path.join(dir, 'battle', 'modules', 'b.js'),
      'function f(squad) {\n  squad.rally = 3;\n}\n'
    );
    fs.writeFileSync(path.join(dir, 'battle', 'modules', '98-damage-range.js'), 'sq.rally = 4;');
    fs.writeFileSync(path.join(dir, 'battle', 'notes.txt'), 'sq.rally = 5;');
    assert.deepEqual(W.files(dir), ['a.js', 'modules/b.js'], 'js files only, excluded files left out');
    assert.deepEqual(W.collect(dir).squad.rally, ['a.js', 'modules/b.js']);
    assert.deepEqual(Object.keys(W.collect(dir).soldier), ['prone']);
    assert.deepEqual(W.sites(dir).squad.rally['a.js'], [
      { line: 1, receiver: 'sq' },
      { line: 2, receiver: 'sq' }
    ]);
    assert.deepEqual(W.sites(dir).squad.rally['modules/b.js'], [{ line: 2, receiver: 'squad' }]);
    assert.deepEqual(Object.keys(W.sites(dir)), ['squad', 'soldier', 'eng', 'mind']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* ---------------------------------------------------------------------------------------------- */
/* Writes the scanner missed once. Each is a real site: if the source moves, update the anchor. */

const tree = W.collect(REPO);
const writers = (kind, field) => (tree[kind][field] || []).slice();

test('real recall anchors: chained, hopped, deleted and indexed writes are seen', () => {
  const at = (kind, field, file) =>
    assert.ok(writers(kind, field).includes(file), kind + '.' + field + ' must list ' + file);
  at('eng', 'cover', 'modules/20-building-hardpoints.js');
  at('eng', 'fireReadyAt', 'engagement.js');
  at('soldier', '_movementResolver', 'modules/20-building-hardpoints.js');
  at('squad', 'captainAlive', 'modules/16-squad-plan-stability.js');
  at('squad', 'aliveCount', 'squad-ai.js');
  at('soldier', '_personalSpaceDestination', 'movement-resolver.js');
  at('soldier', '_physicalPath', 'modules/39-navigation-physicality-debug.js');
  at('soldier', '_tacticalRoute', 'movement-resolver.js');
  at('soldier', '_planPost', 'modules/00-defense-plan.js');
  at('soldier', 'slotIndex', 'modules/16-squad-plan-stability.js');
  at('soldier', 'suppressedUntil', 'squad-ai.js');
  at('soldier', 'root.position', 'modules/51-soldier-personal-space.js');
  at('soldier', 'destination', 'movement-resolver.js');
  at('mind', 'stress', 'modules/17-soldier-mind.js');
  at('soldier', 'weapon', 'modules/46-ammunition-stoppages.js');
});

test('agrees with state-ownership-check.js on the protected fields', () => {
  /* Two independent scanners: the strict one proves single owners with alias tracking; this one
     must see the same writers. */
  for (const field of ['state', 'since', 'until'])
    assert.deepEqual(writers('eng', field), ['engagement.js'], 'eng.' + field);
  assert.deepEqual(writers('squad', '_macroMission'), ['commander-ai.js']);
  const phase = writers('squad', 'commandPhase');
  assert.ok(phase.includes('modules/16-squad-plan-stability.js'));
  assert.deepEqual(
    phase.filter(f => f !== 'modules/16-squad-plan-stability.js').sort(),
    ['commander-routes.js', 'modules/21-defender-engineers.js'],
    'only the two guarded setup fallbacks besides the Squad Leader'
  );
});

/* ---------------------------------------------------------------------------------------------- */
/* The baseline. */

const baseline = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'wire-map-baseline.json'), 'utf8')
);
const reasons = baseline.reasons || {};

test('every baseline entry is well formed', () => {
  const problems = [];
  for (const [key, field] of Object.entries(baseline.fields)) {
    const [kind, ...rest] = key.split('.');
    if (!W.KINDS.includes(kind) || !rest.length) problems.push(key + ': not a kind.field key');
    const files = Object.keys(field.writers || {});
    if (files.length < 2) problems.push(key + ': a baseline entry needs two or more writers');
    if (field.owner !== null && typeof field.owner !== 'string')
      problems.push(key + ': owner is a file or null');
    let owners = 0;
    for (const file of files) {
      const w = field.writers[file],
        as = String(w.as || '').split('+');
      if (!fs.existsSync(path.join(REPO, 'battle', file)))
        problems.push(key + ': ' + file + ' does not exist');
      if (!as.length || as.some(r => !ROLES.has(r)))
        problems.push(key + ' / ' + file + ': role "' + w.as + '" is not one of ' + [...ROLES].join(', '));
      if (as.includes('owner')) owners++;
      if (as.includes('owner') !== (file === field.owner))
        problems.push(key + ' / ' + file + ': the owner role belongs to the owner file only');
      if (!String(w.why || '').trim()) problems.push(key + ' / ' + file + ': a reason is required');
      if (as.includes('debt') && !FIX.test(w.fix || ''))
        problems.push(key + ' / ' + file + ': debt needs fix = unscheduled or a phase (2a..5)');
      if (!as.includes('debt') && w.fix) problems.push(key + ' / ' + file + ': only debt carries a fix');
    }
    if (field.owner && !files.includes(field.owner))
      problems.push(key + ': owner ' + field.owner + ' is not among the writers');
    if (owners > 1) problems.push(key + ': more than one owner');
  }
  assert.deepEqual(problems, [], '\n  ' + problems.join('\n  '));
});

test('every reason key used exists and every reason key is used', () => {
  const used = new Set(),
    text = new Set();
  for (const field of Object.values(baseline.fields))
    for (const w of Object.values(field.writers)) (reasons[w.why] ? used : text).add(w.why);
  const stray = Object.keys(reasons).filter(r => !used.has(r));
  assert.deepEqual(stray, [], 'reasons nothing refers to');
  for (const t of text)
    assert.ok(!/^[a-z]+(-[a-z]+)+$/.test(t), 'looks like a reason key that does not exist: ' + t);
});

/* ---------------------------------------------------------------------------------------------- */
/* The ratchet. */

const sites = W.sites(REPO);
const multi = {};
for (const kind of W.KINDS)
  for (const field of Object.keys(tree[kind]))
    if (tree[kind][field].length > 1) multi[kind + '.' + field] = tree[kind][field];

function siteList(key, file) {
  const [kind, ...rest] = key.split('.'),
    byFile = (sites[kind][rest.join('.')] || {})[file] || [];
  return byFile.map(s => file + ':' + s.line + ' ' + s.receiver).join(', ');
}

test('no field gains a writer file, and no new field starts with two', () => {
  const problems = [];
  for (const [key, files] of Object.entries(multi)) {
    const entry = baseline.fields[key];
    if (!entry) {
      problems.push(
        'NEW multi-writer field ' + key + ': ' + files.map(f => f + ' [' + siteList(key, f) + ']').join('; ')
      );
      continue;
    }
    for (const f of files)
      if (!entry.writers[f])
        problems.push(
          'NEW writer ' +
            f +
            ' for ' +
            key +
            ' at ' +
            siteList(key, f) +
            ' (owner: ' +
            (entry.owner || 'undecided') +
            ')'
        );
  }
  assert.deepEqual(
    problems,
    [],
    '\n  ' +
      problems.join('\n  ') +
      '\n  Route the write through the owner, or add the writer to tools/ai-sim-harness/fixtures/wire-map-baseline.json with a role and a reason.'
  );
});

test('no baseline entry outlives the writes it describes', () => {
  const problems = [];
  for (const [key, entry] of Object.entries(baseline.fields)) {
    const now =
      multi[key] ||
      (() => {
        const [kind, ...rest] = key.split('.');
        return tree[kind][rest.join('.')] || [];
      })();
    for (const f of Object.keys(entry.writers))
      if (!now.includes(f)) problems.push(key + ': ' + f + ' no longer writes it');
    if (now.length < 2) problems.push(key + ': down to ' + now.length + ' writer(s); delete the entry');
  }
  assert.deepEqual(
    problems,
    [],
    '\n  ' + problems.join('\n  ') + '\n  Good: remove these from the baseline so the ratchet keeps the gain.'
  );
});

test('an excluded file writes only what EXCLUDED_WRITES declares', () => {
  const problems = [];
  for (const file of W.EXCLUDED) {
    const p = path.join(REPO, 'battle', file);
    if (!fs.existsSync(p)) {
      problems.push(file + ': excluded but missing (renamed?)');
      continue;
    }
    const got = new Set(W.scan(fs.readFileSync(p, 'utf8'), file).map(h => h.kind + '.' + h.field)),
      declared = new Set(W.EXCLUDED_WRITES[file] || []);
    for (const k of got)
      if (!declared.has(k))
        problems.push(
          file +
            ' writes ' +
            k +
            ' but is excluded; scan it (remove it from EXCLUDED) or declare it in EXCLUDED_WRITES with a reason'
        );
    for (const k of declared)
      if (!got.has(k)) problems.push(file + ' no longer writes ' + k + '; drop it from EXCLUDED_WRITES');
  }
  for (const file of Object.keys(W.EXCLUDED_WRITES))
    if (!W.EXCLUDED.has(file)) problems.push(file + ' has EXCLUDED_WRITES but is scanned');
  assert.deepEqual(problems, [], '\n  ' + problems.join('\n  '));
});

const entries = Object.values(baseline.fields).reduce((n, f) => n + Object.keys(f.writers).length, 0);
const debt = { total: 0 };
for (const f of Object.values(baseline.fields))
  for (const w of Object.values(f.writers))
    if (w.as.split('+').includes('debt')) {
      debt.total++;
      debt[w.fix] = (debt[w.fix] || 0) + 1;
    }
console.log(
  '\nBaseline: ' +
    Object.keys(baseline.fields).length +
    ' multi-writer fields, ' +
    entries +
    ' writer entries, ' +
    debt.total +
    ' debt (' +
    Object.keys(debt)
      .filter(k => k !== 'total')
      .sort()
      .map(k => k + ' ' + debt[k])
      .join(', ') +
    ')'
);
console.log(count + ' wire-map checks passed');
