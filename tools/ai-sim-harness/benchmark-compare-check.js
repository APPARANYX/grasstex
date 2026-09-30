#!/usr/bin/env node
'use strict';
/* The two benchmark tools an A/B rests on: scripts/compare_benchmark_arms.cjs (are two arms the same
   battles, and if not, where do they first part) and scripts/lib/stress-summary.mjs (the stress dose map
   the benchmark prints). Synthetic records, no browser.

   - Two records are the same battle whatever the wall clock, the run's index and the page's build stamp
     said: `timeline.ref` is `local-<mtime of the checkout>` and differs between any two runs of a commit.
   - `--ignore a.b` leaves a field out of the identity test, so a build that adds a field to the record can be
     shown identical to one that does not on every field they share.
   - Changed battles report the simulated second at which their timeline, or their stress series, first
     differs: `t` is simulated seconds, never wall time.
   - The dose map sums what the records carry, leaves out a record with the module off, and is null when no
     record has a stress block. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path'),
  cp = require('node:child_process');
const { stateOf, firstDivergence } = require('../../scripts/compare_benchmark_arms.cjs');
let n = 0;
function test(name, fn) {
  return Promise.resolve(fn()).then(() => {
    n++;
    console.log('PASS ' + name);
  });
}

const samples = (n, bump) =>
  Array.from({ length: n }, (_, i) => ({
    t: i + 1,
    us: { alive: 50 - (bump && i >= bump ? 1 : 0), phases: { advance: 5 } },
    ge: { alive: 50 }
  }));
const series = (n, bump) => ({
  columns: ['men', 'mean'],
  t: Array.from({ length: n }, (_, i) => i + 1),
  us: Array.from({ length: n }, (_, i) => [50, bump && i >= bump ? 0.2 : 0.1]),
  ge: Array.from({ length: n }, () => [50, 0.1])
});
function battle(seed, over) {
  return Object.assign(
    {
      index: 1,
      seed,
      winner: 'us',
      captures: 2,
      timeoutReached: false,
      wallSeconds: 10,
      movementStalls: [],
      timeline: {
        format: 'grasstex-ai-timeline-v1',
        build: 'v29-dev',
        ref: 'local-1000',
        samples: samples(30),
        markers: []
      },
      stress: {
        format: 'grasstex-stress-v1',
        series: series(30),
        bandSeconds: { steady: 1, shaken: 0, rattled: 0, broken: 0 }
      }
    },
    over || {}
  );
}
const run = (a, b, extra) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmp-'));
  fs.writeFileSync(path.join(dir, 'a.json'), JSON.stringify({ battles: a }));
  fs.writeFileSync(path.join(dir, 'b.json'), JSON.stringify({ battles: b }));
  return cp.spawnSync(
    process.execPath,
    [
      path.join(__dirname, '../../scripts/compare_benchmark_arms.cjs'),
      '--json',
      ...(extra || []),
      path.join(dir, 'a.json'),
      path.join(dir, 'b.json')
    ],
    { encoding: 'utf8' }
  );
};

(async () => {
  await test('a record is the same battle whatever the clock, the index and the run said', () => {
    const a = battle('s1'),
      b = battle('s1', { index: 7, wallSeconds: 99, cpuWallSeconds: 5 });
    b.timeline = Object.assign({}, b.timeline, { ref: 'local-2000', build: 'v30' });
    assert.equal(stateOf(a), stateOf(b));
    assert.notEqual(stateOf(a), stateOf(battle('s1', { captures: 3 })), 'a real field still counts');
    const c = battle('s1');
    c.timeline = Object.assign({}, c.timeline, { samples: samples(30, 12) });
    assert.notEqual(stateOf(a), stateOf(c), 'and so does the timeline itself');
    assert.equal(a.timeline.ref, 'local-1000', 'the records are not edited to compare them');
  });

  await test('--ignore leaves a field out of identity: a build that adds a field matches one that lacks it', () => {
    const old = battle('s1');
    delete old.stress;
    const added = battle('s1');
    assert.notEqual(stateOf(old), stateOf(added));
    assert.equal(stateOf(old, ['stress']), stateOf(added, ['stress']));
    const out = run([old], [added], ['--ignore', 'stress']);
    assert.equal(JSON.parse(out.stdout).identicalBattles, 1, out.stdout);
    const plain = run([old], [added]);
    assert.equal(JSON.parse(plain.stdout).identicalBattles, 0, 'without it they differ');
    const nested = battle('s1');
    nested.timeline = Object.assign({}, nested.timeline, { markers: [{ t: 3, kind: 'x' }] });
    assert.equal(
      stateOf(battle('s1'), ['timeline.markers']),
      stateOf(nested, ['timeline.markers']),
      'a dotted path reaches inside a field'
    );
  });

  await test('a changed battle reports the simulated second its timeline or its stress first parts', () => {
    const a = battle('s1'),
      b = battle('s1');
    b.timeline = Object.assign({}, b.timeline, { samples: samples(30, 12) });
    assert.deepEqual(firstDivergence(a, b), { t: 13, what: 'timeline' });
    const c = battle('s1');
    c.stress = Object.assign({}, c.stress, { series: series(30, 8) });
    assert.deepEqual(firstDivergence(a, c), { t: 9, what: 'stress' });
    const both = battle('s1');
    both.timeline = Object.assign({}, both.timeline, { samples: samples(30, 12) });
    both.stress = Object.assign({}, both.stress, { series: series(30, 8) });
    assert.deepEqual(firstDivergence(a, both), { t: 9, what: 'stress' }, 'the earlier of the two');
    assert.equal(firstDivergence(a, battle('s1')), null, 'the same battle never diverges');
    assert.equal(
      firstDivergence({ seed: 'x' }, { seed: 'x' }),
      null,
      'records with no timeline have none to compare'
    );
    const out = JSON.parse(run([a, battle('s2')], [b, battle('s2', { captures: 4 })]).stdout);
    assert.equal(out.identicalBattles, 0);
    assert.deepEqual(
      [out.firstDivergence.battles, out.firstDivergence.min, out.firstDivergence.max],
      [1, 13, 13],
      'the one battle with a timeline to compare'
    );
  });

  await test('the dose map sums the records, skips an off record and is null with nothing to sum', async () => {
    const { summarizeStress, stressMarkdown, stressBattles } =
      await import('../../scripts/lib/stress-summary.mjs');
    const block = (k, extra) =>
      Object.assign(
        {
          format: 'grasstex-stress-v1',
          mode: 'default',
          levers: ['react', 'aim', 'hesitate', 'shock'],
          manSeconds: 100,
          bandSeconds: { steady: 90, shaken: 6, rattled: 3, broken: 1 },
          peakBand: { steady: 70, shaken: 20, rattled: 8, broken: 2 },
          shocks: 4 * k,
          hesitations: 2,
          casualtiesSeen: 10,
          squads: {
            overMean: 0.333,
            minMen: 3,
            us: {
              squads: 5,
              over: k,
              overSeconds: 12 * k,
              entries: k,
              peakMean: 0.4,
              with3: { over: 1, overSeconds: 6 * k, entries: k }
            },
            ge: {
              squads: 5,
              over: 0,
              overSeconds: 0,
              entries: 0,
              peakMean: 0.1,
              with3: { over: 0, overSeconds: 0, entries: 0 }
            }
          },
          decisions: {
            react: { total: 50, changed: 40, byBand: [30, 8, 2, 0], mag: 3.5, firstAt: 20 },
            aim: { total: 1000, changed: 600, byBand: [500, 80, 20, 0], mag: 12, firstAt: 25 },
            hesitate: { total: 20, changed: 2 * k, byBand: [0, k, k, 0], mag: 3, firstAt: 60, lapsed: 1 },
            shock: {
              total: null,
              changed: 5,
              byBand: [1, 2, 2, 0],
              mag: 0,
              firstAt: 40,
              kinds: { fire: 3, suppress: 1, bound: 1, advance: 0 }
            }
          },
          bySide: {
            us: {
              bandSeconds: { steady: 40, shaken: 5, rattled: 3, broken: 1 },
              shocks: 3,
              decisions: {
                react: { changed: 25 },
                aim: { changed: 300 },
                hesitate: { changed: 1 },
                shock: { changed: 3 }
              }
            },
            ge: {
              bandSeconds: { steady: 50, shaken: 1, rattled: 0, broken: 0 },
              shocks: 1,
              decisions: {
                react: { changed: 15 },
                aim: { changed: 300 },
                hesitate: { changed: 1 },
                shock: { changed: 2 }
              }
            }
          }
        },
        extra
      );
    const rows = [
      { stress: block(1) },
      { stress: block(2) },
      { stress: { format: 'grasstex-stress-v1', mode: 'off', off: true } },
      { seed: 'no stress' }
    ];
    assert.equal(stressBattles(rows).length, 2);
    const s = summarizeStress(rows);
    assert.equal(s.battles, 2);
    assert.equal(s.manSeconds, 200);
    assert.deepEqual(s.bandSeconds, { steady: 180, shaken: 12, rattled: 6, broken: 2 });
    assert.deepEqual(s.bandShare, { steady: 0.9, shaken: 0.06, rattled: 0.03, broken: 0.01 });
    assert.deepEqual(s.battlesReaching, { shaken: 2, rattled: 2, broken: 2 });
    assert.equal(s.shocks, 12);
    assert.deepEqual(s.squads, {
      squads: 20,
      over: 3,
      overSeconds: 36,
      entries: 3,
      battlesWithAny: 2,
      peakMean: 0.4,
      with3: { over: 2, overSeconds: 18, entries: 3, battlesWithAny: 2 },
      overMean: 0.333,
      minMen: 3
    });
    assert.deepEqual(s.decisions.react, {
      total: 100,
      changed: 80,
      byBand: [60, 16, 4, 0],
      mag: 7,
      battlesChanged: 2,
      firstAt: { p50: 20, p90: 20, max: 20 }
    });
    assert.equal(s.decisions.shock.total, null);
    assert.deepEqual(s.decisions.shock.kinds, { fire: 6, suppress: 2, bound: 2, advance: 0 });
    assert.equal(s.decisions.hesitate.lapsed, 2);
    assert.deepEqual(s.perBattle.squadSecondsOver, { p50: 18, p90: 22.8, max: 24 });
    assert.deepEqual(s.perBattle.squadSecondsOverWith3, { p50: 9, p90: 11.4, max: 12 });
    assert.equal(s.bySide.us.changed.aim, 600);
    assert.equal(s.bySide.ge.bandShare.steady, 0.9804);
    const md = stressMarkdown(s).join('\n');
    for (const want of [
      '200 man-seconds',
      'steady **90.0%**',
      'shaken **6.0%**',
      'Squads at mean stress ≥ 0.333',
      'with 3+ living men',
      'react **80**',
      'fire 6, suppress 2, bound 2, advance 0'
    ])
      assert.ok(md.includes(want), want + ' in:\n' + md);
    assert.equal(summarizeStress([{ seed: 'x' }, { stress: { off: true } }]), null);
    assert.equal(summarizeStress([]), null);
    assert.match(stressMarkdown(null)[0], /no stress block/);
  });

  console.log(n + ' benchmark compare checks passed');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
