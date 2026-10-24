# Benchmark run #1309 · 100 seeds from `tg-20261024-b` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&talkingGuns=1`
- work/talking-guns-20261024 @ e91fa6d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40116009996) · build v29-dev

## Verdict

**MOVED: 98 of 100 pairs changed (median first part 165.525 s); 2 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties +1.2% (p 0.3143)**

- Clears the Bonferroni line (p < 0.0012): fire.total 39235 to 34441 (-12.2%, p 0).
- Under 0.05 only: squadPerformance.meanMission 7069.299999999997 to 7170.899999999996 (+1.4%, p 0.014).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x0.986 (gate 1.25)
- the 82 changed records first part at simulated second: min 106.05, p10 134.1, median 165.525, p90 246, max 464.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4079 | 4127 | 0.48 | 80 | 45 | 35 | 0.3143 |
| `usKills` | 1964 | 1981 | 0.17 | 76 | 44 | 32 | 0.2067 |
| `geKills` | 2115 | 2146 | 0.31 | 80 | 44 | 36 | 0.434 |
| `fire.total` | 39235 | 34441 | -47.94 | 82 | 21 | 61 | 0 |
| `fire.hits` | 7577 | 7644 | 0.67 | 80 | 41 | 39 | 0.9111 |
| `retreatSamples` | 194223 | 187561 | -66.62 | 81 | 35 | 46 | 0.2664 |
| `movementResolver.changes` | 219154 | 216061 | -30.93 | 82 | 39 | 43 | 0.7407 |
| `grenades.throws` | 20 | 15 | -0.05 | 9 | 3 | 6 | 0.5078 |
| `grenades.bursts` | 20 | 15 | -0.05 | 9 | 3 | 6 | 0.5078 |
| `grenades.wounded` | 8 | 8 | 0 | 5 | 2 | 3 | 1 |
| `grenades.casualties` | 5 | 3 | -0.02 | 5 | 2 | 3 | 1 |
| `grenades.suppressed` | 12 | 8 | -0.04 | 6 | 2 | 4 | 0.6875 |
| `grenades.friendlyWounded` | 1 | 4 | 0.03 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 2 | 0.02 | 2 | 2 | 0 | 0.5 |
| `grenades.aborted` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 208 | 208 | 0 | 68 | 35 | 33 | 0.9036 |
| `loopAlerts.length` | 720 | 586 | -1.34 | 71 | 28 | 43 | 0.0959 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 364 | 360 | -0.04 | 63 | 33 | 30 | 0.8013 |
| `stallOutcomes.wakes` | 12 | 9 | -0.03 | 15 | 6 | 9 | 0.6072 |
| `stallOutcomes.repeats` | 6 | 4 | -0.02 | 6 | 2 | 4 | 0.6875 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1942 | 1892 | -0.5 | 77 | 39 | 38 | 1 |
| `recon.contacts` | 183 | 167 | -0.16 | 55 | 24 | 31 | 0.4188 |
| `recon.noContact` | 1090 | 1083 | -0.07 | 66 | 35 | 31 | 0.7122 |
| `recon.timeouts` | 84 | 96 | 0.12 | 46 | 27 | 19 | 0.302 |
| `recon.cancelled` | 445 | 416 | -0.29 | 68 | 30 | 38 | 0.3961 |
| `recon.reportsDelivered` | 762 | 739 | -0.23 | 68 | 32 | 36 | 0.7163 |
| `recon.retriggerBlocked` | 1157 | 1148 | -0.09 | 69 | 35 | 34 | 1 |
| `squadPerformance.meanOverall` | 8442.499999999998 | 8468.4 | 0.259 | 81 | 48 | 33 | 0.1193 |
| `squadPerformance.p10Overall` | 7798.200000000003 | 7802.500000000004 | 0.043 | 38 | 18 | 20 | 0.8714 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7069.299999999997 | 7170.899999999996 | 1.016 | 81 | 52 | 29 | 0.014 |
| `squadPerformance.meanMovement` | 9987.099999999991 | 9986.59999999999 | -0.005 | 50 | 24 | 26 | 0.8877 |
| `squadPerformance.meanControl` | 9660.499999999996 | 9697.200000000003 | 0.367 | 79 | 46 | 33 | 0.1766 |
| `squadPerformance.meanCohesion` | 9115.800000000003 | 9088.2 | -0.276 | 79 | 34 | 45 | 0.2604 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

tg-20261024-b-0082 106.05 s (stress) · tg-20261024-b-0086 106.05 s (stress) · tg-20261024-b-0029 107.1 s (timeline) · tg-20261024-b-0023 115.05 s (timeline) · tg-20261024-b-0061 122.1 s (stress) · tg-20261024-b-0010 124.05 s (stress) · tg-20261024-b-0040 124.05 s (timeline) · tg-20261024-b-0013 131.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1309&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/talking-guns-20261024/ai_flow_live.html?bench=1309&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1309`); it opens the seed that parts earliest, and the dropdowns choose another.

