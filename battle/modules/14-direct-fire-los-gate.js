/* Trigger-time line-of-sight gate for direct fire.
   Perception already requires LOS, but a man can change stance or slide behind cover between
   target acquisition and the trigger pull.  Direct fire must therefore prove LOS again at the
   instant of firing.  Suppressive area fire keeps its separate canSuppress() semantics. */
(function (root) {
  'use strict';
  if (!root.SquadAI || root.BattleDirectFireLOSGate) return;

  if (typeof root.SquadAI.extend !== 'function' || typeof root.SquadAI.hasLineOfSight !== 'function') return;

  /* Sight runs eye to eye, but the round flies eye to body centre, ~0.7 m lower on a standing man.
     Over a crest the first can clear while the ground takes the second, so the gate also asks the
     ballistics owner whether the round's own line reaches the body. Spotting is unchanged: he
     still sees the head, he just does not fire into the slope. */
  function crestBlocked(s, battle) {
    var B = root.BattleBallistics;
    return !!(B && typeof B.fireLineBlocked === 'function' && B.fireLineBlocked(s, s.target, battle));
  }
  /* Why a shot is refused now: 'los' (no sight of him), 'crest' (sight, but the round's line meets
     the ground first) or '' (clear). The catch previously returned '' (clear to fire) on any error
     in hasLineOfSight or fireLineBlocked, which masked bugs as "always clear to fire"; it now
     refuses the shot ('los') and counts the failure so it surfaces in diagnostics. */
  function blockReason(s, battle) {
    if (!s || !battle || !s.target || s.target.dead || !s.root || !s.target.root) return 'los';
    try {
      if (!root.SquadAI.hasLineOfSight(s, s.target, battle.heightAt, battle.obstacles)) return 'los';
      return crestBlocked(s, battle) ? 'crest' : '';
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[FIRE] LOS gate error (refusing shot):', e);
      s._losGateErrors = (s._losGateErrors || 0) + 1;
      return 'los';
    }
  }
  function blocked(s, battle) {
    return !!blockReason(s, battle);
  }

  /* SquadAI's fireGate slot runs this after the ammunition gate, immediately before the shot. */
  root.SquadAI.extend('fireGate', 'direct-fire-los', function (s, battle) {
    if (!s || !battle || !s.target || s.target.dead) return false;
    var why = blockReason(s, battle);
    if (why) {
      /* Two counters: a man pressing the trigger with no sight of the target is a defect the
         benchmark scores; a man holding fire because the crest would take the round is the gate
         doing its job, reported on its own. */
      if (why === 'crest') s._crestBlockedFire = (s._crestBlockedFire || 0) + 1;
      else s._losBlockedFire = (s._losBlockedFire || 0) + 1;
      s._losBlockedFireAt = +battle.time || 0;
      return false;
    }
    return true;
  });

  root.BattleDirectFireLOSGate = {
    version: '66-trigger-los-fire-line',
    blocked: blocked,
    blockReason: blockReason,
    blockedCount: function (s) {
      return (s && s._losBlockedFire) || 0;
    }
  };
  if (typeof console !== 'undefined') console.log('[FIRE] trigger-time stance-aware LOS gate active');
})(typeof window !== 'undefined' ? window : globalThis);
