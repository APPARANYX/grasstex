# Benchmark run #957 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1&autonomousMovement=0&smartIndoorIngress=0` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1&autonomousMovement=1&smartIndoorIngress=0`
- work/phase-c-locomotion-fix-20261014 @ 152cfe1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38562377642) · build v29-dev

## Verdict

**WEAK: 25 of 25 pairs changed (median first part 111 s); 5 of 42 counters under p 0.05 (about 2.1 by chance); casualties +4.5% (p 1)**

- Under 0.05 only: recon.cancelled 96 to 57 (-40.6%, p 0.0023); movementResolver.changes 48378 to 43405 (-10.3%, p 0.0041); loopAlerts.length 17 to 60 (+252.9%, p 0.0118); recon.orders 412 to 331 (-19.7%, p 0.0414); geKills 328 to 444 (+35.4%, p 0.0433).
- Unpaired records: off 0, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **25** pairs (unpaired: off 0, on 1) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.005 (gate 1.25)
- the 25 changed records first part at simulated second: min 109.05, p10 109.05, median 111, p90 112.05, max 112.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 818 | 855 | 1.48 | 23 | 12 | 11 | 1 |
| `usKills` | 490 | 411 | -3.16 | 25 | 11 | 14 | 0.69 |
| `geKills` | 328 | 444 | 4.64 | 25 | 18 | 7 | 0.0433 |
| `fire.total` | 1083 | 1207 | 4.96 | 20 | 12 | 8 | 0.5034 |
| `fire.hits` | 309 | 300 | -0.36 | 23 | 14 | 9 | 0.4049 |
| `retreatSamples` | 6935 | 6594 | -13.64 | 24 | 14 | 10 | 0.5413 |
| `movementResolver.changes` | 48378 | 43405 | -198.92 | 25 | 5 | 20 | 0.0041 |
| `grenades.throws` | 1 | 0 | -0.04 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 1 | 0 | -0.04 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 1 | 0 | -0.04 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 1 | 0 | -0.04 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 9 | 5 | -0.16 | 8 | 2 | 6 | 0.2891 |
| `loopAlerts.length` | 17 | 60 | 1.72 | 20 | 16 | 4 | 0.0118 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 72 | 58 | -0.56 | 19 | 8 | 11 | 0.6476 |
| `stallOutcomes.wakes` | 5 | 4 | -0.04 | 9 | 4 | 5 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 412 | 331 | -3.24 | 20 | 5 | 15 | 0.0414 |
| `recon.contacts` | 45 | 21 | -0.96 | 17 | 6 | 11 | 0.3323 |
| `recon.noContact` | 232 | 216 | -0.64 | 15 | 6 | 9 | 0.6072 |
| `recon.timeouts` | 23 | 30 | 0.28 | 7 | 6 | 1 | 0.125 |
| `recon.cancelled` | 96 | 57 | -1.56 | 17 | 2 | 15 | 0.0023 |
| `recon.reportsDelivered` | 204 | 144 | -2.4 | 18 | 7 | 11 | 0.4807 |
| `recon.retriggerBlocked` | 225 | 198 | -1.08 | 19 | 7 | 12 | 0.3593 |
| `squadPerformance.meanOverall` | 2172.1 | 2158.6000000000004 | -0.54 | 24 | 10 | 14 | 0.5413 |
| `squadPerformance.p10Overall` | 2009.0999999999995 | 2001.9999999999995 | -0.284 | 20 | 7 | 13 | 0.2632 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1793.7 | 1782.1 | -0.464 | 24 | 10 | 14 | 0.5413 |
| `squadPerformance.meanMovement` | 2486.4000000000005 | 2484.400000000001 | -0.08 | 22 | 8 | 14 | 0.2863 |
| `squadPerformance.meanControl` | 2488.1 | 2464.8999999999996 | -0.928 | 24 | 7 | 17 | 0.0639 |
| `squadPerformance.meanCohesion` | 2200.9 | 2137.100000000001 | -2.552 | 25 | 10 | 15 | 0.4244 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0003 109.05 s (stress) · phase-c-natural-20261012-0001 111 s (timeline) · phase-c-natural-20261012-0002 112.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=957&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-locomotion-fix-20261014/ai_flow_live.html?bench=957&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=957`); it opens the seed that parts earliest, and the dropdowns choose another.

