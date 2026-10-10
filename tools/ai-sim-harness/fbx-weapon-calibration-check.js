#!/usr/bin/env node
'use strict';

/* #456 R3: measured weapon seats, sidecar precedence and socket-space fixture parity. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modules = path.join(__dirname, '../../battle/modules');
const helperName = '52-fbx-weapon-calibration.js';
const backendName = '53-fbx-soldier-backend.js';
const source = fs.readFileSync(path.join(modules, helperName), 'utf8');
const backend = fs.readFileSync(path.join(modules, backendName), 'utf8');

assert.ok('52-fbx-rig-canon.js' < helperName && helperName < backendName);
assert.match(backend, /!root\.BattleFbxWeaponCalibration\s*\|\|/);
assert.match(backend, /CALIB\.pointsFor/);
assert.match(backend, /CALIB\.applySidecarData/);
assert.match(backend, /CALIB\.applyDefaultSeats/);
assert.match(backend, /var sideWork = loadSidecars\(base, Object\.keys\(files\)\)/);
assert.match(backend, /\.then\(function \(\) \{\s*applyDefaultSeats\(file\)/);
assert.doesNotMatch(backend, /function pointsFor\(file, kind\)/);
assert.doesNotMatch(backend, /function applySidecarData\(file, data\)/);

const context = { window: {} };
vm.runInNewContext(source, context, { filename: helperName });
const calibration = context.window.BattleFbxWeaponCalibration;
assert.ok(calibration, 'pure calibration must initialize without Babylon');
const original = calibration;
vm.runInNewContext(source, context, { filename: helperName });
assert.equal(context.window.BattleFbxWeaponCalibration, original, 'helper install is idempotent');

const plain = (value) => JSON.parse(JSON.stringify(value));
const equal = (actual, expected, label) => assert.deepEqual(plain(actual), expected, label);
const points = (model, weapon) => calibration.pointsFor(model, weapon);
const baseWeaponSnapshot = JSON.stringify(calibration.WEAPON_POINTS);
const exceptionSnapshot = JSON.stringify(calibration.WEAPON_MODEL_POINTS);

equal(points('', 'm1-garand.fbx').grip, [0, -0.065, -0.06], 'original weapon mesh seat');
equal(points('', 'kar98k.fbx').fore, [0, -0.01, 0.06, 0.45], 'GE rifle fore-end');
equal(points('', 'thompson.fbx').grip, [0, -0.1, -0.06], 'US SMG');
equal(points('', 'mp40.fbx').fore, [0, -0.035, 0.06, 0.17], 'GE SMG');
equal(points('', 'mg42.fbx').grip, [0, -0.1, -0.09], 'GE LMG');
equal(points('', 'm1919a6.fbx').grip, [0, -0.14, 0.05], 'US LMG');
equal(points('', 'm1911a1.fbx').grip, [0.035, 0, 0.015], 'US pistol');
equal(points('', 'p38.fbx').grip, [0.035, -0.005, 0.01], 'GE pistol');
equal(points('', 'pistol').grip, [0.02, -0.07, 0], 'generic pistol');
equal(points('', 'rifle').fore, [0, -0.05, 0.05, 0.35], 'generic rifle');
assert.equal(points('', 'unknown.fbx'), undefined, 'unlisted weapon remains unlisted');

calibration.applyDefaultSeats('us-paratrooper.fbx');
calibration.applyDefaultSeats('ge-gunner.fbx');
calibration.applyDefaultSeats('us-gunner.fbx');
calibration.applyDefaultSeats('ge-captain.fbx');
equal(points('us-paratrooper.fbx', 'm1-garand.fbx').grip, [-0.011, -0.046, -0.076]);
equal(points('us-paratrooper.fbx', 'm1-garand.fbx').fore, [0.017, -0.035, -0.147, 0.6189]);
equal(calibration.wristRFor('us-paratrooper.fbx', 'm1-garand.fbx'), [-1, -17, 18]);
equal(points('ge-gunner.fbx', 'mg42.fbx').grip, [0.0196, -0.066, -0.094]);
equal(points('ge-gunner.fbx', 'mg42-bipod.fbx').grip, [0.0196, -0.066, -0.094]);
equal(points('us-gunner.fbx', 'm1919a6.fbx').grip, [0.0196, -0.104, 0.0049]);
equal(points('us-gunner.fbx', 'm1919a6-bipod.fbx').grip, [0.0196, -0.104, 0.0049]);
equal(points('ge-captain.fbx', 'p38.fbx').grip, [0.0065, -0.0222, -0.027]);
equal(points('us-paratrooper.fbx', 'mp40.fbx').fore, [0.017, -0.029, -0.147, 0.6189]);
equal(calibration.wristRFor('ge-captain.fbx', 'p38.fbx'), [0, 0, 3]);
assert.equal(calibration.armDegFor('ge-gunner.fbx', 'mg42.fbx'), null, 'zero arm dials stay unset');

calibration.applyDefaultSeats('ge-scout.fbx');
equal(
  points('ge-scout.fbx', 'mp40.fbx').fore,
  [0, -0.035, 0.06, 0.23],
  'GE scout exception outranks fallback seats'
);
assert.equal(calibration.SIDE_MODEL_POINTS['ge-scout.fbx']['mp40.fbx'], undefined);
calibration.applySidecarData('ge-scout.fbx', {
  weapons: {
    'mp40.fbx': {
      grip: [0.2, -0.1, -0.2],
      foreNear: [0.01, -0.04, 0.02],
      foreFar: [0.05, -0.07, 0.28]
    }
  }
});
equal(points('ge-scout.fbx', 'mp40.fbx').grip, [0.2, -0.1, -0.2]);
equal(points('ge-scout.fbx', 'mp40.fbx').fore, [0.01, -0.04, 0.02, 0.28]);
calibration.applyDefaultSeats('ge-scout.fbx');
equal(points('ge-scout.fbx', 'mp40.fbx').grip, [0.2, -0.1, -0.2], 'default never overwrites sidecar');
equal(points('us-paratrooper.fbx', 'mp40.fbx').grip, [0.006, -0.067, -0.125], 'no cross-model leak');

const customGrip = [0.0045, -0.0217, -0.027];
calibration.applySidecarData('us-captain.fbx', {
  contacts: { right: [0.1, 0.2, 0.3], left: [0.4, 0.5, 0.6] },
  weapons: {
    'm1911a1.fbx': {
      grip: customGrip,
      foreNear: null,
      foreFar: null,
      leftGripR: [0.021, 0.031, -0.012],
      wristR: [0, 0, 3],
      armDeg: { shoulder: [0, 0, -8], elbow: [0, -60, 20], wrist: [-23, -34, 0] }
    }
  }
});
calibration.applyDefaultSeats('us-captain.fbx');
equal(calibration.SIDE_CONTACTS['us-captain.fbx'], {
  right: [0.1, 0.2, 0.3],
  left: [0.4, 0.5, 0.6]
});
equal(points('us-captain.fbx', 'm1911a1.fbx').grip, customGrip);
assert.equal(points('us-captain.fbx', 'm1911a1.fbx').fore, null, 'pistol has no support fore-end');
equal(calibration.leftGripFor('us-captain.fbx', 'm1911a1.fbx'), [0.021, 0.031, -0.012]);
equal(calibration.armDegFor('us-captain.fbx', 'm1911a1.fbx'), {
  shoulder: [0, 0, -8],
  elbow: [0, -60, 20],
  wrist: [-23, -34, 0]
});
equal(calibration.wristRFor('us-captain.fbx', 'm1911a1.fbx'), [0, 0, 3]);
customGrip[0] = 9;
equal(points('us-captain.fbx', 'm1911a1.fbx').grip, [0.0045, -0.0217, -0.027]);
equal(\n  calibration.leftGripFor('us-paratrooper.fbx', 'm1911a1.fbx'),\n  [-0.0138, 0.0844, -0.0208],\n  'other models retain measured fallback pistol cup'\n);

calibration.applySidecarData('us-engineer.fbx', {
  contacts: { right: [0, 0, NaN] },
  weapons: {
    'm1-garand.fbx': { grip: [1, 2], wristR: [1, 1, 1] },
    'm1-carbine.fbx': { grip: null, foreNear: [1, 2, 3], foreFar: [4, 5] },
    'fg42.fbx': { grip: [0.01, 0.02, 0.03], wristR: [0, 0, 0] }
  }
});
assert.equal(calibration.SIDE_CONTACTS['us-engineer.fbx'], undefined);
assert.equal(calibration.SIDE_MODEL_POINTS['us-engineer.fbx']['m1-garand.fbx'], undefined);
calibration.applyDefaultSeats('us-engineer.fbx');
equal(points('us-engineer.fbx', 'm1-garand.fbx').grip, [-0.011, -0.046, -0.076]);
equal(points('us-engineer.fbx', 'm1-carbine.fbx').grip, [0, -0.055, -0.1]);
assert.equal(points('us-engineer.fbx', 'm1-carbine.fbx').fore, null, 'incomplete fore pair stays null');
assert.equal(calibration.wristRFor('us-engineer.fbx', 'fg42.fbx'), null, 'zero override is inert');
equal(points('us-engineer.fbx', 'fg42.fbx').grip, [0.01, 0.02, 0.03]);

/* A controlled posed-identity/90°-yaw fixture reproduces solveGrips socket placement:
   socket = right palm - R(grip/scale); muzzle = socket + R(muzzleLocal/scale).
   Numerical goldens were pinned from the pre-extraction seat tables (not derived here). */
function worldFixture(model, weapon, palm, yaw, muzzleLocal) {
  const grip = points(model, weapon).grip;
  const rotate = (v) => [
    v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw),
    v[1],
    -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw)
  ];
  const g = rotate(grip);
  const socket = palm.map((v, i) => v - g[i]);
  const mu = rotate(muzzleLocal);
  return {
    socket: socket,
    muzzle: socket.map((v, i) => v + mu[i])
  };
}
function closeArray(actual, expected, label) {
  actual.forEach((v, i) => {
    assert.ok(Math.abs(v - expected[i]) < 1e-10, label + '[' + i + ']: ' + v);
  });
}
let geometry = worldFixture('us-paratrooper.fbx', 'm1-garand.fbx', [3, 1, 2], 0, [0, -0.03, 0.7]);
closeArray(geometry.socket, [3.011, 1.046, 2.076], 'US rifle socket');
closeArray(geometry.muzzle, [3.011, 1.016, 2.776], 'US rifle muzzle');
geometry = worldFixture('ge-gunner.fbx', 'mg42.fbx', [3, 1, 2], 0, [0, -0.03, 0.7]);
closeArray(geometry.socket, [2.9804, 1.066, 2.094], 'GE MG42 socket');
closeArray(geometry.muzzle, [2.9804, 1.036, 2.794], 'GE MG42 muzzle');
geometry = worldFixture('us-gunner.fbx', 'm1919a6-bipod.fbx', [3, 1, 2], Math.PI / 2, [
  0, -0.03, 0.7
]);
closeArray(geometry.socket, [2.9951, 1.104, 2.0196], 'US M1919 bipod socket');
closeArray(geometry.muzzle, [3.6951, 1.074, 2.0196], 'US M1919 bipod muzzle');

assert.equal(JSON.stringify(calibration.WEAPON_POINTS), baseWeaponSnapshot, 'base weapon values mutated');
assert.equal(JSON.stringify(calibration.WEAPON_MODEL_POINTS), exceptionSnapshot, 'model exceptions mutated');
assert.equal(calibration.SIDE_CONTACTS['ge-scout.fbx'], undefined, 'default seats never fabricate contacts');
console.log('PASS #456 R3 weapon and model seats, sidecar overrides, fallbacks, pistol dials, bipod/US/GE socket and muzzle fixtures');
