# Benchmark run #501 · 4 seeds from `movement-precision-20261009` (us-defend), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=3`
- work/experimental-movement-substeps @ a6b807c · [run](https://github.com/APPARANYX/grasstex/actions/runs/37953808265) · build v29-dev

## Verdict

**QUIET: 2 of 2 pairs changed (median first part 16.05 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties -27.3% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.14 (gate 1.25)
- the 2 changed records first part at simulated second: min 9, p10 9, median 16.05, p90 23.1, max 23.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 22 | 16 | -3 | 2 | 1 | 1 | 1 |
| `usKills` | 10 | 5 | -2.5 | 2 | 0 | 2 | 0.5 |
| `geKills` | 12 | 11 | -0.5 | 2 | 1 | 1 | 1 |
| `fire.total` | 163 | 106 | -28.5 | 2 | 0 | 2 | 0.5 |
| `fire.hits` | 63 | 44 | -9.5 | 2 | 0 | 2 | 0.5 |
| `retreatSamples` | 187 | 71 | -58 | 2 | 1 | 1 | 1 |
| `movementResolver.changes` | 2658 | 2685 | 13.5 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 2 | 0 | -1 | 2 | 0 | 2 | 0.5 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 10 | 7 | -1.5 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 57 | 55 | -1 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 2 | 4 | 1 | 2 | 1 | 1 | 1 |
| `recon.noContact` | 28 | 25 | -1.5 | 2 | 0 | 2 | 0.5 |
| `recon.timeouts` | 19 | 20 | 0.5 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 5 | 5 | 0 | 2 | 1 | 1 | 1 |
| `recon.reportsDelivered` | 0 | 8 | 4 | 1 | 1 | 0 | 1 |
| `recon.retriggerBlocked` | 15 | 14 | -0.5 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 177.6 | 182.6 | 2.5 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.p10Overall` | 164 | 166.9 | 1.45 | 2 | 1 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 166 | 177.89999999999998 | 5.95 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanMovement` | 199.60000000000002 | 200 | 0.2 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanControl` | 198.3 | 199.5 | 0.6 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanCohesion` | 154.5 | 154.8 | 0.15 | 2 | 1 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

movement-precision-20261009-0003 9 s (timeline) · movement-precision-20261009-0004 23.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=501&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=501&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=501`); it opens the seed that parts earliest, and the dropdowns choose another.

