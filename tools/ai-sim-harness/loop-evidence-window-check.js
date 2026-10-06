#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),H=require('./harness');
const r={};r.window=r;r.BATTLE_BUILD='test';
r.BattleAILoopWatch={alerts(){return[{faction:'us',squad:'us-3',time:100,kind:'handoff-loop'}];}};
r.BattleOrderProvenance={
  events(){return[
    {faction:'us',squad:'us-3',time:10,id:'too-old'},
    {faction:'us',squad:'us-3',time:90,id:'before'},
    {faction:'us',squad:'us-3',time:100,id:'at'},
    {faction:'us',squad:'us-3',time:129,id:'after'},
    {faction:'us',squad:'us-3',time:131,id:'too-late'},
    {faction:'us',squad:'us-2',time:100,id:'wrong-squad'}
  ];},
  conflicts(){return[];},version:'test'
};
new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,'battle/core-runtime.js'),'utf8'))(r,r,{log(){},warn(){}});
new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,'battle/modules/99-session-diagnostics-export.js'),'utf8'))(r,r,{log(){},warn(){},error(){}});
const sim={time:130,winner:null,factions:{us:{squads:[]},ge:{squads:[]}},scene:{metadata:{battleScenario:{seed:'diag'}}}};
const out=r.BattleDiagnosticsExport.snapshot('loops',sim),row=out.loopWatch.alerts[0];
assert.equal(row.relatedWindowSeconds,30);
assert.deepEqual(row.relatedOrderEvents.map(e=>e.id),['before','at','after'],'loop evidence is same-entity and local in time, not battle-wide history');
console.log('PASS loop diagnostics attach only local-in-time order evidence');
