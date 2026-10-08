# Benchmark run #378 · 60 seeds from `fresh363` (ge-defend), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/project-thread-uuv1hd @ c6cef94 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37731718197) · build v29-dev

## Verdict

**MOVED: 249 of 272 pairs changed (median first part 165 s); 19 of 34 counters under p 0.05 (about 1.7 by chance), 11 under 0.0015; casualties +28.0% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 5548 to 7100 (+28.0%, p 0); usKills 2664 to 3351 (+25.8%, p 0); geKills 2884 to 3749 (+30.0%, p 0); fire.hits 4822 to 6129 (+27.1%, p 0); retreatSamples 80353 to 97825 (+21.7%, p 0); movementResolver.changes 405014 to 463886 (+14.5%, p 0); stallOutcomes.wakes 101 to 26 (-74.3%, p 0); recon.contacts 784 to 978 (+24.7%, p 0); stallOutcomes.repeats 19 to 1 (-94.7%, p 0.0005); fire.total 15290 to 17682 (+15.6%, p 0.0006); recon.orders 11325 to 11858 (+4.7%, p 0.0006).
- Under 0.05 only: squadPerformance.meanMission 21233.599999999973 to 21053.799999999977 (-0.8%, p 0.0018); recon.cancelled 1712 to 2012 (+17.5%, p 0.003); recon.noContact 4150 to 4199 (+1.2%, p 0.0039); vacantObjectiveStalls.length 21 to 45 (+114.3%, p 0.0167); squadPerformance.p10Overall 22350.600000000002 to 22278.599999999977 (-0.3%, p 0.0178); squadPerformance.meanMovement 27027.000000000004 to 27017.200000000004 (-0.0%, p 0.0207); squadPerformance.meanOverall 23963.400000000012 to 23912.400000000023 (-0.2%, p 0.0273); recon.reportsDelivered 3625 to 4169 (+15.0%, p 0.034).

## Paired comparison (off against on)

- **272** pairs (unpaired: off 0, on 0) · identical in every field: **23** · runtime errors off 0 / on 0 · wall time on/off x0.987 (gate 1.25)
- the 211 changed records first part at simulated second: min 116.1, p10 131.1, median 165, p90 213, max 262.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5548 | 7100 | 5.7059 | 196 | 143 | 53 | 0 |
| `usKills` | 2664 | 3351 | 2.5257 | 195 | 135 | 60 | 0 |
| `geKills` | 2884 | 3749 | 3.1801 | 185 | 127 | 58 | 0 |
| `fire.total` | 15290 | 17682 | 8.7941 | 197 | 123 | 74 | 0.0006 |
| `fire.hits` | 4822 | 6129 | 4.8051 | 196 | 128 | 68 | 0 |
| `retreatSamples` | 80353 | 97825 | 64.2353 | 195 | 139 | 56 | 0 |
| `movementResolver.changes` | 405014 | 463886 | 216.4412 | 209 | 183 | 26 | 0 |
| `movementStalls.length` | 9 | 2 | -0.0257 | 2 | 0 | 2 | 0.5 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 21 | 45 | 0.0882 | 35 | 25 | 10 | 0.0167 |
| `loopAlerts.length` | 132 | 182 | 0.1838 | 104 | 62 | 42 | 0.0619 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 461 | 521 | 0.2206 | 119 | 65 | 54 | 0.3594 |
| `stallOutcomes.wakes` | 101 | 26 | -0.2757 | 68 | 13 | 55 | 0 |
| `stallOutcomes.repeats` | 19 | 1 | -0.0662 | 16 | 1 | 15 | 0.0005 |
| `timeline.stalledOnsets` | 9 | 2 | -0.0257 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledSamples` | 174 | 98 | -0.2794 | 3 | 1 | 2 | 1 |
| `timeline.stalledOnsetsRepeated` | 16 | 8 | -0.0294 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledSamplesRepeated` | 492 | 392 | -0.3676 | 7 | 4 | 3 | 1 |
| `recon.orders` | 11325 | 11858 | 1.9596 | 183 | 115 | 68 | 0.0006 |
| `recon.contacts` | 784 | 978 | 0.7132 | 160 | 110 | 50 | 0 |
| `recon.noContact` | 4150 | 4199 | 0.1801 | 132 | 49 | 83 | 0.0039 |
| `recon.timeouts` | 4294 | 4263 | -0.114 | 164 | 75 | 89 | 0.31 |
| `recon.cancelled` | 1712 | 2012 | 1.1029 | 174 | 107 | 67 | 0.003 |
| `recon.reportsDelivered` | 3625 | 4169 | 2 | 175 | 102 | 73 | 0.034 |
| `recon.retriggerBlocked` | 4757 | 4848 | 0.3346 | 151 | 86 | 65 | 0.1033 |
| `squadPerformance.meanOverall` | 23963.400000000012 | 23912.400000000023 | -0.1875 | 198 | 83 | 115 | 0.0273 |
| `squadPerformance.p10Overall` | 22350.600000000002 | 22278.599999999977 | -0.2647 | 161 | 65 | 96 | 0.0178 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21233.599999999973 | 21053.799999999977 | -0.661 | 192 | 74 | 118 | 0.0018 |
| `squadPerformance.meanMovement` | 27027.000000000004 | 27017.200000000004 | -0.036 | 169 | 69 | 100 | 0.0207 |
| `squadPerformance.meanControl` | 27066.29999999998 | 27057 | -0.0342 | 175 | 89 | 86 | 0.8799 |
| `squadPerformance.meanCohesion` | 22710.7 | 22791.29999999999 | 0.2963 | 200 | 107 | 93 | 0.358 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

fresh363-0022 116.1 s (timeline) · fresh363-0043 127.05 s (timeline) · fresh363-0053 127.05 s (timeline) · fresh363-0016 128.1 s (timeline) · fresh363-0057 130.05 s (timeline) · fresh363-0008 131.1 s (timeline) · fresh363-0033 131.1 s (timeline) · fresh363-0045 131.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=378&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=378`); it opens the seed that parts earliest, and the dropdowns choose another.

