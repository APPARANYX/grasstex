/* Squad Leader clear-contact sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   When nobody has seen or been shot at for CLEAR_AFTER seconds and the squad still holds its
   own picture of the enemy, the Squad Leader orders it to move up on the last place the enemy
   was seen (sq.clearContact). The parent file calls the factory with its closure utilities
   and re-attaches the returned functions as closure variables, so the anchor advance and the
   fire-and-movement selector see the same functions as before. The ALERT_ADVANCE flag and the
   CLEAR_* constants stay in 16 (load-time location.search parsing) and are passed into the
   factory via ctx. */
(function (root) {
  'use strict';
  if (root._squadLeaderClearContact) return;

  /* Factory: called by 16-squad-plan-stability.js after the flags, constants and the
     fire-control re-attach are in scope. orderCanAdvance is a hoisted function declaration
     in the parent closure. */
  root._squadLeaderClearContact = function (ctx) {
    var root = ctx.root,
      telemetry = ctx.telemetry,
      dist = ctx.dist,
      orderCanAdvance = ctx.orderCanAdvance,
      setFireControl = ctx.setFireControl,
      ALERT_ADVANCE = ctx.ALERT_ADVANCE,
      CLEAR_AFTER = ctx.CLEAR_AFTER,
      CLEAR_MAX = ctx.CLEAR_MAX,
      CLEAR_ARRIVED = ctx.CLEAR_ARRIVED,
      CLEAR_HOLD_PHASES = ctx.CLEAR_HOLD_PHASES,
      FIRE_CONTROL_ON = ctx.FIRE_CONTROL_ON;
  function endClearContact(sq, battle, why) {
    if (sq.clearContact && why !== 'sighting' && why !== 'under fire') sq._clearedSeen = sq.clearContact.seen;
    if (sq.clearContact)
      telemetry(battle, 'decision-clear-contact-end', {
        faction: sq.faction,
        squad: sq.id,
        reason: why,
        seconds: battle.time - sq.clearContact.since
      });
    sq.clearContact = null;
  }
  function updateClearContact(sq, battle, r) {
    if (!ALERT_ADVANCE) return;
    var A = root.SquadAI,
      c = A.squadContact ? A.squadContact(sq, battle) : null,
      own = !!(c && (A.hasFirstHandMemory ? A.hasFirstHandMemory(c, battle) : !c.heard && !c.relayedFrom)),
      cc = sq.clearContact,
      why =
        sq.contactCount > 0
          ? 'sighting'
          : r.underFire > 0
            ? 'under fire'
            : sq.state === 'retreat'
              ? 'retreat'
              : battle.winner
                ? 'battle over'
                : CLEAR_HOLD_PHASES[sq.commandPhase || '']
                  ? 'holding phase'
                  : null;
    if (why) {
      sq._quietSince = null;
      endClearContact(sq, battle, why);
      return;
    }
    if (cc) {
      if (own) {
        cc.x = c.x;
        cc.z = c.z;
        cc.seen = c.at;
      }
      var a = sq.orderAnchor;
      if (a && dist(a, cc) <= CLEAR_ARRIVED && orderCanAdvance(sq, battle)) endClearContact(sq, battle, 'cleared');
      else if (battle.time - cc.since >= CLEAR_MAX) endClearContact(sq, battle, 'timeout');
      if (!sq.clearContact) sq._quietSince = null;
      return;
    }
    /* A picture the squad has already cleared, timed out on or left for a holding task is not ordered again. */
    if (!own || (sq._clearedSeen != null && c.at <= sq._clearedSeen)) {
      sq._quietSince = null;
      return;
    }
    if (sq._quietSince == null) sq._quietSince = battle.time;
    if (battle.time - sq._quietSince < CLEAR_AFTER) return;
    sq.clearContact = { x: c.x, z: c.z, seen: c.at, since: battle.time };
    telemetry(battle, 'decision-clear-contact', {
      faction: sq.faction,
      squad: sq.id,
      phase: sq.commandPhase || '',
      point: { x: c.x, z: c.z }
    });
    var fc = sq.fireControl;
    if (FIRE_CONTROL_ON && !(fc && fc.state === 'open'))
      setFireControl(sq, battle, fc || null, 'open', 'contact quiet: clearing', {
        targetId: fc ? fc.targetId : c.unit && c.unit.id
      });
  }

    return {
      endClearContact: endClearContact,
      updateClearContact: updateClearContact
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
