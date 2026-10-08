# Benchmark run #469 · 60 seeds from `exec361p` (us-defend), windows `contact+600`

- **OFF** flags: `reconProbe=0` · **ON** flags: `none`
- claude/recon-probe @ f82f5b2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37852770340) · build v29-dev

## Verdict

**MOVED: 53 of 53 pairs changed (median first part 37.05 s); 6 of 34 counters under p 0.05 (about 1.7 by chance), 6 under 0.0015; casualties +1.0% (p 1)**

- Clears the Bonferroni line (p < 0.0015): regroups.entries 161 to 386 (+139.8%, p 0); recon.noContact 1244 to 495 (-60.2%, p 0); recon.timeouts 970 to 1307 (+34.7%, p 0); recon.retriggerBlocked 1273 to 901 (-29.2%, p 0); recon.orders 3318 to 2830 (-14.7%, p 0.0001); squadPerformance.meanCohesion 4637.700000000001 to 4506.500000000002 (-2.8%, p 0.0003).

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- the 53 changed records first part at simulated second: min 31.05, p10 32.1, median 37.05, p90 53.1, max 65.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2554 | 2580 | 0.4906 | 53 | 26 | 27 | 1 |
| `usKills` | 1137 | 1140 | 0.0566 | 51 | 31 | 20 | 0.1608 |
| `geKills` | 1417 | 1440 | 0.434 | 50 | 21 | 29 | 0.3222 |
| `fire.total` | 17801 | 16877 | -17.434 | 53 | 19 | 34 | 0.0534 |
| `fire.hits` | 6028 | 5988 | -0.7547 | 52 | 24 | 28 | 0.6778 |
| `retreatSamples` | 87186 | 80677 | -122.8113 | 53 | 22 | 31 | 0.2717 |
| `movementResolver.changes` | 154834 | 151671 | -59.6792 | 53 | 20 | 33 | 0.0984 |
| `movementStalls.length` | 3 | 4 | 0.0189 | 3 | 2 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 69 | 99 | 0.566 | 38 | 25 | 13 | 0.073 |
| `loopAlerts.length` | 234 | 192 | -0.7925 | 47 | 21 | 26 | 0.5601 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 161 | 386 | 4.2453 | 49 | 45 | 4 | 0 |
| `stallOutcomes.wakes` | 4 | 7 | 0.0566 | 8 | 5 | 3 | 0.7266 |
| `stallOutcomes.repeats` | 1 | 3 | 0.0377 | 3 | 2 | 1 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 16 | 117 | 1.9057 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 16 | 117 | 1.9057 | 2 | 2 | 0 | 0.5 |
| `recon.orders` | 3318 | 2830 | -9.2075 | 50 | 11 | 39 | 0.0001 |
| `recon.contacts` | 311 | 318 | 0.1321 | 45 | 24 | 21 | 0.766 |
| `recon.noContact` | 1244 | 495 | -14.1321 | 53 | 3 | 50 | 0 |
| `recon.timeouts` | 970 | 1307 | 6.3585 | 52 | 46 | 6 | 0 |
| `recon.cancelled` | 732 | 645 | -1.6415 | 52 | 21 | 31 | 0.2116 |
| `recon.reportsDelivered` | 1374 | 871 | -9.4906 | 52 | 19 | 33 | 0.0704 |
| `recon.retriggerBlocked` | 1273 | 901 | -7.0189 | 52 | 10 | 42 | 0 |
| `squadPerformance.meanOverall` | 4370.700000000001 | 4376.9 | 0.117 | 53 | 29 | 24 | 0.5831 |
| `squadPerformance.p10Overall` | 3976.1999999999994 | 3994.5 | 0.3453 | 40 | 22 | 18 | 0.6358 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3592.7000000000003 | 3647.9999999999995 | 1.0434 | 53 | 25 | 28 | 0.7838 |
| `squadPerformance.meanMovement` | 5269.7 | 5271.699999999998 | 0.0377 | 44 | 22 | 22 | 1 |
| `squadPerformance.meanControl` | 5158.800000000001 | 5159.099999999999 | 0.0057 | 52 | 27 | 25 | 0.8899 |
| `squadPerformance.meanCohesion` | 4637.700000000001 | 4506.500000000002 | -2.4755 | 53 | 13 | 40 | 0.0003 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361p-0011 31.05 s (timeline) · exec361p-0013 31.05 s (timeline) · exec361p-0022 31.05 s (timeline) · exec361p-0006 32.1 s (timeline) · exec361p-0023 32.1 s (timeline) · exec361p-0046 32.1 s (timeline) · exec361p-0052 32.1 s (timeline) · exec361p-0057 32.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=469&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=469`); it opens the seed that parts earliest, and the dropdowns choose another.

