#!/usr/bin/env node
'use strict';

/* Exercise the shipping weapon owners and clock. No rendered assets or AI seed arms are needed
   to prove that a committed grenade releases once, survives its thrower, and obeys blast cover. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log('PASS ' + name);
}
function load(root, rel, errors) {
  new Function(
    'window',
    'globalThis',
    'console',
    'BABYLON',
    'location',
    fs.readFileSync(path.join(H.REPO, rel), 'utf8')
  )(root, root, { log() {}, warn() {}, error: (...args) => errors.push(args) }, root.BABYLON, root.location);
}
function man(ctx, faction, x, z, role) {
  const sq = H.addSquad(ctx.r, ctx.b, {
    id: faction + '-' + ctx.b.factions[faction].squads.length,
    faction,
    x,
    z,
    composition: [role || 'rifleman'],
    objective: { x: 100, z: 0 }
  });
  const s = sq.members[0];
  s.root.position.set(x, ctx.b.heightAt(x, z), z);
  return s;
}
function setup(opts) {
  opts = opts || {};
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: opts.search == null ? '?grenades=1&log=0' : opts.search });
  const errors = [];
  for (const rel of [
    'battle/module-registry.js',
    'battle/scenario-generator.js',
    'battle/modules/08-soldier-events.js',
    'battle/modules/14-wound-model.js',
    'battle/modules/14-z-ballistic-raycast.js'
  ])
    load(r, rel, errors);
  const ownDraws = { count: 0, streams: [] };
  const rngFor = r.BattleScenarioGenerator.rngFor;
  r.BattleScenarioGenerator.rngFor = (seed, salt) => {
    ownDraws.streams.push(salt);
    const rng = rngFor(seed, salt);
    return () => {
      ownDraws.count++;
      return rng();
    };
  };
  load(r, 'battle/modules/23-grenades.js', errors);
  const b = H.makeBattle(r, { obstacles: opts.obstacles || [], heightAt: opts.heightAt });
  b.scene = { metadata: { battleScenario: { seed: opts.seed || 'grenade-contract' } } };
  b.time = 10;
  let combatDraws = 0;
  b.random = () => {
    combatDraws++;
    return 0.5; // abdomen, mean severity, no drop: distance can be compared without casualty noise.
  };
  const ctx = { r, b, G: r.BattleGrenades, errors, ownDraws, combatDraws: () => combatDraws };
  ctx.s = man(ctx, 'us', 0, 0);
  r.BattleSoldierEvents.subscribe('grenade-check', ['suppressed', 'wound']);
  r.BattleModules.runHook('onBattleStart', b, {});
  assert.deepEqual(errors, [], 'lifecycle hooks must not swallow a runtime error');
  return ctx;
}
function at(ctx, time) {
  const dt = time - ctx.b.time;
  ctx.b.time = time;
  ctx.r.BattleModules.runHook('onSimulationStep', ctx.b, { dt });
  assert.deepEqual(ctx.errors, [], 'simulation hooks must not swallow a runtime error');
}
function throwOnce(ctx, aim) {
  ctx.s.isPlayer = true;
  const plan = ctx.G.playerThrow(ctx.s, ctx.b, aim || { x: 20, z: 0 });
  assert.ok(plan, 'a player can commit a safe throw');
  at(ctx, plan.releaseAt);
  const live = ctx.G.projectiles(ctx.b);
  assert.equal(live.length, 1, 'the release creates exactly one live grenade');
  return live[0];
}
function victim(ctx, x, z, faction) {
  const s = man(ctx, faction || 'ge', x, z);
  s.hp = s.maxHp = 1000;
  return s;
}
function events(ctx, s) {
  const rows = [];
  ctx.r.BattleSoldierEvents.drain(s, 'grenade-check', (kind, data, at) => rows.push({ kind, data, at }));
  return rows;
}
function hiddenContact(ctx, opts) {
  opts = opts || {};
  ctx.b.obstacles = [{ shape: 'obb', x: 10, z: 0, hx: 0.25, hz: 6, y: 0, height: 3, type: 'wall' }];
  ctx.r.SquadAI.rememberReportedContact(ctx.s, ctx.b, {
    x: opts.x == null ? 20 : opts.x,
    z: 0,
    observedAt: opts.at == null ? ctx.b.time : opts.at,
    confidence: 0.9,
    sourceId: 'known-observer',
    reportId: 'grenade-known-contact',
    otherFaction: 'ge'
  });
}

test('grenades are on by default and only an absent or complete grenades=1 value keeps them on', () => {
  for (const search of [
    '?grenades=0',
    '?grenades=10',
    '?grenades=1.0',
    '?grenades=1-extra',
    '?grenades=off',
    '?grenades='
  ]) {
    const { G } = setup({ search: search + '&log=0' });
    assert.equal(G.on(), false, search);
  }
  for (const search of ['?log=0', '?xgrenades=0&log=0', '?x=1&grenades=1&log=0'])
    assert.equal(setup({ search }).G.on(), true, search);
  assert.equal(setup({ search: '' }).G.on(), true, 'an empty query string is the default battle');
});

test('OFF has no registered grenade clock, field writes or RNG draws, including read APIs', () => {
  const ctx = setup({ search: '?grenades=0&log=0' });
  const { r, b, s, G } = ctx;
  const before = Object.keys(s).sort();
  const battleBefore = Object.keys(b).sort();
  assert.ok(!r.BattleModules.listSystems().some(system => /grenade/.test(system.id)));
  assert.ok(!G.consider(s, b));
  s.isPlayer = true;
  assert.ok(!G.playerThrow(s, b, { x: 20, z: 0 }));
  delete s.isPlayer;
  G.count(s);
  G.cooldownLeft(s, b);
  G.pendingOf(s, b);
  assert.equal(G.reviewDue(s, b), false);
  G.preview(s, b, { x: 20, z: 0 });
  G.projectiles(b);
  G.summary(b);
  r.BattleModules.runHook('onBattleRestart', b, {});
  at(ctx, b.time + 1);
  assert.deepEqual(Object.keys(s).sort(), before);
  assert.deepEqual(Object.keys(b).sort(), battleBefore);
  assert.equal(ctx.ownDraws.count, 0);
  assert.deepEqual(ctx.ownDraws.streams, []);
  assert.equal(ctx.combatDraws(), 0);
});

test('inventory is role-issued, consumed at release once, and cooldown begins at release', () => {
  const ctx = setup();
  const { G, s, b, r } = ctx;
  const carried = G.count(s);
  assert.equal(carried, r.SquadAI.loadoutFor(s.role, s.faction).grenades);
  assert.ok(carried > 0);
  s.isPlayer = true;
  const plan = G.playerThrow(s, b, { x: 20, z: 0 });
  assert.ok(plan);
  assert.equal(G.count(s), carried, 'a windup does not spend inventory');
  assert.equal(G.cooldownLeft(s, b), 0);
  assert.ok(!G.playerThrow(s, b, { x: 20, z: 0 }), 'the same man cannot commit twice');
  assert.equal(
    r.SquadAI.playerFireRay(s, { x: 20, y: 1, z: 0 }, b),
    false,
    'the authoritative player trigger rejects rifle fire during a throw windup'
  );
  assert.equal(b.events.fired, 0);
  at(ctx, plan.releaseAt - 0.001);
  assert.equal(G.projectiles(b).length, 0);
  at(ctx, plan.releaseAt);
  assert.equal(G.count(s), carried - 1);
  assert.equal(G.pendingOf(s, b), null);
  assert.equal(G.cooldownLeft(s, b), G.TUNING.COOLDOWN);
  assert.equal(G.summary(b).throws, 1);
  assert.equal(ctx.combatDraws(), 0, 'landing scatter does not touch combat RNG');
  assert.ok(ctx.ownDraws.count > 0);
  assert.deepEqual(ctx.ownDraws.streams, ['grenades']);
  at(ctx, b.time);
  assert.equal(G.count(s), carried - 1);
  assert.equal(G.summary(b).throws, 1);
});

test('a committed motion survives possession, retreat, freeze, reload and loss of weapon', () => {
  const ctx = setup();
  const { G, s, b } = ctx;
  const carried = G.count(s);
  s.isPlayer = true;
  const plan = G.playerThrow(s, b, { x: 20, z: 0 });
  assert.ok(plan);
  s.isPlayer = false;
  s.squad.state = 'retreat';
  s.eng = { state: 'freeze' };
  s.weapon = null;
  s.reloading = true;
  s.crawling = true;
  at(ctx, plan.releaseAt);
  assert.equal(G.count(s), carried - 1);
  assert.equal(G.projectiles(b).length, 1);
  assert.equal(G.summary(b).aborted, 0);
});

test('death during windup aborts once without spending inventory or scatter draws', () => {
  const ctx = setup();
  const { G, s, b } = ctx;
  s.isPlayer = true;
  const carried = G.count(s);
  const plan = G.playerThrow(s, b, { x: 20, z: 0 });
  assert.ok(plan);
  s.dead = true;
  at(ctx, b.time + 0.1);
  assert.equal(G.pendingOf(s, b), null);
  assert.equal(G.count(s), carried);
  assert.equal(G.summary(b).aborted, 1);
  at(ctx, plan.releaseAt + 1);
  assert.equal(G.summary(b).aborted, 1);
  assert.equal(G.projectiles(b).length, 0);
  assert.equal(ctx.ownDraws.count, 0);
});

test('a late clock step uses casualty time to distinguish death before and after release', () => {
  for (const offset of [-0.1, 0, 0.1]) {
    const ctx = setup();
    const { G, s, b } = ctx;
    s.isPlayer = true;
    const carried = G.count(s);
    const plan = G.playerThrow(s, b, { x: 20, z: 0 });
    assert.ok(plan);
    b.killSoldier(s, null);
    s.casualty = { at: plan.releaseAt + offset };
    at(ctx, plan.releaseAt + 0.25);
    const released = offset > 0;
    assert.equal(G.summary(b).throws, released ? 1 : 0, 'casualty offset ' + offset);
    assert.equal(G.summary(b).aborted, released ? 0 : 1, 'casualty offset ' + offset);
    assert.equal(G.count(s), carried - (released ? 1 : 0));
    assert.equal(G.projectiles(b).length, released ? 1 : 0);
    if (released) assert.equal(G.projectiles(b)[0].releasedAt, plan.releaseAt);
    else assert.equal(ctx.ownDraws.count, 0, 'death before release cannot consume scatter draws');
  }
});

test('AI needs a known blocked close contact and preserves reported coordinates', () => {
  const ctx = setup();
  const { G, s, b, r } = ctx;
  assert.equal(G.consider(s, b), null, 'unreported enemies cannot supply an aim');
  const enemy = man(ctx, 'ge', 20, 0);
  s.target = enemy;
  assert.equal(G.consider(s, b), null, 'a clear rifle solution does not need a grenade');
  r.SquadAI.clearTarget(s);
  hiddenContact(ctx);
  enemy.root.position.x = 100;
  const plan = G.consider(s, b);
  assert.ok(plan, 'a fresh personal report behind cover is actionable');
  assert.deepEqual(plan.aim, { x: 20, z: 0 }, 'memory is not upgraded from the enemy live position');
});

test('AI decision rejects stale, distant, friendly-danger, empty, reload, crawl and cooldown cases', () => {
  for (const reason of ['stale', 'range', 'friend', 'empty', 'reload', 'crawl', 'cooldown']) {
    const ctx = setup();
    hiddenContact(ctx, reason === 'stale' ? { at: ctx.b.time - ctx.G.TUNING.CONTACT_FRESH - 0.1 } : {});
    if (reason === 'range') ctx.s.root.position.x = -ctx.G.TUNING.RANGE;
    if (reason === 'friend') man(ctx, 'us', 20, 0);
    if (reason === 'empty') ctx.s.grenades = 0;
    if (reason === 'reload') ctx.s.reloading = true;
    if (reason === 'crawl') ctx.s.crawling = true;
    if (reason === 'cooldown') ctx.s._grenadeNextAt = ctx.b.time + 1;
    assert.equal(ctx.G.consider(ctx.s, ctx.b), null, reason);
  }
});

test('Engagement orients, commits the throw action, blocks rifle fire, and leaves it after release', () => {
  const ctx = setup();
  const { G, r, s, b } = ctx;
  const E = r.BattleEngagement;
  const enemy = man(ctx, 'ge', 20, 0);
  s.target = enemy;
  s.root.rotation.y = Math.PI / 2;
  r.SquadAI.rememberSeen(s, enemy, b, true, 'grenade-test');
  const e = E.stateOf(s);
  E.updateSoldier(s, b);
  assert.equal(e.state, 'orient', 'recognition precedes the combat decision');
  b.time = e.until;
  hiddenContact(ctx);
  E.updateSoldier(s, b);
  assert.equal(e.state, 'throw');
  assert.equal(s.state, 'throw');
  const plan = G.pendingOf(s, b);
  assert.ok(plan, 'the Engagement action owns a real pending commitment');
  b.obstacles = [];
  r.SquadAI.setFireCooldown(s, 0);
  assert.equal(r.SquadAI.tryFire(s, b), false, 'a now-clear rifle cannot fire during the windup');
  assert.equal(E.suppress(s, b, { x: 20, z: 0 }), false, 'suppression cannot bypass the windup');
  assert.equal(ctx.combatDraws(), 0);
  at(ctx, plan.releaseAt);
  E.updateSoldier(s, b);
  assert.notEqual(e.state, 'throw', 'the next Engagement tick resumes combat after clock release');
  assert.equal(G.summary(b).throws, 1);
});

test('Engagement can throw at a remembered enemy after cover removes its live target', () => {
  const ctx = setup();
  const { G, r, s, b } = ctx;
  hiddenContact(ctx);
  s.squad.inContact = true;
  r.BattleEngagement.requestState(s, b, 'shared-contact', 1);
  r.BattleEngagement.updateSoldier(s, b);
  assert.equal(s.target, null);
  assert.equal(r.BattleEngagement.stateOf(s).state, 'throw');
  assert.deepEqual(G.pendingOf(s, b).aim, { x: 20, z: 0 });
});

test('an alert with no actionable grenade preserves the existing Engagement cover-review clock', () => {
  const ctx = setup();
  const { G, r, s, b } = ctx;
  const E = r.BattleEngagement;
  s.squad.inContact = true;
  E.requestState(s, b, 'shared-contact', 10);
  const e = E.stateOf(s);
  const coverReviewAt = b.time - 2;
  e.reviewAt = coverReviewAt;
  E.updateSoldier(s, b);
  assert.equal(G.pendingOf(s, b), null, 'the alert has no known grenade target');
  assert.equal(e.reviewAt, coverReviewAt, 'a failed grenade decision cannot reschedule cover review');
  b.time += G.TUNING.DECISION_EVERY;
  E.updateSoldier(s, b);
  assert.equal(e.reviewAt, coverReviewAt, 'later grenade reviews still leave that clock alone');
  assert.equal(G.summary(b).throws, 0);
});

test('grenade review cadence is per soldier, resets with the battle, and never writes Engagement state', () => {
  const ctx = setup();
  const { G, r, s, b } = ctx;
  const e = r.BattleEngagement.stateOf(s);
  e.reviewAt = 37;
  const before = JSON.stringify(e);
  assert.equal(G.reviewDue(s, b), true);
  assert.equal(G.reviewDue(s, b), false, 'a repeated same-tick review is not due');
  b.time += G.TUNING.DECISION_EVERY - 0.01;
  assert.equal(G.reviewDue(s, b), false);
  b.time += 0.01;
  assert.equal(G.reviewDue(s, b), true, 'the next review becomes due at its own cadence');
  const other = man(ctx, 'us', -100, 0);
  assert.equal(G.reviewDue(other, b), true, 'one soldier cannot delay another soldier review');
  assert.equal(G.reviewDue(s, b), false);
  r.BattleModules.runHook('onBattleRestart', b, {});
  assert.equal(G.reviewDue(s, b), true, 'restart discards the prior review cadence');
  assert.equal(JSON.stringify(e), before, 'cadence and reset never mutate the Engagement record');
});

test('a bound without cover cannot bypass HOLD FIRE, and OPEN FIRE permits the same throw', () => {
  const ctx = setup({ search: '?grenades=1&commandPosture=0&stressAct=0&log=0' });
  const { G, r, s, b } = ctx;
  const E = r.BattleEngagement;
  const enemy = man(ctx, 'ge', 20, 0);
  s.target = enemy;
  hiddenContact(ctx);
  const e = E.stateOf(s);
  e.state = 'bound';
  e.cover = null;
  s.squad.fireControl = { state: 'hold' };
  assert.equal(E.fireAuthorized(s, b), false);
  E.updateSoldier(s, b);
  assert.equal(G.pendingOf(s, b), null, 'the bound recovery must honor the Squad Leader fire permission');
  assert.equal(G.summary(b).throws, 0);
  assert.equal(ctx.ownDraws.count, 0);
  e.state = 'bound';
  e.cover = null;
  s.crawling = false;
  s.squad.fireControl = { state: 'open' };
  assert.equal(E.fireAuthorized(s, b), true);
  E.updateSoldier(s, b);
  assert.equal(e.state, 'throw');
  assert.ok(G.pendingOf(s, b), 'opening fire authorizes that same bound-recovery decision');
});

test('preview is deterministic and read-only, and an intervening wall stops the released arc', () => {
  const ctx = setup();
  const { G, r, s, b } = ctx;
  s.isPlayer = true;
  const keys = Object.keys(s).sort();
  const first = G.preview(s, b, { x: 100, z: 0 });
  assert.ok(first.legal);
  assert.ok(Math.hypot(first.to.x, first.to.z) <= G.TUNING.RANGE, 'player aim is capped at throw range');
  assert.deepEqual(G.preview(s, b, { x: 100, z: 0 }), first);
  assert.deepEqual(Object.keys(s).sort(), keys);
  assert.equal(ctx.ownDraws.count, 0);
  assert.equal(ctx.combatDraws(), 0);
  b.obstacles = [{ shape: 'obb', x: 10, z: 0, hx: 0.25, hz: 20, y: 0, height: 20, type: 'wall' }];
  assert.equal(G.preview(s, b, { x: 20, z: 0 }).legal, false);
  assert.equal(G.playerThrow(s, b, { x: 20, z: 0 }), null, 'a known blocked arc cannot be committed');
  b.obstacles = [];
  const plan = G.playerThrow(s, b, { x: 20, z: 0 });
  assert.ok(plan);
  b.obstacles = [{ shape: 'obb', x: 10, z: 0, hx: 0.25, hz: 20, y: 0, height: 20, type: 'wall' }];
  at(ctx, plan.releaseAt);
  const g = G.projectiles(b)[0];
  assert.ok(g, 'a committed throw releases even when the arc becomes obstructed');
  assert.ok(g.to.x <= 9.75, 'the actual flight stops outside the physical wall face');
  for (let t = g.releasedAt; t <= g.releasedAt + g.flight; t += 0.02)
    assert.ok(G.position(g, t).x <= 9.75, 'the visible flight cannot pass through the wall');
  assert.ok(r.BattleBallistics.environmentLineBlocked, 'flight uses the shared physical-line owner');
});

test('every released flight segment stays clear, including settling onto a building roof', () => {
  const ctx = setup();
  const { G, r, s, b } = ctx;
  s.isPlayer = true;
  const plan = G.playerThrow(s, b, { x: 24, z: 0 });
  assert.ok(plan);
  b.obstacles = [{ shape: 'obb', x: 20, z: 0, hx: 5, hz: 5, y: 0, height: 3, type: 'building' }];
  at(ctx, plan.releaseAt);
  const g = G.projectiles(b)[0];
  assert.ok(g, 'appearing cover changes the flight without cancelling the committed release');
  assert.ok(g.to.x > 15 && g.to.x < 25, 'the landing lies over the building footprint');
  assert.ok(
    g.to.y >= 3,
    'a roof impact cannot settle through the building to ground level: ' + JSON.stringify(g.points.slice(-2))
  );
  for (let i = 1; i < g.points.length; i++)
    assert.equal(
      r.BattleBallistics.environmentLineBlocked(g.points[i - 1], g.points[i], b),
      false,
      'released path segment ' + i + ' must remain outside physical cover'
    );
  assert.deepEqual(G.position(g, g.releasedAt + g.flight), g.to);
});

test('a late clock step preserves scheduled release, cooldown and fuse times', () => {
  const ctx = setup();
  const { G, s, b } = ctx;
  s.isPlayer = true;
  const plan = G.playerThrow(s, b, { x: 20, z: 0 });
  assert.ok(plan);
  at(ctx, plan.releaseAt + 0.25);
  const g = G.projectiles(b)[0];
  assert.equal(g.releasedAt, plan.releaseAt);
  assert.equal(g.detonateAt, plan.releaseAt + g.flight + G.TUNING.FUSE);
  assert.equal(G.cooldownLeft(s, b), G.TUNING.COOLDOWN - 0.25);
  at(ctx, g.detonateAt + 0.25);
  assert.equal(G.summary(b).bursts, 1);
  at(ctx, b.time + 0.25);
  assert.equal(G.summary(b).throws, 1);
  assert.equal(G.summary(b).bursts, 1);
});

test('scatter replays from its own scenario stream and projectiles cannot be rewritten by readers', () => {
  const a = setup({ seed: 'grenade-replay' });
  const ga = throwOnce(a);
  const b = setup({ seed: 'grenade-replay' });
  for (let i = 0; i < 19; i++) b.b.random();
  const gb = throwOnce(b);
  assert.deepEqual(ga.to, gb.to, 'unrelated combat RNG draws cannot move the grenade');
  const c = setup({ seed: 'grenade-other' });
  assert.notDeepEqual(ga.to, throwOnce(c).to, 'a different scenario seed changes the landing');
  assert.ok(Object.isFrozen(ga));
  assert.ok(Object.isFrozen(ga.from));
  assert.ok(Object.isFrozen(ga.to));
  assert.throws(() => (ga.to.x = 900), TypeError);
  const view = a.G.projectiles(a.b);
  assert.ok(Object.isFrozen(view));
  assert.throws(() => view.pop(), TypeError);
  assert.equal(a.G.projectiles(a.b).length, 1, 'presentation cannot remove a live grenade');
});

test('the projectile flies, lands and detonates once on simulation time', () => {
  const ctx = setup();
  const { G, b } = ctx;
  const g = throwOnce(ctx);
  assert.deepEqual(G.position(g, g.releasedAt), g.from);
  const middle = G.position(g, g.releasedAt + g.flight / 2);
  assert.ok(middle.y > Math.max(g.from.y, g.to.y), 'flight has a visible arc');
  assert.deepEqual(G.position(g, g.releasedAt + g.flight), g.to);
  assert.deepEqual(G.position(g, g.detonateAt - 0.001), g.to);
  at(ctx, g.detonateAt - 0.001);
  assert.equal(G.summary(b).bursts, 0);
  at(ctx, g.detonateAt);
  assert.equal(G.summary(b).bursts, 1);
  assert.equal(G.projectiles(b).length, 0);
  at(ctx, g.detonateAt + 1);
  assert.equal(G.summary(b).bursts, 1);
});

test('one burst wounds multiple enemies, friends and the thrower with falloff and radius limits', () => {
  const ctx = setup();
  const { G, b, s } = ctx;
  const g = throwOnce(ctx);
  const close = victim(ctx, g.to.x + 0.5, g.to.z);
  const far = victim(ctx, g.to.x + G.TUNING.BLAST_RADIUS * 0.7, g.to.z);
  const edge = victim(ctx, g.to.x + G.TUNING.BLAST_RADIUS, g.to.z);
  const pinOnly = victim(ctx, g.to.x, g.to.z + G.TUNING.BLAST_RADIUS + 0.2);
  const outside = victim(ctx, g.to.x, g.to.z + G.TUNING.SUPPRESS_RADIUS + 0.2);
  const friend = victim(ctx, g.to.x + 2, g.to.z, 'us');
  s.root.position.set(g.to.x - 2, 0, g.to.z);
  s.hp = s.maxHp = 1000;
  at(ctx, g.detonateAt);
  assert.ok(close.hp < far.hp && far.hp < 1000, 'fragment severity falls with distance');
  assert.ok(close.bleedRate > far.bleedRate, 'fragment bleeding also falls with distance');
  assert.ok(close.woundSpeed < far.woundSpeed, 'fragment slowing also falls with distance');
  assert.ok(close.woundSigma > far.woundSigma, 'fragment shooting impairment also falls with distance');
  assert.ok(friend.hp < 1000, 'friendship does not grant immunity after release');
  assert.ok(s.hp < 1000, 'the thrower is a normal blast victim');
  assert.equal(edge.hp, 1000, 'zero-energy radius edge cannot wound or drop');
  assert.ok(!edge.dead);
  assert.ok(!edge.wounds || !edge.wounds.length);
  assert.equal(pinOnly.hp, 1000);
  assert.ok(pinOnly.suppressedUntil > b.time, 'suppression reaches beyond the fragment radius');
  assert.equal(outside.hp, 1000);
  assert.equal(outside.suppressedUntil, 0);
  const seen = events(ctx, close);
  assert.ok(seen.some(row => row.kind === 'suppressed'));
  assert.ok(
    seen.some(row => row.kind === 'wound'),
    'the wound owner posts ordinary stress events'
  );
  assert.equal(G.summary(b).wounded, 4);
});

test('enemy grenade casualties earn kill credit while friendly and self casualties retain cause only', () => {
  for (const relation of ['enemy', 'friend', 'self']) {
    const ctx = setup();
    const { G, r, s, b } = ctx;
    const g = throwOnce(ctx);
    const v = relation === 'self' ? s : victim(ctx, g.to.x + 0.5, g.to.z, relation === 'enemy' ? 'ge' : 'us');
    if (relation === 'self') s.root.position.set(g.to.x + 0.5, 0, g.to.z);
    v.hp = 1;
    r.BattleSoldierEvents.subscribe('grenade-check', ['kill']);
    const credited = [];
    const noteKill = r.BattleEngagement.noteKill;
    r.BattleEngagement.noteKill = by => {
      credited.push(by);
      noteKill(by);
    };
    at(ctx, g.detonateAt);
    assert.ok(v.dead, relation + ' fixture receives a lethal blast');
    assert.equal(v.casualty.by, s.id, relation + ' casualty retains the causal thrower');
    assert.equal(v.casualty.source, 'grenade');
    assert.equal(v.wounds.at(-1).source, 'grenade');
    assert.equal(v.wounds.at(-1).by, s.id);
    assert.equal(b.factions.us.kills, relation === 'enemy' ? 1 : 0);
    assert.equal(b.factions.ge.kills, 0);
    assert.deepEqual(
      credited,
      [relation === 'enemy' ? s : null],
      'Engagement receives enemy kill credit only'
    );
    assert.equal(events(ctx, s).filter(row => row.kind === 'kill').length, relation === 'enemy' ? 1 : 0);
    assert.equal(G.summary(b).casualties, 1);
    assert.equal(G.summary(b).friendlyCasualties, relation === 'enemy' ? 0 : 1);
  }
});

test('a friendly grenade wound that later bleeds out preserves source and counts without kill credit', () => {
  const ctx = setup();
  const { G, r, s, b } = ctx;
  const g = throwOnce(ctx);
  const friend = victim(ctx, g.to.x + 1, g.to.z, 'us');
  friend.hp = 75;
  r.BattleSoldierEvents.subscribe('grenade-check', ['kill']);
  const credited = [];
  const noteKill = r.BattleEngagement.noteKill;
  r.BattleEngagement.noteKill = by => {
    credited.push(by);
    noteKill(by);
  };
  at(ctx, g.detonateAt - 0.001);
  at(ctx, g.detonateAt);
  assert.ok(!friend.dead, 'the friend survives the initial fragmentation hit');
  assert.ok(friend.bleedRate > 0);
  assert.equal(friend.wounds.at(-1).source, 'grenade');
  assert.equal(friend.wounds.at(-1).by, s.id);
  assert.equal(G.summary(b).casualties, 0);
  s.weapon = null;
  for (let i = 0; i < 120 && !friend.dead; i++) at(ctx, b.time + 1);
  assert.ok(friend.dead, 'the ordinary wound clock eventually records the bleed-out');
  assert.equal(friend.casualty.cause, 'bledOut');
  assert.equal(friend.casualty.by, s.id);
  assert.equal(friend.casualty.source, 'grenade');
  assert.deepEqual(credited, [null]);
  assert.equal(b.factions.us.kills, 0);
  assert.equal(events(ctx, s).filter(row => row.kind === 'kill').length, 0);
  assert.equal(r.BattleWounds.summary(b).grenadeCasualties, 1);
  assert.equal(r.BattleWounds.summary(b).grenadeFriendlyCasualties, 1);
  assert.equal(G.summary(b).casualties, 1, 'grenade totals include delayed casualties');
  assert.equal(G.summary(b).friendlyCasualties, 1);
  assert.equal(G.summary(b).bursts, 1);
});

test('blast follows physical cover footprints, including a clear line inside a wider visual volume', () => {
  for (const blocked of [false, true]) {
    const ctx = setup();
    const g = throwOnce(ctx);
    const v = victim(ctx, g.to.x + 4, g.to.z);
    const z = g.to.z + (blocked ? 0 : 1.5);
    const ob = { x: g.to.x + 2, z, y: 0, height: 3, radius: 2.1, type: 'log', physicalId: 'blast-log' };
    const obstacles = [ob];
    obstacles.__physicalFootprints = [
      { id: 'blast-log', shape: 'obb', x: ob.x, z, hx: 0.2, hz: 0.2, ux: 1, uz: 0, vx: 0, vz: 1 }
    ];
    obstacles.__physicalVersion = 1;
    ctx.b.obstacles = obstacles;
    at(ctx, g.detonateAt);
    assert.equal(
      v.hp < 1000,
      !blocked,
      blocked ? 'physical cover stops fragments' : 'visual padding is not cover'
    );
    assert.ok(v.suppressedUntil > ctx.b.time, 'the blast pins through cover');
  }
});

test('terrain and navigation walls stop fragments while leaving burst suppression', () => {
  for (const blocker of ['terrain', 'wall']) {
    const ctx = setup();
    const g = throwOnce(ctx);
    const v = victim(ctx, g.to.x + 5, g.to.z);
    if (blocker === 'terrain') ctx.b.heightAt = x => (x > g.to.x + 1.5 && x < g.to.x + 3.5 ? 3 : 0);
    else ctx.r.BattleNavigation = { lineOfSightBlocked: () => true };
    at(ctx, g.detonateAt);
    assert.equal(v.hp, 1000, blocker);
    assert.ok(v.suppressedUntil > ctx.b.time, blocker + ' still transmits suppression');
    assert.equal(ctx.combatDraws(), 0, 'an occluded victim never invokes wound RNG');
  }
});

test('a released blast keeps its own severity after its thrower dies or abandons the rifle', () => {
  const damage = [];
  for (const change of ['none', 'death', 'weapon']) {
    const ctx = setup({ seed: 'grenade-thrower-lifecycle' });
    const g = throwOnce(ctx);
    const v = victim(ctx, g.to.x + 1, g.to.z);
    if (change === 'death') ctx.b.killSoldier(ctx.s, null);
    if (change === 'weapon') ctx.s.weapon = null;
    at(ctx, g.detonateAt);
    damage.push(1000 - v.hp);
    assert.equal(ctx.G.summary(ctx.b).bursts, 1);
  }
  assert.ok(damage[0] > 0);
  assert.equal(damage[1], damage[0]);
  assert.equal(damage[2], damage[0]);
});

test('restart discards old commitments and projectiles, restores loadout and replays scatter', () => {
  const ctx = setup({ seed: 'grenade-restart' });
  const { G, s, b, r } = ctx;
  const carried = G.count(s);
  const first = throwOnce(ctx);
  const other = man(ctx, 'us', -50, 0);
  other.isPlayer = true;
  assert.ok(G.playerThrow(other, b, { x: -30, z: 0 }));
  b.time = 10;
  r.BattleModules.runHook('onBattleRestart', b, {});
  assert.deepEqual(ctx.errors, []);
  assert.equal(G.pendingOf(other, b), null);
  assert.equal(G.projectiles(b).length, 0);
  assert.equal(G.summary(b).throws, 0);
  assert.equal(G.summary(b).bursts, 0);
  assert.equal(G.count(s), carried);
  assert.equal(G.cooldownLeft(s, b), 0);
  assert.deepEqual(throwOnce(ctx).to, first.to);
});

console.log(checks + ' grenade checks passed');
