#!/usr/bin/env node
'use strict';
/* Observer-only acceptance: a healthy faction must not conceal a stationary
   squad's remote CAPTURE, nor may a local waypoint arrival count as mission arrival. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const filename = path.join(__dirname, '../../scripts/probes/squad-local-starvation.js');
const script = fs.readFileSync(filename, 'utf8');
function squad(id, x, intent) {
  const members = Array.from({ length: 4 }, (_, i) => ({
    id: id + '-' + i,
    dead: false,
    root: { position: { x, z: i * 0.03 } },
    _movementStopReason: 'arrived',
    _movementResolver: { last: { owner: 'squad-stability' } }
  }));
  return {
    id,
    faction: 'us',
    state: 'advance',
    commandPhase: 'assault',
    members,
    _macroMission: { intent: intent || 'capture', status: 'executing', version: 2, point: { x: 200, z: 0 } }
  };
}
function setup() {
  const root = { location: { search: '' }, BattleProbes: {} };
  new Function('window', script)(root);
  const probe = root.BattleProbes['squad-local-starvation'];
  const a = squad('us-progress', 0),
    b = squad('us-stalled', 0);
  const sim = { time: 0, factions: { us: { squads: [a, b] }, ge: { squads: [] } } };
  probe.start(sim);
  return { probe, a, b, sim };
}
function advance(w, to) {
  for (let t = w.sim.time + 1; t <= to; t++) {
    w.sim.time = t;
    w.a.members.forEach(m => {
      m.root.position.x += 3;
    });
    w.probe.sample(w.sim);
  }
}
const w = setup();
advance(w, 44);
assert.equal(w.probe.report().episodes.length, 0, 'must wait full 45s per version');
advance(w, 50);
const events = w.probe.report().episodes;
assert.equal(events.length, 1, 'the independent stalled squad is reported once');
assert.equal(events[0].squad, 'us:us-stalled', 'the advancing squad stays clear');
assert.ok(events[0].distanceToMission > 150, 'check remote mission, not local waypoint');
assert.equal(events[0].arrivedAtInterimWaypoint, 4, 'micro arrival is not mission arrival');
assert.equal(events[0].protectedBy, null);
assert.equal(events[0].conclusion, 'requires-command-or-route-review');
const v = setup();
advance(v, 24);
v.b._macroMission.version = 3;
advance(v, 52);
assert.equal(v.probe.report().episodes.length, 0, 'new mission version gets a fresh window');
const recon = setup();
recon.b._reconTask = { signature: 'recon', scoutIds: [] };
advance(recon, 49);
assert.equal(
  recon.probe.report().episodes[0].conclusion,
  'possible-lawful-hold',
  'do not diagnose a live recon lease as an unauthorized stall'
);
const defend = setup();
defend.b._macroMission.intent = 'defend';
advance(defend, 52);
assert.equal(defend.probe.report().episodes.length, 0, 'defensive mission is a legitimate hold');
const close = setup();
close.b.members.forEach(m => {
  m.root.position.x = 199;
});
advance(close, 52);
assert.equal(close.probe.report().episodes.length, 0, 'at actual mission destination is not a stall');
console.log('PASS #361 squad-local inaction detection, version boundaries, recon and defend hold negatives');
