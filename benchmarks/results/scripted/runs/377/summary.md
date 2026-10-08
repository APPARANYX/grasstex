# Benchmark run #377 · 60 seeds from `fresh363` (meeting), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/project-thread-uuv1hd @ c6cef94 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37731715367) · build v29-dev

## Verdict

**MOVED: 257 of 283 pairs changed (median first part 220.05 s); 10 of 34 counters under p 0.05 (about 1.7 by chance), 3 under 0.0015; casualties +3.5% (p 0.019)**

- Clears the Bonferroni line (p < 0.0015): movementResolver.changes 609951 to 640825 (+5.1%, p 0); regroups.entries 504 to 587 (+16.5%, p 0); stallOutcomes.repeats 24 to 7 (-70.8%, p 0.0013).
- Under 0.05 only: stallOutcomes.wakes 54 to 28 (-48.1%, p 0.0022); recon.orders 6159 to 6342 (+3.0%, p 0.0043); timeline.stalledOnsetsRepeated 199 to 162 (-18.6%, p 0.0081); recon.retriggerBlocked 4765 to 4877 (+2.4%, p 0.0113); casualties 7842 to 8115 (+3.5%, p 0.019); timeline.stalledSamplesRepeated 5504 to 4565 (-17.1%, p 0.0201); retreatSamples 90996 to 93709 (+3.0%, p 0.0213).
- Unpaired records: off 3, on 5 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **283** pairs (unpaired: off 3, on 5) · identical in every field: **26** · runtime errors off 0 / on 0 · wall time on/off x0.998 (gate 1.25)
- the 200 changed records first part at simulated second: min 160.05, p10 181.05, median 220.05, p90 284.1, max 378

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7842 | 8115 | 0.9647 | 187 | 110 | 77 | 0.019 |
| `usKills` | 3449 | 3701 | 0.8905 | 173 | 98 | 75 | 0.0941 |
| `geKills` | 4393 | 4414 | 0.0742 | 180 | 93 | 87 | 0.7095 |
| `fire.total` | 20411 | 20123 | -1.0177 | 189 | 92 | 97 | 0.7712 |
| `fire.hits` | 6974 | 6851 | -0.4346 | 184 | 92 | 92 | 1 |
| `retreatSamples` | 90996 | 93709 | 9.5866 | 182 | 107 | 75 | 0.0213 |
| `movementResolver.changes` | 609951 | 640825 | 109.0954 | 199 | 156 | 43 | 0 |
| `movementStalls.length` | 64 | 47 | -0.0601 | 19 | 6 | 13 | 0.1671 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 279 | 311 | 0.1131 | 111 | 63 | 48 | 0.1837 |
| `loopAlerts.length` | 212 | 250 | 0.1343 | 113 | 63 | 50 | 0.2589 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 504 | 587 | 0.2933 | 103 | 75 | 28 | 0 |
| `stallOutcomes.wakes` | 54 | 28 | -0.0919 | 40 | 10 | 30 | 0.0022 |
| `stallOutcomes.repeats` | 24 | 7 | -0.0601 | 18 | 2 | 16 | 0.0013 |
| `timeline.stalledOnsets` | 71 | 51 | -0.0707 | 19 | 6 | 13 | 0.1671 |
| `timeline.stalledSamples` | 1941 | 1656 | -1.0071 | 29 | 10 | 19 | 0.136 |
| `timeline.stalledOnsetsRepeated` | 199 | 162 | -0.1307 | 29 | 7 | 22 | 0.0081 |
| `timeline.stalledSamplesRepeated` | 5504 | 4565 | -3.318 | 37 | 11 | 26 | 0.0201 |
| `recon.orders` | 6159 | 6342 | 0.6466 | 143 | 89 | 54 | 0.0043 |
| `recon.contacts` | 275 | 282 | 0.0247 | 88 | 40 | 48 | 0.4557 |
| `recon.noContact` | 4207 | 4255 | 0.1696 | 108 | 61 | 47 | 0.2108 |
| `recon.timeouts` | 182 | 210 | 0.0989 | 69 | 40 | 29 | 0.2284 |
| `recon.cancelled` | 1335 | 1409 | 0.2615 | 133 | 75 | 58 | 0.1651 |
| `recon.reportsDelivered` | 1386 | 1492 | 0.3746 | 101 | 56 | 45 | 0.3197 |
| `recon.retriggerBlocked` | 4765 | 4877 | 0.3958 | 123 | 76 | 47 | 0.0113 |
| `squadPerformance.meanOverall` | 24498.899999999994 | 24559.800000000014 | 0.2152 | 187 | 85 | 102 | 0.2419 |
| `squadPerformance.p10Overall` | 23013.19999999999 | 23076.59999999999 | 0.224 | 168 | 90 | 78 | 0.3961 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20533.2 | 20490.79999999999 | -0.1498 | 181 | 85 | 96 | 0.4574 |
| `squadPerformance.meanMovement` | 27806.19999999999 | 27967.200000000004 | 0.5689 | 173 | 94 | 79 | 0.2871 |
| `squadPerformance.meanControl` | 27911.8 | 28001.6 | 0.3173 | 169 | 82 | 87 | 0.7584 |
| `squadPerformance.meanCohesion` | 24784.700000000008 | 24865.200000000008 | 0.2845 | 190 | 95 | 95 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

fresh363-0056 160.05 s (timeline) · fresh363-0032 168 s (timeline) · fresh363-0046 169.05 s (timeline) · fresh363-0007 178.05 s (timeline) · fresh363-0043 178.05 s (timeline) · fresh363-0016 181.05 s (timeline) · fresh363-0014 185.1 s (timeline) · fresh363-0028 186 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=377&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=377`); it opens the seed that parts earliest, and the dropdowns choose another.

