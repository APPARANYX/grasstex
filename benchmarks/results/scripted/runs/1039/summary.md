# Benchmark run #1039 · 50 seeds from `strategic-581-5km-screen-20261019` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1`
- work/strategic-transport-resume-20261020 @ 318ebfb · [run](https://github.com/APPARANYX/grasstex/actions/runs/39359352501) · build v29-dev

## Verdict

**INERT: all 50 pairs identical in every field**


## Paired comparison (off against on)

- **50** pairs (unpaired: off 0, on 0) · identical in every field: **50** · runtime errors off 0 / on 0 · wall time on/off x0.986 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2599 | 2599 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1127 | 1127 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1472 | 1472 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 12402 | 12402 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 5476 | 5476 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 86828 | 86828 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 68586 | 68586 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 373 | 373 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 222 | 222 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 222 | 222 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 270 | 270 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 104 | 104 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 525 | 525 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 3169 | 3169 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 525 | 525 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 3169 | 3169 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 347 | 347 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 34 | 34 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 138 | 138 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 140 | 140 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 164 | 164 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 198 | 198 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4078.6999999999985 | 4078.6999999999985 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 3698.3000000000006 | 3698.3000000000006 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 2980.3999999999996 | 2980.3999999999996 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 4773.700000000001 | 4773.700000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 4883.2 | 4883.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4877.8 | 4877.8 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

strategic-581-5km-screen-20261019-0001 (identical) · strategic-581-5km-screen-20261019-0002 (identical) · strategic-581-5km-screen-20261019-0003 (identical) · strategic-581-5km-screen-20261019-0004 (identical) · strategic-581-5km-screen-20261019-0005 (identical) · strategic-581-5km-screen-20261019-0006 (identical) · strategic-581-5km-screen-20261019-0007 (identical) · strategic-581-5km-screen-20261019-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1039&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-transport-resume-20261020/ai_flow_live.html?bench=1039&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1039`); it opens the seed that parts earliest, and the dropdowns choose another.

