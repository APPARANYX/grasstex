#!/usr/bin/env node
'use strict';
/* Phase 1: a single Squad Leader phase writer, with unchanged setup/regroup silence and
   same-phase mission semantics. Mutations are exercised in memory; no runtime file is patched. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');
const OWNER = 'modules/16-squad-plan-stability.js';
const SOURCE = fs.readFileSync(path.join(H.REPO, 'battle', OWNER), 'utf8');
const PHASES = [
  'approach',
  'assault',
  'capture',
  'clear-town',
  'corner-check',
  'defend',
  'flank',
  'hold',
  'regroup',
  'reserve',
  'support-hold'
];
function fixture(source = SOURCE) {
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
    systems = {},
    events = [];
  r.BattleModules = {
    registerSystem(id, value) {
      systems[id] = value;
    }
  };
  r.BattleCommanderDoctrine = {
    policyFor() {
      return { cohesionRadius: 34, captainlessCohesion: 26 };
    }
  };
  r.BattleTelemetry = {
    record(type, data) {
      events.push({ type, data });
    }
  };
  new Function('window', 'globalThis', 'console', source)(r, r, { log() {} });
  const b = H.makeBattle(r, { seed: +(process.env.HARNESS_SEED || 12345) });
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  return { r, b, q, events, leader: systems['squad-command'], S: r.BattleSquadStability };
}
function ownership(overrides = {}) {
  const dir = path.join(H.REPO, 'battle');
  const files = fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.js'))
    .concat(
      fs
        .readdirSync(path.join(dir, 'modules'))
        .filter(f => f.endsWith('.js'))
        .map(f => 'modules/' + f)
    );
  const offenders = [];
  for (const file of files) {
    let source = overrides[file] ?? fs.readFileSync(path.join(dir, file), 'utf8');
    source = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    if (file === OWNER) {
      const start = source.indexOf('  function transitionPhase(');
      assert.ok(start >= 0, 'Squad Leader exposes the one phase transition implementation');
      const end = source.indexOf('\n  function ', start + 1);
      const writer = source.slice(start, end);
      assert.equal(
        (writer.match(/\.commandPhase\s*=(?!=)/g) || []).length,
        1,
        'one assignment in transitionPhase'
      );
      source = source.slice(0, start) + source.slice(end);
    } else if (file === 'commander-routes.js' || file === 'modules/21-defender-engineers.js') {
      /* The existing missing-owner setup fallbacks are documented exceptions, not live writers. */
      const fallback =
        file === 'commander-routes.js'
          ? 'if (root.BattleSquadStability) root.BattleSquadStability.initialPhase(sq, phase);\n    else sq.commandPhase = phase;'
          : "if (root.BattleSquadStability) root.BattleSquadStability.initialPhase(sq, 'defend');\n      else sq.commandPhase = 'defend';";
      assert.ok(source.includes(fallback), file + ': setup fallback remains guarded by the owner');
      source = source.replace(fallback, '');
    }
    if (/(?:\.commandPhase|\[\s*['"]commandPhase['"]\s*\])\s*(?:=(?!=)|\+=|\?\?=|\|\|=|&&=)/.test(source))
      offenders.push(file);
  }
  assert.deepEqual(offenders, [], 'commandPhase written outside its single owner transition');
}
function semantics(source = SOURCE) {
  const { S, b, q, events, leader, r } = fixture(source);
  assert.equal(typeof S.transitionPhase, 'function', 'Squad Leader owns one explicit transition API');
  assert.deepEqual(Object.keys(S.states).sort(), PHASES);
  for (const [name, def] of Object.entries(S.states)) {
    for (const key of ['meaning', 'enteredBy', 'exits', 'rate', 'next'])
      assert.ok(def[key], name + ': ' + key);
    assert.deepEqual(def.next.slice().sort(), PHASES, 'new missions can replace any phase');
  }
  S.initialPhase(q, 'approach');
  assert.equal(q.commandPhase, 'approach');
  assert.deepEqual(q._commandPhaseTransition, {
    from: null,
    to: 'approach',
    at: null,
    reason: 'initial placement',
    entry: 'setup'
  });
  assert.equal(events.length, 0, 'setup is silent');
  b.time = 7;
  S.transitionPhase(b, q, 'assault', 'mission test');
  assert.deepEqual(q._commandPhaseTransition, {
    from: 'approach',
    to: 'assault',
    at: 7,
    reason: 'mission test',
    entry: 'mission'
  });
  assert.deepEqual(events, [
    { type: 'decision-phase', data: { faction: 'us', squad: 'us-0', phase: 'assault', why: 'mission test' } }
  ]);
  const prior = q._commandPhaseTransition;
  b.time = 9;
  S.transitionPhase(b, q, 'assault', 'repeated mission');
  assert.strictEqual(q._commandPhaseTransition, prior, 'same phase neither renews provenance nor telemetry');
  assert.equal(events.length, 1);
  assert.throws(() => S.transitionPhase(b, q, 'invented', 'bad'), /phase|transition/i);
  assert.equal(q.commandPhase, 'assault');
  // Exercise mission execution itself, not only the public transition API.
  q.route = [{ x: 0, z: 100 }];
  q.routeIndex = 0;
  q.commandRole = 'reserve';
  S.executeMission(b, q, null);
  assert.equal(q.commandPhase, 'reserve');
  assert.equal(q._commandPhaseTransition.reason, 'holding reserve');
  assert.equal(events.at(-1).type, 'decision-phase');
  // A dispersed squad enters and maintains regroup without decision-phase events.
  q.commandRole = 'center';
  q.route = [];
  q.members.forEach((s, i) => {
    s.root.position.x = (i % 2 ? -1 : 1) * (20 + i * 6);
    s.root.position.z = (i % 3) * 25;
  });
  const phases = events.filter(e => e.type === 'decision-phase').length;
  for (let i = 0; i < 8 && !r.BattleLeases.get(q, 'regroup'); i++) {
    b.time += 0.45;
    leader.onCommanderTick(b, { town: null });
  }
  assert.ok(r.BattleLeases.get(q, 'regroup'));
  assert.equal(q.commandPhase, 'regroup');
  assert.equal(q._commandPhaseTransition.entry, 'regroup');
  assert.ok(events.some(e => e.type === 'decision-regroup-commit'));
  const regroupRecord = q._commandPhaseTransition;
  b.time += 0.45;
  leader.onCommanderTick(b, { town: null });
  assert.strictEqual(q._commandPhaseTransition, regroupRecord);
  assert.equal(events.filter(e => e.type === 'decision-phase').length, phases, 'regroup remains silent');
}
semantics();
ownership();
for (const assignment of ["q.commandPhase = 'hold';", "q['commandPhase'] = 'hold';"])
  assert.throws(
    () => ownership({ 'commander-doctrine.js': assignment }),
    /single owner transition/,
    'external writer mutation rejected'
  );
assert.throws(
  () => ownership({ [OWNER]: SOURCE + "\nq.commandPhase = 'hold';" }),
  /single owner transition/,
  'second owner-site mutation rejected'
);
const sameMutation = SOURCE.replace('if (!sq || sq.commandPhase === next) return;', 'if (!sq) return;');
assert.notEqual(sameMutation, SOURCE, 'same-state mutation applied');
assert.throws(
  () => semantics(sameMutation),
  /same phase|renew|telemetry/,
  'same-state churn mutation rejected'
);
const silentMutation = SOURCE.replace("if (entry === 'mission')", 'if (true)');
assert.notEqual(silentMutation, SOURCE, 'silent-entry mutation applied');
assert.throws(() => semantics(silentMutation), /silent/, 'setup telemetry mutation rejected');
console.log(
  'PASS Squad Leader phase data, single writer, legacy telemetry/no-op semantics and five mutation controls'
);
