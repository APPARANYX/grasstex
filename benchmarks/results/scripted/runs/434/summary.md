# Benchmark run #434 · 60 seeds from `exec361` (ge-defend), windows `contact+300`

- **OFF** flags: `executionReport=0` · **ON** flags: `none`
- claude/project-thread-d6qmpr @ 281eecf · [run](https://github.com/APPARANYX/grasstex/actions/runs/37780260966) · build v29-dev

## Verdict

**QUIET: 13 of 54 pairs changed (median first part 125.1 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.3% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **41** · runtime errors off 0 / on 0 · wall time on/off x0.993 (gate 1.25)
- the 5 changed records first part at simulated second: min 104.1, p10 104.1, median 125.1, p90 240, max 240

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1535 | 1540 | 0.0926 | 5 | 3 | 2 | 1 |
| `usKills` | 620 | 612 | -0.1481 | 5 | 2 | 3 | 1 |
| `geKills` | 915 | 928 | 0.2407 | 5 | 4 | 1 | 0.375 |
| `fire.total` | 11500 | 11581 | 1.5 | 5 | 3 | 2 | 1 |
| `fire.hits` | 3821 | 3855 | 0.6296 | 5 | 3 | 2 | 1 |
| `retreatSamples` | 32188 | 32322 | 2.4815 | 5 | 2 | 3 | 1 |
| `movementResolver.changes` | 96567 | 97311 | 13.7778 | 5 | 5 | 0 | 0.0625 |
| `movementStalls.length` | 14 | 13 | -0.0185 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 7 | 7 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 85 | 82 | -0.0556 | 2 | 1 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 115 | 116 | 0.0185 | 2 | 1 | 1 | 1 |
| `stallOutcomes.wakes` | 31 | 28 | -0.0556 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 61 | 55 | -0.1111 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 731 | 535 | -3.6296 | 4 | 0 | 4 | 0.125 |
| `timeline.stalledOnsetsRepeated` | 61 | 55 | -0.1111 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 731 | 535 | -3.6296 | 4 | 0 | 4 | 0.125 |
| `recon.orders` | 2372 | 2371 | -0.0185 | 5 | 2 | 3 | 1 |
| `recon.contacts` | 200 | 205 | 0.0926 | 4 | 3 | 1 | 0.625 |
| `recon.noContact` | 778 | 784 | 0.1111 | 3 | 3 | 0 | 0.25 |
| `recon.timeouts` | 907 | 897 | -0.1852 | 5 | 1 | 4 | 0.375 |
| `recon.cancelled` | 423 | 420 | -0.0556 | 4 | 1 | 3 | 0.625 |
| `recon.reportsDelivered` | 945 | 965 | 0.3704 | 5 | 3 | 2 | 1 |
| `recon.retriggerBlocked` | 973 | 974 | 0.0185 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanOverall` | 4584.8 | 4583.300000000001 | -0.0278 | 5 | 1 | 4 | 0.375 |
| `squadPerformance.p10Overall` | 4139.199999999999 | 4138.399999999998 | -0.0148 | 4 | 2 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3932.3000000000006 | 3920.9000000000005 | -0.2111 | 5 | 0 | 5 | 0.0625 |
| `squadPerformance.meanMovement` | 5376.499999999999 | 5376.8 | 0.0056 | 5 | 3 | 2 | 1 |
| `squadPerformance.meanControl` | 5319.300000000002 | 5320.000000000002 | 0.013 | 5 | 2 | 3 | 1 |
| `squadPerformance.meanCohesion` | 4613.200000000001 | 4617.900000000001 | 0.087 | 5 | 3 | 2 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 5 seeds that part earliest (simulated seconds)

exec361-0010 104.1 s (timeline) · exec361-0041 111 s (timeline) · exec361-0037 125.1 s (timeline) · exec361-0040 157.05 s (timeline) · exec361-0007 240 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=434&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=434`); it opens the seed that parts earliest, and the dropdowns choose another.

