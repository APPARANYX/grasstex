/* Retreat episodes on real battles: when a squad turns to retreat and what it looked like then.
   Observe only (reads squad and mind state; writes nothing, draws no random number).

   Question: what does the flat 60% casualty rule (squad-ai.js RETREAT_CASUALTY_FRAC, mirrored by the
   Squad Leader's updateSquadState) look like beside what the men feel? For every squad, per battle:
     - each entry into `state === 'retreat'`: time, living, establishment, casualty fraction, the
       squad.mind roll-up (mean and max stress, men shaken/rattled/broken), leader alive, in contact;
     - each exit from it (a merge re-forms the squad on a fresh establishment) and when it reached
       `at-base` (_assembly);
     - for squads that never retreat: their worst casualty fraction and their highest mean stress, so
       the stress a squad carries WITHOUT retreating is on record too.
   Sampled every 0.15 s (each AI tick) so no entry is missed. */
(function (root) {
  'use strict';
  var squads;
  function living(sq) {
    var n = 0,
      m = sq.members || [];
    for (var i = 0; i < m.length; i++) if (m[i] && !m[i].dead) n++;
    return n;
  }
  function establishment(sq) {
    return root.SquadAI && root.SquadAI.establishment ? root.SquadAI.establishment(sq) : 10;
  }
  function round(x, k) {
    var p = Math.pow(10, k || 3);
    return Math.round((+x || 0) * p) / p;
  }
  function record(sim, sq) {
    var mind = sq.mind || null,
      est = establishment(sq),
      n = living(sq);
    return {
      t: round(sim.time, 1),
      squad: sq.id,
      faction: sq.faction,
      living: n,
      establishment: est,
      casualtyFrac: round(1 - n / est),
      meanStress: mind ? round(mind.mean) : null,
      maxStress: mind ? round(mind.max) : null,
      shaken: mind ? mind.shaken : null,
      rattled: mind ? mind.rattled : null,
      broken: mind ? mind.broken : null,
      leaderAlive: !!(root.SquadAI && root.SquadAI.leaderOf && root.SquadAI.leaderOf(sq)),
      inContact: !!sq.inContact,
      phase: sq.commandPhase || null
    };
  }
  (root.BattleProbes = root.BattleProbes || {})['retreat-episodes'] = {
    every: 0,
    start: function (sim) {
      squads = new Map();
    },
    sample: function (sim) {
      ['us', 'ge'].forEach(function (side) {
        ((sim.factions && sim.factions[side] && sim.factions[side].squads) || []).forEach(function (sq) {
          var st = squads.get(sq);
          if (!st) {
            st = { retreating: false, episodes: [], worstFrac: 0, worstMean: 0, worstBroken: 0, atBase: null };
            squads.set(sq, st);
          }
          var r = record(sim, sq);
          if (sq.state === 'retreat' && !st.retreating) {
            st.retreating = true;
            st.atBase = null;
            st.episodes.push({ entry: r, exit: null, atBaseAt: null });
          } else if (sq.state !== 'retreat' && st.retreating) {
            st.retreating = false;
            st.episodes[st.episodes.length - 1].exit = r;
          }
          if (st.retreating) {
            var ep = st.episodes[st.episodes.length - 1];
            if (ep.atBaseAt == null && sq._assembly && sq._assembly.phase !== 'to-base')
              ep.atBaseAt = round(sim.time, 1);
          } else if (r.living > 0) {
            if (r.casualtyFrac > st.worstFrac) st.worstFrac = r.casualtyFrac;
            if ((r.meanStress || 0) > st.worstMean) st.worstMean = r.meanStress;
            if ((r.broken || 0) > st.worstBroken) st.worstBroken = r.broken;
          }
        });
      });
    },
    report: function (sim) {
      var out = { episodes: [], neverRetreated: [], squads: 0, retreated: 0 };
      squads.forEach(function (st, sq) {
        out.squads++;
        if (st.episodes.length) {
          out.retreated++;
          st.episodes.forEach(function (e) {
            out.episodes.push(e);
          });
        } else
          out.neverRetreated.push({
            squad: sq.id,
            faction: sq.faction,
            worstCasualtyFrac: st.worstFrac,
            worstMeanStress: st.worstMean,
            worstBrokenMen: st.worstBroken
          });
      });
      return out;
    }
  };
})(window);
