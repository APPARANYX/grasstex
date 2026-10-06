#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../../battle/modules/97-ai-timeline-recorder.js'),'utf8');
const hooks={};
const root={
  console:{log(){}},
  GTLog(){},
  BattleModules:{
    registerSystem(id,api){hooks[id]=api;},
    unitsFor(sim){return sim.units||[];}
  },
  BattleEngagement:{stateOf:s=>s.eng||{state:'advance'}},
  BattleObjectiveSystem:{status(){return{owner:'neutral',us:0,ge:0};}},
  BattleLeases:{
    get(q,kind){return q&&q._leases&&q._leases.live&&q._leases.live[kind]||null;},
    holds(q,kind,t){const l=this.get(q,kind);return !!l&&t<l.until;}
  }
};
root.window=root;vm.createContext(root);vm.runInContext(source,root);
const T=root.BattleAITimeline,sys=hooks['ai-timeline-recorder'];
assert.ok(T&&sys,'timeline recorder registered');

const q={id:'US-1',faction:'us',commandPhase:'approach',state:'advance',inContact:false,_macroMission:{status:'executing'},_leases:{live:{}}};
const man={id:'u1',role:'rifleman',faction:'us',squad:q,dead:false,root:{position:{x:0,z:0}},destination:{x:100,z:0},moving:false,moveSpeed:0,target:null,eng:{state:'advance'},suppressedUntil:0,_movementStopReason:'blocked',_movementResolver:{last:{owner:'formation',kind:'formation',reason:'hold-line'}}};
q.members=[man];
const ge={id:'GE-1',faction:'ge',commandPhase:'approach',state:'advance',inContact:false,_macroMission:{status:'executing'},_leases:{live:{}},members:[]};
const sim={time:0,seed:'observer-check',scene:{metadata:{}},winner:null,units:[man],factions:{us:{alive:1,kills:0,squads:[q]},ge:{alive:0,kills:0,squads:[ge]}},_objectives:[]};
const baseKeys=Object.keys(sim).sort();
sys.onBattleStart(sim);
function tick(t){sim.time=t;sys.onSimulationStep(sim);}
for(let t=0;t<=12.5;t+=.5)tick(t);
let snap=T.snapshot(sim),starts=snap.markers.filter(m=>m.kind==='stall-start');
assert.equal(starts.length,1,'one exact stall onset');
assert.equal(starts[0].side,'us');assert.equal(starts[0].squad,'US-1');assert.equal(starts[0].soldier,'u1');
assert.equal(starts[0].resolver.kind,'formation');assert.equal(starts[0].stop,'blocked');assert.equal(starts[0].destM,100);
assert.equal(snap.observer.format,'grasstex-battle-observer-v1');
assert.equal(snap.observer.windows.length,1,'stall opens one focused window');
assert.ok(snap.observer.windows[0].frames.length>=20,'focus keeps the pre-stall half-second history');
assert.equal(snap.observer.windows[0].frames.at(-1).squad.men[0].resolver.reason,'hold-line');
assert.equal(snap.observer.windows[0].frames.at(-1).squad.stalled,1);

man.root.position.x=2;tick(13);
snap=T.snapshot(sim);
const ends=snap.markers.filter(m=>m.kind==='stall-end');
assert.equal(ends.length,1,'movement recovery closes the stall episode');
assert.equal(ends[0].recovery,'movement-resumed');assert.ok(ends[0].duration>=.5);
assert.ok(snap.observer.windows[0].reasons.some(r=>r.kind==='stall-end'),'recovery extends the same observer window');

sim._squadForwardProgressSummary={alerts:[{kind:'low-forward-progress',faction:'us',squad:'US-1',at:14,window:30,startAt:0,endAt:14,travel:40,net:3,efficiency:.075,goalKind:'objective',routeChanges:4,spread:18,inContact:false}]};
tick(14);
snap=T.snapshot(sim);
assert.equal(snap.markers.filter(m=>m.kind==='low-forward-progress').length,1,'LFP becomes an exact timeline marker');
assert.ok(snap.observer.windows[0].reasons.some(r=>r.kind==='low-forward-progress'),'LFP joins the focused context');

q.commandPhase='regroup';tick(15);
q.commandPhase='approach';tick(16);
snap=T.snapshot(sim);
assert.equal(snap.markers.filter(m=>m.kind==='regroup-end').length,1,'regroup recovery is explicit');
assert.ok(snap.observer.windows[0].reasons.some(r=>r.kind==='regroup-start'));
assert.ok(snap.observer.windows[0].reasons.some(r=>r.kind==='regroup-end'));

q._leases.live.bound={owner:'engagement',reason:'fire-and-movement',since:17,until:25};tick(17);
delete q._leases.live.bound;tick(18);
q.inContact=true;tick(19);
q.inContact=false;tick(20);
snap=T.snapshot(sim);
assert.equal(snap.markers.filter(m=>m.kind==='bound-start').length,1);
assert.equal(snap.markers.filter(m=>m.kind==='bound-end').length,1);
assert.equal(snap.markers.filter(m=>m.kind==='contact-start').length,1);
assert.equal(snap.markers.filter(m=>m.kind==='contact-end').length,1);
assert.equal(snap.markers.filter(m=>m.kind==='first-contact').length,1);

assert.deepEqual(Object.keys(sim).sort(),baseKeys.concat('_squadForwardProgressSummary').sort(),'observer writes no new gameplay state on sim');
assert.equal(snap.format,'grasstex-ai-timeline-v1','existing timeline contract remains backward compatible');
assert.ok(snap.samples.some(s=>s.us.stalled===1),'one-second backbone still carries aggregate stalled count');
console.log('PASS battle observer exact flow/stall events, recovery, LFP integration and focused 0.5 s context are observe-only');
