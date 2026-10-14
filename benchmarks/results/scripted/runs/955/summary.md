# Benchmark run #955 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/combat-lab-main-integration @ b5fab76 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38501371281) · build v29-dev

## Verdict

**MOVED: 26 of 26 pairs changed (median first part 157.05 s); 4 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -4.2% (p 0.2863)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 377 to 341 (-9.5%, p 0.0004).
- Under 0.05 only: retreatSamples 5872 to 7079 (+20.6%, p 0.0026); movementResolver.changes 44953 to 49682 (+10.5%, p 0.0094); squadPerformance.meanControl 2569.3 to 2582.6000000000004 (+0.5%, p 0.049).

## Paired comparison (off against on)

- **26** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.195 (gate 1.25)
- the 26 changed records first part at simulated second: min 129, p10 129, median 157.05, p90 193.05, max 193.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1059 | 1014 | -1.7308 | 22 | 8 | 14 | 0.2863 |
| `usKills` | 443 | 384 | -2.2692 | 19 | 8 | 11 | 0.6476 |
| `geKills` | 616 | 630 | 0.5385 | 20 | 8 | 12 | 0.5034 |
| `fire.total` | 827 | 883 | 2.1538 | 20 | 8 | 12 | 0.5034 |
| `fire.hits` | 342 | 333 | -0.3462 | 19 | 9 | 10 | 1 |
| `retreatSamples` | 5872 | 7079 | 46.4231 | 20 | 17 | 3 | 0.0026 |
| `movementResolver.changes` | 44953 | 49682 | 181.8846 | 26 | 20 | 6 | 0.0094 |
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
| `vacantObjectiveStalls.length` | 11 | 7 | -0.1538 | 10 | 3 | 7 | 0.3438 |
| `loopAlerts.length` | 51 | 33 | -0.6923 | 16 | 4 | 12 | 0.0768 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 60 | 45 | -0.5769 | 10 | 2 | 8 | 0.1094 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 377 | 341 | -1.3846 | 20 | 2 | 18 | 0.0004 |
| `recon.contacts` | 41 | 25 | -0.6154 | 11 | 2 | 9 | 0.0654 |
| `recon.noContact` | 228 | 234 | 0.2308 | 11 | 7 | 4 | 0.5488 |
| `recon.timeouts` | 21 | 18 | -0.1154 | 3 | 0 | 3 | 0.25 |
| `recon.cancelled` | 73 | 54 | -0.7308 | 13 | 3 | 10 | 0.0923 |
| `recon.reportsDelivered` | 195 | 127 | -2.6154 | 15 | 6 | 9 | 0.6072 |
| `recon.retriggerBlocked` | 192 | 197 | 0.1923 | 12 | 8 | 4 | 0.3877 |
| `squadPerformance.meanOverall` | 2270.6 | 2253.7000000000007 | -0.65 | 25 | 10 | 15 | 0.4244 |
| `squadPerformance.p10Overall` | 2086.399999999999 | 2094.5999999999995 | 0.3154 | 15 | 11 | 4 | 0.1185 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1949.0999999999997 | 1865 | -3.2346 | 22 | 7 | 15 | 0.1338 |
| `squadPerformance.meanMovement` | 2584 | 2591.6000000000004 | 0.2923 | 15 | 7 | 8 | 1 |
| `squadPerformance.meanControl` | 2569.3 | 2582.6000000000004 | 0.5115 | 17 | 13 | 4 | 0.049 |
| `squadPerformance.meanCohesion` | 2192.4 | 2219.4000000000005 | 1.0385 | 24 | 15 | 9 | 0.3075 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 129 s (timeline) · phase-c-natural-20261012-0003 157.05 s (timeline) · phase-c-natural-20261012-0002 193.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=955&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/combat-lab-main-integration/ai_flow_live.html?bench=955&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=955`); it opens the seed that parts earliest, and the dropdowns choose another.

