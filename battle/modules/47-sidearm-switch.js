/* Sidearm switching. A man with a holstered sidearm (`soldier.secondary`, dealt by his loadout)
   puts it in his hands when his primary cannot do the job, and takes the primary back after.

   Draw (target within NEAR): the primary is out of action (reloading, clearing a stoppage, empty),
   or the target is within CLOSE and the primary is clumsy at arm's length (a light machine gun, a
   rifle, a carbine). A submachine gun is not, so a sergeant draws only when his SMG is out of action.
   Return: after HOLD, once the target is past LEAVE or gone, or when the sidearm runs dry.

   Owner: this module, on SquadAI's declared `beforeSoldier` slot. It changes which weapon is in the
   hand (`BattleWeapons.equip`); shooting, ammunition, ranges and the pose all follow `soldier.weapon`.
   It writes no stance, no destination and draws nothing from the combat RNG. The draw costs DRAW
   seconds before the next shot (Engagement's `fireReadyAt`) and unemplaces a machine gun. A cycle
   the primary was in (reload, stoppage) is abandoned, not carried onto the pistol; a jammed primary
   stays jammed until it comes back, then is cleared at the cost of CLEAR seconds. */
(function (root) {
  'use strict';
  if (!root.SquadAI || !root.BattleWeapons || !root.BattleEngagement || root.BattleSidearm) return;

  var T = { DRAW: 0.7, CLEAR: 1.2, NEAR: 20, CLOSE: 8, HOLD: 3, LEAVE: 35 },
    CLUMSY = { lmg: 1, rifle: 1, carbine: 1 };

  function rounds(w) {
    return w ? Math.max(0, +w.ammo || 0) + Math.max(0, +w.reserveAmmo || 0) : 0;
  }
  function outOfAction(s) {
    var w = s.weapon;
    return !!(s.reloading || s.clearingStoppage || w.jammed || !(+w.ammo > 0));
  }
  function stats(battle) {
    return battle._sidearm || (battle._sidearm = { draws: 0, returns: 0, drawsBy: {}, returnsBy: {} });
  }
  function bump(o, k) {
    o[k] = (o[k] || 0) + 1;
  }
  function swap(s, battle, cost) {
    root.BattleWeapons.equip(s, s.secondary);
    s.reloading = false;
    s.reloadUntil = 0;
    s.clearingStoppage = false;
    s.stoppageUntil = 0;
    s.setUp = false;
    s.outOfAmmo = rounds(s.weapon) <= 0;
    var e = root.BattleEngagement.stateOf(s),
      ready = battle.time + cost;
    e.setUpSince = 0;
    e.fireReadyAt = Math.max(+e.fireReadyAt || 0, ready);
    s.fireCooldown = Math.max(+s.fireCooldown || 0, cost);
  }
  function draw(s, battle, why) {
    swap(s, battle, T.DRAW);
    s._sidearmSince = battle.time;
    var st = stats(battle);
    st.draws++;
    bump(st.drawsBy, why);
  }
  function putAway(s, battle, why) {
    swap(s, battle, T.DRAW);
    s._sidearmSince = null;
    var cost = T.DRAW;
    if (s.weapon.jammed) {
      s.weapon.jammed = false;
      cost += T.CLEAR;
      var e = root.BattleEngagement.stateOf(s);
      e.fireReadyAt = Math.max(+e.fireReadyAt || 0, battle.time + cost);
      s.fireCooldown = Math.max(+s.fireCooldown || 0, cost);
    }
    var st = stats(battle);
    st.returns++;
    bump(st.returnsBy, why);
  }
  function distance(s, t) {
    var a = s.root.position,
      b = t.root.position;
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function step(s, battle) {
    if (!s || s.dead || !s.secondary || !s.weapon) return;
    var t = s.target && !s.target.dead && s.target.root ? s.target : null,
      d = t ? distance(s, t) : Infinity;
    if (s._sidearmSince == null) {
      if (!t || d > T.NEAR || rounds(s.secondary) <= 0) return;
      if (outOfAction(s)) draw(s, battle, 'primary-out');
      else if (d <= T.CLOSE && CLUMSY[s.weapon.kind]) draw(s, battle, 'close');
      return;
    }
    if (battle.time - s._sidearmSince < T.HOLD) return;
    if (rounds(s.weapon) <= 0) putAway(s, battle, 'sidearm-dry');
    else if (d > T.LEAVE) putAway(s, battle, 'clear-of-contact');
  }

  root.SquadAI.extend('beforeSoldier', 'sidearm', step);
  root.BattleSidearm = { step: step, tuning: T, stats: stats };
})(typeof window !== 'undefined' ? window : globalThis);
