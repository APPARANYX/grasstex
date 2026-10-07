#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');

function loadLoopWatch(r) {
  new Function(
    'window',
    'globalThis',
    'console',
    fs.readFileSync(path.join(H.REPO, 'battle/modules/32-ai-loop-watch.js'), 'utf8')
  )(r, r, { log() {}, warn() {} });
}

function world() {
  H.resetIds();
  const r = H.bootstrap({ search: '?stressAct=0&commandPosture=0' });
  loadLoopWatch(r);
  const b = H.makeBattle(r, { seed: 404 });
  const us = H.addSquad(r, b, {
    id: 'us-loop',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 100 },
    facing: 0
  });
  b.factions.ge.squads = [];
  r.BattleAILoopWatch.clear(b);
  return { r, b, us };
}

function reproduce(period) {
  const w = world(),
    phases = Array.from({ length: period }, (_, i) => 'phase-' + i);
  for (let i = 0; i < period * 3; i++) {
    w.b.time = i + 1;
    w.us.commandPhase = phases[i % period];
    w.us._lastDoctrineRule = 'rule-' + (i % period);
    w.r.BattleAILoopWatch.sample(w.b);
  }
  return w.r.BattleAILoopWatch.alerts(w.b).filter(a => a.kind === 'decision-cycle');
}

[4, 5].forEach(period => {
  const alerts = reproduce(period);
  assert.ok(alerts.length >= 1, period + '-step command loop is detected');
  assert.equal(alerts[0].message, 'Repeating ' + period + '-step command cycle with little progress');
});

console.log('PASS Loop Watch detects four- and five-step command cycles');
