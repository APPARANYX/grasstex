# Benchmark run #470 · 60 seeds from `exec361p` (ge-defend), windows `contact+600`

- **OFF** flags: `reconProbe=0` · **ON** flags: `none`
- claude/recon-probe @ f82f5b2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37852773419) · build v29-dev

## Verdict

**MOVED: 53 of 53 pairs changed (median first part 34.05 s); 7 of 34 counters under p 0.05 (about 1.7 by chance), 6 under 0.0015; casualties -3.4% (p 0.1524)**

- Clears the Bonferroni line (p < 0.0015): regroups.entries 145 to 402 (+177.2%, p 0); recon.orders 3525 to 2890 (-18.0%, p 0); recon.noContact 1277 to 446 (-65.1%, p 0); recon.timeouts 1119 to 1501 (+34.1%, p 0); recon.retriggerBlocked 1387 to 876 (-36.8%, p 0); recon.reportsDelivered 1347 to 874 (-35.1%, p 0.0002).
- Under 0.05 only: recon.contacts 304 to 245 (-19.4%, p 0.04).

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.008 (gate 1.25)
- the 53 changed records first part at simulated second: min 29.1, p10 31.05, median 34.05, p90 43.05, max 72

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2590 | 2502 | -1.6604 | 49 | 19 | 30 | 0.1524 |
| `usKills` | 1110 | 1079 | -0.5849 | 52 | 25 | 27 | 0.8899 |
| `geKills` | 1480 | 1423 | -1.0755 | 52 | 22 | 30 | 0.3317 |
| `fire.total` | 17973 | 17863 | -2.0755 | 53 | 26 | 27 | 1 |
| `fire.hits` | 6013 | 6048 | 0.6604 | 53 | 22 | 31 | 0.2717 |
| `retreatSamples` | 89234 | 90341 | 20.8868 | 53 | 27 | 26 | 1 |
| `movementResolver.changes` | 142480 | 143608 | 21.283 | 53 | 30 | 23 | 0.4101 |
| `movementStalls.length` | 0 | 1 | 0.0189 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 60 | 48 | -0.2264 | 30 | 12 | 18 | 0.3616 |
| `loopAlerts.length` | 172 | 194 | 0.4151 | 48 | 27 | 21 | 0.4709 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 145 | 402 | 4.8491 | 51 | 44 | 7 | 0 |
| `stallOutcomes.wakes` | 6 | 8 | 0.0377 | 11 | 6 | 5 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3525 | 2890 | -11.9811 | 51 | 9 | 42 | 0 |
| `recon.contacts` | 304 | 245 | -1.1132 | 47 | 16 | 31 | 0.04 |
| `recon.noContact` | 1277 | 446 | -15.6792 | 52 | 1 | 51 | 0 |
| `recon.timeouts` | 1119 | 1501 | 7.2075 | 50 | 42 | 8 | 0 |
| `recon.cancelled` | 747 | 642 | -1.9811 | 48 | 17 | 31 | 0.0595 |
| `recon.reportsDelivered` | 1347 | 874 | -8.9245 | 51 | 12 | 39 | 0.0002 |
| `recon.retriggerBlocked` | 1387 | 876 | -9.6415 | 52 | 3 | 49 | 0 |
| `squadPerformance.meanOverall` | 4396.799999999999 | 4368.7 | -0.5302 | 53 | 23 | 30 | 0.4101 |
| `squadPerformance.p10Overall` | 3996.4999999999995 | 3978.299999999999 | -0.3434 | 32 | 12 | 20 | 0.2153 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3645.4999999999995 | 3591.8000000000006 | -1.0132 | 53 | 23 | 30 | 0.4101 |
| `squadPerformance.meanMovement` | 5268.8 | 5275.499999999998 | 0.1264 | 47 | 30 | 17 | 0.0789 |
| `squadPerformance.meanControl` | 5177.4 | 5170.5 | -0.1302 | 52 | 23 | 29 | 0.4885 |
| `squadPerformance.meanCohesion` | 4644.2 | 4569.1 | -1.417 | 53 | 19 | 34 | 0.0534 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361p-0017 29.1 s (timeline) · exec361p-0033 29.1 s (timeline) · exec361p-0015 30 s (timeline) · exec361p-0028 30 s (timeline) · exec361p-0035 30 s (timeline) · exec361p-0013 31.05 s (timeline) · exec361p-0020 31.05 s (timeline) · exec361p-0021 31.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=470&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=470`); it opens the seed that parts earliest, and the dropdowns choose another.

