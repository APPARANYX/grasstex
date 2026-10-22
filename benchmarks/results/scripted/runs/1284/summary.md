# Benchmark run #1284 · 100 seeds from `gap-sup-20261022` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1`
- work/suppress-believed-20261022 @ d09a0f7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39849298694) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 180 s); 6 of 42 counters under p 0.05 (about 2.1 by chance), 4 under 0.0012; casualties -2.2% (p 0.6849)**

- Clears the Bonferroni line (p < 0.0012): fire.total 26225 to 42766 (+63.1%, p 0); squadPerformance.meanMission 6758.099999999996 to 6493.6 (-3.9%, p 0); loopAlerts.length 723 to 989 (+36.8%, p 0.0001); squadPerformance.meanOverall 8175.599999999995 to 8089.7 (-1.1%, p 0.0001).
- Under 0.05 only: vacantObjectiveStalls.length 501 to 604 (+20.6%, p 0.0042); retreatSamples 141606 to 162024 (+14.4%, p 0.012).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.024 (gate 1.25)
- the 100 changed records first part at simulated second: min 145.05, p10 160.05, median 180, p90 219, max 246

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5344 | 5228 | -1.16 | 97 | 46 | 51 | 0.6849 |
| `usKills` | 2471 | 2384 | -0.87 | 94 | 42 | 52 | 0.3533 |
| `geKills` | 2873 | 2844 | -0.29 | 97 | 44 | 53 | 0.4168 |
| `fire.total` | 26225 | 42766 | 165.41 | 100 | 93 | 7 | 0 |
| `fire.hits` | 10485 | 10153 | -3.32 | 100 | 45 | 55 | 0.3682 |
| `retreatSamples` | 141606 | 162024 | 204.18 | 100 | 63 | 37 | 0.012 |
| `movementResolver.changes` | 323725 | 328990 | 52.65 | 100 | 54 | 46 | 0.4841 |
| `grenades.throws` | 24 | 12 | -0.12 | 11 | 5 | 6 | 1 |
| `grenades.bursts` | 24 | 12 | -0.12 | 11 | 5 | 6 | 1 |
| `grenades.wounded` | 20 | 6 | -0.14 | 7 | 3 | 4 | 1 |
| `grenades.casualties` | 9 | 5 | -0.04 | 6 | 3 | 3 | 1 |
| `grenades.suppressed` | 40 | 19 | -0.21 | 7 | 3 | 4 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 0 | -0.02 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 1 | 4 | 0.03 | 2 | 2 | 0 | 0.5 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 501 | 604 | 1.03 | 90 | 59 | 31 | 0.0042 |
| `loopAlerts.length` | 723 | 989 | 2.66 | 91 | 65 | 26 | 0.0001 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 413 | 434 | 0.21 | 88 | 45 | 43 | 0.9152 |
| `stallOutcomes.wakes` | 5 | 6 | 0.01 | 11 | 6 | 5 | 1 |
| `stallOutcomes.repeats` | 1 | 2 | 0.01 | 3 | 2 | 1 | 1 |
| `timeline.stalledOnsets` | 1 | 4 | 0.03 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledSamples` | 9 | 224 | 2.15 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 1 | 4 | 0.03 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledSamplesRepeated` | 9 | 224 | 2.15 | 2 | 2 | 0 | 0.5 |
| `recon.orders` | 3233 | 3288 | 0.55 | 95 | 52 | 43 | 0.4119 |
| `recon.contacts` | 142 | 145 | 0.03 | 61 | 33 | 28 | 0.6089 |
| `recon.noContact` | 2050 | 2066 | 0.16 | 92 | 50 | 42 | 0.4657 |
| `recon.timeouts` | 31 | 32 | 0.01 | 34 | 18 | 16 | 0.8642 |
| `recon.cancelled` | 885 | 901 | 0.16 | 85 | 42 | 43 | 1 |
| `recon.reportsDelivered` | 600 | 614 | 0.14 | 69 | 36 | 33 | 0.8099 |
| `recon.retriggerBlocked` | 2524 | 2553 | 0.29 | 91 | 47 | 44 | 0.8341 |
| `squadPerformance.meanOverall` | 8175.599999999995 | 8089.7 | -0.859 | 98 | 29 | 69 | 0.0001 |
| `squadPerformance.p10Overall` | 7500.400000000002 | 7467.300000000003 | -0.331 | 60 | 22 | 38 | 0.0519 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6758.099999999996 | 6493.6 | -2.645 | 100 | 29 | 71 | 0 |
| `squadPerformance.meanMovement` | 9972.999999999998 | 9971.3 | -0.017 | 76 | 32 | 44 | 0.2067 |
| `squadPerformance.meanControl` | 9364.099999999997 | 9321.300000000001 | -0.428 | 100 | 43 | 57 | 0.1933 |
| `squadPerformance.meanCohesion` | 8967.900000000001 | 9027.600000000002 | 0.597 | 100 | 58 | 42 | 0.1332 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

gap-sup-20261022-0057 145.05 s (timeline) · gap-sup-20261022-0015 153 s (timeline) · gap-sup-20261022-0075 154.05 s (timeline) · gap-sup-20261022-0058 155.1 s (timeline) · gap-sup-20261022-0011 156 s (timeline) · gap-sup-20261022-0027 157.05 s (timeline) · gap-sup-20261022-0041 157.05 s (timeline) · gap-sup-20261022-0060 158.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1284&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/suppress-believed-20261022/ai_flow_live.html?bench=1284&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1284`); it opens the seed that parts earliest, and the dropdowns choose another.

