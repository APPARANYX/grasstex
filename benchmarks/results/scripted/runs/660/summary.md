# Benchmark run #660 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/299-c3-effective-fire-voice @ 75489f0 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38265641145) · build v29-dev

## Verdict

**MOVED: 21 of 21 pairs changed (median first part 209.1 s); 8 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties -8.6% (p 0.0213)**

- Clears the Bonferroni line (p < 0.0012): recon.contacts 6 to 19 (+216.7%, p 0.0002); recon.reportsDelivered 48 to 123 (+156.3%, p 0.0002).
- Under 0.05 only: recon.cancelled 106 to 86 (-18.9%, p 0.0018); squadPerformance.meanMission 1434.7 to 1479.1000000000001 (+3.1%, p 0.0034); retreatSamples 5727 to 4461 (-22.1%, p 0.0129); regroups.entries 24 to 53 (+120.8%, p 0.0156); casualties 835 to 763 (-8.6%, p 0.0213); usKills 404 to 345 (-14.6%, p 0.0352).

## Paired comparison (off against on)

- **21** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.151 (gate 1.25)
- the 17 changed records first part at simulated second: min 185.1, p10 185.1, median 209.1, p90 387, max 387

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 835 | 763 | -3.4286 | 16 | 3 | 13 | 0.0213 |
| `usKills` | 404 | 345 | -2.8095 | 15 | 3 | 12 | 0.0352 |
| `geKills` | 431 | 418 | -0.619 | 13 | 3 | 10 | 0.0923 |
| `fire.total` | 725 | 723 | -0.0952 | 15 | 7 | 8 | 1 |
| `fire.hits` | 314 | 312 | -0.0952 | 15 | 7 | 8 | 1 |
| `retreatSamples` | 5727 | 4461 | -60.2857 | 14 | 2 | 12 | 0.0129 |
| `movementResolver.changes` | 53649 | 55407 | 83.7143 | 17 | 11 | 6 | 0.3323 |
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
| `vacantObjectiveStalls.length` | 14 | 13 | -0.0476 | 9 | 5 | 4 | 1 |
| `loopAlerts.length` | 9 | 16 | 0.3333 | 8 | 7 | 1 | 0.0703 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 24 | 53 | 1.381 | 7 | 7 | 0 | 0.0156 |
| `stallOutcomes.wakes` | 2 | 5 | 0.1429 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 419 | 411 | -0.381 | 10 | 3 | 7 | 0.3438 |
| `recon.contacts` | 6 | 19 | 0.619 | 13 | 13 | 0 | 0.0002 |
| `recon.noContact` | 301 | 300 | -0.0476 | 8 | 5 | 3 | 0.7266 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 106 | 86 | -0.9524 | 14 | 1 | 13 | 0.0018 |
| `recon.reportsDelivered` | 48 | 123 | 3.5714 | 13 | 13 | 0 | 0.0002 |
| `recon.retriggerBlocked` | 334 | 323 | -0.5238 | 13 | 5 | 8 | 0.5811 |
| `squadPerformance.meanOverall` | 1813.3999999999999 | 1813.3999999999999 | 0 | 15 | 5 | 10 | 0.3018 |
| `squadPerformance.p10Overall` | 1698.9999999999995 | 1688.3999999999996 | -0.5048 | 10 | 2 | 8 | 0.1094 |
| `squadPerformance.lowScoreSquads` | 0 | 1 | 0.0476 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMission` | 1434.7 | 1479.1000000000001 | 2.1143 | 13 | 12 | 1 | 0.0034 |
| `squadPerformance.meanMovement` | 2079.6000000000004 | 2061.2999999999997 | -0.8714 | 14 | 6 | 8 | 0.7905 |
| `squadPerformance.meanControl` | 2090.2 | 2086.7000000000003 | -0.1667 | 15 | 5 | 10 | 0.3018 |
| `squadPerformance.meanCohesion` | 1930.3000000000002 | 1890.1000000000001 | -1.9143 | 16 | 4 | 12 | 0.0768 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 185.1 s (timeline) · phase-c-natural-20261012-0003 209.1 s (timeline) · phase-c-natural-20261012-0002 387 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=660&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/299-c3-effective-fire-voice/ai_flow_live.html?bench=660&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=660`); it opens the seed that parts earliest, and the dropdowns choose another.

