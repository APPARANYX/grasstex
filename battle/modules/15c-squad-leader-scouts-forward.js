/* Squad Leader scouts-forward (recon) sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   The parent file calls the factory with its closure utilities and re-attaches the returned
   functions as closure variables, so all callers (fire-and-movement selector, diagnostics,
   probes, the public API export) see the same functions as before. parseScoutsForward and the
   SCOUTS_FORWARD_ON / RECON_TUNING / RECON_PHASES declarations stay in 16 (parsed at load time
   from location.search) and are passed into the factory via ctx. */
(function (root) {
  'use strict';
  if (root._squadLeaderScoutsForward) return;

  /* Factory: called by 16-squad-plan-stability.js after its shared utilities are defined.
     ctx provides the closure utilities the recon functions need. */
  root._squadLeaderScoutsForward = function (ctx) {
    var root = ctx.root,
      telemetry = ctx.telemetry,
      dist = ctx.dist,
      point = ctx.point,
      copy = ctx.copy,
      commanded = ctx.commanded,
      average = ctx.average,
      leaderAlive = ctx.leaderAlive,
      L = ctx.root.BattleLeases,
      teamKeyFor = ctx.teamKeyFor,
      publishPersonalMovement = ctx.publishPersonalMovement,
      movementExecutionCurrent = ctx.movementExecutionCurrent,
      publishStats = ctx.publishStats,
      ORDER_PUBLISH_EPS = ctx.ORDER_PUBLISH_EPS,
      syncTasks = ctx.syncTasks,
      missionVersion = ctx.missionVersion,
      buddyMember = ctx.buddyMember,
      updateBuddyPairs = ctx.updateBuddyPairs,
      BUDDY_PAIRS_ON = ctx.BUDDY_PAIRS_ON,
      SCOUTS_FORWARD_ON = ctx.SCOUTS_FORWARD_ON,
      RECON_TUNING = ctx.RECON_TUNING,
      RECON_PHASES = ctx.RECON_PHASES;

    function reconStats(battle) {
      if (!SCOUTS_FORWARD_ON || !battle) return null;
      var st = battle._scoutsForwardStats;
      if (!st || (st.lastTime != null && battle.time < st.lastTime)) {
        st = battle._scoutsForwardStats = {
          lastTime: battle.time,
          orders: 0,
          orderedByReason: {},
          scoutsSelected: 0,
          contacts: 0,
          noContact: 0,
          timeouts: 0,
          cancelled: 0,
          endedBy: {},
          reportsDelivered: 0,
          reportedEpisodes: 0,
          waitSeconds: 0,
          scoutMetres: 0,
          retriggerBlocked: 0,
          recent: []
        };
      }
      st.lastTime = battle.time;
      return st;
    }
    function reconInc(map, key) {
      map[key] = (map[key] || 0) + 1;
    }
    function reconDistance(task) {
      var total = 0,
        d = (task && task.distanceById) || {};
      Object.keys(d).forEach(function (id) {
        total += +d[id] || 0;
      });
      return total;
    }
    function reconTelemetry(battle) {
      var st = battle && battle._scoutsForwardStats;
      if (!SCOUTS_FORWARD_ON || !st) return null;
      var out = {
        orders: st.orders,
        orderedByReason: Object.assign({}, st.orderedByReason),
        scoutsSelected: st.scoutsSelected,
        contacts: st.contacts,
        noContact: st.noContact,
        timeouts: st.timeouts,
        cancelled: st.cancelled,
        endedBy: Object.assign({}, st.endedBy),
        reportsDelivered: st.reportsDelivered,
        reportedEpisodes: st.reportedEpisodes,
        waitSeconds: +st.waitSeconds.toFixed(1),
        scoutMetres: +st.scoutMetres.toFixed(1),
        retriggerBlocked: st.retriggerBlocked,
        recent: st.recent.slice(-24)
      };
      var active = 0;
      ['us', 'ge'].forEach(function (side) {
        var squads = (battle.factions && battle.factions[side] && battle.factions[side].squads) || [];
        for (var i = 0; i < squads.length; i++) if (L.get(squads[i], 'recon')) active++;
      });
      out.active = active;
      return out;
    }
    function leaderPictureAdequate(sq, battle) {
      var A = root.SquadAI,
        leader = A.leaderOf(sq),
        c = leader && A.soldierContact ? A.soldierContact(leader, battle) : null;
      if (!c || c.source === 'heard') return false;
      return (
        battle.time - (+c.at || 0) <= RECON_TUNING.pictureAge &&
        (+c.confidence || 0) >= RECON_TUNING.pictureConfidence
      );
    }
    function reconScreen(battle, from, to) {
      if (!battle || !from || !to) return null;
      var dx = to.x - from.x,
        dz = to.z - from.z,
        len = Math.hypot(dx, dz);
      if (!(len > 1)) return null;
      var heightAt =
          battle.heightAt ||
          function () {
            return 0;
          },
        ay = heightAt(from.x, from.z) + RECON_TUNING.eye,
        by = heightAt(to.x, to.z) + RECON_TUNING.eye,
        i;
      /* A crest is visible as a loss of ground line; finding that loss is terrain observation, not a
         query about who may be hiding beyond it. */
      for (i = 1; i < RECON_TUNING.terrainSamples; i++) {
        var t = i / RECON_TUNING.terrainSamples,
          x = from.x + dx * t,
          z = from.z + dz * t,
          lineY = ay + (by - ay) * t;
        if (heightAt(x, z) > lineY - 0.12) return { reason: 'crest', distance: len * t };
      }
      var a = { x: from.x, z: from.z, y: ay },
        b = { x: to.x, z: to.z, y: by },
        F = root.BattleObstacleField,
        N = root.BattleNavigation;
      if (F && F.sightBlocked && F.sightBlocked(battle.obstacles, a, b))
        return { reason: 'visual-screen', distance: null };
      if (N && N.lineOfSightBlocked && N.lineOfSightBlocked(from, to, ay, by))
        return { reason: 'visual-screen', distance: null };
      return null;
    }
    function reconSignature(sq, goal) {
      return [
        missionVersion(sq),
        +sq.routeIndex || 0,
        Math.round((+goal.x || 0) / 12),
        Math.round((+goal.z || 0) / 12)
      ].join('|');
    }
    function reconCandidate(sq, battle, goal) {
      if (!SCOUTS_FORWARD_ON || !sq || !battle || !goal || !RECON_PHASES[sq.commandPhase || '']) return null;
      var A = root.SquadAI,
        C = root.BattleCallouts;
      if (
        sq.state === 'retreat' ||
        sq.inContact ||
        sq.clearContact ||
        !A.leaderOf(sq) ||
        (A.soldierBeliefsOn && !A.soldierBeliefsOn()) ||
        /* Callouts gate: only block recon if callouts are loaded AND explicitly disabled
           (?callouts=0). If callouts are not loaded at all, recon should still work —
           the report-watch path (startReconReportWatch) checks C internally. This was
           previously a hard gate (!C || !C.enabled || !C.enabled()) that blocked recon
           whenever callouts were off, which prevented defend-phase recon from firing. */
        (C && C.enabled && !C.enabled()) ||
        leaderPictureAdequate(sq, battle)
      )
        return null;
      var from = average(sq);
      if (!from) return null;
      var dx = goal.x - from.x,
        dz = goal.z - from.z,
        d = Math.hypot(dx, dz);
      if (d < RECON_TUNING.minGoalDistance) return null;
      var ux = dx / d,
        uz = dz / d,
        look = Math.min(RECON_TUNING.lookAhead, d - 3),
        far = { x: from.x + ux * look, z: from.z + uz * look },
        screen = reconScreen(battle, from, far);
      if (!screen && d > RECON_TUNING.objectiveApproach) return null;
      var reason = screen ? screen.reason : 'unknown-approach',
        advance =
          screen && screen.distance != null
            ? Math.max(16, Math.min(RECON_TUNING.advance, screen.distance + RECON_TUNING.pastScreen))
            : Math.min(RECON_TUNING.advance, d - 4),
        sig = reconSignature(sq, goal),
        last = sq._reconLast;
      if (last && last.signature === sig) {
        if (!last.retriggerNoted) {
          last.retriggerNoted = true;
          var stats = reconStats(battle);
          if (stats) stats.retriggerBlocked++;
          telemetry(battle, 'decision-recon-retrigger-blocked', {
            faction: sq.faction,
            squad: sq.id,
            signature: sig,
            previousEnd: last.reason
          });
        }
        return null;
      }
      if (!(advance >= 12)) return null;
      return {
        signature: sig,
        reason: reason,
        from: from,
        goal: copy(goal),
        point: { x: from.x + ux * advance, z: from.z + uz * advance },
        axis: { x: ux, z: uz },
        goalDistance: d
      };
    }
    /* ?reconPosts=0/off/false restores the old detail, which could send a posted man (the benchmark's off arm). */
    var RECON_SKIPS_POSTED =
      typeof location === 'undefined' ||
      !/[?&]reconPosts=(?:0|off|false)(?:&|#|$)/i.test(location.search || '');
    function reconEligible(man, sq, battle) {
      return !!(
        man &&
        !man.dead &&
        man !== root.SquadAI.leaderOf(sq) &&
        !root.SquadAI.isMachineGun(man) &&
        (+man.suppressedUntil || 0) <= battle.time &&
        /* A man holding a firing station already has a Squad Leader-owned positional obligation, and the
           Movement Resolver ranks it above a formation order: sending him would leave his recon order
           adopted and never executed (#361 defect 2). Meso picks someone free instead. */
        !(RECON_SKIPS_POSTED && root.BattleTacticalPositions && root.BattleTacticalPositions.current(man))
      );
    }
    function selectReconScouts(sq, battle) {
      var men = commanded(sq)
          .filter(function (man) {
            return reconEligible(man, sq, battle);
          })
          .sort(function (a, b) {
            return (+a.slotIndex || 0) - (+b.slotIndex || 0) || String(a.id).localeCompare(String(b.id));
          }),
        living = commanded(sq).length;
      if (living < 4 || !men.length) return [];
      var scouts = men.filter(function (man) {
          return man.role === 'scout';
        }),
        pairs = sq._buddyPairs || {},
        pairIds = Object.keys(pairs).sort(),
        i;
      /* If a live buddy pair contains a scout, send that pair together. This preserves local ownership
         without requiring four men merely because the two doctrinal scouts sit in different teams. */
      for (i = 0; i < scouts.length; i++) {
        for (var pi = 0; pi < pairIds.length; pi++) {
          var p = pairs[pairIds[pi]],
            has = String(p.aId) === String(scouts[i].id) || String(p.bId) === String(scouts[i].id);
          if (!has) continue;
          var buddy = buddyMember(sq, String(p.aId) === String(scouts[i].id) ? p.bId : p.aId);
          if (reconEligible(buddy, sq, battle))
            return [scouts[i], buddy].sort(function (a, b) {
              return (+a.slotIndex || 0) - (+b.slotIndex || 0);
            });
        }
      }
      var cap = Math.min(2, Math.max(1, living - 3)),
        out = scouts.slice(0, cap);
      for (i = 0; out.length < cap && i < men.length; i++) if (out.indexOf(men[i]) < 0) out.push(men[i]);
      return out;
    }
    function syncReconTasks(sq) {
      var task = sq && sq._reconTask,
        picked = {};
      if (task) for (var i = 0; i < task.scoutIds.length; i++) picked[String(task.scoutIds[i])] = 1;
      var m = (sq && sq.members) || [];
      for (i = 0; i < m.length; i++)
        if (task) m[i]._engagementTask = picked[String(m[i].id)] ? 'recon' : 'recon-hold';
    }
    function startRecon(sq, battle, candidate) {
      if (!candidate || L.get(sq, 'recon')) return false;
      var scouts = selectReconScouts(sq, battle);
      if (!scouts.length || scouts.length >= commanded(sq).length) return false;
      var selected = {},
        hold = {},
        starts = {},
        lasts = {},
        moved = {},
        dest = {},
        right = { x: -candidate.axis.z, z: candidate.axis.x },
        members = commanded(sq),
        i;
      for (i = 0; i < scouts.length; i++) selected[String(scouts[i].id)] = 1;
      for (i = 0; i < members.length; i++) {
        var man = members[i],
          pos = man.root.position,
          id = String(man.id);
        starts[id] = { x: pos.x, z: pos.z };
        lasts[id] = { x: pos.x, z: pos.z };
        moved[id] = 0;
        if (!selected[id]) hold[id] = { x: pos.x, z: pos.z };
      }
      for (i = 0; i < scouts.length; i++) {
        var lateral = scouts.length === 1 ? 0 : i === 0 ? 1.7 : -1.7;
        dest[String(scouts[i].id)] = {
          x: candidate.point.x + right.x * lateral,
          z: candidate.point.z + right.z * lateral
        };
      }
      var task = (sq._reconTask = {
        signature: candidate.signature,
        reason: candidate.reason,
        defenderOrigin: !!candidate.defenderOrigin,
        startedAt: battle.time,
        until: battle.time + RECON_TUNING.timeout,
        phase: sq.commandPhase || '',
        missionVersion: missionVersion(sq),
        point: copy(candidate.point),
        goal: copy(candidate.goal),
        scoutIds: scouts.map(function (man) {
          return man.id;
        }),
        destinations: dest,
        holdPoints: hold,
        startPositions: starts,
        lastPositions: lasts,
        distanceById: moved,
        arrivedAt: null,
        updatedAt: null
      });
      L.grant(
        sq,
        'recon',
        'squad-leader',
        battle.time,
        task.until,
        candidate.reason + ' before commitment',
        'contact, event, observation complete, timeout, mission/phase change or battle end',
        { signature: task.signature, scouts: task.scoutIds.slice(), point: copy(task.point) }
      );
      syncReconTasks(sq);
      var st = reconStats(battle);
      if (st) {
        st.orders++;
        st.scoutsSelected += scouts.length;
        reconInc(st.orderedByReason, candidate.reason);
        st.recent.push({
          at: +battle.time.toFixed(2),
          squad: sq.faction + ':' + sq.id,
          reason: candidate.reason,
          scouts: task.scoutIds.slice(),
          point: copy(task.point)
        });
        if (st.recent.length > 24) st.recent.shift();
      }
      telemetry(battle, 'decision-recon-order', {
        faction: sq.faction,
        squad: sq.id,
        phase: task.phase,
        reason: task.reason,
        signature: task.signature,
        scouts: task.scoutIds.slice(),
        point: copy(task.point),
        goalDistance: +candidate.goalDistance.toFixed(1)
      });
      return true;
    }
    function updateReconDistance(sq, task) {
      for (var i = 0; i < task.scoutIds.length; i++) {
        var man = buddyMember(sq, task.scoutIds[i]);
        if (!man || man.dead || !man.root) continue;
        var id = String(man.id),
          pos = man.root.position,
          prior = task.lastPositions[id];
        if (prior) task.distanceById[id] = (+task.distanceById[id] || 0) + dist(prior, pos);
        task.lastPositions[id] = { x: pos.x, z: pos.z };
      }
    }
    function scoutDirectContact(sq, task, battle) {
      var A = root.SquadAI;
      for (var i = 0; i < task.scoutIds.length; i++) {
        var man = buddyMember(sq, task.scoutIds[i]);
        if (!man || man.dead) continue;
        var c = A.soldierContact(man, battle);
        if (c && c.source === 'seen' && +c.at >= task.startedAt - 1e-6) return { man: man, contact: c };
      }
      return null;
    }
    function startReconReportWatch(sq, task, battle) {
      sq._reconReportMonitor = {
        startedAt: task.startedAt,
        endedAt: battle.time,
        until: battle.time + RECON_TUNING.reportWatch,
        scoutIds: task.scoutIds.map(String),
        recipients: {},
        countedEpisode: false
      };
    }
    function updateReconReportWatch(sq, battle) {
      var mon = sq && sq._reconReportMonitor;
      if (!mon || !battle) return;
      var A = root.SquadAI,
        st = reconStats(battle),
        members = sq.members || [];
      if (A.beliefSnapshot)
        for (var i = 0; i < members.length; i++) {
          var man = members[i],
            id = man && String(man.id);
          if (!man || man.dead || mon.scoutIds.indexOf(id) >= 0 || mon.recipients[id]) continue;
          var snap = A.beliefSnapshot(man, battle),
            beliefs = (snap && snap.beliefs) || [];
          for (var bi = 0; bi < beliefs.length; bi++) {
            var belief = beliefs[bi];
            if (
              belief.source === 'told' &&
              mon.scoutIds.indexOf(String(belief.sourceSoldierId)) >= 0 &&
              +belief.observedAt >= mon.startedAt - 1e-6
            ) {
              mon.recipients[id] = 1;
              if (st) {
                st.reportsDelivered++;
                if (!mon.countedEpisode) {
                  mon.countedEpisode = true;
                  st.reportedEpisodes++;
                }
              }
              telemetry(battle, 'decision-recon-report-delivered', {
                faction: sq.faction,
                squad: sq.id,
                recipient: man.id,
                sourceScout: belief.sourceSoldierId,
                delay: +(battle.time - mon.endedAt).toFixed(2)
              });
              break;
            }
          }
        }
      if (battle.time >= mon.until) sq._reconReportMonitor = null;
    }
    function endRecon(sq, battle, reason) {
      var task = sq && sq._reconTask;
      if (!task) return null;
      updateReconDistance(sq, task);
      var metres = reconDistance(task),
        seconds = Math.max(0, battle.time - task.startedAt),
        lease = L.end(sq, 'recon', battle.time, reason);
      sq._reconTask = null;
      sq._reconLast = {
        signature: task.signature,
        endedAt: battle.time,
        reason: reason,
        point: copy(task.point),
        startedAt: task.startedAt,
        scoutIds: task.scoutIds.slice(),
        retriggerNoted: false
      };
      if (reason === 'scout-contact') startReconReportWatch(sq, task, battle);
      /* Only a no-contact release hands the main body a deliberate scout lead to absorb. Contact,
         retreat, leader/phase/mission invalidation and battle end already transition into their own
         owners and must not leave a recon-derived bypass behind. */
      if (reason === 'observed-no-contact' || reason === 'timeout')
        L.grant(
          sq,
          'regroup-bypass',
          'squad-leader',
          battle.time,
          battle.time + RECON_TUNING.rejoin,
          'recon rejoin',
          'scouts back inside cohesion release band, contact, retreat, mission change or expiry',
          { scoutIds: task.scoutIds.slice(), missionVersion: task.missionVersion }
        );
      syncTasks(sq, sq._engagementPlan);
      var st = reconStats(battle);
      if (st) {
        reconInc(st.endedBy, reason);
        st.waitSeconds += seconds;
        st.scoutMetres += metres;
        if (reason === 'scout-contact') st.contacts++;
        else if (reason === 'observed-no-contact') st.noContact++;
        else if (reason === 'timeout') st.timeouts++;
        else st.cancelled++;
        st.recent.push({
          at: +battle.time.toFixed(2),
          squad: sq.faction + ':' + sq.id,
          end: reason,
          seconds: +seconds.toFixed(1),
          metres: +metres.toFixed(1),
          scouts: task.scoutIds.slice()
        });
        if (st.recent.length > 24) st.recent.shift();
      }
      telemetry(battle, 'decision-recon-end', {
        faction: sq.faction,
        squad: sq.id,
        reason: reason,
        signature: task.signature,
        scouts: task.scoutIds.slice(),
        seconds: +seconds.toFixed(2),
        scoutMetres: +metres.toFixed(1)
      });
      return lease;
    }
    function updateRecon(sq, battle, report) {
      updateReconReportWatch(sq, battle);
      var task = sq && sq._reconTask;
      if (!task || !battle || task.updatedAt === battle.time) return task || null;
      task.updatedAt = battle.time;
      updateReconDistance(sq, task);
      if (battle.winner) return endRecon(sq, battle, 'battle-end');
      if (sq.state === 'retreat') return endRecon(sq, battle, 'retreat');
      if (!leaderAlive(sq)) return endRecon(sq, battle, 'leader-loss');
      if (task.missionVersion !== missionVersion(sq)) return endRecon(sq, battle, 'mission-change');
      if ((sq.commandPhase || '') !== task.phase) return endRecon(sq, battle, 'phase-change');
      if (report && report.underFire > 0) return endRecon(sq, battle, 'under-fire');
      var seen = scoutDirectContact(sq, task, battle);
      if (seen) return endRecon(sq, battle, 'scout-contact');
      if (report && (report.contactStarted || (+sq.contactCount || 0) > 0))
        return endRecon(sq, battle, 'contact');
      if (battle.time >= task.until) return endRecon(sq, battle, 'timeout');
      var aliveScouts = 0,
        arrived = 0;
      for (var i = 0; i < task.scoutIds.length; i++) {
        var man = buddyMember(sq, task.scoutIds[i]),
          target = task.destinations[String(task.scoutIds[i])];
        if (!man || man.dead || !target) continue;
        aliveScouts++;
        if (dist(man.root.position, target) <= RECON_TUNING.arrive) arrived++;
      }
      if (!aliveScouts) return endRecon(sq, battle, 'scouts-unavailable');
      if (arrived === aliveScouts) {
        if (task.arrivedAt == null) task.arrivedAt = battle.time;
        if (battle.time - task.arrivedAt >= RECON_TUNING.observe)
          return endRecon(sq, battle, 'observed-no-contact');
      } else task.arrivedAt = null;
      return task;
    }
    function publishReconOrders(sq, battle) {
      var task = sq && sq._reconTask;
      if (!task) return false;
      var selected = {};
      for (var i = 0; i < task.scoutIds.length; i++) selected[String(task.scoutIds[i])] = 1;
      var members = commanded(sq),
        stats = publishStats(battle),
        CR = root.BattleCommandReception;
      if (CR && CR.publish)
        CR.publish(sq, battle, 'movement', members, {
          scope: 'recon',
          action: 'scouts-forward',
          signature: 'recon|' + task.signature,
          reason: task.reason || 'scouts forward',
          spatial: true,
          reference: 'point'
        });
      for (i = 0; i < members.length; i++) {
        var man = members[i],
          id = String(man.id),
          next = selected[id] ? task.destinations[id] : task.holdPoints[id];
        if (!next) continue;
        man._fireteamKey = man._fireteamKey || teamKeyFor(man);
        man._engagementTask = selected[id] ? 'recon' : 'recon-hold';
        var key = 'recon|' + task.signature + '|' + id,
          previous = point(man._fireteamDestination),
          reconKind = selected[id] ? 'recon' : 'recon-hold';
        stats.intentChecks++;
        if (
          previous &&
          dist(previous, next) <= ORDER_PUBLISH_EPS &&
          man._fireteamPublishKey === key &&
          movementExecutionCurrent(man, battle)
        ) {
          stats.intentCoalesced++;
          continue;
        }
        var applied = publishPersonalMovement(
          sq,
          battle,
          man,
          next,
          key,
          false,
          reconKind,
          task.reason || 'scouts forward',
          stats,
          selected[id] ? null : { adoptHere: true, reference: 'none' }
        );
        /* The main body's HOLD is non-spatial. Once a man receives it, that receipt position becomes
           the stable hold point for this recon lease so later ticks coalesce instead of dragging him
           back to the coordinate captured before he heard the command. */
        if (!selected[id] && applied && man._fireteamDestination)
          task.holdPoints[id] = copy(man._fireteamDestination);
      }
      if (BUDDY_PAIRS_ON) updateBuddyPairs(sq, battle);
      return true;
    }

    return {
      reconStats: reconStats,
      reconInc: reconInc,
      reconDistance: reconDistance,
      reconTelemetry: reconTelemetry,
      leaderPictureAdequate: leaderPictureAdequate,
      reconScreen: reconScreen,
      reconSignature: reconSignature,
      reconCandidate: reconCandidate,
      reconEligible: reconEligible,
      selectReconScouts: selectReconScouts,
      syncReconTasks: syncReconTasks,
      startRecon: startRecon,
      updateReconDistance: updateReconDistance,
      scoutDirectContact: scoutDirectContact,
      startReconReportWatch: startReconReportWatch,
      updateReconReportWatch: updateReconReportWatch,
      endRecon: endRecon,
      updateRecon: updateRecon,
      publishReconOrders: publishReconOrders,
      SCOUTS_FORWARD_ON: SCOUTS_FORWARD_ON,
      RECON_TUNING: RECON_TUNING,
      RECON_PHASES: RECON_PHASES
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
