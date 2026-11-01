#!/usr/bin/env node
'use strict';
/* Are the AI Graph workbench and the policy genome really stashed? Loads the page under test, and
   optionally a control page that still has them, and reads what is actually in the page.

   Per page it records the AI Graph DOM (`aiGraph*` and `ag*` ids), the graph globals, the HUD buttons,
   and whether the runtime the graph used to sit on is still there (Macro switch, leases, provenance,
   the diagnostics export). The page under test also loads with `?editor=ai` and with `#ai-graph`, the
   two ways the editor used to open itself, and runs a few seconds of battle to show the sim still
   advances and nothing threw.

   The genome is stashed with the graph (`STASHED` in ai-policy.js): the page must report
   `BattleAIPolicy.stashed`, revision 0, the code defaults as its genome and no Genome v2 Training button,
   and a hostile `set()` and `setMatchPolicies()` (a cohesion radius of 45 m against the default 34) must
   change neither the genome nor what Force Command's `policyFor` returns. That poke runs last, on a page
   that is about to close, so it never touches a battle being measured.

   The control makes the negatives mean something: on a page with the graph the same probe must find
   the DOM, the globals, the button, the entry points must open the panel, and the same hostile calls
   must take effect. Exits 1 on any mismatch. The two switches are separate lines (`STASHED` in ai-policy.js
   and the gate in modules/30-ai-graph-editor.js), so a page with only one flipped fails here.

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
    const P = window.BattleAIPolicy;
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    return {
      genome: P
        ? { stashed: P.stashed === true, revision: P.revision, isDefaults: same(P.get(), P.defaults) }
        : null,
      trainButton: !!document.getElementById('trainAiBtn'),
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

/* Try to change the genome the way the graph, the trainer and a match once did, and report what stuck.
   Destroys the page's genome, so only call it on a page that is about to close. */
async function poke(page) {
  return page.evaluate(() => {
    const P = window.BattleAIPolicy;
    const D = window.BattleCommanderDoctrine;
    const sim = window.__battle__;
    if (!P || !D || !sim) return null;
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const hostile = JSON.parse(JSON.stringify(P.defaults));
    hostile.parameters.cohesionRadius = 45;
    hostile.rules = [{ id: 'probe-hold', when: ['objectiveNeutral'], action: 'hold', weight: 1 }];
    const radius = () => D.policyFor(sim, 'us').cohesionRadius;
    const out = { radiusBefore: radius(), revisionBefore: P.revision };
    P.set(hostile, { revision: 777 });
    out.getRadiusAfterSet = P.get().parameters.cohesionRadius;
    out.radiusAfterSet = radius();
    out.revisionAfterSet = P.revision;
    out.isDefaultsAfterSet = same(P.get(), P.defaults);
    P.setMatchPolicies(sim, hostile, hostile);
    out.matchGenome = !!sim.aiGenomes;
    out.radiusAfterMatch = radius();
    out.ruleAfterMatch = P.decide(P.genomeFor(sim, 'us'), { objectiveNeutral: true }).id;
    return out;
  });
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
  const poked = await poke(page);
  await page.close();
  return { ...after, poked, startTime: before.simTime, errors };
}

const problems = [];
function expect(label, ok, detail) {
  if (!ok) problems.push(label + (detail ? ': ' + detail : ''));
}

function judge(name, r, want, { start }) {
  const graph = want === 'present';
  expect(name + ' has the policy runtime', !!r.genome);
  if (r.genome && r.poked) {
    if (graph) {
      expect(name + ' has a live genome', !r.genome.stashed);
      expect(name + ' has the Genome v2 Training button', r.trainButton);
      expect(
        name + ' takes a hostile set()',
        r.poked.getRadiusAfterSet === 45 && r.poked.revisionAfterSet === 777,
        JSON.stringify(r.poked)
      );
      expect(
        name + ' takes a per-match genome',
        r.poked.matchGenome && r.poked.ruleAfterMatch === 'probe-hold',
        JSON.stringify(r.poked)
      );
    } else {
      expect(name + ' reports its genome stashed', r.genome.stashed);
      expect(name + ' reads revision 0', r.genome.revision === 0, 'revision ' + r.genome.revision);
      expect(name + ' runs the code defaults', r.genome.isDefaults);
      expect(name + ' has no Genome v2 Training button', !r.trainButton);
      expect(
        name + ' ignores a hostile set()',
        r.poked.getRadiusAfterSet === 34 &&
          r.poked.radiusAfterSet === r.poked.radiusBefore &&
          r.poked.radiusBefore === 34 &&
          r.poked.revisionAfterSet === 0 &&
          r.poked.isDefaultsAfterSet,
        JSON.stringify(r.poked)
      );
      expect(
        name + ' ignores a per-match genome',
        !r.poked.matchGenome && r.poked.radiusAfterMatch === 34 && r.poked.ruleAfterMatch === 'press-neutral',
        JSON.stringify(r.poked)
      );
    }
  }
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
    'genome ' + (r.genome ? (r.genome.stashed ? 'stashed' : 'live r' + r.genome.revision) : 'none'),
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
      (control ? ', control has the graph and a live genome' : '') +
      '; runtime under the graph intact'
  );
})().catch(e => {
  console.error('PROBE FAIL', e.message);
  process.exit(1);
});
