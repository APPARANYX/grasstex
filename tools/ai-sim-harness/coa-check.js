#!/usr/bin/env node
'use strict';
/* Course of action on contact (phase 3c, `?coa=1`, module 16 `fireAndMovement`): the flag-on path, which no
   check exercised.

   When Engagement reports a contact starting the Squad Leader scores the declared COAs (`assault`, `defend`)
   against declared inputs (casualty fraction, mean stress, leader down) with declared weights and stores the
   winner as `sq.coa`. `defend` holds the bounds; `assault` changes nothing. This file pins:

     - the flag is read once at load from `location.search` (`?coa=1` only) and is off by default;
     - the scores are the declared tables: `assault` wins while 2.5 x casualties + 1.5 x stress + 2 x leaderDown
       <= 1, a tie goes to `assault` (first by name), a leader down is `defend` on its own;
     - the choice is made at each contact START (a contact that breaks and returns is scored again) and never
       inside a contact: casualties, stress or a new leader mid-fight change nothing until the next start;
     - the COA only gates: `assault` authorises bounds in exactly the phases that did before
       (`boundPhases()`: assault, capture, clear-town), `defend` authorises none, and in every other phase the
       two are identical (a contact that starts on the approach is not gated by either);
     - flag off, `sq.coa` is never set and a squad with the leader down bounds like any other;
     - a bound waits `BOUND_CYCLE` after every contact start, so a contact that blinks faster than that never
       bounds under either COA (what the COA has left to gate);
     - `_assaultAuthorized` has one writer file.

   Engagement's contact report is scripted (the Squad Leader reads it and nothing else here); the module is
   loaded from its shipping source with a stub `location`. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
const SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/16-squad-plan-stability.js'), 'utf8');
const SEED = +(process.env.HARNESS_SEED || 12345);
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
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
  new Function('window', 'globalThis', 'console', 'location', SRC)(
    r,
    r,
    { log() {}, warn() {} },
    search == null ? undefined : { search }
  );
  const b = H.makeBattle(r, { seed: SEED }),
    w = { r, b, S: r.BattleSquadStability, events, made: 0, report: { inContact: false, effective: 4, pinned: 0 } };
  /* Engagement's squad report is scripted: `w.report` says whether the squad is in contact and how many men
     are shooting; everything the Squad Leader does with it is the shipping code. */
  r.BattleEngagement.updateSquad = function (sq) {
    const was = !!sq.inContact;
    sq.inContact = w.report.inContact;
    return {
      contactStarted: sq.inContact && !was,
      effective: w.report.effective,
      pinned: w.report.pinned,
      fireSupport: sq.members.filter(s => !s.dead)
    };
  };
  return w;
}
/* A ten-man squad in fireteams alpha/bravo/charlie, `dead` casualties taken from the end of the list (the
   leader, member 0, stays), mean stress `stress` and command phase `phase`. */
function squad(w, opts) {
  opts = opts || {};
  const sq = H.addSquad(w.r, w.b, { id: 'us-' + w.made++, faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  sq.members.forEach((s, i) => {
    s._fireteamKey = ['alpha', 'bravo', 'charlie'][i % 3];
  });
  for (let i = 0; i < (opts.dead || 0); i++) sq.members[9 - i].dead = true;
  if (opts.leaderDown) sq.members[0].dead = true;
  if (opts.stress != null) sq.mind = { mean: opts.stress, n: 10 };
  w.S.initialPhase(sq, opts.phase || 'assault');
  return sq;
}
function tick(w, sq, seconds, per) {
  const out = [];
  for (let t = 0; t < seconds - 1e-9; t += 0.15) {
    w.b.time += 0.15;
    w.S.fireAndMovement(sq, w.b);
    out.push(!!sq._assaultAuthorized);
    if (per) per(t);
  }
  return out;
}
const bounds = w => w.events.filter(e => e.type === 'decision-bound').length;
/* Bring a squad into contact and hold it there `seconds` seconds. */
function contact(w, sq, seconds) {
  w.report.inContact = true;
  return tick(w, sq, seconds);
}
function calm(w, sq, seconds) {
  w.report.inContact = false;
  return tick(w, sq, seconds);
}

test('?coa=1 is the only flag that turns the COA on, and it is off by default', () => {
  const parsed = ['', '?seed=1', '?coa=1', '?x=1&coa=1', '?coa=1&x=1', '?coa=10', '?coa=0', '?xcoa=1', '?morale=1'].map(q =>
    world(q).S.coaOn()
  );
  assert.deepEqual(parsed, [false, false, true, true, true, false, false, false, false]);
  assert.equal(world(null).S.coaOn(), false);
  assert.deepEqual(world('?coa=1').S.coas().sort(), ['assault', 'defend']);
  assert.deepEqual(world('?coa=1').S.boundPhases().sort(), ['assault', 'capture', 'clear-town']);
});

test('the declared scores: assault while 2.5 x casualties + 1.5 x stress + 2 x leaderDown <= 1, a tie is assault', () => {
  const S = world('?coa=1').S;
  let checked = 0;
  for (let c = 0; c <= 10; c++)
    for (let k = 0; k <= 20; k++)
      for (const L of [0, 1]) {
        const inp = { casualtyFrac: c / 10, stress: k / 20, leaderDown: L },
          margin = 2.5 * inp.casualtyFrac + 1.5 * inp.stress + 2 * L - 1;
        if (Math.abs(margin) < 1e-6) continue; /* the tie is pinned on its own below */
        const d = S.coaDecide(inp);
        assert.equal(d.winner, margin < 0 ? 'assault' : 'defend', JSON.stringify(inp));
        checked++;
      }
  const tie = S.coaDecide({ casualtyFrac: 0.4, stress: 0, leaderDown: 0 });
  assert.equal(tie.winner, 'assault', 'four of ten with calm men and a leader is a tie, and a tie goes to the first name');
  assert.ok(Math.abs(tie.scores.assault - tie.scores.defend) < 1e-9);
  assert.equal(S.coaDecide({ casualtyFrac: 0.5, stress: 0, leaderDown: 0 }).winner, 'defend', 'five of ten defends');
  assert.equal(S.coaDecide({ casualtyFrac: 0, stress: 0, leaderDown: 1 }).winner, 'defend', 'a leader down defends on its own');
  assert.equal(S.coaDecide({ casualtyFrac: 0, stress: 0, leaderDown: 0 }).winner, 'assault', 'fresh: assault');
  assert.equal(S.coaDecide({ casualtyFrac: 0.3, stress: 0.22, leaderDown: 0 }).winner, 'defend', '3 of 10 at the mean stress of a retreating squad (0.22) defends');
  assert.equal(S.coaDecide({ casualtyFrac: 0.2, stress: 0.22, leaderDown: 0 }).winner, 'assault');
  console.log('     ' + checked + ' input points match the closed form');
});

test('the inputs are read off the squad: casualties over its establishment, the roll-up mean, the leader', () => {
  const w = world('?coa=1'),
    a = squad(w, { dead: 3, stress: 0.25 }),
    b = squad(w, { leaderDown: true });
  const near = (x, y) => assert.ok(Math.abs(x - y) < 1e-12, x + ' vs ' + y); /* 1 - 7/10 is 0.30000000000000004 */
  near(w.S.coaInputs(a).casualtyFrac, 0.3);
  assert.equal(w.S.coaInputs(a).stress, 0.25);
  assert.equal(w.S.coaInputs(a).leaderDown, 0);
  near(w.S.coaInputs(b).casualtyFrac, 0.1);
  assert.equal(w.S.coaInputs(b).stress, 0);
  assert.equal(w.S.coaInputs(b).leaderDown, 1);
  a.establishment = 5; /* a merged squad's strength */
  near(w.S.coaInputs(a).casualtyFrac, 1 - 7 / 5);
});

test('scored at contact start and only there: a contact that starts fresh stays assault as casualties mount', () => {
  const w = world('?coa=1'),
    sq = squad(w, { phase: 'assault' });
  calm(w, sq, 1);
  assert.equal(sq.coa, undefined, 'nothing is scored before a contact');
  contact(w, sq, 0.15);
  assert.equal(sq.coa, 'assault');
  for (let i = 0; i < 6; i++) sq.members[9 - i].dead = true; /* six down, mid-contact */
  sq.members[0].dead = true;
  const auth = contact(w, sq, 12);
  assert.equal(sq.coa, 'assault', 'the choice is not revisited inside a contact');
  assert.ok(auth.every(Boolean), 'and the bounds stay authorised for it');
});

test('scored again at every contact start: defend with the leader down, assault once a leader is back', () => {
  const w = world('?coa=1'),
    sq = squad(w, { phase: 'assault', leaderDown: true });
  contact(w, sq, 0.15);
  assert.equal(sq.coa, 'defend');
  sq.members[0].dead = false; /* a leader takes command */
  contact(w, sq, 5);
  assert.equal(sq.coa, 'defend', 'still the old choice inside the contact');
  calm(w, sq, 0.3);
  contact(w, sq, 0.15);
  assert.equal(sq.coa, 'assault', 'a new contact start scores the squad again');
});

test('the COA gates bounds only in the bounding phases; outside them assault and defend are the same squad', () => {
  const phases = Object.keys(world('?coa=1').S.states),
    bounding = ['assault', 'capture', 'clear-town'];
  assert.equal(phases.length, 11);
  for (const phase of phases)
    for (const leaderDown of [false, true]) {
      const w = world('?coa=1'),
        sq = squad(w, { phase, leaderDown }),
        auth = contact(w, sq, 1);
      assert.equal(sq.coa, leaderDown ? 'defend' : 'assault');
      assert.equal(auth.every(Boolean), bounding.includes(phase) && !leaderDown, `${phase}, leader down ${leaderDown}`);
      assert.ok(auth.every(a => a === auth[0]), 'no flicker inside a contact');
    }
});

test('assault bounds a fireteam after BOUND_CYCLE; defend never does, and never rotates a team', () => {
  for (const phase of ['assault', 'capture', 'clear-town']) {
    const a = world('?coa=1'),
      sa = squad(a, { phase });
    contact(a, sa, 8.5);
    assert.equal(bounds(a), 0, 'the first ' + a.S.boundCycle + ' s of a contact hold the bounds');
    contact(a, sa, 1.5);
    assert.equal(bounds(a), 1, phase + ': one bound in the first cycle after it');
    assert.equal(a.events.find(e => e.type === 'decision-bound').data.team, 'alpha');
    const d = world('?coa=1'),
      sd = squad(d, { phase, leaderDown: true });
    contact(d, sd, 60);
    assert.equal(sd.coa, 'defend');
    assert.equal(bounds(d), 0, phase + ': defend sends no bound in a minute');
    assert.equal(sd._boundTurn == null, true, 'and the team rotation never starts');
    assert.equal(d.r.BattleLeases.get(sd, 'bound'), null);
  }
});

test('flag off: sq.coa is never set and a squad with the leader down bounds like any other', () => {
  const w = world(''),
    sq = squad(w, { phase: 'assault', leaderDown: true, dead: 5, stress: 0.9 });
  contact(w, sq, 12);
  assert.equal(sq.coa, undefined);
  assert.equal(bounds(w), 1);
});

test('a contact that blinks faster than BOUND_CYCLE never bounds, under either COA (each start renews the wait)', () => {
  for (const search of ['', '?coa=1']) {
    const w = world(search),
      sq = squad(w, { phase: 'assault' });
    for (let i = 0; i < 12; i++) {
      contact(w, sq, 8); /* 8 s of contact, one tick of quiet, and again */
      calm(w, sq, 0.15);
    }
    assert.equal(bounds(w), 0, search + ': 12 contacts of 8 s, no bound');
    const steady = world(search),
      ss = squad(steady, { phase: 'assault' });
    contact(steady, ss, 100);
    assert.ok(bounds(steady) >= 8, search + ': the same 100 s of unbroken contact bounds about every 9 s (' + bounds(steady) + ')');
  }
});

test('_assaultAuthorized has one writer file (the Squad Leader)', () => {
  const dir = path.join(H.REPO, 'battle'),
    files = fs
      .readdirSync(dir)
      .filter(f => f.endsWith('.js'))
      .concat(fs.readdirSync(path.join(dir, 'modules')).filter(f => f.endsWith('.js')).map(f => 'modules/' + f)),
    writers = files.filter(f =>
      /\._assaultAuthorized\s*=(?!=)/.test(fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ''))
    );
  assert.deepEqual(writers, ['modules/16-squad-plan-stability.js']);
});

console.log('PASS ' + n + ' COA checks');
