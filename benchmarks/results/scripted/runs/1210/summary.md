# Benchmark run #1210 · 100 seeds from `contact-prone-support-20261021` (meeting), windows `0+600`

- **OFF** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=0` · **ON** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/contact-cover-first-20261021 @ 77c52aa · [run](https://github.com/APPARANYX/grasstex/actions/runs/39691156560) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 238.575 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +6.4% (p 0.2132)**

- Under 0.05 only: squadPerformance.meanMovement 9786.600000000002 to 9806.500000000005 (+0.2%, p 0.047).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.04 (gate 1.25)
- the 100 changed records first part at simulated second: min 197.1, p10 204, median 238.575, p90 282, max 354.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3216 | 3422 | 2.06 | 93 | 53 | 40 | 0.2132 |
| `usKills` | 1670 | 1777 | 1.07 | 95 | 54 | 41 | 0.2181 |
| `geKills` | 1546 | 1645 | 0.99 | 98 | 54 | 44 | 0.3634 |
| `fire.total` | 16070 | 15643 | -4.27 | 99 | 47 | 52 | 0.6879 |
| `fire.hits` | 6945 | 7132 | 1.87 | 95 | 45 | 50 | 0.6817 |
| `retreatSamples` | 95356 | 98711 | 33.55 | 100 | 56 | 44 | 0.2713 |
| `movementResolver.changes` | 128889 | 130498 | 16.09 | 100 | 53 | 47 | 0.6173 |
| `grenades.throws` | 22 | 31 | 0.09 | 8 | 4 | 4 | 1 |
| `grenades.bursts` | 22 | 31 | 0.09 | 8 | 4 | 4 | 1 |
| `grenades.wounded` | 22 | 67 | 0.45 | 6 | 3 | 3 | 1 |
| `grenades.casualties` | 6 | 22 | 0.16 | 5 | 3 | 2 | 1 |
| `grenades.suppressed` | 49 | 179 | 1.3 | 7 | 4 | 3 | 1 |
| `grenades.friendlyWounded` | 0 | 5 | 0.05 | 2 | 2 | 0 | 0.5 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 37 | 46 | 0.09 | 26 | 12 | 14 | 0.845 |
| `routeStalls.length` | 141 | 135 | -0.06 | 23 | 8 | 15 | 0.21 |
| `targetlessStalls.length` | 15 | 13 | -0.02 | 18 | 8 | 10 | 0.8145 |
| `vacantObjectiveStalls.length` | 324 | 297 | -0.27 | 80 | 37 | 43 | 0.5764 |
| `loopAlerts.length` | 967 | 973 | 0.06 | 90 | 43 | 47 | 0.752 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 164 | 174 | 0.1 | 71 | 40 | 31 | 0.3425 |
| `stallOutcomes.wakes` | 6 | 2 | -0.04 | 7 | 2 | 5 | 0.4531 |
| `stallOutcomes.repeats` | 6 | 2 | -0.04 | 7 | 2 | 5 | 0.4531 |
| `timeline.stalledOnsets` | 46 | 49 | 0.03 | 27 | 12 | 15 | 0.7011 |
| `timeline.stalledSamples` | 245 | 2003 | 17.58 | 28 | 13 | 15 | 0.8506 |
| `timeline.stalledOnsetsRepeated` | 46 | 49 | 0.03 | 27 | 12 | 15 | 0.7011 |
| `timeline.stalledSamplesRepeated` | 245 | 2003 | 17.58 | 28 | 13 | 15 | 0.8506 |
| `recon.orders` | 1753 | 1702 | -0.51 | 83 | 37 | 46 | 0.38 |
| `recon.contacts` | 114 | 120 | 0.06 | 58 | 32 | 26 | 0.5118 |
| `recon.noContact` | 386 | 378 | -0.08 | 85 | 39 | 46 | 0.5154 |
| `recon.timeouts` | 495 | 507 | 0.12 | 59 | 34 | 25 | 0.2976 |
| `recon.cancelled` | 634 | 599 | -0.35 | 80 | 37 | 43 | 0.5764 |
| `recon.reportsDelivered` | 465 | 502 | 0.37 | 58 | 31 | 27 | 0.694 |
| `recon.retriggerBlocked` | 907 | 907 | 0 | 86 | 40 | 46 | 0.59 |
| `squadPerformance.meanOverall` | 8558.100000000004 | 8534.099999999999 | -0.24 | 97 | 41 | 56 | 0.1548 |
| `squadPerformance.p10Overall` | 7504.900000000002 | 7492.900000000002 | -0.12 | 64 | 36 | 28 | 0.3817 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7141.900000000001 | 7068.299999999999 | -0.736 | 99 | 41 | 58 | 0.1074 |
| `squadPerformance.meanMovement` | 9786.600000000002 | 9806.500000000005 | 0.199 | 92 | 56 | 36 | 0.047 |
| `squadPerformance.meanControl` | 9517.500000000002 | 9545.500000000004 | 0.28 | 99 | 56 | 43 | 0.2276 |
| `squadPerformance.meanCohesion` | 9676.300000000001 | 9690.099999999999 | 0.138 | 97 | 53 | 44 | 0.4168 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

contact-prone-support-20261021-0060 197.1 s (timeline) · contact-prone-support-20261021-0039 198 s (timeline) · contact-prone-support-20261021-0088 198 s (timeline) · contact-prone-support-20261021-0013 199.05 s (timeline) · contact-prone-support-20261021-0074 199.05 s (timeline) · contact-prone-support-20261021-0027 200.1 s (timeline) · contact-prone-support-20261021-0055 202.05 s (timeline) · contact-prone-support-20261021-0016 203.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1210&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-cover-first-20261021/ai_flow_live.html?bench=1210&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1210`); it opens the seed that parts earliest, and the dropdowns choose another.

