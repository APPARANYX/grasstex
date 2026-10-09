# Benchmark run #478 · scripted scenario `hill-0008` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ 6bea24e · [run](https://github.com/APPARANYX/grasstex/actions/runs/37872064009) · build v29-dev

## Verdict

**INERT: all 7 pairs identical in every field**


## Paired comparison (off against on)

- **7** pairs (unpaired: off 0, on 0) · identical in every field: **7** · runtime errors off 0 / on 0 · wall time on/off x0.989 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 178 | 178 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 84 | 84 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 94 | 94 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 402 | 402 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 89 | 89 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1286 | 1286 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 20881 | 20881 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 208 | 208 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 227 | 227 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 154 | 154 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 64 | 64 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 195 | 195 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 590.0999999999999 | 590.0999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 547.3000000000001 | 547.3000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 485.7 | 485.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 688 | 688 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 696.8 | 696.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 540.7 | 540.7 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

hill-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=478&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=478`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

