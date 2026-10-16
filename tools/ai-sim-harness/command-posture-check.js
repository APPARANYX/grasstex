#!/usr/bin/env node
'use strict';
/* Phase 0B: personally adopted posture/fire-control orders.

   The Squad Leader still owns the shared fire-control decision. Command Reception owns only the
   per-man receipt/adoption sidecar, and Engagement remains the sole executor of stance/fire permission.
   The behavior is opt-in with ?commandPosture=1 while benchmark validation is pending. */
const assert = require('node:assert/strict'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}

function world(search, range) {
  H.resetIds();
  const r = H.bootstrap({ search: search || '?stressAct=0&fireControl=1&commandPosture=1', stats: true });
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  const b = H.makeBattle(r, { seed: 91 });
  const us = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 200 },
    facing: 0
  });
  const ge = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: range || 100,
    objective: { x: 0, z: -200 },
    facing: Math.PI
  });
  const foe = ge.members[0];
  ge.members.slice(1).forEach(s => (s.dead = true));
  us.commandPhase = 'assault';
  us.members.forEach(s => {
    s.target = foe;
    s.root.rotation.y = 0;
    s.moving = false;
    s.moveSpeed = 0;
    s.suppressedUntil = 0;
  });
  if (r.SquadAI.soldierBeliefsOn && r.SquadAI.soldierBeliefsOn())
    us.members.forEach(s => r.SquadAI.rememberSeen(s, foe, b, true, 'fixture-first-sight'));
  us.contact = {
    unit: foe,
    x: foe.root.position.x,
    z: foe.root.position.z,
    at: b.time,
    seenBy: us.members[2].id,
    stance: 'stand',
    firstHandAt: b.time
  };
  return { r, b, us, ge, foe, E: r.BattleEngagement, Q: r.BattleSquadStability, C: r.BattleCommandReception };
}
function command(w) {
  w.Q.fireAndMovement(w.us, w.b);
  return w.us.fireControl;
}
function rec(w, s) {
  return w.C.snapshot(s, w.b).records['posture-fire|squad'];
}
function adopted(w, s) {
  return w.C.adopted(s, w.b, 'posture-fire', 'squad');
}

test('posture adoption is default-on after Phase 0E benchmark validation', () => {
  assert.equal(
    world('?stressAct=0&fireControl=1').C.postureEnabled(),
    true,
    'default battle now uses posture adoption'
  );
  assert.equal(
    world('?stressAct=0&fireControl=1&commandPosture=0').C.postureEnabled(),
    false,
    '?commandPosture=0 is the legacy control arm'
  );
  assert.equal(world('?stressAct=0&fireControl=1&commandPosture=1').C.postureEnabled(), true);
});

test('a fresh HOLD order is not personal truth until that soldier adopts it', () => {
  const w = world(),
    man = w.us.members[4];
  const fc = command(w);
  assert.equal(fc.state, 'hold');
  const pending = rec(w, man);
  assert.ok(pending && pending.adoptedAt > w.b.time, JSON.stringify(pending));
  assert.equal(adopted(w, man), null, 'no previously adopted posture order');
  assert.equal(w.E.fireAuthorized(man, w.b), true, 'the new squad HOLD is not psychic');

  w.b.time = pending.adoptedAt + 0.001;
  const active = adopted(w, man);
  assert.equal(active.data.state, 'hold');
  assert.equal(w.E.fireAuthorized(man, w.b), false, 'HOLD applies after personal adoption');
  w.E.updateSoldier(man, w.b);
  assert.equal(man.prone, true, 'Engagement, not Command Reception, executes the adopted low posture');
});

test('one HOLD command yields staggered individual execution instead of a same-tick squad flip', () => {
  const w = world();
  command(w);
  const men = w.us.members.filter(s => !s.dead),
    rows = men.map(s => ({ s, r: rec(w, s) }));
  const times = rows.map(x => x.r.adoptedAt).sort((a, b) => a - b);
  assert.ok(new Set(times).size > 1, 'personal adoption deadlines differ');
  const probe = (times[2] + times[7]) / 2;
  w.b.time = probe;
  const blocked = rows.filter(x => !w.E.fireAuthorized(x.s, w.b)).length;
  assert.ok(
    blocked > 0 && blocked < men.length,
    'some men have HOLD while others have not: ' + blocked + '/' + men.length
  );
});

test('an adopted HOLD remains effective until the replacement OPEN is personally adopted', () => {
  const w = world(),
    man = w.us.members[6];
  command(w);
  let hold = rec(w, man);
  w.b.time = hold.adoptedAt + 0.01;
  assert.equal(w.E.fireAuthorized(man, w.b), false);

  /* Let the physically ready squad complete its preparation and cause the real Squad Leader path
     to publish OPEN. */
  w.us.members.filter(s => !s.dead).forEach(s => w.E.updateSoldier(s, w.b));
  w.us.members.forEach(s => {
    s.moving = false;
    s.moveSpeed = 0;
  });
  w.b.time = Math.max(w.b.time + 0.15, 2.0);
  let fc = command(w);
  if (fc.state !== 'open') {
    w.b.time += w.Q.tuning.fireControl.maxHold + 0.2;
    fc = command(w);
  }
  assert.equal(fc.state, 'open', 'shipping Meso published the replacement order');
  const open = rec(w, man);
  assert.equal(open.data.state, 'open');
  assert.equal(adopted(w, man).data.state, 'hold', 'old adopted order remains active while OPEN is pending');
  assert.equal(w.E.fireAuthorized(man, w.b), false);

  w.b.time = open.adoptedAt + 0.001;
  assert.equal(adopted(w, man).data.state, 'open');
  assert.equal(w.E.fireAuthorized(man, w.b), true);
});

test('personal incoming fire bypasses an adopted HOLD immediately without rewriting the command', () => {
  const w = world(),
    man = w.us.members[5];
  command(w);
  const hold = rec(w, man);
  w.b.time = hold.adoptedAt + 0.001;
  assert.equal(w.E.fireAuthorized(man, w.b), false);
  man.mind = man.mind || {};
  man.mind.lastIncomingAt = w.b.time;
  assert.equal(w.E.fireAuthorized(man, w.b), true, 'survival return fire beats the squad HOLD');
  assert.equal(adopted(w, man).data.state, 'hold', 'the personal reflex did not mutate Squad Leader intent');
});

test('shared defensive ROE requires actual delivery: no telepathy, heard noise, or foreign relay', () => {
  const w = world('?stressAct=0&fireControl=1&commandPosture=1&squadReturnFire=1'),
    A = w.r.SquadAI,
    calls = w.r.BattleCallouts,
    victim = w.us.members[2],
    buddy = w.us.members[4],
    third = w.us.members[5],
    point = { x: 0, z: 100 };
  command(w);
  const when = Math.max(rec(w, buddy).adoptedAt, rec(w, third).adoptedAt) + 0.01;
  w.b.time = when;
  assert.equal(w.E.squadReturnFireOn(), true);
  assert.equal(w.E.fireAuthorized(buddy, w.b), false, 'first sight without enemy fire obeys HOLD');
  victim.suppressedUntil = when + 1.5;
  w.us.contact = { x: 190, z: 190, at: when, relayedFrom: 'foreign-squad' };
  A.soldierContact = s =>
    s === victim
      ? {
          ...point,
          at: when,
          source: 'incoming',
          precision: 'fire-origin',
          confidence: 1
        }
      : null;
  calls.heardBy = () => null;
  assert.equal(
    w.E.squadDefensiveContact(buddy, w.b),
    null,
    'private firing-origin belief must not teleport to buddy'
  );
  assert.equal(w.E.fireAuthorized(buddy, w.b), false, 'HOLD persists until the report is actually heard');

  const msg = {
    kind: 'incomingFire',
    fromSquad: w.us.id,
    from: victim.id,
    fact: { ...point, at: when, precision: 'fire-origin' }
  };
  calls.heardBy = (b, s) => (s === buddy || s === third ? { msg, confidence: 0.9 } : null);
  assert.deepEqual(w.E.squadDefensiveContact(buddy, w.b), {
    ...point,
    at: when,
    source: 'incoming'
  });
  assert.equal(w.E.fireAuthorized(buddy, w.b), true, 'buddy may respond upon hearing the report');
  assert.equal(w.E.fireAuthorized(third, w.b), true, 'a second actual listener also gains authority');
  assert.equal(adopted(w, buddy).data.state, 'hold', 'self defense never rewrites SL orders');

  calls.heardBy = () => ({ msg: { ...msg, kind: 'gunfire' }, confidence: 1 });
  assert.equal(w.E.squadDefensiveContact(buddy, w.b), null, 'ambient gunfire is not a callout');
  calls.heardBy = () => ({ msg: { ...msg, fromSquad: 'foreign-squad' }, confidence: 1 });
  assert.equal(
    w.E.squadDefensiveContact(buddy, w.b),
    null,
    'outside relay does not become local defensive authority'
  );
  calls.heardBy = () => ({ msg: { ...msg, from: 'not-a-member' }, confidence: 1 });
  assert.equal(w.E.squadDefensiveContact(buddy, w.b), null, 'sender must belong to own squad');
  calls.heardBy = () => ({ msg, confidence: 0.2 });
  assert.equal(w.E.squadDefensiveContact(buddy, w.b), null, 'poorly heard message is not enough');
  calls.heardBy = () => ({ msg, confidence: 0.9 });
  w.b.time = when + 3.01;
  victim.suppressedUntil = w.b.time + 1;
  assert.equal(w.E.squadDefensiveContact(buddy, w.b), null, 'expired report cannot sustain fire');
  w.b.time = when + 0.2;
  victim.suppressedUntil = 0;
  victim.mind = victim.mind || {};
  victim.mind.lastIncomingAt = -99;
  assert.equal(w.E.squadDefensiveContact(buddy, w.b), null, 'no incoming fire: preserve the prepared ambush');
});

test('a soldier may suppress without SL micro orders only along his own viable firing line', () => {
  const w = world('?stressAct=0&fireControl=1&commandPosture=1&squadReturnFire=1'),
    A = w.r.SquadAI,
    calls = w.r.BattleCallouts,
    victim = w.us.members[2],
    buddy = w.us.members[4];
  command(w);
  w.b.time = rec(w, buddy).adoptedAt + 0.01;
  victim.suppressedUntil = w.b.time + 2;
  const contact = {
    kind: 'incomingFire',
    fromSquad: w.us.id,
    from: victim.id,
    fact: { x: 0, z: 100, at: w.b.time, precision: 'fire-origin' }
  };
  calls.heardBy = (b, s) => (s === buddy ? { msg: contact, confidence: 0.9 } : null);
  A.soldierContact = () => null;
  buddy.target = null;
  buddy.moving = false;
  buddy.root.rotation.y = 0;
  w.us.contact = { x: 190, z: 190, at: w.b.time, relayedFrom: 'outside-squad' };
  let fired = 0;
  A.areaFire = (s, point) => {
    if (s === buddy) {
      fired++;
      s.fireCooldown = 0.6;
    }
    return 0;
  };
  A.canSuppress = () => false;
  w.E.updateSoldier(buddy, w.b);
  assert.equal(fired, 0, 'blocked terrain line must prevent shots');
  A.canSuppress = () => true;
  w.b.time += 0.6;
  victim.suppressedUntil = w.b.time + 2;
  w.E.updateSoldier(buddy, w.b);
  assert.notEqual(w.E.stateOf(buddy).state, 'bound', 'defensive help cannot initiate movement');
  assert.equal(adopted(w, buddy).data.state, 'hold', 'response never changes SL intent');
});

test('masked ambush can select two actual standing ballistic lanes without faking crouched fire', () => {
  const w = world(),
    one = { id: 'one', role: 'rifleman', hp: 100, weapon: { stats: {} }, suppressedUntil: 0 },
    two = { id: 'two', role: 'gunner', hp: 100, weapon: { stats: {} }, suppressedUntil: 0 },
    blocked = { id: 'blocked', role: 'rifleman', hp: 100, weapon: { stats: {} }, suppressedUntil: 0 },
    squad = { members: [one, two, blocked] },
    point = { x: 12, z: 85 },
    battle = { time: 5 },
    root = {
      SquadAI: {
        squadContact: () => ({ ...point, at: battle.time, seenBy: one.id }),
        canSuppress: () => false,
        canSuppressStanding: s => s === one || s === two,
        isMachineGun: s => s === two
      },
      BattleEngagement: { stateOf: () => ({ state: 'alert' }), reacting: () => false },
      BattleAmmunition: { available: () => true },
      BattleTacticalPositions: { current: () => null }
    },
    F = w.r._squadLeaderFireControl({
      root,
      FIRE_CONTROL_TUNING: { returnFireWindow: 3 },
      commanded: sq => sq.members
    }),
    ready = { readyAt: 4, heldActorIds: ['one', 'two', 'blocked'] };
  const support = F.areaSupport(squad, battle, { underFire: 1 }, ready, null);
  assert.deepEqual(support, {
    point,
    ids: ['two', 'one'],
    source: 'seen',
    at: 5
  });
  assert.equal(
    F.areaSupport(squad, battle, { underFire: 1 }, { readyAt: null, heldActorIds: ready.heldActorIds }, null),
    null,
    'not yet prepared: no authority to unmask'
  );
  root.SquadAI.canSuppressStanding = () => false;
  assert.equal(
    F.areaSupport(squad, battle, { underFire: 1 }, ready, null),
    null,
    'two physically blocked lines cannot count as supporters'
  );
});

test('precision permission is also personal: only the adopted designated shooter may fire', () => {
  const w = world(),
    shot = w.us.members[3],
    other = w.us.members[4];
  w.b.time = 7;
  w.C.publish(w.us, w.b, 'posture-fire', w.us.members, {
    scope: 'squad',
    action: 'fire-control-precision',
    signature: 'precision|enemy|' + shot.id,
    spatial: false,
    data: { state: 'precision', targetId: String(w.foe.id), shooterId: String(shot.id) }
  });
  const sr = rec(w, shot),
    or = rec(w, other);
  w.b.time = Math.max(sr.adoptedAt, or.adoptedAt) + 0.001;
  assert.equal(w.E.fireAuthorized(shot, w.b), true);
  assert.equal(w.E.fireAuthorized(other, w.b), false);
});

test('fresh own-soldier sight can authorize support when the shared contact is relayed', () => {
  const w = world(),
    A = w.r.SquadAI,
    man = w.us.members[2],
    point = { x: 4, z: 85 },
    firstHand = {
      ...point,
      at: w.b.time,
      confidence: 1,
      source: 'seen',
      sourceSoldier: man.id,
      targetId: String(w.foe.id)
    };
  A.squadContact = () => ({
    x: 10,
    z: 90,
    at: w.b.time,
    unit: w.foe,
    relayedFrom: 'other-squad',
    seenBy: null
  });
  A.soldierContact = () => null;
  A.squadContactsMap = () => [
    {
      x: 10,
      z: 90,
      at: w.b.time,
      confidence: 1,
      source: 'told',
      sourceSoldier: man.id
    },
    firstHand
  ];
  const F = w.r._squadLeaderFireControl({
    root: w.r,
    FIRE_CONTROL_TUNING: { returnFireWindow: 3 },
    commanded: sq => sq.members
  });
  assert.deepEqual(F.supportAuthorityContact(w.us, w.b), {
    ...point,
    at: w.b.time,
    source: 'seen',
    targetId: String(w.foe.id)
  });
  A.soldierContact = s =>
    s === man
      ? {
          ...point,
          at: w.b.time,
          source: 'incoming',
          precision: 'fire-origin',
          confidence: 1,
          knownUnitId: String(w.foe.id)
        }
      : null;
  A.squadContactsMap = () => [];
  assert.deepEqual(F.supportAuthorityContact(w.us, w.b), {
    ...point,
    at: w.b.time,
    source: 'incoming',
    targetId: String(w.foe.id)
  });
  A.soldierContact = () => null;
  A.squadContactsMap = () => [{ ...firstHand, source: 'heard' }];
  assert.equal(F.supportAuthorityContact(w.us, w.b), null, 'heard belief is not fire authority');
  A.squadContactsMap = () => [{ ...firstHand, confidence: 0.2 }];
  assert.equal(F.supportAuthorityContact(w.us, w.b), null, 'weak belief is not fire authority');
  A.squadContactsMap = () => [firstHand];
  w.b.time += 3.01;
  assert.equal(F.supportAuthorityContact(w.us, w.b), null, 'expired sight is not fire authority');
});

test('squad leader picks a genuinely shootable fresh first-hand support coordinate over a blocked newer one', () => {
  const w = world(),
    first = { id: 'first', role: 'rifleman', hp: 100, weapon: { stats: {} }, suppressedUntil: 0 },
    second = { id: 'second', role: 'rifleman', hp: 100, weapon: { stats: {} }, suppressedUntil: 0 },
    squad = { members: [first, second] },
    battle = { time: 8 },
    root = {
      SquadAI: {
        squadContact: () => ({ x: 20, z: 80, at: 8, seenBy: first.id }),
        soldierContact: s =>
          s === first ? { x: 21, z: 80, at: 7.5, confidence: 0.95, source: 'seen', seenBy: first.id } : null,
        squadContactsMap: () => [],
        canSuppress: (s, pt) => pt.x === 21,
        isMachineGun: () => false
      },
      BattleEngagement: { stateOf: () => ({ state: 'alert' }), reacting: () => false },
      BattleAmmunition: { available: () => true },
      BattleTacticalPositions: { current: () => null }
    },
    F = w.r._squadLeaderFireControl({
      root,
      FIRE_CONTROL_TUNING: { returnFireWindow: 3 },
      commanded: sq => sq.members
    });
  assert.deepEqual(
    F.areaSupport(squad, battle, { underFire: 1 }, { readyAt: 7 }, null),
    {
      point: { x: 21, z: 80 },
      ids: ['first', 'second'],
      source: 'seen',
      at: 7.5
    },
    'two physically shootable rifles are stronger than a newer but blocked report'
  );
  root.SquadAI.soldierContact = () => ({
    x: 21,
    z: 80,
    at: 7.5,
    confidence: 0.95,
    source: 'heard',
    seenBy: first.id
  });
  assert.equal(
    F.areaSupport(squad, battle, { underFire: 1 }, { readyAt: 7 }, null),
    null,
    'undelivered/heard-only contact never becomes fire-control authority'
  );
});

test('a single capable gunner may start an authorized support fire task without a false second supporter', () => {
  const w = world(),
    gunner = { id: 'gunner', role: 'gunner', hp: 1, weapon: { stats: {} }, suppressedUntil: 0 },
    rifle = { id: 'rifle', role: 'rifleman', hp: 1, weapon: { stats: {} }, suppressedUntil: 0 },
    point = { x: 0, z: 100 },
    battle = { time: 2 },
    sq = { members: [gunner, rifle] },
    root = {
      SquadAI: {
        squadContact: () => ({ ...point, at: 2, seenBy: gunner.id }),
        canSuppress: s => s === gunner,
        isMachineGun: s => s === gunner
      },
      BattleEngagement: { stateOf: () => ({ state: 'alert' }), reacting: () => false },
      BattleAmmunition: { available: () => true },
      BattleTacticalPositions: { current: () => null }
    },
    F = w.r._squadLeaderFireControl({
      root,
      FIRE_CONTROL_TUNING: { returnFireWindow: 3 },
      commanded: s => s.members
    });
  const order = F.areaSupport(sq, battle, { underFire: 1 }, { readyAt: 1 }, null);
  assert.deepEqual(order, { point, ids: [gunner.id], source: 'seen', at: 2 });
  assert.deepEqual(
    F.areaSupport(sq, battle, { underFire: 0 }, { readyAt: 1 }, null),
    order,
    'first-hand sight initiates support before the first incoming volley'
  );
  root.SquadAI.squadContact = () => ({ ...point, at: 2, seenBy: null, relayedFrom: 'another-squad' });
  assert.equal(
    F.areaSupport(sq, battle, { underFire: 0 }, { readyAt: 1 }, null),
    null,
    'unverified relay never authorizes initial support'
  );
  gunner.suppressedUntil = 4;
  assert.equal(
    F.areaSupport(sq, battle, { underFire: 1 }, { readyAt: 1 }, null),
    null,
    'no eligible firing-capable supporter produces no support order'
  );
});

test('explicit Squad Leader support fire is personally adopted and executed by Engagement', () => {
  const w = world(),
    gunner = w.us.members.find(s => s.role === 'gunner'),
    other = w.us.members.find(s => s !== gunner);
  assert.ok(gunner && other);
  w.us.members.forEach(s => {
    s.target = null;
    s.moving = false;
    s.moveSpeed = 0;
    s.suppressedUntil = 0;
  });
  const point = { x: 0, z: 100 },
    before = w.b.events.fired || 0;
  w.C.publish(w.us, w.b, 'posture-fire', w.us.members, {
    scope: 'squad',
    action: 'fire-control-open',
    signature: 'open||support|' + gunner.id,
    spatial: false,
    data: {
      state: 'open',
      targetId: null,
      shooterId: null,
      supportPoint: point,
      supporterIds: [String(gunner.id)],
      supportSource: 'incoming',
      supportAt: w.b.time
    }
  });
  const pending = rec(w, gunner);
  assert.ok(pending && pending.adoptedAt > w.b.time);
  assert.equal(w.E.areaSupportOf(gunner, w.b), null, 'support fire is not psychic before adoption');
  w.b.time = pending.adoptedAt + 0.001;
  assert.deepEqual(w.E.areaSupportOf(gunner, w.b), point);
  assert.equal(
    w.E.areaSupportOf(other, w.b),
    null,
    'only the ordered supporter receives area-fire authority'
  );
  w.E.stateOf(gunner).fireReadyAt = 0;
  w.E.updateSoldier(gunner, w.b);
  assert.equal(gunner.state, 'suppress', 'Engagement executes the adopted Squad Leader order');
  w.b.time += 1.7;
  w.E.stateOf(gunner).fireReadyAt = 0;
  w.E.updateSoldier(gunner, w.b);
  assert.equal(
    w.E.supportReady(gunner, w.b),
    true,
    'ordered supporter counts only after physical fire gates are ready'
  );
  assert.ok((w.b.events.fired || 0) > before, 'the adopted order produces real area-fire rounds');

  w.C.publish(w.us, w.b, 'posture-fire', w.us.members, {
    scope: 'squad',
    action: 'fire-control-open',
    signature: 'open||invalid-support|' + gunner.id,
    spatial: false,
    data: {
      state: 'open',
      targetId: null,
      shooterId: null,
      supportPoint: point,
      supporterIds: [String(gunner.id)],
      supportSource: 'told',
      supportAt: w.b.time
    }
  });
  const invalid = rec(w, gunner);
  w.b.time = invalid.adoptedAt + 0.001;
  assert.equal(
    w.E.areaSupportOf(gunner, w.b),
    null,
    'relayed/heard authority cannot become explicit area fire'
  );
});

test('legacy/control arm still reads shared squad fireControl immediately', () => {
  const w = world('?stressAct=0&fireControl=1&commandPosture=0&commandMovement=0&commandRelay=0'),
    man = w.us.members[4];
  const fc = command(w);
  assert.equal(fc.state, 'hold');
  assert.equal(w.E.fireAuthorized(man, w.b), false, 'legacy shared HOLD is immediate');
  assert.equal(w.C.telemetry(w.b).behaviorNeutral, true);
});

test('Command Reception remains a sidecar and does not become a stance/fire owner', () => {
  const fs = require('node:fs'),
    path = require('node:path');
  const src = fs.readFileSync(path.join(H.REPO, 'battle/modules/18-command-reception.js'), 'utf8');
  assert.doesNotMatch(
    src,
    /\.(?:destination|orderDestination|target|prone|crawling|tacticalCrouch|fireReadyAt)\s*=/
  );
  assert.doesNotMatch(src, /\b(?:Math\.random|battle\.random)\s*\(/);
});

console.log(n + ' command-posture checks passed');
