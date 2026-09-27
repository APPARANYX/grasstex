#!/usr/bin/env node
'use strict';
/* Weapon cadence and wounds.

   - Each side is issued its own weapon for a kind (Garand/Kar98k, M1919A6/MG42, Thompson/MP40).
   - An automatic trigger pull is a burst at the cyclic rate: the rounds are resolved on one AI tick
     and carry their offsets for presentation, and the sustained rate is burst + re-lay pause.
   - A burst stops when the belt or magazine runs dry (the ammunition roundGate).
   - Hit zones come from where the ray met the body; the wound model drops a man on a head or most
     chest hits, takes several leg hits, and bleeds a survivor out over time.
   Mechanism, not dice: rates are checked against their own configured cadence, drop rates against
   their configured odds over thousands of hits. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
/* The shipping sources announce themselves on load; keep this check's output to its own lines. */
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
function setup(opts) {
  opts = opts || {};
  H.resetIds();
  const r = H.bootstrap();
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  if (opts.ammo) load(r, 'battle/modules/46-ammunition-stoppages.js');
  if (opts.ranges) load(r, 'battle/modules/10-effective-ranges.js');
  /* Every round misses: cadence is about the trigger, not the dice. */
  if (opts.miss) r.SquadAI.extend('shotModel', 'ballistics', () => false);
  const b = H.makeBattle(r, { seed: opts.seed || 99 });
  const fired = [];
  b.onFire = (s, delay) => fired.push({ id: s.id, t: b.time, delay: delay || 0 });
  const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  const ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 60, objective: { x: 0, z: -100 } });
  return { r, b, us, ge, fired };
}
const role = (sq, name) => sq.members.find(s => s.role === name);
/* Hold the trigger for `seconds` at the AI tick, the way Engagement calls tryFire. */
function hold(r, b, s, target, seconds) {
  s.target = target;
  for (let t = 0; t < seconds; t += H.AI_TICK) {
    b.time += H.AI_TICK;
    s.fireCooldown = Math.max(0, s.fireCooldown - H.AI_TICK);
    r.SquadAI.tryFire(s, b);
  }
}

test('each side carries its own weapon for a kind', () => {
  const { us, ge } = setup();
  const w = (sq, rl) => role(sq, rl).weapon;
  assert.equal(w(us, 'rifleman').profile, 'm1-garand');
  assert.equal(w(ge, 'rifleman').profile, 'kar98k');
  assert.equal(w(us, 'gunner').profile, 'm1919a6');
  assert.equal(w(ge, 'gunner').profile, 'mg42');
  assert.equal(w(us, 'sergeant').profile, 'thompson');
  assert.equal(w(ge, 'sergeant').profile, 'mp40');
  assert.equal(w(ge, 'rifleman').magSize, 5, 'Kar98k: 5-round stripper clip');
  assert.equal(w(us, 'rifleman').magSize, 8, 'Garand: 8-round en-bloc clip');
  assert.equal(w(ge, 'gunner').stats.cyclic, 20, 'MG42 ~1,200 rpm');
  assert.equal(w(us, 'gunner').stats.cyclic, 8, 'M1919A6 ~480 rpm');
  /* Profiles inherit the kind's practical range, so 10-effective-ranges applies to both sides. */
  assert.equal(w(ge, 'gunner').stats.range, w(us, 'gunner').stats.range);
});

test('an automatic trigger pull is a burst at the cyclic rate', () => {
  const { r, b, ge, us, fired } = setup({ miss: true });
  const mg = role(ge, 'gunner'),
    st = mg.weapon.stats;
  mg.fireCooldown = 0;
  mg.target = role(us, 'rifleman');
  r.SquadAI.tryFire(mg, b);
  const burst = fired.filter(f => f.id === mg.id);
  assert.ok(burst.length >= st.burst[0] && burst.length <= st.burst[1], 'burst of ' + burst.length);
  burst.forEach((f, i) =>
    assert.ok(Math.abs(f.delay - i / st.cyclic) < 1e-9, 'round ' + i + ' at the cyclic rate')
  );
  assert.ok(
    mg.fireCooldown >= burst.length / st.cyclic + st.burstPause * 0.85 - 1e-9,
    're-lay pause follows the burst'
  );
});

test('sustained rates follow each weapon: MG42 > M1919A6, Garand > Kar98k', () => {
  const rate = (faction, roleName) => {
    const { r, b, us, ge, fired } = setup({ miss: true, seed: 7 });
    const sq = faction === 'us' ? us : ge,
      foe = faction === 'us' ? ge : us,
      s = role(sq, roleName);
    s.fireCooldown = 0;
    hold(r, b, s, role(foe, 'rifleman'), 60);
    return fired.filter(f => f.id === s.id).length / 60;
  };
  const mg42 = rate('ge', 'gunner'),
    m1919 = rate('us', 'gunner'),
    garand = rate('us', 'rifleman'),
    kar = rate('ge', 'rifleman');
  /* Expected from the tables: burst / (burst / cyclic + pause), quantised to the 0.15 s tick. */
  if (process.env.RATES) log({ mg42, m1919, garand, kar });
  assert.ok(mg42 > 4 && mg42 < 7.5, 'MG42 ' + mg42.toFixed(2) + ' rds/s');
  assert.ok(m1919 > 2.3 && m1919 < 4.5, 'M1919A6 ' + m1919.toFixed(2) + ' rds/s');
  assert.ok(mg42 > m1919 * 1.3, 'the MG42 out-fires the M1919A6');
  assert.ok(garand > 0.7 && garand < 1.1, 'Garand ' + garand.toFixed(2) + ' aimed rds/s');
  assert.ok(kar > 0.35 && kar < 0.6, 'Kar98k ' + kar.toFixed(2) + ' aimed rds/s');
});

test('a burst stops when the belt runs dry and the gun reloads', () => {
  const { r, b, ge, us, fired } = setup({ miss: true, ammo: true });
  const mg = role(ge, 'gunner');
  r.BattleAmmunition.initialize(mg, b);
  mg.weapon.ammo = 2;
  mg.fireCooldown = 0;
  mg.target = role(us, 'rifleman');
  assert.equal(r.SquadAI.tryFire(mg, b), true);
  assert.equal(fired.filter(f => f.id === mg.id).length, 2, 'only the rounds left in the belt');
  assert.equal(mg.reloading, true);
});

test('scouts: US M1 Carbine, GE FG 42 on the full-power round with the rifle reach', () => {
  const { r, us, ge } = setup({ ranges: true });
  const carbine = role(us, 'scout'),
    fg = role(ge, 'scout');
  assert.equal(carbine.weapon.profile, 'm1-carbine');
  assert.equal(fg.weapon.profile, 'fg42');
  assert.equal(fg.weapon.magSize, 20, 'FG 42: 20-round box');
  assert.equal(fg.weapon.stats.power, role(ge, 'rifleman').weapon.stats.power, 'the Kar98k cartridge');
  assert.equal(carbine.weapon.stats.range, 250, 'M1 Carbine ~180-270 m');
  assert.equal(
    fg.weapon.stats.range,
    role(ge, 'rifleman').weapon.stats.range,
    'FG 42 reaches as far as the Kar98k'
  );
  /* One role, two reaches: the weapon caps the doctrine range, and nobody else's range moves. */
  assert.equal(r.SquadAI.engageRange(carbine), 250);
  assert.equal(r.SquadAI.engageRange(fg), 450);
  ['sergeant', 'rifleman', 'gunner'].forEach(rl =>
    assert.equal(r.SquadAI.engageRange(role(us, rl)), r.SquadAI.ROLES[rl].engageRange, rl)
  );
});

test('the FG 42 fires bursts up close and single aimed rounds at range', () => {
  const { r, b, ge, us, fired } = setup({ miss: true });
  const fg = role(ge, 'scout'),
    st = fg.weapon.stats,
    near = role(us, 'rifleman');
  fg.fireCooldown = 0;
  near.root.position.z = fg.root.position.z - 40; // inside autoWithin
  fg.target = near;
  r.SquadAI.tryFire(fg, b);
  const burst = fired.filter(f => f.id === fg.id);
  assert.ok(
    burst.length >= st.burst[0] && burst.length <= st.burst[1],
    'burst of ' + burst.length + ' at 40 m'
  );
  burst.forEach((f, i) =>
    assert.ok(Math.abs(f.delay - i / st.cyclic) < 1e-9, 'round ' + i + ' at the cyclic rate')
  );
  fired.length = 0;
  near.root.position.z = fg.root.position.z - 250; // well past autoWithin
  fg.fireCooldown = 0;
  r.SquadAI.tryFire(fg, b);
  assert.equal(fired.filter(f => f.id === fg.id).length, 1, 'one aimed round at 250 m');
  assert.ok(fg.fireCooldown >= (1 / st.rof) * 0.85 - 1e-9, 'at the aimed rate');
  /* Sustained at range: semi-automatic, about the Garand's aimed rate, well under a burst weapon's. */
  fired.length = 0;
  hold(r, b, fg, near, 60);
  const rate = fired.filter(f => f.id === fg.id).length / 60;
  assert.ok(rate > 0.6 && rate < 1.1, 'FG 42 at range ' + rate.toFixed(2) + ' aimed rds/s');
});

test('the FG 42 carries eight magazines, not the carbine load', () => {
  const { r, b, ge, us } = setup({ ammo: true });
  const fg = role(ge, 'scout'),
    carbine = role(us, 'scout');
  r.BattleAmmunition.initialize(fg, b);
  r.BattleAmmunition.initialize(carbine, b);
  assert.equal(fg.weapon.ammo + fg.weapon.reserveAmmo, 160);
  assert.equal(carbine.weapon.ammo + carbine.weapon.reserveAmmo, 75);
});

test('hit zones come from where the ray met the body', () => {
  const r = H.bootstrap();
  r.BattleModules.unitsFor = () => [];
  load(r, 'battle/modules/14-z-ballistic-raycast.js');
  const Z = r.BattleBallistics.hitZone,
    stand = { cx: 0, cy: 0.88, cz: 0, rx: 0.31, ry: 0.84, rz: 0.31, yaw: 0 },
    d = { x: 0, y: 0, z: 1 };
  assert.equal(Z(stand, { x: 0, y: 1.65, z: -0.1 }, d, 'stand'), 'head');
  assert.equal(Z(stand, { x: 0, y: 1.3, z: -0.3 }, d, 'stand'), 'chest');
  assert.equal(Z(stand, { x: 0, y: 0.95, z: -0.3 }, d, 'stand'), 'abdomen');
  assert.equal(Z(stand, { x: 0.28, y: 1.2, z: -0.1 }, d, 'stand'), 'arm');
  assert.equal(Z(stand, { x: 0, y: 0.4, z: -0.3 }, d, 'stand'), 'leg');
  const prone = { cx: 0, cy: 0.27, cz: 0, rx: 0.31, ry: 0.23, rz: 0.76, yaw: 0 };
  assert.equal(Z(prone, { x: 0, y: 0.3, z: 0.7 }, d, 'prone'), 'head', 'prone: the head is at the front');
  assert.equal(Z(prone, { x: 0, y: 0.3, z: -0.6 }, d, 'prone'), 'leg');
});

function woundRig(values) {
  H.resetIds();
  const r = H.bootstrap(),
    b = H.makeBattle(r, { seed: 5 });
  let i = 0;
  if (values) b.random = () => values[i++ % values.length];
  const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } }),
    ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 60, objective: { x: 0, z: -100 } });
  return { r, b, shooter: role(us, 'rifleman'), victim: role(ge, 'rifleman'), draws: () => i };
}
test('a head hit drops him; leg hits take several and slow him', () => {
  let w = woundRig([0.5]);
  w.r.SquadAI.applyHit(w.shooter, w.victim, w.b, { zone: 'head' });
  assert.equal(w.victim.dead, true, 'rifle round to the head');
  assert.equal(w.draws(), 2, 'a hit draws severity and drop, nothing else');
  w = woundRig([0.5]);
  const legs = [];
  while (!w.victim.dead && legs.length < 10) {
    w.r.SquadAI.applyHit(w.shooter, w.victim, w.b, { zone: 'leg' });
    legs.push(w.victim.woundSpeed);
  }
  assert.ok(legs.length >= 3 && legs.length <= 5, 'down after ' + legs.length + ' leg hits');
  assert.ok(legs[0] < 1 && legs[1] < legs[0], 'each leg wound slows him further');
});
test('a chest wound he stays up from bleeds him out; an arm wound spoils his aim', () => {
  const w = woundRig([0.5, 0.99]);
  w.r.SquadAI.applyHit(w.shooter, w.victim, w.b, { zone: 'chest' });
  assert.equal(w.victim.dead, undefined, 'survived the drop roll');
  assert.ok(w.victim.bleedRate > 0 && w.victim.woundSigma > 1);
  for (let t = 0; t < 120 && !w.victim.dead; t += 0.1) {
    w.b.time += 0.1;
    w.r.BattleWounds.bleed(w.b, 0.1);
  }
  assert.equal(w.victim.dead, true, 'bled out');
  assert.equal(w.victim.casualty.cause, 'bledOut');
  assert.equal(w.b.factions.us.kills, 1, 'the man who shot him gets the kill');
  const a = woundRig([0.5, 0.99]);
  a.r.SquadAI.applyHit(a.shooter, a.victim, a.b, { zone: 'arm' });
  assert.ok(a.victim.woundSigma >= 1.4 && !a.victim.dead);
});
test('drop odds match the zone table and scale with the cartridge', () => {
  const Z = woundRig().r.BattleWounds.ZONES;
  const rate = (zone, roleName) => {
    let drops = 0;
    for (let i = 0; i < 3000; i++) {
      const w = woundRig();
      w.b.random = (
        s => () =>
          (s = (s * 16807) % 2147483647) / 2147483647
      )(i + 1);
      const shooter = roleName ? w.shooter.squad.members.find(s => s.role === roleName) : w.shooter;
      w.r.SquadAI.applyHit(shooter, w.victim, w.b, { zone });
      if (w.victim.dead) drops++;
    }
    return drops / 3000;
  };
  const chest = rate('chest');
  assert.ok(chest >= Z.chest.drop - 0.04 && chest <= Z.chest.drop + 0.12, 'rifle chest ' + chest.toFixed(2));
  assert.ok(rate('head') > 0.95, 'head');
  const smgChest = rate('chest', 'sergeant');
  assert.ok(
    smgChest < chest - 0.08,
    'a pistol-calibre SMG drops fewer men with a chest hit: ' + smgChest.toFixed(2)
  );
});
test('a full-power round can go through one man and hit the man behind him', () => {
  const r = H.bootstrap();
  r.BattleModules.unitsFor = () => [];
  load(r, 'battle/modules/14-z-ballistic-raycast.js');
  function line(stats) {
    const b = H.makeBattle(r, { seed: 3 });
    b.random = () => 0.5;
    let meta = null;
    b.onShot = (a, t, hit, d, m) => (meta = m);
    const man = (x, faction) => ({
      id: x,
      faction,
      hp: 100,
      root: { position: { x, y: 0, z: 0 }, rotation: { y: 0 } }
    });
    const shooter = man(0, 'us'),
      front = man(20, 'ge'),
      back = man(21.5, 'ge');
    shooter.weapon = {
      stats: Object.assign({ range: 300, falloffStart: 300, combatSigmaAt100: 0.0001, damage: 55 }, stats)
    };
    b._roster.ge.push(front, back);
    b.factions.ge.alive = 2;
    r.BattleBallistics.resolve(shooter, front, b);
    return { meta, front, back };
  }
  const rifle = line({ power: 1 });
  assert.equal(rifle.meta.passes.length, 2, 'the rifle round went through into the man behind');
  assert.ok(rifle.meta.passes[0].exit, 'an exit point on the first man');
  assert.ok(rifle.meta.passes[1].energy < 1, 'arrives with less energy');
  assert.ok(rifle.back.hp < 100, 'the second man is wounded');
  assert.ok(
    100 - rifle.back.hp < rifle.front.wounds.length * 55 * 1.5 * 0.9,
    'with a lighter wound than a fresh round'
  );
  const d0 = rifle.meta.passes[0].direction,
    d1 = rifle.meta.passes[1].direction;
  assert.ok(Math.hypot(d0.x - d1.x, d0.y - d1.y, d0.z - d1.z) > 1e-3, 'deflected leaving the body');
  const pistol = line({ power: 0.5 });
  assert.equal(pistol.meta.passes.length, 1, 'a pistol-calibre round stops in the first man');
  assert.equal(pistol.back.hp, 100);
  assert.equal(pistol.meta.final, null);
});
console.log(n + ' weapon and wound checks passed');
