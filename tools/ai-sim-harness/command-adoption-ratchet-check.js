#!/usr/bin/env node
'use strict';
/* Phase 0E: fail closed when a new command-bearing personal read bypasses adoption.
   Explicit audited consumers are intentional; new readers must be reviewed here. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const meso=read('battle/modules/16-squad-plan-stability.js');
const eng=read('battle/engagement.js');
const reception=read('battle/modules/18-command-reception.js');
const files=[];
function walk(dir){
  for(const ent of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
    const rel=path.posix.join(dir,ent.name);
    if(ent.isDirectory())walk(rel);
    else if(ent.name.endsWith('.js'))files.push(rel);
  }
}
walk('battle');
function linesWith(source,pattern){
  return source.split(/\r?\n/).map((line,i)=>({line,n:i+1})).filter(x=>pattern.test(x.line)&&!/^\s*(?:\/\/|\*|\/\*)/.test(x.line));
}
let assertions=0;
function check(ok,msg){assert.ok(ok,msg);assertions++;}
check(/function publishPersonalMovement\(/.test(meso),'Meso personal publisher exists');
check(/CR\.adopted\s*&&\s*CR\.adopted\(s,\s*battle,\s*'movement',\s*scope\)/.test(meso),'Meso reads personal movement adoption');
check(/if\s*\(!adopted\s*\|\|\s*!adopted\.point/.test(meso),'Meso rejects pending/unreachable movement');
check(/s\._fireteamDestination\s*=\s*copy\(adopted\.point\)/.test(meso),'Meso publishes adopted point');
check(/CR\.adopted\s*&&\s*CR\.adopted\(s,\s*battle,\s*'posture-fire',\s*'squad'\)/.test(eng),'Engagement reads personal posture adoption');
check(!/\.(?:destination|orderDestination|_fireteamDestination|target|prone|crawling|tacticalCrouch)\s*=/.test(reception),'Reception never writes physical truth');
// Loop watch reads the already-published personal destination for observation only; it never issues an order.
const allowedMovement=new Set(['battle/modules/16-squad-plan-stability.js','battle/modules/15a-squad-leader-fire-control.js','battle/modules/15b-squad-leader-buddy-pairs.js','battle/engagement.js','battle/movement-resolver.js','battle/modules/21-defender-engineers.js','battle/modules/36-order-provenance.js','battle/modules/40-world-debug-overlay.js','battle/modules/32-ai-loop-watch.js']);
const offenders=[];
for(const file of files){
  const src=read(file);
  if(file!=='battle/modules/18-command-reception.js' && /BattleCommandReception\s*\.\s*(?:publish|adopted|snapshot)/.test(src) && !new Set(['battle/modules/16-squad-plan-stability.js','battle/engagement.js','battle/modules/99-session-diagnostics-export.js']).has(file))
    offenders.push(file+': new direct reception consumer requires review');
  if(file==='battle/modules/18-command-reception.js')continue;
  // Only audit direct reads of command-bearing squad posture and the published personal
  // fireteam destination; legitimate legacy/physical consumers are explicit.
  if(!allowedMovement.has(file)){
    for(const hit of linesWith(src,/\._fireteamDestination\b/))
      offenders.push(file+':'+hit.n+': unaudited personal command destination read/write');
  }
}
check(offenders.length===0,offenders.join('\n')||'No unaudited command readers');
console.log('Phase 0E command adoption ratchet: '+assertions+' assertions; '+files.length+' battle JS files scanned');
