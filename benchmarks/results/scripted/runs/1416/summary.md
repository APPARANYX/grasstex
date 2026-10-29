# Benchmark run #1416 · 60 seeds from `pr683-gate-20261029` (us-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pr683-f845a2d6 @ f845a2d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40944253291) · build v29-dev

## Verdict

**MOVED: 54 of 54 pairs changed (median first part 1.05 s); 17 of 42 counters under p 0.05 (about 2.1 by chance), 11 under 0.0012; casualties +5.1% (p 0.243)**

- Clears the Bonferroni line (p < 0.0012): fire.total 6510 to 13522 (+107.7%, p 0); loopAlerts.length 124 to 593 (+378.2%, p 0); regroups.entries 51 to 0 (-100.0%, p 0); recon.orders 755 to 158 (-79.1%, p 0); recon.contacts 98 to 0 (-100.0%, p 0); recon.noContact 472 to 0 (-100.0%, p 0); recon.reportsDelivered 461 to 0 (-100.0%, p 0); recon.retriggerBlocked 453 to 0 (-100.0%, p 0); squadPerformance.meanOverall 4703.3 to 4514.900000000001 (-4.0%, p 0); squadPerformance.meanControl 5309.600000000001 to 5110.700000000002 (-3.7%, p 0); squadPerformance.meanCohesion 4778.6 to 4433.499999999999 (-7.2%, p 0).
- Under 0.05 only: recon.timeouts 16 to 0 (-100.0%, p 0.002); squadPerformance.meanMission 4209.3 to 3924.399999999999 (-6.8%, p 0.0038); retreatSamples 9020 to 13036 (+44.5%, p 0.0402); usKills 674 to 566 (-16.0%, p 0.0444); geKills 649 to 825 (+27.1%, p 0.0444); recon.cancelled 135 to 158 (+17.0%, p 0.0488).
- Wall time on/off x1.53 is over the 1.25 gate.

## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.53 (gate 1.25)
- the 54 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1323 | 1391 | 1.2593 | 47 | 28 | 19 | 0.243 |
| `usKills` | 674 | 566 | -2 | 49 | 17 | 32 | 0.0444 |
| `geKills` | 649 | 825 | 3.2593 | 49 | 32 | 17 | 0.0444 |
| `fire.total` | 6510 | 13522 | 129.8519 | 53 | 50 | 3 | 0 |
| `fire.hits` | 2542 | 2544 | 0.037 | 54 | 25 | 29 | 0.6835 |
| `retreatSamples` | 9020 | 13036 | 74.3704 | 54 | 35 | 19 | 0.0402 |
| `movementResolver.changes` | 72700 | 70356 | -43.4074 | 54 | 23 | 31 | 0.3409 |
| `grenades.throws` | 26 | 21 | -0.0926 | 7 | 3 | 4 | 1 |
| `grenades.bursts` | 21 | 21 | 0 | 7 | 4 | 3 | 1 |
| `grenades.wounded` | 20 | 20 | 0 | 4 | 2 | 2 | 1 |
| `grenades.casualties` | 6 | 5 | -0.0185 | 3 | 1 | 2 | 1 |
| `grenades.suppressed` | 75 | 65 | -0.1852 | 4 | 1 | 3 | 0.625 |
| `grenades.friendlyWounded` | 0 | 1 | 0.0185 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 7 | 0.1111 | 5 | 5 | 0 | 0.0625 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 6 | 0.0741 | 4 | 3 | 1 | 0.625 |
| `loopAlerts.length` | 124 | 593 | 8.6852 | 53 | 51 | 2 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 51 | 0 | -0.9444 | 31 | 0 | 31 | 0 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 755 | 158 | -11.0556 | 54 | 0 | 54 | 0 |
| `recon.contacts` | 98 | 0 | -1.8148 | 46 | 0 | 46 | 0 |
| `recon.noContact` | 472 | 0 | -8.7407 | 54 | 0 | 54 | 0 |
| `recon.timeouts` | 16 | 0 | -0.2963 | 10 | 0 | 10 | 0.002 |
| `recon.cancelled` | 135 | 158 | 0.4259 | 44 | 29 | 15 | 0.0488 |
| `recon.reportsDelivered` | 461 | 0 | -8.537 | 40 | 0 | 40 | 0 |
| `recon.retriggerBlocked` | 453 | 0 | -8.3889 | 54 | 0 | 54 | 0 |
| `squadPerformance.meanOverall` | 4703.3 | 4514.900000000001 | -3.4889 | 54 | 7 | 47 | 0 |
| `squadPerformance.p10Overall` | 4155.199999999999 | 4092.499999999998 | -1.1611 | 47 | 17 | 30 | 0.0789 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4209.3 | 3924.399999999999 | -5.2759 | 54 | 16 | 38 | 0.0038 |
| `squadPerformance.meanMovement` | 5386.399999999999 | 5386.3 | -0.0019 | 42 | 16 | 26 | 0.1641 |
| `squadPerformance.meanControl` | 5309.600000000001 | 5110.700000000002 | -3.6833 | 53 | 2 | 51 | 0 |
| `squadPerformance.meanCohesion` | 4778.6 | 4433.499999999999 | -6.3907 | 54 | 6 | 48 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr683-gate-20261029-0001 1.05 s (timeline) · pr683-gate-20261029-0002 1.05 s (timeline) · pr683-gate-20261029-0003 1.05 s (timeline) · pr683-gate-20261029-0004 1.05 s (timeline) · pr683-gate-20261029-0005 1.05 s (timeline) · pr683-gate-20261029-0006 1.05 s (timeline) · pr683-gate-20261029-0007 1.05 s (timeline) · pr683-gate-20261029-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1416&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pr683-f845a2d6/ai_flow_live.html?bench=1416&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1416`); it opens the seed that parts earliest, and the dropdowns choose another.

