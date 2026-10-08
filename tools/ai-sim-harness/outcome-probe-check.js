#!/usr/bin/env node
'use strict';
/* The outcome probe counts objectives from objectiveControl.objectives, not from the summary wrapper. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');

const r = {};
new Function('window', fs.readFileSync(path.join(H.REPO, 'scripts/probes/outcome.js'), 'utf8'))(r);
const objectives = { a: { id: 'a', owner: 'us' }, b: { id: 'b', owner: 'ge' }, c: { id: 'c', owner: null } };
const sim = {
  winner: null,
  time: 100,
  factions: { us: { alive: 3, kills: 1 }, ge: { alive: 2, kills: 2 } },
  objectiveControl: { us: 1, ge: 1, sectors: objectives, objectives, counts: { us: 1, ge: 1 }, total: 3 }
};
assert.deepEqual(r.BattleProbes.outcome.report(sim).held, { us: 1, ge: 1, neutral: 1 });
console.log('PASS outcome probe counts the real objectives');
