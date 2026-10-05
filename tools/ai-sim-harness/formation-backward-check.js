#!/usr/bin/env node
'use strict';
/* Formation orders never walk an advancing man backward (16-squad-plan-stability.js updateFireteams).
   Men who ran ahead of their fireteam's order anchor (assault rushes, cover bounds) used to be sent
   back to slots laid round that stale anchor when the fireteam's order was renewed or a teammate fell:
   the `backward-orders` probe measured this as the largest producer of orders behind both the man
   and his fireteam's forward line. The invariant: while a squad advances, no published formation
   destination lies more than ALLOW metres behind both the man and his fireteam's forward line along
   the advance axis. Swept over march directions. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');
const ALLOW=3;
function load(r,p){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}});}
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}
function root(){
  const r=H.bootstrap({modules:false}),systems={};
  r.BattleModules={registerSystem(id,s){systems[id]=s;},getSystem(id){return systems[id];},unitsFor:b=>(b._roster.us||[]).concat(b._roster.ge||[])};
  r.BattleCommanderDoctrine={policyFor(){return{cohesionRadius:34,captainlessCohesion:26,routeArrivalRadius:8,captureCommitRatio:.82};}};
  load(r,'battle/movement-resolver.js');load(r,'battle/modules/15a-squad-leader-fire-control.js');load(r,'battle/modules/15b-squad-leader-buddy-pairs.js');load(r,'battle/modules/15c-squad-leader-scouts-forward.js');load(r,'battle/modules/15d-squad-leader-leaderless-intent.js');load(r,'battle/modules/15e-squad-leader-morale-coa.js');load(r,'battle/modules/15f-squad-leader-retreat-anchor.js');load(r,'battle/modules/15g-squad-leader-formation.js');load(r,'battle/modules/15h-squad-leader-fireteams.js');load(r,'battle/modules/16-squad-plan-stability.js');
  return r;
}
const HEADINGS=[0,Math.PI/2,Math.PI,-Math.PI/3,2.4];
const along=(p,f)=>p.x*f.x+p.z*f.z;
/* A ten-man squad marching from the origin toward `heading`, settled for a few ticks. */
function marching(heading){
  H.resetIds();
  const r=root(),b=H.makeBattle(r),f={x:Math.sin(heading),z:Math.cos(heading)},
    q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:f.x*300,z:f.z*300}});
  q.commandPhase='assault';q.state='advance';
  for(let i=0;i<4;i++){b.time+=.45;r.SquadAI.updateSquad(q,b);}
  return{r,b,q,f};
}
/* Worst backward order in the squad: destination behind the man AND behind his team's line. */
function worst(q,f){
  const L=q._forwardLine;let w=0,who=null;
  q.members.forEach(s=>{
    if(s.dead||!s._fireteamDestination)return;
    const t=L.teams&&L.teams[s._fireteamKey],pt=(t&&t.point)||L.point,d=s._fireteamDestination,p=s.root.position,
      vsLine=(d.x-pt.x)*f.x+(d.z-pt.z)*f.z,vsMan=(d.x-p.x)*f.x+(d.z-p.z)*f.z,back=-Math.max(vsLine,vsMan);
    if(back>w){w=back;who=s.id+' '+s._fireteamKey;}
  });
  return{w,who};
}
/* Men who rush on leave the order destinations behind, so too few have arrived for the squad's anchor
   to advance (orderCanAdvance): the anchor stays put, as in the measured battles. */
function runAhead(q,f,m){q.members.forEach(s=>{s.root.position.x+=f.x*m;s.root.position.z+=f.z*m;});}
test('men who ran ahead are not sent back when the fireteam orders are renewed',()=>{
  for(const h of HEADINGS){
    const {r,b,q,f}=marching(h);
    runAhead(q,f,20);
    q.commandPhase='flank'; // a new command signature renews every fireteam order
    for(let i=0;i<3;i++){b.time+=.45;r.SquadAI.updateSquad(q,b);}
    const {w,who}=worst(q,f);
    assert.ok(w<=ALLOW,'heading '+h.toFixed(2)+': '+who+' was sent '+w.toFixed(1)+' m behind himself and his team line');
  }
});
test('men who ran ahead are not sent back when a teammate falls',()=>{
  for(const h of HEADINGS){
    const {r,b,q,f}=marching(h);
    runAhead(q,f,20);
    q.members.find(s=>s._fireteamKey==='alpha'&&!s.dead).dead=true; // the team's slots are dealt again
    for(let i=0;i<3;i++){b.time+=.45;r.SquadAI.updateSquad(q,b);}
    const {w,who}=worst(q,f);
    assert.ok(w<=ALLOW,'heading '+h.toFixed(2)+': '+who+' was sent '+w.toFixed(1)+' m behind himself and his team line');
  }
});
test('a squad that has not run ahead still keeps its slots (control)',()=>{
  for(const h of HEADINGS){
    const {q,f}=marching(h),{w}=worst(q,f);
    assert.ok(w<=ALLOW,'heading '+h.toFixed(2)+': settled slots are '+w.toFixed(1)+' m back');
    assert.ok(q.members.some(s=>s._fireteamDestination),'orders were published');
  }
});
console.log('\nAll '+n+' formation backward checks passed.');
