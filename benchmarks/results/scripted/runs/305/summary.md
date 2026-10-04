# Benchmark run #305 · scripted scenario `slack-wake-test-20261004` (meeting), windows `contact+60`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ 37029cf · [run](https://github.com/APPARANYX/grasstex/actions/runs/37205380802) · build v29-dev

## Verdict

**INERT: all 1 pairs identical in every field**


## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.918 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 1361 | 1361 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 90.5 | 90.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 84.3 | 84.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 83.7 | 83.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 98.7 | 98.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 97.6 | 97.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 92.8 | 92.8 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

slack-wake-test-20261004 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=305&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=305`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

