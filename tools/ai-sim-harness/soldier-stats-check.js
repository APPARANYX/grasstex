#!/usr/bin/env node
'use strict';
/* Soldier stats (module 10, `BattleSoldierStats`): six fixed traits per man and the numbers others read.

   - A man's stats are hash rolls of his faction and id: the same man is the same in every world, they do not
     depend on his role, they are bell-shaped around 0.5, the six are independent, and nothing here draws
     from the combat RNG or Math.random.
   - Every effect is declared once (EFFECTS): it names a stat that exists, a finite span, and every stat has
     at least one effect. A man of stat 0.5 is exactly 1 on every effect, a high stat moves it the way the
     table says, and no effect leaves 1 +/- span.
   - `?stats=0` is the module absent: every scale is 1 and no state is kept; `?stats=for` switches on only the
     effects of that stat; `squad` is its own lever.
   - A squad's means are over its living men, once per sim time; a squad with none reads n 0. Ranks among a
     side's squads are 0 for the lowest and 1 for the highest, ties by squad id, thin squads and lone squads
     read 0.5 (no pull).
   - The module writes only `stats` on soldiers and squads.
   Mechanism, not dice. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function load(r, file) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, file), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
function world(search) {
  H.resetIds();
  const r = H.bootstrap({ modules: false });
  r.BattleModules = { registerSystem() {}, unitsFor: b => (b._roster.us || []).concat(b._roster.ge || []) };
  load(r, 'battle/modules/10-soldier-stats.js');
  if (search != null) r.BattleSoldierStats.configure(search);
  const b = H.makeBattle(r);
  return { r, b, S: r.BattleSoldierStats };
}
const man = (faction, id, role) => ({ faction, id, role: role || 'rifleman', dead: false });
const mean = xs => xs.reduce((a, v) => a + v, 0) / xs.length;
const sd = xs => Math.sqrt(mean(xs.map(v => (v - mean(xs)) ** 2)));

test('rolls are hashes of the man: the same in every world, role-independent, six of them in [0, 1]', () => {
  const a = world(),
    b = world();
  for (const [f, id] of [
    ['us', 0],
    ['ge', 7],
    ['us', 93]
  ]) {
    const x = a.S.of(man(f, id, 'rifleman')),
      y = b.S.of(man(f, id, 'gunner'));
    assert.deepEqual(x, y, 'same faction and id, another role and world: the same man');
    assert.deepEqual(Object.keys(x), ['phy', 'mkm', 'for', 'tac', 'agi', 'tec']);
    for (const v of Object.values(x)) assert.ok(v >= 0 && v <= 1, 'a stat is in [0, 1]: ' + v);
  }
  assert.notDeepEqual(a.S.of(man('us', 1)), a.S.of(man('ge', 1)), 'the faction is part of the hash');
  assert.notDeepEqual(a.S.of(man('us', 1)), a.S.of(man('us', 2)), 'so is the id');
  const s = man('us', 5);
  assert.equal(a.S.of(s), a.S.of(s), 'cached on the man');
});

test('the rolls are bell-shaped around 0.5 and the six are independent', () => {
  const { S } = world();
  const rows = [];
  for (const f of ['us', 'ge']) for (let id = 0; id < 1500; id++) rows.push(S.of(man(f, id)));
  for (const stat of S.STATS) {
    const xs = rows.map(r => r[stat]);
    assert.ok(Math.abs(mean(xs) - 0.5) < 0.012, stat + ' mean ' + mean(xs).toFixed(4));
    assert.ok(
      Math.abs(sd(xs) - 0.1667) < 0.012,
      stat + ' sd ' + sd(xs).toFixed(4) + ' (the mean of three hashes)'
    );
    const tail = xs.filter(v => v > 0.85 || v < 0.15).length / xs.length;
    assert.ok(tail < 0.04, stat + ' tails ' + tail.toFixed(4));
  }
  for (let i = 0; i < S.STATS.length; i++)
    for (let j = i + 1; j < S.STATS.length; j++) {
      const a = rows.map(r => r[S.STATS[i]]),
        b = rows.map(r => r[S.STATS[j]]),
        ma = mean(a),
        mb = mean(b);
      const r = mean(a.map((v, k) => (v - ma) * (b[k] - mb))) / (sd(a) * sd(b));
      assert.ok(Math.abs(r) < 0.08, S.STATS[i] + '/' + S.STATS[j] + ' correlation ' + r.toFixed(3));
    }
});

test('the effect table is the whole vocabulary: every effect names a stat, every stat has an effect', () => {
  const { S } = world();
  for (const [name, e] of Object.entries(S.EFFECTS)) {
    assert.ok(S.STATS.includes(e.stat), name + ' names a stat that exists');
    assert.ok(
      Number.isFinite(e.span) && e.span !== 0 && Math.abs(e.span) < 1,
      name + ' has a finite span under 1'
    );
  }
  for (const stat of S.STATS)
    assert.ok(
      Object.values(S.EFFECTS).some(e => e.stat === stat),
      stat + ' is worth something'
    );
  assert.deepEqual(S.LEVERS, [...S.STATS, 'squad', 'deal']);
});

test('an average man is exactly 1; a high stat moves each effect the way the table says, never past its span', () => {
  const { S } = world();
  const avg = man('us', 1),
    hi = man('us', 2),
    lo = man('us', 3);
  for (const s of [avg, hi, lo]) S.of(s);
  for (const stat of S.STATS) {
    avg.stats[stat] = 0.5;
    hi.stats[stat] = 1;
    lo.stats[stat] = 0;
  }
  for (const [name, e] of Object.entries(S.EFFECTS)) {
    assert.equal(S.scale(avg, name), 1, name + ' is neutral for an average man');
    const up = S.scale(hi, name),
      down = S.scale(lo, name);
    assert.ok(
      Math.abs(up - (1 + e.span)) < 1e-12 && Math.abs(down - (1 - e.span)) < 1e-12,
      name + ' reaches its span'
    );
    assert.ok(
      up > 1 === e.span > 0,
      name + ': a high ' + e.stat + (e.span > 0 ? ' raises' : ' lowers') + ' it'
    );
  }
  assert.equal(S.scale(hi, 'no-such-effect'), 1, 'a name that is not an effect is neutral');
  assert.equal(S.scale(null, 'hold'), 1);
});

test('?stats=0 is the module absent; ?stats=for switches on only fortitude; the roll-up is its own lever', () => {
  const off = world('?stats=0'),
    s = man('us', 4);
  for (const name of Object.keys(off.S.EFFECTS)) assert.equal(off.S.scale(s, name), 1);
  assert.equal(s.stats, undefined, 'no state kept at all');
  assert.equal(
    off.S.profile({ time: 1, factions: { us: { squads: [] } } }, { faction: 'us', id: 'q' }),
    null
  );
  const one = world('?stats=for'),
    t = man('us', 4);
  one.S.of(t).for = 1;
  one.S.of(t).tac = 1;
  assert.ok(one.S.scale(t, 'hold') !== 1 && one.S.scale(t, 'nerve') !== 1, 'fortitude is on');
  for (const name of [
    'recognition',
    'sight',
    'group',
    'settle',
    'pace',
    'fitness',
    'setup',
    'stoppage',
    'build'
  ])
    assert.equal(one.S.scale(t, name), 1, name + ' is off');
  assert.equal(one.S.on('squad'), false);
  assert.equal(world('?stats=all').S.on('squad'), true);
  assert.equal(world('').S.mode().flag, 'default');
  assert.equal(world('?stats=tac,squad').S.on('squad'), true);
  assert.equal(world('?stats=all').S.on('deal'), true, 'all now includes stat-based dealing');
  assert.equal(world('').S.on('deal'), true, 'the shipping default deals roles from soldier stats');
  assert.equal(world('?stats=all,deal').S.on('deal'), true);
  assert.equal(
    world('?stats=all,deal').S.on('for'),
    true,
    'and the rest of the default set stays on with it'
  );
  assert.equal(world('?stats=deal').S.on('for'), false, 'a list is only what it names');
});

test('nothing here draws from the combat RNG or Math.random', () => {
  const { S, b } = world();
  const real = Math.random;
  let draws = 0;
  Math.random = () => {
    draws++;
    return 0.5;
  };
  b.random = () => {
    draws++;
    return 0.5;
  };
  try {
    const sq = { id: 'us-0', faction: 'us', members: [man('us', 1), man('us', 2), man('us', 3)] };
    S.squad(sq, 1);
    for (const name of Object.keys(S.EFFECTS)) S.scale(sq.members[0], name);
    S.profile({ time: 1, factions: { us: { squads: [sq] } } }, sq);
  } finally {
    Math.random = real;
  }
  assert.equal(draws, 0);
});

/* A squad of `count` living men whose stats are set by hand. */
function squad(S, id, faction, count, stats) {
  const sq = { id, faction, members: [] };
  for (let i = 0; i < count; i++) {
    const s = man(faction, id + '-' + i);
    Object.assign(S.of(s), stats);
    sq.members.push(s);
  }
  return sq;
}
const sim = (...squads) => ({
  time: 5,
  factions: {
    us: { squads: squads.filter(q => q.faction === 'us') },
    ge: { squads: squads.filter(q => q.faction === 'ge') }
  },
  _roster: {
    us: squads.filter(q => q.faction === 'us').flatMap(q => q.members),
    ge: squads.filter(q => q.faction === 'ge').flatMap(q => q.members)
  }
});

test('a squad reads the mean of its living men, once per sim time; nobody living reads n 0', () => {
  const { S } = world();
  const q = squad(S, 'a', 'us', 4, { phy: 0.2, mkm: 0.4, for: 0.6, tac: 0.8, agi: 0.5, tec: 0.5 });
  q.members[0].stats.phy = 0.6;
  assert.equal(S.squad(q, 5).n, 4);
  assert.ok(Math.abs(S.squad(q, 5).mean.phy - 0.3) < 1e-12);
  q.members[1].dead = true;
  assert.equal(S.squad(q, 5).n, 4, 'the same sim time is not recomputed');
  const st = S.squad(q, 5.15);
  assert.equal(st.n, 3);
  assert.ok(Math.abs(st.mean.phy - (0.6 + 0.2 + 0.2) / 3) < 1e-12, 'the dead man is out of the mean');
  q.members.forEach(s => (s.dead = true));
  assert.deepEqual(
    [S.squad(q, 6).n, S.squad(q, 6).mean.phy],
    [0, 0],
    'a squad with no one is rolled up over nobody'
  );
  q.members = [];
  assert.equal(S.squad(q, 7).n, 0, 'and so is one whose list was emptied by a merge');
  assert.equal(S.squad(null, 7), null);
});

test('ranks: the highest composite is 1, the lowest 0, ties by squad id, thin and lone squads pull nothing', () => {
  const { S } = world();
  const base = { phy: 0.5, mkm: 0.5, for: 0.5, tac: 0.5, agi: 0.5, tec: 0.5 };
  const fast = squad(S, 'us-c', 'us', 6, { ...base, phy: 0.9, agi: 0.9 }),
    mid = squad(S, 'us-b', 'us', 6, { ...base, phy: 0.5, agi: 0.5 }),
    slow = squad(S, 'us-a', 'us', 6, { ...base, phy: 0.1, agi: 0.1 }),
    tieX = squad(S, 'us-x', 'us', 6, { ...base }),
    thin = squad(S, 'us-t', 'us', 2, { ...base, phy: 1, agi: 1 });
  const world1 = sim(fast, mid, slow, thin);
  assert.equal(S.profile(world1, fast).pace, 1);
  assert.equal(S.profile(world1, mid).pace, 0.5);
  assert.equal(S.profile(world1, slow).pace, 0);
  assert.equal(
    S.profile(world1, thin).pace,
    0.5,
    'two men are noise: no pull, and the others are not ranked against him'
  );
  for (const c of ['grit', 'support', 'eyes'])
    assert.deepEqual(
      [fast, mid, slow].map(q => S.profile(world1, q)[c]).sort(),
      [0, 0.5, 1],
      c + ' ranks are spread across equal squads by id'
    );
  assert.ok(
    S.profile(world1, slow).grit === 0 &&
      S.profile(world1, mid).grit === 0.5 &&
      S.profile(world1, fast).grit === 1,
    'ties break by squad id (a < b < c)'
  );
  const lone = sim(tieX);
  assert.equal(S.profile(lone, tieX).pace, 0.5, 'a lone squad pulls nothing');
  const ge = squad(S, 'ge-a', 'ge', 6, { ...base, phy: 1, agi: 1 });
  assert.equal(
    S.profile(sim(fast, mid, slow, ge), fast).pace,
    1,
    'a side is ranked against its own squads only'
  );
  const w2 = { ...world1, time: 6 };
  fast.members.forEach(s => (s.dead = true));
  assert.equal(S.profile(w2, mid).pace, 1, 'and against the living: a squad that lost its men drops out');
});

test("deal: a permutation of the squad's ten ids, each command slot to the best of what is left, off unless asked", () => {
  const H2 = require('./harness'),
    roles = H2.bootstrap({ modules: false }).SquadAI.COMPOSITION;
  const { S } = world('?stats=all,deal'),
    stat = (f, id) => S.of({ faction: f, id });
  const dealt = S.deal('us', 40, roles);
  assert.equal(dealt.length, roles.length);
  assert.deepEqual(
    dealt.slice().sort((x, y) => x - y),
    roles.map((_, i) => 40 + i),
    'the same ten ids, so the id counter and every hash keyed on an id see the same set'
  );
  const score = (id, keys) => keys.reduce((a, k) => a + stat('us', id)[k], 0);
  const pool = new Set(dealt);
  const best = (keys, from) => Math.max(...[...from].map(id => score(id, keys)));
  const sgt = dealt[roles.indexOf('sergeant')];
  assert.equal(
    score(sgt, ['for', 'tac']),
    best(['for', 'tac'], pool),
    'the sergeant is the steadiest, most alert man'
  );
  pool.delete(sgt);
  const gun = dealt[roles.indexOf('gunner')];
  assert.equal(
    score(gun, ['phy', 'tec']),
    best(['phy', 'tec'], pool),
    'the gunner is the strongest technician left'
  );
  pool.delete(gun);
  const scouts = roles.map((r, i) => (r === 'scout' ? dealt[i] : null)).filter(v => v != null);
  assert.equal(scouts.length, 2);
  const first = Math.max(...[...pool].map(id => score(id, ['agi', 'mkm'])));
  assert.equal(score(scouts[0], ['agi', 'mkm']), first, 'the first scout is the quickest good shot left');
  pool.delete(scouts[0]);
  assert.equal(score(scouts[1], ['agi', 'mkm']), best(['agi', 'mkm'], pool), 'and the second the next');
  pool.delete(scouts[1]);
  const rifles = roles.map((r, i) => (r === 'rifleman' ? dealt[i] : null)).filter(v => v != null);
  assert.deepEqual(
    rifles,
    [...pool].sort((x, y) => x - y),
    'riflemen are whoever is left, in id order'
  );
  assert.deepEqual(S.deal('us', 40, roles), dealt, 'a pure function of the ids');
  assert.notDeepEqual(S.deal('ge', 40, roles), dealt, 'and of the faction');
  // Over many squads the command slots are held by men who score higher than the id-ordered deal gives.
  let dealtSgt = 0,
    plainSgt = 0;
  for (let q = 0; q < 200; q++) {
    dealtSgt += score(S.deal('us', q * 10, roles)[0], ['for', 'tac']);
    plainSgt += score(q * 10, ['for', 'tac']);
  }
  assert.ok(
    dealtSgt > plainSgt * 1.2,
    'the sergeants dealt beat the sergeants by id: ' + dealtSgt + ' vs ' + plainSgt
  );
  for (const search of ['?stats=0', '?stats=all', ''])
    assert.equal(world(search).S.deal('us', 40, roles), null, search);
  assert.equal(S.deal('us', 40, []), null);
  assert.equal(S.deal('us', 40, ['rifleman', 'rifleman']).join(), '40,41', 'no command slot, no change');
});

test('the module writes only `stats`: nothing else on a man or a squad changes', () => {
  const { S } = world();
  const q = squad(S, 'us-0', 'us', 5, { phy: 0.3, mkm: 0.3, for: 0.3, tac: 0.3, agi: 0.3, tec: 0.3 });
  const snap = () =>
    JSON.stringify([q.members.map(({ stats, ...rest }) => rest), (({ stats, members, ...rest }) => rest)(q)]);
  const before = snap();
  S.squad(q, 5);
  for (const name of Object.keys(S.EFFECTS)) S.scale(q.members[0], name);
  S.profile(sim(q), q);
  S.reset(sim(q));
  assert.equal(snap(), before);
});

console.log('soldier-stats-check: ' + n + ' passed');
