#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

const broadcastSource = fs.readFileSync(
  path.resolve(__dirname, '../../battle/modules/49-squad-broadcast.js'),
  'utf8'
);

function loadBroadcast(root) {
  if (root.location) {
    new Function('window', 'globalThis', 'console', 'location', broadcastSource)(
      root,
      root,
      console,
      root.location
    );
  } else {
    new Function('window', 'globalThis', 'console', broadcastSource)(root, root, console);
  }
}

function defaults(search) {
  H.resetIds();
  const root = H.bootstrap({ search: search || '' });
  loadBroadcast(root);
  return {
    broadcast: root.BattleSquadBroadcast.broadcastOn(),
    fireteamSplit: root.BattleSquadStability.fireteamSplitOn()
  };
}

assert.deepEqual(defaults(''), { broadcast: true, fireteamSplit: true }, 'both tactical features ship on');
assert.deepEqual(
  defaults('?squadBroadcast=1&fireteamSplit=1'),
  { broadcast: true, fireteamSplit: true },
  'explicit on remains supported'
);
assert.deepEqual(
  defaults('?squadBroadcast=0&fireteamSplit=0'),
  { broadcast: false, fireteamSplit: false },
  'numeric legacy controls disable both features'
);
assert.deepEqual(
  defaults('?squadBroadcast=off&fireteamSplit=false'),
  { broadcast: false, fireteamSplit: false },
  'word-form legacy controls disable both features'
);

console.log(
  'PASS tactical squad broadcast and multi-contact fireteam split are default-on with legacy controls'
);
