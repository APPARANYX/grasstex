/* Soldier load: what the game builds, and what a failed load does. Each URL loads in a fresh
 * browser context and reports:
 *  - soldiers: how many wear their FBX model (`_fbx`, `rig === null`) and how many are procedural;
 *  - the per-soldier cost: body build and FBX bind (BattleAssetTimings binds), and the load phases
 *    (soldiers, and "Navigation, squads & objectives", where the soldiers are created);
 *  - with SL_FAIL=<asset path fragment> (e.g. soldiers/us-gunner.fbx) that request is aborted: the
 *    page must show its load error and build no battle and no procedural soldiers.
 * Serve the repo first (AGENTS.md "Browser smoke"). Env: SL_URLS (comma-separated battle pages,
 * default the local server), SL_FAIL, SL_WAIT (seconds to wait for a failure, default 60).
 */
const path = require('node:path');
const { execSync } = require('node:child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}
const URLS = (process.env.SL_URLS || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php').split(',').map(s => s.trim()).filter(Boolean);
const FAIL = process.env.SL_FAIL || '';
const WAIT = Number(process.env.SL_WAIT || 60) * 1000;

async function load(browser, url) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 800, height: 600 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  if (FAIL) await page.route(u => decodeURIComponent(String(u)).includes(FAIL), route => route.abort());
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'seed=soldier-load', { waitUntil: 'load', timeout: 90000 });
  if (FAIL) {
    await page.waitForFunction(() => { const e = document.getElementById('loadError'); return (e && e.textContent.trim()) || window.__battle__; }, null, { timeout: WAIT, polling: 250 }).catch(() => {});
    const out = await page.evaluate(() => ({
      loadError: (document.getElementById('loadError') || {}).textContent || '',
      battle: !!window.__battle__,
      procedural: window.__battle__ ? window.__battle__._roster.us.concat(window.__battle__._roster.ge).filter(s => s.rig).length : 0,
    }));
    await context.close();
    return Object.assign(out, { errors });
  }
  await page.waitForFunction(() => window.__battle__ && window.BattleFbxSoldier && BattleFbxSoldier.status(__battle__.scene).ready && window.BattleLoading, null, { timeout: 300000, polling: 250 });
  const out = await page.evaluate(() => {
    const roster = __battle__._roster.us.concat(__battle__._roster.ge), snap = BattleAssetTimings.snapshot();
    const phase = id => { const p = snap.page && snap.page.phases.find(x => x.id === id); return p ? p.ms : null; };
    return {
      soldiers: roster.length, fbx: roster.filter(s => s._fbx && s.rig === null).length, procedural: roster.filter(s => s.rig).length,
      procParts: __battle__.scene.meshes.filter(m => m.name === 'soldierPart').length,
      binds: snap.binds, soldiersPhaseMs: phase('soldiers'), battlePhaseMs: phase('battle'), loadMs: snap.page && snap.page.finishedAt,
    };
  });
  await context.close();
  return Object.assign(out, { errors });
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--ignore-certificate-errors'] });
  const fails = [], rows = {};
  try {
    for (const url of URLS) {
      const r = await load(browser, url);
      if (FAIL) {
        rows[url] = { loadError: r.loadError.split('\n')[0].slice(0, 90), battle: r.battle, procedural: r.procedural };
        if (!r.loadError.trim()) fails.push(`${url}: no load error shown with ${FAIL} blocked`);
        if (r.procedural) fails.push(`${url}: ${r.procedural} procedural soldiers built with ${FAIL} blocked`);
      } else {
        rows[url] = { soldiers: r.soldiers, fbx: r.fbx, procedural: r.procedural, procParts: r.procParts, bindMeanMs: r.binds.meanMs, bindTotalMs: r.binds.totalMs,
          bodyMs: r.binds.bodyMs == null ? null : r.binds.bodyMs, soldiersPhaseMs: r.soldiersPhaseMs, battlePhaseMs: r.battlePhaseMs, loadMs: r.loadMs };
        if (r.fbx !== r.soldiers) fails.push(`${url}: ${r.soldiers - r.fbx} of ${r.soldiers} soldiers are not FBX`);
        if (r.errors.length) fails.push(`${url}: page errors: ${r.errors.slice(0, 3).join(' | ')}`);
      }
    }
  } finally { await browser.close(); }
  console.table(rows);
  if (fails.length) { console.error('FAIL\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('PASS');
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
