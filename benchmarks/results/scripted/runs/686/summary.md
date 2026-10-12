# Benchmark run #686 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 7d0cff3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38279609180) · build v29-dev

## Verdict

**WEAK: 22 of 22 pairs changed (median first part 150 s); 4 of 42 counters under p 0.05 (about 2.1 by chance); casualties -11.4% (p 0.1671)**

- Under 0.05 only: squadPerformance.meanMission 1503.3 to 1593.1 (+6.0%, p 0.0043); recon.timeouts 22 to 14 (-36.4%, p 0.0078); squadPerformance.meanOverall 1896.6000000000004 to 1920.6999999999998 (+1.3%, p 0.0266); regroups.entries 37 to 23 (-37.8%, p 0.0386).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.967 (gate 1.25)
- the 22 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 162, max 162

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 725 | 642 | -3.7727 | 19 | 6 | 13 | 0.1671 |
| `usKills` | 252 | 157 | -4.3182 | 18 | 6 | 12 | 0.2379 |
| `geKills` | 473 | 485 | 0.5455 | 18 | 11 | 7 | 0.4807 |
| `fire.total` | 688 | 711 | 1.0455 | 21 | 11 | 10 | 1 |
| `fire.hits` | 258 | 249 | -0.4091 | 20 | 8 | 12 | 0.5034 |
| `retreatSamples` | 6578 | 5262 | -59.8182 | 22 | 6 | 16 | 0.0525 |
| `movementResolver.changes` | 40444 | 42119 | 76.1364 | 22 | 12 | 10 | 0.8318 |
| `grenades.throws` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 4 | 0 | -0.1818 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 1 | 0 | -0.0455 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 9 | 2 | -0.3182 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 7 | 6 | -0.0455 | 8 | 4 | 4 | 1 |
| `loopAlerts.length` | 5 | 5 | 0 | 6 | 3 | 3 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 37 | 23 | -0.6364 | 12 | 2 | 10 | 0.0386 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 363 | 350 | -0.5909 | 18 | 6 | 12 | 0.2379 |
| `recon.contacts` | 54 | 34 | -0.9091 | 17 | 6 | 11 | 0.3323 |
| `recon.noContact` | 213 | 219 | 0.2727 | 11 | 7 | 4 | 0.5488 |
| `recon.timeouts` | 22 | 14 | -0.3636 | 8 | 0 | 8 | 0.0078 |
| `recon.cancelled` | 57 | 66 | 0.4091 | 16 | 9 | 7 | 0.8036 |
| `recon.reportsDelivered` | 248 | 160 | -4 | 17 | 6 | 11 | 0.3323 |
| `recon.retriggerBlocked` | 219 | 207 | -0.5455 | 15 | 7 | 8 | 1 |
| `squadPerformance.meanOverall` | 1896.6000000000004 | 1920.6999999999998 | 1.0955 | 21 | 16 | 5 | 0.0266 |
| `squadPerformance.p10Overall` | 1740.5999999999997 | 1764.9999999999995 | 1.1091 | 12 | 7 | 5 | 0.7744 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1503.3 | 1593.1 | 4.0818 | 22 | 18 | 4 | 0.0043 |
| `squadPerformance.meanMovement` | 2193.1000000000004 | 2195.7000000000003 | 0.1182 | 15 | 8 | 7 | 1 |
| `squadPerformance.meanControl` | 2195.2 | 2194.2000000000003 | -0.0455 | 17 | 7 | 10 | 0.6291 |
| `squadPerformance.meanCohesion` | 1982.5999999999997 | 1965.7000000000003 | -0.7682 | 22 | 6 | 16 | 0.0525 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 162 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=686&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=686&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=686`); it opens the seed that parts earliest, and the dropdowns choose another.

