#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../..');
const tableFile = path.join(ROOT, 'battle/modules/53-fbx-clip-table.js');
const backendFile = path.join(ROOT, 'battle/modules/53-fbx-soldier-backend.js');
const context = {};
context.globalThis = context;
vm.runInNewContext(fs.readFileSync(tableFile, 'utf8'), context, { filename: tableFile });

const clips = context.BattleFbxClips && context.BattleFbxClips.clips;
if (!clips) throw new Error('clip table did not publish BattleFbxClips');
const expected = {
  reactionCowerEnter: ['Stand to Praying Kneeling', 0, 'inplace'],
  reactionCowerHold: ['Praying Idle Kneeling', 1],
  reactionCowerExit: ['Praying Kneeling to Stand', 0, 'inplace'],
  reactionFreezeEnter: ['Stand to Terrified', 0, 'inplace'],
  reactionFreezeStanding: ['Praying Idle Standing', 1],
  reactionFreezeSitting: ['Sitting Dazed', 1],
  reactionFreezeFallen: ['Fallen Idle', 0, 'inplace'],
  reactionFleeEnter: ['Flee Start', 0, 'turn'],
  reactionFleeRun: ['Flee Running', 1]
};
for (const [key, spec] of Object.entries(expected)) {
  if (JSON.stringify(clips[key]) !== JSON.stringify(spec))
    throw new Error(`${key}: expected ${JSON.stringify(spec)}, got ${JSON.stringify(clips[key])}`);
  const source = path.join(ROOT, 'Assets/animations', `${spec[0]}.fbx`);
  if (!fs.existsSync(source)) throw new Error(`${key}: missing ${path.relative(ROOT, source)}`);
}
if (context.BattleFbxClips.files.some(file => /^Praying 2$/i.test(file)))
  throw new Error('the duplicate Praying 2 clip returned to the runtime table');

const backend = fs.readFileSync(backendFile, 'utf8');
for (const anchor of [
  "holds:['reactionFreezeStanding','reactionFreezeSitting','reactionFreezeFallen']",
  "return k==='cower'||k==='flee'||k==='freeze'||k==='rage'?k:null",
  "reaction==='freeze'?freezeHoldOf(soldier):null",
  "if(soldier.eng&&soldier.eng.refugeHere)return false",
  "function reactionDropsWeapon(reaction){return reaction==='cower'||reaction==='freeze'||reaction==='flee';}",
  "reactionWeapon(soldier,fx,reactionDropsWeapon(reaction)||fx.cowerExit);",
  "loop||spec[2]==='inplace'||spec[2]==='turn'"
]) if (!backend.includes(anchor)) throw new Error(`backend contract missing: ${anchor}`);

const freezePick = backend.slice(backend.indexOf('function freezeHoldOf'), backend.indexOf('function reactionFullBody'));
if (/Math\.random|battle\.random/.test(freezePick))
  throw new Error('freeze presentation variant must not draw an RNG');
const lower = backend.slice(backend.indexOf('function updateReactionLower'), backend.indexOf('function update(soldier'));
if (/reaction==='rage'/.test(lower))
  throw new Error('rage must retain ordinary fighting locomotion');
if (/reactionRageStrike|rageStrikeHold/.test(backend))
  throw new Error('rage must use its ordinary fighting clips; the broken bayonet overlay returned');

console.log('stress reaction animation: cower/freeze/flee full-body blends drop the weapon; rage keeps ordinary fighting clips');
