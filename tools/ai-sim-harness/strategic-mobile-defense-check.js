#!/usr/bin/env node
'use strict';

/* Strategic-only prepared defense: the captain holds three fortified sectors
   while two squads remain eligible for the General's normal mobile missions.
   Engineers may fortify a transient security position without pinning that
   mobile squad as a permanent garrison. */
const assert = require('node:assert/strict');
const { loadModule } = require('./module-loader');

function fixture(profile) {
  const systems = {};
  const sectors = [0, 1, 2].map(i => ({
    id: 'sector-' + i,
    objectiveId: 'obj-' + i,
    x: i * 120,
    z: 500,
    radius: 30,
    terrainValue: 3 - i
  }));
  const objs = sectors.map(s => ({
    id: s.objectiveId,
    def: { x: s.x, z: s.z, radius: 30 },
    state: { owner: 'ge', phase: 'held' }
  }));
  objs.push({
    id: 'mobile-home',
    def: { x: 0, z: 0, radius: 30 },
    state: { owner: 'ge', phase: 'held' }
  });
  function plan() {
    return { works: [], bySector: {}, posts: [], stats: { posts: 0 } };
  }
  const root = {
    GTLog() {},
    GTMath: { distStrict: (a, b) => Math.hypot(a.x - b.x, a.z - b.z) },
    SquadAI: { ROLES: {}, COMPOSITION: ['rifleman', 'rifleman'] },
    BattleModules: { registerSystem: (name, spec) => (systems[name] = spec) },
    BattleSides: {
      DEFAULT_ECHELON: 'captain',
      ECHELONS: { captain: { span: 3 } },
      build: (scenario, opts) => ({
        defender: opts.defender,
        attacker: 'us',
        meeting: false,
        heldSectors: sectors,
        sectors: sectors
      }),
      tacticalFrame: () => ({
        approach: { x: 0, z: 1 },
        front: { x: 0, z: -1 },
        left: { x: -1, z: 0 },
        facingYaw: 0,
        acrossYaw: 0
      }),
      offsetPoint: (p, frame, rear) => ({
        x: p.x + frame.approach.x * rear,
        z: p.z + frame.approach.z * rear
      }),
      sectorFor: (s, id) => s.sectors.find(x => x.objectiveId === id) || null,
      summary: () => 'prepared defender',
      other: faction => (faction === 'ge' ? 'us' : 'ge')
    },
    BattleDefensePlan: {
      empty: plan,
      build: plan,
      resetClaims() {},
      claimPost: () => null,
      releasePost() {},
      holdPost() {},
      materialise: (context, work) => (work.obstacles = []),
      register: (p, work, sector) => {
        p.works.push(work);
        p.bySector[sector.objectiveId] = { posts: [] };
      }
    },
    BattleObjectiveSystem: {
      get: (sim, id) => sim._objectives.find(x => x.id === id),
      status: (sim, id) => sim._objectives.find(x => x.id === id)?.state,
      tick() {}
    }
  };
  loadModule(root, 'battle/modules/21-defender-engineers.js');
  const squads = Array.from({ length: 5 }, (_, i) => {
    const member = {
      id: 'ge-' + i + '-0',
      role: 'engineer',
      dead: false,
      root: {
        position: { x: i * 10, y: 0, z: 0 },
        rotation: { y: 0 }
      }
    };
    return {
      id: 'ge-' + i,
      faction: 'ge',
      home: { x: i * 10, z: 0 },
      members: [member],
      state: 'advance',
      commandRole: i === 4 ? 'reserve' : 'center'
    };
  });
  for (const sq of squads) sq.members[0].squad = sq;
  const sim = {
    time: 0,
    _defenderChoice: 'ge',
    scene: { metadata: { battleScenario: { profile, objectives: objs } } },
    factions: { ge: { squads }, us: { squads: [] } },
    _roster: { ge: [], us: [] },
    _objectives: objs,
    obstacles: [],
    heightAt: () => 0
  };
  systems['defender-engineers'].onBattleStart(sim);
  return { sim, squads, root, systems };
}

{
  const { sim, squads, root, systems } = fixture('strategic');
  assert.equal(squads.filter(s => !!s._preparedDefenseRequest).length, 3);
  for (let i = 0; i < 5; i++) {
    assert.equal(root.BattleDefenseWorks.garrisons(sim, squads[i]), i < 3);
    if (i >= 3) {
      assert.equal(squads[i].commandRole, 'center');
      assert.equal(squads[i].members[0].root.position.z, 0);
    }
  }
  const mobile = squads[3];
  mobile.members[0].root.position.x = 0;
  mobile._macroMission = {
    intent: 'defend',
    status: 'executing',
    requestKey: 'objective-security|mobile-home'
  };
  sim._roster.ge = [mobile.members[0]];
  sim.time = 11;
  systems['defender-engineers'].onCommanderTick(sim, { dt: 11 });
  assert.equal(sim._engineerBuild.counts['ge|mobile-home'], 1);
  assert.equal(
    mobile._preparedDefenseRequest,
    null,
    'temporary security must not become a permanent garrison'
  );
  mobile._macroMission = { intent: 'defend', status: 'executing', requestKey: null };
  sim.time = 22;
  systems['defender-engineers'].onCommanderTick(sim, { dt: 11 });
  assert.equal(
    mobile._preparedDefenseRequest?.objectiveId,
    'mobile-home',
    'an explicit unrequested General DEFEND can establish a permanent garrison'
  );
}
{
  const { sim, squads, root } = fixture('tactical');
  assert.equal(squads.filter(s => !!s._preparedDefenseRequest).length, 5);
  for (const sq of squads) assert.equal(root.BattleDefenseWorks.garrisons(sim, sq), true);
}

console.log('PASS strategic 3+2 allocation, temporary security, explicit defend and tactical compatibility');
