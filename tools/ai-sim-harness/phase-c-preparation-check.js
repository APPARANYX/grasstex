'use strict';
/* Failures assert booleans: diffing a posture walks the whole combat graph.
   Phase C preparation regressions from the two traced assault reserves
   (meeting 0015 us:us-0, ge-defend 0004 us:us-1). No injected contact,
   fire authority, supporters or movement: native owners only. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');

function world(rowZ, flags = '') {
  H.resetIds();
  const r = H.bootstrap({
    search:
      '?effectiveFire=0&localPlan=1&coa=0&commandMovement=0&slStress=0&scoutsForward=0&stressAct=0' +
      '&localAmbush=1&localManeuver=1&coveredBounds=1' +
      flags
  });
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/movement-resolver.js');
  load('battle/battle-navigation.js');
  load('battle/modules/39-navigation-physicality-debug.js');
  const b = H.makeBattle(r, { heightAt: (x, z) => 1.4 * Math.exp(-Math.pow((z - 8) / 1.4, 2)) });
  const scenario = { buildings: [], roads: [] };
  b.scene = { metadata: { battleScenario: scenario } };
  r.BattleNavigation.installScenario(scenario);
  const sq = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  sq.members.forEach((man, i) => {
    man.root.position.x = (i - 5) * 2;
    man.root.position.z = rowZ;
    man.root.position.y = b.heightAt(man.root.position.x, rowZ);
  });
  r.BattleCommanderAI = {
    acceptMission(sim, squad) {
      squad._macroMission.status = 'executing';
    }
  };
  sq._macroMission = {
    version: 1,
    status: 'issued',
    intent: 'capture',
    action: 'assault',
    point: { x: 0, z: 100 },
    route: [
      { x: 0, z: 0 },
      { x: 0, z: 80 }
    ]
  };
  const S = r.BattleSquadStability;
  S.executeMission(b, sq, null);
  sq.commandPhase = 'assault';
  let reporting = true;
  r.SquadAI.squadContactsMap = () =>
    reporting ? [{ x: 0, z: 20, at: 0, confidence: 1, targetId: 'reported-001', source: 'told' }] : [];
  S.localPlan.update(b, sq);
  return {
    r,
    b,
    sq,
    P: S.tacticalPostures,
    C: r.BattleCoverPositions,
    report: on => {
      reporting = on;
    }
  };
}
const reports = [{ x: 0, z: 20, at: 0, confidence: 1 }];

/* 1. Occupiable posts. The crest masks a man here from z = -0.3; a row at
   z = 0 stands 0.05 m inside the band's rear edge. Navigation stops a man
   up to its arrival radius short of his goal, so such a post is concealed
   only at its exact point (the traced men settled 0.23-0.34 m short and
   were exposed for the whole preparation budget). */
{
  const edge = world(0);
  const radius = edge.r.BattleNavigationPhysicality.goalArrival;
  assert.ok(radius > 0, 'Navigation publishes its own goal arrival radius');
  const here = { x: 0, z: 0 };
  assert.equal(edge.C.maskedPost(edge.b, here, reports), true, 'the knife-edge point itself is masked');
  assert.equal(
    edge.C.maskedPost(edge.b, { x: 0, z: -radius }, reports),
    false,
    'a man settling one arrival radius short of it is exposed'
  );
  edge.C.candidates = () => [];
  assert.ok(edge.P.update(edge.b, edge.sq) === null, 'no ambush is published on knife-edge posts');
  const legacy = world(0, '&postArrival=0');
  legacy.C.candidates = () => [];
  const old = legacy.P.update(legacy.b, legacy.sq);
  assert.ok(old && old.mode === 'ambush', '?postArrival=0 restores selecting posts masked only at a point');

  const band = world(0.5);
  band.C.candidates = () => [];
  const st = band.P.update(band.b, band.sq);
  assert.ok(st && st.orders.length >= 3, 'posts inside the band by more than the radius are selected');
  for (const o of st.orders.filter(order => !order.reserve))
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * 2 * k) / 8,
        q = { x: o.point.x + Math.sin(a) * radius, z: o.point.z + Math.cos(a) * radius };
      assert.equal(band.C.maskedPost(band.b, q, reports), true, 'every settle point of a post is masked');
    }
}

/* 2. PREPARE is physical. A core that is already dwelling at its real posts
   finishes the four-second hold after its report ages out, against detached
   geometry only, and gains no authority. Without the operation flag, or
   without an unbroken dwell, report loss still ends the posture. */
function dwelling(flags) {
  const w = world(0.5, flags);
  const st = w.P.update(w.b, w.sq);
  assert.ok(st && st.mode === 'ambush');
  let since = null;
  H.run(w.r, w.b, 8, () => {
    const cur = w.P.current(w.b, w.sq);
    if (since == null && cur && cur.heldSince != null && w.b.time - cur.heldSince >= 1) since = cur.heldSince;
    if (since != null) w.report(false);
  });
  return { ...w, since };
}
{
  const w = dwelling('&fireManeuverOperation=1');
  assert.ok(w.since != null, 'the native core starts its dwell while the report is fresh');
  const st = w.P.current(w.b, w.sq);
  assert.ok(st, 'report expiry during an unbroken dwell does not dissolve the preparation');
  assert.ok(st.readyAt != null && st.readyAt - w.since >= 4, 'the full four-second hold still applies');
  assert.equal(st.operation.phase, 'observe');
  assert.equal(st.threats.length, 0, 'no stale report is carried into the fire/maneuver gates');
  assert.ok(w.r.BattleLeases.get(w.sq, 'bound') == null, 'no bound authorization');
  assert.equal(w.b.events.fired, 0, 'no shots');
  assert.ok(!w.sq.fireControl || w.sq.fireControl.state !== 'open', 'fire control never opens');

  const plain = dwelling('');
  assert.ok(plain.since != null);
  assert.ok(plain.P.current(plain.b, plain.sq) === null, 'without the operation, report loss still ends it');
}
{
  // No NEW dwell may start on stale geometry: a broken core ends the posture.
  const w = world(0.5, '&fireManeuverOperation=1');
  w.P.update(w.b, w.sq);
  let broke = false;
  H.run(w.r, w.b, 8, () => {
    const cur = w.P.current(w.b, w.sq);
    if (!broke && cur && cur.heldSince != null && w.b.time - cur.heldSince >= 1) {
      w.report(false);
      const man = w.sq.members.find(s => String(s.id) === cur.heldActorIds[0]);
      man.root.position.z -= 3;
      broke = true;
    }
  });
  assert.ok(broke);
  assert.ok(w.P.current(w.b, w.sq) === null, 'a broken core cannot restart its dwell without a fresh report');
  assert.ok(
    w.P.releases(w.sq).some(x => x.reason === 'no-fresh-reported-threat'),
    'the release names the missing report'
  );
}

/* A retained fire-control preparation contact is not active combat. The
   real arrived core may finish dwelling, but expired intel grants no fire. */
{
  const w = world(0.5, '&fireManeuverOperation=1');
  w.P.update(w.b, w.sq);
  H.run(w.r, w.b, 3);
  const st = w.P.current(w.b, w.sq);
  assert.ok(st && st.heldSince != null && st.readyAt == null, 'native core is dwelling');
  w.report(false);
  w.sq.inContact = true; // Engagement may retain this for HOLD preparation alone.
  while (w.b.time - st.heldSince < 4.05) {
    w.b.time += 0.15;
    assert.ok(w.P.update(w.b, w.sq) === st, 'retained preparation contact does not erase physical dwell');
  }
  assert.ok(st.readyAt != null, 'the same core completes its full dwell');
  assert.equal(st.threats.length, 0, 'geometry does not refresh a report');
  assert.ok(w.r.BattleLeases.get(w.sq, 'bound') == null, 'no bound from preparation contact');
  assert.equal(w.b.events.fired, 0);
  w.b.time += 0.15;
  assert.ok(w.P.update(w.b, w.sq) === st, 'ready observation keeps geometry-only safety');
  assert.ok(st.compromisedAt == null, 'missing intel does not fabricate exposed posts');
}
for (const reason of ['target', 'suppression', 'emergency', 'displacement']) {
  const w = world(0.5, '&fireManeuverOperation=1');
  w.P.update(w.b, w.sq);
  H.run(w.r, w.b, 3);
  const st = w.P.current(w.b, w.sq);
  assert.ok(st && st.heldSince != null && st.readyAt == null);
  const man = w.sq.members.find(s => String(s.id) === st.heldActorIds[0]);
  w.report(false);
  w.sq.inContact = true;
  if (reason === 'target') man.target = { id: 'visible-enemy' };
  if (reason === 'suppression') man.suppressedUntil = w.b.time + 5;
  if (reason === 'emergency') w.sq._localTask.emergency = true;
  if (reason === 'displacement') man.root.position.z -= 3;
  w.b.time += 0.15;
  assert.ok(w.P.update(w.b, w.sq) === null, reason + ' still invalidates stale-report preparation');
  assert.equal(st.readyAt, null);
  assert.ok(w.r.BattleLeases.get(w.sq, 'bound') == null);
}

/* 3. Settling at the post is not leaving it. Movement keeps closing the last
   centimetres on a completed order, and Engagement's hold makes Micro
   adjustments; the traced line was released 0.3 s after readiness. */
function readyLine(flags) {
  const w = world(0.5, '&fireManeuverOperation=1' + flags);
  w.P.update(w.b, w.sq);
  let ready = null;
  H.run(w.r, w.b, 8, () => {
    const cur = w.P.current(w.b, w.sq);
    if (!ready && cur && cur.readyAt != null) ready = cur;
  });
  assert.ok(ready, 'the line prepares');
  const man = w.sq.members.find(s => String(s.id) === ready.heldActorIds[0]);
  const anchor = ready.heldPositions[String(man.id)];
  return { ...w, ready, man, anchor };
}
{
  const w = readyLine('');
  w.man.root.position.x = w.anchor.x + 0.2;
  w.man.moving = true;
  w.man._movementResolver = { last: { owner: 'engagement', kind: 'hold', point: { ...w.anchor } } };
  w.b.time += 0.15;
  assert.ok(w.P.update(w.b, w.sq) === w.ready, 'a held man adjusting 0.2 m at his post keeps the line');
  w.man.root.position.x = w.anchor.x + 0.7;
  w.b.time += 0.15;
  assert.ok(w.P.update(w.b, w.sq) === null, 'leaving 0.5 m of the post still releases it');
  assert.ok(w.P.releases(w.sq).some(x => x.reason === 'prepared fireteam left firing line'));

  const formation = readyLine('');
  formation.man.root.position.x = formation.anchor.x + 0.2;
  formation.man.moving = true;
  formation.man._movementResolver = {
    last: { owner: 'squad-stability', kind: 'formation', point: { x: 0, z: 60 } }
  };
  formation.b.time += 0.15;
  assert.ok(
    formation.P.update(formation.b, formation.sq) === null,
    'walking away under another order is leaving, even inside 0.5 m'
  );

  const legacy = readyLine('&postArrival=0');
  legacy.man.root.position.x = legacy.anchor.x + 0.2;
  legacy.man.moving = true;
  legacy.man._movementResolver = { last: { owner: 'engagement', kind: 'hold', point: { ...legacy.anchor } } };
  legacy.b.time += 0.15;
  assert.ok(legacy.P.update(legacy.b, legacy.sq) === null, '?postArrival=0 restores the old moving rule');
}
/* 4. REPLAN. 34 of 78 natural attempts ended 1-3 s after selection, before
   any hold, when a newer report of the moving enemy exposed one of the three
   posts, then sat out an 8 s cooldown. Masking is mocked by report bearing so
   the new picture exposes the western posts and still masks the eastern. */
function exposing(flags) {
  const w = world(0.5, flags);
  let threat = { x: 0, z: 20 };
  w.r.SquadAI.squadContactsMap = () => [{ x: threat.x, z: threat.z, at: w.b.time, confidence: 1 }];
  const masked = w.C.maskedPost;
  w.C.maskedPost = (b, p, rs) => masked(b, p, rs) && rs.every(r => (r.x === 0 ? p.x < 0 : p.x > 0));
  w.C.candidates = () => [];
  const first = w.P.update(w.b, w.sq);
  assert.ok(first && first.orders.every(o => o.point.x < 0), 'first plan uses only western posts');
  threat = { x: 50, z: 20 };
  w.b.time += 0.15;
  return { ...w, first, next: w.P.update(w.b, w.sq) };
}
{
  const w = exposing('&fireManeuverOperation=1');
  assert.ok(w.next && w.next.serial === w.first.serial + 1, 'the newer report triggers a REPLAN serial');
  assert.ok(
    w.next.orders.filter(o => !o.reserve).every(o => o.point.x > 0),
    'replanned posts are masked against the current report'
  );
  assert.equal(w.next.since, w.first.since, 'the preparation budget spans the replan');
  assert.ok(w.next.heldSince == null && w.next.readyAt == null, 'no dwell is inherited');
  assert.equal(w.next.operation.transitions[0].from, 'replan');
  assert.ok(
    w.P.releases(w.sq).some(x => /^replan:/.test(x.reason)),
    'the replan names its reason'
  );

  const plain = exposing('');
  assert.ok(plain.next === null, 'without the operation the posture still ends');
  assert.ok(plain.P.releases(plain.sq).some(x => x.reason === 'firing station lost masking/ray'));
}
{
  // Out of budget, exposure ends the posture with the normal cooldown.
  const w = world(0.5, '&fireManeuverOperation=1');
  let threat = { x: 0, z: 20 };
  w.r.SquadAI.squadContactsMap = () => [{ x: threat.x, z: threat.z, at: w.b.time, confidence: 1 }];
  const masked = w.C.maskedPost;
  w.C.maskedPost = (b, p, rs) => masked(b, p, rs) && rs.every(r => (r.x === 0 ? p.x < 0 : p.x > 0));
  w.C.candidates = () => [];
  const first = w.P.update(w.b, w.sq);
  first.since -= 13;
  threat = { x: 50, z: 20 };
  w.b.time += 0.15;
  assert.ok(w.P.update(w.b, w.sq) === null, 'no replan after the preparation budget');
  assert.ok(w.P.releases(w.sq).some(x => x.reason === 'firing station lost masking/ray'));
}
/* 5. APPROACH. Attacking observation-only lines in the natural run held
   150-250 m out with an eye-line over a crest but no firing ray to the ground
   beyond: halting there could never form a base of fire. An attacking squad
   keeps advancing until two posts have a physical shot; a defender, or a line
   with two firing posts, still holds. */
function observationOnly(flags, phase, shot) {
  const w = world(0.5, flags);
  w.r.SquadAI.squadContactsMap = () => [{ x: 0, z: 200, at: w.b.time, confidence: 1 }];
  w.C.maskedPost = () => true;
  w.C.maskedApproach = () => true;
  w.C.candidates = () => [];
  w.r.SquadAI.canSuppressStanding = () => !!shot;
  w.sq.commandPhase = phase;
  return { ...w, st: w.P.update(w.b, w.sq) };
}
{
  const attack = observationOnly('&fireManeuverOperation=1', 'assault');
  assert.ok(attack.st === null, 'an attacker does not halt on a line with no firing posts');
  assert.equal(attack.P.approachDeferrals(attack.sq), 1);
  assert.ok(
    attack.P.update(attack.b, attack.sq) === null && attack.P.approachDeferrals(attack.sq) === 2,
    'no cooldown: selection is retried on the next tick'
  );
  const defend = observationOnly('&fireManeuverOperation=1', 'defend');
  assert.ok(
    defend.st && defend.st.reservePlan === 'observation-only-no-two-ballistic-posts',
    'a defender holds'
  );
  const firing = observationOnly('&fireManeuverOperation=1', 'assault', true);
  assert.ok(firing.st && firing.st.mode === 'ambush', 'an attacker with two firing posts holds');
  assert.equal(firing.P.approachDeferrals(firing.sq), 0);
  const legacy = observationOnly('', 'assault');
  assert.ok(
    legacy.st && legacy.st.mode === 'ambush',
    'without the operation the observation line is unchanged'
  );
}
console.log(
  'phase-c-preparation-check: PASS occupiable posts, physical dwell continuity, settling at post, replan, approach'
);
