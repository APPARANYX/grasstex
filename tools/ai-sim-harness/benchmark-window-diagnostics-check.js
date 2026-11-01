#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', '..', 'scripts', 'run_battle_benchmark.mjs'),
  'utf8'
);

assert.match(
  source,
  /const inRecordWindow = item => \{[\s\S]{0,400}?at > extra\.window\.openedAt \+ 1e-9[\s\S]{0,200}?at <= extra\.window\.closedAt \+ 1e-9/,
  'scripted diagnostic events are attributed only to the segment in which they occurred'
);
assert.match(
  source,
  /const conflicts = allConflicts\.filter\(inRecordWindow\), loops = allLoops\.filter\(inRecordWindow\)/,
  'both writer conflicts and loop alerts use the same segment filter'
);

console.log('PASS benchmark scopes cumulative diagnostics to the active scripted window');
