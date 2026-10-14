'use strict';
/* Perception / first-hand reacquisition lane (PR #527, ge:ge-2 stale-sighting case).
   Read-only exact-seed observer: boots the same regenerated seeded scenario the
   phase-c natural field probe uses, steps the shipping sim, and records — for the
   traced squad's window — both sides' ground truth (positions, stances, movement),
   each member's hypothetical next-scan acquisition (SquadAI.findTarget with the real
   geometry), the per-enemy detection arithmetic (range x stance visibility x view
   cone x line of sight), belief/report provenance and expiry, and the fire-control
   consumer state. Across the whole battle it censuses first-hand contact episodes
   (sighting -> gap -> reacquisition or stale end) for every squad on both sides.
   No pose, mission, contact, support, route, squad or cover mutation: the probe
   never writes sim state and never draws from the combat RNG. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  const type = process.env.PERC_TYPE || 'us-defend';
  const limit = Math.max(30, Number(process.env.PERC_SECONDS || 305));
  const prefix = process.env.PERC_PREFIX || 'phase-c-natural-20261012';
  const selectedSeed = Math.max(1, Number(process.env.PERC_SEED_INDEX || 1));
  const traceSquad = String(process.env.PERC_SQUAD || 'ge:ge-2');
  const traceFrom = Number(process.env.PERC_FROM || 283);
  const traceTo = Number(process.env.PERC_TO || 300);
  const base =
    process.env.PERC_URL || 'http://127.0.0.1:8799/grasstex/battle_sim_local.php';
  const flags =
    'localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1';
  const label = process.env.PERC_LABEL || traceSquad.replace(':', '-');
  const dir = process.env.PERC_DIR || 'reports/perception-reacquisition';
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PERC_CHROMIUM || undefined,
    args: ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  let out;
  const errors = [];
  try {
    const query = new URLSearchParams(
      type === 'meeting' ? '' : 'defender=' + (type === 'us-defend' ? 'us' : 'ge')
    );
    for (const [k, v] of new URLSearchParams(flags)) query.set(k, v);
    query.set('seed', prefix + '-bootstrap');
    const page = await browser.newPage({ ignoreHTTPSErrors: true });
    page.setDefaultTimeout(120000);
    page.on('pageerror', e => {
      const s = String(e);
      if (!/texture|audio|\.png|\.mp3|failed to load resource|HTTP 404/i.test(s)) errors.push(s);
    });
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
    out = await page.evaluate(
      async ({ type, limit, prefix, selectedSeed, traceSquad, traceFrom, traceTo }) => {
        const root = window;
        const b = root.__battle__;
        const S = root.SquadAI;
        if (!(S && S.findTarget && S.hasLineOfSight && S.detectionRange))
          throw new Error('perception APIs present');
        const engine = b.scene?.getEngine?.();
        if (engine && root.__battleRenderLoop__) engine.stopRenderLoop(root.__battleRenderLoop__);
        b.pause();
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
        b.onUpdate = b.onWinner = b.onShot = b.onSuppressiveShot = b.onCallout = () => {};
        const scenarioIndex = selectedSeed - 1;
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

        const FOCUS_HALF = Math.PI / 3;
        const PERIPHERAL_HALF = (100 * Math.PI) / 180;
        const PERIPHERAL_RANGE = 0.35;
        const PERIPHERAL_MOVING = 0.55;
        const BEHIND_RANGE = 10;
        const angDiff = (a, bYaw) => Math.abs(Math.atan2(Math.sin(a - bYaw), Math.cos(a - bYaw)));
        const stanceName = e =>
          e.prone ? 'prone' : e.crouching || e.tacticalCrouch ? 'crouch' : 'stand';
        const sightScaleOf = s => {
          const stats = root.BattleSoldierStats;
          const v = stats ? stats.scale(s, 'sight') : 1;
          return Number.isFinite(v) && v > 0 ? v : 1;
        };
        const compactPoint = p =>
          p && Number.isFinite(p.x) && Number.isFinite(p.z)
            ? { x: +p.x.toFixed(2), z: +p.z.toFixed(2) }
            : null;
        const contactView = c =>
          c
            ? {
                point: compactPoint(c),
                unitId: c.unit ? String(c.unit.id) : c.knownUnitId ?? null,
                at: Number.isFinite(+c.at) ? +(+c.at).toFixed(2) : null,
                age: Number.isFinite(+c.at) ? +(b.time - c.at).toFixed(2) : null,
                seenBy: c.seenBy ?? null,
                firstHandAt: Number.isFinite(+c.firstHandAt) ? +(+c.firstHandAt).toFixed(2) : null,
                source: c.source || null,
                heard: !!c.heard,
                told: !!c.told,
                relayedFrom: c.relayedFrom ?? null,
                fireRevealed: !!c.fireRevealed,
                confidence: Number.isFinite(+c.confidence) ? +(+c.confidence).toFixed(3) : null
              }
            : null;

        const [wantedFaction, wantedId] = traceSquad.split(':');
        const foeFaction = wantedFaction === 'us' ? 'ge' : 'us';
        const windowTrace = [];
        const census = {};
        const gapLog = [];
        for (const f of ['us', 'ge'])
          for (const sq of b.factions?.[f]?.squads || [])
            census[f + ':' + sq.id] = {
              squad: f + ':' + sq.id,
              firstHandAt: null,
              lastFirstHandAt: null,
              reacquisitions: 0,
              staleEnds: 0
            };
        const firstHandFresh = c => {
          if (!c) return false;
          const at = c.firstHandAt != null && isFinite(+c.firstHandAt) ? +c.firstHandAt : c.at;
          return at != null && isFinite(+at) && b.time - at <= 10;
        };

        function recordWindowTick() {
          const sq = (b.factions?.[wantedFaction]?.squads || []).find(
            s => String(s.id) === wantedId
          );
          if (!sq) return;
          const posture = root.BattleSquadStability?.tacticalPostures?.current?.(b, sq);
          const foes = (b._roster?.[foeFaction] || []).filter(e => e && !e.dead);
          const foeView = foes.map(e => ({
            id: String(e.id),
            squad: e.squad ? String(e.squad.id) : null,
            role: e.role || null,
            pos: compactPoint(e.root.position),
            stance: stanceName(e),
            moving: !!e.moving,
            targetId: e.target ? String(e.target.id) : null
          }));
          const members = (sq.members || []).map(s => {
            const p = s.root?.position;
            const look = S.lookYaw(s, b);
            const sight = sightScaleOf(s);
            const nextScan =
              !s.dead && !s.target
                ? S.findTarget(s, b.rosterOf(foeFaction), b.heightAt, b.obstacles, b)
                : null;
            const pairs = [];
            if (!s.dead && p)
              for (const e of foes) {
                const d = Math.hypot(e.root.position.x - p.x, e.root.position.z - p.z);
                if (d > 260) continue;
                const detBase = S.detectionRange(S.ROLES[s.role] || S.ROLES.rifleman, e);
                const off = angDiff(
                  Math.atan2(e.root.position.x - p.x, e.root.position.z - p.z),
                  look
                );
                let reach = 0;
                if (off <= FOCUS_HALF) reach = 1;
                else if (off <= PERIPHERAL_HALF) reach = e.moving ? PERIPHERAL_MOVING : PERIPHERAL_RANGE;
                const behind = d <= BEHIND_RANGE;
                const effRange =
                  reach > 0 || behind ? detBase * sight * (behind && reach === 0 ? 1 : reach) : 0;
                const rangeOK = d <= effRange;
                const los = rangeOK ? S.hasLineOfSight(s, e, b.heightAt, b.obstacles) : false;
                pairs.push({
                  e: String(e.id),
                  d: +d.toFixed(1),
                  st: stanceName(e),
                  mv: !!e.moving,
                  det: +detBase.toFixed(1),
                  off: Math.round((off * 180) / Math.PI),
                  reach,
                  rangeOK,
                  los,
                  spottable: !!(rangeOK && los)
                });
              }
            return {
              id: String(s.id),
              role: s.role || null,
              pos: compactPoint(p),
              bodyYaw: p ? +(s.root.rotation.y || 0).toFixed(3) : null,
              lookYaw: Number.isFinite(look) ? +look.toFixed(3) : null,
              stance: { prone: !!s.prone, crouched: !!(s.crouching || s.tacticalCrouch) },
              moving: !!s.moving,
              sight: +sight.toFixed(3),
              targetId: s.target ? String(s.target.id) : null,
              targetDist:
                s.target && p
                  ? +Math.hypot(
                      s.target.root.position.x - p.x,
                      s.target.root.position.z - p.z
                    ).toFixed(1)
                  : null,
              scanAt: Number.isFinite(+s._scanAt) ? +(+s._scanAt).toFixed(2) : null,
              nextScan: nextScan ? String(nextScan.id) : null,
              ownContact: contactView(S.soldierContact(s, b)),
              pairs
            };
          });
          const foeSquads = (b.factions?.[foeFaction]?.squads || []).map(osq => ({
            id: String(osq.id),
            contact: contactView(S.squadContact(osq, b)),
            anyTarget: (osq.members || []).some(m => m && !m.dead && m.target),
            fireControl: osq.fireControl?.state || null
          }));
          windowTrace.push({
            t: +b.time.toFixed(2),
            phase: sq.commandPhase || null,
            posture: posture
              ? { mode: posture.mode, stage: posture.stage || null, serial: posture.serial }
              : null,
            fireControl: sq.fireControl
              ? {
                  state: sq.fireControl.state,
                  ids: (sq.fireControl.supporterIds || []).slice(),
                  source: sq.fireControl.supportSource || null
                }
              : null,
            contact: contactView(S.squadContact(sq, b)),
            sectors: (S.squadContactsMap(sq, b) || []).slice(0, 3).map(x => ({
              x: +(+x.x).toFixed(1),
              z: +(+x.z).toFixed(1),
              at: +(+x.at).toFixed(2),
              source: x.source,
              confidence: x.confidence
            })),
            members,
            foes: foeView,
            foeSquads
          });
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
          /* Whole-battle first-hand episode census (read-only). */
          for (const f of ['us', 'ge'])
            for (const sq of b.factions?.[f]?.squads || []) {
              const key = f + ':' + sq.id;
              const rec = census[key];
              if (!rec) continue;
              const anyTarget = (sq.members || []).some(m => m && !m.dead && m.target);
              const c = S.squadContact(sq, b);
              const fresh = anyTarget || firstHandFresh(c);
              const now = +b.time.toFixed(2);
              if (fresh) {
                if (rec.firstHandAt == null) rec.firstHandAt = now;
                rec.lastFirstHandAt = now;
                if (rec.openGap) {
                  const dur = +(now - rec.openGap.from).toFixed(2);
                  gapLog.push({ t: now, squad: key, event: 'reacquired', dur, stale: dur > 12 });
                  rec.reacquisitions++;
                  rec.openGap = null;
                }
              } else if (rec.firstHandAt != null && !rec.openGap && b.time - rec.lastFirstHandAt >= 3) {
                rec.openGap = { from: rec.lastFirstHandAt };
                gapLog.push({ t: now, squad: key, event: 'gap-open' });
              }
            }

          /* Focused window trace with ground truth and detection arithmetic. */
          if (b.time >= traceFrom && b.time <= traceTo) {
            recordWindowTick();
          }
        }
        /* Close open gaps at battle end. */
        for (const key of Object.keys(census)) {
          const rec = census[key];
          if (rec.openGap) {
            const dur = +(+b.time.toFixed(2) - rec.openGap.from).toFixed(2);
            rec.openGap = null;
            if (dur > 12) rec.staleEnds++;
            gapLog.push({ t: +b.time.toFixed(2), squad: key, event: 'gap-open-at-end', dur });
          }
        }
        for (const k of Object.keys(saved)) b[k] = saved[k];
        return {
          type,
          seed,
          scenarioFingerprint: scenario?.fingerprint || null,
          traceSquad,
          traceFrom,
          traceTo,
          seconds: +b.time.toFixed(2),
          winner: b.winner || null,
          window: windowTrace,
          census,
          gapLog,
          beliefTelemetry: S.beliefTelemetry ? S.beliefTelemetry(b) : null,
          wallSeconds: +((performance.now() - wallStart) / 1000).toFixed(2)
        };
      },
      { type, limit, prefix, selectedSeed, traceSquad, traceFrom, traceTo }
    );
    await browser.close();
  } finally {
    await browser.close().catch(() => {});
  }
  assert.deepEqual(errors, []);
  const file = dir + '/perception-reacquisition-' + label + '.json';
  fs.writeFileSync(file, JSON.stringify(out));

  /* Adjudication summary straight from the recorded window. */
  const w = out.window || [];
  const ticksWithScan = w.filter(x => (x.members || []).some(m => m.nextScan));
  const anySpottable = w.filter(x =>
    (x.members || []).some(m => (m.pairs || []).some(p => p.spottable))
  );
  console.log('== perception-reacquisition', out.traceSquad, 'seed', out.seed, '==');
  console.log(
    'window ticks', w.length,
    '| ticks hypothetical next-scan would acquire:', ticksWithScan.length,
    '| ticks any pair spottable:', anySpottable.length
  );
  for (const x of ticksWithScan.slice(0, 12))
    for (const m of x.members)
      if (m.nextScan)
        console.log('  t=' + x.t, 'member', m.id, '(' + m.role + ')', 'would acquire', m.nextScan);
  if (w.length) {
    const last = w[w.length - 1];
    for (const m of last.members) {
      const best = (m.pairs || []).slice().sort((a, b2) => a.d - b2.d)[0];
      console.log(
        '  final t=' + last.t, m.id, m.role || '', 'stance', JSON.stringify(m.stance),
        'target', m.targetId,
        best
          ? 'nearest foe ' + best.e + ' d=' + best.d + ' ' + best.st + (best.mv ? ' mv' : '') +
            ' det=' + best.det + ' off=' + best.off + 'deg reach=' + best.reach +
            (best.los ? ' LOS-ok' : ' LOS-blocked')
          : ''
      );
    }
  }
  const reacq = Object.values(out.census || {}).filter(r => r.reacquisitions > 0);
  console.log(
    'census: squads with >=1 reacquisition:', reacq.length,
    'of', Object.keys(out.census || {}).length
  );
  for (const r of reacq)
    console.log('  ', r.squad, 'reacq=' + r.reacquisitions, 'staleEnds=' + r.staleEnds);
  console.log('wall', out.wallSeconds + 's', '->', file);
})().catch(e => {
  console.error(e);
  process.exit(1);
});

