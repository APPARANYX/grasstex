# Benchmark run #1271 · 100 seeds from `gap-hold-20261022` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1`
- work/gap-holding-20261022 @ 3b1b1a2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39830770621) · build v29-dev

## Verdict

**WEAK: 98 of 100 pairs changed (median first part 150 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.7% (p 0.38)**

- Under 0.05 only: usKills 1946 to 2179 (+12.0%, p 0.0023); squadPerformance.meanMovement 9984.899999999994 to 9987.39999999999 (+0.0%, p 0.0175); geKills 2606 to 2343 (-10.1%, p 0.0198).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x0.965 (gate 1.25)
- the 86 changed records first part at simulated second: min 86.1, p10 105, median 150, p90 175.05, max 202.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4552 | 4522 | -0.3 | 83 | 37 | 46 | 0.38 |
| `usKills` | 1946 | 2179 | 2.33 | 80 | 54 | 26 | 0.0023 |
| `geKills` | 2606 | 2343 | -2.63 | 82 | 30 | 52 | 0.0198 |
| `fire.total` | 21955 | 23788 | 18.33 | 85 | 50 | 35 | 0.1284 |
| `fire.hits` | 8418 | 8537 | 1.19 | 85 | 44 | 41 | 0.8284 |
| `retreatSamples` | 152019 | 163556 | 115.37 | 86 | 52 | 34 | 0.0662 |
| `movementResolver.changes` | 223557 | 220905 | -26.52 | 86 | 41 | 45 | 0.7465 |
| `grenades.throws` | 28 | 23 | -0.05 | 13 | 5 | 8 | 0.5811 |
| `grenades.bursts` | 28 | 23 | -0.05 | 13 | 5 | 8 | 0.5811 |
| `grenades.wounded` | 10 | 12 | 0.02 | 5 | 3 | 2 | 1 |
| `grenades.casualties` | 3 | 0 | -0.03 | 3 | 0 | 3 | 0.25 |
| `grenades.suppressed` | 24 | 48 | 0.24 | 7 | 4 | 3 | 1 |
| `grenades.friendlyWounded` | 1 | 6 | 0.05 | 3 | 2 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 3 | 1 | -0.02 | 2 | 0 | 2 | 0.5 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 235 | 219 | -0.16 | 66 | 33 | 33 | 1 |
| `loopAlerts.length` | 515 | 498 | -0.17 | 76 | 35 | 41 | 0.5666 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 405 | 362 | -0.43 | 64 | 27 | 37 | 0.2604 |
| `stallOutcomes.wakes` | 8 | 6 | -0.02 | 14 | 6 | 8 | 0.7905 |
| `stallOutcomes.repeats` | 4 | 1 | -0.03 | 5 | 1 | 4 | 0.375 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2106 | 2035 | -0.71 | 86 | 36 | 50 | 0.1606 |
| `recon.contacts` | 196 | 199 | 0.03 | 71 | 36 | 35 | 1 |
| `recon.noContact` | 1156 | 1118 | -0.38 | 73 | 31 | 42 | 0.2416 |
| `recon.timeouts` | 98 | 108 | 0.1 | 50 | 28 | 22 | 0.4799 |
| `recon.cancelled` | 499 | 475 | -0.24 | 75 | 32 | 43 | 0.248 |
| `recon.reportsDelivered` | 799 | 835 | 0.36 | 78 | 38 | 40 | 0.9099 |
| `recon.retriggerBlocked` | 1246 | 1188 | -0.58 | 79 | 34 | 45 | 0.2604 |
| `squadPerformance.meanOverall` | 8486.800000000003 | 8488.499999999996 | 0.017 | 86 | 46 | 40 | 0.59 |
| `squadPerformance.p10Overall` | 7760.500000000005 | 7760.500000000005 | 0 | 44 | 23 | 21 | 0.8804 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7372.499999999996 | 7352.499999999999 | -0.2 | 85 | 40 | 45 | 0.6646 |
| `squadPerformance.meanMovement` | 9984.899999999994 | 9987.39999999999 | 0.025 | 52 | 35 | 17 | 0.0175 |
| `squadPerformance.meanControl` | 9673.200000000003 | 9712.199999999999 | 0.39 | 84 | 51 | 33 | 0.063 |
| `squadPerformance.meanCohesion` | 8959.999999999998 | 9008.099999999999 | 0.481 | 85 | 47 | 38 | 0.3857 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

gap-hold-20261022-0003 86.1 s (timeline) · gap-hold-20261022-0039 87 s (timeline) · gap-hold-20261022-0040 92.1 s (timeline) · gap-hold-20261022-0070 98.1 s (timeline) · gap-hold-20261022-0004 102 s (timeline) · gap-hold-20261022-0030 102 s (timeline) · gap-hold-20261022-0083 102 s (stress) · gap-hold-20261022-0022 104.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1271&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/gap-holding-20261022/ai_flow_live.html?bench=1271&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1271`); it opens the seed that parts earliest, and the dropdowns choose another.

