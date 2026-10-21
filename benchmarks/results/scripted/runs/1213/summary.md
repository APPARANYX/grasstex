# Benchmark run #1213 · 100 seeds from `contact-prone-support-20261021` (meeting), windows `0+600`

- **OFF** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=0` · **ON** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/contact-cover-first-20261021 @ b71eecd · [run](https://github.com/APPARANYX/grasstex/actions/runs/39693675762) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 238.575 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +1.1% (p 0.6785)**

- Under 0.05 only: recon.contacts 114 to 132 (+15.8%, p 0.0396).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.015 (gate 1.25)
- the 100 changed records first part at simulated second: min 197.1, p10 204, median 238.575, p90 282, max 354.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3216 | 3252 | 0.36 | 93 | 49 | 44 | 0.6785 |
| `usKills` | 1670 | 1760 | 0.9 | 95 | 50 | 45 | 0.6817 |
| `geKills` | 1546 | 1492 | -0.54 | 95 | 47 | 48 | 1 |
| `fire.total` | 16070 | 15201 | -8.69 | 100 | 45 | 55 | 0.3682 |
| `fire.hits` | 6945 | 6715 | -2.3 | 98 | 45 | 53 | 0.4797 |
| `retreatSamples` | 95356 | 94343 | -10.13 | 100 | 50 | 50 | 1 |
| `movementResolver.changes` | 128889 | 132239 | 33.5 | 100 | 59 | 41 | 0.0886 |
| `grenades.throws` | 22 | 25 | 0.03 | 8 | 4 | 4 | 1 |
| `grenades.bursts` | 22 | 25 | 0.03 | 8 | 4 | 4 | 1 |
| `grenades.wounded` | 22 | 47 | 0.25 | 5 | 2 | 3 | 1 |
| `grenades.casualties` | 6 | 18 | 0.12 | 4 | 2 | 2 | 1 |
| `grenades.suppressed` | 49 | 115 | 0.66 | 7 | 4 | 3 | 1 |
| `grenades.friendlyWounded` | 0 | 8 | 0.08 | 2 | 2 | 0 | 0.5 |
| `grenades.friendlyCasualties` | 0 | 4 | 0.04 | 2 | 2 | 0 | 0.5 |
| `grenades.aborted` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 37 | 43 | 0.06 | 27 | 13 | 14 | 1 |
| `routeStalls.length` | 141 | 140 | -0.01 | 22 | 9 | 13 | 0.5235 |
| `targetlessStalls.length` | 15 | 12 | -0.03 | 15 | 6 | 9 | 0.6072 |
| `vacantObjectiveStalls.length` | 324 | 323 | -0.01 | 80 | 39 | 41 | 0.9111 |
| `loopAlerts.length` | 967 | 983 | 0.16 | 91 | 48 | 43 | 0.6752 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 164 | 169 | 0.05 | 77 | 40 | 37 | 0.8199 |
| `stallOutcomes.wakes` | 6 | 2 | -0.04 | 7 | 2 | 5 | 0.4531 |
| `stallOutcomes.repeats` | 6 | 2 | -0.04 | 7 | 2 | 5 | 0.4531 |
| `timeline.stalledOnsets` | 46 | 44 | -0.02 | 28 | 13 | 15 | 0.8506 |
| `timeline.stalledSamples` | 245 | 1976 | 17.31 | 29 | 14 | 15 | 1 |
| `timeline.stalledOnsetsRepeated` | 46 | 44 | -0.02 | 28 | 13 | 15 | 0.8506 |
| `timeline.stalledSamplesRepeated` | 245 | 1976 | 17.31 | 29 | 14 | 15 | 1 |
| `recon.orders` | 1753 | 1730 | -0.23 | 87 | 41 | 46 | 0.6683 |
| `recon.contacts` | 114 | 132 | 0.18 | 61 | 39 | 22 | 0.0396 |
| `recon.noContact` | 386 | 392 | 0.06 | 84 | 41 | 43 | 0.9132 |
| `recon.timeouts` | 495 | 504 | 0.09 | 60 | 34 | 26 | 0.3663 |
| `recon.cancelled` | 634 | 603 | -0.31 | 82 | 37 | 45 | 0.4397 |
| `recon.reportsDelivered` | 465 | 547 | 0.82 | 65 | 39 | 26 | 0.136 |
| `recon.retriggerBlocked` | 907 | 920 | 0.13 | 87 | 42 | 45 | 0.8304 |
| `squadPerformance.meanOverall` | 8558.100000000004 | 8547.800000000001 | -0.103 | 96 | 43 | 53 | 0.3584 |
| `squadPerformance.p10Overall` | 7504.900000000002 | 7498.500000000002 | -0.064 | 68 | 37 | 31 | 0.5446 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7141.900000000001 | 7117.399999999999 | -0.245 | 99 | 42 | 57 | 0.1591 |
| `squadPerformance.meanMovement` | 9786.600000000002 | 9793.600000000004 | 0.07 | 94 | 53 | 41 | 0.2564 |
| `squadPerformance.meanControl` | 9517.500000000002 | 9521.9 | 0.044 | 99 | 52 | 47 | 0.6879 |
| `squadPerformance.meanCohesion` | 9676.300000000001 | 9680.9 | 0.046 | 99 | 52 | 47 | 0.6879 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

contact-prone-support-20261021-0060 197.1 s (timeline) · contact-prone-support-20261021-0039 198 s (timeline) · contact-prone-support-20261021-0088 198 s (timeline) · contact-prone-support-20261021-0013 199.05 s (timeline) · contact-prone-support-20261021-0074 199.05 s (timeline) · contact-prone-support-20261021-0027 200.1 s (timeline) · contact-prone-support-20261021-0055 202.05 s (timeline) · contact-prone-support-20261021-0016 203.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1213&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-cover-first-20261021/ai_flow_live.html?bench=1213&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1213`); it opens the seed that parts earliest, and the dropdowns choose another.

