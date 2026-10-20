# Benchmark run #1031 · scripted scenario `live-mvfkx3w6-8ekep` (meeting), windows `0+3600`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1`
- work/strategic-benchmark-endurance-20261019 @ 8c80298 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39352392335) · build v29-dev

## Verdict

**INERT: all 1 pairs identical in every field**


## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x1 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 143 | 143 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 69 | 69 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 74 | 74 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 695 | 695 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 305 | 305 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 40568 | 40568 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 7864 | 7864 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 53 | 53 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 53 | 53 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 26 | 26 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 75.6 | 75.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 72.2 | 72.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 53.8 | 53.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 94.1 | 94.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 95.3 | 95.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 97.5 | 97.5 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

live-mvfkx3w6-8ekep (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1031&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-benchmark-endurance-20261019/ai_flow_live.html?bench=1031&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1031`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

