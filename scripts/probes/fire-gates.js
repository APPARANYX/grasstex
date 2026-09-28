/* Who pulls the trigger, and what stops the rest. Per role: trigger pulls (sim.onFire, one per
   round), rounds by weapon kind and by profile (M1 Carbine vs FG 42), samples holding a live target, and for each such sample the first
   fire condition that fails, in the order Engagement and SquadAI check them (no target → reloading
   → fireReadyAt → moving → crawling → facing → gunner emplacement → engageRange → weapon range →
   trigger-time LOS (`los` sight, `crest` the round's line into the ground) → cooldown). `clear` means every condition held, so the man should be firing.
   `targetRange` bands the distance to the target he holds (samples).
   Observe only: chains sim.onFire (presentation callback) and reads state. */
(function (root) {
  var c;
  var AIM_CONE = 0.22,
    MOVE_FIRE_FRACTION = 0.12;
  function facingError(s, pt) {
    var p = s.root.position,
      dx = pt.x - p.x,
      dz = pt.z - p.z;
    if (Math.abs(dx) + Math.abs(dz) < 1e-5) return 0;
    var diff = Math.atan2(dx, dz) - (s.root.rotation.y || 0);
    return Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff)));
  }
  function blocker(s, sim) {
    var e = s.eng || {},
      t = s.target,
      p = s.root.position,
      q = t.root.position,
      d = Math.hypot(p.x - q.x, p.z - q.z),
      role = root.SquadAI.ROLES[s.role] || {},
      w = s.weapon || {};
    if (s.reloading || s.clearingStoppage || w.jammed) return 'reloading';
    if (w.ammo <= 0 && w.reserveAmmo <= 0) return 'dry';
    if (sim.time < (e.fireReadyAt || 0)) return 'fireReadyAt';
    if (s.moving && (s.moveSpeed || 0) > Math.max(0.16, (s.speed || 1) * MOVE_FIRE_FRACTION)) return 'moving';
    if (s.crawling) return 'crawling';
    if (facingError(s, q) > AIM_CONE) return 'facing';
    if (s.role === 'gunner' && !s.setUp && e.state === 'engage') return 'emplacing';
    if (d > (root.SquadAI.engageRange ? root.SquadAI.engageRange(s) : role.engageRange)) return 'engageRange';
    if (w.stats && d > w.stats.range) return 'weaponRange';
    var G = root.BattleDirectFireLOSGate;
    if (G && G.blocked(s, sim)) return (G.blockReason && G.blockReason(s, sim)) || 'los';
    if (s.fireCooldown > 0) return 'cooldown';
    return 'clear';
  }
  function bucket(role) {
    return (c.byRole[role] = c.byRole[role] || {
      pulls: 0,
      rounds: 0,
      targetSamples: 0,
      states: {},
      blocked: {},
      targetRange: {}
    });
  }
  (root.BattleProbes = root.BattleProbes || {})['fire-gates'] = {
    every: 0,
    start: function (sim) {
      c = { byRole: {}, roundsByKind: {}, roundsByProfile: {} };
      var old = sim.onFire;
      sim.onFire = function (s, delay) {
        if (old) old.apply(sim, arguments);
        var b = bucket(s.role);
        b.rounds++;
        if (!delay) b.pulls++;
        var k = (s.weapon && s.weapon.kind) || '?';
        c.roundsByKind[k] = (c.roundsByKind[k] || 0) + 1;
        var pr = (s.weapon && s.weapon.profile) || k;
        c.roundsByProfile[pr] = (c.roundsByProfile[pr] || 0) + 1;
      };
    },
    sample: function (sim) {
      var men = root.BattleModules.unitsFor(sim);
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!s || s.dead || !s.weapon || !s.target || s.target.dead || !s.root || !s.target.root) continue;
        var b = bucket(s.role),
          why = blocker(s, sim),
          st = (s.eng && s.eng.state) || '?';
        b.targetSamples++;
        b.blocked[why] = (b.blocked[why] || 0) + 1;
        b.states[st] = (b.states[st] || 0) + 1;
        var q = s.target.root.position,
          d = Math.hypot(s.root.position.x - q.x, s.root.position.z - q.z),
          band =
            d < 50
              ? '<50'
              : d < 100
                ? '50-100'
                : d < 150
                  ? '100-150'
                  : d < 250
                    ? '150-250'
                    : d < 350
                      ? '250-350'
                      : '350+';
        b.targetRange[band] = (b.targetRange[band] || 0) + 1;
      }
    },
    report: function () {
      return c;
    }
  };
})(window);
