#!/usr/bin/env node
'use strict';
/* Mutation test for tools/ai-sim-harness/genome-gate-check.js. A gate check that cannot fail proves
   nothing, so this breaks the gate on purpose, one edit at a time, in a private temp copy of battle/
   and the check, and requires the check to fail. Every mutant must be killed (exit 1 if one survives).

   The mutants: each place the stashed genome could leak (the server genome, the scenario memory, a
   per-match genome, set, refresh, persist, remember, the exported flag, the switch itself), the trainer
   loading while stashed, a second door around ai-policy.js, the two copies of the defaults drifting (the
   default rules included), the default rules misreading a condition, the genome never being off, and Force
   Command deciding a brief through the genome module itself.

   An edit whose anchor is missing means the source text changed: update the anchor, never drop the
   mutant. Usage: node scripts/probe_genome_gate_mutants.cjs (about 5 s). */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const CHECK = 'tools/ai-sim-harness/genome-gate-check.js';
let tmp = null;

function fresh() {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'genome-gate-mutant-'));
  fs.mkdirSync(path.join(tmp, path.dirname(CHECK)), { recursive: true });
  fs.cpSync(path.join(REPO, 'battle'), path.join(tmp, 'battle'), {
    recursive: true,
    filter: src => (fs.statSync(src).isDirectory() ? !/[\\/]audio$/.test(src) : src.endsWith('.js'))
  });
  fs.copyFileSync(path.join(REPO, CHECK), path.join(tmp, CHECK));
}
function run() {
  const r = cp.spawnSync('node', [path.join(tmp, CHECK)], { encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
function edit(rel, from, to) {
  const file = path.join(tmp, 'battle', rel),
    s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('mutation anchor missing in ' + rel + ': ' + from.slice(0, 80));
  fs.writeFileSync(file, s.replace(from, to));
}
const append = (rel, text) => fs.appendFileSync(path.join(tmp, 'battle', rel), '\n' + text + '\n');

const P = 'ai-policy.js';
const mutants = [
  [
    'the server genome is read while stashed',
    () =>
      edit(
        P,
        'var persisted=STASHED?null:root.BATTLE_AI_POLICY||null',
        'var persisted=root.BATTLE_AI_POLICY||null'
      )
  ],
  [
    'the scenario memory is read while stashed',
    () => edit(P, 'var memory=!STASHED&&root.BATTLE_AI_MEMORY', 'var memory=root.BATTLE_AI_MEMORY')
  ],
  [
    'set() changes a stashed genome',
    () => edit(P, 'if(STASHED)return get();current=normalize(next);', 'current=normalize(next);')
  ],
  [
    'a per-match genome is honoured while stashed',
    () =>
      edit(
        P,
        'if(!STASHED&&sim&&sim.aiGenomes&&sim.aiGenomes[faction])',
        'if(sim&&sim.aiGenomes&&sim.aiGenomes[faction])'
      )
  ],
  [
    'setMatchPolicies stores a match genome while stashed',
    () => edit(P, 'if(STASHED)return null;sim.aiGenomes=', 'sim.aiGenomes=')
  ],
  [
    'persist writes to the server while stashed',
    () => edit(P, 'if(STASHED)return Promise.resolve({ok:false,stashed:true,revision:revision});', '')
  ],
  [
    'refresh fetches the live policy while stashed',
    () => edit(P, 'if(STASHED)return Promise.resolve({genome:get(),revision:revision,stashed:true});', '')
  ],
  [
    'remember writes to the learning backend while stashed',
    () => edit(P, 'if(STASHED)return Promise.resolve({ok:false,stashed:true});', '')
  ],
  ['the exported flag says live', () => edit(P, 'stashed:STASHED,', 'stashed:false,')],
  ['the switch is off', () => edit(P, 'var STASHED=true;', 'var STASHED=false;')],
  ['the trainer loads while stashed', () => edit('ai-trainer.js', '||root.BattleAIPolicy.stashed', '')],
  [
    'a second door: another module reads the server genome',
    () => append('modules/13-captain-command-throttle.js', 'var _leak = window.BATTLE_AI_POLICY;')
  ],
  [
    'a second door: another file hands a match its own genome',
    () => append('battle-control.js', 'function _leak(sim) { sim.aiGenomes = {}; }')
  ],
  [
    'the doctrine fallback drifts from the genome defaults',
    () => edit('commander-doctrine.js', 'cohesionRadius: 34,', 'cohesionRadius: 35,')
  ],
  [
    'the genome defaults drift from the doctrine fallback',
    () =>
      edit(P, 'DEFAULT_PARAMETERS={\n    cohesionRadius:34,', 'DEFAULT_PARAMETERS={\n    cohesionRadius:40,')
  ],
  [
    'a default rule drifts from the genome defaults',
    () =>
      edit(
        'commander-doctrine.js',
        "id: 'press-neutral', when: ['objectiveNeutral', 'notOutnumbered'], action: 'assault'",
        "id: 'press-neutral', when: ['objectiveNeutral', 'notOutnumbered'], action: 'hold'"
      )
  ],
  [
    'the default rules read a condition the wrong way round',
    () =>
      edit(
        'commander-doctrine.js',
        "c === 'notOutnumbered' ? context.outnumbered : !context[c]",
        "c === 'notOutnumbered' ? !context.outnumbered : !context[c]"
      )
  ],
  [
    'the genome is never off: Force Command always asks the genome module',
    () =>
      edit(
        'commander-doctrine.js',
        'return !root.BattleAIPolicy || !!root.BattleAIPolicy.stashed;',
        'return false;'
      )
  ],
  [
    'a second door: Force Command decides a brief through the genome module itself',
    () =>
      edit(
        'commander-ai.js',
        'rule = D.ruleFor(sim, sq.faction, context);',
        'rule = root.BattleAIPolicy ? root.BattleAIPolicy.decide(genome(sim, sq.faction), context) : null;'
      )
  ]
];

fresh();
const control = run();
if (control.status !== 0) {
  console.error('the unmutated copy fails, so nothing below means anything:\n' + control.out);
  process.exit(2);
}
console.log('control (no mutation): passes');
const survivors = [];
for (const [name, mutate] of mutants) {
  fresh();
  mutate();
  const killed = run().status !== 0;
  if (!killed) survivors.push(name);
  console.log((killed ? 'killed   ' : 'SURVIVED ') + name);
}
if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
console.log('genome gate mutants: ' + mutants.length + ', survivors ' + survivors.length);
process.exit(survivors.length ? 1 : 0);
