#!/usr/bin/env node
'use strict';
/* The compact diagnostics export lists, for a squad in retreat, each living man's resolver owner, Engagement state, stop reason and
   distance home (diagnostics only: nothing in the battle reads it), so a man standing still on the way home or a retreat nobody
   owns shows in the export. A squad not in retreat carries null. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
H.resetIds();
const r = H.bootstrap({}),
  b = H.makeBattle(r, { seed: 12345 });
new Function(
  'window',
  'globalThis',
  'console',
  fs.readFileSync(path.join(H.REPO, 'battle/modules/99-session-diagnostics-export.js'), 'utf8')
)(r, r, { log() {}, warn() {}, error() {} });
assert.ok(r.BattleDiagnosticsExport && r.BattleDiagnosticsExport.compact, 'export module loads');
const q = H.addSquad(r, b, { id: 'us-1', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 120 } });
b.factions = b.factions || {};
const snap0 = r.BattleDiagnosticsExport.compact(b);
const s0 = snap0.squads.find(s => s.id === 'us-1');
assert.equal(s0.retreatMen, null, 'a squad not in retreat has no retreat list');
q.state = 'retreat';
const man = q.members.find(m => !m.dead);
man._movementResolver = { last: { owner: 'resolver', kind: 'retreat', reason: 'squad retreat' } };
man._movementStopReason = 'blocked';
const s1 = r.BattleDiagnosticsExport.compact(b).squads.find(s => s.id === 'us-1');
assert.ok(Array.isArray(s1.retreatMen) && s1.retreatMen.length === q.members.filter(m => !m.dead).length);
const row = s1.retreatMen.find(m => m.id === man.id);
assert.deepEqual(row.resolver, { owner: 'resolver', kind: 'retreat', reason: 'squad retreat' });
assert.equal(row.stop, 'blocked');
assert.equal(typeof row.homeM, 'number');
assert.equal(row.pos.length, 2);
console.log(
  'PASS compact export lists each retreating man with resolver owner, stop reason and distance home'
);
