/* Squad Leader morale + course-of-action sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   The parent file calls the factory with its closure constants and re-attaches the returned
   functions as closure variables, so all callers (updateSquadState, fireAndMovement,
   recoverFromRetreat, the public API export) see the same functions as before. The MORALE_ON /
   MORALE_TUNING / COA_ON / COAS / COA_INPUTS / COA_WEIGHTS / COA_TUNING declarations stay in
   16 (load-time flags and the declared tables the checks pin) and are passed into the factory
   via ctx. */
(function (root) {
  'use strict';
  if (root._squadLeaderMoraleCoa) return;

  /* Factory: called by 16-squad-plan-stability.js after the flags and tables are defined.
     ctx provides the closure constants the morale/COA functions need. */
  root._squadLeaderMoraleCoa = function (ctx) {
    var root = ctx.root,
      MORALE_TUNING = ctx.MORALE_TUNING,
      COAS = ctx.COAS,
      COA_INPUTS = ctx.COA_INPUTS,
      COA_WEIGHTS = ctx.COA_WEIGHTS;
  /* A squad's mean stress as the Squad Leader reads it, group morale and the COA alike: through the soldier condition's
     own accessor, so `?mind=0`, `?mind=observe` and a lever list without `morale` read calm men (the flat 60% rule);
     without the module (the harness checks that script a roll-up) it is the roll-up itself. */
  function squadStress(sq) {
    var M = root.BattleSoldierMind;
    if (M && M.squadStress) return M.squadStress(sq);
    return (sq && sq.mind && sq.mind.mean) || 0;
  }
  /* The casualty fraction at which a squad under this mean stress breaks (the flat 60% rule at zero). */
  function moraleBreakAt(stress) {
    return Math.max(MORALE_TUNING.breakMin, MORALE_TUNING.breakBase - MORALE_TUNING.breakSlope * stress);
  }
  /* Whether a retreating squad rallies. The ceiling on casualties is not a number of its own: it is the break
     threshold at the present stress less rallyGap, which is what makes break and rally a hysteresis by
     construction (casualtyFrac < breakAt - gap means the break test on the same inputs is false). */
  function moraleRallies(casualtyFrac, stress) {
    return stress < MORALE_TUNING.rallyStress && casualtyFrac < moraleBreakAt(stress) - MORALE_TUNING.rallyGap;
  }

  /* The declared inputs, read off a squad once; the scores and the choice are then pure functions of
     that record (the same arithmetic in the same order as before, so the probes and checks can score
     recorded inputs with the shipping tables instead of a copy). */
  function coaInputsOf(sq) {
    var out = {};
    for (var k in COA_INPUTS) out[k] = COA_INPUTS[k](sq);
    return out;
  }
  function coaScore(coa, inputs) {
    var w = COA_WEIGHTS[coa], s = w.base || 0, v;
    for (var k in COA_INPUTS) {
      v = w[k] || 0;
      if (v) s += v * inputs[k];
    }
    return s;
  }
  function decideCOA(inputs) {
    var names = Object.keys(COAS).sort(), best = names[0], bestScore = -Infinity, s;
    for (var i = 0; i < names.length; i++) {
      s = coaScore(names[i], inputs);
      if (s > bestScore + 1e-9) { bestScore = s; best = names[i]; }
    }
    return best;
  }
  /* The COA the squad holds after this tick: the better score on its inputs now. Called each tick the squad is
     in contact, never out of it. */
  function updateCOA(sq) {
    return (sq.coa = decideCOA(coaInputsOf(sq)));
  }

    return {
      squadStress: squadStress,
      moraleBreakAt: moraleBreakAt,
      moraleRallies: moraleRallies,
      coaInputsOf: coaInputsOf,
      coaScore: coaScore,
      decideCOA: decideCOA,
      updateCOA: updateCOA
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
