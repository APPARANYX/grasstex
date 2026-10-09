# Benchmark run #512 · scripted scenario `standard-benchmark-meeting-s1-b0001` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=3`
- work/experimental-movement-substeps @ 0320e46 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37958658729) · build v29-dev

## Verdict

**one battle per arm, 8 of 8 records changed, first part at 6 s, casualties 251 to 319: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.136 (gate 1.25)
- the 8 changed records first part at simulated second: min 6, p10 6, median 6, p90 6, max 6

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 251 | 319 | 8.5 | 8 | 8 | 0 | 0.0078 |
| `usKills` | 43 | 154 | 13.875 | 8 | 8 | 0 | 0.0078 |
| `geKills` | 208 | 165 | -5.375 | 7 | 1 | 6 | 0.125 |
| `fire.total` | 249 | 341 | 11.5 | 8 | 5 | 3 | 0.7266 |
| `fire.hits` | 95 | 148 | 6.625 | 8 | 6 | 2 | 0.2891 |
| `retreatSamples` | 1854 | 1872 | 2.25 | 6 | 1 | 5 | 0.2188 |
| `movementResolver.changes` | 21361 | 20845 | -64.5 | 8 | 3 | 5 | 0.7266 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 11 | 3 | -1 | 4 | 0 | 4 | 0.125 |
| `loopAlerts.length` | 11 | 9 | -0.25 | 6 | 3 | 3 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 12 | 16 | 0.5 | 4 | 4 | 0 | 0.125 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 221 | 187 | -4.25 | 6 | 0 | 6 | 0.0313 |
| `recon.contacts` | 8 | 0 | -1 | 8 | 0 | 8 | 0.0078 |
| `recon.noContact` | 143 | 140 | -0.375 | 8 | 5 | 3 | 0.7266 |
| `recon.timeouts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 61 | 43 | -2.25 | 7 | 0 | 7 | 0.0156 |
| `recon.reportsDelivered` | 24 | 0 | -3 | 8 | 0 | 8 | 0.0078 |
| `recon.retriggerBlocked` | 177 | 157 | -2.5 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanOverall` | 686.8 | 688.9000000000001 | 0.2625 | 8 | 5 | 3 | 0.7266 |
| `squadPerformance.p10Overall` | 644.0000000000001 | 643.5 | -0.0625 | 6 | 2 | 4 | 0.6875 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 546.8 | 558.4 | 1.45 | 7 | 3 | 4 | 1 |
| `squadPerformance.meanMovement` | 792.5 | 794.8000000000001 | 0.2875 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.meanControl` | 792.3 | 794.1 | 0.225 | 6 | 3 | 3 | 1 |
| `squadPerformance.meanCohesion` | 704.4 | 706.3 | 0.2375 | 8 | 3 | 5 | 0.7266 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

standard-benchmark-meeting-s1-b0001 6 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=512&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=512&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=512`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

