#!/usr/bin/env node
'use strict';
/* Group morale (phase 3b, on by default, `?morale=0` turns it off; module 16 `updateSquadState`).

   The Squad Leader replaces the flat 60% casualty retreat with a break threshold that stress lowers
   (`breakBase` 0.6 minus `breakSlope` 0.3 per unit of `squad.mind.mean`, floor `breakMin`) and a rally that
   needs calm men (`rallyStress`) and a squad not too depleted (`rallyCasualty`). This file pins what those
   numbers do on a ten-man squad, because the casualty fraction moves in steps of 0.1:

     - the flag is read once at load from `location.search`: morale is on unless the URL says `?morale=0`, in the page and
       in the Node harness (no `location`) alike;
     - off, and on with calm men, the decision is exactly the flat rule (retreat at 6 of 10, with no memory);
     - on, a break earlier than the flat rule needs a mean stress of 1/3 (5 casualties), 2/3 (4) or 1 (3);
       2 or fewer never break, and `breakMin` is never reached (the lowest threshold is 0.3);
     - on, a retreating squad rallies when its men are calm (mean stress under 0.15) and it sits `rallyGap` of a
       casualty fraction below where it would break at that stress: a squad that broke early on stress (5 or 4
       casualties) comes back when calm, a squad the flat rule broke (6 or more) never does, and a rallied squad
       does not break again on the same inputs (the gap is hysteresis by construction, for every count and stress);
     - the numbers are read live from `BattleSquadStability.tuning.morale` (the diagnostic arms turn them);
     - only the mean is read, never the max; without `squad.mind` the stress is 0.

   Part A pinned the shipped numbers (a rally ceiling of 0.5 casualties, so nothing that broke at 5 or 6 could
   rally); Part B replaced the ceiling with the gap and this file with it.
   The module is loaded from its shipping source with a stub `location`, so nothing here is a copy. */
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
const SEED = +(process.env.HARNESS_SEED || 12345);
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}

/* One world per load: the module keeps its tuning in a closure, so a world's numbers are its own. */
function world(search) {
  H.resetIds();
  const r = H.bootstrap({ modules: false });
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
  new Function('window', 'globalThis', 'console', 'location', FC_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', BP_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', SF_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', LL_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', ME_SRC)(r, r, console, r.location); new Function('window', 'globalThis', 'console', 'location', SRC)(
    r,
    r,
    { log() {}, warn() {} },
    search == null ? undefined : { search }
  );
  const b = H.makeBattle(r, { seed: SEED });
  return { r, b, S: r.BattleSquadStability, made: 0 };
}
/* A ten-man squad with `dead` casualties, roll-up mean stress `stress` (null: no roll-up) and a prior state.
   Called with no battle, `updateSquad` runs the status decision and nothing else. */
function decide(w, dead, stress, prior, opts) {
  const sq = H.addSquad(w.r, w.b, {
    id: 'us-' + w.made++,
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 100 }
  });
  if (opts && opts.establishment) sq.establishment = opts.establishment;
  sq.members.slice(0, dead).forEach(s => {
    s.dead = true;
  });
  sq.state = prior || 'advance';
  if (stress != null) sq.mind = { mean: stress, max: opts && opts.max != null ? opts.max : stress, n: 10 - dead };
  w.r.SquadAI.updateSquad(sq, null);
  return sq.state;
}
const flat = (dead, prior) => (dead / 10 >= 0.6 ? 'retreat' : 'advance');
const STRESSES = [0, 0.05, 0.1, 0.15, 0.22, 0.34, 0.5, 0.7, 1];

test('?morale=0 is the only flag that turns morale off, and it is on by default', () => {
  const parsed = ['', '?seed=1', '?morale=1', '?x=1&morale=0', '?morale=0&x=1', '?morale=10', '?morale=0', '?xmorale=0', '?coa=1', '?coa=0'].map(
    q => [world(q).S.moraleOn(), world(q).S.coaOn()]
  );
  assert.deepEqual(parsed, [
    [true, true],
    [true, true],
    [true, true],
    [false, true],
    [false, true],
    [true, true],
    [false, true],
    [true, true],
    [true, true],
    [true, false]
  ]);
  assert.equal(world(null).S.moraleOn(), true, 'with no location at all (the Node harness) it is on, like the page');
  assert.equal(world('').S.tuning.morale.breakBase, 0.6, 'the calm-men threshold is the flat 60%');
});

test('flag off: the flat rule, whatever the men feel, and no memory (a squad under 6 casualties is not retreating)', () => {
  for (const q of ['?morale=0', '?morale=0&coa=1']) {
    const w = world(q);
    for (let dead = 0; dead <= 10; dead++)
      for (const s of STRESSES) {
        assert.equal(decide(w, dead, s, 'advance'), flat(dead), `${q} ${dead} dead, stress ${s}`);
        assert.equal(decide(w, dead, s, 'retreat'), flat(dead), `${q} retreating, ${dead} dead, stress ${s}`);
      }
  }
});

test('flag on, calm men (stress 0 or no roll-up): exactly the flat rule, from any prior state', () => {
  const w = world('?morale=1');
  for (let dead = 0; dead <= 10; dead++) {
    assert.equal(decide(w, dead, 0, 'advance'), flat(dead), dead + ' dead, stress 0');
    assert.equal(decide(w, dead, null, 'advance'), flat(dead), dead + ' dead, no roll-up');
  }
  assert.equal(w.S.moraleBreakAt(0), 0.6);
});

test('flag on: where stress makes a squad break earlier than the flat rule (the dose map of a ten-man squad)', () => {
  const w = world('?morale=1'),
    first = {};
  for (let dead = 0; dead <= 10; dead++) {
    first[dead] = null;
    for (let k = 0; k <= 1000; k++) {
      const s = k / 1000;
      if ((decide(w, dead, s, 'advance') === 'retreat') !== (flat(dead) === 'retreat')) {
        first[dead] = s;
        break;
      }
    }
  }
  /* Only 3, 4 and 5 casualties can differ, at mean stress 1, 2/3 and 1/3 (the grid is 0.001). */
  assert.deepEqual(first, {
    0: null,
    1: null,
    2: null,
    3: 1,
    4: 0.667,
    5: 0.334,
    6: null,
    7: null,
    8: null,
    9: null,
    10: null
  });
  assert.ok(w.S.moraleBreakAt(1) > w.S.tuning.morale.breakMin, 'breakMin (0.25) is below the lowest threshold (0.3), so it never binds');
  console.log('     first mean stress at which morale breaks a squad the flat rule keeps: ' + JSON.stringify(first));
});

test('flag on: a squad the flat rule keeps is retreating from 5 casualties at mean stress 0.34, not at 0.33', () => {
  const w = world('?morale=1');
  assert.equal(decide(w, 5, 0.33, 'advance'), 'advance');
  assert.equal(decide(w, 5, 0.34, 'advance'), 'retreat');
  assert.equal(decide(w, 4, 0.66, 'advance'), 'advance');
  assert.equal(decide(w, 4, 0.67, 'advance'), 'retreat');
  assert.equal(decide(w, 6, 0, 'advance'), 'retreat', 'the flat break stays a break');
  assert.equal(decide(w, 2, 1, 'advance'), 'advance', 'two of ten never break, however shaken');
});

test('flag on: rally needs calm men and a gap below the break threshold; a flat break (6+) never rallies, an early one (4-5) does', () => {
  const w = world('?morale=1');
  for (let dead = 6; dead <= 9; dead++)
    for (const s of [0, 0.05, 0.1, 0.14])
      assert.equal(decide(w, dead, s, 'retreat'), 'retreat', `${dead} dead, calm (${s}): the flat rule broke it and only a merge undoes that`);
  for (const dead of [4, 5]) {
    assert.equal(decide(w, dead, 0.1, 'retreat'), 'advance', `${dead} dead and calm: rallies`);
    assert.equal(decide(w, dead, 0.14, 'retreat'), 'advance');
    assert.equal(decide(w, dead, 0.15, 'retreat'), 'retreat', 'the stress test is strict');
    assert.equal(decide(w, dead, 0.4, 'retreat'), 'retreat', 'still shaken: not yet');
  }
  assert.equal(decide(w, 5, 0.17, 'retreat'), 'retreat', '5 dead at 0.17 is calm by neither test');
  assert.ok(w.S.moraleRallies(0.5, 0.14) && !w.S.moraleRallies(0.5, 0.16) && !w.S.moraleRallies(0.6, 0));
});

test('flag on: a squad broken early on stress breaks, waits, rallies when calm, and breaks again only on new stress', () => {
  const w = world('?morale=1');
  let state = decide(w, 5, 0.4, 'advance');
  assert.equal(state, 'retreat', 'broken at 5 casualties under stress 0.4');
  state = decide(w, 5, 0.3, state);
  assert.equal(state, 'retreat', 'stress eased but not calm');
  state = decide(w, 5, 0.12, state);
  assert.equal(state, 'advance', 'calm: rallied');
  assert.equal(decide(w, 5, 0.12, state), 'advance', 'and it stays rallied on the same inputs');
  assert.equal(decide(w, 5, 0.4, state), 'retreat', 'new stress breaks it again');
});

test('no flip for any casualty count and stress: whatever rallies does not break on the same inputs', () => {
  const w = world('?morale=1');
  let rallies = 0;
  for (let dead = 0; dead <= 10; dead++)
    for (let k = 0; k <= 200; k++) {
      const s = k / 200,
        after = decide(w, dead, s, 'retreat');
      if (after !== 'retreat') {
        rallies++;
        assert.equal(decide(w, dead, s, after), after, `${dead} dead, stress ${s}: rallied and broke on the same inputs`);
      }
    }
  assert.ok(rallies > 0);
  console.log('     ' + rallies + ' of 2,211 (casualties x stress) points rally, none of them flips');
});

test('flag on: a merged squad (10 living on an establishment of 10) stays in retreat until its men are calm; flag off releases it at once', () => {
  const on = world('?morale=1'),
    off = world('?morale=0');
  for (const s of [0.15, 0.2, 0.34, 0.9]) {
    assert.equal(decide(on, 0, s, 'retreat', { establishment: 10 }), 'retreat', 'flag on, stress ' + s);
    assert.equal(decide(off, 0, s, 'retreat', { establishment: 10 }), 'advance', 'flag off, stress ' + s);
  }
  for (const s of [0, 0.05, 0.14]) assert.equal(decide(on, 0, s, 'retreat', { establishment: 10 }), 'advance', 'flag on, calm ' + s);
  /* A squad that was not merged (still on its old establishment) has the same rule: only casualties count. */
  assert.equal(decide(on, 0, 0.3, 'retreat'), 'retreat');
});

test('the mean is the only stress read: the max, or an absent roll-up, changes nothing', () => {
  const w = world('?morale=1');
  assert.equal(decide(w, 5, 0.1, 'advance', { max: 1 }), 'advance', 'one broken man in a steady squad');
  assert.equal(decide(w, 5, 0.5, 'advance', { max: 0.5 }), 'retreat');
  assert.equal(decide(w, 5, null, 'advance'), 'advance', 'no roll-up reads as calm');
});

test('the numbers are the layer tuning, read live (BattleSquadStability.tuning.morale)', () => {
  const w = world('?morale=1');
  assert.deepEqual(w.S.tuning.morale, { breakBase: 0.6, breakSlope: 0.3, breakMin: 0.25, rallyStress: 0.15, rallyGap: 0.05 });
  assert.equal(decide(w, 4, 0.3, 'advance'), 'advance');
  w.S.tuning.morale.breakSlope = 0.9; /* the diagnostic arm's dose: a squad at stress 0.3 breaks at 0.33 */
  assert.equal(decide(w, 4, 0.3, 'advance'), 'retreat');
  const v = world('?morale=1');
  v.S.tuning.morale.rallyGap = -0.2; /* a negative gap lifts the ceiling past the flat break: only a dose, never shipped */
  assert.equal(decide(v, 6, 0.1, 'retreat'), 'advance');
});

console.log('PASS ' + n + ' morale checks');
