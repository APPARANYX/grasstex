# Benchmark run #1313 · 100 seeds from `tgpb-20261024-c` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&pinBridge=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&pinBridge=1&talkingGuns=1`
- work/talking-guns-20261024 @ e91fa6d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40118032308) · build v29-dev

## Verdict

**QUIET: 97 of 100 pairs changed (median first part 167.55 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +4.1% (p 0.1093)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x0.966 (gate 1.25)
- the 90 changed records first part at simulated second: min 93, p10 128.1, median 167.55, p90 261, max 506.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3985 | 4149 | 1.64 | 88 | 52 | 36 | 0.1093 |
| `usKills` | 1733 | 1820 | 0.87 | 85 | 46 | 39 | 0.5154 |
| `geKills` | 2252 | 2329 | 0.77 | 84 | 43 | 41 | 0.9132 |
| `fire.total` | 35163 | 32415 | -27.48 | 89 | 37 | 52 | 0.1374 |
| `fire.hits` | 7741 | 7870 | 1.29 | 85 | 44 | 41 | 0.8284 |
| `retreatSamples` | 268494 | 251078 | -174.16 | 90 | 43 | 47 | 0.752 |
| `movementResolver.changes` | 227822 | 236122 | 83 | 90 | 49 | 41 | 0.4608 |
| `grenades.throws` | 27 | 18 | -0.09 | 11 | 4 | 7 | 0.5488 |
| `grenades.bursts` | 27 | 18 | -0.09 | 11 | 4 | 7 | 0.5488 |
| `grenades.wounded` | 13 | 5 | -0.08 | 3 | 0 | 3 | 0.25 |
| `grenades.casualties` | 5 | 1 | -0.04 | 2 | 0 | 2 | 0.5 |
| `grenades.suppressed` | 49 | 30 | -0.19 | 7 | 3 | 4 | 1 |
| `grenades.friendlyWounded` | 2 | 1 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 2 | 0.02 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 206 | 199 | -0.07 | 61 | 31 | 30 | 1 |
| `loopAlerts.length` | 672 | 676 | 0.04 | 76 | 35 | 41 | 0.5666 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 406 | 375 | -0.31 | 75 | 35 | 40 | 0.6445 |
| `stallOutcomes.wakes` | 4 | 1 | -0.03 | 5 | 1 | 4 | 0.375 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 2 | 0.02 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 90 | 0.9 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 2 | 0.02 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 90 | 0.9 | 1 | 1 | 0 | 1 |
| `recon.orders` | 1962 | 1990 | 0.28 | 86 | 48 | 38 | 0.3318 |
| `recon.contacts` | 175 | 176 | 0.01 | 68 | 36 | 32 | 0.7163 |
| `recon.noContact` | 1175 | 1190 | 0.15 | 71 | 37 | 34 | 0.8126 |
| `recon.timeouts` | 111 | 114 | 0.03 | 50 | 27 | 23 | 0.6718 |
| `recon.cancelled` | 418 | 420 | 0.02 | 70 | 34 | 36 | 0.905 |
| `recon.reportsDelivered` | 593 | 594 | 0.01 | 70 | 39 | 31 | 0.403 |
| `recon.retriggerBlocked` | 1206 | 1225 | 0.19 | 80 | 36 | 44 | 0.434 |
| `squadPerformance.meanOverall` | 8267.7 | 8279.5 | 0.118 | 87 | 42 | 45 | 0.8304 |
| `squadPerformance.p10Overall` | 7617.4000000000015 | 7613.300000000002 | -0.041 | 35 | 16 | 19 | 0.7359 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6595.0999999999985 | 6649.5999999999985 | 0.545 | 89 | 51 | 38 | 0.2031 |
| `squadPerformance.meanMovement` | 9990.099999999991 | 9988.899999999992 | -0.012 | 36 | 14 | 22 | 0.243 |
| `squadPerformance.meanControl` | 9728.800000000007 | 9719.900000000001 | -0.089 | 87 | 42 | 45 | 0.8304 |
| `squadPerformance.meanCohesion` | 9136.699999999999 | 9122.099999999997 | -0.146 | 88 | 44 | 44 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

tgpb-20261024-c-0049 93 s (stress) · tgpb-20261024-c-0044 113.1 s (timeline) · tgpb-20261024-c-0025 121.05 s (timeline) · tgpb-20261024-c-0065 122.1 s (timeline) · tgpb-20261024-c-0020 123 s (timeline) · tgpb-20261024-c-0063 126 s (timeline) · tgpb-20261024-c-0075 126 s (stress) · tgpb-20261024-c-0043 128.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1313&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/talking-guns-20261024/ai_flow_live.html?bench=1313&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1313`); it opens the seed that parts earliest, and the dropdowns choose another.

