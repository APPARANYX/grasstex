# Benchmark run #1364 · scripted scenario `controller-runtime-20261025` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- claude/project-thread-a5sq10 @ 1f61da3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40241215025) · build v29-dev

## Verdict

**INERT: all 1 pairs identical in every field**


## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.962 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 46 | 46 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 215 | 215 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 98 | 98 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1129 | 1129 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 2796 | 2796 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 26 | 26 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 82.5 | 82.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 79 | 79 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 64.9 | 64.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 99.9 | 99.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 94.7 | 94.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 90.8 | 90.8 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-runtime-20261025 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1364&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1364`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

