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
  const selectedSeed = Math.max(0, Number(process.env.C_FIELD_SEED_INDEX || 0));
  const traceSquad = String(process.env.C_FIELD_TRACE_SQUAD || '');
  const traceFrom = Number(process.env.C_FIELD_TRACE_FROM || 0);
  const traceTo = Number(process.env.C_FIELD_TRACE_TO || limit);
  const base = process.env.C_FIELD_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
  const flags =
    'localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1';
  const arms = String(process.env.C_FIELD_ARMS || 'off,on')
    .split(',')
    .map(a => a.trim())
    .filter(a => a === 'off' || a === 'on');
  const dir = process.env.C_FIELD_DIR || 'reports/phase-c-field';
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.C_FIELD_CHROMIUM || undefined,
    args: ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const results = [];
  try {
    for (const arm of arms) {
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
        async ({ count, limit, prefix, arm, selectedSeed, traceSquad, traceFrom, traceTo }) => {
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
            if (
              traceSquad &&
              b.time >= traceFrom &&
              b.time <= traceTo &&
              s?.squad &&
              s.faction + ':' + s.squad.id === traceSquad
            )
              active.traceShots.push({
                t: +b.time.toFixed(2),
                soldier: String(s.id),
                state: root.BattleEngagement?.stateOf?.(s)?.state || null
              });
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
              const scenarioIndex = selectedSeed > 0 ? selectedSeed - 1 : index;
              const seed = prefix + '-' + String(scenarioIndex + 1).padStart(4, '0');
              const scenario = root.BattleTownObjectives.regenerate(
                b.scene,
                b.heightAt,
                seed,
                { benchmark: true, benchmarkIndex: scenarioIndex },
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
                pressureTraces: [],
                tickTrace: [],
                traceShots: [],
                routeAudits: []
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
                if (!current || !['ambush', 'hold'].includes(current.mode) || !current.orders?.length)
                  return null;
                const attemptKey = key + '#' + current.serial;
                let attempt = readiness.get(attemptKey);
                if (!attempt) {
                  attempt = {
                    key: attemptKey,
                    squad: key,
                    serial: current.serial,
                    startAt: +b.time.toFixed(2),
                    ordered: current.orders?.length || 0,
                    // Native planner verdict: no hypothetical moves or fabricated availability.
                    reservePlan: current.reservePlan || null,
                    reserveReviews: [],
                    reserveIds: (current.orders || []).filter(o => o.reserve).map(o => String(o.soldierId)),
                    maxReserveAdopted: 0,
                    maxReserveArrived: 0,
                    firstFullReserveAt: null,
                    fullReserveSamples: 0,
                    fullReserveContactSamples: 0,
                    fullReservePreparedSamples: 0,
                    fullReserveAssaultSamples: 0,
                    fullReserveTwoReadyRiflesSamples: 0,
                    fullReserveDecisionSamples: 0,
                    firstFullReserveSnapshot: null,
                    lastFullReserveSnapshot: null,
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
                attempt.reservePlan = current.reservePlan || null;
                if (current.reserveActorIds?.length) attempt.reserveIds = current.reserveActorIds.slice();
                if (
                  current.reserveReview &&
                  !attempt.reserveReviews.some(r => r.at === current.reserveReview.at)
                )
                  attempt.reserveReviews.push(JSON.parse(JSON.stringify(current.reserveReview)));
                attempt.samples++;
                const CR = root.BattleCommandReception;
                const C = root.BattleCoverPositions;
                let pendingCount = 0,
                  adoptedCount = 0,
                  appliedCount = 0;
                let arrivedCount = 0,
                  settledCount = 0,
                  maskedCount = 0,
                  reserveAdoptedCount = 0,
                  reserveArrivedCount = 0;
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
                  if (o.reserve && adoptedMine) reserveAdoptedCount++;
                  if (applied && execution) appliedCount++;
                  if (arrived) arrivedCount++;
                  if (
                    o.reserve &&
                    (arrived ||
                      (execution &&
                        !s.moving &&
                        dist <= 0.5 &&
                        outcome?.current &&
                        outcome?.publishKey === o.key &&
                        outcome?.state === 'held' &&
                        outcome?.owner === 'engagement' &&
                        outcome?.kind === 'hold'))
                  )
                    reserveArrivedCount++;
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
                attempt.maxReserveAdopted = Math.max(attempt.maxReserveAdopted, reserveAdoptedCount);
                attempt.maxReserveArrived = Math.max(attempt.maxReserveArrived, reserveArrivedCount);
                /* Observation only: whether a REAL complete reserve exists at
                   the SAME sampled time as contact, authority and a ready base.
                   Never turn these diagnostic hints into bound authorization. */
                if (
                  attempt.reserveIds.length >= 2 &&
                  reserveArrivedCount === attempt.reserveIds.length
                ) {
                  const readyRifles = (sq.members || [])
                    .filter(
                      man =>
                        man &&
                        !man.dead &&
                        man.hp > 0 &&
                        man.role === 'rifleman' &&
                        !attempt.reserveIds.includes(String(man.id)) &&
                        !!root.BattleEngagement?.supportReady?.(man, b)
                    )
                    .map(man => String(man.id));
                  const snapshot = {
                    at: +b.time.toFixed(2),
                    phase: sq.commandPhase || null,
                    coa: sq.coa || null,
                    inContact: !!sq.inContact,
                    readyAt: current.readyAt ?? null,
                    heldCoreIds: (current.heldActorIds || []).slice(),
                    readyRifleIds: readyRifles,
                    reportCount: (root.SquadAI?.squadContactsMap?.(sq, b) || []).filter(
                      r =>
                        r &&
                        Number.isFinite(r.at) &&
                        b.time >= r.at &&
                        b.time - r.at <= 10 &&
                        Number.isFinite(r.confidence) &&
                        r.confidence >= 0.5
                    ).length,
                    decision: current.lastManeuverDecision
                      ? {
                          reason: current.lastManeuverDecision.reason,
                          supportCount: current.lastManeuverDecision.supportCount,
                          phaseAllowsBound: current.lastManeuverDecision.phaseAllowsBound,
                          possible: current.lastManeuverDecision.possible
                        }
                      : null
                  };
                  if (attempt.firstFullReserveAt == null) {
                    attempt.firstFullReserveAt = snapshot.at;
                    attempt.firstFullReserveSnapshot = snapshot;
                  }
                  attempt.lastFullReserveSnapshot = snapshot;
                  attempt.fullReserveSamples++;
                  if (snapshot.inContact) attempt.fullReserveContactSamples++;
                  if (snapshot.readyAt != null) attempt.fullReservePreparedSamples++;
                  if (snapshot.phase === 'assault') attempt.fullReserveAssaultSamples++;
                  if (readyRifles.length >= 2) attempt.fullReserveTwoReadyRiflesSamples++;
                  if (snapshot.decision?.possible) attempt.fullReserveDecisionSamples++;
                }
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

                /* Read-only, native 0.15 s squad causality trace. Never call updateSquad,
                   advance soldiers, set destinations or replace movement owners here. */
                if (traceSquad && b.time >= traceFrom && b.time <= traceTo) {
                  const [wantedFaction, wantedId] = traceSquad.split(':');
                  const sq = (b.factions?.[wantedFaction]?.squads || []).find(s => String(s.id) === wantedId);
                  if (sq) {
                    const P = root.BattleSquadStability?.tacticalPostures;
                    const posture = P?.current?.(b, sq);
                    const E = root.BattleEngagement;
                    const Leases = root.BattleLeases;
                    /* One read-only physical-route audit per 0.9 s, at most
                       three per battle, only after the actual Meso decision
                       has recorded two effective supporters but no safe mover.
                       Compare cover-slot discovery to the SAME real terrain
                       sampler, never treat a grid point as a command. */
                    if (
                      tick % 6 === 0 &&
                      active.routeAudits.length < 3 &&
                      posture?.lastManeuverDecision?.reason === 'no-safe-covered-mover'
                    ) {
                      const C = root.BattleCoverPositions;
                      const raw = root.SquadAI.squadContactsMap(sq, b) || [];
                      const fresh = raw.filter(
                        r =>
                          Number.isFinite(r?.x) &&
                          Number.isFinite(r?.z) &&
                          Number.isFinite(r?.at) &&
                          b.time >= r.at &&
                          b.time - r.at <= 10 &&
                          r.confidence >= 0.5
                      );
                      const threats = fresh.length && fresh.length <= 3 ? fresh : [];
                      const maxDistance = C?.boundTuning?.().maxDistance || 0;
                      active.routeAudits.push({
                        t: +b.time.toFixed(2),
                        squad: traceSquad,
                        phase: sq.commandPhase,
                        reason: posture.lastManeuverDecision.reason,
                        supportCount: posture.lastManeuverDecision.supportCount,
                        knownContacts: raw.length,
                        freshThreats: fresh.length,
                        threats: threats.map(compactPoint),
                        boundTuning: C?.boundTuning?.() || null,
                        soldiers: (sq.members || []).slice(0, 12).map(s => {
                          const reasons = {},
                            possible = threats.length
                              ? C.candidates(s, b, { root: { position: threats[0] } }, maxDistance)
                              : [],
                            real = possible.slice(0, 48).filter(p => {
                              const result = C.boundRoute(s, b, p, threats);
                              reasons[result.reason] = (reasons[result.reason] || 0) + 1;
                              return result.eligible;
                            }),
                            terrain = [],
                            terrainReasons = {},
                            wideTerrainRoutes = [],
                            wideTerrainReasons = {},
                            originVisibleTo = threats
                              .map((threat, index) => {
                                const here = s.root.position;
                                const low = {
                                  x: here.x,
                                  z: here.z,
                                  y: b.heightAt(here.x, here.z) + root.SquadAI.eyeHeight({ crouching: true })
                                };
                                const high = {
                                  x: threat.x,
                                  z: threat.z,
                                  y: b.heightAt(threat.x, threat.z) + root.SquadAI.eyeHeight({})
                                };
                                return root.SquadAI.hasLineOfSight(
                                  { root: { position: low }, crouching: true },
                                  { root: { position: high } },
                                  b.heightAt,
                                  b.obstacles
                                )
                                  ? index
                                  : -1;
                              })
                              .filter(index => index >= 0);
                          if (threats.length)
                            for (const distance of [1.5, 3, 4.5, 6])
                              for (let k = 0; k < 8; k++) {
                                const angle = (Math.PI * 2 * k) / 8;
                                const p = {
                                  x: s.root.position.x + Math.sin(angle) * distance,
                                  z: s.root.position.z + Math.cos(angle) * distance
                                };
                                const result = C.boundRoute(s, b, p, threats);
                                terrainReasons[result.reason] = (terrainReasons[result.reason] || 0) + 1;
                                if (result.eligible && terrain.length < 4) terrain.push(compactPoint(p));
                              }
                          /* If the crouched launch position is already visible, the
                             existing covered-route test correctly fails at its first
                             sample regardless of how distant the endpoint is.
                             Otherwise examine the REST of the unchanged 12 m range,
                             with denser angles, without publishing any destination. */
                          /* Read-only lookahead: was a genuinely masked reserve post
                             available before contact, with an independently safe bound
                             from THAT hypothetical post? This is not movement authority.
                             No body, orders, contacts, or terrain are mutated. */
                          const staging = {
                            surveyed: false,
                            reachableMaskedOrigins: 0,
                            coveredFromStaging: 0,
                            example: null
                          };
                          if (
                            active.routeAudits.length === 0 &&
                            threats.length &&
                            originVisibleTo.length &&
                            !E.supportReady(s, b) &&
                            root.BattleNavigation?.movementClear
                          ) {
                            staging.surveyed = true;
                            const N = root.BattleNavigation;
                            const A = root.SquadAI;
                            const here = s.root.position;
                            for (const distance of [3, 6, 9])
                              for (let k = 0; k < 8; k++) {
                                const angle = (Math.PI * 2 * k) / 8;
                                const origin = {
                                  x: here.x + Math.sin(angle) * distance,
                                  z: here.z + Math.cos(angle) * distance
                                };
                                if (!N.movementClear(here, origin)) continue;
                                const hidden = threats.every(
                                  r =>
                                    !A.hasLineOfSight(
                                      { root: { position: origin }, crouching: true },
                                      { root: { position: r } },
                                      b.heightAt,
                                      b.obstacles
                                    )
                                );
                                if (!hidden) continue;
                                staging.reachableMaskedOrigins++;
                                const proxy = Object.assign({}, s, {
                                  root: Object.assign({}, s.root, { position: origin })
                                });
                                for (const step of [3, 6])
                                  for (let direction = 0; direction < 8; direction++) {
                                    const rad = (Math.PI * 2 * direction) / 8;
                                    const dest = {
                                      x: origin.x + Math.sin(rad) * step,
                                      z: origin.z + Math.cos(rad) * step
                                    };
                                    if (!C.boundRoute(proxy, b, dest, threats).eligible) continue;
                                    staging.coveredFromStaging++;
                                    if (!staging.example)
                                      staging.example = {
                                        maskedOrigin: compactPoint(origin),
                                        coveredEnd: compactPoint(dest),
                                        distance: step
                                      };
                                  }
                              }
                          }
                          if (threats.length && !originVisibleTo.length && !s.moving)
                            for (const distance of [7.5, 9, 10.5, 12])
                              for (let k = 0; k < 16; k++) {
                                const angle = (Math.PI * 2 * k) / 16;
                                const p = {
                                  x: s.root.position.x + Math.sin(angle) * distance,
                                  z: s.root.position.z + Math.cos(angle) * distance
                                };
                                const result = C.boundRoute(s, b, p, threats);
                                wideTerrainReasons[result.reason] =
                                  (wideTerrainReasons[result.reason] || 0) + 1;
                                if (result.eligible && wideTerrainRoutes.length < 4)
                                  wideTerrainRoutes.push(compactPoint(p));
                              }
                          return {
                            id: String(s.id),
                            role: s.role,
                            fireteam: s._fireteamKey || null,
                            moving: !!s.moving,
                            suppressed: s.suppressedUntil > b.time,
                            reloading: !!s.reloading,
                            effectiveSupport: !!E.supportReady(s, b),
                            coverCandidates: possible.length,
                            coverRoutes: real.length,
                            coverReasons: reasons,
                            originVisibleTo,
                            staging,
                            terrainRoutes: terrain,
                            wideTerrainRoutes,
                            wideTerrainReasons,
                            terrainReasons
                          };
                        })
                      });
                    }
                    const contactView = c =>
                      c
                        ? {
                            point: compactPoint(c),
                            at: c.at,
                            age: b.time - c.at,
                            source: c.source || null,
                            seenBy: c.seenBy ?? null,
                            heard: !!c.heard,
                            relayedFrom: c.relayedFrom ?? null,
                            fireRevealed: !!c.fireRevealed,
                            precision: c.precision || null,
                            confidence: c.confidence ?? null,
                            callout: c.callout ?? null
                          }
                        : null;
                    active.tickTrace.push({
                      t: +b.time.toFixed(2),
                      faction: wantedFaction,
                      squad: String(sq.id),
                      phase: sq.commandPhase || null,
                      coa: sq.coa || null,
                      inContact: !!sq.inContact,
                      assaultAuthorized: !!sq._assaultAuthorized,
                      effectiveCount: sq.effectiveCount ?? null,
                      pinnedCount: sq.pinnedCount ?? null,
                      contactCount: sq.contactCount ?? null,
                      contact: contactView(root.SquadAI.squadContact(sq, b)),
                      contacts: root.SquadAI.squadContactsMap(sq, b),
                      engagementPlan: sq._engagementPlan?.status || null,
                      posture: posture
                        ? {
                            serial: posture.serial,
                            mode: posture.mode,
                            stage: posture.stage,
                            readyAt: posture.readyAt ?? null,
                            heldIds: (posture.heldActorIds || []).slice(),
                            reservePlan: posture.reservePlan || null,
                            reserveReview: posture.reserveReview || null,
                            reserveIds: (posture.orders || [])
                              .filter(o => o.reserve)
                              .map(o => String(o.soldierId)),
                            reservePosts: (posture.orders || [])
                              .filter(o => o.reserve)
                              .map(o => ({ id: String(o.soldierId), position: compactPoint(o.point) })),
                            decision: posture.lastManeuverDecision
                              ? JSON.parse(JSON.stringify(posture.lastManeuverDecision))
                              : null
                          }
                        : null,
                      fireControl: sq.fireControl
                        ? {
                            state: sq.fireControl.state,
                            ids: (sq.fireControl.supporterIds || []).slice(),
                            point: compactPoint(sq.fireControl.supportPoint),
                            source: sq.fireControl.supportSource || null
                          }
                        : null,
                      boundLease: Leases?.get?.(sq, 'bound') || null,
                      boundCycle: !!Leases?.holds?.(sq, 'bound-cycle', b.time),
                      members: (sq.members || []).map(s => {
                        const e = E?.stateOf?.(s);
                        const outcome = root.BattleExecutionOutcome?.man?.(s, b);
                        return {
                          id: String(s.id),
                          role: s.role || null,
                          fireteam: s._fireteamKey || null,
                          dead: !!s.dead,
                          position: compactPoint(s.root?.position),
                          state: e?.state || null,
                          targetId: s.target?.id ?? null,
                          contact: contactView(root.SquadAI.soldierContact(s, b)),
                          beliefs: root.SquadAI.beliefSnapshot(s, b),
                          fireObservation: E?.fireControlObservation?.(s, b),
                          underFire: !!E?.underFireNow?.(s, b),
                          stance: { prone: !!s.prone, crouched: !!s.tacticalCrouch },
                          moving: !!s.moving,
                          suppressed: (s.suppressedUntil || 0) > b.time,
                          readyAt: e?.fireReadyAt ?? null,
                          cooldown: +s.fireCooldown || 0,
                          authorized: !!E?.fireAuthorized?.(s, b),
                          areaSupport: compactPoint(E?.areaSupportOf?.(s, b)),
                          effectiveSupport: !!E?.supportReady?.(s, b),
                          boundOrder: e?.boundOrder
                            ? {
                                id: e.boundOrder.id ?? null,
                                point: compactPoint(e.boundOrder.point || e.cover),
                                kind: e.boundOrder.kind || null
                              }
                            : null,
                          cover: compactPoint(e?.cover),
                          resolver: s._movementResolver?.last
                            ? {
                                owner: s._movementResolver.last.owner || null,
                                kind: s._movementResolver.last.kind || null,
                                point: compactPoint(s._movementResolver.last.point)
                              }
                            : null,
                          outcome: outcome
                            ? {
                                state: outcome.state || null,
                                current: !!outcome.current,
                                owner: outcome.resolverOwner || null,
                                kind: outcome.resolverKind || null
                              }
                            : null
                        };
                      })
                    });
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
                        squadContact && Number.isFinite(+squadContact.at) ? b.time - +squadContact.at : null;
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
                              personalIncoming: (sq.members || []).filter(s =>
                                root.BattleEngagement?.underFireNow?.(s, b)
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
                    if (prev.attemptKey && !attemptKey) {
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
                        const releases = root.BattleSquadStability?.tacticalPostures?.releases?.(sq) || [];
                        ended.release = releases.find(x => x.serial === ended.serial) || null;
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
                  // The native Squad Leader's same-serial authorization must
                  // have independently counted >=2 effective supporters.
                  // One shot during travel cannot prove that by itself.
                  chain.decision?.possible === true &&
                  chain.decision.phaseAllowsBound === true &&
                  chain.decision.coaAllowsBound === true &&
                  chain.decision.supportCount >= 2 &&
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
              active.releasesByFaction = {};
              for (const faction of ['us', 'ge'])
                for (const sq of b.factions?.[faction]?.squads || [])
                  for (const rel of root.BattleSquadStability?.tacticalPostures?.releases?.(sq) || []) {
                    const bucket = (active.releasesByFaction[faction] =
                      active.releasesByFaction[faction] || {});
                    const key = (rel.prepared ? 'prepared:' : 'unprepared:') + rel.reason;
                    bucket[key] = (bucket[key] || 0) + 1;
                  }
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
        { count, limit, prefix, arm, selectedSeed, traceSquad, traceFrom, traceTo }
      );
      results.push(...observed);
      if (traceSquad)
        observed.forEach(x =>
          console.log(
            'PHASE_C_TICK_TRACE',
            JSON.stringify({
              type,
              seed: x.seed,
              squad: traceSquad,
              start: traceFrom,
              end: traceTo,
              ticks: x.tickTrace.length,
              shotEvents: x.traceShots.length,
              maneuverTicks: x.tickTrace.filter(t => t.posture?.mode === 'maneuver').length
            })
          )
        );
      await page.close();
      // The public repo intentionally omits private audio; its 404s are not
      // simulation faults. Never suppress JS errors outside that exact path.
      const audioNoise = errors.filter(e => /HTTP 404 loading [^\n]*\/Assets\/audio\//i.test(e));
      const gameErrors = errors.filter(e => !/HTTP 404 loading [^\n]*\/Assets\/audio\//i.test(e));
      console.log('PHASE_C_ASSET_NOISE', JSON.stringify({ type, arm, privateAudio404: audioNoise.length }));
      assert.deepEqual(gameErrors, [], 'non-asset browser runtime errors during natural battle');
    }
    assert.equal(results.length, arms.length * count);
    const summary = {
      type,
      commit: process.env.C_FIELD_SHA || 'local',
      count,
      limit,
      arms: Object.fromEntries(
        ['off', 'on'].map(arm => {
          const a = results.filter(x => x.arm === arm);
          const sum = key => a.reduce((n, x) => n + (Number(x[key]) || 0), 0);
          const reserveAttempts = a.flatMap(x => x.readinessAttempts || []);
          const reserveReasons = {};
          for (const attempt of reserveAttempts) {
            const reason = String(attempt.reservePlan || 'not-evaluated').split(':')[0];
            reserveReasons[reason] = (reserveReasons[reason] || 0) + 1;
          }
          return [
            arm,
            {
              ambush: sum('ambush'),
              prepared: sum('prepared'),
              reserveAttempts: reserveAttempts.length,
              reserveStaged: reserveAttempts.filter(a => a.reserveIds.length > 0).length,
              reserveFullyAdopted: reserveAttempts.filter(
                a => a.reserveIds.length > 0 && a.maxReserveAdopted >= a.reserveIds.length
              ).length,
              reserveFullyArrived: reserveAttempts.filter(
                a => a.reserveIds.length > 0 && a.maxReserveArrived >= a.reserveIds.length
              ).length,
              reserveReasons,
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
              releasesByFaction: x.releasesByFaction,
              maneuverChains: x.maneuverChains,
              pressureTraces: x.pressureTraces,
              attempts: x.readinessAttempts.map(a => ({
                squad: a.squad,
                serial: a.serial,
                startAt: a.startAt,
                endAt: a.endAt,
                endMode: a.endMode,
                ordered: a.ordered,
                reservePlan: a.reservePlan,
                reserveIds: a.reserveIds,
                maxReserveAdopted: a.maxReserveAdopted,
                maxReserveArrived: a.maxReserveArrived,
                firstFullReserveAt: a.firstFullReserveAt,
                fullReserveSamples: a.fullReserveSamples,
                fullReserveContactSamples: a.fullReserveContactSamples,
                fullReservePreparedSamples: a.fullReservePreparedSamples,
                fullReserveAssaultSamples: a.fullReserveAssaultSamples,
                fullReserveTwoReadyRiflesSamples: a.fullReserveTwoReadyRiflesSamples,
                fullReserveDecisionSamples: a.fullReserveDecisionSamples,
                firstFullReserveSnapshot: a.firstFullReserveSnapshot,
                lastFullReserveSnapshot: a.lastFullReserveSnapshot,
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
                release: a.release || null,
                actorLast: a.actorLast
              }))
            }))
        })
    );
    if (arms.includes('off'))
      assert.equal(summary.arms.off.ambush + summary.arms.off.maneuvers, 0, 'OFF arm remains inert');
    if (arms.includes('on'))
      assert.equal(
        summary.arms.on.writerConflicts,
        0,
        'new tactical behavior cannot create writer conflicts'
      );
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
