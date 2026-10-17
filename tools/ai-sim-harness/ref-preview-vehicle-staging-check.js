#!/usr/bin/env node
'use strict';

/* Ref-based hosted previews must stage the real transport FBX, not just its
   movement module. A missing Assets/vehicles/ file previously produced
   invisible 'trucks' while soldiers traveled in tight formation. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../../preview.php'), 'utf8');
const matcherLine = source.split('\n').find(line => line.includes("elseif (preg_match('#^Assets/"));
assert.ok(matcherLine, 'preview staging must explicitly enumerate allowed asset families');
const match = matcherLine.match(/preg_match\('(#\^Assets\/.*?\$#)', \$path\)/);
assert.ok(match, 'preview staging asset regex must be readable and anchored');
const regex = new RegExp(match[1].slice(1, -1));
for (const asset of [
  'Assets/vehicles/german_transport.fbx',
  'Assets/vehicles/us_transport.glb',
  'Assets/soldiers/us_rifleman.fbx',
  'Assets/animations/Truck - Driving.fbx',
  'Assets/weapons/rifle.glb',
  'Assets/effects/smoke.png'
])
  assert.ok(regex.test(asset), 'missing allowed preview asset: ' + asset);
for (const rejected of [
  'Assets/vehicles/../../state/private.php',
  'Assets/vehicles/truck.php',
  'Assets/audio/private.mp3',
  'Assets/terrain/secret.json',
  'Assets/vehicles/truck.json'
])
  assert.equal(regex.test(rejected), false, 'must not stage unauthorized asset: ' + rejected);
assert.match(
  source,
  /foreach \(array\('soldiers', 'animations', 'weapons', 'vehicles'\) as \$d\)/,
  'vehicle sidecar JSON from the hosting server should be preserved'
);
assert.match(
  source,
  /if \(blob_sha\(\$prod, \$hashes\) === \$e\['sha'\]\)/,
  'identical assets must be reused via verified hard links'
);
console.log(
  'PASS ref preview stages real vehicles alongside soldiers without expanding private asset access'
);
