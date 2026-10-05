#!/usr/bin/env node
'use strict';
/* The Squad Leader reads its men's stress for local execution (module 16 `fireAndMovement`, `?slStress=pick,hold,review`,
   all three on by default, `0`/`off` none; `1`/`all` is all three, a list exactly those named). This file pins:

     - the flag parse, and that with it off (`0`, `off`, an unknown name) the Squad Leader sends the same teams in the
       same order and writes the same telemetry whatever its men's stress (the rotation is stress-blind);
     - `pick`: of the teams that can bound (movers and two men left shooting), the one whose movers' mean stress is
       lowest goes; a tie keeps the rotation's order; a team that cannot go is never picked however calm;
     - `hold`: when every team that could go is at the shaken band (`tuning.lead.holdAt`, 0.30) no bound is sent and the
       cycle waits `BOUND_CYCLE` (a `bound-cycle` lease, `decision-bound-held`); one team under the band and it bounds;
       with `hold` alone the rotation's team goes even if it is the shaken one;
     - `review`: a squad on a hold/support/regroup brief whose mean stays at or over `reviewAt` (1/3) for `reviewAfter`
       (10 s) of contact with `reviewMin` (3) living men asks for a doctrine review, once per brief; not sooner, not with
       fewer men, not on an attack brief, not after the mean dips (the clock starts again), not with the flag off;
     - module 17's accessors read stress only through the `lead` lever (`?mind=0`, `observe` or a list without `lead`
       read calm men).

   Engagement's contact report is scripted, as in coa-check.js; module 16 is loaded from its shipping source with a stub
   `location` and fire control off (its hold is a different decision with its own check). Stress is read through a
   stub with module 17's contract (the movers' mean, the squad roll-up); the real accessors are tested at the end. */
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
const TEAMS = ['alpha', 'bravo', 'charlie'];

function world(flags) {
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
    events = [],
    sent = [];
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
  r.BattleSoldierMind = {
    teamStress(men) {
      return men.length ? men.reduce((a, s) => a + (s.mind ? s.mind.stress : 0), 0) / men.length : 0;
    },
    leadStress(sq) {
      return sq && sq.mind ? sq.mind.mean || 0 : 0;
    }
  };
  const search = '?fireControl=0' + (flags == null ? '' : '&' + flags);
  new Function('window', 'globalThis', 'console', 'location', FC_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', BP_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', SF_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', LL_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', ME_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', FAM_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', SRC)(r, r, { log() {}, warn() {} }, { search });
  const b = H.makeBattle(r, { seed: SEED }),
    w = { r, b, S: r.BattleSquadStability, events, sent, made: 0, report: { inContact: false, effective: 6, pinned: 0 } };
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
  const order = r.BattleEngagement.orderBound;
  r.BattleEngagement.orderBound = function (movers) {
    sent.push(movers[0]._fireteamKey);
    return order.apply(this, arguments);
  };
  return w;
}
/* A ten-man squad in fireteams alpha/bravo/charlie (member i in TEAMS[i % 3]), each team's men at `stress[team]`. */
function squad(w, stress, opts) {
  opts = opts || {};
  const sq = H.addSquad(w.r, w.b, { id: 'us-' + w.made++, faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  sq.members.forEach((s, i) => {
    s._fireteamKey = TEAMS[i % 3];
    s.mind = { stress: (stress && stress[s._fireteamKey]) || 0 };
  });
  for (let i = 0; i < (opts.dead || 0); i++) sq.members[9 - i].dead = true;
  sq.mind = { mean: opts.mean || 0, n: 10 };
  w.S.initialPhase(sq, opts.phase || 'assault');
  return sq;
}
function tick(w, sq, seconds) {
  for (let t = 0; t < seconds - 1e-9; t += 0.15) {
    w.b.time += 0.15;
    w.S.fireAndMovement(sq, w.b);
  }
}
function fight(w, sq, seconds) {
  w.report.inContact = true;
  tick(w, sq, seconds);
}
const of = (w, type) => w.events.filter(e => e.type === type);

test('the flag: all three by default, 0/off none, 1/all/on all three, a list exactly those named', () => {
  const S = world('').S;
  assert.deepEqual(S.slStress(), { pick: true, hold: true, review: true }, 'absent');
  const p = q => Object.keys(S.parseSlStress(q)).sort();
  assert.deepEqual(p(''), ['hold', 'pick', 'review']);
  assert.deepEqual(p('?slStress='), ['hold', 'pick', 'review']);
  assert.deepEqual(p('?slStress=0'), []);
  assert.deepEqual(p('?slStress=off'), []);
  assert.deepEqual(p('?slStress=bogus'), []);
  assert.deepEqual(p('?slStress=1'), ['hold', 'pick', 'review']);
  assert.deepEqual(p('?slStress=all'), ['hold', 'pick', 'review']);
  assert.deepEqual(p('?slStress=pick'), ['pick']);
  assert.deepEqual(p('?x=1&slStress=hold,review'), ['hold', 'review']);
  assert.deepEqual(world('slStress=pick,hold').S.slStress(), { pick: true, hold: true });
  assert.equal(S.tuning.lead.holdAt, 0.3);
  assert.ok(Math.abs(S.tuning.lead.reviewAt - 1 / 3) < 1e-12);
});

test('off: the rotation is stress-blind, the same teams in the same order and the same telemetry as calm men', () => {
  const run = (flags, stress) => {
    const w = world(flags),
      sq = squad(w, stress);
    fight(w, sq, 60);
    return { sent: w.sent.slice(), events: JSON.stringify(of(w, 'decision-bound').map(e => e.data)) };
  };
  const calm = run('slStress=0', null);
  assert.ok(calm.sent.length >= 5, 'it bounds: ' + calm.sent.length);
  assert.deepEqual(calm.sent.slice(0, 3), ['alpha', 'bravo', 'charlie'], 'round robin');
  for (const f of ['slStress=0', 'slStress=off', 'slStress=bogus', 'slStress=review'])
    assert.deepEqual(run(f, { alpha: 0.9, bravo: 0.05, charlie: 0.5 }), calm, String(f));
});

test('pick: the calmest team that can go is sent, a tie keeps the rotation', () => {
  let w = world('slStress=pick'),
    sq = squad(w, { alpha: 0.6, bravo: 0.1, charlie: 0.3 });
  fight(w, sq, 12);
  assert.equal(w.sent[0], 'bravo', 'the rotation would send alpha');
  const d = of(w, 'decision-bound')[0].data;
  assert.equal(d.reason, 'calmest');
  assert.equal(d.rotation, 'alpha');
  assert.equal(d.stress, 0.1);
  w = world('slStress=pick');
  sq = squad(w, { alpha: 0.2, bravo: 0.2, charlie: 0.2 });
  fight(w, sq, 12);
  assert.equal(w.sent[0], 'alpha', 'tie: rotation order');
  assert.equal(of(w, 'decision-bound')[0].data.reason, 'rotation');
  /* bravo is the calmest but every bravo man is suppressed: it cannot go, so charlie (calmer than alpha) does. */
  w = world('slStress=pick');
  sq = squad(w, { alpha: 0.6, bravo: 0, charlie: 0.3 });
  sq.members.forEach(s => {
    if (s._fireteamKey === 'bravo') s.suppressedUntil = 1e9;
  });
  fight(w, sq, 12);
  assert.equal(w.sent[0], 'charlie');
});

test('hold: every team at the shaken band holds the cycle; one under it and the squad bounds', () => {
  let w = world('slStress=hold'),
    sq = squad(w, { alpha: 0.4, bravo: 0.3, charlie: 0.8 });
  fight(w, sq, 30);
  assert.equal(w.sent.length, 0, 'no bound while every team is shaken');
  const held = of(w, 'decision-bound-held');
  assert.ok(held.length >= 2, 'held once a cycle: ' + held.length);
  assert.ok(held.length <= 3, 'not every tick: ' + held.length);
  assert.equal(held[0].data.teams, 3);
  const cycle = w.r.BattleLeases.get(sq, 'bound-cycle');
  assert.ok(cycle && /bound held/.test(cycle.reason), 'the cycle waits: ' + (cycle && cycle.reason));
  /* calm one team down and the next cycle bounds; with hold alone the rotation's team goes, shaken or not. */
  w = world('slStress=hold');
  sq = squad(w, { alpha: 0.5, bravo: 0.29, charlie: 0.5 });
  fight(w, sq, 12);
  assert.equal(of(w, 'decision-bound-held').length, 0);
  assert.equal(w.sent[0], 'alpha', 'hold does not pick');
});

function brief(sq, action, version) {
  sq._macroMission = { version: version || 1, intent: action, action, point: { x: 0, z: 100 }, status: 'executing' };
}
const reviews = sq => (sq._macroMissionRequest && sq._macroMissionRequest.why === 'squad stress' ? 1 : 0);

test('review: shaken in contact for reviewAfter on a hold brief asks for a doctrine review, once', () => {
  let w = world('slStress=review'),
    sq = squad(w, null, { mean: 0.4, phase: 'hold' });
  brief(sq, 'hold');
  fight(w, sq, 9.5);
  assert.equal(reviews(sq), 0, 'not before reviewAfter');
  fight(w, sq, 1);
  assert.equal(reviews(sq), 1);
  assert.equal(sq._macroMissionRequest.reason, 'doctrine-review');
  const at = sq._macroMissionRequest.at;
  fight(w, sq, 20);
  assert.equal(sq._macroMissionRequest.at, at, 'once per brief');
  assert.equal(of(w, 'decision-captain-request').length, 1);
  /* a dip restarts the clock */
  w = world('slStress=review');
  sq = squad(w, null, { mean: 0.4, phase: 'hold' });
  brief(sq, 'support');
  fight(w, sq, 6);
  sq.mind.mean = 0.2;
  fight(w, sq, 1);
  sq.mind.mean = 0.4;
  fight(w, sq, 6);
  assert.equal(reviews(sq), 0, 'the clock started again');
  fight(w, sq, 5);
  assert.equal(reviews(sq), 1);
});

test('review: not with fewer than reviewMin living men, not on an attack brief, not out of contact, not with the flag off', () => {
  const run = (flags, opts, action, inContact) => {
    const w = world(flags),
      sq = squad(w, null, Object.assign({ mean: 0.5, phase: 'hold' }, opts));
    brief(sq, action);
    w.report.inContact = inContact;
    tick(w, sq, 30);
    return reviews(sq);
  };
  assert.equal(run('slStress=review', {}, 'hold', true), 1, 'the control');
  assert.equal(run('slStress=review', { dead: 8 }, 'hold', true), 0, 'two living men');
  assert.equal(run('slStress=review', { dead: 7 }, 'hold', true), 1, 'three');
  assert.equal(run('slStress=review', {}, 'attack', true), 0, 'attack brief');
  assert.equal(run('slStress=review', {}, 'hold', false), 0, 'out of contact');
  assert.equal(run('slStress=pick,hold', {}, 'hold', true), 0, 'review not named');
  assert.equal(run('slStress=0', {}, 'hold', true), 0, 'flag off');
  assert.equal(run(null, {}, 'hold', true), 1, 'on by default');
});

test("module 17's accessors read stress through the lead lever only", () => {
  const men = [{ mind: { stress: 0.2 } }, { mind: { stress: 0.6 } }, {}],
    sq = { mind: { mean: 0.45 } };
  const read = mode => {
    const r = H.bootstrap();
    r.BattleSoldierMind.configure(mode);
    return [r.BattleSoldierMind.teamStress(men), r.BattleSoldierMind.leadStress(sq)];
  };
  const on = read('');
  assert.ok(Math.abs(on[0] - 0.8 / 3) < 1e-12, 'the movers mean, a man with no mind is calm');
  assert.equal(on[1], 0.45);
  assert.deepEqual(read('?mind=lead'), on);
  for (const m of ['?mind=0', '?mind=observe', '?mind=react,aim,hesitate,shock,morale,act'])
    assert.deepEqual(read(m), [0, 0], m);
  const r = H.bootstrap();
  assert.equal(r.BattleSoldierMind.teamStress([]), 0);
  assert.equal(r.BattleSoldierMind.teamStress(null), 0);
  assert.equal(r.BattleSoldierMind.leadStress(null), 0);
  assert.ok(r.BattleSoldierMind.LEVERS.indexOf('lead') >= 0);
});

console.log(n + ' squad-stress checks passed');
