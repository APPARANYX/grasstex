#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', '..', 'battle', 'modules', '53-fbx-soldier-backend.js'),
  'utf8'
);

assert.match(
  source,
  /function trackDetachedWeapon\(fx, mesh\)[\s\S]{0,260}?list\.indexOf\(mesh\) < 0\) list\.push\(mesh\)/,
  'detached reaction/abandoned weapon meshes are retained by the owning FBX soldier'
);
assert.match(
  source,
  /function untrackDetachedWeapon\(fx, mesh\)[\s\S]{0,220}?list\.splice\(i, 1\)/,
  'a weapon picked back up leaves the detached-mesh cleanup set'
);
assert.match(
  source,
  /holder\.onDisposeObservable\.add\(function \(\) \{[\s\S]{0,650}?detachedWeaponMeshes[\s\S]{0,300}?mesh\.dispose\(\)/,
  'soldier teardown disposes weapon meshes that were detached from the soldier hierarchy'
);
const surfaceOwner = fs.readFileSync(
  path.join(__dirname, '..', '..', 'battle', 'modules', '52-fbx-surface-damage.js'),
  'utf8'
);
assert.match(
  source,
  /clearSurfaceDamage = SURFACE\.clearSurfaceDamage/,
  'backend delegates wound cleanup to the unique skin owner'
);
assert.match(
  surfaceOwner,
  /function clearSurfaceDamage\(soldier\) \{\s*var fx = soldier && soldier\._fbx,\s*n = 0;\s*if \(!fx\) return n;/,
  'surface-damage cleanup owns and initializes its counter'
);

console.log('PASS FBX teardown owns detached weapons and surface-damage cleanup state');
