# Benchmark run #821 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-natural-readiness-diagnostics @ 1113979 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38384958603) · build v29-dev

## Verdict

**MOVED: 23 of 23 pairs changed (median first part 185.1 s); 8 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties -11.2% (p 0)**

- Clears the Bonferroni line (p < 0.0012): casualties 1052 to 934 (-11.2%, p 0); fire.total 767 to 1514 (+97.4%, p 0.0001).
- Under 0.05 only: recon.reportsDelivered 77 to 124 (+61.0%, p 0.0039); squadPerformance.meanOverall 2005.8 to 1975.6999999999998 (-1.5%, p 0.0043); usKills 532 to 445 (-16.4%, p 0.0072); geKills 520 to 489 (-6.0%, p 0.0266); recon.retriggerBlocked 374 to 353 (-5.6%, p 0.0386); recon.noContact 334 to 320 (-4.2%, p 0.0391).

## Paired comparison (off against on)

- **23** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.155 (gate 1.25)
- the 23 changed records first part at simulated second: min 168, p10 168, median 185.1, p90 203.1, max 203.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1052 | 934 | -5.1304 | 20 | 1 | 19 | 0 |
| `usKills` | 532 | 445 | -3.7826 | 21 | 4 | 17 | 0.0072 |
| `geKills` | 520 | 489 | -1.3478 | 21 | 5 | 16 | 0.0266 |
| `fire.total` | 767 | 1514 | 32.4783 | 22 | 20 | 2 | 0.0001 |
| `fire.hits` | 344 | 363 | 0.8261 | 20 | 10 | 10 | 1 |
| `retreatSamples` | 5147 | 5562 | 18.0435 | 20 | 10 | 10 | 1 |
| `movementResolver.changes` | 60725 | 62538 | 78.8261 | 23 | 15 | 8 | 0.21 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 16 | 18 | 0.087 | 12 | 6 | 6 | 1 |
| `loopAlerts.length` | 10 | 25 | 0.6522 | 9 | 6 | 3 | 0.5078 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 31 | 26 | -0.2174 | 9 | 3 | 6 | 0.5078 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 453 | 427 | -1.1304 | 18 | 5 | 13 | 0.0963 |
| `recon.contacts` | 23 | 19 | -0.1739 | 12 | 6 | 6 | 1 |
| `recon.noContact` | 334 | 320 | -0.6087 | 9 | 1 | 8 | 0.0391 |
| `recon.timeouts` | 0 | 4 | 0.1739 | 4 | 4 | 0 | 0.125 |
| `recon.cancelled` | 90 | 75 | -0.6522 | 19 | 6 | 13 | 0.1671 |
| `recon.reportsDelivered` | 77 | 124 | 2.0435 | 9 | 9 | 0 | 0.0039 |
| `recon.retriggerBlocked` | 374 | 353 | -0.913 | 12 | 2 | 10 | 0.0386 |
| `squadPerformance.meanOverall` | 2005.8 | 1975.6999999999998 | -1.3087 | 22 | 4 | 18 | 0.0043 |
| `squadPerformance.p10Overall` | 1866.5999999999997 | 1838.3999999999994 | -1.2261 | 20 | 8 | 12 | 0.5034 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1663.2 | 1612.6 | -2.2 | 22 | 7 | 15 | 0.1338 |
| `squadPerformance.meanMovement` | 2264.9999999999995 | 2239 | -1.1304 | 22 | 10 | 12 | 0.8318 |
| `squadPerformance.meanControl` | 2288.1 | 2275.1 | -0.5652 | 17 | 7 | 10 | 0.6291 |
| `squadPerformance.meanCohesion` | 2076.8 | 2038 | -1.687 | 22 | 9 | 13 | 0.5235 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 168 s (timeline) · phase-c-natural-20261012-0001 185.1 s (timeline) · phase-c-natural-20261012-0003 203.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=821&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=821&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=821`); it opens the seed that parts earliest, and the dropdowns choose another.

