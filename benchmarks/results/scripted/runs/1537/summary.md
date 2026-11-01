# Benchmark run #1537 · 20 seeds from `o703` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/main-ff508237 @ ff50823 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41256126607) · build v29-dev

## Verdict

**INERT: all 19 pairs identical in every field**


## Paired comparison (off against on)

- **19** pairs (unpaired: off 0, on 0) · identical in every field: **19** · runtime errors off 0 / on 0 · wall time on/off x0.946 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 885 | 885 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 411 | 411 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 474 | 474 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 13477 | 13477 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1921 | 1921 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 40846 | 40846 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 68195 | 68195 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 88 | 88 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 191 | 191 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 81 | 81 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 551 | 551 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 352 | 352 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 151 | 151 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 105 | 105 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 429 | 429 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1510.4 | 1510.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 1410.6 | 1410.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1148.5000000000002 | 1148.5000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 1895.2999999999997 | 1895.2999999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1794.4 | 1794.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1726.9999999999998 | 1726.9999999999998 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

o703-0001 (identical) · o703-0002 (identical) · o703-0003 (identical) · o703-0004 (identical) · o703-0005 (identical) · o703-0006 (identical) · o703-0007 (identical) · o703-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1537&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-main-ff508237/ai_flow_live.html?bench=1537&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1537`); it opens the seed that parts earliest, and the dropdowns choose another.

