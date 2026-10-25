'use strict';
/* ?peelBack=1: the reverse of the assault bound, on the one 'bound' lease and the one orderBound.
   Squad Leader: only a squad whose pinned men are half or more of the living, with two others still firing,
   sends one fireteam of free men back; not on a retreating squad, not twice inside the bound cycle, never the gun.
   Engagement: the ordered man looks for cover away from the threat, through the same covered-route gate as a forward
   bound; with none he stays and fights (no objective rush). */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');

function leaderWorld(search, opts = {}) {
  H.resetIds();
  const r = H.bootstrap({
    modules: false,
    search: '?coa=0&slStress=0&fireteamSplit=0&scoutsForward=0&stressAct=0' + search
  });
  r.BattleModules = { registerSystem() {}, unitsFor: b => b._roster.us.concat(b._roster.ge) };
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/battle-navigation.js');
  load('battle/movement-resolver.js');
  load('battle/modules/39-navigation-physicality-debug.js');
  loadSquadCommandStack((root, file) => load(file), r);
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: -4,
      objective: { x: 0, z: 50 },
      composition: [
        'sergeant',
        'rifleman',
        'rifleman',
        'rifleman',
        'rifleman',
        'rifleman',
        'rifleman',
        'rifleman'
      ]
    });
  b.time = 5;
  r.__battle__ = b;
  r.BattleNavigation.installScenario({ buildings: [] });
  q.members.forEach((s, i) => {
    s._fireteamKey = i < 4 ? 'alpha' : 'bravo';
    r.BattleEngagement.stateOf(s).state = 'engage';
  });
  q.state = opts.retreat ? 'retreat' : 'engaged';
  q.inContact = true;
  q.commandPhase = 'assault';
  q._macroMission = { version: 1, intent: 'capture', status: 'executing', point: { x: 0, z: 50 } };
  const pinnedN = opts.pinned == null ? 4 : opts.pinned,
    pinned = [2, 3, 6, 7].slice(0, pinnedN).map(i => q.members[i]),
    free = q.members.filter(m => pinned.indexOf(m) < 0);
  pinned.forEach(m => (m.suppressedUntil = 99));
  const E = r.BattleEngagement,
    report = {
      contactStarted: false,
      underFire: 0,
      pinned: pinnedN,
      effective: opts.effective == null ? 4 : opts.effective,
      fireSupport: free.slice(0, opts.effective == null ? 4 : opts.effective),
      reacting: [],
      fled: []
    };
  E.updateSquad = () => report;
  return { r, b, q, L: r.BattleLeases, S: r.BattleSquadStability, E };
}
function run(w) {
  w.S.fireAndMovement(w.q, w.b);
  return w.L.get(w.q, 'bound');
}

{
  const w = leaderWorld('');
  const lease = run(w);
  assert.ok(!(lease && lease.data && lease.data.back), 'flag off: a half-pinned squad does not peel back');
}
{
  const w = leaderWorld('&peelBack=1');
  const lease = run(w);
  assert.ok(lease && lease.data && lease.data.back, 'half pinned with free supporters: a team peels back');
  assert.ok(/peels back/.test(lease.reason));
  const movers = w.q.members.filter(m => w.E.stateOf(m).boundOrder);
  assert.ok(movers.length > 0, 'Engagement receives the order through orderBound');
  movers.forEach(m => assert.ok(!(m.suppressedUntil > w.b.time), 'a pinned man is never the mover'));
  assert.equal(w.L.holds(w.q, 'bound-cycle', w.b.time), true);
  w.b.time += 0.5;
  const again = w.L.get(w.q, 'bound');
  assert.equal(again, lease, 'one bound lease at a time: no second order inside the window');
}
for (const [name, opts] of [
  ['retreat owns it', { retreat: true }],
  ['too few pinned', { pinned: 1 }],
  ['no covering fire left', { effective: 1 }]
]) {
  const w = leaderWorld('&peelBack=1', opts);
  const lease = run(w);
  assert.ok(!(lease && lease.data && lease.data.back), name);
}

// Engagement: cover behind the man, away from the threat.
function coverWorld() {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: '?localPlan=1&coveredBounds=1&peelBack=1' });
  r.BattleModules = { registerSystem() {}, unitsFor: b => b._roster.us.concat(b._roster.ge) };
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/battle-navigation.js');
  load('battle/movement-resolver.js');
  load('battle/modules/39-navigation-physicality-debug.js');
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: -4,
      objective: { x: 0, z: 50 },
      composition: ['rifleman', 'rifleman', 'rifleman']
    });
  b.time = 5;
  const hedge = {
    id: 'h',
    physicalId: 'h',
    shape: 'obb',
    type: 'wall',
    x: 0,
    z: -10,
    hx: 14,
    hz: 1,
    ux: 1,
    uz: 0,
    vx: 0,
    vz: 1,
    radius: 1,
    y: 0,
    height: 2,
    cover: 0.62
  };
  b.obstacles = [hedge];
  b.obstacles.__physicalFootprints = b.obstacles;
  b.obstacles.__physicalVersion = 1;
  r.__battle__ = b;
  r.BattleNavigation.installScenario({ buildings: [] });
  q.inContact = true;
  q.state = 'engaged';
  q.commandPhase = 'capture';
  q._assaultAuthorized = false;
  const s = q.members[0],
    contact = { x: 0, z: 60, at: 5, confidence: 0.9, source: 'told' };
  s.target = { id: 900, root: { position: { x: 0, y: 0, z: 60 } } };
  r.SquadAI.soldierContact = () => contact;
  r.SquadAI.squadContactsMap = () => [contact];
  r.BattleLeases.define('bound', { priority: 1 });
  return { r, b, q, s, E: r.BattleEngagement };
}
function order(w, back) {
  w.r.BattleLeases.grant(
    w.q,
    'bound',
    'squad-leader',
    5,
    15,
    'fixture',
    'expiry',
    back ? { back: true } : null
  );
  w.E.resetSoldier(w.s);
  const e = w.E.stateOf(w.s);
  e.state = 'engage';
  e.boundOrder = true;
  w.E.updateSoldier(w.s, w.b);
  return e;
}
{
  const w = coverWorld();
  const e = order(w, false);
  assert.notEqual(e.state, 'bound', 'a forward bound is not authorised on an unauthorised squad');
}
{
  const w = coverWorld();
  const e = order(w, true);
  assert.equal(e.boundOrder, false, 'the order is consumed');
  assert.notEqual(e.state, 'assault', 'never an objective rush');
  assert.equal(e.coveredBound.attempts, 1, 'the covered-bound search ran for the peel-back');
  assert.ok(e.coveredBound.candidates > 0, 'cover behind him was considered');
  // The wall sits across the straight route back, so the existing route gate refuses it: he keeps fighting.
  assert.equal(e.state, 'engage');
  assert.equal(e.coveredBound.reason, 'nonstraight-route');
}
console.log('peel-back-check: PASS leader gates, one lease, retreat-direction cover, no rush');
