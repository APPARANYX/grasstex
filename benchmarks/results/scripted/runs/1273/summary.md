# Benchmark run #1273 · 100 seeds from `gap-hold-20261022` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1`
- work/gap-holding-20261022 @ 3b1b1a2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39830775743) · build v29-dev

## Verdict

**WEAK: 98 of 100 pairs changed (median first part 148.575 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.9% (p 0.3261)**

- Under 0.05 only: movementResolver.changes 220357 to 207049 (-6.0%, p 0.0067); grenades.throws 39 to 11 (-71.8%, p 0.0213); grenades.bursts 39 to 11 (-71.8%, p 0.0213).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x0.941 (gate 1.25)
- the 86 changed records first part at simulated second: min 94.05, p10 115.05, median 148.575, p90 188.1, max 250.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4749 | 4610 | -1.39 | 84 | 37 | 47 | 0.3261 |
| `usKills` | 2378 | 2130 | -2.48 | 81 | 36 | 45 | 0.3742 |
| `geKills` | 2371 | 2480 | 1.09 | 83 | 47 | 36 | 0.2723 |
| `fire.total` | 21306 | 21949 | 6.43 | 86 | 45 | 41 | 0.7465 |
| `fire.hits` | 8519 | 8194 | -3.25 | 84 | 39 | 45 | 0.5856 |
| `retreatSamples` | 142878 | 141994 | -8.84 | 86 | 47 | 39 | 0.4505 |
| `movementResolver.changes` | 220357 | 207049 | -133.08 | 86 | 30 | 56 | 0.0067 |
| `grenades.throws` | 39 | 11 | -0.28 | 16 | 3 | 13 | 0.0213 |
| `grenades.bursts` | 39 | 11 | -0.28 | 16 | 3 | 13 | 0.0213 |
| `grenades.wounded` | 12 | 2 | -0.1 | 9 | 2 | 7 | 0.1797 |
| `grenades.casualties` | 4 | 0 | -0.04 | 3 | 0 | 3 | 0.25 |
| `grenades.suppressed` | 49 | 28 | -0.21 | 9 | 2 | 7 | 0.1797 |
| `grenades.friendlyWounded` | 4 | 0 | -0.04 | 2 | 0 | 2 | 0.5 |
| `grenades.friendlyCasualties` | 2 | 0 | -0.02 | 1 | 0 | 1 | 1 |
| `grenades.aborted` | 0 | 2 | 0.02 | 2 | 2 | 0 | 0.5 |
| `movementStalls.length` | 4 | 0 | -0.04 | 3 | 0 | 3 | 0.25 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 247 | 197 | -0.5 | 71 | 27 | 44 | 0.0568 |
| `loopAlerts.length` | 542 | 485 | -0.57 | 77 | 35 | 42 | 0.4944 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 426 | 409 | -0.17 | 75 | 31 | 44 | 0.1654 |
| `stallOutcomes.wakes` | 13 | 4 | -0.09 | 14 | 3 | 11 | 0.0574 |
| `stallOutcomes.repeats` | 2 | 0 | -0.02 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsets` | 5 | 0 | -0.05 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledSamples` | 74 | 0 | -0.74 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsetsRepeated` | 5 | 0 | -0.05 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledSamplesRepeated` | 74 | 0 | -0.74 | 3 | 0 | 3 | 0.25 |
| `recon.orders` | 1918 | 1912 | -0.06 | 80 | 40 | 40 | 1 |
| `recon.contacts` | 178 | 189 | 0.11 | 66 | 33 | 33 | 1 |
| `recon.noContact` | 1118 | 1144 | 0.26 | 72 | 41 | 31 | 0.2888 |
| `recon.timeouts` | 77 | 85 | 0.08 | 44 | 25 | 19 | 0.4514 |
| `recon.cancelled` | 455 | 394 | -0.61 | 74 | 29 | 45 | 0.0805 |
| `recon.reportsDelivered` | 789 | 727 | -0.62 | 79 | 37 | 42 | 0.653 |
| `recon.retriggerBlocked` | 1173 | 1185 | 0.12 | 77 | 39 | 38 | 1 |
| `squadPerformance.meanOverall` | 8518.1 | 8533.6 | 0.155 | 86 | 47 | 39 | 0.4505 |
| `squadPerformance.p10Overall` | 7746.300000000003 | 7758.800000000004 | 0.125 | 64 | 29 | 35 | 0.5323 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7548.399999999997 | 7561.700000000001 | 0.133 | 85 | 44 | 41 | 0.8284 |
| `squadPerformance.meanMovement` | 9984.299999999994 | 9986.699999999992 | 0.024 | 55 | 32 | 23 | 0.2806 |
| `squadPerformance.meanControl` | 9662.7 | 9692.899999999998 | 0.302 | 84 | 45 | 39 | 0.5856 |
| `squadPerformance.meanCohesion` | 8758.200000000003 | 8776.4 | 0.182 | 85 | 46 | 39 | 0.5154 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

gap-hold-20261022-0054 94.05 s (timeline) · gap-hold-20261022-0004 104.1 s (timeline) · gap-hold-20261022-0092 107.1 s (timeline) · gap-hold-20261022-0099 107.1 s (timeline) · gap-hold-20261022-0080 108 s (timeline) · gap-hold-20261022-0064 110.1 s (timeline) · gap-hold-20261022-0015 112.05 s (timeline) · gap-hold-20261022-0021 115.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1273&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/gap-holding-20261022/ai_flow_live.html?bench=1273&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1273`); it opens the seed that parts earliest, and the dropdowns choose another.

