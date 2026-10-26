/* Exclusive-controller station-selection skill. Module 20 remains the sole
   owner of windows, ingress, reservations and release; this skill only decides
   which eligible man asks for which canonical station via a typed request. */
(function (root) {
  'use strict';
  var states = new WeakMap();
  function state(ctx) {
    var t = ctx.token,
      key = [t.battleId, t.generation, t.controllerEpoch, t.missionVersion, t.rosterRevision].join(':'),
      s = states.get(ctx.squad);
    if (!s || s.key !== key) {
      s = { key: key, claims: new Map(), blocked: null, reason: null, issued: 0, refused: 0 };
      states.set(ctx.squad, s);
    }
    return s;
  }
  function signature(ctx, members, threat, owner) {
    return JSON.stringify([
      ctx.squad.commandPhase,
      root.BattleNavigation && root.BattleNavigation.version,
      owner.revision(ctx.sim),
      threat && [Math.round(threat.x / 4), Math.round(threat.z / 4)],
      members.map(function (s) {
        var p = s.root && s.root.position;
        return [s.id, p ? Math.round(p.x) : null, p ? Math.round(p.z) : null, !!owner.current(s)];
      })
    ]);
  }
  function update(ctx) {
    var P = root.BattleTacticalPositions,
      R = root.BattleTacticalRoute,
      M = root.BattleTacticalMarchProvider,
      E = root.BattleTacticalContactSkills,
      A = root.SquadAI,
      B = root.BattleTacticalCoveredManeuver,
      st = state(ctx);
    if (!P || !P.canAssign || !P.candidates || !R || !R.knownThreat) {
      st.reason = 'station-owner-or-threat-unavailable';
      return;
    }
    st.claims.forEach(function (actionId, actor) {
      var stage = ctx.stage(actionId);
      if (!stage || stage.stage === 'cancelled') st.claims.delete(actor);
    });
    var members = (ctx.squad.members || []).filter(function (s) {
      return s && !s.dead && !s.isPlayer;
    });
    var occupied = members.filter(function (s) { return !!P.current(s); }).length;
    if (occupied >= 3) {
      st.reason = 'station-cap';
      return;
    }
    members.sort(function (a, b) {
      return (A.isMachineGun(a) ? 0 : 1) - (A.isMachineGun(b) ? 0 : 1) ||
        String(a.id).localeCompare(String(b.id));
    });
    for (var i = 0; i < members.length; i++) {
      var man = members[i], id = String(man.id);
      if (!P.canAssign(man) || P.current(man) || st.claims.has(id) ||
          (B && B.wants(man, ctx.sim))) continue;
      var threat = R.knownThreat(man, ctx.sim);
      if (!threat) continue;
      var basis = signature(ctx, members, threat, P);
      if (st.blocked === basis) {
        st.reason = 'unchanged-no-station-or-owner-refusal';
        return;
      }
      var posts = P.candidates(man, ctx.sim, threat, false).slice(0, 2);
      if (!posts.length) {
        st.blocked = basis;
        st.reason = 'no-lawful-available-station';
        return;
      }
      if (M && M.releaseMan) M.releaseMan(ctx, man);
      if (E && E.release) E.release(ctx, man);
      for (var j = 0; j < posts.length; j++) {
        var response = ctx.request('station.claim', id, {
          stationId: String(posts[j].id), threat: { x: +threat.x, z: +threat.z }
        });
        if (response && response.ok) {
          st.claims.set(id, response.actionId);
          st.issued++;
          st.reason = 'station-request-accepted';
          st.blocked = null;
          return; // At most one assignment per squad per commander tick.
        }
        st.refused++;
        st.reason = 'station-owner-refused:' + (response && response.reason || 'unknown');
      }
      st.blocked = basis;
      return;
    }
    st.reason = 'no-free-eligible-manned-threat';
  }
  root.BattleTacticalStationSkill = {
    update: update,
    summary: function (sq) {
      var s = states.get(sq);
      return s && {
        reason: s.reason, issued: s.issued, refused: s.refused,
        liveActionIds: Array.from(s.claims.values())
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
