# Benchmark run #506 · scripted scenario `hill-0008` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=3`
- work/experimental-movement-substeps @ 0320e46 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37958620569) · build v29-dev

## Verdict

**one battle per arm, 8 of 8 records changed, first part at 9 s, casualties 163 to 194: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.054 (gate 1.25)
- the 8 changed records first part at simulated second: min 9, p10 9, median 9, p90 9, max 9

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 163 | 194 | 3.875 | 8 | 6 | 2 | 0.2891 |
| `usKills` | 99 | 109 | 1.25 | 7 | 4 | 3 | 1 |
| `geKills` | 64 | 85 | 2.625 | 8 | 7 | 1 | 0.0703 |
| `fire.total` | 209 | 293 | 10.5 | 8 | 5 | 3 | 0.7266 |
| `fire.hits` | 75 | 103 | 3.5 | 8 | 4 | 4 | 1 |
| `retreatSamples` | 1253 | 1348 | 11.875 | 8 | 5 | 3 | 0.7266 |
| `movementResolver.changes` | 16472 | 15264 | -151 | 8 | 3 | 5 | 0.7266 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 2 | 4 | 0.25 | 5 | 3 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 13 | 12 | -0.125 | 3 | 1 | 2 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 205 | 169 | -4.5 | 6 | 0 | 6 | 0.0313 |
| `recon.contacts` | 15 | 14 | -0.125 | 5 | 2 | 3 | 1 |
| `recon.noContact` | 62 | 71 | 1.125 | 6 | 6 | 0 | 0.0313 |
| `recon.timeouts` | 77 | 66 | -1.375 | 6 | 1 | 5 | 0.2188 |
| `recon.cancelled` | 42 | 11 | -3.875 | 8 | 0 | 8 | 0.0078 |
| `recon.reportsDelivered` | 72 | 82 | 1.25 | 8 | 5 | 3 | 0.7266 |
| `recon.retriggerBlocked` | 91 | 87 | -0.5 | 6 | 1 | 5 | 0.2188 |
| `squadPerformance.meanOverall` | 606.8000000000001 | 701 | 11.775 | 8 | 5 | 3 | 0.7266 |
| `squadPerformance.p10Overall` | 560.1999999999999 | 634.8000000000001 | 9.325 | 7 | 3 | 4 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 526.5000000000001 | 590.8000000000001 | 8.0375 | 8 | 5 | 3 | 0.7266 |
| `squadPerformance.meanMovement` | 684.5 | 789.6 | 13.1375 | 8 | 7 | 1 | 0.0703 |
| `squadPerformance.meanControl` | 697.4 | 795.4 | 12.25 | 6 | 3 | 3 | 1 |
| `squadPerformance.meanCohesion` | 584.3000000000001 | 720.5999999999999 | 17.0375 | 8 | 8 | 0 | 0.0078 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

hill-0008 9 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=506&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=506&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=506`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

