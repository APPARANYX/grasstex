# Benchmark run #1306 · 100 seeds from `pinb-20261024-b` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&pinBridge=1`
- work/pin-bridge-20261024 @ 3daea6b · [run](https://github.com/APPARANYX/grasstex/actions/runs/40114248005) · build v29-dev

## Verdict

**MOVED: 96 of 100 pairs changed (median first part 137.1 s); 10 of 42 counters under p 0.05 (about 2.1 by chance), 5 under 0.0012; casualties -6.1% (p 0.0475)**

- Clears the Bonferroni line (p < 0.0012): retreatSamples 207788 to 300627 (+44.7%, p 0); squadPerformance.meanOverall 8381.400000000001 to 8240.199999999999 (-1.7%, p 0); squadPerformance.meanMission 6960.999999999997 to 6505.499999999999 (-6.5%, p 0); squadPerformance.meanCohesion 9069.199999999999 to 9248.500000000004 (+2.0%, p 0); squadPerformance.p10Overall 7676.8 to 7635.000000000001 (-0.5%, p 0.0005).
- Under 0.05 only: squadPerformance.meanMovement 9986.699999999986 to 9989.999999999989 (+0.0%, p 0.0016); fire.total 40965 to 35809 (-12.6%, p 0.0028); usKills 2091 to 1860 (-11.0%, p 0.0295); squadPerformance.meanControl 9688.800000000001 to 9744.300000000003 (+0.6%, p 0.0334); casualties 4209 to 3954 (-6.1%, p 0.0475).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **4** · runtime errors off 0 / on 0 · wall time on/off x0.991 (gate 1.25)
- the 89 changed records first part at simulated second: min 76.05, p10 100.05, median 137.1, p90 173.1, max 227.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4209 | 3954 | -2.55 | 83 | 32 | 51 | 0.0475 |
| `usKills` | 2091 | 1860 | -2.31 | 85 | 32 | 53 | 0.0295 |
| `geKills` | 2118 | 2094 | -0.24 | 83 | 47 | 36 | 0.2723 |
| `fire.total` | 40965 | 35809 | -51.56 | 89 | 30 | 59 | 0.0028 |
| `fire.hits` | 7795 | 7475 | -3.2 | 88 | 37 | 51 | 0.1654 |
| `retreatSamples` | 207788 | 300627 | 928.39 | 89 | 77 | 12 | 0 |
| `movementResolver.changes` | 236608 | 243511 | 69.03 | 89 | 45 | 44 | 1 |
| `grenades.throws` | 11 | 20 | 0.09 | 9 | 7 | 2 | 0.1797 |
| `grenades.bursts` | 11 | 20 | 0.09 | 9 | 7 | 2 | 0.1797 |
| `grenades.wounded` | 9 | 15 | 0.06 | 7 | 3 | 4 | 1 |
| `grenades.casualties` | 3 | 6 | 0.03 | 6 | 3 | 3 | 1 |
| `grenades.suppressed` | 17 | 33 | 0.16 | 7 | 4 | 3 | 1 |
| `grenades.friendlyWounded` | 3 | 1 | -0.02 | 3 | 1 | 2 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 247 | 235 | -0.12 | 69 | 32 | 37 | 0.6305 |
| `loopAlerts.length` | 670 | 687 | 0.17 | 79 | 41 | 38 | 0.8221 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 404 | 390 | -0.14 | 73 | 34 | 39 | 0.64 |
| `stallOutcomes.wakes` | 6 | 3 | -0.03 | 9 | 3 | 6 | 0.5078 |
| `stallOutcomes.repeats` | 1 | 2 | 0.01 | 3 | 2 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1949 | 1995 | 0.46 | 84 | 40 | 44 | 0.7436 |
| `recon.contacts` | 184 | 202 | 0.18 | 69 | 39 | 30 | 0.3356 |
| `recon.noContact` | 1144 | 1142 | -0.02 | 78 | 31 | 47 | 0.0888 |
| `recon.timeouts` | 125 | 124 | -0.01 | 51 | 27 | 24 | 0.7798 |
| `recon.cancelled` | 393 | 410 | 0.17 | 77 | 40 | 37 | 0.8199 |
| `recon.reportsDelivered` | 679 | 807 | 1.28 | 72 | 42 | 30 | 0.1945 |
| `recon.retriggerBlocked` | 1192 | 1235 | 0.43 | 78 | 43 | 35 | 0.4282 |
| `squadPerformance.meanOverall` | 8381.400000000001 | 8240.199999999999 | -1.412 | 89 | 16 | 73 | 0 |
| `squadPerformance.p10Overall` | 7676.8 | 7635.000000000001 | -0.418 | 35 | 7 | 28 | 0.0005 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6960.999999999997 | 6505.499999999999 | -4.555 | 89 | 13 | 76 | 0 |
| `squadPerformance.meanMovement` | 9986.699999999986 | 9989.999999999989 | 0.033 | 46 | 34 | 12 | 0.0016 |
| `squadPerformance.meanControl` | 9688.800000000001 | 9744.300000000003 | 0.555 | 89 | 55 | 34 | 0.0334 |
| `squadPerformance.meanCohesion` | 9069.199999999999 | 9248.500000000004 | 1.793 | 87 | 67 | 20 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pinb-20261024-b-0051 76.05 s (stress) · pinb-20261024-b-0053 85.05 s (stress) · pinb-20261024-b-0007 88.05 s (stress) · pinb-20261024-b-0011 89.1 s (stress) · pinb-20261024-b-0083 93 s (stress) · pinb-20261024-b-0032 94.05 s (stress) · pinb-20261024-b-0072 95.1 s (stress) · pinb-20261024-b-0099 95.1 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1306&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-bridge-20261024/ai_flow_live.html?bench=1306&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1306`); it opens the seed that parts earliest, and the dropdowns choose another.

