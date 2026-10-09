#!/usr/bin/env node
'use strict';
/* Regression: third-person camera heading cannot turn a prone player's muzzle backward
   or sideways while the soldier's actual body/weapon is still pointing forward. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
const r = H.bootstrap({ modules: false });
new Function(
  'window',
  'globalThis',
  'console',
  fs.readFileSync(path.join(H.REPO, 'battle/modules/14-z-ballistic-raycast.js'), 'utf8')
)(r, r, { log() {}, warn() {} });
const B = r.BattleBallistics;
const b = H.makeBattle(r, { seed: 43, obstacles: [] });
b.random = () => 0.5; // nearly zero dispersion
const shooter = {
  id: 14,
  faction: 'us',
  isPlayer: true,
  prone: true,
  setUp: true,
  root: { position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } },
  weapon: {
    kind: 'rifle',
    stats: {
      range: 120,
      falloffStart: 120,
      combatSigmaAt100: 0.000001,
      damage: 10,
      power: 1
    }
  }
};
const behind = { x: 0, y: 0.42, z: -40 };
let preview = B.previewPlayerRay(shooter, behind, b);
let shot = B.resolvePlayerRay(shooter, behind, b, 0, 0);
assert.ok(preview && shot, 'both preview and bullet exist');
const visualAim = B.playerBoreAimPoint(shooter, behind, b);
assert.ok(
  visualAim && visualAim.z > 20 && Math.abs(visualAim.x) < 1e-4,
  'FBX aim endpoint must stay ahead of soldier, not follow rearward camera'
);
const visualDir = {
  x: visualAim.x - shot.origin.x,
  z: visualAim.z - shot.origin.z
};
assert.ok(
  Math.abs(visualDir.x) < 1e-4 && visualDir.z > 0,
  'gun pose and real bullet share the same forward bearing'
);

assert.ok(preview.origin.z > 0.7, 'player muzzle stays ahead of prone body when camera looks behind');
assert.ok(shot.origin.z > 0.7, 'actual bullet begins ahead of the prone body');
assert.ok(shot.direction.z > 0.9, 'bullet cannot travel backward through the prone soldier');
assert.ok(Math.abs(shot.direction.x) < 1e-4, '180-degree free-look fires directly forward, not off-axis');
assert.ok(preview.impact.z > preview.origin.z, 'preview also stays ahead of the weapon');
console.log('PASS prone player cannot fire behind body when camera turns 180 degrees');

const side = { x: 40, y: 0.42, z: 0 };
preview = B.previewPlayerRay(shooter, side, b);
shot = B.resolvePlayerRay(shooter, side, b, 0, 0);
const angle = Math.abs(Math.atan2(shot.direction.x, shot.direction.z));
assert.ok(angle <= 0.201, 'grounded prone muzzle side arc is bounded to 0.20 rad');
assert.ok(
  Math.abs(Math.atan2(preview.impact.x, preview.impact.z)) < 0.3,
  'secondary dot points inside weapon arc rather than jumping to camera side'
);
console.log('PASS sideways free-look respects the prone weapon yaw limit');

shooter.prone = false;
shooter.crouching = true;
shot = B.resolvePlayerRay(shooter, side, b, 0, 0);
assert.ok(
  Math.atan2(shot.direction.x, shot.direction.z) <= 0.321,
  'crouched weapon aim is bounded, not an unlimited free-camera ray'
);
shooter.crouching = false;
shot = B.resolvePlayerRay(shooter, side, b, 0, 0);
assert.ok(
  Math.atan2(shot.direction.x, shot.direction.z) <= 0.381,
  'standing player still cannot shoot through their shoulder'
);
console.log('PASS weapon yaw stays physically bounded in all player stances');

shooter.prone = true;
const victim = {
  id: 15,
  faction: 'ge',
  hp: 100,
  root: { position: { x: 0, y: 0, z: 30 }, rotation: { y: Math.PI } }
};
b._roster.ge.push(victim);
b.factions.ge.alive = 1;
preview = B.previewPlayerRay(shooter, { x: 0, y: 0.9, z: 30 }, b);
shot = B.resolvePlayerRay(shooter, { x: 0, y: 0.9, z: 30 }, b, 0, 0);
assert.equal(preview.stoppedBy, 'soldier', 'front-aligned preview hits a real opposing body');
assert.equal(shot.victim, victim, 'a genuinely forward aiming player can still hit');
console.log('PASS aligned prone rifle continues hitting forward enemies');

const ai = { ...shooter, isPlayer: false };
const rearTarget = { root: { position: { x: 0, y: 0, z: -30 } } };
const aiMuzzle = B.muzzleOrigin(ai, rearTarget, b);
assert.ok(
  aiMuzzle.z < -0.7,
  'ordinary AI muzzle/aim behavior is untouched by the player-only muzzle correction'
);
console.log('PASS AI muzzle behavior is unchanged');
