#!/usr/bin/env node
'use strict';
/* Presentation muzzle contract: gameplay may keep a deterministic semantic muzzle for headless
   ballistics, but visible tracers must begin at the calibrated rendered weapon muzzle whenever the
   weapon mesh exists. This covers every issued weapon kind and player-controlled fire because all
   discharge paths feed the same onShot presentation hook. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
const fx = fs.readFileSync(path.join(H.REPO, 'battle/modules/13-combat-fx-consistency.js'), 'utf8');
const ballistics = fs.readFileSync(path.join(H.REPO, 'battle/modules/14-z-ballistic-raycast.js'), 'utf8');

assert.match(
  fx,
  /renderedFrom\s*=\s*muzzleWorld\(shooter\)/,
  'visible shot origin must resolve the rendered weapon muzzle'
);
assert.match(
  fx,
  /from\s*=\s*renderedFrom\s*\|\|\s*ballisticFrom/,
  'rendered muzzle must win over the semantic ballistic origin'
);
assert.match(
  fx,
  /draw = function \(\) \{\s*var f = muzzleWorld\(shooter\) \|\| ballisticFrom \|\| from/,
  'delayed burst tracers must re-sample the animated muzzle at presentation time'
);
assert.doesNotMatch(
  fx,
  /from=ballisticFrom\|\|muzzleWorld\(shooter\)/,
  'semantic head\/bore origin must not visually override the weapon muzzle'
);
assert.match(
  fx,
  /showTracer\(scene, name, from, to, color, alpha, lifetime, 0\)/,
  'world tracers must render in group 0 so buildings and hedgerows can occlude them'
);
assert.doesNotMatch(
  fx,
  /showTracer\(scene, name, from, to, color, alpha, lifetime, 3\)/,
  'tracers must not use the overlay rendering group'
);
assert.match(
  fx,
  /styles = \[\s*\['tracer-hit',[\s\S]*?0\.5, 0\],\s*\['tracer-miss',[\s\S]*?0\.15, 0\]/,
  'prewarmed hit and miss tracer pools must also start in the world depth group'
);
assert.match(
  ballistics,
  /function muzzleOrigin\(shooter, target, battle\)/,
  'gameplay must retain its deterministic semantic muzzle'
);
assert.match(
  ballistics,
  /origin:\s*shot\.origin/,
  'ballistic result must continue reporting its simulation origin'
);
console.log('PASS: visible tracers start at the rendered muzzle and remain depth-occluded by world geometry');
