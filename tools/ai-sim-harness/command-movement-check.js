#!/usr/bin/env node
'use strict';
/* Phase 0C: personally adopted Meso movement orders.

   Squad Command remains the writer of _fireteamDestination. Command Reception owns only pending/adopted
   information and Movement Resolver still receives the adopted point for physical arbitration.
   The behavior is opt-in with ?commandMovement=1 while paired benchmark validation is pending. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const H=require('./harness');
const log=console.log;
console.log=(...a)=>(typeof a[0]==='string'&&a[0][0]==='['?undefined:log(...a));
let n=0;
function test(name,fn){fn();n++;console.log('PASS '+name);}

function point(v){return v&&{x:+v.x,z:+v.z};}
function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function world(search){
  H.resetIds();
  const r=H.bootstrap({search:search||'?stressAct=0&commandMovement=1'});
  const b=H.makeBattle(r,{seed:57});
  const q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:120},facing:0});
  q.state='advance';q.commandPhase='approach';q.orderAnchor={x:0,z:0};q.rally={x:0,z:0};q.objective={x:0,z:120};
  const calls=[];
  r.BattleMovementResolver={
    proposeOrder(s,p,battle,urgent){calls.push({id:String(s.id),point:point(p),at:battle.time,urgent:!!urgent});}
  };
  return{r,b,q,Q:r.BattleSquadStability,C:r.BattleCommandReception,calls};
}
function slot(s){return'movement|soldier:'+String(s.id);}
function pending(w,s){return w.C.snapshot(s,w.b).records[slot(s)]||null;}
function adopted(w,s){return w.C.adopted(s,w.b,'movement','soldier:'+String(s.id));}
function issue(w){w.Q.updateFireteams(w.q,w.b);}
function allLive(w){return w.q.members.filter(s=>!s.dead);}

test('movement adoption is opt-in while Phase 0C is benchmark-gated',()=>{
  assert.equal(world('?stressAct=0').C.movementEnabled(),false,'default battle remains immediate movement publication');
  assert.equal(world('?stressAct=0&commandMovement=0').C.movementEnabled(),false);
  assert.equal(world('?stressAct=0&commandMovement=1').C.movementEnabled(),true);
});

test('a fresh Meso slot is pending information, not a personal destination, until adoption',()=>{
  const w=world(),man=w.q.members[4];
  issue(w);
  const rec=pending(w,man);
  assert.ok(rec&&rec.point&&rec.adoptedAt>w.b.time,JSON.stringify(rec));
  assert.equal(man._fireteamDestination==null,true,'Squad Command has not applied the pending replacement');
  assert.equal(w.calls.length,0,'Movement Resolver has not received a psychic order');

  w.b.time=rec.adoptedAt+0.001;
  issue(w);
  assert.ok(man._fireteamDestination);
  assert.ok(distance(man._fireteamDestination,rec.point)<1e-9);
  const call=w.calls.find(x=>x.id===String(man.id));
  assert.ok(call,'Movement Resolver receives the order only after adoption');
  assert.ok(distance(call.point,rec.point)<1e-9);
  assert.equal(man._fireteamAdoptedEnvelope,rec.envelopeId);
});

test('one fireteam publication produces staggered individual movement execution',()=>{
  const w=world();issue(w);
  const men=allLive(w),rows=men.map(s=>({s,r:pending(w,s)}));
  assert.ok(rows.every(x=>x.r&&x.r.adoptedAt>w.b.time));
  const times=rows.map(x=>x.r.adoptedAt).sort((a,b)=>a-b);
  assert.ok(new Set(times).size>1,'personal movement adoption deadlines differ');
  w.b.time=(times[2]+times[7])/2;
  issue(w);
  const moved=men.filter(s=>s._fireteamDestination).length;
  assert.ok(moved>0&&moved<men.length,'some men adopted the new order while others retained the old one: '+moved+'/'+men.length);
});

test('formation drift does not continually replace one still-pending personal order',()=>{
  const w=world(),man=w.q.members[5];
  issue(w);
  const first=pending(w,man),firstPoint=point(first.point);
  assert.equal(first.phase,'issued');

  /* Change the live formation frame without changing the parent command signature. The Meso geometry
     can move, but the words this man is still processing remain the first published replacement. */
  w.q.orderAnchor={x:6,z:0};
  w.b.time+=0.15;
  issue(w);
  const still=pending(w,man);
  assert.equal(still.envelopeId,first.envelopeId,'same pending command is not reset by sliding formation geometry');
  assert.ok(distance(still.point,firstPoint)<1e-9);
});

test('an adopted movement order remains active until a materially new replacement is personally adopted',()=>{
  const w=world(),man=w.q.members[6];
  issue(w);
  const a=pending(w,man);
  const maxA=Math.max(...allLive(w).map(s=>pending(w,s).adoptedAt));
  w.b.time=maxA+0.01;
  issue(w);
  const old=point(man._fireteamDestination),oldEnvelope=man._fireteamAdoptedEnvelope;
  assert.ok(old&&oldEnvelope);

  /* A new command frame generates B, but A remains the man's valid order while B is pending. */
  w.q.orderAnchor={x:28,z:22};
  w.q._fireteamOrders={};
  w.b.time+=0.15;
  issue(w);
  const b=pending(w,man);
  assert.notEqual(b.envelopeId,oldEnvelope);
  assert.ok(b.adoptedAt>w.b.time);
  assert.ok(distance(man._fireteamDestination,old)<1e-9,'the previous adopted order survives while replacement B is pending');
  assert.equal(man._fireteamAdoptedEnvelope,oldEnvelope);

  w.b.time=b.adoptedAt+0.001;
  issue(w);
  assert.equal(man._fireteamAdoptedEnvelope,b.envelopeId);
  assert.ok(distance(man._fireteamDestination,b.point)<1e-9);
  assert.ok(distance(man._fireteamDestination,old)>0.05,'the replacement is applied only after adoption');
});

test('a regroup replacement uses the same personal movement channel',()=>{
  const w=world(),man=w.q.members[4];
  issue(w);
  w.b.time=Math.max(...allLive(w).map(s=>pending(w,s).adoptedAt))+0.01;
  issue(w);
  const old=point(man._fireteamDestination);

  w.q.commandPhase='regroup';
  w.q.orderAnchor={x:-18,z:8};
  w.q._fireteamOrders={};
  w.b.time+=0.15;
  issue(w);
  const r=pending(w,man);
  assert.equal(r.action,'regroup');
  assert.equal(r.data.kind,'regroup');
  assert.ok(distance(man._fireteamDestination,old)<1e-9,'regroup is not same-tick personal truth');

  w.b.time=r.adoptedAt+0.001;
  issue(w);
  assert.equal(adopted(w,man).action,'regroup');
  assert.ok(distance(man._fireteamDestination,r.point)<1e-9);
});

test('legacy/control arm still publishes the computed fireteam slots immediately',()=>{
  const w=world('?stressAct=0&commandMovement=0');
  issue(w);
  assert.ok(allLive(w).every(s=>s._fireteamDestination),'control arm keeps immediate Meso publication');
  assert.equal(w.calls.length,allLive(w).length,'each immediate personal slot reaches the resolver');
  assert.equal(w.C.telemetry(w.b).movementAdoption,false);
});

test('a cancelled regroup cannot survive return to the previously adopted mission',()=>{
  const w=world(),man=w.q.members[4];
  issue(w);
  w.b.time=3; issue(w);
  const original=point(man._fireteamDestination);
  w.q.commandPhase='regroup';w.b.time+=.15;issue(w);
  const cancelled=pending(w,man);
  assert.equal(cancelled.action,'regroup');
  w.q.commandPhase='approach';w.b.time+=.15;issue(w);
  w.b.time=6;issue(w);
  assert.equal(adopted(w,man).action,'formation','the cancelled regroup must be superseded even when the restored destination is unchanged');
  assert.notEqual(adopted(w,man).envelopeId,cancelled.envelopeId);
  assert.ok(distance(man._fireteamDestination,original)<1e-9);
});

test('Command Reception remains information-only and Movement Resolver is still downstream',()=>{
  const cr=fs.readFileSync(path.join(H.REPO,'battle/modules/18-command-reception.js'),'utf8');
  const meso=fs.readFileSync(path.join(H.REPO,'battle/modules/16-squad-plan-stability.js'),'utf8');
  assert.doesNotMatch(cr,/\.(?:destination|orderDestination|_fireteamDestination|target|prone|crawling|tacticalCrouch)\s*=/);
  assert.doesNotMatch(cr,/\b(?:Math\.random|battle\.random)\s*\(/);
  assert.match(meso,/BattleMovementResolver\.proposeOrder\([\s\S]*?_fireteamDestination/,'adopted Meso intent still enters the existing resolver');
});

console.log(n+' command-movement checks passed');
