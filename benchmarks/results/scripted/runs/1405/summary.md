# Benchmark run #1405 · scripted scenario `controller-contact-20261028` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- work/pin/main-b913a742 @ b913a74 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40761229576) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x0.987 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 105 | 105 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 334 | 334 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 3119 | 3119 | 0 | 0 | 0 | 0 | 1 |
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
| `targetlessStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 47 | 47 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 257.6 | 257.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 227 | 227 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 211.5 | 211.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 290.2 | 290.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 296.5 | 296.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 265.2 | 265.2 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-contact-20261028 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1405&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-main-b913a742/ai_flow_live.html?bench=1405&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1405`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

