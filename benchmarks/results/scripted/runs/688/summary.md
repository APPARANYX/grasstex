# Benchmark run #688 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 7d0cff3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38279688297) · build v29-dev

## Verdict

**MOVED: 25 of 25 pairs changed (median first part 152.1 s); 3 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties +5.0% (p 0.2295)**

- Clears the Bonferroni line (p < 0.0012): recon.cancelled 149 to 84 (-43.6%, p 0).
- Under 0.05 only: recon.orders 473 to 401 (-15.2%, p 0.0043); recon.timeouts 17 to 24 (+41.2%, p 0.0156).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **25** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.042 (gate 1.25)
- the 25 changed records first part at simulated second: min 133.05, p10 133.05, median 152.1, p90 169.05, max 169.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 904 | 949 | 1.8 | 25 | 16 | 9 | 0.2295 |
| `usKills` | 544 | 524 | -0.8 | 24 | 12 | 12 | 1 |
| `geKills` | 360 | 425 | 2.6 | 24 | 17 | 7 | 0.0639 |
| `fire.total` | 942 | 764 | -7.12 | 22 | 10 | 12 | 0.8318 |
| `fire.hits` | 337 | 305 | -1.28 | 22 | 11 | 11 | 1 |
| `retreatSamples` | 6473 | 7044 | 22.84 | 24 | 17 | 7 | 0.0639 |
| `movementResolver.changes` | 45582 | 44390 | -47.68 | 25 | 14 | 11 | 0.69 |
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
| `vacantObjectiveStalls.length` | 10 | 10 | 0 | 11 | 5 | 6 | 1 |
| `loopAlerts.length` | 10 | 1 | -0.36 | 8 | 1 | 7 | 0.0703 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 40 | 47 | 0.28 | 10 | 7 | 3 | 0.3438 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 473 | 401 | -2.88 | 22 | 4 | 18 | 0.0043 |
| `recon.contacts` | 51 | 40 | -0.44 | 13 | 6 | 7 | 1 |
| `recon.noContact` | 235 | 240 | 0.2 | 18 | 8 | 10 | 0.8145 |
| `recon.timeouts` | 17 | 24 | 0.28 | 7 | 7 | 0 | 0.0156 |
| `recon.cancelled` | 149 | 84 | -2.6 | 22 | 1 | 21 | 0 |
| `recon.reportsDelivered` | 280 | 234 | -1.84 | 18 | 10 | 8 | 0.8145 |
| `recon.retriggerBlocked` | 221 | 221 | 0 | 14 | 7 | 7 | 1 |
| `squadPerformance.meanOverall` | 2189.8999999999996 | 2186.1 | -0.152 | 25 | 10 | 15 | 0.4244 |
| `squadPerformance.p10Overall` | 2011.499999999999 | 2007.4999999999993 | -0.16 | 14 | 7 | 7 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1815.2 | 1825.5999999999997 | 0.416 | 25 | 13 | 12 | 1 |
| `squadPerformance.meanMovement` | 2486.1 | 2491.4999999999995 | 0.216 | 14 | 7 | 7 | 1 |
| `squadPerformance.meanControl` | 2492.4 | 2496.2999999999997 | 0.156 | 15 | 11 | 4 | 0.1185 |
| `squadPerformance.meanCohesion` | 2250.6000000000004 | 2213.4 | -1.488 | 25 | 11 | 14 | 0.69 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 133.05 s (timeline) · phase-c-natural-20261012-0003 152.1 s (timeline) · phase-c-natural-20261012-0002 169.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=688&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=688&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=688`); it opens the seed that parts earliest, and the dropdowns choose another.

