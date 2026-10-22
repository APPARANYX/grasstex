# Benchmark run #1249 · 100 seeds from `rearch-classic-20261022` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/ai-rearch-consolidated-20261022 @ 3a126d6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39780233030) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 160.05 s); 6 of 42 counters under p 0.05 (about 2.1 by chance), 4 under 0.0012; casualties -1.9% (p 0.5856)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 2446 to 1997 (-18.4%, p 0); recon.contacts 333 to 179 (-46.2%, p 0); recon.cancelled 759 to 446 (-41.2%, p 0); recon.reportsDelivered 1395 to 764 (-45.2%, p 0).
- Under 0.05 only: regroups.entries 367 to 411 (+12.0%, p 0.033); fire.total 23248 to 22253 (-4.3%, p 0.0354).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.03 (gate 1.25)
- the 91 changed records first part at simulated second: min 96, p10 120, median 160.05, p90 208.05, max 309

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4945 | 4852 | -0.93 | 84 | 39 | 45 | 0.5856 |
| `usKills` | 2439 | 2425 | -0.14 | 86 | 40 | 46 | 0.59 |
| `geKills` | 2506 | 2427 | -0.79 | 86 | 44 | 42 | 0.9142 |
| `fire.total` | 23248 | 22253 | -9.95 | 91 | 35 | 56 | 0.0354 |
| `fire.hits` | 8860 | 8732 | -1.28 | 88 | 42 | 46 | 0.7493 |
| `retreatSamples` | 146840 | 144591 | -22.49 | 91 | 45 | 46 | 1 |
| `movementResolver.changes` | 231362 | 226413 | -49.49 | 90 | 43 | 47 | 0.752 |
| `grenades.throws` | 30 | 11 | -0.19 | 9 | 2 | 7 | 0.1797 |
| `grenades.bursts` | 30 | 11 | -0.19 | 9 | 2 | 7 | 0.1797 |
| `grenades.wounded` | 14 | 1 | -0.13 | 5 | 0 | 5 | 0.0625 |
| `grenades.casualties` | 4 | 0 | -0.04 | 3 | 0 | 3 | 0.25 |
| `grenades.suppressed` | 30 | 9 | -0.21 | 7 | 1 | 6 | 0.125 |
| `grenades.friendlyWounded` | 3 | 0 | -0.03 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 246 | 215 | -0.31 | 69 | 32 | 37 | 0.6305 |
| `loopAlerts.length` | 542 | 527 | -0.15 | 83 | 38 | 45 | 0.5104 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 367 | 411 | 0.44 | 80 | 50 | 30 | 0.033 |
| `stallOutcomes.wakes` | 8 | 8 | 0 | 11 | 6 | 5 | 1 |
| `stallOutcomes.repeats` | 2 | 1 | -0.01 | 3 | 1 | 2 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2446 | 1997 | -4.49 | 84 | 15 | 69 | 0 |
| `recon.contacts` | 333 | 179 | -1.54 | 76 | 16 | 60 | 0 |
| `recon.noContact` | 1175 | 1176 | 0.01 | 74 | 35 | 39 | 0.7275 |
| `recon.timeouts` | 99 | 99 | 0 | 44 | 21 | 23 | 0.8804 |
| `recon.cancelled` | 759 | 446 | -3.13 | 85 | 11 | 74 | 0 |
| `recon.reportsDelivered` | 1395 | 764 | -6.31 | 80 | 21 | 59 | 0 |
| `recon.retriggerBlocked` | 1217 | 1205 | -0.12 | 80 | 35 | 45 | 0.3143 |
| `squadPerformance.meanOverall` | 8464.9 | 8483.499999999998 | 0.186 | 90 | 45 | 45 | 1 |
| `squadPerformance.p10Overall` | 7675.000000000003 | 7701.600000000001 | 0.266 | 64 | 35 | 29 | 0.5323 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7430.399999999998 | 7465 | 0.346 | 90 | 46 | 44 | 0.9161 |
| `squadPerformance.meanMovement` | 9984.199999999995 | 9983.899999999992 | -0.003 | 50 | 25 | 25 | 1 |
| `squadPerformance.meanControl` | 9635.899999999998 | 9644.800000000003 | 0.089 | 89 | 44 | 45 | 1 |
| `squadPerformance.meanCohesion` | 8846.7 | 8832.2 | -0.145 | 91 | 39 | 52 | 0.2082 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

rearch-classic-20261022-0079 96 s (timeline) · rearch-classic-20261022-0072 97.05 s (timeline) · rearch-classic-20261022-0077 97.05 s (timeline) · rearch-classic-20261022-0069 98.1 s (timeline) · rearch-classic-20261022-0096 105 s (timeline) · rearch-classic-20261022-0006 107.1 s (timeline) · rearch-classic-20261022-0041 109.05 s (timeline) · rearch-classic-20261022-0085 116.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1249&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/ai-rearch-consolidated-20261022/ai_flow_live.html?bench=1249&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1249`); it opens the seed that parts earliest, and the dropdowns choose another.

