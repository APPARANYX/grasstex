#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),H=require('./harness');
let checks=0,failures=0;
function test(name,fn){try{fn();checks++;console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack);}}
function load(r,file){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,file),'utf8'))(r,r,{log(){},warn(){}});}
function fixture(obstacles,physical){
  H.resetIds();const r=H.bootstrap({modules:false}),systems={};
  r.BattleModules={registerSystem(id,h){systems[id]=h;},unitsFor:b=>b._roster.us.concat(b._roster.ge)};
  load(r,'battle/battle-navigation.js');load(r,'battle/movement-resolver.js');
  load(r,'battle/modules/39-navigation-physicality-debug.js');load(r,'battle/modules/52-survival-tactical-route.js');
  const b=H.makeBattle(r);b.obstacles=obstacles;b.obstacles.__physicalFootprints=physical||obstacles;b.obstacles.__physicalVersion=1;
  const scenario={buildings:[]};b.scene={metadata:{battleScenario:scenario}};r.__battle__=b;r.BattleNavigation.installScenario(scenario);
  const q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:-8,objective:{x:0,z:50},composition:['rifleman','rifleman','rifleman']});
  q.commandPhase='support-hold';q.state='engaged';q.inContact=true;
  q.members.forEach((s,i)=>{s.root.position.x=i*2;s.root.position.z=-8;s.target={root:{position:{x:0,y:0,z:60}}};});
  return{r,b,q,s:q.members[0],other:q.members[1],E:r.BattleEngagement,C:r.BattleCoverPositions};
}
function hedge(rot=0){return{id:'hedge',physicalId:'hedge',shape:'obb',type:'hedge',x:0,z:0,hx:14,hz:1,ux:Math.cos(rot),uz:Math.sin(rot),vx:-Math.sin(rot),vz:Math.cos(rot),radius:1,y:0,height:2,cover:.62};}
test('a suppressed cover detour stays committed through the original formation intent',()=>{
  const f=fixture([]),{r,b,s}=f,T=r.BattleTacticalRoute;
  b.time=10;s.root.position.x=0;s.root.position.z=0;s.suppressedUntil=100;
  s.target={id:99,dead:false,root:{position:{x:0,y:0,z:100}}};
  let releases=0,reserves=0;
  r.BattleCoverPositions={
    candidates(){return[{x:10,z:0,quality:.4,slotId:'route-cover',slot:{id:'route-cover',x:10,z:0}}];},
    reserve(){reserves++;return true;},
    release(){releases++;}
  };
  r.BattleObstacleField.coverPotentialAt=()=>1;
  const pick={owner:'squad-stability',kind:'formation',point:{x:0,z:40}};
  let route=T.resolve(s,b,pick);
  assert.deepEqual(route.point,{x:10,z:0},'first step is the protective cover waypoint');
  assert.equal(route.reason,'cover-detour');assert.equal(s._tacticalRoute.steps.length,2);
  assert.deepEqual(s._tacticalRoute.steps[1],pick.point,'the winning intent is part of the same committed route');
  assert.equal(reserves,1);

  s.root.position.x=10;s.root.position.z=0;b.time=11;
  route=T.resolve(s,b,pick);
  assert.deepEqual(route.point,pick.point,'after cover, the route continues to the original intent instead of ending');
  assert.equal(route.reason,'cover-detour');assert.ok(s._tacticalRoute,'route remains committed');
  assert.equal(releases,1,'the passed cover slot is released while the route continues');

  s.root.position.x=5;s.root.position.z=20;b.time=15;
  route=T.resolve(s,b,pick);
  assert.deepEqual(route.point,pick.point,'prolonged suppression does not create another cover side-trip mid-route');
  assert.equal(reserves,1,'no second cover reservation while the committed detour is active');

  s.root.position.x=0;s.root.position.z=40;b.time=16;
  assert.equal(T.resolve(s,b,pick),null,'the detour ends only at the original intent');
  assert.equal(s._tacticalRoute,undefined);
});

test('a held cover position is unavailable after the old fourteen-second lease expires',()=>{
  const f=fixture([{type:'rock',x:0,z:0,y:0,radius:1.3,height:1,cover:.55}]);
  const first=f.E.findCover(f.s,f.b);assert.ok(first);f.s.eng.cover=first;f.s.eng.state='engage';Object.assign(f.s.root.position,{x:first.x,z:first.z});
  f.b.time=30;const next=f.E.findCover(f.other,f.b);
  assert.ok(!next||Math.hypot(first.x-next.x,first.z-next.z)>=.9,'occupied cover was reassigned: '+JSON.stringify(next));
});
test('several soldiers can reserve distinct reachable slots along one long hedge',()=>{
  /* slot allocation, not fighting: any cover (`evade`), the hedge is 2 m tall */
  const f=fixture([hedge()]),positions=f.q.members.map(s=>{const p=f.E.findCover(s,f.b,{evade:true});assert.ok(p,'long hedge should have room for each soldier');s.eng.state='bound';s.eng.cover=p;return p;});
  for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++)assert.ok(Math.hypot(positions[i].x-positions[j].x,positions[i].z-positions[j].z)>=1.8-1e-6);
});
test('an end-on hedge threat cannot produce a point inside the hedgerow',()=>{
  const f=fixture([hedge()]);f.s.root.position.x=-18;f.s.root.position.z=0;f.s.target.root.position={x:60,y:0,z:0};
  const p=f.E.findCover(f.s,f.b,{evade:true});assert.ok(p);assert.ok(f.r.BattleNavigation.movementClear(p,p),'cover point is inside the hedge');assert.ok(p.x<-14);
});
function crate(id,x,z){return{id,physicalId:id,type:'crate',x,z,y:0,radius:.8,height:1,cover:.55};}
test('clustered cover yields no overlapping slots, keeping the newest obstacle\'s slots',()=>{
  const obs=[crate('a',0,0),crate('b',1.6,.4),crate('c',.6,1.8),crate('d',-1.4,1.1)],f=fixture(obs),slots=f.C.snapshot(f.b);
  assert.ok(slots.length>0,'cluster should still offer cover');
  for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++)
    assert.ok(Math.hypot(slots[i].x-slots[j].x,slots[i].z-slots[j].z)>=f.C.spacing-.001,'overlap '+slots[i].id+' / '+slots[j].id);
  const newest=obs.length-1,raw=slots.filter(s=>s.id.startsWith('cover:'+newest+':')).length;
  assert.ok(raw>0,'the newest obstacle keeps its slots');
});
test('every cover slot is a spot the planner accepts as a standing position',()=>{
  const obs=[crate('a',0,0),crate('b',3.6,0),Object.assign(hedge(),{z:-3.4,hx:6}),crate('e',0,3.8)];
  const g=fixture(obs),P=g.r.BattleNavigationPhysicality,slots=g.C.snapshot(g.b);
  assert.ok(slots.length>0);
  for(const s of slots){const st=P.resolveStandGoal(g.b,null,s);assert.ok(st&&Math.hypot(st.x-s.x,st.z-s.z)<.01,'slot '+s.id+' is inside a body margin');}
});
function works(x0,z0,yaw,len){const out=[],steps=Math.max(2,Math.round(len/2.4));for(let i=0;i<=steps;i++){const t=(i/steps-.5)*len;out.push({x:x0+Math.sin(yaw)*t,z:z0+Math.cos(yaw)*t,y:0,radius:1.35,cover:.35,height:1,type:'work-sandbags'});}return out;}
test('no slot sits inside the stand-off margin of a defence line that is not a physical footprint',()=>{
  const line=works(0,10,Math.PI/2,14).concat(works(4,6,0,10)),f=fixture(line,[]),slots=f.C.snapshot(f.b);
  assert.ok(slots.length>0,'defence lines should still offer cover');
  for(const s of slots)for(const o of line)assert.ok(Math.hypot(s.x-o.x,s.z-o.z)-o.radius>=1.19,'slot '+s.id+' is inside the margin of the defence piece at '+o.x.toFixed(1)+','+o.z.toFixed(1));
});
test('a terrain hedge\'s approximating circles do not erase the hedge\'s own slots',()=>{
  const h=hedge(),circles=[-10,-5,0,5,10].map(x=>({x,z:0,y:0,radius:3.4,cover:.62,height:1.5,type:'hedge',physicalId:'hedge'})),f=fixture([h].concat(circles),[h]);
  assert.ok(f.C.snapshot(f.b).length>=20,'hedge lost its slots');
});
/* A Squad Leader's bound is a move forward. 44's forward guard covers only the `assault` phase and
   bounds are also ordered in `capture` and `clear-town`: there the ordered bound took the best cover
   even behind the man (backward-orders probe). Only cover behind: he rushes toward the objective. */
function orderBound(f,phase){
  const L=f.r.BattleLeases;L.define('bound',{priority:1});
  f.q.commandPhase=phase;f.q._assaultAuthorized=true;L.grant(f.q,'bound','squad-leader',0,10,'test bound','expiry');
  f.s.eng=null;const e=f.E.stateOf(f.s);e.state='engage';e.boundOrder=true;
  f.E.updateSoldier(f.s,f.b);return e;
}
test('an ordered bound never takes cover behind the man, whatever the phase',()=>{
  for(const phase of ['assault','capture','clear-town']){
    const f=fixture([{type:'rock',x:0,z:-16,y:0,radius:1.3,height:1,cover:.55}]),e=orderBound(f,phase);
    assert.notEqual(e.state,'bound',phase+': bounded back to cover 8 m behind him');
    assert.equal(e.state,'assault',phase+': no cover ahead, so he rushes');
    assert.ok(e.assaultGoal&&e.assaultGoal.z>-8,phase+': toward the objective, not back');
  }
});
test('an ordered bound still takes cover ahead of him',()=>{
  const f=fixture([{type:'rock',x:0,z:0,y:0,radius:1.3,height:1,cover:.55}]),e=orderBound(f,'capture');
  assert.equal(e.state,'bound');assert.ok(e.cover&&e.cover.z>-8,'cover ahead: '+JSON.stringify(e.cover));
});
/* Same rule for the man who has just spotted the enemy (Engagement `decide`): while his squad
   advances and he is not under fire he takes cover ahead or beside him, not behind. */
function decideWith(phase,suppressed){
  const f=fixture([{type:'rock',x:0,z:-16,y:0,radius:1.3,height:1,cover:.55}]);
  f.q.commandPhase=phase;f.s.suppressedUntil=suppressed?f.b.time+5:0;f.s.eng=null;f.E.stateOf(f.s);
  f.E.decide(f.s,f.b,'oriented');return f.E.stateOf(f.s);
}
test('an advancing man not under fire does not go back to cover; under fire or defending he may',()=>{
  for(const phase of ['approach','assault','capture','clear-town','flank']){
    const e=decideWith(phase,false);
    assert.notEqual(e.state,'bound',phase+': went back to cover 8 m behind him');
    assert.equal(e.state,'engage',phase+': fights from where he is');
  }
  const pinned=decideWith('assault',true);
  assert.ok(pinned.state==='bound'||pinned.state==='pinned','under fire any cover is survival: '+pinned.state);
  assert.equal(decideWith('defend',false).state,'bound','a defender may still take cover behind him');
});
/* A bound is a dash with its own window. A live battle held men in `bound` for minutes, 0.4-2 m
   short of a slot they could not reach (inside movement progress's 3 m near band, so never
   flagged): past its window he re-decides, and that cover is marked failed so he does not take it
   straight back. Inside the window he keeps going. */
test('a bound that overruns its window re-decides and does not retake the same cover',()=>{
  const f=fixture([{type:'rock',x:0,z:0,y:0,radius:1.3,height:1,cover:.55}]);
  f.q.commandPhase='defend';f.b.time=10;
  const e=f.E.stateOf(f.s),cover=f.E.findCover(f.s,f.b);assert.ok(cover,'fixture cover');
  e.state='bound';e.since=2;e.cover=cover;e.until=f.b.time+3;
  f.E.updateSoldier(f.s,f.b);
  assert.equal(e.state,'bound','inside its window the bound goes on');assert.equal(e.cover.x,cover.x);
  f.b.time=14;f.E.updateSoldier(f.s,f.b);
  const same=e.state==='bound'&&e.cover&&Math.hypot(e.cover.x-cover.x,e.cover.z-cover.z)<.5;
  assert.ok(!same,'still bounding to the cover he overran: '+e.state);
  assert.equal(f.r.BattleMovementProgress.candidateAllowed(f.s,f.b,cover),false,'the overrun cover is marked failed');
});
/* Cover is a place to fight from unless he is evading fire. coverCandidates keeps only slots whose shelter lies
   between the slot and the threat, so every slot hides him from it; one that hides him at every stance is a place
   to wait. bound-motion probe, meeting battles, 300 s: of the bounds that ended in "target lost" (83% of all) 140 of
   149 reached a slot from which he could not see where he last saw the man, the hedges being 3 to 6 m. He ran there,
   lost the target, held the sector and marched on, and the next contact sent him again. */
const lowWall=()=>Object.assign(hedge(),{id:'wall',physicalId:'wall',type:'wall',height:1.1,cover:.5});
test('cover he can fight from: a hedge no stance sees over is refused, a low wall he sees over is taken, and under fire either will do',()=>{
  const tall=fixture([hedge()]),low=fixture([lowWall()]);
  assert.equal(tall.E.findCover(tall.s,tall.b),null,'a 2 m hedge between him and the threat hides him at every stance');
  assert.ok(tall.E.findCover(tall.other,tall.b,{evade:true}),'evading fire, any cover will do');
  const p=low.E.findCover(low.s,low.b);
  assert.ok(p,'a 1.1 m wall: standing, he sees over it and can fight from it');
});
test('?coverFire=0 is the old choice: any slot that shelters him',()=>{
  globalThis.location={search:'?coverFire=0'};
  let f;try{f=fixture([hedge()]);}finally{delete globalThis.location;}
  assert.equal(f.E.tuning.COVER_FIRE,false);
  assert.ok(f.E.findCover(f.s,f.b),'the hedge shelters him, and that was all that was asked');
});
test('a man who sees the enemy does not run for a hedge he could not fight from; under fire he does',()=>{
  const calm=decideWith('approach',false),tall=fixture([hedge()]);
  assert.equal(calm.state==='bound',false,'no fightable cover here');
  /* a scout: a rifleman under fire in the open is pinned there (PRONE_ROLES), which never reaches cover selection */
  tall.s.role='scout';tall.s.suppressedUntil=tall.b.time+5;tall.s.eng=null;tall.E.stateOf(tall.s);tall.E.decide(tall.s,tall.b,'oriented');
  assert.equal(tall.E.stateOf(tall.s).state,'bound','under fire he takes the hedge to save himself');
  const open=fixture([hedge()]);open.s.eng=null;open.E.stateOf(open.s);open.E.decide(open.s,open.b,'oriented');
  assert.equal(open.E.stateOf(open.s).state,'engage','not under fire he fights from where he is');
});
/* A man at a wall slot with a live target: the stance he fights in is the lowest that still sees over it. */
function atWall(height,suppressed){
  const f=fixture([height===1.1?lowWall():hedge()]),cover=f.E.findCover(f.s,f.b,{evade:true});
  assert.ok(cover);Object.assign(f.s.root.position,{x:cover.x,z:cover.z});
  f.s.eng=null;const e=f.E.stateOf(f.s);e.state='engage';e.stanceUntil=0;f.s.suppressedUntil=suppressed?f.b.time+9:0;
  return{f,e,cover};
}
test('at a low wall he rises far enough to see over it; behind a hedge nothing helps and he stays low; under fire he stays down',()=>{
  const w=atWall(1.1,false);w.f.E.updateSoldier(w.f.s,w.f.b);
  assert.equal(w.e.stance,'stand','crouched, his eye (1.05 m) is under the wall (1.1 m): he would lose the man he is shooting at');
  const h=atWall(2,false);h.f.E.updateSoldier(h.f.s,h.f.b);
  assert.notEqual(h.e.stance,'stand','no stance sees over a 2 m hedge: nothing to gain by standing');
  const p=atWall(1.1,true);p.f.E.updateSoldier(p.f.s,p.f.b);
  assert.notEqual(p.e.stance,'stand','under fire survival first: he does not stand up to look');
});
test('reaching cover ends the run\'s crouch: engage picks the stance he fights in',()=>{
  const w=atWall(1.1,false);
  w.e.state='bound';w.e.cover=w.cover;w.e.until=w.f.b.time+9;w.f.E.commitStance(w.f.s,w.f.b,'crouch',5);
  w.f.E.updateSoldier(w.f.s,w.f.b);
  assert.equal(w.e.state,'engage','arrived');
  assert.equal(w.e.stance,'stand','the 5 s crouch of the run did not hold him under the wall');
});
/* A crawl is for cover he can crawl to inside the bound's window, from a standing start. The window is sized for a run
   and a crawl covers 0.23 of it: `d < 14` sent men to ground at 3 m/s for cover that took 20 s to crawl to in a 10 s
   window (bound-motion probe: the dive-and-slide, then 'bound overran'). */
function boundTo(dist,speed,flagOff){
  if(flagOff)globalThis.location={search:'?crawlFit=0'};
  let f;try{f=fixture([{type:'rock',x:0,z:0,y:0,radius:1.3,height:1,cover:.55}]);}finally{delete globalThis.location;}
  const s=f.s,e=(s.eng=null,f.E.stateOf(s));
  s.suppressedUntil=f.b.time+9;s.moveSpeed=speed;
  e.state='bound';e.cover={x:s.root.position.x,z:s.root.position.z+dist};e.until=f.b.time+Math.max(3,dist/(s.speed*.6)+2.5);
  f.E.updateSoldier(s,f.b);return e.stance;
}
test('he crawls only to cover he can crawl to in the window, and only from a standing start',()=>{
  assert.equal(boundTo(10,0),'crouch','10 m takes ~14 s to crawl, the window is ~7 s: he runs, crouched');
  assert.equal(boundTo(1.5,0),'crawl','1.5 m from rest: a crawl fits');
  assert.equal(boundTo(1.5,3),'crouch','already running: no dive at a run');
  assert.equal(boundTo(10,0,true),'crawl','?crawlFit=0 is the old d < 14 rule');
});
console.log(checks+' cover checks passed; '+failures+' failed.');if(failures)process.exitCode=1;
