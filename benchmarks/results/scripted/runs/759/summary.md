# Benchmark run #759 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 800fdb7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38331184597) · build v29-dev

## Verdict

**MOVED: 25 of 25 pairs changed (median first part 146.1 s); 5 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties -10.1% (p 0.1078)**

- Clears the Bonferroni line (p < 0.0012): regroups.entries 58 to 40 (-31.0%, p 0); recon.orders 444 to 400 (-9.9%, p 0.0009).
- Under 0.05 only: recon.cancelled 128 to 93 (-27.3%, p 0.0066); recon.timeouts 18 to 31 (+72.2%, p 0.0078); recon.contacts 45 to 26 (-42.2%, p 0.0225).
- Unpaired records: off 0, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **25** pairs (unpaired: off 0, on 1) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.089 (gate 1.25)
- the 25 changed records first part at simulated second: min 124.05, p10 124.05, median 146.1, p90 169.05, max 169.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 958 | 861 | -3.88 | 25 | 8 | 17 | 0.1078 |
| `usKills` | 550 | 508 | -1.68 | 24 | 7 | 17 | 0.0639 |
| `geKills` | 408 | 353 | -2.2 | 23 | 8 | 15 | 0.21 |
| `fire.total` | 1222 | 905 | -12.68 | 22 | 9 | 13 | 0.5235 |
| `fire.hits` | 362 | 315 | -1.88 | 22 | 8 | 14 | 0.2863 |
| `retreatSamples` | 6160 | 6498 | 13.52 | 25 | 8 | 17 | 0.1078 |
| `movementResolver.changes` | 45586 | 44984 | -24.08 | 24 | 9 | 15 | 0.3075 |
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
| `vacantObjectiveStalls.length` | 7 | 9 | 0.08 | 7 | 4 | 3 | 1 |
| `loopAlerts.length` | 9 | 8 | -0.04 | 6 | 2 | 4 | 0.6875 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 58 | 40 | -0.72 | 16 | 0 | 16 | 0 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 444 | 400 | -1.76 | 22 | 3 | 19 | 0.0009 |
| `recon.contacts` | 45 | 26 | -0.76 | 13 | 2 | 11 | 0.0225 |
| `recon.noContact` | 235 | 233 | -0.08 | 9 | 2 | 7 | 0.1797 |
| `recon.timeouts` | 18 | 31 | 0.52 | 8 | 8 | 0 | 0.0078 |
| `recon.cancelled` | 128 | 93 | -1.4 | 24 | 5 | 19 | 0.0066 |
| `recon.reportsDelivered` | 256 | 161 | -3.8 | 14 | 8 | 6 | 0.7905 |
| `recon.retriggerBlocked` | 226 | 225 | -0.04 | 9 | 3 | 6 | 0.5078 |
| `squadPerformance.meanOverall` | 2187.8999999999996 | 2185.7000000000003 | -0.088 | 24 | 13 | 11 | 0.8388 |
| `squadPerformance.p10Overall` | 2010.1999999999991 | 2007.3999999999994 | -0.112 | 17 | 9 | 8 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1828.6999999999996 | 1835.3000000000002 | 0.264 | 22 | 11 | 11 | 1 |
| `squadPerformance.meanMovement` | 2491 | 2491 | 0 | 15 | 9 | 6 | 0.6072 |
| `squadPerformance.meanControl` | 2492 | 2491.9 | -0.004 | 14 | 7 | 7 | 1 |
| `squadPerformance.meanCohesion` | 2206.4 | 2207.1999999999994 | 0.032 | 24 | 13 | 11 | 0.8388 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 124.05 s (timeline) · phase-c-natural-20261012-0003 146.1 s (timeline) · phase-c-natural-20261012-0002 169.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=759&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=759&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=759`); it opens the seed that parts earliest, and the dropdowns choose another.

