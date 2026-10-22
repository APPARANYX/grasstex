# Benchmark run #1248 · 100 seeds from `rearch-classic-20261022` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/ai-rearch-consolidated-20261022 @ 3a126d6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39780226443) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 152.1 s); 5 of 42 counters under p 0.05 (about 2.1 by chance), 4 under 0.0012; casualties -1.2% (p 0.3742)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 2577 to 2144 (-16.8%, p 0); recon.contacts 294 to 182 (-38.1%, p 0); recon.cancelled 761 to 510 (-33.0%, p 0); recon.reportsDelivered 1161 to 736 (-36.6%, p 0.0004).
- Under 0.05 only: recon.noContact 1295 to 1213 (-6.3%, p 0.0308).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.038 (gate 1.25)
- the 91 changed records first part at simulated second: min 94.05, p10 117, median 152.1, p90 216, max 345

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5003 | 4944 | -0.59 | 81 | 45 | 36 | 0.3742 |
| `usKills` | 2195 | 2163 | -0.32 | 88 | 44 | 44 | 1 |
| `geKills` | 2808 | 2781 | -0.27 | 86 | 45 | 41 | 0.7465 |
| `fire.total` | 23627 | 22917 | -7.1 | 91 | 38 | 53 | 0.1418 |
| `fire.hits` | 9011 | 9169 | 1.58 | 88 | 50 | 38 | 0.2408 |
| `retreatSamples` | 160712 | 161010 | 2.98 | 91 | 44 | 47 | 0.8341 |
| `movementResolver.changes` | 236148 | 239576 | 34.28 | 90 | 53 | 37 | 0.1133 |
| `grenades.throws` | 13 | 13 | 0 | 9 | 6 | 3 | 0.5078 |
| `grenades.bursts` | 13 | 13 | 0 | 9 | 6 | 3 | 0.5078 |
| `grenades.wounded` | 2 | 6 | 0.04 | 3 | 2 | 1 | 1 |
| `grenades.casualties` | 0 | 2 | 0.02 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 10 | 16 | 0.06 | 6 | 3 | 3 | 1 |
| `grenades.friendlyWounded` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 12 | 8 | -0.04 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 278 | 252 | -0.26 | 76 | 31 | 45 | 0.1354 |
| `loopAlerts.length` | 560 | 550 | -0.1 | 81 | 38 | 43 | 0.657 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 362 | 420 | 0.58 | 79 | 44 | 35 | 0.3682 |
| `stallOutcomes.wakes` | 3 | 3 | 0 | 4 | 2 | 2 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsets` | 12 | 8 | -0.04 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 446 | 407 | -0.39 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 12 | 8 | -0.04 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 446 | 407 | -0.39 | 1 | 0 | 1 | 1 |
| `recon.orders` | 2577 | 2144 | -4.33 | 85 | 18 | 67 | 0 |
| `recon.contacts` | 294 | 182 | -1.12 | 78 | 16 | 62 | 0 |
| `recon.noContact` | 1295 | 1213 | -0.82 | 78 | 29 | 49 | 0.0308 |
| `recon.timeouts` | 101 | 114 | 0.13 | 49 | 30 | 19 | 0.1524 |
| `recon.cancelled` | 761 | 510 | -2.51 | 78 | 16 | 62 | 0 |
| `recon.reportsDelivered` | 1161 | 736 | -4.25 | 85 | 26 | 59 | 0.0004 |
| `recon.retriggerBlocked` | 1383 | 1315 | -0.68 | 83 | 35 | 48 | 0.1875 |
| `squadPerformance.meanOverall` | 8432.1 | 8444.499999999998 | 0.124 | 90 | 47 | 43 | 0.752 |
| `squadPerformance.p10Overall` | 7668.8 | 7688.9000000000015 | 0.201 | 50 | 27 | 23 | 0.6718 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7315.299999999999 | 7349.799999999998 | 0.345 | 89 | 46 | 43 | 0.8323 |
| `squadPerformance.meanMovement` | 9982.89999999999 | 9983.49999999999 | 0.006 | 50 | 24 | 26 | 0.8877 |
| `squadPerformance.meanControl` | 9645.899999999994 | 9643.300000000001 | -0.026 | 88 | 44 | 44 | 1 |
| `squadPerformance.meanCohesion` | 8933.399999999998 | 8921.399999999998 | -0.12 | 91 | 48 | 43 | 0.6752 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

rearch-classic-20261022-0066 94.05 s (timeline) · rearch-classic-20261022-0080 94.05 s (timeline) · rearch-classic-20261022-0011 95.1 s (timeline) · rearch-classic-20261022-0001 100.05 s (timeline) · rearch-classic-20261022-0092 103.05 s (timeline) · rearch-classic-20261022-0091 106.05 s (timeline) · rearch-classic-20261022-0026 110.1 s (timeline) · rearch-classic-20261022-0027 114 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1248&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/ai-rearch-consolidated-20261022/ai_flow_live.html?bench=1248&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1248`); it opens the seed that parts earliest, and the dropdowns choose another.

