/* Squad Leader fire-and-movement sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   Whether the squad may assault (_assaultAuthorized), which fireteam bounds every
   BOUND_CYCLE, and the Squad Leader's stress levers (teamStress, leadStress, stressReview)
   are here. The parent file calls the factory with its closure utilities and re-attaches
   the returned functions as closure variables, so updateSquadState and the public API
   export see the same functions as before. The flags and tuning (SL_STRESS, LEAD_TUNING,
   BOUND_*, ASSAULT_PHASES, FIRETEAM_SPLIT_ON, FIRE_CONTROL_ON, COA_ON) stay in 16
   (load-time location.search parsing; exported via BattleSquadStability.tuning and
   boundPhases()) and are passed into the factory via ctx. */
(function (root) {
  'use strict';
  if (root._squadLeaderFireAndMovement) return;

  /* Factory: called by 16-squad-plan-stability.js after the fire-control, buddy-pairs,
     scouts-forward, leaderless, morale/COA and clear-contact re-attaches are in scope.
     detachFled and requestReview are hoisted function declarations in the parent closure. */
  root._squadLeaderFireAndMovement = function (ctx) {
    var root = ctx.root,
      L = ctx.root.BattleLeases,
      telemetry = ctx.telemetry,
      detachFled = ctx.detachFled,
      updateRecon = ctx.updateRecon,
      leaderlessActive = ctx.leaderlessActive,
      noteLeaderlessAction = ctx.noteLeaderlessAction,
      updateClearContact = ctx.updateClearContact,
      updateCOA = ctx.updateCOA,
      updateFireControl = ctx.updateFireControl,
      clearFireControl = ctx.clearFireControl,
      buddyBoundPreview = ctx.buddyBoundPreview,
      commitBuddyCooperation = ctx.commitBuddyCooperation,
      requestReview = ctx.requestReview,
      SL_STRESS = ctx.SL_STRESS,
      LEAD_TUNING = ctx.LEAD_TUNING,
      COAS = ctx.COAS,
      BOUND_CYCLE = ctx.BOUND_CYCLE,
      BOUND_DURATION = ctx.BOUND_DURATION,
      BOUND_TEAMS = ctx.BOUND_TEAMS,
      ASSAULT_PHASES = ctx.ASSAULT_PHASES,
      FIRETEAM_SPLIT_ON = ctx.FIRETEAM_SPLIT_ON,
      FIRE_CONTROL_ON = ctx.FIRE_CONTROL_ON,
      COA_ON = ctx.COA_ON;
  function teamStress(men) {
    var M = root.BattleSoldierMind;
    return M && M.teamStress ? M.teamStress(men) : 0;
  }
  function leadStress(sq) {
    var M = root.BattleSoldierMind;
    return M && M.leadStress ? M.leadStress(sq) : 0;
  }
  /* review: the squad has stayed shaken in contact long enough that its brief is worth a second look. */
  function stressReview(sq, battle) {
    if (!SL_STRESS.review) return;
    var living = 0,
      m = sq.members || [];
    for (var i = 0; i < m.length; i++) if (m[i] && !m[i].dead) living++;
    if (living < LEAD_TUNING.reviewMin || leadStress(sq) < LEAD_TUNING.reviewAt) {
      sq._slStressSince = null;
      return;
    }
    if (sq._slStressSince == null) sq._slStressSince = battle.time;
    else if (battle.time - sq._slStressSince >= LEAD_TUNING.reviewAfter) requestReview(battle, sq, 'squad stress');
  }
  /* Fire and movement. Engagement reports the squad's contact and base of fire; the Squad Leader decides
   whether the phase allows an assault and, every BOUND_CYCLE seconds, sends one fireteam forward
   for BOUND_DURATION while at least two men keep shooting. */
  function fireAndMovement(sq, battle) {
    var E = root.BattleEngagement;
    if (!E || !sq || !battle) return;
    var r = E.updateSquad(sq, battle);
    if (!r) return;
    if (r.fled && r.fled.length && sq.fledId == null) detachFled(sq, battle, r.fled);
    updateRecon(sq, battle, r);
    if (leaderlessActive(sq) && sq.state !== 'retreat') {
      var inheritedBound = L.get(sq, 'bound');
      if (!L.holds(sq, 'bound', battle.time)) E.clearBoundOrders(sq);
      if (r.contactStarted || r.underFire > 0) {
        /* Immediate contact remains a Micro fact/action. Perception and the existing tactical-callout
           channel already report what individual men actually saw/heard; do not turn ordinary contact
           during a six-second succession gap into an automatic General mission wake. */
        noteLeaderlessAction(
          sq,
          battle,
          'immediate-contact',
          r.underFire > 0 ? 'under fire' : 'contact acquired'
        );
      } else if (inheritedBound && L.holds(sq, 'bound', battle.time))
        noteLeaderlessAction(sq, battle, 'finish-committed-move', 'inherited bound remains live');
      else if (sq.inContact)
        noteLeaderlessAction(sq, battle, 'hold-and-fight', 'existing contact under inherited intent');
      else noteLeaderlessAction(sq, battle, 'hold-intent', 'no new Meso command during succession');
      return;
    }
    updateClearContact(sq, battle, r);
    var members = sq.members || [],
      i,
      s;
    var t = battle.time;
    /* A bound order that was not taken up inside its window is stale, not pending. */
    if (!L.holds(sq, 'bound', t)) E.clearBoundOrders(sq);
    if (r.contactStarted) {
      L.end(sq, 'bound', t, 'contact started');
      L.grant(sq, 'bound-cycle', 'squad-leader', t, t + BOUND_CYCLE, 'contact started', 'cycle expiry');
    }
    if (!sq.inContact) {
      L.end(sq, 'bound', t, 'contact broken');
      sq._assaultAuthorized = false;
      if (SL_STRESS.review) sq._slStressSince = null;
      /* A squad clearing the last contact is still in that engagement: its open fire order stands, so the man
         who finds the enemy again fires instead of the squad going to ground for a new volley. */
      if (FIRE_CONTROL_ON && !sq.clearContact) clearFireControl(sq, battle, 'contact broken');
      return;
    }
    stressReview(sq, battle);
    var fireControl = FIRE_CONTROL_ON ? updateFireControl(sq, battle, r) : null;
    /* Hold/precision fire control is a preparation, not a bound. The Squad Leader keeps the squad
       stationary until it opens the engagement; a designated long-range shooter is the one exception. */
    if (fireControl && fireControl.state !== 'open') {
      sq._assaultAuthorized = false;
      return;
    }
    if (COA_ON) updateCOA(sq);
    sq._assaultAuthorized = !!ASSAULT_PHASES[sq.commandPhase || ''];
    /* 3c: the COA gates bounding. Defend holds position (no bounds); assault bounds only if the
       phase also allows. The explicit `?coa=0` control never sets sq.coa, so this is a no-op there. */
    if (COA_ON && sq.coa && COAS[sq.coa] && !COAS[sq.coa].bounds) sq._assaultAuthorized = false;
    /* A bound needs a base of fire: somebody has to be shooting while somebody else moves. */
    if (
      !sq._assaultAuthorized ||
      L.holds(sq, 'bound-cycle', t) ||
      L.holds(sq, 'bound', t) ||
      r.effective < 2 ||
      r.pinned >= r.effective
    )
      return;
    /* Phase 0G3: multi-contact gate. When ?fireteamSplit=1 is on and the squad has active
       contacts in 2+ threat sectors (via squadContactsMap), suppress bounding and hold
       position. A squad that bounds into one threat while ignoring another is advancing into
       a crossfire; holding lets both sectors be engaged before continuing. The Squad Leader
       can still issue fire-control and individual men can still fire at both sectors via
       0G1's secondary threat orientation. This gate only prevents the bound (the movement);
       it does not change fire permission or stance. */
    if (FIRETEAM_SPLIT_ON) {
      var A = root.SquadAI;
      if (A && typeof A.squadContactsMap === 'function') {
        var contacts = A.squadContactsMap(sq, battle);
        if (contacts && contacts.length >= 2) {
          /* Multi-contact: hold position. Extend the bound-cycle so the squad doesn't
             re-evaluate bounding every tick while dealing with both threats. */
          L.grant(sq, 'bound-cycle', 'squad-leader', t, t + BOUND_CYCLE, 'multi-contact hold', 'cycle expiry');
          sq._multiContactSectors = contacts.length;
          return;
        }
        sq._multiContactSectors = 0;
      }
    }
    /* Rotate teams, but skip a team whose departure would strip the base of fire: waiting a tick for
     the rotation to reach a team that can go is a missed bound. With `?slStress=pick` or `hold` every team
     that can go is a candidate, in rotation order. */
    var first = sq._boundTurn == null ? 0 : sq._boundTurn + 1,
      lead = SL_STRESS.pick || SL_STRESS.hold,
      candidates = [],
      turn,
      team,
      movers,
      holding,
      buddy;
    for (var k = 0; k < BOUND_TEAMS.length; k++) {
      turn = first + k;
      team = BOUND_TEAMS[turn % BOUND_TEAMS.length];
      movers = [];
      for (i = 0; i < members.length; i++) {
        s = members[i];
        if (s.dead || s.suppressedUntil > battle.time || s.reloading || s.clearingStoppage || s.outOfAmmo)
          continue;
        // Down, on the run or charging (Engagement's report): not his to bound.
        if (r.reacting && r.reacting.indexOf(s) >= 0) continue;
        if (
          root.SquadAI.isMachineGun(s) ||
          (root.BattleTacticalPositions && root.BattleTacticalPositions.current(s))
        )
          continue; // positional tasks hold the base of fire
        if (s._fireteamKey && s._fireteamKey !== team) continue;
        movers.push(s);
      }
      buddy = buddyBoundPreview(sq, team, movers, r.fireSupport, battle);
      movers = buddy.movers;
      holding = r.fireSupport.filter(function (man) {
        return movers.indexOf(man) < 0;
      }).length;
      if (movers.length && holding >= 2) {
        if (!lead) break;
        candidates.push({ turn: turn, team: team, movers: movers, holding: holding, stress: teamStress(movers), buddy: buddy });
      }
    }
    var pickedBy = null,
      rotation = null,
      c;
    if (lead && candidates.length) {
      rotation = candidates[0];
      c = rotation;
      if (SL_STRESS.pick)
        for (k = 1; k < candidates.length; k++) if (candidates[k].stress < c.stress) c = candidates[k];
      if (c !== rotation) pickedBy = 'calmest';
      if (
        SL_STRESS.hold &&
        candidates.every(function (x) {
          return x.stress >= LEAD_TUNING.holdAt;
        })
      ) {
        L.grant(sq, 'bound-cycle', 'squad-leader', t, t + BOUND_CYCLE, 'bound held: every team shaken', 'cycle expiry');
        telemetry(battle, 'decision-bound-held', {
          faction: sq.faction,
          squad: sq.id,
          teams: candidates.length,
          stress: +c.stress.toFixed(3)
        });
        return;
      }
      turn = c.turn;
      team = c.team;
      movers = c.movers;
      holding = c.holding;
      buddy = c.buddy;
    }
    if (!(movers.length && holding >= 2)) turn = first;
    sq._boundTurn = turn;
    if (movers.length && holding >= 2) {
      L.grant(
        sq,
        'bound',
        'squad-leader',
        t,
        t + BOUND_DURATION,
        'fireteam ' + team + ' bounds',
        'window expiry or contact broken',
        {
          team: team
        }
      );
      L.grant(
        sq,
        'bound-cycle',
        'squad-leader',
        t,
        t + BOUND_CYCLE,
        'after bound by ' + team,
        'cycle expiry'
      );
      commitBuddyCooperation(sq, buddy, battle);
      E.orderBound(movers);
      var info = {
        faction: sq.faction,
        squad: sq.id,
        team: team,
        movers: movers.length,
        holding: holding
      };
      if (lead) {
        info.stress = +c.stress.toFixed(3);
        info.rotation = rotation.team;
        info.reason = pickedBy || 'rotation';
      }
      telemetry(battle, 'decision-bound', info);
    }
  }

    return {
      teamStress: teamStress,
      leadStress: leadStress,
      stressReview: stressReview,
      fireAndMovement: fireAndMovement
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
