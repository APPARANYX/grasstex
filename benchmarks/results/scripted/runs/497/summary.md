# Benchmark run #497 · scripted scenario `live-mv0z6zy9-4lhnw` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ fa358a1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37937462782) · build v29-dev

## Verdict

**INERT: all 7 pairs identical in every field**


## Paired comparison (off against on)

- **7** pairs (unpaired: off 0, on 0) · identical in every field: **7** · runtime errors off 0 / on 0 · wall time on/off x1.046 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 306 | 306 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 124 | 124 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 182 | 182 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 385 | 385 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 161 | 161 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 903 | 903 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 21725 | 21725 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 179 | 179 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 115 | 115 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 148 | 148 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 614 | 614 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 566.3000000000001 | 566.3000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 529.7 | 529.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 680.6 | 680.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 694.4 | 694.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 620.9 | 620.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

live-mv0z6zy9-4lhnw (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=497&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=497`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

