#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict'),
  H = require('./harness');

H.resetIds();
const root = H.bootstrap({ search: '?stressAct=0&fireControl=0' }),
  battle = H.makeBattle(root, { seed: 818 }),
  squad = H.addSquad(root, battle, {
    id: 'us-mg',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 100 },
    facing: 0
  }),
  gunner = squad.members.find(s => root.SquadAI.isMachineGun(s)),
  point = { x: gunner.root.position.x, z: gunner.root.position.z + 40 },
  eng = root.BattleEngagement.stateOf(gunner);
assert.ok(gunner, 'fixture has an emplaced machine gun');

let shots = 0;
root.SquadAI.areaFire = s => {
  shots++;
  s.fireCooldown = 0.5;
  return 0;
};
gunner.moving = false;
gunner.crawling = false;
gunner.reloading = false;
gunner.suppressedUntil = 0;
eng.fireReadyAt = 0;
eng.burstPauseUntil = 0;
eng.setUpSince = 0;

battle.time = 10;
assert.equal(root.BattleEngagement.suppress(gunner, battle, point), false);
assert.equal(shots, 0, 'MG cannot suppress on the tick emplacement starts');

gunner.setUp = false; // alert() clears the presentation flag each tick; the setup clock persists.
battle.time = 11;
assert.equal(root.BattleEngagement.suppress(gunner, battle, point), false);
assert.equal(shots, 0, 'MG remains silent before setup time elapses');

gunner.setUp = false;
battle.time = 12;
assert.equal(root.BattleEngagement.suppress(gunner, battle, point), true);
assert.equal(shots, 1, 'MG may suppress once the emplacement clock completes');
assert.equal(gunner.setUp, true);

console.log('PASS machine-gun suppression waits for emplacement');
