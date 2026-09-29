#!/usr/bin/env node
'use strict';
/* Sidearm switching (module 47, SquadAI `beforeSoldier` slot 'sidearm').

   A man with a holstered sidearm draws it when the target is within NEAR and his primary cannot
   fire (reloading, clearing a stoppage, empty), or when the target is within CLOSE and his primary
   is a long gun that is clumsy at arm's length (light machine gun, rifle, carbine). A submachine
   gun is not clumsy, so a sergeant draws only when his SMG is out of action. He puts the primary
   back once the target is past LEAVE (or gone) after HOLD seconds, or when the sidearm runs dry.
   - the draw takes DRAW seconds before the first shot and unemplaces a machine gun
   - the swap keeps `soldier.weapon` the one in hand (stats, kind, pose follow it)
   - a jam on the primary is not cleared by drawing; it is when the primary comes back, at a cost
   - no combat-RNG draw, no stance write, no change to a man with no sidearm */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
function setup() {
  H.resetIds();
  const r = H.bootstrap();
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  load(r, 'battle/modules/46-ammunition-stoppages.js');
  load(r, 'battle/modules/10-effective-ranges.js');
  load(r, 'battle/modules/47-sidearm-switch.js');
  const b = H.makeBattle(r, { seed: 4 });
  const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } }),
    ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 200, objective: { x: 0, z: -100 } });
  [...us.members, ...ge.members].forEach(s => r.BattleAmmunition.initialize(s, b));
  return { r, b, us, ge };
}
const role = (sq, name) => sq.members.find(s => s.role === name);
function aim(s, foe, metres) {
  foe.root.position.x = s.root.position.x;
  foe.root.position.z = s.root.position.z + metres;
  s.target = foe;
}
const tick = (r, b, s) => {
  b.time += H.AI_TICK;
  r.BattleSidearm.step(s, b);
};

test('a machine gunner at arm\'s length draws his pistol, unemplaced, after the draw time', () => {
  const { r, b, us, ge } = setup(),
    mg = role(us, 'gunner');
  const gun = mg.weapon;
  mg.setUp = true;
  aim(mg, role(ge, 'rifleman'), 6);
  const t0 = b.time;
  tick(r, b, mg);
  assert.equal(mg.weapon.kind, 'pistol');
  assert.equal(mg.secondary, gun, 'the gun is holstered, not lost');
  assert.equal(mg.setUp, false);
  assert.ok(r.BattleEngagement.stateOf(mg).fireReadyAt >= t0 + r.BattleSidearm.tuning.DRAW - 1e-9, 'no shot before the draw is done');
  assert.equal(r.SquadAI.isMachineGun(mg), false);
});
test('the same gunner at 12 m keeps his gun; a sergeant with a working SMG never draws', () => {
  const { r, b, us, ge } = setup(),
    mg = role(us, 'gunner'),
    sgt = role(us, 'sergeant');
  aim(mg, role(ge, 'rifleman'), 12);
  aim(sgt, role(ge, 'gunner'), 5);
  tick(r, b, mg);
  tick(r, b, sgt);
  assert.equal(mg.weapon.kind, 'lmg');
  assert.equal(sgt.weapon.kind, 'smg');
});
test('a primary out of action within NEAR gives the sidearm to any carrier; beyond NEAR it does not', () => {
  for (const [why, mutate] of [
    ['jammed', (s, b) => r0.BattleAmmunition.startStoppage(s, b)],
    ['reloading', (s, b) => ((s.weapon.ammo = 0), r0.BattleAmmunition.startReload(s, b))],
    ['dry', s => ((s.weapon.ammo = 0), (s.weapon.reserveAmmo = 0))]
  ]) {
    var r0;
    for (const [rl, near] of [['sergeant', 15], ['gunner', 15], ['sergeant', 30]]) {
      const { r, b, us, ge } = setup();
      r0 = r;
      const s = role(us, rl);
      aim(s, role(ge, 'rifleman'), near);
      mutate(s, b);
      tick(r, b, s);
      assert.equal(s.weapon.kind === 'pistol', near <= 20, rl + ' ' + why + ' at ' + near + ' m');
      if (near <= 20) assert.equal(!!(s.reloading || s.clearingStoppage), false, 'the abandoned cycle is not run on the pistol');
    }
  }
});
test('no sidearm, no change; a dry sidearm is not drawn', () => {
  const { r, b, us, ge } = setup(),
    rifle = role(us, 'rifleman'),
    mg = role(us, 'gunner');
  aim(rifle, role(ge, 'rifleman'), 4);
  rifle.weapon.ammo = 0;
  tick(r, b, rifle);
  assert.equal(rifle.weapon.kind, 'rifle');
  mg.secondary.ammo = 0;
  mg.secondary.reserveAmmo = 0;
  aim(mg, role(ge, 'rifleman'), 4);
  tick(r, b, mg);
  assert.equal(mg.weapon.kind, 'lmg');
});
test('the primary comes back after HOLD once the target is past LEAVE, with its jam cleared at a cost', () => {
  const { r, b, us, ge } = setup(),
    mg = role(us, 'gunner'),
    foe = role(ge, 'rifleman'),
    T = r.BattleSidearm.tuning;
  aim(mg, foe, 15);
  r.BattleAmmunition.startStoppage(mg, b);
  tick(r, b, mg);
  assert.equal(mg.weapon.kind, 'pistol');
  const gun = mg.secondary;
  assert.equal(gun.jammed, true, 'drawing does not clear the jam');
  aim(mg, foe, T.LEAVE + 5);
  tick(r, b, mg);
  assert.equal(mg.weapon.kind, 'pistol', 'held for at least HOLD');
  b.time += T.HOLD;
  const t = b.time;
  tick(r, b, mg);
  assert.equal(mg.weapon.kind, 'lmg');
  assert.equal(gun.jammed, false);
  assert.ok(r.BattleEngagement.stateOf(mg).fireReadyAt > t + T.DRAW, 'clearing it while re-shouldering costs time');
});
test('a dry sidearm is put away for the primary even inside NEAR', () => {
  const { r, b, us, ge } = setup(),
    sgt = role(us, 'sergeant'),
    foe = role(ge, 'rifleman');
  aim(sgt, foe, 10);
  sgt.weapon.ammo = 0;
  sgt.weapon.reserveAmmo = 0;
  tick(r, b, sgt);
  assert.equal(sgt.weapon.kind, 'pistol');
  sgt.weapon.ammo = 0;
  sgt.weapon.reserveAmmo = 0;
  b.time += r.BattleSidearm.tuning.HOLD;
  tick(r, b, sgt);
  assert.equal(sgt.weapon.kind, 'smg');
});
test('switching draws no combat RNG and writes no stance', () => {
  const { r, b, us, ge } = setup(),
    mg = role(us, 'gunner');
  let draws = 0;
  const rnd = b.random;
  b.random = function () {
    draws++;
    return rnd.call(b);
  };
  mg.prone = true;
  mg.crouching = false;
  aim(mg, role(ge, 'rifleman'), 5);
  tick(r, b, mg);
  aim(mg, role(ge, 'rifleman'), 60);
  b.time += 10;
  tick(r, b, mg);
  assert.equal(draws, 0);
  assert.equal(mg.prone, true);
});
test('the drawn sidearm fires as a pistol: its stats, its range', () => {
  const { r, b, us, ge } = setup(),
    mg = role(us, 'gunner'),
    foe = role(ge, 'rifleman');
  aim(mg, foe, 15);
  r.BattleAmmunition.startStoppage(mg, b);
  tick(r, b, mg);
  assert.equal(mg.weapon.profile, 'm1911a1');
  assert.equal(r.SquadAI.engageRange(mg), mg.weapon.stats.range);
  assert.ok(mg.weapon.stats.range <= 60);
});
console.log(n + ' passed');
