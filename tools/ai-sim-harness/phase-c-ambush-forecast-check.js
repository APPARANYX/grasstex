'use strict';
/* A predictive ambush is ONLY post geometry; it never becomes a sighting,
   firing origin, suppressive target, or covered-route permission.
   Deterministic positive and negative evidence tests. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');

function world(flags = '', opts = {}) {
  H.resetIds();
  const r = H.bootstrap({
    search:
      '?effectiveFire=0&localPlan=1&coa=0&commandMovement=0&slStress=0&scoutsForward=0&stressAct=0' +
      '&localAmbush=1&localManeuver=1&coveredBounds=1&fireManeuverOperation=1' + flags
  });
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/movement-resolver.js');
  load('battle/battle-navigation.js');
  load('battle/modules/39-navigation-physicality-debug.js');
  const b = H.makeBattle(r, { heightAt: () => 0 });
  const scenario = { buildings: [], roads: [] };
  b.scene = { metadata: { battleScenario: scenario } };
  r.BattleNavigation.installScenario(scenario);
  const sq = H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:100}});
  sq.members.forEach((s, i) => {
    s.root.position.x = (i - 5) * 2;
    s.root.position.z = 0.5;
    s.root.position.y = b.heightAt(s.root.position.x, 0.5);
  });
  r.BattleCommanderAI={acceptMission(sim, squad){squad._macroMission.status='executing';}};
  sq._macroMission={
    version:1,status:'issued',intent:'capture',action:'assault',
    point:{x:0,z:100},route:[{x:0,z:0},{x:0,z:80}]
  };
  const S=r.BattleSquadStability;
  S.executeMission(b,sq,null);
  sq.commandPhase='assault';
  S.localPlan.update(b,sq); // Native local-task pressure inputs, as in preparation fixture.
  const scout=sq.members.find(s=>s.role==='scout');
  assert.ok(scout,'fixture has a native living scout');
  const other=sq.members.find(s=>s.role!=='scout');
  let report={x:0,z:80,at:0,confidence:1,targetId:'moving-1',
    sector:'0:4',source:'seen',sourceSoldier:scout.id};
  r.SquadAI.squadContactsMap=()=>[report];
  const C=r.BattleCoverPositions;
  const aims=[], preflight=[];
  C.maskedPost=()=>true;
  C.maskedApproach=()=>true;
  C.candidates=(_s,_b,target)=>{ aims.push({...target.root.position});return []; };
  r.SquadAI.canSuppressStanding=(_s,p)=>{
    preflight.push({x:p.x,z:p.z});
    return opts.onlyObserved ? Math.abs(p.x-report.x)<0.1 : true;
  };
  const P=S.tacticalPostures;
  function advance(x, at, overrides={}) {
    b.time=at;
    report={...report,x,at,...overrides};
    sq.inContact=true; // No posture yet, but scout evidence still accumulates.
    const prior=P.update(b,sq);
    assert.equal(prior,null,'while in contact no NEW ambush may be published');
  }
  function select(x,at,overrides={}) {
    b.time=at;
    report={...report,x,at,...overrides};
    sq.inContact=false;
    return P.update(b,sq);
  }
  return {r,b,sq,S,P,scout,other,aims,preflight,advance,select,get report(){return report;}};
}
function track(w,base=0,z=80,custom={}) {
  const source=custom.source||'seen',
    sourceSoldier=custom.sourceSoldier==null?w.scout.id:custom.sourceSoldier;
  for (let i=0;i<3;i++)
    w.advance(base+2.7*i,i*0.9,{z,source,sourceSoldier});
  return w.select(base+8.1,2.7,{z,source,sourceSoldier});
}
{
  const w=world('&predictAmbush=1');
  const st=track(w);
  assert.ok(st && st.mode==='ambush','a normal ambush is selected: '+JSON.stringify({
    inContact:w.sq.inContact,
    pressure:w.sq._localTask?.inputs?.pressure,
    engagement:w.sq._engagementPlan?.status,
    phase:w.sq.commandPhase, mission:w.sq._macroMission?.status,
    orders:st?.orders?.length, deferrals:w.P.approachDeferrals(w.sq),
    aims:w.aims.slice(0,3),preflight:w.preflight.slice(0,3),
    spread:w.sq.members.map(s=>[s.root.position.x,s.root.position.z])
  }));
  assert.ok(st.ambushPrediction,'three consecutive firsthand moving scout reports produce forecast');
  assert.equal(st.ambushPrediction.scoutId,String(w.scout.id));
  assert.equal(st.ambushPrediction.targetId,'moving-1');
  assert.ok(st.ambushPrediction.speed>=2.9 && st.ambushPrediction.speed<=3.1);
  assert.ok(st.ambushPrediction.point.x>w.report.x+8,'the line looks ahead of enemy movement');
  assert.ok(st.ambushPrediction.displacement<=18,'forecast distance is hard capped');
  assert.ok(w.aims.some(p=>p.x>w.report.x+8),'native cover candidate selection gets future watch sector');
  assert.ok(st.orders.length>=3 && st.orders.every(o=>
    Math.abs(o.watchPoint.x-st.ambushPrediction.point.x)<1e-6),
    'all published watches use the forecast planning aim');
  assert.ok(st.threats.every(t=>t.x===w.report.x),'real reports remain unchanged');
  assert.ok(st.observationGeometry.every(p=>p.x===w.report.x),'quiet physical geometry stays historical');
  assert.ok(!w.r.BattleLeases.get(w.sq,'bound'),'no bound from forecast');
  assert.equal(w.b.events.fired,0,'forecast does not authorize shooting');
}
{
  const w=world('');
  const st=track(w);
  assert.ok(st);
  assert.equal(st.ambushPrediction,null,'default-off preserves existing logic');
  assert.ok(st.orders.every(o=>o.watchPoint.x===w.report.x));
}
for(const test of [
  {name:'told',over:{source:'told'}},
  {name:'untrusted rifleman',over:{sourceSoldier:'non-scout'}},
  {name:'stationary',base:0,step:0},
  {name:'far-range',z:240},
  {name:'close-range',z:10}
]) {
  const w=world('&predictAmbush=1');
  const source=test.over?.source||'seen',
    sourceSoldier=test.over?.sourceSoldier||w.scout.id;
  for(let i=0;i<3;i++)w.advance(2.7*i*(test.step??1),i*0.9,{
    z:test.z??80,source,sourceSoldier
  });
  const st=w.select(8.1*(test.step??1),2.7,{
    z:test.z??80,source,sourceSoldier
  });
  assert.ok(st && !st.ambushPrediction,test.name+' has no guessed interception point');
  assert.ok(st.orders.every(o=>o.watchPoint.x===w.report.x),test.name+' uses actual report');
}
{
  const w=world('&predictAmbush=1',{onlyObserved:true});
  const st=track(w);
  assert.ok(st && !st.ambushPrediction,
    'if predicted firing geometry fails, safely fall back to ordinary reported-sector posts');
  assert.ok(st.orders.every(o=>o.watchPoint.x===w.report.x));
  assert.ok(!w.r.BattleLeases.get(w.sq,'bound'));
}
console.log('phase-c-ambush-forecast-check: PASS moving scout lead, safe fallback, default off, stale-proof sources, stationary, distance bounds, no fire/bound promotion');
