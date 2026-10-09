#!/usr/bin/env node
'use strict';
/* Two squads on either side of a low crest that shows heads and takes rounds.

   The crest in crest-fire-check.js (1.35 m, 120 m apart) lets every man see his enemy and refuses every
   trigger pull. Before this check's fix that was a deadlock the whole chain agreed on: Engagement counted every
   held target as contact, so the Squad Leader's plan lease stayed open, its anchor stayed put and the squad's
   course of action sat at "defend"; every man stayed in `engage`, proposing a hold on his own spot. 240 s
   later both squads were where they started, in contact, having fired nothing.

   The chain is run for real (Engagement, the trigger-time gate, ballistics, the Squad Leader's commander tick,
   the Movement Resolver); only the General is left out, so the brief is a hand-set route. Success is physical:
   rounds fired and ground covered, not a state flag changing. The same terrain must still let a defender
   defend, and open ground must still be a firefight. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
const RANGE = 120;
function ridge(at, top, half, skirt) {
  return (x, z) => {
    const d = Math.abs(z - at);
    if (d <= half) return top;
    if (d >= half + skirt) return 0;
    return top * (1 - (d - half) / skirt);
  };
}
function world(heightAt) {
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
    systems = {};
  r.BattleModules = {
    registerSystem(id, s) {
      systems[id] = s;
    },
    getSystem: id => systems[id],
    runHook() {},
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  r.BattleCommanderDoctrine = {
    policyFor() {
      return {
        cohesionRadius: 34,
        captainlessCohesion: 26,
        routeArrivalRadius: 8,
        captureCommitRatio: 0.82,
        finalRouteRadius: 14
      };
    }
  };
  [
    'battle/obstacle-field.js',
    'battle/battle-navigation.js',
    'battle/movement-resolver.js',
    'battle/modules/14-direct-fire-los-gate.js',
    'battle/modules/14-z-ballistic-raycast.js',
    'battle/modules/15a-squad-leader-fire-control.js',
    'battle/modules/15b-squad-leader-buddy-pairs.js',
    'battle/modules/15c-squad-leader-scouts-forward.js',
    'battle/modules/15d-squad-leader-leaderless-intent.js',
    'battle/modules/15e-squad-leader-morale-coa.js',
    'battle/modules/15f-squad-leader-retreat-anchor.js',
    'battle/modules/15g-squad-leader-formation.js',
    'battle/modules/15h-squad-leader-fireteams.js',
    'battle/modules/15i-squad-leader-clear-contact.js',
    'battle/modules/15j-squad-leader-fire-and-movement.js',
    'battle/modules/15k-squad-leader-reconstitution.js',
    'battle/modules/15l-squad-leader-mission-execution.js',
    'battle/modules/15m-squad-leader-cohesion-regroup.js',
    'battle/modules/16-squad-plan-stability.js',
    'battle/modules/44-combat-urgency.js',
    'battle/modules/52-survival-tactical-route.js'
  ].forEach(f => load(r, f));
  const b = H.makeBattle(r, { seed: 7, heightAt });
  return { r, b, systems };
}
/* Attackers at z=0 ordered onto z=RANGE; defenders on that objective facing back. */
function pair(heightAt, defenderAttacks) {
  const w = world(heightAt),
    us = H.addSquad(w.r, w.b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: 0,
      objective: { x: 0, z: RANGE },
      facing: 0
    }),
    ge = H.addSquad(w.r, w.b, {
      id: 'ge-0',
      faction: 'ge',
      x: 0,
      z: RANGE,
      objective: { x: 0, z: 0 },
      facing: Math.PI
    });
  us.commandPhase = 'assault';
  ge.commandPhase = 'defend';
  us.route = [{ x: 0, z: RANGE }];
  us.routeIndex = 0;
  us.objective = { x: 0, z: RANGE };
  ge.route = [];
  if (!defenderAttacks) {
    ge.home = { x: 0, z: RANGE };
  }
  return { ...w, us, ge };
}
function centre(sq) {
  const m = sq.members.filter(s => !s.dead);
  return m.length
    ? {
        x: m.reduce((a, s) => a + s.root.position.x, 0) / m.length,
        z: m.reduce((a, s) => a + s.root.position.z, 0) / m.length
      }
    : null;
}
function drive(w, seconds, probe) {
  let tick = 0;
  H.run(w.r, w.b, seconds, b => {
    tick++;
    if (tick % 3 === 0) w.systems['squad-command'].onCommanderTick(b, { town: null });
    if (probe) probe(b);
  });
}

test('a fully denied ballistic line preserves sight without firing', () => {
  const w = pair(ridge(RANGE / 2, 1.35, 4, 20));
  // A 1.35m crest now exposes upper bodies; explicitly model full obstruction here.
  w.r.BattleBallistics.fireLineBlocked = () => true;
  drive(w, 12);
  const holders = w.us.members.filter(s => s.target);
  assert.ok(holders.length >= 8, 'the attackers see the defenders over the crest (' + holders.length + ')');
  assert.equal(w.b.events.fired, 0, 'nobody can fire: the round would meet the crest');
  assert.ok(
    holders.every(s => w.r.BattleDirectFireLOSGate.blockReason(s, w.b) === 'crest'),
    'every refusal is the crest, not a lost line of sight'
  );
});

test('a wholly blocked sighting becomes observation and the assault closes the gap', () => {
  const w = pair(ridge(RANGE / 2, 1.35, 4, 20));
  w.r.BattleBallistics.fireLineBlocked = (shooter, target) =>
    Math.abs(shooter.root.position.z - target.root.position.z) > 55;
  let contactEarly = null,
    firstShotAt = null;
  drive(w, 300, b => {
    if (b.time >= 3 && contactEarly === null) contactEarly = w.us.inContact;
    if (firstShotAt === null && b.events.fired > 0) firstShotAt = b.time;
  });
  assert.equal(contactEarly, true, 'a fresh sighting is contact straight away (no flapping on a blink)');
  const c = centre(w.us);
  assert.ok(
    w.us.members.some(s => !s.dead) && (c.z > RANGE / 2 + 10 || w.ge.members.every(s => s.dead)),
    'the assault covered the ground to the crest and beyond (z=' + (c && c.z.toFixed(0)) + ')'
  );
  assert.ok(
    firstShotAt !== null && firstShotAt < 240,
    'rounds were exchanged once a line opened (t=' + firstShotAt + ')'
  );
  assert.ok(w.b.events.fired > 20, 'a firefight, not a gesture (' + w.b.events.fired + ' rounds)');
});

test('the defender keeps defending: the same crest, nobody ordered forward, nobody leaves and nobody is forced to', () => {
  const w = pair(ridge(RANGE / 2, 1.35, 4, 20));
  w.r.BattleBallistics.fireLineBlocked = () => true;
  w.us.commandPhase = 'defend';
  w.us.route = [];
  w.us.objective = { x: 0, z: 0 };
  w.us.home = { x: 0, z: 0 };
  const start = { us: centre(w.us), ge: centre(w.ge) };
  drive(w, 240);
  const moved = (sq, from) => Math.hypot(centre(sq).x - from.x, centre(sq).z - from.z);
  assert.ok(
    moved(w.us, start.us) < 12,
    'the US defenders stayed (' + moved(w.us, start.us).toFixed(1) + ' m)'
  );
  assert.ok(
    moved(w.ge, start.ge) < 12,
    'the GE defenders stayed (' + moved(w.ge, start.ge).toFixed(1) + ' m)'
  );
  assert.equal(w.b.events.fired, 0, 'no round was fired into the crest');
  assert.equal(w.us.commandPhase, 'defend');
  assert.equal(w.ge.commandPhase, 'defend');
});

test('open ground is still a firefight: sightings with a clear line stay contact indefinitely', () => {
  const w = pair(() => 0);
  const contacts = [];
  drive(w, 30, b => contacts.push([b.time, w.us.inContact, w.ge.inContact]));
  assert.ok(w.b.events.fired > 20, 'rounds flew (' + w.b.events.fired + ')');
  const late = contacts.filter(c => c[0] > 8 && c[0] < 25);
  assert.ok(
    late.every(c => c[1] || c[2]),
    'at least one side is in contact on every tick of the fight'
  );
});

test('the grace is a hold-down, not a flap: counted for 6 s, then observed, and counted again the moment the line opens', () => {
  let top = 1.35;
  const w = pair((x, z) => ridge(RANGE / 2, top, 4, 20)(x, z)),
    E = w.r.BattleEngagement,
    shooter = w.us.members.find(s => s.role === 'rifleman'),
    target = w.ge.members.find(s => s.role === 'rifleman'),
    count = t => {
      w.b.time = t;
      shooter.target = target;
      E.updateSquad(w.us, w.b);
      return w.us.contactCount;
    };
  w.r.BattleBallistics.fireLineBlocked = () => top >= 1.35;
  assert.equal(count(100), 1, 'blocked, but only just: still contact');
  assert.equal(count(103), 1, 'inside the grace');
  assert.equal(count(105.9), 1, 'inside the grace');
  assert.equal(count(106.1), 0, 'past the grace: he is observing');
  assert.equal(count(130), 0, 'and stays observing while the crest holds');
  top = 0.5;
  w.r.BattleDirectFireLOSGate.clearCache();
  assert.equal(count(130.2), 1, 'the line opened: contact at once, no second grace');
  top = 1.35;
  w.r.BattleDirectFireLOSGate.clearCache();
  assert.equal(count(130.4), 1, 'a line that closes again starts a fresh grace');
});
console.log('PASS ' + n + ' hill stalemate checks');
