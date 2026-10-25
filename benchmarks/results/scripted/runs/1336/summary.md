# Benchmark run #1336 · scripted scenario `controller-runtime-20261025` (meeting), windows `0+600`

- **OFF** flags: `none` · **ON** flags: `none`
- claude/project-thread-a5sq10 @ adf6e5d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40220013242) · build v29-dev

## Verdict

**INERT: all 1 pairs identical in every field**


## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 41 | 41 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 28 | 28 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 116 | 116 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 70 | 70 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 981 | 981 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 1769 | 1769 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 86.6 | 86.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 74.7 | 74.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 74.2 | 74.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 98.9 | 98.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 97 | 97 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 95.9 | 95.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-runtime-20261025 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1336&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1336`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

