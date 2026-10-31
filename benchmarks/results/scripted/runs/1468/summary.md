# Benchmark run #1468 · 60 seeds from `pr698-sw` (meeting), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&supportWait=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- claude/project-thread-jxet0c @ 58bef7c · [run](https://github.com/APPARANYX/grasstex/actions/runs/41189530097) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x0.993 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2376 | 2376 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1034 | 1034 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1342 | 1342 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 59208 | 59208 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 5217 | 5217 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 123685 | 123685 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 285998 | 285998 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 41 | 41 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 79 | 79 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 286 | 286 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 956 | 956 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 298 | 298 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1893 | 1893 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 123 | 123 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 898 | 898 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 785 | 785 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 575 | 575 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1470 | 1470 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4782.500000000001 | 4782.500000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4472.299999999999 | 4472.299999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3598.6999999999994 | 3598.6999999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5982.999999999999 | 5982.999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5608.200000000001 | 5608.200000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5581.7 | 5581.7 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr698-sw-0001 (identical) · pr698-sw-0002 (identical) · pr698-sw-0003 (identical) · pr698-sw-0004 (identical) · pr698-sw-0005 (identical) · pr698-sw-0006 (identical) · pr698-sw-0007 (identical) · pr698-sw-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1468&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1468`); it opens the seed that parts earliest, and the dropdowns choose another.

