# Benchmark run #366 · 12 seeds from `command-audit361` (us-defend), windows `every60`

- **OFF** flags: `none` · **ON** flags: `none`
- work/audit361-pr359-on-current-main @ 1fee48e · [run](https://github.com/APPARANYX/grasstex/actions/runs/37711004986) · build v29-dev

## Verdict

**INERT: all 102 pairs identical in every field**


## Paired comparison (off against on)

- **102** pairs (unpaired: off 0, on 0) · identical in every field: **102** · runtime errors off 0 / on 0 · wall time on/off x0.977 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1806 | 1806 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 889 | 889 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 917 | 917 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 2525 | 2525 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 812 | 812 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 11705 | 11705 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 154435 | 154435 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 88 | 88 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 45 | 45 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 4781 | 4781 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 249 | 249 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 2014 | 2014 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1626 | 1626 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 695 | 695 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 920 | 920 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1895 | 1895 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 9091.800000000001 | 9091.800000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 8519.199999999999 | 8519.199999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8281.499999999996 | 8281.499999999996 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 10140.900000000001 | 10140.900000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 10169.9 | 10169.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 8259.099999999997 | 8259.099999999997 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

command-audit361-0001 (identical) · command-audit361-0002 (identical) · command-audit361-0003 (identical) · command-audit361-0004 (identical) · command-audit361-0005 (identical) · command-audit361-0006 (identical) · command-audit361-0007 (identical) · command-audit361-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=366&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/audit361-pr359-on-current-main/ai_flow_live.html?bench=366&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=366`); it opens the seed that parts earliest, and the dropdowns choose another.

