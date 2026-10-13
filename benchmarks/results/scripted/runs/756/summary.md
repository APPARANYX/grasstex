# Benchmark run #756 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 5618cf6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38330266300) · build v29-dev

## Verdict

**MOVED: 22 of 22 pairs changed (median first part 203.1 s); 6 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -9.0% (p 0.0636)**

- Clears the Bonferroni line (p < 0.0012): usKills 497 to 350 (-29.6%, p 0).
- Under 0.05 only: squadPerformance.meanMission 1602.5 to 1540.3000000000002 (-3.9%, p 0.0044); geKills 487 to 545 (+11.9%, p 0.0213); recon.contacts 23 to 37 (+60.9%, p 0.0215); recon.cancelled 87 to 69 (-20.7%, p 0.0309); squadPerformance.meanControl 2188.1 to 2174.5000000000005 (-0.6%, p 0.0309).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.107 (gate 1.25)
- the 21 changed records first part at simulated second: min 185.1, p10 185.1, median 203.1, p90 234, max 234

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 984 | 895 | -4.0455 | 19 | 5 | 14 | 0.0636 |
| `usKills` | 497 | 350 | -6.6818 | 18 | 0 | 18 | 0 |
| `geKills` | 487 | 545 | 2.6364 | 16 | 13 | 3 | 0.0213 |
| `fire.total` | 760 | 776 | 0.7273 | 19 | 9 | 10 | 1 |
| `fire.hits` | 337 | 314 | -1.0455 | 17 | 6 | 11 | 0.3323 |
| `retreatSamples` | 4747 | 5148 | 18.2273 | 17 | 11 | 6 | 0.3323 |
| `movementResolver.changes` | 57524 | 59255 | 78.6818 | 21 | 15 | 6 | 0.0784 |
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
| `vacantObjectiveStalls.length` | 15 | 17 | 0.0909 | 12 | 6 | 6 | 1 |
| `loopAlerts.length` | 10 | 29 | 0.8636 | 13 | 10 | 3 | 0.0923 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 27 | 46 | 0.8636 | 7 | 5 | 2 | 0.4531 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 434 | 436 | 0.0909 | 14 | 7 | 7 | 1 |
| `recon.contacts` | 23 | 37 | 0.6364 | 10 | 9 | 1 | 0.0215 |
| `recon.noContact` | 318 | 316 | -0.0909 | 12 | 7 | 5 | 0.7744 |
| `recon.timeouts` | 0 | 4 | 0.1818 | 4 | 4 | 0 | 0.125 |
| `recon.cancelled` | 87 | 69 | -0.8182 | 18 | 4 | 14 | 0.0309 |
| `recon.reportsDelivered` | 77 | 96 | 0.8636 | 6 | 4 | 2 | 0.6875 |
| `recon.retriggerBlocked` | 358 | 357 | -0.0455 | 13 | 7 | 6 | 1 |
| `squadPerformance.meanOverall` | 1922.1 | 1899.8999999999999 | -1.0091 | 20 | 6 | 14 | 0.1153 |
| `squadPerformance.p10Overall` | 1786.9999999999998 | 1776.1999999999998 | -0.4909 | 16 | 8 | 8 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1602.5 | 1540.3000000000002 | -2.8273 | 19 | 3 | 16 | 0.0044 |
| `squadPerformance.meanMovement` | 2165.3999999999996 | 2149.2 | -0.7364 | 19 | 8 | 11 | 0.6476 |
| `squadPerformance.meanControl` | 2188.1 | 2174.5000000000005 | -0.6182 | 18 | 4 | 14 | 0.0309 |
| `squadPerformance.meanCohesion` | 1989.4 | 1977.3 | -0.55 | 19 | 6 | 13 | 0.1671 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 185.1 s (timeline) · phase-c-natural-20261012-0003 203.1 s (timeline) · phase-c-natural-20261012-0002 234 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=756&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=756&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=756`); it opens the seed that parts earliest, and the dropdowns choose another.

