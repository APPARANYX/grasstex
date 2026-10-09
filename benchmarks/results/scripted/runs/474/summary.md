# Benchmark run #474 · 60 seeds from `retreat398p` (meeting), windows `contact+600`

- **OFF** flags: `retreatArrival=0` · **ON** flags: `none`
- claude/retreat-anchor-slot @ 8bf6933 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37871872507) · build v29-dev

## Verdict

**QUIET: 37 of 60 pairs changed (median first part 348.07500000000005 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.5% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **23** · runtime errors off 0 / on 0 · wall time on/off x0.998 (gate 1.25)
- the 28 changed records first part at simulated second: min 240, p10 278.1, median 348.07500000000005, p90 518.1, max 579

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3197 | 3214 | 0.2833 | 21 | 11 | 10 | 1 |
| `usKills` | 1449 | 1471 | 0.3667 | 20 | 9 | 11 | 0.8238 |
| `geKills` | 1748 | 1743 | -0.0833 | 18 | 8 | 10 | 0.8145 |
| `fire.total` | 21103 | 21406 | 5.05 | 25 | 15 | 10 | 0.4244 |
| `fire.hits` | 7384 | 7360 | -0.4 | 23 | 12 | 11 | 1 |
| `retreatSamples` | 89685 | 92511 | 47.1 | 24 | 14 | 10 | 0.5413 |
| `movementResolver.changes` | 196179 | 198661 | 41.3667 | 27 | 18 | 9 | 0.1221 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 259 | 263 | 0.0667 | 19 | 9 | 10 | 1 |
| `loopAlerts.length` | 212 | 226 | 0.2333 | 23 | 14 | 9 | 0.4049 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 210 | 213 | 0.05 | 15 | 9 | 6 | 0.6072 |
| `stallOutcomes.wakes` | 10 | 10 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 3 | 4 | 0.0167 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2024 | 2010 | -0.2333 | 23 | 13 | 10 | 0.6776 |
| `recon.contacts` | 90 | 89 | -0.0167 | 9 | 4 | 5 | 1 |
| `recon.noContact` | 1128 | 1133 | 0.0833 | 21 | 11 | 10 | 1 |
| `recon.timeouts` | 82 | 81 | -0.0167 | 16 | 8 | 8 | 1 |
| `recon.cancelled` | 633 | 627 | -0.1 | 22 | 12 | 10 | 0.8318 |
| `recon.reportsDelivered` | 435 | 434 | -0.0167 | 9 | 4 | 5 | 1 |
| `recon.retriggerBlocked` | 1507 | 1509 | 0.0333 | 21 | 12 | 9 | 0.6636 |
| `squadPerformance.meanOverall` | 4889.099999999999 | 4886.399999999999 | -0.045 | 22 | 7 | 15 | 0.1338 |
| `squadPerformance.p10Overall` | 4480.5999999999985 | 4479.799999999999 | -0.0133 | 9 | 5 | 4 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3872.4 | 3875.4999999999995 | 0.0517 | 22 | 12 | 10 | 0.8318 |
| `squadPerformance.meanMovement` | 5941.099999999998 | 5940.8 | -0.005 | 20 | 9 | 11 | 0.8238 |
| `squadPerformance.meanControl` | 5793.200000000001 | 5789.799999999999 | -0.0567 | 25 | 12 | 13 | 1 |
| `squadPerformance.meanCohesion` | 5403.100000000001 | 5409.400000000001 | 0.105 | 25 | 16 | 9 | 0.2295 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

retreat398p-0021 240 s (timeline) · retreat398p-0029 264 s (timeline) · retreat398p-0033 278.1 s (timeline) · retreat398p-0014 291 s (timeline) · retreat398p-0019 297 s (timeline) · retreat398p-0060 301.05 s (timeline) · retreat398p-0040 302.1 s (timeline) · retreat398p-0048 304.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=474&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=474`); it opens the seed that parts earliest, and the dropdowns choose another.

