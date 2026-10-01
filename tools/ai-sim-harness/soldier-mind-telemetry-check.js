#!/usr/bin/env node
'use strict';
/* What the benchmark's `stress` block counts (module 17: `noteReact`, `noteAim`, `noteBound`, `noteLapse`,
   `noteShock`, `step`, `telemetry`), and that counting it changes nothing.

   - A lever's decision is counted where it is made, once: a recognition when it begins (not each tick of the
     orient window), a round when it leaves the muzzle, a bound when it starts (and whether it waited), an
     order that ended while he waited, and each decision the freeze blocked, by which decision it was.
   - The freeze is counted only when it alone stopped the decision: a man who could not have fired anyway
     (reloading, not aimed, still settling, moving) is not a shock decision. Engagement asks the same
     question in the same set of conditions as before, so its answer is the same in every combination.
   - With a lever off nothing it would have changed is counted; with `?mind=0` nothing is kept.
   - The series has one row per side per simulated second, in the named columns, cumulative where it counts,
     and squads are "over" at mean stress 1/3 with an entry marker at the simulated second they cross.
   - Counting draws no combat RNG and writes nothing but the man's own `mind`.
   Mechanism, not dice: each case presets stress and reads what the rules then do. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
const SEED = +(process.env.HARNESS_SEED || 12345);
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
/* One US rifleman and one German rifleman `gap` metres apart, facing each other, open ground. */
function duel(mode, gap, seed) {
  seed = seed || SEED;
  H.resetIds();
  const r = H.bootstrap();
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  load(r, 'battle/modules/14-z-ballistic-raycast.js');
  if (mode) r.BattleSoldierMind.configure(mode);
  const b = H.makeBattle(r, { seed });
  gap = gap || 60;
  const us = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: -gap / 2,
    objective: { x: 0, z: 200 },
    facing: 0,
    composition: ['rifleman'],
    seed
  });
  const ge = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: gap / 2,
    objective: { x: 0, z: -200 },
    facing: Math.PI,
    composition: ['rifleman'],
    seed: seed + 1
  });
  return {
    r,
    b,
    E: r.BattleEngagement,
    M: r.BattleSoldierMind,
    S: r.SquadAI,
    B: r.BattleBallistics,
    us,
    ge,
    man: us.members[0],
    foe: ge.members[0]
  };
}
/* He is at this stress in this band (what a condition tick would have made of it). */
function stress(ctx, s, v) {
  const m = ctx.M.of(s);
  m.stress = m.pub = v;
  m.band = v >= 0.8 ? 3 : v >= 0.55 ? 2 : v >= 0.3 ? 1 : 0;
  m.at = ctx.b.time;
}
function tick(ctx, s) {
  ctx.b.time += H.AI_TICK;
  ctx.S.updateSoldier(s, ctx.b);
}
const D = (ctx, s, lever) => ctx.M.of(s).decided[lever];
const near = (a, b, tol, what) =>
  assert.ok(Math.abs(a - b) <= tol, `${what || 'value'}: ${a} vs ${b} (±${tol})`);

/* ---------------------------------------------------------------------------------------------- */
/* react */

test('react: a recognition is counted when it begins, stretched or not, by the band he was in', () => {
  const ctx = duel();
  const calm = ctx.E.reactTime(ctx.man, ctx.b);
  let d = D(ctx, ctx.man, 'react');
  assert.equal(d.total, 0, 'he has no condition yet: nothing to count it on');
  stress(ctx, ctx.man, 0);
  ctx.E.reactTime(ctx.man, ctx.b);
  d = D(ctx, ctx.man, 'react');
  assert.deepEqual([d.total, d.changed, d.mag], [1, 0, 0], 'a calm man: counted, not changed');
  stress(ctx, ctx.man, 0.6);
  const secs = ctx.E.reactTime(ctx.man, ctx.b);
  assert.deepEqual([d.total, d.changed], [2, 1]);
  assert.deepEqual(d.byBand, [0, 0, 1, 0], 'rattled at 0.6');
  near(d.mag, secs - secs / ctx.M.reactScale(ctx.man), 1e-9, 'the seconds stress added');
  assert.ok(secs > calm, 'and it is the stretched time he is given');
  assert.equal(d.at, ctx.b.time, 'the AI time it first changed one');
});

test('react: the orient window is one recognition however many ticks it lasts, and a new sector is another', () => {
  const ctx = duel('?mind=react', 60);
  stress(ctx, ctx.man, 0.6);
  ctx.man.target = ctx.foe;
  for (let i = 0; i < 4; i++) {
    ctx.b.time += H.AI_TICK;
    ctx.E.updateSoldier(ctx.man, ctx.b); // Engagement alone, so the preset stress stays
    stress(ctx, ctx.man, 0.6);
  }
  assert.equal(ctx.E.stateOf(ctx.man).state, 'orient');
  assert.equal(
    D(ctx, ctx.man, 'react').total,
    1,
    'the window re-asks the pace each tick; it is one recognition'
  );
  const e = ctx.E.stateOf(ctx.man);
  e.state = 'engage';
  e.threatSector = 0; // he had been facing another way
  ctx.b.time += H.AI_TICK;
  ctx.E.updateSoldier(ctx.man, ctx.b);
  assert.equal(e.state, 'orient');
  assert.equal(D(ctx, ctx.man, 'react').total, 2, 'a new threat sector re-orients him: a second recognition');
  assert.equal(D(ctx, ctx.man, 'react').changed, 2);
});

test('react: with the lever off nothing is changed, and with the module off nothing is kept', () => {
  for (const mode of ['?mind=observe', '?mind=aim,hesitate,shock']) {
    const ctx = duel(mode);
    stress(ctx, ctx.man, 0.9);
    ctx.E.reactTime(ctx.man, ctx.b);
    const d = D(ctx, ctx.man, 'react');
    assert.deepEqual([d.total, d.changed, d.mag], [1, 0, 0], mode);
  }
  const off = duel('?mind=0');
  off.E.reactTime(off.man, off.b);
  assert.equal(off.man.mind, undefined, 'no condition is created for a counter');
  assert.deepEqual(off.M.telemetry(off.b), {
    format: 'grasstex-stress-v1',
    mode: 'off',
    levers: [],
    sampleSeconds: 1,
    off: true
  });
});

/* ---------------------------------------------------------------------------------------------- */
/* aim */

test('aim: each round counts once; it is changed when his group is wider, by exactly the factor', () => {
  const ctx = duel('?mind=aim', 120);
  /* A round may kill the man it is fired at, and the model does not fire at the dead: stand him up again, so
     the count is about rounds and not about where they landed. */
  const hp = ctx.foe.hp;
  const round = (n, delay) => {
    ctx.foe.dead = false;
    ctx.foe.hp = hp;
    return ctx.B.resolve(ctx.man, ctx.foe, ctx.b, n, delay);
  };
  stress(ctx, ctx.man, 0);
  round(0, 0);
  let d = D(ctx, ctx.man, 'aim');
  assert.deepEqual([d.total, d.changed, d.mag], [1, 0, 0], 'a calm round');
  stress(ctx, ctx.man, 0.9);
  round(0, 0);
  round(1, 0.1);
  d = D(ctx, ctx.man, 'aim');
  assert.deepEqual([d.total, d.changed], [3, 2], 'a burst is a count per round');
  assert.deepEqual(d.byBand, [0, 0, 0, 2]);
  near(d.mag, 2 * (ctx.M.aimSigma(ctx.man) - 1), 1e-9, 'sigma added, per round');
  const probe = ctx.B.dispersionSigma(ctx.man, ctx.man.weapon.stats, 100, ctx.b, 0);
  assert.equal(D(ctx, ctx.man, 'aim').total, 3, 'asking the model for a number is not a round');
  assert.ok(probe > 0);
  const off = duel('?mind=observe', 120);
  stress(off, off.man, 0.9);
  off.B.resolve(off.man, off.foe, off.b, 0, 0);
  d = D(off, off.man, 'aim');
  assert.deepEqual([d.total, d.changed], [1, 0], 'lever off: counted, not changed');
});

/* ---------------------------------------------------------------------------------------------- */
/* hesitate */

function orderBound(ctx, s) {
  const sq = s.squad,
    L = ctx.r.BattleLeases;
  sq.inContact = true;
  sq._assaultAuthorized = true;
  sq.commandPhase = 'assault';
  L.grant(sq, 'bound', 'squad-leader', ctx.b.time, ctx.b.time + 3.6, 'test bound', 'window expiry', {
    team: 'alpha'
  });
  ctx.E.orderBound([s]);
}
function untilBound(ctx, s, v, seconds) {
  for (let t = 0; t < seconds; t += H.AI_TICK) {
    stress(ctx, s, v);
    tick(ctx, s);
    const st = ctx.E.stateOf(s).state;
    if (st === 'assault' || st === 'bound') return true;
  }
  return false;
}
test('hesitate: a bound start is counted; it is changed when he waited, by the seconds he waited', () => {
  const steady = duel('?mind=hesitate');
  orderBound(steady, steady.man);
  assert.ok(untilBound(steady, steady.man, 0, 3.6));
  let d = D(steady, steady.man, 'hesitate');
  assert.deepEqual(
    [d.total, d.changed, d.mag, steady.man.mind.lapsed],
    [1, 0, 0, 0],
    'a steady man goes at once'
  );
  const shaky = duel('?mind=hesitate');
  orderBound(shaky, shaky.man);
  const from = shaky.b.time;
  assert.ok(untilBound(shaky, shaky.man, 0.9, 3.6));
  d = D(shaky, shaky.man, 'hesitate');
  assert.deepEqual([d.total, d.changed], [1, 1]);
  assert.deepEqual(d.byBand, [0, 0, 0, 1], 'broken at 0.9');
  near(
    d.mag,
    shaky.b.time - from - H.AI_TICK,
    H.AI_TICK + 1e-9,
    'the seconds between the order and the bound'
  );
  assert.ok(
    d.mag > 0.5 && d.mag <= shaky.M.tuning.MAX_HESITATION + H.AI_TICK,
    'about what the lever asks, never past its cap'
  );
  assert.equal(shaky.man.mind.hesitations, 1, 'the wait itself is still counted once, as before');
  const off = duel('?mind=observe');
  orderBound(off, off.man);
  assert.ok(untilBound(off, off.man, 1, 3.6));
  d = D(off, off.man, 'hesitate');
  assert.deepEqual([d.total, d.changed, d.mag], [1, 0, 0], 'lever off: he goes at once, nothing changed');
});

test('hesitate: an order that ended while he waited is a lapse, and no bound is counted', () => {
  const ctx = duel('?mind=hesitate');
  orderBound(ctx, ctx.man);
  stress(ctx, ctx.man, 1);
  tick(ctx, ctx.man);
  assert.ok(ctx.E.stateOf(ctx.man).boundWaitFrom > 0, 'he is waiting');
  ctx.r.BattleLeases.end(ctx.man.squad, 'bound', ctx.b.time, 'contact broken');
  ctx.E.clearBoundOrders(ctx.man.squad);
  assert.equal(ctx.man.mind.lapsed, 1, 'the wait ended without a bound');
  assert.equal(D(ctx, ctx.man, 'hesitate').total, 0, 'so no bound was counted');
  ctx.E.clearBoundOrders(ctx.man.squad);
  assert.equal(ctx.man.mind.lapsed, 1, 'clearing again counts nothing: there is no wait left');
  const idle = duel('?mind=hesitate');
  stress(idle, idle.man, 0.2);
  idle.E.clearBoundOrders(idle.man.squad);
  assert.equal(idle.man.mind.lapsed, 0, 'a man who was not waiting lapses nothing');
});

/* ---------------------------------------------------------------------------------------------- */
/* shock */

/* Everything but the freeze lets him fire: a target in his cone, settled, not moving, not reloading. */
function readyToFire(mode) {
  const ctx = duel(mode, 60);
  ctx.man.target = ctx.foe;
  ctx.man.fireCooldown = 0;
  const e = ctx.E.stateOf(ctx.man);
  e.state = 'engage';
  e.fireReadyAt = 0;
  ctx.man.root.rotation.y = 0;
  ctx.b.time += 5;
  stress(ctx, ctx.man, 0.7);
  return ctx;
}
const freeze = (ctx, s, secs) => (ctx.M.of(s).shockUntil = ctx.b.time + secs);

test('shock: a freeze that alone stopped a shot is counted as a fire decision, once per evaluation', () => {
  const ctx = readyToFire('?mind=shock');
  assert.equal(ctx.E.fireAllowed(ctx.man, ctx.b), true);
  assert.equal(D(ctx, ctx.man, 'shock').changed, 0, 'nothing stopped him: nothing counted');
  freeze(ctx, ctx.man, 0.8);
  assert.equal(ctx.E.fireAllowed(ctx.man, ctx.b), false);
  assert.equal(ctx.E.fireAllowed(ctx.man, ctx.b), false);
  const d = D(ctx, ctx.man, 'shock');
  assert.equal(d.changed, 2, 'one per decision it blocked');
  assert.deepEqual(ctx.man.mind.shockKinds, { fire: 2, suppress: 0, bound: 0, advance: 0 });
  assert.deepEqual(
    d.byBand,
    [0, 0, 1, 0].map((x, i) => (i === 2 ? 2 : 0)),
    'in the band he was in: rattled at 0.7'
  );
  ctx.b.time += 0.9;
  assert.equal(ctx.E.fireAllowed(ctx.man, ctx.b), true, 'and it passes');
  assert.equal(d.changed, 2);
});

test('shock: a freeze is not counted when something else stopped the decision', () => {
  const cases = [
    ['still settling', ctx => (ctx.E.stateOf(ctx.man).fireReadyAt = ctx.b.time + 1)],
    ['reloading', ctx => (ctx.man.reloading = true)],
    ['no target', ctx => (ctx.man.target = null)],
    ['moving too fast', ctx => ((ctx.man.moving = true), (ctx.man.moveSpeed = 5))],
    ['crawling', ctx => (ctx.man.crawling = true)],
    ['facing away', ctx => (ctx.man.root.rotation.y = Math.PI)]
  ];
  for (const [why, stop] of cases) {
    const ctx = readyToFire('?mind=shock');
    stop(ctx);
    freeze(ctx, ctx.man, 0.8);
    assert.equal(ctx.E.fireAllowed(ctx.man, ctx.b), false, why);
    assert.equal(D(ctx, ctx.man, 'shock').changed, 0, why + ': the freeze did not decide it');
  }
  const off = readyToFire('?mind=react,aim,hesitate');
  freeze(off, off.man, 0.8);
  assert.equal(off.E.fireAllowed(off.man, off.b), true, 'lever off: a frozen man fires as before');
  assert.equal(D(off, off.man, 'shock').changed, 0);
});

test('shock: asking whether he may fire gives the answer it always did, in every combination of conditions', () => {
  /* The answer, written out the way it read before the freeze moved to the end of the list. */
  const was = (ctx, s) => {
    const e = ctx.E.stateOf(s);
    if (!s.target || s.target.dead || s.reloading) return false;
    if (ctx.b.time < e.fireReadyAt || ctx.b.time < ctx.M.shockUntil(s)) return false;
    const fast = !!(s.moving && (s.moveSpeed || 0) > Math.max(0.16, (s.speed || 1) * 0.12));
    if (fast || s.crawling) return false;
    if (ctx.E.facingError(s, s.target.root.position) > ctx.E.tuning.AIM_CONE) return false;
    if (ctx.S.isMachineGun(s) && !s.setUp && e.state === 'engage') return false;
    return true;
  };
  let asked = 0,
    allowed = 0;
  for (const target of [true, false])
    for (const reloading of [false, true])
      for (const settling of [false, true])
        for (const frozen of [false, true])
          for (const crawling of [false, true])
            for (const moving of [false, true])
              for (const away of [false, true]) {
                const ctx = readyToFire('?mind=shock');
                const s = ctx.man,
                  e = ctx.E.stateOf(s);
                s.target = target ? ctx.foe : null;
                s.reloading = reloading;
                e.fireReadyAt = settling ? ctx.b.time + 1 : 0;
                if (frozen) freeze(ctx, s, 0.8);
                s.crawling = crawling;
                s.moving = moving;
                s.moveSpeed = moving ? 5 : 0;
                s.root.rotation.y = away ? Math.PI : 0;
                const want = was(ctx, s),
                  got = ctx.E.fireAllowed(s, ctx.b);
                assert.equal(
                  got,
                  want,
                  JSON.stringify({ target, reloading, settling, frozen, crawling, moving, away })
                );
                asked++;
                if (got) allowed++;
                const counted = D(ctx, s, 'shock').changed;
                const onlyTheFreeze =
                  frozen && !want && target && !reloading && !settling && !crawling && !moving && !away;
                assert.equal(
                  counted,
                  onlyTheFreeze ? 1 : 0,
                  'counted exactly when the freeze alone stopped it'
                );
              }
  assert.equal(asked, 128);
  assert.ok(allowed > 0 && allowed < asked, 'the matrix has both answers');
});

test('shock: a burst of suppression the freeze stopped is counted, and only when nothing before it would have', () => {
  const ctx = readyToFire('?mind=shock');
  const point = { x: 0, z: 30 };
  freeze(ctx, ctx.man, 0.8);
  assert.equal(ctx.E.suppress(ctx.man, ctx.b, point), false);
  assert.deepEqual(ctx.man.mind.shockKinds, { fire: 0, suppress: 1, bound: 0, advance: 0 });
  const paused = readyToFire('?mind=shock');
  paused.E.stateOf(paused.man).burstPauseUntil = paused.b.time + 1;
  freeze(paused, paused.man, 0.8);
  assert.equal(paused.E.suppress(paused.man, paused.b, point), false);
  assert.equal(D(paused, paused.man, 'shock').changed, 0, 'in its burst pause anyway: not the freeze');
  const away = readyToFire('?mind=shock');
  away.man.root.rotation.y = Math.PI;
  freeze(away, away.man, 0.8);
  assert.equal(away.E.suppress(away.man, away.b, point), false);
  assert.equal(D(away, away.man, 'shock').changed, 0, 'not facing the sector: not the freeze');
  const calm = readyToFire('?mind=shock');
  calm.E.suppress(calm.man, calm.b, point);
  assert.equal(D(calm, calm.man, 'shock').changed, 0, 'no freeze: nothing counted');
});

test('shock: a frozen man who was ordered to bound, or only marching, is counted by which decision it was', () => {
  const ctx = duel('?mind=shock');
  orderBound(ctx, ctx.man);
  stress(ctx, ctx.man, 0.6);
  freeze(ctx, ctx.man, 0.5);
  tick(ctx, ctx.man);
  assert.equal(ctx.man.mind.shockKinds.bound, 1, 'the bound he did not start');
  assert.equal(ctx.man.mind.shockKinds.advance, 0);
  const march = duel('?mind=shock', 400);
  march.foe.root.position.z = 5000;
  tick(march, march.man);
  stress(march, march.man, 0.6);
  freeze(march, march.man, 0.8);
  tick(march, march.man);
  assert.equal(march.man.mind.shockKinds.advance, 1, 'the march he did not make');
  assert.equal(D(march, march.man, 'shock').changed, 1);
});

/* ---------------------------------------------------------------------------------------------- */
/* What counting must not do. */

test("counting draws no combat RNG and writes nothing but the man's own condition", () => {
  const ctx = readyToFire('?mind=1');
  let draws = 0;
  const real = ctx.b.random;
  ctx.b.random = function () {
    draws++;
    return real.call(ctx.b);
  };
  const s = ctx.man;
  const before = JSON.stringify(
    Object.assign({}, s, { mind: null, squad: null, root: null, target: null, weapon: null, secondary: null })
  );
  const eng = JSON.stringify(ctx.E.stateOf(s));
  const dest = JSON.stringify(s.destination);
  ctx.M.noteReact(s, 0.9);
  ctx.M.noteAim(s);
  ctx.M.noteBound(s, 1.1);
  ctx.M.noteLapse(s);
  ctx.M.noteShock(s, 'fire');
  ctx.M.noteShock(s, 'nowhere'); // a kind nobody declared is ignored, not stored
  assert.equal(draws, 0, 'no random number');
  assert.equal(
    JSON.stringify(
      Object.assign({}, s, {
        mind: null,
        squad: null,
        root: null,
        target: null,
        weapon: null,
        secondary: null
      })
    ),
    before
  );
  assert.equal(JSON.stringify(ctx.E.stateOf(s)), eng, "Engagement's record is not touched");
  assert.equal(JSON.stringify(s.destination), dest);
  assert.deepEqual(Object.keys(s.mind.shockKinds), ['fire', 'suppress', 'bound', 'advance']);
  assert.equal(s.mind.shockKinds.fire, 1);
});

test('a man with no condition yet, or a module that is off, is counted nowhere and throws nowhere', () => {
  const ctx = duel('?mind=1');
  const s = ctx.man;
  assert.equal(s.mind, undefined);
  for (const f of [
    () => ctx.M.noteReact(s, 1),
    () => ctx.M.noteAim(s),
    () => ctx.M.noteBound(s, 1),
    () => ctx.M.noteLapse(s),
    () => ctx.M.noteShock(s, 'fire')
  ])
    f();
  assert.equal(s.mind, undefined, 'a note never creates a condition');
  for (const f of [
    () => ctx.M.noteReact(null, 1),
    () => ctx.M.noteAim(undefined),
    () => ctx.M.noteShock({}, 'fire')
  ])
    f();
  const off = duel('?mind=0');
  stress(off, off.man, 0.9); // a condition exists, the module is off
  off.M.noteReact(off.man, 1);
  off.M.noteShock(off.man, 'fire');
  off.M.noteBound(off.man, 2);
  assert.deepEqual(
    [D(off, off.man, 'react').total, D(off, off.man, 'shock').changed, D(off, off.man, 'hesitate').total],
    [0, 0, 0]
  );
});

/* ---------------------------------------------------------------------------------------------- */
/* The series and the block. */

/* Two squads a side, nobody ticked: the series reads what the men carry. */
function world(mode) {
  H.resetIds();
  const r = H.bootstrap();
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  load(r, 'battle/modules/14-z-ballistic-raycast.js');
  if (mode) r.BattleSoldierMind.configure(mode);
  const b = H.makeBattle(r, { seed: SEED });
  const sq = (id, faction, x, z) =>
    H.addSquad(r, b, { id, faction, x, z, objective: { x, z: 100 }, facing: 0, seed: SEED + x });
  const us0 = sq('us-0', 'us', 0, 0),
    us1 = sq('us-1', 'us', 200, 0),
    ge0 = sq('ge-0', 'ge', 0, 400);
  b.time = 10;
  return { r, b, M: r.BattleSoldierMind, us0, us1, ge0 };
}
const advance = (ctx, seconds) => {
  for (let t = 0; t < seconds - 1e-9; t += H.AI_TICK) {
    ctx.b.time += H.AI_TICK;
    ctx.M.step(ctx.b);
  }
};
const condition = (ctx, squad, v) => squad.members.forEach(s => stress(ctx, s, v));
const roll = (squad, n, mean) =>
  (squad.mind = { at: 0, n, mean, max: mean, shaken: 0, rattled: 0, broken: 0 });

test('the series takes one row per side per simulated second, in the declared columns', () => {
  const ctx = world('?mind=1');
  condition(ctx, ctx.us0, 0.6);
  condition(ctx, ctx.ge0, 0.1);
  ctx.us0.members[0].mind.shocks = 2;
  advance(ctx, 30);
  const out = ctx.M.telemetry(ctx.b),
    ser = out.series;
  assert.equal(ser.t.length, ser.us.length);
  assert.equal(ser.t.length, ser.ge.length);
  assert.ok(ser.t.length >= 29 && ser.t.length <= 34, 'about a row a second: ' + ser.t.length);
  for (let i = 1; i < ser.t.length; i++) {
    const gap = ser.t[i] - ser.t[i - 1];
    assert.ok(gap >= 0.85 && gap <= 1.2, `rows a simulated second apart (${gap})`);
  }
  assert.deepEqual(ser.columns, [
    'men',
    'mean',
    'max',
    'shaken',
    'rattled',
    'broken',
    'squadsOver',
    'squads',
    'react',
    'aim',
    'hesitate',
    'shock',
    'shocks',
    'contact'
  ]);
  for (const row of ser.us.concat(ser.ge)) assert.equal(row.length, ser.columns.length);
  const last = ser.us[ser.us.length - 1];
  assert.equal(last[0], 10, 'the ten living men who have a condition (the other squad was never ticked)');
  assert.equal(last[2], 0.6, 'the worst man');
  assert.deepEqual([last[3], last[4], last[5]], [0, 10, 0], 'all ten rattled');
  assert.equal(last[12], 2, 'shocks so far, cumulative');
  const geLast = ser.ge[ser.ge.length - 1];
  assert.deepEqual([geLast[0], geLast[3], geLast[4], geLast[5]], [10, 0, 0, 0]);
  near(geLast[1], 0.1, 1e-9, 'the side mean');
  assert.equal(out.sampleSeconds, 1);
});

test('men whose squad is in contact are counted apart: a column a second, and their seconds by band', () => {
  const ctx = world('?mind=1');
  condition(ctx, ctx.us0, 0.6);
  condition(ctx, ctx.ge0, 0.1);
  advance(ctx, 5);
  let out = ctx.M.telemetry(ctx.b);
  assert.deepEqual(
    out.contactBandSeconds,
    { steady: 0, shaken: 0, rattled: 0, broken: 0 },
    'nobody in contact yet'
  );
  assert.equal(out.series.us.slice(-1)[0][13], 0);
  ctx.us0.inContact = true;
  advance(ctx, 10);
  out = ctx.M.telemetry(ctx.b);
  assert.equal(out.series.us.slice(-1)[0][13], 10, 'ten men in a squad in contact');
  assert.equal(out.series.ge.slice(-1)[0][13], 0);
  near(out.contactBandSeconds.rattled, 100, 12, 'ten men for about ten seconds, rattled');
  assert.equal(
    out.contactBandSeconds.steady + out.contactBandSeconds.shaken + out.contactBandSeconds.broken,
    0
  );
  assert.deepEqual(out.bySide.ge.contactBandSeconds, { steady: 0, shaken: 0, rattled: 0, broken: 0 });
  assert.equal(out.bySide.us.contactBandSeconds.rattled, out.contactBandSeconds.rattled);
  ctx.us0.inContact = false;
  advance(ctx, 5);
  const after = ctx.M.telemetry(ctx.b);
  assert.equal(
    after.contactBandSeconds.rattled,
    out.contactBandSeconds.rattled,
    'out of contact, nothing more is added'
  );
  const dead = ctx.us0.members[0];
  ctx.us0.inContact = true;
  ctx.b.killSoldier(dead, null);
  advance(ctx, 2);
  assert.equal(ctx.M.telemetry(ctx.b).series.us.slice(-1)[0][13], 9, 'the dead are not in contact');
});

test('the dead are out of the men and the bands, but the shocks they had stay in the count', () => {
  const ctx = world('?mind=1');
  condition(ctx, ctx.us0, 0.6);
  const dead = ctx.us0.members[1];
  dead.mind.shocks = 3;
  advance(ctx, 2);
  const before = ctx.M.telemetry(ctx.b).series.us.slice(-1)[0];
  ctx.b.killSoldier(dead, null);
  advance(ctx, 2);
  const after = ctx.M.telemetry(ctx.b).series.us.slice(-1)[0];
  assert.equal(after[0], before[0] - 1, 'one man fewer');
  assert.equal(after[4], before[4] - 1, 'and one fewer in the band');
  assert.equal(after[12], before[12], 'his shocks are still counted');
});

test('a squad is over at mean 1/3: an entry marker at the simulated second, seconds over, and only for living squads', () => {
  const ctx = world('?mind=1');
  roll(ctx.us0, 10, 0.2);
  roll(ctx.us1, 10, 0.2);
  roll(ctx.ge0, 10, 0.2);
  advance(ctx, 5);
  assert.deepEqual(ctx.M.telemetry(ctx.b).squads.us, {
    squads: 2,
    over: 0,
    overSeconds: 0,
    entries: 0,
    peakMean: 0.2,
    with3: { over: 0, overSeconds: 0, entries: 0 }
  });
  roll(ctx.us0, 10, 1 / 3);
  advance(ctx, 0.15);
  const t1 = ctx.b.time;
  advance(ctx, 10);
  let out = ctx.M.telemetry(ctx.b);
  assert.equal(out.squads.us.over, 1, 'exactly 1/3 counts: the threshold is at or above');
  assert.equal(out.squads.us.entries, 1);
  assert.ok(
    out.squads.us.overSeconds >= 9 && out.squads.us.overSeconds <= 11.5,
    'about ten squad-seconds: ' + out.squads.us.overSeconds
  );
  assert.equal(out.markers.length, 1);
  assert.equal(out.markers[0].kind, 'squad-stress-over');
  assert.equal(out.markers[0].n, 10, 'with the living men it had when it crossed');
  assert.deepEqual(
    [out.squads.us.with3.over, out.squads.us.with3.entries, out.squads.minMen],
    [1, 1, 3],
    'ten men is a squad with a say'
  );
  assert.ok(Math.abs(out.squads.us.with3.overSeconds - out.squads.us.overSeconds) < 1e-9);
  assert.deepEqual([out.markers[0].side, out.markers[0].squad], ['us', 'us-0']);
  assert.ok(
    out.markers[0].t >= t1 - 0.2 && out.markers[0].t <= t1 + 1.1,
    'stamped at the second it crossed: ' + out.markers[0].t
  );
  assert.equal(out.series.us.slice(-1)[0][6], 1, 'squadsOver in the row');
  assert.equal(out.series.us.slice(-1)[0][7], 2, 'of two living squads');
  assert.equal(out.squads.overMean, 0.333);
  roll(ctx.us0, 10, 0.1);
  advance(ctx, 3);
  roll(ctx.us0, 10, 0.5);
  advance(ctx, 3);
  out = ctx.M.telemetry(ctx.b);
  assert.equal(out.squads.us.entries, 2, 'a second crossing is a second entry');
  assert.equal(out.squads.us.over, 1, 'of the one squad');
  assert.equal(out.markers.length, 2);
  assert.equal(out.squads.ge.over, 0);
  roll(ctx.us0, 2, 0.9); // two men left and badly shaken: over, but the mean of two men is noise
  advance(ctx, 3);
  out = ctx.M.telemetry(ctx.b);
  assert.equal(out.squads.us.over, 1);
  assert.ok(
    out.squads.us.overSeconds > out.squads.us.with3.overSeconds + 2,
    'counted over, not over with a say'
  );
  assert.equal(out.series.us.slice(-1)[0][6], 1, 'the row counts every squad that is over');
  roll(ctx.us0, 0, 0); // wiped out or merged away: it is nobody's any more
  advance(ctx, 2);
  assert.equal(ctx.M.telemetry(ctx.b).series.us.slice(-1)[0][6], 0, 'a squad with no living man is not over');
});

test('the markers are capped and the overflow is counted, not silently dropped', () => {
  const ctx = world('?mind=1');
  for (let i = 0; i < 130; i++) {
    roll(ctx.us0, 10, 0.5);
    advance(ctx, 1.05);
    roll(ctx.us0, 10, 0.1);
    advance(ctx, 1.05);
  }
  const out = ctx.M.telemetry(ctx.b);
  assert.equal(out.squads.us.entries, 130);
  assert.equal(out.markers.length, 130);
  for (let i = 0; i < 130; i++) {
    roll(ctx.us0, 10, 0.5);
    advance(ctx, 1.05);
    roll(ctx.us0, 10, 0.1);
    advance(ctx, 1.05);
  }
  const more = ctx.M.telemetry(ctx.b);
  assert.equal(more.markers.length, 200, 'capped');
  assert.equal(more.markersDropped, 60, 'and the rest are counted');
  assert.equal(more.squads.us.entries, 260, 'while the squad counts still see every entry');
});

test('the block adds up: sides make the whole, bands make the man-seconds, bands make the changed decisions', () => {
  const ctx = world('?mind=1');
  const a = ctx.us0.members[0],
    c = ctx.ge0.members[0];
  stress(ctx, a, 0.6);
  stress(ctx, c, 0.9);
  ctx.M.noteReact(a, 0.8);
  ctx.M.noteReact(c, 0.8);
  ctx.M.noteShock(a, 'fire');
  ctx.M.noteShock(c, 'bound');
  ctx.M.noteBound(c, 1.5);
  ctx.M.noteLapse(c);
  a.mind.time = [10, 5, 3, 1];
  c.mind.time = [1, 2, 3, 4];
  a.mind.peak = 0.6;
  c.mind.peak = 0.9;
  advance(ctx, 2);
  const out = ctx.M.telemetry(ctx.b);
  assert.equal(out.men, 2, 'the two men who have a condition');
  assert.equal(out.bySide.us.men + out.bySide.ge.men, out.men);
  for (const lever of ctx.M.DECIDED) {
    const d = out.decisions[lever];
    assert.equal(
      d.byBand.reduce((x, y) => x + y, 0),
      d.changed,
      lever + ': bands add to changed'
    );
    assert.equal(
      out.bySide.us.decisions[lever].changed + out.bySide.ge.decisions[lever].changed,
      d.changed,
      lever + ': sides add up'
    );
  }
  assert.deepEqual(out.decisions.shock.kinds, { fire: 1, suppress: 0, bound: 1, advance: 0 });
  assert.equal(out.decisions.shock.total, null, 'the freeze has no denominator');
  assert.equal(out.decisions.hesitate.lapsed, 1);
  assert.deepEqual(out.decisions.react.byBand, [0, 0, 1, 1]);
  assert.equal(out.decisions.react.total, 2);
  assert.equal(
    out.decisions.hesitate.firstAt,
    10,
    'first changed at the AI time of his last condition tick (the preset)'
  );
  assert.equal(out.bySide.ge.bandSeconds.broken, 4);
  assert.deepEqual(out.bandSeconds, { steady: 11, shaken: 7, rattled: 6, broken: 5 });
  assert.equal(out.manSeconds, 29);
  near(
    out.bandShare.steady + out.bandShare.shaken + out.bandShare.rattled + out.bandShare.broken,
    1,
    1e-3,
    'shares'
  );
  assert.deepEqual(out.peakBand, { steady: 0, shaken: 0, rattled: 1, broken: 1 });
});

test('with only the observing mode on the state is kept and no lever changed anything', () => {
  const ctx = world('?mind=observe');
  const out0 = ctx.M.telemetry(ctx.b);
  assert.deepEqual(out0.levers, []);
  assert.equal(out0.mode, 'observe');
  assert.ok(Array.isArray(out0.series.t));
});

test('reset clears the series and the tallies with the battle', () => {
  const ctx = world('?mind=1');
  condition(ctx, ctx.us0, 0.6);
  advance(ctx, 5);
  assert.ok(ctx.M.telemetry(ctx.b).series.t.length > 3);
  ctx.M.reset(ctx.b);
  assert.equal(ctx.b._mindSeries, null);
  assert.equal(ctx.us0.members[0].mind, null);
  advance(ctx, 1);
  assert.ok(ctx.M.telemetry(ctx.b).series.t.length <= 2, 'a new battle starts a new series');
});

test('the block is plain JSON and a full battle of it stays small', () => {
  const ctx = world('?mind=1');
  advance(ctx, 600);
  const text = JSON.stringify(ctx.M.telemetry(ctx.b));
  assert.doesNotThrow(() => JSON.parse(text));
  assert.ok(text.length < 200000, 'under 200 KB for 600 s: ' + text.length);
});

/* ---------------------------------------------------------------------------------------------- */
/* A whole firefight. */

test('over a 10 v 10 firefight every count is consistent and the series tells the same story as the men', () => {
  let saw = { react: 0, aim: 0, shock: 0, rows: 0 };
  for (const seed of [SEED, SEED + 7]) {
    H.resetIds();
    const r = H.bootstrap();
    r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
    load(r, 'battle/modules/14-z-ballistic-raycast.js');
    r.BattleSoldierMind.configure('?mind=1');
    const b = H.makeBattle(r, { seed });
    H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: -45,
      objective: { x: 0, z: 45 },
      facing: 0,
      seed
    });
    H.addSquad(r, b, {
      id: 'ge-0',
      faction: 'ge',
      x: 0,
      z: 45,
      objective: { x: 0, z: -45 },
      facing: Math.PI,
      seed: seed + 1
    });
    H.run(r, b, 90, () => r.BattleSoldierMind.step(b));
    const out = r.BattleSoldierMind.telemetry(b),
      men = b._roster.us.concat(b._roster.ge).filter(s => s.mind);
    for (const lever of r.BattleSoldierMind.DECIDED) {
      const d = out.decisions[lever];
      assert.ok(
        d.changed >= 0 && (d.total == null || d.changed <= d.total),
        lever + ' changed never exceeds what it could change'
      );
      assert.equal(
        d.byBand.reduce((x, y) => x + y, 0),
        d.changed
      );
      assert.equal(
        d.changed,
        men.reduce((x, s) => x + s.mind.decided[lever].changed, 0),
        lever + ': the men carry what the block reports'
      );
      const last =
        out.series.us.slice(-1)[0][8 + r.BattleSoldierMind.DECIDED.indexOf(lever)] +
        out.series.ge.slice(-1)[0][8 + r.BattleSoldierMind.DECIDED.indexOf(lever)];
      assert.equal(last, d.changed, lever + ': the last row is the cumulative count');
    }
    assert.equal(
      out.decisions.shock.changed,
      Object.values(out.decisions.shock.kinds).reduce((x, y) => x + y, 0),
      'shock by kind adds up'
    );
    assert.equal(
      out.shocks,
      men.reduce((x, s) => x + s.mind.shocks, 0)
    );
    for (const row of out.series.us.concat(out.series.ge)) for (const v of row) assert.ok(Number.isFinite(v));
    for (const side of ['us', 'ge']) {
      const col = k => out.series[side].map(row => row[out.series.columns.indexOf(k)]);
      for (const k of ['react', 'aim', 'hesitate', 'shock', 'shocks'])
        col(k).reduce((prev, x) => (assert.ok(x >= prev, `${side} ${k} never falls`), x), 0);
    }
    saw.react += out.decisions.react.total;
    saw.aim += out.decisions.aim.total;
    saw.shock += out.decisions.shock.changed;
    saw.rows += out.series.t.length;
  }
  assert.ok(saw.react > 0 && saw.aim > 0, 'recognitions and rounds were counted');
  assert.ok(saw.rows >= 150, 'a row a second for 2 x 90 s');
});
console.log(n + ' soldier-mind telemetry checks passed');
