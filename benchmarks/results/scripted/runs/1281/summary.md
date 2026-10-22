# Benchmark run #1281 · 100 seeds from `gap-hold-fh-20261022` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1`
- work/gap-holding-20261022 @ 4d53487 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39844920493) · build v29-dev

## Verdict

**QUIET: 97 of 100 pairs changed (median first part 146.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.4% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x0.966 (gate 1.25)
- the 91 changed records first part at simulated second: min 93, p10 117, median 146.1, p90 179.1, max 204

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4792 | 4812 | 0.2 | 86 | 43 | 43 | 1 |
| `usKills` | 2299 | 2292 | -0.07 | 85 | 41 | 44 | 0.8284 |
| `geKills` | 2493 | 2520 | 0.27 | 85 | 47 | 38 | 0.3857 |
| `fire.total` | 22623 | 22460 | -1.63 | 91 | 47 | 44 | 0.8341 |
| `fire.hits` | 8885 | 8777 | -1.08 | 91 | 40 | 51 | 0.2945 |
| `retreatSamples` | 147659 | 156416 | 87.57 | 91 | 54 | 37 | 0.0929 |
| `movementResolver.changes` | 223594 | 224149 | 5.55 | 90 | 48 | 42 | 0.5984 |
| `grenades.throws` | 34 | 36 | 0.02 | 19 | 9 | 10 | 1 |
| `grenades.bursts` | 34 | 36 | 0.02 | 19 | 9 | 10 | 1 |
| `grenades.wounded` | 19 | 23 | 0.04 | 8 | 4 | 4 | 1 |
| `grenades.casualties` | 7 | 6 | -0.01 | 6 | 3 | 3 | 1 |
| `grenades.suppressed` | 39 | 64 | 0.25 | 13 | 5 | 8 | 0.5811 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 2 | 0 | 3 | 2 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 190 | 199 | 0.09 | 72 | 40 | 32 | 0.4096 |
| `loopAlerts.length` | 524 | 542 | 0.18 | 82 | 43 | 39 | 0.7407 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 336 | 373 | 0.37 | 73 | 41 | 32 | 0.3492 |
| `stallOutcomes.wakes` | 3 | 11 | 0.08 | 14 | 11 | 3 | 0.0574 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 4 | 2 | 2 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2075 | 2098 | 0.23 | 77 | 43 | 34 | 0.362 |
| `recon.contacts` | 216 | 205 | -0.11 | 68 | 34 | 34 | 1 |
| `recon.noContact` | 1141 | 1166 | 0.25 | 78 | 47 | 31 | 0.0888 |
| `recon.timeouts` | 131 | 119 | -0.12 | 41 | 17 | 24 | 0.3489 |
| `recon.cancelled` | 492 | 498 | 0.06 | 78 | 40 | 38 | 0.9099 |
| `recon.reportsDelivered` | 889 | 779 | -1.1 | 79 | 34 | 45 | 0.2604 |
| `recon.retriggerBlocked` | 1214 | 1215 | 0.01 | 80 | 46 | 34 | 0.2185 |
| `squadPerformance.meanOverall` | 8490.299999999996 | 8467.1 | -0.232 | 89 | 39 | 50 | 0.2891 |
| `squadPerformance.p10Overall` | 7703.300000000003 | 7696.500000000001 | -0.068 | 76 | 37 | 39 | 0.9088 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7470.199999999999 | 7395.2 | -0.75 | 89 | 43 | 46 | 0.8323 |
| `squadPerformance.meanMovement` | 9984.299999999994 | 9985.499999999995 | 0.012 | 56 | 33 | 23 | 0.2288 |
| `squadPerformance.meanControl` | 9648.099999999999 | 9660.300000000001 | 0.122 | 89 | 41 | 48 | 0.525 |
| `squadPerformance.meanCohesion` | 8812.2 | 8855.399999999998 | 0.432 | 89 | 46 | 43 | 0.8323 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

gap-hold-fh-20261022-0082 93 s (timeline) · gap-hold-fh-20261022-0038 101.1 s (timeline) · gap-hold-fh-20261022-0084 104.1 s (timeline) · gap-hold-fh-20261022-0080 105 s (timeline) · gap-hold-fh-20261022-0013 107.1 s (timeline) · gap-hold-fh-20261022-0006 108 s (timeline) · gap-hold-fh-20261022-0026 115.05 s (timeline) · gap-hold-fh-20261022-0018 116.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1281&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/gap-holding-20261022/ai_flow_live.html?bench=1281&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1281`); it opens the seed that parts earliest, and the dropdowns choose another.

