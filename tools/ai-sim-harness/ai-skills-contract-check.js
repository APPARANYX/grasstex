#!/usr/bin/env node
'use strict';
// PR A: execute the existing reader boundary before adding any skill runtime.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');
const root = H.bootstrap();
const battle = H.makeBattle(root, { seed: 602 });
battle.time = 10;
let truthReads = 0;
const hostile = Object.defineProperty({}, 'root', {
  get() {
    truthReads++;
    throw new Error('A fact reader must not consult hostile transforms');
  }
});
const soldier = {
  id: '602',
  _beliefs: {
    byKey: {
      known: {
        key: 'known',
        targetId: 'enemy',
        unit: hostile,
        source: 'told',
        sourceSoldierId: '601',
        x: 4,
        z: 6,
        observedAt: 8,
        receivedAt: 9,
        expiresAt: 20,
        baseConfidence: 0.8,
        combatThreat: true
      }
    },
    history: []
  }
};
const before = JSON.stringify(soldier);
const facts = root.SquadAI.beliefSnapshot(soldier, battle);
assert.equal(truthReads, 0);
assert.equal(JSON.stringify(soldier), before, 'belief snapshot must not update a selection cache');
assert.equal(facts.beliefs[0].observedAt, 8);
assert.equal(facts.beliefs[0].source, 'told');
assert.equal(facts.beliefs[0].unit, undefined);
facts.beliefs[0].location.x = 999;
assert.equal(soldier._beliefs.byKey.known.x, 4, 'fact coordinates are detached');
const empty = { id: 'empty' };
root.SquadAI.beliefSnapshot(empty, battle);
assert.equal(empty._beliefs, undefined, 'an observer does not initialize belief stores');
// Pending personal receipt is projected at time without settling authoritative state.
battle._commandReception = {
  bySoldier: {
    '602': {
      'movement|soldier:602': {
        envelopeId: '602-order',
        phase: 'sent',
        unreachable: false,
        receiveAt: 1,
        attendAt: 2,
        processAt: 3,
        adoptAt: 4,
        data: { missionVersion: 7 },
        point: { x: 4, z: 6 }
      }
    }
  }
};
const receiptBefore = JSON.stringify(battle._commandReception);
const receipt = root.BattleCommandReception.peek(soldier, battle, 'movement', 'soldier:602');
assert.equal(receipt.phase, 'adopted');
assert.equal(receipt.data.missionVersion, 7);
receipt.data.missionVersion = 88;
assert.equal(JSON.stringify(battle._commandReception), receiptBefore, 'peek cannot settle or mutate receipt');
const repo = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(repo, file), 'utf8');
for (const file of ['battle_sim.php', 'battle_sim_local.php']) {
  const source = read(file);
  assert.ok(source.indexOf("'squad-ai.js'") < source.indexOf("'engagement.js'"));
  assert.match(source, /grasstex_runtime_modules\(/);
}
const core = read('battle/battle-sim.js');
for (const hook of ['beforeBattleRestart', 'afterBattleRosterReset', 'afterBattleRestartComplete'])
  assert.ok(core.includes("runHook('" + hook + "'"), 'canonical core lifecycle: ' + hook);
console.log(
  'PASS AI skills foundation: detached perceived facts, no hostile truth, receipt read neutrality, canonical loaders/lifecycle'
);
