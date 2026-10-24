# Benchmark run #1288 · 100 seeds from `cleared-20261024-u` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&squadCleared=1`
- work/squad-cleared-20261024 @ 0b99876 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40058414036) · build v29-dev

## Verdict

**INERT: all 100 pairs identical in every field**


## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **100** · runtime errors off 0 / on 0 · wall time on/off x0.985 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4228 | 4228 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2068 | 2068 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2160 | 2160 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 35082 | 35082 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 8013 | 8013 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 189500 | 189500 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 220022 | 220022 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 24 | 24 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 24 | 24 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 198 | 198 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 625 | 625 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 379 | 379 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1923 | 1923 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 154 | 154 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1103 | 1103 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 104 | 104 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 428 | 428 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 605 | 605 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1163 | 1163 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8445 | 8445 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 7749.7 | 7749.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7130.499999999999 | 7130.499999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 9988.199999999992 | 9988.199999999992 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 9693.599999999995 | 9693.599999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 9060.800000000001 | 9060.800000000001 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

cleared-20261024-u-0001 (identical) · cleared-20261024-u-0002 (identical) · cleared-20261024-u-0003 (identical) · cleared-20261024-u-0004 (identical) · cleared-20261024-u-0005 (identical) · cleared-20261024-u-0006 (identical) · cleared-20261024-u-0007 (identical) · cleared-20261024-u-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1288&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-cleared-20261024/ai_flow_live.html?bench=1288&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1288`); it opens the seed that parts earliest, and the dropdowns choose another.

