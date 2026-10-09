# Benchmark run #502 · 4 seeds from `movement-precision-20261009` (ge-defend), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=2`
- work/experimental-movement-substeps @ a6b807c · [run](https://github.com/APPARANYX/grasstex/actions/runs/37953814110) · build v29-dev

## Verdict

**QUIET: 2 of 2 pairs changed (median first part 18 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +17.4% (p 0.5)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.099 (gate 1.25)
- the 2 changed records first part at simulated second: min 9, p10 9, median 18, p90 27, max 27

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 23 | 27 | 2 | 2 | 2 | 0 | 0.5 |
| `usKills` | 4 | 14 | 5 | 2 | 2 | 0 | 0.5 |
| `geKills` | 19 | 13 | -3 | 1 | 0 | 1 | 1 |
| `fire.total` | 172 | 176 | 2 | 2 | 1 | 1 | 1 |
| `fire.hits` | 55 | 86 | 15.5 | 2 | 2 | 0 | 0.5 |
| `retreatSamples` | 20 | 34 | 7 | 2 | 2 | 0 | 0.5 |
| `movementResolver.changes` | 2713 | 2690 | -11.5 | 2 | 0 | 2 | 0.5 |
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
| `recon.orders` | 41 | 44 | 1.5 | 1 | 1 | 0 | 1 |
| `recon.contacts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 21 | 22 | 0.5 | 1 | 1 | 0 | 1 |
| `recon.timeouts` | 13 | 12 | -0.5 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 5 | 6 | 0.5 | 1 | 1 | 0 | 1 |
| `recon.reportsDelivered` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 16 | 15 | -0.5 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 183.2 | 180.4 | -1.4 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.p10Overall` | 166.5 | 161.5 | -2.5 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 177.8 | 169.9 | -3.95 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMovement` | 199.4 | 199.4 | 0 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanControl` | 198.9 | 199 | 0.05 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 171.10000000000002 | 171.1 | 0 | 2 | 1 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

movement-precision-20261009-0003 9 s (timeline) · movement-precision-20261009-0004 27 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=502&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=502&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=502`); it opens the seed that parts earliest, and the dropdowns choose another.

