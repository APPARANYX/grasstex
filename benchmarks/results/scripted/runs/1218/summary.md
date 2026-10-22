# Benchmark run #1218 · 100 seeds from `contact-prone-support-20261021` (meeting), windows `contact+120`

- **OFF** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=0` · **ON** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/squad-firing-positions-20261021 @ 038b49b · [run](https://github.com/APPARANYX/grasstex/actions/runs/39698644141) · build v29-dev

## Verdict

**QUIET: 100 of 100 pairs changed (median first part 238.575 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +2.7% (p 0.8264)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.03 (gate 1.25)
- the 100 changed records first part at simulated second: min 197.1, p10 204, median 238.575, p90 282, max 354.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1241 | 1275 | 0.34 | 83 | 40 | 43 | 0.8264 |
| `usKills` | 689 | 749 | 0.6 | 81 | 42 | 39 | 0.8243 |
| `geKills` | 552 | 526 | -0.26 | 78 | 37 | 41 | 0.7343 |
| `fire.total` | 5722 | 5630 | -0.92 | 92 | 42 | 50 | 0.4657 |
| `fire.hits` | 2698 | 2659 | -0.39 | 88 | 36 | 52 | 0.1093 |
| `retreatSamples` | 11122 | 11212 | 0.9 | 94 | 44 | 50 | 0.6063 |
| `movementResolver.changes` | 52260 | 52589 | 3.29 | 100 | 45 | 55 | 0.3682 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 10 | 0.09 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 107 | 107 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 126 | 112 | -0.14 | 37 | 15 | 22 | 0.324 |
| `loopAlerts.length` | 289 | 271 | -0.18 | 69 | 33 | 36 | 0.8099 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 48 | 39 | -0.09 | 21 | 6 | 15 | 0.0784 |
| `stallOutcomes.wakes` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 10 | 0.08 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 3 | 519 | 5.16 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 10 | 0.08 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 3 | 519 | 5.16 | 2 | 1 | 1 | 1 |
| `recon.orders` | 1131 | 1112 | -0.19 | 64 | 28 | 36 | 0.3817 |
| `recon.contacts` | 73 | 69 | -0.04 | 34 | 15 | 19 | 0.6076 |
| `recon.noContact` | 137 | 130 | -0.07 | 28 | 11 | 17 | 0.3449 |
| `recon.timeouts` | 366 | 362 | -0.04 | 29 | 13 | 16 | 0.7111 |
| `recon.cancelled` | 336 | 311 | -0.25 | 59 | 26 | 33 | 0.435 |
| `recon.reportsDelivered` | 348 | 290 | -0.58 | 36 | 13 | 23 | 0.1325 |
| `recon.retriggerBlocked` | 481 | 469 | -0.12 | 58 | 24 | 34 | 0.237 |
| `squadPerformance.meanOverall` | 8729.099999999999 | 8740.4 | 0.113 | 95 | 47 | 48 | 1 |
| `squadPerformance.p10Overall` | 7628.4000000000015 | 7667.899999999999 | 0.395 | 83 | 42 | 41 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7442.300000000002 | 7449.400000000005 | 0.071 | 94 | 50 | 44 | 0.6063 |
| `squadPerformance.meanMovement` | 9426.999999999995 | 9465.199999999997 | 0.382 | 90 | 47 | 43 | 0.752 |
| `squadPerformance.meanControl` | 9778.199999999999 | 9794.000000000002 | 0.158 | 89 | 46 | 43 | 0.8323 |
| `squadPerformance.meanCohesion` | 9662.900000000001 | 9705.100000000002 | 0.422 | 94 | 56 | 38 | 0.079 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

contact-prone-support-20261021-0060 197.1 s (timeline) · contact-prone-support-20261021-0039 198 s (timeline) · contact-prone-support-20261021-0088 198 s (timeline) · contact-prone-support-20261021-0013 199.05 s (timeline) · contact-prone-support-20261021-0074 199.05 s (timeline) · contact-prone-support-20261021-0027 200.1 s (timeline) · contact-prone-support-20261021-0055 202.05 s (timeline) · contact-prone-support-20261021-0016 203.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1218&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-firing-positions-20261021/ai_flow_live.html?bench=1218&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1218`); it opens the seed that parts earliest, and the dropdowns choose another.

