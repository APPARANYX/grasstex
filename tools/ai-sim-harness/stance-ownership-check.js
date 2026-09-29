#!/usr/bin/env node
'use strict';
/* Engagement is the one owner of stance (AGENTS.md "Stance churn and firing mid-change").
   Before this check three other writers set it: module 44's drills (prone/tacticalCrouch), the
   reload hook in module 12 (tacticalCrouch on every reload tick, presentation writing sim state)
   and stepMovement, which re-derived `crouching` every frame from suppression and "has a target
   and is within 0.6 m of his destination". Their writes disagreed with Engagement's commitment
   and bounced the shown stance A->B->A in under a second (stance-churn probe: 448 in one 300 s
   meeting battle, 70% of shown changes from stepMovement).
   - Nothing under battle/ writes prone/tacticalCrouch/crawling except engagement.js, the
     soldier model's own setCrouch/setProne and SquadAI's no-Engagement fallback.
   - stepMovement shows the committed stance and derives nothing: suppressed, holding a target and
     standing still, a man Engagement has standing stays standing.
   - Other layers go through BattleEngagement.requestStance, which only takes a man lower. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}

test('only Engagement writes stance flags',()=>{
  const dir=path.join(H.REPO,'battle'),files=['battle-sim.js','soldier.js','squad-ai.js','engagement.js']
    .concat(fs.readdirSync(path.join(dir,'modules')).filter(f=>f.endsWith('.js')).map(f=>'modules/'+f));
  /* soldier.js: setCrouch/setProne/kill are the body's own mechanics; squad-ai.js: fallbackBehavior
     only runs when engagement.js failed to load. */
  const ALLOWED={'engagement.js':1,'soldier.js':1,'squad-ai.js':1},WRITE=/\.(prone|tacticalCrouch|crawling|crouching)\s*=(?!=)/g;
  const offenders=[];
  for(const f of files){
    if(ALLOWED[f])continue;
    const src=fs.readFileSync(path.join(dir,f),'utf8');let m;WRITE.lastIndex=0;
    while((m=WRITE.exec(src)))offenders.push(f+':'+(src.slice(0,m.index).split('\n').length)+' .'+m[1]);
  }
  assert.deepEqual(offenders,[],'stance written outside Engagement');
  const fallback=fs.readFileSync(path.join(dir,'squad-ai.js'),'utf8'),start=fallback.indexOf('function fallbackBehavior(');
  const outside=fallback.slice(0,start)+fallback.slice(fallback.indexOf('\n  }\n',start));
  assert.ok(!WRITE.test(outside),'squad-ai.js writes stance only in fallbackBehavior');
});

function oneMan(){
  H.resetIds();
  const r=H.bootstrap(),b=H.makeBattle(r),
    q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:200}}),
    e=H.addSquad(r,b,{id:'ge-0',faction:'ge',x:0,z:120,objective:{x:0,z:0}}),
    s=q.members.find(m=>m.role==='rifleman');
  return{r,b,s,enemy:e.members[0]};
}

test('stepMovement shows the committed stance and derives none of its own',()=>{
  const {b,s,enemy}=oneMan();
  s.destination={x:s.root.position.x,z:s.root.position.z};
  s.target=enemy;s.suppressedUntil=b.time+5;s.tacticalCrouch=false;s.prone=false;
  for(let i=0;i<10;i++)H.stepMovement(b,s,H.AI_TICK);
  assert.equal(!!s.crouching,false,'suppressed, with a target, standing still: still standing because Engagement has him standing');
  s.tacticalCrouch=true;H.stepMovement(b,s,H.AI_TICK);
  assert.equal(!!s.crouching,true,'Engagement commits crouch: he crouches');
  s.prone=true;H.stepMovement(b,s,H.AI_TICK);
  assert.equal(!!s.crouching,false,'prone outranks crouch');
});

test('requestStance only takes a man lower and goes through the commitment',()=>{
  const {r,b,s}=oneMan(),E=r.BattleEngagement;
  E.commitStance(s,b,'stand',0);
  assert.equal(E.requestStance(s,b,'crouch',2),true,'standing -> crouch is granted');
  assert.equal(s.tacticalCrouch,true);assert.equal(s.eng.stance,'crouch');
  assert.ok(s.eng.fireReadyAt>=b.time+.4-1e-9,'the change pays AIM_SETTLE like any committed change');
  assert.ok(Math.abs(s.eng.stanceUntil-(b.time+2))<1e-9,'and holds for the requested time');
  E.commitStance(s,b,'prone');
  const until=s.eng.stanceUntil;
  assert.equal(E.requestStance(s,b,'crouch',2),false,'a prone man is never raised by a request');
  assert.equal(s.prone,true);assert.equal(s.eng.stanceUntil,until,'and his prone hold is untouched');
  E.commitStance(s,b,'crouch',1);
  assert.equal(E.requestStance(s,b,'crouch',9),false,'the same stance restarts no hold');
  assert.equal(E.requestStance(s,b,'stand',9),false,'a request never stands a man up');
});

test('an advancing man whose squad is in contact moves crouched; on a quiet march he stands',()=>{
  const {r,b,s}=oneMan(),E=r.BattleEngagement;
  s.target=null;s.eng=null;E.stateOf(s).stanceUntil=0;
  s.squad.inContact=false;E.updateSoldier(s,b);
  assert.equal(s.eng.state,'advance');assert.equal(s.eng.stance,'stand');
  b.time+=2;s.squad.inContact=true;E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'crouch','squad still in contact: crouched between contacts');
  b.time+=2;s.squad.inContact=false;s.suppressedUntil=b.time+3;E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'crouch','under fire: crouched');
  b.time+=4;E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'stand','fire lifted and no contact: up again');
});

console.log(n+' stance ownership tests passed');
