#!/usr/bin/env node
'use strict';
/* The forward line (16-squad-plan-stability.js forwardMajority / publishForwardLine) and the regroup
   rally point built on it. The line is where the forward majority of a group actually is along the
   advance axis: the front-most half (rounded up) plus anyone within COVER_BAND (5 m) behind the
   rearmost of them, since men in different cover along one line stand a few metres apart in depth;
   the line sits at that group's mean. Two men up front, one just behind and two far back put it
   between the front pair and the middle man, two thirds of the way to the front. A regroup re-forms
   on that forward-majority point, so the men behind come up instead of the leading men being pulled
   back to the squad's average (main fails the regroup tests). Swept over march directions. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');
function load(r,p){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}});}
/* CHECK_ONLY=<text> runs only tests whose name contains it (e.g. the regroup test against main). */
let n=0;function test(name,fn){if(process.env.CHECK_ONLY&&!name.includes(process.env.CHECK_ONLY))return;fn();n++;console.log('PASS '+name);}
function root(){
  const r=H.bootstrap({modules:false}),systems={};
  r.BattleModules={registerSystem(id,s){systems[id]=s;},getSystem(id){return systems[id];},unitsFor:b=>(b._roster.us||[]).concat(b._roster.ge||[])};
  r.BattleCommanderDoctrine={policyFor(){return{cohesionRadius:34,captainlessCohesion:26,routeArrivalRadius:8,captureCommitRatio:.82};}};
  load(r,'battle/movement-resolver.js');load(r,'battle/modules/15a-squad-leader-fire-control.js');load(r,'battle/modules/15b-squad-leader-buddy-pairs.js');load(r,'battle/modules/15c-squad-leader-scouts-forward.js');load(r,'battle/modules/15d-squad-leader-leaderless-intent.js');load(r,'battle/modules/15e-squad-leader-morale-coa.js');load(r,'battle/modules/15f-squad-leader-retreat-anchor.js');load(r,'battle/modules/15g-squad-leader-formation.js');load(r,'battle/modules/15h-squad-leader-fireteams.js');load(r,'battle/modules/15i-squad-leader-clear-contact.js');load(r,'battle/modules/15j-squad-leader-fire-and-movement.js');load(r,'battle/modules/15k-squad-leader-reconstitution.js');load(r,'battle/modules/15l-squad-leader-mission-execution.js');load(r,'battle/modules/16-squad-plan-stability.js');
  return{r,leader:systems['squad-command']};
}
const HEADINGS=[0,Math.PI/2,Math.PI,-Math.PI/3,2.4],near=(a,b,eps,msg)=>assert.ok(Math.abs(a-b)<=eps,msg+': '+a.toFixed(3)+' vs '+b.toFixed(3));
/* A squad marching from the origin toward `heading` (0 = +z); `spots` maps member index to
   [right, forward] metres; members not listed are killed. */
function squad(heading,spots){
  const {r,leader}=root(),b=H.makeBattle(r),f={x:Math.sin(heading),z:Math.cos(heading)},side={x:f.z,z:-f.x},
    q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:f.x*300,z:f.z*300}});
  q.commandPhase='approach';
  q.members.forEach((s,i)=>{const o=spots[i];if(!o){s.dead=true;return;}s.root.position.x=side.x*o[0]+f.x*o[1];s.root.position.z=side.z*o[0]+f.z*o[1];});
  return{r,b,q,f,side,leader};
}
const along=(p,f)=>p.x*f.x+p.z*f.z;
test('two up front, one behind them, two far back: the line is between the front pair and the middle man',()=>{
  for(const h of HEADINGS){
    const {r,b,q}=squad(h,{0:[-2,40],1:[2,40],2:[0,32],3:[-3,10],4:[3,10]});
    r.SquadAI.updateSquad(q,b);
    const L=q._forwardLine,ax=L.axis,at=q.members.slice(0,5).map(s=>along(s.root.position,ax)).sort((a,c)=>c-a);
    assert.equal(L.men,3,'heading '+h.toFixed(2)+': the forward group is the front pair and the middle man');
    assert.equal(L.of,5);
    near(L.at,(at[0]+at[1]+at[2])/3,1e-6,'heading '+h.toFixed(2)+': the line is their mean');
    assert.ok(L.at>at[2]&&L.at<at[0],'the line lies between the middle man and the front pair');
    assert.ok(at[0]-L.at<L.at-at[2],'and nearer the front, where there are more men');
    assert.ok(L.at>(at.reduce((a,c)=>a+c,0)/5)+5,'well ahead of the average the stragglers drag back');
  }
});
test('men a few metres deeper in cover along the same line count as on it',()=>{
  for(const h of HEADINGS){
    const {r,b,q}=squad(h,{0:[-6,40],1:[6,40],2:[0,36],3:[-3,32],4:[3,5]});
    r.SquadAI.updateSquad(q,b);
    const L=q._forwardLine;
    assert.equal(L.men,4,'heading '+h.toFixed(2)+': the man 4 m behind the middle man is within the cover band and joins the line');
    const {r:r2,b:b2,q:q2}=squad(h,{0:[-6,40],1:[6,40],2:[0,36],3:[-3,29],4:[3,5]});
    r2.SquadAI.updateSquad(q2,b2);
    assert.equal(q2._forwardLine.men,3,'heading '+h.toFixed(2)+': 7 m behind is outside the band and stays out');
  }
});
test('each fireteam gets its own line; a retreating squad has none',()=>{
  const {r,b,q}=squad(0,{0:[0,10],1:[1,10],2:[-4,30],3:[4,20],4:[-5,28],5:[-6,5],6:[5,22],7:[6,2],8:[0,15],9:[1,15]});
  r.SquadAI.updateSquad(q,b);
  const L=q._forwardLine;
  assert.ok(L&&L.teams&&L.teams.alpha&&L.teams.bravo,'fireteam lines are published');
  const team=k=>q.members.filter(s=>!s.dead&&s._fireteamKey===k);
  for(const k of Object.keys(L.teams)){assert.equal(L.teams[k].of,team(k).length,k+': the line counts that team only');}
  /* 60% casualties puts a squad into retreat (squad-ai.js RETREAT_CASUALTY_FRAC). */
  q.members.slice(4).forEach(s=>{s.dead=true;});r.SquadAI.updateSquad(q,b);
  assert.equal(q.state,'retreat','six of ten down: the squad retreats');
  assert.equal(q._forwardLine,null,'no forward line in retreat: backward is the order');
});
/* Reimplementation of the rule, to predict where a regroup should re-form. */
function forwardPoint(men,f){
  const rows=men.map(s=>({at:along(s.root.position,f),x:s.root.position.x,z:s.root.position.z,id:s.id})).sort((a,b)=>b.at-a.at||a.id-b.id);
  let k=Math.ceil(rows.length/2);const floor=rows[k-1].at-5;while(k<rows.length&&rows[k].at>=floor)k++;
  const g=rows.slice(0,k);return{x:g.reduce((a,r)=>a+r.x,0)/k,z:g.reduce((a,r)=>a+r.z,0)/k};
}
test('a regroup re-forms on the forward majority, not the average',()=>{
  for(const h of HEADINGS){
    const {r,b,q,f,side,leader}=squad(h,{0:[0,0],1:[0,0],2:[0,0],3:[0,0],4:[0,0],5:[0,0],6:[0,0],7:[0,0],8:[0,0],9:[0,0]}),L=r.BattleLeases;
    H.run(r,b,1.5,()=>{b.time+=.45;leader.onCommanderTick(b,{town:null});});
    /* Six men forward in two cover spots, four strung out behind: dispersed enough to regroup. */
    const spots=[[-8,60],[8,60],[-4,58],[4,57],[0,62],[12,59],[-20,20],[20,15],[0,0],[-10,-10]];
    q.members.forEach((s,i)=>{const o=spots[i];s.root.position.x=side.x*o[0]+f.x*o[1];s.root.position.z=side.z*o[0]+f.z*o[1];});
    for(let i=0;i<12&&!L.get(q,'regroup');i++){b.time+=.45;leader.onCommanderTick(b,{town:null});}
    const rg=L.get(q,'regroup');
    assert.ok(rg,'heading '+h.toFixed(2)+': the strung-out squad regroups');
    const want=forwardPoint(q.members.filter(s=>!s.dead),rg.data.forward),a=rg.data.anchor;
    near(a.x,want.x,1e-6,'heading '+h.toFixed(2)+': anchor x is the forward-majority point');
    near(a.z,want.z,1e-6,'heading '+h.toFixed(2)+': anchor z is the forward-majority point');
    const mean={x:q.members.reduce((s,m)=>s+m.root.position.x,0)/10,z:q.members.reduce((s,m)=>s+m.root.position.z,0)/10};
    assert.ok(along(a,f)>along(mean,f)+10,'heading '+h.toFixed(2)+': the rally point is well forward of the squad average');
    assert.equal(q.orderAnchor.x,a.x,'the order anchor moves to the rally point');
  }
});
console.log(`forward-line-check: ${n} tests passed`);
