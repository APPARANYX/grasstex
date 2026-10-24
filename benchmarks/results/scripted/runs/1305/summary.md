# Benchmark run #1305 · 100 seeds from `pinb-20261024-a` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&pinBridge=1`
- work/pin-bridge-20261024 @ 3daea6b · [run](https://github.com/APPARANYX/grasstex/actions/runs/40114245769) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 171.525 s); 9 of 42 counters under p 0.05 (about 2.1 by chance), 6 under 0.0012; casualties -12.3% (p 0.0016)**

- Clears the Bonferroni line (p < 0.0012): retreatSamples 171698 to 255891 (+49.0%, p 0); squadPerformance.meanOverall 8093.800000000002 to 8007.0999999999985 (-1.1%, p 0); squadPerformance.meanMission 6435.399999999998 to 5974.299999999999 (-7.2%, p 0); squadPerformance.meanMovement 9971.000000000002 to 9978.100000000002 (+0.1%, p 0); squadPerformance.meanControl 9339.699999999997 to 9528.800000000003 (+2.0%, p 0); squadPerformance.meanCohesion 9088.299999999996 to 9312.999999999996 (+2.5%, p 0).
- Under 0.05 only: casualties 4974 to 4364 (-12.3%, p 0.0016); usKills 2370 to 1980 (-16.5%, p 0.0184); fire.total 50007 to 44596 (-10.8%, p 0.0352).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.002 (gate 1.25)
- the 100 changed records first part at simulated second: min 142.05, p10 152.1, median 171.525, p90 202.05, max 266.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4974 | 4364 | -6.1 | 98 | 33 | 65 | 0.0016 |
| `usKills` | 2370 | 1980 | -3.9 | 96 | 36 | 60 | 0.0184 |
| `geKills` | 2604 | 2384 | -2.2 | 96 | 38 | 58 | 0.0519 |
| `fire.total` | 50007 | 44596 | -54.11 | 100 | 39 | 61 | 0.0352 |
| `fire.hits` | 9577 | 8738 | -8.39 | 99 | 42 | 57 | 0.1591 |
| `retreatSamples` | 171698 | 255891 | 841.93 | 100 | 74 | 26 | 0 |
| `movementResolver.changes` | 325855 | 328221 | 23.66 | 99 | 56 | 43 | 0.2276 |
| `grenades.throws` | 17 | 29 | 0.12 | 15 | 8 | 7 | 1 |
| `grenades.bursts` | 17 | 29 | 0.12 | 15 | 8 | 7 | 1 |
| `grenades.wounded` | 16 | 21 | 0.05 | 8 | 5 | 3 | 0.7266 |
| `grenades.casualties` | 5 | 6 | 0.01 | 4 | 3 | 1 | 0.625 |
| `grenades.suppressed` | 39 | 62 | 0.23 | 9 | 5 | 4 | 1 |
| `grenades.friendlyWounded` | 2 | 4 | 0.02 | 3 | 2 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 576 | 591 | 0.15 | 90 | 46 | 44 | 0.9161 |
| `loopAlerts.length` | 1027 | 1016 | -0.11 | 92 | 42 | 50 | 0.4657 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 396 | 425 | 0.29 | 81 | 40 | 41 | 1 |
| `stallOutcomes.wakes` | 6 | 7 | 0.01 | 12 | 6 | 6 | 1 |
| `stallOutcomes.repeats` | 1 | 6 | 0.05 | 6 | 5 | 1 | 0.2188 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 6 | 5 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 6 | 5 | -0.01 | 1 | 0 | 1 | 1 |
| `recon.orders` | 3067 | 2969 | -0.98 | 94 | 42 | 52 | 0.3533 |
| `recon.contacts` | 142 | 124 | -0.18 | 65 | 26 | 39 | 0.136 |
| `recon.noContact` | 1944 | 1918 | -0.26 | 85 | 39 | 46 | 0.5154 |
| `recon.timeouts` | 24 | 32 | 0.08 | 32 | 20 | 12 | 0.2153 |
| `recon.cancelled` | 820 | 765 | -0.55 | 87 | 40 | 47 | 0.5203 |
| `recon.reportsDelivered` | 620 | 546 | -0.74 | 71 | 30 | 41 | 0.2351 |
| `recon.retriggerBlocked` | 2377 | 2332 | -0.45 | 92 | 38 | 54 | 0.1174 |
| `squadPerformance.meanOverall` | 8093.800000000002 | 8007.0999999999985 | -0.867 | 98 | 26 | 72 | 0 |
| `squadPerformance.p10Overall` | 7494.700000000003 | 7468.600000000001 | -0.261 | 50 | 19 | 31 | 0.1189 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6435.399999999998 | 5974.299999999999 | -4.611 | 99 | 14 | 85 | 0 |
| `squadPerformance.meanMovement` | 9971.000000000002 | 9978.100000000002 | 0.071 | 65 | 52 | 13 | 0 |
| `squadPerformance.meanControl` | 9339.699999999997 | 9528.800000000003 | 1.891 | 99 | 80 | 19 | 0 |
| `squadPerformance.meanCohesion` | 9088.299999999996 | 9312.999999999996 | 2.247 | 99 | 78 | 21 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pinb-20261024-a-0027 142.05 s (stress) · pinb-20261024-a-0043 143.1 s (stress) · pinb-20261024-a-0060 146.1 s (stress) · pinb-20261024-a-0050 148.05 s (timeline) · pinb-20261024-a-0006 149.1 s (timeline) · pinb-20261024-a-0033 149.1 s (stress) · pinb-20261024-a-0038 151.05 s (stress) · pinb-20261024-a-0057 151.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1305&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-bridge-20261024/ai_flow_live.html?bench=1305&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1305`); it opens the seed that parts earliest, and the dropdowns choose another.

