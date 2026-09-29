#!/usr/bin/env node
'use strict';
/* Loadouts: what a man is issued is a table (`SquadAI.LOADOUTS`), not a property of his role's job.

   - `ROLES` carries no weapon; `loadoutFor(role, faction)` is the only place a role picks one.
   - The default table deals exactly what the roles carried before loadouts existed (a battle is
     unchanged): sergeant SMG, rifleman rifle, gunner LMG, scout carbine, engineer rifle.
   - The issued weapon follows the loadout and the side's profile (Thompson/MP40, Garand/Kar98k...).
   - `loadoutFor` hands out a copy, so one man's change never edits the table. */
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
const BEFORE = { sergeant: 'smg', rifleman: 'rifle', gunner: 'lmg', scout: 'carbine', engineer: 'rifle' };

test('roles carry no weapon', () => {
  for (const k of Object.keys(S.ROLES)) assert.equal(S.ROLES[k].weapon, undefined, k);
});
test('default loadouts deal what the roles carried', () => {
  for (const f of ['us', 'ge'])
    for (const [role, kind] of Object.entries(BEFORE)) assert.equal(S.loadoutFor(role, f).primary, kind, f + '/' + role);
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
console.log(n + ' passed');
