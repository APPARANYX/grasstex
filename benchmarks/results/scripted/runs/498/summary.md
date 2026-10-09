# Benchmark run #498 · 4 seeds from `movement-precision-20261009` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=2`
- work/experimental-movement-substeps @ a6b807c · [run](https://github.com/APPARANYX/grasstex/actions/runs/37953789430) · build v29-dev

## Verdict

**QUIET: 4 of 4 pairs changed (median first part 9 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties -22.4% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **4** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.027 (gate 1.25)
- the 4 changed records first part at simulated second: min 6, p10 6, median 9, p90 11.1, max 11.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 107 | 83 | -6 | 4 | 2 | 2 | 1 |
| `usKills` | 53 | 40 | -3.25 | 4 | 2 | 2 | 1 |
| `geKills` | 54 | 43 | -2.75 | 4 | 1 | 3 | 0.625 |
| `fire.total` | 834 | 564 | -67.5 | 4 | 1 | 3 | 0.625 |
| `fire.hits` | 293 | 220 | -18.25 | 4 | 2 | 2 | 1 |
| `retreatSamples` | 423 | 334 | -22.25 | 4 | 0 | 4 | 0.125 |
| `movementResolver.changes` | 8946 | 8717 | -57.25 | 4 | 1 | 3 | 0.625 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 7 | 8 | 0.25 | 3 | 2 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 2 | -0.5 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.wakes` | 1 | 0 | -0.25 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 71 | 72 | 0.25 | 2 | 1 | 1 | 1 |
| `recon.contacts` | 1 | 2 | 0.25 | 1 | 1 | 0 | 1 |
| `recon.noContact` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1 | 0 | -0.25 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 16 | 16 | 0 | 3 | 1 | 2 | 1 |
| `recon.reportsDelivered` | 5 | 15 | 2.5 | 2 | 2 | 0 | 0.5 |
| `recon.retriggerBlocked` | 58 | 60 | 0.5 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanOverall` | 344.6 | 347 | 0.6 | 4 | 2 | 2 | 1 |
| `squadPerformance.p10Overall` | 306.4 | 311.8 | 1.35 | 4 | 2 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 291.3 | 299.3 | 2 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.meanMovement` | 392.70000000000005 | 396.6 | 0.975 | 4 | 4 | 0 | 0.125 |
| `squadPerformance.meanControl` | 392.59999999999997 | 390.6 | -0.5 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.meanCohesion` | 374.4 | 375.40000000000003 | 0.25 | 4 | 1 | 3 | 0.625 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 4 seeds that part earliest (simulated seconds)

movement-precision-20261009-0002 6 s (timeline) · movement-precision-20261009-0001 9 s (timeline) · movement-precision-20261009-0004 9 s (timeline) · movement-precision-20261009-0003 11.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=498&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=498&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=498`); it opens the seed that parts earliest, and the dropdowns choose another.

