'use strict';
// Run against any checkout with GRASSTEX_SOURCE_ROOT to preserve the same negative-control probe.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const repo=process.env.GRASSTEX_SOURCE_ROOT||path.resolve(__dirname,'..');
let failed=0,passed=0;
function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}}
// The real lease primitive from squad-ai.js; the rest of SquadAI is stubbed.
const REAL=require(path.join(repo,'tools/ai-sim-harness/harness')).bootstrap({modules:false}),LEASES=REAL.BattleLeases;
function fixture(){
  const events=[],systems={},r={console:{log(){},warn(){}},Math,JSON,isFinite};r.window=r;
  r.BattleLeases=LEASES;r.BattleSim={start(){}};r.SquadAI={updateSquad(){},extend(stage,id,fn){if(stage==='squadCommand')this.updateSquad=fn;},formationSlot(){return null;},formationFor(){return'wedge';},leaderOf:REAL.SquadAI.leaderOf,isLeader:REAL.SquadAI.isLeader,establishment:REAL.SquadAI.establishment,retreatGoal:REAL.SquadAI.retreatGoal};
  r.BattleTelemetry={record(type,data){events.push({type,data});}};
  r.BattleModules={registerSystem(id,h){systems[id]=h;},unitsFor(sim){return sim._roster.us.concat(sim._roster.ge);},runHook(name,sim,payload){for(const h of Object.values(systems))if(h[name])h[name](sim,payload);}};
  r.BattleObjectiveSystem={get(sim,id){return sim._objectives.find(o=>o.id===id);},status(sim,id){return this.get(sim,id)?.state||{};},tick(){}};
  vm.createContext(r);for(const file of ['battle/commander-doctrine.js','battle/commander-routes.js','battle/commander-ai.js','battle/modules/15-vacant-objective-assault.js','battle/modules/16-squad-plan-stability.js'])vm.runInContext(fs.readFileSync(path.join(repo,file),'utf8'),r,{filename:file});
  let decisions=0,action='assault';
  r.BattleAIPolicy={genomeFor(){return{parameters:r.BattleCommanderDoctrine.FALLBACK,doctrine:r.BattleCommanderDoctrine.FALLBACK_DOCTRINE};},decide(){decisions++;return{id:'probe',action,when:[]};}};
  const soldier={id:'sergeant',role:'sergeant',dead:false,faction:'us',root:{position:{x:0,z:0}}};
  const sq={id:'us-0',faction:'us',state:'advance',commandRole:'center',commandPhase:'assault',targetObjective:'a',objective:{x:100,z:0},rally:{x:0,z:0},home:{x:0,z:0},route:[{x:0,z:0},{x:50,z:0}],routeIndex:1,members:[soldier],aliveCount:1};
  const sim={time:0,factions:{us:{squads:[sq]},ge:{squads:[]}},_roster:{us:[soldier],ge:[]},_objectives:[{id:'a',def:{x:100,z:0,radius:20,value:1},state:{owner:'neutral'}},{id:'b',def:{x:200,z:0,radius:20,value:1},state:{owner:'neutral'}}],objectiveControl:{counts:{us:0,ge:0}},objectiveHold:{us:0,ge:0}};
  const town={center:{x:50,z:0},radius:80};
  function tick(){sim.time+=.45;r.BattleCommanderAI.update(sim,town,.45);} // Squad Leader executes from its own onCommanderTick hook
  return{r,sq,sim,town,events,tick,systems,get decisions(){return decisions;},set action(v){action=v;}};
}
test('genome off and its module absent, a brief is decided by the code-default rules (the Node harness runs them too)',()=>{
  const f=fixture();delete f.r.BattleAIPolicy;f.sq.targetObjective=null;f.sq.routeIndex=0;
  for(let i=0;i<5;i++){const m={id:'r'+i,role:'rifleman',dead:false,faction:'us',root:{position:{x:0,z:0}}};f.sq.members.push(m);f.sim._roster.us.push(m);}
  f.tick();
  const d=f.events.find(e=>e.type==='decision-doctrine');
  assert.ok(d,'a rule decided the brief: with an empty rule list nothing would have');assert.equal(d.data.rule,'press-neutral');assert.equal(d.data.action,'assault');
  assert.deepEqual(d.data.conditions,['objectiveNeutral','notOutnumbered']);
});
test('accepted objective survives local doctrine/contact noise without strategic reevaluation',()=>{
  const f=fixture();f.tick();const point=JSON.stringify(f.sq.objective),decisions=f.decisions;f.action='hold';
  for(let i=0;i<30;i++){f.sq.inContact=!!(i%2);f.tick();}
  assert.equal(f.decisions,decisions,'doctrine ran again during unchanged active mission');assert.equal(JSON.stringify(f.sq.objective),point);
  assert.equal(f.sq._macroMission.status,'executing');
});
test('Squad Leader follows initial route while Macro sleeps, including Macro OFF',()=>{
  const f=fixture();f.sq.targetObjective=null;f.sq.routeIndex=0;f.tick();
  assert.ok(f.sq._macroMission?.objectiveId,'Macro must brief the final objective before route execution');
  const version=f.sq._macroMission.version,decisions=f.decisions;f.sim.macroCommandEnabled=false;
  f.sq.members[0].root.position.x=50;for(let i=0;i<6;i++)f.tick(); // includes the Squad Leader's own corner-check pause
  assert.equal(f.sq._macroMission.version,version);assert.equal(f.decisions,decisions);assert.equal(f.sq.objective.x,100,'Squad Leader did not finish approach route autonomously');
});
test('owned defense is an ongoing mission, not completion every commander tick',()=>{
  const f=fixture();f.sim._objectives[0].state.owner='us';f.sq._preparedDefenseRequest={objectiveId:'a',point:{x:100,z:0}};f.tick();
  const mission=f.sq._macroMission;assert.ok(mission);for(let i=0;i<30;i++)f.tick();assert.strictEqual(f.sq._macroMission,mission);assert.equal(mission.intent,'defend');assert.equal(mission.status,'executing');
});
test('capture completes exactly once and selects a remaining objective',()=>{
  const f=fixture();f.tick();const old=f.sq._macroMission;assert.ok(old);f.sim._objectives[0].state.owner='us';f.tick();
  assert.equal(old.status,'completed');assert.equal(f.sq._macroMission.objectiveId,'b');const next=f.sq._macroMission;f.tick();assert.strictEqual(f.sq._macroMission,next);
});
test('removed objective invalidates the mission without resurrecting its route',()=>{
  const f=fixture();f.tick();const old=f.sq._macroMission;assert.ok(old);f.sim._objectives.shift();f.tick();assert.equal(old.status,'invalid');assert.equal(f.sq._macroMission.objectiveId,'b');assert.equal(f.sq.objective.x,200);
});
test('one stall episode escalates once at 120/180/240/300 seconds and never loops every sample',()=>{
  const f=fixture();f.tick();f.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:121}}};f.sim.time=121;f.tick();
  const stages=()=>f.events.filter(e=>e.type==='decision-strategic-recovery').map(e=>e.data.stage);
  assert.deepEqual(stages(),['reconcile']);
  for(let i=0;i<10;i++)f.tick();assert.deepEqual(stages(),['reconcile'],'120 s stage repeated every commander sample');
  for(const age of [181,241,301]){f.sim._coordinationHealth.sides.us.objectiveStallSeconds=age;f.sim.time=age;f.tick();}
  assert.deepEqual(stages(),['reconcile','release','main-effort','reset']);
  for(let i=0;i<30;i++)f.tick();
  assert.deepEqual(stages(),['reconcile','release','main-effort','reset'],'300 s reset oscillated after completion');
  const st=f.r.BattleCommanderAI.missionState(f.sim).stallRecovery.us;assert.equal(st.completed,4);assert.equal(st.history.length,4);
});
test('the strategic-stall wake reads the stall seconds, never the replanDue flag',()=>{
  const f=fixture();f.tick();
  const wakes=()=>f.events.filter(e=>e.type==='decision-macro-replan'&&e.data.reason==='strategic-stall').length;
  f.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:60,replanDue:true,replanReasons:['objective-stalled']}}};f.sim.time=60;f.tick();
  assert.equal(wakes(),0,'a replan flag at 60 s of stall wakes nobody');
  f.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:121,replanDue:false}}};f.sim.time=121;f.tick();
  assert.equal(wakes(),1,'121 s of stall wakes the General whatever the flag says');
});
test('120 s reconcile leaves a recently progressing capture brief alone',()=>{
  const f=fixture();f.tick();
  f.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:100}}};f.sim.time=99.55;f.tick();
  const mission=f.sq._macroMission;
  f.sq.members[0].root.position.x=10;f.sim._coordinationHealth.sides.us.objectiveStallSeconds=110;f.sim.time=109.55;f.tick();
  f.sim._coordinationHealth.sides.us.objectiveStallSeconds=121;f.sim.time=120.55;f.tick();
  assert.strictEqual(f.sq._macroMission,mission,'progressing squad was unnecessarily replanned');
  assert.equal(f.events.filter(e=>e.type==='decision-macro-replan'&&e.data.reason==='strategic-stall').length,0,'progressing squad emitted a strategic-stall wake');
});
test('120 s reconcile repairs missing Macro projections without replacing a young valid brief',()=>{
  const f=fixture();f.sim.time=100;f.tick();const mission=f.sq._macroMission;
  f.sq.commandRole=null;f.sq.targetObjective=null;
  f.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:121}}};f.sim.time=121;f.tick();
  assert.strictEqual(f.sq._macroMission,mission);assert.equal(f.sq.commandRole,mission.role);assert.equal(f.sq.targetObjective,mission.objectiveId);
  assert.equal(f.events.filter(e=>e.type==='decision-macro-replan'&&e.data.reason==='strategic-stall-reconcile').length,1);
});
test('180 s release breaks stale hold and support assignments instead of refreshing them',()=>{
  const f=fixture();f.action='hold';f.tick();
  f.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:121}}};f.sim.time=121;f.tick();
  assert.equal(f.sq._macroMission.action,'hold');
  f.sim._coordinationHealth.sides.us.objectiveStallSeconds=181;f.sim.time=181;f.tick();
  assert.equal(f.sq._macroMission.action,'assault','stale hold survived the release stage');
  assert.equal(f.sq._macroMission.reason,'strategic-stall-release');

  const g=fixture();g.sq.commandRole='support';g.tick();
  g.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:121}}};g.sim.time=121;g.tick();
  g.sim._coordinationHealth.sides.us.objectiveStallSeconds=181;g.sim.time=181;g.tick();
  assert.equal(g.sq.commandRole,'center','stale support role was not released');assert.equal(g.sq._macroMission.role,'center');
});
test('240 s main effort masses a majority of available offensive squads on one reachable objective',()=>{
  const f=fixture();
  function mate(id,x){const m={id:id+'-s',role:'sergeant',dead:false,faction:'us',root:{position:{x,z:0}}};const q={id,faction:'us',state:'advance',commandRole:'center',commandPhase:'assault',targetObjective:null,objective:{x:100,z:0},rally:{x,z:0},home:{x,z:0},route:[{x,z:0},{x:50,z:0}],routeIndex:1,members:[m],aliveCount:1};m.squad=q;f.sim.factions.us.squads.push(q);f.sim._roster.us.push(m);return q;}
  mate('us-1',-10);mate('us-2',10);f.tick();
  f.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:121}}};f.sim.time=121;f.tick();
  f.sim._coordinationHealth.sides.us.objectiveStallSeconds=181;f.sim.time=181;f.tick();
  f.sim._coordinationHealth.sides.us.objectiveStallSeconds=241;f.sim.time=241;f.tick();
  const rec=f.r.BattleCommanderAI.missionState(f.sim).stallRecovery.us,target=rec.mainEffort;
  assert.ok(target,'no main effort was selected');
  const committed=f.sim.factions.us.squads.filter(q=>q.targetObjective===target&&q._macroMission?.intent==='capture').length;
  assert.ok(committed>=2,'only '+committed+'/3 squads were given the main effort');
  assert.equal(f.events.filter(e=>e.type==='decision-strategic-recovery'&&e.data.stage==='main-effort').length,1);
});
test('300 s reset leaves an owned defender and a recently progressing squad alone, and resets the stalled squad once',()=>{
  const f=fixture();
  function mate(id,x){const m={id:id+'-s',role:'sergeant',dead:false,faction:'us',root:{position:{x,z:0}}};const q={id,faction:'us',state:'advance',commandRole:'center',commandPhase:'assault',targetObjective:null,objective:{x:100,z:0},rally:{x,z:0},home:{x,z:0},route:[{x,z:0},{x:50,z:0}],routeIndex:1,members:[m],aliveCount:1};m.squad=q;f.sim.factions.us.squads.push(q);f.sim._roster.us.push(m);return q;}
  const moving=mate('us-1',0),defender=mate('us-2',0);f.tick();
  f.sim._objectives[0].state.owner='us';defender._preparedDefenseRequest={objectiveId:'a',point:{x:100,z:0}};f.tick();
  assert.equal(defender._macroMission.intent,'defend');
  f.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:121}}};f.sim.time=121;f.tick();
  f.sim._coordinationHealth.sides.us.objectiveStallSeconds=181;f.sim.time=181;f.tick();
  f.sim._coordinationHealth.sides.us.objectiveStallSeconds=241;f.sim.time=241;f.tick();
  const main=f.r.BattleCommanderAI.missionState(f.sim).stallRecovery.us.mainEffort;assert.ok(main);
  const progressSquad=[f.sq,moving].find(q=>q.targetObjective===main)||moving;
  const stalledSquad=progressSquad===f.sq?moving:f.sq;
  progressSquad.members[0].root.position.x+=10;
  f.sim._coordinationHealth.sides.us.objectiveStallSeconds=250;f.sim.time=250;f.tick();
  const beforeProgress=progressSquad._macroMission,beforeDefense=defender._macroMission,beforeStalled=stalledSquad._macroMission;
  f.sim._coordinationHealth.sides.us.objectiveStallSeconds=301;f.sim.time=301;f.tick();
  const resetIds=f.events.filter(e=>e.type==='decision-macro-replan'&&e.data.reason==='strategic-reset').map(e=>e.data.squad);
  assert.ok(resetIds.includes(stalledSquad.id),'stalled squad was not reset');
  assert.ok(!resetIds.includes(progressSquad.id),'recently progressing squad was reset');
  assert.ok(!resetIds.includes(defender.id),'useful defender was reset');
  assert.strictEqual(progressSquad._macroMission,beforeProgress);assert.strictEqual(defender._macroMission,beforeDefense);
  assert.notStrictEqual(stalledSquad._macroMission,beforeStalled);
  const n=resetIds.length;for(let i=0;i<20;i++)f.tick();
  assert.equal(f.events.filter(e=>e.type==='decision-macro-replan'&&e.data.reason==='strategic-reset').length,n,'reset repeated every sample');
});
test('objective progress starts a fresh recovery episode',()=>{
  const f=fixture();f.tick();f.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:241}}};f.sim.time=241;f.tick();
  assert.equal(f.r.BattleCommanderAI.missionState(f.sim).stallRecovery.us.completed,3);
  f.sim._coordinationHealth={lastObjectiveProgressAt:250,sides:{us:{objectiveStallSeconds:10}}};f.sim.time=260;f.tick();
  const r=f.r.BattleCommanderAI.missionState(f.sim).stallRecovery.us;assert.equal(r.completed,0);assert.equal(r.episode,'250');
  f.sim._coordinationHealth.sides.us.objectiveStallSeconds=121;f.sim.time=371;f.tick();
  assert.equal(f.events.filter(e=>e.type==='decision-strategic-recovery'&&e.data.stage==='reconcile').length,2,'new stall episode did not get a new first-stage wake');
});
test('reserve commitment is one strategic event and does not revive reserve status',()=>{
  const f=fixture();f.sq.commandRole='reserve';f.sq.targetObjective=null;f.tick();assert.equal(f.sq._macroMission?.intent,'reserve');
  f.sim.objectiveControl.counts.ge=1;f.tick();assert.equal(f.sq._lastMacroMission.status,'completed');assert.notEqual(f.sq._macroMission.intent,'reserve');const version=f.sq._macroMission.version;
  for(let i=0;i<10;i++)f.tick();assert.equal(f.sq._macroMission.version,version);assert.equal(f.events.filter(e=>e.type==='decision-reserve-commit').length,1);
});
test('a persistent request is accepted once and its removal is explicit reassessment',()=>{
  const f=fixture();f.tick();f.sq._captureZoneDefenseRequest={objectiveId:'a',point:{x:100,z:0}};f.tick();const mission=f.sq._macroMission;assert.equal(mission?.intent,'defend');
  f.sq._captureZoneDefenseRequest={objectiveId:'a',point:{x:100,z:0},requestedAt:1};f.tick();assert.strictEqual(f.sq._macroMission,mission);
  f.sq._captureZoneDefenseRequest=null;f.tick();assert.notStrictEqual(f.sq._macroMission,mission);assert.equal(mission.status,'superseded');
});
test('vacant-objective extension never rewrites another squad on a global wake',()=>{
  const f=fixture();f.sim._objectives[0].state={owner:'ge',vacantOwner:true};f.tick();
  assert.deepEqual(Object.keys(f.systems).filter(id=>id!=='squad-command'),[],'a module besides the Squad Leader still registers a squad-state hook');
  f.sq.objective={x:71,z:0};f.sq.commandPhase='regroup';f.tick();
  assert.equal(f.sq.objective.x,100,'Squad Leader did not restore the vacant objective mission');assert.equal(f.sq._macroMission.action,'assault');
});
test('a brief decides doctrine once and goes straight for its objective',()=>{
  const f=fixture();f.sq.targetObjective=null;f.sq.routeIndex=0;f.tick();
  const mission=f.sq._macroMission;assert.equal(mission.action,'assault');assert.equal(f.decisions,1);assert.equal(f.sq.objective.x,100);
  for(let i=0;i<20;i++){f.sq.inContact=!!(i%3);f.tick();}
  assert.strictEqual(f.sq._macroMission,mission);assert.equal(f.decisions,1,'doctrine re-evaluated during an unchanged mission');
});
test('Squad Leader regroup is Meso-owned: no General wake, no restore writes, mission resumes',()=>{
  const f=fixture();const extra=[];
  for(let i=0;i<5;i++){const m={id:'r'+i,role:'rifleman',dead:false,faction:'us',root:{position:{x:0,z:0}}};extra.push(m);f.sq.members.push(m);f.sim._roster.us.push(m);}
  f.tick();const mission=f.sq._macroMission,wakes=f.r.BattleCommanderAI.missionState(f.sim).wakeCount,phase=f.sq.commandPhase;
  assert.equal(f.sq.objective.x,100);
  extra[0].root.position.x=-60;extra[1].root.position.x=60;extra[2].root.position.z=70; // genuinely dispersed, including outrunners
  let regroupTicks=0,phaseWrites=0,lastPhase=f.sq.commandPhase;
  for(let i=0;i<12;i++){f.tick();if(f.sq.commandPhase==='regroup')regroupTicks++;if(f.sq.commandPhase!==lastPhase){phaseWrites++;lastPhase=f.sq.commandPhase;}}
  assert.ok(regroupTicks>0,'Squad Leader never regrouped a dispersed squad');assert.equal(phaseWrites,1,'regroup entered more than once or flapped');
  for(const m of extra)m.root.position={x:0,z:0};
  for(let i=0;i<12;i++)f.tick();
  assert.equal(f.sq.commandPhase,phase);assert.equal(f.sq.objective.x,100);assert.strictEqual(f.sq._macroMission,mission);
  assert.equal(f.r.BattleCommanderAI.missionState(f.sim).wakeCount,wakes,'General woke for a Squad Leader regroup');
});
test('a doctrine hold is reviewed once when its Squad Leader lease ends, not every tick',()=>{
  const f=fixture();f.action='hold';f.tick();assert.equal(f.sq._macroMission.action,'hold');assert.equal(f.sq.commandPhase,'hold');
  const lease=f.r.BattleSquadStability.planSeconds.defense,decisions=f.decisions;
  for(let i=0;i<Math.ceil((lease-1)/.45);i++)f.tick();assert.equal(f.decisions,decisions,'hold was re-evaluated before its lease ended');
  for(let i=0;i<6;i++)f.tick();assert.equal(f.decisions,decisions+1,'expected exactly one doctrine review at lease end');
  assert.equal(f.events.filter(e=>e.type==='decision-macro-replan'&&e.data.reason==='doctrine-review').length,1);
});
test('contact freezes Squad Leader leg and phase under the same mission',()=>{
  const f=fixture();f.tick();assert.equal(f.sq.commandPhase,'assault');
  f.sq.inContact=true;f.tick();assert.ok(f.sq._engagementPlan&&f.sq._engagementPlan.status==='active');
  const index=f.sq.routeIndex,phase=f.sq.commandPhase,objective=JSON.stringify(f.sq.objective);
  f.sq.members[0].root.position.x=100;for(let i=0;i<10;i++)f.tick(); // inside the zone: no assault->capture rewrite mid-firefight
  assert.equal(f.sq.routeIndex,index);assert.equal(f.sq.commandPhase,phase);assert.equal(JSON.stringify(f.sq.objective),objective);
});
test('the 120 s reconcile does not retask a young mission, but later escalation may',()=>{
  const f=fixture();f.sim.time=100;f.tick();const mission=f.sq._macroMission;
  f.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:121,replanDue:true}}};f.sim.time=121;f.tick();
  const stalls=()=>f.events.filter(e=>e.type==='decision-macro-replan'&&e.data.reason==='strategic-stall').length;
  assert.strictEqual(f.sq._macroMission,mission);assert.equal(stalls(),0,'a 21 s old mission was treated as a failed 120 s effort');
  f.sim._coordinationHealth.sides.us.objectiveStallSeconds=241;f.sim.time=241;f.tick();
  assert.deepEqual(f.events.filter(e=>e.type==='decision-strategic-recovery').map(e=>e.data.stage),['reconcile','release','main-effort']);
});
test('the first stall stage moves an old failed effort, and the stall cost is still only a score',()=>{
  const f=fixture();f.tick();assert.equal(f.sq._macroMission.objectiveId,'a','the nearer objective is the first effort');
  f.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:121,replanDue:true}}};f.sim.time=121;f.tick();
  assert.equal(f.sq._macroMission.objectiveId,'b','the 120 s wake re-picked the objective the side just failed to take');
  const out=f.r.BattleCommanderAI.missionState(f.sim).stallOutcomes;assert.deepEqual([out.wakes,out.switches,out.repeats],[1,1,0]);
  const g=fixture();g.sim._objectives.pop();g.tick();
  g.sim._coordinationHealth={lastObjectiveProgressAt:0,sides:{us:{objectiveStallSeconds:121,replanDue:true}}};g.sim.time=121;g.tick();
  assert.equal(g.sq._macroMission.objectiveId,'a','with no alternative the stalled objective remains legal');
});
test('a stall closes the stalled efforts, so the frontage limit does not hold the side on them',()=>{
  const f=fixture(),D=f.r.BattleCommanderDoctrine;f.sim._objectives.push({id:'c',def:{x:400,z:0,radius:20,value:1},state:{owner:'neutral'}});
  const mate=(id,target)=>{const s={id:id+'-s',role:'sergeant',dead:false,faction:'us',root:{position:{x:0,z:0}}};const q={id,faction:'us',state:'advance',targetObjective:target,members:[s],aliveCount:1};f.sim.factions.us.squads.push(q);return q;};
  f.sq.targetObjective='a';mate('us-1','a');mate('us-2','b');
  assert.equal(D.openEfforts(f.sim,f.sq).count,2,'a and b are the side\'s two open efforts');
  const pick=D.chooseObjective(f.sim,f.sq,false,{a:true,b:true});
  assert.equal(pick.instance.id,'c','the frontage cost of the only unstalled objective kept the squad on a stalled effort');
  assert.equal(pick.frontagePenalty,0,'stalled efforts must not count against the frontage');
  assert.equal(D.chooseObjective(f.sim,f.sq,false).instance.id,'a','without a stall the frontage limit still masses on open efforts');
});
test('pressure flicker on an objective already being defended is not a new brief',()=>{
  const f=fixture();f.sim._objectives.forEach(o=>o.state.owner='us');f.tick();const mission=f.sq._macroMission;assert.equal(mission.intent,'defend');
  for(let i=0;i<10;i++){f.sq._captureZoneDefenseRequest=i%2?{objectiveId:'a',point:{x:100,z:0}}:null;f.tick();}
  assert.strictEqual(f.sq._macroMission,mission);
  assert.equal(f.events.filter(e=>e.type==='decision-macro-replan'&&e.data.reason==='request-changed').length,0);
});
test('Macro OFF from the start: no brief, the Squad Leader walks the assigned approach route',()=>{
  const f=fixture();f.sim.macroCommandEnabled=false;f.town.radius=20;f.sq.targetObjective=null;f.sq.routeIndex=0;f.sq.route=[{x:0,z:0},{x:20,z:30},{x:50,z:0}];
  f.tick();assert.equal(f.sq._macroMission,undefined);assert.equal(f.sq.objective.x,20);
  f.sq.members[0].root.position={x:20,z:30};for(let i=0;i<4;i++)f.tick();
  assert.equal(f.sq.objective.x,50);assert.equal(f.decisions,0);assert.equal(f.r.BattleCommanderAI.missionState(f.sim).wakeCount,0);
});
console.log(`macro-mission-command: ${passed} passed, ${failed} failed`);if(failed)process.exitCode=1;
