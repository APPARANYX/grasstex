# Benchmark run #937 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/ship-soldier-autonomy-house-ingress-lab @ 9aabb4b · [run](https://github.com/APPARANYX/grasstex/actions/runs/38495445942) · build v29-dev

## Verdict

**MOVED: 19 of 19 pairs changed (median first part 288 s); 2 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -3.0% (p 0.7744)**

- Clears the Bonferroni line (p < 0.0012): usKills 357 to 445 (+24.6%, p 0.0005).
- Under 0.05 only: geKills 469 to 356 (-24.1%, p 0.0063).
- Unpaired records: off 2, on 2 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **19** pairs (unpaired: off 2, on 2) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.147 (gate 1.25)
- the 13 changed records first part at simulated second: min 185.1, p10 185.1, median 288, p90 410.1, max 410.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 826 | 801 | -1.3158 | 12 | 5 | 7 | 0.7744 |
| `usKills` | 357 | 445 | 4.6316 | 12 | 12 | 0 | 0.0005 |
| `geKills` | 469 | 356 | -5.9474 | 12 | 1 | 11 | 0.0063 |
| `fire.total` | 771 | 677 | -4.9474 | 8 | 3 | 5 | 0.7266 |
| `fire.hits` | 402 | 337 | -3.4211 | 7 | 3 | 4 | 1 |
| `retreatSamples` | 3719 | 3542 | -9.3158 | 10 | 5 | 5 | 1 |
| `movementResolver.changes` | 46670 | 45557 | -58.5789 | 13 | 3 | 10 | 0.0923 |
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
| `vacantObjectiveStalls.length` | 17 | 18 | 0.0526 | 4 | 2 | 2 | 1 |
| `loopAlerts.length` | 50 | 53 | 0.1579 | 7 | 5 | 2 | 0.4531 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 39 | 36 | -0.1579 | 7 | 2 | 5 | 0.4531 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 374 | 389 | 0.7895 | 10 | 7 | 3 | 0.3438 |
| `recon.contacts` | 26 | 22 | -0.2105 | 6 | 1 | 5 | 0.2188 |
| `recon.noContact` | 264 | 276 | 0.6316 | 5 | 4 | 1 | 0.375 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 79 | 79 | 0 | 6 | 4 | 2 | 0.6875 |
| `recon.reportsDelivered` | 77 | 96 | 1 | 7 | 3 | 4 | 1 |
| `recon.retriggerBlocked` | 295 | 303 | 0.4211 | 8 | 5 | 3 | 0.7266 |
| `squadPerformance.meanOverall` | 1642.9000000000003 | 1633 | -0.5211 | 12 | 5 | 7 | 0.7744 |
| `squadPerformance.p10Overall` | 1511.2999999999995 | 1499.0999999999997 | -0.6421 | 8 | 3 | 5 | 0.7266 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1383.8999999999999 | 1357.3000000000002 | -1.4 | 11 | 3 | 8 | 0.2266 |
| `squadPerformance.meanMovement` | 1861.8999999999999 | 1857 | -0.2579 | 12 | 6 | 6 | 1 |
| `squadPerformance.meanControl` | 1861.7 | 1860.1000000000001 | -0.0842 | 10 | 6 | 4 | 0.7539 |
| `squadPerformance.meanCohesion` | 1656.3999999999999 | 1654.4 | -0.1053 | 11 | 5 | 6 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 185.1 s (timeline) · phase-c-natural-20261012-0002 288 s (timeline) · phase-c-natural-20261012-0003 410.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=937&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/ship-soldier-autonomy-house-ingress-lab/ai_flow_live.html?bench=937&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=937`); it opens the seed that parts earliest, and the dropdowns choose another.

