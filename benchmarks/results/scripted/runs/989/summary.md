# Benchmark run #989 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-predictive-ambush-20261015 @ 721c195 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38677275344) · build v29-dev

## Verdict

**MOVED: 16 of 16 pairs changed (median first part 124.05 s); 10 of 42 counters under p 0.05 (about 2.1 by chance), 5 under 0.0012; casualties -18.4% (p 0.1796)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 436 to 279 (-36.0%, p 0); recon.cancelled 202 to 78 (-61.4%, p 0); usKills 373 to 187 (-49.9%, p 0.0001); recon.contacts 47 to 19 (-59.6%, p 0.0001); recon.reportsDelivered 233 to 90 (-61.4%, p 0.0001).
- Under 0.05 only: geKills 230 to 305 (+32.6%, p 0.0018); squadPerformance.meanOverall 1401.1000000000004 to 1380.3 (-1.5%, p 0.0042); regroups.entries 22 to 50 (+127.3%, p 0.0063); squadPerformance.meanCohesion 1399.4 to 1322.3 (-5.5%, p 0.0074); recon.timeouts 18 to 24 (+33.3%, p 0.0313).
- Unpaired records: off 0, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **16** pairs (unpaired: off 0, on 1) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.169 (gate 1.25)
- the 16 changed records first part at simulated second: min 124.05, p10 124.05, median 124.05, p90 166.05, max 166.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 603 | 492 | -6.9375 | 14 | 4 | 10 | 0.1796 |
| `usKills` | 373 | 187 | -11.625 | 15 | 0 | 15 | 0.0001 |
| `geKills` | 230 | 305 | 4.6875 | 14 | 13 | 1 | 0.0018 |
| `fire.total` | 603 | 765 | 10.125 | 15 | 10 | 5 | 0.3018 |
| `fire.hits` | 222 | 190 | -2 | 15 | 9 | 6 | 0.6072 |
| `retreatSamples` | 3509 | 4009 | 31.25 | 16 | 10 | 6 | 0.4545 |
| `movementResolver.changes` | 29930 | 29644 | -17.875 | 16 | 10 | 6 | 0.4545 |
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
| `vacantObjectiveStalls.length` | 5 | 4 | -0.0625 | 5 | 2 | 3 | 1 |
| `loopAlerts.length` | 20 | 38 | 1.125 | 11 | 8 | 3 | 0.2266 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 22 | 50 | 1.75 | 12 | 11 | 1 | 0.0063 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 436 | 279 | -9.8125 | 16 | 0 | 16 | 0 |
| `recon.contacts` | 47 | 19 | -1.75 | 14 | 0 | 14 | 0.0001 |
| `recon.noContact` | 155 | 152 | -0.1875 | 5 | 2 | 3 | 1 |
| `recon.timeouts` | 18 | 24 | 0.375 | 6 | 6 | 0 | 0.0313 |
| `recon.cancelled` | 202 | 78 | -7.75 | 16 | 0 | 16 | 0 |
| `recon.reportsDelivered` | 233 | 90 | -8.9375 | 14 | 0 | 14 | 0.0001 |
| `recon.retriggerBlocked` | 140 | 138 | -0.125 | 13 | 8 | 5 | 0.5811 |
| `squadPerformance.meanOverall` | 1401.1000000000004 | 1380.3 | -1.3 | 16 | 2 | 14 | 0.0042 |
| `squadPerformance.p10Overall` | 1272.6999999999998 | 1289.0999999999997 | 1.025 | 14 | 9 | 5 | 0.424 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1198.9999999999998 | 1157 | -2.625 | 16 | 4 | 12 | 0.0768 |
| `squadPerformance.meanMovement` | 1593.1 | 1594.4 | 0.0813 | 12 | 5 | 7 | 0.7744 |
| `squadPerformance.meanControl` | 1586.1000000000001 | 1578.8999999999999 | -0.45 | 14 | 6 | 8 | 0.7905 |
| `squadPerformance.meanCohesion` | 1399.4 | 1322.3 | -4.8188 | 15 | 2 | 13 | 0.0074 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 124.05 s (timeline) · phase-c-natural-20261012-0002 166.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=989&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-predictive-ambush-20261015/ai_flow_live.html?bench=989&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=989`); it opens the seed that parts earliest, and the dropdowns choose another.

