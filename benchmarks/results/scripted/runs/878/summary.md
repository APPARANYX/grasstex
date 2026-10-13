# Benchmark run #878 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-natural-readiness-diagnostics @ 26473ed · [run](https://github.com/APPARANYX/grasstex/actions/runs/38403088423) · build v29-dev

## Verdict

**MOVED: 23 of 23 pairs changed (median first part 185.1 s); 5 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -15.8% (p 0.0004)**

- Clears the Bonferroni line (p < 0.0012): casualties 1052 to 886 (-15.8%, p 0.0004).
- Under 0.05 only: recon.reportsDelivered 77 to 130 (+68.8%, p 0.0039); fire.total 767 to 1267 (+65.2%, p 0.0072); usKills 532 to 382 (-28.2%, p 0.0266); squadPerformance.meanControl 2288.1 to 2272.3 (-0.7%, p 0.049).

## Paired comparison (off against on)

- **23** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.085 (gate 1.25)
- the 23 changed records first part at simulated second: min 168, p10 168, median 185.1, p90 203.1, max 203.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1052 | 886 | -7.2174 | 20 | 2 | 18 | 0.0004 |
| `usKills` | 532 | 382 | -6.5217 | 21 | 5 | 16 | 0.0266 |
| `geKills` | 520 | 504 | -0.6957 | 18 | 7 | 11 | 0.4807 |
| `fire.total` | 767 | 1267 | 21.7391 | 21 | 17 | 4 | 0.0072 |
| `fire.hits` | 344 | 313 | -1.3478 | 19 | 7 | 12 | 0.3593 |
| `retreatSamples` | 5147 | 4838 | -13.4348 | 21 | 9 | 12 | 0.6636 |
| `movementResolver.changes` | 60725 | 60061 | -28.8696 | 22 | 9 | 13 | 0.5235 |
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
| `vacantObjectiveStalls.length` | 16 | 14 | -0.087 | 12 | 5 | 7 | 0.7744 |
| `loopAlerts.length` | 10 | 27 | 0.7391 | 10 | 7 | 3 | 0.3438 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 31 | 29 | -0.087 | 12 | 6 | 6 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 453 | 488 | 1.5217 | 19 | 10 | 9 | 1 |
| `recon.contacts` | 23 | 19 | -0.1739 | 12 | 6 | 6 | 1 |
| `recon.noContact` | 334 | 343 | 0.3913 | 11 | 3 | 8 | 0.2266 |
| `recon.timeouts` | 0 | 5 | 0.2174 | 4 | 4 | 0 | 0.125 |
| `recon.cancelled` | 90 | 102 | 0.5217 | 17 | 9 | 8 | 1 |
| `recon.reportsDelivered` | 77 | 130 | 2.3043 | 9 | 9 | 0 | 0.0039 |
| `recon.retriggerBlocked` | 374 | 385 | 0.4783 | 12 | 5 | 7 | 0.7744 |
| `squadPerformance.meanOverall` | 2005.8 | 1980.2999999999997 | -1.1087 | 23 | 7 | 16 | 0.0931 |
| `squadPerformance.p10Overall` | 1866.5999999999997 | 1833.6999999999994 | -1.4304 | 21 | 6 | 15 | 0.0784 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1663.2 | 1620.1999999999998 | -1.8696 | 23 | 8 | 15 | 0.21 |
| `squadPerformance.meanMovement` | 2264.9999999999995 | 2235 | -1.3043 | 22 | 11 | 11 | 1 |
| `squadPerformance.meanControl` | 2288.1 | 2272.3 | -0.687 | 17 | 4 | 13 | 0.049 |
| `squadPerformance.meanCohesion` | 2076.8 | 2061.2000000000003 | -0.6783 | 21 | 10 | 11 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 168 s (timeline) · phase-c-natural-20261012-0001 185.1 s (timeline) · phase-c-natural-20261012-0003 203.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=878&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=878&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=878`); it opens the seed that parts earliest, and the dropdowns choose another.

