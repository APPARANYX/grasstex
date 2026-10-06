# Benchmark run #344 · scripted scenario `scripted-scout-0003` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `squadBroadcast=1&fireteamSplit=1`
- main @ e5f5c1a · [run](https://github.com/APPARANYX/grasstex/actions/runs/37462823610) · build v29-dev

## Verdict

**INERT: all 5 pairs identical in every field**


## Paired comparison (off against on)

- **5** pairs (unpaired: off 0, on 0) · identical in every field: **5** · runtime errors off 0 / on 0 · wall time on/off x0.99 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 190 | 190 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 48 | 48 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 142 | 142 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 256 | 256 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 94 | 94 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 417 | 417 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 11463 | 11463 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 148 | 148 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 43 | 43 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 80 | 80 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 134 | 134 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 428.79999999999995 | 428.79999999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 383.6 | 383.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 385.9 | 385.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 460.4 | 460.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 491.99999999999994 | 491.99999999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 400 | 400 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

scripted-scout-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=344&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=344`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

