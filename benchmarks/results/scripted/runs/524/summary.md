# Benchmark run #524 · 20 seeds from `issue361-nav-ge-defend` (ge-defend), windows `every60`

- **OFF** flags: `steerNavForward=0` · **ON** flags: `none`
- work/issue361-ge4-rootcause @ 31c727b · [run](https://github.com/APPARANYX/grasstex/actions/runs/38022646931) · build v29-dev

## Verdict

**MOVED: 160 of 161 pairs changed (median first part 74.1 s); 7 of 42 counters under p 0.05 (about 2.1 by chance), 3 under 0.0012; casualties +5.2% (p 0.0062)**

- Clears the Bonferroni line (p < 0.0012): recon.timeouts 216 to 55 (-74.5%, p 0); recon.reportsDelivered 1607 to 1086 (-32.4%, p 0.0001); recon.contacts 320 to 255 (-20.3%, p 0.0008).
- Under 0.05 only: recon.noContact 1514 to 1565 (+3.4%, p 0.0012); casualties 4232 to 4451 (+5.2%, p 0.0062); recon.cancelled 831 to 939 (+13.0%, p 0.0199); squadPerformance.meanCohesion 14086.3 to 13939.099999999999 (-1.0%, p 0.0212).
- Unpaired records: off 2, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **161** pairs (unpaired: off 2, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.955 (gate 1.25)
- the 146 changed records first part at simulated second: min 7.05, p10 41.1, median 74.1, p90 137.1, max 178.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4232 | 4451 | 1.3602 | 121 | 76 | 45 | 0.0062 |
| `usKills` | 2307 | 2302 | -0.0311 | 119 | 61 | 58 | 0.8546 |
| `geKills` | 1925 | 2149 | 1.3913 | 113 | 65 | 48 | 0.1319 |
| `fire.total` | 4087 | 3835 | -1.5652 | 123 | 62 | 61 | 1 |
| `fire.hits` | 1465 | 1479 | 0.087 | 117 | 60 | 57 | 0.8534 |
| `retreatSamples` | 29594 | 29439 | -0.9627 | 117 | 58 | 59 | 1 |
| `movementResolver.changes` | 241414 | 242673 | 7.8199 | 144 | 80 | 64 | 0.2112 |
| `grenades.throws` | 0 | 8 | 0.0497 | 4 | 4 | 0 | 0.125 |
| `grenades.bursts` | 0 | 8 | 0.0497 | 4 | 4 | 0 | 0.125 |
| `grenades.wounded` | 0 | 6 | 0.0373 | 2 | 2 | 0 | 0.5 |
| `grenades.casualties` | 0 | 2 | 0.0124 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 0 | 11 | 0.0683 | 2 | 2 | 0 | 0.5 |
| `grenades.friendlyWounded` | 0 | 1 | 0.0062 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 42 | 48 | 0.0373 | 46 | 23 | 23 | 1 |
| `loopAlerts.length` | 72 | 45 | -0.1677 | 59 | 22 | 37 | 0.0674 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 332 | 263 | -0.4286 | 86 | 36 | 50 | 0.1606 |
| `stallOutcomes.wakes` | 13 | 16 | 0.0186 | 21 | 8 | 13 | 0.3833 |
| `stallOutcomes.repeats` | 3 | 0 | -0.0186 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3027 | 2951 | -0.472 | 123 | 51 | 72 | 0.0709 |
| `recon.contacts` | 320 | 255 | -0.4037 | 93 | 30 | 63 | 0.0008 |
| `recon.noContact` | 1514 | 1565 | 0.3168 | 99 | 66 | 33 | 0.0012 |
| `recon.timeouts` | 216 | 55 | -1 | 76 | 7 | 69 | 0 |
| `recon.cancelled` | 831 | 939 | 0.6708 | 107 | 66 | 41 | 0.0199 |
| `recon.reportsDelivered` | 1607 | 1086 | -3.236 | 110 | 34 | 76 | 0.0001 |
| `recon.retriggerBlocked` | 1546 | 1509 | -0.2298 | 88 | 50 | 38 | 0.2408 |
| `squadPerformance.meanOverall` | 14384.999999999996 | 14425.600000000006 | 0.2522 | 136 | 75 | 61 | 0.2649 |
| `squadPerformance.p10Overall` | 13407.900000000016 | 13424.00000000002 | 0.1 | 83 | 46 | 37 | 0.38 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 12655.599999999997 | 12796.399999999994 | 0.8745 | 120 | 67 | 53 | 0.2352 |
| `squadPerformance.meanMovement` | 16013.700000000003 | 16025.699999999997 | 0.0745 | 88 | 48 | 40 | 0.4557 |
| `squadPerformance.meanControl` | 16044.899999999994 | 16056.799999999994 | 0.0739 | 89 | 51 | 38 | 0.2031 |
| `squadPerformance.meanCohesion` | 14086.3 | 13939.099999999999 | -0.9143 | 138 | 55 | 83 | 0.0212 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

issue361-nav-ge-defend-0015 7.05 s (timeline) · issue361-nav-ge-defend-0017 21 s (timeline) · issue361-nav-ge-defend-0016 41.1 s (stress) · issue361-nav-ge-defend-0002 47.1 s (stress) · issue361-nav-ge-defend-0009 53.1 s (stress) · issue361-nav-ge-defend-0014 53.1 s (timeline) · issue361-nav-ge-defend-0012 54.15 s (timeline) · issue361-nav-ge-defend-0004 71.1 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=524&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue361-ge4-rootcause/ai_flow_live.html?bench=524&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=524`); it opens the seed that parts earliest, and the dropdowns choose another.

