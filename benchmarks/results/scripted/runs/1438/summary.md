# Benchmark run #1438 · 60 seeds from `controller-pacing2-20261030` (meeting), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-7a4c33ee @ 7a4c33e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41003814664) · build v29-dev

## Verdict

**MOVED: 60 of 60 pairs changed (median first part 1.05 s); 15 of 42 counters under p 0.05 (about 2.1 by chance), 13 under 0.0012; casualties -5.8% (p 0.1925)**

- Clears the Bonferroni line (p < 0.0012): fire.total 13645 to 21068 (+54.4%, p 0); retreatSamples 5424 to 10284 (+89.6%, p 0); movementResolver.changes 128107 to 174543 (+36.2%, p 0); loopAlerts.length 221 to 768 (+247.5%, p 0); stallOutcomes.wakes 0 to 36 (new, p 0); recon.orders 1195 to 942 (-21.2%, p 0); recon.noContact 850 to 532 (-37.4%, p 0); recon.retriggerBlocked 992 to 894 (-9.9%, p 0); squadPerformance.meanOverall 5145.699999999999 to 5029.799999999998 (-2.3%, p 0); squadPerformance.meanMission 4522.800000000001 to 4109.099999999999 (-9.1%, p 0); squadPerformance.meanControl 5793.9 to 5580.9 (-3.7%, p 0); squadPerformance.meanCohesion 5255.6 to 5534.400000000001 (+5.3%, p 0); recon.cancelled 273 to 350 (+28.2%, p 0.0001).
- Under 0.05 only: vacantObjectiveStalls.length 13 to 38 (+192.3%, p 0.0041); fire.hits 2498 to 2290 (-8.3%, p 0.0183).
- Wall time on/off x2.035 is over the 1.25 gate.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x2.035 (gate 1.25)
- the 60 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1180 | 1111 | -1.15 | 59 | 24 | 35 | 0.1925 |
| `usKills` | 522 | 521 | -0.0167 | 55 | 26 | 29 | 0.7877 |
| `geKills` | 658 | 590 | -1.1333 | 57 | 23 | 34 | 0.1849 |
| `fire.total` | 13645 | 21068 | 123.7167 | 60 | 53 | 7 | 0 |
| `fire.hits` | 2498 | 2290 | -3.4667 | 59 | 20 | 39 | 0.0183 |
| `retreatSamples` | 5424 | 10284 | 81 | 60 | 49 | 11 | 0 |
| `movementResolver.changes` | 128107 | 174543 | 773.9333 | 60 | 60 | 0 | 0 |
| `grenades.throws` | 5 | 7 | 0.0333 | 6 | 4 | 2 | 0.6875 |
| `grenades.bursts` | 5 | 7 | 0.0333 | 6 | 4 | 2 | 0.6875 |
| `grenades.wounded` | 4 | 11 | 0.1167 | 2 | 1 | 1 | 1 |
| `grenades.casualties` | 1 | 4 | 0.05 | 2 | 1 | 1 | 1 |
| `grenades.suppressed` | 2 | 16 | 0.2333 | 2 | 1 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 2 | 0 | 4 | 2 | 2 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 13 | 38 | 0.4167 | 25 | 20 | 5 | 0.0041 |
| `loopAlerts.length` | 221 | 768 | 9.1167 | 59 | 58 | 1 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 81 | 95 | 0.2333 | 47 | 23 | 24 | 1 |
| `stallOutcomes.wakes` | 0 | 36 | 0.6 | 28 | 28 | 0 | 0 |
| `stallOutcomes.repeats` | 0 | 5 | 0.0833 | 5 | 5 | 0 | 0.0625 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1195 | 942 | -4.2167 | 59 | 3 | 56 | 0 |
| `recon.contacts` | 54 | 48 | -0.1 | 38 | 17 | 21 | 0.6271 |
| `recon.noContact` | 850 | 532 | -5.3 | 60 | 0 | 60 | 0 |
| `recon.timeouts` | 5 | 6 | 0.0167 | 9 | 4 | 5 | 1 |
| `recon.cancelled` | 273 | 350 | 1.2833 | 48 | 38 | 10 | 0.0001 |
| `recon.reportsDelivered` | 215 | 271 | 0.9333 | 39 | 23 | 16 | 0.3368 |
| `recon.retriggerBlocked` | 992 | 894 | -1.6333 | 46 | 6 | 40 | 0 |
| `squadPerformance.meanOverall` | 5145.699999999999 | 5029.799999999998 | -1.9317 | 60 | 9 | 51 | 0 |
| `squadPerformance.p10Overall` | 4698.9 | 4597.3 | -1.6933 | 59 | 22 | 37 | 0.0674 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 4522.800000000001 | 4109.099999999999 | -6.895 | 59 | 9 | 50 | 0 |
| `squadPerformance.meanMovement` | 5924.2 | 5942.799999999997 | 0.31 | 54 | 34 | 20 | 0.0759 |
| `squadPerformance.meanControl` | 5793.9 | 5580.9 | -3.55 | 59 | 4 | 55 | 0 |
| `squadPerformance.meanCohesion` | 5255.6 | 5534.400000000001 | 4.6467 | 60 | 50 | 10 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing2-20261030-0001 1.05 s (timeline) · controller-pacing2-20261030-0002 1.05 s (timeline) · controller-pacing2-20261030-0003 1.05 s (timeline) · controller-pacing2-20261030-0004 1.05 s (timeline) · controller-pacing2-20261030-0005 1.05 s (timeline) · controller-pacing2-20261030-0006 1.05 s (timeline) · controller-pacing2-20261030-0007 1.05 s (timeline) · controller-pacing2-20261030-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1438&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-7a4c33ee/ai_flow_live.html?bench=1438&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1438`); it opens the seed that parts earliest, and the dropdowns choose another.

