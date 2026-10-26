# Benchmark run #1383 · scripted scenario `controller-contact-20261026` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/tactical-contact-baseline-3357e587 @ 3357e58 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40254945938) · build v29-dev

## Verdict

**INERT: all 1 pairs identical in every field**


## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.974 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 54 | 54 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 274 | 274 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 133 | 133 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1869 | 1869 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 3305 | 3305 | 0 | 0 | 0 | 0 | 1 |
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
| `vacantObjectiveStalls.length` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 80.1 | 80.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 74 | 74 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 62.9 | 62.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 99.9 | 99.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 96.4 | 96.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 87 | 87 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-contact-20261026 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1383&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactical-contact-baseline-3357e587/ai_flow_live.html?bench=1383&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1383`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

