#!/usr/bin/env node
'use strict';
/* Objective presentation contract:
   - capture points use a waving flag instead of the old bright continuous ring;
   - the flag moves vertically with capture / neutralization progress;
   - sandbags mark the boundary in short, widely separated clusters so infantry still has open approaches.
   This is a source-level presentation regression; objective gameplay remains covered by objective-nav-check.js. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),H=require('./harness');
const src=fs.readFileSync(path.join(H.REPO,'battle/modules/01-capture-zone.js'),'utf8');

assert.match(src,/CreateRibbon\(\s*'objective-flag-'/,'objective marker must render an actual cloth flag');
assert.match(src,/flag\.updateVerticesData\(BABYLON\.VertexBuffer\.PositionKind/,'objective flag must animate its cloth vertices');
assert.match(src,/flag\._targetY = flagTargetY\(marker, st\)/,'objective state must drive flag raise/lower height');
assert.match(src,/st\.phase === 'neutralizing'[\s\S]*return high - \(high - low\) \* pct/,'neutralization progress must lower the owned flag');
assert.match(src,/st && st\.phase === 'capturing'[\s\S]*return low \+ \(high - low\) \* pct/,'capture progress must raise a neutral flag');
assert.match(src,/SANDBAG_CLUSTERS = 6/,'objective boundary must use sparse sandbag clusters');
assert.match(src,/SANDBAGS_PER_CLUSTER = 3/,'each boundary cluster must stay short');
assert.match(src,/boundary = Math\.max\(7, radius \* 0\.9\)/,'sandbags must sit near the actual capture-zone boundary');
assert.doesNotMatch(src,/CreateLines\('objective-ring-/,'old continuous objective ring must stay removed');
console.log('PASS: objectives use waving raise/lower flags with sparse open sandbag boundary clusters');
