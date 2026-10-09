#!/usr/bin/env node
'use strict';
/* Prone muzzle terrain alignment: the forward barrel cannot start below the hill.
 * Keep authoritative ballistics, crest checks and player free-fire on one muzzle,
 * with only visual FBX pose tilt. This fixture used to fail on the old muzzle. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');
function load(r, rel) {
  new Function('window', 'globalThis', 'console', 'BABYLON',
    fs.readFileSync(path.join(H.REPO, rel), 'utf8'))(
    r, r, { log() {}, warn() {} }, r.BABYLON
  );
}
function world(heightAt) {
  const r = H.bootstrap({ modules: false });
  load(r, 'battle/modules/14-z-ballistic-raycast.js');
  const b = H.makeBattle(r, { seed: 76, obstacles: [] });
  b.heightAt = heightAt;
  b.random = () => 0.5; // deterministic tiny dispersion
  const s = {
    id: 76, faction: 'ge', prone: true, crouching: false, setUp: true,
    root: { position: { x: 0, y: heightAt(0, 0), z: 0 }, rotation: { y: 0 } },
    weapon: { kind: 'lmg', stats: {
      range: 120, falloffStart: 120, combatSigmaAt100: 0.000001, damage: 10, power: 1
    } }
  };
  return { B: r.BattleBallistics, b, s };
}
function close(a, b, why) {
  assert.ok(Math.abs(a - b) < 1e-5, why + ' expected ' + b + ' got ' + a);
}

// Same 0.42 m bore height on a flat surface; rifles and standing geometry are unchanged.
{
  const { B, b, s } = world(() => 2.3);
  const t = { root: { position: { x: 0, z: 25 } } };
  const o = B.muzzleOrigin(s, t, b);
  close(o.y, 2.72, 'flat prone muzzle');
  close(o.z, 0.82, 'MG42 semantic muzzle offset');
  const tilt = B.proneTerrainTilt(s, b);
  close(tilt.pitch, 0, 'flat ground pitch');
  close(tilt.roll, 0, 'flat ground roll');
  s.prone = false;
  close(B.muzzleOrigin(s, t, b).y, 3.85, 'standing origin on flat ground');
  console.log('PASS: standing and flat prone remain unchanged');
}

// A 60% uphill grade formerly put the prone barrel 0.072 m INSIDE the hill.
{
  const { B, b, s } = world((x, z) => 0.6 * z);
  const t = { root: { position: { x: 0, z: 30 } } };
  const origin = B.muzzleOrigin(s, t, b);
  const gradeUnderBarrel = b.heightAt(origin.x, origin.z);
  close(origin.y - gradeUnderBarrel, 0.42, 'uphill prone barrel clearance');
  assert.ok(B.proneTerrainTilt(s, b).pitch < -0.3, 'uphill body tilts muzzle up');
  assert.equal(B.fireLineBlocked(s, { ...t, prone: true }, b), false,
    'a clear uphill bore-to-target line is not falsely classified as blocked');
  const ray = B.resolvePlayerRay(s, { x: 0, y: b.heightAt(0, 30) + 0.9, z: 30 }, b);
  assert.ok(ray && ray.travel > 8,
    'uphill player MG42 shot leaves muzzle and travels instead of impacting at the feet');
  close(ray.origin.y, origin.y, 'player free-fire uses the same muzzle');
  console.log('PASS: uphill prone MG42 clears ground, ballistic gate and player ray agree');
}

// The forward barrel projects along actual target bearing even when soldier yaw differs.
{
  const { B, b, s } = world((x, z) => 0.5 * x);
  const t = { root: { position: { x: 30, z: 0 } } };
  const o = B.muzzleOrigin(s, t, b);
  close(o.x, 0.82, 'cross-slope target-facing muzzle x');
  close(o.y - b.heightAt(o.x, o.z), 0.42, 'cross-slope muzzle clearance');
  s.root.rotation.y = Math.PI / 2;
  const tilt = B.proneTerrainTilt(s, b);
  assert.ok(tilt.pitch < -0.3, 'terrain tangent is oriented by soldier facing');
}
{
  const { B, b, s } = world((x, z) => 0.25 * x);
  const tilt = B.proneTerrainTilt(s, b);
  assert.ok(tilt.roll > 0.2 && Math.abs(tilt.pitch) < 1e-6,
    'terrain rises to right, FBX rolls right without changing facing');
  console.log('PASS: directional pitch and roll follow local slope');
}

// The animation must apply the slope exclusively to FBX holder, not physical root,
// otherwise aiming, navigation and cover may all change as a side effect.
const fbx = fs.readFileSync(path.join(H.REPO, 'battle/modules/53-fbx-soldier-backend.js'), 'utf8');
assert.match(fbx, /BattleBallistics\.proneTerrainTilt\(fx\.soldier, battle\)/);
assert.match(fbx, /fx\.holder\.rotation\.x \+=/);
assert.match(fbx, /fx\.holder\.rotation\.z \+=/);
assert.doesNotMatch(fbx.slice(fbx.indexOf('Terrain-follow is presentation-only'),
  fbx.indexOf('cullApply(fx,', fbx.indexOf('Terrain-follow is presentation-only'))),
  /fx\.root\.rotation\.[xz] =|fx\.root\.rotation\.[xz] \+=/);
console.log('PASS: visual slope alignment is render-only, simulation root stays upright');
assert.match(fbx, /pronePose = fx\.stance === 'prone'/,
  'prone pose uses the existing terrain tangent');
assert.match(fbx, /dying = !!fx\.death/,
  'death poses remain slope-aligned after the clip finishes');
assert.match(fbx, /deathEntry = topEntry\(fx\.lower\)/,
  'standing death begins upright, then blends to the slope during the fall');
assert.match(fbx, /tilt\.pitch \*= contact/);
assert.match(fbx, /tilt\.roll \*= contact/);
console.log('PASS: dead soldiers blend into the terrain tangent without rotating the simulation root');
