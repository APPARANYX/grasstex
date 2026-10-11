#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../..');
const tableFile = path.join(ROOT, 'battle/modules/53-fbx-clip-table.js');
const backendFile = path.join(ROOT, 'battle/modules/53-fbx-soldier-backend.js');
const animationFile = path.join(ROOT, 'battle/modules/52-fbx-animation-state.js');
const converterFile = path.join(ROOT, 'battle/modules/52-fbx-clip-converter.js');
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
const animation = fs.readFileSync(animationFile, 'utf8');
if (!backend.includes('BattleFbxAnimationState.create')) throw new Error('animation state owner missing');
for (const anchor of [
  "holds: ['reactionFreezeStanding', 'reactionFreezeSitting', 'reactionFreezeFallen']",
  "return k === 'cower' || k === 'flee' || k === 'freeze' || k === 'rage' ? k : null",
  "if (k === 'flee' && e.fledPhase === 'wait') return 'freeze';",
  "reaction === 'freeze' ? freezeHoldOf(soldier) : null",
  "return reaction === 'cower' || reaction === 'freeze';",
  'reactionWeapon(soldier, fx, reactionDropsWeapon(reaction) || fx.cowerExit);',
  'left.droppedAt || standAt(soldier)'
])
  if (!animation.includes(anchor)) throw new Error(`animation contract missing: ${anchor}`);
const converter = fs.readFileSync(converterFile, 'utf8');
if (!converter.includes("loop || spec[2] === 'inplace' || spec[2] === 'turn'"))
  throw new Error('converter must suppress looping, in-place and turning hips drift');
/* Presentation draws what the sim says and never writes it: the weapon a fled man left is Engagement's decision
   (BattleWeapons.abandon), the one he is issued at base is SquadAI.rearm's. */
if (/\bsoldier\.weapon\s*=[^=]|\.abandon\s*\(|\.rearm\s*\(|\.secondary\s*=[^=]/.test(backend + '\n' + animation))
  throw new Error("the backend must not write the soldier's weapons: abandoning and issuing are the sim's");

const freezePick = animation.slice(
  animation.indexOf('function freezeHoldOf'),
  animation.indexOf('function reactionFullBody')
);
if (/Math\.random|battle\.random/.test(freezePick))
  throw new Error('freeze presentation variant must not draw an RNG');
const lower = animation.slice(
  animation.indexOf('function updateReactionLower'),
  animation.indexOf('function update(soldier')
);
if (/reaction==='rage'/.test(lower)) throw new Error('rage must retain ordinary fighting locomotion');
if (/reactionRageStrike|rageStrikeHold/.test(backend + '\n' + animation))
  throw new Error('rage must use its ordinary fighting clips; the broken bayonet overlay returned');

console.log(
  'stress reaction animation: cower/freeze put the weapon beside him, a fled man runs and waits as a freeze hold and leaves a weapon the sim took, rage keeps ordinary fighting clips'
);
