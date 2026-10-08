#!/usr/bin/env node
'use strict';
/* A squad in retreat is not defending. A prepared defender whose commandPhase is still `defend` when the squad falls back
   (or is briefed to a reconstitution rally) must be sent where the retreat goes, not back to the post it just left. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
function load(r, file) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, file), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
function fixture() {
  const r = H.bootstrap({ modules: false });
  r.BattleModules = { registerSystem() {}, unitsFor: b => b._roster.us.concat(b._roster.ge) };
  r.BattleCommanderAI = {
    policyFor() {
      return {};
    }
  };
  load(r, 'battle/movement-resolver.js');
  load(r, 'battle/modules/15b-squad-leader-buddy-pairs.js');
  load(r, 'battle/modules/15g-squad-leader-formation.js');
  load(r, 'battle/modules/15h-squad-leader-fireteams.js');
  load(r, 'battle/modules/16-squad-plan-stability.js');
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: 0,
      objective: { x: 0, z: 200 },
      composition: ['sergeant', 'rifleman', 'rifleman', 'rifleman', 'rifleman', 'rifleman', 'rifleman']
    });
  return { r, b, q };
}
const POST = { x: 60, z: 240 };
function run(retreat) {
  const { r, b, q } = fixture();
  q.commandPhase = 'defend';
  q.orderAnchor = { x: 0, z: 0 };
  q.rally = { x: 0, z: 0 };
  q.home = { x: 0, z: -80 };
  q.baseHome = { x: 0, z: -80 };
  q.members.forEach((s, i) => {
    s._preparedDefensePost = { x: POST.x + i, z: POST.z };
  });
  if (retreat) q.state = 'retreat';
  for (let step = 0; step < 6; step++) {
    b.time += 0.5;
    r.SquadAI.updateSquad(q, b);
  }
  return q.members.map(s => s._fireteamDestination).filter(Boolean);
}
const holding = run(false),
  falling = run(true);
assert.ok(holding.length > 0, 'the fixture publishes fireteam orders');
assert.ok(
  holding.every(p => Math.hypot(p.x - POST.x, p.z - POST.z) < 12),
  'control: a prepared defender that is not in retreat is sent to his post'
);
console.log('PASS control: a prepared defender holds his post');
assert.ok(falling.length > 0, 'the retreating fixture publishes fireteam orders');
assert.ok(
  falling.every(p => Math.hypot(p.x - POST.x, p.z - POST.z) > 100),
  'a squad in retreat is not sent back to the defence posts: ' + JSON.stringify(falling)
);
console.log('PASS a retreating squad whose phase is still defend does not walk back to its prepared posts');
