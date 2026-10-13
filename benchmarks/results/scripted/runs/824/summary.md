# Benchmark run #824 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-natural-readiness-diagnostics @ e9ba15e · [run](https://github.com/APPARANYX/grasstex/actions/runs/38385443721) · build v29-dev

## Verdict

**WEAK: 22 of 22 pairs changed (median first part 150 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties -7.2% (p 0.8318)**

- Under 0.05 only: recon.noContact 224 to 203 (-9.4%, p 0.0034); geKills 518 to 391 (-24.5%, p 0.0043); recon.orders 446 to 350 (-21.5%, p 0.0192).
- Unpaired records: off 0, on 2 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 0, on 2) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.18 (gate 1.25)
- the 22 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 156, max 156

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 668 | 620 | -2.1818 | 22 | 10 | 12 | 0.8318 |
| `usKills` | 150 | 229 | 3.5909 | 18 | 12 | 6 | 0.2379 |
| `geKills` | 518 | 391 | -5.7727 | 22 | 4 | 18 | 0.0043 |
| `fire.total` | 857 | 962 | 4.7727 | 22 | 10 | 12 | 0.8318 |
| `fire.hits` | 281 | 266 | -0.6818 | 20 | 10 | 10 | 1 |
| `retreatSamples` | 5050 | 5411 | 16.4091 | 21 | 12 | 9 | 0.6636 |
| `movementResolver.changes` | 41924 | 42737 | 36.9545 | 22 | 11 | 11 | 1 |
| `grenades.throws` | 1 | 0 | -0.0455 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 1 | 0 | -0.0455 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 5 | 0 | -0.2273 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 3 | 0 | -0.1364 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 8 | 0 | -0.3636 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 9 | 6 | -0.1364 | 6 | 3 | 3 | 1 |
| `loopAlerts.length` | 10 | 19 | 0.4091 | 13 | 6 | 7 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 23 | 16 | -0.3182 | 12 | 5 | 7 | 0.7744 |
| `stallOutcomes.wakes` | 3 | 4 | 0.0455 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 0 | -0.1364 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 446 | 350 | -4.3636 | 19 | 4 | 15 | 0.0192 |
| `recon.contacts` | 50 | 51 | 0.0455 | 14 | 7 | 7 | 1 |
| `recon.noContact` | 224 | 203 | -0.9545 | 13 | 1 | 12 | 0.0034 |
| `recon.timeouts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 138 | 75 | -2.8636 | 19 | 5 | 14 | 0.0636 |
| `recon.reportsDelivered` | 240 | 237 | -0.1364 | 19 | 10 | 9 | 1 |
| `recon.retriggerBlocked` | 239 | 212 | -1.2273 | 13 | 3 | 10 | 0.0923 |
| `squadPerformance.meanOverall` | 1933.5 | 1916 | -0.7955 | 22 | 7 | 15 | 0.1338 |
| `squadPerformance.p10Overall` | 1779.9 | 1755.5999999999992 | -1.1045 | 18 | 7 | 11 | 0.4807 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1625.4000000000003 | 1580.4000000000003 | -2.0455 | 22 | 11 | 11 | 1 |
| `squadPerformance.meanMovement` | 2185.7 | 2187.7 | 0.0909 | 16 | 8 | 8 | 1 |
| `squadPerformance.meanControl` | 2190.7 | 2186.6 | -0.1864 | 18 | 13 | 5 | 0.0963 |
| `squadPerformance.meanCohesion` | 1976.4000000000003 | 1963.2000000000003 | -0.6 | 21 | 7 | 14 | 0.1892 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 156 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=824&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=824&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=824`); it opens the seed that parts earliest, and the dropdowns choose another.

