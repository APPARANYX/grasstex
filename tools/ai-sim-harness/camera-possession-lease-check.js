#!/usr/bin/env node
'use strict';

/* #456 R2: possession transfer is an authority boundary, not a spawn.
   Reject stale roster/menu membership before releasing any existing player. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../../battle/camera-controls.js'), 'utf8');
const start = src.indexOf('  function playerSoldierEligible(');
const end = src.indexOf('  function createDesktopFly(', start);
assert.ok(start > 0 && end > start, 'possession contract extracted from camera closure');
const services = [], global = {
  BattleMovementResolver: {
    clearPlayer: s => services.push(['clear', s.id]),
    proposePlayer: (s, p, b, t, opts) => services.push(['propose', s.id, p, t, opts.pace, b.id])
  },
  SquadAI: { playerAim: (s, p) => services.push(['aim', s.id, p]) },
  BattleEngagement: {
    playerFace: (s, p) => services.push(['face', s.id, p]),
    commitStance: (s, b, stance, t, owner) => services.push(['stance', s.id, stance, t, owner])
  },
  BattleTacticalPositions: { release: (s, b, reason) => services.push(['release', s.id, reason, b.id]) }
};
const lease = new Function('global', src.slice(start, end) +
  'return { eligible: playerSoldierEligible, menu: menuSoldierEligible, commit: commitPlayerOwnership, clear: clearPlayerLease };')(global);
const us = { id: 1, faction: 'us', role: 'rifleman', root: { position: { x: 12, z: -4 }, rotation: { y: 0 } }, dead: false, isPlayer: true };
const ge = { id: 2, faction: 'ge', role: 'scout', root: { position: { x: -9, z: 3 } }, dead: false };
const squadUs = { id: 'A', members: [us] }, squadGe = { id: 'B', members: [ge] };
const battle = { id: 'live', factions: { us: { squads: [squadUs] }, ge: { squads: [squadGe] } } };
assert.equal(lease.eligible(battle, us), true);
assert.equal(lease.eligible(battle, ge), true);
assert.equal(lease.menu(battle, 'us', squadUs, us), true);
assert.equal(lease.menu(battle, 'ge', squadGe, ge), true);
assert.equal(lease.eligible(null, us), false);
assert.equal(lease.eligible(battle, null), false);
assert.equal(lease.eligible(battle, { ...us, root: null }), false);
assert.equal(lease.eligible(battle, { ...us, dead: true }), false);
assert.equal(lease.eligible(battle, { ...us, faction: 'xx' }), false);
assert.equal(lease.eligible(battle, { ...us, id: us.id }), false, 'ID match cannot impersonate live soldier object');
assert.equal(lease.eligible(battle, { ...us, faction: 'ge' }), false);
assert.equal(lease.menu(battle, 'ge', squadUs, us), false, 'cannot choose foreign faction squad');
assert.equal(lease.menu(battle, 'us', squadGe, ge), false, 'cannot choose stale squad');
assert.equal(lease.menu(battle, 'us', squadUs, { ...us }), false, 'cannot choose a stale menu soldier clone');
assert.equal(lease.menu(null, 'us', squadUs, us), false);
assert.equal(lease.menu(battle, 'us', squadUs, { ...us, dead: true }), false);
assert.equal(lease.menu(battle, 'us', squadUs, { ...us, root: null }), false);
battle.factions.us.squads = [];
assert.equal(lease.eligible(battle, us), false, 'squad removed by restart is not eligible');
assert.equal(lease.menu(battle, 'us', squadUs, us), false, 'menu must revalidate current roster');
battle.factions.us.squads = [squadUs];

lease.clear(us, battle);
assert.equal(us.isPlayer, false, 'release ownership flag');
assert.deepEqual(services, [
  ['clear', 1], ['aim', 1, null], ['face', 1, null], ['release', 1, 'player-release', 'live']
], 'full movement/aim/facing/tactical lease released in shipping order');
services.length = 0;
lease.commit(ge, battle);
assert.deepEqual(services, [
  ['stance', 2, 'stand', 0.45, 'player-possession'],
  ['release', 2, 'player-control', 'live'],
  ['propose', 2, { x: -9, z: 3 }, 0.6, 'walk', 'live']
], 'new possession starts from stand, releases tactical claim and proposes neutral player movement');
services.length = 0;
lease.clear(null, battle);
assert.equal(services.length, 0, 'null lease release is inert');
const reduced = new Function('global', src.slice(start, end) +
  'return { clear: clearPlayerLease, commit: commitPlayerOwnership };')({});
reduced.clear(us, battle);
reduced.commit(ge, battle); // absence of optional owners is legitimate.
const controller = src.slice(end);
const possession = controller.slice(controller.indexOf('    function possessSoldier('), controller.indexOf('    function setPlayerStance('));
assert.ok(possession.indexOf('if (!playerSoldierEligible(b, next)) return false;') <
  possession.indexOf('if (player) clearPlayerLease('), 'validate before relinquishing current soldier');
assert.ok(possession.indexOf('if (player) clearPlayerLease(') <
  possession.indexOf('player = next;'), 'release before transfer');
assert.ok(possession.indexOf('player.isPlayer = true;') <
  possession.indexOf('commitPlayerOwnership(next, b);'), 'new player flag precedes neutral stance and movement lease');
assert.ok(possession.indexOf('commitPlayerOwnership(next, b);') <
  possession.indexOf('if (b.paused && b.resume && !preservePause)'), 'pause ownership unchanged');
assert.match(src, /if \(!menuSoldierEligible\(b, faction, sq, soldier\)\) \{/);
console.log('PASS #456 R2 roster/selection guards, stale soldier rejection, lease release/acquire order and pause ownership');
