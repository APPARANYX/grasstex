#!/usr/bin/env node
'use strict';
/* Deterministic buddy-pair contract (module 16, ?buddyPairs=1).
   The Squad Leader owns pair state. Pairs may narrow an already-authorized fireteam bound so one
   already-firing buddy covers the other; they never write destinations or call Movement Resolver. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');
const SRC=fs.readFileSync(path.join(H.REPO,'battle/modules/16-squad-plan-stability.js'),'utf8');
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}
function world(flag){
  H.resetIds();
  const r=H.bootstrap({modules:false}),events=[],sent=[];
  r.BattleModules={registerSystem(){},registerUnitType(){},registerObjectiveType(){},runHook(){},unitsFor(){return[];}};
  r.BattleCommanderDoctrine={policyFor(){return{cohesionRadius:34,captainlessCohesion:26};}};
  r.BattleTelemetry={record(type,data){events.push({type,data});}};
  r.BattleSoldierMind={teamStress(){return 0;},leadStress(){return 0;},squadStress(){return 0;}};
  const search='?fireControl=0&coa=0&slStress=0&'+(flag||'buddyPairs=1');
  new Function('window','globalThis','console','location',SRC)(r,r,{log(){},warn(){}},{search});
  const b=H.makeBattle(r,{seed:12345}),report={inContact:true,effective:10,pinned:0,reacting:[]};
  r.BattleEngagement.updateSquad=function(sq){
    const was=!!sq.inContact;sq.inContact=report.inContact;
    const fireSupport=sq.members.filter(s=>!s.dead&&!(s.suppressedUntil>b.time));
    return{contactStarted:sq.inContact&&!was,effective:fireSupport.length,pinned:report.pinned,fireSupport,reacting:report.reacting,fled:[]};
  };
  const raw=r.BattleEngagement.orderBound;
  r.BattleEngagement.orderBound=function(movers){sent.push(movers.map(s=>s.id));return raw.call(this,movers);};
  return{r,b,S:r.BattleSquadStability,events,sent,report};
}
function squad(w){
  const q=H.addSquad(w.r,w.b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:100}});
  w.S.initialPhase(q,'assault');q.inContact=true;
  q.members.forEach((s,i)=>{
    s._fireteamKey=w.S.teamKeyFor(s);s._engagementTask='maneuver';s._engagementPlanSerial=1;
    s.root.position.x=i*.35;s.root.position.z=0;s._fireteamDestination={x:i*.35,z:5};
  });
  w.S.updateBuddyPairs(q,w.b);return q;
}
function pairs(w,q){return w.S.buddySnapshot(q).pairs;}
function pairForTeam(w,q,team){return pairs(w,q).find(p=>p.team===team);}
function byId(q,id){return q.members.find(s=>String(s.id)===String(id));}

test('stable deterministic pairing is inspectable and does not reshuffle',()=>{
  const w=world(),q=squad(w),a=pairs(w,q).map(p=>({id:p.id,a:p.a,b:p.b,g:p.generation,formed:p.formedAt}));
  assert.equal(a.length,4,'command + alpha + bravo + charlie pairs');
  w.b.time=3;w.S.updateBuddyPairs(q,w.b);
  const b=pairs(w,q).map(p=>({id:p.id,a:p.a,b:p.b,g:p.generation,formed:p.formedAt}));
  assert.deepEqual(b,a);
  assert.deepEqual(w.S.buddySnapshot(q).unpaired.sort((x,y)=>x-y),
    q.members.filter(s=>['alpha','bravo'].includes(w.S.teamKeyFor(s))).filter(s=>{
      const p=pairs(w,q).find(p=>String(p.a)===String(s.id)||String(p.b)===String(s.id));return !p;
    }).map(s=>s.id).sort((x,y)=>x-y));
});

test('casualty retires only the affected pair and deterministically re-pairs its survivors',()=>{
  const w=world(),q=squad(w),before=pairForTeam(w,q,'alpha'),oldIds=[before.a,before.b],alpha=q.members.filter(s=>w.S.teamKeyFor(s)==='alpha');
  const victim=byId(q,before.b);victim.dead=true;w.b.time=1;w.S.updateBuddyPairs(q,w.b);
  const after=pairForTeam(w,q,'alpha');
  assert.ok(after,'two alpha survivors re-pair');
  assert.ok(![after.a,after.b].includes(victim.id),'dead man is absent');
  assert.ok([after.a,after.b].some(id=>oldIds.includes(id)),'surviving old buddy retained');
  assert.ok(w.S.buddyTelemetry(w.b).byBreakReason.casualty>=1,'retirement reason is casualty');
  w.b.time=2;w.S.updateBuddyPairs(q,w.b);assert.equal(pairForTeam(w,q,'alpha').id,after.id,'new pair is stable');
});

test('suppression/incompatibility degrades cooperation without deadlocking the other buddy',()=>{
  const w=world(),q=squad(w),p=pairForTeam(w,q,'alpha'),a=byId(q,p.a),b=byId(q,p.b);
  a.suppressedUntil=100;w.b.time=20;w.S.updateBuddyPairs(q,w.b);
  assert.equal(pairForTeam(w,q,'alpha').state,'suppressed');
  w.S.fireAndMovement(q,w.b);
  assert.ok(w.sent.length,'a bound still issues');
  assert.ok(w.sent[0].includes(b.id),'the unsuppressed buddy can still move');
  a.suppressedUntil=0;w.r.BattleLeases.end(q,'bound',w.b.time,'test');w.r.BattleLeases.end(q,'bound-cycle',w.b.time,'test');
  w.b.time=21;w.S.updateBuddyPairs(q,w.b);
  assert.equal(pairForTeam(w,q,'alpha').state,'ready');
  assert.ok(w.S.buddyTelemetry(w.b).reforms>=1,'reform is counted');
  b.eng=b.eng||{};b.eng.state='freeze';w.b.time=22;w.S.updateBuddyPairs(q,w.b);
  assert.equal(pairForTeam(w,q,'alpha').state,'incompatible');
});

test('cover/move cooperation narrows an authorized bound but never becomes a movement writer',()=>{
  const w=world(),q=squad(w),p=pairForTeam(w,q,'alpha'),before=q.members.map(s=>JSON.stringify(s.destination||null));
  let orderWrites=0,combatWrites=0;
  const po=w.r.BattleMovementResolver.proposeOrder,pc=w.r.BattleMovementResolver.proposeCombat;
  w.r.BattleMovementResolver.proposeOrder=function(){orderWrites++;return po.apply(this,arguments);};
  w.r.BattleMovementResolver.proposeCombat=function(){combatWrites++;return pc.apply(this,arguments);};
  w.b.time=20;w.S.updateBuddyPairs(q,w.b);
  assert.equal(orderWrites+combatWrites,0,'pair maintenance sends no resolver proposal');
  w.S.fireAndMovement(q,w.b);
  assert.equal(w.sent.length,1);
  const alpha=q.members.filter(s=>w.S.teamKeyFor(s)==='alpha');
  assert.equal(w.sent[0].filter(id=>alpha.some(s=>s.id===id)).length,2,'one buddy covers while buddy + singleton move');
  const live=pairForTeam(w,q,'alpha');
  assert.equal(live.state,'cover-move');assert.ok(live.moving!=null&&live.covering!=null);
  assert.ok(w.sent[0].includes(live.moving));assert.ok(!w.sent[0].includes(live.covering));
  assert.deepEqual(q.members.map(s=>JSON.stringify(s.destination||null)),before,'buddy/Squad Leader path did not write physical destinations');
  const dose=w.S.buddyTelemetry(w.b);assert.equal(dose.coverMoves,1);assert.equal(dose.cooperationActivations,1);
});

test('flag off is inert: no pair state and the legacy whole-fireteam bound remains',()=>{
  const w=world('buddyPairs=0'),q=H.addSquad(w.r,w.b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:100}});
  w.S.initialPhase(q,'assault');q.inContact=true;
  q.members.forEach(s=>{s._fireteamKey=w.S.teamKeyFor(s);});
  assert.equal(w.S.buddyPairsOn(),false);assert.equal(w.S.updateBuddyPairs(q,w.b),null);assert.equal(q._buddyPairs,undefined);
  const alpha=q.members.filter(s=>w.S.teamKeyFor(s)==='alpha').map(s=>s.id).sort((a,b)=>a-b);
  w.b.time=20;w.S.fireAndMovement(q,w.b);
  assert.deepEqual(w.sent[0].filter(id=>alpha.includes(id)).sort((a,b)=>a-b),alpha,'all legacy alpha movers receive the bound');
  assert.equal(w.S.buddyTelemetry(w.b),null);
});

console.log(n+' buddy-pairs checks passed');
