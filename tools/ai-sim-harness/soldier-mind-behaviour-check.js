#!/usr/bin/env node
'use strict';
/* What stress costs a man (module 17's levers, read by Engagement and the shot model).

   - react:    recognition takes longer (Engagement.reactTime and the orient window it opens);
   - aim:      his shot group is wider (the ballistic shot model's dispersion);
   - hesitate: an ordered bound waits for him, never long enough to lose the order (3.6 s window);
   - shock:    what he just saw stops his trigger finger and, if he is only advancing, stops him, for
               a second or less, and he crouches.
   Each lever is separately switchable and neutral when off, so a paired benchmark can attribute an
   effect to one of them. Engagement still owns stance and combat movement: the mind only supplies
   numbers. Mechanism, not dice: every case presets stress and reads what the rules then do. */
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
function duel(mode, gap) {
  H.resetIds();
  const r = H.bootstrap();
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  load(r, 'battle/modules/14-z-ballistic-raycast.js');
  if (mode) r.BattleSoldierMind.configure(mode);
  const b = H.makeBattle(r, { seed: SEED });
  gap = gap || 60;
  const us = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: -gap / 2,
    objective: { x: 0, z: 200 },
    facing: 0,
    composition: ['rifleman'],
    seed: SEED
  });
  const ge = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: gap / 2,
    objective: { x: 0, z: -200 },
    facing: Math.PI,
    composition: ['rifleman'],
    seed: SEED + 1
  });
  return {
    r,
    b,
    E: r.BattleEngagement,
    M: r.BattleSoldierMind,
    S: r.SquadAI,
    us,
    ge,
    man: us.members[0],
    foe: ge.members[0]
  };
}
function stress(ctx, s, v) {
  const m = ctx.M.of(s);
  m.stress = m.pub = v;
}
function tick(ctx, s) {
  ctx.b.time += H.AI_TICK;
  ctx.S.updateSoldier(s, ctx.b);
}

test('react: recognition takes longer in proportion to stress, and only with the lever on', () => {
  const ctx = duel();
  const calm = ctx.E.reactTime(ctx.man, ctx.b);
  stress(ctx, ctx.man, 0.8);
  const rattled = ctx.E.reactTime(ctx.man, ctx.b);
  assert.ok(
    Math.abs(rattled / calm - ctx.M.reactScale(ctx.man)) < 1e-9,
    'exactly the scale the mind reports'
  );
  assert.ok(rattled > calm * 1.3, `a rattled man is slow to recognise: ${calm} -> ${rattled}`);
  for (const mode of ['?mind=observe', '?mind=aim,hesitate,shock']) {
    const off = duel(mode);
    const base = off.E.reactTime(off.man, off.b);
    stress(off, off.man, 0.8);
    assert.equal(off.E.reactTime(off.man, off.b), base, mode + ': lever off, recognition unchanged');
  }
});

test('react: the orient window and the first shot both stretch, so he cannot fire before he has recognised', () => {
  function orientFor(v) {
    const ctx = duel('?mind=react', 60);
    stress(ctx, ctx.man, v);
    ctx.man.target = ctx.foe;
    tick(ctx, ctx.man);
    const e = ctx.E.stateOf(ctx.man);
    assert.equal(e.state, 'orient', 'contact opens the orient state');
    return { window: e.until - e.since, ready: e.fireReadyAt - e.since };
  }
  const calm = orientFor(0),
    rattled = orientFor(0.8);
  assert.ok(rattled.window > calm.window * 1.3, `orient window ${calm.window} -> ${rattled.window}`);
  assert.ok(rattled.ready >= calm.ready * 1.3 - 1e-9, `earliest shot ${calm.ready} -> ${rattled.ready}`);
  assert.ok(rattled.ready >= rattled.window - 0.2, 'and he is not allowed to shoot before the window ends');
});

test('a new threat sector re-orients him at the same stretched pace', () => {
  const ctx = duel('?mind=react', 60);
  stress(ctx, ctx.man, 0.8);
  const e = ctx.E.stateOf(ctx.man);
  ctx.man.target = ctx.foe;
  e.state = 'engage';
  e.threatSector = 0; // he had been facing another way
  ctx.b.time += H.AI_TICK;
  ctx.E.updateSoldier(ctx.man, ctx.b); // Engagement alone, so the mind does not decay the preset
  assert.equal(e.state, 'orient');
  const calm = duel('?mind=react', 60),
    ce = calm.E.stateOf(calm.man);
  calm.man.target = calm.foe;
  ce.state = 'engage';
  ce.threatSector = 0;
  calm.b.time += H.AI_TICK;
  calm.E.updateSoldier(calm.man, calm.b);
  assert.ok(e.until - e.since > (ce.until - ce.since) * 1.3, 're-orienting is slower too');
});

test('aim: the shot group widens with stress, only with the lever on', () => {
  const ctx = duel('?mind=aim');
  const stats = ctx.man.weapon.stats,
    B = ctx.r.BattleBallistics;
  const calm = B.dispersionSigma(ctx.man, stats, 100, ctx.b, 0);
  stress(ctx, ctx.man, 0.8);
  const rattled = B.dispersionSigma(ctx.man, stats, 100, ctx.b, 0);
  assert.ok(Math.abs(rattled / calm - ctx.M.aimSigma(ctx.man)) < 1e-9, 'exactly the factor the mind reports');
  assert.ok(rattled > calm * 1.4);
  stress(ctx, ctx.man, 1);
  assert.ok(B.dispersionSigma(ctx.man, stats, 100, ctx.b, 0) > rattled, 'worse still when broken');
  for (const mode of ['?mind=observe', '?mind=react,hesitate,shock']) {
    const off = duel(mode);
    const base = B.dispersionSigma(off.man, off.man.weapon.stats, 100, off.b, 0);
    stress(off, off.man, 1);
    assert.equal(
      off.r.BattleBallistics.dispersionSigma(off.man, off.man.weapon.stats, 100, off.b, 0),
      base,
      mode
    );
  }
});

/* An ordered bound: the Squad Leader's lease is 3.6 s and the order dies with it. */
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
  return ctx.b.time;
}
function startedBound(ctx, s, v, seconds) {
  const at = orderBound(ctx, s);
  for (let t = 0; t < seconds; t += H.AI_TICK) {
    stress(ctx, s, v);
    tick(ctx, s);
    const st = ctx.E.stateOf(s).state;
    if (st === 'assault' || st === 'bound') return ctx.b.time - at;
  }
  return null;
}
test('hesitate: a steady man bounds at once, a rattled one waits, none waits past the lease', () => {
  const c1 = duel('?mind=hesitate');
  const t0 = startedBound(c1, c1.man, 0, 3.6);
  assert.ok(t0 !== null && t0 <= H.AI_TICK + 1e-9, `a steady man goes on the next tick (${t0})`);
  const c2 = duel('?mind=hesitate');
  const t9 = startedBound(c2, c2.man, 0.9, 3.6);
  const want = c2.M.tuning.MAX_HESITATION;
  assert.ok(t9 !== null, 'a rattled man still goes: the order stands while he steels himself');
  assert.ok(
    t9 >= 2.2 * (0.9 - 0.35) - H.AI_TICK && t9 <= want + 2 * H.AI_TICK,
    `he waited about ${(2.2 * 0.55).toFixed(2)} s (${t9})`
  );
  assert.ok(t9 < 3.6, 'inside the bound window');
  assert.equal(c2.man.mind.hesitations, 1, 'counted once');
  const c3 = duel('?mind=hesitate');
  const t10 = startedBound(c3, c3.man, 1, 3.6);
  assert.ok(
    t10 !== null && t10 <= want + 2 * H.AI_TICK && t10 < 3.6,
    `even broken he goes within the window (${t10})`
  );
  const off = duel('?mind=observe');
  const toff = startedBound(off, off.man, 1, 3.6);
  assert.ok(toff !== null && toff <= H.AI_TICK + 1e-9, 'lever off: no waiting at all');
});

test('hesitate: an order that lapsed while he waited is dropped, and does not carry into the next one', () => {
  const ctx = duel('?mind=hesitate');
  orderBound(ctx, ctx.man);
  const e = ctx.E.stateOf(ctx.man);
  stress(ctx, ctx.man, 1);
  tick(ctx, ctx.man);
  assert.ok(e.boundWaitFrom > 0, 'he is waiting');
  ctx.r.BattleLeases.end(ctx.man.squad, 'bound', ctx.b.time, 'contact broken');
  ctx.E.clearBoundOrders(ctx.man.squad);
  tick(ctx, ctx.man);
  assert.equal(e.boundWaitFrom, 0, 'the wait is forgotten with the order');
  assert.notEqual(e.state, 'assault');
});

/* Shock. The man has no target and a formation slot ahead of him: normally he walks. */
function marching(mode) {
  const ctx = duel(mode, 400);
  ctx.foe.root.position.z = 5000; // nobody in sight
  ctx.man.root.position.z = 0;
  tick(ctx, ctx.man);
  return ctx;
}
test('shock: a man who has just seen a friend fall does not fire for the moment it lasts', () => {
  const ctx = duel('?mind=shock', 60);
  ctx.man.target = ctx.foe;
  ctx.man.fireCooldown = 0;
  const e = ctx.E.stateOf(ctx.man);
  e.state = 'engage';
  e.fireReadyAt = 0;
  ctx.man.root.rotation.y = 0;
  ctx.b.time += 5;
  assert.equal(ctx.E.fireAllowed(ctx.man, ctx.b), true, 'nothing else stops him');
  ctx.M.of(ctx.man).shockUntil = ctx.b.time + 0.8;
  assert.equal(ctx.E.fireAllowed(ctx.man, ctx.b), false, 'shocked: no aimed fire');
  ctx.b.time += 0.9;
  assert.equal(ctx.E.fireAllowed(ctx.man, ctx.b), true, 'and it passes');
  const off = duel('?mind=react,aim,hesitate', 60);
  off.man.target = off.foe;
  off.man.fireCooldown = 0;
  off.E.stateOf(off.man).state = 'engage';
  off.b.time += 5;
  off.M.of(off.man).shockUntil = off.b.time + 0.8;
  assert.equal(off.E.fireAllowed(off.man, off.b), true, 'lever off: a shocked man fires as before');
});

test('shock: a man who is only advancing stops and crouches for it, then goes on', () => {
  const ctx = marching('?mind=shock');
  const p = ctx.man.root.position;
  ctx.M.of(ctx.man).shockUntil = ctx.b.time + 0.8;
  tick(ctx, ctx.man);
  assert.ok(
    Math.hypot(ctx.man.destination.x - p.x, ctx.man.destination.z - p.z) < 0.5,
    'his destination is where he stands'
  );
  assert.equal(ctx.man.tacticalCrouch, true, 'he is down on one knee');
  ctx.b.time += 1;
  tick(ctx, ctx.man);
  tick(ctx, ctx.man);
  assert.ok(
    Math.hypot(ctx.man.destination.x - p.x, ctx.man.destination.z - p.z) > 1,
    'once it passes he has somewhere to go again'
  );
  const off = marching('?mind=react');
  const q = off.man.root.position;
  off.M.of(off.man).shockUntil = off.b.time + 0.8;
  tick(off, off.man);
  assert.ok(
    Math.hypot(off.man.destination.x - q.x, off.man.destination.z - q.z) > 1,
    'lever off: he keeps walking'
  );
});

test('shock: a man ordered to bound does not start one while frozen', () => {
  const ctx = duel('?mind=shock');
  orderBound(ctx, ctx.man);
  ctx.M.of(ctx.man).shockUntil = ctx.b.time + 0.5;
  tick(ctx, ctx.man);
  assert.ok(['assault', 'bound'].indexOf(ctx.E.stateOf(ctx.man).state) < 0, 'frozen, he stays put');
});

/* All levers together across a whole firefight: they act, and they act on real men. */
test('over a 10 v 10 firefight the levers fire: men freeze, and hesitate before bounds, and none of it throws', () => {
  let shocks = 0,
    scaled = 0;
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
    H.run(r, b, 90, () => {
      for (const s of b._roster.us.concat(b._roster.ge))
        if (!s.dead && s.mind && r.BattleSoldierMind.reactScale(s) > 1.05) scaled++;
    });
    for (const s of b._roster.us.concat(b._roster.ge)) if (s.mind) shocks += s.mind.shocks;
  }
  assert.ok(scaled > 0, 'some men were slowed by stress at some point');
  assert.ok(shocks > 0, 'and some froze');
});
console.log(n + ' soldier-mind behaviour checks passed');
