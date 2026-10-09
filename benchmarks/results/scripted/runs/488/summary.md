# Benchmark run #488 · 20 seeds from `local361a` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localMissionWake=1`
- work/issue361-local-mission-stall @ ca463a1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37880814407) · build v29-dev

## Verdict

**INERT: all 173 pairs identical in every field**


## Paired comparison (off against on)

- **173** pairs (unpaired: off 0, on 0) · identical in every field: **173** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4559 | 4559 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1853 | 1853 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2706 | 2706 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 6183 | 6183 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2123 | 2123 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 44022 | 44022 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 310243 | 310243 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 264 | 264 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3799 | 3799 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 370 | 370 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1544 | 1544 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1032 | 1032 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 774 | 774 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 1713 | 1713 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1565 | 1565 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 15019.999999999995 | 15019.999999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 13989.700000000019 | 13989.700000000019 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 12604.900000000001 | 12604.900000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 17093.699999999993 | 17093.699999999993 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 17155.8 | 17155.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 15073.499999999996 | 15073.499999999996 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

local361a-0001 (identical) · local361a-0002 (identical) · local361a-0003 (identical) · local361a-0004 (identical) · local361a-0005 (identical) · local361a-0006 (identical) · local361a-0007 (identical) · local361a-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=488&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue361-local-mission-stall/ai_flow_live.html?bench=488&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=488`); it opens the seed that parts earliest, and the dropdowns choose another.

