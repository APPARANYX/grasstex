# Benchmark run #640 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 1538b95 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38264065974) · build v29-dev

## Verdict

**WEAK: 20 of 20 pairs changed (median first part 209.1 s); 5 of 42 counters under p 0.05 (about 2.1 by chance); casualties +7.5% (p 0.8036)**

- Under 0.05 only: recon.contacts 5 to 17 (+240.0%, p 0.0156); recon.reportsDelivered 40 to 115 (+187.5%, p 0.0156); recon.orders 446 to 388 (-13.0%, p 0.0225); recon.noContact 303 to 278 (-8.3%, p 0.0313); movementResolver.changes 49973 to 51572 (+3.2%, p 0.049).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.116 (gate 1.25)
- the 17 changed records first part at simulated second: min 185.1, p10 185.1, median 209.1, p90 319.05, max 319.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 724 | 778 | 2.7 | 16 | 9 | 7 | 0.8036 |
| `usKills` | 339 | 372 | 1.65 | 14 | 5 | 9 | 0.424 |
| `geKills` | 385 | 406 | 1.05 | 16 | 7 | 9 | 0.8036 |
| `fire.total` | 705 | 844 | 6.95 | 16 | 10 | 6 | 0.4545 |
| `fire.hits` | 262 | 318 | 2.8 | 13 | 8 | 5 | 0.5811 |
| `retreatSamples` | 4044 | 3533 | -25.55 | 16 | 5 | 11 | 0.2101 |
| `movementResolver.changes` | 49973 | 51572 | 79.95 | 17 | 13 | 4 | 0.049 |
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
| `vacantObjectiveStalls.length` | 12 | 6 | -0.3 | 6 | 2 | 4 | 0.6875 |
| `loopAlerts.length` | 12 | 5 | -0.35 | 6 | 1 | 5 | 0.2188 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 23 | 20 | -0.15 | 5 | 1 | 4 | 0.375 |
| `stallOutcomes.wakes` | 0 | 4 | 0.2 | 4 | 4 | 0 | 0.125 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 446 | 388 | -2.9 | 13 | 2 | 11 | 0.0225 |
| `recon.contacts` | 5 | 17 | 0.6 | 7 | 7 | 0 | 0.0156 |
| `recon.noContact` | 303 | 278 | -1.25 | 6 | 0 | 6 | 0.0313 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 117 | 88 | -1.45 | 10 | 3 | 7 | 0.3438 |
| `recon.reportsDelivered` | 40 | 115 | 3.75 | 7 | 7 | 0 | 0.0156 |
| `recon.retriggerBlocked` | 348 | 311 | -1.85 | 10 | 4 | 6 | 0.7539 |
| `squadPerformance.meanOverall` | 1743.8999999999999 | 1743.1000000000001 | -0.04 | 16 | 7 | 9 | 0.8036 |
| `squadPerformance.p10Overall` | 1629.0999999999995 | 1609.3999999999996 | -0.985 | 10 | 2 | 8 | 0.1094 |
| `squadPerformance.lowScoreSquads` | 0 | 1 | 0.05 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMission` | 1428.1000000000001 | 1458.7999999999997 | 1.535 | 16 | 11 | 5 | 0.2101 |
| `squadPerformance.meanMovement` | 1980.1 | 1958.9000000000003 | -1.06 | 15 | 4 | 11 | 0.1185 |
| `squadPerformance.meanControl` | 1986.4 | 1991.8999999999999 | 0.275 | 13 | 7 | 6 | 1 |
| `squadPerformance.meanCohesion` | 1806.8000000000002 | 1788.7999999999997 | -0.9 | 16 | 6 | 10 | 0.4545 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 185.1 s (timeline) · phase-c-natural-20261012-0003 209.1 s (timeline) · phase-c-natural-20261012-0002 319.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=640&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=640&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=640`); it opens the seed that parts earliest, and the dropdowns choose another.

