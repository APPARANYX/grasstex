# Benchmark run #341 · scripted scenario `scripted-scout-0003` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ bac2b23 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37457339382) · build v29-dev

## Verdict

**INERT: all 7 pairs identical in every field**


## Paired comparison (off against on)

- **7** pairs (unpaired: off 0, on 0) · identical in every field: **7** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 331 | 331 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 117 | 117 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 214 | 214 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 523 | 523 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 196 | 196 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1171 | 1171 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 18141 | 18141 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 39 | 39 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 202 | 202 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 102 | 102 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 66 | 66 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 112 | 112 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 196 | 196 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 598.9 | 598.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 535.8 | 535.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 517.3000000000001 | 517.3000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 653.3000000000001 | 653.3000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 694.1999999999999 | 694.1999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 590.5 | 590.5 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

scripted-scout-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=341&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=341`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

