# Benchmark run #1233 · 100 seeds from `contact-prone-support-20261021` (meeting), windows `0+600`

- **OFF** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&verifyContact=0` · **ON** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/squad-firing-positions-20261021 @ 588afb2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39773781646) · build v29-dev

## Verdict

**QUIET: 76 of 100 pairs changed (median first part 397.57500000000005 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.5% (p 0.3269)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **24** · runtime errors off 0 / on 0 · wall time on/off x0.997 (gate 1.25)
- the 44 changed records first part at simulated second: min 239.1, p10 341.1, median 397.57500000000005, p90 551.1, max 598.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3252 | 3236 | -0.16 | 26 | 16 | 10 | 0.3269 |
| `usKills` | 1760 | 1759 | -0.01 | 18 | 11 | 7 | 0.4807 |
| `geKills` | 1492 | 1477 | -0.15 | 19 | 12 | 7 | 0.3593 |
| `fire.total` | 15201 | 15335 | 1.34 | 31 | 19 | 12 | 0.281 |
| `fire.hits` | 6715 | 6705 | -0.1 | 28 | 18 | 10 | 0.1849 |
| `retreatSamples` | 94343 | 94038 | -3.05 | 25 | 14 | 11 | 0.69 |
| `movementResolver.changes` | 132239 | 133122 | 8.83 | 44 | 27 | 17 | 0.1742 |
| `grenades.throws` | 25 | 24 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 25 | 24 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 47 | 47 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 18 | 19 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 115 | 113 | -0.02 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 8 | 4 | -0.04 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 4 | 1 | -0.03 | 1 | 0 | 1 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 43 | 45 | 0.02 | 4 | 3 | 1 | 0.625 |
| `routeStalls.length` | 140 | 136 | -0.04 | 3 | 0 | 3 | 0.25 |
| `targetlessStalls.length` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 323 | 322 | -0.01 | 10 | 5 | 5 | 1 |
| `loopAlerts.length` | 983 | 989 | 0.06 | 20 | 14 | 6 | 0.1153 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 169 | 168 | -0.01 | 7 | 3 | 4 | 1 |
| `stallOutcomes.wakes` | 2 | 3 | 0.01 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 3 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 44 | 48 | 0.04 | 4 | 3 | 1 | 0.625 |
| `timeline.stalledSamples` | 1976 | 1974 | -0.02 | 3 | 2 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 44 | 48 | 0.04 | 4 | 3 | 1 | 0.625 |
| `timeline.stalledSamplesRepeated` | 1976 | 1974 | -0.02 | 3 | 2 | 1 | 1 |
| `recon.orders` | 1730 | 1750 | 0.2 | 17 | 12 | 5 | 0.1435 |
| `recon.contacts` | 132 | 134 | 0.02 | 4 | 3 | 1 | 0.625 |
| `recon.noContact` | 392 | 397 | 0.05 | 15 | 10 | 5 | 0.3018 |
| `recon.timeouts` | 504 | 504 | 0 | 7 | 4 | 3 | 1 |
| `recon.cancelled` | 603 | 614 | 0.11 | 19 | 11 | 8 | 0.6476 |
| `recon.reportsDelivered` | 547 | 555 | 0.08 | 10 | 5 | 5 | 1 |
| `recon.retriggerBlocked` | 920 | 927 | 0.07 | 14 | 8 | 6 | 0.7905 |
| `squadPerformance.meanOverall` | 8547.800000000001 | 8543.300000000003 | -0.045 | 30 | 13 | 17 | 0.5847 |
| `squadPerformance.p10Overall` | 7498.500000000002 | 7496.900000000002 | -0.016 | 14 | 7 | 7 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7117.399999999999 | 7098.900000000001 | -0.185 | 22 | 8 | 14 | 0.2863 |
| `squadPerformance.meanMovement` | 9793.600000000004 | 9796.200000000004 | 0.026 | 19 | 10 | 9 | 1 |
| `squadPerformance.meanControl` | 9521.9 | 9522.5 | 0.006 | 25 | 8 | 17 | 0.1078 |
| `squadPerformance.meanCohesion` | 9680.9 | 9686.599999999997 | 0.057 | 26 | 17 | 9 | 0.1686 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

contact-prone-support-20261021-0012 239.1 s (timeline) · contact-prone-support-20261021-0052 308.1 s (timeline) · contact-prone-support-20261021-0070 338.1 s (timeline) · contact-prone-support-20261021-0084 340.05 s (timeline) · contact-prone-support-20261021-0005 341.1 s (timeline) · contact-prone-support-20261021-0021 345 s (timeline) · contact-prone-support-20261021-0043 349.05 s (timeline) · contact-prone-support-20261021-0093 354.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1233&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-firing-positions-20261021/ai_flow_live.html?bench=1233&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1233`); it opens the seed that parts earliest, and the dropdowns choose another.

