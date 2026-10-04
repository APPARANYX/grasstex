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

function fixture() {
  H.resetIds();
  const r=H.bootstrap({search:'?commandMovement=1&stressAct=0&scoutsForward=0'});
  new Function('window','globalThis','console',fs.readFileSync(H.REPO+'/battle/movement-resolver.js','utf8'))(r,r,console);
  const b=H.makeBattle(r,{seed:+process.env.HARNESS_SEED||57});
  const q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:300}});
  q.commandPhase='approach'; q.state='advance'; q.route=[{x:0,z:300}];
  return {r,b,q,Q:r.BattleSquadStability};
}
function run(w,seconds) {
  H.run(w.r,w.b,seconds,()=>{
    w.Q.updateCohesion(w.b,w.q);
    w.Q.executeMission(w.b,w.q,null);
  });
}
{
  const w=fixture();run(w,60);
  assert.equal(w.q._regroupHysteresis.entries,0,'ordinary open-ground travel needs no regroup');
  assert.ok(w.q.members.every(s=>s.root.position.z>100),'every man makes physical mission progress');
  assert.ok(w.q._cohesionAssessment.coreSpread<34,'travel keeps the main body together');
  const teams=w.q._fireteamOrders;
  assert.ok(Math.hypot(teams.alpha.anchor.x-teams.bravo.anchor.x,teams.alpha.anchor.z-teams.bravo.anchor.z)>=5,'travel retains distinct fireteam lanes');
  console.log('PASS: individually adopted travel preserves physical progress, cohesion and fireteam lanes');
}
{
  const w=fixture();
  w.q.members.forEach((s,i)=>{s.root.position.x=(i%2?-1:1)*(20+i*6);s.root.position.z=(i%3)*25;});
  run(w,5);
  assert.ok(w.r.BattleLeases.get(w.q,'regroup'),'genuine physical separation enters regroup');
  run(w,85);
  const stats=w.q._regroupHysteresis;
  assert.equal(stats.entries,1,'recovery does not repeatedly reopen');
  assert.equal(stats.exits,1);
  assert.equal(stats.byEnd['cohesion restored'],1,'actual movement completes recovery');
  assert.equal(w.r.BattleLeases.get(w.q,'regroup'),null);
  assert.equal(w.q.commandPhase,'approach');
  assert.deepEqual(w.q.objective,{x:0,z:300},'original mission is restored');
  console.log('PASS: genuine separation recovers physically and resumes the original mission without repeated regroup');
}
{
  const w=fixture(),s=w.q.members[4],R=w.r.BattleMovementResolver;
  w.Q.updateFireteams(w.q,w.b);w.b.time=3;w.Q.updateFireteams(w.q,w.b);
  w.r.BattleEngagement.updateSoldier(s,w.b);
  w.q.inContact=true;s.eng.state='bound';
  const cover={x:15,z:20};
  R.proposeCombat(s,cover,w.b,'cover-bound',5,{source:'engagement'});
  R.resolve(s,w.b);
  w.q.orderAnchor={x:0,z:30};w.q._fireteamOrders={};w.b.time+=.15;w.Q.updateFireteams(w.q,w.b);
  w.b.time+=2;w.Q.updateFireteams(w.q,w.b);R.resolve(s,w.b);
  assert.deepEqual(s.destination,cover,'adopting formation geometry does not interrupt a valid individual cover commitment');
  console.log('PASS: a valid individual tactical commitment survives formation replacement');
}
