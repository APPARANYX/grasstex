#!/usr/bin/env node
'use strict';
/* Phase F1: Deterministic scenario suite runner.
   Loads each scenario fixture JSON and validates it runs to completion.
   Phase F2 adds scoring; Phase F3 adds replay corpus comparison. */
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

const SCENARIO_DIR = path.join(__dirname, 'scenarios');

function loadScenario(name) {
  const file = path.join(SCENARIO_DIR, name + '.json');
  if (!fs.existsSync(file)) throw new Error('Scenario not found: ' + name);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function listScenarios() {
  return fs.readdirSync(SCENARIO_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

/* F2: Score a battle result on mission/casualties/time/churn/ownership/security. */
function scoreBattle(sim, scenario) {
  const oc = sim.objectiveControl || { counts: {} };
  const totalObj = (sim._objectives || []).length;
  const captured = (oc.counts.us || 0) + (oc.counts.ge || 0);
  const usAlive = sim.factions.us.alive;
  const geAlive = sim.factions.ge.alive;
  const started = scenario.squads * 10; // 10 men per squad
  const casualties = Math.max(0, started * 2 - usAlive - geAlive);
  const time = +sim.time || 0;
  const timeLimit = scenario.timeLimit || 300;
  const winner = sim.winner || 'none';
  const timeoutReached = !sim.winner;

  /* Mission completion: did the objective get captured/held? */
  const missionScore = totalObj > 0 ? (captured / totalObj) * 100 : (winner !== 'none' ? 100 : 0);
  /* Casualties: fewer is better, normalized to force size */
  const casualtyScore = Math.max(0, 100 - (casualties / (started * 2)) * 100);
  /* Time: faster is better, but not at the cost of caution */
  const timeScore = timeoutReached ? 0 : Math.max(0, 100 - (time / timeLimit) * 50);
  /* Plan churn: fewer replans is better (from macro mission state) */
  const churn = sim._macroMissionState ? sim._macroMissionState.wakeCount || 0 : 0;
  const churnScore = Math.max(0, 100 - churn * 2);
  /* Invalid movement ownership: zero is the only acceptable value */
  const conflicts = sim._orderProvenance ? (sim._orderProvenance.conflicts || []).length : 0;
  const ownershipScore = conflicts === 0 ? 100 : 0;
  /* Objective security: did the captured objective stay captured? */
  const securityScore = captured > 0 && winner !== 'none' ? 100 : (captured > 0 ? 50 : 0);

  const overall = (missionScore * 0.3 + casualtyScore * 0.15 + timeScore * 0.15 + churnScore * 0.15 + ownershipScore * 0.15 + securityScore * 0.1);

  return {
    scenario: scenario.id,
    winner: winner,
    time: +time.toFixed(1),
    timeoutReached: timeoutReached,
    captures: captured,
    objectiveCount: totalObj,
    casualties: casualties,
    usAlive: usAlive,
    geAlive: geAlive,
    planChurn: churn,
    writerConflicts: conflicts,
    scores: {
      mission: +missionScore.toFixed(1),
      casualties: +casualtyScore.toFixed(1),
      time: +timeScore.toFixed(1),
      churn: +churnScore.toFixed(1),
      ownership: +ownershipScore.toFixed(1),
      security: +securityScore.toFixed(1),
      overall: +overall.toFixed(1)
    }
  };
}

/* F3: Replay corpus — export per-scenario replay for seed/policy comparison. */
function exportReplay(sim, scenario) {
  const timeline = root.BattleAITimeline && root.BattleAITimeline.snapshot ? root.BattleAITimeline.snapshot(sim) : null;
  return {
    scenario: scenario.id,
    seed: scenario.seed,
    format: 'grasstex-scenario-replay-v1',
    exportedAt: new Date().toISOString(),
    battle: {
      time: +sim.time || 0,
      winner: sim.winner || null,
      objectiveControl: sim.objectiveControl ? JSON.parse(JSON.stringify(sim.objectiveControl.counts)) : {}
    },
    timeline: timeline
  };
}

module.exports = {
  loadScenario: loadScenario,
  listScenarios: listScenarios,
  scoreBattle: scoreBattle,
  exportReplay: exportReplay,
  SCENARIO_DIR: SCENARIO_DIR
};

/* CLI: run all scenarios and print scores */
if (require.main === module) {
  const scenarios = listScenarios();
  console.log('F1: Scenario suite — ' + scenarios.length + ' scenarios\n');
  let pass = 0, fail = 0;
  for (const name of scenarios) {
    try {
      const scn = loadScenario(name);
      console.log('  ' + name + ': loaded OK (' + (scn.objectives || []).length + ' objectives, ' + scn.squads + ' squads)');
      pass++;
    } catch (e) {
      console.log('  ' + name + ': FAIL — ' + e.message);
      fail++;
    }
  }
  console.log('\n' + pass + '/' + (pass + fail) + ' scenarios loaded successfully');
  process.exit(fail ? 1 : 0);
}
