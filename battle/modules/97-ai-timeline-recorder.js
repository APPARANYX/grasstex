/* Compact AI battle timeline recorder.
   Observe-only: reads live state once per simulation step, stores one compact sample per simulated
   second, and records semantic state changes at their exact sim.time. It draws no RNG and writes no
   gameplay state. Movement stall detection intentionally matches scripts/probes/move-stalls.js. */
(function(root){
'use strict';

var SAMPLE_SECONDS=1;
var COMBAT={orient:1,bound:1,engage:1,pinned:1,assault:1,station:1,withdraw:1,suppress:1,cower:1,flee:1,freeze:1,rage:1};
var ADVANCE={approach:1,assault:1,capture:1,'clear-town':1,flank:1};
var store=new WeakMap();

function rounded(v,n){v=+v;return isFinite(v)?+v.toFixed(n==null?1:n):null;}
function bump(o,k,n){k=String(k||'unknown');o[k]=(o[k]||0)+(n==null?1:n);}
function units(sim){try{return root.BattleModules.unitsFor(sim)||[];}catch(_){return[];}}
function engState(s){
  try{var e=root.BattleEngagement&&root.BattleEngagement.stateOf?root.BattleEngagement.stateOf(s):s&&s.eng;return e&&e.state||s&&s.eng&&s.eng.state||'unknown';}
  catch(_){return s&&s.eng&&s.eng.state||'unknown';}
}
function objectiveStatus(sim,id){
  try{return root.BattleObjectiveSystem&&root.BattleObjectiveSystem.status?root.BattleObjectiveSystem.status(sim,id)||{}:{};}catch(_){return{};}
}
function battleSeed(sim){
  var m=sim&&sim.scene&&sim.scene.metadata,sc=m&&(m.battleScenario||m.battleTown);
  return sc&&sc.seed||sim&&sim.seed||null;
}
function fresh(sim){
  return {
    sim:sim,nextSample:0,samples:[],markers:[],stall:new Map(),
    prevPhase:new Map(),prevBrief:new Map(),prevRetreat:new Map(),prevOwner:new Map(),
    firstContact:{us:false,ge:false},prevAlive:{us:null,ge:null},wakeCount:0,mergeEnded:0
  };
}
function get(sim){var s=store.get(sim);if(!s){s=fresh(sim);store.set(sim,s);}return s;}
function reset(sim){if(sim)store.set(sim,fresh(sim));}
function marker(st,t,kind,data){
  var m={t:rounded(t,2),kind:kind};
  if(data)Object.keys(data).forEach(function(k){if(data[k]!==undefined)m[k]=data[k];});
  st.markers.push(m);
}
function sideSquads(sim,f){return sim&&sim.factions&&sim.factions[f]&&sim.factions[f].squads||[];}
function briefSig(q){
  var m=q&&q._macroMission;
  if(!m)return 'none';
  return [m.status||'none',m.intent||'',m.action||'',m.objectiveId||'',m.point&&rounded(m.point.x,1),m.point&&rounded(m.point.z,1)].join('|');
}
function updateStalls(sim,st){
  var now=+sim.time||0,seen=new Set();
  units(sim).forEach(function(s){
    if(!s||s.dead)return;
    var id=String(s.faction||'?')+':'+String(s.id),phase=s.squad&&s.squad.commandPhase||'',es=engState(s);
    var qualifies=!!(s.root&&s.destination&&!s.target&&ADVANCE[phase]&&!COMBAT[es]);
    if(!qualifies){st.stall.delete(id);return;}
    var p=s.root.position,d=Math.hypot((+p.x||0)-(+s.destination.x||0),(+p.z||0)-(+s.destination.z||0));
    if(d<8){st.stall.delete(id);return;}
    seen.add(id);
    var prior=st.stall.get(id);
    if(!prior){st.stall.set(id,{x:+p.x||0,z:+p.z||0,at:now,stalled:false});return;}
    if(Math.hypot((+p.x||0)-prior.x,(+p.z||0)-prior.z)>=1.5){
      prior.x=+p.x||0;prior.z=+p.z||0;prior.at=now;prior.stalled=false;
    }else prior.stalled=(now-prior.at>=12&&(+s.moveSpeed||0)<0.35);
  });
  Array.from(st.stall.keys()).forEach(function(id){if(!seen.has(id))st.stall.delete(id);});
}
function scanMarkers(sim,st){
  var now=+sim.time||0;
  ['us','ge'].forEach(function(f){
    var contact=false;
    sideSquads(sim,f).forEach(function(q){
      if(!q)return;
      var key=f+':'+q.id,phase=q.commandPhase||'none',prior=st.prevPhase.get(key);
      if(prior!=null&&prior!==phase)marker(st,now,'phase-change',{side:f,squad:q.id,from:prior,to:phase});
      st.prevPhase.set(key,phase);
      var bs=briefSig(q),bp=st.prevBrief.get(key);
      if(bp!=null&&bp!==bs){
        var m=q._macroMission||{};
        marker(st,now,'brief-change',{side:f,squad:q.id,status:m.status||null,intent:m.intent||null,action:m.action||null,objective:m.objectiveId||null});
      }
      st.prevBrief.set(key,bs);
      var retreat=(q.state==='retreat'||phase==='retreat'),rp=st.prevRetreat.get(key);
      if(rp===false&&retreat)marker(st,now,'retreat',{side:f,squad:q.id});
      st.prevRetreat.set(key,retreat);
      if(q.inContact)contact=true;
    });
    if(contact&&!st.firstContact[f]){st.firstContact[f]=true;marker(st,now,'first-contact',{side:f});}
    var alive=sim.factions&&sim.factions[f]?+sim.factions[f].alive||0:0,pa=st.prevAlive[f];
    if(pa!=null&&pa>0&&alive===0)marker(st,now,'wipeout',{side:f});
    st.prevAlive[f]=alive;
  });

  (sim._objectives||[]).forEach(function(o){
    var os=objectiveStatus(sim,o.id),owner=os.owner||'neutral',prior=st.prevOwner.get(o.id);
    if(prior!=null&&prior!==owner){
      if(owner==='us'||owner==='ge')marker(st,now,'capture',{side:owner,objective:o.id,from:prior});
      else marker(st,now,'neutralized',{objective:o.id,from:prior});
    }
    st.prevOwner.set(o.id,owner);
  });

  var ms=sim._macroMissionState;
  if(ms){
    var count=+ms.wakeCount||0;
    if(count>st.wakeCount&&Array.isArray(ms.recentWakes)){
      var n=Math.min(ms.recentWakes.length,count-st.wakeCount);
      ms.recentWakes.slice(-n).forEach(function(w){
        if(w&&w.reason==='strategic-stall')marker(st,w.time!=null?w.time:now,'strategic-stall-wake',{side:w.faction||null,squad:w.squad||null,objective:w.target||null});
      });
    }
    st.wakeCount=count;
    var r=ms.reconstitution;
    if(r&&Array.isArray(r.ended)&&r.ended.length>st.mergeEnded){
      r.ended.slice(st.mergeEnded).forEach(function(g){
        if(g&&g.status==='merged')marker(st,g.endedAt!=null?g.endedAt:now,'merge',{side:g.faction||null,size:g.size||null,objective:g.objectiveId||null});
      });
      st.mergeEnded=r.ended.length;
    }
  }
}
function objectiveCounts(sim){
  var held={us:0,ge:0},contested=0;
  (sim._objectives||[]).forEach(function(o){
    var x=objectiveStatus(sim,o.id),owner=x.owner||'neutral';
    if(owner==='us'||owner==='ge')held[owner]++;
    if((+x.us||0)>0&&(+x.ge||0)>0)contested++;
  });
  return{held:held,contested:contested};
}
function sampleSide(sim,st,f){
  var out={alive:0,kills:0,held:0,contested:0,advancing:0,contact:0,pinned:0,stalled:0,phases:{},briefs:{},engagement:{},movementIntents:{}};
  var fac=sim.factions&&sim.factions[f]||{};out.alive=+fac.alive||0;out.kills=+fac.kills||0;
  sideSquads(sim,f).forEach(function(q){
    bump(out.phases,q.commandPhase||'none');
    var m=q._macroMission;bump(out.briefs,m&&m.status||'none');
  });
  units(sim).forEach(function(s){
    if(!s||s.dead||String(s.faction)!==f)return;
    var phase=s.squad&&s.squad.commandPhase||'',es=engState(s),id=f+':'+s.id;
    bump(out.engagement,es);
    var last=s._movementResolver&&s._movementResolver.last;bump(out.movementIntents,last&&last.kind||'none');
    if(ADVANCE[phase]&&(s.moving||(+s.moveSpeed||0)>=0.35))out.advancing++;
    if(s.squad&&s.squad.inContact)out.contact++;
    if(es==='pinned')out.pinned++;
    var tr=st.stall.get(id);if(tr&&tr.stalled)out.stalled++;
  });
  return out;
}
function sample(sim,st){
  var oc=objectiveCounts(sim),t=rounded(sim.time,2);
  var us=sampleSide(sim,st,'us'),ge=sampleSide(sim,st,'ge');
  us.held=oc.held.us;ge.held=oc.held.ge;us.contested=ge.contested=oc.contested;
  st.samples.push({t:t,us:us,ge:ge});
}
function tick(sim){
  if(!sim)return;
  var st=get(sim),now=+sim.time||0;
  updateStalls(sim,st);scanMarkers(sim,st);
  if(now+1e-9>=st.nextSample){
    sample(sim,st);
    st.nextSample=Math.floor(now/SAMPLE_SECONDS+1)*SAMPLE_SECONDS;
  }
}
function snapshot(sim){
  var st=get(sim),last=st.samples[st.samples.length-1];
  if(!last||Math.abs((+last.t||0)-(+sim.time||0))>.51)sample(sim,st);
  return{
    format:'grasstex-ai-timeline-v1',sampleSeconds:SAMPLE_SECONDS,
    build:root.BATTLE_BUILD||root.BATTLE_BUILD_DEPLOYED||'dev',ref:root.BATTLE_REF||null,
    seed:battleSeed(sim),battleTime:rounded(sim&&sim.time,2),winner:sim&&sim.winner||null,
    samples:st.samples.slice(),markers:st.markers.slice()
  };
}
root.BattleAITimeline={version:'1.0',sampleSeconds:SAMPLE_SECONDS,snapshot:snapshot,reset:reset};
root.BattleModules.registerSystem('ai-timeline-recorder',{
  version:'1.0',onBattleStart:reset,onBattleRestart:reset,onSimulationStep:tick
});
console.log('[DIAG] AI timeline recorder active: 1 s samples + exact state-change markers');
})(typeof window!=='undefined'?window:globalThis);
