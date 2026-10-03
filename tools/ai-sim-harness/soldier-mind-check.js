#!/usr/bin/env node
'use strict';
/* Soldier condition (module 17, `BattleSoldierMind`): stress from what happens to a man and around him.

   - A friend going down raises the stress of men who can see or hear it, more the closer he was and
     more still in the same squad; an enemy, a man too far away, and a man behind a wall (beyond
     arm's reach) feel nothing. The squad leader going down is heard by the whole squad.
   - A suppression spell, a wound and aimed rounds (by range) add stress; nothing else does.
   - Stress decays; the leader within 12 m and cover speed that up, being under fire slows it.
   - A neighbour who is worse off spreads fear but can never push a man past himself; stress stays
     in [0, 1]; bands have hysteresis.
   - The levers are neutral when off and monotone in stress, and hesitation stays under the bound window.
   - The module writes only `mind`: never stance, destination, target or another layer's timer.
   - It draws nothing from the combat RNG: a battle with it observing is the same battle as one without.
   Mechanism, not dice: every check here is a deterministic consequence of the rules above. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
function load(r, file) {
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
const SEED = +(process.env.HARNESS_SEED || 12345);
const near = (a, b, tol, what) =>
  assert.ok(Math.abs(a - b) <= tol, `${what || 'value'}: ${a} vs ${b} (±${tol})`);

/* A world with one US squad. The men not under test are parked 20 m away: close enough that nobody is
   isolated, far enough that nobody is a neighbour, and never ticked, so they carry no stress. */
function world(opts) {
  opts = opts || {};
  H.resetIds();
  const r = H.bootstrap();
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  if (opts.mode) r.BattleSoldierMind.configure(opts.mode);
  const b = H.makeBattle(r, { seed: SEED, obstacles: opts.obstacles || [] });
  const us = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 100 },
    facing: 0,
    seed: SEED
  });
  const us2 = H.addSquad(r, b, {
    id: 'us-1',
    faction: 'us',
    x: 200,
    z: 0,
    objective: { x: 200, z: 100 },
    facing: 0,
    seed: SEED + 2
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
  us2.members.forEach((s, i) => put(s, 200 + 0.5 * i, 20));
  ge.members.forEach((s, i) => put(s, 0.5 * i, 400));
  b.time = 10;
  return { r, b, M: r.BattleSoldierMind, S: r.SquadAI, us, us2, ge };
}
function put(s, x, z) {
  s.root.position.x = x;
  s.root.position.z = z;
}
function man(sq, role, skip) {
  return sq.members.filter(s => s.role === role && !s.dead)[skip || 0];
}
/* Tick men over `seconds` of AI time (0.15 s steps) on one shared clock, optionally doing something
   before each step. A man ticked alone is `run`. */
function runAll(ctx, men, seconds, before) {
  for (let t = 0; t < seconds - 1e-9; t += H.AI_TICK) {
    ctx.b.time += H.AI_TICK;
    if (before) before(ctx.b.time);
    men.forEach(s => ctx.M.tick(s, ctx.b));
  }
}
const run = (ctx, s, seconds, before) => runAll(ctx, [s], seconds, before);
/* Stress a man gained from one event, undone for his nerve: stress * nerve. */
const felt = (M, s) => M.stress(s) * M.of(s).nerve;

test('the mind hooks the soldier tick and the aimed-fire slot, and is off cleanly with ?mind=0', () => {
  const ctx = world();
  assert.equal(ctx.S.extensionOrder.beforeSoldier[0], 'soldier-mind');
  assert.deepEqual(ctx.S.extensionOrder.aimedAt, ['soldier-events']); // the queue's producer; the mind drains it
  const s = man(ctx.us, 'rifleman');
  ctx.b.time += H.AI_TICK;
  ctx.S.updateSoldier(s, ctx.b);
  assert.ok(s.mind && s.mind.v === 1, 'a soldier tick creates his mind through the declared slot');
  const off = world({ mode: '?mind=0' }),
    o = man(off.us, 'rifleman');
  off.b.time += H.AI_TICK;
  off.S.updateSoldier(o, off.b);
  assert.equal(o.mind, undefined, 'with the module off no state is kept at all');
  assert.equal(off.M.reactScale(o), 1);
});

test('recent incoming status is shipping-default only; observe and named-lever arms stay isolated', () => {
  const ctx = world(),
    s = man(ctx.us, 'rifleman');
  ctx.M.of(s).lastIncomingAt = 9;
  assert.equal(ctx.M.recentIncoming(s, 10, 3), true, 'default/all tactics may read recent incoming status');
  ctx.M.configure('?mind=observe');
  assert.equal(ctx.M.recentIncoming(s, 10, 3), false, 'observe keeps state but changes no decision');
  ctx.M.configure('?mind=react');
  assert.equal(ctx.M.recentIncoming(s, 10, 3), false, 'a named lever arm contains only the named lever');
  ctx.M.configure('?mind=all');
  assert.equal(ctx.M.recentIncoming(s, 10, 3), true, 'explicit all restores shipping status reads');
});

test('nerve is a hash of the man, never the RNG: the same man has the same nerve, a leader is steadier', () => {
  const a = world(),
    b = world();
  a.us.members.forEach((s, i) => assert.equal(a.M.of(s).nerve, b.M.of(b.us.members[i]).nerve));
  const all = a.us.members.concat(a.ge.members).map(s => a.M.of(s).nerve);
  all.forEach(v => assert.ok(v > 0.85 && v < 1.4, 'nerve stays in a plausible band: ' + v));
  assert.ok(new Set(all.map(v => v.toFixed(4))).size > 3, 'and men differ');
  const sgt = a.us.members.find(s => s.role === 'sergeant');
  assert.ok(a.M.of(sgt).nerve > 1.15 * 0.88 - 1e-9, 'the leader carries his +15% into the band');
});

test('a spell of suppression adds stress at its rate, and it decays back with no help', () => {
  const ctx = world(),
    s = man(ctx.us, 'rifleman');
  run(ctx, s, 0.15); // his first tick only starts the clock
  ctx.S.pin(s, ctx.b, 3.1); // the pin the wound model and the ballistics module call
  run(ctx, s, 3);
  const peak = ctx.M.stress(s);
  near(felt(ctx.M, s), 0.05 * 3, 0.03, 'three seconds suppressed');
  let last = peak;
  for (let i = 0; i < 44; i++) {
    run(ctx, s, 1.5);
    assert.ok(ctx.M.stress(s) <= last + 1e-12, 'with nothing happening stress never rises');
    last = ctx.M.stress(s);
  }
  assert.ok(last < peak * 0.06, `66 s later it is nearly gone: ${peak} -> ${last}`);
});

test('a friend going down is felt by distance, more in his own squad, and not by enemies, the far or the blind', () => {
  const wall = { x: 0, z: 10, y: 0, radius: 3, height: 4, cover: 0.3, type: 'wall' };
  const ctx = world({ obstacles: [wall] }),
    fallen = man(ctx.us, 'rifleman', 0);
  put(fallen, 0, 0);
  const A = man(ctx.us, 'rifleman', 1), // 3 m, same squad
    B = man(ctx.us, 'rifleman', 2), // 20 m, same squad, wall between: cannot see it
    C = man(ctx.us, 'rifleman', 3), // 40 m: too far
    D = man(ctx.us, 'gunner', 0), // 6 m behind the wall: within arm's reach of the sound, no sight test
    E = man(ctx.us2, 'rifleman', 0), // another squad, 5 m
    G = man(ctx.ge, 'rifleman', 0); // an enemy, 3 m
  put(A, 3, 0);
  put(B, 0, 20);
  put(C, 40, 0);
  put(D, 0, 6);
  put(E, 5, 0);
  put(G, 3, 1);
  runAll(ctx, [A, B, C, D, E, G], 0.15);
  ctx.b.killSoldier(fallen);
  runAll(ctx, [A, B, C, D, E, G], 0.15);
  const T = ctx.M.tuning;
  near(felt(ctx.M, A), T.FRIEND_DOWN * 1.3, 0.005, 'squadmate at 3 m');
  assert.ok(felt(ctx.M, E) > 0 && felt(ctx.M, E) < felt(ctx.M, A), 'another squad at 5 m is felt, but less');
  assert.ok(felt(ctx.M, D) > 0, "inside arm's reach a wall does not hide it");
  assert.equal(B.mind.gained.friendDown, 0, "beyond arm's reach a wall does");
  assert.equal(C.mind.gained.friendDown, 0, 'too far to see or hear');
  assert.equal(G.mind.gained.friendDown, 0, 'an enemy falling is not a friend falling');
  /* And nearer is felt more: the same squad, no wall. */
  const c2 = world(),
    f2 = man(c2.us, 'rifleman', 0),
    near3 = man(c2.us, 'rifleman', 1),
    far20 = man(c2.us, 'rifleman', 2);
  put(f2, 0, 0);
  put(near3, 3, 0);
  put(far20, 0, 20);
  runAll(c2, [near3, far20], 0.15);
  c2.b.killSoldier(f2);
  runAll(c2, [near3, far20], 0.15);
  assert.ok(felt(c2.M, near3) > felt(c2.M, far20) && felt(c2.M, far20) > 0, 'nearer, more');
});

test('a witness is told once per casualty, and each casualty separately', () => {
  const ctx = world(),
    s = man(ctx.us, 'rifleman', 0),
    a = man(ctx.us, 'rifleman', 1),
    b2 = man(ctx.us, 'rifleman', 2);
  put(s, 0, 0);
  put(a, 2, 0);
  put(b2, 0, 2);
  run(ctx, s, 0.15);
  ctx.b.killSoldier(a);
  run(ctx, s, 0.15);
  const one = ctx.M.stress(s);
  assert.ok(one > 0);
  run(ctx, s, 3); // many more ticks, no new casualty
  assert.ok(ctx.M.stress(s) < one, 'a casualty adds stress once, then only decays');
  const later = ctx.M.stress(s);
  ctx.b.killSoldier(b2);
  run(ctx, s, 0.15);
  assert.ok(ctx.M.stress(s) > later + 0.1, 'a second casualty adds to the first');
});

test('the squad leader going down is heard by the whole squad, and shocks those close by', () => {
  const ctx = world(),
    leader = ctx.S.leaderOf(ctx.us),
    a = man(ctx.us, 'rifleman', 0), // 25 m: sees it
    b2 = man(ctx.us, 'rifleman', 1), // 50 m: hears it
    c = man(ctx.us, 'rifleman', 2), // 70 m: beyond earshot
    other = man(ctx.us2, 'rifleman', 0);
  put(leader, 0, 0);
  put(a, 25, 0);
  put(b2, 50, 0);
  put(c, 70, 0);
  put(other, 20, 0);
  runAll(ctx, [a, b2, c, other], 0.15);
  ctx.b.killSoldier(leader);
  runAll(ctx, [a, b2, c, other], 0.15);
  const T = ctx.M.tuning;
  near(felt(ctx.M, a), T.LEADER_DOWN, 0.005, 'squadmate at 25 m');
  near(felt(ctx.M, b2), T.LEADER_DOWN, 0.005, 'squadmate at 50 m hears it');
  assert.equal(c.mind.gained.leaderDown + c.mind.gained.friendDown, 0, 'beyond earshot');
  assert.ok(felt(ctx.M, other) < T.LEADER_DOWN, "another squad's man treats it as any friend going down");
  assert.ok(a.mind.shockUntil > ctx.b.time - 0.15, 'the man within 30 m is shocked');
  assert.equal(b2.mind.shockUntil, 0, 'the man at 50 m is not');
});

test('a wound and aimed rounds add stress; range decides how much a round counts', () => {
  const ctx = world(),
    s = man(ctx.us, 'rifleman', 0),
    shooter = man(ctx.ge, 'rifleman', 0);
  run(ctx, s, 0.15);
  s.wounds = [{ zone: 'arm', at: ctx.b.time, by: shooter.id }];
  ctx.r.BattleSoldierEvents.post(s, ctx.b, 'wound', { count: 1 }); // what the wound model posts
  run(ctx, s, 0.15);
  near(felt(ctx.M, s), ctx.M.tuning.WOUNDED, 0.005, 'one wound');
  run(ctx, s, 0.15);
  near(felt(ctx.M, s), ctx.M.tuning.WOUNDED, 0.01, 'the same wound is not counted twice');
  const t = world(),
    near30 = man(t.us, 'rifleman', 0),
    far290 = man(t.us, 'rifleman', 1),
    beyond = man(t.us, 'rifleman', 2);
  runAll(t, [near30, far290, beyond], 0.15);
  t.b.random = () => 0.999; // every round misses: only the being-aimed-at is under test
  const fire = (victim, d) => {
    shooter.target = victim;
    shooter.fireCooldown = 0;
    put(shooter, victim.root.position.x, victim.root.position.z + d);
    t.b.time += 0.001;
    assert.equal(t.S.tryFire(shooter, t.b), true);
  };
  fire(near30, 30);
  fire(far290, 290);
  fire(beyond, 400);
  runAll(t, [near30, far290, beyond], 0.15);
  assert.ok(
    near30.mind.incomingRounds >= 1 && far290.mind.incomingRounds >= 1,
    'tryFire tells the man he was aimed at'
  );
  assert.ok(
    felt(t.M, near30) > felt(t.M, far290) * 20,
    'a round from 30 m counts far more than one from 290 m'
  );
  assert.equal(beyond.mind.gained.incoming, 0, 'a round from 400 m does not register at all');
});

test('recovery: the leader near and cover speed it up, being under fire slows it', () => {
  const rock = { x: 0, z: 0, y: 0, radius: 1.3, height: 1, cover: 0.55, type: 'rock' };
  function after(cond) {
    const ctx = world({ obstacles: cond === 'cover' ? [rock] : [] }),
      s = man(ctx.us, 'rifleman', 0);
    put(s, 0, 0);
    if (cond === 'leader') put(ctx.S.leaderOf(ctx.us), 5, 0);
    run(ctx, s, 0.15);
    s.mind.stress = 0.6;
    s.mind.pub = 0.6;
    if (cond === 'cover')
      assert.ok(
        ctx.r.BattleObstacleField.coverPotentialAt(ctx.b.obstacles, 0, 0) <= 0.88,
        'the fixture really is cover'
      );
    run(ctx, s, 20, () => {
      if (cond === 'fire') s.mind.lastIncomingAt = ctx.b.time;
    });
    return ctx.M.stress(s);
  }
  const base = after('base'),
    leader = after('leader'),
    cover = after('cover'),
    fire = after('fire');
  assert.ok(leader < base, `the leader near: ${leader} < ${base}`);
  assert.ok(cover < base, `in cover: ${cover} < ${base}`);
  assert.ok(fire > base, `under fire: ${fire} > ${base}`);
  near(base, 0.6 * Math.exp(-20 / 22), 0.02, 'unaided decay follows tau');
});

test('a neighbour who is worse off spreads fear, but never past himself, and never faster than the cap', () => {
  const ctx = world(),
    calm = man(ctx.us, 'rifleman', 0),
    scared = man(ctx.us, 'rifleman', 1);
  put(calm, 0, 0);
  put(scared, 5, 0);
  runAll(ctx, [calm, scared], 0.15);
  scared.mind.stress = scared.mind.pub = 0.9;
  scared.mind.band = 3;
  run(ctx, calm, 600, () => {
    scared.mind.stress = scared.mind.pub = 0.9; // he stays as bad as he was
  });
  assert.ok(ctx.M.stress(calm) > 0.1, 'fear spreads to the man beside him');
  assert.ok(ctx.M.stress(calm) < 0.9, 'but not past the man who has it');
  const c2 = world(),
    a = man(c2.us, 'rifleman', 0),
    b2 = man(c2.us, 'rifleman', 1);
  put(a, 0, 0);
  put(b2, 5, 0);
  runAll(c2, [a, b2], 0.15);
  b2.mind.stress = b2.mind.pub = 1;
  b2.mind.band = 3;
  run(c2, a, 10, () => {
    b2.mind.stress = b2.mind.pub = 1;
  });
  assert.ok(
    c2.M.stress(a) <= c2.M.tuning.CONTAGION * 1 * 10 + 1e-9,
    'ten seconds beside a broken man adds at most CONTAGION a second'
  );
  assert.ok(c2.M.stress(a) > 0.1, 'and it does add');
  const c3 = world(),
    lone = man(c3.us, 'rifleman', 0),
    calmNeighbour = man(c3.us, 'rifleman', 1);
  put(lone, 0, 0);
  put(calmNeighbour, 5, 0);
  runAll(c3, [lone, calmNeighbour], 0.15);
  lone.mind.stress = lone.mind.pub = 0.5;
  calmNeighbour.mind.pub = 0.1;
  run(c3, lone, 5);
  assert.ok(c3.M.stress(lone) < 0.5, 'a steadier neighbour does not raise anyone');
});

test('stress stays in [0, 1], and bands have hysteresis: no flapping around a threshold', () => {
  const ctx = world(),
    s = man(ctx.us, 'rifleman', 0);
  put(s, 0, 0);
  const flock = ctx.us.members.filter(x => x !== s);
  flock.slice(0, 6).forEach((x, i) => put(x, 1 + i, 0));
  run(ctx, s, 0.15);
  flock.slice(0, 6).forEach(x => ctx.b.killSoldier(x));
  run(ctx, s, 0.15);
  assert.ok(ctx.M.stress(s) <= 1 && ctx.M.stress(s) > 0.5, 'six friends down at once: high but capped at 1');
  assert.ok(s.mind.peak <= 1);
  const t = world(),
    m = man(t.us, 'rifleman', 0);
  put(m, 0, 0);
  run(t, m, 0.15);
  m.mind.stress = 0.35;
  let flips = 0,
    band = m.mind.band;
  run(t, m, 200, () => {
    if (m.mind.band !== band) {
      flips++;
      band = m.mind.band;
    }
  });
  assert.ok(flips <= 2, `one rise into shaken and one fall out of it, no flapping (${flips})`);
  const u = world(),
    k = man(u.us, 'rifleman', 0);
  put(k, 0, 0);
  run(u, k, 0.15);
  k.mind.stress = 0.4;
  run(u, k, 0.15);
  assert.equal(u.M.band(k), 'shaken');
  k.mind.stress = 0.27; // below the 0.30 that raised it, above the 0.24 that lowers it
  run(u, k, 0.15);
  assert.equal(u.M.band(k), 'shaken', 'inside the hysteresis gap it stays put');
  k.mind.stress = 0.2;
  run(u, k, 0.15);
  assert.equal(u.M.band(k), 'steady');
});

test('levers are neutral off, monotone in stress, and hesitation stays under the bound window', () => {
  const on = world(),
    s = man(on.us, 'rifleman', 0),
    obs = world({ mode: '?mind=observe' }),
    o = man(obs.us, 'rifleman', 0);
  [on, obs].forEach((ctx, k) => {
    const x = k ? o : s;
    put(x, 0, 0);
    run(ctx, x, 0.15);
  });
  let lastR = 1,
    lastA = 1,
    lastH = 0;
  for (let v = 0; v <= 1.0001; v += 0.1) {
    s.mind.stress = o.mind.stress = v;
    assert.ok(
      on.M.reactScale(s) >= lastR && on.M.aimSigma(s) >= lastA && on.M.hesitation(s) >= lastH,
      'monotone'
    );
    lastR = on.M.reactScale(s);
    lastA = on.M.aimSigma(s);
    lastH = on.M.hesitation(s);
    assert.equal(obs.M.reactScale(o), 1, 'observing: no lever moves');
    assert.equal(obs.M.aimSigma(o), 1);
    assert.equal(obs.M.hesitation(o), 0);
    assert.equal(obs.M.shockUntil(o), 0);
  }
  s.mind.stress = 0;
  assert.equal(on.M.reactScale(s), 1);
  assert.equal(on.M.aimSigma(s), 1);
  assert.equal(on.M.hesitation(s), 0, 'a calm man does not hesitate');
  s.mind.stress = 1;
  assert.ok(
    on.M.hesitation(s) <= on.M.tuning.MAX_HESITATION + 1e-9 && on.M.tuning.MAX_HESITATION < 3.6,
    'under the 3.6 s bound window'
  );
  assert.ok(on.M.reactScale(s) <= 1 + on.M.tuning.REACT_GAIN + 1e-9);
  const one = world({ mode: '?mind=react' });
  const t = man(one.us, 'rifleman', 0);
  put(t, 0, 0);
  run(one, t, 0.15);
  t.mind.stress = 0.8;
  assert.ok(one.M.reactScale(t) > 1);
  assert.equal(one.M.aimSigma(t), 1, 'only the lever asked for');
  assert.equal(one.M.hesitation(t), 0);
});

test('the squad aggregate counts men by band', () => {
  const ctx = world(),
    men = ctx.us.members.slice(0, 5);
  men.forEach((s, i) => put(s, i * 20, 0));
  runAll(ctx, men, 0.15);
  [0.1, 0.4, 0.6, 0.9, 0.1].forEach((v, i) => (men[i].mind.stress = v));
  runAll(ctx, men, 0.3);
  ctx.b.time += 0.15;
  ctx.M.tick(men[0], ctx.b);
  const q = ctx.us.mind;
  assert.equal(q.n, 5);
  assert.equal(q.shaken + q.rattled + q.broken >= 2, true);
  assert.ok(q.max >= 0.7 && q.mean > 0.2 && q.mean < 0.7);
});

/* The Squad Leader reads `squad.mind` next, so it must not report men who are gone. A squad with no living
   man ticks nobody, so the roll-up that ran on a man's tick never ran for it again. */
test('a squad with no living man is rolled up over nobody, not left holding the men who are gone', () => {
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
    systems = {};
  r.BattleModules = {
    registerSystem: (id, s) => (systems[id] = s),
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  load(r, 'battle/modules/08-soldier-events.js');
  load(r, 'battle/modules/17-soldier-mind.js');
  const M = r.BattleSoldierMind,
    hook = systems['soldier-mind'],
    b = H.makeBattle(r, { seed: SEED }),
    squad = (id, x, seed) =>
      H.addSquad(r, b, { id, faction: 'us', x, z: 0, objective: { x, z: 100 }, facing: 0, seed }),
    wiped = squad('us-0', 0, SEED),
    absorbed = squad('us-1', 200, SEED + 2),
    held = squad('us-2', 400, SEED + 3);
  [wiped, absorbed, held].forEach(q =>
    q.members.forEach((s, i) => {
      put(s, q.rally.x + 0.5 * i, 20);
    })
  );
  b.time = 10;
  for (let i = 0; i < 2; i++) {
    b.time += H.AI_TICK;
    [wiped, absorbed, held].forEach(q => q.members.forEach(s => M.tick(s, b)));
  }
  for (const q of [wiped, absorbed, held]) assert.equal(q.mind.n, 10, q.id + ' is rolled up over its men');
  [0.2, 0.5, 0.9].forEach((v, i) => (wiped.members[i].mind.stress = v));

  wiped.members.forEach(s => b.killSoldier(s, null)); // wiped out
  absorbed.members = []; // absorbed by a reconstitution merge (commander-ai mergeGroup empties the list)
  held.members.slice(1).forEach(s => b.killSoldier(s, null)); // one man left standing
  b.time += H.AI_TICK;
  hook.onSimulationStep(b);

  for (const q of [wiped, absorbed]) {
    const m = q.mind;
    assert.deepEqual(
      [m.n, m.mean, m.max, m.shaken, m.rattled, m.broken],
      [0, 0, 0, 0, 0, 0],
      q.id + ' has no one, so its roll-up says so'
    );
    assert.equal(m.at, b.time, q.id + ' is stamped with when it was found empty');
  }
  const at = wiped.mind.at;
  b.time += 3;
  hook.onSimulationStep(b);
  assert.equal(wiped.mind.at, at, 'settled once: the empty roll-up is not rewritten every step');

  assert.equal(held.mind.n, 10, 'a squad with a man standing is left to his own tick');
  b.time += H.AI_TICK;
  M.tick(held.members[0], b);
  assert.equal(held.mind.n, 1, 'and his next tick rolls it up over the one man');

  const off = H.bootstrap({ modules: false });
  off.BattleModules = { registerSystem() {}, unitsFor: () => [] };
  load(off, 'battle/modules/08-soldier-events.js');
  load(off, 'battle/modules/17-soldier-mind.js');
  off.BattleSoldierMind.configure('?mind=0');
  const stale = { members: [], mind: { n: 4, at: 1 } };
  off.BattleSoldierMind.settle({ time: 9, factions: { us: { squads: [stale] }, ge: { squads: [] } } });
  assert.equal(stale.mind.n, 4, 'with ?mind=0 the module touches nothing');
});

test('the module writes only `mind`: stance, destination, target and suppression are untouched', () => {
  const ctx = world(),
    s = man(ctx.us, 'rifleman', 0),
    e = man(ctx.us, 'rifleman', 1);
  put(s, 0, 0);
  put(e, 3, 0);
  s.destination = { x: 9, z: 9 };
  s.target = man(ctx.ge, 'rifleman', 0);
  ctx.S.pin(s, ctx.b, 5);
  s.prone = true;
  const keep = () =>
    JSON.stringify([
      s.destination,
      s.prone,
      s.crawling,
      s.tacticalCrouch,
      s.crouching,
      s.suppressedUntil,
      s.target && s.target.id,
      s.state,
      s.eng,
      s.speed
    ]);
  const before = keep();
  run(ctx, s, 0.15);
  ctx.b.killSoldier(e);
  s.wounds = [{ zone: 'chest', at: ctx.b.time }];
  ctx.r.BattleSoldierEvents.post(s, ctx.b, 'wound', { count: 1 });
  run(ctx, s, 3);
  assert.equal(keep(), before);
  assert.ok(ctx.M.stress(s) > 0.2, 'and it did register the events');
});

test('reset wipes every mind and the battle log', () => {
  const ctx = world(),
    s = man(ctx.us, 'rifleman', 0);
  run(ctx, s, 0.15);
  ctx.b.killSoldier(man(ctx.us, 'rifleman', 1));
  run(ctx, s, 0.15);
  assert.ok(s.mind && ctx.b._soldierEvents.log.length === 1);
  ctx.M.reset(ctx.b);
  ctx.r.BattleSoldierEvents.reset(ctx.b);
  assert.equal(s.mind, null);
  assert.equal(ctx.b._soldierEvents, null);
  assert.equal(s._eventQueue, null);
});

/* A whole 10 v 10 firefight, once per mode: the module observing must not move a single thing the battle
   does. `observe` keeps all the state and reads none of it; `off` keeps none. They must end identically,
   draw the same number of combat-RNG values, and so prove the module draws none. */
function battleFingerprint(mode, seed) {
  H.resetIds();
  /* `?fireControl=0`: the Squad Leader's return-fire exception reads `recentIncoming`, a declared status read
     (READERS, lever null) that is false with `?mind=0` and live under `observe` by design, so with fire control
     on the two modes are not the same battle whenever a man is shot at during a hold (seen once men stayed in
     the fight for the whole engagement). This test is about the stress levers. */
  const r = H.bootstrap({ search: '?fireControl=0' });
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  r.BattleSoldierMind.configure(mode);
  const b = H.makeBattle(r, { seed });
  let draws = 0;
  const rnd = b.random;
  b.random = function () {
    draws++;
    return rnd.call(b);
  };
  H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: -45, objective: { x: 0, z: 45 }, facing: 0, seed });
  H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: 45,
    objective: { x: 0, z: -45 },
    facing: Math.PI,
    seed: seed + 1
  });
  H.run(r, b, 60);
  const men = b._roster.us.concat(b._roster.ge);
  return {
    draws,
    fired: b.events.fired,
    hits: b.events.hits,
    print: men
      .map(s =>
        [
          s.id,
          s.dead ? 1 : 0,
          s.hp.toFixed(3),
          s.root.position.x.toFixed(3),
          s.root.position.z.toFixed(3),
          s.state
        ].join(':')
      )
      .join('|'),
    minds: men.filter(s => s.mind).length,
    stressed: men.filter(s => s.mind && s.mind.peak > 0).length,
    b,
    r
  };
}
test('a battle with the module observing is the same battle as one without it, and it draws no combat RNG', () => {
  const off = battleFingerprint('?mind=0', SEED),
    obs = battleFingerprint('?mind=observe', SEED);
  assert.equal(off.minds, 0, 'off: no state');
  assert.ok(obs.minds > 0 && obs.stressed > 0, 'observe: state was kept and something registered');
  assert.equal(obs.draws, off.draws, 'the same number of combat-RNG draws');
  assert.equal(obs.fired, off.fired);
  assert.equal(obs.hits, off.hits);
  assert.equal(obs.print, off.print, 'every man ends where he was, as healthy as he was');
});
test('the same battle twice with every lever on is the same battle (deterministic)', () => {
  const a = battleFingerprint('?mind=1', SEED),
    b = battleFingerprint('?mind=1', SEED);
  assert.equal(a.print, b.print);
  assert.equal(a.draws, b.draws);
});
console.log(n + ' soldier-mind checks passed');
