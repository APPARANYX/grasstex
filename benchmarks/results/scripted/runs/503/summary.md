# Benchmark run #503 · 4 seeds from `movement-precision-20261009` (ge-defend), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=3`
- work/experimental-movement-substeps @ a6b807c · [run](https://github.com/APPARANYX/grasstex/actions/runs/37953819435) · build v29-dev

## Verdict

**QUIET: 2 of 2 pairs changed (median first part 8.55 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties -43.5% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.155 (gate 1.25)
- the 2 changed records first part at simulated second: min 8.1, p10 8.1, median 8.55, p90 9, max 9

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 23 | 13 | -5 | 2 | 1 | 1 | 1 |
| `usKills` | 4 | 3 | -0.5 | 1 | 0 | 1 | 1 |
| `geKills` | 19 | 10 | -4.5 | 2 | 1 | 1 | 1 |
| `fire.total` | 172 | 70 | -51 | 2 | 0 | 2 | 0.5 |
| `fire.hits` | 55 | 37 | -9 | 2 | 1 | 1 | 1 |
| `retreatSamples` | 20 | 19 | -0.5 | 2 | 1 | 1 | 1 |
| `movementResolver.changes` | 2713 | 2578 | -67.5 | 2 | 0 | 2 | 0.5 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 3 | -0.5 | 1 | 0 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 41 | 40 | -0.5 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `recon.noContact` | 21 | 20 | -0.5 | 1 | 0 | 1 | 1 |
| `recon.timeouts` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 5 | 4 | -0.5 | 2 | 1 | 1 | 1 |
| `recon.reportsDelivered` | 8 | 8 | 0 | 2 | 1 | 1 | 1 |
| `recon.retriggerBlocked` | 16 | 14 | -1 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanOverall` | 183.2 | 179.4 | -1.9 | 1 | 0 | 1 | 1 |
| `squadPerformance.p10Overall` | 166.5 | 160.6 | -2.95 | 2 | 1 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 177.8 | 171.7 | -3.05 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanMovement` | 199.4 | 197.9 | -0.75 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanControl` | 198.9 | 199 | 0.05 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 171.10000000000002 | 167.2 | -1.95 | 2 | 0 | 2 | 0.5 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

movement-precision-20261009-0004 8.1 s (timeline) · movement-precision-20261009-0003 9 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=503&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=503&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=503`); it opens the seed that parts earliest, and the dropdowns choose another.

