'use strict';
const { loadSquadCommandStack } = require('./squad-command-stack');
/* Shared scenario fixture for the tactical-positions test family.

   One room with a window, one US squad outside it in a support-hold, and the
   shipping squad-command stack (fire control ... cohesion regroup, plan
   stability, hardpoints, physicality, ammunition, personal space, tactical
   route, diagnostics export) plus the real movement integrator with rendering
   stubbed. Extracted verbatim from window-port-check / tactical-positions-check
   / mg-station-setup-check, which were three literal copies of the same setup.

   Each check still owns its assertions; only the fixture is shared, so a new
   15x/16/20/39/46/51/52/99 module joins this family in exactly one place. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path');
const H = require('./harness');

function load(r, file) {
  new Function(
    'window',
    'globalThis',
    'console',
    'BABYLON',
    fs.readFileSync(path.join(H.REPO, file), 'utf8')
  )(r, r, { log() {}, warn() {}, error() {} }, r.BABYLON);
}

const DEFAULT_COMPOSITION = ['rifleman', 'rifleman', 'sergeant', 'gunner'];

function fixture({ physical = true, inside = false, win = {}, composition = DEFAULT_COMPOSITION } = {}) {
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
    systems = {};
  r.BattleModules = {
    registerSystem(id, h) {
      systems[id] = h;
    },
    listSystems() {
      return Object.entries(systems).map(([id, h]) => ({ id, ...h }));
    },
    unitsFor(sim) {
      return sim._roster.us.concat(sim._roster.ge);
    }
  };
  r.BattleSoldierModel = {
    animateWalk() {},
    setCrouch(s, v) {
      s.crouching = v;
    },
    setProne(s, v) {
      s.prone = v;
    },
    kill(s) {
      s.dead = true;
    }
  };
  r.BattleCommanderAI = {
    policyFor() {
      return { cohesionRadius: 34, captainlessCohesion: 26, routeArrivalRadius: 8, captureCommitRatio: 0.82 };
    },
    chooseObjective() {
      return null;
    }
  };
  load(r, 'battle/battle-navigation.js');
  load(r, 'battle/movement-resolver.js');
  loadSquadCommandStack(load, r);
  load(r, 'battle/modules/20-building-hardpoints.js');
  if (physical) load(r, 'battle/modules/39-navigation-physicality-debug.js');
  load(r, 'battle/modules/46-ammunition-stoppages.js');
  load(r, 'battle/modules/51-soldier-personal-space.js');
  load(r, 'battle/modules/52-survival-tactical-route.js');
  load(r, 'battle/modules/99-session-diagnostics-export.js');
  // Execute the real integrator and death path with rendering stubbed, as the navigation suite does.
  let code = fs.readFileSync(path.join(H.REPO, 'battle/battle-sim.js'), 'utf8');
  code = code.replace(
    /(?=  BattleSim\.prototype\._frame\s*=\s*function)/,
    '  root.stepMovementProbe=stepMovement;root.killProbe=BattleSim.prototype.killSoldier;\n'
  );
  new Function('window', 'globalThis', 'BABYLON', 'BattleSoldierModel', code)(
    r,
    r,
    r.BABYLON,
    r.BattleSoldierModel
  );
  const sim = H.makeBattle(r),
    sq = H.addSquad(r, sim, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: -14,
      objective: { x: 0, z: 0 },
      composition
    });
  const room = {
    id: 'room',
    x: 0,
    z: 0,
    w: 12,
    d: 12,
    rot: 0,
    openings: [
      { id: 'rear', type: 'door', side: 'south', offset: 0, width: 2 },
      { id: 'front', type: 'door', side: 'north', offset: 3, width: 2 },
      { id: 'window', type: 'window', side: 'north', offset: 0, width: 1.25, bottom: 0.92, top: 2.08, ...win }
    ]
  };
  const scenario = { buildings: [room] };
  sim.scene = { metadata: { battleScenario: scenario } };
  r.__battle__ = sim;
  r.BattleNavigation.installScenario(scenario);
  sq.state = 'engaged';
  sq.commandPhase = 'support-hold';
  sq.inContact = true;
  sq.targetObjective = 'house';
  systems['squad-command'].onCommanderTick(sim, { town: null });
  sq.members.forEach((s, i) => {
    s._fireteamKey = i === 2 ? 'command' : 'alpha';
    s._engagementTask = i === 2 ? 'control' : 'support-by-fire';
    s.root.position.x = i * 3;
    s.root.position.z = inside ? 0 : -14;
    s.destination = { x: s.root.position.x, z: s.root.position.z };
    r.BattleAmmunition.initialize(s);
  });
  const s = sq.members[0],
    other = sq.members[1],
    leader = sq.members[2],
    P = r.BattleTacticalPositions,
    M = r.BattleMovementResolver,
    N = r.BattleNavigation;
  const threat = { x: 0, z: 40 },
    enemy = { id: 99, hp: 100, dead: false, root: { position: { ...threat, y: 0 } }, faction: 'ge' };
  s.target = enemy;
  sq.contact = { ...threat, at: sim.time, unit: enemy };
  const st = N.firingStations[0] || null;
  function claim(man = s) {
    return P.claim(man, sim, st, threat);
  }
  function tick(dt = 0.15) {
    sim.time += dt;
    r.BattleEngagement.updateSoldier(s, sim);
    M.resolve(s, sim);
    r.stepMovementProbe(sim, s, dt);
    systems['building-hardpoints'].onSimulationStep(sim);
  }
  return { r, sim, sq, s, other, leader, P, M, N, st, threat, enemy, systems, claim, tick };
}

const SIN = Math.sin,
  COS = Math.cos,
  DEG = Math.PI / 180;

function counted(f) {
  let n = 0;
  const SA = f.r.SquadAI,
    orig = SA.tryFire;
  SA.tryFire = function (...a) {
    n++;
    return orig.apply(this, a);
  };
  return {
    get shots() {
      return n;
    },
    restore() {
      SA.tryFire = orig;
    }
  };
}

function occupy(f) {
  const t = f.claim();
  assert.ok(t);
  for (let i = 0; i < 400 && t.status !== 'holding'; i++) f.tick();
  return t;
}

function targetAt(f, bearingDeg, dist = 40, y = 0) {
  const x = f.st.windowX + SIN(bearingDeg * DEG) * dist,
    z = f.st.windowZ + COS(bearingDeg * DEG) * dist;
  const e = { id: 99, hp: 100, dead: false, root: { position: { x, y, z } }, faction: 'ge' };
  f.s.target = e;
  f.sq.contact = { x, z, at: f.sim.time, unit: e };
  return e;
}

module.exports = { fixture, counted, occupy, targetAt, SIN, COS, DEG };
