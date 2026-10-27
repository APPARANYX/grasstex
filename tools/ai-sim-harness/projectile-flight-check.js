#!/usr/bin/env node
'use strict';
/* Pure deterministic projectile flight contract. No browser, GPU or wall-clock. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('battle/modules/14-zz-projectile-flight.js', 'utf8');
function setup(search = '?projectileFlight=1') {
  let system,
    hits = [],
    resolved = [],
    crossing = [],
    pins = [];
  const root = {
    location: { search },
    BATTLE_PREVIEW: { isolatedLab: true },
    GTLog: function () {},
    BattleModules: {
      registerSystem: function (_id, owner) {
        system = owner;
      }
    },
    BattleBallistics: {
      bodyShape: target => ({ cx: target.x, cy: target.y, cz: target.z }),
      penetration: () => 0,
      THROUGH: { chest: 0.7 },
      RETAIN: { chest: 0.45 },
      flightCollision: function (_shooter, from, to, sim) {
        const interp = z => {
          const f = (z - from.z) / (to.z - from.z);
          if (!(f >= 0 && f <= 1)) return null;
          return { x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f, z };
        };
        if (sim.wallZ != null) {
          const wall = interp(sim.wallZ);
          if (wall)
            return {
              kind: 'environment',
              impact: wall,
              distance: Math.hypot(wall.x - from.x, wall.y - from.y, wall.z - from.z),
              blocker: 'wall',
              surface: 'cement'
            };
        }
        const target = sim.target;
        if (!target || target.dead) return null;
        const at = interp(target.z);
        if (!at) return null;
        crossing.push(at);
        if (Math.abs(at.x - target.x) > 0.31 || Math.abs(at.y - target.y) > 0.55) return null;
        return {
          kind: 'soldier',
          victim: target,
          zone: 'chest',
          impact: at,
          exit: { x: at.x, y: at.y, z: at.z + 0.5 },
          direction: { x: 0, y: 0, z: 1 },
          distance: Math.hypot(at.x - from.x, at.y - from.y, at.z - from.z)
        };
      }
    },
    SquadAI: {
      SUPPRESSION_TIME: 1.2,
      pin: (target, sim, seconds) => pins.push({ target, at: sim.time, seconds }),
      applyHit: (_shooter, target, _sim, hit) => {
        hits.push(hit);
        target.hp -= hit.energy * 55;
        return { zone: 'chest', outcome: 'wounded' };
      }
    }
  };
  vm.runInNewContext(source, { window: root, globalThis: root, console });
  const sim = {
    time: 0,
    random: () => 0.99,
    target: { x: 0, y: 1.55, z: 100, hp: 100, faction: 'ge', dead: false },
    rosterOf: () => [sim.target],
    onShot: (...args) => resolved.push(args)
  };
  const shooter = {
    id: 1,
    faction: 'us',
    weapon: { kind: 'rifle', profile: 'm1-garand', stats: { model: 'm1-garand', range: 450, power: 1 } }
  };
  function fire() {
    const shot = {
      origin: { x: 0, y: 1.55, z: 0 },
      dir: { x: 0, y: 0, z: 1 },
      aim: { x: 0, y: 1.55, z: sim.target.z },
      sigma: 0.001
    };
    return root.BattleProjectileFlight.launch(shooter, sim.target, sim, 0, 0, shot, false);
  }
  function advance(time) {
    sim.time = time;
    system.onSimulationStep(sim);
  }
  return { root, sim, shooter, fire, advance, hits, resolved, crossing, pins, system };
}
{
  const x = setup();
  assert.equal(x.root.BattleProjectileFlight.enabled, true);
  x.fire();
  assert.equal(x.hits.length, 0, 'firing must not apply a wound');
  x.advance(0.05);
  assert.equal(x.hits.length, 0, '100m rifle round cannot arrive at 50ms');
  x.advance(0.15);
  assert.equal(x.hits.length, 1, 'stationary zeroed target struck after flight');
  assert.equal(x.resolved.length, 1, 'one impact callback, not at trigger time');
  assert.ok(x.resolved[0][4].flightSeconds > 0.1);
  assert.ok(x.hits[0].energy > 0 && x.hits[0].energy < 1, 'drag removes impact energy');
  assert.ok(x.resolved[0][4].impactVelocity < 853);
}
{
  const x = setup();
  x.fire();
  x.advance(0.05);
  x.sim.target.x = 2;
  for (let t = 0.1; t <= 1.25; t += 0.05) x.advance(t);
  assert.equal(x.hits.length, 0, 'changing location before arrival dodges previous aim ray');
  assert.equal(x.resolved.length, 1, 'miss eventually expires at range');
  assert.equal(x.resolved[0][2], false);
}
{
  const x = setup();
  x.fire();
  x.sim.wallZ = 65;
  for (let t = 0.05; t <= 0.4; t += 0.05) x.advance(t);
  assert.equal(x.hits.length, 0, 'cover intercepted the projectile before body');
  assert.equal(x.resolved.length, 1);
  assert.equal(x.resolved[0][4].blocker, 'wall');
}
{
  const x = setup();
  x.sim.target.z = 300;
  x.fire();
  for (let t = 0.05; t <= 0.65; t += 0.05) x.advance(t);
  assert.ok(x.crossing.length, 'sample crosses the 300m target');
  assert.ok(x.crossing[0].y < 1.3, 'gravity drops the path below zeroed center at 300m');
}
{
  const x = setup('?projectileFlight=0');
  assert.equal(x.root.BattleProjectileFlight.enabled, false);
  assert.equal(x.fire(), null, 'flag-off cannot launch a projectile');
  x.advance(0.2);
  assert.equal(x.resolved.length, 0);
}
{
  const x = setup();
  x.fire();
  x.system.onBattleRestart(x.sim);
  x.advance(0.25);
  assert.equal(x.hits.length, 0, 'restart deletes pending bullets');
  assert.equal(x.root.BattleProjectileFlight.summary(x.sim).inFlight, 0);
}
{
  const x = setup();
  x.sim.target.x = 0.65;
  x.fire();
  for (let t = 0.05; t <= 0.35; t += 0.05) x.advance(t);
  assert.equal(x.hits.length, 0, 'a near miss must not create a wound');
  assert.ok(x.pins.length >= 1, 'passing rounds suppress nearby enemies only upon arrival');
  assert.ok(x.pins[0].at > 0.05, 'suppression occurs at trajectory, not at trigger');
}
{
  const x = setup();
  x.sim.target.x = 0.65;
  x.sim.wallZ = 60;
  x.fire();
  for (let t = 0.05; t <= 0.35; t += 0.05) x.advance(t);
  assert.equal(x.pins.length, 0, 'physical cover prevents downstream suppression');
}
console.log(
  'PASS: projectile travel, delayed impact, moving-target miss, obstruction, gravity, energy, off flag, restart'
);
