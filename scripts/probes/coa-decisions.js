/* Course of action on contact (module 16 `fireAndMovement`, `?coa=1`): how often the COA is scored, what it
   picks, how long it holds, and what it leaves to gate. Observe only: reads squad, lease and roll-up state,
   writes nothing, draws no random number.

   Run it on a flag-off page too. The winner is then the one the shipping tables WOULD pick from the same
   inputs (`BattleSquadStability.coaDecide`), so `defend` shares and blocked opportunities are a counterfactual
   on the flat battle; on a `?coa=1` page they are the decisions taken, and `selfCheck` compares the recorded
   `sq.coa` with the one re-derived from the inputs of the tick (it must be 0 mismatches).

   Timing. A squad decides at the start of an AI step from the state the last step left, so the inputs of a
   contact start seen at this sample are the previous sample's (`prev`); the phase is the previous one too
   (phases move on the 0.45 s commander tick, after the step).

   One record per contact (Engagement's `sq.contactSince`, which is set when `inContact` turns on):
     phase and inputs at the start, the scores and winner, the length, whether the phase was one that bounds
     (`BattleSquadStability.boundPhases()`), bounds sent (a new `bound` lease), and the opportunity ticks:
     ticks in contact, in a bounding phase, past the bound-cycle and bound leases, with two shooters and not
     everyone pinned, which is everything `fireAndMovement` asks but the COA. Under `defend` each of those is a
     bound the COA withheld (a team may still fail its own test, so it is an upper bound); under `assault` the
     same test read one tick before a bound is the bound itself, so `boundsSent` per bounding contact-minute
     under assault is the rate the withheld ones would have had.
   `authViolations` counts samples where `sq.coa` is `defend` in a bounding phase and `_assaultAuthorized` is
   still true: someone re-set it (must be 0). */
(function (root) {
  'use strict';
  var st;
  var SIDES = ['us', 'ge'];
  function round(x, k) {
    var p = Math.pow(10, k == null ? 3 : k);
    return Math.round((+x || 0) * p) / p;
  }
  function S() {
    return root.BattleSquadStability;
  }
  function snap(sim, sq) {
    var L = root.BattleLeases,
      inp = S().coaInputs(sq),
      bl = L.get(sq, 'bound');
    return {
      inputs: inp,
      phase: sq.commandPhase || '',
      contactSince: sq.contactSince == null ? null : sq.contactSince,
      cycleUntil: L.until(sq, 'bound-cycle'),
      boundUntil: L.until(sq, 'bound'),
      boundSince: bl ? bl.since : null,
      state: sq.state
    };
  }
  function len(sq) {
    var n = 0;
    (sq.members || []).forEach(function (m) {
      if (m && !m.dead) n++;
    });
    return n;
  }
  (root.BattleProbes = root.BattleProbes || {})['coa-decisions'] = {
    every: 0,
    start: function (sim) {
      st = {
        squads: new Map(),
        lastT: null,
        contacts: [],
        selfCheck: { checked: 0, mismatched: 0, examples: [] },
        authViolations: 0,
        squadSec: 0,
        contactSec: 0
      };
    },
    sample: function (sim) {
      var now = +sim.time || 0,
        dt = st.lastT == null ? 0 : now - st.lastT,
        api = S(),
        on = !!(api && api.coaOn && api.coaOn()),
        bounding = api.boundPhases(),
        L = root.BattleLeases;
      st.lastT = now;
      SIDES.forEach(function (side) {
        ((sim.factions && sim.factions[side] && sim.factions[side].squads) || []).forEach(function (sq) {
          var a = st.squads.get(sq);
          if (!a) {
            a = { prev: null, open: null, n: 0 };
            st.squads.set(sq, a);
          }
          var cur = snap(sim, sq),
            p = a.prev;
          a.prev = cur;
          if (!p || len(sq) === 0) {
            if (a.open) {
              a.open.end = round(now, 2);
              a.open.length = round(now - a.open.t, 2);
              a.open = null;
            }
            return;
          }
          st.squadSec += dt;
          var started = cur.contactSince != null && (!a.open || cur.contactSince !== a.open.t);
          if (started) {
            if (a.open) {
              a.open.end = round(now, 2);
              a.open.length = round(now - a.open.t, 2);
            }
            var d = api.coaDecide(p.inputs);
            a.n++;
            a.open = {
              t: cur.contactSince,
              squad: sq.id,
              side: side,
              nth: a.n,
              phase: p.phase,
              bounding: bounding.indexOf(p.phase) >= 0,
              casualtyFrac: round(p.inputs.casualtyFrac),
              stress: round(p.inputs.stress),
              leaderDown: p.inputs.leaderDown,
              scoreAssault: round(d.scores.assault, 4),
              scoreDefend: round(d.scores.defend, 4),
              winner: d.winner,
              recorded: on ? sq.coa || null : null,
              end: null,
              length: null,
              secBounding: 0,
              phaseChanged: false,
              authorizedTicks: 0,
              opportunityTicks: 0,
              blockedTicks: 0,
              boundsSent: 0
            };
            st.contacts.push(a.open);
            if (on) {
              st.selfCheck.checked++;
              if (sq.coa !== d.winner) {
                st.selfCheck.mismatched++;
                if (st.selfCheck.examples.length < 8)
                  st.selfCheck.examples.push({ t: round(now, 2), squad: sq.id, recorded: sq.coa, derived: d.winner, inputs: p.inputs });
              }
            }
          }
          var c = a.open;
          if (c && cur.contactSince == null) {
            c.end = round(now, 2);
            c.length = round(now - c.t, 2);
            a.open = null;
            c = null;
          }
          if (!c) return;
          st.contactSec += dt;
          var inB = bounding.indexOf(p.phase) >= 0;
          if (p.phase !== c.phase) c.phaseChanged = true;
          if (inB) c.secBounding += dt;
          if (sq._assaultAuthorized) c.authorizedTicks++;
          if (on && sq.coa === 'defend' && inB && sq._assaultAuthorized) st.authViolations++;
          /* Everything fireAndMovement asks except the COA, read from the state the step began with. */
          var opp =
            inB &&
            !started &&
            now >= p.cycleUntil &&
            now >= p.boundUntil &&
            (sq.effectiveCount || 0) >= 2 &&
            (sq.pinnedCount || 0) < (sq.effectiveCount || 0);
          if (opp) {
            c.opportunityTicks++;
            if ((on ? sq.coa : c.winner) === 'defend') c.blockedTicks++;
          }
          if (cur.boundSince != null && cur.boundSince !== p.boundSince && Math.abs(cur.boundSince - now) < 1e-6) c.boundsSent++;
        });
      });
    },
    report: function (sim) {
      var open = 0;
      st.squads.forEach(function (a, sq) {
        if (a.open) {
          open++;
          a.open.end = null;
          a.open.length = round((+sim.time || 0) - a.open.t, 2);
        }
      });
      var api = S();
      return {
        flagOn: !!(api && api.coaOn && api.coaOn()),
        moraleOn: !!(api && api.moraleOn && api.moraleOn()),
        boundPhases: api.boundPhases(),
        weights: JSON.parse(JSON.stringify(api.tuning.coa.weights)),
        squadBattles: st.squads.size,
        squadSec: round(st.squadSec, 1),
        contactSec: round(st.contactSec, 1),
        selfCheck: st.selfCheck,
        authViolations: st.authViolations,
        openAtEnd: open,
        contacts: st.contacts
      };
    }
  };
})(window);
