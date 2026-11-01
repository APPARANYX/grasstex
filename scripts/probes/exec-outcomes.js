/* What becomes of the movement orders the Squad Leader gives (BattleExecutionOutcome, read only).
   Per man-second: the outcome state of his current personal order. Per episode: every run of
   `blocked`, every run of `held` longer than 30 s, every run of `pending`/`adopted` longer than 10 s,
   and every `executing` run in which he stood still (>= 8 m from the point, < 1.5 m moved in 12 s),
   the successful-looking order that goes nowhere. Each episode carries the mission it belonged to,
   the resolver kind that owned the man, the squad's phase and, for a stand-still, the stop reason.
   Observe only: never writes sim state or draws from the battle's random. */
(function (root) {
  var c, run, trail, gate;
  function bump(o, k, n) {
    o[k] = (o[k] || 0) + (n || 1);
  }
  function squadKey(s) {
    return s.squad ? s.squad.faction + ':' + s.squad.id : '?';
  }
  function mission(s) {
    var m = s.squad && s.squad._macroMission;
    return m ? m.intent + '/' + m.action + ' v' + m.version : 'none';
  }
  function close(sim, id, r) {
    var span = r.last - r.since;
    var limit = r.state === 'blocked' ? 0 : r.state === 'held' ? 30 : r.state === 'executing' ? 12 : 10;
    if (span < limit) return;
    c.episodes[r.state] = c.episodes[r.state] || [];
    c.counts[r.state + 'Episodes'] = (c.counts[r.state + 'Episodes'] || 0) + 1;
    if (c.episodes[r.state].length < 60)
      c.episodes[r.state].push({
        man: id,
        squad: r.squad,
        since: +r.since.toFixed(1),
        seconds: +span.toFixed(1),
        mission: r.mission,
        phase: r.phase,
        by: r.by,
        kind: r.kind,
        why: r.why,
        terminal: r.terminal,
        stop: r.stop,
        diag: r.diag
      });
  }
  (root.BattleProbes = root.BattleProbes || {})['exec-outcomes'] = {
    every: 1,
    start: function () {
      c = { counts: {}, manSeconds: {}, heldBy: {}, pendingWhy: {}, episodes: {}, squads: {} };
      run = new Map();
      trail = new Map();
      gate = new Map();
    },
    sample: function (sim) {
      var O = root.BattleExecutionOutcome;
      if (!O) return;
      var men = root.BattleModules.unitsFor(sim),
        now = sim.time;
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!s || s.dead || !s.squad) continue;
        var o = O.man(s, sim),
          id = String(s.id);
        bump(c.manSeconds, o.state);
        if (o.state === 'held') bump(c.heldBy, o.by);
        if (o.state === 'pending') bump(c.pendingWhy, o.why || '?');
        var tr = trail.get(id) || [];
        tr.push({ t: now, x: s.root.position.x, z: s.root.position.z });
        while (tr.length && now - tr[0].t > 12) tr.shift();
        trail.set(id, tr);
        var still =
          o.state === 'executing' &&
          o.distance > 8 &&
          tr.length > 2 &&
          now - tr[0].t >= 11.5 &&
          Math.hypot(tr[tr.length - 1].x - tr[0].x, tr[tr.length - 1].z - tr[0].z) < 1.5;
        var state = still ? 'executing' : o.state === 'executing' ? 'moving' : o.state;
        var r = run.get(id);
        if (r && (r.state !== state || r.mission !== mission(s) || r.envelopeId !== o.envelopeId)) {
          close(sim, id, r);
          r = null;
        }
        if (!r) {
          r = {
            state: state,
            since: now,
            last: now,
            squad: squadKey(s),
            mission: mission(s),
            envelopeId: o.envelopeId,
            phase: s.squad.commandPhase || null,
            by: o.by,
            kind: o.kind,
            why: o.why,
            terminal: o.terminal,
            stop: null
          };
          run.set(id, r);
        }
        r.last = now;
        if (o.state === 'adopted' || o.state === 'pending') {
          var P = root.BattleTacticalPositions;
          r.diag = {
            survival: s._survivalMovementKey || null,
            post: !!(P && P.current && P.current(s)),
            eng: s.eng && s.eng.state,
            team: s._fireteamKey || null,
            role: s.role,
            applied: s._fireteamAdoptedEnvelope || null,
            envelope: o.envelopeId,
            pub: s._fireteamPublishKey || null,
            squadState: s.squad.state,
            sqPhase: s.squad.commandPhase,
            player: !!s.isPlayer,
            leaderAlive: !!(root.SquadAI && root.SquadAI.leaderOf && root.SquadAI.leaderOf(s.squad)),
            living: s.squad.members.filter(function (m) {
              return m && !m.dead;
            }).length
          };
        }
        r.terminal = r.terminal || o.terminal;
        if (still) r.stop = s._movementStopReason || null;
      }
      /* The Squad Leader's stride gate (module 16 orderCanAdvance, not exported, replayed here from the
         same records: the latest issued order must be the one the man applied, he must be within 8 m of
         his order destination, and 55% of the commanded men must have arrived). */
      var CR = root.BattleCommandReception,
        E = root.BattleEngagement;
      if (!CR) return;
      function gateOpen(sq, live) {
        var men = live.filter(function (m) {
            return !(E && E.fledPhase && E.fledPhase(m));
          }),
          arrived = 0;
        if (!men.length) return true;
        men.forEach(function (m) {
          if (
            m._survivalMovementKey ||
            CR.executionCurrent(m, sim, 'movement', 'soldier:' + m.id, m._fireteamAdoptedEnvelope)
          ) {
            if (
              m.orderDestination &&
              Math.hypot(
                m.root.position.x - m.orderDestination.x,
                m.root.position.z - m.orderDestination.z
              ) <= 8
            )
              arrived++;
          }
        });
        return arrived / men.length >= 0.55;
      }
      ['us', 'ge'].forEach(function (f) {
        (sim.factions[f].squads || []).forEach(function (sq) {
          var key = f + ':' + sq.id,
            live = (sq.members || []).filter(function (m) {
              return m && !m.dead;
            }),
            may = live.length > 2 && !sq.inContact && sq.state === 'advance';
          if (may) c.counts.mayAdvanceSquadSeconds = (c.counts.mayAdvanceSquadSeconds || 0) + 1;
          var g = gate.get(key);
          var open = may && !gateOpen(sq, live);
          if (!open) {
            if (g) {
              if (g.last - g.since >= 20) {
                c.episodes.gate = c.episodes.gate || [];
                c.counts.gateEpisodes = (c.counts.gateEpisodes || 0) + 1;
                if (c.episodes.gate.length < 60) c.episodes.gate.push(g);
              }
              gate.delete(key);
            }
            return;
          }
          c.counts.gateSquadSeconds = (c.counts.gateSquadSeconds || 0) + 1;
          if (!g) {
            g = gate
              .set(key, {
                squad: key,
                since: now,
                last: now,
                phase: sq.commandPhase,
                mission: '',
                living: live.length,
                states: {}
              })
              .get(key);
            g.mission = live[0] ? mission(live[0]) : '';
          }
          g.last = now;
          live.forEach(function (m) {
            var o = O.man(m, sim),
              arrived =
                m.orderDestination &&
                Math.hypot(
                  m.root.position.x - m.orderDestination.x,
                  m.root.position.z - m.orderDestination.z
                ) <= 8;
            if (arrived) return;
            var k = o.state + (o.by ? ':' + o.by : '') + (o.why ? ':' + o.why : '');
            g.states[k] = (g.states[k] || 0) + 1;
          });
          g.living = live.length;
        });
      });
    },
    report: function (sim) {
      run.forEach(function (r, id) {
        close(sim, id, r);
      });
      var total = 0;
      Object.keys(c.manSeconds).forEach(function (k) {
        total += c.manSeconds[k];
      });
      c.total = total;
      return c;
    }
  };
})(window);
