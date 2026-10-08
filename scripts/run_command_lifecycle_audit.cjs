#!/usr/bin/env node
'use strict';
/* Controlled command audit, not a benchmark arm. One deterministic seed; synthetic ridge;
   shipping objective, Macro/Meso/Micro, receipt, resolver, navigation and movement code.
   Render-only hooks are omitted. Capture security expires through its real owner, never by
   manually clearing a prepared-defense obligation. GRASSTEX_SOURCE_ROOT selects a checkout. */
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const sourceRoot = process.env.GRASSTEX_SOURCE_ROOT || path.resolve(__dirname, '..');
const H = require(path.join(sourceRoot, 'tools/ai-sim-harness/harness.js'));
const variants = (
  process.env.COMMAND_AUDIT_VARIANTS ||
  'scouts-alive,scouts-dead,three-men,prepared-garrison,secured-defender,blocked-recon,doctrine-defend'
).split(',');
const seconds = Math.max(420.5, +process.env.COMMAND_AUDIT_SECONDS || 425);
const errors = [];
const quiet = {
  log() {},
  warn() {},
  error(...a) {
    errors.push(a.map(String).join(' '));
  }
};
function load(r, rel, base = sourceRoot) {
  new Function(
    'window',
    'globalThis',
    'console',
    'location',
    'BABYLON',
    fs.readFileSync(path.join(base, rel), 'utf8')
  )(r, r, quiet, r.location, undefined);
}
function centroid(q) {
  const men = q.members.filter(s => !s.dead);
  return men.length
    ? men.reduce(
        (p, s) => ({ x: p.x + s.root.position.x / men.length, z: p.z + s.root.position.z / men.length }),
        { x: 0, z: 0 }
      )
    : null;
}
function ridge(x, z) {
  return 28 * Math.exp(-Math.pow(z / 45, 2));
}
function world(variant) {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: '?log=0' });
  r.BattleTelemetry = { record() {} };
  r.BattleSim = { start() {} };
  const files = [
    'module-registry.js',
    'battle-navigation.js',
    'commander-doctrine.js',
    'commander-routes.js',
    'commander-ai.js',
    'movement-resolver.js',
    'modules/01-capture-zone.js',
    'modules/08-soldier-events.js',
    'modules/09-tactical-callouts.js',
    'modules/10-soldier-stats.js',
    'modules/14-wound-model.js',
    ...fs
      .readdirSync(path.join(sourceRoot, 'battle/modules'))
      .filter(n => /^15[a-m]-/.test(n))
      .map(n => 'modules/' + n),
    'modules/16-squad-plan-stability.js',
    'modules/17-soldier-mind.js',
    'modules/18-command-reception.js',
    'modules/20-building-hardpoints.js',
    'modules/22-commander-reconstitution.js',
    'modules/22a-commander-strategic-recovery.js',
    'modules/39-navigation-physicality-debug.js',
    'modules/40-ai-coordination-health.js',
    'modules/44-combat-urgency.js',
    'modules/45-stance-transition-crawl.js',
    'modules/46-ammunition-stoppages.js',
    'modules/47-sidearm-switch.js',
    'modules/49-squad-broadcast.js',
    'modules/51-soldier-personal-space.js',
    'modules/52-survival-tactical-route.js',
    'objective-system.js'
  ];
  files.forEach(p => load(r, 'battle/' + p));
  // Deliberately controlled doctrine decision, not evidence that live default doctrine picked it.
  // The real Macro issuer/execution paths consume this permitted result unchanged.
  if (variant === 'doctrine-defend')
    r.BattleCommanderDoctrine.ruleFor = () => ({ id: 'audit-controlled-defend', action: 'defend' });
  const b = H.makeBattle(r, { seed: 57193, heightAt: ridge });
  r.__battle__ = b;
  b.macroCommandEnabled = true;
  const town = {
    id: 'controlled-hill',
    seed: 'command-audit-57193',
    center: { x: 0, z: 0 },
    radius: 20,
    buildings: [],
    streets: []
  };
  // Real sealed-building navigation geometry straddles each scout goal. An impossible observation
  // point lets production recon classify timeout rather than pretending publication caused arrival.
  if (variant === 'blocked-recon')
    town.buildings = [-52.5, 52.5].map((z, i) => ({
      id: 'recon-block-' + i,
      x: 0,
      z,
      w: 120,
      d: 16,
      rot: 0,
      openings: []
    }));
  if (variant === 'doctrine-defend')
    town.buildings = ['us', 'ge'].flatMap(side =>
      Array.from({ length: 10 }, (_, slot) => ({
        id: side + '-blocked-' + slot,
        x: ((slot % 5) - 2) * 2.5,
        z: (side === 'us' ? -100 : 100) + (Math.floor(slot / 5) - 1) * 2.5,
        w: 1.4,
        d: 1.4,
        rot: 0,
        openings: []
      }))
    );
  b.scene = { metadata: { battleScenario: town } };
  r.BattleNavigation.installScenario(town);
  const definitions = ['us', 'ge'].map(side => ({
    id: side + '-home',
    type: 'capture-zone',
    x: 0,
    z: side === 'us' ? -100 : 100,
    radius: 30,
    initialOwner: side,
    value: 1
  }));
  r.BattleObjectiveSystem.attach(b, definitions, { town });
  for (const side of ['us', 'ge']) {
    const z = side === 'us' ? -100 : 100;
    const q = H.addSquad(r, b, {
      id: side + '-def',
      faction: side,
      x: 0,
      z,
      objective: { x: 0, z },
      facing: side === 'us' ? 0 : Math.PI,
      composition: variant === 'three-men' ? ['sergeant', 'rifleman', 'rifleman'] : undefined
    });
    q.commandRole = 'center';
    q.route = [{ x: 0, z }];
    q.commandPhase = 'defend';
    if (variant === 'scouts-dead') q.members.filter(s => s.role === 'scout').forEach(s => b.killSoldier(s));
    if (variant === 'prepared-garrison')
      q._preparedDefenseRequest = { objectiveId: side + '-home', point: { x: 0, z } };
    else if (variant === 'secured-defender') {
      // Equivalent to the existing capture-zone owner after taking its local objective.
      r.BattleLeases.grant(
        q,
        'objective-security',
        'capture-zone',
        0,
        18,
        'securing captured ' + side + '-home',
        'expiry with no enemy'
      );
      q._captureZoneDefenseRequest = {
        objectiveId: side + '-home',
        point: { x: 0, z },
        anchor: centroid(q),
        requestedAt: 0,
        reason: 'securing captured objective'
      };
    }
  }
  r.BattleModules.runHook('onBattleStart', b, { town });
  // Install shipping victory accounting too: a defeated fixture stops where a real battle stops.
  // This mirrors harness.js's shipping-function extraction for stepMovement.
  const battleSource = fs.readFileSync(path.join(sourceRoot, 'battle/battle-sim.js'), 'utf8');
  const stockCheck = battleSource.match(/BattleSim\.prototype\._checkWinner=(function\(\)\{[^\n]+\});/);
  assert.ok(stockCheck, 'shipping base victory function must be found');
  b._checkWinner = new Function('return ' + stockCheck[1])();
  b.timeLimit = seconds;
  const commanderSource = fs.readFileSync(path.join(sourceRoot, 'battle/commander-ai.js'), 'utf8');
  const declaration = commanderSource.slice(
    commanderSource.indexOf('  function declare('),
    commanderSource.indexOf('  function macroEnabled(')
  );
  const victory = commanderSource.slice(
    commanderSource.indexOf('  function installVictory('),
    commanderSource.indexOf('  root.BattleSim.start = function')
  );
  new Function('D', 'root', 'telemetry', declaration + victory + 'return installVictory;')(
    r.BattleCommanderDoctrine,
    r,
    () => {}
  )(b);
  // An ordinary standing defense brief models earlier justified defense whose pressure has ended.
  // Use Macro's real issuer; no lifecycle stamps or receipt/acceptance are faked. A prepared
  // garrison remains pinned by its actual request, and a just-secured zone uses real security expiry.
  if (variant !== 'prepared-garrison' && variant !== 'secured-defender') {
    const issue = r._commanderRecoveryCtx().issueMission;
    for (const side of ['us', 'ge']) {
      const q = b.factions[side].squads[0],
        p = { x: 0, z: side === 'us' ? -100 : 100 };
      issue(
        b,
        q,
        {
          intent: 'defend',
          action: 'defend',
          objectiveId: side + '-home',
          point: p,
          role: 'center',
          route: []
        },
        'audit-standing-defense'
      );
    }
  }
  load(r, 'scripts/probes/command-lifecycle.js', path.resolve(__dirname, '..'));
  const observer = r.BattleProbes['command-lifecycle'];
  observer.start(b);
  return { r, b, town, observer };
}
function run(variant) {
  const startErrors = errors.length,
    w = world(variant);
  const a = w.b._roster.us.find(s => !s.dead),
    z = w.b._roster.ge.find(s => !s.dead);
  const initialVisible = w.r.SquadAI.hasLineOfSight(a, z, w.b.heightAt, w.b.obstacles);
  assert.equal(initialVisible, false, 'controlled hill must initially block real terrain LOS');
  let acc = 0;
  while (!w.b.winner && w.b.time < seconds)
    H.run(w.r, w.b, H.AI_TICK, () => {
      w.b._checkWinner();
      w.r.BattleModules.runHook('onSimulationStep', w.b, { dt: H.AI_TICK });
      acc += H.AI_TICK;
      if (!w.b.winner && acc + 1e-9 >= w.r.BattleCommanderAI.commandTick) {
        acc -= w.r.BattleCommanderAI.commandTick;
        w.r.BattleCommanderAI.update(w.b, w.town, w.r.BattleCommanderAI.commandTick);
      }
      w.observer.sample(w.b);
    });
  const report = w.observer.report(w.b);
  assert.deepEqual(
    report.checkpoints.map(c => c.checkpoint),
    [0, 120, 180, 240, 300, 420].filter(t => t <= w.b.time),
    'audit must capture every reached checkpoint'
  );
  report.missingCheckpoints = [0, 120, 180, 240, 300, 420].filter(t => t > w.b.time);
  assert.ok(
    report.transitions.some(t => t.status === 'executing'),
    'real Meso must accept a Macro brief'
  );
  assert.ok(
    report.checkpoints[1].squads.some(q => q.men.some(s => s.receipt && s.adopted && s.resolver)),
    'command chain must reach receipt, adoption and arbitration'
  );
  return {
    variant,
    seed: 57193,
    initialVisible,
    winner: w.b.winner,
    endTime: w.b.time,
    controlledOverrides:
      variant === 'doctrine-defend'
        ? [
            'permitted doctrine always returns DEFEND',
            'each soldier enclosed in real sealed-building navigation geometry'
          ]
        : [],
    errors: errors.slice(startErrors),
    report
  };
}
const results = variants.map(run);
const output = {
  sourceRoot,
  caveat:
    'Synthetic deterministic hill; shipping AI, LOS, objective/security, navigation and physical movement. Render-only hooks omitted. No hidden enemy knowledge injected.',
  results
};
const outputPath = process.env.COMMAND_AUDIT_OUTPUT;
if (outputPath) fs.writeFileSync(outputPath, JSON.stringify(output, null, 1) + '\n');
for (const r of results) {
  console.log(
    JSON.stringify({
      variant: r.variant,
      initialVisible: r.initialVisible,
      errors: r.errors,
      winner: r.winner,
      endTime: r.endTime,
      missingCheckpoints: r.report.missingCheckpoints,
      checkpoints: r.report.checkpoints.map(c => ({
        t: c.checkpoint,
        squads: c.squads.map(q => ({
          id: q.id,
          intent: q.mission && q.mission.intent,
          version: q.mission && q.mission.version,
          phase: q.phase,
          living: q.living,
          displacement: +q.displacement.toFixed(2),
          contact: !!q.contact,
          recon: !!q.recon,
          livingMenTravel: +q.men.reduce((n, s) => n + s.travel, 0).toFixed(2)
        }))
      })),
      recon: r.report.recon
    })
  );
}
if (errors.length) process.exitCode = 1;
