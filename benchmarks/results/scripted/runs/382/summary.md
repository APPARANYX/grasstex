# Benchmark run #382 · 60 seeds from `hill` (meeting), windows `every120`

- **OFF** flags: `fireLineContact=0&unreachableAnchor=0` · **ON** flags: `none`
- claude/bench-363-368 @ 0277c68 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37735986936) · build v29-dev

## Verdict

**MOVED: 248 of 281 pairs changed (median first part 208.05 s); 8 of 34 counters under p 0.05 (about 1.7 by chance), 3 under 0.0015; casualties +7.5% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 7336 to 7887 (+7.5%, p 0); movementResolver.changes 603522 to 632574 (+4.8%, p 0); fire.hits 6350 to 7026 (+10.6%, p 0.0006).
- Under 0.05 only: geKills 3858 to 4342 (+12.5%, p 0.0027); stallOutcomes.wakes 51 to 24 (-52.9%, p 0.0055); stallOutcomes.repeats 25 to 10 (-60.0%, p 0.0125); recon.timeouts 213 to 190 (-10.8%, p 0.023); retreatSamples 86784 to 92809 (+6.9%, p 0.0361).
- Unpaired records: off 2, on 2 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **281** pairs (unpaired: off 2, on 2) · identical in every field: **33** · runtime errors off 0 / on 0 · wall time on/off x0.99 (gate 1.25)
- the 191 changed records first part at simulated second: min 65.1, p10 141, median 208.05, p90 267, max 398.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7336 | 7887 | 1.9609 | 170 | 113 | 57 | 0 |
| `usKills` | 3478 | 3545 | 0.2384 | 165 | 88 | 77 | 0.4364 |
| `geKills` | 3858 | 4342 | 1.7224 | 170 | 105 | 65 | 0.0027 |
| `fire.total` | 18365 | 19909 | 5.4947 | 178 | 99 | 79 | 0.1542 |
| `fire.hits` | 6350 | 7026 | 2.4057 | 172 | 109 | 63 | 0.0006 |
| `retreatSamples` | 86784 | 92809 | 21.4413 | 179 | 104 | 75 | 0.0361 |
| `movementResolver.changes` | 603522 | 632574 | 103.3879 | 190 | 143 | 47 | 0 |
| `movementStalls.length` | 36 | 36 | 0 | 10 | 4 | 6 | 0.7539 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 282 | 287 | 0.0178 | 109 | 54 | 55 | 1 |
| `loopAlerts.length` | 214 | 274 | 0.2135 | 111 | 65 | 46 | 0.0871 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 543 | 570 | 0.0961 | 107 | 58 | 49 | 0.4394 |
| `stallOutcomes.wakes` | 51 | 24 | -0.0961 | 48 | 14 | 34 | 0.0055 |
| `stallOutcomes.repeats` | 25 | 10 | -0.0534 | 28 | 7 | 21 | 0.0125 |
| `timeline.stalledOnsets` | 44 | 39 | -0.0178 | 11 | 4 | 7 | 0.5488 |
| `timeline.stalledSamples` | 3090 | 2810 | -0.9964 | 13 | 7 | 6 | 1 |
| `timeline.stalledOnsetsRepeated` | 132 | 109 | -0.0819 | 15 | 4 | 11 | 0.1185 |
| `timeline.stalledSamplesRepeated` | 6730 | 6341 | -1.3843 | 17 | 6 | 11 | 0.3323 |
| `recon.orders` | 6335 | 6447 | 0.3986 | 147 | 79 | 68 | 0.4096 |
| `recon.contacts` | 234 | 272 | 0.1352 | 93 | 56 | 37 | 0.0614 |
| `recon.noContact` | 4316 | 4388 | 0.2562 | 111 | 66 | 45 | 0.0572 |
| `recon.timeouts` | 213 | 190 | -0.0819 | 86 | 32 | 54 | 0.023 |
| `recon.cancelled` | 1392 | 1407 | 0.0534 | 133 | 72 | 61 | 0.386 |
| `recon.reportsDelivered` | 1138 | 1256 | 0.4199 | 91 | 50 | 41 | 0.4018 |
| `recon.retriggerBlocked` | 4902 | 4954 | 0.1851 | 128 | 63 | 65 | 0.9296 |
| `squadPerformance.meanOverall` | 24349.79999999999 | 24430.7 | 0.2879 | 177 | 81 | 96 | 0.2926 |
| `squadPerformance.p10Overall` | 22948.49999999998 | 23000.699999999983 | 0.1858 | 144 | 65 | 79 | 0.2786 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20383.699999999993 | 20408.399999999987 | 0.0879 | 178 | 85 | 93 | 0.5999 |
| `squadPerformance.meanMovement` | 27658.799999999985 | 27783.399999999983 | 0.4434 | 166 | 87 | 79 | 0.5871 |
| `squadPerformance.meanControl` | 27700.2 | 27801.400000000012 | 0.3601 | 164 | 83 | 81 | 0.9378 |
| `squadPerformance.meanCohesion` | 24644.800000000017 | 24750.300000000003 | 0.3754 | 180 | 93 | 87 | 0.7095 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0016 65.1 s (timeline) · hill-0017 72 s (timeline) · hill-0046 119.1 s (timeline) · hill-0052 133.05 s (timeline) · hill-0059 141 s (timeline) · hill-0031 143.1 s (timeline) · hill-0060 166.05 s (stress) · hill-0002 170.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=382&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=382`); it opens the seed that parts earliest, and the dropdowns choose another.

