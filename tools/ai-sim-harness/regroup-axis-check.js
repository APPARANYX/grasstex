#!/usr/bin/env node
'use strict';
/* Straggler vs outrunner during a regroup (16-squad-plan-stability.js cohesionAssessment). A regroup
   overwrites sq.objective with its own anchor, which is also the order anchor, so the objective axis
   collapses. `_formationForward` rarely exists (SquadAI sets it only for men with no order
   destination; the `regroup-axis` probe found every regroup tick collapsed and 60-75% of them
   scoring a man behind the anchor as an outrunner), so the regroup lease records the direction the
   squad was marching when it opened and `commandForward` scores men along that. A man behind the
   anchor must be a straggler (trimmable, not dispersing), never an outrunner: scored as one, he
   keeps the core spread wide and the regroup can only end on REGROUP_MAX (with the clock removed on
   an experimental branch, a squad sat in a regroup for 510 s). Required before regroups end on a
   result rather than a clock (AGENTS.md open issue "Regroups"). Swept over march directions. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');
function load(r,p){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}});}
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}
function root(){
  const r=H.bootstrap({modules:false}),systems={};
  r.BattleModules={registerSystem(id,s){systems[id]=s;},getSystem(id){return systems[id];},unitsFor:b=>(b._roster.us||[]).concat(b._roster.ge||[])};
  r.BattleCommanderDoctrine={policyFor(){return{cohesionRadius:34,captainlessCohesion:26,routeArrivalRadius:8,captureCommitRatio:.82};}};
  load(r,'battle/movement-resolver.js');load(r,'battle/modules/15a-squad-leader-fire-control.js');load(r,'battle/modules/15b-squad-leader-buddy-pairs.js');load(r,'battle/modules/15c-squad-leader-scouts-forward.js');load(r,'battle/modules/15d-squad-leader-leaderless-intent.js');load(r,'battle/modules/16-squad-plan-stability.js');
  return{r,leader:systems['squad-command']};
}
function tick(leader,b){b.time+=.45;leader.onCommanderTick(b,{town:null});}
const LIMIT=34,FAR=45,HEADINGS=[0,Math.PI/2,Math.PI,-Math.PI/3,2.4];
/* March from the origin toward `heading` (radians, 0 = +z), scatter the squad until the Squad
   Leader commits to a regroup. */
function regrouping(heading){
  const {r,leader}=root(),L=r.BattleLeases,b=H.makeBattle(r),
    f={x:Math.sin(heading),z:Math.cos(heading)},side={x:f.z,z:-f.x},
    q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:f.x*150,z:f.z*150}});
  q.commandPhase='approach';
  H.run(r,b,1.5,()=>tick(leader,b));
  q.members.forEach((s,i)=>{const a=(i%2?-1:1)*(20+i*6),c=(i%3)*25;s.root.position.x=side.x*a+f.x*c;s.root.position.z=side.z*a+f.z*c;});
  for(let i=0;i<10&&!L.get(q,'regroup');i++)tick(leader,b);
  assert.ok(L.get(q,'regroup'),'heading '+heading.toFixed(2)+': the scattered squad regroups');
  tick(leader,b);
  assert.equal(q.commandPhase,'regroup');
  const a=q.orderAnchor;
  assert.ok(Math.hypot(q.objective.x-a.x,q.objective.z-a.z)<.1,'the regroup objective is the anchor (the axis collapses)');
  return{r,q,a,f,side,b,leader};
}
/* Men in a 3 x 3 block on the anchor, plus any `spots` [right, forward] in metres. */
function place(q,a,f,side,spots){
  q.members.forEach((s,i)=>{const o=spots[i]||[((i%3)-1)*2,((i/3|0)-1)*2];
    s.root.position.x=a.x+side.x*o[0]+f.x*o[1];s.root.position.z=a.z+side.z*o[0]+f.z*o[1];});
}
test('a man behind the regroup anchor is a straggler, never an outrunner',()=>{
  for(const h of HEADINGS){
    const {r,q,a,f,side}=regrouping(h),A=r.BattleRegroupHysteresis.assessment;
    place(q,a,f,side,{9:[0,-FAR]});
    const ca=A(q,LIMIT),id=String(q.members[9].id);
    assert.ok(!ca.outrunners.includes(id),'heading '+h.toFixed(2)+': the man '+FAR+' m behind is not an outrunner');
    assert.ok(ca.stragglers.includes(id),'heading '+h.toFixed(2)+': he is a trimmable straggler');
    assert.equal(ca.dispersed,false,'one straggler alone does not keep the squad dispersed');
    const fwd=r.BattleLeases.get(q,'regroup').data.forward;
    assert.ok(fwd&&f.x*fwd.x+f.z*fwd.z>.7,'heading '+h.toFixed(2)+': the regroup keeps the direction the squad marched');
  }
});
test('a man ahead of the anchor, or off to the side, still is an outrunner',()=>{
  for(const h of HEADINGS){
    const {r,q,a,f,side}=regrouping(h),A=r.BattleRegroupHysteresis.assessment;
    place(q,a,f,side,{8:[FAR,0],9:[0,FAR]});
    const ca=A(q,LIMIT);
    for(const i of [8,9])assert.ok(ca.outrunners.includes(String(q.members[i].id)),'heading '+h.toFixed(2)+': man '+i+' blocks the regroup');
    assert.equal(ca.dispersed,true);
  }
});
test('a regroup whose only scattered man is behind ends on cohesion, not on the clock',()=>{
  for(const h of HEADINGS){
    const {r,q,f,side,b,leader}=regrouping(h),L=r.BattleLeases,rg=L.get(q,'regroup');
    /* The rest close up on the anchor; one man stays FAR metres behind it on every tick. */
    while(L.get(q,'regroup')&&b.time<rg.until+2){
      place(q,q.orderAnchor,f,side,{9:[0,-FAR]});
      tick(leader,b);
    }
    const end=q._leases.ended.filter(l=>l.kind==='regroup').at(-1);
    assert.ok(end,'heading '+h.toFixed(2)+': the regroup ended');
    assert.equal(end.endReason,'cohesion restored','heading '+h.toFixed(2)+': ended on "'+end.endReason+'"');
  }
});
test('with no regroup lease, the remembered formation frame still orients the assessment',()=>{
  /* A collapsed objective axis outside a regroup falls back to `_formationForward` when it exists. */
  const {r}=root(),b=H.makeBattle(r),q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:100,z:0}});
  q.commandPhase='regroup';q.orderAnchor={x:0,z:0};q.rally={x:0,z:0};q.objective={x:0,z:0};q._formationForward={x:1,z:0};
  q.members.forEach((s,i)=>{s.root.position.x=(i-4)*.6;s.root.position.z=(i%2)*.5;});
  const behind=q.members[8],ahead=q.members[9];behind.root.position.x=-75;ahead.root.position.x=75;
  const ca=r.BattleRegroupHysteresis.assessment(q,LIMIT);
  assert.ok(ca.stragglers.includes(String(behind.id))&&!ca.outrunners.includes(String(behind.id)),'the man behind is a straggler');
  assert.ok(ca.outrunners.includes(String(ahead.id)),'the man ahead is an outrunner');
  assert.equal(ca.dispersed,true);
});
console.log('PASS '+n+' regroup axis checks');
