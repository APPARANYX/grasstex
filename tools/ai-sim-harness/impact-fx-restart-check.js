#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', '..', 'battle', 'modules', '15-bullet-impact-fx.js'),
  'utf8'
);

assert.match(source, /serial:\s*0,\s*epoch:\s*0/, 'impact state carries a restart generation');
assert.match(
  source,
  /function clear\(sim\)[\s\S]{0,180}?st\.epoch = \(\+st\.epoch \|\| 0\) \+ 1;/,
  'restart cleanup invalidates callbacks from the prior generation'
);
assert.match(
  source,
  /var epoch = state\(sim\)\.epoch;[\s\S]{0,240}?sim\._impactFx\.epoch !== epoch\) return;[\s\S]{0,120}?impact\(sim, shot, shooter\)/,
  'delayed impacts refuse to repopulate FX after restart'
);

console.log('PASS delayed impact FX are generation-bound across restart');
