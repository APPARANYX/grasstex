# Benchmark run #424 · 60 seeds from `control` (us-defend), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/bench-stack-371-363 @ 4c8a599 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37778731854) · build v29-dev

## Verdict

**MOVED: 256 of 276 pairs changed (median first part 173.55 s); 13 of 34 counters under p 0.05 (about 1.7 by chance), 7 under 0.0015; casualties +14.4% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 6112 to 6992 (+14.4%, p 0); usKills 2814 to 3397 (+20.7%, p 0); retreatSamples 78501 to 90925 (+15.8%, p 0); movementResolver.changes 452446 to 498606 (+10.2%, p 0); stallOutcomes.wakes 92 to 13 (-85.9%, p 0); fire.hits 4993 to 5788 (+15.9%, p 0.0006); loopAlerts.length 145 to 222 (+53.1%, p 0.0013).
- Under 0.05 only: stallOutcomes.repeats 14 to 0 (-100.0%, p 0.0039); recon.cancelled 2002 to 2187 (+9.2%, p 0.0136); recon.contacts 715 to 827 (+15.7%, p 0.0215); fire.total 14979 to 17190 (+14.8%, p 0.0238); vacantObjectiveStalls.length 43 to 61 (+41.9%, p 0.0402); geKills 3298 to 3595 (+9.0%, p 0.0499).

## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **20** · runtime errors off 0 / on 0 · wall time on/off x0.973 (gate 1.25)
- the 210 changed records first part at simulated second: min 119.1, p10 140.1, median 173.55, p90 229.05, max 535.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 6112 | 6992 | 3.1884 | 194 | 134 | 60 | 0 |
| `usKills` | 2814 | 3397 | 2.1123 | 189 | 126 | 63 | 0 |
| `geKills` | 3298 | 3595 | 1.0761 | 190 | 109 | 81 | 0.0499 |
| `fire.total` | 14979 | 17190 | 8.0109 | 201 | 117 | 84 | 0.0238 |
| `fire.hits` | 4993 | 5788 | 2.8804 | 197 | 123 | 74 | 0.0006 |
| `retreatSamples` | 78501 | 90925 | 45.0145 | 194 | 127 | 67 | 0 |
| `movementResolver.changes` | 452446 | 498606 | 167.2464 | 209 | 177 | 32 | 0 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 43 | 61 | 0.0652 | 54 | 35 | 19 | 0.0402 |
| `loopAlerts.length` | 145 | 222 | 0.279 | 113 | 74 | 39 | 0.0013 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 498 | 568 | 0.2536 | 118 | 50 | 68 | 0.1172 |
| `stallOutcomes.wakes` | 92 | 13 | -0.2862 | 61 | 2 | 59 | 0 |
| `stallOutcomes.repeats` | 14 | 0 | -0.0507 | 9 | 0 | 9 | 0.0039 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11974 | 12393 | 1.5181 | 176 | 99 | 77 | 0.1132 |
| `recon.contacts` | 715 | 827 | 0.4058 | 149 | 89 | 60 | 0.0215 |
| `recon.noContact` | 4877 | 4952 | 0.2717 | 118 | 48 | 70 | 0.0527 |
| `recon.timeouts` | 3993 | 4004 | 0.0399 | 157 | 80 | 77 | 0.8732 |
| `recon.cancelled` | 2002 | 2187 | 0.6703 | 169 | 101 | 68 | 0.0136 |
| `recon.reportsDelivered` | 2987 | 3524 | 1.9457 | 161 | 89 | 72 | 0.2072 |
| `recon.retriggerBlocked` | 4984 | 4977 | -0.0254 | 160 | 72 | 88 | 0.2356 |
| `squadPerformance.meanOverall` | 24412.500000000004 | 24351.099999999984 | -0.2225 | 200 | 87 | 113 | 0.0768 |
| `squadPerformance.p10Overall` | 22721.799999999956 | 22664.099999999977 | -0.2091 | 160 | 82 | 78 | 0.8126 |
| `squadPerformance.lowScoreSquads` | 0 | 1 | 0.0036 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMission` | 21727.999999999993 | 21676.49999999998 | -0.1866 | 192 | 86 | 106 | 0.1701 |
| `squadPerformance.meanMovement` | 27439.70000000002 | 27413.900000000005 | -0.0935 | 173 | 81 | 92 | 0.4472 |
| `squadPerformance.meanControl` | 27447.299999999996 | 27429.099999999995 | -0.0659 | 169 | 81 | 88 | 0.6445 |
| `squadPerformance.meanCohesion` | 23224.899999999994 | 23063.899999999998 | -0.5833 | 202 | 91 | 111 | 0.1811 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0014 119.1 s (timeline) · control-0016 126 s (timeline) · control-0020 138 s (timeline) · control-0034 138 s (timeline) · control-0041 140.1 s (timeline) · control-0024 141 s (timeline) · control-0053 141 s (timeline) · control-0004 142.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=424&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=424`); it opens the seed that parts earliest, and the dropdowns choose another.

