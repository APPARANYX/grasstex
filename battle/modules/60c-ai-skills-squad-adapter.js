/* Squad skills request existing Meso executors. All world references stay here;
   skills receive detached upward-report facts, never enemies or command APIs. */
(function (root) {
  'use strict';
  var battles = new WeakMap(),
    ids = ['squad.prepare-firing-line', 'squad.coordinate-support-fire', 'squad.execute-covered-bound'];
  function immutable(v) {
    if (v && typeof v === 'object') {
      Object.keys(v).forEach(function (k) {
        immutable(v[k]);
      });
      Object.freeze(v);
    }
    return v;
  }
  function point(v) {
    return v && Number.isFinite(v.x) && Number.isFinite(v.z) ? { x: v.x, z: v.z } : null;
  }
  function distance(a, b) {
    return a && b ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity;
  }
  function owners() {
    var S = root.BattleSquadStability;
    return {
      S: S,
      P: S && S.tacticalPostures,
      L: root.BattleLeases,
      E: root.BattleEngagement,
      A: root.SquadAI,
      C: root.BattleCoverPositions
    };
  }
  function dependency() {
    var o = owners();
    return !!(
      o.S &&
      o.S.localPlan &&
      o.S.localPlan.on &&
      o.S.localPlan.resourcesOn &&
      o.P &&
      o.P.on &&
      o.P.maneuverOn &&
      o.C &&
      typeof o.C.coveredBoundsOn === 'function' &&
      o.C.coveredBoundsOn() &&
      o.E &&
      typeof o.E.effectiveFireOn === 'function' &&
      o.E.effectiveFireOn() &&
      root.BattleAmmunition &&
      typeof root.BattleAmmunition.available === 'function' &&
      o.A &&
      typeof o.A.shotReceipt === 'function' &&
      root.BattleCommandReception &&
      typeof root.BattleCommandReception.movementEnabled === 'function' &&
      root.BattleCommandReception.movementEnabled()
    );
  }
  function enabled(b, q, profile) {
    /* Reactive fire-and-maneuver uses native Meso, not masked ambush episodes. */
    if (root.BattleReactiveFireManeuver && root.BattleReactiveFireManeuver.on) return false;
    var squads = b.factions && b.factions[q.faction] && b.factions[q.faction].squads;
    return (
      dependency() &&
      Array.isArray(squads) &&
      squads.indexOf(q) >= 0 &&
      ['us', 'ge'].reduce(function (n, f) {
        return n + ((b.factions[f] && b.factions[f].squads) || []).length;
      }, 0) <= 32 &&
      ids.every(function (id) {
        return profile.skills[id] && profile.skills[id].enabled;
      })
    );
  }
  function blocker(b, q) {
    var o = owners(),
      a = q && q.members,
      lead = q && o.A && o.A.leaderOf(q),
      t = root.BattleSquadTransport;
    if (!dependency() || !Array.isArray(a) || a.length < 3 || a.length > 32) return 'no-authority';
    if (
      b.winner ||
      q.state === 'retreat' ||
      !lead ||
      lead.dead ||
      o.S.leaderlessActive(q) ||
      a.some(function (s) {
        return s.isPlayer || s.incapacitated || (t && t.isPassenger(s));
      })
    )
      return 'interrupted';
    if (o.L.holds(q, 'regroup', b.time) || o.L.holds(q, 'recon', b.time)) return 'interrupted';
    return null;
  }
  function episode(b, q) {
    var s = battles.get(b),
      e = s && s.episodes.get(q);
    return e && e.mission === q._macroMission ? e : null;
  }
  function owned(b, q, st) {
    var e = episode(b, q);
    return !!(e && !e.ended && e.posture && (!st || st === e.posture));
  }
  function reports(b, q) {
    var rows = root.SquadAI.squadContactsMap(q, b);
    if (!Array.isArray(rows) || rows.length > 32) return { facts: [], budget: false };
    return {
      budget: true,
      facts: rows
        .filter(function (r) {
          return (
            point(r) &&
            Number.isFinite(r.at) &&
            r.at <= b.time &&
            b.time - r.at < 10 &&
            Number.isFinite(r.confidence) &&
            r.confidence > 0 &&
            r.confidence <= 1 &&
            ['seen', 'told', 'heard', 'incoming'].indexOf(r.source) >= 0
          );
        })
        .map(function (r, i) {
          return {
            key: 'squad-report-' + i,
            source: r.source,
            observedAt: r.at,
            expiresAt: r.at + 10,
            confidence: r.confidence,
            location: point(r)
          };
        })
    };
  }
  function project(b, q) {
    var o = owners(),
      data = reports(b, q),
      e = episode(b, q),
      st = o.P && o.P.current(b, q),
      m = q._macroMission,
      ex = q._missionExecution,
      accepted = !!(m && m.status === 'executing' && ex && ex.mission === m),
      fc = q.fireControl,
      stage = e && e.ended ? 'closed' : e && e.prepared ? (e.supported ? 'bound' : 'support') : 'prepare',
      foreign = st && !(e && e.posture === st);
    if (foreign) stage = 'legacy';
    return {
      missionVersion: m && Number.isFinite(m.version) ? m.version : 0,
      planSerial: e ? e.serial : null,
      facts: data.facts,
      stage: stage,
      preparationAllowed:
        !q.inContact &&
        !q.members.some(function (s) {
          return !!s.target;
        }) &&
        !(q._engagementPlan && ['active', 'quiet'].indexOf(q._engagementPlan.status) >= 0) &&
        q._localTask &&
        q._localTask.inputs &&
        Number.isFinite(q._localTask.inputs.pressure) &&
        q._localTask.inputs.pressure <= 0.1 &&
        data.facts.some(function (f) {
          return f.confidence >= 0.5;
        }),
      guards: {
        alive:
          !!q.members &&
          q.members.some(function (s) {
            return !s.dead;
          }),
        safe: !blocker(b, q),
        mission: accepted,
        receipt: accepted,
        roe: !(
          fc &&
          fc.state === 'hold' &&
          !(e && e.posture === st && fc.reason === 'coordinated masked ambush')
        ),
        budget: data.budget && q.members.length <= 32
      },
      capabilities: {
        'perceived-threat': data.facts.length > 0,
        'current-mission': accepted,
        'adopted-movement': accepted,
        'reachable-cover': false,
        'masked-line': !!(e && e.prepared && st && st === e.posture && st.readyAt != null),
        'support-ready': !!(e && e.supported),
        'covered-maneuver': !!(e && e.supported && st && st.mode === 'maneuver')
      },
      availableResources: dependency() && !blocker(b, q) ? ['team'] : []
    };
  }
  function state(b) {
    var s = battles.get(b);
    if (!s) {
      s = {
        episodes: new Map(),
        events: [],
        counts: { attempts: 0, prepared: 0, supported: 0, arrived: 0, failed: 0 },
        serial: 0,
        eventSerial: 0
      };
      battles.set(b, s);
    }
    return s;
  }
  function emit(b, q, e, kind, reason, extra) {
    var s = state(b);
    if (!root.BattleAISkills.config().observer) return;
    s.events.push(
      immutable(
        Object.assign(
          {
            serial: ++s.eventSerial,
            at: b.time,
            faction: q.faction,
            squad: String(q.id),
            generation: e.generation,
            missionVersion: e.version,
            planSerial: e.serial,
            postureSerial: e.posture && e.posture.serial,
            commandPhase: q.commandPhase || null,
            postureMode: e.posture && e.posture.mode,
            postureStage: e.posture && e.posture.stage,
            nativePreparation: e.nativePreparation || null,
            kind: kind,
            reason: reason
          },
          extra || {}
        )
      )
    );
    if (s.events.length > 128) s.events.shift();
  }
  function cancel(b, q, reason) {
    var saved = battles.get(b),
      e = saved && saved.episodes.get(q),
      o = owners();
    if (!e || e.ended) return;
    e.ended = true;
    state(b).counts.failed++;
    emit(b, q, e, 'failed', reason, { lastProgress: e.progressReason || null });
    var lease = o.L.get(q, 'bound');
    if (lease && lease.data && lease.data.aiSkillEpisode === e.identity) {
      o.L.end(q, 'bound', b.time, 'skill ' + reason);
      o.E.clearBoundOrders(q);
    }
    o.P.releasePilot(b, q, e.posture, 'skill ' + reason);
  }
  function support(b, q, report, movers) {
    var o = owners(),
      list = report && report.fireSupport;
    if (!Array.isArray(list) || list.length > 32) return [];
    return list.filter(function (s, i) {
      return (
        list.indexOf(s) === i &&
        q.members.indexOf(s) >= 0 &&
        s.squad === q &&
        s.weapon &&
        ['rifle', 'carbine'].indexOf(s.weapon.kind) >= 0 &&
        (!movers || movers.indexOf(String(s.id)) < 0) &&
        o.E.supportReady(s, b)
      );
    });
  }
  function perform(name, b, q, snap, plan, context) {
    var o = owners(),
      e = episode(b, q),
      report = context && context.report;
    function result(status, reason) {
      if (e && status === 'Running' && e.progressReason !== reason) {
        e.progressReason = reason;
        emit(b, q, e, 'progress', reason);
      }
      return { status: status, reason: reason };
    }
    if (ids.indexOf(name) < 0 || plan.resources.indexOf('team') < 0)
      return result('Failure', 'unsupported-action');
    if (blocker(b, q)) return result('Failure', 'interrupted');
    if (name === ids[0] && !e) {
      if (o.P.current(b, q)) return result('Failure', 'no-authority');
      var s = state(b);
      e = {
        mission: q._macroMission,
        version: snap.missionVersion,
        generation: snap.generation,
        serial: ++s.serial,
        startedAt: b.time,
        posture: null,
        positions: new Map(),
        movers: new Map(),
        shots: new Map(),
        ended: false
      };
      e.identity = e.generation + ':' + q.faction + ':' + q.id + ':' + e.version + ':' + e.serial;
      if (s.episodes.size >= 32 && !s.episodes.has(q)) return result('Failure', 'no-authority');
      s.episodes.set(q, e);
      s.counts.attempts++;
      emit(b, q, e, 'prepare', 'requested');
    }
    if (!e || e.ended || e.version !== snap.missionVersion || e.generation !== snap.generation)
      return result('Failure', 'no-authority');
    if (plan.planSerial == null) plan.planSerial = e.serial;
    if (plan.planSerial !== e.serial) return result('Failure', 'interrupted');
    var st = o.P.update(b, q, report);
    if (st && !e.posture) e.posture = st;
    if (st && e.posture !== st) return result('Failure', 'interrupted');
    if (!st) {
      if (e.posture) return result('Failure', 'interrupted');
      e.nativePreparation = o.P.rejection ? o.P.rejection(b, q) : null;
      return b.time - e.startedAt >= o.P.tuning.preparationBudget
        ? result('Failure', 'blocked-route')
        : result('Running', e.nativePreparation ? e.nativePreparation.reason : 'finding-masked-posts');
    }
    if (st.mode === 'hold') return result('Failure', e.supported ? 'support-revoked' : 'interrupted');
    if (name === ids[0]) {
      if (
        st.readyAt != null &&
        st.heldActorIds.length === 3 &&
        st.coreWitnesses &&
        st.coreWitnesses.length === 3 &&
        st.readyAt - st.heldSince >= 4
      ) {
        e.prepared = true;
        state(b).counts.prepared++;
        emit(b, q, e, 'prepared', 'four-second-physical-hold', {
          heldSince: st.heldSince,
          readyAt: st.readyAt,
          posts: st.coreWitnesses.map(function (w) {
            return { id: w.id, point: point(w.point), stance: w.stance, envelope: w.envelope };
          })
        });
        return result('Success', 'prepared');
      }
      return result('Running', 'physical-preparation');
    }
    if (!e.prepared) return result('Failure', 'no-authority');
    var qualified = support(b, q, report),
      live = qualified.filter(function (s) {
        var r = o.A.shotReceipt(s, b);
        return r && r.at >= st.readyAt;
      });
    if (name === ids[1]) {
      if (st.mode === 'maneuver' && qualified.length >= 2 && live.length >= 2) {
        e.supported = true;
        state(b).counts.supported++;
        emit(b, q, e, 'supported', 'two-independent-effective-rifles', {
          supporters: live.map(function (s) {
            return { id: String(s.id), shot: o.A.shotReceipt(s, b) };
          })
        });
        return result('Success', 'support-established');
      }
      return result(
        'Running',
        qualified.length === 1 ? 'one-effective-supporter' : 'awaiting-independent-support'
      );
    }
    if (!e.supported || st.mode !== 'maneuver') return result('Failure', 'no-authority');
    var lease = o.L.get(q, 'bound'),
      expected = lease && lease.data && lease.data.aiSkillEpisode === e.identity ? lease.data.moverIds : null,
      movingIds = [];
    if (Array.isArray(expected) && !e.boundLease) {
      e.boundLease = lease;
      e.expected = expected.slice();
    }
    if (e.boundLease && lease && lease !== e.boundLease) return result('Failure', 'interrupted');
    q.members.forEach(function (s) {
      var eng = s.eng,
        p = point(s.root && s.root.position),
        goal = point(eng && eng.cover),
        key = String(s.id);
      if (
        eng &&
        !s.dead &&
        eng.state === 'bound' &&
        goal &&
        lease &&
        eng.since >= lease.since &&
        lease &&
        lease.data &&
        lease.data.aiSkillEpisode === e.identity &&
        !e.movers.has(key)
      ) {
        var origin = e.positions.get(key) || p,
          route = o.C.boundRoute(
            s,
            b,
            goal,
            snap.facts.map(function (f) {
              return { x: f.location.x, z: f.location.z, at: f.observedAt, confidence: f.confidence };
            })
          );
        if (route && route.eligible && distance(origin, goal) > 1.8)
          e.movers.set(key, {
            origin: origin,
            goal: goal,
            at: eng.since,
            shots: new Set(),
            max: 0,
            arrived: false
          });
      }
      var move = e.movers.get(key);
      if (move && !move.arrived) {
        movingIds.push(key);
        move.max = Math.max(move.max, distance(p, move.origin));
        qualified.forEach(function (man) {
          var shot = o.A.shotReceipt(man, b);
          if (
            String(man.id) !== key &&
            (!e.expected || e.expected.indexOf(String(man.id)) < 0) &&
            shot &&
            shot.at > move.at
          )
            move.shots.add(String(man.id));
        });
        if (
          !s.dead &&
          move.max > 0.75 &&
          distance(p, move.goal) <= 1.8 &&
          eng.state !== 'bound' &&
          move.shots.size >= 2
        )
          move.arrived = true;
      }
      e.positions.set(key, p);
    });
    var independent = support(b, q, report, e.expected || movingIds);
    if (independent.length < 2) return result('Failure', 'support-revoked');
    if (
      e.expected &&
      e.expected.length > 0 &&
      e.movers.size === e.expected.length &&
      Array.from(e.movers.values()).every(function (m) {
        return m.arrived;
      })
    ) {
      e.ended = true;
      state(b).counts.arrived++;
      emit(b, q, e, 'arrived', 'physical-arrival-under-independent-fire', {
        movers: Array.from(e.movers.entries()).map(function (row) {
          return {
            id: row[0],
            origin: row[1].origin,
            goal: row[1].goal,
            metres: row[1].max,
            supporters: Array.from(row[1].shots)
          };
        })
      });
      // Reconcile pending authorization only; adopted Micro movement keeps its owner.
      if (lease && lease.data && lease.data.aiSkillEpisode === e.identity) {
        o.L.end(q, 'bound', b.time, 'skill physically arrived');
        o.E.clearBoundOrders(q);
      }
      o.P.releasePilot(b, q, e.posture, 'skill physically arrived');
      return result('Success', 'arrived');
    }
    context.allowBound = !e.boundLease;
    context.episode = e.identity;
    return result('Running', e.movers.size ? 'covered-movement' : 'awaiting-native-bound');
  }
  root.BattleAISquadAdapter = Object.freeze({
    enabled: enabled,
    blocker: blocker,
    project: project,
    owned: owned,
    requested: function (b, q) {
      var e = episode(b, q);
      return !!(e && !e.ended);
    },
    perform: perform,
    cancel: cancel,
    observe: function (b) {
      var s = battles.get(b);
      if (s) s.events = [];
    },
    reset: function (b) {
      var s = battles.get(b);
      if (s) {
        Array.from(s.episodes.keys()).forEach(function (q) {
          cancel(b, q, 'interrupted');
        });
        battles.delete(b);
      }
    },
    reconcile: function (b, q) {
      var saved = battles.get(b),
        o = owners();
      if (!saved) return;
      Array.from(saved.episodes.keys()).forEach(function (actor) {
        var roster = b.factions && b.factions[actor.faction] && b.factions[actor.faction].squads;
        if (!Array.isArray(roster) || roster.indexOf(actor) < 0) {
          cancel(b, actor, 'interrupted');
          saved.episodes.delete(actor);
        }
      });
      var e = saved.episodes.get(q);
      if (
        e &&
        !e.ended &&
        (e.mission !== q._macroMission || blocker(b, q) || (e.posture && o.P.current(b, q) !== e.posture))
      )
        cancel(b, q, 'interrupted');
    },
    controls: function (b, q) {
      var e = episode(b, q);
      if (e && !e.ended) return true;
      var v = project(b, q);
      return (
        v.stage === 'prepare' &&
        v.preparationAllowed &&
        Object.keys(v.guards).every(function (k) {
          return v.guards[k];
        })
      );
    },
    moverAdopted: function (s, b, version) {
      var C = root.BattleCommandReception,
        r = C && C.peek(s, b, 'movement', 'soldier:' + String(s.id));
      return !!(
        r &&
        r.phase === 'adopted' &&
        r.envelopeId === s._fireteamAdoptedEnvelope &&
        r.data &&
        r.data.missionVersion === version
      );
    },
    eventsSince: function (b, serial) {
      var s = battles.get(b);
      return Object.freeze(
        s && root.BattleAISkills.config().observer
          ? s.events.filter(function (e) {
              return e.serial > serial;
            })
          : []
      );
    },
    diagnostics: function (b, observer) {
      var s = battles.get(b);
      return s
        ? immutable({
            eventSerial: s.eventSerial,
            counts: Object.assign({}, s.counts),
            events: observer ? s.events.slice() : []
          })
        : null;
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
