# Benchmark run #676 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 2e92ce9 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38276097284) · build v29-dev

## Verdict

**MOVED: 20 of 20 pairs changed (median first part 209.1 s); 5 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -10.1% (p 0.0352)**

- Clears the Bonferroni line (p < 0.0012): retreatSamples 5259 to 4334 (-17.6%, p 0.0005).
- Under 0.05 only: recon.cancelled 101 to 87 (-13.9%, p 0.0039); movementResolver.changes 50667 to 53246 (+5.1%, p 0.0042); casualties 771 to 693 (-10.1%, p 0.0352); regroups.entries 22 to 36 (+63.6%, p 0.0391).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.13 (gate 1.25)
- the 16 changed records first part at simulated second: min 185.1, p10 185.1, median 209.1, p90 387, max 387

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 771 | 693 | -3.9 | 15 | 3 | 12 | 0.0352 |
| `usKills` | 371 | 341 | -1.5 | 14 | 4 | 10 | 0.1796 |
| `geKills` | 400 | 352 | -2.4 | 11 | 4 | 7 | 0.5488 |
| `fire.total` | 709 | 760 | 2.55 | 14 | 9 | 5 | 0.424 |
| `fire.hits` | 309 | 296 | -0.65 | 13 | 7 | 6 | 1 |
| `retreatSamples` | 5259 | 4334 | -46.25 | 12 | 0 | 12 | 0.0005 |
| `movementResolver.changes` | 50667 | 53246 | 128.95 | 16 | 14 | 2 | 0.0042 |
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
| `vacantObjectiveStalls.length` | 13 | 12 | -0.05 | 7 | 3 | 4 | 1 |
| `loopAlerts.length` | 9 | 18 | 0.45 | 11 | 7 | 4 | 0.5488 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 22 | 36 | 0.7 | 9 | 8 | 1 | 0.0391 |
| `stallOutcomes.wakes` | 1 | 0 | -0.05 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 399 | 394 | -0.25 | 9 | 3 | 6 | 0.5078 |
| `recon.contacts` | 6 | 8 | 0.1 | 2 | 2 | 0 | 0.5 |
| `recon.noContact` | 286 | 287 | 0.05 | 3 | 2 | 1 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 101 | 87 | -0.7 | 9 | 0 | 9 | 0.0039 |
| `recon.reportsDelivered` | 48 | 50 | 0.1 | 2 | 2 | 0 | 0.5 |
| `recon.retriggerBlocked` | 319 | 314 | -0.25 | 11 | 4 | 7 | 0.5488 |
| `squadPerformance.meanOverall` | 1728.8 | 1732.1 | 0.165 | 14 | 8 | 6 | 0.7905 |
| `squadPerformance.p10Overall` | 1619.9999999999995 | 1617.9999999999993 | -0.1 | 9 | 3 | 6 | 0.5078 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1372.1000000000001 | 1396.5000000000002 | 1.22 | 14 | 10 | 4 | 0.1796 |
| `squadPerformance.meanMovement` | 1979.7000000000003 | 1969.1000000000004 | -0.53 | 11 | 2 | 9 | 0.0654 |
| `squadPerformance.meanControl` | 1990.4999999999998 | 1983.7000000000003 | -0.34 | 13 | 4 | 9 | 0.2668 |
| `squadPerformance.meanCohesion` | 1840.6000000000001 | 1827.3999999999999 | -0.66 | 13 | 7 | 6 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 185.1 s (timeline) · phase-c-natural-20261012-0003 209.1 s (timeline) · phase-c-natural-20261012-0002 387 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=676&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=676&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=676`); it opens the seed that parts earliest, and the dropdowns choose another.

