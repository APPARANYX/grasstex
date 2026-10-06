# Benchmark run #340 · scripted scenario `scripted-scout-0003` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- work/benchmark-known-good-control @ 4e01e42 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37450289672) · build v29-dev

## Verdict

**INERT: all 9 pairs identical in every field**


## Paired comparison (off against on)

- **9** pairs (unpaired: off 0, on 0) · identical in every field: **9** · runtime errors off 0 / on 0 · wall time on/off x0.978 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 216 | 216 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 179 | 179 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 469 | 469 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 76 | 76 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1448 | 1448 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 22580 | 22580 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 127 | 127 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 87 | 87 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 39 | 39 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 110 | 110 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 770.2 | 770.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 729.9 | 729.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 638 | 638 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 856.8999999999999 | 856.8999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 881.6 | 881.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 837.1000000000001 | 837.1000000000001 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

scripted-scout-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=340&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/benchmark-known-good-control/ai_flow_live.html?bench=340&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=340`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

