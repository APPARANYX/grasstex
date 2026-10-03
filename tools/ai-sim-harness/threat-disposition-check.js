#!/usr/bin/env node
'use strict';
/* Phase 5: one Perception-owned threat disposition contract.

   Living dazed/fled/declared-noncombatant people remain visible physical presences but are not combat
   threats. Normal/cower/rage/reconstituted soldiers remain threats. Every combat consumer asks the
   same SquadAI.threatDisposition() classification instead of knowing reaction-state names itself. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),H=require('./harness');
function load(r,p){new Function('window','globalThis','console','BABYLON',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}},r.BABYLON);}
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}
function world(){
  H.resetIds();
  const r=H.bootstrap({modules:false}),systems={};
  r.BattleModules={
    registerSystem(id,h){systems[id]=h;},
    unitsFor(b){return (b._roster.us||[]).concat(b._roster.ge||[]);}
  };
  r.BattleNavigation={
    findPath(a,b){return [b];},
    movementClear(){return true;},
    lineOfSightBlocked(){return false;}
  };
  load(r,'battle/modules/52-survival-tactical-route.js');
  const b=H.makeBattle(r,{seed:77});
  const us=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:100},composition:['rifleman']});
  const ge=H.addSquad(r,b,{id:'ge-0',faction:'ge',x:0,z:40,objective:{x:0,z:-100},composition:['rifleman']});
  const shooter=us.members[0],target=ge.members[0];
  shooter.root.position.x=0;shooter.root.position.z=0;shooter.root.rotation.y=0;
  target.root.position.x=0;target.root.position.z=40;target.root.rotation.y=Math.PI;
  shooter.fireCooldown=0;target.suppressedUntil=0;
  r.BattleEngagement.stateOf(shooter).state='advance';
  r.BattleEngagement.stateOf(target).state='advance';
  return{r,b,us,ge,shooter,target,E:r.BattleEngagement,S:r.SquadAI,T:r.BattleTacticalRoute};
}
function state(w,name){w.E.stateOf(w.target).state=name;}
test('classification distinguishes active threat, visible non-threat and inactive without hiding the person',()=>{
  const w=world(),D=w.S.threatDisposition;
  let d=D(w.target);
  assert.deepEqual({kind:d.kind,visible:d.visible,combatThreat:d.combatThreat,reason:d.reason},
    {kind:'active-threat',visible:true,combatThreat:true,reason:'combatant'});
  assert.ok(Object.isFrozen(d),'disposition values are read-only');

  state(w,'cower');assert.equal(D(w.target).combatThreat,true,'cower preserves the pre-Phase-5 threat semantics');
  state(w,'rage');assert.equal(D(w.target).combatThreat,true);assert.equal(D(w.target).reason,'rage');

  state(w,'freeze');d=D(w.target);
  assert.equal(d.kind,'visible-non-threat');assert.equal(d.visible,true);assert.equal(d.combatThreat,false);assert.equal(d.reason,'freeze');
  state(w,'flee');d=D(w.target);
  assert.equal(d.kind,'visible-non-threat');assert.equal(d.visible,true);assert.equal(d.combatThreat,false);assert.equal(d.reason,'flee');

  state(w,'rage');w.target.combatant=false;d=D(w.target);
  assert.equal(d.kind,'visible-non-threat');assert.equal(d.reason,'declared-non-threat','future civilians need no fake soldier reaction state');
  delete w.target.combatant;state(w,'advance');
  assert.ok(w.target.weapon,'reconstituted/ordinary armed soldier has a weapon');
  assert.equal(D(w.target).combatThreat,true);

  w.target.dead=true;d=D(w.target);
  assert.equal(d.kind,'inactive');assert.equal(d.visible,false);assert.equal(d.combatThreat,false);
});
test('visible non-threats still have physical LOS but are excluded from target acquisition and tracking',()=>{
  const w=world();
  assert.equal(w.S.hasLineOfSight(w.shooter,w.target,w.b.heightAt,w.b.obstacles),true);
  state(w,'freeze');
  const d=w.S.threatDisposition(w.target);
  assert.equal(d.visible,true,'the dazed man is not made invisible');
  assert.equal(w.S.findTarget(w.shooter,[w.target],w.b.heightAt,w.b.obstacles,w.b),null);

  state(w,'rage');
  assert.strictEqual(w.S.findTarget(w.shooter,[w.target],w.b.heightAt,w.b.obstacles,w.b),w.target);
  w.shooter.target=w.target;
  state(w,'flee');
  w.S.perceive(w.shooter,w.b);
  assert.equal(w.shooter.target,null,'an already-tracked fled man is dropped through the same contract');
});
test('shared contact drops a known non-threat and does not relay him as a squad threat',()=>{
  const w=world();
  w.shooter.target=w.target;
  assert.ok(w.S.shareContact(w.shooter,w.b));
  assert.strictEqual(w.us.contact.unit,w.target);
  state(w,'freeze');
  assert.equal(w.S.squadContact(w.us,w.b),null);
  assert.equal(w.us.contact,null);

  const mate=H.addSquad(w.r,w.b,{id:'us-1',faction:'us',x:8,z:0,objective:{x:0,z:100},composition:['rifleman']});
  w.us.contact={unit:w.target,x:0,z:40,at:w.b.time,seenBy:w.shooter.id,stance:'stand'};
  w.S.squadSenses(mate,w.b);
  assert.equal(mate.contact,null,'a neighboring squad does not relay a visible non-threat');
});
test('aimed fire and area suppression independently re-check disposition; rage remains shootable/suppressible',()=>{
  const w=world(),p={x:w.target.root.position.x,z:w.target.root.position.z};
  state(w,'freeze');
  const before=w.b.events.fired;
  w.shooter.target=w.target;w.shooter.fireCooldown=0;
  assert.equal(w.S.tryFire(w.shooter,w.b),false);
  assert.equal(w.shooter.target,null);
  assert.equal(w.b.events.fired,before,'no aimed round starts at the dazed man');

  w.shooter.fireCooldown=0;w.target.suppressedUntil=0;
  assert.equal(w.S.areaFire(w.shooter,p,w.b),0,'position fire does not pin the known non-threat');
  assert.equal(w.target.suppressedUntil,0);

  state(w,'rage');w.shooter.fireCooldown=0;w.target.suppressedUntil=0;
  assert.equal(w.S.areaFire(w.shooter,p,w.b),1,'rage is still a suppression target');
  assert.ok(w.target.suppressedUntil>w.b.time);

  w.shooter.target=w.target;w.shooter.fireCooldown=0;
  const fired=w.b.events.fired;
  assert.equal(w.S.tryFire(w.shooter,w.b),true,'rage remains an aimed-fire target');
  assert.ok(w.b.events.fired>fired);
});
test('fire-control preparation and tactical routing consume the same classification',()=>{
  const w=world(),e=w.E.stateOf(w.shooter);
  w.shooter.target=w.target;e.lastSeen={x:0,z:40};e.lastSeenAt=w.b.time;
  state(w,'freeze');
  let o=w.E.fireControlObservation(w.shooter,w.b);
  assert.equal(o.targetId,null);
  assert.equal(w.T.knownThreat(w.shooter,w.b),null,'a known dazed man is not resurrected from last-seen memory');

  state(w,'rage');
  o=w.E.fireControlObservation(w.shooter,w.b);
  assert.equal(o.targetId,String(w.target.id));
  w.S.rememberSeen(w.shooter,w.target,w.b,true,'threat-disposition-test');
  assert.deepEqual(w.T.knownThreat(w.shooter,w.b),{x:0,z:40});

  w.shooter.target=null;
  state(w,'flee');
  w.us.contact={unit:w.target,x:0,z:40,at:w.b.time,seenBy:999,stance:'stand'};
  assert.deepEqual(
    w.T.knownThreat(w.shooter,w.b),
    {x:0,z:40},
    'another man’s aggregate non-threat report does not erase this soldier’s own stale threat memory'
  );
  w.S.observeKnownNonThreats(w.shooter,w.b);
  assert.equal(
    w.T.knownThreat(w.shooter,w.b),
    null,
    'once he personally sees the fled man as a non-threat, tactical routing drops the stale threat'
  );
});
test('the disposition API itself is observational and consumes no combat RNG',()=>{
  const w=world();let draws=0;const real=w.b.random;w.b.random=()=>{draws++;return real.call(w.b);};
  for(const st of ['advance','freeze','flee','rage','cower']){state(w,st);for(let i=0;i<20;i++)w.S.threatDisposition(w.target);}
  assert.equal(draws,0);
});
console.log('threat-disposition-check: '+n+' passed');
