'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load(root, path) {
  vm.runInNewContext(fs.readFileSync(path, 'utf8'), {window: root, Math, console}, {filename: path});
}
const building = {id:'house',x:0,z:0,w:12,d:12,rot:0};
const other = {id:'other',x:32,z:0,w:12,d:12,rot:0};
const st = {id:'station-west',building:'house',x:-4,z:3,windowX:-6,windowZ:3,normalX:-1,normalZ:0,port:{stance:'crouch'}};
let directClear = true, fallback = null, structure = true;
const root = {
  GTLog() {},
  GTMath: {dist(a,b) { return Math.hypot(a.x-b.x,a.z-b.z); }},
  BattleModules: {registerSystem(id,system) { this[id]=system; }, unitsFor() { return []; }},
  BattleNavigation: {
    version:22, scenario:{buildings:[building,other]},
    doorPortals:[{id:'east-door',building:'house',x:6,z:0,normalX:1,normalZ:0,
      outside:{x:7.55,z:0},inside:{x:4.45,z:0}}],
    firingStations:[st],
    movementClear(a,b) { return directClear || !(a && b && a.x === 2 && b.x === -4); },
    findPath(a,b) { return [b]; },
    lineOfSightBlocked() { return false; }, inSector() { return true; },
    invalidateNavPath() {}
  },
  BattleNavigationPhysicality: {planIngressPath(sim,s,a,b) { return fallback || [{x:b.x,z:b.z}]; }},
  BattleObstacleField: {},
  BattleEngagement: {reacting() { return false; }, stationClaimed() {}, stationLeft() {}},
  SquadAI: {isMachineGun() { return false; }},
  BattleMovementResolver: {clearCombat() {}},
  BattleSquadStability: {localPlan:{
    structureOrdersOn:true,
    currentStructureOrders() {return structure ? {orders:[{soldierId:'s1'}],stage:'cross-door'} : null;}
  }},
  PhaseCCombatLab: {interiorIngressRecovery:true}
};
load(root,'battle/modules/52-survival-tactical-route.js');
const R = root.BattleTacticalRoute;
assert.ok(R && R.rebaseIngress);
const s = {id:'s1', faction:'us', role:'rifleman', hp:100,
  root:{position:{x:2,z:0}},eng:{state:'advance'},_engagementTask:'support-by-fire',
  _nextStationClaimAt:0};
const sq = {id:'sq1',commandPhase:'defend',state:'engaged',members:[s]};
s.squad=sq;
const b = {time:12,obstacles:[],_roster:{us:[s],ge:[]},factions:{us:{squads:[sq]},ge:{squads:[]}}};
const old = {door:'east-door',index:0,
  steps:[{x:4.5,z:0},{x:8,z:0},{x:4.5,z:0},{x:st.x,z:st.z}]};
let r = R.rebaseIngress(s,b,st,old);
assert.ok(r && r.interiorRebased, 'already inside the right house can skip obsolete exit route');
assert.equal(r.door,null);
assert.equal(r.enteredDoor,'east-door');
assert.equal(r.steps.length,1);
assert.equal(r.steps[0].x,st.x);
assert.ok(r.savedDistance>1);
assert.equal(old.index,0,'only the positional owner may adopt new ingress');
assert.equal(R.rebaseIngress(s,b,st,{steps:[{x:st.x,z:st.z}],index:0}),null);
assert.equal(R.rebaseIngress(s,b,{...st,building:'other'},old),null);
s.root.position.x=6;
assert.equal(R.rebaseIngress(s,b,st,old),null,'door threshold is not securely inside');
s.root.position.x=2;
directClear=false;
fallback=[{x:7,z:1},{x:st.x,z:st.z}];
assert.equal(R.rebaseIngress(s,b,st,old),null,
  'interior route cannot exit the building to claim a shortcut');
fallback=[{x:3,z:3},{x:st.x,z:st.z}];
b.time += 1.6; // A failed physical survey is retried only after its bounded 1.5s cooldown.
assert.ok(R.rebaseIngress(s,b,st,old),'legal entirely indoor detour is permitted');
directClear=true;fallback=null;
root.PhaseCCombatLab.interiorIngressRecovery=false;
assert.equal(R.rebaseIngress(s,b,st,old),null,'legacy A/B unchanged');
root.PhaseCCombatLab=null;
assert.equal(R.rebaseIngress(s,b,st,old),null,'headless fixture without real game bootstrap is inert');
root.BATTLE_BUILD_DEPLOYED='integration';
assert.ok(R.interiorIngressOn(), 'production enables physically checked indoor approach recovery');
b.time += 1.6; // Production A/B restaging reuses the sampled route only after its physical retry cooldown.
assert.ok(R.rebaseIngress(s,b,st,old), 'production chooses valid interior shortcut');
root.location={search:'?smartIngress=0'};
assert.equal(R.interiorIngressOn(),false,'production rollback disables indoor rebase');
assert.equal(R.rebaseIngress(s,b,st,old),null,'rollback retains original door route');
root.location={search:'?smartIngress=1'};
assert.ok(R.interiorIngressOn(),'explicit production opt-in enables smart ingress');
root.PhaseCCombatLab={interiorIngressRecovery:true};
R.knownThreat=()=>({x:-30,z:3});
R.createIngress=()=>({steps:[{x:st.x,z:st.z}],index:0,version:'test',door:null});
R.cancel=()=>{};
load(root,'battle/modules/20-building-hardpoints.js');
const P=root.BattleTacticalPositions;
assert.ok(P);
P.assign(b);
assert.equal(P.current(s),null,'#299 security assignment beats new window reservation');
assert.ok(P.summary(b).structureEntryStationClaimsDeferred>0);
structure=false;
s._nextStationClaimAt=0;
P.assign(b);
assert.ok(P.current(s),'window becomes available once structure priority ends');
assert.equal(P.current(s).station,st.id);
console.log('PASS building ingress: indoor rebase, exterior rejection, #299 entry priority, isolated A/B');
