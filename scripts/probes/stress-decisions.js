/* Stress at the two decisions a stress-driven lever above the soldier would act on: how much there is to
   choose between when the Squad Leader sends a fireteam forward, and how shaken the squad is when the General
   picks its attack objective. It sizes the lever before it is built: a lever that can only change a choice
   a few times a battle is not worth a flag.

   Observe only. It wraps three calls and passes every argument and result through untouched: nothing it
   reads is written, no random number is drawn, and `PROBE_CONTROL=1` on a battle compares the end state
   with a probe-free run of it.
     BattleEngagement.orderBound   the Squad Leader's bound order (module 16 `fireAndMovement`), called after
                                   it has picked the team and before Engagement touches a man, so the state seen
                                   here is the state the decision saw;
     BattleCommanderDoctrine.chooseObjective   the General's pick for a squad (attack `wantOwned` false, or
                                   the defence of what it holds), on each wake that evaluates the squad;
     BattleTelemetry.record 'decision-mission-issued'   a brief that really changed (the pick can come back
                                   the same: `decisionsUnchanged`).

   BOUND (the Squad Leader). Every issued bound: the three teams (`BOUND_TEAMS`, module 16) are rebuilt the way
   `fireAndMovement` builds them (movers: alive, not suppressed, not reloading or clearing, not the gun, not in a
   positional task, of that team or of none; base of fire: `Engagement.updateSquad`'s `fireSupport`; a team may go
   when it has a mover and leaves two men shooting), each with its movers' mean stress. Then, per decision:
     eligible teams (1, 2 or 3): with one there is nothing to choose;
     spread and gain: among two or more, the stress spread (worst team mean minus best) and how much calmer the
       calmest team is than the one the rotation sent (gain; 0 when the rotation already sent it, ties included);
     differs: the calmest team is not the one the rotation sent;
     avoidsShaken: the rotation sent a team at or over the shaken band (mean >= UP[0]) and another was under it;
     rotationShaken: the rotation sent such a team whether or not another could go;
     holdAll: every team that could go is at or over the shaken band (the "hold the bound" case), split by whether
       one or several could go; holdAnyMan: every team that could go has at least one shaken mover (looser);
     sentShaken: the men sent include a shaken one.
   `selfCheck` re-derives the team the rotation sent from the lease and compares its movers with the order's: it
   must be 0 mismatches.

   GENERAL. Each attack pick and each defence pick: the squad's mean stress (`squad.mind`, squads of 3 or more
   living men only: a mean of two is noise), the median of its side's such squads, and counts at the cuts that
   matter: mean at or over 1/3 (where group morale first differs), at or over the shaken band, and above its side's
   median by 0.10 and by 0.20. The same for each brief that changed, by intent. `wakes` is the General's own count
   of wakes by reason. Everything is per battle; `run_probe.cjs` runs one seed per type by default. */
(function (root) {
  'use strict';
  var TEAMS = ['alpha', 'bravo', 'charlie']; // module 16 BOUND_TEAMS (`selfCheck` fails if the order names another)
  var OVER = 1 / 3;
  var st;
  function shakenAt() {
    var M = root.BattleSoldierMind;
    return M && M.tuning && M.tuning.UP ? M.tuning.UP[0] : 0.3;
  }
  function stressOf(s) {
    return s && s.mind ? s.mind.stress : 0;
  }
  function bandOf(s) {
    return s && s.mind ? s.mind.band : 0;
  }
  function mean(xs) {
    return xs.length
      ? xs.reduce(function (a, b) {
          return a + b;
        }, 0) / xs.length
      : 0;
  }
  function round(x, k) {
    var p = Math.pow(10, k == null ? 3 : k);
    return Math.round((+x || 0) * p) / p;
  }
  function quantile(xs, q) {
    if (!xs.length) return null;
    var a = xs.slice().sort(function (x, y) {
        return x - y;
      }),
      p = (a.length - 1) * q,
      lo = Math.floor(p),
      hi = Math.ceil(p);
    return round(lo === hi ? a[lo] : a[lo] + (a[hi] - a[lo]) * (p - lo));
  }
  function spread(xs) {
    return { n: xs.length, p50: quantile(xs, 0.5), p90: quantile(xs, 0.9), max: quantile(xs, 1) };
  }
  function count(map, key, n) {
    map[key] = (map[key] || 0) + (n == null ? 1 : n);
  }

  /* ---- the Squad Leader's bound decision ------------------------------------------------------ */

  function moversOf(sq, team, now) {
    var SA = root.SquadAI,
      TP = root.BattleTacticalPositions,
      out = [];
    (sq.members || []).forEach(function (s) {
      if (s.dead || s.suppressedUntil > now || s.reloading || s.clearingStoppage || s.outOfAmmo) return;
      if (SA.isMachineGun(s) || (TP && TP.current(s))) return;
      if (s._fireteamKey && s._fireteamKey !== team) return;
      out.push(s);
    });
    return out;
  }
  /* Engagement.updateSquad's base of fire, rebuilt from the same state. */
  function fireSupport(sq, now) {
    var E = root.BattleEngagement,
      TP = root.BattleTacticalPositions,
      out = [];
    (sq.members || []).forEach(function (s) {
      if (s.dead) return;
      var e = E.stateOf(s);
      if (e.state === 'pinned' || s.suppressedUntil > now) return;
      if (s.reloading || s.clearingStoppage) return;
      if (root.BattleAmmunition && !root.BattleAmmunition.available(s)) return;
      var position = TP && TP.current(s);
      if (
        e.state === 'engage' ||
        (e.state === 'station' && position && position.occupiedAt != null) ||
        e.suppressOrder
      )
        out.push(s);
    });
    return out;
  }
  function same(a, b) {
    return (
      a.length === b.length &&
      a.every(function (x) {
        return b.indexOf(x) >= 0;
      })
    );
  }
  function observeBound(sim, movers) {
    var sq = movers && movers[0] && movers[0].squad;
    if (!sq) return;
    var now = +sim.time || 0,
      shaken = shakenAt(),
      lease = root.BattleLeases.get(sq, 'bound'),
      sent = lease && lease.data && lease.data.team,
      support = fireSupport(sq, now),
      b = st.bound;
    var teams = TEAMS.map(function (k) {
      var mv = moversOf(sq, k, now),
        hold = support.filter(function (m) {
          return mv.indexOf(m) < 0;
        }).length;
      return {
        team: k,
        movers: mv,
        holding: hold,
        ok: mv.length > 0 && hold >= 2,
        mean: mean(mv.map(stressOf)),
        shakenMen: mv.filter(function (m) {
          return bandOf(m) >= 1;
        }).length
      };
    });
    var chosen = teams.filter(function (t) {
      return t.team === sent;
    })[0];
    b.selfCheck.checked++;
    if (!chosen || !chosen.ok || !same(chosen.movers, movers)) {
      b.selfCheck.mismatched++;
      if (b.selfCheck.examples.length < 5)
        b.selfCheck.examples.push({
          t: round(now, 2),
          squad: sq.id,
          sent: sent || null,
          movers: movers.length,
          rebuilt: chosen ? { movers: chosen.movers.length, holding: chosen.holding, ok: chosen.ok } : null
        });
      return;
    }
    var can = teams.filter(function (t) {
        return t.ok;
      }),
      calmest = Math.min.apply(
        null,
        can.map(function (t) {
          return t.mean;
        })
      ),
      worst = Math.max.apply(
        null,
        can.map(function (t) {
          return t.mean;
        })
      ),
      gain = Math.max(0, chosen.mean - calmest);
    b.decisions++;
    count(b.eligible, can.length);
    count(b.bySide, sq.faction);
    count(b.byPhase, sq.commandPhase || 'none');
    if (chosen.mean >= shaken) b.rotationShaken++;
    if (chosen.shakenMen > 0) b.sentShaken++;
    if (can.length >= 2) {
      b.withChoice++;
      b.spread.push(worst - calmest);
      b.gain.push(gain);
      if (gain > 1e-9) b.differs++;
      if (gain >= 0.05) b.gain05++;
      if (gain >= 0.1) b.gain10++;
      if (gain >= 0.25) b.gain25++;
      if (chosen.mean >= shaken && calmest < shaken) b.avoidsShaken++;
    }
    if (
      can.every(function (t) {
        return t.mean >= shaken;
      })
    )
      b[can.length >= 2 ? 'holdAllSeveral' : 'holdAllSingle']++;
    if (
      can.every(function (t) {
        return t.shakenMen > 0;
      })
    )
      b.holdAnyMan++;
    if (b.examples.length < 30)
      b.examples.push({
        t: round(now, 1),
        squad: sq.id,
        phase: sq.commandPhase || '',
        sent: sent,
        teams: teams.map(function (t) {
          return {
            team: t.team,
            ok: t.ok,
            movers: t.movers.length,
            holding: t.holding,
            mean: round(t.mean),
            shaken: t.shakenMen
          };
        })
      });
  }

  /* ---- the General's pick --------------------------------------------------------------------- */

  /* The squad's roll-up and where it stands among its side's squads of 3+ living men, or null. */
  function standing(sim, sq) {
    var roll = sq && sq.mind;
    if (!roll || !(roll.n >= 3)) return null;
    var peers = ((sim.factions && sim.factions[sq.faction] && sim.factions[sq.faction].squads) || [])
      .filter(function (q) {
        return q && q.mind && q.mind.n >= 3;
      })
      .map(function (q) {
        return q.mind.mean;
      });
    var med = peers.length ? quantile(peers, 0.5) : null;
    return {
      mean: roll.mean,
      n: roll.n,
      median: med,
      peers: peers.length,
      excess: med == null ? null : roll.mean - med
    };
  }
  function tally(bucket, at) {
    var shaken = shakenAt();
    bucket.n++;
    if (!at) {
      bucket.noStanding++;
      return;
    }
    bucket.means.push(at.mean);
    if (at.mean >= OVER) bucket.over13++;
    if (at.mean >= shaken) bucket.overShaken++;
    if (at.excess != null) {
      bucket.excess.push(at.excess);
      if (at.excess >= 0.1) bucket.above10++;
      if (at.excess >= 0.2) bucket.above20++;
    }
  }
  function blank() {
    return { n: 0, noStanding: 0, means: [], excess: [], over13: 0, overShaken: 0, above10: 0, above20: 0 };
  }
  function observeChoose(sim, sq, wantOwned) {
    if (!sq) return;
    tally(st.general[wantOwned ? 'defence' : 'attack'], standing(sim, sq));
  }
  function observeIssue(sim, data) {
    var sq = ((sim.factions && sim.factions[data.faction] && sim.factions[data.faction].squads) || []).filter(
      function (q) {
        return q && q.id === data.squad;
      }
    )[0];
    if (!sq) return;
    var key = String(data.intent || 'none');
    tally((st.general.issued[key] = st.general.issued[key] || blank()), standing(sim, sq));
    count(st.general.issuedReasons, String(data.reason || 'none'));
  }
  function summarize(bucket) {
    return {
      n: bucket.n,
      noStanding: bucket.noStanding,
      squadMean: spread(bucket.means),
      excessOverSideMedian: spread(bucket.excess),
      over13: bucket.over13,
      overShaken: bucket.overShaken,
      above10: bucket.above10,
      above20: bucket.above20
    };
  }

  (root.BattleProbes = root.BattleProbes || {})['stress-decisions'] = {
    every: 0,
    start: function (sim) {
      st = {
        bound: {
          decisions: 0,
          eligible: {},
          withChoice: 0,
          spread: [],
          gain: [],
          differs: 0,
          gain05: 0,
          gain10: 0,
          gain25: 0,
          avoidsShaken: 0,
          rotationShaken: 0,
          holdAllSingle: 0,
          holdAllSeveral: 0,
          holdAnyMan: 0,
          sentShaken: 0,
          bySide: {},
          byPhase: {},
          examples: [],
          selfCheck: { checked: 0, mismatched: 0, examples: [] }
        },
        general: { attack: blank(), defence: blank(), issued: {}, issuedReasons: {} },
        errors: []
      };
      var guard = function (what, fn) {
        try {
          fn();
        } catch (e) {
          if (st.errors.length < 5) st.errors.push(what + ': ' + String((e && e.message) || e));
        }
      };
      var E = root.BattleEngagement,
        D = root.BattleCommanderDoctrine,
        T = root.BattleTelemetry,
        orderBound = E.orderBound,
        chooseObjective = D.chooseObjective,
        record = T && T.record;
      E.orderBound = function (movers) {
        guard('orderBound', function () {
          observeBound(sim, movers);
        });
        return orderBound.apply(this, arguments);
      };
      D.chooseObjective = function (s, sq, wantOwned) {
        guard('chooseObjective', function () {
          observeChoose(s, sq, wantOwned);
        });
        return chooseObjective.apply(this, arguments);
      };
      if (T && record)
        T.record = function (type, data) {
          if (type === 'decision-mission-issued' && data)
            guard('issued', function () {
              observeIssue(sim, data);
            });
          return record.apply(this, arguments);
        };
    },
    report: function (sim) {
      var b = st.bound,
        g = st.general,
        ms =
          root.BattleCommanderAI && root.BattleCommanderAI.missionState
            ? root.BattleCommanderAI.missionState(sim)
            : null,
        pct = function (x, of) {
          return of ? round((100 * x) / of, 1) : null;
        };
      var issued = {};
      Object.keys(g.issued).forEach(function (k) {
        issued[k] = summarize(g.issued[k]);
      });
      return {
        shakenBand: shakenAt(),
        bound: {
          decisions: b.decisions,
          bySide: b.bySide,
          byPhase: b.byPhase,
          eligibleTeams: b.eligible,
          withChoice: b.withChoice,
          withChoicePercent: pct(b.withChoice, b.decisions),
          spread: spread(b.spread),
          gain: spread(b.gain),
          differs: b.differs,
          differsPercent: pct(b.differs, b.decisions),
          gainAtLeast: { '0.05': b.gain05, '0.10': b.gain10, '0.25': b.gain25 },
          avoidsShaken: b.avoidsShaken,
          avoidsShakenPercent: pct(b.avoidsShaken, b.decisions),
          rotationShaken: b.rotationShaken,
          rotationShakenPercent: pct(b.rotationShaken, b.decisions),
          holdAll: { single: b.holdAllSingle, several: b.holdAllSeveral },
          holdAllPercent: pct(b.holdAllSingle + b.holdAllSeveral, b.decisions),
          holdAnyMan: b.holdAnyMan,
          holdAnyManPercent: pct(b.holdAnyMan, b.decisions),
          sentShaken: b.sentShaken,
          sentShakenPercent: pct(b.sentShaken, b.decisions),
          selfCheck: b.selfCheck,
          examples: b.examples
        },
        general: {
          attackPicks: summarize(g.attack),
          defencePicks: summarize(g.defence),
          briefsIssuedByIntent: issued,
          briefReasons: g.issuedReasons,
          wakes: ms ? { count: ms.wakeCount, byReason: ms.wakeReasons } : null
        },
        errors: st.errors
      };
    }
  };
})(window);
