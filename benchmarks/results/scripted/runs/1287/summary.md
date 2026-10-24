# Benchmark run #1287 · 100 seeds from `cleared-20261024-m` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&squadCleared=1`
- work/squad-cleared-20261024 @ 0b99876 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40058411775) · build v29-dev

## Verdict

**INERT: all 100 pairs identical in every field**


## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **100** · runtime errors off 0 / on 0 · wall time on/off x0.975 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4908 | 4908 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2400 | 2400 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2508 | 2508 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 42162 | 42162 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 9605 | 9605 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 163096 | 163096 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 314956 | 314956 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 547 | 547 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 885 | 885 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 390 | 390 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3141 | 3141 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 131 | 131 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1987 | 1987 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 26 | 26 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 834 | 834 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 607 | 607 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 2452 | 2452 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8121.699999999999 | 8121.699999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 7509.700000000001 | 7509.700000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6475.100000000001 | 6475.100000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 9974.3 | 9974.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 9380 | 9380 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 9073.7 | 9073.7 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

cleared-20261024-m-0001 (identical) · cleared-20261024-m-0002 (identical) · cleared-20261024-m-0003 (identical) · cleared-20261024-m-0004 (identical) · cleared-20261024-m-0005 (identical) · cleared-20261024-m-0006 (identical) · cleared-20261024-m-0007 (identical) · cleared-20261024-m-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1287&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-cleared-20261024/ai_flow_live.html?bench=1287&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1287`); it opens the seed that parts earliest, and the dropdowns choose another.

