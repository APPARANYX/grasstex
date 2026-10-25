'use strict';
/* ?retreatTeams=1: a retreating squad in contact falls back by fireteams.
   Off: no team holds. On: one team holds (its anchor is frozen where it stands) under a 'bound' lease with
   retreatHold set, then the next team in rotation holds, so the team that held now moves. It needs four living,
   contact, and two able shooters on the holding team. #375 stays: the squad is still in the retreat state. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');

function world(search, living) {
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
  load('battle/modules/09-tactical-callouts.js');
  loadSquadCommandStack((root, file) => load(file), r);
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: -4,
      objective: { x: 0, z: 50 },
      composition: ['sergeant', 'rifleman', 'rifleman', 'rifleman', 'rifleman', 'rifleman', 'rifleman']
    });
  b.time = 5;
  r.__battle__ = b;
  r.BattleNavigation.installScenario({ buildings: [] });
  q.members.forEach((s, i) => {
    s._fireteamKey = i < 3 ? 'alpha' : 'bravo';
    if (i >= living) s.dead = true;
  });
  q.state = 'retreat';
  q.inContact = true;
  const report = {
    contactStarted: false,
    underFire: 0,
    pinned: 0,
    effective: 4,
    fireSupport: q.members.filter(s => !s.dead),
    reacting: [],
    fled: []
  };
  r.BattleEngagement.updateSquad = () => report;
  return { r, b, q, S: r.BattleSquadStability, L: r.BattleLeases };
}
const tick = w => w.S.fireAndMovement(w.q, w.b);

{
  const w = world('', 7);
  tick(w);
  assert.equal(w.q._retreatHold == null, true, 'flag off: nobody holds');
}
{
  const w = world('&retreatTeams=1', 7);
  tick(w);
  const first = w.q._retreatHold;
  assert.ok(first && first.retreatHold, 'flag on, in contact: a team holds');
  assert.equal(w.q.state, 'retreat', 'the squad is still retreating');
  assert.ok(first.anchors[first.team], 'the holder anchor is frozen where the team stands');
  assert.equal(w.L.holds(w.q, 'bound', w.b.time), true, 'the hold is a bound lease');
  w.b.time += 1;
  tick(w);
  assert.equal(w.q._retreatHold.team, first.team, 'the same team holds for the window');
  assert.equal(w.q.retreatHolds, 1);
  w.b.time += 5;
  tick(w);
  assert.notEqual(
    w.q._retreatHold.team,
    first.team,
    'after the window the next team holds, the first now moves'
  );
}
{
  const w = world('&retreatTeams=1', 3);
  tick(w);
  assert.equal(w.q._retreatHold == null, true, 'fewer than four living: the whole squad falls back');
}
{
  const w = world('&retreatTeams=1', 7);
  w.q.inContact = false;
  tick(w);
  assert.equal(w.q._retreatHold == null, true, 'no contact: a plain retreat');
}
console.log('retreat-teams-check ok');
