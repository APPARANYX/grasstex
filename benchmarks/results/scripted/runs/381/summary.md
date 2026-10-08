# Benchmark run #381 · 60 seeds from `hill` (us-defend), windows `every120`

- **OFF** flags: `unreachableAnchor=0` · **ON** flags: `none`
- claude/fix-stale-ack-anchor @ 3004ab0 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37735979151) · build v29-dev

## Verdict

**QUIET: 97 of 275 pairs changed (median first part 307.05 s); 0 of 32 counters under p 0.05 (about 1.6 by chance); casualties -1.3% (p 0.4421)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 0) · identical in every field: **178** · runtime errors off 0 / on 0 · wall time on/off x0.936 (gate 1.25)
- the 36 changed records first part at simulated second: min 19.05, p10 19.05, median 307.05, p90 522, max 577.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5988 | 5910 | -0.2836 | 27 | 11 | 16 | 0.4421 |
| `usKills` | 2410 | 2374 | -0.1309 | 25 | 9 | 16 | 0.2295 |
| `geKills` | 3578 | 3536 | -0.1527 | 30 | 14 | 16 | 0.8555 |
| `fire.total` | 13818 | 13866 | 0.1745 | 31 | 15 | 16 | 1 |
| `fire.hits` | 4837 | 4825 | -0.0436 | 30 | 15 | 15 | 1 |
| `retreatSamples` | 82164 | 82077 | -0.3164 | 27 | 13 | 14 | 1 |
| `movementResolver.changes` | 438012 | 437715 | -1.08 | 35 | 17 | 18 | 1 |
| `movementStalls.length` | 5 | 4 | -0.0036 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 27 | 27 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 185 | 190 | 0.0182 | 13 | 9 | 4 | 0.2668 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 355 | 356 | 0.0036 | 13 | 6 | 7 | 1 |
| `stallOutcomes.wakes` | 81 | 78 | -0.0109 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 10 | 8 | -0.0073 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledSamples` | 218 | 202 | -0.0582 | 2 | 0 | 2 | 0.5 |
| `recon.orders` | 11931 | 11879 | -0.1891 | 29 | 14 | 15 | 1 |
| `recon.contacts` | 742 | 738 | -0.0145 | 19 | 10 | 9 | 1 |
| `recon.noContact` | 4110 | 4107 | -0.0109 | 19 | 9 | 10 | 1 |
| `recon.timeouts` | 4513 | 4514 | 0.0036 | 27 | 14 | 13 | 1 |
| `recon.cancelled` | 2116 | 2075 | -0.1491 | 25 | 8 | 17 | 0.1078 |
| `recon.reportsDelivered` | 3232 | 3180 | -0.1891 | 24 | 12 | 12 | 1 |
| `recon.retriggerBlocked` | 4755 | 4759 | 0.0145 | 22 | 11 | 11 | 1 |
| `squadPerformance.meanOverall` | 24307.800000000003 | 24315.700000000004 | 0.0287 | 31 | 20 | 11 | 0.1496 |
| `squadPerformance.p10Overall` | 22669.89999999999 | 22682.599999999988 | 0.0462 | 18 | 10 | 8 | 0.8145 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21708.9 | 21714.399999999994 | 0.02 | 29 | 16 | 13 | 0.7111 |
| `squadPerformance.meanMovement` | 27330.700000000023 | 27340.900000000016 | 0.0371 | 26 | 16 | 10 | 0.3269 |
| `squadPerformance.meanControl` | 27341.399999999998 | 27337.999999999993 | -0.0124 | 21 | 7 | 14 | 0.1892 |
| `squadPerformance.meanCohesion` | 23037.80000000002 | 23055.400000000016 | 0.064 | 32 | 16 | 16 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0001 19.05 s (timeline) · hill-0052 137.1 s (timeline) · hill-0007 187.05 s (timeline) · hill-0050 234 s (timeline) · hill-0057 307.05 s (timeline) · hill-0008 351 s (timeline) · hill-0023 353.1 s (timeline) · hill-0029 364.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=381&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=381`); it opens the seed that parts earliest, and the dropdowns choose another.

