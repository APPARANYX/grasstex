# Benchmark run #959 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-natural-readiness-diagnostics @ dc56795 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38648673412) · build v29-dev

## Verdict

**MOVED: 25 of 25 pairs changed (median first part 124.05 s); 7 of 42 counters under p 0.05 (about 2.1 by chance), 5 under 0.0012; casualties +0.3% (p 0.8388)**

- Clears the Bonferroni line (p < 0.0012): regroups.entries 34 to 84 (+147.1%, p 0); recon.orders 571 to 346 (-39.4%, p 0); recon.contacts 57 to 12 (-78.9%, p 0); recon.cancelled 244 to 72 (-70.5%, p 0); recon.reportsDelivered 298 to 86 (-71.1%, p 0).
- Under 0.05 only: recon.timeouts 18 to 26 (+44.4%, p 0.0313); squadPerformance.meanCohesion 2167.4000000000005 to 2084.3 (-3.8%, p 0.0433).

## Paired comparison (off against on)

- **25** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.184 (gate 1.25)
- the 25 changed records first part at simulated second: min 109.05, p10 109.05, median 124.05, p90 166.05, max 166.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 886 | 889 | 0.12 | 24 | 13 | 11 | 0.8388 |
| `usKills` | 489 | 474 | -0.6 | 24 | 14 | 10 | 0.5413 |
| `geKills` | 397 | 415 | 0.72 | 23 | 13 | 10 | 0.6776 |
| `fire.total` | 907 | 1193 | 11.44 | 22 | 13 | 9 | 0.5235 |
| `fire.hits` | 329 | 321 | -0.32 | 20 | 8 | 12 | 0.5034 |
| `retreatSamples` | 5368 | 5754 | 15.44 | 25 | 17 | 8 | 0.1078 |
| `movementResolver.changes` | 43291 | 44276 | 39.4 | 25 | 14 | 11 | 0.69 |
| `grenades.throws` | 0 | 1 | 0.04 | 1 | 1 | 0 | 1 |
| `grenades.bursts` | 0 | 1 | 0.04 | 1 | 1 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 11 | 4 | -0.28 | 7 | 3 | 4 | 1 |
| `loopAlerts.length` | 31 | 65 | 1.36 | 17 | 11 | 6 | 0.3323 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 34 | 84 | 2 | 18 | 18 | 0 | 0 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 571 | 346 | -9 | 25 | 0 | 25 | 0 |
| `recon.contacts` | 57 | 12 | -1.8 | 17 | 0 | 17 | 0 |
| `recon.noContact` | 230 | 227 | -0.12 | 14 | 6 | 8 | 0.7905 |
| `recon.timeouts` | 18 | 26 | 0.32 | 6 | 6 | 0 | 0.0313 |
| `recon.cancelled` | 244 | 72 | -6.88 | 24 | 0 | 24 | 0 |
| `recon.reportsDelivered` | 298 | 86 | -8.48 | 17 | 0 | 17 | 0 |
| `recon.retriggerBlocked` | 213 | 226 | 0.52 | 19 | 13 | 6 | 0.1671 |
| `squadPerformance.meanOverall` | 2183.4000000000005 | 2161.2 | -0.888 | 24 | 9 | 15 | 0.3075 |
| `squadPerformance.p10Overall` | 1992.4999999999993 | 2010.5999999999992 | 0.724 | 22 | 13 | 9 | 0.5235 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1857.8999999999996 | 1816.2000000000003 | -1.668 | 25 | 10 | 15 | 0.4244 |
| `squadPerformance.meanMovement` | 2488.9999999999995 | 2490.1000000000004 | 0.044 | 21 | 10 | 11 | 1 |
| `squadPerformance.meanControl` | 2478.2999999999997 | 2461.2 | -0.684 | 20 | 7 | 13 | 0.2632 |
| `squadPerformance.meanCohesion` | 2167.4000000000005 | 2084.3 | -3.324 | 25 | 7 | 18 | 0.0433 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0003 109.05 s (timeline) · phase-c-natural-20261012-0001 124.05 s (timeline) · phase-c-natural-20261012-0002 166.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=959&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=959&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=959`); it opens the seed that parts earliest, and the dropdowns choose another.

