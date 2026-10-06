#!/usr/bin/env node
'use strict';
/* Deterministic contract for Perception-owned per-man beliefs (?soldierBeliefs=1).
   The check proves delivery/provenance/expiry without consulting presentation or combat RNG. */
const assert=require('node:assert/strict'),H=require('./harness');

let n=0;
function test(name,fn){fn();n++;console.log('PASS '+name);}
function hash01(a,b){
  const s=String(a)+'|'+String(b);let h=2166136261>>>0;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return(h>>>0)/4294967296;
}
function world(search='?soldierBeliefs=1&callouts=1'){
  H.resetIds();
  const r=H.bootstrap({search,modules:true}),b=H.makeBattle(r,{seed:4242});
  const us=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:100},facing:0});
  const ge=H.addSquad(r,b,{id:'ge-0',faction:'ge',x:0,z:40,objective:{x:0,z:-100},facing:Math.PI});
  b._movementRoot=r;
  us.members.forEach(s=>{s.moving=true;s.root.rotation.y=Math.PI;});
  ge.members.slice(1).forEach(s=>{s.dead=true;b.factions.ge.alive--;});
  const enemy=ge.members[0],A=us.members[0];
  A.root.position.x=0;A.root.position.z=0;A.root.rotation.y=0;A.moving=true;
  enemy.root.position.x=0;enemy.root.position.z=40;enemy.moving=false;
  return{r,b,S:r.SquadAI,C:r.BattleCallouts,E:r.BattleEngagement,us,ge,enemy,A};
}
function snap(w,s){return w.S.beliefSnapshot(s,w.b);}
function active(w,s){return w.S.soldierContact(s,w.b);}
function storeDigest(s){
  const st=s&&s._beliefs;if(!st)return null;
  const keys=Object.keys(st.byKey||{}).sort();
  return{
    lastTime:st.lastTime,lastCalloutId:st.lastCalloutId,lastHeardKey:st.lastHeardKey,
    records:keys.map(k=>{const r=st.byKey[k];return[
      k,r.targetId,r.source,r.sourceSoldierId,r.sourceCalloutId,r.x,r.z,r.sector,
      r.observedAt,r.reportedAt,r.receivedAt,r.baseConfidence,r.expiresAt,r.combatThreat,r.precision,r.reason
    ];}),
    history:(st.history||[]).map(h=>[
      h.at,h.kind,h.key,h.targetId,h.source,h.sourceSoldierId,h.sourceCalloutId,
      h.observedAt,h.receivedAt,h.confidence,h.combatThreat,h.reason
    ])
  };
}
function firstHeardCandidate(w,msgId){
  return w.us.members.slice(1).find(s=>hash01(msgId+':'+w.A.id,s.id)>=0.08);
}

test('observer sight stays personal until another man actually hears the callout',()=>{
  const w=world(),draws={n:0},real=w.b.random;
  w.b.random=()=>{draws.n++;return real.call(w.b);};
  const B=firstHeardCandidate(w,1);assert.ok(B,'deterministic heard candidate exists');
  B.root.position.x=2;B.root.position.z=0;B.root.rotation.y=Math.PI;B.moving=true;

  w.A.target=w.enemy;
  w.S.perceive(w.A,w.b);
  assert.equal(snap(w,w.A).selectedKey,'unit:ge:'+w.enemy.id);
  assert.equal(snap(w,w.A).beliefs[0].source,'seen');
  assert.ok(w.us.contact&&w.us.contact.unit===w.enemy,'aggregate squad picture still exists upward');
  assert.equal(active(w,B),null,'same-squad aggregate contact is not personal knowledge');
  assert.equal(w.E.knownThreat(B,w.b),null,'Engagement does not consume the aggregate as B truth');
  assert.equal(snap(w,B).unknown,true);

  const before=w.C.diagnostics(w.b);
  assert.ok(before.counts.addressed>0&&before.counts.sameSquadAddressed>0,'same-squad listeners were addressed');
  w.b.time=1.5;
  assert.ok(w.C.heardBy(w.b,B),'the selected listener actually heard the call');
  w.S.applyCalloutBelief(B,w.b);
  const c=active(w,B),bs=snap(w,B);
  assert.ok(c);assert.equal(c.source,'told');assert.equal(c.unit,null,'reported contact is not a hidden live target');
  assert.equal(bs.beliefs.find(x=>x.key===bs.selectedKey).sourceSoldierId,String(w.A.id));
  assert.ok(bs.beliefs.find(x=>x.key===bs.selectedKey).sourceCalloutId!=null);
  assert.ok(bs.beliefs.find(x=>x.key===bs.selectedKey).receivedAt>0);
  assert.deepEqual(w.E.knownThreat(B,w.b),{x:c.x,z:c.z},'Engagement consumes the delivered personal last-known point');
  assert.equal(w.E.fireControlObservation(B,w.b).targetId,null,'a told belief is not promoted into an exact hidden target');
  assert.equal(draws.n,0,'information propagation draws no combat RNG');
});

test('missed and out-of-range callouts create no personal knowledge',()=>{
  const w=world();
  const miss=w.us.members.slice(1).find(s=>hash01('1:'+w.A.id,s.id)<0.9);
  assert.ok(miss,'deterministic miss candidate exists');
  miss.root.position.x=59;miss.root.position.z=0;miss.root.rotation.y=Math.PI;miss.moving=true;
  miss.suppressedUntil=10;
  const out=w.us.members.find(s=>s!==w.A&&s!==miss);
  out.root.position.x=75;out.root.position.z=0;out.root.rotation.y=Math.PI;out.moving=true;
  w.b._gunfire=[{x:59,z:0,faction:'ge',unit:w.enemy,at:0}];
  w.A.target=w.enemy;w.S.perceive(w.A,w.b);
  w.b.time=1.6;
  assert.equal(w.C.heardBy(w.b,miss),null,'deterministic missed listener heard nothing');
  w.S.applyCalloutBelief(miss,w.b);
  assert.equal(active(w,miss),null);
  assert.equal(w.C.heardBy(w.b,out),null,'out-of-range listener was never addressed');
  w.S.applyCalloutBelief(out,w.b);
  assert.equal(active(w,out),null);
  const d=w.C.diagnostics(w.b).counts;
  assert.ok(d.missed>=1);assert.ok(d.sameSquadAddressed>0);
});

test('heard gunfire is lower-confidence, imprecise location-only information',()=>{
  const w=world(),B=w.us.members[1];
  B.root.position.x=30;B.root.position.z=0;B.root.rotation.y=Math.PI;B.moving=true;
  w.b.time=2;
  w.b._gunfire=[{x:0,z:40,faction:'ge',unit:w.enemy,at:2}];
  /* The sound event stands on its own. Later hidden truth about the shooter must not erase it. */
  w.enemy.dead=true;
  const real=w.b.random;let draws=0;w.b.random=()=>{draws++;return real.call(w.b);};
  w.S.hearGunfireBelief(B,w.b);
  const c=active(w,B),bs=snap(w,B),rec=bs.beliefs.find(x=>x.source==='heard');
  assert.ok(c&&rec);assert.equal(c.source,'heard');assert.equal(c.knownUnitId,null);assert.equal(c.unit,null);
  assert.ok(rec.confidence<0.55,'hearing confidence stays below told minimum');
  assert.ok(Math.hypot(rec.location.x-w.enemy.root.position.x,rec.location.z-w.enemy.root.position.z)>0.01,'sound is spatially imprecise');
  assert.equal(rec.precision,'imprecise-sound');assert.equal(draws,0);
});

test('aimed fire reveals a distant prone shooter origin and reports it to the squad',()=>{
  const w=world(),victim=w.A,mate=firstHeardCandidate(w,1),shooter=w.enemy;
  assert.ok(mate,'deterministic same-squad listener exists');
  mate.root.position.x=2;mate.root.position.z=0;mate.root.rotation.y=0;mate.moving=true;
  shooter.root.position.x=0;shooter.root.position.z=260;shooter.prone=true;shooter.moving=false;
  victim.root.position.x=0;victim.root.position.z=0;victim.target=null;
  const cold=w.S.detectionRange(w.S.ROLES[victim.role],shooter);
  assert.ok(260>cold,'the prone shooter is outside passive spotting range');

  w.S.extend('shotModel','ballistics',()=>false);
  shooter.target=victim;shooter.fireCooldown=0;w.b.time=2;
  assert.equal(w.S.tryFire(shooter,w.b),true,'shooter actually discharges an aimed burst');

  const vc=active(w,victim),vr=snap(w,victim).beliefs.find(x=>x.source==='incoming');
  assert.ok(vc&&vr,'the intended victim gets an incoming-fire belief');
  assert.equal(vc.knownUnitId,String(shooter.id));
  assert.equal(vc.precision,'fire-origin');
  assert.equal(vr.reason,'incoming-fire');
  assert.deepEqual(vr.location,{x:0,z:260},'the record is the firing origin at trigger time');
  assert.equal(victim.target,shooter,'the shot reveals the shooter for ordinary tracking to take over');
  assert.ok(w.us.contact&&w.us.contact.fireRevealed&&w.us.contact.unit===shooter,'the squad gets the direction immediately');
  assert.ok(w.C.diagnostics(w.b).counts.sent>=1,'the victim calls the firing origin to nearby squad-mates');

  shooter.root.position.x=25;shooter.root.position.z=275;
  assert.equal(active(w,victim).x,0,'the fire-origin belief does not secretly track the shooter after the shot');
  assert.equal(active(w,victim).z,260);

  w.b.time=3.5;
  assert.ok(w.C.heardBy(w.b,mate),'a same-squad mate receives the existing simulated callout');
  w.S.applyCalloutBelief(mate,w.b);
  const mc=active(w,mate);
  assert.ok(mc);assert.equal(mc.source,'told');assert.equal(mc.precision,'fire-origin');
  assert.equal(mc.knownUnitId,String(shooter.id));
  assert.equal(w.E.fireControlObservation(mate,w.b).targetId,String(shooter.id),'reported firing origin is actionable fire-control information');
});

test('incoming-fire reveal has a complete legacy control arm',()=>{
  const w=world('?soldierBeliefs=1&callouts=1&incomingFireReveal=0');
  w.A.target=null;w.us.contact=null;
  assert.equal(w.S.parseIncomingFireReveal('?incomingFireReveal=0'),false);
  assert.equal(w.S.incomingFireRevealOn(),false);
  assert.equal(w.S.noteIncomingFire(w.A,w.enemy,w.b),null);
  assert.equal(w.A.target,null);
  assert.equal(w.us.contact,null);
  assert.equal(snap(w,w.A).unknown,true);
});

test('direct personal sight supersedes a weaker report and does not follow hidden truth afterward',()=>{
  const w=world(),B=firstHeardCandidate(w,1);
  B.root.position.x=2;B.root.position.z=0;B.root.rotation.y=Math.PI;B.moving=true;
  w.A.target=w.enemy;w.S.perceive(w.A,w.b);w.b.time=1.5;assert.ok(w.C.heardBy(w.b,B));
  w.S.applyCalloutBelief(B,w.b);
  const told=active(w,B),reported={x:told.x,z:told.z};
  w.enemy.root.position.x=12;w.enemy.root.position.z=45;
  assert.deepEqual({x:active(w,B).x,z:active(w,B).z},reported,'reported memory does not track live target position');

  B.root.rotation.y=Math.atan2(w.enemy.root.position.x-B.root.position.x,w.enemy.root.position.z-B.root.position.z);
  B.target=w.enemy;w.b.time=2;w.S.rememberSeen(B,w.enemy,w.b,true,'direct-test');
  const seen=active(w,B),rec=snap(w,B).beliefs.find(x=>x.key===snap(w,B).selectedKey);
  assert.equal(seen.source,'seen');assert.equal(seen.unit,w.enemy);assert.equal(rec.confidence,1);
  assert.equal(rec.location.x,12);assert.equal(rec.location.z,45);

  w.S.clearTarget(B);w.enemy.root.position.x=30;w.enemy.root.position.z=55;
  const remembered=active(w,B);
  assert.equal(remembered.unit,null);
  assert.equal(remembered.x,12);assert.equal(remembered.z,45,'last seen point remains recorded, not live');
});

test('stale beliefs expire by time without hidden truth validation',()=>{
  const w=world(),B=firstHeardCandidate(w,1);
  B.root.position.x=2;B.root.position.z=0;B.root.rotation.y=Math.PI;B.moving=true;
  w.A.target=w.enemy;w.S.perceive(w.A,w.b);w.b.time=1.5;assert.ok(w.C.heardBy(w.b,B));w.S.applyCalloutBelief(B,w.b);
  const remembered=active(w,B);assert.ok(remembered);
  w.enemy.dead=true;
  w.b.time=5;assert.ok(active(w,B),'hidden death does not retroactively erase what he heard');
  w.b.time=13;assert.equal(active(w,B),null,'belief expires on its declared staleness clock');
  assert.ok(w.S.beliefTelemetry(w.b).expired>=1);
});

test('personally visible non-threat replaces stale threat memory instead of resurrecting it',()=>{
  const w=world(),B=w.us.members[1];
  B.root.position.x=1;B.root.position.z=0;B.root.rotation.y=0;B.moving=true;B.target=w.enemy;
  w.S.rememberSeen(B,w.enemy,w.b,true,'direct-test');assert.ok(active(w,B));
  w.E.stateOf(w.enemy).state='freeze';
  w.b.time=.2;w.S.observeKnownNonThreats(B,w.b);
  assert.equal(B.target,null,'Perception releases a visible non-threat target');
  assert.equal(active(w,B),null,'non-threat observation is not selected as a threat belief');
  const rec=snap(w,B).beliefs.find(x=>x.targetId===String(w.enemy.id));
  assert.ok(rec);assert.equal(rec.combatThreat,false);assert.match(rec.reason,/freeze/);
});

test('diagnostic snapshots are observe-only',()=>{
  const w=world(),B=w.us.members[1];
  w.S.rememberSeen(B,w.enemy,w.b,true,'snapshot-test');
  const before=storeDigest(B);
  const a=w.S.beliefSnapshot(B,w.b),t=w.S.beliefTelemetry(w.b);
  assert.ok(a&&t);assert.deepEqual(storeDigest(B),before,'snapshot/telemetry do not prune or mutate state');
});

test('flag off reproduces legacy shared-contact knowledge and creates no belief state',()=>{
  const w=world('?soldierBeliefs=0&callouts=1'),B=w.us.members[1];
  B.root.position.x=2;B.root.position.z=0;B.root.rotation.y=Math.PI;B.moving=true;
  w.A.target=w.enemy;w.S.perceive(w.A,w.b);
  const c=w.S.soldierContact(B,w.b);
  assert.ok(c&&c.unit===w.enemy,'legacy consumer sees squad aggregate immediately');
  assert.equal(B._beliefs,undefined);
  assert.equal(w.S.beliefSnapshot(B,w.b),null);
  assert.equal(w.C.telemetry(w.b).sameSquadAddressed,0,'legacy callout audience remains cross-squad only');
  assert.equal(w.S.parseSoldierBeliefs(''),true);assert.equal(w.S.parseSoldierBeliefs('?soldierBeliefs=1'),true);
  assert.equal(w.S.parseSoldierBeliefs('?soldierBeliefs=0'),false);assert.equal(w.S.parseSoldierBeliefs('?soldierBeliefs=off'),false);
});

console.log(n+' soldier-beliefs checks passed');
