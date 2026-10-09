# Benchmark run #486 · 20 seeds from `local361a` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localMissionWake=1`
- work/issue361-local-mission-stall @ ca463a1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37880810373) · build v29-dev

## Verdict

**INERT: all 150 pairs identical in every field**


## Paired comparison (off against on)

- **150** pairs (unpaired: off 0, on 0) · identical in every field: **150** · runtime errors off 0 / on 0 · wall time on/off x0.977 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5376 | 5376 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2606 | 2606 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2770 | 2770 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 7011 | 7011 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2626 | 2626 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 32442 | 32442 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 396553 | 396553 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 83 | 83 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 87 | 87 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 382 | 382 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3499 | 3499 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 190 | 190 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 2219 | 2219 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 57 | 57 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 969 | 969 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 715 | 715 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 2794 | 2794 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 12817.600000000004 | 12817.600000000004 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 11897.800000000005 | 11897.800000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 10467 | 10467 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 14658.4 | 14658.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 14801.19999999999 | 14801.19999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 13031.6 | 13031.6 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

local361a-0001 (identical) · local361a-0002 (identical) · local361a-0003 (identical) · local361a-0004 (identical) · local361a-0005 (identical) · local361a-0006 (identical) · local361a-0007 (identical) · local361a-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=486&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue361-local-mission-stall/ai_flow_live.html?bench=486&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=486`); it opens the seed that parts earliest, and the dropdowns choose another.

