#!/usr/bin/env node
'use strict';
/* Tactical controller owner integration (#602): the six entry points run the shipping Squad Leader,
   Engagement, hardpoint and combat-urgency code. Legacy mode is behavior-identical to a page without the
   controller; under a fixture replacement the ordinary policy goes to the provider while retained owner
   services (casualties/retreat, mission acceptance, transport exclusion, contact reporting, grenade
   completion, station maintenance) keep running, and the restart barrier runs before legacy state clears. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness'),
  { loadSquadCommandStack } = require('./squad-command-stack'),
  { loadModule, quietConsole } = require('./module-loader');
const CONTRACT = require('../../battle/tactical-capability-contract');
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function world(opts = {}) {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: '?stressAct=0' }),
    systems = {},
    accepted = [];
  r.BattleModules = {
    registerSystem(id, s) {
      systems[id] = s;
    },
    getSystem: id => systems[id],
    runHook() {},
    registerUnitType() {},
    registerObjectiveType() {},
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  r.BattleCommanderAI = {
    acceptMission(sim, sq) {
      accepted.push(sq.id);
      sq._macroMission.status = 'executing';
    }
  };
  if (opts.controller !== false) {
    r.BattleTacticalCapabilityContract = CONTRACT;
    load(r, 'battle/modules/13a-tactical-controller.js');
  }
  load(r, 'battle/modules/08-soldier-events.js');
  load(r, 'battle/modules/17-soldier-mind.js');
  load(r, 'battle/movement-resolver.js');
  loadSquadCommandStack(load, r);
  load(r, 'battle/modules/44-combat-urgency.js');
  const b = H.makeBattle(r, { seed: 41 });
  const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 300 } });
  const ge = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: 90,
    objective: { x: 0, z: -300 },
    facing: Math.PI
  });
  const w = { r, b, us, ge, systems, accepted, TC: r.BattleTacticalController, P: null };
  if (w.TC && opts.provider !== false) w.P = provider(w);
  return w;
}
function provider(w) {
  const calls = {},
    spec = { id: 'fixture', policies: {}, adapters: {}, lifecycle: {} };
  w.TC.points.forEach(p => {
    calls[p] = [];
    spec.policies[p] = ctx => calls[p].push(ctx);
  });
  Object.keys(CONTRACT.capabilities).forEach(c => (spec.adapters[c] = () => true));
  spec.lifecycle.cancel = () => true;
  spec.lifecycle.release = () => true;
  assert.equal(w.TC.registerProvider(spec).ok, true);
  return { calls, spec };
}
function run(w, seconds) {
  let acc = 0;
  H.run(w.r, w.b, seconds, b => {
    acc += H.AI_TICK;
    if (acc >= 0.45 - 1e-9) {
      acc = 0;
      w.systems['squad-command'].onCommanderTick(b, { town: null });
    }
  });
}
function owned(w, sq) {
  assert.equal(w.TC.requestMode(w.b, sq || w.us, 'new', 'fixture').reason, 'switched');
}
const count = (w, p, sq) => w.P.calls[p].filter(c => !sq || c.squad === sq).length;
function snapshot(w) {
  return JSON.stringify({
    men: w.b._roster.us
      .concat(w.b._roster.ge)
      .map(s => [
        s.id,
        +s.root.position.x.toFixed(6),
        +s.root.position.z.toFixed(6),
        s.dead,
        s.hp,
        s.state,
        s.eng && s.eng.state,
        s.target && s.target.id,
        s.stance
      ]),
    squads: [w.us, w.ge].map(q => [q.state, q.commandPhase, q.inContact, q.effectiveCount, q.fireControl]),
    events: w.b.events
  });
}

test('legacy mode is identical to a battle without the controller', () => {
  const a = world({ controller: false }),
    b = world();
  run(a, 40);
  run(b, 40);
  assert.ok(a.b.events.fired > 0, 'the fixture is a real firefight');
  assert.equal(snapshot(b), snapshot(a));
  b.TC.points.forEach(p => assert.equal(count(b, p), 0));
});

test('squadCommand: casualties and retreat stay with the Squad Leader; anchor and fireteams go to the provider', () => {
  const w = world();
  owned(w);
  w.us.members.slice(0, 7).forEach(s => w.b.killSoldier(s, null));
  const orders = JSON.stringify(w.us._fireteamOrders || {});
  w.r.SquadAI.updateSquad(w.us, w.b);
  assert.equal(w.us.state, 'retreat', 'morale and casualty lifecycle still run');
  assert.equal(count(w, 'squadCommand', w.us), 1);
  assert.equal(JSON.stringify(w.us._fireteamOrders || {}), orders, 'no legacy fireteam publication');
  w.r.SquadAI.updateSquad(w.ge, w.b);
  assert.equal(count(w, 'squadCommand', w.ge), 0, 'the other side stays legacy');
});

test('commanderTick and executeMission: mission acceptance stays, route/phase/plan policy goes to the provider', () => {
  const w = world();
  owned(w);
  w.us._macroMission = { version: 3, status: 'issued', intent: 'attack', legs: [{ x: 0, z: 300 }] };
  w.systems['squad-command'].onCommanderTick(w.b, { town: null });
  assert.deepEqual(w.accepted, ['us-0'], 'Macro acceptance is retained');
  assert.equal(count(w, 'commanderTick', w.us), 1);
  assert.equal(count(w, 'executeMission', w.us), 1);
  assert.equal(w.us._missionHold, null, 'no hold reason masks a controlled squad from Loop Watch');
  assert.equal(w.TC.summary(w.b).stats.dispatches.executeMission, 1);
  assert.equal(w.us._engagementPlan == null, true, 'no legacy engagement plan');
  assert.equal(count(w, 'commanderTick', w.ge), 0);
});

test('transport exclusion: an embarked squad is skipped before any controller sees it', () => {
  const w = world();
  owned(w);
  w.us._transport = { phase: 'embarked' };
  w.systems['squad-command'].onCommanderTick(w.b, { town: null });
  assert.equal(count(w, 'commanderTick', w.us), 0);
  assert.equal(count(w, 'executeMission', w.us), 0);
});

test('fireAndMovement: contact reporting stays with Engagement; fire control and bounds go to the provider', () => {
  const w = world();
  owned(w);
  run(w, 6);
  const facts = w.P.calls.fireAndMovement.filter(c => c.squad === w.us).map(c => c.facts);
  assert.ok(facts.length > 0);
  assert.ok(
    facts.every(r => r && typeof r.effective === 'number'),
    'the provider receives the contact report'
  );
  assert.ok(
    facts.some(r => r.contactStarted),
    'contact is still reported upward'
  );
  assert.equal(w.us.fireControl == null, true, 'no legacy fire-control order');
  assert.equal(w.r.BattleLeases.get(w.us, 'bound'), null, 'no legacy bound lease');
  assert.ok(w.ge.fireControl, 'the legacy side still runs fire control');
});

test('engagement: retreat, grenade completion and station execution stay; ordinary drills and suppressors go', () => {
  const w = world();
  owned(w);
  const E = w.r.BattleEngagement,
    [a, b, c, d] = w.us.members;
  E.updateSoldier(a, w.b);
  assert.equal(count(w, 'engagement', w.us), 1, 'the ordinary drill is the provider’s');
  w.r.BattleGrenades = { on: () => true, pendingOf: s => (s === b ? { aim: { x: 0, z: 90 } } : null) };
  E.updateSoldier(b, w.b);
  delete w.r.BattleGrenades;
  assert.equal(b.state, 'throw', 'a committed grenade completes');
  const post = { position: { x: 0, z: 5 } };
  w.r.BattleTacticalPositions = {
    update: s => s === c,
    current: s => (s === c ? post : null),
    anchor: () => null,
    noteAperture() {},
    release() {}
  };
  E.updateSoldier(c, w.b);
  delete w.r.BattleTacticalPositions;
  assert.equal(c.eng.state, 'station', 'station execution is maintained');
  w.us.state = 'retreat';
  E.updateSoldier(d, w.b);
  assert.equal(d.eng.state, 'withdraw', 'retreat withdrawal is retained');
  assert.equal(count(w, 'engagement', w.us), 1);
  w.us.state = 'engaged';
  w.us.members.forEach(s => (s.eng.suppressOrder = false));
  E.updateSquad(w.us, w.b);
  assert.ok(
    w.us.members.every(s => !s.eng.suppressOrder),
    'no automatic suppressor assignment'
  );
});

test('combat urgency: the ordinary shared-contact halt is the provider’s, not legacy’s', () => {
  const halts = mode => {
    const w = world(),
      E = w.r.BattleEngagement,
      seen = [],
      real = E.requestState;
    if (mode === 'new') owned(w);
    E.requestState = function (s, b, kind) {
      if (kind === 'shared-contact') seen.push(s.id);
      return real.apply(this, arguments);
    };
    const foe = w.ge.members[0],
      s = w.us.members[4];
    w.us.inContact = true;
    w.us.contact = { unit: foe, x: 0, z: 90, at: w.b.time, firstHandAt: w.b.time, seenBy: -1 };
    if (w.r.SquadAI.soldierBeliefsOn && w.r.SquadAI.soldierBeliefsOn())
      w.r.SquadAI.rememberSeen(s, foe, w.b, true, 'fixture-shared-contact');
    s.target = null;
    E.updateSoldier(s, w.b);
    return seen.length;
  };
  assert.ok(halts('legacy') > 0, 'control: legacy halts on a shared contact');
  assert.equal(halts('new'), 0);
});

test('handoff matrix: regroup ends through its owner, recon/plan/bound leases end, retreat lifecycle stays', () => {
  const w = world(),
    L = w.r.BattleLeases,
    t = w.b.time;
  ['corner-hold', 'bound', 'retreat-anchor', 'succession'].forEach(k =>
    L.grant(w.us, k, 'squad-leader', t, t + 60, 'fixture')
  );
  L.grant(w.us, 'regroup', 'squad-leader', t, Infinity, 'squad dispersed', 'fixture', {
    resumePhase: 'assault'
  });
  w.us.commandPhase = 'regroup';
  const exits = (w.us._regroupHysteresis && w.us._regroupHysteresis.exits) || 0;
  owned(w);
  assert.equal(L.get(w.us, 'regroup'), null);
  assert.equal(w.us.commandPhase, 'assault', 'the interrupted phase is restored, not stuck at regroup');
  assert.equal(w.us._regroupHysteresis.exits, exits + 1, 'the exit is counted');
  assert.ok(L.get(w.us, 'regroup-cooldown'), 'the owner grants its re-entry cooldown');
  ['corner-hold', 'bound'].forEach(k => assert.equal(L.get(w.us, k), null, k));
  ['retreat-anchor', 'succession'].forEach(k => assert.ok(L.get(w.us, k), k + ' is retained'));
  w.us._macroMission = { version: 1, status: 'executing', intent: 'attack', legs: [{ x: 0, z: 300 }] };
  w.systems['squad-command'].onCommanderTick(w.b, { town: null });
  assert.equal(
    count(w, 'executeMission', w.us),
    1,
    'a squad switched during regroup reaches its replacement'
  );
});

test('urgent cover cancels the replacement controller actions before publishing its move', () => {
  const w = world(),
    E = w.r.BattleEngagement,
    R = w.r.BattleMovementResolver,
    order = [],
    real = R.proposeCombat;
  w.P.spec.lifecycle.cancel = req => (order.push('cancel:' + req.actorId), true);
  w.TC.unregisterProvider('fixture');
  w.TC.registerProvider(w.P.spec);
  owned(w);
  const s = w.us.members[3];
  let ctx = null;
  w.P.calls.engagement.length = 0;
  E.updateSoldier(s, w.b);
  ctx = w.P.calls.engagement[0];
  assert.equal(ctx.request('movement.move', s.id, { point: { x: 4, z: 4 } }).ok, true);
  R.proposeCombat = function (who, p, b, kind) {
    if (kind === 'cover-bound') order.push('publish:' + who.id);
    return real.apply(this, arguments);
  };
  E.findCover = () => ({ x: 3, z: 3, distance: 4 });
  const foe = w.ge.members[0];
  w.us.contact = { unit: foe, x: 0, z: 90, at: w.b.time, firstHandAt: w.b.time, seenBy: -1 };
  if (w.r.SquadAI.soldierBeliefsOn && w.r.SquadAI.soldierBeliefsOn())
    w.r.SquadAI.rememberSeen(s, foe, w.b, true, 'fixture-urgent');
  s.suppressedUntil = w.b.time + 5;
  s.eng.state = 'engage';
  s.target = null;
  E.updateSoldier(s, w.b);
  R.proposeCombat = real;
  assert.deepEqual(order, ['cancel:' + s.id, 'publish:' + s.id]);
  assert.equal(w.TC.summary(w.b).actions, 0);
});

test('controller handoff clears native fire control, local task and tactical posture state', () => {
  const w = world(),
    stability = w.r.BattleSquadStability,
    postures = stability.tacticalPostures;
  let postureEnds = 0;
  const originalEnd = postures.end;
  postures.end = function () {
    postureEnds++;
    return originalEnd.apply(this, arguments);
  };
  w.us.fireControl = { state: 'hold', targetId: 1, shooterId: null };
  w.us._localTask = { kind: 'support', missionVersion: 1 };
  owned(w);
  assert.equal(w.us.fireControl, null, 'legacy HOLD is cleared through fire-control owner');
  assert.equal(w.us._localTask, null, 'legacy local task is reset through its owner');
  assert.equal(postureEnds, 1, 'the posture owner releases its policy on the switch');
  assert.equal(w.TC.mode(w.b, w.us), 'new');
});

test('station selection: maintenance stays with the hardpoint owner; automatic claims go to the provider', () => {
  const w = world(),
    threats = [];
  w.r.BattleNavigation = { firingStations: [], movementClear: () => true, rejectedWindows: [] };
  w.r.BattleTacticalRoute = {
    knownThreat(s) {
      threats.push(s.squad.id);
      return { x: 0, z: 90 };
    }
  };
  load(w.r, 'battle/modules/20-building-hardpoints.js');
  const hp = w.systems['building-hardpoints'];
  hp.onBattleStart(w.b);
  w.us.state = w.ge.state = 'engaged';
  owned(w);
  hp.onCommanderTick(w.b);
  assert.equal(count(w, 'stationSelection', w.us), 1);
  assert.equal(count(w, 'stationSelection', w.ge), 0);
  assert.ok(
    threats.length > 0 && threats.every(id => id === 'ge-0'),
    'only the legacy side searches for posts'
  );
  assert.ok(w.b._tacticalPositionSummary, 'the owner still maintains and publishes');
});

test('restart barrier: cancellation runs before any beforeBattleRestart hook clears legacy squad state', () => {
  const core = fs.readFileSync(path.join(H.REPO, 'battle/battle-sim.js'), 'utf8'),
    from = core.indexOf('  BattleSim.prototype.restart = function () {'),
    to = core.indexOf('  BattleSim.prototype.setTimeScale', from),
    order = [];
  const root = { GTLog() {}, BattleTacticalCapabilityContract: CONTRACT };
  root.window = root;
  loadModule(root, 'battle/module-registry.js', { console: quietConsole });
  load(root, 'battle/modules/13a-tactical-controller.js');
  const L = new Map();
  /* The first hook alphabetically clears the squad's leases, as squad-command's reset does. */
  root.BattleModules.registerSystem('aaa-legacy-reset', {
    beforeBattleRestart(sim) {
      order.push('legacy-reset');
      sim.factions.us.squads.forEach(q => L.delete(q));
    }
  });
  const spec = { id: 'fixture', policies: {}, adapters: {}, lifecycle: {} },
    ctx = {};
  root.BattleTacticalController.points.forEach(p => (spec.policies[p] = () => {}));
  spec.policies.fireAndMovement = c => Object.assign(ctx, c);
  Object.keys(CONTRACT.capabilities).forEach(c => (spec.adapters[c] = () => true));
  spec.lifecycle.cancel = req => {
    order.push('cancel:' + (L.has(sq) ? 'lease-intact' : 'lease-gone') + ':' + req.actionId);
    return true;
  };
  spec.lifecycle.release = () => true;
  root.BattleTacticalController.registerProvider(spec);
  function Sim() {
    this.time = 1;
    this._roster = { us: [], ge: [] };
    this.factions = { us: { squads: [] }, ge: { squads: [] } };
  }
  Sim.prototype.spawnAll = function () {
    order.push('roster');
  };
  new Function('root', 'BattleSim', core.slice(from, to))(root, Sim);
  const sim = new Sim(),
    sq = { id: 'us-0', faction: 'us', members: [{ id: 1, dead: false }], _macroMission: { version: 1 } };
  sim.factions.us.squads.push(sq);
  L.set(sq, 'bound');
  root.BattleTacticalController.requestMode(sim, sq, 'new', 'fixture');
  root.BattleTacticalController.dispatch(sim, sq, 'fireAndMovement');
  const id = ctx.request('movement.move', 1, { point: { x: 1, z: 1 } }).actionId;
  sim.restart();
  assert.deepEqual(order, ['cancel:lease-intact:' + id, 'legacy-reset', 'roster']);
  assert.equal(root.BattleTacticalController.mode(sim, sq), 'legacy');
});

console.log(n + ' tactical controller owner-integration checks passed');
