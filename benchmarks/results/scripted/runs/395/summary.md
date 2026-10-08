# Benchmark run #395 · 60 seeds from `sqrelay` (meeting), windows `every120`

- **OFF** flags: `squadRelay=0` · **ON** flags: `none`
- claude/bench-relay-stack @ 73bc172 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37764525392) · build v29-dev

## Verdict

**WEAK: 274 of 281 pairs changed (median first part 32.1 s); 5 of 34 counters under p 0.05 (about 1.7 by chance); casualties +1.9% (p 0.068)**

- Under 0.05 only: regroups.entries 747 to 594 (-20.5%, p 0.007); recon.contacts 300 to 551 (+83.7%, p 0.0207); retreatSamples 85333 to 94186 (+10.4%, p 0.0305); stallOutcomes.repeats 10 to 2 (-80.0%, p 0.0386); squadPerformance.meanCohesion 24561.1 to 24925.29999999998 (+1.5%, p 0.0472).
- Unpaired records: off 3, on 3 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **281** pairs (unpaired: off 3, on 3) · identical in every field: **7** · runtime errors off 0 / on 0 · wall time on/off x0.97 (gate 1.25)
- the 250 changed records first part at simulated second: min 22.05, p10 23.1, median 32.1, p90 189, max 368.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 8065 | 8218 | 0.5445 | 188 | 107 | 81 | 0.068 |
| `usKills` | 3576 | 3499 | -0.274 | 178 | 85 | 93 | 0.5999 |
| `geKills` | 4489 | 4719 | 0.8185 | 191 | 106 | 85 | 0.1477 |
| `fire.total` | 19622 | 19574 | -0.1708 | 196 | 101 | 95 | 0.7211 |
| `fire.hits` | 6974 | 7079 | 0.3737 | 190 | 95 | 95 | 1 |
| `retreatSamples` | 85333 | 94186 | 31.5053 | 193 | 112 | 81 | 0.0305 |
| `movementResolver.changes` | 619407 | 622371 | 10.548 | 235 | 131 | 104 | 0.0897 |
| `movementStalls.length` | 62 | 37 | -0.089 | 17 | 5 | 12 | 0.1435 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 260 | 247 | -0.0463 | 111 | 54 | 57 | 0.8496 |
| `loopAlerts.length` | 242 | 221 | -0.0747 | 126 | 63 | 63 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 747 | 594 | -0.5445 | 125 | 47 | 78 | 0.007 |
| `stallOutcomes.wakes` | 24 | 31 | 0.0249 | 44 | 24 | 20 | 0.6516 |
| `stallOutcomes.repeats` | 10 | 2 | -0.0285 | 12 | 2 | 10 | 0.0386 |
| `timeline.stalledOnsets` | 70 | 38 | -0.1139 | 17 | 5 | 12 | 0.1435 |
| `timeline.stalledSamples` | 3516 | 1355 | -7.6904 | 22 | 8 | 14 | 0.2863 |
| `timeline.stalledOnsetsRepeated` | 202 | 115 | -0.3096 | 21 | 6 | 15 | 0.0784 |
| `timeline.stalledSamplesRepeated` | 8418 | 3793 | -16.4591 | 25 | 10 | 15 | 0.4244 |
| `recon.orders` | 6657 | 6907 | 0.8897 | 170 | 78 | 92 | 0.3187 |
| `recon.contacts` | 300 | 551 | 0.8932 | 127 | 50 | 77 | 0.0207 |
| `recon.noContact` | 4376 | 4412 | 0.1281 | 140 | 72 | 68 | 0.8 |
| `recon.timeouts` | 225 | 193 | -0.1139 | 116 | 50 | 66 | 0.1634 |
| `recon.cancelled` | 1519 | 1528 | 0.032 | 153 | 85 | 68 | 0.1957 |
| `recon.reportsDelivered` | 1552 | 1289 | -0.9359 | 140 | 58 | 82 | 0.0515 |
| `recon.retriggerBlocked` | 5107 | 5250 | 0.5089 | 164 | 76 | 88 | 0.3904 |
| `squadPerformance.meanOverall` | 24288.799999999996 | 24479.500000000007 | 0.6786 | 213 | 113 | 100 | 0.411 |
| `squadPerformance.p10Overall` | 22815.699999999993 | 23004.799999999992 | 0.673 | 175 | 86 | 89 | 0.8799 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20415.80000000001 | 20467.099999999995 | 0.1826 | 196 | 98 | 98 | 1 |
| `squadPerformance.meanMovement` | 27570.599999999988 | 27804.00000000001 | 0.8306 | 183 | 100 | 83 | 0.2368 |
| `squadPerformance.meanControl` | 27600.000000000004 | 27805.600000000006 | 0.7317 | 181 | 95 | 86 | 0.5522 |
| `squadPerformance.meanCohesion` | 24561.1 | 24925.29999999998 | 1.2961 | 229 | 130 | 99 | 0.0472 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sqrelay-0027 22.05 s (timeline) · sqrelay-0054 22.05 s (timeline) · sqrelay-0003 23.1 s (timeline) · sqrelay-0005 23.1 s (timeline) · sqrelay-0008 23.1 s (timeline) · sqrelay-0011 23.1 s (timeline) · sqrelay-0012 23.1 s (timeline) · sqrelay-0017 23.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=395&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=395`); it opens the seed that parts earliest, and the dropdowns choose another.

