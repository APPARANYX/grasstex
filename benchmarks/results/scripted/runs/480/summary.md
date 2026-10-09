# Benchmark run #480 · 60 seeds from `exec361p` (us-defend), windows `contact+600`

- **OFF** flags: `reconBudget=0` · **ON** flags: `none`
- claude/recon-derived-timeout @ 268e090 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37873305064) · build v29-dev

## Verdict

**MOVED: 53 of 53 pairs changed (median first part 33.599999999999994 s); 3 of 34 counters under p 0.05 (about 1.7 by chance), 2 under 0.0015; casualties -2.2% (p 0.6655)**

- Clears the Bonferroni line (p < 0.0015): recon.noContact 521 to 651 (+25.0%, p 0); recon.timeouts 483 to 141 (-70.8%, p 0).
- Under 0.05 only: recon.cancelled 423 to 500 (+18.2%, p 0.0079).

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.967 (gate 1.25)
- the 52 changed records first part at simulated second: min 30, p10 31.05, median 33.599999999999994, p90 41.1, max 189

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2493 | 2437 | -1.0566 | 48 | 22 | 26 | 0.6655 |
| `usKills` | 1212 | 1150 | -1.1698 | 50 | 22 | 28 | 0.4799 |
| `geKills` | 1281 | 1287 | 0.1132 | 50 | 24 | 26 | 0.8877 |
| `fire.total` | 17289 | 16718 | -10.7736 | 51 | 22 | 29 | 0.4011 |
| `fire.hits` | 5937 | 5713 | -4.2264 | 51 | 23 | 28 | 0.5758 |
| `retreatSamples` | 95557 | 98926 | 63.566 | 52 | 25 | 27 | 0.8899 |
| `movementResolver.changes` | 146379 | 144056 | -43.8302 | 52 | 25 | 27 | 0.8899 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 79 | 71 | -0.1509 | 38 | 17 | 21 | 0.6271 |
| `loopAlerts.length` | 228 | 167 | -1.1509 | 44 | 16 | 28 | 0.0961 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 270 | 240 | -0.566 | 43 | 27 | 16 | 0.1263 |
| `stallOutcomes.wakes` | 15 | 17 | 0.0377 | 18 | 11 | 7 | 0.4807 |
| `stallOutcomes.repeats` | 3 | 5 | 0.0377 | 6 | 4 | 2 | 0.6875 |
| `timeline.stalledOnsets` | 1 | 2 | 0.0189 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 8 | 14 | 0.1132 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 2 | 0.0189 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 8 | 14 | 0.1132 | 1 | 1 | 0 | 1 |
| `recon.orders` | 1938 | 1728 | -3.9623 | 50 | 22 | 28 | 0.4799 |
| `recon.contacts` | 482 | 398 | -1.5849 | 45 | 25 | 20 | 0.5515 |
| `recon.noContact` | 521 | 651 | 2.4528 | 46 | 38 | 8 | 0 |
| `recon.timeouts` | 483 | 141 | -6.4528 | 51 | 0 | 51 | 0 |
| `recon.cancelled` | 423 | 500 | 1.4528 | 47 | 33 | 14 | 0.0079 |
| `recon.reportsDelivered` | 1024 | 1076 | 0.9811 | 52 | 26 | 26 | 1 |
| `recon.retriggerBlocked` | 686 | 626 | -1.1321 | 46 | 20 | 26 | 0.4614 |
| `squadPerformance.meanOverall` | 4368.2 | 4365.099999999999 | -0.0585 | 51 | 28 | 23 | 0.5758 |
| `squadPerformance.p10Overall` | 3959.2999999999997 | 3968.2000000000003 | 0.1679 | 29 | 17 | 12 | 0.4583 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3539.2000000000003 | 3543.9000000000005 | 0.0887 | 52 | 25 | 27 | 0.8899 |
| `squadPerformance.meanMovement` | 5271.600000000001 | 5273.4 | 0.034 | 44 | 22 | 22 | 1 |
| `squadPerformance.meanControl` | 5162.7 | 5184.300000000002 | 0.4075 | 51 | 31 | 20 | 0.1608 |
| `squadPerformance.meanCohesion` | 4756.3 | 4688.9000000000015 | -1.2717 | 51 | 22 | 29 | 0.4011 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361p-0013 30 s (timeline) · exec361p-0021 30 s (timeline) · exec361p-0029 30 s (stress) · exec361p-0030 30.15 s (timeline) · exec361p-0020 31.05 s (timeline) · exec361p-0022 31.05 s (timeline) · exec361p-0023 31.05 s (timeline) · exec361p-0040 31.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=480&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=480`); it opens the seed that parts earliest, and the dropdowns choose another.

