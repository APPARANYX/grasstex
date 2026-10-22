# Benchmark run #1279 · 100 seeds from `gap-hold-fh-20261022` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1`
- work/gap-holding-20261022 @ 4d53487 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39844914954) · build v29-dev

## Verdict

**WEAK: 97 of 100 pairs changed (median first part 155.1 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +1.3% (p 0.8284)**

- Under 0.05 only: squadPerformance.meanMovement 9984.799999999994 to 9986.799999999988 (+0.0%, p 0.03).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x0.996 (gate 1.25)
- the 91 changed records first part at simulated second: min 93, p10 121.05, median 155.1, p90 182.1, max 234

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4702 | 4763 | 0.61 | 85 | 41 | 44 | 0.8284 |
| `usKills` | 2091 | 2148 | 0.57 | 89 | 46 | 43 | 0.8323 |
| `geKills` | 2611 | 2615 | 0.04 | 90 | 44 | 46 | 0.9161 |
| `fire.total` | 22778 | 24367 | 15.89 | 91 | 54 | 37 | 0.0929 |
| `fire.hits` | 8791 | 8920 | 1.29 | 91 | 46 | 45 | 1 |
| `retreatSamples` | 157476 | 170516 | 130.4 | 91 | 55 | 36 | 0.0586 |
| `movementResolver.changes` | 234249 | 236517 | 22.68 | 91 | 51 | 40 | 0.2945 |
| `grenades.throws` | 25 | 21 | -0.04 | 8 | 4 | 4 | 1 |
| `grenades.bursts` | 22 | 21 | -0.01 | 9 | 5 | 4 | 1 |
| `grenades.wounded` | 14 | 20 | 0.06 | 7 | 5 | 2 | 0.4531 |
| `grenades.casualties` | 8 | 10 | 0.02 | 5 | 3 | 2 | 1 |
| `grenades.suppressed` | 30 | 31 | 0.01 | 7 | 5 | 2 | 0.4531 |
| `grenades.friendlyWounded` | 0 | 3 | 0.03 | 2 | 2 | 0 | 0.5 |
| `grenades.friendlyCasualties` | 0 | 2 | 0.02 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 3 | 1 | -0.02 | 2 | 0 | 2 | 0.5 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 228 | 228 | 0 | 71 | 39 | 32 | 0.4767 |
| `loopAlerts.length` | 585 | 526 | -0.59 | 83 | 38 | 45 | 0.5104 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 429 | 409 | -0.2 | 77 | 40 | 37 | 0.8199 |
| `stallOutcomes.wakes` | 3 | 9 | 0.06 | 12 | 9 | 3 | 0.146 |
| `stallOutcomes.repeats` | 0 | 3 | 0.03 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2184 | 2172 | -0.12 | 83 | 42 | 41 | 1 |
| `recon.contacts` | 187 | 188 | 0.01 | 73 | 38 | 35 | 0.8151 |
| `recon.noContact` | 1180 | 1203 | 0.23 | 75 | 43 | 32 | 0.248 |
| `recon.timeouts` | 115 | 121 | 0.06 | 47 | 26 | 21 | 0.5601 |
| `recon.cancelled` | 555 | 514 | -0.41 | 81 | 37 | 44 | 0.5052 |
| `recon.reportsDelivered` | 792 | 764 | -0.28 | 81 | 34 | 47 | 0.1821 |
| `recon.retriggerBlocked` | 1293 | 1304 | 0.11 | 79 | 44 | 35 | 0.3682 |
| `squadPerformance.meanOverall` | 8439.099999999997 | 8402.699999999999 | -0.364 | 89 | 42 | 47 | 0.6718 |
| `squadPerformance.p10Overall` | 7673.2000000000035 | 7656.600000000004 | -0.166 | 53 | 22 | 31 | 0.2717 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7309.099999999999 | 7209.099999999996 | -1 | 91 | 40 | 51 | 0.2945 |
| `squadPerformance.meanMovement` | 9984.799999999994 | 9986.799999999988 | 0.02 | 55 | 36 | 19 | 0.03 |
| `squadPerformance.meanControl` | 9645.1 | 9668.799999999997 | 0.237 | 90 | 45 | 45 | 1 |
| `squadPerformance.meanCohesion` | 8931.499999999998 | 8953.599999999993 | 0.221 | 87 | 48 | 39 | 0.3912 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

gap-hold-fh-20261022-0039 93 s (timeline) · gap-hold-fh-20261022-0075 98.1 s (timeline) · gap-hold-fh-20261022-0086 101.1 s (timeline) · gap-hold-fh-20261022-0033 102 s (timeline) · gap-hold-fh-20261022-0025 103.05 s (timeline) · gap-hold-fh-20261022-0065 114 s (timeline) · gap-hold-fh-20261022-0028 115.05 s (timeline) · gap-hold-fh-20261022-0012 116.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1279&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/gap-holding-20261022/ai_flow_live.html?bench=1279&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1279`); it opens the seed that parts earliest, and the dropdowns choose another.

