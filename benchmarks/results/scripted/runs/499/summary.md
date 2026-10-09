# Benchmark run #499 · 4 seeds from `movement-precision-20261009` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=3`
- work/experimental-movement-substeps @ a6b807c · [run](https://github.com/APPARANYX/grasstex/actions/runs/37953793427) · build v29-dev

## Verdict

**QUIET: 4 of 4 pairs changed (median first part 10.05 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties -30.8% (p 0.625)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x1.256 is over the 1.25 gate.

## Paired comparison (off against on)

- **4** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.256 (gate 1.25)
- the 4 changed records first part at simulated second: min 9, p10 9, median 10.05, p90 11.1, max 11.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 107 | 74 | -8.25 | 4 | 1 | 3 | 0.625 |
| `usKills` | 53 | 54 | 0.25 | 4 | 2 | 2 | 1 |
| `geKills` | 54 | 20 | -8.5 | 4 | 1 | 3 | 0.625 |
| `fire.total` | 834 | 555 | -69.75 | 4 | 0 | 4 | 0.125 |
| `fire.hits` | 293 | 183 | -27.5 | 4 | 2 | 2 | 1 |
| `retreatSamples` | 423 | 256 | -41.75 | 4 | 1 | 3 | 0.625 |
| `movementResolver.changes` | 8946 | 8843 | -25.75 | 4 | 1 | 3 | 0.625 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 1 | 0.25 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 7 | 3 | -1 | 4 | 1 | 3 | 0.625 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 3 | -0.25 | 3 | 1 | 2 | 1 |
| `stallOutcomes.wakes` | 1 | 0 | -0.25 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 71 | 85 | 3.5 | 4 | 3 | 1 | 0.625 |
| `recon.contacts` | 1 | 8 | 1.75 | 4 | 3 | 1 | 0.625 |
| `recon.noContact` | 52 | 53 | 0.25 | 3 | 2 | 1 | 1 |
| `recon.timeouts` | 1 | 0 | -0.25 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 16 | 22 | 1.5 | 2 | 2 | 0 | 0.5 |
| `recon.reportsDelivered` | 5 | 31 | 6.5 | 4 | 3 | 1 | 0.625 |
| `recon.retriggerBlocked` | 58 | 65 | 1.75 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.meanOverall` | 344.6 | 346.8 | 0.55 | 4 | 2 | 2 | 1 |
| `squadPerformance.p10Overall` | 306.4 | 320.8 | 3.6 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 291.3 | 301.09999999999997 | 2.45 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.meanMovement` | 392.70000000000005 | 393.3 | 0.15 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanControl` | 392.59999999999997 | 391.59999999999997 | -0.25 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanCohesion` | 374.4 | 358.1 | -4.075 | 4 | 2 | 2 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 4 seeds that part earliest (simulated seconds)

movement-precision-20261009-0001 9 s (timeline) · movement-precision-20261009-0004 9 s (timeline) · movement-precision-20261009-0002 11.1 s (timeline) · movement-precision-20261009-0003 11.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=499&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=499&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=499`); it opens the seed that parts earliest, and the dropdowns choose another.

