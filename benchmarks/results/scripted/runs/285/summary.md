# Benchmark run #285 · scripted scenario `squad-performance-smoke` (meeting), windows `contact+60`

- **OFF** flags: `none` · **ON** flags: `none`
- work/squad-performance-benchmark @ 69d60a8 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37148345546) · build v29-dev

## Verdict

**INERT: all 1 pairs identical in every field**


## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.993 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 1442 | 1442 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 90.6 | 90.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 88.2 | 88.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 84.5 | 84.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 100 | 100 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 97.3 | 97.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 93.5 | 93.5 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

squad-performance-smoke (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=285&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-performance-benchmark/ai_flow_live.html?bench=285&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=285`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

