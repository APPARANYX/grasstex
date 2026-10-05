#!/usr/bin/env node
'use strict';
/* Clearing the last contact (module 16 `updateClearContact`, Engagement `alert`; on by default, `?alertAdvance=0`
   is the old hold).

   With the alert latch an alerted man stays in the fight until it is won, lost or the squad loses contact. A
   squad can stay "in contact" with nobody seeing anyone and nobody being shot at (a suppressor firing on a heard
   or remembered position), and then every man held his cover for good. This file pins:

     - the flag: on by default (and with no `location`), `?alertAdvance=0`/off/false disables it;
     - the Squad Leader orders `sq.clearContact` (the last place the squad itself saw the enemy) after CLEAR_AFTER
       seconds with nobody seeing anyone and nobody under fire, never on heard word; a hold-fire order still
       waiting is opened; a newer sighting moves the point; a sighting, fire, a holding phase or retreat ends it and
       restarts the clock, as do arrival (`cleared`) and CLEAR_MAX (`timeout`), and a picture already cleared is
       not ordered again; one telemetry event per order and one per end;
     - the anchor advances on the cleared point, not the objective, and only as men arrive (no forced stride when
       the point moves); off, the anchor stays held in contact;
     - an alerted, engaged man past his sector hold who is not suppressing stops proposing a hold while the order
       stands, shows `clear` and is crouched (never prone); without the order he holds his position. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
const SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/16-squad-plan-stability.js'), 'utf8');
const FC_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15a-squad-leader-fire-control.js'), 'utf8');
const BP_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15b-squad-leader-buddy-pairs.js'), 'utf8');
const SF_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15c-squad-leader-scouts-forward.js'), 'utf8');
const LL_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15d-squad-leader-leaderless-intent.js'), 'utf8');
const ME_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15e-squad-leader-morale-coa.js'), 'utf8');
const CC_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15i-squad-leader-clear-contact.js'), 'utf8');
const RA_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15f-squad-leader-retreat-anchor.js'), 'utf8');
const FG_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15g-squad-leader-formation.js'), 'utf8');
const FT_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15h-squad-leader-fireteams.js'), 'utf8');
const FAM_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15j-squad-leader-fire-and-movement.js'), 'utf8');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}

function world(search) {
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
    events = [];
  r.BattleModules = {
    registerSystem() {},
    registerUnitType() {},
    registerObjectiveType() {},
    runHook() {},
    unitsFor() {
      return [];
    }
  };
  r.BattleCommanderDoctrine = {
    policyFor() {
      return { cohesionRadius: 34, captainlessCohesion: 26 };
    }
  };
  r.BattleTelemetry = {
    record(type, data) {
      events.push({ type, data });
    }
  };
  new Function('window', 'globalThis', 'console', 'location', FC_SRC)(r, r, console, r.location);
  new Function('window', 'globalThis', 'console', 'location', LL_SRC)(r, r, console, r.location);
  new Function('window', 'globalThis', 'console', 'location', ME_SRC)(r, r, console, r.location);
  new Function('window', 'globalThis', 'console', 'location', RA_SRC)(r, r, console, r.location);
  new Function('window', 'globalThis', 'console', 'location', FG_SRC)(r, r, console, r.location);
  new Function('window', 'globalThis', 'console', 'location', FT_SRC)(r, r, console, r.location);
  new Function('window', 'globalThis', 'console', 'location', FAM_SRC)(r, r, console, r.location);
  new Function('window', 'globalThis', 'console', 'location', CC_SRC)(r, r, console, r.location);
  new Function('window', 'globalThis', 'console', 'location', SRC)(
    r,
    r,
    { log() {}, warn() {} },
    search == null ? undefined : { search }
  );
  const b = H.makeBattle(r, { seed: 1 }),
    w = {
      r,
      b,
      S: r.BattleSquadStability,
      events,
      contact: null,
      report: { inContact: true, seeing: 0, underFire: 0 }
    };
  /* Engagement's squad report and the squad's contact are scripted; the Squad Leader is the shipping code. */
  r.BattleEngagement.updateSquad = function (sq) {
    const was = !!sq.inContact;
    sq.inContact = w.report.inContact;
    sq.contactCount = w.report.seeing;
    return {
      contactStarted: sq.inContact && !was,
      effective: 2,
      pinned: 0,
      underFire: w.report.underFire,
      fireSupport: sq.members.filter(s => !s.dead)
    };
  };
  r.SquadAI.squadContact = () => w.contact;
  w.enemy = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: 400,
    objective: { x: 0, z: 0 }
  }).members[0];
  return w;
}
function squad(w, phase) {
  const sq = H.addSquad(w.r, w.b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 300 } });
  sq.members.forEach((s, i) => {
    s._fireteamKey = ['alpha', 'bravo', 'charlie'][i % 3];
  });
  w.S.initialPhase(sq, phase || 'approach');
  return sq;
}
function tick(w, sq, seconds) {
  for (let t = 0; t < seconds - 1e-9; t += 0.15) {
    w.b.time += 0.15;
    w.S.fireAndMovement(sq, w.b);
  }
}
const orders = w => w.events.filter(e => e.type === 'decision-clear-contact');

test('on by default; only 0/off/false disables it', () => {
  const parsed = [
    '',
    '?alertAdvance=1',
    '?alertAdvance=0',
    '?alertAdvance=off',
    '?alertAdvance=false',
    '?xalertAdvance=0'
  ].map(q => world(q).S.alertAdvanceOn());
  assert.deepEqual(parsed, [true, true, false, false, false, true]);
  assert.equal(world(null).S.alertAdvanceOn(), true);
});

/* What the squad saw itself (first-hand, with an enemy that is a threat), at simulated second `at`. */
function seen(w, x, z, at) {
  return { unit: w.enemy, x, z, at, seenBy: 1 };
}
function ordered(w, sq, x, z) {
  w.contact = seen(w, x, z, w.b.time);
  tick(w, sq, 6.5);
  assert.ok(sq.clearContact, 'ordered');
}

test('a quiet first-hand picture becomes a clearing order after CLEAR_AFTER; heard word never does', () => {
  const w = world(''),
    sq = squad(w);
  w.contact = seen(w, 40, 150, 0);
  tick(w, sq, 5.5);
  assert.ok(!sq.clearContact, 'not before six quiet seconds');
  tick(w, sq, 0.9);
  assert.deepEqual([sq.clearContact.x, sq.clearContact.z], [40, 150]);
  const since = sq.clearContact.since;
  w.contact = seen(w, 45, 160, w.b.time);
  tick(w, sq, 1);
  assert.deepEqual(
    [sq.clearContact.x, sq.clearContact.z, sq.clearContact.since],
    [45, 160, since],
    'a newer sighting moves the point'
  );
  w.contact = { x: 300, z: 300, at: w.b.time, heard: true };
  tick(w, sq, 1);
  assert.deepEqual([sq.clearContact.x, sq.clearContact.z], [45, 160], 'heard word does not move it');
  w.report.inContact = false;
  w.contact = null;
  tick(w, sq, 1);
  assert.ok(sq.clearContact, 'the squad out of contact and the picture gone: it still goes to look');
  assert.equal(orders(w).length, 1, 'one decision per order');
  const h = world(''),
    hq = squad(h);
  h.contact = { x: 40, z: 150, at: 0, heard: true, unit: h.enemy };
  tick(h, hq, 20);
  assert.ok(!hq.clearContact, 'heard gunfire alone is not the squad’s own contact');
});

test('a hold-fire order on a contact nobody can see is opened when clearing begins', () => {
  const w = world(''),
    sq = squad(w);
  w.contact = seen(w, 0, 150, 0);
  sq.fireControl = { state: 'hold', targetId: 7, startedAt: 0 };
  tick(w, sq, 5.5);
  assert.equal(sq.fireControl.state, 'hold', 'still holding before the order');
  tick(w, sq, 1);
  assert.ok(sq.clearContact);
  assert.equal(sq.fireControl.state, 'open');
  assert.equal(sq.fireControl.reason, 'contact quiet: clearing');
});

test('a sighting, fire, a holding phase or retreat ends it and restarts the clock', () => {
  const cases = [
    ['sighting', w => (w.report.seeing = 1)],
    ['under fire', w => (w.report.underFire = 1)],
    ['holding phase', (w, sq) => w.S.transitionPhase(w.b, sq, 'support-hold', 'test')],
    ['retreat', (w, sq) => (sq.state = 'retreat')]
  ];
  for (const [name, spoil] of cases) {
    const w = world(''),
      sq = squad(w);
    ordered(w, sq, 0, 150);
    spoil(w, sq);
    w.S.fireAndMovement(sq, w.b); /* one tick, so updateSquadState cannot undo a scripted retreat */
    assert.equal(sq.clearContact, null, name + ' ends it');
    assert.equal(sq._quietSince, null, name + ' restarts the clock');
    assert.equal(w.events.filter(e => e.type === 'decision-clear-contact-end').at(-1).data.reason, name);
  }
  const w = world('?alertAdvance=0'),
    sq = squad(w);
  w.contact = seen(w, 0, 150, 0);
  tick(w, sq, 20);
  assert.ok(!sq.clearContact, 'off: never ordered');
  assert.equal(orders(w).length, 0);
});

test('it ends cleared on arrival or on the clock, and the same picture is not ordered again', () => {
  const w = world(''),
    sq = squad(w);
  ordered(w, sq, 0, 150);
  w.S.publishAnchor(sq, { x: 1, z: 148 });
  sq.members.forEach(s => {
    s.orderDestination = { x: s.root.position.x, z: s.root.position.z };
  });
  tick(w, sq, 0.15);
  assert.equal(sq.clearContact, null);
  assert.equal(w.events.filter(e => e.type === 'decision-clear-contact-end').at(-1).data.reason, 'cleared');
  tick(w, sq, 10);
  assert.ok(!sq.clearContact, 'the picture it cleared is not cleared twice');
  w.contact = seen(w, 0, 200, w.b.time);
  tick(w, sq, 6.5);
  assert.ok(sq.clearContact, 'a new sighting can be');
  const t = world(''),
    tq = squad(t);
  ordered(t, tq, 0, 150);
  tick(t, tq, 89);
  assert.ok(tq.clearContact);
  tick(t, tq, 1.5);
  assert.equal(tq.clearContact, null);
  assert.equal(t.events.filter(e => e.type === 'decision-clear-contact-end').at(-1).data.reason, 'timeout');
});

test('the anchor advances on the cleared point as men arrive; off, it is held in contact', () => {
  for (const search of ['', '?alertAdvance=0']) {
    const w = world(search),
      sq = squad(w);
    w.contact = seen(w, 120, 0, 0); /* off to the side of the objective, so the direction is visible */
    tick(w, sq, 7);
    sq.state = 'engaged';
    const a0 = { x: sq.orderAnchor.x, z: sq.orderAnchor.z };
    /* Everybody on his order: the squad may advance. */
    sq.members.forEach(s => {
      s.orderDestination = { x: s.root.position.x, z: s.root.position.z };
    });
    w.S.advanceSquadAnchor(sq, w.b);
    const a1 = sq.orderAnchor;
    if (search) assert.deepEqual([a1.x, a1.z], [a0.x, a0.z], 'off: held in contact');
    else {
      assert.ok(
        a1.x - a0.x > 1,
        'toward the contact (+x), not the objective (+z): ' + JSON.stringify([a0, a1])
      );
      assert.ok(Math.abs(a1.z - a0.z) < 1e-6);
      /* Nobody has reached the new anchor's slots yet, and the point moving does not force a stride. */
      sq.members.forEach(s => {
        s.orderDestination = { x: s.root.position.x - 50, z: s.root.position.z };
      });
      w.contact = seen(w, 130, 20, w.b.time);
      tick(w, sq, 0.15);
      w.S.advanceSquadAnchor(sq, w.b);
      assert.deepEqual([sq.orderAnchor.x, sq.orderAnchor.z], [a1.x, a1.z], 'no forced stride');
    }
  }
});

function oneMan() {
  H.resetIds();
  const r = H.bootstrap(),
    b = H.makeBattle(r),
    q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 200 } }),
    g = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 160, objective: { x: 0, z: 0 } }),
    s = q.members.find(m => m.role === 'rifleman');
  load(r, 'battle/movement-resolver.js');
  const kinds = [],
    R = r.BattleMovementResolver,
    real = R.proposeCombat;
  R.proposeCombat = function (man, p, battle, kind) {
    if (man === s) kinds.push(kind);
    return real.apply(this, arguments);
  };
  return { r, b, s, enemy: g.members[0], kinds };
}
test('an alerted man past his sector hold follows the clearing order, crouched; without it he holds', () => {
  for (const clearing of [false, true]) {
    const { r, b, s, enemy, kinds } = oneMan(),
      E = r.BattleEngagement;
    s.target = null;
    s.eng = null;
    const e = E.stateOf(s);
    s.squad.inContact = true;
    s.squad.contact = {
      unit: enemy,
      x: enemy.root.position.x,
      z: enemy.root.position.z,
      at: b.time,
      seenBy: s.id
    };
    s.squad.clearContact = clearing ? { x: 0, z: 160, since: b.time } : null;
    e.state = 'alert';
    e.engaged = true;
    e.until = b.time - 1;
    e.stanceUntil = 0;
    E.updateSoldier(s, b);
    assert.equal(e.state, 'alert', 'still alert: the engagement goes on');
    if (clearing) {
      assert.equal(s.state, 'clear');
      assert.ok(!kinds.includes('hold'), 'no hold proposed: ' + kinds.join());
      assert.notEqual(e.stance, 'prone', 'moving up crouched, not prone');
    } else {
      assert.notEqual(s.state, 'clear');
      assert.ok(kinds.includes('hold'), 'holds his position: ' + kinds.join());
    }
  }
});

console.log(n + ' clear-contact checks passed');
