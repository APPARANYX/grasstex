# Benchmark run #390 · 60 seeds from `hill` (us-defend), windows `every120`

- **OFF** flags: `fireLineContact=0&unreachableAnchor=0` · **ON** flags: `none`
- claude/bench-363-368 @ c8ab9c6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37739008369) · build v29-dev

## Verdict

**MOVED: 255 of 275 pairs changed (median first part 173.1 s); 12 of 34 counters under p 0.05 (about 1.7 by chance), 8 under 0.0015; casualties +11.3% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 5987 to 6662 (+11.3%, p 0); movementResolver.changes 437851 to 487709 (+11.4%, p 0); stallOutcomes.wakes 82 to 24 (-70.7%, p 0); recon.contacts 742 to 995 (+34.1%, p 0); recon.cancelled 2116 to 2329 (+10.1%, p 0.0001); recon.orders 11909 to 12344 (+3.7%, p 0.0004); usKills 2392 to 2894 (+21.0%, p 0.0009); fire.hits 4865 to 5513 (+13.3%, p 0.001).
- Under 0.05 only: recon.reportsDelivered 3206 to 3802 (+18.6%, p 0.0028); stallOutcomes.repeats 16 to 1 (-93.8%, p 0.0034); retreatSamples 81983 to 91950 (+12.2%, p 0.0142); fire.total 13766 to 15812 (+14.9%, p 0.0289).
- Unpaired records: off 0, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 1) · identical in every field: **20** · runtime errors off 0 / on 0 · wall time on/off x0.99 (gate 1.25)
- the 214 changed records first part at simulated second: min 19.05, p10 119.1, median 173.1, p90 234, max 330

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5987 | 6662 | 2.4545 | 194 | 126 | 68 | 0 |
| `usKills` | 2392 | 2894 | 1.8255 | 177 | 111 | 66 | 0.0009 |
| `geKills` | 3595 | 3768 | 0.6291 | 182 | 102 | 80 | 0.1193 |
| `fire.total` | 13766 | 15812 | 7.44 | 202 | 117 | 85 | 0.0289 |
| `fire.hits` | 4865 | 5513 | 2.3564 | 197 | 122 | 75 | 0.001 |
| `retreatSamples` | 81983 | 91950 | 36.2436 | 193 | 114 | 79 | 0.0142 |
| `movementResolver.changes` | 437851 | 487709 | 181.3018 | 213 | 176 | 37 | 0 |
| `movementStalls.length` | 2 | 1 | -0.0036 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 31 | 43 | 0.0436 | 43 | 25 | 18 | 0.3604 |
| `loopAlerts.length` | 185 | 186 | 0.0036 | 115 | 68 | 47 | 0.0617 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 353 | 384 | 0.1127 | 122 | 68 | 54 | 0.2391 |
| `stallOutcomes.wakes` | 82 | 24 | -0.2109 | 60 | 12 | 48 | 0 |
| `stallOutcomes.repeats` | 16 | 1 | -0.0545 | 13 | 1 | 12 | 0.0034 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 116 | 116 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11909 | 12344 | 1.5818 | 183 | 116 | 67 | 0.0004 |
| `recon.contacts` | 742 | 995 | 0.92 | 161 | 107 | 54 | 0 |
| `recon.noContact` | 4102 | 3966 | -0.4945 | 128 | 60 | 68 | 0.5363 |
| `recon.timeouts` | 4497 | 4567 | 0.2545 | 165 | 89 | 76 | 0.3502 |
| `recon.cancelled` | 2116 | 2329 | 0.7745 | 177 | 115 | 62 | 0.0001 |
| `recon.reportsDelivered` | 3206 | 3802 | 2.1673 | 172 | 106 | 66 | 0.0028 |
| `recon.retriggerBlocked` | 4758 | 4750 | -0.0291 | 161 | 84 | 77 | 0.6364 |
| `squadPerformance.meanOverall` | 24316.4 | 24259.8 | -0.2058 | 205 | 92 | 113 | 0.1623 |
| `squadPerformance.p10Overall` | 22679.99999999999 | 22623.39999999999 | -0.2058 | 150 | 72 | 78 | 0.6832 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21729.799999999996 | 21542.699999999975 | -0.6804 | 194 | 85 | 109 | 0.0984 |
| `squadPerformance.meanMovement` | 27329.20000000002 | 27353.40000000002 | 0.088 | 172 | 88 | 84 | 0.8191 |
| `squadPerformance.meanControl` | 27340.699999999997 | 27346.10000000001 | 0.0196 | 163 | 83 | 80 | 0.8756 |
| `squadPerformance.meanCohesion` | 23033.90000000002 | 23074.09999999999 | 0.1462 | 202 | 106 | 96 | 0.5267 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0001 19.05 s (timeline) · hill-0007 108 s (timeline) · hill-0034 114 s (timeline) · hill-0020 118.05 s (timeline) · hill-0022 119.1 s (timeline) · hill-0025 121.05 s (stress) · hill-0044 126 s (timeline) · hill-0030 128.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=390&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=390`); it opens the seed that parts earliest, and the dropdowns choose another.

