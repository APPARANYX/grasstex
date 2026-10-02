#!/usr/bin/env node
'use strict';
/* Presentation muzzle contract: gameplay may keep a deterministic semantic muzzle for headless
   ballistics, but visible tracers must begin at the calibrated rendered weapon muzzle whenever the
   weapon mesh exists. This covers every issued weapon kind and player-controlled fire because all
   discharge paths feed the same onShot presentation hook. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),H=require('./harness');
const fx=fs.readFileSync(path.join(H.REPO,'battle/modules/13-combat-fx-consistency.js'),'utf8');
const ballistics=fs.readFileSync(path.join(H.REPO,'battle/modules/14-z-ballistic-raycast.js'),'utf8');

assert.match(fx,/renderedFrom=muzzleWorld\(shooter\)/,'visible shot origin must resolve the rendered weapon muzzle');
assert.match(fx,/from=renderedFrom\|\|ballisticFrom/,'rendered muzzle must win over the semantic ballistic origin');
assert.match(fx,/draw=function\(\)\{var f=muzzleWorld\(shooter\)\|\|ballisticFrom\|\|from/,'delayed burst tracers must re-sample the animated muzzle at presentation time');
assert.doesNotMatch(fx,/from=ballisticFrom\|\|muzzleWorld\(shooter\)/,'semantic head\/bore origin must not visually override the weapon muzzle');
assert.match(ballistics,/function muzzleOrigin\(shooter, target, battle\)/,'gameplay must retain its deterministic semantic muzzle');
assert.match(ballistics,/origin:\s*shot\.origin/,'ballistic result must continue reporting its simulation origin');
console.log('PASS: visible tracers start at the rendered weapon muzzle while ballistics keep the deterministic semantic muzzle');
