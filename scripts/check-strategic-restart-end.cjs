#!/usr/bin/env node
'use strict';
/* Restart/terminal lifecycle contracts. Battle data authority does not change:
   only the visual rig must leave the truck BEFORE its old actor root is
   disposed, and both End battle controls must share the banner/export path. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root='battle/';
const truck=fs.readFileSync(root+'modules/59-strategic-truck-visual.js','utf8');
const sim=fs.readFileSync(root+'battle-sim.js','utf8');
const control=fs.readFileSync(root+'battle-control.js','utf8');
const camera=fs.readFileSync(root+'camera-controls.js','utf8');
const html=fs.readFileSync(root+'battle_sim.html','utf8');
const diag=fs.readFileSync(root+'modules/99-session-diagnostics-export.js','utf8');
assert.match(sim,/runHook\('beforeBattleRestart', this, \{\}\);[\s\S]{0,650}all\[i\]\.root\.dispose\(\)/,
  'Pre-restart modules must run before old soldier roots are destroyed');
assert.match(truck,/beforeBattleRestart:\s*teardown/,
  'Truck must detach existing soldiers and weapons in pre-restart hook');
assert.match(truck,/function teardown\(sim\)[\s\S]*?st\.trucks\.forEach\(removeEntry\)/,
  'Pre-restart teardown restores all real squad rigs');
assert.match(truck,/function releaseRider\(rider\)[\s\S]*?restoreTransform\(fx\.holder,[\s\S]*?restoreTransform\(fx\.socket,/,
  'Detach both real body and weapon socket before soldier root disposal');
assert.match(truck,/function reset\(sim\)\s*\{\s*teardown\(sim\)/,
  'Battle start/restart reset may prewarm assets only after teardown');
assert.match(sim,/BattleSim\.prototype\.resume = function \(\) \{[\s\S]{0,350}if \(this\.manualEnded \|\| this\.winner\) return false;/,
  'Terminal session resume must be guarded at simulation API');
assert.match(camera,/if \(!b \|\| b\.manualEnded \|\| b\.winner \|\| !playerSoldierEligible\(b, next\)\) return false/,
  'P possession must not select another soldier after terminal stop');
assert.match(camera,/!b\.manualEnded && !b\.winner && !preservePause/,
  'Player mode cannot resurrect terminal session');
assert.match(camera,/if \(currentBattle && \(currentBattle\.manualEnded \|\| currentBattle\.winner\)\) \{/,
  'P key must not request pointer lock while terminal diagnostics are open');
assert.match(control,/function endBattle\(sim, reason\)[\s\S]*?sim\.manualEnded = true;[\s\S]*?sim\._showPostBattle/,
  'Both manual End controls need shared banner presentation');
assert.match(html,/battle\._showPostBattle=showPostBattle/,
  'Inline HUD must publish banner presentation to BattleControl');
assert.match(html,/function endBattle\(\)\{if\(typeof battle\.endBattle==='function'\)battle\.endBattle\('manual'\);\}/,
  'HUD End button must not use a second incompatible manual-stop implementation');
assert.match(diag,/bannerExportCompactDiagnostics/);
assert.match(diag,/bannerExportDiagnostics/);
assert.match(diag,/function strategicTransportSnapshot\(sim\)/,
  'Transport must be present as read-only contextual data in diagnostics');
assert.match(diag,/tuning: transport.tuning \|\| null/,
  'Export planned foot approach distance alongside outcomes');
assert.equal((diag.match(/strategicTransport: strategicTransportSnapshot\(sim\)/g)||[]).length,2,
  'Compact and full exports both include squad transport outcome/abort reasons');
const display={};
for(const id of ['banner','bannerText','bannerSub']){
  display[id]={style:{display:id==='banner'?'none':''},textContent:''};
}
const mock={
  paused:false,manualEnded:false,winner:null,winReason:null,_trainingRunning:false,time:90,
  factions:{us:{alive:9,kills:2},ge:{alive:6,kills:3}},
  pause(){this.paused=true;},_showPostBattle(label){display.bannerText.textContent=label;display.banner.style.display='flex';},
};
const logs=[];
const context={document:{getElementById:id=>display[id]||null},
  window:{BattleTelemetry:{end:(...a)=>logs.push(a)}},console,
  setTimeout,clearTimeout};
const start=control.indexOf('  function endBattle(sim, reason) {');
const stop=control.indexOf('  function formatStats(j)',start);
assert.ok(start>=0&&stop>start);
const factory=new Function('document','root',
  control.slice(start,stop)+'\nreturn endBattle;');
const end=factory(context.document,{BattleTelemetry:context.window.BattleTelemetry,GTLog:()=>{}});
for(let i=0;i<2;i++){
  assert.equal(end(mock,'manual'),true);
  assert.equal(mock.manualEnded,true);
  assert.equal(mock.winReason,'manual');
  assert.equal(mock.paused,true);
  assert.equal(display.banner.style.display,'flex');
  assert.equal(end(mock,'manual'),false,'Idempotent end within same session');
  mock.manualEnded=false;mock.paused=false;mock.winReason=null;
  display.banner.style.display='none';
}
assert.equal(logs.length,2,'One telemetry end per manual session');
console.log('PASS occupied truck restart ordering, P/terminal guard, and repeat End-battle diagnostic banner');
