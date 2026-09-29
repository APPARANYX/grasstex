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

/* ---- MKM: how wide his shot group is ---------------------------------------------------------- */

test('MKM: a better marksman shoots a tighter group; the average man exactly the flat sigma', () => {
  const build = opts => {
    const w = world(opts);
    loadInto(w.r, 'battle/modules/14-z-ballistic-raycast.js');
    return w;
  };
  const w = build(),
    { b, r, St, us } = w;
  const B = r.BattleBallistics,
    shooter = rifleman(us, 0),
    stats = shooter.weapon.stats;
  const sigma = mkm => {
    set(St, shooter, { mkm });
    return B.dispersionSigma(shooter, stats, 100, b, 0);
  };
  const mid = sigma(0.5);
  near(sigma(1) / mid, 0.6, 1e-9, 'marksmanship 1');
  near(sigma(0) / mid, 1.4, 1e-9, 'marksmanship 0');
  const flat = build({ stats: false });
  near(
    flat.r.BattleBallistics.dispersionSigma(
      rifleman(flat.us, 0),
      rifleman(flat.us, 0).weapon.stats,
      100,
      flat.b,
      0
    ) / mid,
    1,
    1e-12,
    'the average man is the flat sigma'
  );
  const off = build({ search: '?stats=0' }),
    o = set(off.St, rifleman(off.us, 0), { mkm: 1 });
  near(off.r.BattleBallistics.dispersionSigma(o, o.weapon.stats, 100, off.b, 0) / mid, 1, 1e-12, '?stats=0');
});

/* ---- PHY: how fast he moves, and how long a heavy weapon takes to emplace --------------------- */

test('PHY: a stronger man is faster on every gait (his fitness), inside the historical bands', () => {
  const { r, St } = world();
  loadInto(r, 'battle/modules/11-soldier-individuality.js');
  const I = r.BattleSoldierIndividuality;
  const gaits = phy => {
    const s = { faction: 'us', id: 41, role: 'rifleman' };
    set(St, s, { phy, agi: 0.5 });
    return I.phenotype(s);
  };
  const strong = gaits(1),
    weak = gaits(0);
  for (const gait of Object.keys(I.gaitLimits)) {
    assert.ok(strong.gaits[gait] >= weak.gaits[gait], gait + ' is not slower for the stronger man');
    const [lo, hi] = I.gaitLimits[gait];
    assert.ok(
      strong.gaits[gait] >= lo && strong.gaits[gait] <= hi && weak.gaits[gait] >= lo && weak.gaits[gait] <= hi
    );
  }
  assert.ok(
    strong.gaits.run > weak.gaits.run && strong.gaits.walk > weak.gaits.walk,
    'the everyday gaits move'
  );
  near(strong.fitness, 1.08, 1e-9, 'physical 1');
  near(weak.fitness, 0.92, 1e-9, 'physical 0');
  const off = world({ search: '?stats=0' });
  loadInto(off.r, 'battle/modules/11-soldier-individuality.js');
  const o = phy =>
    off.r.BattleSoldierIndividuality.phenotype({ faction: 'us', id: 41, role: 'rifleman', stats: { phy } })
      .fitness;
  assert.equal(o(1), o(0), 'with ?stats=0 the old hash fitness is back, whatever his PHY');
});

test('PHY: a stronger gunner emplaces the machine gun sooner (1.4 s for an average man)', () => {
  const delay = phy => {
    const w = world(),
      { b, r, St, us, ge } = w;
    const g = set(
      St,
      us.members.find(s => s.role === 'gunner'),
      { phy }
    );
    g.root.position.x = 0;
    g.root.position.z = 0;
    g.root.rotation.y = 0;
    const foe = ge.members.find(s => s.role === 'rifleman');
    foe.root.position.x = 0;
    foe.root.position.z = 110;
    for (let i = 0; i < 80; i++) {
      b.time += H.AI_TICK;
      r.SquadAI.updateSoldier(g, b);
      if (g.setUp) return b.time - r.BattleEngagement.stateOf(g).setUpSince;
    }
    return null;
  };
  const strong = delay(1),
    mid = delay(0.5),
    weak = delay(0);
  assert.ok(strong && mid && weak, 'the gun was emplaced in all three');
  near(strong, 1.4 * 0.7, 0.16, 'physical 1');
  near(mid, 1.4, 0.16, 'physical 0.5');
  near(weak, 1.4 * 1.3, 0.16, 'physical 0');
  assert.ok(strong < mid && mid < weak);
});

/* ---- TEC: how often his gun jams and how fast he clears it ----------------------------------- */

test('TEC: a more technical man jams less often and clears faster; the average man exactly the flat numbers', () => {
  const shot = (tec, u, opts) => {
    const w = world(opts);
    loadInto(w.r, 'battle/modules/46-ammunition-stoppages.js');
    w.r.SquadAI.extend('shotModel', 'ballistics', () => false);
    const s = rifleman(w.us, 0),
      foe = rifleman(w.ge, 0);
    if (w.St) set(w.St, s, { tec });
    foe.root.position.x = 0;
    foe.root.position.z = 60;
    s.target = foe;
    s.fireCooldown = 0;
    w.b.random = () => u;
    w.r.SquadAI.tryFire(s, w.b);
    return { jammed: !!s.clearingStoppage, clear: s.stoppageUntil - w.b.time };
  };
  // One Garand round heats the rifle to 0.045: the chance is 0.000645 flat, 0.000387 at technical 1, 0.000903 at 0.
  assert.deepEqual(
    [shot(1, 0.0005).jammed, shot(0.5, 0.0005).jammed, shot(0, 0.0005).jammed],
    [false, true, true]
  );
  assert.deepEqual(
    [shot(1, 0.0007).jammed, shot(0.5, 0.0007).jammed, shot(0, 0.0007).jammed],
    [false, false, true]
  );
  near(shot(1, 0.0001).clear, 1.45 * 0.6, 1e-9, 'technical 1 clears in');
  near(shot(0.5, 0.0001).clear, 1.45, 1e-9, 'technical 0.5 clears in');
  near(shot(0, 0.0001).clear, 1.45 * 1.4, 1e-9, 'technical 0 clears in');
  const flat = shot(0.5, 0.0001, { stats: false });
  near(flat.clear, 1.45, 1e-9, 'without the module');
  assert.equal(
    shot(1, 0.0005, { search: '?stats=0' }).jammed,
    true,
    'with ?stats=0 technical changes nothing'
  );
});

console.log('stats-levers-check: ' + n + ' passed');
