#!/usr/bin/env node
'use strict';
/* Phase 0B: personally adopted posture/fire-control orders.

   The Squad Leader still owns the shared fire-control decision. Command Reception owns only the
   per-man receipt/adoption sidecar, and Engagement remains the sole executor of stance/fire permission.
   The behavior is opt-in with ?commandPosture=1 while benchmark validation is pending. */
const assert=require('node:assert/strict'),H=require('./harness');
const log=console.log;console.log=(...a)=>(typeof a[0]==='string'&&a[0][0]==='['?undefined:log(...a));
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}

function world(search,range){
  H.resetIds();
  const r=H.bootstrap({search:search||'?stressAct=0&fireControl=1&commandPosture=1',stats:true});
  r.BattleModules.unitsFor=b=>(b._roster.us||[]).concat(b._roster.ge||[]);
  const b=H.makeBattle(r,{seed:91});
  const us=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:200},facing:0});
  const ge=H.addSquad(r,b,{id:'ge-0',faction:'ge',x:0,z:range||100,objective:{x:0,z:-200},facing:Math.PI});
  const foe=ge.members[0];ge.members.slice(1).forEach(s=>s.dead=true);
  us.commandPhase='assault';
  us.members.forEach(s=>{s.target=foe;s.root.rotation.y=0;s.moving=false;s.moveSpeed=0;s.suppressedUntil=0;});
  if(r.SquadAI.soldierBeliefsOn&&r.SquadAI.soldierBeliefsOn())
    us.members.forEach(s=>r.SquadAI.rememberSeen(s,foe,b,true,'fixture-first-sight'));
  us.contact={unit:foe,x:foe.root.position.x,z:foe.root.position.z,at:b.time,seenBy:us.members[2].id,stance:'stand',firstHandAt:b.time};
  return{r,b,us,ge,foe,E:r.BattleEngagement,Q:r.BattleSquadStability,C:r.BattleCommandReception};
}
function command(w){w.Q.fireAndMovement(w.us,w.b);return w.us.fireControl;}
function rec(w,s){return w.C.snapshot(s,w.b).records['posture-fire|squad'];}
function adopted(w,s){return w.C.adopted(s,w.b,'posture-fire','squad');}

test('posture adoption is default-on after Phase 0E benchmark validation',()=>{
  assert.equal(world('?stressAct=0&fireControl=1').C.postureEnabled(),true,'default battle now uses posture adoption');
  assert.equal(world('?stressAct=0&fireControl=1&commandPosture=0').C.postureEnabled(),false,'?commandPosture=0 is the legacy control arm');
  assert.equal(world('?stressAct=0&fireControl=1&commandPosture=1').C.postureEnabled(),true);
});

test('a fresh HOLD order is not personal truth until that soldier adopts it',()=>{
  const w=world(),man=w.us.members[4];
  const fc=command(w);
  assert.equal(fc.state,'hold');
  const pending=rec(w,man);
  assert.ok(pending&&pending.adoptedAt>w.b.time,JSON.stringify(pending));
  assert.equal(adopted(w,man),null,'no previously adopted posture order');
  assert.equal(w.E.fireAuthorized(man,w.b),true,'the new squad HOLD is not psychic');

  w.b.time=pending.adoptedAt+0.001;
  const active=adopted(w,man);
  assert.equal(active.data.state,'hold');
  assert.equal(w.E.fireAuthorized(man,w.b),false,'HOLD applies after personal adoption');
  w.E.updateSoldier(man,w.b);
  assert.equal(man.prone,true,'Engagement, not Command Reception, executes the adopted low posture');
});

test('one HOLD command yields staggered individual execution instead of a same-tick squad flip',()=>{
  const w=world();command(w);
  const men=w.us.members.filter(s=>!s.dead),rows=men.map(s=>({s,r:rec(w,s)}));
  const times=rows.map(x=>x.r.adoptedAt).sort((a,b)=>a-b);
  assert.ok(new Set(times).size>1,'personal adoption deadlines differ');
  const probe=(times[2]+times[7])/2;
  w.b.time=probe;
  const blocked=rows.filter(x=>!w.E.fireAuthorized(x.s,w.b)).length;
  assert.ok(blocked>0&&blocked<men.length,'some men have HOLD while others have not: '+blocked+'/'+men.length);
});

test('an adopted HOLD remains effective until the replacement OPEN is personally adopted',()=>{
  const w=world(),man=w.us.members[6];
  command(w);
  let hold=rec(w,man);
  w.b.time=hold.adoptedAt+0.01;
  assert.equal(w.E.fireAuthorized(man,w.b),false);

  /* Let the physically ready squad complete its preparation and cause the real Squad Leader path
     to publish OPEN. */
  w.us.members.filter(s=>!s.dead).forEach(s=>w.E.updateSoldier(s,w.b));
  w.us.members.forEach(s=>{s.moving=false;s.moveSpeed=0;});
  w.b.time=Math.max(w.b.time+0.15,2.0);
  let fc=command(w);
  if(fc.state!=='open'){
    w.b.time+=w.Q.tuning.fireControl.maxHold+0.2;
    fc=command(w);
  }
  assert.equal(fc.state,'open','shipping Meso published the replacement order');
  const open=rec(w,man);
  assert.equal(open.data.state,'open');
  assert.equal(adopted(w,man).data.state,'hold','old adopted order remains active while OPEN is pending');
  assert.equal(w.E.fireAuthorized(man,w.b),false);

  w.b.time=open.adoptedAt+0.001;
  assert.equal(adopted(w,man).data.state,'open');
  assert.equal(w.E.fireAuthorized(man,w.b),true);
});

test('personal incoming fire bypasses an adopted HOLD immediately without rewriting the command',()=>{
  const w=world(),man=w.us.members[5];
  command(w);
  const hold=rec(w,man);
  w.b.time=hold.adoptedAt+0.001;
  assert.equal(w.E.fireAuthorized(man,w.b),false);
  man.mind=man.mind||{};man.mind.lastIncomingAt=w.b.time;
  assert.equal(w.E.fireAuthorized(man,w.b),true,'survival return fire beats the squad HOLD');
  assert.equal(adopted(w,man).data.state,'hold','the personal reflex did not mutate Squad Leader intent');
});

test('precision permission is also personal: only the adopted designated shooter may fire',()=>{
  const w=world(),shot=w.us.members[3],other=w.us.members[4];
  w.b.time=7;
  w.C.publish(w.us,w.b,'posture-fire',w.us.members,{
    scope:'squad',action:'fire-control-precision',signature:'precision|enemy|'+shot.id,
    spatial:false,data:{state:'precision',targetId:String(w.foe.id),shooterId:String(shot.id)}
  });
  const sr=rec(w,shot),or=rec(w,other);
  w.b.time=Math.max(sr.adoptedAt,or.adoptedAt)+0.001;
  assert.equal(w.E.fireAuthorized(shot,w.b),true);
  assert.equal(w.E.fireAuthorized(other,w.b),false);
});

test('legacy/control arm still reads shared squad fireControl immediately',()=>{
  const w=world('?stressAct=0&fireControl=1&commandPosture=0&commandMovement=0&commandRelay=0'),man=w.us.members[4];
  const fc=command(w);
  assert.equal(fc.state,'hold');
  assert.equal(w.E.fireAuthorized(man,w.b),false,'legacy shared HOLD is immediate');
  assert.equal(w.C.telemetry(w.b).behaviorNeutral,true);
});

test('Command Reception remains a sidecar and does not become a stance/fire owner',()=>{
  const fs=require('node:fs'),path=require('node:path');
  const src=fs.readFileSync(path.join(H.REPO,'battle/modules/18-command-reception.js'),'utf8');
  assert.doesNotMatch(src,/\.(?:destination|orderDestination|target|prone|crawling|tacticalCrouch|fireReadyAt)\s*=/);
  assert.doesNotMatch(src,/\b(?:Math\.random|battle\.random)\s*\(/);
});

console.log(n+' command-posture checks passed');
