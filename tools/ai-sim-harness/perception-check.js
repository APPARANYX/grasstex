#!/usr/bin/env node
'use strict';
/* Perception: view cones, gunfire heard, contact relayed between neighbouring squads.

   - A man spots at full range inside his 120 deg focus, at a fraction of it out to +-100 deg (more
     for a moving man), and behind him only a man within BEHIND_RANGE.
   - When his squad knows where the enemy is and a head turn reaches it, he looks that way.
   - Holding still with no known threat he scans his sector (SCAN_SWEEP either side, SCAN_PERIOD).
   - A squad with no sighting of its own takes a neighbour squad's first-hand contact within
     RELAY_RANGE (keeping its age; relays never chain), else hears enemy gunfire within HEAR_RANGE
     (position off by a distance-scaled error). Neither ever outranks the squad's own eyes.
   - None of it draws from the combat RNG. */
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
function setup(squads) {
  H.resetIds();
  /* This harness isolates the legacy aggregate Perception contract: free 50 m relay plus shared
     squad contact. Personal beliefs and delivered callouts have their own dedicated checks. */
  const r = H.bootstrap({ search: '?callouts=0&soldierBeliefs=0&incomingFireReveal=0' });
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  const b = H.makeBattle(r, { seed: 11 });
  const out = squads.map(o =>
    H.addSquad(r, b, { id: o.id, faction: o.faction, x: o.x, z: o.z, objective: { x: o.x, z: o.z + 100 }, facing: 0 })
  );
  return { r, b, S: r.SquadAI, P: r.SquadAI.PERCEPTION, out };
}
/* One observer facing +z at the origin, one enemy placed by bearing (deg off his facing) and range. */
function lone(sq) {
  sq.members.forEach((s, i) => (s.dead = i > 0));
  return sq.members[0];
}
function place(s, deg, d, moving) {
  const a = (deg * Math.PI) / 180;
  s.root.position.x = Math.sin(a) * d;
  s.root.position.z = Math.cos(a) * d;
  s.moving = !!moving;
  s.prone = s.tacticalCrouch = false;
}
function sees(ctx, observer, enemy) {
  const { S, b } = ctx;
  return S.findTarget(observer, [enemy], b.heightAt, b.obstacles, b) === enemy;
}

test('view cone: focus at full range, periphery shorter, behind only within arm reach', () => {
  const ctx = setup([
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 300 }
  ]);
  const me = lone(ctx.out[0]),
    foe = lone(ctx.out[1]);
  me.root.position.x = me.root.position.z = 0;
  me.root.rotation.y = 0;
  me.moving = true; // on the move he looks where his body faces (standing still he scans: below)
  const range = ctx.S.detectionRange(ctx.S.ROLES[me.role], foe);
  place(foe, 0, range * 0.9);
  assert.ok(sees(ctx, me, foe), 'straight ahead near full range');
  place(foe, 55, range * 0.9);
  assert.ok(sees(ctx, me, foe), 'inside the 60 deg focus');
  place(foe, 90, range * 0.5);
  assert.ok(!sees(ctx, me, foe), 'to the side past the peripheral reach');
  place(foe, 90, range * (ctx.P.PERIPHERAL_RANGE - 0.05));
  assert.ok(sees(ctx, me, foe), 'to the side inside the peripheral reach');
  place(foe, 90, range * 0.5, true);
  const movingRange = ctx.S.detectionRange(ctx.S.ROLES[me.role], foe);
  place(foe, 90, movingRange * (ctx.P.PERIPHERAL_MOVING - 0.05), true);
  assert.ok(sees(ctx, me, foe), 'movement catches the eye further out');
  place(foe, 180, 40);
  assert.ok(!sees(ctx, me, foe), 'behind him at 40 m');
  place(foe, 180, ctx.P.BEHIND_RANGE - 2);
  assert.ok(sees(ctx, me, foe), 'right on top of him');
});

test('stance concealment is 100/60/35 percent at rest, with an 18 point movement reveal', () => {
  const ctx = setup([
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 300 }
  ]);
  const me = lone(ctx.out[0]),
    foe = lone(ctx.out[1]),
    base = ctx.S.ROLES[me.role].visionRange;
  foe.moving = false;
  foe.prone = foe.tacticalCrouch = false;
  assert.equal(ctx.S.detectionRange(ctx.S.ROLES[me.role], foe), base, 'standing is full signature');
  foe.tacticalCrouch = true;
  assert.ok(Math.abs(ctx.S.detectionRange(ctx.S.ROLES[me.role], foe) - base * 0.6) < 1e-9, 'crouch is 60%');
  foe.tacticalCrouch = false;
  foe.prone = true;
  assert.ok(Math.abs(ctx.S.detectionRange(ctx.S.ROLES[me.role], foe) - base * 0.35) < 1e-9, 'prone is 35%');
  foe.moving = true;
  assert.ok(Math.abs(ctx.S.detectionRange(ctx.S.ROLES[me.role], foe) - base * 0.53) < 1e-9, 'moving prone is 53%');
  assert.deepEqual(ctx.P.VISIBILITY, { stand: 1, crouch: 0.6, prone: 0.35 });
  assert.equal(ctx.P.MOVING_VISIBILITY_BONUS, 0.18);

  const old = H.bootstrap({ search: '?stanceVis=0' });
  const oldFoe = { prone: true, tacticalCrouch: false, crouching: false, moving: false };
  assert.ok(
    Math.abs(old.SquadAI.detectionRange(old.SquadAI.ROLES.rifleman, oldFoe) - old.SquadAI.ROLES.rifleman.visionRange * 0.45) < 1e-9,
    'control restores the old 45% prone signature'
  );
});

test('he looks toward the known threat of his squad when a head turn reaches it', () => {
  const ctx = setup([
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 300 }
  ]);
  const me = lone(ctx.out[0]),
    foe = lone(ctx.out[1]);
  me.root.position.x = me.root.position.z = 0;
  me.root.rotation.y = 0;
  me.moving = true;
  const range = ctx.S.detectionRange(ctx.S.ROLES[me.role], foe);
  place(foe, 110, range * 0.8);
  assert.ok(!sees(ctx, me, foe), 'unwarned: 110 deg off is outside his cone');
  const a = (60 * Math.PI) / 180;
  me.squad.contact = { unit: foe, x: Math.sin(a) * 50, z: Math.cos(a) * 50, at: ctx.b.time, seenBy: null };
  assert.ok(sees(ctx, me, foe), 'warned of a threat 60 deg off, his focus swings onto it');
  const behind = Math.PI;
  me.squad.contact = { unit: foe, x: Math.sin(behind) * 50, z: Math.cos(behind) * 50, at: ctx.b.time, seenBy: null };
  assert.equal(ctx.S.lookYaw(me, ctx.b), 0, 'a threat behind him needs the body to turn, not the head');
});

test('a man holding still with no known threat scans his sector; on the move or warned he does not', () => {
  const ctx = setup([
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 300 }
  ]);
  const me = lone(ctx.out[0]),
    foe = lone(ctx.out[1]),
    { P, S, b } = ctx,
    deg = r => (r * 180) / Math.PI;
  me.root.position.x = me.root.position.z = 0;
  me.root.rotation.y = 0;
  me.moving = false;
  const range = S.detectionRange(S.ROLES[me.role], foe);
  place(foe, 90, range * 0.8);
  let lo = Infinity,
    hi = -Infinity,
    seen = 0,
    steps = 0;
  for (b.time = 0; b.time < P.SCAN_PERIOD; b.time += H.AI_TICK, steps++) {
    const y = S.lookYaw(me, b);
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
    if (sees(ctx, me, foe)) seen++;
  }
  const sweep = deg(P.SCAN_SWEEP);
  assert.ok(deg(hi) > sweep - 3 && deg(lo) < -sweep + 3, 'one period sweeps both sides: ' + deg(lo).toFixed(0) + '..' + deg(hi).toFixed(0));
  assert.ok(deg(hi) <= sweep + 1e-9 && deg(lo) >= -sweep - 1e-9, 'never past SCAN_SWEEP');
  assert.ok(sweep < deg(P.FOCUS_HALF), 'the sweep keeps his front inside his focus');
  assert.ok(seen > 0 && seen < steps, 'a man 90 deg off at range is caught while the scan faces him, not all the time');
  place(foe, 0, range * 0.9);
  for (b.time = 0; b.time < P.SCAN_PERIOD; b.time += H.AI_TICK)
    assert.ok(sees(ctx, me, foe), 'the man straight ahead is never lost to the scan (t=' + b.time.toFixed(2) + ')');
  b.time = 1.3;
  const y1 = S.lookYaw(me, b);
  assert.equal(S.lookYaw(me, b), y1, 'the same instant gives the same look (clock, not dice)');
  me.moving = true;
  assert.equal(S.lookYaw(me, b), 0, 'on the move he looks where he is going');
  me.moving = false;
  const a = (40 * Math.PI) / 180;
  me.squad.contact = { unit: foe, x: Math.sin(a) * 50, z: Math.cos(a) * 50, at: b.time, seenBy: null };
  assert.ok(Math.abs(deg(S.lookYaw(me, b)) - 40) < 1e-6, 'a known threat ends the scan: he looks at it');
});

test('a sighting by a neighbour squad is relayed within 50 m, with its age, and never chained', () => {
  const ctx = setup([
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'us-1', faction: 'us', x: 40, z: 0 },
    { id: 'us-2', faction: 'us', x: 80, z: 0 },
    { id: 'us-3', faction: 'us', x: -110, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 200 }
  ]);
  const [a, b, c, far, ge] = ctx.out,
    foe = ge.members[0];
  ctx.b.time = 10;
  a.contact = { unit: foe, x: 0, z: 200, at: 9.5, seenBy: a.members[0].id, stance: 'stand' };
  ctx.S.squadSenses(b, ctx.b);
  assert.equal(b.contact && b.contact.relayedFrom, 'us-0', '40 m away: word passes');
  assert.equal(b.contact.at, 9.5, 'the relay keeps the age of the sighting');
  assert.equal(b.contact.seenBy, null);
  ctx.S.squadSenses(c, ctx.b);
  assert.equal(c.contact, null, 'us-2 is 40 m from us-1 but 80 m from the man who saw: no chain');
  ctx.S.squadSenses(far, ctx.b);
  assert.equal(far.contact, null, '110 m away: nothing');
  ctx.b.time = 13;
  ctx.S.squadSenses(c, ctx.b);
  assert.equal(c.contact, null, 'a stale sighting is not passed on');
});

test('enemy gunfire within 120 m is heard, roughly placed; friendly fire and far fire are not', () => {
  const ctx = setup([
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 100 },
    { id: 'us-1', faction: 'us', x: 0, z: 400 }
  ]);
  const [us, ge, farUs] = ctx.out,
    shooter = ge.members[0],
    friend = us.members[1];
  ctx.S.extend('shotModel', 'ballistics', () => false);
  ctx.b.time = 5;
  friend.target = shooter;
  friend.fireCooldown = 0;
  ctx.S.tryFire(friend, ctx.b);
  ctx.S.squadSenses(us, ctx.b);
  assert.equal(us.contact || null, null, 'our own rifle tells us nothing');
  shooter.target = us.members[0];
  shooter.fireCooldown = 0;
  ctx.b.time = 5.15;
  ctx.S.tryFire(shooter, ctx.b);
  ctx.S.squadSenses(us, ctx.b);
  assert.ok(us.contact && us.contact.heard, 'heard');
  const p = shooter.root.position,
    d = Math.hypot(p.x, p.z),
    off = Math.hypot(us.contact.x - p.x, us.contact.z - p.z);
  assert.ok(off > 0 && off <= d * 0.08 + 1e-9, 'placed within 8% of the range: ' + off.toFixed(1) + ' m');
  ctx.S.squadSenses(farUs, ctx.b);
  assert.equal(farUs.contact || null, null, '~300 m away: too far to place it');
  /* His own eyes outrank what he heard, whichever is nearer. */
  const me = us.members[0];
  me.target = ge.members[3];
  ctx.S.shareContact(me, ctx.b);
  assert.ok(!us.contact.heard && us.contact.seenBy === me.id, 'own sighting replaces the heard contact');
});

test('perception never draws from the combat RNG', () => {
  const ctx = setup([
    { id: 'us-0', faction: 'us', x: 0, z: 0 },
    { id: 'us-1', faction: 'us', x: 30, z: 0 },
    { id: 'ge-0', faction: 'ge', x: 0, z: 90 }
  ]);
  let draws = 0;
  const real = ctx.b.random;
  ctx.b.random = function () {
    draws++;
    return real.call(this);
  };
  const [a, b] = ctx.out;
  ctx.b.time = 3;
  a.contact = { unit: ctx.out[2].members[0], x: 0, z: 90, at: 3, seenBy: 0 };
  ctx.b._gunfire = [{ x: 0, z: 90, faction: 'ge', unit: ctx.out[2].members[0], at: 3 }];
  ctx.S.squadSenses(b, ctx.b);
  a.members.forEach(s => ctx.S.findTarget(s, ctx.out[2].members, ctx.b.heightAt, ctx.b.obstacles, ctx.b));
  assert.equal(draws, 0);
});

console.log(n + ' perception checks passed');
