# Benchmark run #1544 · 60 seeds from `c13ictl` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/main-ff508237 @ ff50823 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41256919105) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x0.947 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2218 | 2218 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 985 | 985 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1233 | 1233 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 33402 | 33402 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 4769 | 4769 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 96483 | 96483 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 142907 | 142907 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 74 | 74 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 576 | 576 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 166 | 166 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1441 | 1441 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 200 | 200 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 674 | 674 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 35 | 35 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 463 | 463 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 898 | 898 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 638 | 638 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 5009.6 | 5009.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4641.9 | 4641.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4171.999999999999 | 4171.999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5993.199999999999 | 5993.199999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5758.1 | 5758.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5392.299999999998 | 5392.299999999998 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c13ictl-0001 (identical) · c13ictl-0002 (identical) · c13ictl-0003 (identical) · c13ictl-0004 (identical) · c13ictl-0005 (identical) · c13ictl-0006 (identical) · c13ictl-0007 (identical) · c13ictl-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1544&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-main-ff508237/ai_flow_live.html?bench=1544&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1544`); it opens the seed that parts earliest, and the dropdowns choose another.

