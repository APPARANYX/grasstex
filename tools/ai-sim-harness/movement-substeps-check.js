'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../../battle/battle-sim.js'), 'utf8');
const start = source.search(/BattleSim\.prototype\._frame\s*=/);
const end = source.indexOf('BattleSim.prototype.step', start);
assert.ok(start >= 0 && end > start, 'load shipping movement-frame code');
const frameSource = source.slice(start, end);
const moves = [];
const calls = { squad: 0, soldier: 0, hook: 0, winner: 0, update: 0 };
const SquadAI = {
  updateSquad() {
    calls.squad++;
  },
  updateSoldier() {
    calls.soldier++;
  }
};
const root = {
  BattleModules: {
    runHook(name, sim, detail) {
      assert.equal(name, 'onSimulationStep');
      assert.ok(detail.dt > 0);
      calls.hook++;
    }
  }
};
const BattleSim = function () {};
const move = (sim, soldier, dt) => {
  moves.push({ name: soldier.name, time: sim.time, dt });
};
new Function('BattleSim', 'root', 'SquadAI', 'AI_TICK', 'stepMovement', frameSource)(
  BattleSim,
  root,
  SquadAI,
  0.15,
  move
);
assert.equal(typeof BattleSim.prototype._frame, 'function');

function simulate(parts, dt = 0.15) {
  moves.length = 0;
  for (const key of Object.keys(calls)) calls[key] = 0;
  const battle = new BattleSim();
  battle.time = 0;
  battle.paused = false;
  battle.winner = null;
  battle.timeScale = 1;
  battle._aiAccum = 0;
  battle._movementSubsteps = parts;
  battle._roster = { us: [{ name: 'us' }], ge: [{ name: 'ge' }] };
  battle.factions = {
    us: { squads: [1] },
    ge: { squads: [1] }
  };
  battle._checkWinner = () => {
    calls.winner++;
  };
  battle.onUpdate = () => {
    calls.update++;
  };
  battle._frame(dt);
  return { battle, moves: moves.slice(), calls: { ...calls } };
}

const baseline = simulate(1);
assert.deepEqual(
  baseline.moves.map(m => [m.name, m.time, m.dt]),
  [
    ['us', 0.15, 0.15],
    ['ge', 0.15, 0.15]
  ]
);
assert.deepEqual(baseline.calls, { squad: 2, soldier: 2, hook: 1, winner: 1, update: 1 });
for (const parts of [2, 3]) {
  const run = simulate(parts);
  assert.equal(run.moves.length, 2 * parts);
  for (let pass = 0; pass < parts; pass++) {
    const records = run.moves.slice(pass * 2, pass * 2 + 2);
    assert.deepEqual(
      records.map(x => x.name),
      ['us', 'ge'],
      'both sides advance together'
    );
    for (const record of records) {
      assert.ok(Math.abs(record.time - ((pass + 1) * 0.15) / parts) < 1e-10);
      assert.ok(Math.abs(record.dt - 0.15 / parts) < 1e-10);
    }
  }
  assert.equal(run.battle.time, 0.15, 'AI tick ends at original simulated time');
  assert.deepEqual(run.calls, baseline.calls, 'no extra AI, victory, or module callbacks');
}
const nonCanonical = simulate(3, 0.2);
assert.equal(nonCanonical.moves.length, 2, 'non-canonical manual step preserves old behavior');

const paused = new BattleSim();
paused.paused = true;
paused._frame(0.15);
assert.equal(paused.time, undefined, 'paused battle does not advance');

console.log('PASS movement substeps: 0.15/0.075/0.05s precision, cross-faction cadence, AI invariance');
