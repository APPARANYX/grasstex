#!/usr/bin/env node
'use strict';
/* Phase 2 retreat-anchor stability.

   v278's retreat loop repeatedly moved legal formation endpoints while the men made little net progress.
   The Squad Leader now leases one retreat anchor while it is useful. This check proves:
   - many retreat command ticks keep one stable anchor and coalesce identical fireteam intents;
   - measured no-progress replaces the anchor with a bounded recovery endpoint instead of pushing it farther away;
   - useful progress renews the commitment, and arrival advances the anchor in material steps;
   - a materially changed retreat goal invalidates the old lease immediately.

   The movement resolver remains the physical endpoint arbiter; this check moves men toward its published
   orderDestination rather than bypassing it. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),H=require('./harness');
function load(r,p){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}});}
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}
const SEED=+(process.env.HARNESS_SEED||12345);
function fixture(){
  H.resetIds();
  const r=H.bootstrap({modules:false}),systems={};
  r.BattleModules={registerSystem(id,s){systems[id]=s;},getSystem(id){return systems[id];},unitsFor:b=>(b._roster.us||[]).concat(b._roster.ge||[])};
  r.BattleCommanderDoctrine={policyFor(){return{cohesionRadius:34,captainlessCohesion:26,routeArrivalRadius:8,captureCommitRatio:.82};}};
  load(r,'battle/movement-resolver.js');
  load(r,'battle/modules/15a-squad-leader-fire-control.js');load(r,'battle/modules/15b-squad-leader-buddy-pairs.js');load(r,'battle/modules/15c-squad-leader-scouts-forward.js');load(r,'battle/modules/15d-squad-leader-leaderless-intent.js');load(r,'battle/modules/15e-squad-leader-morale-coa.js');load(r,'battle/modules/15f-squad-leader-retreat-anchor.js');load(r,'battle/modules/15g-squad-leader-formation.js');load(r,'battle/modules/15h-squad-leader-fireteams.js');load(r,'battle/modules/15i-squad-leader-clear-contact.js');load(r,'battle/modules/15j-squad-leader-fire-and-movement.js');load(r,'battle/modules/15k-squad-leader-reconstitution.js');load(r,'battle/modules/15l-squad-leader-mission-execution.js');load(r,'battle/modules/15m-squad-leader-cohesion-regroup.js');load(r,'battle/modules/16-squad-plan-stability.js');
  const b=H.makeBattle(r,{seed:SEED});
  const q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:120,objective:{x:0,z:300},seed:SEED});
  q.home={x:0,z:0};q.orderAnchor={x:0,z:120};q.rally={x:0,z:120};q._orderGoal={x:0,z:120};
  q.members.forEach((s,i)=>{s.root.position.x=(i%2?-1:1)*(1+i*.15);s.root.position.z=120+(i%3);});
  /* Keep five survivors so this fixture exercises the ordinary squad-retreat anchor, not the
     1-4-man extraction path. Stress holds the already-retreating squad below its morale-rally gate. */
  q.members.slice(5).forEach(s=>{s.dead=true;});
  q.state='retreat';q.mind={mean:.5,n:5,max:.5};
  return{r,b,q,L:r.BattleLeases,S:r.BattleSquadStability,systems};
}
function p(v){return v?{x:+v.x,z:+v.z}:null;}
function d(a,b){return a&&b?Math.hypot(a.x-b.x,a.z-b.z):Infinity;}
function live(q){return q.members.filter(s=>!s.dead);}
function centre(q){const a=live(q);return{x:a.reduce((n,s)=>n+s.root.position.x,0)/a.length,z:a.reduce((n,s)=>n+s.root.position.z,0)/a.length};}
function command(w,dt=.45){w.b.time+=dt;w.r.SquadAI.updateSquad(w.q,w.b);return p(w.q.orderAnchor);}
function moveTowardOrders(w,metres){
  for(const s of live(w.q)){
    const g=s.orderDestination;if(!g)continue;
    const dx=g.x-s.root.position.x,dz=g.z-s.root.position.z,len=Math.hypot(dx,dz);
    if(len<1e-9)continue;const step=Math.min(metres,len);
    s.root.position.x+=dx/len*step;s.root.position.z+=dz/len*step;
  }
}
test('a 1-4 man remnant extracts straight home and never recentres on a lagging survivor',()=>{
  const w=fixture();
  /* Cross the shared remnant boundary and recreate GE-0's geometry: one man is already far toward home,
     two are in the middle, and one is still far forward. Tactical cohesion is intentionally awful. */
  const men=live(w.q);
  men[4].dead=true;
  w.q.mind={mean:.5,n:4,max:.5};
  const a=live(w.q);
  a[0].root.position.z=32;
  a[1].root.position.z=78;
  a[2].root.position.z=118;
  a[3].root.position.z=156;
  w.q._regroupRecovery={serial:9,startedAt:w.b.time,anchor:{x:0,z:94}};
  w.q.orderAnchor={x:0,z:118};w.q.rally={x:0,z:118};
  const home={x:0,z:0};
  for(let tick=0;tick<24;tick++){
    command(w,.45);
    assert.equal(w.q.state,'retreat');
    assert.ok(w.r.SquadAI.isExtractionToHome(w.q),'the four-man squad stays in extraction state');
    assert.deepEqual(p(w.q.orderAnchor),home,'the squad anchor is home, never a midpoint');
    assert.equal(w.L.get(w.q,'retreat-anchor'),null,'tiny extraction holds no sliding retreat-anchor lease');
    assert.equal(w.q._regroupRecovery,null,'old tactical regroup recovery is discarded');
    for(const man of live(w.q)){
      assert.deepEqual(p(man.orderDestination),home,'every survivor is independently ordered home');
      assert.deepEqual(p(man._fireteamDestination),home,'no formation slot replaces the homeward intent');
    }
    /* Three survivors make progress; the forward straggler is effectively frozen/dazed for the whole
       interval. His presence must never pull the men already rearward back toward him. */
    for(let i=0;i<3;i++){
      const man=a[i],z=man.root.position.z;
      man.root.position.z=Math.max(0,z-2.5);
    }
  }
  assert.ok(a[0].root.position.z<a[1].root.position.z,'the leading survivor is allowed to stay far ahead');
  assert.equal(a[3].root.position.z,156,'the delayed survivor may lag without becoming a rally point');
});
test('many retreat ticks keep one leased useful anchor and coalesce identical urgent intents',()=>{
  const w=fixture(),T=w.S.tuning.retreatAnchor;
  const first=command(w);
  assert.equal(w.q.state,'retreat');
  const lease=w.L.get(w.q,'retreat-anchor');
  assert.ok(lease&&lease.owner==='squad-leader');
  assert.equal(lease.data.reason,'retreat start');
  assert.ok(Math.abs(first.z-107)<1.5,'first endpoint is one 13 m retreat stride, got '+first.z);
  /* Stay inside the lease without moving: the Meso endpoint must not walk away every tick. */
  const ticks=Math.floor((T.lease-.7)/.45);
  for(let i=0;i<ticks;i++)assert.ok(d(command(w),first)<1e-9,'anchor changed inside its lease');
  const st=w.b._squadCommandPublishStats;
  assert.ok(st.intentChecks>0);
  assert.ok(st.intentCoalesced>st.intentPublishes,'repeated urgent retreat intents are coalesced: '+JSON.stringify(st));
  /* Once measured no-progress expires the lease, recovery rebases from the men and uses a shorter stride. */
  while(w.b.time<lease.data.lastProgressAt+T.noProgress+.6)command(w);
  const next=p(w.q.orderAnchor),held=w.L.get(w.q,'retreat-anchor');
  assert.equal(held.data.reason,'no retreat progress');
  assert.ok(d(next,first)>3,'recovery materially replaces the stale endpoint');
  assert.ok(d(centre(w.q),next)<d(centre(w.q),first),'recovery pulls the endpoint back into useful reach');
});
test('useful retreat progress renews the lease; arrival advances in material steps with far fewer destination changes than ticks',()=>{
  const w=fixture(),start=centre(w.q),anchors=[];
  for(let i=0;i<36;i++){
    const a=command(w);if(!anchors.length||d(a,anchors[anchors.length-1])>.05)anchors.push(a);
    moveTowardOrders(w,1.6);
  }
  const end=centre(w.q),travel=d(start,end),st=w.b._squadCommandPublishStats,living=live(w.q).length;
  assert.ok(travel>28,'retreat makes useful net progress: '+travel.toFixed(1)+' m');
  assert.ok(anchors.length>=2,'arrival advances to another leased anchor');
  for(let i=1;i<anchors.length;i++)assert.ok(d(anchors[i-1],anchors[i])>3,'anchor changes are material');
  assert.ok(st.intentPublishes<st.intentChecks*.45,'destination changes are coalesced: '+JSON.stringify(st));
  assert.ok(st.intentCoalesced>st.intentPublishes,'most repeated retreat requests do not rewrite endpoints');
  console.log('  retreat stability: '+anchors.length+' anchor goals, '+st.intentPublishes+' publishes / '+st.intentChecks+' checks, '+travel.toFixed(1)+' m net travel, '+living+' men');
});
test('a materially changed retreat goal invalidates the old lease immediately',()=>{
  const w=fixture(),first=command(w),old=w.L.get(w.q,'retreat-anchor');
  w.q.home={x:80,z:0};
  const next=command(w),held=w.L.get(w.q,'retreat-anchor');
  assert.notEqual(held,old);
  assert.equal(held.data.reason,'retreat goal moved');
  assert.ok(d(next,first)>3);
  assert.deepEqual(held.data.goal,{x:80,z:0});
});
test('a majority physically blocked on the leased endpoint gets one bounded recovery rebase, not one every tick',()=>{
  const w=fixture(),first=command(w);
  live(w.q).slice(0,2).forEach(s=>{s._movementStopReason='path-blocked';});
  const next=command(w),held=w.L.get(w.q,'retreat-anchor');
  assert.equal(held.data.reason,'route blocked');
  assert.ok(d(next,first)>3);
  assert.ok(d(centre(w.q),next)<13,'recovery uses the half-stride instead of pushing the anchor another full stride');
  for(let i=0;i<6;i++)assert.ok(d(command(w),next)<1e-9,'persistent blocked flags do not churn the recovery anchor');
});
console.log('retreat-anchor-check: '+n+' passed');
