'use strict';
/* Phase C fold bounds. Natural run c597c84: 13 of 17 covered-bound attempts found no wall,
   rock or tree slot within the bound distance, so open and rolling ground could never be
   bounded. With ?fireManeuverOperation=1 a terrain fold is a bound endpoint only where the
   ground stops a round from every reported threat to a crouched head (on the arrival ring
   too), Perception cannot see him crouched, and he can rise to a standing firing ray.
   Route, distance and exposure rules are unchanged; ?foldBounds=0 restores slots only. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const BASE = '?localPlan=1&coveredBounds=1';
function world(search, height = 2) {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search });
  r.BattleModules = { registerSystem() {}, unitsFor: b => b._roster.us.concat(b._roster.ge) };
  for (const f of [
    'battle/modules/14-z-ballistic-raycast.js',
    'battle/battle-navigation.js',
    'battle/movement-resolver.js',
    'battle/modules/39-navigation-physicality-debug.js'
  ])
    loadModule(r, f, { console: quietConsole, location: r.location });
  // A broad crest 14 m ahead: the reverse slope 8-9 m out is a fold for a 60 m threat.
  const b = H.makeBattle(r, { heightAt: (x, z) => height * Math.exp(-Math.pow((z - 14) / 6, 2)) }),
    q = H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: 0,
      objective: { x: 0, z: 80 },
      composition: ['rifleman', 'rifleman', 'rifleman']
    });
  b.time = 5;
  b.obstacles = [];
  b.obstacles.__physicalFootprints = [];
  r.__battle__ = b;
  r.BattleNavigation.installScenario({ buildings: [] });
  q.inContact = true;
  q.state = 'engaged';
  q.commandPhase = 'capture';
  q._assaultAuthorized = true;
  const s = q.members[0],
    contact = { x: 0, z: 60, at: 5, confidence: 0.9, source: 'told' };
  s.root.position.x = 0;
  s.root.position.z = 0;
  s.target = { id: 900, root: { position: { x: 0, y: 0, z: 60 } } };
  r.SquadAI.soldierContact = () => contact;
  r.SquadAI.squadContactsMap = () => [contact];
  r.BattleLeases.define('bound', { priority: 1 });
  r.BattleLeases.grant(q, 'bound', 'squad-leader', 5, 15, 'fixture', 'expiry');
  return { r, b, q, s, C: r.BattleCoverPositions, E: r.BattleEngagement };
}
function order(w) {
  w.E.resetSoldier(w.s);
  const e = w.E.stateOf(w.s);
  e.state = 'engage';
  e.boundOrder = true;
  w.E.updateSoldier(w.s, w.b);
  return e;
}
{
  assert.equal(world(BASE).C.foldBoundsOn(), false, 'opt-in with the operation only');
  assert.equal(world(BASE + '&fireManeuverOperation=1&foldBounds=0').C.foldBoundsOn(), false);
  assert.equal(world(BASE + '&fireManeuverOperation=1').C.foldBoundsOn(), true);
}
{
  const w = world(BASE + '&fireManeuverOperation=1'),
    threats = w.C.boundThreats(w.s, w.b),
    folds = w.C.foldCandidates(w.s, w.b, threats, { x: 0, z: 1 });
  assert.ok(folds.length > 0, 'the reverse slope offers folds');
  for (const f of folds) {
    assert.ok(w.C.maskedPost(w.b, f, threats), 'hidden crouched, firing ray standing');
    assert.ok(f.distance <= w.C.boundTuning().maxDistance, 'within the unchanged bound distance');
  }
  const e = order(w);
  assert.equal(e.state, 'bound', 'a fold gives a covered bound on open ground');
  assert.ok(e.cover && e.cover.fold, 'the endpoint is a terrain fold');
  assert.ok(e.cover.z > 6 && e.cover.z < 11, 'on the reverse slope, short of the crest');
  assert.ok(w.C.boundRoute(w.s, w.b, e.cover, threats).eligible, 'route rules unchanged');
}
{
  const w = world(BASE + '&fireManeuverOperation=1&foldBounds=0'),
    e = order(w);
  assert.notEqual(e.state, 'bound', 'without folds open ground stays unbounded');
  assert.equal(e.coveredBound.rejected, 1);
}
{
  const flat = world(BASE + '&fireManeuverOperation=1', 0);
  assert.equal(
    flat.C.foldCandidates(flat.s, flat.b, flat.C.boundThreats(flat.s, flat.b), { x: 0, z: 1 }).length,
    0,
    'flat ground has no fold'
  );
  assert.notEqual(order(flat).state, 'bound');
  const low = world(BASE + '&fireManeuverOperation=1', 0.6);
  assert.equal(
    low.C.foldCandidates(low.s, low.b, low.C.boundThreats(low.s, low.b), { x: 0, z: 1 }).length,
    0,
    'a rise too low to stop a round to a crouched head is no fold'
  );
}
console.log('phase-c-fold-bound-check: PASS terrain folds as covered bound endpoints');
