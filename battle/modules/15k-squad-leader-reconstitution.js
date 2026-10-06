/* Squad Leader reconstitution sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   Succession (updateSuccession), the Squad Leader's roster rewrites (leaderDown, assignSlots,
   reform, disband, detachFled, absorb), the rally bookkeeping (endUnstick, acknowledgeRequest,
   noteSafePoint) and the retreat/assembly march (endRallyRecovery, recoverFromRetreat,
   updateAssembly) are here. The parent file calls the factory with its closure utilities and
   re-attaches the returned functions as closure variables, so updateSquadState, the
   fire-and-movement selector and the public API export see the same functions as before.
   The flags and tuning (LEADERLESS_INTENT_ON, SUCCESSION_DELAY, RALLY_RECOVERY_*) stay in 16
   and are passed into the factory via ctx. The factory call in 16 sits before the
   fire-and-movement one, which consumes detachFled. */
(function (root) {
  'use strict';
  if (root._squadLeaderReconstitution) return;

  /* Factory: called by 16-squad-plan-stability.js after the leaderless, morale/COA and
     retreat-anchor re-attaches are in scope. alive, average, cfg, cohesionAssessment and
     initialPhase are hoisted function declarations in the parent closure. */
  root._squadLeaderReconstitution = function (ctx) {
    var root = ctx.root,
      L = ctx.root.BattleLeases,
      telemetry = ctx.telemetry,
      copy = ctx.copy,
      dist = ctx.dist,
      alive = ctx.alive,
      average = ctx.average,
      cfg = ctx.cfg,
      cohesionAssessment = ctx.cohesionAssessment,
      initialPhase = ctx.initialPhase,
      publishAnchor = ctx.publishAnchor,
      moraleRallies = ctx.moraleRallies,
      moraleBreakAt = ctx.moraleBreakAt,
      captureLeaderlessIntent = ctx.captureLeaderlessIntent,
      endLeaderlessIntent = ctx.endLeaderlessIntent,
      LEADERLESS_INTENT_ON = ctx.LEADERLESS_INTENT_ON,
      SUCCESSION_DELAY = ctx.SUCCESSION_DELAY,
      MORALE_TUNING = ctx.MORALE_TUNING,
      RALLY_RECOVERY_ON = ctx.RALLY_RECOVERY_ON,
      RALLY_RECOVERY_DWELL = ctx.RALLY_RECOVERY_DWELL,
      RALLY_RECOVERY_ARRIVE = ctx.RALLY_RECOVERY_ARRIVE,
      ASSEMBLY_HOME_RADIUS = ctx.ASSEMBLY_HOME_RADIUS;
    function endRallyRecovery(sq, battle, reason) {
      if (!battle || (!sq._moraleRallyPoint && !L.get(sq, 'rally-recovery'))) return;
      sq._moraleRallyPoint = null;
      L.end(sq, 'rally-recovery', battle.time, reason);
      telemetry(battle, 'decision-rally-recovery-end', {
        faction: sq.faction,
        squad: sq.id,
        reason: reason
      });
    }
    function recoverFromRetreat(sq, battle, casualtyFrac, stress) {
      /* A fled man's squad of one is not a rallying squad. He is done with the fight for good
       (Engagement `flee`): the General takes him into a retreating squad at his refuge
       (pickUpFled) or reconstitution groups him at base, and either way a roster rewrite
       dissolves this squad - that, nothing he does on his own, is his road back under command.
       The paths below are for squads that retreated, not for broken men: left open to them, the
       solo redeploy would walk him out of `retreat` after the base dwell and the General, seeing
       a living squad no longer retreating, would brief him a mission again - an unarmed-to-rearmed
       broken man assaulting while he counts toward nobody's elimination. However long he stands
       at base, however calm the FLED floor lets him get: no recovery. (He holds no rally-recovery
       lease to end: the detachment is a fresh squad and the grant sits below this guard.) */
      if (sq.fledId != null) return false;
      /* A 1-4 man remnant is extracting, not tactically rallying. While it is still on the ordinary
         retreat-to-home leg, morale recovery may not invent a local rally point or return it to combat:
         each survivor keeps going home independently and the only hand-back is a legitimate
         reconstitution roster rewrite. Once Macro has actually briefed the remnant to a reconstitution
         rally, this guard no longer applies; the merge owns that movement. */
      if (root.SquadAI.isExtractionToHome(sq)) {
        endRallyRecovery(sq, battle, 'remnant extracting home');
        return false;
      }
      if (!RALLY_RECOVERY_ON) return moraleRallies(casualtyFrac, stress);
      if (!moraleRallies(casualtyFrac, stress) || sq.inContact) {
        endRallyRecovery(sq, battle, sq.inContact ? 'contact resumed' : 'morale fell');
        return false;
      }
      var lease = L.get(sq, 'rally-recovery');
      if (!lease) {
        var here = average(sq) || sq.orderAnchor || sq.rally || sq.home;
        sq._moraleRallyPoint = copy(here);
        L.end(sq, 'retreat-anchor', battle.time, 'morale rally recovery');
        lease = L.grant(
          sq,
          'rally-recovery',
          'squad-leader',
          battle.time,
          Infinity,
          'morale recovered; physically reform before resuming mission',
          'contact, morale loss or stable reform',
          { point: copy(here), stableSince: null }
        );
        telemetry(battle, 'decision-rally-recovery-start', {
          faction: sq.faction,
          squad: sq.id,
          point: copy(here)
        });
      }
      var center = average(sq),
        rally = (lease.data && lease.data.point) || sq._moraleRallyPoint,
        limit = +(cfg(battle, sq).cohesionRadius || 34),
        ca = cohesionAssessment(sq, limit),
        physicallyReady = !!(
          center &&
          rally &&
          dist(center, rally) <= RALLY_RECOVERY_ARRIVE &&
          !ca.dispersed
        );
      if (!physicallyReady) {
        lease.data.stableSince = null;
        return false;
      }
      if (lease.data.stableSince == null) lease.data.stableSince = battle.time;
      if (battle.time - lease.data.stableSince < RALLY_RECOVERY_DWELL) return false;
      endRallyRecovery(sq, battle, 'stable reform complete');
      return true;
    }

    /* Succession. When the squad leader is killed nobody commands for SUCCESSION_DELAY seconds (the
     `succession` lease: the squad runs on its leaderless cohesion and corner rules and the accuracy
     penalty applies); then the most senior survivor takes command (SquadAI.mostSenior), takes the
     leader's slot and the penalty ends. A squad with a leader holds no lease. */
    function updateSuccession(sq, battle) {
      var t = battle.time,
        held = L.get(sq, 'succession'),
        men = alive(sq),
        present = root.SquadAI.leaderOf(sq);
      if (present || !men.length) {
        if (held) L.end(sq, 'succession', t, men.length ? 'leader present' : 'squad destroyed');
        if (LEADERLESS_INTENT_ON && sq._leaderlessIntent)
          endLeaderlessIntent(sq, battle, men.length ? 'leader present' : 'squad destroyed', present || null);
        return;
      }
      if (!held) {
        var data = null;
        if (LEADERLESS_INTENT_ON) data = { intent: captureLeaderlessIntent(sq, battle) };
        L.grant(
          sq,
          'succession',
          'squad-leader',
          t,
          t + SUCCESSION_DELAY,
          'squad leader killed',
          'successor takes command',
          data
        );
        return;
      }
      if (LEADERLESS_INTENT_ON && !sq._leaderlessIntent) {
        sq._leaderlessIntent = (held.data && held.data.intent) || captureLeaderlessIntent(sq, battle);
        held.data = held.data || {};
        held.data.intent = sq._leaderlessIntent;
      }
      if (L.holds(sq, 'succession', t)) return;
      var next = root.SquadAI.mostSenior(men);
      sq.leaderId = next.id;
      next.slotIndex = 0;
      next.slotRole = null;
      next._fireteamKey = null;
      sq.captainAlive = true;
      sq.accuracyMultiplier = 1;
      L.end(sq, 'succession', t, 'successor took command');
      if (LEADERLESS_INTENT_ON) endLeaderlessIntent(sq, battle, 'successor took command', next);
      telemetry(battle, 'decision-leader-succession', {
        faction: sq.faction,
        squad: sq.id,
        soldier: next.id,
        role: next.role,
        leaderlessSeconds: +(t - held.since).toFixed(2)
      });
    }
    /* The Squad Leader's word on who commands and where each man stands. Other layers report the event
     and this layer rewrites its own state: a leader killed (`leaderDown`, called from killSoldier), a
     reconstitution merge (`reform` for the squad that survives, `disband` for one absorbed) and the
     General's acknowledgement that it read a request (`acknowledgeRequest`). */
    function leaderDown(sq) {
      sq.captainAlive = false;
      sq.accuracyMultiplier = 0.8;
    }
    /* Slot 0 is the leader, 1 the squad's gun, 2-3 its scouts; every other man - a second gunner, a third
     scout, a former leader - takes a rifleman slot from 4 up (`slotRole`, SquadAI.formationSlot). */
    function assignSlots(men, leader) {
      var gun = false,
        scouts = 0,
        next = 4;
      leader.slotIndex = 0;
      leader.slotRole = null;
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (s === leader) continue;
        s.slotRole = null;
        if (s.role === 'gunner' && !gun) {
          gun = true;
          s.slotIndex = 1;
        } else if (s.role === 'scout' && scouts < 2) s.slotIndex = 2 + scouts++;
        else {
          s.slotIndex = next++;
          if (s.role !== 'rifleman') s.slotRole = 'rifleman';
        }
      }
    }
    /* A reconstitution merge: `men` (already members of `survivor`) form one squad under `leader`, anchored
     on the group's rally point, with no plan, post, task or fireteam carried over from their old squads. */
    function reform(survivor, men, leader, rally, establishment) {
      assignSlots(men, leader);
      men.forEach(function (s) {
        s.squad = survivor;
        s._fireteamKey = null;
        s._defensePost = null;
        s._engagementTask = null;
        s._engagementPlanSerial = null;
      });
      survivor.members = men;
      survivor.leaderId = leader.id;
      survivor.establishment = establishment;
      survivor.aliveCount = men.length;
      /* A one-man fled detachment may be the strongest/senior survivor object selected for
         the merge. Once it becomes the reconstituted full squad, that detachment identity is
         over; keeping fledId would make recoverFromRetreat's guard freeze the rebuilt squad
         in retreat forever. */
      if (survivor.fledId != null) {
        survivor.fledId = null;
        survivor.fledFrom = null;
      }
      survivor.captainAlive = true;
      survivor.accuracyMultiplier = 1; // the leader-death penalty (killSoldier) ends with a leader
      publishAnchor(survivor, rally);
    }
    // A squad absorbed by a merge reads like a destroyed one: nobody living and nobody in command.
    function disband(sq) {
      sq.members = [];
      sq.aliveCount = 0;
      sq.leaderId = null;
    }
    /* The last place the squad stood out of contact with nobody known near it: where a man who breaks and runs goes first
     (Engagement `flee` reads `squad.safePoint`; `squad.rally` is the moving anchor, which is at the front). */
    function noteSafePoint(sq, battle) {
      if (!battle || sq.state === 'retreat' || sq.inContact) return;
      if (root.SquadAI.squadContact ? root.SquadAI.squadContact(sq, battle) : sq.contact) return;
      var p = average(sq);
      if (p) sq.safePoint = { x: p.x, z: p.z };
    }
    /* Men who have broken for good (Engagement's report, `fled`) leave the squad and are not coming back to it: each
     becomes a squad of one, retreating, a full squad's strength missing, on the squad's home. A leader who runs leaves
     the squad leaderless (succession). The General may take a lone man into a retreating squad, or reconstitution
     groups him at base. */
    function detachFled(sq, battle, men) {
      var list = battle.factions && battle.factions[sq.faction] && battle.factions[sq.faction].squads;
      if (!list) return;
      men
        .filter(function (s) {
          return s.squad === sq && !s.dead;
        })
        .sort(function (a, b) {
          return a.id - b.id;
        })
        .forEach(function (s) {
          var wasLeader = root.SquadAI.leaderOf(sq) === s;
          sq.members = sq.members.filter(function (m) {
            return m !== s;
          });
          if (wasLeader) leaderDown(sq);
          var lone = root.SquadAI.createSquad(
            sq.id + '-fled-' + s.id,
            sq.faction,
            copy(sq.home),
            sq.objective
          );
          lone.members.push(s);
          lone.leaderId = s.id;
          lone.establishment = root.SquadAI.COMPOSITION.length;
          lone.fledId = s.id;
          lone.fledFrom = sq.id;
          lone.state = 'retreat';
          lone.route = [];
          lone.routeIndex = 0;
          lone._battleSim = battle;
          initialPhase(lone, 'approach');
          assignSlots([s], s);
          s.squad = lone;
          s._fireteamKey = null;
          s._defensePost = null;
          s._engagementTask = null;
          s._engagementPlanSerial = null;
          list.push(lone);
          telemetry(battle, 'decision-fled-detach', {
            faction: sq.faction,
            squad: sq.id,
            lone: lone.id,
            soldier: s.id,
            role: s.role,
            leader: wasLeader
          });
        });
    }
    /* A retreating squad takes in a lone fled man (the General decides, this layer rewrites its own roster): he joins the
     squad's roster on the next rifleman slot and his own squad of one is gone, like a squad absorbed by a merge. */
    function absorb(survivor, lone, battle) {
      var s = lone && lone.members && lone.members[0];
      if (!s || s.dead || !survivor || survivor === lone) return false;
      var slot = 3;
      survivor.members.forEach(function (m) {
        if (m.slotIndex > slot) slot = m.slotIndex;
      });
      s.squad = survivor;
      s.slotIndex = slot + 1;
      s.slotRole = 'rifleman';
      s._fireteamKey = null;
      survivor.members.push(s);
      lone.establishment = root.SquadAI.COMPOSITION.length;
      disband(lone);
      lone.disbanded = true;
      lone.mergedInto = survivor.id;
      telemetry(battle, 'decision-fled-absorbed', {
        faction: survivor.faction,
        squad: survivor.id,
        lone: lone.id,
        soldier: s.id
      });
      return true;
    }
    // A man's regroup-unstick record ends (stepMovement: he recovered, the lease ended or he died).
    function endUnstick(s) {
      s._regroupUnstick = null;
    }
    // The General has re-selected a brief: the request that woke it is answered.
    function acknowledgeRequest(sq) {
      sq._macroMissionRequest = null;
    }
    /* Retreat and reconstitution march. A retreating squad heads home (`to-base`); once home and out of
     contact it is `at-base`, the only state in which the General will group it. A `reconstitute` brief
     then sends it to the rally point (`to-rally`), where the General merges it. If the brief ends without
     a merge (the group dissolved) the squad is `at-base` again and walks home. `_assembly` is created on
     retreat and dropped when the squad stops retreating. SquadAI.retreatGoal() reads it. */
    function updateAssembly(sq, battle) {
      if (sq.state !== 'retreat') {
        sq._assembly = null;
        return;
      }
      var t = battle.time,
        m = sq._macroMission,
        briefed = !!(m && m.intent === 'reconstitute' && (m.status === 'issued' || m.status === 'executing')),
        a = sq._assembly || (sq._assembly = { phase: 'to-base', since: t, missionVersion: null });
      if (a.phase === 'to-rally' && !(briefed && m.version === a.missionVersion)) {
        a.phase = 'at-base';
        a.since = t;
        a.missionVersion = null;
      }
      if (a.phase === 'to-base' && !sq.inContact) {
        var p = average(sq);
        if (p && dist(p, sq.home) <= ASSEMBLY_HOME_RADIUS) {
          a.phase = 'at-base';
          a.since = t;
          telemetry(battle, 'decision-assembly-home', { faction: sq.faction, squad: sq.id });
        }
      }
      if (a.phase !== 'at-base' || !briefed) return;
      a.phase = 'to-rally';
      a.since = t;
      a.missionVersion = m.version;
      if (!root.BattleCommanderAI || !root.BattleCommanderAI.acceptMission)
        throw new Error('Squad Leader cannot accept a brief without its Macro lifecycle owner');
      root.BattleCommanderAI.acceptMission(battle, sq, true);
      telemetry(battle, 'decision-assembly-rally', {
        faction: sq.faction,
        squad: sq.id,
        version: m.version,
        rally: copy(m.point)
      });
    }

    return {
      updateSuccession: updateSuccession,
      leaderDown: leaderDown,
      assignSlots: assignSlots,
      reform: reform,
      disband: disband,
      noteSafePoint: noteSafePoint,
      detachFled: detachFled,
      absorb: absorb,
      endUnstick: endUnstick,
      acknowledgeRequest: acknowledgeRequest,
      endRallyRecovery: endRallyRecovery,
      recoverFromRetreat: recoverFromRetreat,
      updateAssembly: updateAssembly
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
