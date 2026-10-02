#!/usr/bin/env node
'use strict';
/* What stress does to a man (Engagement, `?stressAct=cower,flee,freeze,rage`): four declared states, each off unless
   named, the numbers from module 17 and the choice Engagement's.

   - The flag parse: all four by default, `?stressAct=0` off, a comma list exact; and no reaction with `?mind=0`, `?mind=observe` or a lever list without `act`.
   - cower: rattled and under fire goes to ground (prone, or crouched for a role that does not go prone), holds, does
     not fire, and gets up when the fire has been quiet for COWER_QUIET or he has calmed below rattled. Not when merely
     shaken, not when nobody is shooting at him.
   - A broken man does one of three things by his temper (fixed unit hashes) weighed against the situation: flee needs
     something to run from, freeze fits being under fire, rage needs an enemy within RAGE_RANGE and a weapon; ties go
     flee, freeze, rage; nothing enabled or nothing with weight means no break.
   - flee leaves his weapons, runs to his squad's last safe point (else its home), never fires, holds when it arrives
     and releases a firing station (the whole of what follows, the wait, the pick-up and the weapon at base, is
     fled-man-check.js); freeze holds, does not fire, scan, track or turn toward contacts, and is not selected as a
     fresh visual threat while dazed; rage charges, fires on the move and strikes at arm's length,
     and ends when nobody is within RAGE_REACH.
   - Freeze duration is a bounded one-time snapshot from recent stress tempo: the same final stress reached abruptly
     lasts longer than a slow simmer, 12..48 s, and expiry forces a reassessment even if he is still broken. Cower/charge
     keep their existing minimums; a flee does not end: he is done with the fight. A squad already retreating is not reacted for.
   - The squad report names the men reacting, they are neither base of fire nor movers, and no station is claimed for
     them.
   - The choice draws nothing from the combat RNG (a blow's roll and the wound do, and nothing else).
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
const load_tuning = () => H.bootstrap({ search: '' }).BattleEngagement.tuning.ACT_TUNING;

/* One US squad at the origin facing +z, one GE squad far off. `q` is the page query. The men not under test are parked
   far enough that nobody is a neighbour. */
function world(q, opts) {
  opts = opts || {};
  H.resetIds();
  const r = H.bootstrap({ search: q == null ? '' : q });
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
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
  const ge = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: 400,
    objective: { x: 0, z: 0 },
    facing: Math.PI,
    seed: SEED + 1
  });
  us.members.forEach((s, i) => put(s, 2 * i, 20));
  ge.members.forEach((s, i) => put(s, 2 * i, 400));
  b.time = 10;
  return { r, b, E: r.BattleEngagement, M: r.BattleSoldierMind, S: r.SquadAI, us, ge };
}
function put(s, x, z) {
  s.root.position.x = x;
  s.root.position.z = z;
}
const man = (sq, role, skip) => sq.members.filter(s => s.role === role && !s.dead)[skip || 0];
/* One AI tick for a man: the condition (module 17) first, as in the page, then Engagement. */
function tick(ctx, s, seconds) {
  for (let t = 0; t < (seconds || H.AI_TICK) - 1e-9; t += H.AI_TICK) {
    ctx.b.time += H.AI_TICK;
    ctx.M.tick(s, ctx.b);
    ctx.E.updateSoldier(s, ctx.b);
  }
}
/* Put a man in a band by setting his stress above the band's entry point, then let one tick settle the band. */
const BAND = { steady: 0, shaken: 0.35, rattled: 0.6, broken: 0.9 };
function stressTo(ctx, s, band) {
  const m = ctx.M.of(s);
  m.stress = BAND[band];
  m.pub = m.stress;
  m.at = ctx.b.time; // no decay across the jump
}
function under(ctx, s, seconds) {
  ctx.S.pin(s, ctx.b, seconds || 2); // suppression: under fire for the module's `underFire`
}
function temper(ctx, s, flee, freeze, rage) {
  ctx.M.of(s).temper = { flee, freeze, rage };
}
function seededTempoFreeze(entries) {
  const ctx = world('?stressAct=freeze'),
    s = man(ctx.us, 'rifleman');
  tick(ctx, s);
  temper(ctx, s, 0, 1, 0);
  const m = ctx.M.of(s);
  m.stress = m.pub = 0.9;
  m.band = 3;
  m.bandSince = ctx.b.time;
  m.at = ctx.b.time;
  m.recentStressors = entries.map(e => ({
    at: ctx.b.time - e.age,
    kind: e.kind || 'suppression',
    gain: e.gain,
    stress: e.stress == null ? 0.1 : e.stress
  }));
  m.lastIncomingAt = ctx.b.time; // situation says stopping fits; this adds no stress by itself
  const g = foe(ctx, s, 80);
  ctx.us.contact = { x: g.root.position.x, z: g.root.position.z, at: ctx.b.time, seenBy: s.id };
  ctx.E.updateSoldier(s, ctx.b);
  assert.equal(s.eng.state, 'freeze');
  return { ctx, s, g };
}
/* An enemy of the man's at distance `d` along +z, as the squad's picture and his own target. */
function foe(ctx, s, d) {
  const g = man(ctx.ge, 'rifleman', 0);
  put(g, s.root.position.x, s.root.position.z + d);
  s.target = g;
  return g;
}
const here = s => ({ x: s.root.position.x, z: s.root.position.z });
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

test('the flag parses: all four by default, 0/off disables, a list is exact, 1/all means all', () => {
  const act = q => world(q).E.tuning.ACT;
  const on = a =>
    Object.keys(a)
      .filter(k => k !== 'any' && a[k])
      .sort();
  assert.deepEqual(on(act('')), ['cower', 'flee', 'freeze', 'rage']);
  assert.equal(act('').any, true);
  assert.deepEqual(on(act('?x=1')), ['cower', 'flee', 'freeze', 'rage']);
  assert.deepEqual(on(act('?stressAct=0')), []);
  assert.deepEqual(on(act('?stressAct=off')), []);
  assert.deepEqual(on(act('?stressAct=1')), ['cower', 'flee', 'freeze', 'rage']);
  assert.deepEqual(on(act('?stressAct=all')), ['cower', 'flee', 'freeze', 'rage']);
  assert.deepEqual(on(act('?stressAct=flee,rage')), ['flee', 'rage']);
  assert.deepEqual(on(act('?stressAct=flee,panic,any')), ['flee']);
  assert.equal(act('?stressAct=freeze').any, true);
  assert.deepEqual(on(act('?mind=react&stressAct=cower')), ['cower']);
});

test('the four states are declared with their transitions, and every other state can enter them', () => {
  const { E } = world('');
  for (const k of ['cower', 'flee', 'freeze', 'rage']) {
    const def = E.states[k];
    assert.ok(def && def.meaning && def.enteredBy && def.exits && def.rate, k + ' is declared');
    assert.ok(def.next.includes('advance'), k + ' can end');
    if (k !== 'flee') assert.ok(def.next.includes('withdraw'), k + ' can retreat');
    else
      assert.deepEqual(
        def.next,
        ['advance'],
        'a fled man ends only at base, a man of a retreating squad again'
      );
  }
  for (const [name, def] of Object.entries(E.states))
    if (!['cower', 'flee', 'freeze', 'rage'].includes(name))
      for (const k of ['cower', 'flee', 'freeze', 'rage']) assert.ok(def.next.includes(k), `${name} -> ${k}`);
  assert.ok(
    E.states.cower.next.includes('flee') && E.states.cower.next.includes('rage'),
    'a cowering man can break'
  );
  assert.equal(typeof E.reacting, 'function');
});

test('explicitly off, nobody reacts, however shaken: stressAct=0, ?mind=0, ?mind=observe and a lever list without act', () => {
  for (const q of [
    '?stressAct=0',
    '?stressAct=all&mind=0',
    '?stressAct=all&mind=observe',
    '?stressAct=all&mind=react,aim,hesitate,shock'
  ]) {
    const ctx = world(q),
      s = man(ctx.us, 'rifleman');
    tick(ctx, s);
    stressTo(ctx, s, 'broken');
    foe(ctx, s, 40);
    under(ctx, s);
    tick(ctx, s, 3);
    assert.equal(ctx.E.reacting(s), false, q);
    assert.ok(!['cower', 'flee', 'freeze', 'rage'].includes(s.eng.state), q + ' ' + s.eng.state);
  }
  /* A flag naming only one reaction leaves the others to the old behaviour. */
  const ctx = world('?stressAct=flee'),
    s = man(ctx.us, 'rifleman');
  tick(ctx, s);
  stressTo(ctx, s, 'rattled');
  foe(ctx, s, 40);
  under(ctx, s);
  tick(ctx, s, 2);
  assert.notEqual(s.eng.state, 'cower', 'cower is not named');
});

test('cower: rattled and under fire goes to ground and holds; shaken, or not under fire, does not', () => {
  const ctx = world('?stressAct=cower'),
    s = man(ctx.us, 'rifleman'),
    sgt = man(ctx.us, 'sergeant');
  tick(ctx, s);
  stressTo(ctx, s, 'shaken');
  foe(ctx, s, 150);
  under(ctx, s);
  tick(ctx, s, 1);
  assert.notEqual(s.eng.state, 'cower', 'shaken is not rattled');
  stressTo(ctx, s, 'rattled');
  s.suppressedUntil = 0;
  ctx.M.of(s).pinnedUntil = 0;
  ctx.M.of(s).lastIncomingAt = -99;
  tick(ctx, s, 0.3);
  assert.notEqual(s.eng.state, 'cower', 'rattled, but nobody is shooting at him');
  under(ctx, s, 2);
  tick(ctx, s, 0.3);
  assert.equal(s.eng.state, 'cower', 'rattled and under fire');
  assert.equal(ctx.E.reacting(s), true);
  assert.equal(s.prone, true, 'a rifleman goes prone');
  const p = here(s);
  tick(ctx, s, 1);
  assert.ok(dist(p, s.destination) < 0.5, 'he holds where he is');
  /* A role that does not go prone crouches. */
  tick(ctx, sgt);
  stressTo(ctx, sgt, 'rattled');
  foe(ctx, sgt, 150);
  under(ctx, sgt, 2);
  tick(ctx, sgt, 0.6);
  assert.equal(sgt.eng.state, 'cower');
  assert.equal(sgt.prone, false);
  assert.equal(sgt.crouching, true, 'crouched');
});

test('cower: no aimed fire from a man on the ground, and he gets up when the fire has been quiet', () => {
  const ctx = world('?stressAct=cower'),
    s = man(ctx.us, 'rifleman');
  tick(ctx, s);
  stressTo(ctx, s, 'rattled');
  const g = foe(ctx, s, 150);
  under(ctx, s, 2);
  let shots = 0;
  const real = ctx.S.tryFire;
  ctx.S.tryFire = (...a) => (shots++, real.apply(ctx.S, a));
  s.fireCooldown = 0;
  tick(ctx, s, 1);
  assert.equal(s.eng.state, 'cower');
  assert.equal(shots, 0, 'no shot');
  /* Keep the stress up but stop the fire: he rises after COWER_QUIET, calm or not. */
  const quiet = ctx.E.tuning.ACT_TUNING.COWER_QUIET;
  ctx.M.of(s).pinnedUntil = 0;
  s.suppressedUntil = 0;
  for (let i = 0; i < Math.ceil((quiet + 4) / H.AI_TICK) && s.eng.state === 'cower'; i++) {
    ctx.M.of(s).stress = 0.6; // held there, as a lasting fight would
    ctx.M.of(s).lastIncomingAt = -99;
    tick(ctx, s);
  }
  assert.notEqual(s.eng.state, 'cower', 'fire quiet for COWER_QUIET: he is up');
  assert.ok(g);
});

/* A broken man. */
function broke(q, tempers, d, opts) {
  opts = opts || {};
  const ctx = world(q),
    s = man(ctx.us, opts.role || 'rifleman');
  if (opts.safe) ctx.us.safePoint = opts.safe;
  tick(ctx, s);
  temper(ctx, s, ...tempers);
  stressTo(ctx, s, 'broken');
  const g = d == null ? null : foe(ctx, s, d);
  s.fireCooldown = 99; // no shot unless a test asks for one: what he decides is under test, not who he hits
  if (opts.fire !== false) under(ctx, s, 2);
  if (d != null) {
    // the squad's picture too, as Perception keeps it
    ctx.us.contact = { x: g.root.position.x, z: g.root.position.z, at: ctx.b.time, seenBy: s.id };
  }
  tick(ctx, s, 0.3);
  return { ctx, s, g };
}

test('a broken man chooses by temper and situation: flee needs trouble, freeze fits fire, rage needs an enemy near', () => {
  let t = broke('?stressAct=flee,freeze,rage', [0.9, 0.2, 0.1], 100);
  assert.equal(t.s.eng.state, 'flee', 'a flee temper with something to run from');
  t = broke('?stressAct=flee,freeze,rage', [0.2, 0.9, 0.1], 100);
  assert.equal(t.s.eng.state, 'freeze', 'a freeze temper');
  t = broke('?stressAct=flee,freeze,rage', [0.2, 0.1, 0.95], 40);
  assert.equal(t.s.eng.state, 'rage', 'a rage temper with an enemy at 40 m');
  t = broke('?stressAct=flee,freeze,rage', [0.2, 0.1, 0.95], 150);
  assert.notEqual(
    t.s.eng.state,
    'rage',
    'at 150 m the charge is out of reach, so something else (RAGE_RANGE 120)'
  );
  assert.ok(['flee', 'freeze'].includes(t.s.eng.state));
  /* Ties go in the order flee, freeze, rage. */
  t = broke('?stressAct=flee,freeze,rage', [0.5, 0.5, 0.5], 40);
  assert.equal(t.s.eng.state, 'flee');
  /* No trouble to run from: a flee temper counts for little, so a lesser freeze temper wins. */
  t = broke('?stressAct=flee,freeze', [0.5, 0.4, 0], null);
  assert.equal(t.s.eng.state, 'freeze', 'running from nothing in particular loses to stopping');
  /* Not under fire: freeze counts for less (FREEZE_NOT_UNDER_FIRE 0.7). */
  t = broke('?stressAct=flee,freeze', [0.6, 0.7, 0], 100, { fire: false });
  assert.equal(t.s.eng.state, 'flee', '0.7 x 0.7 is under 0.6');
  t = broke('?stressAct=flee,freeze', [0.6, 0.9, 0], 100, { fire: false });
  assert.equal(t.s.eng.state, 'freeze', '0.9 x 0.7 is over 0.6');
  /* Only what is named: rage alone with the enemy far leaves him as he was. */
  t = broke('?stressAct=rage', [0.9, 0.9, 0.9], 200);
  assert.equal(t.ctx.E.reacting(t.s), false, 'nothing enabled has weight: no break');
  t = broke('?stressAct=flee', [0.9, 0.9, 0.9], 200);
  assert.equal(t.s.eng.state, 'flee', 'only flee is named');
  /* An unarmed man does not charge. */
  const u = world('?stressAct=rage'),
    us = man(u.us, 'rifleman');
  tick(u, us);
  temper(u, us, 0, 0, 1);
  stressTo(u, us, 'broken');
  foe(u, us, 30);
  us.outOfAmmo = true;
  tick(u, us, 0.3);
  assert.equal(u.E.reacting(us), false, 'no ammunition, no charge');
});

test("flee: he leaves his weapons, runs to the squad's last safe point, never fires and holds when he gets there", () => {
  const safe = { x: 0, z: -40 }, // the quiet place behind him; the threat is ahead, at +z
    { ctx, s, g } = broke('?stressAct=flee', [0.9, 0, 0], 60, { safe });
  assert.equal(s.eng.state, 'flee');
  assert.equal(s.eng.fledPhase, 'run');
  assert.equal(s.state, 'retreat', 'shown as a man on the run (module 11 sprints him)');
  assert.equal(s.weapon, null, 'the weapon stays where he stood');
  assert.deepEqual(s.eng.refuge, safe);
  const p = here(s),
    threat = here(g);
  assert.ok(dist(s.destination, safe) < 1, 'his goal is the safe point');
  assert.ok(dist(s.destination, threat) > dist(p, threat) + 10, 'further from the threat than he is');
  assert.ok(s._combatUrgentUntil > ctx.b.time, 'at a run');
  let shots = 0;
  const real = ctx.S.tryFire;
  ctx.S.tryFire = (...a) => (shots++, real.apply(ctx.S, a));
  s.fireCooldown = 0;
  tick(ctx, s, 2);
  assert.equal(shots, 0, 'a man running does not fire');
  /* He gets there and holds. */
  put(s, safe.x, safe.z);
  tick(ctx, s, 0.6);
  assert.equal(s.eng.state, 'flee', 'still in it');
  assert.equal(s.eng.fledPhase, 'wait', 'waiting for a squad');
  assert.ok(dist(s.destination, safe) < 0.5, 'holding at the refuge');
  assert.equal(s.crouching || s.prone, true, 'down at the refuge');
});

test('flee: the goal stands until he is there, and a man who cannot get there waits where he is', () => {
  const safe = { x: 0, z: -40 },
    { ctx, s, g } = broke('?stressAct=flee', [0.9, 0, 0], 60, { safe }),
    T = ctx.E.tuning.ACT_TUNING;
  assert.equal(s.eng.state, 'flee');
  /* The trouble moves a long way: his goal does not follow it. He makes headway, so no try is counted. */
  put(g, g.root.position.x + 300, g.root.position.z - 300);
  ctx.us.contact = { x: g.root.position.x, z: g.root.position.z, at: ctx.b.time, seenBy: s.id };
  for (let i = 0; i < 10; i++) {
    put(
      s,
      s.root.position.x + (safe.x - s.root.position.x) * 0.1,
      s.root.position.z + (safe.z - s.root.position.z) * 0.1
    );
    s.mind.stress = 0.95;
    tick(ctx, s, 1);
  }
  assert.deepEqual(s.eng.refuge, safe, 'the goal stood while he ran to it');
  assert.equal(s.eng.refugeTries || 0, 0, 'headway, so no try');
  /* Stuck: no headway for FLEE_REPICK, FLEE_TRIES times over, and then he stays where he is. */
  const stuck = broke('?stressAct=flee', [0.9, 0, 0], 100, { safe }); // the enemy is beyond FLED_ENEMY_NEAR
  const here0 = here(stuck.s);
  for (let i = 0; i < (T.FLEE_TRIES + 2) * (T.FLEE_REPICK + 1); i++) {
    stuck.s.mind.stress = 0.95;
    tick(stuck.ctx, stuck.s, 1);
  }
  assert.equal(stuck.s.eng.state, 'flee');
  assert.ok(stuck.s.eng.refugeTries > T.FLEE_TRIES, 'FLEE_TRIES tries went by');
  assert.equal(stuck.s.eng.fledPhase, 'wait', 'and he waits where he is');
  assert.ok(dist(here(stuck.s), here0) < 1);
});

test('flee does not end: calm, or the squad retreating, leaves a fled man a fled man', () => {
  const { ctx, s } = broke('?stressAct=flee', [0.9, 0, 0], 60, { safe: { x: 0, z: -40 } });
  assert.equal(s.eng.state, 'flee');
  const min = ctx.E.tuning.ACT_TUNING.REACT_MIN;
  for (let i = 0; i < Math.ceil((min + 6) / H.AI_TICK); i++) {
    ctx.M.of(s).stress = 0; // as calm as a man can be
    tick(ctx, s);
  }
  assert.equal(s.eng.state, 'flee', 'nothing about calm ends it');
  assert.equal(s.eng.fledPhase !== null, true);
  ctx.us.state = 'retreat'; // his squad retreats: it does not take him
  tick(ctx, s, 1);
  assert.equal(s.eng.state, 'flee');
  assert.equal(s.weapon, null);
});

test('flee releases a firing station, and nobody is claimed for a station while he reacts', () => {
  const ctx = world('?stressAct=flee'),
    s = man(ctx.us, 'rifleman');
  let released = null;
  ctx.r.BattleTacticalPositions = {
    current: () => ({ position: { x: 0, z: 0 } }),
    release: (m, b, why) => (released = why),
    update: () => null
  };
  tick(ctx, s);
  temper(ctx, s, 0.9, 0, 0);
  stressTo(ctx, s, 'broken');
  const g = foe(ctx, s, 50);
  ctx.us.contact = { x: g.root.position.x, z: g.root.position.z, at: ctx.b.time, seenBy: s.id };
  under(ctx, s);
  tick(ctx, s, 0.3);
  assert.equal(s.eng.state, 'flee');
  assert.equal(released, 'broken', 'the station is let go');
  const src = fs.readFileSync(path.join(H.REPO, 'battle/modules/20-building-hardpoints.js'), 'utf8');
  assert.match(
    src,
    /BattleEngagement\.reacting\(s\)/,
    'a man who is down, running or charging is not eligible for a station'
  );
});

test('freeze: down where he is, holds, no fire, and does not take a bound or the squad order', () => {
  const { ctx, s } = broke('?stressAct=freeze', [0, 0.9, 0], 100);
  assert.equal(s.eng.state, 'freeze');
  assert.equal(s.crouching, true);
  const p = here(s);
  let shots = 0;
  const real = ctx.S.tryFire;
  ctx.S.tryFire = (...a) => (shots++, real.apply(ctx.S, a));
  s.fireCooldown = 0;
  s.eng.boundOrder = true; // the Squad Leader orders a bound
  ctx.us._assaultAuthorized = true;
  tick(ctx, s, 2);
  assert.equal(s.eng.state, 'freeze');
  assert.equal(shots, 0);
  assert.ok(dist(p, s.destination) < 0.5, 'where he was');
  assert.ok(dist(p, here(s)) < 0.01, 'and he has not moved');
});

test('freeze duration follows stress tempo: equal final stress reached quickly freezes longer than slowly', () => {
  const quick = seededTempoFreeze([
      { age: 0.2, gain: 0.2 },
      { age: 0.6, gain: 0.2 },
      { age: 1.0, gain: 0.2 },
      { age: 1.4, gain: 0.2 }
    ]),
    slow = seededTempoFreeze([
      { age: 2.5, gain: 0.2 },
      { age: 5.0, gain: 0.2 },
      { age: 9.0, gain: 0.2 },
      { age: 13.0, gain: 0.2 }
    ]);
  assert.equal(quick.ctx.M.stress(quick.s), slow.ctx.M.stress(slow.s), 'same final stress');
  assert.ok(
    quick.s.eng.freezeDuration > slow.s.eng.freezeDuration + 4,
    'concentrated dose freezes materially longer: ' +
      quick.s.eng.freezeDuration.toFixed(2) +
      ' vs ' +
      slow.s.eng.freezeDuration.toFixed(2)
  );
  assert.ok(quick.s.eng.freezeDuration <= quick.ctx.M.tuning.FREEZE_MAX + 1e-9);
  assert.ok(slow.s.eng.freezeDuration >= slow.ctx.M.tuning.FREEZE_MIN - 1e-9);
  assert.equal(quick.s.eng.freezeDose.recentTotal.toFixed(3), slow.s.eng.freezeDose.recentTotal.toFixed(3));
  assert.ok(
    quick.s.eng.freezeDose.shortestWindowDose > slow.s.eng.freezeDose.shortestWindowDose,
    'the shortest window distinguishes shock from simmer'
  );
  const snap = quick.ctx.M.snapshot(quick.s);
  assert.ok(snap.recentDose && snap.recentDose.dominantKind === 'suppression', 'diagnostics expose recent dose');
});

test('freeze expires while still broken and cannot restart inside the same broken episode', () => {
  const { ctx, s } = broke('?stressAct=freeze,cower', [0, 1, 0], 100);
  assert.equal(s.eng.state, 'freeze');
  const firstUntil = s.eng.freezeUntil;
  assert.ok(firstUntil > ctx.b.time);
  let sawAfter = false;
  for (let i = 0; i < 200 && ctx.b.time < firstUntil + 3; i++) {
    const m = ctx.M.of(s);
    m.stress = m.pub = 0.95;
    m.lastIncomingAt = ctx.b.time;
    tick(ctx, s);
    if (ctx.b.time >= firstUntil) sawAfter = true;
  }
  assert.equal(sawAfter, true);
  assert.notEqual(s.eng.state, 'freeze', 'the bounded spell ended despite persistent broken stress');
  assert.equal(s.eng.state, 'cower', 'still-broken under-fire fallback is defensive, not another freeze');
  assert.ok(s.eng.freezeEndedAt >= firstUntil);
  assert.match(s.eng.freezeExitReason, /^duration-expired-broken:/);
  const ended = s.eng.freezeEndedAt;
  for (let i = 0; i < 80; i++) {
    const m = ctx.M.of(s);
    m.stress = m.pub = 0.95;
    m.lastIncomingAt = ctx.b.time;
    tick(ctx, s);
    assert.notEqual(s.eng.state, 'freeze', 'same broken episode never restarts freeze');
  }
  assert.equal(s.eng.freezeEndedAt, ended, 'one freeze episode, one end record');
});

test('flee is non-threatening, while rage remains an active visual threat', () => {
  const fled = broke('?stressAct=flee', [0.9, 0, 0], 60, { safe: { x: 0, z: -40 } });
  assert.equal(fled.s.eng.state, 'flee');
  fled.ctx.us.members.forEach(o => {
    if (o !== fled.s) put(o, 1000 + o.id * 10, 1000);
  });
  put(fled.g, fled.s.root.position.x, fled.s.root.position.z + 50);
  fled.g.root.rotation.y = Math.PI;
  fled.g.target = fled.s;
  fled.ctx.S.perceive(fled.g, fled.ctx.b);
  assert.equal(fled.g.target, null, 'an already-tracked fleeing man is dropped');
  fled.g._scanAt = 0;
  fled.ctx.S.perceive(fled.g, fled.ctx.b);
  assert.equal(fled.g.target, null, 'a fleeing man is not reacquired');
  fled.g.target = fled.s;
  fled.g.fireCooldown = 0;
  assert.equal(fled.ctx.S.tryFire(fled.g, fled.ctx.b), false, 'the trigger path also rejects a stale fleeing target');

  const raging = broke('?stressAct=rage', [0, 0, 0.95], 50);
  assert.equal(raging.s.eng.state, 'rage');
  raging.ctx.us.members.forEach(o => {
    if (o !== raging.s) put(o, 1000 + o.id * 10, 1000);
  });
  put(raging.g, raging.s.root.position.x, raging.s.root.position.z + 50);
  raging.g.root.rotation.y = Math.PI;
  raging.g.target = null;
  raging.g._scanAt = 0;
  raging.ctx.S.perceive(raging.g, raging.ctx.b);
  assert.equal(raging.g.target, raging.s, 'rage stays targetable because the man is still attacking');
});

test('freeze suspends perception and facing, and opposing perception does not posture around the dazed man', () => {
  const { ctx, s, g } = broke('?stressAct=freeze', [0, 0.9, 0], 60);
  assert.equal(s.eng.state, 'freeze');

  /* The frozen man had a live enemy when he broke; the reaction must remove every input that can rotate
     the stationary root under the Sitting Dazed / other freeze hold. */
  s.target = g;
  s._faceHint = { x: g.root.position.x, z: g.root.position.z };
  const yaw = s.root.rotation.y;
  ctx.S.perceive(s, ctx.b);
  assert.equal(s.target, null, 'no target tracking while frozen');
  ctx.E.updateSoldier(s, ctx.b);
  assert.equal(s._faceHint, null, 'Engagement clears its own facing hint while frozen');
  assert.equal(ctx.S.lookYaw(s, ctx.b), yaw, 'no sector scan/head-turn source while frozen');

  /* Park every other US man outside spotting range so the German observer has exactly one possible
     visual contact. If he was already tracking the man, the target drops; a new scan skips him. */
  ctx.us.members.forEach(o => {
    if (o !== s) put(o, 1000 + o.id * 10, 1000);
  });
  put(g, s.root.position.x, s.root.position.z + 60);
  g.root.rotation.y = Math.PI;
  g.target = s;
  ctx.S.perceive(g, ctx.b);
  assert.equal(g.target, null, 'an existing target is dropped when that man freezes');
  g._scanAt = 0;
  ctx.S.perceive(g, ctx.b);
  assert.equal(g.target, null, 'a frozen man is not reacquired as an active visual threat');
});

test("rage: charges the enemy, fires on the move, strikes at arm's length, and ends when nobody is near", () => {
  const { ctx, s, g } = broke('?stressAct=rage', [0, 0, 0.95], 50);
  assert.equal(s.eng.state, 'rage');
  assert.ok(dist(s.destination, here(g)) < 1, 'his goal is the enemy: ' + dist(s.destination, here(g)));
  assert.ok(s._combatUrgentUntil > ctx.b.time, 'at a run');
  /* He fires on the move (the speed gate that stops everyone else is not his). */
  let shots = 0;
  const real = ctx.S.tryFire;
  ctx.S.tryFire = (...a) => (shots++, real.apply(ctx.S, a));
  s.moving = true;
  s.moveSpeed = 4;
  s.fireCooldown = 0;
  s.root.rotation.y = 0; // facing +z, at him
  ctx.b.random = () => 0.999; // every round misses: the blow below is under test, not who he hits on the way in
  tick(ctx, s, 0.3);
  assert.ok(shots >= 1, 'a round on the move');
  /* At arm's length: a blow every MELEE_PERIOD, a roll below MELEE_HIT lands it through the wound model. */
  put(g, s.root.position.x, s.root.position.z + 1.5);
  const T = ctx.E.tuning.ACT_TUNING;
  let blows = 0;
  const W = ctx.r.BattleWounds,
    realWound = W.wound;
  W.wound = (a, v, b, hit) => (blows++, assert.equal(hit.zone, 'chest'), realWound.call(W, a, v, b, hit));
  ctx.b.random = () => 0.1; // below MELEE_HIT: it lands
  tick(ctx, s, 0.3);
  assert.equal(blows, 1, 'a blow landed');
  tick(ctx, s, T.MELEE_PERIOD - 0.5);
  assert.equal(blows, 1, 'not again before the period is up');
  tick(ctx, s, 0.8);
  assert.ok(blows >= 2 || g.dead, 'the next blow, or he is down');
  W.wound = realWound;
  const acts = ctx.M.of(s).acts.rage;
  assert.ok(acts.strikes >= 1 && acts.hits >= 1 && acts.n === 1, JSON.stringify(acts));
  /* A roll above MELEE_HIT: the blow is struck and misses. */
  const m2 = broke('?stressAct=rage', [0, 0, 0.95], 50);
  put(m2.g, m2.s.root.position.x, m2.s.root.position.z + 1.5);
  m2.ctx.b.random = () => 0.99;
  m2.s.fireCooldown = 99; // the blow alone is under test
  tick(m2.ctx, m2.s, 0.3);
  assert.equal(m2.ctx.M.of(m2.s).acts.rage.strikes, 1);
  assert.equal(m2.ctx.M.of(m2.s).acts.rage.hits, 0);
  assert.equal(m2.g.hp, m2.g.maxHp, 'unhurt');
  /* Nobody within RAGE_REACH: the charge is over. */
  const far = broke('?stressAct=rage', [0, 0, 0.95], 50);
  put(far.g, far.s.root.position.x, far.s.root.position.z + 300);
  far.ctx.us.contact = null;
  far.s.eng.lastSeen = null;
  tick(far.ctx, far.s, 0.6);
  assert.notEqual(far.s.eng.state, 'rage', 'with no enemy in reach he stops');
});

test('rage: for RAGE_GUARD_SECONDS a hit does a quarter of its damage, of its chance to drop him and of its bleed; the same two draws', () => {
  const T = load_tuning();
  const ctx0 = broke('?stressAct=rage', [0, 0, 0.95], 50);
  assert.equal(ctx0.s.eng.state, 'rage');
  assert.ok(ctx0.s.eng.guardUntil > ctx0.ctx.b.time, 'the guard is up from the moment he breaks');
  assert.ok(ctx0.s.eng.guardUntil <= ctx0.ctx.b.time + T.RAGE_GUARD_SECONDS + 1e-9, 'for RAGE_GUARD_SECONDS');
  const W = ctx0.ctx.r.BattleWounds,
    shooter = ctx0.g;
  /* A man to compare him with: the same hit on a man who never broke. */
  const ref = man(ctx0.ctx.us, 'rifleman', 1);
  /* One hit with a fixed roll, counting the draws it takes. */
  function hit(ctx, victim, zone, roll) {
    let draws = 0;
    ctx.b.random = () => (draws++, roll);
    victim.hp = 1e6;
    victim.bleedRate = 0;
    victim.casualty = null;
    victim.dead = false;
    const res = W.wound(shooter, victim, ctx.b, { zone: zone, energy: 1, power: 1 });
    return { res, draws, bleed: victim.bleedRate || 0, dead: !!victim.dead };
  }
  /* Damage and bleed: a leg hit that cannot drop him on this roll. */
  const g1 = hit(ctx0.ctx, ctx0.s, 'leg', 0.5),
    r1 = hit(ctx0.ctx, ref, 'leg', 0.5);
  assert.ok(r1.res.damage > 0 && r1.bleed > 0);
  assert.ok(Math.abs(g1.res.damage - r1.res.damage * T.RAGE_GUARD_SCALE) < 1e-9, 'a quarter of the damage');
  assert.ok(Math.abs(g1.bleed - r1.bleed * T.RAGE_GUARD_SCALE) < 1e-9, 'a quarter of the bleed');
  assert.equal(g1.draws, r1.draws, 'the same number of draws from the combat RNG, guarded or not');
  /* The chance to drop him: a chest hit (0.55 to drop) on a roll of 0.2 drops an unguarded man and not a guarded one. */
  const g2 = hit(ctx0.ctx, ctx0.s, 'chest', 0.2),
    r2 = hit(ctx0.ctx, ref, 'chest', 0.2);
  assert.equal(r2.res.outcome, 'dropped', 'unguarded: dropped');
  assert.equal(g2.res.outcome, 'wounded', 'guarded: 0.2 is above a quarter of the chance');
  /* What the guard saved is counted. */
  const acts = ctx0.ctx.M.of(ctx0.s).acts.rage;
  assert.equal(acts.guarded, 2);
  assert.ok(acts.saved > 0, 'hp saved ' + acts.saved);
  /* After RAGE_GUARD_SECONDS it is over: the whole hit. */
  ctx0.ctx.b.time = ctx0.s.eng.guardUntil + 0.01;
  const g3 = hit(ctx0.ctx, ctx0.s, 'leg', 0.5);
  assert.ok(Math.abs(g3.res.damage - r1.res.damage) < 1e-9, 'the whole hit again');
  assert.equal(acts.guarded, 2, 'and not counted');
  /* Nobody else has it: not a cowering man, not a man who froze, not one who never broke. */
  const c = broke('?stressAct=cower,freeze', [0, 0.9, 0.1], 100);
  assert.ok(!(c.s.eng.guardUntil > 0), 'no guard but a berserk one');
  assert.equal(c.ctx.E.guardOnHit(c.s, c.ctx.b, 1), 1);
  assert.equal(c.ctx.E.guardOnHit(ref, c.ctx.b, 1), 1);
});

test('a break lasts at least REACT_MIN, ends once he is below broken, and he rejoins the fight', () => {
  const { ctx, s } = broke('?stressAct=freeze', [0, 0.9, 0], 100);
  assert.equal(s.eng.state, 'freeze');
  const min = ctx.E.tuning.ACT_TUNING.REACT_MIN;
  stressTo(ctx, s, 'steady'); // he is calm at once
  tick(ctx, s, 1);
  assert.equal(s.eng.state, 'freeze', 'calm, but not for REACT_MIN yet');
  tick(ctx, s, min);
  assert.notEqual(s.eng.state, 'freeze', 'then he is out of it');
  assert.equal(ctx.E.reacting(s), false);
  /* Broken again: broken again. */
  stressTo(ctx, s, 'broken');
  tick(ctx, s, 0.6);
  assert.equal(s.eng.state, 'freeze');
  assert.equal(ctx.M.of(s).acts.freeze.n, 2, 'two spells counted');
  assert.ok(ctx.M.of(s).acts.freeze.sec > 3, 'and the seconds in them');
});

test('a squad that is already retreating is not reacted for', () => {
  const { ctx, s } = broke('?stressAct=freeze', [0, 0.9, 0], 100);
  assert.equal(s.eng.state, 'freeze');
  ctx.us.state = 'retreat';
  tick(ctx, s, 0.3);
  assert.equal(s.eng.state, 'withdraw', 'the retreat outranks it');
  const t2 = broke('?stressAct=freeze', [0, 0.9, 0], 100, {});
  t2.ctx.us.state = 'retreat';
  stressTo(t2.ctx, t2.s, 'broken');
  tick(t2.ctx, t2.s, 0.6);
  assert.equal(t2.s.eng.state, 'withdraw');
});

test('the squad report names the men reacting; they are not base of fire, not movers and not suppressors', () => {
  const ctx = world('?stressAct=freeze'),
    men = ctx.us.members.filter(s => s.role === 'rifleman').slice(0, 6),
    frozen = men[0];
  men.forEach(s => {
    s.target = foe(ctx, s, 150);
    tick(ctx, s);
    s.eng.state = 'engage';
  });
  tick(ctx, frozen);
  temper(ctx, frozen, 0, 0.9, 0);
  stressTo(ctx, frozen, 'broken');
  under(ctx, frozen);
  tick(ctx, frozen, 0.3);
  assert.equal(frozen.eng.state, 'freeze');
  const r = ctx.E.updateSquad(ctx.us, ctx.b);
  assert.deepEqual(
    r.reacting.map(s => s.id),
    [frozen.id]
  );
  assert.ok(!r.fireSupport.includes(frozen), 'not in the base of fire');
  /* The Squad Leader's bound: he is never among the movers. */
  const seen = [];
  const realOrder = ctx.E.orderBound;
  ctx.E.orderBound = movers => (seen.push(...movers.map(s => s.id)), realOrder.call(ctx.E, movers));
  ctx.us.commandPhase = 'assault';
  ctx.us.inContact = true;
  ctx.us.contact = { x: 0, z: 170, at: ctx.b.time };
  men.forEach((s, i) => {
    if (i) s.slotIndex = i;
  });
  /* Alpha (with the frozen man) may go while bravo holds the base of fire. */
  ctx.us.members.forEach(s => (s._fireteamKey = 'charlie'));
  men.forEach((s, i) => (s._fireteamKey = i < 3 ? 'alpha' : 'bravo'));
  frozen.suppressedUntil = 0; // the old exclusion (suppressed) must not be what keeps him out
  ctx.r.BattleSquadStability.fireAndMovement(ctx.us, ctx.b);
  assert.ok(seen.length > 0, 'a bound was ordered (the control: the squad can bound)');
  assert.ok(!seen.includes(frozen.id), 'the frozen man is not sent forward');
  /* Nor does a suppression job go to him. */
  ctx.E.assignSuppressors(ctx.us, ctx.b, ctx.us.members, { x: 0, z: 170, at: ctx.b.time });
  assert.equal(frozen.eng.suppressOrder, false);
});

test('the resolver ranks the new intents: flee above a station, a hold while down above a station, a charge above a rush', () => {
  const ctx = world('?stressAct=all');
  load(ctx.r, 'battle/movement-resolver.js');
  const R = ctx.r.BattleMovementResolver,
    s = man(ctx.us, 'rifleman');
  tick(ctx, s);
  const prio = kind => {
    s._movementResolver = null;
    R.proposeCombat(s, { x: 3, z: 25 }, ctx.b, kind, 1, { source: 'engagement', reason: 'test' });
    return s._movementResolver.combat.priority;
  };
  const was = s.eng.state;
  assert.equal(prio('flee'), 92);
  assert.equal(prio('rage-charge'), 72);
  assert.equal(prio('assault-rush'), 70);
  assert.equal(prio('firing-station'), 80);
  assert.equal(prio('hold'), 50, 'a hold in the ordinary run of things');
  s.eng.state = 'pinned';
  assert.equal(prio('hold'), 85);
  for (const st of ['cower', 'freeze', 'flee', 'rage']) {
    s.eng.state = st;
    assert.equal(prio('hold'), 85, 'a hold while ' + st);
  }
  s.eng.state = was;
});

test('a flee or charge proposal is only good while he is in that state', () => {
  const { ctx, s } = broke('?stressAct=flee', [0.9, 0, 0], 60);
  load(ctx.r, 'battle/movement-resolver.js');
  const R = ctx.r.BattleMovementResolver;
  R.proposeCombat(s, { x: 0, z: 0 }, ctx.b, 'flee', 5, { source: 'engagement', reason: 'test' });
  const st = s._movementResolver;
  assert.equal(st.combat.kind, 'flee');
  assert.ok(R.resolve(s, ctx.b), 'resolves while he is running');
  assert.equal(st.goal.kind, 'flee');
  s.eng.state = 'advance';
  R.resolve(s, ctx.b);
  assert.notEqual(st.goal.kind, 'flee', 'out of the state, the intent is dropped');
});

test('the choice draws nothing from the combat RNG: cower, flee and freeze draw none, a blow draws only its own', () => {
  for (const [q, tempers, d] of [
    ['?stressAct=cower', [0, 0, 0], 100],
    ['?stressAct=flee', [0.9, 0, 0], 60],
    ['?stressAct=freeze', [0, 0.9, 0], 100]
  ]) {
    const ctx = world(q),
      s = man(ctx.us, 'rifleman');
    let draws = 0;
    const real = ctx.b.random;
    ctx.b.random = (...a) => (draws++, real.apply(ctx.b, a));
    tick(ctx, s);
    temper(ctx, s, ...tempers);
    stressTo(ctx, s, q.includes('cower') ? 'rattled' : 'broken');
    const g = foe(ctx, s, d);
    ctx.us.contact = { x: g.root.position.x, z: g.root.position.z, at: ctx.b.time, seenBy: s.id };
    under(ctx, s, 2);
    s.fireCooldown = 99; // the one thing here that could draw is a shot: none is wanted
    tick(ctx, s, 3);
    assert.ok(ctx.E.reacting(s), q);
    assert.equal(draws, 0, q + ': no combat-RNG draw');
  }
  const { ctx, s, g } = broke('?stressAct=rage', [0, 0, 0.95], 50);
  put(g, s.root.position.x, s.root.position.z + 1.5);
  let draws = 0;
  ctx.b.random = () => (draws++, 0.99);
  s.fireCooldown = 99;
  tick(ctx, s, 0.3);
  assert.equal(draws, 1, 'one roll for the blow, a miss, and nothing else');
});

test('telemetry counts the reactions: spells begun, seconds, blows', () => {
  const { ctx, s } = broke('?stressAct=freeze', [0, 0.9, 0], 100);
  tick(ctx, s, 3);
  const t = ctx.M.telemetry(ctx.b);
  assert.equal(t.acts.freeze.n, 1);
  assert.ok(t.acts.freeze.seconds >= 3, 'seconds: ' + t.acts.freeze.seconds);
  assert.equal(t.acts.cower.n, 0);
  assert.equal(t.acts.rage.strikes, 0);
  assert.deepEqual(Object.keys(t.bySide.us.acts).sort(), ['cower', 'flee', 'freeze', 'rage']);
});

console.log(`${n} stress-reaction checks passed`);
