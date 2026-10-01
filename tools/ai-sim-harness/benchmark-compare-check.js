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
      b = battle('s1', { index: 7, wallSeconds: 99, windowWallSeconds: 41, cpuWallSeconds: 5 });
    b.timeline = Object.assign({}, b.timeline, { ref: 'local-2000', build: 'v30' });
    assert.equal(stateOf(a), stateOf(b));
    assert.notEqual(stateOf(a), stateOf(battle('s1', { captures: 3 })), 'a real field still counts');
    const c = battle('s1');
    c.timeline = Object.assign({}, c.timeline, { samples: samples(30, 12) });
    assert.notEqual(stateOf(a), stateOf(c), 'and so does the timeline itself');
    assert.equal(a.timeline.ref, 'local-1000', 'the records are not edited to compare them');
  });

  await test('scripted windows pair on <seed>-<window>: a window one arm never reached is unpaired, not compared with another', () => {
    const win = (label, over) =>
      battle('scripted-1-' + label, Object.assign({ window: { label }, windowWallSeconds: 3 }, over || {}));
    const off = [win('contact'), win('t500')],
      on = [win('contact', { windowWallSeconds: 9 })];
    const out = JSON.parse(run(off, on).stdout);
    assert.deepEqual([out.pairs, out.unpaired.a, out.unpaired.b], [1, 1, 0], out.stdout);
    assert.equal(out.identicalBattles, 1, 'the window that both arms reached is the same battle');
    const moved = JSON.parse(run(off, [win('contact', { captures: 3 }), win('t500')]).stdout);
    assert.deepEqual(
      [moved.pairs, moved.identicalBattles],
      [2, 1],
      'a changed window is one changed battle, not two'
    );
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

  await test('stalled men are read from the timeline: onsets and man-seconds, a clock the runner does not share', () => {
    const stalled = (us, ge) => ({
      timeline: {
        format: 'grasstex-ai-timeline-v1',
        samples: us.map((v, i) => ({ t: i + 1, us: { stalled: v }, ge: { stalled: ge[i] || 0 } }))
      }
    });
    /* us: one man from 3 s to 5 s, a second joining at 5 s (onsets 2, 6 man-seconds); ge: one man at 2 s (1, 1) */
    const a = battle('s1', stalled([0, 0, 1, 1, 2, 2, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0]));
    const b = battle('s1', stalled([0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]));
    const out = JSON.parse(
      run([a], [b], ['--count', 'timeline.stalledOnsets', '--count', 'timeline.stalledSamples']).stdout
    );
    assert.equal(out.counters['timeline.stalledOnsets'].a, 3);
    assert.equal(out.counters['timeline.stalledOnsets'].b, 0);
    assert.equal(out.counters['timeline.stalledSamples'].a, 7);
    assert.equal(
      out.counters['timeline.stalledSamples'].fewer,
      1,
      'the per-battle sign test works on it too'
    );
    const none = battle('s2');
    delete none.timeline;
    const o2 = JSON.parse(run([none], [none], ['--count', 'timeline.stalledOnsets']).stdout);
    assert.equal(o2.counters['timeline.stalledOnsets'].a, 0, 'a record with no timeline counts nothing');
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
          contactBandSeconds: { steady: 30, shaken: 6, rattled: 3, broken: 1 },
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
    assert.deepEqual(s.contactBandSeconds, { steady: 60, shaken: 12, rattled: 6, broken: 2 });
    assert.equal(s.contactSeconds, 80);
    assert.deepEqual(s.contactBandShare, { steady: 0.75, shaken: 0.15, rattled: 0.075, broken: 0.025 });
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
      'Men whose squad is in contact (80 man-seconds): steady **75.0%**',
      'Squads at mean stress ≥ 0.333',
      'with 3+ living men',
      'react **80**',
      'fire 6, suppress 2, bound 2, advance 0'
    ])
      assert.ok(md.includes(want), want + ' in:\n' + md);
    /* The memory block (?stressMem): summed over the battles that have one; a build without it reads as none. */
    assert.deepEqual(s.memory, {
      flags: [],
      heldSeconds: 0,
      floorMen: 0,
      floorMax: 0,
      relief: {
        kill: { n: 0, amount: 0 },
        objective: { n: 0, amount: 0 },
        cover: { n: 0, amount: 0 },
        survived: { n: 0, amount: 0 }
      }
    });
    const mem = (held, men, max, n) => ({
      memory: {
        flags: ['lasting', 'relief'],
        heldSeconds: held,
        floor: { men, mean: 0.2, max },
        relief: {
          kill: { n, amount: n * 0.1 },
          objective: { n: 0, amount: 0 },
          cover: { n: 1, amount: 0.05 },
          survived: { n: 2 * n, amount: n * 0.2 }
        }
      }
    });
    const m = summarizeStress([
      { stress: block(1, mem(10.5, 3, 0.4, 2)) },
      { stress: block(2, mem(4, 2, 0.6, 1)) }
    ]);
    assert.deepEqual(m.memory.flags, ['lasting', 'relief']);
    assert.equal(m.memory.heldSeconds, 14.5);
    assert.equal(m.memory.floorMen, 5);
    assert.equal(m.memory.floorMax, 0.6);
    assert.deepEqual(m.memory.relief.kill, { n: 3, amount: 0.3 });
    assert.deepEqual(m.memory.relief.survived, { n: 6, amount: 0.6 });
    const mdm = stressMarkdown(m).join('\n');
    assert.ok(
      mdm.includes('Stress memory (lasting,relief): held 14.5 man-seconds · floors 5 men (highest 0.6)'),
      mdm
    );
    assert.ok(!stressMarkdown(s).join('\n').includes('Stress memory'), 'nothing to say with every flag off');
    /* The reactions (?stressAct): spells and seconds per reaction, the charge's blows. */
    const acts = (k, extra) => ({
      acts: {
        cower: { n: k, seconds: 1.5 * k },
        flee: { n: 2 * k, seconds: 4 * k },
        freeze: { n: 0, seconds: 0 },
        rage: Object.assign({ n: k, seconds: 2, strikes: 3, hits: 1 }, extra)
      }
    });
    const a2 = summarizeStress([{ stress: block(1, acts(1)) }, { stress: block(2, acts(2)) }]);
    assert.deepEqual(a2.acts.cower, { n: 3, seconds: 4.5 });
    assert.deepEqual(a2.acts.flee, { n: 6, seconds: 12 });
    assert.deepEqual(a2.acts.rage, {
      n: 3,
      seconds: 4,
      strikes: 6,
      hits: 2,
      guarded: 0,
      savedHp: 0,
      kills: 0,
      survived: 0,
      debtHp: 0,
      succumbed: 0
    });
    assert.ok(
      stressMarkdown(a2)
        .join('\n')
        .includes(
          'Stress reactions: cower 3 (4.5 s) · flee 6 (12 s) · freeze 0 (0 s) · rage 3 (4 s) · charge blows 6 struck, 2 landed'
        )
    );
    /* The berserk guard: hits taken while it held, and the hp it saved. */
    const g2 = summarizeStress([
      { stress: block(1, acts(1, { guarded: 2, savedHp: 0.75 })) },
      { stress: block(2, acts(2, { guarded: 1, savedHp: 0.5 })) }
    ]);
    assert.equal(g2.acts.rage.guarded, 3);
    assert.equal(g2.acts.rage.savedHp, 1.3);
    assert.ok(stressMarkdown(g2).join('\n').includes('hits taken under the berserk guard 3 (1.3 hp saved)'));
    /* The trance (?rageTrance=1): kills in rage, trances that ended with him alive, the hp due and who it killed. */
    const t2 = summarizeStress([
      { stress: block(1, acts(1, { kills: 2, survived: 1, debtHp: 40.25, succumbed: 1 })) },
      { stress: block(2, acts(2, { kills: 1, survived: 2, debtHp: 10, succumbed: 0 })) }
    ]);
    assert.equal(t2.acts.rage.kills, 3);
    assert.equal(t2.acts.rage.succumbed, 1);
    assert.ok(
      stressMarkdown(t2)
        .join('\n')
        .includes('kills in rage 3 · trances survived 3, 1 succumbed (50.3 hp due)'),
      stressMarkdown(t2).join('\n')
    );
    assert.ok(!stressMarkdown(a2).join('\n').includes('kills in rage'), 'no kills, nothing said');
    assert.equal(s.acts.cower.n, 0, 'no reactions in a build without them');
    assert.ok(
      !stressMarkdown(s).join('\n').includes('Stress reactions'),
      'nothing to say with every reaction off'
    );
    assert.equal(summarizeStress([{ seed: 'x' }, { stress: { off: true } }]), null);
    assert.equal(summarizeStress([]), null);
    assert.match(stressMarkdown(null)[0], /no stress block/);
  });

  await test('seeds mode: the planner covers every seed once, balanced, over at most the shards it is given', () => {
    const { plan } = require('../../scripts/plan_benchmark_shards.cjs');
    for (const [seeds, max] of [
      [100, 20],
      [7, 20],
      [1, 20],
      [21, 20],
      [39, 20],
      [100, 3]
    ]) {
      const shards = plan(seeds, max);
      assert.ok(
        shards.length <= max && shards.length === Math.min(seeds, max),
        `${seeds} seeds over ${shards.length} shards`
      );
      let next = 0;
      for (const sh of shards) {
        assert.equal(sh.first, next, 'contiguous: each shard starts where the last stopped');
        assert.ok(sh.count >= 1, 'no empty shard');
        next += sh.count;
      }
      assert.equal(next, seeds, 'every seed once');
      const counts = shards.map(x => x.count);
      assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, 'balanced to within one seed');
      assert.deepEqual(
        shards.map(x => x.shard),
        shards.map((_, i) => i + 1),
        'shards numbered from 1'
      );
    }
    assert.deepEqual(plan(100, 20)[0], { shard: 1, first: 0, count: 5 });
    assert.throws(() => plan(0), /whole number/);
    assert.throws(() => plan(2.5), /whole number/);
    assert.throws(() => plan(5, 0), /whole number/);
    const cli = cp.spawnSync(
      process.execPath,
      [path.join(__dirname, '../../scripts/plan_benchmark_shards.cjs'), 'abc'],
      { encoding: 'utf8' }
    );
    assert.equal(cli.status, 2, 'a bad seed count is an error the workflow stops on');
  });

  await test("seeds mode: casualties is both sides' kills, paired by seed across pooled shard reports, and the table says what it counted", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmp-'));
    const rec = (seed, us, ge) => battle(seed, { usKills: us, geKills: ge });
    const write = (name, battles) => {
      fs.writeFileSync(path.join(dir, name), JSON.stringify({ battles }));
      return path.join(dir, name);
    };
    // two shards per arm, one seed each: the lists are pooled with a comma, as the compare job does
    const offList = [
      write('off1.json', [rec('s-0001-contact', 5, 4)]),
      write('off2.json', [rec('s-0002-contact', 6, 3)])
    ].join(',');
    const onList = [
      write('on1.json', [rec('s-0001-contact', 2, 2)]),
      write('on2.json', [rec('s-0002-contact', 6, 3)])
    ].join(',');
    const run2 = cp.spawnSync(
      process.execPath,
      [
        path.join(__dirname, '../../scripts/compare_benchmark_arms.cjs'),
        '--json',
        '--count',
        'casualties',
        offList,
        onList
      ],
      { encoding: 'utf8' }
    );
    const out = JSON.parse(run2.stdout);
    assert.equal(out.pairs, 2, 'two seeds from two shard files pair');
    assert.deepEqual(
      [
        out.counters.casualties.a,
        out.counters.casualties.b,
        out.counters.casualties.more,
        out.counters.casualties.fewer
      ],
      [18, 13, 0, 1],
      'off 9 + 9, on 4 + 9: one pair lost men fewer, the other is a tie'
    );
    const { format } = require('../../scripts/format_benchmark_compare.cjs');
    const table = format(out);
    assert.match(table, /\*\*2\*\* pairs/);
    assert.match(table, /\| `casualties` \| 18 \| 13 \|/);
    assert.match(table, /on fewer/);
    assert.ok(!/undefined|NaN/.test(table), 'no hole in the table');
    assert.ok(
      format({ pairs: 0, counters: {} }).includes('**0** pairs'),
      'an empty comparison still renders'
    );
  });

  await test('the verdict reads the comparison: inert, one battle, quiet, weak or moved, and says when it is a coincidence', () => {
    const { verdict } = require('../../scripts/format_benchmark_compare.cjs');
    const c = (a, b, more, fewer, signP) => ({
      a,
      b,
      meanDiff: 0,
      battlesChanged: more + fewer,
      more,
      fewer,
      signP
    });
    const base = {
      pairs: 100,
      identicalBattles: 14,
      unpaired: { a: 0, b: 0 },
      runtimeErrors: { a: 0, b: 0 },
      wallSeconds: { ratio: 1, gate: 1.25 },
      firstDivergence: { battles: 85, median: 144, min: 100, max: 200 }
    };
    assert.equal(verdict({ ...base, identicalBattles: 100, counters: {} }, 'seeds').kind, 'inert');
    assert.match(
      verdict({ ...base, identicalBattles: 100, counters: {} }).headline,
      /INERT: all 100 pairs identical/
    );
    const one = verdict(
      { ...base, pairs: 9, identicalBattles: 1, counters: { casualties: c(100, 90, 0, 5, 0.06) } },
      'single'
    );
    assert.equal(one.kind, 'single');
    assert.match(
      one.lines.join(' '),
      /not independent/,
      'checkpoints of one battle are not independent samples'
    );
    const quiet = verdict(
      { ...base, counters: { casualties: c(2256, 2220, 41, 38, 0.82), a: c(1, 1, 3, 3, 1) } },
      'seeds'
    );
    assert.equal(quiet.kind, 'quiet');
    assert.match(quiet.headline, /0 of 2 counters under p 0\.05/);
    assert.match(quiet.headline, /casualties -1\.6% \(p 0\.82\)/);
    const weak = verdict(
      {
        ...base,
        counters: { casualties: c(100, 80, 10, 40, 0.03), b: c(1, 1, 1, 1, 1), c: c(1, 1, 1, 1, 1) }
      },
      'seeds'
    );
    assert.equal(weak.kind, 'weak', 'under 0.05 but not under 0.05 / 3');
    const moved = verdict(
      { ...base, counters: { casualties: c(100, 80, 10, 90, 0.0001), b: c(1, 1, 1, 1, 1) } },
      'seeds'
    );
    assert.equal(moved.kind, 'moved');
    assert.match(moved.lines.join(' '), /Bonferroni/);
    assert.match(
      verdict({
        ...base,
        unpaired: { a: 0, b: 3 },
        runtimeErrors: { a: 0, b: 2 },
        wallSeconds: { ratio: 1.4, gate: 1.25 },
        counters: {}
      }).lines.join(' '),
      /over the 1\.25 gate[\s\S]*Runtime errors[\s\S]*Unpaired/
    );
    assert.equal(verdict({ pairs: 0, counters: {} }).kind, 'empty');
  });

  await test('processing a run: slim viewer files, the seeds that part earliest, and the link that opens them', () => {
    const {
      process: processResults,
      viewerUrl,
      viewerBase,
      previewSlug
    } = require('../../scripts/process_benchmark_results.cjs');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proc-'));
    const rec = (scenario, label, bump, closed, extra) =>
      battle(
        `${scenario}-${label}`,
        Object.assign(
          {
            scenarioSeed: scenario,
            battleType: 'meeting',
            window: { label, closedAt: closed },
            usKills: 5 + (bump ? 1 : 0),
            geKills: 4,
            timeline: { format: 'grasstex-ai-timeline-v1', samples: samples(closed, bump), markers: [] }
          },
          extra || {}
        )
      );
    const write = (name, battles) => {
      fs.writeFileSync(path.join(dir, name), JSON.stringify({ summary: { build: 'v-test' }, battles }));
      return path.join(dir, name);
    };
    // seeds mode, windows only: s3 never parts, s1 parts at 21 s, s2 at 8 s
    const off = write('off.json', [
      rec('s-0001', 'contact', 0, 40),
      rec('s-0002', 'contact', 0, 40),
      rec('s-0003', 'contact', 0, 40)
    ]);
    const on = write('on.json', [
      rec('s-0001', 'contact', 20, 40),
      rec('s-0002', 'contact', 7, 40),
      rec('s-0003', 'contact', 0, 40)
    ]);
    const compare = {
      pairs: 3,
      unpaired: { a: 0, b: 0 },
      identicalBattles: 1,
      runtimeErrors: { a: 0, b: 0 },
      wallSeconds: { ratio: 1, gate: 1.25 },
      firstDivergence: { battles: 2, min: 8, median: 14, max: 21 },
      counters: {
        casualties: { a: 27, b: 29, meanDiff: 0.7, battlesChanged: 2, more: 2, fewer: 0, signP: 0.5 }
      }
    };
    fs.writeFileSync(path.join(dir, 'compare.json'), JSON.stringify(compare));
    const env = {
      GITHUB_RUN_NUMBER: '77',
      GITHUB_RUN_ID: '9',
      GITHUB_REPOSITORY: 'APPARANYX/grasstex',
      GITHUB_REF_NAME: 'work/scripted-benchmark',
      GITHUB_SHA: 'abcdef0123456789'
    };
    const r = processResults(
      {
        mode: 'seeds',
        compare: path.join(dir, 'compare.json'),
        off,
        on,
        seed: 's',
        seeds: '3',
        windows: 'contact+120',
        'max-seeds': '2'
      },
      env
    );
    assert.deepEqual(
      r.result.viewer.seeds.map(x => [x.seed, x.firstDivergence]),
      [
        ['s-0002', 8],
        ['s-0001', 21]
      ],
      'ranked by where they part, the identical seed left out, capped at --max-seeds'
    );
    assert.deepEqual(
      r.off.battles.map(b => b.seed),
      ['s-0002-contact', 's-0001-contact'],
      'the viewer opens the earliest first'
    );
    assert.deepEqual(
      Object.keys(r.off.battles[0]).sort(),
      ['battleType', 'scenarioSeed', 'seed', 'simulatedSeconds', 'timeline', 'winReason', 'window', 'winner'],
      'a slim record: no stress block, no counters'
    );
    assert.equal(
      r.url,
      'https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=77&view=brain3d',
      'seeds mode has no pick: the first record is the earliest part'
    );
    assert.ok(!/\n/.test(r.headline) && r.headline.length > 10, 'one line, for the notification');
    assert.match(r.md, /# Benchmark run #77 · 3 seeds from `s`/);
    assert.match(r.md, /## Verdict/);
    assert.match(r.md, /s-0002 8 s \(timeline\) · s-0001 21 s \(timeline\)/);
    // single mode: one scenario with a record per checkpoint (each a prefix of the last): only the longest goes to the viewer, picked by -end
    const offS = write('offS.json', [
      rec('sc', 'contact', 0, 30),
      rec('sc', 't180', 0, 60),
      rec('sc', 'end', 0, 90)
    ]);
    const onS = write('onS.json', [
      rec('sc', 'contact', 0, 30),
      rec('sc', 't180', 25, 60),
      rec('sc', 'end', 25, 90)
    ]);
    const single = processResults(
      {
        mode: 'single',
        compare: path.join(dir, 'compare.json'),
        off: offS,
        on: onS,
        seed: 'sc',
        windows: 'contact+60,every60'
      },
      env
    );
    assert.deepEqual(
      single.off.battles.map(b => b.seed),
      ['sc-end'],
      'one record per scenario, the longest'
    );
    assert.equal(single.off.battles[0].timeline.samples.length, 90);
    assert.match(single.url, /bench=77&pick=-end&view=brain3d$/);
    // the preview of the branch that ran, production for main and for a ref without a preview, another repository named
    assert.equal(
      r.previewUrl,
      'https://test.ivandpopov.com/grasstex/preview/scripted-benchmark/ai_flow_live.html?bench=77&view=brain3d',
      'the branch that ran has its own viewer'
    );
    assert.equal(
      processResults(
        { mode: 'seeds', compare: path.join(dir, 'compare.json'), off, on, seeds: '3' },
        { ...env, GITHUB_REF_NAME: 'main' }
      ).previewUrl,
      null,
      'main has no preview: the server is the viewer'
    );
    assert.match(
      viewerUrl({ ref: 'work/x', run: 1, where: 'preview' }),
      /grasstex\/preview\/x\/ai_flow_live\.html\?bench=1&pick=-end&view=brain3d$/
    );
    assert.equal(previewSlug('work/Scripted_Benchmark-2'), 'scripted-benchmark-2');
    assert.equal(viewerBase('main'), 'https://test.ivandpopov.com/grasstex');
    assert.equal(
      viewerBase('feature/x'),
      'https://test.ivandpopov.com/grasstex',
      'no preview is staged for a branch outside work/ and preview/'
    );
    assert.equal(viewerBase('preview/a.b'), 'https://test.ivandpopov.com/grasstex/preview/a-b');
    assert.match(
      viewerUrl({ ref: 'main', repo: 'someone/else', run: 5 }),
      /grasstex\/ai_flow_live\.html\?bench=5&repo=someone%2Felse&pick=-end&view=brain3d$/
    );
    // a run with nothing to compare still writes a result
    const none = processResults(
      {
        mode: 'seeds',
        compare: path.join(dir, 'compare.json'),
        off,
        on: write('empty.json', []),
        seeds: '3'
      },
      env
    );
    assert.deepEqual(none.on.battles, []);
  });

  console.log(n + ' benchmark compare checks passed');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
