/* Foundational provider (slices 2/3 of the legacy replacement, `?tacticalController=new`). It takes
   every squad on both sides. Each squad walks
   its brief's route legs in Meso's formation layout and holds at the last leg; acceptance, transport,
   casualties, succession, retreat, rally recovery, physiology and reactions stay with their owners.
   The independent contact module (13d) chooses fire discipline and contact roles. Station selection
   and coordinated covered bounds remain later skills.

   It decides and asks; it writes nothing. Every effect is a capability request through the owner
   adapters (13b), and every man's progress is the stage his owner reports. A man the provider
   stopped asking for says why in summary(). State lives in a WeakMap keyed by the squad; no squad or
   soldier field, timer, RNG draw or movement writer is added. Without the flag the module does
   nothing, so a default battle is unchanged. */
(function (root) {
  'use strict';
  var SEARCH = typeof location !== 'undefined' ? location.search || '' : '',
    ON = /[?&]tacticalController=new(?:&|#|$)/i.test(SEARCH),
    ID = 'march',
    QUIET_CONTACT_RECOVERY = !!root.BATTLE_PREVIEW && /[?&]firstContactResponse=1(?:&|#|$)/.test(SEARCH);
  var squads = new WeakMap(),
    warned = false;

  function point(v) {
    return v && isFinite(+v.x) && isFinite(+v.z) ? { x: +v.x, z: +v.z } : null;
  }
  function dist(a, b) {
    return !a || !b ? Infinity : Math.hypot(a.x - b.x, a.z - b.z);
  }
  function men(sq) {
    return (sq.members || []).filter(function (s) {
      return s && !s.dead && !s.isPlayer;
    });
  }
  function centroid(list) {
    var x = 0,
      z = 0,
      n = 0;
    list.forEach(function (s) {
      var p = s.root && s.root.position;
      if (!p) return;
      x += +p.x;
      z += +p.z;
      n++;
    });
    return n ? { x: x / n, z: z / n } : null;
  }
  function unit(from, to) {
    var dx = to.x - from.x,
      dz = to.z - from.z,
      l = Math.hypot(dx, dz);
    return l > 1e-6 ? { x: dx / l, z: dz / l } : null;
  }
  /* The leg arrival radius is the doctrine's own (the radius Squad Leader execution uses on a route leg). */
  function legRadius(sim, sq) {
    var C = root.BattleCommanderAI,
      cfg = C && C.policyFor ? C.policyFor(sim, sq.faction) : null;
    return +(cfg && cfg.routeArrivalRadius) || 8;
  }
  /* Meso may withhold distant route motion on a real contact, but an old
     squad-wide inContact latch is not perpetual current threat evidence.
     Only in the preview arm, resume the existing Meso mission when all native
     contact owners report the sector quiet. No new route, speed or destination
     authority is introduced. */
  function contactStillCredible(sq, sim) {
    var E = root.BattleEngagement,
      A = root.SquadAI,
      C = root.BattleCoverPositions,
      members = sq.members || [];
    for (var i = 0; i < members.length; i++) {
      var s = members[i];
      if (!s || s.dead) continue;
      if (s.target && (!A.threatDisposition || A.threatDisposition(s.target).combatThreat)) return true;
      if (E && E.underFireNow && E.underFireNow(s, sim)) return true;
    }
    var leader = A.leaderOf && A.leaderOf(sq);
    if (leader && C && C.boundThreats && C.boundThreats(leader, sim).length) return true;
    var age = +(E && E.tuning && E.tuning.ALERT_HOLD) || 4.5,
      contacts = [A.squadContact && A.squadContact(sq, sim), sq.contact];
    return contacts.some(function (c) {
      return (
        c &&
        !c.heard &&
        c.source !== 'heard' &&
        Number.isFinite(+c.at) &&
        +c.at <= sim.time &&
        sim.time - +c.at <= age &&
        (!c.unit || !A.threatDisposition || A.threatDisposition(c.unit).combatThreat)
      );
    });
  }
  function stateOf(sq) {
    var st = squads.get(sq);
    if (!st) squads.set(sq, (st = { mission: null, leg: 0, target: null, forward: null, men: new Map() }));
    return st;
  }

  /* executeMission: route progression. The squad moves to its next leg once its centre is within the
     leg radius; the last leg is where it holds. The brief's legs are the retained `sq.route`. */
  function executeMission(ctx) {
    var sq = ctx.squad,
      sim = ctx.sim,
      st = stateOf(sq),
      legs = sq.route || [],
      m = sq._macroMission || null;
    if (st.mission !== m) {
      st.mission = m;
      st.leg = 0;
      st.target = null;
    }
    if (!legs.length) {
      st.target = null;
      st.idle = 'no-route';
      return;
    }
    st.idle = null;
    st.retry = true; // refusals are asked again once per mission tick, not every squad tick
    var last = legs.length - 1,
      here = centroid(men(sq)),
      r = legRadius(sim, sq);
    st.leg = Math.min(st.leg, last);
    while (st.leg < last && dist(here, point(legs[st.leg])) <= r) st.leg++;
    var target = point(legs[st.leg]);
    if (!st.target || dist(st.target, target) > 1e-6) {
      var from = st.leg > 0 ? point(legs[st.leg - 1]) : here;
      st.forward = (from && unit(from, target)) || st.forward || { x: 0, z: 1 };
      st.target = target;
      st.final = st.leg === last;
      st.stopped = new Map();
    }
  }

  /* squadCommand: each man walks to his formation slot around the leg point, then holds there on the
     last leg. An accepted order is asked for once per leg; one the owner ended is not asked for again
     on the same leg, and the man is listed as stopped with the owner's reason. A refusal changed
     nothing, so it is asked again after the next mission tick (a rider still seated, a cleanup still
     pending) and listed as stopped while it lasts. Retreat is a retained service and wins: on a retreat every
     order and hold is finished at its owner, and the men are asked again once the retreat ends. */
  function squadCommand(ctx) {
    var sq = ctx.squad,
      st = stateOf(sq),
      Q = root.BattleSquadStability,
      contactHazard = sq.inContact && (!QUIET_CONTACT_RECOVERY || contactStillCredible(sq, ctx.sim));
    /* The resolver treats either as retreat; so does the provider. */
    if (sq.state === 'retreat' || sq.commandPhase === 'retreat') return standDown(ctx, st, 'retreat');
    if (!st.target || !Q || !Q.formationSlots) return;
    var slots = Q.formationSlots(sq, st.target, st.forward);
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i].man;
      if (s.dead || s.isPlayer) continue;
      /* A claimed native station owns locomotion; do not republish formation moves. */
      if (root.BattleTacticalPositions && root.BattleTacticalPositions.current(s)) {
        var occupied = st.men.get(String(s.id));
        if (occupied) ctx.finish(occupied.actionId, 'station-claimed');
        st.men.delete(String(s.id));
        if (st.stopped) st.stopped.delete(String(s.id));
        continue;
      }
      var id = String(s.id),
        slot = slots[i].point,
        cur = st.men.get(id),
        stage = cur && ctx.stage(cur.actionId);
      /* Contact by another man is not a personal permission to march into a
         distant route leg. Release only this uninformed man's old movement
         order while retaining legitimate covered-bound role and soldier
         combat decisions for his squadmates. */
      if (contactHazard && !s.target) {
        if (cur) ctx.finish(cur.actionId, 'unconfirmed-personal-contact');
        st.men.delete(id);
        st.stopped.delete(id);
        continue;
      }
      var contact = root.BattleTacticalContactSkills;
      var maneuver = root.BattleTacticalCoveredManeuver;
      if ((maneuver && maneuver.wants(s, ctx.sim)) || (contact && contact.wants(s, ctx.sim))) {
        if (cur) ctx.finish(cur.actionId, 'contact-skill');
        st.men.delete(id);
        st.stopped.delete(id);
        continue;
      }
      if (cur && !stage) cur = null; // the controller ended it (mission, roster, interrupt)
      if (cur && cur.target !== st.target) {
        ctx.finish(cur.actionId, 'superseded');
        cur = null;
      }
      if (cur) {
        if (stage.stage === 'cancelled') {
          ctx.finish(cur.actionId, 'cancelled');
          st.men.delete(id);
          st.stopped.set(id, stage.reason);
        } else if (cur.kind === 'move' && st.final && stage.stage === 'arrived') {
          ctx.finish(cur.actionId, 'completed');
          ask(ctx, st, id, 'movement.hold', cur.point);
        }
        continue;
      }
      st.men.delete(id);
      var why = st.stopped.get(id);
      if (!why || (st.retry && why.indexOf('refused:') === 0)) ask(ctx, st, id, 'movement.move', slot);
    }
    st.retry = false;
  }
  function standDown(ctx, st, reason) {
    st.men.forEach(function (cur) {
      ctx.finish(cur.actionId, reason);
    });
    st.men.clear();
    if (st.stopped) st.stopped.clear();
  }
  function ask(ctx, st, id, capability, at) {
    var res = ctx.request(capability, id, { point: at });
    if (res && res.ok) {
      st.stopped.delete(id);
      st.men.set(id, {
        actionId: res.actionId,
        kind: capability === 'movement.hold' ? 'hold' : 'move',
        point: at,
        target: st.target
      });
    } else {
      st.men.delete(id);
      st.stopped.set(id, 'refused:' + ((res && res.reason) || 'unknown'));
    }
  }
  function noop() {}

  /* Take every squad on both sides; a refused switch is retried by the controller's own backoff. */
  function takeAll(sim) {
    var TC = root.BattleTacticalController;
    if (!TC || !sim || !sim.factions) return;
    /* A page that did not load the contract cannot hand over a squad; say so instead of marching nobody. */
    if (!root.BattleTacticalCapabilityContract && !warned) {
      warned = true;
      if (typeof console !== 'undefined' && console.warn)
        console.warn(
          '[TACTICAL] ?tacticalController=new but the capability contract is not loaded: legacy keeps every squad'
        );
    }
    if (!root.BattleTacticalContactSkills) {
      if (typeof console !== 'undefined' && console.warn)
        console.warn('[TACTICAL] contact skills missing: legacy keeps every squad');
      return;
    }
    ['us', 'ge'].forEach(function (f) {
      var a = (sim.factions[f] && sim.factions[f].squads) || [];
      for (var i = 0; i < a.length; i++) if (!TC.controls(sim, a[i])) TC.requestMode(sim, a[i], 'new', ID);
    });
  }
  /* Per squad: the leg it is on, and each man's action with the stage its owner reports, or why the
     provider stopped asking for him. */
  function summary(sim) {
    var TC = root.BattleTacticalController,
      live = (TC && TC.summary(sim).live) || [],
      byId = {},
      out = [];
    live.forEach(function (a) {
      byId[a.actionId] = a;
    });
    ['us', 'ge'].forEach(function (f) {
      var a = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      for (var i = 0; i < a.length; i++) {
        var st = squads.get(a[i]);
        if (!st) continue;
        var row = {
          squad: f + ':' + a[i].id,
          controlled: !!(TC && TC.controls(sim, a[i])),
          leg: st.leg,
          legs: (a[i].route || []).length,
          idle: st.idle || null,
          stages: {},
          stopped: {}
        };
        if (root.BattleTacticalContactSkills) row.contact = root.BattleTacticalContactSkills.summary(a[i]);
        if (root.BattleTacticalCoveredManeuver)
          row.maneuver = root.BattleTacticalCoveredManeuver.summary(a[i]);
        st.men.forEach(function (cur) {
          var l = byId[cur.actionId],
            key = cur.kind + ':' + (l ? l.stage : 'gone');
          row.stages[key] = (row.stages[key] || 0) + 1;
        });
        (st.stopped || new Map()).forEach(function (why) {
          row.stopped[why] = (row.stopped[why] || 0) + 1;
        });
        out.push(row);
      }
    });
    return out;
  }

  root.BattleTacticalMarchProvider = {
    on: ON,
    id: ID,
    summary: summary,
    target: function (sq) {
      return stateOf(sq).target;
    },
    release: function (ctx) {
      standDown(ctx, stateOf(ctx.squad), 'covered-maneuver');
    },
    releaseMan: function (ctx, man) {
      var st = stateOf(ctx.squad),
        id = String(man.id),
        cur = st.men.get(id);
      if (cur) ctx.finish(cur.actionId, 'station-selection');
      st.men.delete(id);
      if (st.stopped) st.stopped.delete(id);
    }
  };
  if (!ON) return;
  var TC = root.BattleTacticalController,
    OA = root.BattleTacticalOwnerAdapters;
  if (!TC || !OA) throw new Error('The march provider needs the tactical controller and its owner adapters');
  var reg = TC.registerProvider({
    id: ID,
    policies: {
      squadCommand: squadCommand,
      commanderTick: noop,
      fireAndMovement: function (ctx) {
        root.BattleTacticalContactSkills.update(ctx);
        if (root.BattleTacticalCoveredManeuver) root.BattleTacticalCoveredManeuver.update(ctx);
      },
      executeMission: executeMission,
      engagement: function (ctx) {
        if (root.BattleTacticalCoveredManeuver && root.BattleTacticalCoveredManeuver.engagement(ctx)) return;
        root.BattleTacticalContactSkills.engagement(ctx);
      },
      stationSelection: function (ctx) {
        if (root.BattleTacticalStationSkill) root.BattleTacticalStationSkill.update(ctx);
      }
    },
    adapters: OA.adapters,
    lifecycle: OA.lifecycle
  });
  if (!reg.ok) throw new Error('March provider rejected: ' + reg.reason);
  if (root.BattleModules)
    root.BattleModules.registerSystem('tactical-march-provider', {
      version: '2-march-contact',
      onBattleStart: takeAll,
      onCommanderTick: takeAll
    });
  if (root.GTLog)
    root.GTLog('[TACTICAL] foundational provider on (?tacticalController=new): march and contact skills');
})(typeof window !== 'undefined' ? window : globalThis);
