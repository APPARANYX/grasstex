#!/usr/bin/env node
'use strict';
/* Loadouts: what a man is issued is a table (`SquadAI.LOADOUTS`), not a property of his role's job.

   - `ROLES` carries no weapon; `loadoutFor(role, faction)` is the only place a role picks one.
   - The default table deals exactly what the roles carried before loadouts existed (a battle is
     unchanged): sergeant SMG, rifleman rifle, gunner LMG, scout carbine, engineer rifle.
   - The issued weapon follows the loadout and the side's profile (Thompson/MP40, Garand/Kar98k...).
   - `loadoutFor` hands out a copy, so one man's change never edits the table.
   - The gun's behaviour follows the weapon in his hands, not the role on his sleeve: a man carrying
     a light machine gun emplaces it before firing and is first in line for the suppression job,
     a "gunner" handed a rifle is neither (`SquadAI.isMachineGun`). */
const assert = require('node:assert/strict'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
H.resetIds();
const r = H.bootstrap(),
  S = r.SquadAI;
const SECONDARY = { sergeant: 'pistol', gunner: 'pistol' };
const BEFORE = { sergeant: 'smg', rifleman: 'rifle', gunner: 'lmg', scout: 'carbine', engineer: 'rifle' };

test('roles carry no weapon', () => {
  for (const k of Object.keys(S.ROLES)) assert.equal(S.ROLES[k].weapon, undefined, k);
});
test('default loadouts deal what the roles carried', () => {
  for (const f of ['us', 'ge'])
    for (const [role, kind] of Object.entries(BEFORE)) assert.equal(S.loadoutFor(role, f).primary, kind, f + '/' + role);
});
test('sergeants and gunners carry a holstered sidearm, the side\'s own', () => {
  const b = H.makeBattle(r, { seed: 6 });
  for (const f of ['us', 'ge']) {
    const sq = H.addSquad(r, b, { id: f + '-s', faction: f, x: 0, z: 0, objective: { x: 0, z: 100 } });
    for (const s of sq.members) {
      const want = SECONDARY[s.role] || null;
      assert.equal(s.secondary && s.secondary.kind, want, f + '/' + s.role);
      if (want) assert.equal(s.secondary.profile, f === 'us' ? 'm1911a1' : 'p38');
    }
  }
});
test('the composition needs no other kind', () => {
  for (const role of S.COMPOSITION) assert.ok(S.LOADOUTS[role], role);
});
test('loadoutFor returns a copy', () => {
  const l = S.loadoutFor('rifleman', 'us');
  l.primary = 'lmg';
  assert.equal(S.LOADOUTS.rifleman.primary, 'rifle');
});
test('a dealt squad carries the loadout and the side\'s profile', () => {
  const b = H.makeBattle(r, { seed: 5 });
  for (const f of ['us', 'ge']) {
    const sq = H.addSquad(r, b, { id: f + '-0', faction: f, x: 0, z: f === 'us' ? 0 : 60, objective: { x: 0, z: 100 } });
    for (const s of sq.members) {
      assert.equal(s.weapon.kind, S.loadoutFor(s.role, f).primary, f + '/' + s.role);
      assert.equal(s.weapon.profile, r.BattleWeapons.profileStats(s.weapon.kind, f).model, f + '/' + s.role);
    }
  }
});
test('an abandoned weapon leaves the soldier while his holstered sidearm remains', () => {
  const b = H.makeBattle(r, { seed: 7 }), sq = H.addSquad(r, b, { id: 'us-drop', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } }),
    s = sq.members.find(x => x.role === 'sergeant'), primary = s.weapon, secondary = s.secondary;
  assert.equal(r.BattleWeapons.abandon(s, primary), true);
  assert.equal(s.weapon, null);
  assert.equal(s.secondary, secondary);
  assert.equal(r.BattleWeapons.abandon(s, primary), false, 'cannot abandon the same weapon twice');
});

function fight() {
  H.resetIds();
  const r2 = H.bootstrap(),
    b = H.makeBattle(r2, { seed: 9 });
  const us = H.addSquad(r2, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } }),
    ge = H.addSquad(r2, b, { id: 'ge-0', faction: 'ge', x: 0, z: 60, objective: { x: 0, z: -100 } });
  return { r2, b, us, ge };
}
const arm = (r2, s, kind) => (s.weapon = r2.BattleWeapons.issue({ kind, mesh: null, ammo: 0 }, s.faction));
const carrier = (sq, role) => sq.members.filter(s => s.role === role).pop();

test('a light machine gun is an emplaced weapon whoever carries it', () => {
  const { r2, b, us, ge } = fight(),
    E = r2.BattleEngagement,
    foe = ge.members[4];
  const face = s => {
    s.root.rotation.y = Math.atan2(foe.root.position.x - s.root.position.x, foe.root.position.z - s.root.position.z);
    s.target = foe;
    s.setUp = false;
    const e = E.stateOf(s);
    e.state = 'engage';
    e.fireReadyAt = 0;
  };
  const man = carrier(us, 'rifleman'),
    gun = carrier(us, 'gunner');
  arm(r2, man, 'lmg');
  arm(r2, gun, 'rifle');
  [man, gun].forEach(face);
  assert.equal(r2.SquadAI.isMachineGun(man), true);
  assert.equal(r2.SquadAI.isMachineGun(gun), false);
  assert.equal(E.fireAllowed(man, b), false, 'the borrowed gun is emplaced first');
  assert.equal(E.fireAllowed(gun, b), true, 'a rifle needs no emplacing');
  man.setUp = true;
  assert.equal(E.fireAllowed(man, b), true, 'once emplaced it fires');
});
test('the suppression job goes to the man with the machine gun first', () => {
  const { r2, b, us } = fight(),
    E = r2.BattleEngagement;
  const man = carrier(us, 'rifleman');
  arm(r2, man, 'lmg');
  arm(r2, carrier(us, 'gunner'), 'rifle');
  us.members.forEach(s => {
    s.target = null;
    s.suppressedUntil = 0;
    E.stateOf(s).state = 'alert';
  });
  us.contact = { unit: { dead: false, root: { position: { x: 0, z: 28 } } }, x: 0, z: 28, at: b.time, seenBy: 999, stance: 'stand' };
  assert.ok(E.assignSuppressors(us, b, us.members) > 0);
  assert.ok(E.stateOf(man).suppressOrder, 'the last rifleman by slot leads because he carries the gun');
});
console.log(n + ' passed');
