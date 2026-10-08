# Benchmark run #459 · 60 seeds from `recon-ledger` (meeting), windows `contact+120`

- **OFF** flags: `?reconLedger=0` · **ON** flags: `none`
- work/recon-outcomes-393 @ c90239c · [run](https://github.com/APPARANYX/grasstex/actions/runs/37845881075) · build v29-dev

## Verdict

**MOVED: 60 of 60 pairs changed (median first part 149.1 s); 4 of 34 counters under p 0.05 (about 1.7 by chance), 2 under 0.0015; casualties -6.2% (p 0.7877)**

- Clears the Bonferroni line (p < 0.0015): recon.orders 1367 to 1267 (-7.3%, p 0); recon.noContact 920 to 856 (-7.0%, p 0).
- Under 0.05 only: recon.retriggerBlocked 1049 to 1030 (-1.8%, p 0.0385); regroups.entries 58 to 77 (+32.8%, p 0.0428).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.954 (gate 1.25)
- the 59 changed records first part at simulated second: min 100.05, p10 122.1, median 149.1, p90 175.05, max 263.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1317 | 1235 | -1.3667 | 55 | 26 | 29 | 0.7877 |
| `usKills` | 503 | 540 | 0.6167 | 51 | 28 | 23 | 0.5758 |
| `geKills` | 814 | 695 | -1.9833 | 53 | 19 | 34 | 0.0534 |
| `fire.total` | 8306 | 8069 | -3.95 | 57 | 29 | 28 | 1 |
| `fire.hits` | 3117 | 2984 | -2.2167 | 55 | 27 | 28 | 1 |
| `retreatSamples` | 5507 | 5817 | 5.1667 | 58 | 27 | 31 | 0.694 |
| `movementResolver.changes` | 130912 | 129182 | -28.8333 | 59 | 27 | 32 | 0.6029 |
| `movementStalls.length` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 5 | 5 | 0 | 7 | 4 | 3 | 1 |
| `loopAlerts.length` | 75 | 55 | -0.3333 | 45 | 19 | 26 | 0.3713 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 58 | 77 | 0.3167 | 30 | 21 | 9 | 0.0428 |
| `stallOutcomes.wakes` | 4 | 1 | -0.05 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 5 | 0 | -0.0833 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 5 | 0 | -0.0833 | 1 | 0 | 1 | 1 |
| `recon.orders` | 1367 | 1267 | -1.6667 | 50 | 9 | 41 | 0 |
| `recon.contacts` | 56 | 60 | 0.0667 | 31 | 16 | 15 | 1 |
| `recon.noContact` | 920 | 856 | -1.0667 | 42 | 6 | 36 | 0 |
| `recon.timeouts` | 25 | 29 | 0.0667 | 21 | 11 | 10 | 1 |
| `recon.cancelled` | 352 | 312 | -0.6667 | 40 | 14 | 26 | 0.0807 |
| `recon.reportsDelivered` | 310 | 278 | -0.5333 | 34 | 18 | 16 | 0.8642 |
| `recon.retriggerBlocked` | 1049 | 1030 | -0.3167 | 40 | 13 | 27 | 0.0385 |
| `squadPerformance.meanOverall` | 5186 | 5196.600000000004 | 0.1767 | 56 | 31 | 25 | 0.5044 |
| `squadPerformance.p10Overall` | 4706.9 | 4700.499999999999 | -0.1067 | 52 | 23 | 29 | 0.4885 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4480.299999999999 | 4496.899999999998 | 0.2767 | 57 | 28 | 29 | 1 |
| `squadPerformance.meanMovement` | 5931.399999999999 | 5935.9000000000015 | 0.075 | 53 | 24 | 29 | 0.5831 |
| `squadPerformance.meanControl` | 5874.700000000001 | 5888.7 | 0.2333 | 57 | 31 | 26 | 0.5966 |
| `squadPerformance.meanCohesion` | 5345.000000000001 | 5366.799999999999 | 0.3633 | 56 | 28 | 28 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

recon-ledger-0013 100.05 s (timeline) · recon-ledger-0010 116.1 s (stress) · recon-ledger-0038 118.05 s (stress) · recon-ledger-0040 121.05 s (timeline) · recon-ledger-0045 121.05 s (timeline) · recon-ledger-0004 122.1 s (timeline) · recon-ledger-0012 122.1 s (timeline) · recon-ledger-0008 123 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=459&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/recon-outcomes-393/ai_flow_live.html?bench=459&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=459`); it opens the seed that parts earliest, and the dropdowns choose another.

