# Benchmark run #314 · scripted scenario `scripted-scout-0003` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ daf0636 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37256322170) · build v29-dev

## Verdict

**INERT: all 9 pairs identical in every field**


## Paired comparison (off against on)

- **9** pairs (unpaired: off 0, on 0) · identical in every field: **9** · runtime errors off 0 / on 0 · wall time on/off x0.924 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 205 | 205 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 55 | 55 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 150 | 150 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 432 | 432 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 57 | 57 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 977 | 977 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 24769 | 24769 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 111 | 111 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 94 | 94 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 90 | 90 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 773.5 | 773.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 698.8 | 698.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 652.3 | 652.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 839.9999999999999 | 839.9999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 870.3000000000001 | 870.3000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 858.1999999999999 | 858.1999999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

scripted-scout-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=314&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=314`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

