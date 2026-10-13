# Benchmark run #843 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-natural-readiness-diagnostics @ 976193d · [run](https://github.com/APPARANYX/grasstex/actions/runs/38390786503) · build v29-dev

## Verdict

**WEAK: 25 of 25 pairs changed (median first part 118.05 s); 4 of 42 counters under p 0.05 (about 2.1 by chance); casualties -14.6% (p 0.0227)**

- Under 0.05 only: usKills 550 to 490 (-10.9%, p 0.0106); movementResolver.changes 45586 to 48378 (+6.1%, p 0.0146); casualties 958 to 818 (-14.6%, p 0.0227); geKills 408 to 328 (-19.6%, p 0.0347).

## Paired comparison (off against on)

- **25** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.194 (gate 1.25)
- the 25 changed records first part at simulated second: min 109.05, p10 109.05, median 118.05, p90 169.05, max 169.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 958 | 818 | -5.6 | 24 | 6 | 18 | 0.0227 |
| `usKills` | 550 | 490 | -2.4 | 23 | 5 | 18 | 0.0106 |
| `geKills` | 408 | 328 | -3.2 | 23 | 6 | 17 | 0.0347 |
| `fire.total` | 1222 | 1083 | -5.56 | 23 | 12 | 11 | 1 |
| `fire.hits` | 362 | 309 | -2.12 | 22 | 8 | 14 | 0.2863 |
| `retreatSamples` | 6160 | 6935 | 31 | 24 | 15 | 9 | 0.3075 |
| `movementResolver.changes` | 45586 | 48378 | 111.68 | 25 | 19 | 6 | 0.0146 |
| `grenades.throws` | 0 | 1 | 0.04 | 1 | 1 | 0 | 1 |
| `grenades.bursts` | 0 | 1 | 0.04 | 1 | 1 | 0 | 1 |
| `grenades.wounded` | 0 | 1 | 0.04 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 1 | 0.04 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 7 | 9 | 0.08 | 6 | 4 | 2 | 0.6875 |
| `loopAlerts.length` | 9 | 17 | 0.32 | 11 | 7 | 4 | 0.5488 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 58 | 72 | 0.56 | 16 | 8 | 8 | 1 |
| `stallOutcomes.wakes` | 0 | 5 | 0.2 | 5 | 5 | 0 | 0.0625 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 444 | 412 | -1.28 | 14 | 6 | 8 | 0.7905 |
| `recon.contacts` | 45 | 45 | 0 | 16 | 8 | 8 | 1 |
| `recon.noContact` | 235 | 232 | -0.12 | 13 | 4 | 9 | 0.2668 |
| `recon.timeouts` | 18 | 23 | 0.2 | 5 | 5 | 0 | 0.0625 |
| `recon.cancelled` | 128 | 96 | -1.28 | 22 | 8 | 14 | 0.2863 |
| `recon.reportsDelivered` | 256 | 204 | -2.08 | 20 | 10 | 10 | 1 |
| `recon.retriggerBlocked` | 226 | 225 | -0.04 | 10 | 5 | 5 | 1 |
| `squadPerformance.meanOverall` | 2187.8999999999996 | 2172.1 | -0.632 | 25 | 8 | 17 | 0.1078 |
| `squadPerformance.p10Overall` | 2010.1999999999991 | 2009.0999999999995 | -0.044 | 16 | 9 | 7 | 0.8036 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1828.6999999999996 | 1793.7 | -1.4 | 25 | 8 | 17 | 0.1078 |
| `squadPerformance.meanMovement` | 2491 | 2486.4000000000005 | -0.184 | 18 | 10 | 8 | 0.8145 |
| `squadPerformance.meanControl` | 2492 | 2488.1 | -0.156 | 19 | 10 | 9 | 1 |
| `squadPerformance.meanCohesion` | 2206.4 | 2200.9 | -0.22 | 24 | 8 | 16 | 0.1516 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0003 109.05 s (timeline) · phase-c-natural-20261012-0001 118.05 s (stress) · phase-c-natural-20261012-0002 169.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=843&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=843&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=843`); it opens the seed that parts earliest, and the dropdowns choose another.

