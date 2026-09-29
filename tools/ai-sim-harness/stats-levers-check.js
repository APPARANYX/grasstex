#!/usr/bin/env node
'use strict';
/* What each soldier stat costs or buys at the layer that reads it (module 10 supplies the numbers; the
   reading layer decides what they are worth). One section per stat. Every lever is neutral when the module
   is absent or `?stats=0`: the same input gives the same output as the flat constants. Mechanism, not dice. */
const assert = require('node:assert/strict'),
  H = require('./harness');
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

console.log('stats-levers-check: ' + n + ' passed');
