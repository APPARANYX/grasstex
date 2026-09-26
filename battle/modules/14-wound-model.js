/* Wounds and incapacitation: what a round that struck a man does to him.

   The ballistic ray says where it struck (head, chest, abdomen, arm or leg, from where it met the
   body volume); this module owns what follows. Soldiers are taken out of the fight the way the
   wound-ballistics literature describes, not by an even hit-point count:

     head     a rifle, MG or pistol round to the head drops a man outright;
     chest    heart, lungs and spine: most full-power rifle hits drop him at once, and a man who
              stays up is bleeding hard and goes down within seconds to a minute;
     abdomen  seldom drops him at once, bleeds steadily;
     arm      rarely stops him, but his shooting falls apart;
     leg      takes a few hits, or one and a long bleed; each one slows him.

   A casualty is a man out of the fight, dead or incapacitated alike: both go through killSoldier.
   The zone's drop chance scales with the cartridge (`power` on the weapon: .30-06 and 7.92 mm 1.0,
   .30 Carbine ~.6, pistol-calibre SMG and sidearm ~.5). Bleeding eases off as the man gets pressure
   on it (BLEED_TAU), and a man who loses enough collapses before his hit points reach zero.

   Owner: the SquadAI `woundModel` slot. Draws two combat-RNG numbers per hit (severity and drop)
   and none per frame. */
(function (root) {
  'use strict';
  if (!root.SquadAI || !root.BattleModules || root.BattleWounds) return;

  /* damage: multiple of the weapon's torso wound severity; drop: chance a full-power round drops him
     at once; bleed: hp/s while it bleeds; speed / sigma: movement and shot-group multipliers. */
  var ZONES = {
    head: { damage: 4, drop: 0.95, bleed: 0 },
    chest: { damage: 1.5, drop: 0.55, bleed: 1.2, sigma: 1.15 },
    abdomen: { damage: 1.1, drop: 0.25, bleed: 0.7, speed: 0.85, sigma: 1.1 },
    arm: { damage: 0.35, drop: 0.03, bleed: 0.15, sigma: 1.4 },
    leg: { damage: 0.4, drop: 0.1, bleed: 0.3, speed: 0.6 }
  };
  /* Share of hits per zone on a standing man, for shots that do not report where they struck. */
  var ZONE_ODDS = [
    ['leg', 0.42],
    ['abdomen', 0.14],
    ['chest', 0.26],
    ['arm', 0.14],
    ['head', 0.04]
  ];
  var BLEED_TAU = 30,
    BLEED_STOP = 0.02,
    COLLAPSE_HP = 10,
    SHOCK = 1.2,
    MIN_SPEED = 0.35,
    MAX_SIGMA = 2.2;

  function rand(b) {
    return b && typeof b.random === 'function' ? b.random() : Math.random();
  }
  function fresh() {
    var z = {};
    Object.keys(ZONES).forEach(function (k) {
      z[k] = { hits: 0, dropped: 0, killed: 0, bledOut: 0 };
    });
    return { hits: 0, wounded: 0, dropped: 0, killed: 0, bledOut: 0, byZone: z };
  }
  function state(battle) {
    return battle._wounds || (battle._wounds = { stats: fresh(), bleeding: [] });
  }
  function rollZone(battle) {
    var r = rand(battle);
    for (var i = 0; i < ZONE_ODDS.length; i++) if ((r -= ZONE_ODDS[i][1]) < 0) return ZONE_ODDS[i][0];
    return 'chest';
  }
  function casualty(battle, s, zone, cause, by) {
    var st = state(battle).stats;
    st[cause]++;
    if (st.byZone[zone]) st.byZone[zone][cause]++;
    s.casualty = { zone: zone, cause: cause, at: +battle.time || 0, by: by ? by.id : null };
    battle.killSoldier(s, by || null);
  }

  function wound(shooter, victim, battle, hit) {
    var stats = shooter.weapon.stats,
      zone = (hit && ZONES[hit.zone] && hit.zone) || rollZone(battle),
      z = ZONES[zone],
      power = isFinite(+stats.power) ? +stats.power : 1,
      scale = 0.5 + 0.5 * power,
      damage = stats.damage * z.damage * (0.85 + rand(battle) * 0.3),
      dropped = rand(battle) < z.drop * scale,
      st = state(battle);
    st.stats.hits++;
    st.stats.byZone[zone].hits++;
    victim.hp -= damage;
    (victim.wounds || (victim.wounds = [])).push({ zone: zone, at: +battle.time || 0, by: shooter.id });
    victim._lastHitBy = shooter;
    if (victim.hp <= COLLAPSE_HP || dropped) {
      casualty(battle, victim, zone, victim.hp <= 0 ? 'killed' : 'dropped', shooter);
      return { zone: zone, outcome: victim.casualty.cause, damage: damage };
    }
    st.stats.wounded++;
    if (z.bleed > 0) {
      if (!(victim.bleedRate > 0)) st.bleeding.push(victim);
      victim.bleedRate = (victim.bleedRate || 0) + z.bleed * scale;
    }
    if (z.speed) victim.woundSpeed = Math.max(MIN_SPEED, (victim.woundSpeed || 1) * z.speed);
    if (z.sigma) victim.woundSigma = Math.min(MAX_SIGMA, (victim.woundSigma || 1) * z.sigma);
    /* Being hit and staying up still puts a man down behind whatever he has for a moment. */
    victim.suppressedUntil = Math.max(victim.suppressedUntil || 0, (+battle.time || 0) + SHOCK);
    return { zone: zone, outcome: 'wounded', damage: damage };
  }

  function bleed(sim, dt) {
    var st = sim && sim._wounds;
    if (!st || !st.bleeding.length || !(dt > 0)) return;
    var ease = Math.exp(-dt / BLEED_TAU);
    for (var i = st.bleeding.length - 1; i >= 0; i--) {
      var s = st.bleeding[i];
      if (s.dead) {
        st.bleeding.splice(i, 1);
        continue;
      }
      s.hp -= s.bleedRate * dt;
      s.bleedRate *= ease;
      if (s.hp <= COLLAPSE_HP) {
        st.bleeding.splice(i, 1);
        var last = s.wounds && s.wounds[s.wounds.length - 1];
        casualty(sim, s, last ? last.zone : 'chest', 'bledOut', s._lastHitBy);
      } else if (s.bleedRate < BLEED_STOP) {
        s.bleedRate = 0;
        st.bleeding.splice(i, 1);
      }
    }
  }
  function reset(sim) {
    sim._wounds = { stats: fresh(), bleeding: [] };
  }
  function summary(sim) {
    var st = sim && sim._wounds;
    return st ? JSON.parse(JSON.stringify(st.stats)) : fresh();
  }

  root.SquadAI.extend('woundModel', 'wounds', wound);
  root.BattleModules.registerSystem('wound-model', {
    version: '1.0',
    onBattleStart: reset,
    onBattleRestart: reset,
    onSimulationStep: function (sim, payload) {
      bleed(sim, payload && +payload.dt);
    },
    onCommanderTick: function (sim) {
      if (sim._coordinationHealth) sim._coordinationHealth.wounds = summary(sim);
    }
  });
  root.BattleWounds = {
    version: '1.0',
    ZONES: ZONES,
    COLLAPSE_HP: COLLAPSE_HP,
    BLEED_TAU: BLEED_TAU,
    wound: wound,
    bleed: bleed,
    reset: reset,
    summary: summary
  };
  if (typeof console !== 'undefined') console.log('[WOUNDS] hit-zone incapacitation + bleeding active');
})(typeof window !== 'undefined' ? window : globalThis);
