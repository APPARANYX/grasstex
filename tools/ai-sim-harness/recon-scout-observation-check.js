'use strict';
/* Recon scout contract: normal hostile contact remains firsthand; only stationary,
   deliberately tasked scouts detect farther; Micro controls safe observing stance;
   delivery is through real callouts, never shared magic. */
const assert = require('node:assert/strict');
const H = require('./harness');

function world(flags = '', geometry = () => 0) {
  H.resetIds();
  const root=H.bootstrap({
    search:'?soldierBeliefs=1&callouts=1&localPlan=0&effectiveFire=0&stressAct=0'+flags
  });
  const battle=H.makeBattle(root,{heightAt:geometry,seed:4444});
  const sq=H.addSquad(root,battle,{
    id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:300},facing:0
  });
  const enemySq=H.addSquad(root,battle,{
    id:'ge-0',faction:'ge',x:0,z:270,objective:{x:0,z:0},facing:Math.PI
  });
  const scout=sq.members.find(x=>x.role==='scout'),
    rifleman=sq.members.find(x=>x.role==='rifleman'),
    enemy=enemySq.members.find(x=>x.role==='rifleman');
  for(const s of sq.members) {
    s.root.position.x=(s.id===scout.id)?0:30+s.id*2;
    s.root.position.z=0;
    s.root.position.y=geometry(s.root.position.x,0);
    s.root.rotation.y=0;
  }
  enemy.root.position.x=0;
  enemy.root.position.z=188;
  enemy.root.position.y=geometry(0,188);
  enemy.root.rotation.y=Math.PI;
  enemy.prone=false;
  enemy.moving=false;
  sq._macroMission={version:1,status:'executing'};
  sq._reconTask={scoutIds:[scout.id],missionVersion:1,startedAt:0};
  scout.moving=false;
  scout.moveSpeed=0;
  return {root,battle,sq,scout,rifleman,enemy};
}
{
  const w=world('&reconScoutObserve=1'), A=w.root.SquadAI;
  assert.equal(A.PERCEPTION.RECON_SCOUT_SIGHT_MULT,1.2);
  assert.equal(A.reconScoutAssigned(w.scout,w.battle),true);
  assert.equal(A.findTarget(w.scout,[w.enemy],w.battle.heightAt,w.battle.obstacles,w.battle),
    w.enemy,'stationary real recon scout observes standing man at 188m (>175 normal)');
  w.scout.moving=true;
  assert.equal(A.findTarget(w.scout,[w.enemy],w.battle.heightAt,w.battle.obstacles,w.battle),
    null,'moving scout does NOT receive bonus');
  w.scout.moving=false;
  assert.equal(A.findTarget(w.rifleman,[w.enemy],w.battle.heightAt,w.battle.obstacles,w.battle),
    null,'non-scout in same squad does not gain range');
  A.perceive(w.scout,w.battle);
  assert.ok(w.scout._reconObservation,'first actual sight starts bounded observation');
  assert.equal(String(w.scout._reconObservation.targetId),String(w.enemy.id));
  assert.equal(A.soldierContact(w.scout,w.battle).source,'seen',
    'contact derives from genuine native Perception');
  w.sq._reconTask=null; // Meso promptly releases recon on contact.
  assert.equal(A.reconScoutObserving(w.scout,w.battle),true,
    'Micro has time-limited personal observation after Meso ends recon');
  assert.equal(w.scout._reconObservation.until,3);
  assert.equal(A.reconScoutAssigned(w.scout,w.battle),false);
  // Deterministic delivery: compare squadmate's own belief to scout firsthand.
  let told=false;
  for(let step=1;step<35;step++) {
    w.battle.time=step*0.15;
    A.perceive(w.rifleman,w.battle);
    const c=A.soldierContact(w.rifleman,w.battle);
    if(c?.source==='told' && String(c.sourceSoldierId||c.relayedFrom)===String(w.scout.id)) {
      told=true;break;
    }
  }
  assert.equal(told,true,'squadmate learns contact by real delayed same-squad callout');
  w.battle.time=9;
  assert.equal(A.reconScoutObserving(w.scout,w.battle),false,'observation cannot last forever');
}
{
  const w=world(''),A=w.root.SquadAI;
  assert.equal(A.reconScoutAssigned(w.scout,w.battle),false,'default off');
  assert.equal(A.findTarget(w.scout,[w.enemy],w.battle.heightAt,w.battle.obstacles,w.battle),
    null,'default cold detection still limited to 175m');
  A.perceive(w.scout,w.battle);
  assert.equal(w.scout._reconObservation,undefined,'no implicit scout stance task');
}
{
  /* A low ridge blocks prone and crouch sight but not standing sight.
     The scout MUST keep the actual visual line rather than blindly go prone. */
  const ridge=(x,z)=>1.35*Math.exp(-Math.pow((z-60)/1.4,2));
  const w=world('&reconScoutObserve=1',ridge), A=w.root.SquadAI,E=w.root.BattleEngagement;
  w.enemy.root.position.z=120;
  const pt=w.scout.root.position;
  const look=(stance)=>A.hasLineOfSight({
    root:{position:pt},prone:stance==='prone',crouching:stance==='crouch'
  },w.enemy,w.battle.heightAt,w.battle.obstacles);
  assert.equal(look('prone'),false,'ridge obstructs prone head');
  assert.equal(look('stand'),true,'standing can really see over ridge');
  A.perceive(w.scout,w.battle);
  assert.equal(w.scout.target,w.enemy,'direct target exists through real standing LOS');
  E.updateSoldier(w.scout,w.battle);
  assert.equal(w.scout.prone,false,'Engagement must not blind observer');
  assert.equal(w.scout.tacticalCrouch,false,'Engagement preserves valid standing eye height');
  assert.equal(w.scout._movementResolver?.last?.owner==='engagement'||!!E.stateOf(w.scout),
    true,'native Engagement retains posture owner');
  const e=E.stateOf(w.scout);
  assert.equal(e.stance,'stand');
  assert.equal(e.stanceTrail?.at(-1)?.reason,'recon:observe-with-sight');
  // At a flat location, lowest valid stance is prone.
  const flat=world('&reconScoutObserve=1'), B=flat.root.SquadAI,BE=flat.root.BattleEngagement;
  flat.enemy.root.position.z=120;
  B.perceive(flat.scout,flat.battle);
  BE.updateSoldier(flat.scout,flat.battle);
  assert.equal(flat.scout.prone,true,'unobstructed recon scout may lower to prone');
  assert.equal(flat.battle.events.fired,0,'quiet observation is not an invented shot');
}
{
  const w=world('&reconScoutObserve=1'),A=w.root.SquadAI;
  w.scout.suppressedUntil=1;
  A.perceive(w.scout,w.battle);
  assert.ok(w.scout._reconObservation);
  w.root.BattleEngagement.updateSoldier(w.scout,w.battle);
  assert.notEqual(w.root.BattleEngagement.stateOf(w.scout).stanceTrail?.at(-1)?.reason,
    'recon:observe-with-sight','under-fire reaction takes precedence');
  w.battle.time=0.4;w.sq.state='retreat';
  A.perceive(w.scout,w.battle);
  assert.equal(w.scout._reconObservation,null,'retreat clears recon observation');
}
console.log('recon-scout-observation-check: PASS scoped +20% deliberate observation, no moving bonus, native callout provenance, crest-aware Micro stance, suppression and retreat precedence, default off');
