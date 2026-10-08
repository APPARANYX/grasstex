# Benchmark run #463 · scripted scenario `scripted-scout-0003` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ b0df4e4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37850989801) · build v29-dev

## Verdict

**INERT: all 8 pairs identical in every field**


## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **8** · runtime errors off 0 / on 0 · wall time on/off x0.998 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 298 | 298 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 188 | 188 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 110 | 110 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 274 | 274 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 106 | 106 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1962 | 1962 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 19367 | 19367 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 215 | 215 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 127 | 127 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 152 | 152 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 156 | 156 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 694.8 | 694.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 646.1 | 646.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 559.6 | 559.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 798.7 | 798.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 795 | 795 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 717.5999999999999 | 717.5999999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

scripted-scout-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=463&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=463`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

