# Benchmark run #1310 · 100 seeds from `tg-20261024-c` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&talkingGuns=1`
- work/talking-guns-20261024 @ e91fa6d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40116012510) · build v29-dev

## Verdict

**WEAK: 99 of 100 pairs changed (median first part 162 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.7% (p 0.4452)**

- Under 0.05 only: fire.total 40695 to 37960 (-6.7%, p 0.0055).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.975 (gate 1.25)
- the 89 changed records first part at simulated second: min 92.1, p10 125.1, median 162, p90 236.1, max 396.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4655 | 4623 | -0.32 | 84 | 38 | 46 | 0.4452 |
| `usKills` | 2019 | 1971 | -0.48 | 81 | 33 | 48 | 0.1193 |
| `geKills` | 2636 | 2652 | 0.16 | 82 | 42 | 40 | 0.9122 |
| `fire.total` | 40695 | 37960 | -27.35 | 89 | 31 | 58 | 0.0055 |
| `fire.hits` | 8396 | 8504 | 1.08 | 88 | 43 | 45 | 0.9152 |
| `retreatSamples` | 200158 | 193941 | -62.17 | 89 | 44 | 45 | 1 |
| `movementResolver.changes` | 229576 | 225479 | -40.97 | 89 | 49 | 40 | 0.3966 |
| `grenades.throws` | 24 | 20 | -0.04 | 11 | 4 | 7 | 0.5488 |
| `grenades.bursts` | 24 | 20 | -0.04 | 11 | 4 | 7 | 0.5488 |
| `grenades.wounded` | 12 | 7 | -0.05 | 8 | 2 | 6 | 0.2891 |
| `grenades.casualties` | 4 | 2 | -0.02 | 5 | 1 | 4 | 0.375 |
| `grenades.suppressed` | 30 | 24 | -0.06 | 9 | 2 | 7 | 0.1797 |
| `grenades.friendlyWounded` | 1 | 2 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 210 | 216 | 0.06 | 64 | 33 | 31 | 0.9007 |
| `loopAlerts.length` | 720 | 656 | -0.64 | 79 | 33 | 46 | 0.1766 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 376 | 396 | 0.2 | 67 | 40 | 27 | 0.1421 |
| `stallOutcomes.wakes` | 3 | 2 | -0.01 | 5 | 2 | 3 | 1 |
| `stallOutcomes.repeats` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 24 | 0 | -0.24 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 24 | 0 | -0.24 | 1 | 0 | 1 | 1 |
| `recon.orders` | 2095 | 2084 | -0.11 | 81 | 39 | 42 | 0.8243 |
| `recon.contacts` | 218 | 205 | -0.13 | 73 | 30 | 43 | 0.1597 |
| `recon.noContact` | 1208 | 1192 | -0.16 | 72 | 34 | 38 | 0.7239 |
| `recon.timeouts` | 121 | 133 | 0.12 | 52 | 33 | 19 | 0.0704 |
| `recon.cancelled` | 472 | 477 | 0.05 | 77 | 38 | 39 | 1 |
| `recon.reportsDelivered` | 848 | 816 | -0.32 | 81 | 34 | 47 | 0.1821 |
| `recon.retriggerBlocked` | 1220 | 1215 | -0.05 | 73 | 35 | 38 | 0.8151 |
| `squadPerformance.meanOverall` | 8366.299999999996 | 8384.799999999996 | 0.185 | 86 | 49 | 37 | 0.2354 |
| `squadPerformance.p10Overall` | 7671.400000000003 | 7643.300000000004 | -0.281 | 59 | 23 | 36 | 0.1175 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7029.4000000000015 | 7102.199999999997 | 0.728 | 89 | 47 | 42 | 0.6718 |
| `squadPerformance.meanMovement` | 9986.899999999996 | 9986.899999999994 | 0 | 43 | 21 | 22 | 1 |
| `squadPerformance.meanControl` | 9651.7 | 9658.700000000004 | 0.07 | 87 | 50 | 37 | 0.198 |
| `squadPerformance.meanCohesion` | 8923.199999999999 | 8896.300000000001 | -0.269 | 87 | 40 | 47 | 0.5203 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

tg-20261024-c-0080 92.1 s (timeline) · tg-20261024-c-0088 98.1 s (timeline) · tg-20261024-c-0010 102 s (stress) · tg-20261024-c-0058 112.05 s (timeline) · tg-20261024-c-0081 116.1 s (stress) · tg-20261024-c-0067 117 s (timeline) · tg-20261024-c-0062 123 s (stress) · tg-20261024-c-0068 124.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1310&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/talking-guns-20261024/ai_flow_live.html?bench=1310&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1310`); it opens the seed that parts earliest, and the dropdowns choose another.

