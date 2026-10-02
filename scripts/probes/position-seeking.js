/* Observe-only position-seeking episode probe.
   Loop Watch remains the authority for deciding that a soldier is position-seeking. This probe
   freezes the preceding movement/formation context so a destination cycle can be assigned to the
   correct ownership layer without changing the battle. */
(function(root){
'use strict';
var KEEP=14,MAX=24,histories,seen,episodes;
function p(v){return v&&isFinite(+v.x)&&isFinite(+v.z)?{x:+v.x,z:+v.z}:null;}
function key(s){return String(s&&s.faction||'?')+':'+String(s&&s.squad&&s.squad.id||'?')+':'+String(s&&s.id);}
function ids(a){return (a||[]).filter(function(x){return x&&!x.dead;}).map(function(x){return x.id;}).sort(function(a,b){return(+a||0)-(+b||0);});}
function snap(sim,s){
  var sq=s.squad||{},mr=s._movementResolver||{},last=mr.last||{},fo=sq._fireteamOrders&&s._fireteamKey&&sq._fireteamOrders[s._fireteamKey],
      fl=sq._forwardLine,tl=fl&&fl.teams&&s._fireteamKey&&fl.teams[s._fireteamKey],
      team=(sq.members||[]).filter(function(m){return m&&!m.dead&&m._fireteamKey===s._fireteamKey;});
  return {
    t:+(+sim.time||0).toFixed(2),soldier:s.id,squad:sq.id||null,phase:sq.commandPhase||null,squadState:sq.state||null,
    inContact:!!sq.inContact,eng:s.eng&&s.eng.state||s.state||null,slotIndex:s.slotIndex,fireteamKey:s._fireteamKey||null,
    pos:p(s.root&&s.root.position),destination:p(s.destination),fireteamDestination:p(s._fireteamDestination),
    orderDestination:p(s.orderDestination),publishKey:s._fireteamPublishKey||null,
    orderAnchor:p(sq.orderAnchor),rally:p(sq.rally),objective:p(sq.objective),targetObjective:sq.targetObjective||null,
    orderVersion:+sq._orderVersion||0,formation:sq.formation||null,formationForward:p(sq._formationForward),
    forwardLine:fl?{point:p(fl.point),axis:p(fl.axis),t:+fl.t||0,team:tl?{point:p(tl.point),at:+tl.at||0}:null}:null,
    fireteamOrder:fo?{anchor:p(fo.anchor),origin:p(fo.origin),forward:p(fo.forward),signature:fo.signature||null,until:+fo.until||0,blocked:!!fo.blocked}:null,
    roster:ids(sq.members),team:ids(team),
    resolver:{owner:last.owner||null,kind:last.kind||null,reason:last.reason||null,tacticalReason:last.tacticalReason||null,
      goal:mr.goal?{owner:mr.goal.owner||null,kind:mr.goal.kind||null,reason:mr.goal.reason||null,point:p(mr.goal.point),intent:p(mr.goal.intentPoint)}:null,
      order:mr.order?{owner:mr.order.owner||null,kind:mr.order.kind||null,reason:mr.order.reason||null,point:p(mr.order.point),intent:p(mr.order.intentPoint),signature:mr.order.signature||null}:null,
      combat:mr.combat?{owner:mr.combat.owner||null,kind:mr.combat.kind||null,reason:mr.combat.reason||null,point:p(mr.combat.point),intent:p(mr.combat.intentPoint),until:+mr.combat.until||0}:null}
  };
}
function trim(a,t){while(a.length&&t-a[0].t>KEEP)a.shift();}
function getSoldier(sim,a){
  var sides=['us','ge'];
  for(var f=0;f<sides.length;f++){var qs=sim.factions&&sim.factions[sides[f]]&&sim.factions[sides[f]].squads||[];
    for(var i=0;i<qs.length;i++){var m=qs[i].members||[];for(var j=0;j<m.length;j++)if(String(m[j].id)===String(a.soldierId)&&String(qs[i].id)===String(a.squadId))return m[j];}}
  return null;
}
function changes(rows,field,fmt){
  var out=[],prev;
  for(var i=0;i<rows.length;i++){var v=fmt?fmt(rows[i][field]):rows[i][field],j=JSON.stringify(v);if(i&&!prev===false&&j===prev)continue;if(i&&j!==prev)out.push({t:rows[i].t,value:v});prev=j;}
  return out;
}
function summarize(rows){
  function seq(fn){var out=[],prev;for(var i=0;i<rows.length;i++){var v=fn(rows[i]),j=JSON.stringify(v);if(!i||j!==prev)out.push({t:rows[i].t,value:v});prev=j;}return out;}
  return {
    phases:seq(function(x){return x.phase;}),engagement:seq(function(x){return x.eng;}),fireteamKeys:seq(function(x){return x.fireteamKey;}),
    slots:seq(function(x){return x.slotIndex;}),rosters:seq(function(x){return x.roster;}),teams:seq(function(x){return x.team;}),
    destinations:seq(function(x){return x.destination;}),formationDestinations:seq(function(x){return x.fireteamDestination;}),
    fireteamAnchors:seq(function(x){return x.fireteamOrder&&x.fireteamOrder.anchor;}),fireteamSignatures:seq(function(x){return x.fireteamOrder&&x.fireteamOrder.signature;}),
    orderAnchors:seq(function(x){return x.orderAnchor;}),orderVersions:seq(function(x){return x.orderVersion;}),
    objectives:seq(function(x){return {target:x.targetObjective,point:x.objective};}),
    resolverKinds:seq(function(x){return x.resolver&&{owner:x.resolver.owner,kind:x.resolver.kind,reason:x.resolver.reason};})
  };
}
function capture(sim,a){
  var s=getSoldier(sim,a);if(!s)return;
  var rows=(histories.get(key(s))||[]).filter(function(x){return x.t>=a.at-12.5&&x.t<=a.at+.3;});
  episodes.push({alert:JSON.parse(JSON.stringify(a)),summary:summarize(rows),timeline:rows});
  if(episodes.length>MAX)episodes.shift();
}
function ingest(sim){
  var alerts=sim._aiLoopWatch&&sim._aiLoopWatch.alerts||[];
  for(var i=0;i<alerts.length;i++){var a=alerts[i];if(a.kind!=='position-seeking')continue;var k=a.key+'|'+a.at;if(seen[k])continue;seen[k]=1;capture(sim,a);}
}
(root.BattleProbes=root.BattleProbes||{})['position-seeking']={
  every:.3,
  start:function(sim){histories=new Map();seen=Object.create(null);episodes=[];ingest(sim);},
  sample:function(sim){
    var all=root.BattleModules.unitsFor(sim),t=+sim.time||0;
    for(var i=0;i<all.length;i++){var s=all[i];if(!s||s.dead||!s.root||!s.squad)continue;var k=key(s),h=histories.get(k);if(!h)histories.set(k,h=[]);h.push(snap(sim,s));trim(h,t);}
    ingest(sim);
  },
  report:function(sim){ingest(sim);return{captured:episodes.length,episodes:episodes};}
};
})(window);
