/* Contact skills for the opt-in tactical provider. The controller chooses fire discipline and
   roles; Meso publishes personally adopted orders and Engagement executes native contact primitives.
   No legacy updateFireControl/assignSuppressors/decide call, authoritative write or new clock. */
(function (root) {
  'use strict';
  var states = new WeakMap();
  function state(ctx) {
    var t = ctx.token,
      key = [t.battleId, t.generation, t.controllerEpoch, t.missionVersion].join(':'),
      st = states.get(ctx.squad);
    if (!st || st.key !== key) {
      st = {
        key: key,
        active: false,
        startedAt: null,
        fire: null,
        men: new Map(),
        roles: new Set(),
        points: new Map(),
        rejected: {}
      };
      states.set(ctx.squad, st);
    }
    return st;
  }
  function retreat(sq) {
    return sq.state === 'retreat' || sq.commandPhase === 'retreat';
  }
  function members(sq) {
    return (sq.members || []).filter(function (s) {
      return s && !s.dead && !s.isPlayer;
    });
  }
  function mkm(s) {
    var S = root.BattleSoldierStats;
    return S && S.of ? +S.of(s).mkm || 0 : 0.5;
  }
  function finish(ctx, st) {
    if (st.fire) ctx.finish(st.fire.id, 'contact-ended');
    st.men.forEach(function (a) {
      ctx.finish(a.id, 'contact-ended');
    });
    st.fire = null;
    st.men.clear();
    st.roles.clear();
    st.points.clear();
    st.active = false;
    st.startedAt = null;
    st.discipline = null;
  }
  /* Release changed roles before Squad Command asks for route movement on the same tick. */
  function reconcile(ctx, st) {
    var men = members(ctx.squad);
    st.men.forEach(function (a, id) {
      var s = men.find(function (m) {
          return String(m.id) === id;
        }),
        stage = ctx.stage(a.id);
      if (
        !s ||
        !stage ||
        stage.stage === 'cancelled' ||
        a.drill !== drill(s, ctx.sim, st) ||
        a.target !== (s.target && String(s.target.id)) ||
        a.pointKey !== (st.points.has(id) ? JSON.stringify(st.points.get(id)) : null)
      ) {
        ctx.finish(a.id, 'contact-role-changed');
        st.men.delete(id);
      }
    });
  }
  function personal(s, sim) {
    var A = root.SquadAI,
      own = A.soldierContact && A.soldierContact(s, sim);
    return own &&
      own.source === 'seen' &&
      Number.isFinite(+own.at) &&
      sim.time - +own.at <= root.BattleEngagement.tuning.ALERT_HOLD
      ? own
      : null;
  }
  function observation(s, sim, st) {
    if (!st) return root.BattleEngagement.fireControlObservation(s, sim);
    if (st.scanAt !== sim.time) {
      st.scanAt = sim.time;
      st.observations = new Map();
    }
    var prior = st.observations.get(s);
    if (!prior || prior.target !== s.target) {
      prior = { target: s.target, value: root.BattleEngagement.fireControlObservation(s, sim) };
      st.observations.set(s, prior);
    }
    return prior.value;
  }
  /* Fresh eyewitness sectors are lawful suppression intelligence, never
     personal targets. Ignore auditory, relayed and incoming-only beliefs. */
  var SIGHTING_AGE = 8;
  function seenSectors(sq, sim) {
    var A = root.SquadAI,
      /* The reporting eyewitness may be the player-controlled squad leader.
         The PLAYER does not become an AI suppressor, but their actual SEEN
         report remains valid shared intelligence for squadmates. */
      men = (sq.members || []).filter(function (s) {
        return s && !s.dead;
      }),
      reports = A.squadContactsMap && A.squadContactsMap(sq, sim),
      out = [];
    (reports || []).forEach(function (rec) {
      if (
        !rec ||
        rec.source !== 'seen' ||
        !Number.isFinite(rec.x) ||
        !Number.isFinite(rec.z) ||
        !Number.isFinite(rec.at) ||
        rec.at > sim.time ||
        sim.time - rec.at > SIGHTING_AGE ||
        !(rec.confidence >= 0.2) ||
        !men.some(function (man) {
          return String(man.id) === String(rec.sourceSoldier);
        })
      )
        return;
      out.push({ x: rec.x, z: rec.z, at: rec.at, sector: rec.sector });
    });
    var c = A.squadContact && A.squadContact(sq, sim),
      at = c && (c.firstHandAt == null ? c.at : c.firstHandAt);
    if (
      c &&
      A.hasFirstHandMemory &&
      A.hasFirstHandMemory(c, sim) &&
      !c.heard &&
      !c.relayedFrom &&
      Number.isFinite(c.x) &&
      Number.isFinite(c.z) &&
      Number.isFinite(at) &&
      at <= sim.time &&
      sim.time - at <= SIGHTING_AGE &&
      men.some(function (man) {
        return String(man.id) === String(c.seenBy);
      })
    )
      out.push({ x: c.x, z: c.z, at: at, sector: 'primary' });
    out.sort(function (a, b) {
      return b.at - a.at;
    });
    return out;
  }
  function update(ctx) {
    var st = state(ctx),
      sq = ctx.squad,
      sim = ctx.sim,
      E = root.BattleEngagement,
      Q = root.BattleSquadStability,
      A = root.SquadAI,
      report = ctx.facts || {},
      c = A.squadContact && A.squadContact(sq, sim),
      first =
        c && c.unit && (A.hasFirstHandMemory ? A.hasFirstHandMemory(c, sim) : !c.heard && !c.relayedFrom),
      threat = first && (!A.threatDisposition || A.threatDisposition(c.unit).combatThreat),
      underFire = report.underFire > 0;
    if (retreat(sq)) {
      finish(ctx, st);
      st.reason = 'retreat-owner';
      return;
    }
    if (!threat && !underFire && !sq.inContact) {
      if (st.fire) ctx.finish(st.fire.id, 'contact-clear');
      st.fire = null;
      st.active = false;
      st.startedAt = null;
      st.discipline = null;
      st.roles.clear();
      st.points.clear();
      st.reason = 'contact-clear';
      reconcile(ctx, st);
      return;
    }
    st.active = true;
    if (st.startedAt === null) st.startedAt = sim.time;
    var men = members(sq),
      T = Q.tuning.fireControl,
      ready = 0,
      sum = 0,
      shooter = null,
      best = -Infinity;
    men.forEach(function (s) {
      var o = observation(s, sim, st),
        score =
          mkm(s) + (s.role === 'sniper' ? 0.2 : s.role === 'scout' ? 0.12 : s.role === 'rifleman' ? 0.03 : 0);
      if (o.ready) ready++;
      sum += mkm(s);
      if (
        o.ready &&
        !A.isMachineGun(s) &&
        mkm(s) >= T.precisionMarksmanship &&
        (!shooter || score > best || (score === best && String(s.id) < String(shooter.id)))
      ) {
        shooter = s;
        best = score;
      }
    });
    var needed = Math.min(men.length, Math.max(T.minReady, Math.ceil(men.length * T.readyFraction))),
      strength = men.length / Math.max(1, A.establishment(sq)),
      mean = men.length ? sum / men.length : 0,
      origin = men.reduce(
        function (p, s) {
          p.x += s.root.position.x;
          p.z += s.root.position.z;
          return p;
        },
        { x: 0, z: 0 }
      ),
      range =
        threat && men.length
          ? Math.hypot(c.x - origin.x / men.length, c.z - origin.z / men.length)
          : Infinity,
      elapsed = sim.time - st.startedAt,
      desired = st.discipline === 'open' ? 'open' : 'hold',
      reason = 'prepare-line';
    if (!Q.fireControlOn() || underFire || !threat || elapsed >= T.maxHold) {
      desired = 'open';
      reason = underFire ? 'return-fire' : elapsed >= T.maxHold ? 'preparation-deadline' : 'no-visual-hold';
    } else if (desired !== 'open' && elapsed >= T.prepMin) {
      if (range >= T.longRange && shooter) {
        desired = 'precision';
        reason = 'qualified-marksman';
      } else if (
        ready >= needed &&
        (range <= T.closeRange || (strength >= T.minStrength && mean >= T.minMarksmanship))
      ) {
        desired = 'open';
        reason = 'line-ready';
      }
    }
    /* The covered-maneuver owner cannot obtain authentic supporting fire
       while the contact owner keeps every rifle under a preparation HOLD.
       Publish native OPEN fire permission for a valid covering assignment;
       Engagement still owns actual shooting, target and ballistics. */
    if (Q.controllerBound && Q.controllerBound.current(sq, sim)) {
      desired = 'open';
      reason = 'cover-assignment-needs-live-fire';
    }
    st.discipline = desired;
    st.reason = reason;
    st.ready = ready;
    st.requiredReady = needed;
    st.shooterId = desired === 'precision' ? String(shooter.id) : null;
    /* OPEN is permission, not target assignment. Keep its envelope stable so a changing report
       cannot perpetually supersede the order before personal adoption completes. */
    var params = {
        state: desired,
        targetId: desired !== 'open' && threat ? String(c.unit.id) : null,
        shooterId: st.shooterId
      },
      signature = JSON.stringify(params),
      stage = st.fire && ctx.stage(st.fire.id);
    if (!stage || stage.stage === 'cancelled' || st.fire.signature !== signature) {
      if (st.fire) ctx.finish(st.fire.id, 'fire-control-changed');
      var fire = ctx.request('fire.control', null, params);
      st.fire = fire.ok ? { id: fire.actionId, signature: signature } : null;
      st.rejected.fire = fire.ok ? null : fire.reason;
    }
    var prior = st.roles,
      sectors = desired === 'open' ? seenSectors(sq, sim) : [],
      opportunities = [];
    if (desired === 'open')
      men.forEach(function (s) {
        if (
          E.reacting(s) ||
          s.suppressedUntil > sim.time ||
          !s.weapon ||
          s.reloading ||
          s.outOfAmmo ||
          (s.eng && s.eng.urgentBound)
        )
          return;
        var o = observation(s, sim, st);
        if (s.target && o.ready) return;
        var best = null,
          rating = Infinity;
        sectors.forEach(function (rec) {
          var posture = E.suppressionStance && E.suppressionStance(s, sim, rec);
          if (!posture) return;
          var d = Math.hypot(rec.x - s.root.position.x, rec.z - s.root.position.z);
          if (d < rating) {
            best = rec;
            rating = d;
          }
        });
        if (best) opportunities.push({ man: s, point: { x: best.x, z: best.z }, distance: rating });
      });
    opportunities.sort(function (a, b) {
      return (
        +!A.isMachineGun(a.man) - +!A.isMachineGun(b.man) ||
        +!prior.has(String(a.man.id)) - +!prior.has(String(b.man.id)) ||
        a.distance - b.distance ||
        String(a.man.id).localeCompare(String(b.man.id))
      );
    });
    st.points.clear();
    st.roles = new Set(
      opportunities.slice(0, E.tuning.MAX_SUPPRESSORS).map(function (entry) {
        var id = String(entry.man.id);
        st.points.set(id, entry.point);
        return id;
      })
    );
    reconcile(ctx, st);
  }
  /* No shared report becomes a personal target or a permission to shoot. A man without a usable
     line yields locomotion to the march provider; the later covered-bound skill will choose cover. */
  function drill(s, sim, st) {
    var E = root.BattleEngagement;
    if (
      !s ||
      s.dead ||
      s.isPlayer ||
      (root.BattleTacticalPositions && root.BattleTacticalPositions.current(s)) ||
      (retreat(s.squad) &&
        !(
          root.BattleSquadStability.controllerBound && root.BattleSquadStability.controllerBound.role(s, sim)
        )) ||
      E.reacting(s) ||
      (s.eng && s.eng.state === 'bound' && s.eng.urgentBound)
    )
      return null;
    if (s.suppressedUntil > sim.time) return 'pinned';
    if (E.fireControlPreparing(s, sim)) return 'prepare';
    if (s.target) {
      var o = observation(s, sim, st);
      /* A crouched/prone man may still have a legitimate firing line above
         cover. Let Engagement (the sole stance and shot owner) raise him,
         rather than labelling him MARCH and never giving him that chance. */
      var here = s.root && s.root.position,
        peek =
          o.inRange &&
          here &&
          !(s.suppressedUntil > sim.time) &&
          !s.moving &&
          E.firingLineClear &&
          (E.firingLineClear(s, s.target, here, 'crouch', sim) ||
            E.firingLineClear(s, s.target, here, 'stand', sim));
      if (o.inRange && ((o.visualLine && o.ballisticLine) || peek)) return 'fire';
    }
    if (st && st.roles.has(String(s.id)) && st.points.has(String(s.id))) return 'suppress';
    return E.underFireNow(s, sim) ? 'watch' : 'march';
  }
  function engagement(ctx, override) {
    var st = state(ctx),
      s = ctx.facts,
      id = String(s.id),
      desired = override || drill(s, ctx.sim, st),
      current = st.men.get(id),
      stage = current && ctx.stage(current.id),
      target = s.target && String(s.target.id),
      point = desired === 'suppress' && st.points.get(id),
      pointKey = point ? JSON.stringify(point) : null;
    if (
      current &&
      (!stage ||
        stage.stage === 'cancelled' ||
        current.drill !== desired ||
        current.target !== target ||
        current.pointKey !== pointKey)
    ) {
      ctx.finish(current.id, 'contact-role-changed');
      st.men.delete(id);
      current = null;
    }
    if (!desired || current) return;
    var result = ctx.request(
      desired === 'march' ? 'combat.march' : 'combat.contact',
      id,
      desired === 'march'
        ? {}
        : desired === 'suppress'
          ? { drill: desired, point: point }
          : { drill: desired }
    );
    if (result.ok)
      st.men.set(id, { id: result.actionId, drill: desired, target: target, pointKey: pointKey });
    st.rejected[id] = result.ok ? null : result.reason;
  }
  root.BattleTacticalContactSkills = {
    release: function (ctx, man) {
      var st = state(ctx);
      st.men.forEach(function (a, id) {
        if (!man || String(man.id) === id) {
          ctx.finish(a.id, 'covered-maneuver-role');
          st.men.delete(id);
        }
      });
    },
    update: update,
    engagement: engagement,
    wants: function (s, sim) {
      var d = drill(s, sim, states.get(s.squad));
      return !!d && d !== 'march';
    },
    summary: function (sq) {
      var st = states.get(sq);
      if (!st) return null;
      return {
        active: st.active,
        state: st.discipline || null,
        startedAt: st.startedAt,
        reason: st.reason,
        ready: st.ready || 0,
        requiredReady: st.requiredReady || 0,
        shooterId: st.shooterId || null,
        roles: Array.from(st.men.entries()).map(function (entry) {
          return {
            actorId: entry[0],
            actionId: entry[1].id,
            drill: entry[1].drill,
            reportedPoint: st.points.get(entry[0]) || null
          };
        }),
        rejected: Object.assign({}, st.rejected)
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
