# Benchmark run #500 · 4 seeds from `movement-precision-20261009` (us-defend), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=2`
- work/experimental-movement-substeps @ a6b807c · [run](https://github.com/APPARANYX/grasstex/actions/runs/37953800652) · build v29-dev

## Verdict

**QUIET: 2 of 2 pairs changed (median first part 16.05 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties -13.6% (p 0.5)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.045 (gate 1.25)
- the 2 changed records first part at simulated second: min 9, p10 9, median 16.05, p90 23.1, max 23.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 22 | 19 | -1.5 | 2 | 0 | 2 | 0.5 |
| `usKills` | 10 | 11 | 0.5 | 2 | 1 | 1 | 1 |
| `geKills` | 12 | 8 | -2 | 1 | 0 | 1 | 1 |
| `fire.total` | 163 | 108 | -27.5 | 2 | 0 | 2 | 0.5 |
| `fire.hits` | 63 | 47 | -8 | 2 | 0 | 2 | 0.5 |
| `retreatSamples` | 187 | 99 | -44 | 2 | 1 | 1 | 1 |
| `movementResolver.changes` | 2658 | 2682 | 12 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 2 | 2 | 0 | 2 | 1 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 10 | 7 | -1.5 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 57 | 56 | -0.5 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 2 | 0 | -1 | 1 | 0 | 1 | 1 |
| `recon.noContact` | 28 | 26 | -1 | 2 | 0 | 2 | 0.5 |
| `recon.timeouts` | 19 | 18 | -0.5 | 2 | 1 | 1 | 1 |
| `recon.cancelled` | 5 | 9 | 2 | 2 | 2 | 0 | 0.5 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 15 | 14 | -0.5 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 177.6 | 178 | 0.2 | 1 | 1 | 0 | 1 |
| `squadPerformance.p10Overall` | 164 | 167.3 | 1.65 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 166 | 163.3 | -1.35 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanMovement` | 199.60000000000002 | 200 | 0.2 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanControl` | 198.3 | 198.4 | 0.05 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanCohesion` | 154.5 | 160.7 | 3.1 | 2 | 1 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

movement-precision-20261009-0003 9 s (timeline) · movement-precision-20261009-0004 23.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=500&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=500&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=500`); it opens the seed that parts earliest, and the dropdowns choose another.

