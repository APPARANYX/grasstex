import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { summarizeStress, stressMarkdown } from './lib/stress-summary.mjs';
import evidence from './lib/benchmark-evidence.cjs';
import { scoreSquadPerformance, summarizeSquadPerformance } from './lib/squad-performance.mjs';

const count = Math.max(1, Number.parseInt(process.env.BATTLE_BENCHMARK_COUNT || '100', 10) || 100);
const seedPrefix = String(process.env.BATTLE_BENCHMARK_SEED || `benchmark-${(process.env.GITHUB_SHA || 'local').slice(0, 12)}`);
const url = process.env.BATTLE_BENCHMARK_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const timeLimit = Math.max(60, Number.parseFloat(process.env.BATTLE_BENCHMARK_TIME_LIMIT || '600') || 600);
const fixedDt = Math.max(0.05, Math.min(0.3, Number.parseFloat(process.env.BATTLE_BENCHMARK_STEP || '0.15') || 0.15));
const outputDir = path.resolve(process.env.BATTLE_BENCHMARK_OUTPUT || 'reports');
const policyUrl = process.env.BATTLE_BENCHMARK_POLICY_URL || 'https://test.ivandpopov.com/grasstex/battle_policy.php';
const commit = process.env.BATTLE_BENCHMARK_SOURCE_SHA || process.env.GITHUB_SHA || 'local';
/* Scripted windows, `contact+60,every60`: measure 60 simulated seconds from first contact, then the rest of the battle in
   segments that close at every multiple of 60 simulated seconds and at the end. An entry is `<start>+<seconds>` (a start of
   `contact` or a simulated second, the battle stepped unmeasured up to it) or `every<seconds>` (last: to the end of the battle).
   Unset, the benchmark is the whole battle as one record. */
const windows = String(process.env.BATTLE_BENCHMARK_WINDOWS || '').split(',').map(s => s.trim()).filter(Boolean).map(token => {
  const every = token.match(/^every(\d+(?:\.\d+)?)$/);
  if (every && +every[1] > 0) return { every: +every[1] };
  const m = token.match(/^(contact|\d+(?:\.\d+)?)\+(\d+(?:\.\d+)?)$/);
  if (!m) throw new Error(`BATTLE_BENCHMARK_WINDOWS: "${token}" is not <contact|second>+<seconds> or every<seconds>`);
  return { start: m[1] === 'contact' ? 'contact' : +m[1], seconds: +m[2] };
});
if (windows.some((w, i) => w.every && i !== windows.length - 1)) throw new Error('BATTLE_BENCHMARK_WINDOWS: every<seconds> runs to the end of the battle, so it must be last');
const battleType = (new URL(url).searchParams.get('defender') || 'meeting') === 'meeting' ? 'meeting' : `${new URL(url).searchParams.get('defender')}-defend`;

/* A shard of a larger run numbers its seeds from here: BATTLE_BENCHMARK_FIRST=10 and a count of 5 play `<prefix>-0011` to `<prefix>-0015`.
   Set, even to 0, the seeds are always numbered (a count of 1 included); unset, one scripted battle plays the exact seed it was given. */
const numbered = (process.env.BATTLE_BENCHMARK_FIRST || '') !== '';
const firstIndex = numbered ? Math.max(0, Number.parseInt(process.env.BATTLE_BENCHMARK_FIRST, 10) || 0) : 0;

fs.mkdirSync(outputDir, { recursive: true });

function pct(n, d) { return d ? `${(100 * n / d).toFixed(1)}%` : '0.0%'; }
function mean(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }
function quantile(values, q) {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y), p = (a.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p);
  return lo === hi ? a[lo] : a[lo] + (a[hi] - a[lo]) * (p - lo);
}
function csv(value) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}
function clamp(v, a = 0, b = 100) { return Math.max(a, Math.min(b, v)); }
function sum(battles, fn) { return battles.reduce((n, b) => n + (+fn(b) || 0), 0); }
function rate(n, d) { return d > 0 ? n / d : 0; }
function dedupe(values, limit = 60) { return [...new Set(values.map(String))].slice(0, limit); }
function healthFor(b) {
  const sampleSquads = Math.max(1, +b.squadSamples || 0);
  const ordered = Math.max(1, +b.orderedMoveSamples || 0);
  const shots = Math.max(1, +b.fire?.total || 0);
  const strategic = clamp(100
    - rate(b.targetlessSamples, sampleSquads) * 45
    - Math.min(35, (b.targetlessStalls?.length || 0) * 8)
    - Math.min(30, (+b.strategicWriterConflicts || 0) * 6)
    - Math.min(25, (b.loopAlerts?.length || 0) * 4));
  const movement = clamp(100
    - Math.min(45, (b.routeStalls?.length || 0) * 7)
    - Math.min(35, (b.movementStalls?.length || 0) * 2.2)
    - rate(b.idleOrderedSamples, ordered) * 35);
  const cohesion = clamp(100
    - rate(b.overCohesionSamples, sampleSquads) * 55
    - Math.min(35, (b.longRegroups?.length || 0) * 7));
  const combat = clamp(100
    - rate(+b.losBlockedFireAttempts || 0, shots + (+b.losBlockedFireAttempts || 0)) * 30
    - Math.min(20, rate(+b.fire?.suppressedTargets || 0, shots) * 3));
  const objective = clamp(100
    - Math.min(45, (b.vacantObjectiveStalls?.length || 0) * 10)
    - (b.captures === 0 ? 22 : 0)
    /* An objective nobody ever owned is worse than a slow one: it usually means no squad was ever
       sent there at all, which is the failure mode that left a third of the map neutral. */
    - rate(+b.objectivesNeverOwned || 0, Math.max(1, +b.objectiveCount || 1)) * 40
    - Math.min(35, rate(+b.maxNoObjectiveProgressSeconds || 0, Math.max(1, +b.simulatedSeconds || timeLimit)) * 40));
  const overall = mean([strategic, movement, cohesion, combat, objective]);
  return {
    overall: +overall.toFixed(1), strategic: +strategic.toFixed(1), movement: +movement.toFixed(1),
    cohesion: +cohesion.toFixed(1), combat: +combat.toFixed(1), objective: +objective.toFixed(1)
  };
}

async function getLivePolicy() {
  try {
    const response = await fetch(policyUrl, { headers: { 'cache-control': 'no-cache' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json?.genome) return { source: 'live-policy-endpoint', revision: Number(json.revision || 0), genome: json.genome };
    return { source: 'runtime-default', revision: Number(json?.revision || 0), genome: null, warning: 'Policy endpoint returned no genome.' };
  } catch (error) {
    return { source: 'runtime-default', revision: 0, genome: null, warning: `Live policy fetch failed: ${error?.message || error}` };
  }
}

const policy = await getLivePolicy();
const browserErrors = [], browserWarnings = [];
const startedWall = Date.now();
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });

try {
  // ignoreHTTPSErrors: sandboxed environments proxy the CDN with their own CA (as the smoke test does).
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(120_000);
  page.on('pageerror', error => browserErrors.push(String(error?.stack || error)));
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') browserErrors.push(text);
    else if (msg.type() === 'warning') browserWarnings.push(text);
  });
  await page.route('**/*', async route => {
    const type = route.request().resourceType();
    if (type === 'media' || type === 'font') return route.abort();
    return route.continue();
  });

  const pageUrl = `${url}${url.includes('?') ? '&' : '?'}seed=${encodeURIComponent(seedPrefix + '-bootstrap')}`;
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForFunction(() => !!(
    window.__battle__ && window.BattleCommanderAI && window.BattleTownObjectives &&
    window.BattleAIPolicy && window.BattleObjectiveSystem && window.BattleModules
  ), null, { timeout: 120_000 });

  /* The page silences its console while a benchmark runs, so progress comes out through this instead. */
  await page.exposeFunction('__benchLog', text => console.log(text));
  await page.addScriptTag({ path: path.resolve('scripts/battle-benchmark-intent.cjs') });
  const result = await page.evaluate(async ({ count, seedPrefix, fixedDt, timeLimit, suppliedPolicy, windows, battleType, numbered, firstIndex }) => {
    const root = window, sim = root.__battle__, engine = sim.scene?.getEngine?.(), renderLoop = root.__battleRenderLoop__;
    if (engine && renderLoop) engine.stopRenderLoop(renderLoop);
    sim.pause();

    const baseline = suppliedPolicy?.genome || root.BattleAIPolicy.get();
    const rawRestart = sim._controlRawRestart || sim.restart.bind(sim);
    const saved = {
      onFire: sim.onFire, onShot: sim.onShot, onSuppressiveShot: sim.onSuppressiveShot,
      onCallout: sim.onCallout, onUpdate: sim.onUpdate, onWinner: sim.onWinner,
      timeScale: sim.timeScale, timeLimit: sim.timeLimit, paused: sim.paused
    };
    const originalScenario = sim.scene.metadata && (sim.scene.metadata.battleScenario || sim.scene.metadata.battleTown);
    const originalSeed = originalScenario?.seed;
    const telemetry = root.BattleTelemetry || null;
    if (telemetry?.end) { try { await telemetry.end(sim, 'benchmark-start'); } catch (_) {} }
    const telemetrySaved = telemetry ? { record: telemetry.record, start: telemetry.start, ensure: telemetry.ensure, end: telemetry.end, checkpoint: telemetry.checkpoint, flush: telemetry.flush } : null;
    const telemetryConsole = telemetry?.setConsoleLogging ? telemetry.setConsoleLogging(false) : null;
    if (telemetry) {
      telemetry.record = function(){}; telemetry.start = function(){}; telemetry.ensure = function(){};
      telemetry.end = async function(){ return true; }; telemetry.checkpoint = async function(){ return true; }; telemetry.flush = async function(){ return true; };
    }

    let activeCombat = null, activeAcquisition = null;
    function stanceOf(s) { return String(s?.stance || s?.eng?.stance || 'unknown'); }
    function combatBucket(shooter) {
      const sq = shooter?.squad, faction = shooter?.faction || sq?.faction;
      if (!activeCombat || !sq || !faction || sq.id == null) return null;
      const key = `${faction}:${sq.id}`;
      return activeCombat.bySquad[key] || (activeCombat.bySquad[key] = { total: 0, direct: 0, hits: 0, suppressive: 0, suppressedTargets: 0 });
    }
    sim.onFire = function(shooter){
      if (!activeCombat) return;
      activeCombat.total++;
      const bucket = combatBucket(shooter); if (bucket) bucket.total++;
      const stance = stanceOf(shooter); activeCombat.byStance[stance] = (activeCombat.byStance[stance] || 0) + 1;
      if (activeCombat.firstFireSeconds == null) activeCombat.firstFireSeconds = +sim.time.toFixed(2);
    };
    sim.onShot = function(shooter, target, hit){
      if (!activeCombat) return;
      activeCombat.direct++; if (hit) activeCombat.hits++;
      const bucket = combatBucket(shooter); if (bucket) { bucket.direct++; if (hit) bucket.hits++; }
      const stance = stanceOf(shooter); const key = hit ? 'hitsByStance' : 'missesByStance';
      activeCombat[key][stance] = (activeCombat[key][stance] || 0) + 1;
    };
    sim.onSuppressiveShot = function(shooter, point, count){
      if (!activeCombat) return;
      activeCombat.suppressive++; activeCombat.suppressedTargets += +count || 0;
      const bucket = combatBucket(shooter); if (bucket) { bucket.suppressive++; bucket.suppressedTargets += +count || 0; }
    };
    sim.onCallout = sim.onUpdate = sim.onWinner = function(){};

    function allUnits() {
      const out = [];
      for (const faction of ['us', 'ge']) for (const u of sim._roster?.[faction] || []) if (u) out.push(u);
      for (const u of sim._moduleUnits || []) if (u && !out.includes(u)) out.push(u);
      return out;
    }
    function units(faction) { return root.BattleModules.unitsFor(sim).filter(u => u && u.faction === faction && !u.dead && u.countsForElimination !== false); }
    function targetKey(s) { return s?.target && !s.target.dead ? String(s.target.faction || '?') + ':' + String(s.target.id) : null; }
    function newAcquisition() {
      const a={ total:0, reacquired:0, byFaction:{us:0,ge:0}, firstAt:null, previous:Object.create(null), ever:Object.create(null) };
      for(const faction of ['us','ge']) for(const s of sim._roster?.[faction]||[]) {
        const k=`${faction}:${s.id}`, t=targetKey(s); a.previous[k]=t; if(t)a.ever[k]=true;
      }
      return a;
    }
    function sampleAcquisitions() {
      const a=activeAcquisition;if(!a)return;
      for(const faction of ['us','ge']) for(const s of sim._roster?.[faction]||[]) {
        if(!s||s.dead)continue;
        const k=`${faction}:${s.id}`, cur=targetKey(s), prev=Object.prototype.hasOwnProperty.call(a.previous,k)?a.previous[k]:null;
        if(cur&&!prev){
          a.total++;a.byFaction[faction]=(a.byFaction[faction]||0)+1;
          if(a.ever[k])a.reacquired++;else a.ever[k]=true;
          if(a.firstAt==null)a.firstAt=+sim.time.toFixed(2);
        }
        a.previous[k]=cur;
      }
    }
    function acquisitionSummary(a) {
      return a?{total:a.total,reacquired:a.reacquired,byFaction:{us:a.byFaction.us||0,ge:a.byFaction.ge||0},firstAt:a.firstAt}:null;
    }
    function forceValue(faction) { let total = 0; for (const u of units(faction)) total += u.scoreValue == null ? 1 : +u.scoreValue; return total; }
    function aliveMembers(sq) { return (sq?.members || []).filter(s => s && !s.dead && s.root); }
    function avgSquad(sq) {
      const alive = aliveMembers(sq); if (!alive.length) return null;
      let x = 0, z = 0; for (const s of alive) { x += +s.root.position.x || 0; z += +s.root.position.z || 0; }
      return { x: x / alive.length, z: z / alive.length };
    }
    function distance(a, b) { return !a || !b ? Infinity : Math.hypot((+a.x || 0) - (+b.x || 0), (+a.z || 0) - (+b.z || 0)); }
    function objectiveStatus(obj) { try { return root.BattleObjectiveSystem.status(sim, obj.id) || obj.state || {}; } catch (_) { return obj.state || {}; } }
    function objectivePoint(obj) { const d = obj?.def || obj || {}; return { x: +d.x || 0, z: +d.z || 0 }; }
    function objectiveSignature() {
      return (sim._objectives || []).map(o => { const s = objectiveStatus(o); return `${o.id}:${s.owner || 'neutral'}:${s.active || '-'}:${Math.round(+s.progress || 0)}`; }).join('|');
    }
    function phaseAllowsAdvance(phase) { return ['approach','assault','capture','clear-town','flank','contact','corner-check'].includes(String(phase || '')); }
    function leaderAlive(sq) { return !!root.SquadAI.leaderOf(sq); }
    function cohesionLimit(sq) {
      try { const cfg = root.BattleCommanderAI.policyFor?.(sim, sq.faction); return cfg ? +(leaderAlive(sq) ? cfg.cohesionRadius : cfg.captainlessCohesion) : null; }
      catch (_) { return null; }
    }
    function squadSpread(sq, p) {
      if (!p) return null; let best = 0; for (const s of aliveMembers(sq)) best = Math.max(best, distance(s.root.position, p)); return best;
    }
    function engagementState(s) { try { return root.BattleEngagement?.stateOf?.(s) || s.eng || {}; } catch (_) { return s.eng || {}; } }
    function addMap(map, key, n = 1) { key = String(key || 'unknown'); map[key] = (map[key] || 0) + n; }
    function provenanceConflicts() { try { return root.BattleOrderProvenance?.conflicts?.(sim) || []; } catch (_) { return []; } }
    function loopAlerts() { try { return root.BattleAILoopWatch?.alerts?.(sim) || []; } catch (_) { return []; } }
    function observerEvent(kind, data) { try { return root.BattleAITimeline?.observeEvent?.(sim, kind, data) || null; } catch (_) { return null; } }
    function coordinationHealth() { try { return root.BattleAICoordinationHealth?.summary?.(sim) || null; } catch (_) { return null; } }
    function movementResolverSummary() {
      const out = { soldiers: 0, changes: 0, orderWins: 0, combatWins: 0, byKind: {} };
      for (const s of allUnits()) {
        const st = s?._movementResolver; if (!st) continue; out.soldiers++;
        out.changes += +st.changes || 0; out.orderWins += +st.orderWins || 0; out.combatWins += +st.combatWins || 0;
        if (st.last?.kind) addMap(out.byKind, st.last.kind);
      }
      return out;
    }
    function losBlockedAttempts() { let n = 0; for (const s of allUnits()) n += +s._losBlockedFire || 0; return n; }
    function crestBlockedAttempts() { let n = 0; for (const s of allUnits()) n += +s._crestBlockedFire || 0; return n; }

    function squadResolverChanges(sq) {
      let n = 0; for (const soldier of aliveMembers(sq)) n += +(soldier?._movementResolver?.changes || 0); return n;
    }
    function sampleSquadPerformance(state, faction, sq, p, phase, spread, limit, targetless, now) {
      const key = `${faction}:${sq.id}`, alive = aliveMembers(sq), role = String(sq.commandRole || 'maneuver');
      let raw = state.squadPerformance[key];
      if (!raw) raw = state.squadPerformance[key] = {
        faction, squad: String(sq.id), samples: 0, roleSamples: {}, phaseSamples: {},
        aliveStart: alive.length, aliveEnd: alive.length, assignedSamples: 0, targetlessSamples: 0,
        inContactSamples: 0, overCohesionSamples: 0, regroupSamples: 0, retreatSamples: 0, supportHoldSamples: 0,
        insideObjectiveSamples: 0, friendlyOwnedTargetSamples: 0, contestingTargetSamples: 0, advanceSamples: 0,
        travelMeters: 0, objectiveProgressMeters: 0, objectiveRegressionMeters: 0,
        targetSwitches: 0, phaseSwitches: 0, movementResolverChanges: 0,
        _lastPos: null, _lastTarget: undefined, _lastTargetDistance: null, _lastPhase: null, _lastResolverChanges: null
      };
      raw.samples++; raw.aliveEnd = alive.length; addMap(raw.roleSamples, role); addMap(raw.phaseSamples, phase);
      if (sq.targetObjective != null) raw.assignedSamples++;
      if (targetless) raw.targetlessSamples++;
      if (sq.inContact) raw.inContactSamples++;
      if (spread != null && limit != null && spread > limit) raw.overCohesionSamples++;
      if (phase === 'regroup') raw.regroupSamples++;
      if (sq.state === 'retreat' || phase === 'retreat') raw.retreatSamples++;
      if (phase === 'support-hold' || role === 'support') raw.supportHoldSamples++;
      if (phaseAllowsAdvance(phase) && sq.targetObjective != null && sq.state !== 'retreat') raw.advanceSamples++;

      if (p) {
        if (raw._lastPos) raw.travelMeters += distance(p, raw._lastPos);
        raw._lastPos = { x: p.x, z: p.z };
      }
      const target = sq.targetObjective == null ? null : String(sq.targetObjective);
      if (raw._lastTarget != null && target != null && raw._lastTarget !== target) raw.targetSwitches++;
      if (raw._lastPhase != null && raw._lastPhase !== phase) raw.phaseSwitches++;
      raw._lastPhase = phase;

      let targetDistance = null;
      const obj = target && root.BattleObjectiveSystem.get(sim, target);
      if (p && obj) {
        const st = objectiveStatus(obj), op = objectivePoint(obj), radius = +(obj.def?.radius || st.radius || 20);
        targetDistance = distance(p, op);
        if (targetDistance <= radius) raw.insideObjectiveSamples++;
        if (st.owner === faction) raw.friendlyOwnedTargetSamples++;
        if (st.active) raw.contestingTargetSamples++;
      }
      /* Objective-distance movement is a mission-progress metric, not a generic displacement metric.
         A retreating squad deliberately increases distance from its assigned objective; counting that as
         regression makes correct survival/extraction behavior look like failed maneuver. Travel and
         preservation still record retreat movement, while forward tactical backsliding remains penalized. */
      const retreating = sq.state === 'retreat' || phase === 'retreat';
      if (!retreating && raw._lastTarget === target && target != null && Number.isFinite(raw._lastTargetDistance) && Number.isFinite(targetDistance)) {
        const delta = raw._lastTargetDistance - targetDistance;
        if (delta >= .25) raw.objectiveProgressMeters += delta;
        else if (delta <= -.25) raw.objectiveRegressionMeters += -delta;
      }
      raw._lastTarget = target; raw._lastTargetDistance = targetDistance;

      const resolver = squadResolverChanges(sq);
      if (raw._lastResolverChanges != null && resolver >= raw._lastResolverChanges) raw.movementResolverChanges += resolver - raw._lastResolverChanges;
      raw._lastResolverChanges = resolver;
    }

    const SAMPLE_SECONDS = 2.5;
    function sampleDiagnostics(state) {
      const now = +sim.time || 0, sig = objectiveSignature(), stats = sim.objectiveStats || {};
      if (sig !== state.lastObjectiveSig) {
        if (state.firstObjectiveProgressSeconds == null) state.firstObjectiveProgressSeconds = +now.toFixed(1);
        state.maxNoObjectiveProgress = Math.max(state.maxNoObjectiveProgress, now - state.lastObjectiveChangeAt);
        state.lastObjectiveChangeAt = now; state.lastObjectiveSig = sig;
      }
      if (state.firstCaptureSeconds == null && (+stats.captures || 0) > 0) state.firstCaptureSeconds = +now.toFixed(1);

      /* Which objectives anybody ever held or contested. An end-of-battle owner count cannot tell a
         zone that was taken and lost from one nobody ever walked into, and "never contested" is the
         sharper signal: it means no squad was ever sent there at all. */
      for (const o of (sim._objectives || [])) {
        const st = objectiveStatus(o);
        if (st.owner && st.owner !== 'neutral') state.everOwned[o.id] = st.owner;
        if (st.active) state.everContested[o.id] = true;
      }

      for (const faction of ['us', 'ge']) {
        /* How many distinct objectives this side's squads are actually assigned to. Every
           non-reserve route ends at the settlement centre, so squads score objectives from the
           same position: without deconfliction in the doctrine score this collapses to 1 and the
           outer objectives are never assigned to anybody. */
        const assignedTargets = new Set();
        for (const sq of sim.factions?.[faction]?.squads || []) {
          if (!sq) continue;
          if ((sq.aliveCount || 0) > 0 && sq.targetObjective) assignedTargets.add(String(sq.targetObjective));
          const key = `${faction}:${sq.id}`, p = avgSquad(sq), phase = String(sq.commandPhase || 'none');
          state.squadSamples++; addMap(state.phaseSamples, phase);
          if (sq.inContact) { state.inContactSamples++; if (state.firstContactSeconds == null) state.firstContactSeconds = +now.toFixed(1); }
          if (!leaderAlive(sq)) state.captainlessSamples++;
          const spread = squadSpread(sq, p), limit = cohesionLimit(sq);
          if (spread != null && limit != null && spread > limit) state.overCohesionSamples++;
          if (sq._stablePlan) state.stablePlanSamples++;
          if (phase === 'regroup') state.regroupSamples++;
          if (phase === 'support-hold' || sq.commandRole === 'support') state.supportHoldSamples++;
          if (sq.state === 'retreat' || phase === 'retreat') state.retreatSamples++;
          const orders = sq._fireteamOrders || {}; let blocked = 0; for (const k of Object.keys(orders)) if (orders[k]?.blocked) blocked++;
          if (blocked) state.blockedFireteamSamples += blocked;

          const relevantTargetless = root.BattleBenchmarkIntent.targetless(sq, p);
          sampleSquadPerformance(state, faction, sq, p, phase, spread, limit, relevantTargetless, now);
          if (relevantTargetless) {
            state.targetlessSamples++;
            const t = state.targetlessTrack[key] || (state.targetlessTrack[key] = { since: now, reported: false });
            if (!t.reported && now - t.since >= 15) {
              const event = { faction, side: faction, squad: sq.id, at: +now.toFixed(1), t: +now.toFixed(1), phase };
              t.reported = true; state.targetlessStalls.push(event); observerEvent('targetless-command-stall', event);
            }
          } else delete state.targetlessTrack[key];

          if (phase === 'regroup') {
            const t = state.regroupTrack[key] || (state.regroupTrack[key] = { since: now, reported: false });
            if (!t.reported && now - t.since >= 30) { t.reported = true; state.longRegroups.push({ faction, squad: sq.id, at: +now.toFixed(1), seconds: +(now - t.since).toFixed(1) }); }
          } else delete state.regroupTrack[key];

          const route = sq.route || [], routeIndex = Math.max(0, Math.min(route.length - 1, +sq.routeIndex || 0));
          /* An assigned objective supersedes the approach route. Distance from its obsolete
             town-centre waypoint is not evidence that the squad has stalled. */
          if (p && root.BattleBenchmarkIntent.routeActive(sq, p) && phaseAllowsAdvance(phase) && !sq.inContact) {
            const d = distance(p, route[routeIndex]);
            let t = state.routeTrack[key];
            if (!t || t.index !== routeIndex) t = state.routeTrack[key] = { index: routeIndex, bestDistance: d, lastProgress: now, reported: false };
            else if (d < t.bestDistance - 3) { t.bestDistance = d; t.lastProgress = now; t.reported = false; }
            if (!t.reported && d > 12 && now - t.lastProgress >= 20) {
              const event = { faction, side: faction, squad: sq.id, at: +now.toFixed(1), t: +now.toFixed(1), routeIndex, distance: +d.toFixed(1), phase };
              t.reported = true; state.routeStalls.push(event); observerEvent('route-stall', event);
            }
          } else delete state.routeTrack[key];

          const targetId = sq.targetObjective, obj = targetId && root.BattleObjectiveSystem.get(sim, targetId);
          if (p && obj) {
            const st = objectiveStatus(obj), op = objectivePoint(obj), radius = +(obj.def?.radius || st.radius || 20);
            const enemyOwned = st.owner && st.owner !== 'neutral' && st.owner !== faction;
            const ownerPresence = +(st[st.owner] || st.weights?.[st.owner] || 0), vacantOwner = st.vacantOwner === true || (enemyOwned && ownerPresence <= 0), d = distance(p, op);
            if (enemyOwned && vacantOwner && d > radius * 1.08 && !sq.inContact) {
              state.vacantAssignmentSamples++;
              const prior = state.vacantTrack[key];
              if (!prior || prior.objective !== targetId) state.vacantTrack[key] = { objective: targetId, bestDistance: d, lastProgress: now, reported: false };
              else {
                if (d < prior.bestDistance - 2) { prior.bestDistance = d; prior.lastProgress = now; }
                if (!prior.reported && now - prior.lastProgress >= 15) {
                  const event = { faction, side: faction, squad: sq.id, objective: targetId, at: +now.toFixed(1), t: +now.toFixed(1), distance: +d.toFixed(1), phase };
                  prior.reported = true; state.vacantObjectiveStalls.push(event); observerEvent('vacant-objective-stall', event);
                }
              }
            } else delete state.vacantTrack[key];
          }
        }

        state.spreadSamples[faction].push(assignedTargets.size);

        for (const s of units(faction)) {
          const eng = engagementState(s); addMap(state.engagementStateSamples, eng.state || 'unknown');
          /* A man who stops qualifying (a target, a phase that does not advance, a combat state) starts his clock again when he
             qualifies: the clock keeps running through nothing, as module 97's does not (a man holding in `cower` was reported the
             moment he was back in `advance`). */
          const key = `${faction}:${s.id}`;
          if (!s.root || !s.destination || s.target || !phaseAllowsAdvance(s.squad?.commandPhase)) { delete state.unitTrack[key]; continue; }
          const combatState = ['orient','bound','engage','pinned','assault','station','withdraw','suppress','cower','flee','freeze','rage'].includes(String(eng.state || ''));
          if (combatState) { delete state.unitTrack[key]; continue; }
          const d = distance(s.root.position, s.destination);
          if (d < 8) { delete state.unitTrack[key]; continue; }
          state.orderedMoveSamples++;
          if ((+s.moveSpeed || 0) < 0.35) state.idleOrderedSamples++;
          const p = { x: +s.root.position.x || 0, z: +s.root.position.z || 0 }, prior = state.unitTrack[key];
          if (!prior) { state.unitTrack[key] = { x: p.x, z: p.z, lastMovedAt: now, reported: false }; continue; }
          if (Math.hypot(p.x - prior.x, p.z - prior.z) >= 1.5) { prior.x = p.x; prior.z = p.z; prior.lastMovedAt = now; prior.reported = false; }
          else if (!prior.reported && now - prior.lastMovedAt >= 12 && (+s.moveSpeed || 0) < 0.35) {
            prior.reported = true; state.movementStalls.push({ faction, soldier: s.id, squad: s.squad?.id || null, at: +now.toFixed(1), destinationDistance: +d.toFixed(1), phase: s.squad?.commandPhase || null, engagementState: eng.state || null });
          }
        }
      }
    }

    /* Do not tear the battle down by hand between seeds. The shipping restart path owns the old
       roster and gives every beforeBattleRestart/onBattleRestart hook the real previous battle to
       release. The old benchmark cleanup zeroed roster/factions/obstacles first, so only the first
       seed in each worker got a normal restart and later seeds leaked module state across battles. */
    function finishBattle() {
      sim.paused = true;
      try { engine?.wipeCaches?.(true); } catch (_) {}
    }

    const battles = [], commandTick = +root.BattleCommanderAI.commandTick || 0.45, maxSteps = Math.ceil((timeLimit + 2) / fixedDt);
    /* Scripted mode (BATTLE_BENCHMARK_WINDOWS): one battle, stepped unmeasured up to each window and measured inside it.
       Each window yields one full record (every field below, the diagnostics and the combat counters counted inside the window,
       the end state, `timeline` and `stress` as of its close); without windows the whole battle is one record, as before. */
    const scripted = Array.isArray(windows) && windows.length > 0, recordsExpected = scripted ? '?' : count;
    const newCombat = () => ({ total: 0, direct: 0, hits: 0, suppressive: 0, suppressedTargets: 0, firstFireSeconds: null, byStance: {}, hitsByStance: {}, missesByStance: {}, bySquad: {} });
    const newDiag = now => ({
      lastObjectiveSig: objectiveSignature(), lastObjectiveChangeAt: now, maxNoObjectiveProgress: 0,
      firstObjectiveProgressSeconds: null, firstCaptureSeconds: null, firstContactSeconds: null,
      vacantTrack: Object.create(null), unitTrack: Object.create(null), targetlessTrack: Object.create(null), regroupTrack: Object.create(null), routeTrack: Object.create(null),
      vacantAssignmentSamples: 0, squadSamples: 0, targetlessSamples: 0, overCohesionSamples: 0, captainlessSamples: 0, inContactSamples: 0,
      stablePlanSamples: 0, blockedFireteamSamples: 0, regroupSamples: 0, supportHoldSamples: 0, retreatSamples: 0,
      orderedMoveSamples: 0, idleOrderedSamples: 0, phaseSamples: {}, engagementStateSamples: {},
      vacantObjectiveStalls: [], movementStalls: [], routeStalls: [], targetlessStalls: [], longRegroups: [],
      everOwned: Object.create(null), everContested: Object.create(null), spreadSamples: { us: [], ge: [] },
      squadPerformance: Object.create(null)
    });
    function anyContact() { for (const f of ['us', 'ge']) for (const sq of sim.factions?.[f]?.squads || []) if (sq && sq.inContact) return true; return false; }
    function buildRecord({ index, seed, scenario, diag, wallStart, steps, extra }) {
        const control = sim.objectiveControl || {}, counts = control.counts || { us: control.us || 0, ge: control.ge || 0 }, stats = sim.objectiveStats || {};
        const objectiveStates = (sim._objectives || []).map(o => { const st = objectiveStatus(o); return { id: o.id, owner: st.owner || 'neutral', active: st.active || null, vacantOwner: !!st.vacantOwner, us: +(st.us || st.weights?.us || 0), ge: +(st.ge || st.weights?.ge || 0) }; });
        const recovery = sim._objectiveRecovery || {}, allConflicts = provenanceConflicts(), allLoops = loopAlerts();
        const diagnosticTime = item => Number.isFinite(+item?.at) ? +item.at : Number.isFinite(+item?.time) ? +item.time : null;
        const inRecordWindow = item => {
          if (!extra?.window) return true;
          const at = diagnosticTime(item);
          return at != null && at > extra.window.openedAt + 1e-9 && at <= extra.window.closedAt + 1e-9;
        };
        const conflicts = allConflicts.filter(inRecordWindow), loops = allLoops.filter(inRecordWindow);
        /* Full evidence survives in JSON; presentation/reporting may choose a shorter excerpt.
           A cumulative diagnostic source is window-filtered before any counts or records are saved. */
        const diagnosticEvidence = {
          schema: 'grasstex-benchmark-evidence-v1',
          window: extra?.window ? { openedAt: extra.window.openedAt, closedAt: extra.window.closedAt } : null,
          conflicts,
          loops,
          sourceTotals: { conflicts: allConflicts.length, loops: allLoops.length }
        };
        const strategicFields = new Set(['commandPhase','targetObjective','objective','orderAnchor','rally']);
        const strategicConflicts = conflicts.filter(c => strategicFields.has(c?.field)).length;
        const loopKinds = {}; for (const a of loops) addMap(loopKinds, a.kind || a.type || 'unknown');
        const objectiveCount = (sim._objectives || []).length, everOwnedIds = Object.keys(diag.everOwned);
        const meanSpread = f => diag.spreadSamples[f].length ? +(diag.spreadSamples[f].reduce((a, b) => a + b, 0) / diag.spreadSamples[f].length).toFixed(2) : 0;
        const sameSquad = (item, raw) => {
          if (!item) return false;
          if (item.faction && String(item.faction).toLowerCase() !== String(raw.faction).toLowerCase()) return false;
          const id = item.squadId != null ? item.squadId : item.squad;
          return id != null && String(id) === String(raw.squad);
        };
        const squadPerformanceRaw = Object.entries(diag.squadPerformance).map(([key, raw]) => {
          const clean = {}; for (const [k, v] of Object.entries(raw)) if (!k.startsWith('_')) clean[k] = v;
          clean.routeStalls = diag.routeStalls.filter(x => sameSquad(x, raw)).length;
          clean.movementStalls = diag.movementStalls.filter(x => sameSquad(x, raw)).length;
          clean.targetlessStalls = diag.targetlessStalls.filter(x => sameSquad(x, raw)).length;
          clean.longRegroups = diag.longRegroups.filter(x => sameSquad(x, raw)).length;
          clean.loopAlerts = loops.filter(x => sameSquad(x, raw)).length;
          clean.writerConflicts = conflicts.filter(x => sameSquad(x, raw)).length;
          clean.combat = activeCombat?.bySquad?.[key] || { total: 0, direct: 0, hits: 0, suppressive: 0, suppressedTargets: 0 };
          return clean;
        });
        /* Retreated-squad reconstitution (commander-ai.js); null on builds without it. */
        const reconstitutionSummary = () => {
          const r = root.BattleCommanderAI?.missionState?.(sim)?.reconstitution;
          if (!r) return null;
          const span = g => +((g.endedAt || 0) - (g.formedAt || 0)).toFixed(2);
          const active = (r.active || []).map(g => ({
            faction: g.faction,
            group: g.id,
            formedAt: +g.formedAt || 0,
            age: +((+sim.time || 0) - (+g.formedAt || 0)).toFixed(2),
            rally: g.rally ? { x: +g.rally.x || 0, z: +g.rally.z || 0 } : null,
            center: g.center ? { x: +g.center.x || 0, z: +g.center.z || 0 } : null,
            centerTravelMax: Number.isFinite(+g.centerTravelMax) ? +(+g.centerTravelMax).toFixed(1) : null,
            forwardShift: Number.isFinite(+g.forwardShift) ? +(+g.forwardShift).toFixed(1) : null,
            sourceTravel: (g.sourceTravel || []).map(row => ({
              id: row.id,
              centerDistance: +(+row.centerDistance || 0).toFixed(1),
              rallyDistance: +(+row.rallyDistance || 0).toFixed(1)
            })),
            survivors: +g.survivors || 0,
            squads: (g.squads || []).map(id => {
              const sq = sim.factions?.[g.faction]?.squads?.find(q => String(q.id) === String(id));
              const p = avgSquad(sq);
              return {
                id,
                living: aliveMembers(sq).length,
                state: sq?.state || null,
                assembly: sq?._assembly?.phase || null,
                inContact: !!sq?.inContact,
                position: p ? { x: +p.x.toFixed(1), z: +p.z.toFixed(1) } : null,
                distanceToRally: p && g.rally ? +distance(p, g.rally).toFixed(1) : null
              };
            })
          }));
          return {
            groupsFormed: r.groupsFormed,
            groupsDissolved: r.groupsDissolved,
            merges: r.merges,
            promotions: r.promotions,
            assemblingAtEnd: r.active.length,
            pool: r.pool || null,
            active,
            merged: r.ended
              .filter(g => g.status === 'merged')
              .map(g => ({
                faction: g.faction,
                formedAt: g.formedAt,
                mergedAt: g.endedAt,
                assemblySeconds: span(g),
                size: g.size,
                centerTravelMax: Number.isFinite(+g.centerTravelMax) ? +(+g.centerTravelMax).toFixed(1) : null,
                forwardShift: Number.isFinite(+g.forwardShift) ? +(+g.forwardShift).toFixed(1) : null,
                promoted: !!g.promoted,
                objectiveId: g.objectiveId || null
              })),
            dissolved: r.ended
              .filter(g => g.status === 'dissolved')
              .map(g => ({
                faction: g.faction,
                formedAt: g.formedAt,
                endedAt: g.endedAt,
                lifetimeSeconds: span(g),
                reason: g.endReason || null,
                survivors: +g.survivors || 0,
                squads: (g.squads || []).slice()
              }))
          };
        };
        /* Strategic-stall wakes (commander-ai.js recordStallOutcome): repeats re-picked the stalled
           objective, switches opened a new capture effort; null on builds without the counter. */
        const stallSummary = () => {
          const o = root.BattleCommanderAI?.missionState?.(sim)?.stallOutcomes;
          return o ? { wakes: +o.wakes || 0, repeats: +o.repeats || 0, switches: +o.switches || 0, other: +o.other || 0 } : null;
        };
        /* Squad Leader regroups (16-squad-plan-stability.js cohesion counters): how often squads stop
           to re-form, and how each regroup ended. Counters are observe-only. */
        const regroupSummary = () => {
          const out = { entries: 0, timeouts: 0, contactExits: 0, regroupRequests: 0, suppressed: 0, stragglerSuppressions: 0, byFaction: {}, byEnd: {}, endedContact: 0, endedCohesionRestored: 0, endedNewMission: 0, endedRetreat: 0, recoveries: 0, activeAtEnd: 0, longestActiveSeconds: 0 };
          for (const f of ['us', 'ge']) {
            const side = out.byFaction[f] = { entries: 0, timeouts: 0, contactExits: 0 };
            for (const sq of sim.factions?.[f]?.squads || []) {
              const h = sq?._regroupHysteresis; if (!h) continue;
              for (const [reason, count] of Object.entries(h.byEnd || {})) out.byEnd[reason] = (out.byEnd[reason] || 0) + count;
              out.regroupRequests += +h.regroupRequests || 0;
              out.suppressed += +h.suppressed || 0;
              out.stragglerSuppressions += +h.stragglerSuppressions || 0;
              out.recoveries += +h.recoveries || 0;
              const lease = root.BattleLeases?.get(sq, 'regroup');
              if (lease) { out.activeAtEnd++; out.longestActiveSeconds = Math.max(out.longestActiveSeconds, sim.time - lease.since); }
              side.entries += +h.entries || 0; side.timeouts += +h.timeouts || 0; side.contactExits += +h.contactExits || 0;
            }
            out.entries += side.entries; out.timeouts += side.timeouts; out.contactExits += side.contactExits;
          }
          out.endedContact = +(out.byEnd.contact || 0);
          out.endedCohesionRestored = +(out.byEnd['cohesion restored'] || 0);
          out.endedNewMission = +(out.byEnd['new mission'] || 0);
          out.endedRetreat = +(out.byEnd.retreat || 0);
          return out;
        };
        const record = {
          index: index + 1, seed, scenarioId: scenario?.id || null, fingerprint: scenario?.fingerprint || null,
          winner: sim.winner || 'none', winReason: sim.winReason || null, simulatedSeconds: +(+sim.time || 0).toFixed(2), wallSeconds: +((performance.now() - wallStart) / 1000).toFixed(3), steps,
          timeoutReached: (+sim.time || 0) >= timeLimit - fixedDt,
          usAlive: units('us').length, geAlive: units('ge').length, usForceValue: +forceValue('us').toFixed(2), geForceValue: +forceValue('ge').toFixed(2),
          usKills: +(sim.factions?.us?.kills || 0), geKills: +(sim.factions?.ge?.kills || 0), usObjectives: +(counts.us || 0), geObjectives: +(counts.ge || 0),
          captures: +(stats.captures || 0), neutralizations: +(stats.neutralizations || 0), capturesByFaction: stats.capturesByFaction || {},
          firstContactSeconds: diag.firstContactSeconds, firstFireSeconds: activeCombat.firstFireSeconds, firstObjectiveProgressSeconds: diag.firstObjectiveProgressSeconds, firstCaptureSeconds: diag.firstCaptureSeconds,
          maxNoObjectiveProgressSeconds: +diag.maxNoObjectiveProgress.toFixed(1), vacantAssignmentSamples: diag.vacantAssignmentSamples,
          objectiveCount, objectivesEverOwned: everOwnedIds.length,
          objectivesNeverOwned: Math.max(0, objectiveCount - everOwnedIds.length),
          objectivesNeverContested: Math.max(0, objectiveCount - Object.keys(diag.everContested).length),
          squadObjectiveSpread: { us: meanSpread('us'), ge: meanSpread('ge') },
          vacantObjectiveStalls: diag.vacantObjectiveStalls, movementStalls: diag.movementStalls, routeStalls: diag.routeStalls, targetlessStalls: diag.targetlessStalls, longRegroups: diag.longRegroups,
          squadSamples: diag.squadSamples, targetlessSamples: diag.targetlessSamples, overCohesionSamples: diag.overCohesionSamples, captainlessSamples: diag.captainlessSamples, inContactSamples: diag.inContactSamples,
          stablePlanSamples: diag.stablePlanSamples, blockedFireteamSamples: diag.blockedFireteamSamples, regroupSamples: diag.regroupSamples, supportHoldSamples: diag.supportHoldSamples, retreatSamples: diag.retreatSamples,
          orderedMoveSamples: diag.orderedMoveSamples, idleOrderedSamples: diag.idleOrderedSamples, phaseSamples: diag.phaseSamples, engagementStateSamples: diag.engagementStateSamples,
          writerConflicts: conflicts.length, strategicWriterConflicts: strategicConflicts, writerConflictDetails: conflicts, loopAlerts: loops, loopKinds,
          diagnosticEvidence,
          movementResolver: movementResolverSummary(), movementGoals: sim._movementGoalStats || null, losBlockedFireAttempts: losBlockedAttempts(), crestBlockedFireAttempts: crestBlockedAttempts(), fire: activeCombat,
          acquisitions: acquisitionSummary(activeAcquisition), squadPerformanceRaw,
          reconstitution: reconstitutionSummary(), regroups: regroupSummary(), stallOutcomes: stallSummary(), coordinationHealth: coordinationHealth(), combatUrgency: root.BattleCombatUrgency?.summary?.(sim) || null, objectiveRecovery: { us: +(recovery.us?.count || 0), ge: +(recovery.ge?.count || 0) }, finalObjectives: objectiveStates,
          timeline: root.BattleAITimeline?.snapshot?.(sim) || null,
          /* Soldier condition (module 17): where the man-seconds went, the squads above mean 1/3, and how often each
             soldier lever changed a decision, with a one-second series in simulated time (AGENTS.md, stress). */
          stress: root.BattleSoldierMind?.telemetry?.(sim) || null
        };
        /* Tactical callouts (`?callouts=1`): only when the channel is on, so a flags-off record matches main field for field. */
        const callouts = root.BattleCallouts?.telemetry?.(sim);
        if (callouts) record.callouts = callouts;
        const soldierBeliefs = root.SquadAI?.beliefTelemetry?.(sim);
        if (soldierBeliefs) record.soldierBeliefs = soldierBeliefs;
        const buddyPairs = root.BattleSquadStability?.buddyTelemetry?.(sim);
        if (buddyPairs) record.buddyPairs = buddyPairs;
        const recon = root.BattleSquadStability?.reconTelemetry?.(sim);
        if (recon) record.recon = recon;
        const leaderless = root.BattleSquadStability?.leaderlessTelemetry?.(sim);
        if (leaderless) record.leaderless = leaderless;
        if (extra) Object.assign(record, extra);
        return record;
    }
    function emit(record) {
      /* A scripted record is taken in the middle of a battle that goes on: `stress` and `capturesByFaction` are the sim's own
         live objects, so an earlier record would keep growing with the battle. A copy is what was true at its close. */
      battles.push(scripted ? JSON.parse(JSON.stringify(record)) : record);
      root.__benchLog(`[BENCH] ${record.index}/${recordsExpected} ${record.seed} winner=${record.winner} captures=${record.captures}/${record.objectiveCount} neverOwned=${record.objectivesNeverOwned} spread=${record.squadObjectiveSpread.us}/${record.squadObjectiveSpread.ge} vacant=${record.vacantObjectiveStalls.length} route=${record.routeStalls.length} move=${record.movementStalls.length} loops=${record.loopAlerts.length} conflicts=${record.writerConflicts} regroups=${record.regroups.entries}/${record.regroups.timeouts} stalls=${record.stallOutcomes?.repeats ?? '-'}/${record.stallOutcomes?.wakes ?? '-'} wall=${record.wallSeconds}s`);
    }
    try {
      for (let index = 0; index < count; index++) {
        /* One scripted battle is the scenario its seed names; a count of several, no windows or a numbered shard number them from the prefix. */
        const seed = scripted && count === 1 && !numbered ? seedPrefix : `${seedPrefix}-${String(firstIndex + index + 1).padStart(4, '0')}`;
        const scenario = root.BattleTownObjectives.regenerate(sim.scene, sim.heightAt, seed, { benchmark: true, benchmarkIndex: index }, sim);
        root.BattleAIPolicy.setMatchPolicies(sim, baseline, baseline); sim.trainingMode = true;
        root.BattleSoldierModel?.setImportedEnabled?.(sim.scene, false); rawRestart();
        sim.manualEnded = false; sim.winner = null; sim.winReason = null; sim.paused = false; sim.timeScale = 1; sim.timeLimit = timeLimit;

        let commandAccum = 0, steps = 0, nextSample = 0;
        const live = () => !sim.winner && sim.time < timeLimit + 0.5 && steps < maxSteps;
        const stepOnce = () => {
          sim._trainerStepActive = true; try { sim.step ? sim.step(fixedDt) : sim._frame(fixedDt); } finally { sim._trainerStepActive = false; }
          steps++; commandAccum += fixedDt;
          while (commandAccum + 1e-9 >= commandTick && !sim.winner) { commandAccum -= commandTick; root.BattleCommanderAI.update(sim, scenario, commandTick); }
          sampleAcquisitions();
        };
        const wallStart = performance.now();
        if (!scripted) {
          activeCombat = newCombat(); activeAcquisition = newAcquisition();
          const diag = newDiag(0);
          while (live()) {
            stepOnce();
            if (sim.time + 1e-9 >= nextSample) { sampleDiagnostics(diag); nextSample += SAMPLE_SECONDS; }
          }
          if (!sim.winner && sim._checkWinner) sim._checkWinner();
          diag.maxNoObjectiveProgress = Math.max(diag.maxNoObjectiveProgress, (+sim.time || 0) - diag.lastObjectiveChangeAt);
          emit(buildRecord({ index, seed, scenario, diag, wallStart, steps }));
        } else {
          /* Every record is a segment of the battle: it opens at first contact, at a fixed second, or where the last one
             closed, and counts what happened inside it. A segment that opens where the last one closed (no unmeasured gap)
             carries the stall and objective trackers over, so a stall that spans a checkpoint is one stall. */
          const CARRY = ['vacantTrack', 'unitTrack', 'targetlessTrack', 'regroupTrack', 'routeTrack', 'everOwned', 'everContested', 'lastObjectiveSig', 'lastObjectiveChangeAt', 'firstObjectiveProgressSeconds', 'firstCaptureSeconds', 'firstContactSeconds'];
          let previousClose = null, previousDiag = null;
          const measure = (labelAt, spec, closed) => {
            const openedAt = +sim.time, windowStart = performance.now(), diag = newDiag(openedAt);
            const contiguous = previousDiag && Math.abs(openedAt - previousClose) < 1e-6;
            if (contiguous) for (const k of CARRY) diag[k] = previousDiag[k];
            activeCombat = newCombat(); activeAcquisition = newAcquisition(); if (!contiguous) nextSample = openedAt;
            while (live() && !closed(openedAt)) {
              stepOnce();
              if (sim.time + 1e-9 >= nextSample) { sampleDiagnostics(diag); nextSample += SAMPLE_SECONDS; }
            }
            diag.maxNoObjectiveProgress = Math.max(diag.maxNoObjectiveProgress, (+sim.time || 0) - diag.lastObjectiveChangeAt);
            const closedAt = +sim.time, label = labelAt();
            emit(buildRecord({
              index: battles.length, seed: `${seed}-${label}`, scenario, diag, wallStart, steps,
              extra: {
                scenarioSeed: seed, battleType,
                window: { label, opens: spec.every ? `every${spec.every}` : spec.start, openedAt: +openedAt.toFixed(2), closedAt: +closedAt.toFixed(2), requestedSeconds: spec.every || spec.seconds, completed: label !== 'end' && closedAt >= openedAt + (spec.every ? 0 : spec.seconds) - fixedDt },
                windowWallSeconds: +((performance.now() - windowStart) / 1000).toFixed(3)
              }
            }));
            activeCombat = null; activeAcquisition = null; previousClose = closedAt; previousDiag = diag;
          };
          for (let w = 0; w < windows.length && live(); w++) {
            const spec = windows[w], next = windows[w + 1];
            if (spec.every) {
              /* From here to the end of the battle: a record at every multiple of `every` simulated seconds, and one at the end
                 (`end`, the winner or the time limit, whichever comes first) for what is left since the last. */
              while (live()) {
                const boundary = (Math.floor((+sim.time + 1e-9) / spec.every) + 1) * spec.every;
                /* The last checkpoint is the end itself: the time limit decides the winner a step after its second, so closing at
                   it would leave a one-step record holding the winner. */
                const toTheEnd = boundary >= timeLimit - fixedDt;
                measure(() => (toTheEnd || !live() || sim.time + 1e-9 < boundary ? 'end' : `t${boundary}`), spec, () => !toTheEnd && sim.time + 1e-9 >= boundary);
              }
              break;
            }
            const label = spec.start === 'contact' ? 'contact' : `t${spec.start}`;
            /* A window opens at first contact (any squad's report) or at a fixed second, never before the last one closed.
               A contact window that has not opened by the next fixed window's second is skipped, not run late. */
            const opensAt = spec.start === 'contact' ? null : Math.max(spec.start, previousClose || 0);
            const skipAt = opensAt == null && next && !next.every && next.start !== 'contact' ? next.start : null;
            let skipped = false;
            while (live()) {
              if (opensAt == null ? anyContact() : sim.time + 1e-9 >= opensAt) break;
              if (skipAt != null && sim.time + 1e-9 >= skipAt) { skipped = true; break; }
              stepOnce();
            }
            if (!live()) { root.__benchLog(`[BENCH] ${seed}: the battle ended at ${(+sim.time).toFixed(1)}s before window ${label} opened`); break; }
            if (skipped) { root.__benchLog(`[BENCH] ${seed}: no contact before ${skipAt}s, window ${label} skipped`); continue; }
            measure(() => label, spec, openedAt => sim.time + 1e-9 >= openedAt + spec.seconds);
          }
        }
        activeCombat = null; activeAcquisition = null; finishBattle(); if ((index + 1) % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
      }
    } finally {
      activeCombat = null; activeAcquisition = null; root.BattleAIPolicy.clearMatchPolicies(sim); finishBattle();
      if (originalSeed) root.BattleTownObjectives.regenerate(sim.scene, sim.heightAt, originalSeed, { restoredAfterBenchmark: true }, sim);
      sim.trainingMode = false; root.BattleSoldierModel?.setImportedEnabled?.(sim.scene, true); rawRestart();
      sim.timeScale = saved.timeScale; sim.timeLimit = saved.timeLimit; sim.onFire = saved.onFire; sim.onShot = saved.onShot; sim.onSuppressiveShot = saved.onSuppressiveShot;
      sim.onCallout = saved.onCallout; sim.onUpdate = saved.onUpdate; sim.onWinner = saved.onWinner; sim.paused = true;
      if (telemetry && telemetrySaved) Object.assign(telemetry, telemetrySaved);
      if (telemetryConsole !== null && telemetry?.setConsoleLogging) telemetry.setConsoleLogging(telemetryConsole);
    }
    return { build: root.BATTLE_BUILD || null, policyRevision: root.BattleAIPolicy.stashed ? 0 : suppliedPolicy?.revision || root.BattleAIPolicy.revision || 0, policySource: root.BattleAIPolicy.stashed ? 'stashed-defaults' : suppliedPolicy?.source || 'runtime-default', fixedDt, timeLimit, sampleSeconds: SAMPLE_SECONDS, scripted, battles };
  }, { count, seedPrefix, fixedDt, timeLimit, suppliedPolicy: policy, windows, battleType, numbered, firstIndex });

  const wallSeconds = (Date.now() - startedWall) / 1000, battles = result.battles || [];
  for (const b of battles) {
    b.health = healthFor(b);
    b.diagnosticAnalysis = evidence.assessEvidence(b);
    const squads = (b.squadPerformanceRaw || []).map(scoreSquadPerformance);
    b.squadPerformance = { ...summarizeSquadPerformance(squads), squads };
    delete b.squadPerformanceRaw;
  }
  const winners = { us: 0, ge: 0, draw: 0, none: 0 }; for (const b of battles) winners[b.winner] = (winners[b.winner] || 0) + 1;
  const durations = battles.map(b => b.simulatedSeconds), wallDurations = battles.map(b => b.wallSeconds), captures = battles.map(b => b.captures), simulatedTotal = durations.reduce((a, b) => a + b, 0);
  const assetNoisePattern = /(cors|cross-origin|failed to load resource|net::err_failed|texture|skytex|dirttex|audio\/|\.mp3|\.png|\.jpg|\.jpeg)/i;
  const runtimeErrors = browserErrors.filter(e => !assetNoisePattern.test(String(e))), assetLoadNoise = browserErrors.length - runtimeErrors.length;
  const issue = {
    vacantObjectiveStalls: sum(battles, b => b.vacantObjectiveStalls?.length), movementStalls: sum(battles, b => b.movementStalls?.length),
    routeStalls: sum(battles, b => b.routeStalls?.length), targetlessStalls: sum(battles, b => b.targetlessStalls?.length), longRegroups: sum(battles, b => b.longRegroups?.length),
    writerConflicts: sum(battles, b => b.writerConflicts), strategicWriterConflicts: sum(battles, b => b.strategicWriterConflicts), loopAlerts: sum(battles, b => b.loopAlerts?.length),
    losBlockedFireAttempts: sum(battles, b => b.losBlockedFireAttempts),
    crestBlockedFireAttempts: sum(battles, b => b.crestBlockedFireAttempts)
  };
  const aggregateHealth = {
    overall: +mean(battles.map(b => b.health.overall)).toFixed(1), strategic: +mean(battles.map(b => b.health.strategic)).toFixed(1), movement: +mean(battles.map(b => b.health.movement)).toFixed(1),
    cohesion: +mean(battles.map(b => b.health.cohesion)).toFixed(1), combat: +mean(battles.map(b => b.health.combat)).toFixed(1), objective: +mean(battles.map(b => b.health.objective)).toFixed(1)
  };
  const phaseSamples = {}, engagementStateSamples = {}; for (const b of battles) {
    for (const [k, v] of Object.entries(b.phaseSamples || {})) phaseSamples[k] = (phaseSamples[k] || 0) + v;
    for (const [k, v] of Object.entries(b.engagementStateSamples || {})) engagementStateSamples[k] = (engagementStateSamples[k] || 0) + v;
  }
  const squadRows = battles.flatMap(b => (b.squadPerformance?.squads || []).map(s => ({ ...s, seed: b.seed })));
  const squadPerformance = summarizeSquadPerformance(squadRows);
  const evidenceProblems = battles.flatMap(b => (b.diagnosticAnalysis?.integrity?.discrepancies || []).map(code => ({ seed: b.seed, code })));
  const summary = {
    diagnosticEvidence: {
      version: 'grasstex-benchmark-analysis-v1',
      integrityOk: evidenceProblems.length === 0,
      discrepancies: evidenceProblems,
      movementStallCompleted: sum(battles, b => b.diagnosticAnalysis?.movementStallCompleted),
      movementStallCensored: sum(battles, b => b.diagnosticAnalysis?.movementStallCensored)
    },
    generatedAt: new Date().toISOString(), commit, build: result.build, policySource: result.policySource, policyRevision: result.policyRevision, policyWarning: result.policySource === 'stashed-defaults' ? null : policy.warning || null,
    requestedBattles: result.scripted ? battles.length : count, completedBattles: battles.length, seedPrefix, fixedDt, sampleSeconds: result.sampleSeconds, timeLimit,
    wallSeconds: +wallSeconds.toFixed(2), simulatedSeconds: +simulatedTotal.toFixed(2), realtimeMultiplier: wallSeconds > 0 ? +(simulatedTotal / wallSeconds).toFixed(1) : 0, battlesPerMinute: wallSeconds > 0 ? +(battles.length / wallSeconds * 60).toFixed(2) : 0,
    winners, usWinRate: pct(winners.us || 0, battles.length), geWinRate: pct(winners.ge || 0, battles.length), drawRate: pct((winners.draw || 0) + (winners.none || 0), battles.length),
    avgBattleSeconds: +mean(durations).toFixed(2), p50BattleSeconds: +quantile(durations, .5).toFixed(2), p95BattleSeconds: +quantile(durations, .95).toFixed(2), avgWallSecondsPerBattle: +mean(wallDurations).toFixed(3),
    timeoutBattles: battles.filter(b => b.timeoutReached).length, avgCaptures: +mean(captures).toFixed(2), noCaptureBattles: battles.filter(b => b.captures === 0).length,
    avgFirstContactSeconds: +mean(battles.map(b => b.firstContactSeconds).filter(Number.isFinite)).toFixed(1), avgFirstFireSeconds: +mean(battles.map(b => b.firstFireSeconds).filter(Number.isFinite)).toFixed(1),
    avgFirstObjectiveProgressSeconds: +mean(battles.map(b => b.firstObjectiveProgressSeconds).filter(Number.isFinite)).toFixed(1), avgFirstCaptureSeconds: +mean(battles.map(b => b.firstCaptureSeconds).filter(Number.isFinite)).toFixed(1),
    maxNoObjectiveProgressSeconds: +Math.max(0, ...battles.map(b => b.maxNoObjectiveProgressSeconds || 0)).toFixed(1),
    avgNoObjectiveProgressSeconds: +mean(battles.map(b => b.maxNoObjectiveProgressSeconds || 0)).toFixed(1),
    avgObjectivesPerBattle: +mean(battles.map(b => b.objectiveCount || 0)).toFixed(2),
    avgRegroupEntries: +mean(battles.map(b => b.regroups?.entries || 0)).toFixed(2), regroupTimeouts: sum(battles, b => b.regroups?.timeouts), regroupContactExits: sum(battles, b => b.regroups?.contactExits),
    strategicStallWakes: sum(battles, b => b.stallOutcomes?.wakes), strategicStallRepeats: sum(battles, b => b.stallOutcomes?.repeats), strategicStallSwitches: sum(battles, b => b.stallOutcomes?.switches), strategicStallOther: sum(battles, b => b.stallOutcomes?.other),
    strategicStallRepeatRate: +rate(sum(battles, b => b.stallOutcomes?.repeats), sum(battles, b => b.stallOutcomes?.wakes)).toFixed(4),
    objectivesNeverOwned: sum(battles, b => b.objectivesNeverOwned),
    objectivesNeverOwnedRate: pct(sum(battles, b => b.objectivesNeverOwned), sum(battles, b => b.objectiveCount)),
    objectivesNeverContested: sum(battles, b => b.objectivesNeverContested),
    avgSquadObjectiveSpread: { us: +mean(battles.map(b => b.squadObjectiveSpread?.us || 0)).toFixed(2), ge: +mean(battles.map(b => b.squadObjectiveSpread?.ge || 0)).toFixed(2) },
    issueCounts: issue, health: aggregateHealth, squadPerformance, phaseSamples, engagementStateSamples,
    idleUnderOrdersRate: +rate(sum(battles, b => b.idleOrderedSamples), sum(battles, b => b.orderedMoveSamples)).toFixed(4),
    overCohesionRate: +rate(sum(battles, b => b.overCohesionSamples), sum(battles, b => b.squadSamples)).toFixed(4),
    targetlessSquadRate: +rate(sum(battles, b => b.targetlessSamples), sum(battles, b => b.squadSamples)).toFixed(4),
    shots: sum(battles, b => b.fire?.total), directShots: sum(battles, b => b.fire?.direct), hits: sum(battles, b => b.fire?.hits), suppressiveShots: sum(battles, b => b.fire?.suppressive),
    hitRate: +rate(sum(battles, b => b.fire?.hits), sum(battles, b => b.fire?.direct)).toFixed(4),
    movementResolverChanges: sum(battles, b => b.movementResolver?.changes), browserErrors: browserErrors.length, runtimeErrors: runtimeErrors.length, assetLoadNoise, browserWarnings: browserWarnings.length,
    stress: summarizeStress(battles),
    scripted: result.scripted ? { windows, battleType, records: battles.map(b => ({ seed: b.seed, window: b.window })) } : null
  };

  const score = b => (100 - b.health.overall) * 10 + (b.strategicWriterConflicts || 0) * 80 + (b.routeStalls?.length || 0) * 45 + (b.targetlessStalls?.length || 0) * 40 + (b.vacantObjectiveStalls?.length || 0) * 50 + (b.longRegroups?.length || 0) * 35 + (b.loopAlerts?.length || 0) * 25 + (b.captures === 0 ? 80 : 0) + (b.objectivesNeverOwned || 0) * 60 + (b.maxNoObjectiveProgressSeconds || 0) * .25;
  const problematic = [...battles].sort((a, b) => score(b) - score(a)).slice(0, 20);
  const payload = { summary, policy, runtimeErrors: dedupe(runtimeErrors), assetLoadNoiseExamples: dedupe(browserErrors.filter(e => assetNoisePattern.test(String(e))), 20), browserWarnings: dedupe(browserWarnings, 100), battles };
  fs.writeFileSync(path.join(outputDir, 'battle-benchmark.json'), JSON.stringify(payload, null, 2));

  const headers = [...(result.scripted ? ['window', 'windowOpenedAt', 'windowClosedAt'] : []), 'index','seed','winner','winReason','simulatedSeconds','timeoutReached','usAlive','geAlive','captures','neutralizations','objectiveCount','objectivesNeverOwned','objectivesNeverContested','usSquadSpread','geSquadSpread','healthOverall','squadScoreMean','squadScoreP10','lowScoreSquads','firstContactSeconds','firstFireSeconds','firstCaptureSeconds','maxNoObjectiveProgressSeconds','vacantObjectiveStalls','movementStalls','routeStalls','targetlessStalls','longRegroups','writerConflicts','strategicWriterConflicts','loopAlerts','stallWakes','stallRepeats','stallSwitches','idleUnderOrdersRate','overCohesionRate','shots','hits','hitRate','losBlockedFireAttempts','crestBlockedFireAttempts','movementResolverChanges'];
  const csvLines = [headers.join(',')];
  for (const b of battles) {
    const row = {
      ...b, window: b.window?.label, windowOpenedAt: b.window?.openedAt, windowClosedAt: b.window?.closedAt, healthOverall: b.health.overall,
      squadScoreMean: b.squadPerformance?.meanOverall ?? '', squadScoreP10: b.squadPerformance?.p10Overall ?? '', lowScoreSquads: b.squadPerformance?.lowScoreSquads ?? 0, vacantObjectiveStalls: b.vacantObjectiveStalls?.length || 0, movementStalls: b.movementStalls?.length || 0, routeStalls: b.routeStalls?.length || 0,
      targetlessStalls: b.targetlessStalls?.length || 0, longRegroups: b.longRegroups?.length || 0, loopAlerts: b.loopAlerts?.length || 0,
      stallWakes: b.stallOutcomes?.wakes || 0, stallRepeats: b.stallOutcomes?.repeats || 0, stallSwitches: b.stallOutcomes?.switches || 0,
      idleUnderOrdersRate: rate(b.idleOrderedSamples, b.orderedMoveSamples).toFixed(4), overCohesionRate: rate(b.overCohesionSamples, b.squadSamples).toFixed(4),
      shots: b.fire?.total || 0, hits: b.fire?.hits || 0, hitRate: rate(b.fire?.hits || 0, b.fire?.direct || 0).toFixed(4), movementResolverChanges: b.movementResolver?.changes || 0,
      usSquadSpread: b.squadObjectiveSpread?.us ?? 0, geSquadSpread: b.squadObjectiveSpread?.ge ?? 0
    };
    csvLines.push(headers.map(h => csv(row[h])).join(','));
  }
  fs.writeFileSync(path.join(outputDir, 'battle-benchmark.csv'), csvLines.join('\n') + '\n');

  const md = [result.scripted ? `# Scripted-scenario benchmark (${windows.map(w => w.every ? `every ${w.every} s to the end` : `${w.start === 'contact' ? 'first contact' : `second ${w.start}`} + ${w.seconds} s`).join(', ')})` : '# 100-battle headless benchmark','',
    `- Commit: \`${summary.commit}\``, `- Build: \`${summary.build || 'unknown'}\``, `- Policy: ${summary.policySource}, revision ${summary.policyRevision}${summary.policyWarning ? ` — ${summary.policyWarning}` : ''}`,
    `- Completed: **${summary.completedBattles}/${summary.requestedBattles}** in **${summary.wallSeconds}s** (${summary.realtimeMultiplier}× real-time, ${summary.battlesPerMinute} battles/min)`,
    `- Results: US **${winners.us || 0}** (${summary.usWinRate}), GER **${winners.ge || 0}** (${summary.geWinRate}), draw/none **${(winners.draw || 0) + (winners.none || 0)}** (${summary.drawRate})`,
    `- Time-limit battles: **${summary.timeoutBattles}/${summary.completedBattles}**; captures avg **${summary.avgCaptures}** of **${summary.avgObjectivesPerBattle}** objectives; no-capture **${summary.noCaptureBattles}**`,
    `- Objectives nobody ever owned: **${summary.objectivesNeverOwned}** (${summary.objectivesNeverOwnedRate}) · never even contested **${summary.objectivesNeverContested}** · distinct objectives assigned per side US **${summary.avgSquadObjectiveSpread.us}**, GER **${summary.avgSquadObjectiveSpread.ge}**`,
    `- No objective progress: longest **${summary.maxNoObjectiveProgressSeconds}s** · mean per battle **${summary.avgNoObjectiveProgressSeconds}s**`,
    `- First contact avg **${summary.avgFirstContactSeconds}s** · first fire **${summary.avgFirstFireSeconds}s** · first objective progress **${summary.avgFirstObjectiveProgressSeconds}s** · first capture **${summary.avgFirstCaptureSeconds}s**`,
    `- Health: **${summary.health.overall}/100 overall** · strategic ${summary.health.strategic} · movement ${summary.health.movement} · cohesion ${summary.health.cohesion} · combat ${summary.health.combat} · objective ${summary.health.objective}`,
    `- Squad performance: mean **${summary.squadPerformance.meanOverall}/100** · median **${summary.squadPerformance.medianOverall}** · p10 **${summary.squadPerformance.p10Overall}** · below 60 **${summary.squadPerformance.lowScoreSquads}/${summary.squadPerformance.squads}** · mission ${summary.squadPerformance.meanMission} · movement ${summary.squadPerformance.meanMovement} · control ${summary.squadPerformance.meanControl} · cohesion ${summary.squadPerformance.meanCohesion} · combat ${summary.squadPerformance.meanCombat} · preservation ${summary.squadPerformance.meanPreservation}`,
    `- Stalls: vacant objective **${issue.vacantObjectiveStalls}** · route **${issue.routeStalls}** · soldier movement **${issue.movementStalls}** · targetless command **${issue.targetlessStalls}** · long regroup **${issue.longRegroups}**`,
    `- Coordination: writer conflicts **${issue.writerConflicts}** (${issue.strategicWriterConflicts} strategic) · loop alerts **${issue.loopAlerts}** · idle-under-orders ${(summary.idleUnderOrdersRate * 100).toFixed(1)}% · over-cohesion ${(summary.overCohesionRate * 100).toFixed(1)}%`,
    `- Combat: **${summary.shots}** discharges · **${summary.directShots}** direct · **${summary.hits}** hits (${(summary.hitRate * 100).toFixed(1)}%) · **${issue.losBlockedFireAttempts}** trigger-time LOS blocks · **${issue.crestBlockedFireAttempts || 0}** held over a crest`,
    ...stressMarkdown(summary.stress),
    `- Runtime: **${summary.runtimeErrors} probable JS/runtime errors** · **${summary.assetLoadNoise} asset/CORS noise** · ${summary.browserWarnings} warnings`,
    '', '## Most problematic runs', '',
    '| Seed | Winner | Health | Captures | Never owned | Spread us/ge | Route stalls | Move stalls | Targetless | Vacant | Regroup | Conflicts | Loops | Max no-progress |',
    '|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|'];
  for (const b of problematic) md.push(`| \`${b.seed}\` | ${b.winner} | ${b.health.overall} | ${b.captures}/${b.objectiveCount} | ${b.objectivesNeverOwned} | ${b.squadObjectiveSpread?.us ?? '-'}/${b.squadObjectiveSpread?.ge ?? '-'} | ${b.routeStalls?.length || 0} | ${b.movementStalls?.length || 0} | ${b.targetlessStalls?.length || 0} | ${b.vacantObjectiveStalls?.length || 0} | ${b.longRegroups?.length || 0} | ${b.writerConflicts || 0} | ${b.loopAlerts?.length || 0} | ${b.maxNoObjectiveProgressSeconds}s |`);
  md.push('', '## Lowest squad performance', '',
    '| Seed | Squad | Role | Overall | Mission | Movement | Control | Cohesion | Combat | Preservation |',
    '|---|---|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const row of summary.squadPerformance.worst || []) md.push(`| \`${row.seed || '-'}\` | ${row.faction || '?'}/${row.squad || '?'} | ${row.role} | ${row.overall} | ${row.mission} | ${row.movement} | ${row.control} | ${row.cohesion} | ${row.combat ?? '-'} | ${row.preservation ?? '-'} |`);
  if (result.scripted) {
    md.push('', '## Windows', '', '| Window | Opened | Closed | Winner | Alive us/ge | Kills us/ge | Shots | Hits | Move stalls | Retreat samples | Resolver changes | Loops |', '|---|---:|---:|---|---|---|---:|---:|---:|---:|---:|---:|');
    for (const b of battles) md.push(`| ${b.window.label} | ${b.window.openedAt}s | ${b.window.closedAt}s${b.window.completed ? '' : ' (cut short)'} | ${b.winner} | ${b.usAlive}/${b.geAlive} | ${b.usKills}/${b.geKills} | ${b.fire?.total || 0} | ${b.fire?.hits || 0} | ${b.movementStalls?.length || 0} | ${b.retreatSamples} | ${b.movementResolver?.changes || 0} | ${b.loopAlerts?.length || 0} |`);
    md.push('', 'Kills, survivors, captures, `timeline` and `stress` are the battle as of each window\'s close; stalls, loops, samples, shots and hits are counted inside the window only.');
  }
  md.push('', '## Diagnostic score note', '', 'Health and squad-performance scores are transparent triage aids, not pass/fail gates. Squad performance is role-aware: maneuver squads are judged on mission progress without penalizing support/reserve/garrison squads for holding still; combat is omitted when a squad had no combat opportunity. Raw measurements remain authoritative.');
  if (runtimeErrors.length) { md.push('', '## Probable runtime errors', ''); for (const error of dedupe(runtimeErrors, 20)) md.push(`- \`${String(error).replaceAll('`', "'")}\``); }
  fs.writeFileSync(path.join(outputDir, 'battle-benchmark.md'), md.join('\n') + '\n');

  console.log('BENCHMARK_SUMMARY ' + JSON.stringify(summary));
  console.log(md.join('\n'));
} finally {
  await browser.close();
}