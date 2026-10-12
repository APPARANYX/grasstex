# Benchmark run #652 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ f7abcb1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38264829539) · build v29-dev

## Verdict

**MOVED: 25 of 25 pairs changed (median first part 150 s); 4 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties +8.9% (p 0.8388)**

- Clears the Bonferroni line (p < 0.0012): recon.contacts 74 to 31 (-58.1%, p 0); recon.retriggerBlocked 274 to 214 (-21.9%, p 0.0002).
- Under 0.05 only: recon.orders 485 to 341 (-29.7%, p 0.0026); recon.noContact 249 to 216 (-13.3%, p 0.0074).

## Paired comparison (off against on)

- **25** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.023 (gate 1.25)
- the 25 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 162, max 162

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 821 | 894 | 2.92 | 24 | 11 | 13 | 0.8388 |
| `usKills` | 314 | 397 | 3.32 | 22 | 12 | 10 | 0.8318 |
| `geKills` | 507 | 497 | -0.4 | 23 | 9 | 14 | 0.4049 |
| `fire.total` | 604 | 934 | 13.2 | 24 | 13 | 11 | 0.8388 |
| `fire.hits` | 250 | 321 | 2.84 | 24 | 10 | 14 | 0.5413 |
| `retreatSamples` | 7700 | 6273 | -57.08 | 25 | 11 | 14 | 0.69 |
| `movementResolver.changes` | 49259 | 50085 | 33.04 | 25 | 14 | 11 | 0.69 |
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
| `vacantObjectiveStalls.length` | 17 | 4 | -0.52 | 8 | 2 | 6 | 0.2891 |
| `loopAlerts.length` | 12 | 10 | -0.08 | 10 | 6 | 4 | 0.7539 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 44 | 30 | -0.56 | 18 | 6 | 12 | 0.2379 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 485 | 341 | -5.76 | 20 | 3 | 17 | 0.0026 |
| `recon.contacts` | 74 | 31 | -1.72 | 20 | 0 | 20 | 0 |
| `recon.noContact` | 249 | 216 | -1.32 | 15 | 2 | 13 | 0.0074 |
| `recon.timeouts` | 21 | 20 | -0.04 | 9 | 4 | 5 | 1 |
| `recon.cancelled` | 119 | 68 | -2.04 | 22 | 7 | 15 | 0.1338 |
| `recon.reportsDelivered` | 307 | 198 | -4.36 | 21 | 8 | 13 | 0.3833 |
| `recon.retriggerBlocked` | 274 | 214 | -2.4 | 13 | 0 | 13 | 0.0002 |
| `squadPerformance.meanOverall` | 2153.600000000001 | 2197.0000000000005 | 1.736 | 24 | 17 | 7 | 0.0639 |
| `squadPerformance.p10Overall` | 1996.5999999999992 | 2012.799999999999 | 0.648 | 17 | 10 | 7 | 0.6291 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1720.2 | 1839 | 4.752 | 25 | 15 | 10 | 0.4244 |
| `squadPerformance.meanMovement` | 2485.7 | 2491.0000000000005 | 0.212 | 21 | 11 | 10 | 1 |
| `squadPerformance.meanControl` | 2492.8 | 2492.2 | -0.024 | 16 | 7 | 9 | 0.8036 |
| `squadPerformance.meanCohesion` | 2224.2000000000003 | 2249.6 | 1.016 | 25 | 14 | 11 | 0.69 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 162 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=652&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=652&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=652`); it opens the seed that parts earliest, and the dropdowns choose another.

