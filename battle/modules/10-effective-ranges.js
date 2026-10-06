/* Practical WW2 infantry effective ranges + battlefield spotting envelope.
   Ranges are practical tactical envelopes rather than maximum projectile travel.  The combat
   dispersion values are one-axis Gaussian sigma at 100 m; 14-z-ballistic-raycast converts them
   into a real two-dimensional shot group.  They intentionally describe a combat shooter, not a
   rifle clamped in a test fixture.

   Calibration targets (roughly 90% group diameter, rested/unsuppressed shooter):
     rifle: ~0.41 m @100 m, ~1.22 m @300 m, ~2.66 m @450 m
     deployed LMG: ~2.4 m @300 m (the gunner setup modifier tightens the base LMG group)
   Movement, suppression, stance and command degradation are layered on top by ballistics. */
(function(root){
'use strict';
if(!root.SquadAI||!root.BattleWeapons||root.BattleEffectiveRanges)return;

var EFFECTIVE={
  rifle:{range:450,falloffStart:300,combatSigmaAt100:.095,rangeDispersion:.45},
  carbine:{range:250,falloffStart:160,combatSigmaAt100:.140,rangeDispersion:.50},
  lmg:{range:500,falloffStart:300,combatSigmaAt100:.260,rangeDispersion:.50},
  pistol:{range:25,falloffStart:15,combatSigmaAt100:.200,rangeDispersion:.30},
  smg:{range:150,falloffStart:85,combatSigmaAt100:.300,rangeDispersion:.65},
  grenade:{range:35,falloffStart:35}
};
/* NOTE: visionRange is intentionally NOT overridden here. SquadAI.ROLES keeps the
   tactical spotting envelope (140-175 m): detectionRange() multiplies it by the
   target's stance/movement visibility (0.3-1.25), giving 42-219 m actual spotting,
   which matches infantry-line-of-battle scale on a 2000x1200 m map. A previous
   revision tripled visionRange to 450-575 m to "match" the combat-group weapon
   ranges below, but those ranges are read by engageRange() (weapon.stats.range) and
   only gate *aimed fire* on a target the man has already acquired by sight. With
   visionRange at 500 m, a single rifleman could spot nearly half the depth of the
   map from one position, US forces saw GE defenders on spawn, and the defend-scout
   fix (28 m advance) was useless because the defenders already had mutual LOS. */

Object.keys(EFFECTIVE).forEach(function(kind){
  var stats=root.BattleWeapons.STATS&&root.BattleWeapons.STATS[kind],cfg=EFFECTIVE[kind];
  if(!stats)return;
  stats.range=cfg.range;stats.falloffStart=cfg.falloffStart;
  if(isFinite(+cfg.combatSigmaAt100))stats.combatSigmaAt100=+cfg.combatSigmaAt100;
  if(isFinite(+cfg.rangeDispersion))stats.rangeDispersion=+cfg.rangeDispersion;
});
root.BattleEffectiveRanges={version:'1.2-spotting-restored',weapons:EFFECTIVE};
root.GTLog('[COMBAT] practical WW2 ranges + combat shot-group calibration active');
})(typeof window!=='undefined'?window:globalThis);
