#!/usr/bin/env node
'use strict';
/* What each soldier stat costs or buys at the layer that reads it (module 10 supplies the numbers; the
   reading layer decides what they are worth). One section per stat. Every lever is neutral when the module
   is absent or `?stats=0`: the same input gives the same output as the flat constants. Mechanism, not dice. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
function loadInto(r, file) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, file), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
const near = (a, b, tol, what) =>
  assert.ok(Math.abs(a - b) <= tol, `${what || 'value'}: ${a} vs ${b} (±${tol})`);

/* A world with the stats module (opt-in), or without it for the flat-constant control. */
function world({ stats = true, search } = {}) {
  H.resetIds();
  const r = H.bootstrap({ stats });
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  if (stats && search != null) r.BattleSoldierStats.configure(search);
  const b = H.makeBattle(r);
  const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  const ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 200, objective: { x: 0, z: 0 } });
  b.time = 10;
  return { r, b, S: r.SquadAI, St: r.BattleSoldierStats, M: r.BattleSoldierMind, us, ge };
}
/* Give a man extreme stats by hand (0 and 1 are the ends of the roll). */
function set(St, s, values) {
  Object.assign(St.of(s), values);
  return s;
}
const rifleman = (sq, k) => sq.members.filter(s => s.role === 'rifleman')[k || 0];

/* ---- FOR: how long fire holds him, and how much of every stress gain he takes ----------------- */

test('FOR: a steadier man is pinned for less time, a shakier one for more; the average man for exactly 1.3 s', () => {
  const { b, S, St, us } = world();
  const steady = set(St, rifleman(us, 0), { for: 1 }),
    mid = set(St, rifleman(us, 1), { for: 0.5 }),
    shaky = set(St, rifleman(us, 2), { for: 0 });
  for (const s of [steady, mid, shaky]) S.pin(s, b, S.SUPPRESSION_TIME);
  near(steady.suppressedUntil - b.time, 1.3 * 0.6, 1e-9, 'fortitude 1');
  near(mid.suppressedUntil - b.time, 1.3, 1e-9, 'fortitude 0.5');
  near(shaky.suppressedUntil - b.time, 1.3 * 1.4, 1e-9, 'fortitude 0');
  S.pin(steady, b, 0.1);
  near(steady.suppressedUntil - b.time, 1.3 * 0.6, 1e-9, 'and a hold still only extends');
});

test('FOR: with the module absent or ?stats=0 the hold is the flat constant, whoever he is', () => {
  const absent = world({ stats: false }),
    off = world({ search: '?stats=0' }),
    only = world({ search: '?stats=tac' });
  for (const w of [absent, off, only]) {
    const s = rifleman(w.us, 0);
    if (w.St) set(w.St, s, { for: 1 });
    w.S.pin(s, w.b, 1.3);
    assert.equal(s.suppressedUntil, w.b.time + 1.3);
  }
});

test('FOR: the stat replaces the hash nerve; a sergeant is still steadier; off, the old hash is back', () => {
  const on = world(),
    off = world({ stats: false });
  const a = set(on.St, rifleman(on.us, 0), { for: 1 }),
    z = set(on.St, rifleman(on.us, 1), { for: 0 }),
    sgt = set(
      on.St,
      on.us.members.find(s => s.role === 'sergeant'),
      { for: 0.5 }
    );
  near(on.M.of(a).nerve, 1.24, 1e-9, 'fortitude 1');
  near(on.M.of(z).nerve, 0.76, 1e-9, 'fortitude 0');
  near(on.M.of(sgt).nerve, 1.15, 1e-9, 'an average sergeant carries his +15%');
  const control = rifleman(off.us, 0);
  near(
    off.M.of(control).nerve,
    1 + (0.5 - 0.5) * 0,
    0.13,
    'without the module the hash nerve is in its old +-12% band'
  );
  const only = world({ search: '?stats=tac' }),
    t = rifleman(only.us, 0);
  assert.ok(
    Math.abs(only.M.of(t).nerve - off.M.of(rifleman(off.us, 0)).nerve) < 1e-12,
    'a lever that is off leaves the hash nerve untouched'
  );
});

test('FOR: the same wound costs a shakier man more stress than a steadier one, in proportion to nerve', () => {
  const w = world(),
    { b, M, St, us } = w;
  const steady = set(St, rifleman(us, 0), { for: 1 }),
    shaky = set(St, rifleman(us, 1), { for: 0 });
  for (const s of [steady, shaky]) {
    s.root.position.x = 0;
    s.root.position.z = 20;
    b.time = 10;
    M.tick(s, b);
    s.wounds = [{ zone: 'arm', at: b.time }];
    b.time += 0.15;
    M.tick(s, b);
  }
  assert.ok(M.stress(steady) < M.stress(shaky), 'the same wound costs the shakier man more stress');
  const ratio = M.stress(shaky) / M.stress(steady);
  near(ratio, 1.24 / 0.76, 0.05, 'in proportion to nerve');
});

/* ---- AGI: how fast he settles his aim, looks for cover, and sprints -------------------------- */

test('AGI: a nimbler man settles his aim sooner after a stance change; the average man in exactly 0.4 s', () => {
  const { b, r, St, us } = world();
  const E = r.BattleEngagement;
  const nimble = set(St, rifleman(us, 0), { agi: 1 }),
    mid = set(St, rifleman(us, 1), { agi: 0.5 }),
    clumsy = set(St, rifleman(us, 2), { agi: 0 });
  for (const s of [nimble, mid, clumsy]) {
    E.stateOf(s).fireReadyAt = 0;
    E.commitStance(s, b, 'crouch');
  }
  near(E.stateOf(nimble).fireReadyAt - b.time, 0.4 * 0.6, 1e-9, 'agility 1');
  near(E.stateOf(mid).fireReadyAt - b.time, 0.4, 1e-9, 'agility 0.5');
  near(E.stateOf(clumsy).fireReadyAt - b.time, 0.4 * 1.4, 1e-9, 'agility 0');
  const flat = world({ stats: false }),
    f = rifleman(flat.us, 0);
  flat.r.BattleEngagement.commitStance(f, flat.b, 'crouch');
  near(flat.r.BattleEngagement.stateOf(f).fireReadyAt - flat.b.time, 0.4, 1e-9, 'without the module');
});

test('AGI: a nimbler pinned man looks for cover again sooner (0.9 s for an average man)', () => {
  const w = world(),
    { r, b, St, us, ge } = w;
  r.BattleModules.registerSystem = () => {};
  for (const file of ['battle/movement-resolver.js', 'battle/modules/44-combat-urgency.js'])
    loadInto(r, file);
  const E = r.BattleEngagement;
  const search = agi => {
    const s = set(St, rifleman(us, agi === 1 ? 0 : agi === 0 ? 1 : 2), { agi });
    s.target = rifleman(ge, 0);
    s.root.position.x = 0;
    s.root.position.z = 0;
    s.target.root.position.z = 80;
    s.suppressedUntil = b.time + 5;
    E.stateOf(s).state = 'pinned';
    E.stateOf(s)._urgentCoverSearchAt = 0;
    b.time += 0.15;
    r.SquadAI.updateSoldier(s, b);
    return E.stateOf(s)._urgentCoverSearchAt - b.time;
  };
  const fast = search(1),
    slow = search(0),
    mid = search(0.5);
  assert.ok(fast > 0 && slow > 0, 'both looked for cover');
  near(fast, 0.9 * 0.6, 0.16, 'agility 1');
  near(mid, 0.9, 0.16, 'agility 0.5');
  near(slow, 0.9 * 1.4, 0.16, 'agility 0');
  assert.ok(fast < mid && mid < slow);
});

test('AGI: the two fast gaits follow agility, inside their historical bands; walking does not', () => {
  const { r, St } = world();
  loadInto(r, 'battle/modules/11-soldier-individuality.js');
  const I = r.BattleSoldierIndividuality;
  const clone = agi => {
    const s = { faction: 'us', id: 41, role: 'rifleman' };
    set(St, s, { agi, phy: 0.5 });
    return I.phenotype(s);
  };
  const fast = clone(1),
    slow = clone(0);
  assert.ok(fast.gaits.sprint > slow.gaits.sprint && fast.gaits.crouchRun > slow.gaits.crouchRun);
  for (const gait of ['walk', 'run', 'crouchWalk', 'proneNormal', 'proneFast'])
    assert.equal(fast.gaits[gait], slow.gaits[gait], gait + ' is not agility');
  for (const p of [fast, slow]) {
    assert.ok(p.gaits.sprint >= I.gaitLimits.sprint[0] && p.gaits.sprint <= I.gaitLimits.sprint[1]);
    assert.ok(
      p.gaits.crouchRun >= I.gaitLimits.crouchRun[0] && p.gaits.crouchRun <= I.gaitLimits.crouchRun[1]
    );
  }
  const off = world({ search: '?stats=0' });
  loadInto(off.r, 'battle/modules/11-soldier-individuality.js');
  const o1 = off.r.BattleSoldierIndividuality.phenotype({
      faction: 'us',
      id: 41,
      role: 'rifleman',
      stats: { agi: 1 }
    }),
    o2 = off.r.BattleSoldierIndividuality.phenotype({
      faction: 'us',
      id: 41,
      role: 'rifleman',
      stats: { agi: 0 }
    });
  assert.deepEqual(o1.gaits, o2.gaits, 'with ?stats=0 agility changes nothing');
});

/* ---- TAC: how fast he recognises a contact and how far he spots ------------------------------ */

test('TAC: a more aware man recognises a contact sooner; the average man in exactly the role time', () => {
  const { b, r, St, us } = world();
  const E = r.BattleEngagement;
  const mk = tac => set(St, rifleman(us, 0), { tac });
  const base = E.reactTime(mk(0.5), b),
    sharp = E.reactTime(mk(1), b),
    dull = E.reactTime(mk(0), b);
  near(sharp / base, 0.6, 1e-9, 'awareness 1');
  near(dull / base, 1.4, 1e-9, 'awareness 0');
  const flat = world({ stats: false });
  near(
    flat.r.BattleEngagement.reactTime(rifleman(flat.us, 0), flat.b),
    base,
    1e-12,
    'the average man is the flat time'
  );
  const off = world({ search: '?stats=0' }),
    o = set(off.St, rifleman(off.us, 0), { tac: 1 });
  near(off.r.BattleEngagement.reactTime(o, off.b), base, 1e-12, 'with ?stats=0 awareness changes nothing');
});

test('TAC: a more aware man spots an enemy 150 m ahead that an average man (140 m) cannot see', () => {
  const { b, r, St, us, ge } = world();
  const S = r.SquadAI,
    enemy = ge.members[0];
  enemy.root.position.x = 0;
  enemy.root.position.z = 150;
  const seen = tac => {
    const s = set(St, rifleman(us, 0), { tac });
    s.root.position.x = 0;
    s.root.position.z = 0;
    s.root.rotation.y = 0;
    return S.findTarget(s, [enemy], b.heightAt, b.obstacles, b) === enemy;
  };
  assert.equal(seen(0.5), false, 'average awareness: 140 m of rifleman vision');
  assert.equal(seen(1), true, 'awareness 1: 161 m');
  assert.equal(seen(0), false, 'awareness 0: 119 m');
  enemy.root.position.z = 125;
  assert.equal(seen(0.5), true, 'at 125 m the average man sees him');
  assert.equal(seen(0), false, 'and the dullest cannot: 119 m');
});

console.log('stats-levers-check: ' + n + ' passed');
