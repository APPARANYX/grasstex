# Benchmark run #346 · 100 seeds from `scripted-seeds` (meeting), windows `contact+120`

- **OFF** flags: `fledElimination=0` · **ON** flags: `none`
- work/fled-elimination-force-count @ 111957b · [run](https://github.com/APPARANYX/grasstex/actions/runs/37465590767) · build v29-dev

## Verdict

**INERT: all 100 pairs identical in every field**


## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **100** · runtime errors off 0 / on 0 · wall time on/off x0.98 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2015 | 2015 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 993 | 993 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1022 | 1022 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 15231 | 15231 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 5020 | 5020 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 9899 | 9899 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 203727 | 203727 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 111 | 111 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 341 | 341 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1105 | 1105 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2462 | 2462 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1387 | 1387 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 99 | 99 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 883 | 883 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 432 | 432 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 2235 | 2235 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8516.300000000001 | 8516.300000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 7744.9000000000015 | 7744.9000000000015 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7394.2 | 7394.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 9666.5 | 9666.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 9801.6 | 9801.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 8537.4 | 8537.4 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

scripted-seeds-0001 (identical) · scripted-seeds-0002 (identical) · scripted-seeds-0003 (identical) · scripted-seeds-0004 (identical) · scripted-seeds-0005 (identical) · scripted-seeds-0006 (identical) · scripted-seeds-0007 (identical) · scripted-seeds-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=346&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/fled-elimination-force-count/ai_flow_live.html?bench=346&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=346`); it opens the seed that parts earliest, and the dropdowns choose another.

