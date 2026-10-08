#!/usr/bin/env node
'use strict';

/* Investigation evidence for issue #361, not a CI acceptance gate.
   This audit asserts the observed baseline defects so its JSON is reviewable and reproducible.
   It loads shipping command, station, resolver, navigation and movement integration code. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

function bootstrap() {
  H.resetIds();
  return H.bootstrap({ search: '?log=0' });
}
function load(root, rel) {
  const source = fs.readFileSync(path.join(H.REPO, rel), 'utf8');
  new Function('window', 'globalThis', 'console', 'BABYLON', 'location', source)(
    root,
    root,
    console,
    root.BABYLON,
    root.location
  );
}
function newlyEligibleRecipient() {
  const r = bootstrap();
  const b = H.makeBattle(r);
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 80 }
  });
  const man = q.members[3];
  const CR = r.BattleCommandReception;
  const scope = 'soldier:' + man.id;
  q.commandPhase = 'defend';
  man.isPlayer = true;
  r.BattleSquadStability.updateFireteams(q, b);
  const command = CR.squadSnapshot(q, b).find(envelope => envelope.scope === scope);
  assert.ok(command, 'the shipping Meso publisher creates the personal movement envelope');
  assert.deepEqual(command.recipients, []);
  man.isPlayer = false;
  b.time = 10;
  r.BattleSquadStability.updateFireteams(q, b);
  const replay = CR.squadSnapshot(q, b).find(envelope => envelope.scope === scope);
  const receipt = CR.snapshot(man, b).records['movement|' + scope] || null;
  const adopted = CR.adopted(man, b, 'movement', scope);
  assert.equal(replay.id, command.id, 'the unchanged command is coalesced');
  assert.equal(receipt, null, 'newly eligible recipient is never added to the envelope');
  assert.equal(adopted, null);
  return {
    soldier: man.id,
    command: command.id,
    at: b.time,
    recipientEligibleNow: !man.dead && !man.isPlayer,
    envelopeRecipients: replay.recipients,
    receipt,
    adopted,
    personalDestination: man._fireteamDestination || null,
    defect: 'Unchanged-envelope coalescing does not reconcile newly eligible recipients.'
  };
}
function reconAgainstClaimedPost() {
  const r = bootstrap();
  load(r, 'battle/battle-navigation.js');
  load(r, 'battle/movement-resolver.js');
  load(r, 'battle/modules/20-building-hardpoints.js');
  load(r, 'battle/modules/39-navigation-physicality-debug.js');
  load(r, 'battle/modules/52-survival-tactical-route.js');
  const b = H.makeBattle(r);
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: -14,
    objective: { x: 0, z: 0 },
    composition: ['sergeant', 'scout', 'rifleman', 'rifleman', 'rifleman']
  });
  const scenario = {
    buildings: [
      {
        id: 'room',
        x: 0,
        z: 0,
        w: 12,
        d: 12,
        rot: 0,
        openings: [
          { id: 'rear', type: 'door', side: 'south', offset: 0, width: 2 },
          { id: 'window', type: 'window', side: 'north', offset: 0, width: 1.25, bottom: 0.92, top: 2.08 }
        ]
      }
    ]
  };
  b.scene = { metadata: { battleScenario: scenario } };
  r.__battle__ = b;
  r.BattleNavigation.installScenario(scenario);
  q.commandPhase = 'defend';
  q.targetObjective = 'house';
  q.state = 'advance';
  q.inContact = false;
  q.members.forEach(man => {
    man._engagementTask = 'hold-left';
  });
  const S = r.BattleSquadStability;
  const P = r.BattleTacticalPositions;
  const M = r.BattleMovementResolver;
  const scouts = S.selectReconScouts(q, b);
  const man = scouts.find(s => s.role === 'rifleman');
  assert.ok(man, 'selection uses a rifleman as the scout buddy');
  const station = r.BattleNavigation.firingStations[0];
  Object.assign(man.root.position, { x: station.x, z: station.z });
  const assignment = P.claim(man, b, station, { x: 0, z: 40 });
  assert.ok(assignment, 'the shipping manager claims a real window');
  P.update(man, b);
  assert.ok(assignment.occupiedAt != null);
  const start = { x: man.root.position.x, z: man.root.position.z };
  const candidate = {
    signature: 'audit-recon',
    reason: 'unknown-approach',
    from: { x: 0, z: -14 },
    goal: { x: 0, z: 100 },
    point: { x: 0, z: 35 },
    axis: { x: 0, z: 1 },
    goalDistance: 114
  };
  assert.equal(S.startRecon(q, b, candidate), true);
  const task = q._reconTask;
  assert.ok(task.scoutIds.includes(man.id));
  const dt = 0.15;
  let stationWins = 0;
  let maxDisplacement = 0;
  let receipt = null;
  while (b.time <= task.until + dt) {
    b.time += dt;
    S.updateFireteams(q, b);
    for (const soldier of q.members) {
      r.SquadAI.updateSoldier(soldier, b);
      M.resolve(soldier, b);
      H.stepMovement(b, soldier, dt);
    }
    if (M.resolve(man, b).kind === 'firing-station') stationWins++;
    maxDisplacement = Math.max(
      maxDisplacement,
      Math.hypot(man.root.position.x - start.x, man.root.position.z - start.z)
    );
    receipt = r.BattleCommandReception.snapshot(man, b).records['movement|soldier:' + man.id];
    S.updateRecon(q, b, { underFire: 0, contactStarted: false });
    if (!q._reconTask) break;
  }
  assert.equal(q._reconLast.reason, 'timeout');
  assert.equal(P.current(man), assignment, 'station reservation survives the Meso recon command');
  assert.equal(man._engagementTask, null, 'recon invalidates its transient task at timeout');
  assert.equal(receipt.action, 'recon');
  assert.equal(receipt.phase, 'adopted');
  assert.ok(maxDisplacement < 0.01, 'the selected scout physically remains at his old station');
  assert.ok(
    Math.hypot(man._fireteamDestination.x - start.x, man._fireteamDestination.z - start.z) > 25,
    'his personally adopted recon destination is materially different'
  );
  return {
    flags: {
      commandMovement: r.BattleCommandReception.movementEnabled(),
      commandRelay: r.BattleCommandReception.relayEnabled()
    },
    selected: scouts.map(s => ({ id: s.id, role: s.role })),
    soldier: man.id,
    occupiedStation: station.id,
    stationStart: start,
    personalReconDestination: man._fireteamDestination,
    receipt: {
      command: receipt.envelopeId,
      action: receipt.action,
      phase: receipt.phase,
      adoptedAt: receipt.adoptedAt
    },
    winningAuthority: M.resolve(man, b).owner,
    winningKind: M.resolve(man, b).kind,
    stationWins,
    simulatedSeconds: +b.time.toFixed(2),
    maxDisplacement,
    reconEnd: q._reconLast.reason,
    stationRetained: P.current(man) === assignment,
    defect: 'A selected scout adopts recon but the prior positional reservation wins until recon times out.'
  };
}

console.log(
  JSON.stringify(
    {
      purpose:
        'Verified downstream lifecycle gaps for architectural audit #361; baseline evidence, not a regression gate.',
      newlyEligibleRecipient: newlyEligibleRecipient(),
      reconAgainstClaimedPost: reconAgainstClaimedPost()
    },
    null,
    2
  )
);
