/* What a side spends its ammunition on, and whether its squads get any closer to their objectives for it.
   Built for #637 (`?suppressBelieved=1`: a man with a stale sighting may suppress the squad's believed
   point while its fire order is open), but it runs on any build.
   Ammunition, by side (the scenario's defender and attacker; in a meeting battle, by side):
   - every round (the step's rise in `s._ammoState.shots`, module 46) is booked to what the man was doing
     when he fired: at a live target ("aimed"), on a suppress order on his own sighting under 4.5 s old
     (ALERT_HOLD), on a suppress order without one ("believed": since #637 that is the squad's first-hand
     point, `sq.contact`), or neither ("other");
   - for suppressive rounds, whether a living enemy was within 20 m of the point being suppressed (hidden
     truth, probe only);
   - what the men still alive have left of their primary weapon's starting load, by 60 s; men out of ammunition,
     below their weapon's low-ammo line, reload starts; rounds per enemy casualty.
   Objectives, by side (the same measures as the standard benchmark's, every 2.5 s):
   - distance closed on and lost from each squad's target objective (squad centre, not while retreating),
     split by whether the squad was in contact and whether its fire order was open;
   - squad-seconds inside the target objective's radius; captures and neutralisations as they happen;
     first capture; the longest stretch with no change in any objective's owner, contest or progress.
   Observe only: reads state, draws no RNG, writes nothing. */
(function (root) {
  var ALERT_HOLD = 4.5,
    OBJECTIVE_SAMPLE = 2.5,
    SERIES_EVERY = 60;
  var out, men, squads, lastT, nextObjectiveSample, nextSeries, lastSig, lastSigAt, owners;
  function add(map, key, v) {
    map[key] = (map[key] || 0) + v;
  }
  function roleOfSide(side) {
    var m = /[?&]defender=(us|ge)\b/.exec((root.location && root.location.search) || '');
    return m ? (side === m[1] ? 'defender' : 'attacker') : side;
  }
  function book(role) {
    return (
      out.sides[role] ||
      (out.sides[role] = {
        rounds: { aimed: 0, 'suppress-own': 0, 'suppress-believed': 0, other: 0 },
        suppressiveRoundsEnemyWithin20: { 'suppress-own': 0, 'suppress-believed': 0 },
        loadStart: 0,
        leftBySecond: {},
        reloadStarts: 0,
        outOfAmmoManSeconds: 0,
        outOfAmmoAtEnd: 0,
        lowAtEnd: 0,
        livingAtEnd: 0,
        kills: 0,
        objective: {
          progressMeters: { contact: 0, 'contact-open-fire': 0, 'no-contact': 0 },
          regressionMeters: { contact: 0, 'contact-open-fire': 0, 'no-contact': 0 },
          insideObjectiveSquadSeconds: 0,
          assignedSquadSeconds: 0,
          captures: 0,
          neutralisations: 0,
          firstCaptureAt: null
        }
      })
    );
  }
  function sideOf(s) {
    return s.faction || (s.squad && s.squad.faction) || '?';
  }
  function nearestEnemy(sim, side, x, z) {
    var roster = (sim._roster && sim._roster[side === 'us' ? 'ge' : 'us']) || [],
      best = Infinity;
    for (var i = 0; i < roster.length; i++) {
      var e = roster[i];
      if (e && !e.dead && e.root)
        best = Math.min(best, Math.hypot(e.root.position.x - x, e.root.position.z - z));
    }
    return best;
  }
  function left(w) {
    return w ? Math.max(0, +w.ammo || 0) + Math.max(0, +w.reserveAmmo || 0) : 0;
  }
  function lowLine(s) {
    var A = root.BattleAmmunition,
      kind = (s.weapon && s.weapon.kind) || 'rifle',
      cfg = A && A.loadouts && A.loadouts[kind];
    return cfg ? cfg.low : 0;
  }
  /* What the man was doing when the round left: aimed, suppressing on his own sighting, on a believed point. */
  function mode(s, sim) {
    var A = root.SquadAI,
      t = s.target;
    if (t && !t.dead && (!A.threatDisposition || A.threatDisposition(t).combatThreat))
      return { kind: 'aimed' };
    var e = s.eng;
    if (!e || !e.suppressOrder) return { kind: 'other' };
    var own = A.soldierContact ? A.soldierContact(s, sim) : null,
      fresh = own && own.source === 'seen' && Number.isFinite(+own.at) && sim.time - +own.at <= ALERT_HOLD;
    if (fresh) return { kind: 'suppress-own', x: +own.x, z: +own.z };
    var c = s.squad && s.squad.contact;
    return { kind: 'suppress-believed', x: c ? +c.x : NaN, z: c ? +c.z : NaN };
  }
  function trackMen(sim, dt) {
    ['us', 'ge'].forEach(function (side) {
      var roster = (sim._roster && sim._roster[side]) || [];
      roster.forEach(function (s) {
        if (!s) return;
        var rec = men.get(s);
        if (!rec) {
          if (s.dead || !s.weapon) return;
          rec = {
            side: side,
            primary: s.weapon,
            start: left(s.weapon),
            shots: (s._ammoState && s._ammoState.shots) || 0,
            reloading: !!s.reloading
          };
          men.set(s, rec);
          book(roleOfSide(side)).loadStart += left(s.weapon);
          return;
        }
        if (s.dead) return;
        var b = book(roleOfSide(side)),
          shots = (s._ammoState && s._ammoState.shots) || 0,
          fired = shots - rec.shots;
        rec.shots = shots;
        if (fired > 0) {
          var m = mode(s, sim);
          b.rounds[m.kind] += fired;
          if ((m.kind === 'suppress-own' || m.kind === 'suppress-believed') && Number.isFinite(m.x)) {
            if (nearestEnemy(sim, side, m.x, m.z) <= 20) b.suppressiveRoundsEnemyWithin20[m.kind] += fired;
          }
        }
        if (s.reloading && !rec.reloading) b.reloadStarts++;
        rec.reloading = !!s.reloading;
        if (s.outOfAmmo) b.outOfAmmoManSeconds += dt;
      });
    });
  }
  function objectiveStatus(sim, o) {
    var S = root.BattleObjectiveSystem;
    try {
      return (S && S.status(sim, o.id)) || o.state || {};
    } catch (_) {
      return o.state || {};
    }
  }
  function signature(sim) {
    return (sim._objectives || [])
      .map(function (o) {
        var st = objectiveStatus(sim, o);
        return (
          o.id +
          ':' +
          (st.owner || 'neutral') +
          ':' +
          (st.active || '-') +
          ':' +
          Math.round(+st.progress || 0)
        );
      })
      .join('|');
  }
  function centre(sq) {
    var x = 0,
      z = 0,
      n = 0;
    (sq.members || []).forEach(function (s) {
      if (!s || s.dead || !s.root) return;
      x += s.root.position.x;
      z += s.root.position.z;
      n++;
    });
    return n ? { x: x / n, z: z / n } : null;
  }
  function sampleObjectives(sim, dt) {
    var S = root.BattleObjectiveSystem,
      now = sim.time;
    // Owner changes and the longest stretch with nothing changing on any objective.
    var sig = signature(sim);
    if (sig !== lastSig) {
      if (lastSig != null)
        out.objectives.longestNoChange = Math.max(out.objectives.longestNoChange, now - lastSigAt);
      if (out.objectives.firstChangeAt == null && lastSig != null)
        out.objectives.firstChangeAt = +now.toFixed(1);
      lastSig = sig;
      lastSigAt = now;
    }
    (sim._objectives || []).forEach(function (o) {
      var st = objectiveStatus(sim, o),
        owner = st.owner || 'neutral',
        was = owners[o.id];
      if (was !== undefined && was !== owner) {
        out.objectives.events.length < 40 &&
          out.objectives.events.push({ t: +now.toFixed(1), id: o.id, from: was, to: owner });
        if (owner !== 'neutral') {
          var cb = book(roleOfSide(owner)).objective;
          cb.captures++;
          if (cb.firstCaptureAt == null) cb.firstCaptureAt = +now.toFixed(1);
        } else if (was !== 'neutral') {
          // The side that took it off the owner: whoever is not the old owner.
          book(roleOfSide(was === 'us' ? 'ge' : 'us')).objective.neutralisations++;
        }
      }
      owners[o.id] = owner;
    });
    if (!S) return;
    ['us', 'ge'].forEach(function (side) {
      ((sim.factions[side] && sim.factions[side].squads) || []).forEach(function (sq) {
        var p = centre(sq),
          rec = squads.get(sq) || {};
        squads.set(sq, rec);
        if (!p) return;
        var target = sq.targetObjective == null ? null : String(sq.targetObjective),
          obj = target && S.get(sim, target),
          d = null,
          b = book(roleOfSide(side)).objective;
        if (obj) {
          var def = obj.def || obj,
            st = objectiveStatus(sim, obj),
            radius = +(def.radius || st.radius || 20);
          d = Math.hypot(p.x - (+def.x || 0), p.z - (+def.z || 0));
          b.assignedSquadSeconds += dt;
          if (d <= radius) b.insideObjectiveSquadSeconds += dt;
        }
        var retreating = sq.state === 'retreat' || sq.commandPhase === 'retreat';
        if (
          !retreating &&
          rec.target === target &&
          target != null &&
          Number.isFinite(rec.d) &&
          Number.isFinite(d)
        ) {
          var delta = rec.d - d,
            when = !sq.inContact
              ? 'no-contact'
              : sq.fireControl && sq.fireControl.state === 'open'
                ? 'contact-open-fire'
                : 'contact';
          if (delta >= 0.25) b.progressMeters[when] += delta;
          else if (delta <= -0.25) b.regressionMeters[when] += -delta;
        }
        rec.target = target;
        rec.d = d;
      });
    });
  }
  /* What the men alive now have left of the load they started with (the dead take theirs with them). */
  function livingLoad() {
    var byRole = {};
    men.forEach(function (rec, s) {
      if (s.dead) return;
      var role = roleOfSide(rec.side),
        r = byRole[role] || (byRole[role] = { start: 0, left: 0 });
      r.start += rec.start;
      r.left += left(rec.primary);
    });
    return byRole;
  }
  (root.BattleProbes = root.BattleProbes || {})['ammo-objective'] = {
    every: 0,
    start: function () {
      men = new Map();
      squads = new Map();
      owners = {};
      lastT = null;
      nextObjectiveSample = 0;
      nextSeries = SERIES_EVERY;
      lastSig = null;
      lastSigAt = 0;
      out = { sides: {}, objectives: { events: [], longestNoChange: 0, firstChangeAt: null } };
    },
    sample: function (sim) {
      var dt = lastT == null ? 0 : Math.max(0, sim.time - lastT);
      lastT = sim.time;
      trackMen(sim, dt);
      if (sim.time + 1e-9 >= nextObjectiveSample) {
        sampleObjectives(sim, nextObjectiveSample ? OBJECTIVE_SAMPLE : 0);
        nextObjectiveSample = sim.time + OBJECTIVE_SAMPLE;
      }
      if (sim.time + 1e-9 >= nextSeries) {
        var l = livingLoad();
        Object.keys(l).forEach(function (role) {
          book(role).leftBySecond[String(nextSeries)] = l[role].start
            ? +(l[role].left / l[role].start).toFixed(3)
            : null;
        });
        nextSeries += SERIES_EVERY;
      }
    },
    report: function (sim) {
      if (lastSig != null)
        out.objectives.longestNoChange = Math.max(out.objectives.longestNoChange, sim.time - lastSigAt);
      out.objectives.longestNoChange = +out.objectives.longestNoChange.toFixed(1);
      var l = livingLoad(),
        booked = 0;
      men.forEach(function (rec, s) {
        var b = book(roleOfSide(rec.side));
        if (s.dead) return;
        b.livingAtEnd++;
        if (s.outOfAmmo) b.outOfAmmoAtEnd++;
        if (s.weapon && left(s.weapon) <= lowLine(s)) b.lowAtEnd++;
      });
      ['us', 'ge'].forEach(function (side) {
        var f = sim.factions && sim.factions[side];
        if (f) book(roleOfSide(side)).kills = f.kills;
      });
      Object.keys(out.sides).forEach(function (role) {
        var b = out.sides[role],
          total = b.rounds.aimed + b.rounds['suppress-own'] + b.rounds['suppress-believed'] + b.rounds.other;
        b.survivorsLoadStart = l[role] ? l[role].start : 0;
        b.survivorsLoadLeft = l[role] ? l[role].left : 0;
        b.survivorsLoadLeftShare = b.survivorsLoadStart
          ? +(b.survivorsLoadLeft / b.survivorsLoadStart).toFixed(3)
          : null;
        b.roundsTotal = total;
        booked += total;
        b.roundsPerKill = b.kills ? +(total / b.kills).toFixed(1) : null;
        b.outOfAmmoManSeconds = +b.outOfAmmoManSeconds.toFixed(1);
        var o = b.objective;
        ['progressMeters', 'regressionMeters'].forEach(function (k) {
          Object.keys(o[k]).forEach(function (w) {
            o[k][w] = +o[k][w].toFixed(1);
          });
        });
        o.insideObjectiveSquadSeconds = +o.insideObjectiveSquadSeconds.toFixed(1);
        o.assignedSquadSeconds = +o.assignedSquadSeconds.toFixed(1);
      });
      // Every round booked above should be one the ammunition module counted (men who died keep theirs).
      out.check = {
        bookedRounds: booked,
        ammunitionModuleShots: (sim._ammunitionStats && sim._ammunitionStats.shots) || null
      };
      var stats = sim.objectiveStats || {};
      out.objectives.capturesByFaction = stats.capturesByFaction || null;
      out.objectives.finalOwners = {};
      (sim._objectives || []).forEach(function (o) {
        out.objectives.finalOwners[o.id] = objectiveStatus(sim, o).owner || 'neutral';
      });
      out.flags = { query: root.location.search };
      return out;
    }
  };
})(window);
