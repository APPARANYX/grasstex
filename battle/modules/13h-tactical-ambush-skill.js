/* Exclusive-controller ambush skill (`?tacticalController=new`; `?controllerAmbush=0` turns it off).
   The legacy concealed-firing-line posture (module 15o) decided which three men take which masked
   post from fresh own-faction reports; this skill keeps that decision and its tests of a post
   (BattleCoverPositions.maskedPost / maskedApproach, real LOS) and changes who carries it out. Every
   effect is a capability request: the post is a `movement.move` and then a `movement.hold`, so Meso
   and the resolver alone move the men, and the contact skills (13d) fire once there is first-hand
   contact. It writes no destination, stance, fire permission or squad/soldier field and adds no
   timer or RNG draw; its state lives in a WeakMap keyed by the squad.

   Pre-contact only. Contact, pressure, a lost threat, a retained Squad Leader skill, a retreat, a
   casualty or an owner ending a man's action ends it and releases every man through his owner. */
(function (root) {
  'use strict';
  var SEARCH = typeof location !== 'undefined' ? location.search || '' : '',
    ON =
      /[?&]tacticalController=new(?:&|#|$)/i.test(SEARCH) &&
      !/[?&]controllerAmbush=(?:0|off|false)(?:&|#|$)/i.test(SEARCH),
    states = new WeakMap(),
    tuning = {
      minimumHold: 4,
      preparationBudget: 12,
      observationBudget: 12,
      minimumMen: 3,
      cooldown: 8,
      retry: 3,
      reportAge: 10,
      reportConfidence: 0.5,
      separation: 1.5,
      candidateRadius: 6
    };
  function point(p) {
    return p && Number.isFinite(+p.x) && Number.isFinite(+p.z) ? { x: +p.x, z: +p.z } : null;
  }
  function key(ctx) {
    var t = ctx.token;
    return [t.battleId, t.generation, t.controllerEpoch, t.missionVersion, t.rosterRevision].join(':');
  }
  function state(ctx) {
    var st = states.get(ctx.squad),
      k = key(ctx);
    if (!st || st.key !== k) {
      st = {
        key: k,
        phase: 'idle',
        men: new Map(),
        since: 0,
        holdSince: null,
        readyAt: null,
        until: 0,
        reason: null,
        started: 0,
        contacts: 0,
        releases: {}
      };
      states.set(ctx.squad, st);
    }
    return st;
  }
  /* Fresh own-faction reports only (relayed perception): detached coordinates, never a live enemy. */
  function threats(sq, sim) {
    var A = root.SquadAI,
      reports = A && A.squadContactsMap ? A.squadContactsMap(sq, sim) : null,
      out = [];
    if (!Array.isArray(reports) || reports.length > 32) return out;
    reports.forEach(function (r) {
      if (
        point(r) &&
        Number.isFinite(r.at) &&
        sim.time >= r.at &&
        sim.time - r.at <= tuning.reportAge &&
        Number.isFinite(r.confidence) &&
        r.confidence >= tuning.reportConfidence
      )
        out.push({ x: +r.x, z: +r.z, at: r.at, confidence: r.confidence });
    });
    return out.length <= 3 ? out : [];
  }
  function inContact(sq) {
    return (
      !!sq.inContact ||
      (sq.members || []).some(function (s) {
        return s && !s.dead && !!s.target;
      })
    );
  }
  function retained(sq) {
    var Q = root.BattleSquadStability;
    return (
      sq.state === 'retreat' ||
      sq.commandPhase === 'retreat' ||
      !!(Q && ((Q.retainedSkill && Q.retainedSkill(sq)) || (Q.defensivePhase && Q.defensivePhase(sq))))
    );
  }
  function missionRunning(sq) {
    var m = sq._macroMission;
    return !!(m && m.status === 'executing' && (sq.route || []).length);
  }
  /* A man another skill or owner already has is not asked: a claimed station, a covered-bound role,
     a contact drill. The skill takes uncommitted riflemen only. */
  function eligible(ctx, s) {
    var P = root.BattleTacticalPositions,
      C = root.BattleTacticalContactSkills,
      M = root.BattleTacticalCoveredManeuver;
    return !!(
      s &&
      !s.dead &&
      !s.isPlayer &&
      !s.incapacitated &&
      s.root &&
      point(s.root.position) &&
      !(P && P.current(s)) &&
      !(M && M.wants(s, ctx.sim)) &&
      !(C && C.wants(s, ctx.sim))
    );
  }
  function release(ctx, st, man) {
    st.men.forEach(function (cur, id) {
      if (man && String(man.id) !== id) return;
      ctx.finish(cur.actionId, st.reason || 'released');
      st.men.delete(id);
    });
  }
  function end(ctx, st, why) {
    st.reason = why;
    release(ctx, st, null);
    st.releases[why] = (st.releases[why] || 0) + 1;
    st.phase = 'idle';
    st.holdSince = st.readyAt = null;
    st.until = ctx.sim.time + tuning.cooldown;
  }
  function stop(ctx, st, why) {
    /* A start that was refused or found no line is not an ambush that ended: it only waits. */
    st.reason = why;
    st.until = ctx.sim.time + tuning.retry;
  }
  function ask(ctx, st, man, capability, at) {
    var id = String(man.id),
      res = ctx.request(capability, id, { point: at });
    if (!res || !res.ok) return (res && res.reason) || 'unknown';
    st.men.set(id, {
      man: man,
      actionId: res.actionId,
      kind: capability === 'movement.hold' ? 'hold' : 'move',
      point: at
    });
    return null;
  }
  /* The legacy placement: each man takes the first masked post inside the candidate radius that is
     separated from the posts already chosen; a man with none stays under the march. */
  function plan(ctx, rs) {
    var C = root.BattleCoverPositions,
      sim = ctx.sim,
      out = [],
      men = (ctx.squad.members || []).filter(function (s) {
        return eligible(ctx, s);
      });
    if (!C || !C.candidates || !C.maskedPost || !C.maskedApproach || men.length < tuning.minimumMen)
      return out;
    men.forEach(function (s) {
      var here = point(s.root.position),
        options = [here].concat(
          C.candidates(s, sim, { root: { position: rs[0] } }, tuning.candidateRadius).slice(0, 16)
        );
      for (var j = 0; j < options.length; j++) {
        var p = point(options[j]);
        if (
          !p ||
          out.some(function (o) {
            return Math.hypot(o.point.x - p.x, o.point.z - p.z) < tuning.separation;
          })
        )
          continue;
        if (C.maskedPost(sim, p, rs) && C.maskedApproach(s, sim, p, rs)) {
          out.push({ man: s, point: p });
          return;
        }
      }
    });
    return out;
  }
  function start(ctx, st, rs) {
    var picks = plan(ctx, rs);
    if (picks.length < tuning.minimumMen) return stop(ctx, st, 'no-masked-line'); // never an understrength element
    var M = root.BattleTacticalMarchProvider;
    for (var i = 0; i < picks.length; i++) {
      if (M && M.releaseMan) M.releaseMan(ctx, picks[i].man);
      var why = ask(ctx, st, picks[i].man, 'movement.move', picks[i].point);
      if (why) {
        st.reason = 'refused:' + why;
        release(ctx, st, null);
        st.until = ctx.sim.time + tuning.retry;
        return;
      }
    }
    st.phase = 'assemble';
    st.since = ctx.sim.time;
    st.started++;
    st.reason = 'masked-line';
  }
  /* Progress each man by the stage his owner reports. Returns a reason when the line is lost. */
  function progress(ctx, st) {
    var lost = null;
    st.men.forEach(function (cur, id) {
      if (lost) return;
      var stage = ctx.stage(cur.actionId);
      if (!cur.man || cur.man.dead || cur.man.incapacitated) lost = 'casualty';
      else if (!stage) lost = 'controller-ended';
      else if (stage.stage === 'cancelled') lost = 'owner-cancelled:' + stage.reason;
      else if (cur.kind === 'move' && stage.stage === 'arrived') {
        ctx.finish(cur.actionId, 'completed');
        st.men.delete(id);
        var why = ask(ctx, st, cur.man, 'movement.hold', cur.point);
        if (why) lost = 'hold-refused:' + why;
      }
    });
    return lost;
  }
  function update(ctx) {
    if (!ON) return;
    var sq = ctx.squad,
      sim = ctx.sim,
      st = state(ctx),
      now = sim.time,
      facts = ctx.facts;
    if (st.phase === 'idle') {
      if (
        now < st.until ||
        !missionRunning(sq) ||
        retained(sq) ||
        inContact(sq) ||
        (facts && facts.underFire > 0)
      )
        return;
      var rs = threats(sq, sim);
      if (rs.length) start(ctx, st, rs);
      return;
    }
    if (retained(sq)) return end(ctx, st, 'retained-skill');
    if (!missionRunning(sq)) return end(ctx, st, 'mission-changed');
    if (facts && facts.underFire > 0) return end(ctx, st, 'pressure');
    var lost = progress(ctx, st);
    if (lost) return end(ctx, st, lost);
    var contact = inContact(sq);
    if (st.phase === 'contact') {
      if (!contact) return end(ctx, st, 'contact-ended');
      return;
    }
    if (contact && st.readyAt != null) {
      st.phase = 'contact';
      st.contacts++;
      return;
    }
    if (contact) return end(ctx, st, 'contact-before-ready');
    var rs2 = threats(sq, sim);
    if (!rs2.length) return end(ctx, st, 'threat-lost');
    var C = root.BattleCoverPositions;
    for (var cur of st.men.values())
      if (!C.maskedPost(sim, cur.point, rs2)) return end(ctx, st, 'firing-station-lost-masking');
    var held = 0;
    st.men.forEach(function (cur) {
      if (cur.kind === 'hold') held++;
    });
    if (held >= tuning.minimumMen && held === st.men.size) {
      if (st.holdSince == null) st.holdSince = now;
      if (st.readyAt == null && now - st.holdSince >= tuning.minimumHold) st.readyAt = now;
      st.phase = st.readyAt == null ? 'hold' : 'ready';
    } else if (st.readyAt != null) return end(ctx, st, 'prepared-fireteam-left-line');
    else {
      st.holdSince = null;
      if (now - st.since > tuning.preparationBudget) return end(ctx, st, 'preparation-timed-out');
    }
    if (st.phase === 'ready' && now - st.readyAt > tuning.observationBudget)
      return end(ctx, st, 'no-firsthand-contact');
  }
  root.BattleTacticalAmbushSkill = {
    on: ON,
    tuning: tuning,
    update: update,
    /* The ambush has this man: the march and the station skill leave him alone. */
    wants: function (s) {
      var st = s && s.squad && states.get(s.squad);
      return !!(st && st.phase !== 'idle' && st.men.has(String(s.id)));
    },
    release: function (ctx, man) {
      var st = states.get(ctx.squad);
      if (st) release(ctx, st, man);
    },
    summary: function (sq) {
      var st = states.get(sq);
      return (
        st && {
          phase: st.phase,
          reason: st.reason,
          started: st.started,
          contacts: st.contacts,
          readyAt: st.readyAt,
          men: Array.from(st.men.keys()),
          posts: Array.from(st.men.entries()).map(function (e) {
            return { id: e[0], kind: e[1].kind, point: e[1].point };
          }),
          releases: Object.assign({}, st.releases)
        }
      );
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
