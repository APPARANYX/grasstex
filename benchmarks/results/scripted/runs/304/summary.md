# Benchmark run #304 · scripted scenario `slack-roundtrip-20261004b` (meeting), windows `contact+60`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ 37029cf · [run](https://github.com/APPARANYX/grasstex/actions/runs/37204903139) · build v29-dev

## Verdict

**INERT: all 1 pairs identical in every field**


## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.905 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 1195 | 1195 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 92.2 | 92.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 89.5 | 89.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 85 | 85 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 100 | 100 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 98.2 | 98.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 100 | 100 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

slack-roundtrip-20261004b (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=304&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=304`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

