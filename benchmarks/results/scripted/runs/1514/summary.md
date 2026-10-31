# Benchmark run #1514 · 60 seeds from `c701b` (us-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerGunner=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c701b-a71f322e @ a71f322 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41242488832) · build v29-dev

## Verdict

**MOVED: 45 of 55 pairs changed (median first part 198.075 s); 1 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties +4.4% (p 1)**

- Clears the Bonferroni line (p < 0.0012): fire.total 21960 to 23734 (+8.1%, p 0.0005).

## Paired comparison (off against on)

- **55** pairs (unpaired: off 0, on 0) · identical in every field: **10** · runtime errors off 0 / on 0 · wall time on/off x0.988 (gate 1.25)
- the 36 changed records first part at simulated second: min 128.1, p10 151.05, median 198.075, p90 263.1, max 284.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 792 | 827 | 0.6364 | 29 | 15 | 14 | 1 |
| `usKills` | 351 | 369 | 0.3273 | 27 | 15 | 12 | 0.7011 |
| `geKills` | 441 | 458 | 0.3091 | 28 | 15 | 13 | 0.8506 |
| `fire.total` | 21960 | 23734 | 32.2545 | 35 | 28 | 7 | 0.0005 |
| `fire.hits` | 1755 | 1855 | 1.8182 | 30 | 13 | 17 | 0.5847 |
| `retreatSamples` | 5305 | 5247 | -1.0545 | 31 | 17 | 14 | 0.7201 |
| `movementResolver.changes` | 111533 | 111691 | 2.8727 | 35 | 17 | 18 | 1 |
| `grenades.throws` | 25 | 21 | -0.0727 | 4 | 2 | 2 | 1 |
| `grenades.bursts` | 21 | 16 | -0.0909 | 3 | 1 | 2 | 1 |
| `grenades.wounded` | 26 | 19 | -0.1273 | 3 | 1 | 2 | 1 |
| `grenades.casualties` | 9 | 5 | -0.0727 | 2 | 0 | 2 | 0.5 |
| `grenades.suppressed` | 47 | 48 | 0.0182 | 3 | 1 | 2 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 6 | 7 | 0.0182 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 489 | 505 | 0.2909 | 25 | 15 | 10 | 0.4244 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 95 | 96 | 0.0182 | 8 | 5 | 3 | 0.7266 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1377 | 1389 | 0.2182 | 28 | 15 | 13 | 0.8506 |
| `recon.contacts` | 261 | 268 | 0.1273 | 21 | 12 | 9 | 0.6636 |
| `recon.noContact` | 479 | 478 | -0.0182 | 6 | 3 | 3 | 1 |
| `recon.timeouts` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 559 | 562 | 0.0545 | 24 | 13 | 11 | 0.8388 |
| `recon.reportsDelivered` | 1203 | 1229 | 0.4727 | 23 | 13 | 10 | 0.6776 |
| `recon.retriggerBlocked` | 483 | 482 | -0.0182 | 17 | 8 | 9 | 1 |
| `squadPerformance.meanOverall` | 4760.2 | 4757.200000000001 | -0.0545 | 31 | 15 | 16 | 1 |
| `squadPerformance.p10Overall` | 4284.799999999999 | 4304.2 | 0.3527 | 25 | 14 | 11 | 0.69 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4282.6 | 4291.5 | 0.1618 | 32 | 15 | 17 | 0.8601 |
| `squadPerformance.meanMovement` | 5477.199999999999 | 5471.9000000000015 | -0.0964 | 26 | 11 | 15 | 0.5572 |
| `squadPerformance.meanControl` | 5209.700000000001 | 5202.7 | -0.1273 | 31 | 13 | 18 | 0.4731 |
| `squadPerformance.meanCohesion` | 4794.700000000002 | 4782.699999999999 | -0.2182 | 30 | 13 | 17 | 0.5847 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c701b-0034 128.1 s (stress) · c701b-0019 134.1 s (timeline) · c701b-0046 145.05 s (timeline) · c701b-0057 151.05 s (timeline) · c701b-0045 160.05 s (timeline) · c701b-0010 161.1 s (timeline) · c701b-0050 165 s (stress) · c701b-0029 168 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1514&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c701b-a71f322e/ai_flow_live.html?bench=1514&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1514`); it opens the seed that parts earliest, and the dropdowns choose another.

