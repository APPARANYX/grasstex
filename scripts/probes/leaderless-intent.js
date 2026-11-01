/* Leaderless intent continuation on real battles. Observe only.
   Verifies that a live succession episode preserves the inherited Meso command state while already-issued
   movement and ordinary Micro combat/survival remain free to execute. Retreat is deliberately excluded from
   freeze invariants because survival retreat keeps its existing owner. */
(function (root) {
  var st, originalRecord;
  function key(sq) { return sq.faction + ':' + sq.id; }
  function inc(map, k) { map[k] = (map[k] || 0) + 1; }
  function point(p) {
    return p && isFinite(+p.x) && isFinite(+p.z) ? { x: +p.x, z: +p.z } : null;
  }
  function distance(a, b) {
    a = point(a); b = point(b);
    return a && b ? Math.hypot(a.x - b.x, a.z - b.z) : 0;
  }
  function median(a) {
    var b = a.slice().sort(function (x, y) { return x - y; });
    return b.length ? +b[b.length >> 1].toFixed(3) : 0;
  }
  function memberIntent(intent, id) {
    var a = (intent && intent.members) || [];
    for (var i = 0; i < a.length; i++) if (String(a[i].id) === String(id)) return a[i];
    return null;
  }
  function forbiddenNewLease(sq, intent) {
    var live = (sq && sq._leases && sq._leases.live) || {},
      forbidden = { regroup:1, 'tactical-plan':1, bound:1, recon:1, 'corner-hold':1, 'bound-cycle':1 };
    return Object.keys(live).some(function (kind) {
      var l = live[kind];
      return forbidden[kind] && l && +l.since > +intent.startedAt + 1e-6;
    });
  }
  (root.BattleProbes = root.BattleProbes || {})['leaderless-intent'] = {
    every: 0.5,
    start: function () {
      st = {
        inherits: 0,
        handbacks: 0,
        helpRequests: 0,
        localActions: {},
        activeSquadSamples: 0,
        retreatSamples: 0,
        contactSamples: 0,
        inheritedBoundSamples: 0,
        anchorDrift: [],
        objectiveDrift: [],
        fireteamDrift: [],
        routeIndexViolations: 0,
        phaseViolations: 0,
        orderVersionViolations: 0,
        objectiveViolations: 0,
        anchorViolations: 0,
        fireteamDestinationViolations: 0,
        newMesoLeaseViolations: 0,
        episodeKeys: {},
        handbackKeys: {}
      };
      var T = root.BattleTelemetry;
      if (T && T.record && !originalRecord) {
        originalRecord = T.record;
        T.record = function (type, data) {
          if (type === 'decision-leaderless-inherit' && data) {
            st.inherits++;
            st.episodeKeys[String(data.faction) + ':' + String(data.squad) + '|' + String(data.missionVersion) + '|' + String(data.routeIndex)] = 1;
          } else if (type === 'decision-leaderless-local' && data) {
            inc(st.localActions, data.action || 'unknown');
          } else if (type === 'decision-leaderless-handback' && data) {
            st.handbacks++;
            st.handbackKeys[String(data.faction) + ':' + String(data.squad) + '|' + String(data.at || '')] = 1;
          } else if (type === 'decision-captain-request' && data && data.reason === 'leaderless-help') {
            st.helpRequests++;
          }
          return originalRecord.apply(this, arguments);
        };
      }
    },
    sample: function (sim) {
      ['us', 'ge'].forEach(function (side) {
        var squads = (sim.factions && sim.factions[side] && sim.factions[side].squads) || [];
        for (var i = 0; i < squads.length; i++) {
          var sq = squads[i],
            intent = sq && sq._leaderlessIntent,
            lease = root.BattleLeases && root.BattleLeases.get(sq, 'succession');
          if (!intent || !lease) continue;
          st.activeSquadSamples++;
          if (sq.inContact) st.contactSamples++;
          if (root.BattleLeases.holds(sq, 'bound', sim.time)) st.inheritedBoundSamples++;
          if (sq.state === 'retreat') {
            st.retreatSamples++;
            continue;
          }

          var ad = distance(sq.orderAnchor || sq.rally, intent.anchor),
            od = distance(sq.objective, intent.objective);
          st.anchorDrift.push(ad);
          st.objectiveDrift.push(od);
          if (ad > 0.05) st.anchorViolations++;
          if (od > 0.05) st.objectiveViolations++;
          if ((+sq.routeIndex || 0) !== (+intent.routeIndex || 0)) st.routeIndexViolations++;
          if (String(sq.commandPhase || '') !== String(intent.phase || '')) st.phaseViolations++;
          if ((+sq._orderVersion || 0) !== (+intent.orderVersion || 0)) st.orderVersionViolations++;
          if (forbiddenNewLease(sq, intent)) st.newMesoLeaseViolations++;

          var members = sq.members || [];
          for (var j = 0; j < members.length; j++) {
            var man = members[j];
            if (!man || man.dead) continue;
            var inherited = memberIntent(intent, man.id);
            if (!inherited || !inherited.destination) continue;
            var current = point(man._fireteamDestination),
              fd = current ? distance(current, inherited.destination) : 0;
            st.fireteamDrift.push(fd);
            if (!current || fd > 0.05) st.fireteamDestinationViolations++;
          }
        }
      });
    },
    report: function (sim) {
      var runtime = root.BattleSquadStability && root.BattleSquadStability.leaderlessTelemetry
        ? root.BattleSquadStability.leaderlessTelemetry(sim)
        : null;
      return {
        runtime: runtime,
        inheritEvents: st.inherits,
        handbackEvents: st.handbacks,
        helpRequestEvents: st.helpRequests,
        localActions: st.localActions,
        uniqueObservedEpisodes: Object.keys(st.episodeKeys).length,
        activeSquadSamples: st.activeSquadSamples,
        retreatSamples: st.retreatSamples,
        contactSamples: st.contactSamples,
        inheritedBoundSamples: st.inheritedBoundSamples,
        anchorDriftMedian: median(st.anchorDrift),
        anchorDriftMax: st.anchorDrift.length ? +Math.max.apply(null, st.anchorDrift).toFixed(3) : 0,
        objectiveDriftMedian: median(st.objectiveDrift),
        objectiveDriftMax: st.objectiveDrift.length ? +Math.max.apply(null, st.objectiveDrift).toFixed(3) : 0,
        fireteamDriftMedian: median(st.fireteamDrift),
        fireteamDriftMax: st.fireteamDrift.length ? +Math.max.apply(null, st.fireteamDrift).toFixed(3) : 0,
        routeIndexViolations: st.routeIndexViolations,
        phaseViolations: st.phaseViolations,
        orderVersionViolations: st.orderVersionViolations,
        objectiveViolations: st.objectiveViolations,
        anchorViolations: st.anchorViolations,
        fireteamDestinationViolations: st.fireteamDestinationViolations,
        newMesoLeaseViolations: st.newMesoLeaseViolations
      };
    }
  };
})(window);
