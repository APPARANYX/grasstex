#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', '..', 'battle', 'camera-controls.js'), 'utf8');

assert.match(source, /player = null,\s*playerBattle = null,/, 'possession stores its owning battle');
assert.match(
  source,
  /player = next;\s*playerBattle = b;\s*player\.isPlayer = true;/,
  'new possession records the live battle instance'
);
assert.match(
  source,
  /if \(playerBattle !== b\) \{\s*leavePlayer\('battle restarted'\);\s*return;\s*\}/,
  'render-step possession exits when restart swaps the battle'
);
assert.match(
  source,
  /var b = playerBattle \|\| liveBattle\(\),\s*old = player;[\s\S]{0,180}?playerBattle = null;/,
  'release cleans the old battle lease before forgetting ownership'
);

console.log('PASS player possession cannot survive a battle-instance restart');
