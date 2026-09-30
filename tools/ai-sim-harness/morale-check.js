#!/usr/bin/env node
'use strict';
/* Group morale (phase 3b, `?morale=1`, module 16 `updateSquadState`): the flag-on path, which no check exercised.

   The Squad Leader replaces the flat 60% casualty retreat with a break threshold that stress lowers
   (`breakBase` 0.6 minus `breakSlope` 0.3 per unit of `squad.mind.mean`, floor `breakMin`) and a rally that
   needs calm men (`rallyStress`) and a squad not too depleted (`rallyCasualty`). This file pins what those
   numbers do on a ten-man squad, because the casualty fraction moves in steps of 0.1:

     - the flag is read once at load from `location.search` (`?morale=1` only) and is off by default;
     - off, and on with calm men, the decision is exactly the flat rule (retreat at 6 of 10, with no memory);
     - on, a break earlier than the flat rule needs a mean stress of 1/3 (5 casualties), 2/3 (4) or 1 (3);
       2 or fewer never break, and `breakMin` is never reached (the lowest threshold is 0.3);
     - on, a retreating squad rallies only with under 5 casualties AND mean stress under 0.15, so a squad
       that broke at 5 or 6 casualties cannot rally, and a merged squad (strength restored to 10) stays in
       `retreat` while its men are still shaken, where the flat rule releases it at once;
     - the numbers are read live from `BattleSquadStability.tuning.morale` (the diagnostic arms turn them);
     - only the mean is read, never the max; without `squad.mind` the stress is 0.

   Characterisation of the shipped numbers (Part A of the 3b/3c investigation): a fix changes this file.
   The module is loaded from its shipping source with a stub `location`, so nothing here is a copy. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
const SRC = fs.readFileSync(path.join(H.REPO, 'battle/modules/16-squad-plan-stability.js'), 'utf8');
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
  new Function('window', 'globalThis', 'console', 'location', SRC)(
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

test('?morale=1 is the only flag that turns morale on, and it is off by default', () => {
  const parsed = ['', '?seed=1', '?morale=1', '?x=1&morale=1', '?morale=1&x=1', '?morale=10', '?morale=0', '?xmorale=1', '?coa=1'].map(
    q => [world(q).S.moraleOn(), world(q).S.coaOn()]
  );
  assert.deepEqual(parsed, [
    [false, false],
    [false, false],
    [true, false],
    [true, false],
    [true, false],
    [false, false],
    [false, false],
    [false, false],
    [false, true]
  ]);
  assert.equal(world(null).S.moraleOn(), false, 'with no location at all (the Node harness) it is off');
  assert.equal(world('').S.tuning.morale.breakBase, 0.6, 'the calm-men threshold is the flat 60%');
});

test('flag off: the flat rule, whatever the men feel, and no memory (a squad under 6 casualties is not retreating)', () => {
  for (const q of ['', '?coa=1']) {
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

test('flag on: rally needs under 5 casualties and mean stress under 0.15; 5 or more casualties never rally', () => {
  const w = world('?morale=1');
  for (let dead = 5; dead <= 9; dead++)
    for (const s of [0, 0.05, 0.1, 0.14])
      assert.equal(decide(w, dead, s, 'retreat'), 'retreat', `${dead} dead, calm (${s}): cannot rally on their own`);
  assert.equal(decide(w, 4, 0.1, 'retreat'), 'advance', '4 dead and calm: rallies');
  assert.equal(decide(w, 4, 0.14, 'retreat'), 'advance');
  assert.equal(decide(w, 4, 0.15, 'retreat'), 'retreat', 'the stress test is strict');
  assert.equal(decide(w, 4, 0.16, 'retreat'), 'retreat');
  const rallied = decide(w, 4, 0.1, 'retreat');
  assert.equal(rallied, 'advance');
  assert.equal(decide(w, 4, 0.1, rallied), 'advance', 'a rallied calm squad does not break again (no churn)');
});

test('flag on: a merged squad (10 living on an establishment of 10) stays in retreat until its men are calm; flag off releases it at once', () => {
  const on = world('?morale=1'),
    off = world('');
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
  assert.deepEqual(w.S.tuning.morale, { breakBase: 0.6, breakSlope: 0.3, breakMin: 0.25, rallyStress: 0.15, rallyCasualty: 0.5 });
  assert.equal(decide(w, 4, 0.3, 'advance'), 'advance');
  w.S.tuning.morale.breakSlope = 0.9; /* the diagnostic arm's dose: a squad at stress 0.3 breaks at 0.33 */
  assert.equal(decide(w, 4, 0.3, 'advance'), 'retreat');
  w.S.tuning.morale.rallyCasualty = 0.61;
  w.S.tuning.morale.rallyStress = 0.5;
  assert.equal(decide(w, 5, 0.4, 'retreat'), 'advance', 'a raised rally ceiling lets a 5-casualty squad rally');
});

console.log('PASS ' + n + ' morale checks');
