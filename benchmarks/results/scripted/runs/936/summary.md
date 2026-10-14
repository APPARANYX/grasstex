# Benchmark run #936 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/ship-soldier-autonomy-house-ingress-lab @ de108f4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38494270533) · build v29-dev

## Verdict

**MOVED: 26 of 26 pairs changed (median first part 152.1 s); 6 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties +0.5% (p 1)**

- Clears the Bonferroni line (p < 0.0012): recon.cancelled 155 to 41 (-73.5%, p 0); recon.orders 488 to 355 (-27.3%, p 0.0005).
- Under 0.05 only: squadPerformance.meanCohesion 2349.8000000000006 to 2281.9999999999995 (-2.9%, p 0.0094); recon.reportsDelivered 165 to 200 (+21.2%, p 0.0225); movementResolver.changes 48649 to 47948 (-1.4%, p 0.029); recon.timeouts 18 to 24 (+33.3%, p 0.0313).

## Paired comparison (off against on)

- **26** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.157 (gate 1.25)
- the 26 changed records first part at simulated second: min 143.1, p10 143.1, median 152.1, p90 169.05, max 169.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 976 | 981 | 0.1923 | 25 | 12 | 13 | 1 |
| `usKills` | 546 | 491 | -2.1154 | 25 | 12 | 13 | 1 |
| `geKills` | 430 | 490 | 2.3077 | 23 | 16 | 7 | 0.0931 |
| `fire.total` | 942 | 890 | -2 | 23 | 9 | 14 | 0.4049 |
| `fire.hits` | 332 | 329 | -0.1154 | 22 | 9 | 13 | 0.5235 |
| `retreatSamples` | 7084 | 7400 | 12.1538 | 25 | 17 | 8 | 0.1078 |
| `movementResolver.changes` | 48649 | 47948 | -26.9615 | 26 | 19 | 7 | 0.029 |
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
| `vacantObjectiveStalls.length` | 13 | 13 | 0 | 10 | 6 | 4 | 0.7539 |
| `loopAlerts.length` | 32 | 7 | -0.9615 | 12 | 4 | 8 | 0.3877 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 39 | 46 | 0.2692 | 13 | 7 | 6 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 488 | 355 | -5.1154 | 23 | 3 | 20 | 0.0005 |
| `recon.contacts` | 42 | 32 | -0.3846 | 11 | 4 | 7 | 0.5488 |
| `recon.noContact` | 252 | 247 | -0.1923 | 20 | 7 | 13 | 0.2632 |
| `recon.timeouts` | 18 | 24 | 0.2308 | 6 | 6 | 0 | 0.0313 |
| `recon.cancelled` | 155 | 41 | -4.3846 | 25 | 1 | 24 | 0 |
| `recon.reportsDelivered` | 165 | 200 | 1.3462 | 13 | 11 | 2 | 0.0225 |
| `recon.retriggerBlocked` | 244 | 227 | -0.6538 | 16 | 5 | 11 | 0.2101 |
| `squadPerformance.meanOverall` | 2276.2999999999993 | 2269.5999999999995 | -0.2577 | 25 | 9 | 16 | 0.2295 |
| `squadPerformance.p10Overall` | 2093.6999999999994 | 2095.099999999999 | 0.0538 | 12 | 6 | 6 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1879.9 | 1894.6000000000001 | 0.5654 | 26 | 13 | 13 | 1 |
| `squadPerformance.meanMovement` | 2580.7 | 2592.5 | 0.4538 | 17 | 11 | 6 | 0.3323 |
| `squadPerformance.meanControl` | 2588.4 | 2593.5 | 0.1962 | 20 | 12 | 8 | 0.5034 |
| `squadPerformance.meanCohesion` | 2349.8000000000006 | 2281.9999999999995 | -2.6077 | 26 | 6 | 20 | 0.0094 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 143.1 s (timeline) · phase-c-natural-20261012-0003 152.1 s (timeline) · phase-c-natural-20261012-0002 169.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=936&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/ship-soldier-autonomy-house-ingress-lab/ai_flow_live.html?bench=936&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=936`); it opens the seed that parts earliest, and the dropdowns choose another.

