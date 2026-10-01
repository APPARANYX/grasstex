#!/usr/bin/env node
'use strict';
/* Squad Leader fire control: first visual contact -> hold/prep -> precision or open; incoming fire returns immediately. */
const assert=require('node:assert/strict'),H=require('./harness');
const log=console.log;console.log=(...a)=>(typeof a[0]==='string'&&a[0][0]==='['?undefined:log(...a));
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}
function world(search,range){
  H.resetIds();
  const r=H.bootstrap({search:search||'?stressAct=0',stats:true});
  r.BattleModules.unitsFor=b=>(b._roster.us||[]).concat(b._roster.ge||[]);
  const b=H.makeBattle(r,{seed:77});
  const us=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:200},facing:0});
  const ge=H.addSquad(r,b,{id:'ge-0',faction:'ge',x:0,z:range||100,objective:{x:0,z:-200},facing:Math.PI});
  const foe=ge.members[0]; ge.members.slice(1).forEach(s=>s.dead=true);
  us.commandPhase='assault';
  us.members.forEach(s=>{s.target=foe;s.root.rotation.y=0;s.moving=false;s.moveSpeed=0;s.suppressedUntil=0;});
  us.contact={unit:foe,x:foe.root.position.x,z:foe.root.position.z,at:b.time,seenBy:us.members[2].id,stance:'stand'};
  return{r,b,us,ge,foe,E:r.BattleEngagement,Q:r.BattleSquadStability,St:r.BattleSoldierStats};
}
function command(w){return w.Q.fireAndMovement(w.us,w.b),w.us.fireControl;}
function prep(w){
  w.us.members.filter(s=>!s.dead).forEach(s=>w.E.updateSoldier(s,w.b));
  w.us.members.filter(s=>!s.dead).forEach(s=>{s.moving=false;s.moveSpeed=0;});
}
test('first visual contact holds fire and makes the squad prepare prone before a volley',()=>{
  const w=world('?stressAct=0&fireControl=1',100);
  let fc=command(w);
  assert.equal(fc.state,'hold');
  assert.equal(w.E.fireAuthorized(w.us.members[4],w.b),false,'contact is not permission');
  w.us.members.filter(s=>!s.dead).forEach(s=>s.target=null);
  fc=command(w);
  assert.equal(fc.state,'hold','a prone-prep LOS blink does not cancel the order');
  assert.equal(w.us.inContact,true,'the first-hand contact keeps preparation live');
  prep(w);
  assert.ok(w.us.members.filter(s=>!s.dead).every(s=>s.prone),'the whole available squad gets low');
  w.b.time+=1.3;
  fc=command(w);
  assert.equal(fc.state,'open');
  assert.ok(fc.ready>=7,'70% line readiness: '+fc.ready);
  assert.equal(w.E.fireAuthorized(w.us.members[4],w.b),true);
});
test('long range prefers one strong in-range marksman while the rest keep holding',()=>{
  /* 141.5 m puts the squad-average contact just beyond the 140 m precision threshold while the
     nearest rifleman is still inside his rifle's real 140 m combat range. A US scout's M1 Carbine
     is only 110 m, so expecting the scout at 160 m would test an impossible shot rather than fire control. */
  const w=world('?stressAct=0&fireControl=1',141.5);
  const tp=w.foe.root.position;
  const marksman=w.us.members
    .filter(s=>s.role==='rifleman')
    .sort((a,b)=>Math.hypot(a.root.position.x-tp.x,a.root.position.z-tp.z)-Math.hypot(b.root.position.x-tp.x,b.root.position.z-tp.z))[0];
  w.us.members.forEach(s=>{w.St.of(s).mkm=0.45;});
  w.St.of(marksman).mkm=0.9;
  assert.ok(w.r.SquadAI.engageRange(marksman)>=Math.hypot(marksman.root.position.x-tp.x,marksman.root.position.z-tp.z),'fixture marksman is actually in range');
  let fc=command(w); assert.equal(fc.state,'hold');
  prep(w); w.b.time+=1.3;
  fc=command(w);
  assert.equal(fc.state,'precision');
  assert.equal(String(fc.shooterId),String(marksman.id));
  assert.equal(w.E.fireAuthorized(marksman,w.b),true);
  const other=w.us.members.find(s=>!s.dead&&s!==marksman);
  assert.equal(w.E.fireAuthorized(other,w.b),false);
  marksman.target=null;
  marksman.prone=false;
  w.E.updateSoldier(marksman,w.b);
  assert.equal(marksman.prone,true,'the designated shooter stays in the prepared posture while reacquiring');
});
test('a man under incoming fire may answer immediately and the leader opens the squad',()=>{
  const w=world('?stressAct=0&fireControl=1',110);
  let fc=command(w); assert.equal(fc.state,'hold');
  const man=w.us.members[4];
  man.mind=man.mind||{}; man.mind.lastIncomingAt=w.b.time;
  assert.equal(w.E.fireAuthorized(man,w.b),true,'personal return fire does not wait');
  fc=command(w);
  assert.equal(fc.state,'open');
  assert.equal(fc.reason,'enemy fire received');
});
test('zero firing lines after the prep window repositions under hold fire instead of deadlocking',()=>{
  const w=world('?stressAct=0&fireControl=1',100);
  let fc=command(w); assert.equal(fc.state,'hold');
  const real=w.E.fireControlReady;
  w.E.fireControlReady=()=>false;
  w.b.time+=w.Q.tuning.fireControl.maxHold+0.1;
  fc=command(w);
  assert.equal(fc.state,'reposition');
  assert.equal(fc.reason,'no viable prone firing line');
  assert.equal(w.E.fireAuthorized(w.us.members[4],w.b),false,'reposition is movement under hold fire, not permission');
  w.E.fireControlReady=real;
});

test('fireControl=0 preserves immediate-fire behavior',()=>{
  const w=world('?stressAct=0&fireControl=0',100);
  command(w);
  assert.equal(w.us.fireControl||null,null);
  assert.equal(w.E.fireAuthorized(w.us.members[4],w.b),true);
});
console.log(n+' fire-control checks passed');
