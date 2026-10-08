# Benchmark run #377 · 60 seeds from `fresh363` (meeting), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/project-thread-uuv1hd @ c6cef94 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37731715367) · build v29-dev

## Verdict

**MOVED: 244 of 269 pairs changed (median first part 220.05 s); 10 of 34 counters under p 0.05 (about 1.7 by chance), 4 under 0.0015; casualties +4.1% (p 0.0042)**

- Clears the Bonferroni line (p < 0.0015): movementResolver.changes 581615 to 609665 (+4.8%, p 0); regroups.entries 482 to 561 (+16.4%, p 0); stallOutcomes.wakes 54 to 26 (-51.9%, p 0.0005); stallOutcomes.repeats 24 to 7 (-70.8%, p 0.0013).
- Under 0.05 only: casualties 7431 to 7735 (+4.1%, p 0.0042); recon.orders 5880 to 6052 (+2.9%, p 0.0076); timeline.stalledOnsetsRepeated 199 to 162 (-18.6%, p 0.0081); recon.retriggerBlocked 4553 to 4657 (+2.3%, p 0.0093); timeline.stalledSamplesRepeated 5504 to 4565 (-17.1%, p 0.0201); retreatSamples 85752 to 87354 (+1.9%, p 0.0392).
- Unpaired records: off 17, on 4 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **269** pairs (unpaired: off 17, on 4) · identical in every field: **25** · runtime errors off 0 / on 0 · wall time on/off x0.998 (gate 1.25)
- the 190 changed records first part at simulated second: min 160.05, p10 181.05, median 220.05, p90 284.1, max 378

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7431 | 7735 | 1.1301 | 177 | 108 | 69 | 0.0042 |
| `usKills` | 3288 | 3475 | 0.6952 | 164 | 91 | 73 | 0.1842 |
| `geKills` | 4143 | 4260 | 0.4349 | 170 | 93 | 77 | 0.2499 |
| `fire.total` | 19296 | 19154 | -0.5279 | 179 | 90 | 89 | 1 |
| `fire.hits` | 6542 | 6543 | 0.0037 | 174 | 90 | 84 | 0.7048 |
| `retreatSamples` | 85752 | 87354 | 5.9554 | 172 | 100 | 72 | 0.0392 |
| `movementResolver.changes` | 581615 | 609665 | 104.2751 | 189 | 146 | 43 | 0 |
| `movementStalls.length` | 64 | 47 | -0.0632 | 19 | 6 | 13 | 0.1671 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 268 | 291 | 0.0855 | 105 | 60 | 45 | 0.1716 |
| `loopAlerts.length` | 206 | 237 | 0.1152 | 107 | 58 | 49 | 0.4394 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 482 | 561 | 0.2937 | 97 | 70 | 27 | 0 |
| `stallOutcomes.wakes` | 54 | 26 | -0.1041 | 38 | 8 | 30 | 0.0005 |
| `stallOutcomes.repeats` | 24 | 7 | -0.0632 | 18 | 2 | 16 | 0.0013 |
| `timeline.stalledOnsets` | 71 | 51 | -0.0743 | 19 | 6 | 13 | 0.1671 |
| `timeline.stalledSamples` | 1941 | 1656 | -1.0595 | 29 | 10 | 19 | 0.136 |
| `timeline.stalledOnsetsRepeated` | 199 | 162 | -0.1375 | 29 | 7 | 22 | 0.0081 |
| `timeline.stalledSamplesRepeated` | 5504 | 4565 | -3.4907 | 37 | 11 | 26 | 0.0201 |
| `recon.orders` | 5880 | 6052 | 0.6394 | 136 | 84 | 52 | 0.0076 |
| `recon.contacts` | 259 | 268 | 0.0335 | 85 | 39 | 46 | 0.5154 |
| `recon.noContact` | 4024 | 4076 | 0.1933 | 104 | 61 | 43 | 0.095 |
| `recon.timeouts` | 167 | 194 | 0.1004 | 66 | 38 | 28 | 0.2678 |
| `recon.cancelled` | 1277 | 1332 | 0.2045 | 126 | 69 | 57 | 0.3271 |
| `recon.reportsDelivered` | 1307 | 1401 | 0.3494 | 98 | 53 | 45 | 0.4797 |
| `recon.retriggerBlocked` | 4553 | 4657 | 0.3866 | 117 | 73 | 44 | 0.0093 |
| `squadPerformance.meanOverall` | 23282.199999999993 | 23353.400000000012 | 0.2647 | 177 | 81 | 96 | 0.2926 |
| `squadPerformance.p10Overall` | 21878.8 | 21949.999999999996 | 0.2647 | 159 | 85 | 74 | 0.4278 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 19524.500000000004 | 19520.399999999994 | -0.0152 | 172 | 83 | 89 | 0.7031 |
| `squadPerformance.meanMovement` | 26421.999999999993 | 26579.400000000005 | 0.5851 | 165 | 90 | 75 | 0.2757 |
| `squadPerformance.meanControl` | 26522.7 | 26612.899999999998 | 0.3353 | 160 | 79 | 81 | 0.937 |
| `squadPerformance.meanCohesion` | 23529.700000000008 | 23604.200000000008 | 0.277 | 180 | 88 | 92 | 0.8231 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

fresh363-0056 160.05 s (timeline) · fresh363-0032 168 s (timeline) · fresh363-0046 169.05 s (timeline) · fresh363-0007 178.05 s (timeline) · fresh363-0043 178.05 s (timeline) · fresh363-0016 181.05 s (timeline) · fresh363-0014 185.1 s (timeline) · fresh363-0002 187.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=377&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=377`); it opens the seed that parts earliest, and the dropdowns choose another.

