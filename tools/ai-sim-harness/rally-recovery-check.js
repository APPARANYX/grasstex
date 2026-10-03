#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),H=require('./harness');
function fixture(search){
  H.resetIds();const r=H.bootstrap({search:search||''}),b=H.makeBattle(r,{seed:+(process.env.HARNESS_SEED||12345)});
  const q=H.addSquad(r,b,{id:'us-1',faction:'us',x:0,z:0,objective:{x:0,z:120}});
  r.BattleSoldierMind=r.BattleSoldierMind||{};r.BattleSoldierMind.squadStress=()=>0.1;r.BattleSoldierMind.teamStress=()=>0.1;r.BattleSoldierMind.leadStress=()=>0.1;
  const leader=r.SquadAI.leaderOf(q),victims=q.members.filter(m=>m!==leader).slice(0,4);victims.forEach(m=>{m.dead=true;});
  q.state='retreat';q.inContact=false;
  const live=q.members.filter(m=>!m.dead);
  live.forEach((m,i)=>{m.root.position.x=(i%2?-45:45);m.root.position.z=80+Math.floor(i/2)*12;});
  return{r,b,q,live,S:r.BattleSquadStability};
}
const f=fixture('');
assert.equal(f.S.rallyRecoveryOn(),true);
f.b.time=1;f.r.SquadAI.updateSquad(f.q,f.b);
assert.equal(f.q.state,'retreat','calm morale alone cannot instantly reverse a retreat');
assert.ok(f.q._moraleRallyPoint,'Squad Leader creates a local physical rally point');
assert.ok(f.q._leases&&f.q._leases.live['rally-recovery']);
f.b.time=10;f.r.SquadAI.updateSquad(f.q,f.b);assert.equal(f.q.state,'retreat','a dispersed squad remains under retreat authority');
const p={...f.q._moraleRallyPoint};
f.live.forEach((m,i)=>{m.root.position.x=p.x+(i%3-1)*.5;m.root.position.z=p.z+(Math.floor(i/3)-.5)*.5;});
f.b.time=10.1;f.r.SquadAI.updateSquad(f.q,f.b);assert.equal(f.q.state,'retreat');
f.b.time=13.9;f.r.SquadAI.updateSquad(f.q,f.b);assert.equal(f.q.state,'retreat','stable reform must dwell before mission handback');
f.b.time=14.2;f.r.SquadAI.updateSquad(f.q,f.b);assert.equal(f.q.state,'advance','physically reformed squad may resume the mission');
assert.equal(f.q._moraleRallyPoint,null);assert.equal(f.q._leases.live['rally-recovery'],undefined);
const legacy=fixture('?rallyRecovery=0');legacy.b.time=1;legacy.r.SquadAI.updateSquad(legacy.q,legacy.b);
assert.equal(legacy.q.state,'advance','explicit control preserves the old morale-only immediate rally');
console.log('PASS US-1 retreat cannot become a backwards assault before physical rally/reform');
