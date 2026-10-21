# Benchmark run #1209 · 100 seeds from `contact-cover-first-20261021` (meeting), windows `0+600`

- **OFF** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=0` · **ON** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/contact-cover-first-20261021 @ 89767e2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39689001832) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 294 s); 2 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.1% (p 0.6889)**

- Under 0.05 only: recon.cancelled 647 to 706 (+9.1%, p 0.0016); regroups.entries 215 to 196 (-8.8%, p 0.0336).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.021 (gate 1.25)
- the 63 changed records first part at simulated second: min 198, p10 207, median 294, p90 510, max 598.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3292 | 3224 | -0.68 | 56 | 26 | 30 | 0.6889 |
| `usKills` | 1508 | 1542 | 0.34 | 49 | 29 | 20 | 0.2529 |
| `geKills` | 1784 | 1682 | -1.02 | 52 | 21 | 31 | 0.2116 |
| `fire.total` | 15955 | 15317 | -6.38 | 60 | 28 | 32 | 0.6989 |
| `fire.hits` | 7067 | 6899 | -1.68 | 58 | 25 | 33 | 0.3581 |
| `retreatSamples` | 95661 | 94825 | -8.36 | 60 | 29 | 31 | 0.8974 |
| `movementResolver.changes` | 127585 | 131792 | 42.07 | 62 | 37 | 25 | 0.1619 |
| `grenades.throws` | 5 | 4 | -0.01 | 2 | 1 | 1 | 1 |
| `grenades.bursts` | 5 | 4 | -0.01 | 2 | 1 | 1 | 1 |
| `grenades.wounded` | 5 | 4 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 59 | 53 | -0.06 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 66 | 76 | 0.1 | 17 | 12 | 5 | 0.1435 |
| `routeStalls.length` | 143 | 139 | -0.04 | 7 | 3 | 4 | 1 |
| `targetlessStalls.length` | 14 | 15 | 0.01 | 9 | 5 | 4 | 1 |
| `vacantObjectiveStalls.length` | 318 | 331 | 0.13 | 43 | 21 | 22 | 1 |
| `loopAlerts.length` | 1025 | 989 | -0.36 | 48 | 20 | 28 | 0.3123 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 215 | 196 | -0.19 | 38 | 12 | 26 | 0.0336 |
| `stallOutcomes.wakes` | 5 | 1 | -0.04 | 4 | 0 | 4 | 0.125 |
| `stallOutcomes.repeats` | 5 | 1 | -0.04 | 4 | 0 | 4 | 0.125 |
| `timeline.stalledOnsets` | 104 | 116 | 0.12 | 18 | 12 | 6 | 0.2379 |
| `timeline.stalledSamples` | 5625 | 5676 | 0.51 | 19 | 13 | 6 | 0.1671 |
| `timeline.stalledOnsetsRepeated` | 104 | 116 | 0.12 | 18 | 12 | 6 | 0.2379 |
| `timeline.stalledSamplesRepeated` | 5625 | 5676 | 0.51 | 19 | 13 | 6 | 0.1671 |
| `recon.orders` | 1871 | 1916 | 0.45 | 45 | 26 | 19 | 0.3713 |
| `recon.contacts` | 137 | 138 | 0.01 | 25 | 12 | 13 | 1 |
| `recon.noContact` | 395 | 393 | -0.02 | 36 | 19 | 17 | 0.8679 |
| `recon.timeouts` | 570 | 570 | 0 | 33 | 19 | 14 | 0.4869 |
| `recon.cancelled` | 647 | 706 | 0.59 | 46 | 34 | 12 | 0.0016 |
| `recon.reportsDelivered` | 660 | 641 | -0.19 | 31 | 15 | 16 | 1 |
| `recon.retriggerBlocked` | 953 | 968 | 0.15 | 46 | 26 | 20 | 0.4614 |
| `squadPerformance.meanOverall` | 8531.399999999992 | 8529.8 | -0.016 | 59 | 28 | 31 | 0.7948 |
| `squadPerformance.p10Overall` | 7486.500000000001 | 7474.800000000001 | -0.117 | 44 | 22 | 22 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 2 | 0.02 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanMission` | 7079.9 | 7062.000000000001 | -0.179 | 57 | 29 | 28 | 1 |
| `squadPerformance.meanMovement` | 9781.299999999997 | 9778 | -0.033 | 56 | 27 | 29 | 0.8939 |
| `squadPerformance.meanControl` | 9512 | 9515.5 | 0.035 | 55 | 30 | 25 | 0.5901 |
| `squadPerformance.meanCohesion` | 9701.7 | 9699.900000000003 | -0.018 | 56 | 27 | 29 | 0.8939 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

contact-cover-first-20261021-0049 198 s (timeline) · contact-cover-first-20261021-0027 199.05 s (stress) · contact-cover-first-20261021-0054 201 s (timeline) · contact-cover-first-20261021-0064 202.05 s (timeline) · contact-cover-first-20261021-0032 205.05 s (timeline) · contact-cover-first-20261021-0055 207 s (timeline) · contact-cover-first-20261021-0092 207 s (timeline) · contact-cover-first-20261021-0079 210 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1209&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-cover-first-20261021/ai_flow_live.html?bench=1209&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1209`); it opens the seed that parts earliest, and the dropdowns choose another.

