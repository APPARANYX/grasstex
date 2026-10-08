# Benchmark run #460 · 60 seeds from `recon-ledger` (us-defend), windows `contact+120`

- **OFF** flags: `?reconLedger=0` · **ON** flags: `none`
- work/recon-outcomes-393 @ c90239c · [run](https://github.com/APPARANYX/grasstex/actions/runs/37845885290) · build v29-dev

## Verdict

**MOVED: 53 of 53 pairs changed (median first part 1.05 s); 9 of 34 counters under p 0.05 (about 1.7 by chance), 6 under 0.0015; casualties +16.2% (p 0.8877)**

- Clears the Bonferroni line (p < 0.0015): recon.orders 2041 to 1040 (-49.0%, p 0); recon.noContact 878 to 451 (-48.6%, p 0); recon.timeouts 682 to 295 (-56.7%, p 0); recon.cancelled 286 to 162 (-43.4%, p 0); recon.retriggerBlocked 826 to 466 (-43.6%, p 0); usKills 213 to 351 (+64.8%, p 0.0003).
- Under 0.05 only: regroups.entries 31 to 67 (+116.1%, p 0.0081); squadPerformance.meanCohesion 4457.400000000001 to 4648.099999999999 (+4.3%, p 0.0127); squadPerformance.meanMission 4518.199999999999 to 4399.900000000002 (-2.6%, p 0.0365).

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.027 (gate 1.25)
- the 53 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 3, max 21

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 628 | 730 | 1.9245 | 50 | 26 | 24 | 0.8877 |
| `usKills` | 213 | 351 | 2.6038 | 47 | 36 | 11 | 0.0003 |
| `geKills` | 415 | 379 | -0.6792 | 50 | 23 | 27 | 0.6718 |
| `fire.total` | 4406 | 5313 | 17.1132 | 53 | 34 | 19 | 0.0534 |
| `fire.hits` | 1511 | 1801 | 5.4717 | 52 | 29 | 23 | 0.4885 |
| `retreatSamples` | 2179 | 3354 | 22.1698 | 49 | 29 | 20 | 0.2529 |
| `movementResolver.changes` | 73043 | 72014 | -19.4151 | 53 | 24 | 29 | 0.5831 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 0 | -0.0189 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 40 | 22 | -0.3396 | 34 | 11 | 23 | 0.0576 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 31 | 67 | 0.6792 | 29 | 22 | 7 | 0.0081 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2041 | 1040 | -18.8868 | 53 | 1 | 52 | 0 |
| `recon.contacts` | 121 | 84 | -0.6981 | 42 | 17 | 25 | 0.28 |
| `recon.noContact` | 878 | 451 | -8.0566 | 51 | 4 | 47 | 0 |
| `recon.timeouts` | 682 | 295 | -7.3019 | 49 | 1 | 48 | 0 |
| `recon.cancelled` | 286 | 162 | -2.3396 | 47 | 9 | 38 | 0 |
| `recon.reportsDelivered` | 571 | 403 | -3.1698 | 46 | 17 | 29 | 0.1038 |
| `recon.retriggerBlocked` | 826 | 466 | -6.7925 | 53 | 0 | 53 | 0 |
| `squadPerformance.meanOverall` | 4777.200000000001 | 4758.5 | -0.3528 | 53 | 22 | 31 | 0.2717 |
| `squadPerformance.p10Overall` | 4384.8 | 4334.999999999999 | -0.9396 | 50 | 22 | 28 | 0.4799 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4518.199999999999 | 4399.900000000002 | -2.2321 | 52 | 18 | 34 | 0.0365 |
| `squadPerformance.meanMovement` | 5284.200000000001 | 5275.0999999999985 | -0.1717 | 49 | 19 | 30 | 0.1524 |
| `squadPerformance.meanControl` | 5245.399999999999 | 5258.4000000000015 | 0.2453 | 45 | 29 | 16 | 0.0725 |
| `squadPerformance.meanCohesion` | 4457.400000000001 | 4648.099999999999 | 3.5981 | 53 | 36 | 17 | 0.0127 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

recon-ledger-0005 1.05 s (timeline) · recon-ledger-0006 1.05 s (timeline) · recon-ledger-0007 1.05 s (timeline) · recon-ledger-0008 1.05 s (timeline) · recon-ledger-0011 1.05 s (timeline) · recon-ledger-0012 1.05 s (timeline) · recon-ledger-0016 1.05 s (timeline) · recon-ledger-0017 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=460&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/recon-outcomes-393/ai_flow_live.html?bench=460&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=460`); it opens the seed that parts earliest, and the dropdowns choose another.

