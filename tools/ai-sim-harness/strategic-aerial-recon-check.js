#!/usr/bin/env node
'use strict';
/* Recon must be one-shot, strategic-only, uncertain, expiring and faction-local.
   No test grants firing rights or changes an actor's orders. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function make(search = '?strategicInterception=1&aerialRecon=1', profile = 'strategic') {
  const hooks = {};
  const events = [];
  const root = {
    location: { search },
    GTLog() {},
    BattleModules: { registerSystem: (name, api) => (hooks[name] = api) },
    BattleTelemetry: { record: (type, payload) => events.push({ type, payload }) }
  };
  const source = fs.readFileSync(
    path.join(__dirname, '../../battle/modules/59-strategic-aerial-recon.js'),
    'utf8'
  );
  new Function('window', 'globalThis', 'console', source)(root, root, console);
  function squad(id, faction, z, opts = {}) {
    const members = Array.from({ length: 10 }, (_, i) => ({
      dead: false,
      moving: opts.moving !== false,
      moveSpeed: opts.speed == null ? 2 : opts.speed,
      root: { position: { x: (i % 2) * 2, z: z + i / 10 }, rotation: { y: opts.heading || 0 } }
    }));
    return {
      id,
      faction,
      members,
      state: 'advance',
      commandPhase: opts.phase || 'approach',
      _macroMission: { owner: 'force-command', status: 'executing', intent: 'capture' },
      ...(opts.hidden ? { hidden: true } : {})
    };
  }
  const us = squad('us-0', 'us', -1000);
  const ge = squad('ge-0', 'ge', 1000);
  const geHidden = squad('ge-hidden', 'ge', 800, { hidden: true });
  const geAmbush = squad('ge-ambush', 'ge', 900, { phase: 'ambush' });
  const geHomeWrongSide = squad('ge-crossed', 'ge', -300);
  const geStill = squad('ge-stationary', 'ge', 700, { moving: false });
  const sim = {
    time: 119,
    macroCommandEnabled: true,
    scene: { metadata: { battleScenario: { profile, seed: 'deterministic-case' } } },
    factions: {
      us: { squads: [us] },
      ge: { squads: [ge, geHidden, geAmbush, geHomeWrongSide, geStill] }
    }
  };
  hooks['strategic-aerial-recon'].onBattleStart(sim);
  return { root, sim, hooks, events, us, ge, geHidden, geAmbush };
}
function tick(w) {
  w.hooks['strategic-aerial-recon'].onCommanderTick(w.sim, { macroCommandEnabled: true });
}

const w = make();
const A = w.root.BattleAerialRecon;
tick(w);
assert.equal(A.forGeneral(w.sim, 'us'), null, 'cannot inspect enemy before sortie');
w.sim.time = 120;
tick(w);
const usEvent = A.forGeneral(w.sim, 'us');
assert.ok(usEvent && Object.isFrozen(usEvent) && Object.isFrozen(usEvent.contacts));
assert.equal(usEvent.faction, 'us');
assert.equal(usEvent.contacts.length, 2, 'moving plus exposed stationary; hidden ambush groups stay unreported');
const target = usEvent.contacts.find(c => c.squadId === 'ge-0');
const stationary = usEvent.contacts.find(c => c.squadId === 'ge-stationary');
assert.ok(stationary, 'exposed stationary formation yields an uncertain position-only fix');
assert.equal(stationary.speedMps, 0);
assert.equal(stationary.headingRadians, null, 'no invented route or direction');
assert.equal(stationary.observation, 'stationary');
assert.ok(stationary.confidence < target.confidence);
assert.equal(target.squadId, 'ge-0');
assert.equal(target.source, 'aerial');
assert.ok(target.positionUncertaintyM > 0 && target.headingUncertaintyRadians > 0);
assert.ok(target.speedUncertaintyMps > 0 && target.confidence < 1);
assert.ok(target.x % 35 === 0 && target.z % 35 === 0, 'no precise actor positions');
assert.ok(target.speedMps >= 1.5 && target.speedMps <= 2.5);
assert.equal(A.forGeneral(w.sim, 'ge').contacts.length, 1, 'opposing General has an independent event');
assert.equal(A.forGeneral(w.sim, 'ge').contacts[0].squadId, 'us-0');
assert.equal(w.events.filter(e => e.type === 'strategic-aerial-recon').length, 2);
assert.equal(A.request(w.sim, 'us'), null, 'no second request allowed');
const snapshot = JSON.stringify(usEvent);
w.ge.members.forEach(s => {
  s.root.position.z = -500;
  s.moveSpeed = 0;
});
assert.equal(JSON.stringify(A.forGeneral(w.sim, 'us')), snapshot, 'not a live transform reference');
w.sim.time = 165.01;
assert.equal(A.forGeneral(w.sim, 'us'), null, 'stale observation is inaccessible');
assert.equal(A.request(w.sim, 'us'), null, 'expiry does not refund budget');
w.hooks['strategic-aerial-recon'].onBattleRestart(w.sim);
assert.equal(A.forGeneral(w.sim, 'us'), null, 'restart clears old intel');
w.sim.time = 120;
w.ge.members.forEach(s => {
  s.root.position.z = 1000;
  s.moveSpeed = 2;
});
tick(w);
assert.equal(A.forGeneral(w.sim, 'us').contacts.length, 2, 'restart restores moving and stationary sightings');
const identical = make();
identical.sim.time = 120;
tick(identical);
assert.equal(JSON.stringify(identical.root.BattleAerialRecon.forGeneral(identical.sim, 'us')), snapshot);
for (const [search, profile] of [
  ['', 'strategic'],
  ['?strategicInterception=1', 'strategic'],
  ['?strategicInterception=1&aerialRecon=1', 'tactical']
]) {
  const disabled = make(search, profile);
  disabled.sim.time = 120;
  tick(disabled);
  assert.equal(disabled.root.BattleAerialRecon.forGeneral(disabled.sim, 'us'), null);
  assert.equal(disabled.events.length, 0);
}
const noCommand = make();
noCommand.sim.time = 120;
noCommand.sim.macroCommandEnabled = false;
tick(noCommand);
assert.equal(noCommand.root.BattleAerialRecon.forGeneral(noCommand.sim, 'us'), null);
const incoherent = make();
incoherent.sim.time = 120;
incoherent.ge.members.forEach((s, i) => {
  s.root.rotation.y = i % 2 ? Math.PI / 2 : -Math.PI / 2;
});
tick(incoherent);
const incoherentContacts = incoherent.root.BattleAerialRecon.forGeneral(incoherent.sim, 'us').contacts;
assert.ok(incoherentContacts.every(c => c.speedMps === 0 && c.headingRadians === null),
  'disagreeing directions never produce a fake movement track');
const player = make();
const P = player.root.BattleAerialRecon;
player.sim.time = 3;
assert.equal(
  P.request(player.sim, 'us', { playerOrdered: true }),
  null,
  'a player cannot spend the sortie before deployment'
);
assert.equal(P.status(player.sim, 'us').used, false);
player.sim.time = 9;
player.sim.paused = true;
assert.equal(
  P.request(player.sim, 'us', { playerOrdered: true }),
  null,
  'paused pre-battle UI cannot burn the one reconnaissance sortie'
);
player.sim.paused = false;
const manual = P.request(player.sim, 'us', { playerOrdered: true });
assert.ok(
  manual && manual.faction === 'us' && manual.contacts.length === 2,
  'early human-authorized General recon returns a genuine bounded enemy-side observation'
);
assert.equal(P.status(player.sim, 'us').used, true);
assert.equal(P.status(player.sim, 'us').live, true);
assert.equal(
  P.request(player.sim, 'us', { playerOrdered: true }),
  null,
  'the same player cannot spend a second sortie'
);
player.sim.time = 55;
assert.equal(P.forGeneral(player.sim, 'us'), null);
assert.equal(P.status(player.sim, 'us').live, false);
assert.equal(
  P.status(player.sim, 'us').contacts,
  2,
  'post-expiry summary does not silently refund the sortie'
);
assert.equal(P.forGeneral(player.sim, 'ge'), null, 'German observations cannot leak through US request');
console.log('Strategic aerial recon: one-shot, isolation, uncertainty, expiry, restart and flags PASS');
