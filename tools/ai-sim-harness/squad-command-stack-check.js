#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { files, loadSquadCommandStack } = require('./squad-command-stack');
const H = require('./harness');

const expected = fs
  .readdirSync(path.join(H.REPO, 'battle/modules'))
  .filter(name => /^15[a-m]-squad-leader-.*\.js$/.test(name))
  .sort()
  .map(name => 'battle/modules/' + name)
  .concat('battle/modules/16-squad-plan-stability.js');
assert.deepEqual(files, expected, 'shared stack must load every shipping Squad Leader module in name order');
assert.equal(files.length, 14);
const received = [];
loadSquadCommandStack((_, file) => received.push(file), {});
assert.deepEqual(received, files, 'loader preserves exactly the source ordering');
const live = H.bootstrap();
assert.ok(live.BattleSquadStability, 'bootstrap still loads shipping squad-command owner');
assert.ok(live.BattleLeases, 'lease authority survives the extracted module list');
console.log('PASS #456 shared 14-module Squad Leader fixture loader and shipping harness bootstrap');
