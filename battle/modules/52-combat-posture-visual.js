/* Visual combat-readiness continuity.
   Gameplay correctly drops a target the instant LOS is lost so hidden movement is not tracked.
   During the existing alert/suppress/orient memory window, pass animateWalk an explicit STATIC
   presentation aim point at the last-seen location. No simulation field is changed: Perception
   remains the sole normal owner of soldier.target, and presentation cannot turn memory into truth. */
(function (root) {
  'use strict';
  if (!root.BattleSoldierModel || !root.BattleEngagement || root.BattleCombatPostureVisual) return;
  var M = root.BattleSoldierModel,
    oldAnimate = M.animateWalk;
  if (typeof oldAnimate !== 'function') return;
  function eligible(s, e) {
    return !!(
      s &&
      !s.dead &&
      !s.isPlayer &&
      !s.target &&
      !s.reloading &&
      !s.clearingStoppage &&
      e &&
      e.lastSeen &&
      ['alert', 'suppress', 'orient'].indexOf(String(e.state || '')) >= 0
    );
  }
  M.animateWalk = function (s, dt, speed, presentation) {
    if (!s) return oldAnimate.apply(this, arguments);
    var e;
    try {
      e = root.BattleEngagement.stateOf(s);
    } catch (_) {
      e = s.eng;
    }
    if (!eligible(s, e)) return oldAnimate.apply(this, arguments);
    var p = e.lastSeen,
      y = s.root && s.root.position ? +s.root.position.y || 0 : 0,
      visual = Object.assign({}, presentation || {});
    visual.aimPoint = { x: +p.x || 0, y: y, z: +p.z || 0 };
    return oldAnimate.call(this, s, dt, speed, visual);
  };
  root.BattleCombatPostureVisual = { version: '2.0', input: 'animateWalk.presentation.aimPoint' };
  if (typeof console !== 'undefined')
    root.GTLog('[ANIM] combat-ready aim posture uses presentation-only last-known threat point');
})(typeof window !== 'undefined' ? window : globalThis);
