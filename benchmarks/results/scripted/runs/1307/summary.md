# Benchmark run #1307 · 100 seeds from `pinb-20261024-c` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&pinBridge=1`
- work/pin-bridge-20261024 @ 3daea6b · [run](https://github.com/APPARANYX/grasstex/actions/runs/40114250453) · build v29-dev

## Verdict

**MOVED: 97 of 100 pairs changed (median first part 137.1 s); 11 of 42 counters under p 0.05 (about 2.1 by chance), 8 under 0.0012; casualties -11.2% (p 0.0004)**

- Clears the Bonferroni line (p < 0.0012): geKills 2379 to 2006 (-15.7%, p 0); retreatSamples 196128 to 276085 (+40.8%, p 0); squadPerformance.meanMission 7086.2999999999965 to 6613.8 (-6.7%, p 0); squadPerformance.meanControl 9686.199999999999 to 9757.9 (+0.7%, p 0); squadPerformance.meanCohesion 8943.9 to 9134.699999999999 (+2.1%, p 0); fire.total 39361 to 33845 (-14.0%, p 0.0001); squadPerformance.meanOverall 8413.2 to 8284.000000000002 (-1.5%, p 0.0001); casualties 4303 to 3823 (-11.2%, p 0.0004).
- Under 0.05 only: squadPerformance.meanMovement 9987.399999999992 to 9989.999999999989 (+0.0%, p 0.0014); fire.hits 7937 to 7200 (-9.3%, p 0.0045); movementResolver.changes 222597 to 240437 (+8.0%, p 0.005).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x1.041 (gate 1.25)
- the 87 changed records first part at simulated second: min 76.05, p10 105, median 137.1, p90 165, max 190.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4303 | 3823 | -4.8 | 83 | 25 | 58 | 0.0004 |
| `usKills` | 1924 | 1817 | -1.07 | 81 | 35 | 46 | 0.2664 |
| `geKills` | 2379 | 2006 | -3.73 | 83 | 20 | 63 | 0 |
| `fire.total` | 39361 | 33845 | -55.16 | 87 | 25 | 62 | 0.0001 |
| `fire.hits` | 7937 | 7200 | -7.37 | 85 | 29 | 56 | 0.0045 |
| `retreatSamples` | 196128 | 276085 | 799.57 | 87 | 68 | 19 | 0 |
| `movementResolver.changes` | 222597 | 240437 | 178.4 | 87 | 57 | 30 | 0.005 |
| `grenades.throws` | 15 | 22 | 0.07 | 12 | 6 | 6 | 1 |
| `grenades.bursts` | 15 | 20 | 0.05 | 11 | 5 | 6 | 1 |
| `grenades.wounded` | 5 | 6 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 2 | 2 | 0 | 4 | 2 | 2 | 1 |
| `grenades.suppressed` | 19 | 17 | -0.02 | 7 | 3 | 4 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 181 | 183 | 0.02 | 64 | 35 | 29 | 0.5323 |
| `loopAlerts.length` | 629 | 660 | 0.31 | 80 | 46 | 34 | 0.2185 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 333 | 390 | 0.57 | 77 | 47 | 30 | 0.0675 |
| `stallOutcomes.wakes` | 7 | 8 | 0.01 | 14 | 8 | 6 | 0.7905 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 4 | 2 | 2 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1973 | 2009 | 0.36 | 84 | 46 | 38 | 0.4452 |
| `recon.contacts` | 197 | 190 | -0.07 | 66 | 30 | 36 | 0.5386 |
| `recon.noContact` | 1131 | 1169 | 0.38 | 72 | 42 | 30 | 0.1945 |
| `recon.timeouts` | 127 | 132 | 0.05 | 49 | 26 | 23 | 0.7754 |
| `recon.cancelled` | 421 | 422 | 0.01 | 77 | 36 | 41 | 0.6488 |
| `recon.reportsDelivered` | 692 | 709 | 0.17 | 75 | 39 | 36 | 0.8176 |
| `recon.retriggerBlocked` | 1170 | 1201 | 0.31 | 77 | 47 | 30 | 0.0675 |
| `squadPerformance.meanOverall` | 8413.2 | 8284.000000000002 | -1.292 | 87 | 25 | 62 | 0.0001 |
| `squadPerformance.p10Overall` | 7693.900000000004 | 7659.800000000001 | -0.341 | 46 | 17 | 29 | 0.1038 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7086.2999999999965 | 6613.8 | -4.725 | 87 | 13 | 74 | 0 |
| `squadPerformance.meanMovement` | 9987.399999999992 | 9989.999999999989 | 0.026 | 49 | 36 | 13 | 0.0014 |
| `squadPerformance.meanControl` | 9686.199999999999 | 9757.9 | 0.717 | 83 | 61 | 22 | 0 |
| `squadPerformance.meanCohesion` | 8943.9 | 9134.699999999999 | 1.908 | 85 | 67 | 18 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pinb-20261024-c-0017 76.05 s (timeline) · pinb-20261024-c-0059 82.05 s (stress) · pinb-20261024-c-0041 95.1 s (stress) · pinb-20261024-c-0003 96 s (stress) · pinb-20261024-c-0045 100.05 s (stress) · pinb-20261024-c-0087 101.1 s (timeline) · pinb-20261024-c-0076 102 s (stress) · pinb-20261024-c-0031 104.1 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1307&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-bridge-20261024/ai_flow_live.html?bench=1307&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1307`); it opens the seed that parts earliest, and the dropdowns choose another.

