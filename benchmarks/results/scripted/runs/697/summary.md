# Benchmark run #697 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 5dae82a · [run](https://github.com/APPARANYX/grasstex/actions/runs/38283261045) · build v29-dev

## Verdict

**MOVED: 22 of 22 pairs changed (median first part 150 s); 7 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties -20.0% (p 0.0004)**

- Clears the Bonferroni line (p < 0.0012): casualties 725 to 580 (-20.0%, p 0.0004); squadPerformance.meanMission 1503.3 to 1585.6 (+5.5%, p 0.0009).
- Under 0.05 only: usKills 252 to 137 (-45.6%, p 0.0023); retreatSamples 6578 to 5339 (-18.8%, p 0.0043); squadPerformance.meanOverall 1896.6000000000004 to 1918.6999999999998 (+1.2%, p 0.0266); recon.timeouts 22 to 16 (-27.3%, p 0.0313); regroups.entries 37 to 23 (-37.8%, p 0.0386).
- Unpaired records: off 1, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 1, on 1) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.147 (gate 1.25)
- the 22 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 162, max 162

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 725 | 580 | -6.5909 | 20 | 2 | 18 | 0.0004 |
| `usKills` | 252 | 137 | -5.2273 | 17 | 2 | 15 | 0.0023 |
| `geKills` | 473 | 443 | -1.3636 | 19 | 7 | 12 | 0.3593 |
| `fire.total` | 688 | 670 | -0.8182 | 21 | 10 | 11 | 1 |
| `fire.hits` | 258 | 226 | -1.4545 | 20 | 6 | 14 | 0.1153 |
| `retreatSamples` | 6578 | 5339 | -56.3182 | 22 | 4 | 18 | 0.0043 |
| `movementResolver.changes` | 40444 | 41751 | 59.4091 | 22 | 12 | 10 | 0.8318 |
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
| `vacantObjectiveStalls.length` | 7 | 5 | -0.0909 | 7 | 3 | 4 | 1 |
| `loopAlerts.length` | 5 | 8 | 0.1364 | 5 | 3 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 37 | 23 | -0.6364 | 12 | 2 | 10 | 0.0386 |
| `stallOutcomes.wakes` | 0 | 1 | 0.0455 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 1 | 0.0455 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 363 | 349 | -0.6364 | 21 | 6 | 15 | 0.0784 |
| `recon.contacts` | 54 | 46 | -0.3636 | 17 | 6 | 11 | 0.3323 |
| `recon.noContact` | 213 | 224 | 0.5 | 11 | 8 | 3 | 0.2266 |
| `recon.timeouts` | 22 | 16 | -0.2727 | 6 | 0 | 6 | 0.0313 |
| `recon.cancelled` | 57 | 46 | -0.5 | 13 | 5 | 8 | 0.5811 |
| `recon.reportsDelivered` | 248 | 230 | -0.8182 | 17 | 6 | 11 | 0.3323 |
| `recon.retriggerBlocked` | 219 | 210 | -0.4091 | 13 | 7 | 6 | 1 |
| `squadPerformance.meanOverall` | 1896.6000000000004 | 1918.6999999999998 | 1.0045 | 21 | 16 | 5 | 0.0266 |
| `squadPerformance.p10Overall` | 1740.5999999999997 | 1766.8999999999994 | 1.1955 | 15 | 9 | 6 | 0.6072 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1503.3 | 1585.6 | 3.7409 | 22 | 19 | 3 | 0.0009 |
| `squadPerformance.meanMovement` | 2193.1000000000004 | 2188.7 | -0.2 | 13 | 6 | 7 | 1 |
| `squadPerformance.meanControl` | 2195.2 | 2192.2 | -0.1364 | 17 | 6 | 11 | 0.3323 |
| `squadPerformance.meanCohesion` | 1982.5999999999997 | 1966.5000000000002 | -0.7318 | 22 | 7 | 15 | 0.1338 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 162 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=697&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=697&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=697`); it opens the seed that parts earliest, and the dropdowns choose another.

