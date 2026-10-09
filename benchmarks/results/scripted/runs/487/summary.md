# Benchmark run #487 · 20 seeds from `local361a` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localMissionWake=1`
- work/issue361-local-mission-stall @ ca463a1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37880812561) · build v29-dev

## Verdict

**INERT: all 162 pairs identical in every field**


## Paired comparison (off against on)

- **162** pairs (unpaired: off 0, on 0) · identical in every field: **162** · runtime errors off 0 / on 0 · wall time on/off x0.987 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4788 | 4788 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2360 | 2360 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2428 | 2428 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 6243 | 6243 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2235 | 2235 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 35103 | 35103 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 300123 | 300123 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 69 | 69 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 252 | 252 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3035 | 3035 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 369 | 369 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1289 | 1289 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 820 | 820 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 490 | 490 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 1844 | 1844 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1523 | 1523 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 14219.199999999997 | 14219.199999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 13038.400000000016 | 13038.400000000016 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 12031.200000000003 | 12031.200000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 16039.2 | 16039.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 16146.499999999995 | 16146.499999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 14439.2 | 14439.2 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

local361a-0001 (identical) · local361a-0002 (identical) · local361a-0003 (identical) · local361a-0004 (identical) · local361a-0005 (identical) · local361a-0006 (identical) · local361a-0007 (identical) · local361a-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=487&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue361-local-mission-stall/ai_flow_live.html?bench=487&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=487`); it opens the seed that parts earliest, and the dropdowns choose another.

