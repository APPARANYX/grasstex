# Benchmark run #399 · 60 seeds from `relayfresh` (us-defend), windows `every120`

- **OFF** flags: `squadRelay=0` · **ON** flags: `none`
- claude/squad-relay @ 768c593 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37766526559) · build v29-dev

## Verdict

**MOVED: 268 of 279 pairs changed (median first part 74.1 s); 9 of 34 counters under p 0.05 (about 1.7 by chance), 5 under 0.0015; casualties -7.1% (p 0.0048)**

- Clears the Bonferroni line (p < 0.0015): recon.orders 11916 to 12563 (+5.4%, p 0); usKills 2688 to 2402 (-10.6%, p 0.0001); recon.noContact 4424 to 4699 (+6.2%, p 0.0002); squadPerformance.meanOverall 24711.400000000005 to 24821.50000000001 (+0.4%, p 0.0007); recon.cancelled 1944 to 2171 (+11.7%, p 0.0009).
- Under 0.05 only: casualties 6303 to 5858 (-7.1%, p 0.0048); fire.total 15636 to 13469 (-13.9%, p 0.0052); recon.reportsDelivered 3512 to 4047 (+15.2%, p 0.0082); squadPerformance.meanCohesion 23473.39999999999 to 23629.399999999987 (+0.7%, p 0.0182).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **279** pairs (unpaired: off 1, on 0) · identical in every field: **11** · runtime errors off 0 / on 0 · wall time on/off x1.019 (gate 1.25)
- the 241 changed records first part at simulated second: min 22.05, p10 24, median 74.1, p90 224.1, max 475.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 6303 | 5858 | -1.595 | 183 | 72 | 111 | 0.0048 |
| `usKills` | 2688 | 2402 | -1.0251 | 180 | 63 | 117 | 0.0001 |
| `geKills` | 3615 | 3456 | -0.5699 | 183 | 91 | 92 | 1 |
| `fire.total` | 15636 | 13469 | -7.767 | 196 | 78 | 118 | 0.0052 |
| `fire.hits` | 5173 | 4673 | -1.7921 | 191 | 87 | 104 | 0.2469 |
| `retreatSamples` | 82778 | 71155 | -41.6595 | 186 | 83 | 103 | 0.1634 |
| `movementResolver.changes` | 461524 | 456195 | -19.1004 | 239 | 119 | 120 | 1 |
| `movementStalls.length` | 7 | 3 | -0.0143 | 2 | 0 | 2 | 0.5 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 26 | 30 | 0.0143 | 34 | 20 | 14 | 0.3915 |
| `loopAlerts.length` | 161 | 215 | 0.1935 | 101 | 56 | 45 | 0.3197 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 762 | 358 | -1.448 | 126 | 52 | 74 | 0.0609 |
| `stallOutcomes.wakes` | 84 | 87 | 0.0108 | 58 | 30 | 28 | 0.8957 |
| `stallOutcomes.repeats` | 14 | 19 | 0.0179 | 20 | 13 | 7 | 0.2632 |
| `timeline.stalledOnsets` | 7 | 3 | -0.0143 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledSamples` | 208 | 115 | -0.3333 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 30 | 15 | -0.0538 | 4 | 0 | 4 | 0.125 |
| `timeline.stalledSamplesRepeated` | 900 | 575 | -1.1649 | 4 | 0 | 4 | 0.125 |
| `recon.orders` | 11916 | 12563 | 2.319 | 186 | 122 | 64 | 0 |
| `recon.contacts` | 796 | 850 | 0.1935 | 160 | 89 | 71 | 0.1788 |
| `recon.noContact` | 4424 | 4699 | 0.9857 | 163 | 106 | 57 | 0.0002 |
| `recon.timeouts` | 4349 | 4385 | 0.129 | 181 | 78 | 103 | 0.0741 |
| `recon.cancelled` | 1944 | 2171 | 0.8136 | 177 | 111 | 66 | 0.0009 |
| `recon.reportsDelivered` | 3512 | 4047 | 1.9176 | 176 | 106 | 70 | 0.0082 |
| `recon.retriggerBlocked` | 4747 | 4848 | 0.362 | 177 | 90 | 87 | 0.8806 |
| `squadPerformance.meanOverall` | 24711.400000000005 | 24821.50000000001 | 0.3946 | 217 | 134 | 83 | 0.0007 |
| `squadPerformance.p10Overall` | 23007.099999999995 | 23047.399999999965 | 0.1444 | 176 | 93 | 83 | 0.4976 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.0036 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 22045.899999999983 | 22336.49999999997 | 1.0416 | 192 | 104 | 88 | 0.279 |
| `squadPerformance.meanMovement` | 27738.800000000017 | 27744.4 | 0.0201 | 156 | 82 | 74 | 0.5753 |
| `squadPerformance.meanControl` | 27757.099999999988 | 27726.59999999998 | -0.1093 | 171 | 74 | 97 | 0.0922 |
| `squadPerformance.meanCohesion` | 23473.39999999999 | 23629.399999999987 | 0.5591 | 233 | 135 | 98 | 0.0182 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

relayfresh-0060 22.05 s (timeline) · relayfresh-0008 23.1 s (timeline) · relayfresh-0024 23.1 s (timeline) · relayfresh-0048 23.1 s (timeline) · relayfresh-0052 23.1 s (timeline) · relayfresh-0032 24 s (timeline) · relayfresh-0026 24.15 s (timeline) · relayfresh-0006 33 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=399&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=399`); it opens the seed that parts earliest, and the dropdowns choose another.

