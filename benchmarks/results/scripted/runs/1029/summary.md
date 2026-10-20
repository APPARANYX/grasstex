# Benchmark run #1029 · scripted scenario `strategic-581-5km-smoke-20261019` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1`
- work/strategic-capture-boarding-20261019 @ 45f79b6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39351320873) · build v29-dev

## Verdict

**INERT: all 1 pairs identical in every field**


## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x1.006 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 158 | 158 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 74 | 74 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 957 | 957 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 920 | 920 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 79.1 | 79.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 73.1 | 73.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 55.1 | 55.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 94.5 | 94.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 94.1 | 94.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 97.9 | 97.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

strategic-581-5km-smoke-20261019 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1029&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-capture-boarding-20261019/ai_flow_live.html?bench=1029&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1029`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

