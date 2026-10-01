#!/usr/bin/env node
'use strict';
/* Stress that lasts (module 17, `?stressMem=lasting,floor,relief`): what a man carries from one moment of a fight
   to the next. Three producers, `lasting` on by default (owner, 2026-10-01; `?stressMem=0` is none, a list names exactly those that run), each with its own check here.

   - lasting: stress does not drain on its timer while the squad is in contact or he is under fire; it drains
     once both have been quiet for CALM_AFTER. Off, it drains as before.
   - floor: whenever his health or stress changes, the floor is the larger of itself and (share of health lost) x
     stress. Nothing takes his stress below it. A healed man's floor falls with the lost health it was set at.
     A man who was never hurt has none. (The worked example in AGENTS.md: 50% health and 60% stress is 30%; at 40%
     health a burst to 80% makes it 48%; a healed 35 points off a floor of 50% at 50% health leaves 15%.)
   - relief: a kill (the wound model, to the shooter), a captured objective (the capture zone, to the men in it),
     cover reached under fire and a spell of fire survived (Engagement) each take RELIEF[kind] x his nerve off,
     never below the floor. A kind nobody reads is not queued: with relief off nothing is posted at all.
   - The flag parse, every flag off meaning the battle as before, no combat-RNG draw, nothing written but `mind`.
   Mechanism, not dice. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
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
const SEED = +(process.env.HARNESS_SEED || 12345);
const near = (a, b, tol, what) =>
  assert.ok(Math.abs(a - b) <= tol, `${what || 'value'}: ${a} vs ${b} (±${tol})`);

/* One US squad, parked 20 m up; a GE squad far off. `mode` is the page query (`?stressMem=...`). */
function world(mode) {
  H.resetIds();
  const r = H.bootstrap();
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  if (mode != null) r.BattleSoldierMind.configure(mode);
  const b = H.makeBattle(r, { seed: SEED });
  const us = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 100 },
    facing: 0,
    seed: SEED
  });
  const ge = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: 400,
    objective: { x: 0, z: 0 },
    facing: Math.PI,
    seed: SEED + 1
  });
  us.members.forEach((s, i) => put(s, 0.5 * i, 20));
  ge.members.forEach((s, i) => put(s, 0.5 * i, 400));
  b.time = 10;
  return { r, b, M: r.BattleSoldierMind, E: r.BattleSoldierEvents, S: r.SquadAI, us, ge };
}
function put(s, x, z) {
  s.root.position.x = x;
  s.root.position.z = z;
}
const man = (sq, role, skip) => sq.members.filter(s => s.role === role && !s.dead)[skip || 0];
function runAll(ctx, men, seconds, before) {
  for (let t = 0; t < seconds - 1e-9; t += H.AI_TICK) {
    ctx.b.time += H.AI_TICK;
    if (before) before(ctx.b.time);
    men.forEach(s => ctx.M.tick(s, ctx.b));
  }
}
const run = (ctx, s, seconds, before) => runAll(ctx, [s], seconds, before);
/* Give a man stress at once, as the sum of a few events: the module's own arithmetic, no shortcut to the number. */
function scare(ctx, s, amount) {
  const m = ctx.M.of(s);
  m.stress = amount;
  m.pub = amount;
}

test('the flag parses: lasting by default (owner, 2026-10-01), 0 for none, each named, or all of them', () => {
  const parse = q => Object.keys(world(q).M.mode().memory).sort();
  assert.deepEqual(parse(''), ['lasting']);
  assert.deepEqual(parse('?x=1'), ['lasting']);
  assert.deepEqual(parse('?stressMem='), ['lasting']);
  assert.deepEqual(parse('?stressMem=0'), []);
  assert.deepEqual(parse('?stressMem=off'), []);
  assert.deepEqual(parse('?stressMem=1'), ['floor', 'lasting', 'relief']);
  assert.deepEqual(parse('?stressMem=all'), ['floor', 'lasting', 'relief']);
  assert.deepEqual(parse('?stressMem=lasting'), ['lasting']);
  assert.deepEqual(parse('?stressMem=floor,relief'), ['floor', 'relief']);
  assert.deepEqual(parse('?stressMem=floor,panic'), ['floor']);
  assert.deepEqual(parse('?mind=react&stressMem=lasting'), ['lasting']);
  assert.deepEqual(
    world().M.mode().memory,
    { lasting: true },
    'no location at all: the default, as in the Node harness'
  );
  assert.deepEqual(
    parse('?stressMem=floor'),
    ['floor'],
    'a list names exactly the producers that run: no lasting'
  );
  assert.deepEqual(parse('?stressMem=panic'), [], 'and one that names nothing known is none');
});

test('lasting: stress does not drain while the squad is in contact, and drains CALM_AFTER after it stops', () => {
  const off = world('?stressMem=0'),
    on = world('?stressMem=lasting'),
    a = man(off.us, 'rifleman'),
    c = man(on.us, 'rifleman');
  [off, on].forEach((ctx, k) => {
    const s = k ? c : a;
    run(ctx, s, 0.15);
    scare(ctx, s, 0.6);
    ctx.us.inContact = true; // the squad's contact report, Engagement's
  });
  run(off, a, 30);
  run(on, c, 30);
  assert.ok(off.M.stress(a) < 0.6 * 0.3, `off: ${off.M.stress(a)} drained in 30 s of contact`);
  near(on.M.stress(c), 0.6, 1e-9, 'on: held through 30 s of contact');
  assert.ok(on.M.of(c).held >= 29.9, 'the seconds it was held are counted: ' + on.M.of(c).held);
  /* Contact ends: nothing drains for CALM_AFTER, then it does. */
  on.us.inContact = false;
  const calm = on.M.tuning.CALM_AFTER;
  run(on, c, calm - 0.5);
  near(on.M.stress(c), 0.6, 1e-9, 'quiet, but not for CALM_AFTER yet');
  run(on, c, 1.5);
  assert.ok(on.M.stress(c) < 0.6, 'quiet for CALM_AFTER: it drains');
  run(on, c, 66);
  assert.ok(on.M.stress(c) < 0.6 * 0.06, 'and drains back to nearly nothing: ' + on.M.stress(c));
});

test('lasting: a man under fire holds his stress even when his squad is out of contact', () => {
  const ctx = world('?stressMem=lasting'),
    s = man(ctx.us, 'rifleman');
  run(ctx, s, 0.15);
  scare(ctx, s, 0.5);
  ctx.us.inContact = false;
  run(ctx, s, 30, () => ctx.S.pin(s, ctx.b, 1.6)); // kept pinned, nothing aimed: his own fire
  const held = ctx.M.stress(s);
  assert.ok(held >= 0.5, 'suppression adds to it and nothing drains it: ' + held);
  run(ctx, s, ctx.M.tuning.CALM_AFTER + 1.7);
  assert.ok(ctx.M.stress(s) < held, 'then, quiet, it drains');
});

test('lasting does not change what a man gains: the same events give the same stress in the same instant', () => {
  const a = world('?stressMem=0'),
    b = world('?stressMem=lasting'),
    sa = man(a.us, 'rifleman'),
    sb = man(b.us, 'rifleman');
  [a, b].forEach((ctx, k) => {
    const s = k ? sb : sa;
    run(ctx, s, 0.15);
    ctx.S.pin(s, ctx.b, 3.1);
    run(ctx, s, 0.15);
  });
  near(a.M.stress(sa), b.M.stress(sb), 1e-12, 'the gain of one tick');
});

/* The floor. Health is `hp / maxHp`; stress is set directly, since what moves it is the old arithmetic. */
function hurt(s, share) {
  s.hp = s.maxHp * (1 - share);
}

test('floor: the worked example from AGENTS.md (50% health, 60% stress is 30%; 40% and 80% is 48%)', () => {
  const ctx = world('?stressMem=floor'),
    s = man(ctx.us, 'rifleman');
  run(ctx, s, 0.15);
  hurt(s, 0.5);
  scare(ctx, s, 0.6);
  run(ctx, s, 0.15);
  near(ctx.M.of(s).floor, 0.3, 0.02, 'floor at 50% health and 60% stress');
  /* After the fight he recovers some, and nothing takes him below the floor, however long he rests. */
  run(ctx, s, 120);
  near(ctx.M.stress(s), ctx.M.of(s).floor, 1e-6, 'rested for two minutes: held at the floor');
  assert.ok(ctx.M.stress(s) >= 0.28);
  /* Next fight: 40% health and a burst takes him to 80%. */
  hurt(s, 0.6);
  scare(ctx, s, 0.8);
  run(ctx, s, 0.15);
  near(ctx.M.of(s).floor, 0.48, 0.02, 'floor at 40% health and 80% stress');
  /* It is a high-water mark: it never falls while he stays hurt. */
  const f = ctx.M.of(s).floor;
  run(ctx, s, 120);
  assert.equal(ctx.M.of(s).floor, f);
  assert.ok(ctx.M.stress(s) >= f - 1e-9);
});

test('floor: a man who was never hurt has none, and all of his stress can go', () => {
  const ctx = world('?stressMem=floor'),
    s = man(ctx.us, 'rifleman');
  run(ctx, s, 0.15);
  scare(ctx, s, 0.9);
  run(ctx, s, 120);
  assert.equal(ctx.M.of(s).floor, 0);
  assert.ok(ctx.M.stress(s) < 0.01, 'unhurt, he calms right down: ' + ctx.M.stress(s));
});

test('floor: bleeding raises it as health is lost; healing lowers it by the share of lost health that came back', () => {
  const ctx = world('?stressMem=floor'),
    s = man(ctx.us, 'rifleman');
  run(ctx, s, 0.15);
  hurt(s, 0.5);
  scare(ctx, s, 1);
  run(ctx, s, 0.15);
  near(ctx.M.of(s).floor, 0.5, 0.01, 'a floor of 50% at 50% health and full stress (one tick of decay)');
  /* Bleeding on: 60% lost, the floor follows (stress is at the floor or above it). */
  hurt(s, 0.6);
  scare(ctx, s, 1);
  run(ctx, s, 0.15);
  near(ctx.M.of(s).floor, 0.6, 0.01, 'more health lost, higher floor');
  /* A medic: 85% health (15 points lost). Floor x lost_now / lost_before = 0.6 x 0.15 / 0.6 = 0.15. */
  const before = ctx.M.of(s).floor;
  hurt(s, 0.15);
  run(ctx, s, 0.15);
  near(
    ctx.M.of(s).floor,
    (before * 0.15) / 0.6,
    0.01,
    'healed to 85%: floor x 0.15 / 0.6, the 15% of the example'
  );
  hurt(s, 0);
  run(ctx, s, 0.15);
  assert.equal(ctx.M.of(s).floor, 0, 'healed to full: gone');
  /* A later rise in stress ratchets it up again from the new health. */
  hurt(s, 0.2);
  scare(ctx, s, 0.5);
  run(ctx, s, 0.15);
  near(ctx.M.of(s).floor, 0.1, 0.01, 'it starts again from the new health');
});

test('floor off: nothing holds him, whatever his health', () => {
  const ctx = world('?stressMem=0'),
    s = man(ctx.us, 'rifleman');
  run(ctx, s, 0.15);
  hurt(s, 0.6);
  scare(ctx, s, 0.9);
  run(ctx, s, 120);
  assert.equal(ctx.M.of(s).floor, 0);
  assert.ok(ctx.M.stress(s) < 0.02);
});

/* Relief. */
const RELIEF = ['kill', 'objective', 'cover', 'survived'];

test('relief: with it off nothing is queued, with it on each kind is queued and takes RELIEF x nerve off', () => {
  const off = world('?stressMem=0'),
    on = world('?stressMem=relief');
  RELIEF.forEach(k => assert.equal(off.E.wanted(k), false, k + ' is not read, so it is not queued'));
  RELIEF.forEach(k => assert.equal(on.E.wanted(k), true, k));
  RELIEF.forEach(k => {
    const ctx = world('?stressMem=relief'),
      s = man(ctx.us, 'rifleman');
    run(ctx, s, 0.15);
    scare(ctx, s, 0.5);
    ctx.E.post(s, ctx.b, k, {});
    const before = ctx.M.stress(s);
    run(ctx, s, 0.15); // one tick: a little decay too
    const took = before - ctx.M.stress(s),
      r = ctx.M.tuning.RELIEF[k] * ctx.M.of(s).nerve;
    assert.ok(took >= r - 1e-9 && took <= r + 0.01, `${k}: took ${took}, the relief is ${r}`);
    near(ctx.M.of(s).relieved[k].amt, r, 1e-9, k + ' amount counted');
    assert.equal(ctx.M.of(s).relieved[k].n, 1);
  });
  const ctx = world('?stressMem=0'),
    s = man(ctx.us, 'rifleman');
  run(ctx, s, 0.15);
  assert.equal(ctx.E.post(s, ctx.b, 'kill', {}), false, 'with relief off a kill posts nothing');
});

test('relief never takes a man below his floor, or below nothing', () => {
  const ctx = world('?stressMem=floor,relief'),
    s = man(ctx.us, 'rifleman');
  run(ctx, s, 0.15);
  hurt(s, 0.5);
  scare(ctx, s, 0.6);
  run(ctx, s, 0.15);
  const f = ctx.M.of(s).floor;
  for (let i = 0; i < 6; i++) ctx.E.post(s, ctx.b, 'objective', {});
  run(ctx, s, 0.15);
  assert.ok(ctx.M.stress(s) >= f - 1e-9, `six objectives and still at the floor: ${ctx.M.stress(s)} vs ${f}`);
  assert.ok(
    ctx.M.of(s).relieved.objective.amt < 6 * ctx.M.tuning.RELIEF.objective,
    'what it took off is what there was'
  );
  /* Calm, unhurt: relief has nothing to take off and counts none. */
  const c2 = world('?stressMem=relief'),
    t = man(c2.us, 'rifleman');
  run(c2, t, 0.15);
  c2.E.post(t, c2.b, 'kill', {});
  run(c2, t, 0.15);
  assert.equal(c2.M.stress(t), 0);
  assert.equal(c2.M.of(t).relieved.kill.amt, 0);
});

test('relief: the wound model tells the shooter of a kill, never of a friend, and a wound is not a kill', () => {
  const ctx = world('?stressMem=relief'),
    shooter = man(ctx.ge, 'rifleman'),
    victim = man(ctx.us, 'rifleman', 0),
    friend = man(ctx.ge, 'rifleman', 1),
    hit = man(ctx.us, 'rifleman', 1);
  ctx.b.random = () => 0; // dropped at once
  ctx.r.BattleWounds.wound(shooter, victim, ctx.b, { zone: 'chest' });
  const got = [];
  ctx.E.drain(shooter, 'soldier-mind', (k, d) => got.push([k, d.victim]));
  assert.deepEqual(got, [['kill', victim.id]], 'the shooter is told, once');
  ctx.r.BattleWounds.wound(shooter, friend, ctx.b, { zone: 'chest' });
  assert.equal(ctx.E.pending(shooter), 0, 'a man of his own side going down is not a kill');
  ctx.b.random = () => 0.99; // survives
  ctx.r.BattleWounds.wound(shooter, hit, ctx.b, { zone: 'arm' });
  assert.equal(ctx.E.pending(shooter), 0, 'a wound is not a kill');
});

test('relief: Engagement reports a spell of fire survived, and not one that wounded him', () => {
  const ctx = world('?stressMem=relief'),
    E = ctx.r.BattleEngagement,
    ok = man(ctx.us, 'rifleman', 0),
    shot = man(ctx.us, 'rifleman', 1);
  [ok, shot].forEach(s => run(ctx, s, 0.15));
  const step = s => {
    ctx.b.time += H.AI_TICK;
    E.updateSoldier(s, ctx.b);
  };
  [ok, shot].forEach(s => {
    ctx.S.pin(s, ctx.b, 1.6);
    for (let i = 0; i < 6; i++) step(s);
  });
  (shot.wounds || (shot.wounds = [])).push({ zone: 'arm', at: ctx.b.time }); // a hit in the middle of it
  for (let i = 0; i < 8; i++) {
    step(ok);
    step(shot);
  }
  const kinds = s => {
    const out = [];
    ctx.E.drain(s, 'soldier-mind', k => out.push(k));
    return out;
  };
  const a = kinds(ok),
    b = kinds(shot);
  assert.ok(a.includes('survived'), 'a spell of fire that ended with no wound is survived: ' + a);
  assert.ok(!b.includes('survived'), 'a spell with a wound in it is not: ' + b);
  const off = world('?stressMem=0');
  const x = man(off.us, 'rifleman');
  off.S.pin(x, off.b, 1.6);
  for (let i = 0; i < 20; i++) {
    off.b.time += H.AI_TICK;
    off.r.BattleEngagement.updateSoldier(x, off.b);
  }
  const left = [];
  off.E.drain(x, 'soldier-mind', k => left.push(k));
  assert.ok(!left.includes('survived'), 'with relief off no relief is posted: ' + left);
});

test('relief: reaching cover under fire is reported once, not reaching it, and not when nobody is shooting', () => {
  const run1 = suppressed => {
    const ctx = world('?stressMem=relief'),
      E = ctx.r.BattleEngagement,
      s = man(ctx.us, 'rifleman');
    run(ctx, s, 0.15);
    const p = s.root.position,
      e = E.stateOf(s);
    e.cover = { x: p.x, z: p.z, slotId: 'c1', distance: 0, type: 'wall' };
    e.state = 'bound';
    e.since = ctx.b.time;
    e.until = ctx.b.time + 5;
    if (suppressed) ctx.S.pin(s, ctx.b, 2);
    ctx.b.time += H.AI_TICK;
    E.updateSoldier(s, ctx.b);
    const out = [];
    ctx.E.drain(s, 'soldier-mind', k => out.push(k));
    return out.filter(k => k === 'cover');
  };
  assert.equal(run1(true).length, 1, 'arrived in cover while suppressed');
  assert.equal(run1(false).length, 0, 'arrived in cover, nobody shooting: no relief');
});

test('relief: the capture zone tells the men of the side that took it who stood in it, on capture and on neutralising', () => {
  const ctx = world('?stressMem=relief');
  let handler = null;
  const fake = {
    BattleModules: {
      registerObjectiveType(name, h) {
        handler = h;
      },
      registerSystem() {}
    },
    BattleSoldierEvents: ctx.E
  };
  load(fake, 'battle/modules/01-capture-zone.js');
  assert.ok(handler, 'the zone registers its handler');
  const inside = man(ctx.us, 'rifleman', 0),
    inside2 = man(ctx.us, 'rifleman', 1),
    outside = man(ctx.us, 'rifleman', 2),
    enemy = man(ctx.ge, 'rifleman', 0);
  put(inside, 100, 100);
  put(inside2, 103, 100);
  put(outside, 160, 100); // beyond the radius
  put(enemy, 400, 400);
  const units = [inside, inside2, outside, enemy],
    helpers = {
      unitsFor: () => units,
      telemetry() {},
      stats: {
        captures: 0,
        neutralizations: 0,
        capturesByFaction: {},
        neutralizationsByFaction: {},
        pressureSecondsByFaction: {}
      }
    },
    instance = { id: 'z1', def: { x: 100, z: 100, radius: 20, captureSeconds: 2, minPresence: 1 } };
  instance.state = handler.init(instance);
  const heard = s => {
    const out = [];
    ctx.E.drain(s, 'soldier-mind', (k, d) => out.push([k, d.objective]));
    return out;
  };
  for (let i = 0; i < 40 && instance.state.owner !== 'us'; i++) handler.tick(instance, ctx.b, 0.15, helpers);
  assert.equal(instance.state.owner, 'us', 'the zone was taken');
  assert.deepEqual(heard(inside), [['objective', 'z1']], 'a man in the zone is told once');
  assert.deepEqual(heard(inside2), [['objective', 'z1']]);
  assert.deepEqual(heard(outside), [], 'a man outside is not');
  assert.deepEqual(heard(enemy), [], 'the enemy is not');
  /* The other side takes it back: its men in it are told, ours are not. */
  put(inside, 400, 400);
  put(inside2, 400, 401);
  put(enemy, 100, 100);
  put(man(ctx.ge, 'rifleman', 1), 102, 100);
  for (let i = 0; i < 40 && instance.state.owner === 'us'; i++) handler.tick(instance, ctx.b, 0.15, helpers);
  assert.equal(instance.state.owner, 'neutral', 'neutralised');
  assert.deepEqual(heard(enemy), [['objective', 'z1']], 'the neutralising side is told');
  assert.deepEqual(heard(inside), [], 'and the side that lost it is not');
  /* Nobody reads `objective` with relief off: nothing is posted. */
  const off = world('?stressMem=0');
  fake.BattleSoldierEvents = off.E;
  load(fake, 'battle/modules/01-capture-zone.js');
  const u = man(off.us, 'rifleman');
  put(u, 100, 100);
  const inst2 = { id: 'z2', def: { x: 100, z: 100, radius: 20, captureSeconds: 1, minPresence: 1 } };
  inst2.state = handler.init(inst2);
  const h2 = Object.assign({}, helpers, { unitsFor: () => [u] });
  for (let i = 0; i < 20; i++) handler.tick(inst2, off.b, 0.15, h2);
  assert.equal(inst2.state.owner, 'us');
  assert.equal(off.E.pending(u), 0);
});

test('the module writes only `mind` and draws nothing from the combat RNG, flags on', () => {
  const ctx = world('?stressMem=all'),
    s = man(ctx.us, 'rifleman');
  run(ctx, s, 0.15);
  hurt(s, 0.4); // set up what the test does to him before the snapshot
  scare(ctx, s, 0.7);
  ctx.E.post(s, ctx.b, 'kill', {});
  ctx.us.inContact = true;
  const snap = () =>
    JSON.stringify(
      Object.keys(s)
        .filter(k => k !== 'mind' && k !== '_eventQueue')
        .sort()
        .map(k => [k, typeof s[k] === 'object' ? 0 : s[k]]),
      (k, v) => (typeof v === 'number' ? +v.toFixed(9) : v)
    );
  const before = snap();
  let draws = 0;
  const real = ctx.b.random;
  ctx.b.random = (...a) => (draws++, real.apply(ctx.b, a));
  run(ctx, s, 20);
  assert.equal(draws, 0, 'no combat-RNG draw');
  assert.equal(snap(), before, 'nothing but his mind (and his queue) changed');
});

test('telemetry carries the memory block: flags, seconds held, floors and relief by kind', () => {
  const ctx = world('?stressMem=all'),
    s = man(ctx.us, 'rifleman');
  run(ctx, s, 0.15);
  hurt(s, 0.5);
  scare(ctx, s, 0.6);
  ctx.us.inContact = true;
  ctx.E.post(s, ctx.b, 'kill', {});
  run(ctx, s, 5);
  const t = ctx.M.telemetry(ctx.b);
  assert.deepEqual([...t.memory.flags].sort(), ['floor', 'lasting', 'relief']);
  assert.ok(t.memory.heldSeconds >= 4.5, 'held seconds: ' + t.memory.heldSeconds);
  assert.equal(t.memory.floor.men, 1);
  assert.ok(t.memory.floor.max >= 0.25);
  assert.equal(t.memory.relief.kill.n, 1);
  assert.ok(t.memory.relief.kill.amount > 0);
  assert.equal(t.memory.relief.cover.n, 0);
  assert.deepEqual(t.bySide.us.memory.flags, t.memory.flags, 'and per side');
  const off = world('?stressMem=0');
  const x = man(off.us, 'rifleman');
  run(off, x, 5);
  const o = off.M.telemetry(off.b);
  assert.deepEqual(o.memory.flags, []);
  assert.equal(o.memory.heldSeconds, 0);
  assert.equal(o.memory.floor.men, 0);
});

console.log(`${n} stress-memory checks passed`);
