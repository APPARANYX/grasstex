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
   - Other layers go through BattleEngagement.requestStance, which only takes a man lower.
   - An advancing man moves crouched while his squad is on the enemy's heels: `inContact` now, or eyes on him within
     ALERT_HOLD by the squad's own picture (`squad.contact`, Perception's record with its age). `inContact` is fire
     control and blinks with every gap in a hedge; read raw it stood a squad up and knelt it again on each blink.
     `?contactStance=0` is the raw rule.
   - The stance a man shows IS the stance Engagement committed: `crouching` is derived from `prone` and
     `tacticalCrouch` on the soldier, not a copy that stepMovement refreshes. As a copy it lagged one frame
     behind every AI tick, and the FBX pose (which runs right after the tick) read a man raised from prone
     to crouch as standing: proneToCrouch, then standToCrouch a frame later, so he rose to his feet and
     knelt again. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');
function load(r,p){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}});}
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
  /* `crouching` is derived on the sim soldier; only soldier.js (its own posed lab body) still assigns one. */
  const stray=[];
  for(const f of files){
    if(f==='soldier.js')continue;
    const src=fs.readFileSync(path.join(dir,f),'utf8'),re=/\.crouching\s*=(?!=)/g;let m;
    while((m=re.exec(src)))stray.push(f+':'+(src.slice(0,m.index).split('\n').length));
  }
  assert.deepEqual(stray,[],'crouching assigned outside the lab body');
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

test('an advancing man stays low while the squad has eyes on the enemy, whatever inContact blinks; then stands',()=>{
  const {r,b,s,enemy}=oneMan(),E=r.BattleEngagement,H_=E.tuning.ALERT_HOLD,G=E.tuning.LOW_GAP_HOLD,TICK=.15;
  assert.equal(E.tuning.CONTACT_STANCE,true);
  s.target=null;s.eng=null;E.stateOf(s).stanceUntil=0;
  const seen=b.time;s.squad.contact={unit:enemy,x:enemy.root.position.x,z:enemy.root.position.z,at:seen,seenBy:1};
  const tick=()=>{b.time+=TICK;s.squad.inContact=false;E.updateSoldier(s,b);return s.eng.stance;};
  const shown=new Set();
  while(b.time-seen<H_-.5)shown.add(tick());
  assert.deepEqual([...shown],['crouch'],'inContact is off and the picture is fresh: he stays low');
  const later=[];
  while(b.time-seen<H_+G+1.5)later.push(tick());
  assert.equal(later[later.length-1],'stand','after threat memory plus the quiet-gap grace he is up');
  assert.equal(later.filter((v,i)=>i&&v!==later[i-1]).length,1,'one change, not a flutter');
});

test('a one-tick contact pulse keeps advance low through the quiet-gap grace instead of bobbing',()=>{
  const {r,b,s}=oneMan(),E=r.BattleEngagement,G=E.tuning.LOW_GAP_HOLD;
  assert.ok(G>0,'quiet-gap tuning is exported');
  s.target=null;s.eng=null;s.squad.contact=null;s.squad.inContact=true;E.stateOf(s).stanceUntil=0;
  E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'crouch','contact pulse puts him low');
  const lowUntil=s.eng.advanceLowUntil;
  assert.ok(lowUntil>=b.time+G-1e-9,'contact pulse opens the low-posture grace');

  b.time+=1.2;s.squad.inContact=false;E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'crouch','one clear tick inside the grace cannot stand him');

  const release=Math.max(s.eng.advanceLowUntil,s.eng.stanceUntil)+.05;
  b.time=release;E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'stand','after the quiet gap and stance lease expire he stands');
});

test('?contactStance=0: the raw signal, he stands the moment inContact clears',()=>{
  globalThis.location={search:'?contactStance=0'};
  let raw;try{raw=H.bootstrap();}finally{delete globalThis.location;}
  const E=raw.BattleEngagement;assert.equal(E.tuning.CONTACT_STANCE,false);
  H.resetIds();
  const b=H.makeBattle(raw),q=H.addSquad(raw,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:200}}),s=q.members[0];
  s.eng=null;s.target=null;E.stateOf(s).stanceUntil=0;
  q.contact={unit:{root:{position:{x:0,z:100}}},x:0,z:100,at:b.time,seenBy:1};
  q.inContact=true;E.updateSoldier(s,b);assert.equal(s.eng.stance,'crouch');
  b.time+=1.2;q.inContact=false;q.contact.at=b.time;E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'stand','with the flag off the fresh picture is ignored');
});

test('the stance a man shows is the stance Engagement committed, at once, with no copy to refresh',()=>{
  const {r,b,s}=oneMan(),E=r.BattleEngagement;
  E.commitStance(s,b,'prone');
  assert.equal(s.prone,true);assert.equal(!!s.crouching,false,'prone is not crouched');
  /* the defect: raised from prone to crouch by an AI tick, read before any stepMovement */
  E.commitStance(s,b,'crouch');
  assert.equal(s.prone,false);assert.equal(!!s.crouching,true,'crouch reads as crouch the moment it is committed (it read as standing)');
  E.commitStance(s,b,'stand');
  assert.equal(!!s.crouching,false);
  E.commitStance(s,b,'crawl');
  assert.equal(!!s.crouching,false,'a crawl is prone, not crouched');
  assert.throws(()=>{s.crouching=true;},TypeError,'a write would be a second owner of stance');
});

test('stepMovement shows the committed stance and derives none of its own',()=>{
  const {b,s,enemy}=oneMan();
  s.destination={x:s.root.position.x,z:s.root.position.z};
  s.target=enemy;s.suppressedUntil=b.time+5;s.tacticalCrouch=false;s.prone=false;
  for(let i=0;i<10;i++)H.stepMovement(b,s,H.AI_TICK);
  assert.equal(!!s.crouching,false,'suppressed, with a target, standing still: still standing because Engagement has him standing');
  assert.equal(s.tacticalCrouch,false,'and stepMovement wrote no stance of its own');
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

test('fire-control preparation keeps its prone lease across a brief control/contact blink',()=>{
  const {r,b,s,enemy}=oneMan(),E=r.BattleEngagement,H_=E.tuning.ALERT_HOLD;
  s.target=null;s.eng=null;
  s.squad.contact={unit:enemy,x:enemy.root.position.x,z:enemy.root.position.z,at:b.time,seenBy:enemy.id};
  s.squad.fireControl={state:'hold',targetId:enemy.id};
  E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'prone','hold-fire preparation puts him prone');
  assert.ok(s.eng.stanceUntil>=b.time+H_-1e-9,'the prep posture is leased for the remembered-threat window');

  s.squad.fireControl=null;s.squad.contact=null;s.squad.inContact=false;
  b.time+=1.2;E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'prone','a short fire-control/contact blink cannot stand him back up');

  b.time+=H_;E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'stand','once the threat-memory lease expires a quiet advance may stand');
});

test('an active bound finishes under hold fire before preparation takes over',()=>{
  const {r,b,s,enemy}=oneMan(),E=r.BattleEngagement;
  const e=E.stateOf(s),cover={x:s.root.position.x+8,z:s.root.position.z};
  e.state='bound';e.since=b.time;e.until=b.time+12;e.cover=cover;
  s.squad.contact={unit:enemy,x:enemy.root.position.x,z:enemy.root.position.z,at:b.time,seenBy:s.id};
  s.squad.fireControl={state:'hold',targetId:enemy.id};
  E.updateSoldier(s,b);
  assert.equal(e.state,'bound','a displacement already in motion is not interrupted by hold-fire preparation');
  assert.equal(e.cover,cover,'the committed cover destination remains owned');
  assert.equal(e.stance,'crouch','the mover stays in its bound posture instead of flipping prone');

  s.root.position.x=cover.x;s.root.position.z=cover.z;b.time+=.15;
  E.updateSoldier(s,b);
  assert.notEqual(e.state,'bound','arrival completes the bound instead of leaving a resumable locomotion state');

  b.time+=.15;E.updateSoldier(s,b);
  assert.equal(e.stance,'prone','once the displacement is complete, hold-fire preparation takes over');
  assert.notEqual(e.state,'bound','preparation cannot resurrect the completed bound');
});

test('withdrawal suppression expiry has hysteresis instead of stand-crouch flutter',()=>{
  const {r,b,s}=oneMan(),E=r.BattleEngagement,G=E.tuning.LOW_GAP_HOLD;
  s.target=null;s.eng=null;s.squad.state='retreat';s.suppressedUntil=b.time+.2;
  E.updateSoldier(s,b);
  assert.equal(s.eng.state,'withdraw');assert.equal(s.eng.stance,'crouch','under fire a withdrawing man stays low');
  const lowUntil=s.eng.withdrawLowUntil;
  assert.ok(lowUntil>=b.time+G-1e-9,'incoming fire opens the withdrawal low-posture grace');

  b.time+=.3;s.suppressedUntil=0;E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'crouch','one suppression expiry tick cannot stand him during the grace');

  const release=Math.max(s.eng.withdrawLowUntil,s.eng.stanceUntil)+.05;
  b.time=release;E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'stand','after a genuinely quiet gap he resumes upright retreat');
});

test('a firing station cannot raise a temporary lower stance request',()=>{
  const {r,b,s}=oneMan(),E=r.BattleEngagement;
  s.target=null;s.eng=null;
  E.commitStance(s,b,'stand',0,'probe:stand');
  assert.equal(E.requestStance(s,b,'crouch',2),true);
  const heldUntil=s.eng.stanceUntil;
  const st={
    id:'probe-port',x:s.root.position.x,z:s.root.position.z,
    windowX:s.root.position.x,windowZ:s.root.position.z,normalX:0,normalZ:1,
    port:{stance:'stand',stances:['stand','crouch']}
  };
  r.BattleTacticalPositions={
    update:()=>true,
    current:()=>({position:st,pose:{stance:'stand'},threatSector:null}),
    anchor:()=>({x:st.x,z:st.z}),
    noteAperture:()=>{}
  };
  E.updateSoldier(s,b);
  assert.equal(s.eng.state,'station');
  assert.equal(s.eng.stance,'crouch','station pose does not override the active lower-stance request');
  assert.equal(s.eng.stanceUntil,heldUntil,'station does not extend or replace the request lease');

  b.time=heldUntil+.05;E.updateSoldier(s,b);
  assert.equal(s.eng.stance,'stand','station pose resumes when the lower-stance request expires');
});

test('LoopWatch keeps genuine destination cycling inside one movement regime',()=>{
  const {r,b,s}=oneMan(),E=r.BattleEngagement;
  load(r,'battle/modules/32-ai-loop-watch.js');
  const L=r.BattleAILoopWatch,e=E.stateOf(s);
  s.squad.commandPhase='assault';s.squad.state='engaged';e.state='advance';
  for(let i=0;i<10;i++){
    b.time=i;
    s.root.position.x=i%2?2:0;s.root.position.z=0;
    s.destination={x:i%2?10:-10,z:0};
    L.sample(b);
  }
  const a=L.alerts(b).find(x=>x.kind==='position-seeking'&&String(x.soldierId)===String(s.id));
  assert.ok(a,'stable-regime destination ping-pong remains visible');
  assert.ok(a.destinationChanges>=5);
  assert.ok(a.travel>=6&&a.net<4.5);
});

test('LoopWatch does not stitch position-seeking across command-phase changes',()=>{
  const {r,b,s}=oneMan(),E=r.BattleEngagement;
  load(r,'battle/modules/32-ai-loop-watch.js');
  const L=r.BattleAILoopWatch,e=E.stateOf(s);
  s.squad.state='engaged';s.squad.commandPhase='assault';e.state='advance';
  for(let i=0;i<10;i++){
    b.time=i;
    if(i===5)s.squad.commandPhase='regroup';
    s.root.position.x=i%2?2:0;s.root.position.z=0;
    s.destination={x:i%2?10:-10,z:0};
    L.sample(b);
  }
  assert.ok(!L.alerts(b).some(x=>x.kind==='position-seeking'&&String(x.soldierId)===String(s.id)),
    'assault and accepted regroup are separate movement populations');
});

test('LoopWatch restarts position-seeking history on station and retreat authority takeovers',()=>{
  const run=(kind)=>{
    const {r,b,s}=oneMan(),E=r.BattleEngagement;
    load(r,'battle/modules/32-ai-loop-watch.js');
    const L=r.BattleAILoopWatch,e=E.stateOf(s);
    s.squad.state='engaged';s.squad.commandPhase='assault';e.state='advance';
    for(let i=0;i<10;i++){
      b.time=i;
      if(i===5){
        if(kind==='station')e.state='station';
        else{s.squad.state='retreat';e.state='withdraw';}
      }
      s.root.position.x=i%2?2:0;s.root.position.z=0;
      s.destination={x:i%2?10:-10,z:0};
      L.sample(b);
    }
    assert.ok(!L.alerts(b).some(x=>x.kind==='position-seeking'&&String(x.soldierId)===String(s.id)),
      kind+' takeover starts a fresh movement regime');
  };
  run('station');run('retreat');
});

test('LoopWatch flags four committed stance changes in 8 seconds only with stable contact/cover and little movement',()=>{
  const {r,b,s,enemy}=oneMan(),E=r.BattleEngagement;
  load(r,'battle/modules/32-ai-loop-watch.js');
  const L=r.BattleAILoopWatch;
  assert.ok(L&&L.sample,'LoopWatch is loaded');
  s.squad.inContact=true;s.squad.contact={unit:enemy,x:enemy.root.position.x,z:enemy.root.position.z,at:b.time,seenBy:s.id};
  const e=E.stateOf(s);e.cover={x:s.root.position.x,z:s.root.position.z,slotId:'stable-cover'};
  E.commitStance(s,b,'crouch',0,'probe:crouch-1');b.time+=1;
  E.commitStance(s,b,'stand',0,'probe:stand-1');b.time+=1;
  E.commitStance(s,b,'crouch',0,'probe:crouch-2');b.time+=1;
  E.commitStance(s,b,'stand',0,'probe:stand-2');
  assert.equal(e.stanceTrail.length,4);
  L.sample(b);
  const a=L.alerts(b).find(x=>x.kind==='posture-churn'&&String(x.soldierId)===String(s.id));
  assert.ok(a,'posture churn is surfaced');
  assert.equal(a.stanceChanges,4);
  assert.deepEqual(a.stanceReasons,['probe:crouch-1','probe:stand-1','probe:crouch-2','probe:stand-2']);
  assert.ok(a.net<.01,'the diagnostic is about churn without movement');
  assert.match(a.sequence.join(' | '),/crouch→stand \[probe:stand-1\]/);

  /* Same number of stance changes, but a meaningful contact change means no churn alert. */
  L.clear(b);e.stanceTrail=[];b.time+=1;
  E.commitStance(s,b,'crouch',0,'contact:crouch');b.time+=1;
  s.squad.contact={unit:{id:'other',dead:false,root:{position:{x:40,y:0,z:80}}},x:40,z:80,at:b.time,seenBy:s.id};
  E.commitStance(s,b,'stand',0,'contact:stand');b.time+=1;
  E.commitStance(s,b,'crouch',0,'contact:crouch-2');b.time+=1;
  E.commitStance(s,b,'stand',0,'contact:stand-2');
  L.sample(b);
  assert.ok(!L.alerts(b).some(x=>x.kind==='posture-churn'),'a changed contact suppresses the posture-churn diagnosis');
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
