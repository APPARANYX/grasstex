#!/usr/bin/env node
'use strict';
// Arrival at the previous order must not acknowledge an unadopted replacement.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const H = require('./harness');
const r = H.bootstrap({search:'?commandMovement=1&stressAct=0&scoutsForward=0'});
new Function('window','globalThis','console',fs.readFileSync(H.REPO+'/battle/movement-resolver.js','utf8'))(r,r,console);
const b = H.makeBattle(r), q = H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:300}});
const Q = r.BattleSquadStability;
q.commandPhase='approach'; q.state='advance';
Q.updateFireteams(q,b);
b.time=3; Q.updateFireteams(q,b);
q.members.forEach(s=>Object.assign(s.root.position,s.orderDestination));
q._orderGoal={...q.objective}; q.formation=r.SquadAI.formationFor(q);
const trace=[];
for(let i=0;i<10;i++) {
  b.time+=.15; Q.advanceSquadAnchor(q,b); Q.updateFireteams(q,b);
  trace.push({t:+b.time.toFixed(2),anchorZ:q.orderAnchor.z,version:q._orderVersion});
}
console.log(JSON.stringify(trace));
assert.ok(q.orderAnchor.z<=26,'waiting soldiers cannot acknowledge successive 13 m strides: '+q.orderAnchor.z);
console.log('PASS: pending movement cannot repeatedly advance the squad anchor');
