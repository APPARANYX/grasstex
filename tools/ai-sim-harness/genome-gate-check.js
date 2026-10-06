#!/usr/bin/env node
'use strict';
/* The genome is stashed with the AI Graph (STASHED in ai-policy.js): until the UI pass it is the code
   defaults, whatever the server, the scenario memory or a match says, so every phase after this one
   measures against one baseline. The production genome (r14, 2026-09-29) differed from the defaults in
   22 of 28 values and in its rules; without this gate a battle depends on data outside the repo.

   - A stashed genome IS the defaults: a hostile server genome, hostile scenario memory and hostile
     per-match genomes change nothing, the revision reads 0, and Force Command's doctrine and the
     Squad Leader's tuning numbers (through BattleCommanderDoctrine.policyFor) read the defaults.
   - Nothing can change or write it: set, setMatchPolicies, refresh, persist and remember do nothing
     and never touch the network, and the genome trainer does not load.
   - It has one door: no other runtime file reads the raw policy, the memory or the per-match genomes.
   - Genome off (stashed, or its module absent as in the Node harness) means the code defaults in
     commander-doctrine.js: the numbers, the doctrine and the four default rules, read from there and not from
     ai-policy.js, so a page or a harness without the genome module decides briefs by the same rules.
   - The two copies of the defaults (the genome's and the doctrine module's fallback) agree, rules included.
   - The control: with the switch flipped the same hostile inputs DO take effect, so the tests above can
     fail and the live genome still works when it comes back. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO = process.env.GRASSTEX_SOURCE_ROOT || path.resolve(__dirname, '../..');
const read = rel => fs.readFileSync(path.join(REPO, rel), 'utf8');
const queue = [];
function test(name, fn) {
  queue.push([name, fn]);
}

const SWITCH = 'var STASHED = true;';
const HOSTILE = {
  version: 2,
  parameters: {
    cohesionRadius: 50,
    captainlessCohesion: 38,
    cornerHold: 1.8,
    supportDelay: 0,
    scoutLead: 10,
    sectorDistanceWeight: 1.1
  },
  doctrine: { reserveFraction: 0, riskTolerance: 1, flankPreference: 1, objectiveStrategy: 'sequential' },
  rules: [{ id: 'always-hold', when: ['objectiveNeutral'], action: 'hold', weight: 1 }]
};
const FINGERPRINT = { any: 'thing' };
const SCENARIO = { id: 'scenario-1', fingerprint: FINGERPRINT };

/* ai-policy.js as shipped, or with its switch flipped, on a root that carries hostile server data.
   fetch fails the test if it is ever called while stashed. */
function policyRoot({ stashed, fetchLog }) {
  const root = {
    BATTLE_AI_POLICY: { ok: true, revision: 999, genome: HOSTILE },
    BATTLE_AI_MEMORY: {
      experiences: [
        {
          fingerprint: FINGERPRINT,
          genome: HOSTILE,
          score: 100,
          seed: 'm1',
          scenarioId: 'scenario-1',
          revision: 7
        }
      ]
    },
    BattleScenarioGenerator: { similarity: () => 1 }
  };
  new Function('window', 'globalThis', 'console', read('battle/core-runtime.js'))(root, root, {
    log() {},
    warn() {}
  });
  let source = read('battle/ai-policy.js');
  if (!stashed) {
    assert.ok(source.includes(SWITCH), 'the switch line moved: update SWITCH in genome-gate-check.js');
    source = source.replace(SWITCH, 'var STASHED = false;');
  }
  const fetchStub = url => {
    fetchLog.push(String(url));
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({ ok: true, revision: 999, genome: HOSTILE, experience: { genome: HOSTILE } })
    });
  };
  new Function('window', 'globalThis', 'console', 'fetch', source)(
    root,
    root,
    { log() {}, warn() {} },
    fetchStub
  );
  return root;
}
const same = (a, b, message) =>
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), message);

test('a stashed genome is the defaults, whatever the server, the memory or a match says', () => {
  const fetchLog = [],
    root = policyRoot({ stashed: true, fetchLog }),
    P = root.BattleAIPolicy,
    sim = { scene: { metadata: { battleScenario: SCENARIO } } };
  assert.equal(P.stashed, true);
  assert.equal(P.revision, 0, 'the injected revision 999 is ignored');
  same(P.get(), P.defaults, 'get() is the defaults');
  for (const f of ['us', 'ge']) {
    same(P.genomeFor(sim, f), P.defaults, f + ' genomeFor, with hostile memory that matches the scenario');
    same(P.policyFor(sim, f), P.defaults.parameters, f + ' policyFor');
  }
  same(
    P.adaptedForScenario(SCENARIO),
    { genome: P.defaults, sources: [] },
    'scenario adaptation blends nothing'
  );
  assert.deepEqual(P.memory(), [], 'the injected memory is dropped');
  P.setMatchPolicies(sim, HOSTILE, HOSTILE);
  assert.equal(sim.aiGenomes == null, true, 'a match cannot carry its own genome');
  sim.aiGenomes = { us: HOSTILE, ge: HOSTILE };
  same(P.genomeFor(sim, 'us'), P.defaults, 'even a genome assigned by hand is ignored');
  const rule = P.decide(P.genomeFor(sim, 'us'), { objectiveNeutral: true, outnumbered: false });
  assert.equal(rule.id, 'press-neutral', 'the default rules decide, not the hostile always-hold');
  assert.deepEqual(fetchLog, [], 'no network');
});

test('nothing can change or write a stashed genome, and the network is never touched', async () => {
  const fetchLog = [],
    root = policyRoot({ stashed: true, fetchLog }),
    P = root.BattleAIPolicy;
  same(P.set(HOSTILE, { revision: 5 }), P.defaults, 'set returns the defaults');
  same(P.get(), P.defaults);
  assert.equal(P.revision, 0);
  const results = await Promise.all([P.refresh(), P.persist(HOSTILE, {}), P.remember({ genome: HOSTILE })]);
  assert.equal(results[0].stashed, true);
  assert.equal(results[1].stashed, true);
  assert.equal(results[1].ok, false);
  assert.equal(results[2].stashed, true);
  assert.equal(results[2].ok, false);
  same(P.get(), P.defaults, 'still the defaults after refresh, persist and remember');
  assert.deepEqual(P.memory(), [], 'remember adds nothing');
  assert.deepEqual(fetchLog, [], 'refresh, persist and remember never call fetch');
});

test('the consumers read the defaults: Force Command doctrine and the Squad Leader tuning numbers', () => {
  const fetchLog = [],
    root = policyRoot({ stashed: true, fetchLog });
  new Function('window', 'globalThis', 'console', read('battle/commander-doctrine.js'))(root, root, {
    log() {},
    warn() {}
  });
  const D = root.BattleCommanderDoctrine,
    P = root.BattleAIPolicy,
    sim = { scene: { metadata: { battleScenario: SCENARIO } } };
  for (const f of ['us', 'ge']) {
    assert.equal(D.genomeOff(), true, 'genome off while stashed');
    for (const k of Object.keys(P.defaults.parameters))
      if (k !== 'objectiveHoldWin')
        assert.equal(
          D.policyFor(sim, f)[k],
          P.defaults.parameters[k],
          f + ' tuning number ' + k + ' (module 16 reads these through policyFor)'
        );
    same(D.doctrineFor(sim, f), P.defaults.doctrine, f + ' doctrine');
    same(D.genomeFor(sim, f).rules, P.defaults.rules, f + ' rules');
    assert.equal(D.policyFor(sim, f).cohesionRadius, 34);
    assert.equal(D.doctrineFor(sim, f).riskTolerance, 0.56);
  }
});

test('the trainer does not load while the genome is stashed', () => {
  const load = stashed => {
    const fetchLog = [],
      root = policyRoot({ stashed, fetchLog });
    Object.assign(root, {
      BattleCommanderAI: {},
      BattleScenarioGenerator: { similarity: () => 1 },
      BattleTownObjectives: {}
    });
    new Function('window', 'globalThis', 'console', 'document', 'fetch', read('battle/ai-trainer.js'))(
      root,
      root,
      { log() {}, warn() {} },
      undefined,
      () => Promise.reject(new Error('no fetch'))
    );
    return root;
  };
  assert.equal(
    load(true).BattleAITrainer,
    undefined,
    'stashed: no trainer, so nothing can promote or write a genome'
  );
  assert.equal(
    typeof load(false).BattleAITrainer,
    'object',
    'control: the trainer loads when the genome is live'
  );
});

test('the genome has one door: only ai-policy.js reads the raw policy, the memory or the per-match genomes', () => {
  const dir = path.join(REPO, 'battle'),
    files = fs
      .readdirSync(dir)
      .filter(f => f.endsWith('.js'))
      .concat(
        fs
          .readdirSync(path.join(dir, 'modules'))
          .filter(f => f.endsWith('.js'))
          .map(f => 'modules/' + f)
      ),
    doors = /BATTLE_AI_POLICY|BATTLE_AI_MEMORY|\.aiGenomes\b/,
    strays = files.filter(f => f !== 'ai-policy.js' && doors.test(read('battle/' + f)));
  assert.deepEqual(strays, [], 'a file that reads the genome around ai-policy.js would bypass the gate');
});

test('the two copies of the defaults agree (the genome, and the doctrine module fallback)', () => {
  const fetchLog = [],
    root = policyRoot({ stashed: true, fetchLog });
  new Function('window', 'globalThis', 'console', read('battle/commander-doctrine.js'))(root, root, {
    log() {},
    warn() {}
  });
  const D = root.BattleCommanderDoctrine,
    defaults = root.BattleAIPolicy.defaults;
  /* objectiveHoldWin is a genome parameter nothing reads (commander-ai.js uses its own OBJECTIVE_HOLD_WIN). */
  const unread = new Set(['objectiveHoldWin']);
  for (const k of Object.keys(defaults.parameters)) {
    if (unread.has(k)) continue;
    assert.equal(D.FALLBACK[k], defaults.parameters[k], 'parameter ' + k);
  }
  for (const k of Object.keys(D.FALLBACK))
    assert.ok(k in defaults.parameters, 'the fallback has a parameter the genome does not: ' + k);
  same(D.FALLBACK_DOCTRINE, defaults.doctrine, 'doctrine numbers');
  same(D.FALLBACK_RULES, defaults.rules, 'rules');
});

/* Every situation the brief's context can describe: the nine flags buildContext sets (notOutnumbered is
   derived from outnumbered). */
const FLAGS = [
  'objectiveNeutral',
  'objectiveEnemy',
  'objectiveOwned',
  'enemyNear',
  'outnumbered',
  'captainDead',
  'supportRole',
  'insideObjective',
  'underPressure'
];
function doctrineOn(root) {
  new Function('window', 'globalThis', 'console', read('battle/core-runtime.js'))(root, root, {
    log() {},
    warn() {}
  });
  new Function('window', 'globalThis', 'console', read('battle/commander-doctrine.js'))(root, root, {
    log() {},
    warn() {}
  });
  return root.BattleCommanderDoctrine;
}

test('genome off, a brief is decided by the same default rules with or without the genome module', () => {
  const stashed = policyRoot({ stashed: true, fetchLog: [] }),
    P = stashed.BattleAIPolicy,
    withModule = doctrineOn(stashed),
    bare = doctrineOn({}),
    sim = { scene: { metadata: { battleScenario: SCENARIO } } };
  assert.equal(bare.genomeOff(), true, 'no genome module: off');
  let decided = 0;
  for (let mask = 0; mask < 1 << FLAGS.length; mask++) {
    const context = {};
    FLAGS.forEach((f, i) => (context[f] = !!(mask & (1 << i))));
    const expected = P.decide(P.defaults, context);
    same(withModule.ruleFor(sim, 'us', context), expected, 'stashed module, hostile server data: ' + mask);
    same(bare.ruleFor(sim, 'ge', context), expected, 'no module: ' + mask);
    if (expected) decided++;
  }
  assert.ok(decided > 0 && decided < 1 << FLAGS.length, 'some situations match a rule and some do not');
  assert.equal(
    bare.ruleFor(sim, 'us', { objectiveNeutral: true, outnumbered: false }).id,
    'press-neutral',
    'a neutral objective, not outnumbered: press'
  );
  assert.equal(
    bare.ruleFor(sim, 'us', { objectiveEnemy: true, outnumbered: true }).action,
    'flank',
    'an enemy strongpoint, outnumbered: flank'
  );
  assert.equal(
    bare.ruleFor(sim, 'us', { objectiveOwned: true, underPressure: true }).action,
    'defend',
    'an owned objective under pressure: defend'
  );
  assert.equal(bare.ruleFor(sim, 'us', {}), null, 'nothing holds: no rule, the brief assaults');
});

test('control: with the genome on, Force Command decides by the genome, not the code defaults', () => {
  const root = policyRoot({ stashed: false, fetchLog: [] }),
    D = doctrineOn(root),
    sim = { scene: { metadata: { battleScenario: SCENARIO } } };
  assert.equal(D.genomeOff(), false);
  assert.equal(
    D.ruleFor(sim, 'us', { objectiveNeutral: true, outnumbered: false }).id,
    'always-hold',
    'the server genome decides'
  );
  assert.notEqual(D.policyFor(sim, 'us').cohesionRadius, D.FALLBACK.cohesionRadius);
});

test('Force Command asks the doctrine module for a rule, never the genome module around it', () => {
  assert.equal(
    /BattleAIPolicy\s*\.\s*decide/.test(read('battle/commander-ai.js')),
    false,
    'commander-ai.js decides through BattleCommanderDoctrine.ruleFor'
  );
});

test('control: with the switch flipped the same hostile inputs take effect', async () => {
  const fetchLog = [],
    root = policyRoot({ stashed: false, fetchLog }),
    P = root.BattleAIPolicy,
    sim = { scene: { metadata: { battleScenario: SCENARIO } } };
  assert.equal(P.stashed, false);
  assert.equal(P.revision, 999, 'the server revision is read');
  assert.equal(P.get().parameters.cohesionRadius, 50, 'the server genome is read');
  assert.equal(P.adaptedForScenario(SCENARIO).sources.length, 1, 'scenario memory is blended in');
  assert.notEqual(P.genomeFor(sim, 'us').parameters.cohesionRadius, P.defaults.parameters.cohesionRadius);
  P.setMatchPolicies(sim, HOSTILE, HOSTILE);
  assert.equal(sim.aiGenomes.us.parameters.cohesionRadius, 50, 'a match carries its own genome');
  assert.equal(
    P.decide(P.genomeFor(sim, 'us'), { objectiveNeutral: true }).id,
    'always-hold',
    'the match genome decides'
  );
  await P.refresh();
  await P.persist(HOSTILE, {});
  await P.remember({});
  assert.ok(fetchLog.length >= 3, 'refresh, persist and remember reach the network again');
});

(async () => {
  for (const [name, fn] of queue) {
    await fn();
    console.log('PASS ' + name);
  }
  console.log(queue.length + ' genome-gate checks passed');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
