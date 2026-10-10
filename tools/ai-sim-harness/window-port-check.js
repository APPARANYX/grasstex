#!/usr/bin/env node
/* Window firing port: the anchor, the aperture, the stance a sill fits, the bounded pose, and that the Tactical Positions manager still owns the post. Shipping engagement, navigation, ammo, resolver and locomotion. */
'use strict';
const assert = require('node:assert/strict');
const { fixture, counted, occupy, targetAt, SIN, COS, DEG } = require('./tactical-fixture');
let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log('PASS ' + name);
}
test('the port is built from the opening: anchor just behind the inner wall face, stance from the sill, sector from the jambs', () => {
  const f = fixture(),
    port = f.st.port;
  assert.ok(port);
  assert.equal(port.inset, 0.45);
  assert.ok(
    Math.abs(Math.hypot(f.st.x - f.st.windowX, f.st.z - f.st.windowZ) - 0.45) < 1e-9,
    'anchor .45 m behind the wall plane'
  );
  assert.equal(port.stance, 'stand', 'a .92 sill: standing, the wall covers his body below the sill');
  assert.equal(f.st.stance, 'stand');
  assert.equal(port.sill, 0.92);
  assert.equal(port.head, 2.08);
  assert.ok(
    port.sectorHalf > Math.atan((0.625 - 0.08) / 0.775) + 0.05,
    'wider than the old station could see (' + (port.sectorHalf / DEG).toFixed(1) + ' deg)'
  );
  assert.ok(port.maxLateral > 0 && port.maxForward > 0 && port.maxLateral < 0.625);
});
test('sill height picks the stance: low sill crouch, normal sill stand, high sill only if the eye still clears, else rejected', () => {
  const cases = [
    [0.3, 'crouch'],
    [0.92, 'stand'],
    [1.3, 'stand']
  ];
  for (const [sill, want] of cases) {
    const f = fixture({ win: { bottom: sill, top: 2.2 } });
    assert.equal(f.st.port.stance, want, 'sill ' + sill);
  }
  for (const [win, why] of [
    [{ bottom: 1.6, top: 2.4 }, 'sill-too-high'],
    [{ bottom: 0.92, top: 1.2 }, 'too-short'],
    [{ width: 0.4 }, 'too-narrow'],
    [{ bottom: 0.95, top: 1.45 }, 'lintel-too-low']
  ]) {
    const f = fixture({ win });
    assert.equal(f.N.firingStations.length, 0, why + ' is not a station');
    const rej = f.N.rejectedWindows;
    assert.equal(rej.length, 1);
    assert.equal(rej[0].reason, why);
    assert.equal(f.P.summary(f.sim).rejectedWindows[0].reason, why, 'the diagnostics export names why');
  }
});
test('invalid window: nothing to claim, so nobody is sent to an impossible pose', () => {
  const f = fixture({ win: { bottom: 1.6, top: 2.4 } });
  f.s._nextStationClaimAt = 0;
  f.systems['building-hardpoints'].onCommanderTick(f.sim);
  assert.equal(f.P.current(f.s), null);
  assert.equal(f.P.claim(f.s, f.sim, { id: 'station-window' }, f.threat), null);
});
test('successful occupation: committed ingress through the door, anchor, stance, facing out, aperture-valid lines, fire', () => {
  const f = fixture(),
    spy = counted(f);
  try {
    const t = f.claim();
    assert.ok((t.route && t.route.door === 'rear') || t.route.door === 'front');
    assert.equal(t.status, 'ingress');
    const steps = t.route.steps,
      last = steps[steps.length - 1];
    assert.ok(Math.hypot(last.x - f.st.x, last.z - f.st.z) < 1e-6, 'the committed route ends on the anchor');
    for (let i = 0; i < 400 && t.status !== 'holding'; i++) f.tick();
    assert.equal(t.status, 'holding');
    const p = f.s.root.position;
    assert.ok(Math.hypot(p.x - f.st.x, p.z - f.st.z) <= 0.35);
    const seen = new Set();
    for (let i = 0; i < 60; i++) {
      if (!f.s.target || f.s.target.dead) targetAt(f, 0);
      f.tick();
      if (t.aperture) seen.add(t.aperture.state);
    }
    assert.ok(seen.has('firing'), 'the aperture reported firing (' + [...seen] + ')');
    assert.equal(f.s.crouching, false, 'standing at a .92 sill');
    assert.ok(!f.s.prone);
    const face = f.s._faceHint;
    assert.ok(f.N.inSector(f.st, face), 'facing hint is out through the aperture');
    assert.ok(t.aperture, 'the manager keeps the aperture report');
    assert.ok(spy.shots > 0, 'fired from the station');
    assert.equal(f.P.current(f.s), t);
  } finally {
    spy.restore();
  }
});
test('no hiding behind the opening: eye line from the anchor clears for a target anywhere in the sector, and not outside it', () => {
  const f = fixture(),
    port = f.st.port,
    eye = { x: f.st.x, y: port.eyeHeight, z: f.st.z };
  for (let b = -Math.floor(port.sectorHalf / DEG) + 1; b <= Math.floor(port.sectorHalf / DEG) - 1; b += 3) {
    const to = { x: f.st.windowX + SIN(b * DEG) * 40, y: 1.35, z: f.st.windowZ + COS(b * DEG) * 40 };
    assert.equal(f.N.aperture(f.st, eye, to, 0).ok, true, 'bearing ' + b);
  }
  const wide = { x: f.st.windowX + SIN(70 * DEG) * 40, y: 1.35, z: f.st.windowZ + COS(70 * DEG) * 40 };
  assert.equal(f.N.aperture(f.st, eye, wide, 0).reason, 'jamb');
  assert.equal(f.N.inSector(f.st, wide), false);
  assert.equal(
    f.N.aperture(f.st, eye, { x: 0, y: 1.35, z: -40 }, 0).reason,
    'target-behind',
    'the room side is never "outside"'
  );
});
test('muzzle clearance is its own test: a sighted target whose bore line is under the sill is not fired on', () => {
  const f = fixture(),
    eye = { x: f.st.x, y: 1.55, z: f.st.z },
    to = { x: 0, y: 1.3, z: 40 };
  assert.equal(f.N.aperture(f.st, eye, to, 0).ok, true, 'eye sees it');
  const stock = { x: f.st.x, y: 0.7, z: f.st.z + 0.3 };
  assert.equal(
    f.N.aperture(f.st, stock, to, 0).reason,
    'sill',
    'the same target, but the bore is under the sill'
  );
  assert.equal(f.N.aperture(f.st, { ...eye, y: 2.3 }, to, 0).reason, 'lintel');
  // in the engagement: an eye that sees but a bore that does not holds fire and keeps the post
  const g = fixture(),
    spy = counted(g),
    B = g.r.BattleBallistics;
  g.r.BattleBallistics = {
    muzzleOrigin(sh) {
      const p = sh.root.position;
      return { x: p.x, y: 0.6, z: p.z + 0.78 };
    }
  };
  try {
    const t = occupy(g);
    targetAt(g, 0);
    const before = spy.shots;
    for (let i = 0; i < 40; i++) g.tick();
    assert.equal(spy.shots, before, 'no round through the sill');
    assert.equal(t.aperture.eye.ok, true);
    assert.equal(t.aperture.muzzle.ok, false);
    assert.equal(g.P.current(g.s), t, 'still posted');
  } finally {
    spy.restore();
    g.r.BattleBallistics = B;
  }
});
test('a bad first pose is corrected inside the port: forward, then along the sill; the post, route and reservation do not change', () => {
  const f = fixture(),
    t = occupy(f),
    route = t.route,
    port = f.st.port;
  // a man who stopped at the edge of the arrival tolerance, off to one side, with a target on the far side
  const tx = -f.st.normalZ,
    tz = f.st.normalX;
  f.s.root.position.x = f.st.x + tx * 0.33;
  f.s.root.position.z = f.st.z + tz * 0.33;
  const e = targetAt(f, -50, 40);
  const eyeAt = { x: f.s.root.position.x, y: 1.55, z: f.s.root.position.z };
  const to = { x: e.root.position.x, y: 1.35, z: e.root.position.z };
  assert.equal(f.N.aperture(f.st, eyeAt, to, 0).reason, 'jamb', 'starts blocked');
  let adjusted = false;
  for (let i = 0; i < 120; i++) {
    f.tick();
    if (t.pose) adjusted = true;
  }
  assert.ok(adjusted, 'the manager recorded a pose');
  assert.ok(
    Math.abs(t.pose.lat) <= port.maxLateral + 1e-9 && t.pose.fwd <= port.maxForward + 1e-9,
    'bounded to the port'
  );
  assert.equal(f.P.current(f.s), t);
  assert.equal(t.route, route);
  assert.equal(f.P.summary(f.sim).assignmentsReleased, 0, 'never released to re-plan');
  assert.ok(f.P.summary(f.sim).portPoseAdjustments >= 1);
  const a = f.N.movementClear(
    { x: f.st.windowX - f.st.normalX * 1.2, z: f.st.windowZ - f.st.normalZ * 1.2 },
    f.P.anchor(f.s)
  );
  assert.equal(a, true, 'the corrected anchor is still inside the room');
  const behind =
    (f.P.anchor(f.s).x - f.st.windowX) * f.st.normalX + (f.P.anchor(f.s).z - f.st.windowZ) * f.st.normalZ;
  assert.ok(behind <= -0.29, 'still behind the wall plane, never in the opening (' + behind.toFixed(2) + ')');
});
test('a stance the sill needs is requested through the manager, and only one the port lists', () => {
  const f = fixture(),
    t = occupy(f);
  assert.equal(f.P.adjustPose(f.s, f.sim, { stance: 'prone' }), false);
  assert.equal(f.P.adjustPose(f.s, f.sim, { lat: 5, fwd: 5 }), true);
  assert.equal(t.pose.lat, f.st.port.maxLateral);
  assert.equal(t.pose.fwd, f.st.port.maxForward);
});
test('temporary target loss and a target outside the sector never release; the same window resumes fire', () => {
  const f = fixture(),
    spy = counted(f);
  try {
    const t = occupy(f);
    targetAt(f, 0);
    for (let i = 0; i < 30; i++) f.tick();
    const shots = spy.shots;
    assert.ok(shots > 0);
    f.s.target = null;
    f.sq.contact = null;
    for (let i = 0; i < 60; i++) f.tick();
    assert.equal(f.P.current(f.s), t);
    assert.equal(t.status, 'holding');
    assert.equal(t.aperture.state, 'holding');
    targetAt(f, 80);
    for (let i = 0; i < 30; i++) f.tick();
    assert.equal(f.P.current(f.s), t, 'a target past the jambs holds the sector');
    assert.equal(spy.shots, shots, 'and nothing is fired through the wall');
    targetAt(f, 10);
    for (let i = 0; i < 40; i++) f.tick();
    assert.ok(spy.shots > shots, 'a new target in the sector is engaged from the same station');
    assert.equal(f.P.current(f.s), t);
    assert.equal(f.P.summary(f.sim).assignmentsReleased, 0);
  } finally {
    spy.restore();
  }
});
test('reload keeps the station and the post, and fire resumes at the sill afterwards', () => {
  const f = fixture(),
    spy = counted(f);
  try {
    const t = occupy(f);
    targetAt(f, 0);
    for (let i = 0; i < 20; i++) f.tick();
    f.s.reloading = true;
    const at = { x: f.s.root.position.x, z: f.s.root.position.z };
    for (let i = 0; i < 30; i++) f.tick();
    assert.equal(f.P.current(f.s), t);
    assert.ok(Math.hypot(f.s.root.position.x - at.x, f.s.root.position.z - at.z) < 0.2);
    f.s.reloading = false;
    targetAt(f, 0);
    const n = spy.shots;
    for (let i = 0; i < 40; i++) {
      if (f.s.target.dead) targetAt(f, 0);
      f.tick();
    }
    assert.ok(spy.shots > n);
    assert.equal(f.P.current(f.s), t);
  } finally {
    spy.restore();
  }
});
test('exclusivity and captain exclusion are unchanged: one assignee per port, no sergeant', () => {
  const f = fixture();
  assert.ok(f.claim());
  assert.equal(f.claim(f.other), null);
  assert.equal(f.P.claim(f.leader, f.sim, f.st, f.threat), null);
  const g = fixture();
  g.P.claim(g.leader, g.sim, g.st, g.threat);
  assert.equal(g.P.summary(g.sim).captainWindowAssignments, 0);
  assert.equal(g.P.current(g.leader), null);
});
test('the manager is still the only owner: one registered system, one reservation table, release reasons unchanged', () => {
  const f = fixture();
  assert.deepEqual(
    Object.keys(f.systems).filter(k => /window|hardpoint|station|position/.test(k)),
    ['building-hardpoints']
  );
  const t = f.claim();
  assert.equal(f.P.summary(f.sim).claimCollisionsPrevented, 0);
  f.sq.commandPhase = 'assault';
  f.M.resolve(f.s, f.sim);
  assert.equal(f.P.current(f.s), null);
  assert.equal(f.P.summary(f.sim).releaseReasons['explicit-task-change'], 1);
  assert.equal(f.P.summary(f.sim).recentReleases[0].releaseReason, 'explicit-task-change');
});
test('navigation is not bypassed: the resolver destination is the manager anchor, the route legal, the final steps clear', () => {
  const f = fixture(),
    t = f.claim();
  assert.equal(f.M.resolve(f.s, f.sim).kind, 'firing-station');
  const steps = t.route.steps;
  for (let i = 1; i < steps.length; i++)
    assert.equal(f.N.movementClear(steps[i - 1], steps[i]), true, 'step ' + i + ' crosses no wall');
  f.P.adjustPose(f.s, f.sim, { lat: 0.2, fwd: 0.1 });
  const w = f.P.waypoint(f.s, f.sim);
  t.route.index = steps.length - 1;
  const w2 = f.P.waypoint(f.s, f.sim);
  assert.ok(
    Math.hypot(w2.point.x - t.pose.x, w2.point.z - t.pose.z) < 1e-9,
    'the last leg ends on the corrected anchor'
  );
  const crossing = f.N.movementClear(
    { x: f.st.windowX - f.st.normalX, z: f.st.windowZ - f.st.normalZ },
    { x: f.st.windowX + f.st.normalX, z: f.st.windowZ + f.st.normalZ }
  );
  assert.equal(crossing, false, 'a window is not a movement portal');
});
test('?windowPort=0 is the old station: .775 m inset, a fixed crouch, no port', () => {
  globalThis.location = { search: '?windowPort=0' };
  let f;
  try {
    f = fixture();
  } finally {
    delete globalThis.location;
  }
  assert.equal(f.N.portEnabled, false);
  assert.equal(f.st.port, undefined);
  assert.ok(Math.abs(Math.hypot(f.st.x - f.st.windowX, f.st.z - f.st.windowZ) - 0.775) < 1e-9);
  assert.equal(f.st.stance, 'crouch');
  assert.equal(f.N.rejectedWindows.length, 0);
});
test('diagnostics: the overlay module answers hardpoint, assignee, anchor, facing, aperture, lines, stance, state and why a window was rejected', () => {
  const f = fixture(),
    spy = counted(f);
  try {
    const t = occupy(f);
    for (let i = 0; i < 40; i++) {
      if (!f.s.target || f.s.target.dead) targetAt(f, 0);
      f.tick();
    }
    const d = f.r.BattleNavigationPhysicality.windowDiagnostics(f.sim),
      row = d.stations[0];
    assert.equal(row.id, f.st.id);
    assert.equal(row.assigned, f.s.id);
    assert.equal(row.state, 'holding');
    assert.deepEqual(row.facing, { x: 0, z: 1 });
    assert.equal(row.aperture.sill, 0.92);
    assert.equal(row.stance, 'stand');
    assert.ok(row.anchor && row.eye && row.muzzle && row.eyeAt && row.muzzleAt && row.to);
    assert.equal(typeof row.eye.ok, 'boolean');
    assert.ok(['firing', 'holding', 'adjusting', 'blocked'].includes(row.portState));
  } finally {
    spy.restore();
  }
  const g = fixture({ win: { bottom: 1.6, top: 2.4 } });
  assert.equal(g.r.BattleNavigationPhysicality.windowDiagnostics(g.sim).rejected[0].reason, 'sill-too-high');
});
console.log('All ' + checks + ' window-port checks passed.');
