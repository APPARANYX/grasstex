'use strict';
/* Phase C: read real battle cover slots and Navigation/Perception physical routes.
   Diagnostic stage: locate a genuine on-map covered bound before sampling action. */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { requestPreview } = require('./preview_request.cjs');

(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const dir = 'closeups/tactical-observation';
  fs.mkdirSync(dir, { recursive: true });
  const evidence = {
    fixture: 'real preview map; actual cover slots and Navigation/Perception route sampling'
  };
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 960 }
    });
    const res = await requestPreview(context, process.env.TACTICAL_PREVIEW);
    assert.equal(res.status(), 302);
    const url = new URL(res.headers().location, process.env.TACTICAL_PREVIEW);
    assert.ok(url.pathname.includes('ref-' + process.env.TACTICAL_SHA.slice(0, 12)));
    url.searchParams.set('seed', 'phase-c-covered-move');
    url.searchParams.set('localPlan', '1');
    url.searchParams.set('localAmbush', '1');
    url.searchParams.set('localManeuver', '1');
    url.searchParams.set('coveredBounds', '1');
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url.href, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(
      () => window.__battle__?.factions && window.BattleSquadStability?.tacticalPostures?.maneuverOn,
      null,
      { timeout: 180000 }
    );
    await page.locator('#startBtn').click();
    evidence.fixtureScan = await page.evaluate(() => {
      const b = __battle__;
      b.pause();
      b.restart();
      b.pause();
      b._trainerStepActive = true;
      const A = SquadAI,
        C = BattleCoverPositions,
        N = BattleNavigation,
        q = b.factions.us.squads.find(q => A.leaderOf(q)),
        s = q.members.find(s => !s.dead && !s.isPlayer),
        p0 = s.root.position.clone(),
        slots = C.snapshot(b).filter(slot => slot.status === 'free'),
        failures = {},
        max = Math.min(slots.length, 1500),
        scan = { tested: 0, found: 0, candidateCount: 0, slots: slots.length, byType: {} };
      let picked = null;
      for (const slot of slots) scan.byType[slot.type] = (scan.byType[slot.type] || 0) + 1;
      outer: for (let i = 0; i < max; i++) {
        const slot = slots[i];
        if (!Number.isFinite(slot.normalX) || !Number.isFinite(slot.normalZ)) continue;
        for (const rear of [3, 5, 7]) {
          const start = {
            x: slot.x + slot.normalX * rear,
            z: slot.z + slot.normalZ * rear
          };
          if (!N.movementClear(start, start) || !N.movementClear(start, slot)) continue;
          s.root.position.set(start.x, b.heightAt(start.x, start.z), start.z);
          for (const range of [30, 50, 70]) {
            const threat = {
              x: slot.x - slot.normalX * range,
              z: slot.z - slot.normalZ * range,
              at: b.time,
              confidence: 0.9
            };
            if (!N.movementClear(threat, threat)) continue;
            const candidates = C.candidates(s, b, { root: { position: threat } }, 14);
            scan.tested++;
            scan.candidateCount += candidates.length;
            const candidate = candidates.find(c => c.slotId === slot.id);
            if (!candidate) {
              failures['no-matching-slot'] = (failures['no-matching-slot'] || 0) + 1;
              continue;
            }
            const route = C.boundRoute(s, b, candidate, [threat]);
            if (!route.eligible) {
              failures[route.reason] = (failures[route.reason] || 0) + 1;
              continue;
            }
            // The native cover chooser keeps the gun on a standing firing
            // line at the endpoint. A crouch-masked route alone is not a
            // viable bound if the soldier cannot stand and return fire.
            // Probe reported coordinates only, never the hidden enemy actor.
            const reportedTarget = {
              combatThreat: true,
              root: {
                position: {
                  x: threat.x,
                  z: threat.z,
                  y: b.heightAt(threat.x, threat.z)
                }
              }
            };
            const standing = {
              root: {
                position: {
                  x: candidate.x,
                  z: candidate.z,
                  y: b.heightAt(candidate.x, candidate.z)
                },
                rotation: { y: s.root.rotation.y || 0 }
              },
              weapon: s.weapon,
              role: s.role,
              squad: s.squad,
              prone: false,
              crouching: false,
              tacticalCrouch: false
            };
            if (
              !A.hasLineOfSight(standing, reportedTarget, b.heightAt, b.obstacles) ||
              (BattleBallistics &&
                BattleBallistics.fireLineBlocked &&
                BattleBallistics.fireLineBlocked(standing, reportedTarget, b))
            ) {
              failures['no-standing-fire-line'] = (failures['no-standing-fire-line'] || 0) + 1;
              continue;
            }
            picked = { start, threat, slot, candidate, route, index: i, rear, range };
            scan.found++;
            break outer;
          }
        }
      }
      s.root.position.copyFrom(p0);
      if (picked) {
        s.root.position.set(picked.start.x, b.heightAt(picked.start.x, picked.start.z), picked.start.z);
        const cam = b.scene.activeCamera;
        const center = new BABYLON.Vector3(
          picked.slot.x,
          b.heightAt(picked.slot.x, picked.slot.z) + 1,
          picked.slot.z
        );
        cam.setTarget(center);
        const eye = new BABYLON.Vector3(
          picked.slot.x + picked.slot.normalX * 20 - picked.slot.normalZ * 14,
          b.heightAt(picked.slot.x, picked.slot.z) + 17,
          picked.slot.z + picked.slot.normalZ * 20 + picked.slot.normalX * 14
        );
        if (typeof cam.setPosition === 'function') cam.setPosition(eye);
        else cam.position.copyFrom(eye);
      }
      return {
        source: location.pathname,
        navigationVersion: N.version,
        time: b.time,
        squadId: q.id,
        moverId: s.id,
        scan,
        failures,
        picked
      };
    });
    console.log('COVERED_MANEUVER_FIXTURE_SCAN', JSON.stringify(evidence.fixtureScan));
    assert.ok(evidence.fixtureScan.picked, 'real map must provide a physical covered-route fixture');
    await page.waitForTimeout(180);
    await page.screenshot({ path: `${dir}/covered-bound-fixture.png` });

    /* The map fixture above establishes real physical eligibility. In this
       second staged phase only the already-qualified posture is supplied;
       firing, Squad Leader leasing, Engagement cover choice and soldier
       locomotion must all execute through their shipping owners. */
    evidence.stageSetup = await page.evaluate(
      ({ start, threat, slot }) => {
        const b = __battle__,
          A = SquadAI,
          E = BattleEngagement,
          S = BattleSquadStability,
          P = S.tacticalPostures,
          N = BattleNavigation,
          L = BattleLeases,
          C = BattleCoverPositions,
          q = b.factions.us.squads.find(q => A.leaderOf(q)),
          leader = A.leaderOf(q),
          mover = q.members.find(
            s =>
              s !== leader &&
              !s.dead &&
              !s.isPlayer &&
              !A.isMachineGun(s) &&
              !(window.BattleTacticalPositions && BattleTacticalPositions.current(s))
          ),
          support = [leader, ...q.members.filter(s => s !== leader && s !== mover)].slice(0, 3),
          hostile = b._roster.ge[0],
          opposition = hostile.squad,
          original = b._roster.us.concat(b._roster.ge),
          active = [mover, ...support],
          n = { x: slot.normalX, z: slot.normalZ },
          tangent = { x: -n.z, z: n.x };
        if (!mover || support.length !== 3) throw Error('no four-man team including real Squad Leader');
        for (const s of original) {
          BattleMovementResolver.resetSoldier(s);
          N.invalidateNavPath(s);
          s.destination = null;
          s.orderDestination = null;
          s._fireteamDestination = null;
          s.moving = false;
          s.moveSpeed = 0;
          s.isPlayer = true;
          s.root.position.set(900 + s.id * 2, b.heightAt(900 + s.id * 2, 550), 550);
        }
        const supportPositions = [],
          eye = 1.6;
        for (const shift of [-30, -20, -12, 12, 20, 30])
          for (const rear of [32, 38, 44]) {
            const p = {
              x: slot.x + n.x * rear + tangent.x * shift,
              z: slot.z + n.z * rear + tangent.z * shift
            };
            if (!N.movementClear(p, p)) continue;
            if (supportPositions.some(o => Math.hypot(o.x - p.x, o.z - p.z) < 4)) continue;
            const canShoot = A.hasLineOfSight(
              { root: { position: p } },
              { root: { position: threat } },
              b.heightAt,
              b.obstacles
            );
            if (!canShoot) continue;
            supportPositions.push(p);
            if (supportPositions.length >= 3) break;
          }
        if (supportPositions.length < 3)
          throw Error('no three actual standing-LOS rear base-of-fire positions');
        q.members = active;
        q.originalCount = active.length;
        q.state = 'engaged';
        q.inContact = true;
        q.commandPhase = 'assault';
        q.objective = { x: threat.x, z: threat.z };
        q.orderAnchor = { x: start.x, z: start.z };
        q.fireControl = { state: 'open', since: b.time, startedAt: b.time };
        q._macroMission = {
          version: 1,
          status: 'executing',
          action: 'assault',
          intent: 'capture',
          point: q.objective
        };
        q._boundTurn = 0;
        q._assaultAuthorized = false;
        opposition.members = [hostile];
        opposition.originalCount = 1;
        b._roster.us = active;
        b._roster.ge = [hostile];
        b._moduleUnits = active.concat(hostile);
        b.factions.us.squads = [q];
        b.factions.ge.squads = [opposition];
        b.factions.us.alive = 4;
        b.factions.ge.alive = 1;
        hostile.root.position.set(threat.x, b.heightAt(threat.x, threat.z), threat.z);
        // Even a player-controlled static training target needs a valid
        // physical destination for the native BattleSim movement integrator.
        hostile.destination = { x: threat.x, z: threat.z };
        hostile.orderDestination = { x: threat.x, z: threat.z };
        hostile.isPlayer = true;
        hostile.hp = 100000;
        /* This browser test proves fire/move physics, not casualty outcomes.
         Real ballistic hits can instant-drop even a high-HP training target.
         Keep ONLY this named target alive for the staged camera sequence;
         all shots, fire authorization, movement and terrain remain native. */
        const originalKillSoldier = b.killSoldier;
        b.killSoldier = function (victim) {
          if (victim === hostile) {
            hostile.hp = 100000;
            // WoundModel still reads its casualty record before returning.
            // Clear it after the synchronous wound callback has completed.
            queueMicrotask(() => {
              if (!hostile.dead) delete hostile.casualty;
            });
            return;
          }
          return originalKillSoldier.apply(this, arguments);
        };
        BattleCommanderAI.setMacroEnabled(b, false);
        L.clear(q);
        S.localPlan.reset(q);
        P.reset(q);
        const staged = [start, ...supportPositions];
        active.forEach((s, i) => {
          const p = staged[i];
          s.root.position.set(p.x, b.heightAt(p.x, p.z), p.z);
          s.root.rotation.y = Math.atan2(threat.x - p.x, threat.z - p.z);
          s.target = hostile;
          s.isPlayer = false;
          s._fireteamKey = i === 0 ? 'alpha' : 'bravo';
          s.destination = { x: p.x, z: p.z };
          s.orderDestination = { x: p.x, z: p.z };
          E.stateOf(s).state = 'engage';
          E.stateOf(s).fireReadyAt = 0;
          // Placement occurs on a paused battle. Its regular per-frame cooldown
          // tick is not running during the initial manual Engagement warm-up;
          // start selected fixture rifles ready, then use native firing gates.
          s.fireCooldown = 0;
        });
        A.rememberReportedContact(leader, b, {
          x: threat.x,
          z: threat.z,
          observedAt: b.time,
          confidence: 0.95,
          sourceId: 'staged-friendly-witness',
          targetId: String(hostile.id),
          otherFaction: 'ge',
          reportId: 'staged-covered-maneuver'
        });
        let shots = 0,
          duringMove = 0,
          earliest = null;
        const originalFire = b.onFire,
          startPos = { x: mover.root.position.x, z: mover.root.position.z };
        b.onFire = function (s) {
          if (support.indexOf(s) >= 0) {
            shots++;
            const displaced = Math.hypot(
              mover.root.position.x - startPos.x,
              mover.root.position.z - startPos.z
            );
            if (displaced > 0.3 && displaced < 8) duringMove++;
          }
          if (originalFire) originalFire.apply(this, arguments);
        };
        // Give the actual Engagement rifles time to fire from their positions.
        for (let i = 0; i < 26; i++) {
          b.time += 0.15;
          for (const s of support) {
            E.updateSoldier(s, b);
            BattleMovementResolver.resolve(s, b);
          }
        }
        if (!shots)
          throw Error(
            'staged base of fire produced no real Engagement shots: ' +
              JSON.stringify({
                at: b.time,
                supports: support.map(s => ({
                  id: s.id,
                  state: E.stateOf(s).state,
                  targetId: s.target && s.target.id,
                  pose: { x: s.root.position.x, z: s.root.position.z },
                  yaw: s.root.rotation.y,
                  moving: s.moving,
                  isPlayer: s.isPlayer,
                  reloading: s.reloading,
                  fireAuthorized: E.fireAuthorized && E.fireAuthorized(s, b),
                  fireAllowed: E.fireAllowed && E.fireAllowed(s, b),
                  fireReadyAt: E.stateOf(s).fireReadyAt,
                  fireCooldown: s.fireCooldown,
                  targetRange: Math.hypot(
                    s.root.position.x - hostile.root.position.x,
                    s.root.position.z - hostile.root.position.z
                  ),
                  engageRange: A.engageRange(s),
                  lineBlock:
                    BattleDirectFireLOSGate &&
                    BattleDirectFireLOSGate.blockReason &&
                    BattleDirectFireLOSGate.blockReason(s, b),
                  fireControlObservation: E.fireControlObservation && E.fireControlObservation(s, b),
                  facingError:
                    E.facingError &&
                    E.facingError(s, { x: hostile.root.position.x, z: hostile.root.position.z }),
                  line: A.hasLineOfSight(s, hostile, b.heightAt, b.obstacles),
                  weapon: s.weapon && { ammo: s.weapon.ammo, jammed: s.weapon.jammed }
                })),
                fireControl: q.fireControl,
                targetPos: { x: hostile.root.position.x, z: hostile.root.position.z }
              })
          );
        /* The leader's squad report cannot stand in for a mover's own
         Perception memory. Stage an explicit delivered squad callout through
         the real Perception owner using only the reported threat coordinate
         (not the hidden target transform). Engagement must still validate
         confidence, age, cover slots and exposed-route safety itself. */
        const moverReport = A.rememberReportedContact(mover, b, {
          x: threat.x,
          z: threat.z,
          observedAt: b.time,
          confidence: 0.95,
          sourceId: String(leader.id),
          targetId: String(hostile.id),
          otherFaction: 'ge',
          reportId: 'staged-covered-bound-shared-contact'
        });
        if (!moverReport || !C.boundThreats(mover, b).length)
          throw Error('Perception did not deliver fresh reported contact to selected mover');
        // This policy seam models an already-qualified pressured posture. Every
        // physicality and Engagement gate remains the actual shipping implementation.
        const stagedPosture = {
          mode: 'maneuver',
          stage: 'supporting-fire',
          at: b.time,
          maneuverUntil: b.time + 14,
          stats: { rejectedUnsafeBounds: 0 }
        };
        P.update = () => stagedPosture;
        P.current = () => stagedPosture;
        S.localPlan.update = () => ({
          kind: 'protect',
          pressured: true,
          emergency: false,
          boundsAllowed: false,
          eligible: { protect: true, recover: false },
          inputs: { pressure: 0.5 }
        });
        for (const s of support) {
          BattleMovementResolver.resetSoldier(s);
          s.moving = false;
          E.stateOf(s).state = 'engage';
        }
        const report = E.updateSquad(q, b),
          preflight = P.coveredTeam(b, q, [mover], report);
        if (!preflight)
          throw Error(
            'native posture rejected selected real cover: ' +
              JSON.stringify({
                fireSupport: report.fireSupport.map(s => s.id),
                effective: report.effective
              })
          );
        S.fireAndMovement(q, b);
        const lease = L.holds(q, 'bound', b.time),
          boundOrder = E.stateOf(mover).boundOrder;
        if (!lease || !boundOrder)
          throw Error(
            'native Squad Leader did not order physical bound: ' +
              JSON.stringify({
                lease,
                boundOrder,
                fireSupport: report.fireSupport.map(s => s.id),
                effective: report.effective,
                phase: q.commandPhase,
                inContact: q.inContact,
                clearContact: q.clearContact,
                fireControl: q.fireControl,
                assaultAuthorized: q._assaultAuthorized,
                boundTurn: q._boundTurn,
                coa: q.coa,
                localPlanOn: S.localPlan.on,
                resourcesOn: S.localPlan.resourcesOn,
                realLocalPlan: S.localPlan.read && S.localPlan.read(b, q, report),
                boundCycle: L.get(q, 'bound-cycle'),
                bound: L.get(q, 'bound'),
                selectedMover: {
                  id: mover.id,
                  role: mover.role,
                  fireteam: mover._fireteamKey,
                  machineGun: A.isMachineGun(mover),
                  eligible: S.localPlan.moverEligible(mover, q, b),
                  suppressedUntil: mover.suppressedUntil,
                  reloading: mover.reloading,
                  reacting: report.reacting.map(s => s.id)
                },
                supportRoles: support.map(s => ({
                  id: s.id,
                  fireteam: s._fireteamKey,
                  validMover: S.localPlan.moverEligible(s, q, b)
                })),
                posture: P.current(b, q)
              })
          );
        /* Engage the newly issued native order while the staged reported
         contact is still fresh; the full browser simulation will integrate
         that actual Movement Resolver destination on subsequent frames. */
        const perceivedThreats = C.boundThreats(mover, b);
        // Read-only native gate evidence; do not replace any geometry decision.
        const coverGates = [],
          previousCausal = window.BattleCausalInaction;
        window.BattleCausalInaction = {
          coverDecision(s, battle, stage, code, rejected, goal) {
            coverGates.push({ id: s.id, stage, code, rejected, goal });
            if (previousCausal && previousCausal.coverDecision)
              previousCausal.coverDecision(s, battle, stage, code, rejected, goal);
          }
        };
        try {
          E.updateSoldier(mover, b);
        } finally {
          window.BattleCausalInaction = previousCausal;
        }
        BattleMovementResolver.resolve(mover, b);
        const ordered = E.stateOf(mover),
          nativeCover = ordered.cover && {
            x: ordered.cover.x,
            z: ordered.cover.z,
            slotId: ordered.cover.slotId
          };
        if (!nativeCover || ordered.state !== 'bound')
          throw Error(
            'native Engagement did not accept selected covered bound: ' +
              JSON.stringify({
                perceivedThreats,
                soldierContact: A.soldierContact(mover, b),
                chosen: nativeCover,
                coveredBound: ordered.coveredBound,
                state: ordered.state,
                destination: mover.destination,
                fireteam: mover._fireteamKey,
                boundLease: L.get(q, 'bound'),
                originalSlot: slot.id,
                coverGates
              })
          );
        b._coveredProof = {
          q,
          mover,
          support,
          hostile,
          start: startPos,
          target: threat,
          slot,
          nativeCover,
          get shots() {
            return shots;
          },
          get duringMove() {
            return duringMove;
          },
          get earliest() {
            return earliest;
          }
        };
        return {
          at: b.time,
          squad: q.id,
          mover: mover.id,
          support: support.map(s => s.id),
          supportPositions,
          nativeSupport: report.fireSupport.map(s => s.id),
          shotsBeforeMove: shots,
          boundOrder,
          boundLease: lease,
          nativeCover,
          nativeCoverDecision: ordered.coveredBound,
          perceivedThreats,
          previewCover: C.candidates(mover, b, { root: { position: threat } }, 14).map(c => ({
            x: c.x,
            z: c.z,
            slotId: c.slotId
          })),
          fixture: { start, threat, slotId: slot.id },
          prequalifiedPolicySeam: true,
          nonlethalTargetFixture: true
        };
      },
      {
        start: evidence.fixtureScan.picked.start,
        threat: evidence.fixtureScan.picked.threat,
        slot: evidence.fixtureScan.picked.slot
      }
    );
    console.log('COVERED_MANEUVER_STAGE_SETUP', JSON.stringify(evidence.stageSetup));
    const captured = new Set();
    for (let tick = 0; tick < 150; tick++) {
      const st = await page.evaluate(() => {
        const b = __battle__,
          p = b._coveredProof,
          E = BattleEngagement;
        b.paused = false;
        try {
          b.step(0.15);
        } finally {
          b.paused = true;
        }
        const m = p.mover,
          e = E.stateOf(m),
          displacement = Math.hypot(m.root.position.x - p.start.x, m.root.position.z - p.start.z),
          cover = p.nativeCover, // recorded once from native Engagement's own decision
          liveCover = e.cover && { x: e.cover.x, z: e.cover.z },
          distanceToCover = cover
            ? Math.hypot(m.root.position.x - cover.x, m.root.position.z - cover.z)
            : null;
        return {
          time: b.time,
          winner: b.winner,
          timeLimit: b.timeLimit,
          alive: { us: b.factions.us.alive, ge: b.factions.ge.alive },
          hostile: { id: p.hostile.id, dead: p.hostile.dead, hp: p.hostile.hp, isPlayer: p.hostile.isPlayer },
          moverDead: m.dead,
          moverTarget: m.target && m.target.id,
          boundLease: BattleLeases.holds(p.q, 'bound', b.time),
          boundOrder: e.boundOrder,
          displacement,
          distanceToCover,
          cover,
          liveCover,
          nativeBoundProof: e.coveredBound,
          movementStop: m._movementStopReason,
          moverState: e.state,
          moverId: m.id,
          shots: p.shots,
          duringMove: p.duringMove,
          baseOfFire: p.support.map(s => ({
            id: s.id,
            x: s.root.position.x,
            z: s.root.position.z,
            state: E.stateOf(s).state,
            moving: s.moving
          }))
        };
      });
      evidence.latest = st;
      if (st.winner) throw Error('battle terminated during covered-action proof: ' + JSON.stringify(st));
      const stages = [];
      if (st.displacement <= 0.3 && st.shots > 0) stages.push('support-base');
      if (st.displacement > 0.4 && st.displacement < 1.7) stages.push('bound-moving');
      if (st.cover && st.displacement > 0.75 && st.distanceToCover < 0.5) stages.push('covered-arrival');
      for (const name of stages)
        if (!captured.has(name)) {
          await page.evaluate(
            ({ name, st }) => {
              const b = __battle__,
                p = b._coveredProof,
                cam = b.scene.activeCamera,
                pt = p.slot;
              cam.setTarget(new BABYLON.Vector3(pt.x, b.heightAt(pt.x, pt.z) + 1, pt.z));
              const eye = new BABYLON.Vector3(pt.x + 11, b.heightAt(pt.x, pt.z) + 9, pt.z + 12);
              if (typeof cam.setPosition === 'function') cam.setPosition(eye);
              else cam.position.copyFrom(eye);
              let panel = document.getElementById('coveredBoundEvidence');
              if (!panel) {
                panel = document.createElement('pre');
                panel.id = 'coveredBoundEvidence';
                Object.assign(panel.style, {
                  position: 'fixed',
                  right: '16px',
                  top: '16px',
                  color: 'white',
                  background: '#111d',
                  padding: '14px',
                  font: '16px monos',
                  zIndex: 10000
                });
                document.body.appendChild(panel);
              }
              panel.textContent = [
                name,
                'Real preview geometry · qualified posture staged',
                'Target casualty held for staged movement proof',
                `t=${st.time.toFixed(2)} · mover=${st.moverId}`,
                `displacement=${st.displacement.toFixed(2)}m · ${st.moverState}`,
                `support shots=${st.shots} · simultaneous=${st.duringMove}`,
                `cover distance=${st.distanceToCover == null ? '-' : st.distanceToCover.toFixed(2)}m`
              ].join('\n');
            },
            { name, st }
          );
          await page.waitForTimeout(180);
          await page.screenshot({ path: `${dir}/covered-bound-${name}.png` });
          captured.add(name);
          (evidence.stages ||= []).push({ name, ...st });
        }
      if (
        captured.has('support-base') &&
        captured.has('bound-moving') &&
        captured.has('covered-arrival') &&
        st.duringMove > 0
      )
        break;
    }
    console.log(
      'COVERED_MANEUVER_ACTION_RESULT',
      JSON.stringify({
        setup: evidence.stageSetup,
        stages: evidence.stages,
        latest: evidence.latest
      })
    );
    assert.ok(captured.has('support-base'), 'stationary base of fire should be visible');
    assert.ok(captured.has('bound-moving'), 'real Engagement/Resolver displacement should be visible');
    assert.ok(captured.has('covered-arrival'), 'mover must arrive at shipping selected physical cover');
    assert.ok(evidence.latest.duringMove > 0, 'support must actually fire while mover is physically moving');
    evidence.errors = errors;
    assert.deepEqual(errors, []);
    console.log('PASS real-preview covered route selection', JSON.stringify(evidence));
  } finally {
    fs.writeFileSync(`${dir}/covered-bound-report.json`, JSON.stringify(evidence, null, 2));
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
