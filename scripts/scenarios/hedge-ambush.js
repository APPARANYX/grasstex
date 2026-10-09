/* Intentionally state-writing INITIAL CONDITIONS for a full shipping browser battle.
 * Applied identically to causal-observed and observer-free controls before the first step.
 * Never install this as a read-only probe or shipping game module. */
(function(root) {
 'use strict';
 root.BattleProbeScenario = function(sim) {
  var center={x:-865,z:0}, F=root.BattleObstacleField;
  var terrain=sim.heightAt(center.x,center.z);
  var hedge={
   id:'fixture-hedge-420',physicalId:'fixture-hedge-420',type:'hedge',
   shape:'obb',x:center.x,z:center.z,y:terrain,height:4.5,
   hx:12,hz:1,ux:1,uz:0,vx:0,vz:1,radius:12.1,cover:.62
  };
  var obstacles=sim.obstacles.slice();
  obstacles.push(hedge);
  obstacles.__physicalFootprints=(sim.obstacles.__physicalFootprints||[]).concat([hedge]);
  obstacles.__physicalVersion=(sim.obstacles.__physicalVersion||0)+1;
  sim.obstacles=obstacles;
  if(F&&F.rebuild) F.rebuild(obstacles);
  var us=sim.factions.us.squads[0],ge=sim.factions.ge.squads[0];
  function arrange(q,baseZ) {
   q.home={x:center.x,z:baseZ};
   q.orderAnchor={x:center.x,z:baseZ};
   q.rally={x:center.x,z:baseZ};
   q.objective={x:center.x,z:-baseZ};
   for(var i=0;i<q.members.length;i++){
     var s=q.members[i],
       x=center.x+((i%3)-1)*3.6,
       z=baseZ+Math.floor(i/3)*3.2*(baseZ<0?-1:1);
     s.root.position.set(x,sim.heightAt(x,z),z);
     s.root.rotation.y=baseZ<0?0:Math.PI;
     s.destination=null;
     s.orderDestination=null;
   }
  }
  arrange(us,-8);
  arrange(ge,29);
  var defender=us.members[0],shooter=ge.members[0];
  /* First defender occupies the true blind middle of the hedge. */
  defender.root.position.set(center.x,sim.heightAt(center.x,-2.3),-2.3);
  shooter.root.position.set(center.x,sim.heightAt(center.x,29),29);
  us.commandPhase='defend'; us.state='defend'; us.inContact=true;
  ge.commandPhase='defend'; ge.state='defend'; ge.inContact=true;
  defender.target=shooter;
  shooter.target=defender;
  var initiallyBlocked=!root.SquadAI.hasLineOfSight(
      defender,shooter,sim.heightAt,sim.obstacles);
  if(!initiallyBlocked) throw Error('Fixture error: hedge does not obscure defender');
  root.BattleEngagement.decide(defender,sim,'fixture: blind hedge engagement');
  var eng=root.BattleEngagement.stateOf(defender);
  return {
   kind:'intentional-shipping-battle-hedge-initial-conditions',
   actor:String(defender.id),threat:String(shooter.id),
   actorFaction:defender.faction,
   blockedAtStart:initiallyBlocked,
   normalCoverAvailable:null,
   immediateEngagement:eng.state,
   selectedType:eng.cover&&eng.cover.type||null,
   selectedPosition:eng.cover?{x:eng.cover.x,z:eng.cover.z}:null,
   hedge:{x:center.x,z:center.z,hx:hedge.hx,hz:hedge.hz,height:hedge.height}
  };
 };
})(window);
