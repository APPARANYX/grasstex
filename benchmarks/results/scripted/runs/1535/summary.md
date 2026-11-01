# Benchmark run #1535 · 60 seeds from `p703` (meeting), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerLeaderless=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/pr703-4b875e44 @ 4b875e4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41256109608) · build v29-dev

## Verdict

**QUIET: 60 of 60 pairs changed (median first part 308.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.008 (gate 1.25)
- the 18 changed records first part at simulated second: min 227.1, p10 234, median 308.1, p90 463.05, max 468

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2489 | 2489 | 0 | 15 | 8 | 7 | 1 |
| `usKills` | 1081 | 1075 | -0.1 | 13 | 6 | 7 | 1 |
| `geKills` | 1408 | 1414 | 0.1 | 13 | 8 | 5 | 0.5811 |
| `fire.total` | 67050 | 66283 | -12.7833 | 17 | 9 | 8 | 1 |
| `fire.hits` | 5415 | 5469 | 0.9 | 16 | 11 | 5 | 0.2101 |
| `retreatSamples` | 125581 | 126738 | 19.2833 | 17 | 11 | 6 | 0.3323 |
| `movementResolver.changes` | 287779 | 287686 | -1.55 | 18 | 9 | 9 | 1 |
| `grenades.throws` | 46 | 50 | 0.0667 | 7 | 6 | 1 | 0.125 |
| `grenades.bursts` | 46 | 50 | 0.0667 | 7 | 6 | 1 | 0.125 |
| `grenades.wounded` | 30 | 29 | -0.0167 | 4 | 3 | 1 | 0.625 |
| `grenades.casualties` | 10 | 9 | -0.0167 | 2 | 1 | 1 | 1 |
| `grenades.suppressed` | 81 | 66 | -0.25 | 4 | 3 | 1 | 0.625 |
| `grenades.friendlyWounded` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 14 | 12 | -0.0333 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 261 | 259 | -0.0333 | 12 | 8 | 4 | 0.3877 |
| `loopAlerts.length` | 975 | 974 | -0.0167 | 7 | 3 | 4 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 327 | 318 | -0.15 | 15 | 5 | 10 | 0.3018 |
| `stallOutcomes.wakes` | 3 | 3 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1776 | 1768 | -0.1333 | 16 | 7 | 9 | 0.8036 |
| `recon.contacts` | 90 | 94 | 0.0667 | 8 | 6 | 2 | 0.2891 |
| `recon.noContact` | 905 | 894 | -0.1833 | 16 | 7 | 9 | 0.8036 |
| `recon.timeouts` | 7 | 7 | 0 | 2 | 1 | 1 | 1 |
| `recon.cancelled` | 696 | 697 | 0.0167 | 15 | 6 | 9 | 0.6072 |
| `recon.reportsDelivered` | 415 | 421 | 0.1 | 7 | 5 | 2 | 0.4531 |
| `recon.retriggerBlocked` | 1384 | 1376 | -0.1333 | 16 | 9 | 7 | 0.8036 |
| `squadPerformance.meanOverall` | 4783.099999999998 | 4781.899999999999 | -0.02 | 16 | 8 | 8 | 1 |
| `squadPerformance.p10Overall` | 4466.1 | 4468.4 | 0.0383 | 6 | 3 | 3 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3608.400000000001 | 3613.100000000001 | 0.0783 | 15 | 9 | 6 | 0.6072 |
| `squadPerformance.meanMovement` | 5979.500000000001 | 5979.3 | -0.0033 | 9 | 4 | 5 | 1 |
| `squadPerformance.meanControl` | 5611.6 | 5609.700000000001 | -0.0317 | 15 | 7 | 8 | 1 |
| `squadPerformance.meanCohesion` | 5567.999999999999 | 5569.199999999999 | 0.02 | 14 | 8 | 6 | 0.7905 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

p703-0034 227.1 s (timeline) · p703-0004 234 s (timeline) · p703-0019 249 s (timeline) · p703-0048 262.05 s (timeline) · p703-0014 263.1 s (timeline) · p703-0028 266.1 s (timeline) · p703-0036 272.1 s (timeline) · p703-0054 280.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1535&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pr703-4b875e44/ai_flow_live.html?bench=1535&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1535`); it opens the seed that parts earliest, and the dropdowns choose another.

