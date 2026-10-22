/* Why do reactive fireteam bounds so rarely happen (`?reactiveFireManeuver=1`, PR #630)? For every squad in
   contact, every step, the probe replays the Squad Leader's bound path (15j `fireAndMovement`) in its order
   and books the squad-seconds to the first check that would stop a bound:
     retreat, leaderless (no living leader), fire control HOLD/PRECISION (15j returns before the reactive
     code), an active firing-position step, a non-assault phase, no local task, `canTask` (its own reason:
     credible-contact, cohesion, pressure, support-capability, ...), a task that is not `maneuver`, the
     bound-cycle pause (with its reason), a live bound, fewer than two effective men, everyone pinned,
     and finally team selection. Lease conflicts, COA and the AI-skills pilot (all off by default) are not
     replayed.
   Behind the two biggest gates it also books, for assault-phase squads in contact:
     - the supporter count the gate itself reads (`_localTask.inputs.supporting`);
     - each living man's support status in member-seconds: the first reason in `supportReady`'s order that
       keeps him out of the base of fire, else whether he fired in the last 4.5 s (`shotReceipt`). The
       last part of `supportReady` (aim cone, sight and the trigger-time LOS gate) is not replayed: that
       gate's cache keeps per-soldier hit/miss counters which the end-state fingerprint includes, so
       calling it would make PROBE_CONTROL report a different battle;
     - each man's Engagement state, and why `defensiveReadiness` holds him (the squad-not-settled gate);
     - fire-control state, `inputs.dispersed` and the squad's spread (furthest living man from the centre).
   Squad contact (`sq.inContact`, Engagement's own definition) is followed as episodes and gaps: how long
   each lasts, and for each gap after a first contact (by its length, and whether contact resumed) the
   share of it in which the squad still held an unexpired told/seen report and in which a living enemy
   really was within 20 m of one (hidden truth, probe only).
   Fire-control episodes (HOLD, PRECISION, OPEN, REPOSITION) are followed per squad: how long each lasts and
   what ends it (the next state and its reason, a HOLD restarted on a different enemy, or the order cleared
   when contact broke).
   The Squad Leader's own refusals arrive on the telemetry sink, which the probe runner has already
   silenced; the probe wraps that no-op to count `decision-bound-held` reasons and firing-position
   decisions, and counts reactive bound leases as they are granted. Otherwise observe only: reads state,
   draws no RNG, writes no battle state (check with PROBE_CONTROL=1). */
(function (root) {
  var ASSAULT = { assault: 1, capture: 1, 'clear-town': 1 },
    SPREAD_BANDS = [10, 20, 34, 50, 80];
  var out,
    lastT,
    leases,
    episodes,
    contacts,
    CONTACT_BANDS = [2, 5, 10, 20, 40, 80, 160],
    EPISODE_BANDS = [2, 4, 6, 10, 20, 40, 80];
  function add(map, key, v) {
    map[key] = (map[key] || 0) + v;
  }
  function round(map) {
    Object.keys(map).forEach(function (k) {
      if (typeof map[k] === 'number') map[k] = +map[k].toFixed(1);
      else if (map[k] && typeof map[k] === 'object') round(map[k]);
    });
    return map;
  }
  function sorted(map) {
    var o = {};
    Object.keys(map)
      .sort(function (a, b) {
        return map[b] - map[a];
      })
      .forEach(function (k) {
        o[k] = +map[k].toFixed(1);
      });
    return o;
  }
  function living(sq) {
    return (sq.members || []).filter(function (s) {
      return s && !s.dead && !(s.hp <= 0) && s.root;
    });
  }
  /* The first check on the Squad Leader's bound path that would stop a bound this tick. */
  function blocker(sq, sim) {
    var A = root.SquadAI,
      P = root.BattleReactiveFireManeuver,
      L = root.BattleLeases,
      t = sim.time;
    if (sq.state === 'retreat') return 'retreat';
    var leader = A.leaderOf ? A.leaderOf(sq) : null;
    if (!leader || leader.dead) return 'leaderless';
    var fc = sq.fireControl && sq.fireControl.state;
    if (fc === 'hold' || fc === 'precision') return 'fire-control:' + fc;
    var b = L.get(sq, 'bound');
    if (b && b.data && b.data.firingPosition && L.holds(sq, 'bound', t)) return 'firing-position-step';
    if (!ASSAULT[sq.commandPhase || '']) return 'phase:' + (sq.commandPhase || 'none');
    var task = sq._localTask;
    if (!task || !task.inputs) return 'no-local-task';
    if (!P.canTask(sq, task.inputs)) return 'canTask:' + P.taskReason(sq, task.inputs);
    if (!task.boundsAllowed) return 'task:' + task.kind;
    if (L.holds(sq, 'bound-cycle', t))
      return 'bound-cycle:' + ((L.get(sq, 'bound-cycle') || {}).reason || '?');
    if (L.holds(sq, 'bound', t)) return 'bound-active';
    if (!(sq.effectiveCount >= 2)) return 'effective-under-2';
    if (sq.pinnedCount >= sq.effectiveCount) return 'all-pinned';
    return 'team-selection';
  }
  /* Why a man is not part of the base of fire, in `supportReady`'s order (engagement.js), up to the aim
     and sight checks; past them, whether he has fired in the last 4.5 s. */
  function supportStatus(s, sim) {
    var E = root.BattleEngagement,
      A = root.SquadAI,
      e = s.eng;
    if (!e) return 'no-engagement';
    if (s.incapacitated) return 'incapacitated';
    if (s.isPlayer) return 'player';
    if (!s.weapon || s.outOfAmmo || s.reloading || s.clearingStoppage || (s.weapon && s.weapon.jammed))
      return 'weapon-busy';
    if (s.moving || s.crawling) return 'moving';
    if (s.suppressedUntil > sim.time) return 'suppressed';
    if (E.reacting && E.reacting(s)) return 'reacting';
    if (e.fledPhase) return 'fled';
    if (sim.time < e.fireReadyAt) return 'fire-ready-delay';
    if (E.contactCoverFirstActive && E.contactCoverFirstActive(s)) return 'cover-first-move';
    if (E.firingPositionActive && E.firingPositionActive(s)) return 'firing-position-move';
    if (E.fireAuthorized && !E.fireAuthorized(s, sim)) return 'fire-not-authorized';
    if (!(e.state === 'engage' || e.state === 'station' || e.suppressOrder)) return 'state:' + e.state;
    if (A.isMachineGun(s) && !s.setUp) return 'mg-not-set-up';
    return A.shotReceipt && A.shotReceipt(s, sim) ? 'in-position-firing' : 'in-position-silent';
  }
  function spreadOf(men) {
    if (!men.length) return 0;
    var cx = 0,
      cz = 0;
    men.forEach(function (s) {
      cx += s.root.position.x;
      cz += s.root.position.z;
    });
    cx /= men.length;
    cz /= men.length;
    var far = 0;
    men.forEach(function (s) {
      far = Math.max(far, Math.hypot(s.root.position.x - cx, s.root.position.z - cz));
    });
    return far;
  }
  function band(bands, v) {
    for (var i = 0; i < bands.length; i++) if (v < bands[i]) return (i ? bands[i - 1] : 0) + '-' + bands[i];
    return bands[bands.length - 1] + '+';
  }
  /* Close the squad's current fire-control episode when the order changes state or is replaced. */
  function trackFireControl(sq, sim) {
    var fc = sq.fireControl || null,
      state = fc ? fc.state : 'none',
      target = fc && fc.targetId != null ? String(fc.targetId) : null,
      rec = episodes.get(sq);
    if (!rec) {
      episodes.set(sq, { fc: fc, state: state, target: target, since: sim.time });
      return;
    }
    var restarted = state === 'hold' && rec.state === 'hold' && fc !== rec.fc;
    if (state === rec.state && !restarted) {
      rec.fc = fc;
      rec.target = target;
      return;
    }
    if (rec.state !== 'none') {
      var ep =
          out.fireControlEpisodes[rec.state] ||
          (out.fireControlEpisodes[rec.state] = { n: 0, seconds: 0, duration: {}, endedBy: {} }),
        dur = sim.time - rec.since,
        end = !fc
          ? 'cleared'
          : restarted
            ? 'hold-restarted' + (target !== rec.target ? ' (new enemy)' : '')
            : state + (fc.reason ? ': ' + fc.reason : '');
      ep.n++;
      ep.seconds += dur;
      add(ep.duration, band(EPISODE_BANDS, dur), 1);
      add(ep.endedBy, end, 1);
    }
    episodes.set(sq, { fc: fc, state: state, target: target, since: sim.time });
  }
  /* Contact episodes and the gaps between them; during a gap, what the squad still believes. */
  function trackContact(sq, sim, dt) {
    var on = !!sq.inContact,
      rec = contacts.get(sq);
    if (!rec) {
      contacts.set(sq, { on: on, since: sim.time, had: on, believed: 0, true20: 0 });
      return;
    }
    if (on !== rec.on) {
      bookContact(rec, sim.time - rec.since, on ? 'contact' : null);
      contacts.set(sq, (rec = { on: on, since: sim.time, had: rec.had || on, believed: 0, true20: 0 }));
      return;
    }
    if (on || !rec.had || !dt) return;
    var rows = (root.SquadAI.squadContactsMap && root.SquadAI.squadContactsMap(sq, sim)) || [],
      believed = rows.filter(function (c) {
        return c && c.source !== 'heard' && Number.isFinite(c.x) && Number.isFinite(c.z);
      });
    if (!believed.length) return;
    rec.believed += dt;
    var side = sq.faction || (sq.members[0] && sq.members[0].faction),
      roster = (sim._roster && sim._roster[side === 'us' ? 'ge' : 'us']) || [];
    if (
      believed.some(function (c) {
        return roster.some(function (e) {
          return e && !e.dead && e.root && Math.hypot(e.root.position.x - c.x, e.root.position.z - c.z) <= 20;
        });
      })
    )
      rec.true20 += dt;
  }
  /* Book a finished contact episode, or a gap with what the squad believed during it, by its length;
     `endedBy` says whether the gap ended in a new contact or was still open (squad lost, battle over). */
  function bookContact(rec, dur, endedBy) {
    if (!(dur > 0)) return;
    if (rec.on) {
      out.contactEpisodes.n++;
      out.contactEpisodes.seconds += dur;
      add(out.contactEpisodes.duration, band(CONTACT_BANDS, dur), 1);
      return;
    }
    if (!rec.had) return;
    var key = band(CONTACT_BANDS, dur) + (endedBy === 'contact' ? '' : ' (never resumed)'),
      g = out.contactGaps[key] || (out.contactGaps[key] = { n: 0, seconds: 0, believed: 0, true20: 0 });
    g.n++;
    g.seconds += dur;
    g.believed += rec.believed || 0;
    g.true20 += rec.true20 || 0;
  }
  /* Book what is still open for a squad (its last man died, or the battle ended) and forget it. */
  function closeSquad(sq, sim) {
    var rec = contacts.get(sq);
    if (rec) {
      bookContact(rec, sim.time - rec.since, null);
      contacts.delete(sq);
    }
    var fc = episodes.get(sq);
    if (fc && fc.state !== 'none') {
      var ep =
          out.fireControlEpisodes[fc.state] ||
          (out.fireControlEpisodes[fc.state] = { n: 0, seconds: 0, duration: {}, endedBy: {} }),
        d = sim.time - fc.since;
      ep.n++;
      ep.seconds += d;
      add(ep.duration, band(EPISODE_BANDS, d), 1);
      add(
        ep.endedBy,
        sq.members.some(function (s) {
          return s && !s.dead;
        })
          ? 'battle-end'
          : 'squad-destroyed',
        1
      );
    }
    episodes.delete(sq);
  }
  (root.BattleProbes = root.BattleProbes || {})['reactive-gates'] = {
    every: 0,
    start: function () {
      lastT = null;
      leases = new WeakSet();
      out = {
        squadSeconds: 0,
        contactSeconds: 0,
        assaultContactSeconds: 0,
        firstBlocker: {},
        firstBlockerAssault: {},
        fireControl: {},
        dispersedSeconds: 0,
        spread: {},
        supportersCount: {},
        memberSupport: {},
        memberState: {},
        settled: { readySeconds: 0, notReadySeconds: 0, pendingReasons: {}, positioningStates: {} },
        telemetry: { boundHeld: {}, firingPositionDecisions: 0, firingPositionOutcomes: {}, contacts: 0 },
        boundLeases: 0,
        firingPositionLeases: 0,
        fireControlEpisodes: {},
        contactEpisodes: { n: 0, seconds: 0, duration: {} },
        contactGaps: {}
      };
      episodes = new Map();
      contacts = new Map();
      var tel = root.BattleTelemetry;
      if (tel && typeof tel.record === 'function' && !tel.record.__reactiveGates) {
        var inner = tel.record,
          tap = function (type, data) {
            if (out) {
              if (type === 'decision-bound-held')
                add(out.telemetry.boundHeld, (data && data.reason) || '?', 1);
              else if (type === 'decision-firing-position') out.telemetry.firingPositionDecisions++;
              else if (type === 'decision-contact') out.telemetry.contacts++;
              else if (/^firing-position-/.test(type))
                add(out.telemetry.firingPositionOutcomes, type.slice(16), 1);
            }
            return inner.apply(this, arguments);
          };
        tap.__reactiveGates = true;
        tel.record = tap;
      }
    },
    sample: function (sim) {
      var dt = lastT == null ? 0 : Math.max(0, sim.time - lastT);
      lastT = sim.time;
      var P = root.BattleReactiveFireManeuver,
        L = root.BattleLeases,
        reactive = !!(P && P.on && L);
      ['us', 'ge'].forEach(function (side) {
        ((sim.factions[side] && sim.factions[side].squads) || []).forEach(function (sq) {
          var men = living(sq);
          if (!men.length) {
            closeSquad(sq, sim);
            return;
          }
          // Contact and fire control are followed on every build; the bound path only with the reactive set.
          trackFireControl(sq, sim);
          trackContact(sq, sim, dt);
          if (!reactive) return;
          var lease = L.get(sq, 'bound');
          if (lease && lease.data && lease.data.reactiveFireManeuver && !leases.has(lease)) {
            leases.add(lease);
            if (lease.data.firingPosition) out.firingPositionLeases++;
            else out.boundLeases++;
          }
          if (!dt) return;
          out.squadSeconds += dt;
          if (!sq.inContact) return;
          out.contactSeconds += dt;
          var why = blocker(sq, sim);
          add(out.firstBlocker, why, dt);
          if (!ASSAULT[sq.commandPhase || ''] || sq.state === 'retreat') return;
          out.assaultContactSeconds += dt;
          add(out.firstBlockerAssault, why, dt);
          add(out.fireControl, (sq.fireControl && sq.fireControl.state) || 'none', dt);
          var inputs = sq._localTask && sq._localTask.inputs;
          if (inputs && inputs.dispersed) out.dispersedSeconds += dt;
          add(out.spread, band(SPREAD_BANDS, spreadOf(men)), dt);
          var n = inputs && Number.isFinite(inputs.supporting) ? inputs.supporting : null;
          add(out.supportersCount, n == null ? 'unknown' : String(Math.min(n, 3)) + (n >= 3 ? '+' : ''), dt);
          men.forEach(function (s) {
            add(out.memberSupport, supportStatus(s, sim), dt);
            add(out.memberState, (s.eng && s.eng.state) || 'none', dt);
          });
          var ready = P.defensiveReadiness(sim, sq);
          if (ready.ready) out.settled.readySeconds += dt;
          else {
            out.settled.notReadySeconds += dt;
            ready.pending.forEach(function (p) {
              add(out.settled.pendingReasons, p.reason, dt);
              if (p.reason === 'positioning') {
                var man = men.filter(function (s) {
                  return s.id === p.id;
                })[0];
                add(out.settled.positioningStates, (man && man.eng && man.eng.state) || 'none', dt);
              }
            });
          }
        });
      });
    },
    report: function (sim) {
      // Close what is still open when the battle ends, so shares are of whole episodes and gaps.
      var open = [];
      contacts.forEach(function (rec, sq) {
        open.push(sq);
      });
      episodes.forEach(function (rec, sq) {
        if (open.indexOf(sq) < 0) open.push(sq);
      });
      open.forEach(function (sq) {
        closeSquad(sq, sim);
      });
      var r = {
        squadSeconds: +out.squadSeconds.toFixed(1),
        contactSeconds: +out.contactSeconds.toFixed(1),
        assaultContactSeconds: +out.assaultContactSeconds.toFixed(1),
        boundLeases: out.boundLeases,
        firingPositionLeases: out.firingPositionLeases,
        firstBlocker: sorted(out.firstBlocker),
        firstBlockerAssault: sorted(out.firstBlockerAssault),
        fireControl: sorted(out.fireControl),
        dispersedSeconds: +out.dispersedSeconds.toFixed(1),
        spread: round(out.spread),
        supportersCount: round(out.supportersCount),
        memberSupport: sorted(out.memberSupport),
        memberState: sorted(out.memberState),
        settled: {
          readySeconds: +out.settled.readySeconds.toFixed(1),
          notReadySeconds: +out.settled.notReadySeconds.toFixed(1),
          pendingReasons: sorted(out.settled.pendingReasons),
          positioningStates: sorted(out.settled.positioningStates)
        },
        telemetry: out.telemetry,
        fireControlEpisodes: {},
        contactEpisodes: {
          n: out.contactEpisodes.n,
          meanSeconds: out.contactEpisodes.n
            ? +(out.contactEpisodes.seconds / out.contactEpisodes.n).toFixed(1)
            : 0,
          duration: out.contactEpisodes.duration
        },
        contactGaps: {}
      };
      Object.keys(out.contactGaps)
        .sort()
        .forEach(function (k) {
          var g = out.contactGaps[k];
          r.contactGaps[k] = {
            n: g.n,
            seconds: +g.seconds.toFixed(1),
            reportHeld: g.seconds ? +(g.believed / g.seconds).toFixed(3) : null,
            enemyWithin20OfReport: g.seconds ? +(g.true20 / g.seconds).toFixed(3) : null
          };
        });
      Object.keys(out.fireControlEpisodes).forEach(function (k) {
        var ep = out.fireControlEpisodes[k];
        r.fireControlEpisodes[k] = {
          n: ep.n,
          meanSeconds: ep.n ? +(ep.seconds / ep.n).toFixed(1) : 0,
          duration: ep.duration,
          endedBy: ep.endedBy
        };
      });
      var P = root.BattleReactiveFireManeuver;
      r.flags = { reactive: !!(P && P.on), query: root.location.search };
      return r;
    }
  };
})(window);
