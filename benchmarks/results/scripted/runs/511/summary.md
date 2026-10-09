# Benchmark run #511 · scripted scenario `standard-benchmark-meeting-s1-b0001` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=2`
- work/experimental-movement-substeps @ 0320e46 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37958648103) · build v29-dev

## Verdict

**one battle per arm, 8 of 8 records changed, first part at 6 s, casualties 251 to 316: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.004 (gate 1.25)
- the 8 changed records first part at simulated second: min 6, p10 6, median 6, p90 6, max 6

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 251 | 316 | 8.125 | 8 | 7 | 1 | 0.0703 |
| `usKills` | 43 | 81 | 4.75 | 8 | 5 | 3 | 0.7266 |
| `geKills` | 208 | 235 | 3.375 | 6 | 6 | 0 | 0.0313 |
| `fire.total` | 249 | 327 | 9.75 | 6 | 4 | 2 | 0.6875 |
| `fire.hits` | 95 | 108 | 1.625 | 6 | 4 | 2 | 0.6875 |
| `retreatSamples` | 1854 | 1013 | -105.125 | 6 | 0 | 6 | 0.0313 |
| `movementResolver.changes` | 21361 | 20477 | -110.5 | 8 | 2 | 6 | 0.2891 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 11 | 2 | -1.125 | 4 | 0 | 4 | 0.125 |
| `loopAlerts.length` | 11 | 1 | -1.25 | 5 | 0 | 5 | 0.0625 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 12 | 26 | 1.75 | 8 | 8 | 0 | 0.0078 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 221 | 223 | 0.25 | 8 | 4 | 4 | 1 |
| `recon.contacts` | 8 | 8 | 0 | 6 | 3 | 3 | 1 |
| `recon.noContact` | 143 | 137 | -0.75 | 6 | 3 | 3 | 1 |
| `recon.timeouts` | 1 | 0 | -0.125 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 61 | 73 | 1.5 | 7 | 5 | 2 | 0.4531 |
| `recon.reportsDelivered` | 24 | 46 | 2.75 | 8 | 5 | 3 | 0.7266 |
| `recon.retriggerBlocked` | 177 | 180 | 0.375 | 5 | 3 | 2 | 1 |
| `squadPerformance.meanOverall` | 686.8 | 711.3000000000001 | 3.0625 | 8 | 8 | 0 | 0.0078 |
| `squadPerformance.p10Overall` | 644.0000000000001 | 654.5 | 1.3125 | 4 | 2 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 546.8 | 613.5999999999999 | 8.35 | 8 | 8 | 0 | 0.0078 |
| `squadPerformance.meanMovement` | 792.5 | 793.8000000000001 | 0.1625 | 7 | 6 | 1 | 0.125 |
| `squadPerformance.meanControl` | 792.3 | 798 | 0.7125 | 7 | 7 | 0 | 0.0156 |
| `squadPerformance.meanCohesion` | 704.4 | 716.4000000000001 | 1.5 | 8 | 7 | 1 | 0.0703 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

standard-benchmark-meeting-s1-b0001 6 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=511&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=511&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=511`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

