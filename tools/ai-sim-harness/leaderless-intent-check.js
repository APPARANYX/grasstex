#!/usr/bin/env node
'use strict';
/* Leaderless intent continuation (module 16): during the existing succession gap, preserve the last
   valid Meso intent without pretending a replacement Squad Leader exists. New Meso decisions stop;
   already-published movement and ordinary Engagement/Movement Resolver reactions remain legal. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');

function load(r,p){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}});}
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}

function world(search='?leaderlessIntent=1'){
  H.resetIds();
  const r=H.bootstrap({search}),events=[];
  r.BattleTelemetry={record(type,data){events.push({type,data:JSON.parse(JSON.stringify(data||{}))});}};
  load(r,'battle/movement-resolver.js');
  const b=H.makeBattle(r),q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:160}});
  b._movementRoot=r;
  q.route=[{x:0,z:80},{x:0,z:160}];
  q.routeIndex=0;
  q.objective={x:0,z:80};
  q.commandPhase='approach';
  q._orderGoal={x:0,z:80};
  q._macroMission={
    version:1,intent:'attack',action:'attack',point:{x:0,z:160},
    route:[{x:0,z:80}],status:'executing',objectiveId:'obj-1'
  };
  return{r,b,q,events,S:r.SquadAI,Q:r.BattleSquadStability,L:r.BattleLeases,E:r.BattleEngagement};
}
function leader(w){return w.S.leaderOf(w.q);}
function killLeader(w){
  const l=leader(w);assert.ok(l,'leader required');
  w.b.killSoldier(l,null);w.Q.leaderDown(w.q);return l;
}
function point(p){return p&&{x:+p.x||0,z:+p.z||0};}
function samePoint(a,b,eps=1e-9){return !!a&&!!b&&Math.hypot(a.x-b.x,a.z-b.z)<=eps;}
function survivor(w){return w.q.members.find(s=>!s.dead&&s.role==='rifleman')||w.q.members.find(s=>!s.dead);}

test('flag is opt-in while proving and has an explicit legacy control',()=>{
  assert.equal(world('').Q.leaderlessIntentOn(),false);
  assert.equal(world('?leaderlessIntent=1').Q.leaderlessIntentOn(),true);
  const Q=world('?leaderlessIntent=off').Q;
  assert.equal(Q.leaderlessIntentOn(),false);
  assert.equal(Q.parseLeaderlessIntent('?leaderlessIntent=true'),true);
  assert.equal(Q.parseLeaderlessIntent('?leaderlessIntent=0'),false);
});

test('leader loss captures the parent intent and freezes route, phase, objective and anchor',()=>{
  const w=world();
  w.Q.updateFireteams(w.q,w.b);
  const before={
    anchor:point(w.q.orderAnchor),objective:point(w.q.objective),phase:w.q.commandPhase,
    routeIndex:w.q.routeIndex,dests:w.q.members.filter(s=>!s.dead).map(s=>[String(s.id),point(s._fireteamDestination)])
  };
  killLeader(w);H.run(w.r,w.b,.3);
  const lease=w.L.get(w.q,'succession'),intent=w.q._leaderlessIntent;
  assert.ok(lease&&intent,'succession owns an inherited intent snapshot');
  assert.equal(lease.data.intent,intent,'lease and squad expose the same owner record');
  assert.equal(intent.phase,before.phase);
  assert.equal(intent.routeIndex,before.routeIndex);
  assert.ok(samePoint(intent.objective,before.objective));
  assert.ok(samePoint(intent.anchor,before.anchor));

  let accepts=0;
  w.r.BattleCommanderAI={acceptMission(){accepts++;}};
  w.q._macroMission={
    version:2,intent:'attack',action:'flank',point:{x:70,z:170},
    route:[{x:60,z:90}],status:'issued',objectiveId:'obj-2'
  };
  w.Q.executeMission(w.b,w.q,null);
  w.Q.advanceSquadAnchor(w.q,w.b);
  w.Q.updateFireteams(w.q,w.b);

  assert.equal(accepts,0,'an absent leader cannot accept the replacement brief');
  assert.equal(w.q.commandPhase,before.phase);
  assert.equal(w.q.routeIndex,before.routeIndex);
  assert.ok(samePoint(w.q.objective,before.objective));
  assert.ok(samePoint(w.q.orderAnchor,before.anchor));
  for(const [id,d] of before.dests){
    const man=w.q.members.find(s=>String(s.id)===id);
    assert.ok(samePoint(point(man._fireteamDestination),d),'fireteam intent stays inherited for '+id);
  }
});

test('already-published movement may finish but no fresh Meso order is published',()=>{
  const w=world(),man=survivor(w);
  const start=point(man.root.position),goal={x:start.x,z:start.z+12};
  man._fireteamDestination=point(goal);
  man._fireteamPublishKey='inherited-test';
  w.r.BattleMovementResolver.proposeOrder(man,goal,w.b,false);
  w.r.BattleMovementResolver.resolve(man,w.b);
  const beforeRequests=man._movementResolver.requests;
  killLeader(w);H.run(w.r,w.b,1.2);
  const moved=Math.hypot(man.root.position.x-start.x,man.root.position.z-start.z);
  assert.ok(moved>.2,'persistent Movement Resolver order still executes: '+moved.toFixed(2)+' m');
  assert.equal(man._movementResolver.requests,beforeRequests,'Squad Leader layer published no replacement order');
  assert.ok(
    ['finish-committed-move','hold-intent'].includes(w.q._leaderlessIntent.lastAction),
    'episode records bounded local continuation'
  );
});

test('an inherited bound can finish; succession cannot authorize a new bound',()=>{
  const w=world(),man=survivor(w);
  w.q._assaultAuthorized=true;
  w.L.grant(w.q,'bound','squad-leader',w.b.time,w.b.time+3.6,'pre-loss bound','expiry',{team:'alpha'});
  w.E.orderBound([man]);
  killLeader(w);H.run(w.r,w.b,.6);
  assert.ok(w.L.holds(w.q,'bound',w.b.time),'already-authorized short move remains live');
  assert.equal(w.q._leaderlessIntent.lastAction,'finish-committed-move');
  const oldUntil=w.L.until(w.q,'bound');
  H.run(w.r,w.b,3.6);
  assert.ok(!w.L.holds(w.q,'bound',w.b.time),'inherited bound expires normally');
  assert.equal(w.L.until(w.q,'bound'),oldUntil,'no replacement bound was granted');
  assert.equal(w.E.stateOf(man).boundOrder,false,'stale Micro bound order is cleared');
});

test('immediate contact remains Engagement-owned and requests help upward once',()=>{
  const w=world();
  const enemy=H.addSquad(w.r,w.b,{id:'ge-0',faction:'ge',x:0,z:34,objective:{x:0,z:0},composition:['rifleman']});
  enemy.members[0].root.position.x=0;enemy.members[0].root.position.z=30;
  killLeader(w);
  let acquired=false,contactSeen=false;
  H.run(w.r,w.b,4,()=>{
    acquired=acquired||w.q.members.some(s=>!s.dead&&s.target);
    contactSeen=contactSeen||w.q.inContact;
  });
  assert.equal(contactSeen,true,'Perception/Engagement still sees immediate contact');
  assert.equal(acquired,true,'a survivor acquires the threat during the leaderless window');
  assert.equal(w.q._macroMissionRequest&&w.q._macroMissionRequest.reason,'leaderless-help');
  const req=w.events.filter(e=>e.type==='decision-captain-request'&&e.data.reason==='leaderless-help');
  assert.equal(req.length,1,'one upward request, not request churn');
  assert.ok(
    ['immediate-contact','hold-and-fight'].includes(w.q._leaderlessIntent.lastAction),
    'contact is recorded as local action, not a new squad plan'
  );
  assert.equal(w.L.get(w.q,'bound'),null,'contact does not create a leaderless bound');
});

test('successor receives an explicit hand-back and normal Meso ownership resumes',()=>{
  const w=world();killLeader(w);H.run(w.r,w.b,1);
  const inherited=w.q._leaderlessIntent;
  assert.ok(inherited);
  H.run(w.r,w.b,5.5);
  const next=leader(w);
  assert.ok(next,'successor promoted after the existing delay');
  assert.equal(w.q._leaderlessIntent,null,'leaderless owner record closes');
  const hand=w.events.filter(e=>e.type==='decision-leaderless-handback').at(-1);
  assert.ok(hand);
  assert.equal(String(hand.data.successor),String(next.id));
  assert.equal(hand.data.missionVersion,inherited.missionVersion);

  let accepts=0;
  w.r.BattleCommanderAI={acceptMission(){accepts++;w.q._macroMission.status='executing';}};
  w.q._macroMission={
    version:3,intent:'attack',action:'attack',point:{x:40,z:180},
    route:[{x:20,z:90}],status:'issued',objectiveId:'obj-3'
  };
  w.Q.executeMission(w.b,w.q,null);
  assert.equal(accepts,1,'the new leader accepts fresh parent intent');
  assert.equal(w.q.routeIndex,0);
  assert.ok(samePoint(w.q.route[0],{x:20,z:90}));
});

test('feature-off arm keeps the pre-slice command behavior',()=>{
  const w=world('?leaderlessIntent=0');
  const before=point(w.q.orderAnchor);
  killLeader(w);H.run(w.r,w.b,.3);
  assert.equal(w.q._leaderlessIntent==null,true,'legacy arm creates no leaderless-intent owner record');
  assert.ok(!samePoint(point(w.q.orderAnchor),before),'legacy leaderless squad still advances its Meso anchor');
});

test('same leader-loss episode is deterministic',()=>{
  function trace(){
    const w=world();killLeader(w);H.run(w.r,w.b,6.5);
    return JSON.stringify(w.events.filter(e=>/^decision-leaderless-|decision-leader-succession/.test(e.type)));
  }
  assert.equal(trace(),trace());
});

console.log(n+' leaderless intent continuation checks passed');
