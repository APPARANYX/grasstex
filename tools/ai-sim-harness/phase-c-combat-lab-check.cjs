/* TEMPORARY unit contract for scripts/probes/phase_c_combat_lab_hooks.js.
   No gameplay files or acceptance assertions are changed. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('scripts/probes/phase_c_combat_lab_hooks.js', 'utf8');
const expected = {
  A: [false, false, false, false],
  B: [true, false, false, false],
  C: [false, true, false, false],
  D: [true, true, false, false],
  E: [true, false, true, false],
  F: [true, true, false, true]
};
for (const [variant, [immortal, silent, harmless, stationary]] of Object.entries(expected)) {
  const calls = { fire: [], area: [], hits: [], grenades: [], pin: [] };
  const us = { faction: 'us', id: 10, hp: 100, suppressedUntil: 0,
    root: { position: { x: 0, y: 1, z: 0 } } };
  const ge = { faction: 'ge', id: 20, hp: 100, suppressedUntil: 0,
    root: { position: { x: 10, y: 1, z: 10 } } };
  const root = {
    SquadAI: {
      tryFire: (sh) => { calls.fire.push(sh.faction); return true; },
      areaFire: (sh) => { calls.area.push(sh.faction); return 2; },
      applyHit: (sh, victim) => {
        calls.hits.push(sh.faction + '>' + victim.faction);
        victim.hp -= 25;
        return { outcome: 'wounded', damage: 25 };
      },
      pin: (victim, battle, seconds) => {
        calls.pin.push(victim.faction);
        victim.suppressedUntil = Math.max(victim.suppressedUntil, battle.time + seconds);
      }
    },
    BattleWounds: {
      wound: (sh, victim) => { calls.hits.push('blast:' + sh.faction);
        victim.hp -= 25; return { outcome: 'wounded', damage: 25 }; }
    },
    BattleGrenades: {
      consider: (s) => { calls.grenades.push(s.faction); return true; },
      playerThrow: (s) => { calls.grenades.push('player:' + s.faction); return true; }
    },
    BattleEngagement: {}
  };
  vm.runInNewContext(code, root, { filename: 'phase_c_combat_lab_hooks.js' });
  const battle = { time: 10, rosterOf: f => f === 'ge' ? [ge] : [us] };
  const origFire = root.SquadAI.tryFire;
  const origArea = root.SquadAI.areaFire;
  const origHit = root.SquadAI.applyHit;
  const origWound = root.BattleWounds.wound;
  const lab = root.PhaseCCombatLab.install(battle, variant);
  assert.equal(lab.code, variant);
  assert.equal(root.SquadAI.tryFire(ge, battle), !silent);
  assert.equal(root.SquadAI.areaFire(ge, {x:0,z:0}, battle), silent ? 0 : 2);
  assert.equal(!!root.BattleGrenades.consider(ge, battle), !silent);
  assert.equal(root.SquadAI.tryFire(us, battle), true);
  const geBefore = ge.hp, usBefore = us.hp;
  root.SquadAI.applyHit(us, ge, battle, { zone: 'chest' });
  assert.equal(ge.hp, geBefore - (immortal ? 0 : 25), 'German hit isolation ' + variant);
  root.SquadAI.applyHit(ge, us, battle, { zone: 'leg' });
  assert.equal(us.hp, usBefore - (harmless ? 0 : 25), 'American damage isolation ' + variant);
  root.BattleWounds.wound(us, ge, battle, { blast: true, zone: 'leg' });
  assert.equal(ge.hp, geBefore - (immortal ? 0 : 50), 'German grenade isolation ' + variant);
  if (harmless) {
    const prior = us.hp;
    root.BattleWounds.wound(ge, us, battle, { blast: true, zone: 'leg' });
    assert.equal(us.hp, prior, 'German blast must be harmless to Americans in E');
  }
  if (immortal) assert.ok(ge.suppressedUntil > battle.time, 'German hit still triggers native pin');
  if (harmless) assert.ok(us.suppressedUntil > battle.time, 'US hit still triggers native pin');
  const initial = ge.root.position.x;
  ge.root.position.x += 8;
  assert.equal(ge.root.position.x, initial + (stationary ? 0 : 8), 'Stationary physical lock');
  lab.assertInvariants();
  lab.restore();
  assert.strictEqual(root.SquadAI.tryFire, origFire);
  assert.strictEqual(root.SquadAI.areaFire, origArea);
  assert.strictEqual(root.SquadAI.applyHit, origHit);
  assert.strictEqual(root.BattleWounds.wound, origWound);
  ge.root.position.x += 1;
  assert.equal(ge.root.position.x, initial + (stationary ? 1 : 9), 'Transform unlocked');
  assert.ok(!silent || !calls.fire.includes('ge'), 'No silent German native discharge');
  assert.ok(!silent || !calls.area.includes('ge'), 'No silent German native area fire');
}
console.log('PASS Phase C combat lab A-F isolated effects, original hooks and transform restoration');
