'use strict';
/* Chromium validation of actual squad actors sitting in the 5km transport.
   Test injects a synthetic embarked transport PRESENTATION snapshot while the
   simulation is paused; this is a visual identity test, not a simulated route. */
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path');
const { execSync } = require('node:child_process');
function playwright() {
  try {
    return require('playwright');
  } catch (_) {
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}
const base = process.env.STRATEGIC_QA_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const out = path.resolve(process.env.STRATEGIC_TRUCK_QA_OUT || 'closeups/strategic-truck-ci');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { chromium } = playwright();
  const browser = await chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--ignore-certificate-errors',
      '--no-sandbox'
    ]
  });
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1360, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.stack || e).slice(0, 1600)));
  const wav = Buffer.alloc(44 + 4410),
    n = 2205;
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + n * 2, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(22050, 24);
  wav.writeUInt32LE(44100, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(n * 2, 40);
  await page.route(/\/Assets\/audio\/.*\.mp3(?:\?.*)?$/, route =>
    route.fulfill({ status: 200, contentType: 'audio/wav', body: wav })
  );
  const url =
    base +
    (base.includes('?') ? '&' : '?') +
    'strategicInterception=1&motorTransport=1&seed=strategic-truck-live-crew-qa-0001&log=0';
  const began = Date.now();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(
      () =>
        !!(
          window.__battle__ &&
          window.__scenario__ &&
          window.BattleTransportVehicleVisual &&
          window.BattleFbxSoldier?.status(window.__battle__.scene).ready
        ),
      null,
      { timeout: 180000 }
    );
    const initial = await page.evaluate(() => {
      const b = window.__battle__;
      return {
        profile: window.__scenario__.profile,
        us: b.factions.us.squads.length,
        ge: b.factions.ge.squads.length,
        soldiers: b._roster.us.length + b._roster.ge.length,
        skeletons: b.scene.skeletons.length
      };
    });
    assert.equal(initial.profile, 'strategic');
    assert.equal(initial.us, 5);
    assert.equal(initial.ge, 5);
    // Validate all fleet meshes BEFORE resuming the battle or issuing missions.
    await page.waitForFunction(
      () => {
        const b = window.__battle__,
          s = window.BattleTransportVehicleVisual.summary(b);
        return s.length === 12 && s.every(v => v.parked && v.meshReady);
      },
      null,
      { timeout: 120000 }
    );
    const initialFleet = await page.evaluate(() => {
      const b = window.__battle__;
      return {
        time: b.time,
        visual: window.BattleTransportVehicleVisual.summary(b),
        actual: window.BattleSquadTransport.fleetSummary(b)
      };
    });
    assert.equal(initialFleet.actual.length, 12);
    assert.equal(new Set(initialFleet.visual.map(v => v.vehicleId)).size, 12);
    for (const faction of ['us', 'ge'])
      for (let i = 0; i < 3; i++)
        assert.equal(
          initialFleet.visual.filter(v => v.faction === faction && v.baseId === faction + '-base-' + i)
            .length,
          2
        );
    assert.ok(
      initialFleet.visual.every(v => v.parked && v.seats === 0 && v.renderedRiders === 0),
      'Twelve distinct empty trucks must exist before transport allocation'
    );
    await page.waitForFunction(
      () => {
        const b = window.__battle__,
          model = window.BattleFbxSoldier;
        return (
          !!model.vehiclePoseClip(b.factions.us.squads[0].members[0], 'Truck - Driving.fbx') &&
          !!model.vehiclePoseClip(b.factions.ge.squads[0].members[0], 'Truck - Sitting 1.fbx')
        );
      },
      null,
      { timeout: 160000 }
    );

    const setup = await page.evaluate(() => {
      const b = window.__battle__;
      b.pause();
      const transportSystem = window.BattleModules.getSystem('strategic-truck-visual');
      if (!transportSystem) throw Error('Truck system not registered');
      window.__truckQa = { squads: {}, soldiers: {}, roots: {}, vehicleIds: {}, system: transportSystem };
      for (const faction of ['us', 'ge']) {
        const squad = b.factions[faction].squads.find(s => !s._transport && s.members.length > 0);
        if (!squad) throw Error('No available ' + faction + ' squad for isolated passenger test');
        window.__truckQa.squads[faction] = squad;
        window.__truckQa.soldiers[faction] = squad.members.slice(0, 10);
        window.__truckQa.roots[faction] = squad.members.map(s => s.root.position.clone());
        const vehicle = b._strategicTransportFleet.vehicles.find(
          v => v.faction === faction && v.baseIndex === 0 && v.slot === 0
        );
        if (!vehicle || vehicle.phase !== 'parked') throw Error('Missing parked ' + faction + ' fleet truck');
        window.__truckQa.vehicleIds[faction] = vehicle.id;
        vehicle.phase = 'assigned';
        vehicle.squadId = squad.id;
        squad._transport = {
          vehicleId: vehicle.id,
          phase: 'boarding',
          boardedCount: 0,
          position: { ...vehicle.position },
          heading: { ...vehicle.heading }
        };
      }
      const scene = b.scene;
      window.__truckQaBefore = {
        skeletons: scene.skeletons.length,
        meshes: scene.meshes.length,
        groups: scene.animationGroups.length
      };
      transportSystem.onSimulationStep(b, { dt: 0 });
      return {
        skeletons: scene.skeletons.length,
        models: ['us', 'ge'].map(f => window.__truckQa.soldiers[f].map(s => s._fbx?.lib?.file || null))
      };
    });
    // Real seat rigs appear in the same 0..9 driver-first sequence that the
    // transport controller reports, not as a ten-person model pop-in.
    await page.waitForFunction(
      () => {
        const b = window.__battle__;
        return window.BattleTransportVehicleVisual.summary(b).every(x => x.posesReady);
      },
      null,
      { timeout: 120000 }
    );
    const sequential = await page.evaluate(() => {
      const b = window.__battle__,
        qa = window.__truckQa,
        samples = [];
      for (let seatCount = 0; seatCount <= 10; seatCount++) {
        for (const side of ['us', 'ge']) qa.squads[side]._transport.boardedCount = seatCount;
        qa.system.onSimulationStep(b, { dt: 0 });
        const visual = window.BattleTransportVehicleVisual.summary(b);
        samples.push(
          Object.fromEntries(
            ['us', 'ge'].map(side => {
              const truck = visual.find(v => v.squad === qa.squads[side].id);
              return [side, truck?.renderedRiders ?? -1];
            })
          )
        );
      }
      for (const side of ['us', 'ge']) qa.squads[side]._transport.phase = 'embarked';
      qa.system.onSimulationStep(b, { dt: 0 });
      return samples;
    });
    assert.deepEqual(
      sequential.map(row => row.us),
      [...Array(11).keys()],
      'US original rigs attach exactly one per seat in driver-first order'
    );
    assert.deepEqual(
      sequential.map(row => row.ge),
      [...Array(11).keys()],
      'German original rigs attach exactly one per seat in driver-first order'
    );
    // Door admission uses identity, not a prefix of visual seat indices: the
    // passenger at index 9 enters second, and dismount releases only that actor.
    const accessIdentity = await page.evaluate(() => {
      const qa = window.__truckQa,
        b = window.__battle__,
        api = window.BattleTransportVehicleVisual;
      const rows = [];
      for (const side of ['us', 'ge']) {
        const sq = qa.squads[side],
          t = sq._transport,
          ids = sq.members.filter(s => !s.dead).map(s => s.id);
        t.access = true;
        t.seatIds = ids;
        t.boardingOrder = [ids[0], ids[9], ...ids.slice(1, 9)];
        t.exitedIds = [];
        t.phase = 'boarding';
        t.boardedIds = [ids[9]];
        t.boardedCount = 1;
        qa.system.onSimulationStep(b, { dt: 0 });
        const early = sq.members.filter(s => api.seatForSoldier(s)).map(s => s.id);
        t.boardedIds = [ids[0], ids[9]];
        t.boardedCount = 2;
        qa.system.onSimulationStep(b, { dt: 0 });
        const seated = sq.members.filter(s => api.seatForSoldier(s)).map(s => s.id);
        t.phase = 'disembarking';
        t.exitedIds = [ids[0]];
        qa.system.onSimulationStep(b, { dt: 0 });
        const remaining = sq.members.filter(s => api.seatForSoldier(s)).map(s => s.id);
        rows.push({ side, early, seated, remaining, expected: [ids[0], ids[9]], passenger: ids[9] });
        t.access = false;
        t.phase = 'embarked';
        t.boardedCount = 10;
        qa.system.onSimulationStep(b, { dt: 0 });
      }
      return rows;
    });
    for (const row of accessIdentity) {
      assert.deepEqual(row.early, [row.passenger], row.side + ' passenger can board before driver arrival');
      assert.deepEqual(
        row.seated,
        row.expected,
        row.side + ' driver and front passenger enter their own seats'
      );
      assert.deepEqual(row.remaining, [row.passenger], row.side + ' one dismount releases only the driver');
    }
    // No additional soldier FBX model parse occurs at boarding.
    await page.waitForFunction(
      () => {
        const qa = window.__truckQa,
          b = window.__battle__;
        qa.system.onSimulationStep(b, { dt: 0 });
        const summaries = window.BattleTransportVehicleVisual.summary(b);
        return ['us', 'ge'].every(f => {
          const sq = qa.squads[f],
            t = summaries.find(t => t.squad === sq.id && t.faction === f && !t.showcase);
          return !!(t && t.meshReady && t.renderedRiders === qa.soldiers[f].length);
        });
      },
      null,
      { timeout: 120000 }
    );

    const report = await page.evaluate(() => {
      const b = window.__battle__,
        qa = window.__truckQa;
      const all = window.BattleTransportVehicleVisual.summary(b);
      const per = {};
      for (const faction of ['us', 'ge']) {
        const sq = qa.squads[faction],
          soldiers = qa.soldiers[faction];
        const truck = b.scene.transformNodes.find(
          n => n.name === 'strategicTruck-' + faction + '-' + qa.vehicleIds[faction]
        );
        if (!truck) throw Error('Missing ' + faction + ' truck root');
        const p = truck.getAbsolutePosition();
        per[faction] = {
          squadId: sq.id,
          riders: soldiers.map((soldier, index) => {
            const presentation = window.BattleTransportVehicleVisual.seatForSoldier(soldier);
            const anchor = soldier._fbx?.holder?.parent;
            const anchorPos = anchor && anchor.getAbsolutePosition();
            return {
              id: soldier.id,
              role: soldier.role,
              model: soldier._fbx?.lib?.file || null,
              seat: presentation?.seatIndex ?? null,
              clip: presentation?.animation || null,
              sameObject: qa.soldiers[faction][index] === soldier,
              inAnchor: anchor?.name === 'truckSeat-' + qa.vehicleIds[faction] + '-' + index,
              dist: anchorPos ? Math.hypot(p.x - anchorPos.x, p.y - anchorPos.y, p.z - anchorPos.z) : null,
              rootUnchanged: soldier.root.position.equals(qa.roots[faction][index])
            };
          })
        };
      }
      return {
        per,
        parkedAfterBoard: all.filter(x => x.parked).length,
        skeletonsBefore: qaBefore().skeletons,
        skeletonsAfter: b.scene.skeletons.length,
        animationGroupsBefore: qaBefore().groups,
        animationGroupsAfter: b.scene.animationGroups.length,
        meshesBefore: qaBefore().meshes,
        meshesAfter: b.scene.meshes.length,
        fps: b.scene.getEngine().getFps()
      };
      function qaBefore() {
        return qaBeforeData();
      }
      function qaBeforeData() {
        return window.__truckQaBefore;
      }
    });
    for (const faction of ['us', 'ge']) {
      const riders = report.per[faction].riders;
      assert.equal(riders.length, setup.models[faction === 'us' ? 0 : 1].length);
      assert.ok(
        riders.every(r => r.sameObject && r.inAnchor && r.rootUnchanged),
        faction + ' soldier models must be ORIGINAL actors with untouched sim roots'
      );
      assert.ok(
        riders.every(r => r.dist !== null && r.dist < 8),
        faction + ' squad seated within truck geometry'
      );
      assert.ok(
        riders.every((r, i) => r.model === setup.models[faction === 'us' ? 0 : 1][i]),
        faction + ' original role-specific models preserved'
      );
      assert.ok(
        riders.every((r, i) => r.seat === i && r.clip?.startsWith('Truck - ')),
        faction + ' real seat assignment with one Truck animation each'
      );
      // Simulate boarding after distant rendering, then bring the camera close.
      await page.waitForFunction(
        side => window.__truckQa.soldiers[side].every(s => s._fbx.meshLod),
        faction,
        { timeout: 30000 }
      );
      await page.evaluate(side => {
        for (const soldier of window.__truckQa.soldiers[side]) {
          const fx = soldier._fbx;
          fx._meshFar = true;
          for (const lod of fx.meshLod) lod.mesh.subMeshes = lod.far;
        }
      }, faction);
      await page.evaluate(side => {
        const b = window.__battle__,
          sq = window.__truckQa.squads[side];
        const node = b.scene.transformNodes.find(
          n => n.name === 'strategicTruck-' + side + '-' + window.__truckQa.vehicleIds[side]
        );
        const cam = b.scene.activeCamera;
        cam.position.set(node.position.x + 6, node.position.y + 5, node.position.z + 8);
        cam.setTarget(new BABYLON.Vector3(node.position.x, node.position.y + 2, node.position.z));
      }, faction);
      // SwiftShader may take longer than a fixed sleep to render the camera jump.
      // Wait for the actual renderer-owned transition; an old seated early-return
      // still times out here because it never replaces the forced far meshes.
      await page.waitForFunction(
        side =>
          window.__truckQa.soldiers[side].every(
            s => s._fbx._meshFar === false && s._fbx.meshLod.every(l => l.mesh.subMeshes === l.full)
          ),
        faction,
        { timeout: 30000 }
      );
      const detail = await page.evaluate(
        side =>
          window.__truckQa.soldiers[side].map(s => ({
            id: s.id,
            enabled: s._fbx.root.isEnabled(),
            eye: window.__battle__.scene.activeCamera.globalPosition.asArray(),
            anchor: s._fbx._vehicleSeat.anchor.getAbsolutePosition().asArray(),
            threshold: window.BattleFbxSoldier.meshLod.far,
            scale: window.BattleFbxSoldier.lod.screenScale,
            far: s._fbx._meshFar,
            full: s._fbx.meshLod.every(l => l.mesh.subMeshes === l.full)
          })),
        faction
      );
      assert(
        detail.every(s => !s.far && s.full),
        faction + ' seated close-up restores full meshes: ' + JSON.stringify(detail)
      );
      await page.screenshot({ path: path.join(out, faction + '-actual-squad-seated.png') });
    }
    // Measure actual axle groups and the change in wheel rotation from a
    // controlled 4 m carrier move. No translation == no spin; stopping the
    // carrier == no spin. Original soldier roots remain gameplay-authoritative.
    const wheelEvidence = await page.evaluate(() => {
      const qa = window.__truckQa,
        b = window.__battle__,
        api = window.BattleTransportVehicleVisual;
      const originals = api.summary(b).filter(t => !t.showcase);
      const phases = {};
      for (const faction of ['us', 'ge']) {
        const sq = qa.squads[faction];
        const info = originals.find(t => t.faction === faction && t.squad === sq.id);
        phases[faction] = { initial: info.wheels };
        if (!info.wheels?.front || !info.wheels?.rear)
          throw Error(
            faction +
              ' missing FrontWheels/RearWheels FBX axle group: ' +
              JSON.stringify({
                wheels: info.wheels,
                transforms: b.scene.transformNodes
                  .filter(n => /wheel|axle|tire|tyre|truck/i.test(n.name))
                  .map(n => n.name)
                  .slice(0, 75),
                wheelMeshes: b.scene.meshes
                  .filter(n => /wheel|tire|tyre|rim/i.test(n.name))
                  .map(n => n.name)
                  .slice(0, 90),
                truckModelChildren: b.scene.transformNodes
                  .filter(n => n.name === 'strategicTruckModel-' + qa.vehicleIds[faction])
                  .flatMap(n => n.getDescendants(false).map(child => child.name))
                  .slice(0, 90)
              })
          );
        const move = sq._transport.position;
        sq._transport.position = { x: move.x, z: move.z + 4 };
      }
      qa.system.onSimulationStep(b, { dt: 0 });
      for (const faction of ['us', 'ge']) {
        const sq = qa.squads[faction];
        phases[faction].moved = api.summary(b).find(t => t.faction === faction && t.squad === sq.id).wheels;
      }
      qa.system.onSimulationStep(b, { dt: 0 });
      for (const faction of ['us', 'ge']) {
        const sq = qa.squads[faction];
        phases[faction].stationary = api
          .summary(b)
          .find(t => t.faction === faction && t.squad === sq.id).wheels;
      }
      return phases;
    });
    for (const side of ['us', 'ge']) {
      for (const axle of ['front', 'rear']) {
        const before = wheelEvidence[side].initial[axle];
        const moved = wheelEvidence[side].moved[axle];
        const stopped = wheelEvidence[side].stationary[axle];
        assert.ok(
          before.nodes > 0 && moved.radius >= 0.25,
          side + ' ' + axle + ' axle must use named wheel geometry and measured radius'
        );
        assert.notEqual(
          moved.rotation,
          before.rotation,
          side + ' ' + axle + ' wheel group must rotate after traveling 4 m'
        );
        assert.equal(
          stopped.rotation,
          moved.rotation,
          side + ' ' + axle + ' wheel group must stop rotating when truck is stationary'
        );
      }
    }
    assert.equal(
      report.skeletonsAfter,
      report.skeletonsBefore,
      'No new skinned soldier models can be created at boarding'
    );
    assert.equal(
      report.animationGroupsAfter,
      report.animationGroupsBefore,
      'No one-by-one Babylon Truck animation import at boarding'
    );
    // Dismount and verify normal FBX rig hierarchy restored immediately.
    const dismount = await page.evaluate(() => {
      const b = window.__battle__,
        qa = window.__truckQa,
        results = {};
      for (const faction of ['us', 'ge']) qa.squads[faction]._transport.phase = 'dismounted';
      qa.system.onSimulationStep(b, { dt: 0 });
      for (const faction of ['us', 'ge']) {
        results[faction] = qa.soldiers[faction].map(s => ({
          seat: !!s._vehiclePresentation,
          fxSeat: !!s._fbx ? !!s._fbx._vehicleSeat : false,
          parentBack: s._fbx?.holder?.parent === s.poseRoot,
          socketBack: s._fbx?.socket?.parent === s.root
        }));
        qa.squads[faction]._transport = null;
        const vehicle = b._strategicTransportFleet.vehicles.find(v => v.id === qa.vehicleIds[faction]);
        vehicle.phase = 'stopped';
        vehicle.squadId = null;
      }
      qa.system.onSimulationStep(b, { dt: 0 });
      return results;
    });
    for (const faction of ['us', 'ge'])
      assert.ok(
        dismount[faction].every(x => !x.seat && !x.fxSeat && x.parentBack && x.socketBack),
        faction + ' dismount restores original FBX root and weapon hierarchy'
      );
    // Re-embark the very same live actors, then restart WHILE OCCUPIED.
    // Old truck-seat parents must be restored in beforeBattleRestart, before
    // BattleSim disposes the old soldier roots. Otherwise their detached
    // weapon sockets remain parented to a truck and form orphan gun piles.
    const restartCleanup = await page.evaluate(() => {
      const b = window.__battle__,
        qa = window.__truckQa;
      for (const faction of ['us', 'ge']) {
        const squad = qa.squads[faction],
          vehicle = b._strategicTransportFleet.vehicles.find(v => v.id === qa.vehicleIds[faction]);
        vehicle.phase = 'assigned';
        vehicle.squadId = squad.id;
        squad._transport = {
          vehicleId: vehicle.id,
          phase: 'embarked',
          position: { ...vehicle.position },
          heading: { ...vehicle.heading }
        };
      }
      qa.system.onSimulationStep(b, { dt: 0 });
      const previous = ['us', 'ge'].flatMap(f => qa.soldiers[f]);
      if (!previous.every(s => s._vehiclePresentation && s._fbx?._vehicleSeat))
        throw Error('Could not re-embark real squads for occupied restart QA');
      const old = previous.map(s => ({
        soldier: s,
        fx: s._fbx,
        held: s.weapon?.mesh || null,
        weaponSocket: s.weaponSocket,
        poseRoot: s.poseRoot
      }));
      b.restart();
      return {
        oldActors: old.length,
        allSeatsCleared: old.every(x => !x.soldier._vehiclePresentation && !x.fx._vehicleSeat),
        allSocketsDisposed: old.every(x => x.weaponSocket.isDisposed()),
        allHoldersDisposed: old.every(x => x.fx.holder.isDisposed()),
        oldWeaponsDisposed: old.every(x => !x.held || x.held.isDisposed()),
        currentRoster: b._roster.us.length + b._roster.ge.length,
        oldActorRootsDisposed: old.every(x => x.soldier.root.isDisposed()),
        ghostWeaponMeshNames: b.scene.meshes
          .filter(m => m.name.startsWith('weapon.') && old.some(x => x.held === m))
          .map(m => m.name)
      };
    });
    assert.equal(restartCleanup.oldActors, 20);
    assert.ok(
      restartCleanup.allSeatsCleared &&
        restartCleanup.allSocketsDisposed &&
        restartCleanup.allHoldersDisposed &&
        restartCleanup.oldWeaponsDisposed &&
        restartCleanup.oldActorRootsDisposed,
      'Occupied restart must clean old actor FBX holders and all rifle sockets: ' +
        JSON.stringify(restartCleanup)
    );
    assert.deepEqual(
      restartCleanup.ghostWeaponMeshNames,
      [],
      'No detached rifle meshes may survive occupied restart'
    );
    assert.equal(restartCleanup.currentRoster, initial.soldiers);

    // End, try P (possession must not resume a terminal session), then
    // restart and end again using the *other* End battle control. Both
    // routes must show the complete diagnostic export choices.
    const postBattle = [];
    for (const selector of ['#restartBtn', '#endBattleBtn', '#restartBtn']) {
      await page.locator(selector).click();
      await page.waitForFunction(() => {
        const b = window.__battle__,
          banner = document.getElementById('banner');
        return b.manualEnded && b.paused && banner.style.display === 'flex';
      });
      const state = await page.evaluate(() => {
        const b = window.__battle__,
          ids = ['bannerExportCompactDiagnostics', 'bannerExportDiagnostics'];
        return {
          ended: b.manualEnded,
          paused: b.paused,
          buttons: ids.map(id => !!document.getElementById(id)),
          bannerVisible: document.getElementById('banner').style.display === 'flex'
        };
      });
      assert.ok(
        state.bannerVisible && state.buttons.every(Boolean),
        'Each end route must show both diagnostic export actions: ' + JSON.stringify(state)
      );
      await page.keyboard.press('p');
      const stillEnded = await page.evaluate(() => {
        const b = window.__battle__;
        return b.manualEnded && b.paused && document.getElementById('banner').style.display === 'flex';
      });
      assert.ok(stillEnded, 'P must not resume after battle is ended');
      postBattle.push({ selector, ...state, pGuarded: stillEnded });
      await page.locator('#bannerRestart').click();
      await page.waitForFunction(() => {
        const b = window.__battle__;
        return !b.manualEnded && !b.winner && document.getElementById('banner').style.display === 'none';
      });
    }
    assert.deepEqual(errors, [], 'Browser JavaScript errors');
    const data = {
      initial,
      initialFleet,
      setup,
      report,
      wheelEvidence,
      dismount,
      restartCleanup,
      postBattle,
      elapsedMs: Date.now() - began,
      errors
    };
    fs.writeFileSync(path.join(out, 'truck-visual-report.json'), JSON.stringify(data, null, 2) + '\n');
    console.log(
      'STRATEGIC TRUCK CHROMIUM PASS ' +
        JSON.stringify({
          elapsedMs: data.elapsedMs,
          usModels: report.per.us.riders.map(x => x.model),
          geModels: report.per.ge.riders.map(x => x.model),
          skeletonIncrease: report.skeletonsAfter - report.skeletonsBefore,
          animationGroupIncrease: report.animationGroupsAfter - report.animationGroupsBefore,
          loadTimeTrucks: initialFleet.visual.length,
          dismountRestored: true,
          orphanWeapons: restartCleanup.ghostWeaponMeshNames.length,
          postBattleEndCycles: postBattle.length,
          pGuarded: true,
          wheelMotionVerified: true
        })
    );
  } catch (e) {
    try {
      await page.screenshot({ path: path.join(out, 'truck-visual-failure.png') });
    } catch (_) {}
    const details = await page
      .evaluate(() => {
        const b = window.__battle__,
          a = window.BattleTransportVehicleVisual;
        return {
          sceneReady: !!b,
          summary: b && a ? a.summary(b) : null,
          modelReady: b && window.BattleFbxSoldier?.status(b.scene)
        };
      })
      .catch(x => ({ error: String(x) }));
    fs.writeFileSync(
      path.join(out, 'truck-visual-failure.json'),
      JSON.stringify(
        {
          error: String(e.stack || e),
          errors,
          details
        },
        null,
        2
      )
    );
    throw e;
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error('STRATEGIC TRUCK CHROMIUM FAIL', (err && err.stack) || err);
  process.exitCode = 1;
});
