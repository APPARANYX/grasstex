# Benchmark run #731 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ d5983d1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38323372725) · build v29-dev

## Verdict

**MOVED: 21 of 21 pairs changed (median first part 209.1 s); 8 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties -5.2% (p 0.0574)**

- Clears the Bonferroni line (p < 0.0012): retreatSamples 5481 to 4552 (-16.9%, p 0.0002); movementResolver.changes 54581 to 55935 (+2.5%, p 0.001).
- Under 0.05 only: squadPerformance.meanOverall 1807.1999999999998 to 1820.6999999999998 (+0.7%, p 0.0018); squadPerformance.meanMission 1430.9000000000003 to 1463.8999999999999 (+2.3%, p 0.0018); usKills 398 to 314 (-21.1%, p 0.0034); recon.orders 398 to 428 (+7.5%, p 0.0215); recon.retriggerBlocked 327 to 342 (+4.6%, p 0.0215); regroups.entries 24 to 30 (+25.0%, p 0.0313).

## Paired comparison (off against on)

- **21** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.179 (gate 1.25)
- the 15 changed records first part at simulated second: min 185.1, p10 185.1, median 209.1, p90 209.1, max 209.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 791 | 750 | -1.9524 | 14 | 3 | 11 | 0.0574 |
| `usKills` | 398 | 314 | -4 | 13 | 1 | 12 | 0.0034 |
| `geKills` | 393 | 436 | 2.0476 | 13 | 8 | 5 | 0.5811 |
| `fire.total` | 751 | 834 | 3.9524 | 14 | 9 | 5 | 0.424 |
| `fire.hits` | 304 | 280 | -1.1429 | 13 | 5 | 8 | 0.5811 |
| `retreatSamples` | 5481 | 4552 | -44.2381 | 13 | 0 | 13 | 0.0002 |
| `movementResolver.changes` | 54581 | 55935 | 64.4762 | 15 | 14 | 1 | 0.001 |
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
| `vacantObjectiveStalls.length` | 15 | 9 | -0.2857 | 8 | 3 | 5 | 0.7266 |
| `loopAlerts.length` | 48 | 13 | -1.6667 | 10 | 2 | 8 | 0.1094 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 24 | 30 | 0.2857 | 6 | 6 | 0 | 0.0313 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 398 | 428 | 1.4286 | 10 | 9 | 1 | 0.0215 |
| `recon.contacts` | 9 | 6 | -0.1429 | 3 | 0 | 3 | 0.25 |
| `recon.noContact` | 294 | 303 | 0.4286 | 5 | 4 | 1 | 0.375 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 84 | 99 | 0.7143 | 10 | 7 | 3 | 0.3438 |
| `recon.reportsDelivered` | 63 | 48 | -0.7143 | 3 | 0 | 3 | 0.25 |
| `recon.retriggerBlocked` | 327 | 342 | 0.7143 | 10 | 9 | 1 | 0.0215 |
| `squadPerformance.meanOverall` | 1807.1999999999998 | 1820.6999999999998 | 0.6429 | 14 | 13 | 1 | 0.0018 |
| `squadPerformance.p10Overall` | 1693.8999999999996 | 1704.3999999999994 | 0.5 | 9 | 5 | 4 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1430.9000000000003 | 1463.8999999999999 | 1.5714 | 14 | 13 | 1 | 0.0018 |
| `squadPerformance.meanMovement` | 2081.6 | 2082.9 | 0.0619 | 10 | 6 | 4 | 0.7539 |
| `squadPerformance.meanControl` | 2083.3 | 2085.5999999999995 | 0.1095 | 11 | 8 | 3 | 0.2266 |
| `squadPerformance.meanCohesion` | 1913.9000000000003 | 1919.8999999999999 | 0.2857 | 13 | 7 | 6 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 185.1 s (timeline) · phase-c-natural-20261012-0003 209.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=731&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=731&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=731`); it opens the seed that parts earliest, and the dropdowns choose another.

