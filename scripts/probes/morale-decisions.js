/* Group morale (module 16 `updateSquadState`, `?morale=1`): how often the morale rule and the flat 60% rule
   disagree, and what the men and the squads look like at the moments it could matter.
   Observe only: reads squad, roll-up and commander state, writes nothing, draws no random number.

   Run it on a flag-off page too. The disagreement counters are then a counterfactual on the flat rule's own
   battle: how many squad-ticks morale WOULD have decided differently (the dose), where the flag-on page
   counts the decisions it actually took. A page that ignores the flag reads the same numbers as flag off.

   Timing. A squad decides at the start of an AI step from the state the last step left, so the inputs of the
   decision that produced this sample's `sq.state` are the previous sample's (`prev`). Sampled every step
   (0.15 s), after the commander tick. `selfCheck` re-derives the decision that was taken from those inputs
   and counts the squad-ticks where it does not reproduce `sq.state`; it must be 0, or the timing model here
   is wrong and no other number can be trusted.

   What it reports (per battle; scripts/summarize_lever_probes.cjs adds them up and divides by squad-battles):
     - disagree: earlyBreak (morale breaks a squad the flat rule keeps), heldRetreat (morale keeps a squad in
       retreat that the flat rule would release; `postMerge` when it is a re-formed squad), earlyRally
       (morale releases what flat holds; impossible by construction, counted to prove it);
     - hist / byCasualties: seconds of non-retreating squads by mean stress (bins of 0.05), split in contact
       or not, and by casualty count (10-man squads), which is where the threshold shift can or cannot bite;
     - retreat: seconds in retreat, and of those the seconds the rally condition's two halves held (calm men,
       clear of the break threshold by `rallyGap`), so what blocks a rally is on record;
     - entries, exits, merges: every break and rally with the numbers at that moment, and the time a merged
       squad stays in retreat afterwards;
     - groups: every reconstitution group formed, with singletons (one squad grouped alone) flagged. */
(function (root) {
  'use strict';
  var st;
  var SIDES = ['us', 'ge'];
  var FLAT = 0.6; // squad-ai.js RETREAT_CASUALTY_FRAC, the rule morale replaces
  function round(x, k) {
    var p = Math.pow(10, k == null ? 3 : k);
    return Math.round((+x || 0) * p) / p;
  }
  function living(sq) {
    var n = 0,
      m = sq.members || [];
    for (var i = 0; i < m.length; i++) if (m[i] && !m[i].dead) n++;
    return n;
  }
  function snap(sim, sq) {
    var n = living(sq),
      e = root.SquadAI.establishment(sq),
      m = sq.mind;
    return {
      t: +sim.time || 0,
      n: n,
      est: e,
      cf: 1 - n / e,
      stress: (m && m.mean) || 0,
      max: (m && m.max) || 0,
      state: sq.state,
      contact: !!sq.inContact,
      recon: sq.reconstitutedFrom || null
    };
  }
  function T() {
    return root.BattleSquadStability.tuning.morale;
  }
  function breakAt(stress) {
    return root.BattleSquadStability.moraleBreakAt(stress);
  }
  function bin(x) {
    return Math.min(20, Math.floor(x / 0.05 + 1e-9));
  }
  function add(o, k, v) {
    o[k] = (o[k] || 0) + v;
  }
  function counter() {
    return { ticks: 0, sec: 0, episodes: 0 };
  }
  /* An early-break run: consecutive squad-ticks in which morale would break a squad the flat rule keeps. On a
     flag-off page its length is how much earlier morale would have retreated the squad (when it ends in the
     flat retreat) or how long it would have been retreating a squad the flat rule never retreats (when the
     men calm down first). `end`: flat-retreat | calmed | retreated (flag on: morale took the break) | wiped | open. */
  function closeRun(a, now, how) {
    if (!a.eb) return;
    st.earlyBreakRuns.push({
      squad: a.id,
      side: a.side,
      t0: round(a.eb.t0, 2),
      seconds: round(now - a.eb.t0, 2),
      casualtyFrac: round(a.eb.cf),
      peakStress: round(a.eb.peak),
      end: how
    });
    a.eb = null;
  }
  function perSquad(sq, side) {
    return {
      id: sq.id,
      side: side,
      prev: null,
      run: {},
      retreatSince: null,
      mergedAt: null,
      lastMergeStress: null
    };
  }
  (root.BattleProbes = root.BattleProbes || {})['morale-decisions'] = {
    every: 0,
    start: function (sim) {
      st = {
        squads: new Map(),
        lastT: null,
        seenGroups: {},
        disagree: { earlyBreak: counter(), heldRetreat: counter(), heldRetreatPostMerge: counter(), earlyRally: counter() },
        selfCheck: { checked: 0, mismatched: 0, examples: [] },
        hist: { contact: {}, quiet: {} },
        byCasualties: {},
        retreat: { sec: 0, secCalm: 0, secCasualtyOk: 0, secBoth: 0, secPostMerge: 0, squads: 0 },
        entries: [],
        exits: [],
        merges: [],
        groups: [],
        squadSec: 0,
        stillRetreating: [],
        earlyBreakRuns: []
      };
    },
    sample: function (sim) {
      var now = +sim.time || 0,
        dt = st.lastT == null ? 0 : now - st.lastT,
        S = root.BattleSquadStability,
        on = !!(S && S.moraleOn && S.moraleOn()),
        tun = T();
      st.lastT = now;
      SIDES.forEach(function (side) {
        ((sim.factions && sim.factions[side] && sim.factions[side].squads) || []).forEach(function (sq) {
          var a = st.squads.get(sq);
          if (!a) {
            a = perSquad(sq, side);
            st.squads.set(sq, a);
          }
          var cur = snap(sim, sq),
            p = a.prev;
          a.prev = cur;
          if (!p || cur.n === 0 || p.n === 0) {
            if (p && p.n > 0 && cur.n === 0) a.retreatSince = null;
            if (cur.n === 0) closeRun(a, now, 'wiped');
            return;
          }
          st.squadSec += dt;
          var flatRetreat = p.cf >= FLAT,
            retreating = p.state === 'retreat',
            moraleRetreat = retreating
              ? !S.moraleRallies(p.cf, p.stress)
              : p.cf >= breakAt(p.stress),
            predicted = on ? moraleRetreat : flatRetreat,
            actual = cur.state === 'retreat';
          st.selfCheck.checked++;
          if (predicted !== actual) {
            st.selfCheck.mismatched++;
            if (st.selfCheck.examples.length < 8)
              st.selfCheck.examples.push({ t: round(now, 2), squad: sq.id, prevState: p.state, state: cur.state, cf: round(p.cf), stress: round(p.stress) });
          }
          /* Disagreements between the two rules, on this squad's state at the start of the step. */
          var kinds = {};
          if (!retreating && moraleRetreat && !flatRetreat) kinds.earlyBreak = true;
          if (retreating && moraleRetreat && !flatRetreat) {
            kinds.heldRetreat = true;
            if (sq.reconstitutedFrom) kinds.heldRetreatPostMerge = true;
          }
          if (retreating && !moraleRetreat && flatRetreat) kinds.earlyRally = true;
          if (kinds.earlyBreak) {
            if (!a.eb) a.eb = { t0: now, cf: p.cf, peak: p.stress };
            else if (p.stress > a.eb.peak) a.eb.peak = p.stress;
          } else if (a.eb) closeRun(a, now, retreating || actual ? (flatRetreat ? 'flat-retreat' : 'retreated') : 'calmed');
          Object.keys(st.disagree).forEach(function (k) {
            var c = st.disagree[k];
            if (kinds[k]) {
              c.ticks++;
              c.sec += dt;
              if (!a.run[k]) c.episodes++;
              a.run[k] = true;
            } else a.run[k] = false;
          });
          if (!retreating) {
            /* Who is exposed: seconds by mean stress, in contact or not, and by casualty count. */
            var h = st.hist[p.contact ? 'contact' : 'quiet'];
            add(h, bin(p.stress), dt);
            if (p.est === 10) {
              var k = Math.round(p.cf * 10),
                b = st.byCasualties[k] || (st.byCasualties[k] = { sec: 0, stress: {}, maxStress: 0, secMoraleBreaks: 0 });
              b.sec += dt;
              add(b.stress, bin(p.stress), dt);
              if (p.stress > b.maxStress) b.maxStress = round(p.stress, 3);
              if (!flatRetreat && p.cf >= breakAt(p.stress)) b.secMoraleBreaks += dt;
            }
          } else {
            var R = st.retreat,
              calm = p.stress < tun.rallyStress,
              ok = p.cf < S.moraleBreakAt(p.stress) - tun.rallyGap;
            R.sec += dt;
            if (calm) R.secCalm += dt;
            if (ok) R.secCasualtyOk += dt;
            if (calm && ok) R.secBoth += dt;
            if (sq.reconstitutedFrom) R.secPostMerge += dt;
          }
          /* Entries, exits and merges, with the numbers the decision saw. */
          if (actual && !retreating) {
            a.retreatSince = now;
            st.retreat.squads++;
            st.entries.push({
              t: round(now, 1),
              squad: sq.id,
              side: side,
              living: p.n,
              casualtyFrac: round(p.cf),
              meanStress: round(p.stress),
              maxStress: round(p.max),
              inContact: p.contact,
              cause: flatRetreat ? 'flat' : 'morale-early'
            });
          } else if (!actual && retreating) {
            st.exits.push({
              t: round(now, 1),
              squad: sq.id,
              side: side,
              how: p.cf <= 1e-9 && sq.reconstitutedFrom ? 'merge-release' : 'rally',
              casualtyFrac: round(p.cf),
              meanStress: round(p.stress),
              secondsInRetreat: a.retreatSince == null ? null : round(now - a.retreatSince, 1),
              secondsSinceMerge: a.mergedAt == null ? null : round(now - a.mergedAt, 1)
            });
            a.retreatSince = null;
            a.mergedAt = null;
          }
          if (cur.recon && cur.recon !== p.recon) {
            a.mergedAt = now;
            st.merges.push({
              t: round(now, 1),
              squad: sq.id,
              side: side,
              stateAtMerge: cur.state,
              meanStress: round(cur.stress),
              maxStress: round(cur.max),
              living: cur.n,
              from: cur.recon.length
            });
          }
        });
      });
      /* Reconstitution groups as the General forms them. */
      var ms = sim._macroMissionState,
        rc = ms && ms.reconstitution;
      if (rc)
        (rc.active || []).concat(rc.ended || []).forEach(function (g) {
          if (st.seenGroups[g.id]) return;
          st.seenGroups[g.id] = true;
          var merged = st.merges.filter(function (m) {
            return g.squads.indexOf(m.squad) >= 0 && now - m.t < 120;
          });
          st.groups.push({
            id: g.id,
            t: round(g.formedAt, 1),
            squads: g.squads.slice(),
            survivors: g.survivors,
            singleton: g.squads.length === 1,
            recentlyMerged: merged.length > 0
          });
        });
    },
    report: function (sim) {
      var rc = sim._macroMissionState && sim._macroMissionState.reconstitution,
        S = root.BattleSquadStability,
        squads = 0,
        stillRetreating = [];
      st.squads.forEach(function (a, sq) {
        squads++;
        closeRun(a, +sim.time || 0, 'open');
        if (a.retreatSince != null && living(sq) > 0)
          stillRetreating.push({ squad: sq.id, since: round(a.retreatSince, 1), postMerge: !!sq.reconstitutedFrom, meanStress: round((sq.mind && sq.mind.mean) || 0) });
      });
      return {
        flagOn: !!(S && S.moraleOn && S.moraleOn()),
        coaOn: !!(S && S.coaOn && S.coaOn()),
        tuning: JSON.parse(JSON.stringify(T())),
        squadBattles: squads,
        squadSec: round(st.squadSec, 1),
        selfCheck: st.selfCheck,
        disagree: st.disagree,
        hist: st.hist,
        byCasualties: st.byCasualties,
        retreat: st.retreat,
        entries: st.entries,
        exits: st.exits,
        merges: st.merges,
        groups: st.groups,
        stillRetreatingAtEnd: stillRetreating,
        earlyBreakRuns: st.earlyBreakRuns,
        reconstitution: rc ? { groupsFormed: rc.groupsFormed, groupsDissolved: rc.groupsDissolved, merges: rc.merges, promotions: rc.promotions } : null
      };
    }
  };
})(window);
