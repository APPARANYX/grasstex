#!/usr/bin/env node
'use strict';
/* Is the AI Graph workbench really unreachable? Loads the page under test, and optionally a control
   page that still has the graph, and reads what is actually in the page.

   Per page it records the AI Graph DOM (`aiGraph*` and `ag*` ids), the graph globals, the HUD buttons,
   and whether the runtime the graph used to sit on is still there (Macro switch, leases, provenance,
   the diagnostics export). The page under test also loads with `?editor=ai` and with `#ai-graph`, the
   two ways the editor used to open itself, and runs a few seconds of battle to show the sim still
   advances and nothing threw.

   The control makes the negatives mean something: on a page with the graph the same probe must find
   the DOM, the globals, the button, and the entry points must open the panel. Exits 1 on any mismatch.

   Point it at the branch preview (AGENTS.md), and at production or a `main` preview as the control:
     STASH_URL='https://test.ivandpopov.com/grasstex/preview.php?ref=<branch>' \
     STASH_CONTROL_URL='https://test.ivandpopov.com/grasstex/battle_sim.php' \
       node scripts/probe_ai_graph_stash.cjs
   Env: STASH_URL (default: the local server of smoke_battle_page.cjs), STASH_CONTROL_URL,
        STASH_EXPECT (`stashed`, default, or `present` when the page under test should have the graph),
        STASH_SEED, STASH_SECONDS (battle seconds after Start, default 6), STASH_OUT (JSON path). */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (e) {}
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}

const url = process.env.STASH_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const control = process.env.STASH_CONTROL_URL || '';
const expectUnderTest = process.env.STASH_EXPECT === 'present' ? 'present' : 'stashed';
const seed = process.env.STASH_SEED || 'stash';
const seconds = Math.max(0, Number(process.env.STASH_SECONDS || '6'));

const GRAPH_GLOBALS = [
  'BattleAIGraphEditor',
  'BattleAIGraphLogic',
  'BattleAIGraphUsability',
  'BattleAITimingMap',
  'BattleAICommandHierarchy',
  'BattleMacroCommandControl',
  'BattleLeasePanel',
  'BattleAIDiagnosticsExport'
];

function withQuery(base, extra, hash) {
  const joiner = base.includes('?') ? '&' : '?';
  return base + joiner + 'seed=' + encodeURIComponent(seed) + (extra ? '&' + extra : '') + (hash || '');
}

async function read(page) {
  return page.evaluate(globals => {
    const ids = Array.from(document.querySelectorAll('[id]'))
      .map(e => e.id)
      .filter(id => /^(aiGraph|ag[A-Z])/.test(id));
    const panel = document.getElementById('aiGraph');
    const text = document.body.textContent || '';
    const sim = window.__battle__;
    let snapshot = null;
    try {
      const x = window.BattleDiagnosticsExport;
      snapshot = !!(x && typeof x.snapshot === 'function' && x.snapshot('full', sim));
    } catch (e) {
      snapshot = 'threw: ' + e.message;
    }
    const ai = window.BattleCommanderAI;
    return {
      ids,
      panelOpen: !!panel && !panel.hidden,
      button: !!document.getElementById('aiGraphToggle'),
      globals: globals.filter(g => window[g] !== undefined),
      worldDebug: /World Debug/i.test(text),
      motionLab: /Motion Lab/i.test(text),
      macroSwitch: !!(
        ai &&
        typeof ai.setMacroEnabled === 'function' &&
        typeof ai.isMacroEnabled === 'function'
      ),
      macroOn: !!(ai && sim && ai.isMacroEnabled(sim)),
      leases: !!window.BattleLeases,
      provenance: !!window.BattleOrderProvenance,
      exportSnapshot: snapshot,
      simTime: sim ? sim.time : null
    };
  }, GRAPH_GLOBALS);
}

async function load(browser, target, { start }) {
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + String(e)));
  page.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|404|net::ERR/i.test(m.text()))
      errors.push('console: ' + m.text());
  });
  await page.goto(target, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__battle__, null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  const before = await read(page);
  let after = before;
  if (start && seconds > 0) {
    await page
      .locator('#startBtn')
      .click({ timeout: 60000 })
      .catch(() => {});
    await page
      .waitForFunction(
        () => {
          const b = document.getElementById('startBtn');
          return !b || b.hidden;
        },
        null,
        { timeout: 60000 }
      )
      .catch(() => {});
    await page.waitForTimeout(seconds * 1000);
    after = await read(page);
  }
  await page.close();
  return { ...after, startTime: before.simTime, errors };
}

const problems = [];
function expect(label, ok, detail) {
  if (!ok) problems.push(label + (detail ? ': ' + detail : ''));
}

function judge(name, r, want, { start }) {
  const graph = want === 'present';
  if (graph) {
    expect(name + ' has the AI Graph button', r.button);
    expect(name + ' has AI Graph DOM', r.ids.length >= 10, r.ids.length + ' ids');
    expect(
      name + ' defines every graph global',
      GRAPH_GLOBALS.every(g => r.globals.includes(g)),
      'missing ' + GRAPH_GLOBALS.filter(g => !r.globals.includes(g)).join(',')
    );
  } else {
    expect(name + ' has no AI Graph button', !r.button);
    expect(name + ' has no AI Graph DOM', r.ids.length === 0, r.ids.join(','));
    expect(name + ' defines no graph global', r.globals.length === 0, r.globals.join(','));
    expect(name + ' opens no panel', !r.panelOpen);
  }
  expect(name + ' keeps World Debug and Motion Lab', r.worldDebug && r.motionLab);
  expect(name + ' keeps the Macro switch API, on', r.macroSwitch && r.macroOn);
  expect(name + ' keeps leases and order provenance', r.leases && r.provenance);
  expect(name + ' can still export a snapshot', r.exportSnapshot === true, String(r.exportSnapshot));
  expect(name + ' threw nothing', r.errors.length === 0, r.errors.join(' | '));
  if (start) expect(name + ' battle advances', r.simTime > 0, 'sim time ' + r.simTime);
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--ignore-certificate-errors'
    ]
  });
  const results = {};
  try {
    results.plain = await load(browser, withQuery(url), { start: true });
    judge('page', results.plain, expectUnderTest, { start: true });
    results.editorQuery = await load(browser, withQuery(url, 'editor=ai'), { start: false });
    judge('?editor=ai', results.editorQuery, expectUnderTest, { start: false });
    results.editorHash = await load(browser, withQuery(url, '', '#ai-graph'), { start: false });
    judge('#ai-graph', results.editorHash, expectUnderTest, { start: false });
    if (expectUnderTest === 'present') {
      expect('?editor=ai opens the panel where the graph exists', results.editorQuery.panelOpen);
    }
    if (control) {
      results.control = await load(browser, withQuery(control), { start: false });
      judge('control', results.control, 'present', { start: false });
      results.controlEditor = await load(browser, withQuery(control, 'editor=ai'), { start: false });
      expect(
        'control ?editor=ai opens the panel',
        results.controlEditor.panelOpen,
        'the entry point must be real where the graph exists'
      );
    }
  } finally {
    await browser.close();
  }
  const rows = Object.entries(results).map(([k, r]) => [
    k,
    'button ' + r.button,
    'ids ' + r.ids.length,
    'globals ' + r.globals.length,
    'panelOpen ' + r.panelOpen,
    'worldDebug ' + r.worldDebug,
    'motionLab ' + r.motionLab,
    'sim ' + r.simTime
  ]);
  for (const row of rows) console.log(row.join('  |  '));
  if (process.env.STASH_OUT)
    fs.writeFileSync(
      process.env.STASH_OUT,
      JSON.stringify({ url, control, expectUnderTest, results, problems }, null, 2)
    );
  if (problems.length) {
    console.error('\nFAIL\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  console.log(
    '\nPASS: page under test is ' +
      expectUnderTest +
      (control ? ', control has the graph' : '') +
      '; runtime under the graph intact'
  );
})().catch(e => {
  console.error('PROBE FAIL', e.message);
  process.exit(1);
});
