# Benchmark run #1285 · 100 seeds from `gap-sup-20261022` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1`
- work/suppress-believed-20261022 @ d09a0f7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39849303855) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 152.55 s); 7 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties -6.4% (p 0.0008)**

- Clears the Bonferroni line (p < 0.0012): fire.total 24813 to 34261 (+38.1%, p 0); casualties 4965 to 4645 (-6.4%, p 0.0008).
- Under 0.05 only: squadPerformance.meanCohesion 8890.299999999996 to 8954.4 (+0.7%, p 0.0031); recon.orders 2258 to 2129 (-5.7%, p 0.006); recon.noContact 1277 to 1195 (-6.4%, p 0.0073); regroups.entries 467 to 396 (-15.2%, p 0.0117); loopAlerts.length 503 to 664 (+32.0%, p 0.0422).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.982 (gate 1.25)
- the 92 changed records first part at simulated second: min 78, p10 113.1, median 152.55, p90 183, max 251.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4965 | 4645 | -3.2 | 81 | 25 | 56 | 0.0008 |
| `usKills` | 2362 | 2382 | 0.2 | 84 | 39 | 45 | 0.5856 |
| `geKills` | 2603 | 2263 | -3.4 | 89 | 38 | 51 | 0.2031 |
| `fire.total` | 24813 | 34261 | 94.48 | 92 | 75 | 17 | 0 |
| `fire.hits` | 9166 | 8641 | -5.25 | 92 | 39 | 53 | 0.175 |
| `retreatSamples` | 169373 | 185796 | 164.23 | 92 | 54 | 38 | 0.1174 |
| `movementResolver.changes` | 234060 | 231476 | -25.84 | 92 | 49 | 43 | 0.6024 |
| `grenades.throws` | 27 | 18 | -0.09 | 12 | 6 | 6 | 1 |
| `grenades.bursts` | 27 | 18 | -0.09 | 12 | 6 | 6 | 1 |
| `grenades.wounded` | 13 | 7 | -0.06 | 7 | 4 | 3 | 1 |
| `grenades.casualties` | 8 | 6 | -0.02 | 5 | 3 | 2 | 1 |
| `grenades.suppressed` | 35 | 15 | -0.2 | 11 | 6 | 5 | 1 |
| `grenades.friendlyWounded` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 255 | 236 | -0.19 | 81 | 37 | 44 | 0.5052 |
| `loopAlerts.length` | 503 | 664 | 1.61 | 88 | 54 | 34 | 0.0422 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 467 | 396 | -0.71 | 77 | 27 | 50 | 0.0117 |
| `stallOutcomes.wakes` | 9 | 3 | -0.06 | 12 | 3 | 9 | 0.146 |
| `stallOutcomes.repeats` | 0 | 2 | 0.02 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsets` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 9 | 0 | -0.09 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 9 | 0 | -0.09 | 1 | 0 | 1 | 1 |
| `recon.orders` | 2258 | 2129 | -1.29 | 84 | 29 | 55 | 0.006 |
| `recon.contacts` | 193 | 195 | 0.02 | 70 | 32 | 38 | 0.5504 |
| `recon.noContact` | 1277 | 1195 | -0.82 | 81 | 28 | 53 | 0.0073 |
| `recon.timeouts` | 159 | 153 | -0.06 | 62 | 28 | 34 | 0.5258 |
| `recon.cancelled` | 524 | 492 | -0.32 | 79 | 34 | 45 | 0.2604 |
| `recon.reportsDelivered` | 783 | 778 | -0.05 | 79 | 40 | 39 | 1 |
| `recon.retriggerBlocked` | 1278 | 1217 | -0.61 | 87 | 39 | 48 | 0.3912 |
| `squadPerformance.meanOverall` | 8395.2 | 8351.6 | -0.436 | 88 | 35 | 53 | 0.0693 |
| `squadPerformance.p10Overall` | 7612.600000000004 | 7606.4000000000015 | -0.062 | 45 | 22 | 23 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7208.6 | 7050.499999999998 | -1.581 | 91 | 38 | 53 | 0.1418 |
| `squadPerformance.meanMovement` | 9985.19999999999 | 9984.899999999996 | -0.003 | 57 | 26 | 31 | 0.5966 |
| `squadPerformance.meanControl` | 9683.699999999999 | 9648.3 | -0.354 | 92 | 47 | 45 | 0.917 |
| `squadPerformance.meanCohesion` | 8890.299999999996 | 8954.4 | 0.641 | 91 | 60 | 31 | 0.0031 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

gap-sup-20261022-0062 78 s (timeline) · gap-sup-20261022-0038 93 s (timeline) · gap-sup-20261022-0088 103.05 s (stress) · gap-sup-20261022-0014 105 s (timeline) · gap-sup-20261022-0025 108 s (timeline) · gap-sup-20261022-0086 110.1 s (timeline) · gap-sup-20261022-0008 112.05 s (timeline) · gap-sup-20261022-0096 112.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1285&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/suppress-believed-20261022/ai_flow_live.html?bench=1285&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1285`); it opens the seed that parts earliest, and the dropdowns choose another.

