# Benchmark run #423 · 60 seeds from `control` (meeting), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/bench-stack-371-363 @ 4c8a599 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37778728125) · build v29-dev

## Verdict

**MOVED: 262 of 288 pairs changed (median first part 234 s); 10 of 34 counters under p 0.05 (about 1.7 by chance), 5 under 0.0015; casualties +6.0% (p 0.0001)**

- Clears the Bonferroni line (p < 0.0015): movementResolver.changes 621639 to 651027 (+4.7%, p 0); stallOutcomes.wakes 82 to 13 (-84.1%, p 0); casualties 7828 to 8298 (+6.0%, p 0.0001); stallOutcomes.repeats 39 to 7 (-82.1%, p 0.0005); recon.retriggerBlocked 5006 to 5124 (+2.4%, p 0.0014).
- Under 0.05 only: retreatSamples 91123 to 95871 (+5.2%, p 0.0037); regroups.entries 455 to 533 (+17.1%, p 0.0091); recon.orders 6542 to 6745 (+3.1%, p 0.0096); geKills 4375 to 4672 (+6.8%, p 0.0125); recon.cancelled 1508 to 1600 (+6.1%, p 0.0487).
- Unpaired records: off 5, on 2 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **288** pairs (unpaired: off 5, on 2) · identical in every field: **26** · runtime errors off 0 / on 0 · wall time on/off x1.009 (gate 1.25)
- the 194 changed records first part at simulated second: min 173.1, p10 186, median 234, p90 304.05, max 351

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7828 | 8298 | 1.6319 | 183 | 119 | 64 | 0.0001 |
| `usKills` | 3453 | 3626 | 0.6007 | 164 | 85 | 79 | 0.6963 |
| `geKills` | 4375 | 4672 | 1.0313 | 165 | 99 | 66 | 0.0125 |
| `fire.total` | 21117 | 21515 | 1.3819 | 180 | 88 | 92 | 0.8231 |
| `fire.hits` | 7092 | 7293 | 0.6979 | 175 | 95 | 80 | 0.2899 |
| `retreatSamples` | 91123 | 95871 | 16.4861 | 173 | 106 | 67 | 0.0037 |
| `movementResolver.changes` | 621639 | 651027 | 102.0417 | 194 | 150 | 44 | 0 |
| `movementStalls.length` | 9 | 5 | -0.0139 | 2 | 0 | 2 | 0.5 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 281 | 312 | 0.1076 | 104 | 57 | 47 | 0.3776 |
| `loopAlerts.length` | 231 | 259 | 0.0972 | 117 | 65 | 52 | 0.2672 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 455 | 533 | 0.2708 | 108 | 68 | 40 | 0.0091 |
| `stallOutcomes.wakes` | 82 | 13 | -0.2396 | 58 | 6 | 52 | 0 |
| `stallOutcomes.repeats` | 39 | 7 | -0.1111 | 29 | 5 | 24 | 0.0005 |
| `timeline.stalledOnsets` | 9 | 5 | -0.0139 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledSamples` | 562 | 245 | -1.1007 | 4 | 0 | 4 | 0.125 |
| `timeline.stalledOnsetsRepeated` | 22 | 18 | -0.0139 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledSamplesRepeated` | 1567 | 856 | -2.4688 | 4 | 0 | 4 | 0.125 |
| `recon.orders` | 6542 | 6745 | 0.7049 | 135 | 83 | 52 | 0.0096 |
| `recon.contacts` | 310 | 293 | -0.059 | 85 | 37 | 48 | 0.278 |
| `recon.noContact` | 4355 | 4422 | 0.2326 | 107 | 63 | 44 | 0.0814 |
| `recon.timeouts` | 173 | 191 | 0.0625 | 63 | 35 | 28 | 0.45 |
| `recon.cancelled` | 1508 | 1600 | 0.3194 | 125 | 74 | 51 | 0.0487 |
| `recon.reportsDelivered` | 1658 | 1627 | -0.1076 | 95 | 46 | 49 | 0.8376 |
| `recon.retriggerBlocked` | 5006 | 5124 | 0.4097 | 136 | 87 | 49 | 0.0014 |
| `squadPerformance.meanOverall` | 25014.499999999993 | 24904.299999999996 | -0.3826 | 179 | 85 | 94 | 0.55 |
| `squadPerformance.p10Overall` | 23558.299999999977 | 23425.99999999997 | -0.4594 | 140 | 68 | 72 | 0.8 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20828.699999999983 | 20682.299999999985 | -0.5083 | 174 | 81 | 93 | 0.4044 |
| `squadPerformance.meanMovement` | 28482.400000000005 | 28389.30000000002 | -0.3233 | 169 | 79 | 90 | 0.4419 |
| `squadPerformance.meanControl` | 28490.89999999999 | 28386.30000000002 | -0.3632 | 157 | 79 | 78 | 1 |
| `squadPerformance.meanCohesion` | 25415.899999999994 | 25386.899999999987 | -0.1007 | 180 | 90 | 90 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0040 173.1 s (timeline) · control-0029 176.1 s (timeline) · control-0057 176.1 s (timeline) · control-0022 178.05 s (timeline) · control-0019 182.1 s (timeline) · control-0008 186 s (timeline) · control-0059 187.05 s (timeline) · control-0053 188.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=423&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=423`); it opens the seed that parts earliest, and the dropdowns choose another.

