#!/usr/bin/env node
'use strict';
/* Course of action on contact (phase 3c, module 16 `fireAndMovement`): on by default; `?coa=0`/off is the
   legacy no-COA control.

   On every tick the squad is in contact the Squad Leader scores the declared COAs (`assault`, `defend`)
   against declared inputs (casualty fraction, mean stress, leader down) with declared weights and keeps the
   winner as `sq.coa`. `defend` holds the bounds; `assault` changes nothing. This file pins:

     - the flag is read once at load from `location.search`: on by default, `?coa=0`/off/false disables it;
     - the scores are the declared tables: `assault` wins while 2.5 x casualties + 1.5 x stress + 2 x leaderDown
       <= 1, a tie goes to `assault` (first by name), a leader down is `defend` on its own;
     - the choice is the better score (a tie is `assault`) on the squad's inputs at that tick, inside a contact as
       well as at its start: a squad whose casualties, stress or leader change mid-fight changes its COA in it,
       and a contact that blinks is not a new decision (there is no margin: one measured in Part B latched squads
       in `defend`, and it is not in the tuning);
     - the COA only gates: `assault` authorises bounds in exactly the phases that did before
       (`boundPhases()`: assault, capture, clear-town), `defend` authorises none, and in every other phase the
       two are identical (a contact that starts on the approach is not gated by either);
     - with `?coa=0`, `sq.coa` is never set and a squad with the leader down bounds like any other;
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
const FC_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15a-squad-leader-fire-control.js'), 'utf8');
const BP_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15b-squad-leader-buddy-pairs.js'), 'utf8');
const SF_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15c-squad-leader-scouts-forward.js'), 'utf8');
const LL_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15d-squad-leader-leaderless-intent.js'), 'utf8');
const ME_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15e-squad-leader-morale-coa.js'), 'utf8');
const FAM_SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/15j-squad-leader-fire-and-movement.js'), 'utf8');
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
  new Function('window', 'globalThis', 'console', 'location', FC_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', BP_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', SF_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', LL_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', ME_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', FAM_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', SRC)(
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

test('COA is on by default; only explicit 0/off/false disables it', () => {
  const parsed = ['', '?seed=1', '?coa=1', '?x=1&coa=1', '?coa=10', '?coa=0', '?coa=off', '?coa=false', '?xcoa=0', '?morale=1'].map(q =>
    world(q).S.coaOn()
  );
  assert.deepEqual(parsed, [true, true, true, true, true, false, false, false, true, true]);
  assert.equal(world(null).S.coaOn(), true, 'no location: same default as the page');
  assert.deepEqual(world('').S.coas().sort(), ['assault', 'defend']);
  assert.deepEqual(world('').S.boundPhases().sort(), ['assault', 'capture', 'clear-town']);
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

/* Leader-down cases in this file explicitly isolate the pre-#197 control arm. COA owns the scoring
   rule itself; leaderless-intent continuation owns whether an absent Squad Leader is allowed to make a fresh
   COA decision during succession. Testing those two behaviors in the same assertion would weaken both contracts. */

test('the COA follows the squad inside a contact, in both directions, and the bounds follow it', () => {
  const w = world('?coa=1'),
    sq = squad(w, { phase: 'assault' });
  calm(w, sq, 1);
  assert.equal(sq.coa, undefined, 'nothing is chosen before a contact');
  contact(w, sq, 0.3);
  assert.equal(sq.coa, 'assault', 'a fresh squad: assault');
  for (let i = 0; i < 4; i++) sq.members[9 - i].dead = true; /* four down: a tie, and assault wins a tie */
  let auth = contact(w, sq, 1);
  assert.equal(sq.coa, 'assault');
  assert.ok(auth.at(-1));
  sq.mind = { mean: 0.1, n: 6 }; /* shaken: defend now leads by 0.15 */
  auth = contact(w, sq, 0.3);
  assert.equal(sq.coa, 'defend', 'no margin: the better score at once, inside the contact');
  assert.ok(!auth.at(-1), 'and the bounds are held from that tick');
  sq.mind = { mean: 0, n: 6 }; /* the men calm down: the tie is assault again */
  auth = contact(w, sq, 0.3);
  assert.equal(sq.coa, 'assault', 'it follows the inputs back too');
  assert.ok(auth.at(-1));
  for (let i = 0; i < 6; i++) sq.members[9 - i].dead = true; /* six down, mid-contact */
  contact(w, sq, 0.3);
  assert.equal(sq.coa, 'defend', 'six of ten: defend');
  for (let i = 0; i < 6; i++) sq.members[9 - i].dead = false; /* a merge restores the squad */
  contact(w, sq, 0.3);
  assert.equal(sq.coa, 'assault');
  const d = world('?coa=1&leaderlessIntent=0'),
    sd = squad(d, { phase: 'assault', leaderDown: true });
  contact(d, sd, 0.3);
  assert.equal(sd.coa, 'defend', 'a leader down is defend on its own');
  sd.members[0].dead = false; /* a leader takes command */
  contact(d, sd, 0.3);
  assert.equal(sd.coa, 'assault', 'and it is assault again in the same contact');
});

test('a blink is not a decision: the COA is a function of the inputs, so the same inputs give the same COA across it', () => {
  const w = world('?coa=1'),
    sq = squad(w, { phase: 'assault', dead: 5 });
  contact(w, sq, 0.3);
  const first = sq.coa;
  assert.equal(first, 'defend');
  for (let i = 0; i < 5; i++) {
    calm(w, sq, 0.3);
    contact(w, sq, 0.3);
    assert.equal(sq.coa, first);
  }
  assert.deepEqual(Object.keys(w.S.tuning.coa), ['weights'], 'the COA has weights and no margin or timer of its own');
});

test('the COA gates bounds only in the bounding phases; outside them assault and defend are the same squad', () => {
  const phases = Object.keys(world('?coa=1').S.states),
    bounding = ['assault', 'capture', 'clear-town'];
  assert.equal(phases.length, 11);
  for (const phase of phases)
    for (const leaderDown of [false, true]) {
      const w = world('?coa=1&leaderlessIntent=0'),
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
    contact(a, sa, 6.5);
    assert.equal(bounds(a), 0, 'the first ' + a.S.boundCycle + ' s of a contact hold the bounds');
    contact(a, sa, 1.5);
    assert.equal(bounds(a), 1, phase + ': one bound in the first cycle after it');
    assert.equal(a.events.find(e => e.type === 'decision-bound').data.team, 'alpha');
    const d = world('?coa=1&leaderlessIntent=0'),
      sd = squad(d, { phase, leaderDown: true });
    contact(d, sd, 60);
    assert.equal(sd.coa, 'defend');
    assert.equal(bounds(d), 0, phase + ': defend sends no bound in a minute');
    assert.equal(sd._boundTurn == null, true, 'and the team rotation never starts');
    assert.equal(d.r.BattleLeases.get(sd, 'bound'), null);
  }
});

test('explicitly off: sq.coa is never set and a squad with the leader down bounds like any other', () => {
  const w = world('?coa=0&leaderlessIntent=0'),
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
      contact(w, sq, 6); /* 6 s of contact, one tick of quiet, and again */
      calm(w, sq, 0.15);
    }
    assert.equal(bounds(w), 0, search + ': 12 contacts of 6 s, no bound');
    const steady = world(search),
      ss = squad(steady, { phase: 'assault' });
    contact(steady, ss, 100);
    assert.ok(bounds(steady) >= 8, search + ': the same 100 s of unbroken contact bounds about every 7 s (' + bounds(steady) + ')');
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
  assert.deepEqual(writers.sort(), ['modules/15j-squad-leader-fire-and-movement.js', 'modules/16-squad-plan-stability.js']);
});

console.log('PASS ' + n + ' COA checks');
