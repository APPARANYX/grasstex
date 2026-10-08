# Benchmark run #468 · 60 seeds from `exec361p` (meeting), windows `contact+600`

- **OFF** flags: `reconProbe=0` · **ON** flags: `none`
- claude/recon-probe @ f82f5b2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37852767059) · build v29-dev

## Verdict

**MOVED: 56 of 60 pairs changed (median first part 166.575 s); 3 of 34 counters under p 0.05 (about 1.7 by chance), 2 under 0.0015; casualties +2.3% (p 0.243)**

- Clears the Bonferroni line (p < 0.0015): recon.retriggerBlocked 1512 to 1377 (-8.9%, p 0); recon.noContact 1279 to 1147 (-10.3%, p 0.0003).
- Under 0.05 only: recon.orders 2164 to 2003 (-7.4%, p 0.04).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **4** · runtime errors off 0 / on 0 · wall time on/off x1.027 (gate 1.25)
- the 52 changed records first part at simulated second: min 131.1, p10 140.1, median 166.575, p90 423, max 561

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3151 | 3225 | 1.2333 | 36 | 22 | 14 | 0.243 |
| `usKills` | 1389 | 1533 | 2.4 | 37 | 24 | 13 | 0.0989 |
| `geKills` | 1762 | 1692 | -1.1667 | 37 | 15 | 22 | 0.324 |
| `fire.total` | 20845 | 20611 | -3.9 | 40 | 19 | 21 | 0.8746 |
| `fire.hits` | 7444 | 7530 | 1.4333 | 40 | 20 | 20 | 1 |
| `retreatSamples` | 95335 | 95207 | -2.1333 | 42 | 20 | 22 | 0.8776 |
| `movementResolver.changes` | 190698 | 193413 | 45.25 | 50 | 28 | 22 | 0.4799 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 272 | 305 | 0.55 | 28 | 18 | 10 | 0.1849 |
| `loopAlerts.length` | 242 | 261 | 0.3167 | 37 | 22 | 15 | 0.324 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 163 | 177 | 0.2333 | 33 | 18 | 15 | 0.7283 |
| `stallOutcomes.wakes` | 11 | 16 | 0.0833 | 12 | 8 | 4 | 0.3877 |
| `stallOutcomes.repeats` | 1 | 3 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2164 | 2003 | -2.6833 | 47 | 16 | 31 | 0.04 |
| `recon.contacts` | 106 | 103 | -0.05 | 28 | 11 | 17 | 0.3449 |
| `recon.noContact` | 1279 | 1147 | -2.2 | 42 | 9 | 33 | 0.0003 |
| `recon.timeouts` | 72 | 77 | 0.0833 | 24 | 14 | 10 | 0.5413 |
| `recon.cancelled` | 622 | 596 | -0.4333 | 39 | 18 | 21 | 0.7493 |
| `recon.reportsDelivered` | 514 | 510 | -0.0667 | 36 | 16 | 20 | 0.6177 |
| `recon.retriggerBlocked` | 1512 | 1377 | -2.25 | 43 | 8 | 35 | 0 |
| `squadPerformance.meanOverall` | 4894.8 | 4888.499999999998 | -0.105 | 40 | 17 | 23 | 0.4296 |
| `squadPerformance.p10Overall` | 4503.700000000001 | 4497.8 | -0.0983 | 19 | 9 | 10 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3903.500000000001 | 3916.6 | 0.2183 | 39 | 21 | 18 | 0.7493 |
| `squadPerformance.meanMovement` | 5936.299999999998 | 5938.900000000001 | 0.0433 | 39 | 21 | 18 | 0.7493 |
| `squadPerformance.meanControl` | 5778.200000000001 | 5770.6 | -0.1267 | 38 | 18 | 20 | 0.8714 |
| `squadPerformance.meanCohesion` | 5383.5999999999985 | 5369.600000000001 | -0.2333 | 40 | 20 | 20 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361p-0051 131.1 s (timeline) · exec361p-0060 134.1 s (timeline) · exec361p-0020 136.05 s (timeline) · exec361p-0038 136.05 s (timeline) · exec361p-0011 140.1 s (timeline) · exec361p-0054 140.1 s (timeline) · exec361p-0042 142.05 s (timeline) · exec361p-0026 143.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=468&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=468`); it opens the seed that parts earliest, and the dropdowns choose another.

