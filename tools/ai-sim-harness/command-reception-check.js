#!/usr/bin/env node
'use strict';
/* Phase 0A: behavior-neutral individual command receipt/adoption telemetry.

   The module may observe squad/fireteam command publication and predict deterministic per-man
   receipt/processing/adoption times. It must not yet gate or alter simulation behavior. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const H=require('./harness');
const log=console.log;
console.log=(...a)=>(typeof a[0]==='string'&&a[0][0]==='['?undefined:log(...a));
let n=0;
function test(name,fn){fn();n++;console.log('PASS '+name);}

function world(search){
  H.resetIds();
  const r=H.bootstrap({search:search==null?'?commandReception=1':search});
  const b=H.makeBattle(r,{seed:31});
  const us=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:120},facing:0});
  const ge=H.addSquad(r,b,{id:'ge-0',faction:'ge',x:0,z:180,objective:{x:0,z:0},facing:Math.PI});
  us.commandPhase='approach';
  us.orderAnchor={x:0,z:0};us.rally={x:0,z:0};us.objective={x:0,z:120};
  return{r,b,us,ge,C:r.BattleCommandReception,Q:r.BattleSquadStability};
}
function behaviorShape(ctx){
  return ctx.us.members.map(s=>({
    id:s.id,
    prone:!!s.prone,
    crouch:!!s.tacticalCrouch,
    target:s.target&&s.target.id,
    fireteam:s._fireteamDestination?{x:s._fireteamDestination.x,z:s._fireteamDestination.z}:null,
    order:s.orderDestination?{x:s.orderDestination.x,z:s.orderDestination.z}:null
  }));
}
function issueBaseline(ctx){
  ctx.b.time=10;
  ctx.Q.updateFireteams(ctx.us,ctx.b);
  const foe=ctx.ge.members[0];
  ctx.us.contact={unit:foe,x:foe.root.position.x,z:foe.root.position.z,at:10,seenBy:ctx.us.members[0].id,stance:'stand'};
  ctx.Q.updateFireControl(ctx.us,ctx.b,{underFire:0});
  return behaviorShape(ctx);
}

test('module owns telemetry only and never writes stance, target or destinations',()=>{
  const src=fs.readFileSync(path.join(H.REPO,'battle/modules/18-command-reception.js'),'utf8');
  assert.doesNotMatch(src,/\.(?:destination|orderDestination|target|prone|crawling|tacticalCrouch)\s*=/);
  assert.doesNotMatch(src,/\b(?:Math\.random|battle\.random)\s*\(/);
  const w=world(),s=w.us.members[1];
  s.destination={x:3,z:4};s.orderDestination={x:5,z:6};s.prone=true;s.target=w.ge.members[0];
  const before={destination:{...s.destination},order:{...s.orderDestination},prone:s.prone,target:s.target};
  const env=w.C.publish(w.us,w.b,'movement',[s],{scope:'test',action:'move',signature:'a',spatial:true,point:{x:20,z:20}});
  assert.ok(env&&env.version===1);
  assert.deepEqual(s.destination,before.destination);
  assert.deepEqual(s.orderDestination,before.order);
  assert.equal(s.prone,before.prone);
  assert.equal(s.target,before.target);
});

test('same published command coalesces; a changed command gets the next version',()=>{
  const w=world();w.b.time=5;
  const a=w.C.publish(w.us,w.b,'movement',w.us.members,{scope:'squad',action:'regroup',signature:'regroup|1',spatial:true,point:{x:10,z:0}});
  const again=w.C.publish(w.us,w.b,'movement',w.us.members,{scope:'squad',action:'regroup',signature:'regroup|1',spatial:true,point:{x:10,z:0}});
  const b=w.C.publish(w.us,w.b,'movement',w.us.members,{scope:'squad',action:'regroup',signature:'regroup|2',spatial:true,point:{x:20,z:0}});
  assert.equal(again.id,a.id);
  assert.equal(again.version,1);
  assert.equal(b.version,2);
  assert.notEqual(b.id,a.id);
});

test('one command produces deterministic staggered personal receipt/adoption plans without RNG',()=>{
  function run(){
    const w=world();w.b.time=12;
    let draws=0;const real=w.b.random;
    w.b.random=function(){draws++;return real.call(this);};
    const env=w.C.publish(w.us,w.b,'movement',w.us.members,{scope:'squad',action:'regroup',signature:'regroup|stable',spatial:true,point:{x:0,z:30}});
    const rows=w.us.members.map(s=>w.C.snapshot(s,w.b).records['movement|squad']).filter(Boolean);
    return{draws,id:env.id,rows:rows.map(r=>({id:r.sourceId,receivedAt:r.receivedAt,processedAt:r.processedAt,adoptedAt:r.adoptedAt,phase:r.phase,distance:r.distance}))};
  }
  const a=run(),b=run();
  assert.equal(a.draws,0);
  assert.deepEqual(a,b,'same battle and ids produce the same receipt plan');
  assert.ok(new Set(a.rows.map(r=>r.adoptedAt)).size>1,'men do not share one adoption timestamp');
  assert.ok(a.rows.every(r=>r.adoptedAt>=r.processedAt&&r.processedAt>=r.receivedAt));
});

test('receipt phases advance on simulated time while current gameplay remains untouched',()=>{
  const w=world(),s=w.us.members[2];
  w.b.time=20;
  w.C.publish(w.us,w.b,'movement',[s],{scope:'test',action:'building',signature:'building|a',spatial:true,point:{x:25,z:40}});
  let r=w.C.snapshot(s,w.b).records['movement|test'];
  assert.equal(r.phase,'issued');
  const originalDestination=s.destination&&{...s.destination};
  w.b.time=r.receivedAt+.001;
  r=w.C.snapshot(s,w.b).records['movement|test'];
  assert.ok(r.phase==='received'||r.phase==='orienting'||r.phase==='processing');
  w.b.time=r.adoptedAt+.001;
  r=w.C.snapshot(s,w.b).records['movement|test'];
  assert.equal(r.phase,'adopted');
  assert.deepEqual(s.destination,originalDestination);
});

test('shipping Meso publication is observed for both fire-control and fireteam movement',()=>{
  const w=world();
  issueBaseline(w);
  const tel=w.C.telemetry(w.b);
  assert.ok(tel.byCategory.movement>0,JSON.stringify(tel));
  assert.ok(tel.byCategory['posture-fire']>0,JSON.stringify(tel));
  assert.equal(w.us.fireControl.state,'hold');
  assert.ok(w.C.squadSnapshot(w.us,w.b).some(e=>e.category==='movement'));
  assert.ok(w.C.squadSnapshot(w.us,w.b).some(e=>e.category==='posture-fire'));
});

test('Phase 0A is behavior-neutral against commandReception=0 for the same Meso decisions',()=>{
  const on=world('?commandReception=1'),off=world('?commandReception=0');
  const onShape=issueBaseline(on),offShape=issueBaseline(off);
  assert.deepEqual(onShape,offShape);
  assert.equal(on.us.fireControl.state,off.us.fireControl.state);
  assert.equal(off.C.enabled(),false);
  assert.equal(off.b._commandReception,undefined);
  assert.equal(off.C.telemetry(off.b),null);
});

test('full diagnostics exports battle, squad and per-soldier command receipt views',()=>{
  const src=fs.readFileSync(path.join(H.REPO,'battle/modules/99-session-diagnostics-export.js'),'utf8');
  assert.match(src,/commandReception:root\.BattleCommandReception&&root\.BattleCommandReception\.telemetry/);
  assert.match(src,/commandReception:root\.BattleCommandReception&&root\.BattleCommandReception\.squadSnapshot/);
  assert.match(src,/commandReception:root\.BattleCommandReception&&root\.BattleCommandReception\.snapshot/);
});

console.log(n+' command-reception checks passed');
