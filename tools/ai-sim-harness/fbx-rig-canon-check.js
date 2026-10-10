#!/usr/bin/env node
'use strict';

/* Audit #456 R3: every skeleton, retarget, grip and upper-body layer consumes
   identical canonical names before and after extracting the FBX rig helper. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modules = path.join(__dirname, '../../battle/modules');
const helperName = '52-fbx-rig-canon.js';
const backendName = '53-fbx-soldier-backend.js';
const helperSource = fs.readFileSync(path.join(modules, helperName), 'utf8');
const backendSource = fs.readFileSync(path.join(modules, backendName), 'utf8');
assert.ok(helperName < backendName, 'PHP sorted module order must load rig canonicalization first');
assert.match(backendSource, /!root\.BattleFbxRigCanon\s*\|\|/);
assert.match(backendSource, /rigScheme = RIG\.rigScheme/);
assert.match(backendSource, /canon = RIG\.canon/);
assert.match(backendSource, /BONE = RIG\.BONE/);
assert.match(backendSource, /isUpper = RIG\.isUpper/);
assert.doesNotMatch(
  backendSource,
  /function canon\(name, scheme\)/,
  'duplicate canonicalizer survived in the oversized backend'
);
assert.doesNotMatch(backendSource, /function rigScheme\(names\)/, 'duplicate scheme scanner survived');

const context = { window: {} };
vm.runInNewContext(helperSource, context, { filename: helperName });
const rig = context.window.BattleFbxRigCanon;
assert.ok(rig, 'rig helper must install without Babylon or any game runtime');
const original = rig;
vm.runInNewContext(helperSource, context, { filename: helperName });
assert.equal(context.window.BattleFbxRigCanon, original, 'helper registration is idempotent');
assert.equal(rig.rigScheme([]), 'mixamo');
assert.equal(rig.rigScheme(['mixamorig:Spine', 'mixamorig:Spine1']), 'mixamo');
assert.equal(rig.rigScheme(['Spine01', 'Spine02', 'Spine']), 'legacy');
assert.equal(rig.rigScheme(['SPINE02', 'mixamorig:Spine2']), 'legacy');
const samples = [
  ['mixamorig:Spine', 'mixamo', 'spine0'],
  ['MixamoRig_Spine1', 'mixamo', 'spine1'],
  ['mixamorig:Spine1', 'mixamo', 'spine1'],
  ['mixamorig:Spine2', 'mixamo', 'spine2'],
  ['Spine02', 'legacy', 'spine0'],
  ['Spine01', 'legacy', 'spine1'],
  ['Spine', 'legacy', 'spine2'],
  ['mixamorig:HeadTop_End', 'mixamo', 'headend'],
  ['HeadTop_End', 'legacy', 'headend'],
  ['mixamorig:HeadEnd', 'mixamo', 'headend'],
  ['mixamorig:LeftToe_End', 'mixamo', 'lefttoeend'],
  ['RightToeEnd', 'legacy', 'righttoeend'],
  ['mixamorig:LeftHandIndex1', 'mixamo', 'lefthandindex1'],
  ['mixamorig:RightForeArm', 'mixamo', 'rightforearm'],
  ['MIXAMORIG:RightHand', 'mixamo', 'righthand'],
  ['', 'mixamo', ''],
  [null, 'mixamo', '']
];
for (const [name, scheme, expected] of samples) {
  assert.equal(rig.canon(name, scheme), expected, String(name));
}
assert.equal(rig.canon('mixamorig:Spine'), 'spine0', 'default remains Mixamo');
assert.equal(rig.canon('Spine02', 'legacy'), 'spine0');
assert.equal(rig.BONE.hips, 'hips');
assert.equal(rig.BONE.spine0, 'spine0');
assert.equal(rig.BONE.spine2, 'spine2');
assert.equal(rig.BONE.leftHand, 'lefthand');
assert.equal(rig.BONE.rightHand, 'righthand');
assert.equal(rig.BONE.leftFoot, 'leftfoot');
assert.equal(rig.BONE.rightFoot, 'rightfoot');
for (const name of [
  'spine0',
  'spine1',
  'spine2',
  'neck',
  'head',
  'headend',
  'headfront',
  'leftshoulder',
  'leftarm',
  'leftforearm',
  'lefthand',
  'rightshoulder',
  'rightarm',
  'rightforearm',
  'righthand',
  'lefthandindex1',
  'righthandthumb2',
  'lefthandpinky3'
]) {
  assert.equal(rig.isUpper(name), true, name + ' must be upper-body overlay');
}
for (const name of [
  'hips',
  'leftupleg',
  'rightfoot',
  'lefttoeend',
  'rightleg',
  'lefthandnonfinger',
  '',
  'handindex1'
]) {
  assert.equal(rig.isUpper(name), false, name + ' must stay out of overlay');
}
console.log(
  'PASS #456 R3 Mixamo/legacy spine, bone aliases, finger masks, helper load order and idempotent registration'
);
