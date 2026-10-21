# Benchmark run #1204 · scripted scenario `phase-c-natural-20261012-0002` (meeting), windows `0+600`

- **OFF** flags: `localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1` · **ON** flags: `localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/reactive-fire-maneuver-20261021 @ 228c726 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39685964817) · build v29-dev

## Verdict

**INERT: all 1 pairs identical in every field**


## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x1.047 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 39 | 39 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 130 | 130 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 65 | 65 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 996 | 996 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 1485 | 1485 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 83.7 | 83.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 73.3 | 73.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 69.1 | 69.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 97.8 | 97.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 93.5 | 93.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 95.9 | 95.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

phase-c-natural-20261012-0002 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1204&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/reactive-fire-maneuver-20261021/ai_flow_live.html?bench=1204&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1204`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

