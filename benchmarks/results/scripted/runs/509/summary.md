# Benchmark run #509 · scripted scenario `hill-0002` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=2`
- work/experimental-movement-substeps @ 0320e46 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37958635974) · build v29-dev

## Verdict

**one battle per arm, 8 of 8 records changed, first part at 5.1 s, casualties 280 to 257: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.01 (gate 1.25)
- the 8 changed records first part at simulated second: min 5.1, p10 5.1, median 5.1, p90 5.1, max 5.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 280 | 257 | -2.875 | 7 | 2 | 5 | 0.4531 |
| `usKills` | 99 | 73 | -3.25 | 5 | 2 | 3 | 1 |
| `geKills` | 181 | 184 | 0.375 | 7 | 5 | 2 | 0.4531 |
| `fire.total` | 311 | 216 | -11.875 | 7 | 3 | 4 | 1 |
| `fire.hits` | 114 | 104 | -1.25 | 7 | 3 | 4 | 1 |
| `retreatSamples` | 2512 | 2582 | 8.75 | 7 | 5 | 2 | 0.4531 |
| `movementResolver.changes` | 15745 | 17055 | 163.75 | 8 | 8 | 0 | 0.0078 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 4 | 0 | -0.5 | 2 | 0 | 2 | 0.5 |
| `loopAlerts.length` | 2 | 8 | 0.75 | 4 | 3 | 1 | 0.625 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 49 | 24 | -3.125 | 8 | 0 | 8 | 0.0078 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 252 | 278 | 3.25 | 6 | 6 | 0 | 0.0313 |
| `recon.contacts` | 26 | 9 | -2.125 | 7 | 0 | 7 | 0.0156 |
| `recon.noContact` | 75 | 76 | 0.125 | 1 | 1 | 0 | 1 |
| `recon.timeouts` | 85 | 79 | -0.75 | 7 | 1 | 6 | 0.125 |
| `recon.cancelled` | 61 | 107 | 5.75 | 8 | 8 | 0 | 0.0078 |
| `recon.reportsDelivered` | 83 | 0 | -10.375 | 7 | 0 | 7 | 0.0156 |
| `recon.retriggerBlocked` | 70 | 67 | -0.375 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanOverall` | 685.6 | 686.8000000000001 | 0.15 | 8 | 3 | 5 | 0.7266 |
| `squadPerformance.p10Overall` | 644.4 | 639.4000000000001 | -0.625 | 5 | 1 | 4 | 0.375 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 567.3 | 567.2 | -0.0125 | 8 | 5 | 3 | 0.7266 |
| `squadPerformance.meanMovement` | 795.5 | 796.0999999999999 | 0.075 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.meanControl` | 797.4 | 795.8 | -0.2 | 7 | 3 | 4 | 1 |
| `squadPerformance.meanCohesion` | 660.1 | 674.5 | 1.8 | 8 | 5 | 3 | 0.7266 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

hill-0002 5.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=509&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=509&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=509`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

