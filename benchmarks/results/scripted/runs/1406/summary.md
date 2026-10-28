# Benchmark run #1406 · scripted scenario `controller-contact-20261028` (meeting), windows `contact+60,every60`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/main-b913a742 @ b913a74 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40761256463) · build v29-dev

## Verdict

**INERT: all 8 pairs identical in every field**


## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **8** · runtime errors off 0 / on 0 · wall time on/off x0.932 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 269 | 269 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 165 | 165 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 104 | 104 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 215 | 215 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 90 | 90 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1522 | 1522 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 19216 | 19216 | 0 | 0 | 0 | 0 | 1 |
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
| `vacantObjectiveStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 231 | 231 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 24 | 24 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 129 | 129 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 120 | 120 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 186 | 186 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 686.4 | 686.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 633.7 | 633.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 565.8 | 565.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 787.1 | 787.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 793.4 | 793.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 665.8 | 665.8 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-contact-20261028 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1406&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-main-b913a742/ai_flow_live.html?bench=1406&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1406`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

