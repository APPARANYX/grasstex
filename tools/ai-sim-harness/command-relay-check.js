#!/usr/bin/env node
'use strict';
/* Phase 0D2: bounded direct voice/visual links and fireteam relay timing.

   Topology is opt-in with ?commandRelay=1. It changes only receipt/adoption timing; Command Reception
   still owns no stance, target, path or destination. Referenced team orders may travel
   Squad Leader -> deterministic fireteam relay -> member, while simple squad orders remain direct. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const H=require('./harness');
const log=console.log;console.log=(...a)=>(typeof a[0]==='string'&&a[0][0]==='['?undefined:log(...a));
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}

function world(search){
  H.resetIds();
  const r=H.bootstrap({search:search||'?commandReception=1&commandRelay=1&stressAct=0'});
  const b=H.makeBattle(r,{seed:81});
  const q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:120},facing:0});
  q.state='advance';q.commandPhase='approach';q.orderAnchor={x:0,z:0};q.rally={x:0,z:0};q.objective={x:0,z:120};
  return{r,b,q,C:r.BattleCommandReception,Q:r.BattleSquadStability};
}
function groups(w){
  const g={};
  w.q.members.filter(s=>!s.dead).forEach(s=>{
    const k=w.Q.teamKeyFor(s);(g[k]||(g[k]=[])).push(s);
  });
  Object.values(g).forEach(a=>a.sort((x,y)=>(+x.slotIndex||0)-(+y.slotIndex||0)));
  return g;
}
function relayPair(w){
  const g=groups(w);
  const key=Object.keys(g).find(k=>k!=='command'&&g[k].length>=2);
  assert.ok(key,'fixture has a non-command team with two men');
  return{key,relay:g[key][0],member:g[key][1]};
}
function rec(w,s,scope){return w.C.snapshot(s,w.b).records['test|'+scope];}
function publish(w,s,scope,reference,extra){
  return w.C.publish(w.q,w.b,'test',[s],Object.assign({
    scope,action:'order-'+scope,signature:'stable-'+scope,reference
  },extra||{}));
}

test('relay topology is default-on and the legacy timing model remains available via ?commandRelay=0',()=>{
  assert.equal(world('?commandReception=1').C.relayEnabled(),true,'default-on after Phase 0E benchmark validation');
  assert.equal(world('?commandReception=1&commandRelay=0').C.relayEnabled(),false,'?commandRelay=0 is the legacy control arm');
  assert.equal(world('?commandReception=1&commandRelay=1').C.relayEnabled(),true);

  /* The legacy timing model is still reachable via ?commandRelay=0. */
  const b=world('?commandReception=1&commandRelay=0');
  const sb=b.q.members[4];
  publish(b,sb,'legacy','point',{point:{x:20,z:20}});
  const br=rec(b,sb,'legacy');
  assert.equal(br.channel,'direct-voice-model');
});

test('simple squad orders stay direct even for a member of another fireteam',()=>{
  const w=world(),p=relayPair(w);
  publish(w,p.member,'simple','none');
  const r=rec(w,p.member,'simple');
  assert.equal(r.channel,'voice-direct');
  assert.equal(r.hops,1);
  assert.equal(r.relayId,null);
  assert.equal(r.reference,'none');
});

test('a referenced team order relays through the deterministic first living man of that fireteam',()=>{
  const w=world(),p=relayPair(w);
  publish(w,p.member,'move','point',{point:{x:12,z:30}});
  const r=rec(w,p.member,'move');
  assert.equal(r.channel,'voice-relay');
  assert.equal(r.hops,2);
  assert.equal(r.relayId,String(p.relay.id));
  assert.ok(r.relayReceivedAt>w.b.time);
  assert.ok(r.relayReadyAt>r.relayReceivedAt);
  assert.ok(r.receivedAt>r.relayReadyAt,'member hears the relay only after the relay man processed the order');
  assert.ok(r.adoptedAt>r.receivedAt);
});

test('the relay man himself receives the referenced order directly',()=>{
  const w=world(),p=relayPair(w);
  publish(w,p.relay,'lead','point',{point:{x:12,z:30}});
  const r=rec(w,p.relay,'lead');
  assert.equal(r.channel,'voice-direct');
  assert.equal(r.hops,1);
  assert.equal(r.relayId,null);
});

test('a direct order outside voice range but inside clear visual range uses a visual signal',()=>{
  const w=world(),g=groups(w),s=g.command.find(x=>!w.r.SquadAI.isLeader(x));
  assert.ok(s,'fixture has a non-leader command-team man');
  const leader=w.r.SquadAI.leaderOf(w.q);
  s.root.position.x=leader.root.position.x+70;s.root.position.z=leader.root.position.z;
  publish(w,s,'visual','none');
  const r=rec(w,s,'visual');
  assert.equal(r.channel,'visual-direct');
  assert.equal(r.hops,1);
  assert.ok(r.distance>w.C.tuning.VOICE_RANGE&&r.distance<=w.C.tuning.VISUAL_RANGE);
});

test('blocked visual line of sight prevents an out-of-voice-range command',()=>{
  const w=world(),g=groups(w),s=g.command.find(x=>!w.r.SquadAI.isLeader(x));
  const leader=w.r.SquadAI.leaderOf(w.q);
  s.root.position.x=leader.root.position.x+70;s.root.position.z=leader.root.position.z;
  w.r.SquadAI.hasLineOfSight=()=>false;
  publish(w,s,'blocked','none');
  assert.equal(rec(w,s,'blocked').phase,'unreachable');
  assert.equal(rec(w,s,'blocked').adoptedAt,null);
});

test('a failing line-of-sight provider cannot silently authorize a visual order',()=>{
  const w=world(),g=groups(w),s=g.command.find(x=>!w.r.SquadAI.isLeader(x));
  const leader=w.r.SquadAI.leaderOf(w.q);
  s.root.position.x=leader.root.position.x+70;s.root.position.z=leader.root.position.z;
  w.r.SquadAI.hasLineOfSight=()=>{throw new Error('LOS unavailable');};
  publish(w,s,'los-error','none');
  assert.equal(rec(w,s,'los-error').phase,'unreachable');
});

test('a direct order beyond both bounded channels remains explicitly unreachable',()=>{
  const w=world(),g=groups(w),s=g.command.find(x=>!w.r.SquadAI.isLeader(x));
  const leader=w.r.SquadAI.leaderOf(w.q);
  s.root.position.x=leader.root.position.x+120;s.root.position.z=leader.root.position.z;
  publish(w,s,'far','none');
  let r=rec(w,s,'far');
  assert.equal(r.channel,'unreachable');
  assert.equal(r.phase,'unreachable');
  assert.equal(r.receivedAt,null);assert.equal(r.adoptedAt,null);
  w.b.time=999;
  assert.equal(w.C.adopted(s,w.b,'test','far'),null);
  const tel=w.C.telemetry(w.b);
  assert.equal(tel.unreachable,1);
  assert.equal(tel.byChannel.unreachable,1);
});

test('a caller may explicitly require direct delivery instead of a fireteam relay',()=>{
  const w=world(),p=relayPair(w);
  publish(w,p.member,'direct','point',{relay:false,point:{x:10,z:20}});
  const r=rec(w,p.member,'direct');
  assert.equal(r.relayPolicy,'never');
  assert.equal(r.channel,'voice-direct');
  assert.equal(r.hops,1);
});

test('shipping personal movement uses the relay path only when both experimental gates are on',()=>{
  const w=world('?commandReception=1&commandMovement=1&commandRelay=1&stressAct=0'),p=relayPair(w);
  w.Q.updateFireteams(w.q,w.b);
  const relayRec=w.C.snapshot(p.relay,w.b).records['movement|soldier:'+String(p.relay.id)];
  const memberRec=w.C.snapshot(p.member,w.b).records['movement|soldier:'+String(p.member.id)];
  assert.ok(relayRec&&memberRec);
  assert.equal(relayRec.hops,1);
  assert.equal(memberRec.hops,2);
  assert.equal(memberRec.relayId,String(p.relay.id));
  assert.ok(memberRec.adoptedAt>relayRec.adoptedAt);
  assert.equal(p.member._fireteamDestination==null,true,'relay timing still does not bypass personal adoption');
});

test('relay outcomes are deterministic and draw no combat RNG',()=>{
  function run(){
    const w=world(),p=relayPair(w);let draws=0,real=w.b.random;
    w.b.random=function(){draws++;return real.call(this);};
    publish(w,p.member,'det','object');
    return{draws,record:rec(w,p.member,'det')};
  }
  const a=run(),b=run();
  assert.equal(a.draws,0);
  assert.deepEqual(a,b);
});

test('Command Reception remains an information boundary, not a physical relay/movement owner',()=>{
  const src=fs.readFileSync(path.join(H.REPO,'battle/modules/18-command-reception.js'),'utf8');
  assert.doesNotMatch(src,/\.rotation\s*=/);
  assert.doesNotMatch(src,/\.(?:destination|orderDestination|_fireteamDestination|target|prone|crawling|tacticalCrouch)\s*=/);
  assert.doesNotMatch(src,/\b(?:Math\.random|battle\.random)\s*\(/);
});

console.log(n+' command-relay checks passed');
