'use strict';
/* Phase C field acceptance. No pose, mission, fire-control, contact, support,
   route, squad or cover mutation: all AI inputs and choices are shipping
   BattleSim owners running full regenerated seeded scenarios. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  const type = process.env.C_FIELD_TYPE || 'meeting';
  const count = Math.max(1, Number(process.env.C_FIELD_COUNT || 3));
  const limit = Math.max(30, Number(process.env.C_FIELD_SECONDS || 210));
  const prefix = process.env.C_FIELD_PREFIX || 'phase-c-field';
  const base = process.env.C_FIELD_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
  const flags = 'localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1';
  const dir = 'reports/phase-c-field';
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const results = [];
  try {
    for (const arm of ['off', 'on']) {
      const query = new URLSearchParams(
        type === 'meeting' ? '' : 'defender=' + (type === 'us-defend' ? 'us' : 'ge')
      );
      if (arm === 'on') for (const [k, v] of new URLSearchParams(flags)) query.set(k, v);
      query.set('seed', prefix + '-bootstrap');
      const page = await browser.newPage({ ignoreHTTPSErrors: true });
      page.setDefaultTimeout(120000);
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => {
        if (m.type() === 'error' && !/texture|audio|\.png|\.mp3|failed to load resource/i.test(m.text()))
          errors.push(m.text());
      });
      await page.route('**/*', route =>
        ['media', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue()
      );
      await page.goto(base + '?' + query.toString(), { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForFunction(
        () =>
          !!(
            window.__battle__ &&
            window.BattleSquadStability &&
            window.BattleTownObjectives &&
            window.BattleCommanderAI &&
            window.BattleAIPolicy
          ),
        null,
        { timeout: 120000 }
      );
      const observed = await page.evaluate(
        async ({ count, limit, prefix, arm }) => {
          const root = window;
          const b = root.__battle__;
          const engine = b.scene?.getEngine?.();
          if (engine && root.__battleRenderLoop__) engine.stopRenderLoop(root.__battleRenderLoop__);
          b.pause();
          const originalSeed = b.scene?.metadata?.battleScenario?.seed || b.scene?.metadata?.battleTown?.seed;
          const rawRestart = b._controlRawRestart || b.restart.bind(b);
          const genome = root.BattleAIPolicy.get();
          const saved = {
            onFire: b.onFire,
            onUpdate: b.onUpdate,
            onWinner: b.onWinner,
            onShot: b.onShot,
            onSuppressiveShot: b.onSuppressiveShot,
            onCallout: b.onCallout,
            timeLimit: b.timeLimit,
            timeScale: b.timeScale
          };
          const out = [];
          let active = null;
          b.onUpdate = b.onWinner = b.onShot = b.onSuppressiveShot = b.onCallout = () => {};
          b.onFire = s => {
            if (!active) return;
            active.shots++;
            if (!s?.squad || !root.BattleLeases?.holds?.(s.squad, 'bound', b.time)) return;
            const movers = (s.squad.members || []).filter(
              m =>
                m !== s &&
                !m.dead &&
                m.moving &&
                root.BattleEngagement?.stateOf?.(m)?.boundOrder &&
                root.BattleEngagement?.stateOf?.(m)?.state === 'bound'
            );
            if (movers.length) active.supportFireDuringMove++;
            const posture = root.BattleSquadStability?.tacticalPostures?.current?.(b, s.squad);
            const key = s.faction + ':' + s.squad.id;
            const chain = active.maneuverChains.find(c => c.squad === key && c.serial === posture?.serial);
            if (chain && movers.length && chain.supportShots.length < 64)
              chain.supportShots.push({
                t: +b.time.toFixed(2),
                shooterId: String(s.id),
                movers: movers.map(m => String(m.id)),
                shooterPosition: { x: s.root.position.x, z: s.root.position.z }
              });
          };
          try {
            for (let index = 0; index < count; index++) {
              const seed = prefix + '-' + String(index + 1).padStart(4, '0');
              const scenario = root.BattleTownObjectives.regenerate(
                b.scene,
                b.heightAt,
                seed,
                { benchmark: true, benchmarkIndex: index },
                b
              );
              root.BattleAIPolicy.setMatchPolicies(b, genome, genome);
              b.trainingMode = true;
              root.BattleSoldierModel?.setImportedEnabled?.(b.scene, false);
              rawRestart();
              b.manualEnded = false;
              b.winner = null;
              b.winReason = null;
              b.paused = false;
              b.timeScale = 1;
              b.timeLimit = limit;
              active = {
                arm,
                type: new URLSearchParams(root.location.search).get('defender') || 'meeting',
                seed,
                scenarioFingerprint: scenario?.fingerprint || null,
                ambush: 0,
                prepared: 0,
                maneuvers: 0,
                bounds: 0,
                coveredArrivals: 0,
                movedMetres: 0,
                supportFireDuringMove: 0,
                shots: 0,
                livingContactSamples: 0,
                reportSamples: 0,
                quietReportSamples: 0,
                precontactCleanSamples: 0,
                pressureSamples: 0,
                reportedPressureEvents: 0,
                modeEvents: [],
                rejectionSamples: {},
                contactChangeEvents: 0,
                squadSamples: 0,
                engagementOutcomes: {},
                suppressedEpisodes: 0,
                readinessAttempts: [],
                maneuverChains: [],
                pressureTraces: []
              };
              const last = new Map();
              const readiness = new Map();
              const movements = new Map();
              function compactPoint(p) {
                return p && Number.isFinite(p.x) && Number.isFinite(p.z)
                  ? { x: +p.x.toFixed(2), z: +p.z.toFixed(2) }
                  : null;
              }
              function inspectReadinessAttempt(sq, key, current) {
                if (!current || current.mode !== 'ambush') return null;
                const attemptKey = key + '#' + current.serial;
                let attempt = readiness.get(attemptKey);
                if (!attempt) {
                  attempt = {
                    key: attemptKey,
                    squad: key,
                    serial: current.serial,
                    startAt: +b.time.toFixed(2),
                    ordered: current.orders?.length || 0,
                    stageEvents: [],
                    samples: 0,
                    maxPending: 0,
                    maxAdopted: 0,
                    maxApplied: 0,
                    maxArrived: 0,
                    maxSettled: 0,
                    maxMasked: 0,
                    maxHeld: 0,
                    foreignPublishSamples: 0,
                    blockedSamples: 0,
                    movingSamples: 0,
                    lostMaskSamples: 0,
                    actorLast: [],
                    threatsAtStart: (current.threats || []).map(t => ({
                      at: Number.isFinite(t?.at) ? +t.at.toFixed(2) : null,
                      age: Number.isFinite(t?.at) ? +(b.time - t.at).toFixed(2) : null,
                      confidence: Number.isFinite(t?.confidence) ? +t.confidence.toFixed(3) : null,
                      point: compactPoint(t)
                    }))
                  };
                  readiness.set(attemptKey, attempt);
                  active.readinessAttempts.push(attempt);
                }
                attempt.samples++;
                const CR = root.BattleCommandReception;
                const C = root.BattleCoverPositions;
                let pendingCount = 0,
                  adoptedCount = 0,
                  appliedCount = 0;
                let arrivedCount = 0,
                  settledCount = 0,
                  maskedCount = 0;
                const actorLast = [];
                for (const o of current.orders || []) {
                  const s = (sq.members || []).find(m => String(m?.id) === o.soldierId);
                  if (!s) {
                    actorLast.push({ id: o.soldierId, missing: true });
                    continue;
                  }
                  const scope = 'soldier:' + String(s.id);
                  const pending = CR?.peek?.(s, b, 'movement', scope) || null;
                  const adopted = CR?.adopted?.(s, b, 'movement', scope) || null;
                  const pendingMine = !!(
                    pending?.data && String(pending.data.publishKey || '') === String(o.key || '')
                  );
                  const adoptedMine = !!(
                    adopted?.data && String(adopted.data.publishKey || '') === String(o.key || '')
                  );
                  const applied = s._fireteamPublishKey === o.key;
                  const execution = !!(
                    applied && CR?.executionCurrent?.(s, b, 'movement', scope, s._fireteamAdoptedEnvelope)
                  );
                  const pos = s.root?.position;
                  const dist = pos ? Math.hypot(pos.x - o.point.x, pos.z - o.point.z) : Infinity;
                  const outcome = root.BattleExecutionOutcome?.man?.(s, b) || null;
                  const receivedMovement = !!CR?.movementEnabled?.();
                  const arrived = !!(
                    applied &&
                    (receivedMovement
                      ? outcome?.current && outcome?.state === 'completed' && outcome?.publishKey === o.key
                      : dist <= 0.5)
                  );
                  const settled = arrived && !s.moving;
                  const masked = !!(pos && C?.maskedPost?.(b, pos, current.threats || []));
                  if (pendingMine && pending.phase !== 'unreachable') pendingCount++;
                  if (adoptedMine) adoptedCount++;
                  if (applied && execution) appliedCount++;
                  if (arrived) arrivedCount++;
                  if (settled) settledCount++;
                  if (masked) maskedCount++;
                  if (s._fireteamPublishKey && s._fireteamPublishKey !== o.key)
                    attempt.foreignPublishSamples++;
                  if (s._movementStopReason && !['arrived', 'none'].includes(s._movementStopReason))
                    attempt.blockedSamples++;
                  if (s.moving) attempt.movingSamples++;
                  if (!masked) attempt.lostMaskSamples++;
                  const station = root.BattleTacticalPositions?.current?.(s) || null;
                  actorLast.push({
                    id: String(s.id),
                    role: s.role || null,
                    pendingPhase: pendingMine ? pending?.phase || null : null,
                    pendingEnvelope: pendingMine ? pending?.envelopeId || null : null,
                    adoptedMine,
                    adoptedEnvelope: adoptedMine ? adopted?.envelopeId || null : null,
                    applied,
                    execution,
                    canonicalOutcome: outcome
                      ? {
                          state: outcome.state || null,
                          current: !!outcome.current,
                          publishKey: outcome.publishKey || null,
                          distance: Number.isFinite(outcome.distance) ? +outcome.distance.toFixed(2) : null,
                          resolverOwner: outcome.resolverOwner || null,
                          resolverKind: outcome.resolverKind || null
                        }
                      : null,
                    dist: Number.isFinite(dist) ? +dist.toFixed(2) : null,
                    moving: !!s.moving,
                    moveSpeed: +(+s.moveSpeed || 0).toFixed(2),
                    stopReason: s._movementStopReason || null,
                    publishKey: s._fireteamPublishKey || null,
                    adoptedPublishKey: adopted?.data?.publishKey || null,
                    fireteamDestination: compactPoint(s._fireteamDestination),
                    orderDestination: compactPoint(s.orderDestination),
                    physicalDestination: compactPoint(s.destination),
                    resolverPoint: compactPoint(s._movementResolver?.last?.point),
                    resolverIntent: compactPoint(s._movementResolver?.last?.intentPoint),
                    resolverOwner: s._movementResolver?.last?.owner || null,
                    endpointResolution: s._movementEndpointResolution
                      ? {
                          intent: compactPoint(s._movementEndpointResolution.intent),
                          point: compactPoint(s._movementEndpointResolution.point)
                        }
                      : null,
                    personalSpaceDestination: compactPoint(s._personalSpaceDestination),
                    post: compactPoint(o.point),
                    tacticalStation: station
                      ? {
                          kind: station.kind || station.type || null,
                          id: station.id || station.stationId || null
                        }
                      : null,
                    target: s.target?.id || null,
                    engagement: root.BattleEngagement?.stateOf?.(s)?.state || s.eng?.state || null,
                    masked
                  });
                }
                attempt.maxPending = Math.max(attempt.maxPending, pendingCount);
                attempt.maxAdopted = Math.max(attempt.maxAdopted, adoptedCount);
                attempt.maxApplied = Math.max(attempt.maxApplied, appliedCount);
                attempt.maxArrived = Math.max(attempt.maxArrived, arrivedCount);
                attempt.maxSettled = Math.max(attempt.maxSettled, settledCount);
                attempt.maxMasked = Math.max(attempt.maxMasked, maskedCount);
                attempt.maxHeld = Math.max(attempt.maxHeld, current.heldActorIds?.length || 0);
                const lastStage = attempt.stageEvents[attempt.stageEvents.length - 1]?.stage;
                if (lastStage !== current.stage && attempt.stageEvents.length < 24)
                  attempt.stageEvents.push({
                    t: +b.time.toFixed(2),
                    stage: current.stage || null,
                    pending: pendingCount,
                    adopted: adoptedCount,
                    applied: appliedCount,
                    arrived: arrivedCount,
                    settled: settledCount,
                    held: current.heldActorIds?.length || 0
                  });
                attempt.actorLast = actorLast;
                attempt.lastAt = +b.time.toFixed(2);
                return attemptKey;
              }
              let commanderAccumulator = 0;
              const wallStart = performance.now();
              for (let tick = 0; tick < Math.ceil(limit / 0.15) && !b.winner; tick++) {
                b._trainerStepActive = true;
                try {
                  b.step(0.15);
                } finally {
                  b._trainerStepActive = false;
                }
                commanderAccumulator += 0.15;
                while (commanderAccumulator >= 0.45 - 1e-9 && !b.winner) {
                  commanderAccumulator -= 0.45;
                  root.BattleCommanderAI.update(b, scenario, 0.45);
                }
                // Observe every native tick: a completed cover arrival can clear
                // boundOrder before the slower diagnostic sample would see it.
                for (const faction of ['us', 'ge']) {
                  for (const sq of b.factions?.[faction]?.squads || []) {
                    const posture = root.BattleSquadStability?.tacticalPostures?.current?.(b, sq);
                    const key = faction + ':' + sq.id;
                    let chain =
                      posture?.mode === 'maneuver'
                        ? active.maneuverChains.find(c => c.squad === key && c.serial === posture.serial)
                        : null;
                    if (!chain && posture?.mode === 'maneuver') {
                      chain = {
                        squad: key,
                        serial: posture.serial,
                        preparedAt: posture.readyAt,
                        heldSince: posture.heldSince,
                        heldIds: posture.heldActorIds.slice(),
                        maneuverAt: +b.time.toFixed(2),
                        missionVersion: posture.version,
                        decision: JSON.parse(JSON.stringify(posture.lastManeuverDecision || null)),
                        supportShots: [],
                        movements: []
                      };
                      active.maneuverChains.push(chain);
                    }
                    for (const soldier of sq.members || []) {
                      const e = root.BattleEngagement?.stateOf?.(soldier);
                      const pos = soldier?.root?.position;
                      const moveKey = key + '|' + soldier.id;
                      let tracked = movements.get(moveKey);
                      if (
                        chain &&
                        e?.state === 'bound' &&
                        e.boundOrder &&
                        e.cover &&
                        (!tracked || tracked.endedAt != null)
                      ) {
                        tracked = {
                          id: String(soldier.id),
                          startAt: +b.time.toFixed(2),
                          origin: { x: pos.x, z: pos.z },
                          cover: { x: e.cover.x, z: e.cover.z },
                          startState: e.state,
                          movedMetres: 0,
                          arrivalAt: null,
                          endedAt: null
                        };
                        movements.set(moveKey, tracked);
                        chain.movements.push(tracked);
                      }
                      if (!tracked || tracked.endedAt != null || !pos) continue;
                      tracked.movedMetres = Math.max(
                        tracked.movedMetres,
                        Math.hypot(pos.x - tracked.origin.x, pos.z - tracked.origin.z)
                      );
                      const error = Math.hypot(pos.x - tracked.cover.x, pos.z - tracked.cover.z);
                      if (tracked.arrivalAt == null && tracked.movedMetres > 0.75 && error < 0.45) {
                        tracked.arrivalAt = +b.time.toFixed(2);
                        tracked.arrivalError = +error.toFixed(3);
                        tracked.arrivalPosition = compactPoint(pos);
                      }
                      if (!e?.boundOrder || soldier.dead) {
                        tracked.endedAt = +b.time.toFixed(2);
                        tracked.endState = e?.state || null;
                      }
                    }
                  }
                }
                if (tick % 3 !== 0) continue;
                for (const faction of ['us', 'ge']) {
                  for (const sq of b.factions?.[faction]?.squads || []) {
                    const key = faction + ':' + sq.id;
                    const prev = last.get(key) || { mode: 'none', bound: false, contact: false, lastM: {} };
                    active.squadSamples++;
                    const current = root.BattleSquadStability?.tacticalPostures?.current?.(b, sq);
                    const mode = current?.mode || 'none';
                    const attemptKey = inspectReadinessAttempt(sq, key, current);
                    if (
                      current?.readyAt != null &&
                      current.lastManeuverDecision &&
                      active.pressureTraces.length < 64 &&
                      b.time - (prev.lastPressureTrace ?? -Infinity) >= 0.9
                    ) {
                      prev.lastPressureTrace = b.time;
                      const squadContact = root.SquadAI?.squadContact?.(sq, b) || null;
                      const contactAge =
                        squadContact && Number.isFinite(+squadContact.at)
                          ? b.time - +squadContact.at
                          : null;
                      const seenAuthority = !!(
                        squadContact &&
                        squadContact.seenBy != null &&
                        !squadContact.heard &&
                        !squadContact.relayedFrom
                      );
                      const incomingAuthority = !!(
                        squadContact &&
                        squadContact.fireRevealed &&
                        squadContact.precision === 'fire-origin' &&
                        !squadContact.relayedFrom
                      );
                      const supportAuthority =
                        squadContact &&
                        Number.isFinite(+squadContact.x) &&
                        Number.isFinite(+squadContact.z) &&
                        contactAge != null &&
                        contactAge >= 0 &&
                        contactAge <=
                          (root.BattleSquadStability?.tuning?.fireControl?.returnFireWindow ?? 3) &&
                        (seenAuthority || incomingAuthority)
                          ? { x: +squadContact.x, z: +squadContact.z }
                          : null;
                      active.pressureTraces.push({
                        t: +b.time.toFixed(2),
                        squad: key,
                        serial: current.serial,
                        mode,
                        stage: current.stage,
                        phase: sq.commandPhase,
                        coa: sq.coa,
                        assaultAuthorized: !!sq._assaultAuthorized,
                        decision: JSON.parse(JSON.stringify(current.lastManeuverDecision)),
                        coreIds: current.heldActorIds.slice(),
                        contactAuthority: squadContact
                          ? {
                              point: compactPoint(squadContact),
                              age: contactAge,
                              seenBy: squadContact.seenBy ?? null,
                              heard: !!squadContact.heard,
                              relayed: !!squadContact.relayedFrom,
                              fireRevealed: !!squadContact.fireRevealed,
                              precision: squadContact.precision || null,
                              seenAuthority,
                              incomingAuthority,
                              authorizedPoint: compactPoint(supportAuthority),
                              personalIncoming: (sq.members || []).filter(
                                s => root.BattleEngagement?.underFireNow?.(s, b)
                              ).length
                            }
                          : null,
                        coreIds: current.heldActorIds.slice(),
                        boundCycle: !!root.BattleLeases?.holds?.(sq, 'bound-cycle', b.time),
                        fireControl: sq.fireControl
                          ? {
                              state: sq.fireControl.state || null,
                              supportPoint: compactPoint(sq.fireControl.supportPoint),
                              supporterIds: (sq.fireControl.supporterIds || []).slice(0, 2),
                              supportSource: sq.fireControl.supportSource || null,
                              supportAt: sq.fireControl.supportAt ?? null
                            }
                          : null,
                        members: (sq.members || []).slice(0, 12).map(s => {
                          const e = root.BattleEngagement?.stateOf?.(s);
                          const target = s.target?.root?.position;
                          const here = s.root?.position;
                          const known = root.BattleEngagement?.knownThreat?.(s, b) || null;
                          const distance =
                            target && here ? Math.hypot(target.x - here.x, target.z - here.z) : null;
                          const knownDistance =
                            known && here ? Math.hypot(known.x - here.x, known.z - here.z) : null;
                          return {
                            id: String(s.id),
                            role: s.role,
                            weapon: s.weapon?.name || s.weapon?.id || s.weapon?.kind || null,
                            weaponReady: !!(s.weapon && s.weapon.stats && !s.weapon.jammed),
                            state: e?.state,
                            moving: !!s.moving,
                            crawling: !!s.crawling,
                            targetId: s.target?.id ?? null,
                            distance,
                            knownThreat: compactPoint(known),
                            knownDistance,
                            range: root.SquadAI.engageRange(s),
                            capability: !!root.BattleEngagement?.supportReady?.(s, b),
                            areaSupport: compactPoint(root.BattleEngagement?.areaSupportOf?.(s, b) || null),
                            setUp: !!s.setUp,
                            isMachineGun: !!root.SquadAI?.isMachineGun?.(s),
                            issuerStation: !!root.BattleTacticalPositions?.current?.(s),
                            issuerCanSuppress:
                              supportAuthority && root.SquadAI?.canSuppress
                                ? !!root.SquadAI.canSuppress(s, supportAuthority, b, true)
                                : null,
                            issuerPointRange:
                              supportAuthority && here
                                ? +Math.hypot(
                                    supportAuthority.x - here.x,
                                    supportAuthority.z - here.z
                                  ).toFixed(2)
                                : null,
                            underFireNow: !!root.BattleEngagement?.underFireNow?.(s, b),
                            ammunition: root.BattleAmmunition?.available?.(s) ?? null,
                            fireAuthorized: root.BattleEngagement?.fireAuthorized?.(s, b) ?? null,
                            fireReadyAt: e?.fireReadyAt,
                            fireReady: Number.isFinite(e?.fireReadyAt) ? b.time >= e.fireReadyAt : null,
                            suppressed: s.suppressedUntil > b.time,
                            reloading: !!s.reloading,
                            clearingStoppage: !!s.clearingStoppage,
                            outOfAmmo: !!s.outOfAmmo,
                            incapacitated: !!s.incapacitated,
                            suppressOrder: !!e?.suppressOrder,
                            canSuppress:
                              known && root.SquadAI?.canSuppress
                                ? !!root.SquadAI.canSuppress(s, known, b, true)
                                : null,
                            facingError:
                              known && root.BattleEngagement?.facingError
                                ? root.BattleEngagement.facingError(s, known)
                                : null,
                            line: target
                              ? root.SquadAI.hasLineOfSight(s, s.target, b.heightAt, b.obstacles)
                              : null,
                            owner: s._movementResolver?.last?.owner,
                            kind: s._movementResolver?.last?.kind
                          };
                        })
                      });
                    }
                    const task = sq._localTask;
                    const pressure = +task?.inputs?.pressure || 0;
                    const reports = root.SquadAI?.squadContactsMap?.(sq, b) || [];
                    const fresh =
                      Array.isArray(reports) &&
                      reports.some(
                        r =>
                          Number.isFinite(r?.at) &&
                          b.time >= r.at &&
                          b.time - r.at <= 10 &&
                          Number.isFinite(r?.confidence) &&
                          r.confidence >= 0.5
                      );
                    if (fresh) active.reportSamples++;
                    if (!sq.inContact && fresh) active.quietReportSamples++;
                    if (!sq.inContact && fresh && !sq.members?.some(s => s?.target) && pressure <= 0.1)
                      active.precontactCleanSamples++;
                    if (sq.inContact) active.livingContactSamples++;
                    if (pressure >= 0.25) active.pressureSamples++;
                    if (sq.inContact && pressure >= 0.25 && !prev.pressure) active.reportedPressureEvents++;
                    if (sq.inContact !== prev.contact && prev.contact) active.contactChangeEvents++;
                    if (prev.attemptKey && mode !== 'ambush') {
                      const ended = readiness.get(prev.attemptKey);
                      if (ended && ended.endAt == null) {
                        ended.endAt = +b.time.toFixed(2);
                        ended.endMode = mode;
                        ended.endStage = current?.stage || null;
                        const endReports = root.SquadAI?.squadContactsMap?.(sq, b) || [];
                        const endFresh = Array.isArray(endReports)
                          ? endReports.filter(
                              r =>
                                Number.isFinite(r?.at) &&
                                b.time >= r.at &&
                                b.time - r.at <= 10 &&
                                Number.isFinite(r?.confidence) &&
                                r.confidence >= 0.5
                            ).length
                          : 0;
                        ended.endContext = {
                          contact: !!sq.inContact,
                          pressure,
                          freshReports: endFresh,
                          reconLease: !!root.BattleLeases?.get?.(sq, 'recon'),
                          regroupLease: !!root.BattleLeases?.get?.(sq, 'regroup'),
                          localExecutionKind: sq._localTask?.inputs?.execution?.kind || null,
                          missionStatus: sq._macroMission?.status || null,
                          missionVersion: sq._macroMission?.version ?? null,
                          routeIndex: +sq.routeIndex || 0,
                          routeTarget: compactPoint(sq.route?.[+sq.routeIndex]),
                          engagementPlan: sq._engagementPlan?.status || null,
                          maneuverDecision: current?.lastManeuverDecision
                            ? JSON.parse(JSON.stringify(current.lastManeuverDecision))
                            : null
                        };
                      }
                    }
                    if (mode !== prev.mode) {
                      if (mode === 'ambush') active.ambush++;
                      if (mode === 'maneuver') active.maneuvers++;
                      if (active.modeEvents.length < 100)
                        active.modeEvents.push({
                          t: +b.time.toFixed(2),
                          squad: key,
                          mode,
                          stage: current?.stage || null,
                          orderedRiflemen: current?.orders?.length || 0,
                          prior: prev.mode,
                          contact: !!sq.inContact,
                          pressure,
                          mission: sq._macroMission?.status || null
                        });
                    }
                    if (current?.readyAt != null && !prev.prepared) active.prepared++;
                    const bound = !!root.BattleLeases?.holds?.(sq, 'bound', b.time);
                    if (bound && !prev.bound) {
                      active.bounds++;
                      prev.lastM = {};
                    }
                    if (bound) {
                      for (const s of sq.members || []) {
                        const e = root.BattleEngagement?.stateOf?.(s);
                        if (!e?.boundOrder || !s?.root?.position) continue;
                        const p = s.root.position;
                        const v =
                          prev.lastM[s.id] ||
                          (prev.lastM[s.id] = {
                            x: p.x,
                            z: p.z,
                            arrived: false
                          });
                        const displacement = Math.hypot(p.x - v.x, p.z - v.z);
                        active.movedMetres = Math.max(active.movedMetres, displacement);
                        if (
                          !v.arrived &&
                          displacement > 0.75 &&
                          e.cover &&
                          Math.hypot(p.x - e.cover.x, p.z - e.cover.z) < 0.45
                        ) {
                          active.coveredArrivals++;
                          v.arrived = true;
                        }
                      }
                    }
                    if (mode === 'none' && fresh && !sq.inContact) {
                      const commanded = (sq.members || []).filter(
                        s => s && !s.dead && s.hp > 0 && !root.BattleEngagement?.fledPhase?.(s)
                      );
                      const eligible = commanded.filter(s => !root.BattleTacticalPositions?.current?.(s));
                      const scenarioActive =
                        b.scene?.metadata?.battleScenario || b.scene?.metadata?.battleTown;
                      const reason =
                        eligible.length < 3 || eligible.length > 32
                          ? 'insufficient-free-riflemen'
                          : eligible.some(s => !s.root?.position || s.isPlayer || s.incapacitated)
                            ? 'ineligible-member-player-or-injured'
                            : !root.SquadAI?.leaderOf?.(sq)
                              ? 'no-leader'
                              : root.BattleNavigation?.scenario !== scenarioActive
                                ? 'nav-scenario-mismatch'
                                : !sq.route?.[+sq.routeIndex]
                                  ? 'no-route-leg'
                                  : sq._macroMission?.status !== 'executing'
                                    ? 'no-executing-mission'
                                    : !sq._missionExecution
                                      ? 'no-execution'
                                      : sq._engagementPlan &&
                                          ['active', 'quiet'].includes(sq._engagementPlan.status)
                                        ? 'prior-engagement-plan'
                                        : sq.members?.some(s => s?.target)
                                          ? 'personal-target'
                                          : pressure > 0.1
                                            ? 'precontact-pressure'
                                            : 'masked-subelement-or-other-geometry';
                      active.rejectionSamples[reason] = (active.rejectionSamples[reason] || 0) + 1;
                    }
                    prev.mode = mode;
                    prev.prepared = current?.readyAt != null;
                    prev.attemptKey = attemptKey || null;
                    prev.bound = bound;
                    prev.contact = !!sq.inContact;
                    prev.pressure = sq.inContact && pressure >= 0.25;
                    last.set(key, prev);
                  }
                }
              }
              for (const chain of active.maneuverChains) {
                chain.complete =
                  chain.preparedAt != null &&
                  chain.preparedAt - chain.heldSince >= 4 - 1e-6 &&
                  chain.heldIds.length >= 3 &&
                  chain.movements.some(
                    move =>
                      move.arrivalAt != null &&
                      chain.supportShots.some(
                        shot =>
                          shot.t >= move.startAt &&
                          shot.t <= move.arrivalAt &&
                          shot.shooterId !== move.id &&
                          shot.movers.includes(move.id)
                      )
                  );
              }
              active.seconds = +b.time.toFixed(2);
              active.wallSeconds = +((performance.now() - wallStart) / 1000).toFixed(3);
              active.winner = b.winner || 'none';
              active.kills = { us: b.factions?.us?.kills || 0, ge: b.factions?.ge?.kills || 0 };
              active.postures = root.BattleSquadStability?.localPlanTelemetry?.(b)?.postures || null;
              for (const attempt of active.readinessAttempts) {
                if (attempt.endAt == null) {
                  attempt.endAt = +b.time.toFixed(2);
                  attempt.endMode = 'battle-end';
                }
              }
              active.coveredBounds = root.BattleEngagement?.coveredBoundTelemetry?.(b) || null;
              active.writerConflicts = root.BattleOrderProvenance?.conflicts?.(b)?.length || 0;
              out.push(JSON.parse(JSON.stringify(active)));
              active = null;
            }
          } finally {
            root.BattleAIPolicy.clearMatchPolicies(b);
            b.trainingMode = false;
            root.BattleSoldierModel?.setImportedEnabled?.(b.scene, true);
            if (originalSeed)
              root.BattleTownObjectives.regenerate(
                b.scene,
                b.heightAt,
                originalSeed,
                { restoredAfterBenchmark: true },
                b
              );
            rawRestart();
            b.onFire = saved.onFire;
            b.onUpdate = saved.onUpdate;
            b.onWinner = saved.onWinner;
            b.onShot = saved.onShot;
            b.onSuppressiveShot = saved.onSuppressiveShot;
            b.onCallout = saved.onCallout;
            b.timeLimit = saved.timeLimit;
            b.timeScale = saved.timeScale;
            b.pause();
          }
          return out;
        },
        { count, limit, prefix, arm }
      );
      results.push(...observed);
      await page.close();
      // The public repo intentionally omits private audio; its 404s are not
      // simulation faults. Never suppress JS errors outside that exact path.
      const audioNoise = errors.filter(e => /HTTP 404 loading [^\n]*\/Assets\/audio\//i.test(e));
      const gameErrors = errors.filter(e => !/HTTP 404 loading [^\n]*\/Assets\/audio\//i.test(e));
      console.log('PHASE_C_ASSET_NOISE', JSON.stringify({ type, arm, privateAudio404: audioNoise.length }));
      assert.deepEqual(gameErrors, [], 'non-asset browser runtime errors during natural battle');
    }
    assert.equal(results.length, 2 * count);
    const summary = {
      type,
      commit: process.env.C_FIELD_SHA || 'local',
      count,
      limit,
      arms: Object.fromEntries(
        ['off', 'on'].map(arm => {
          const a = results.filter(x => x.arm === arm);
          const sum = key => a.reduce((n, x) => n + (Number(x[key]) || 0), 0);
          return [
            arm,
            {
              ambush: sum('ambush'),
              prepared: sum('prepared'),
              maneuvers: sum('maneuvers'),
              bounds: sum('bounds'),
              coveredArrivals: sum('coveredArrivals'),
              supportFireDuringMove: sum('supportFireDuringMove'),
              completedNaturalChains: a.reduce(
                (n, x) => n + x.maneuverChains.filter(c => c.complete).length,
                0
              ),
              quietReportSamples: sum('quietReportSamples'),
              precontactCleanSamples: sum('precontactCleanSamples'),
              pressureSamples: sum('pressureSamples'),
              reports: sum('reportSamples'),
              shots: sum('shots'),
              writerConflicts: sum('writerConflicts'),
              wallSeconds: +a.reduce((n, x) => n + x.wallSeconds, 0).toFixed(2)
            }
          ];
        })
      ),
      results
    };
    fs.writeFileSync(dir + '/' + type + '.json', JSON.stringify(summary, null, 2));
    console.log(
      'PHASE_C_NATURAL_FIELD ' +
        JSON.stringify({
          type,
          count,
          off: summary.arms.off,
          on: summary.arms.on,
          onBlockers: summary.results
            .filter(x => x.arm === 'on')
            .map(x => ({
              seed: x.seed,
              reasons: x.rejectionSamples,
              firstModes: x.modeEvents.slice(0, 8),
              summary: x.postures,
              maneuverChains: x.maneuverChains,
              pressureTraces: x.pressureTraces,
              attempts: x.readinessAttempts.map(a => ({
                squad: a.squad,
                serial: a.serial,
                startAt: a.startAt,
                endAt: a.endAt,
                endMode: a.endMode,
                ordered: a.ordered,
                stages: a.stageEvents,
                maxPending: a.maxPending,
                maxAdopted: a.maxAdopted,
                maxApplied: a.maxApplied,
                maxArrived: a.maxArrived,
                maxSettled: a.maxSettled,
                maxHeld: a.maxHeld,
                foreignPublishSamples: a.foreignPublishSamples,
                blockedSamples: a.blockedSamples,
                movingSamples: a.movingSamples,
                lostMaskSamples: a.lostMaskSamples,
                threatsAtStart: a.threatsAtStart || [],
                endContext: a.endContext || null,
                actorLast: a.actorLast
              }))
            }))
        })
    );
    assert.equal(summary.arms.off.ambush + summary.arms.off.maneuvers, 0, 'OFF arm remains inert');
    assert.equal(summary.arms.on.writerConflicts, 0, 'new tactical behavior cannot create writer conflicts');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
