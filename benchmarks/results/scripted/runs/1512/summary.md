# Benchmark run #1512 · 60 seeds from `c701b` (meeting), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerGunner=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c701b-a71f322e @ a71f322 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41242484791) · build v29-dev

## Verdict

**MOVED: 56 of 60 pairs changed (median first part 234 s); 3 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -0.9% (p 0.7552)**

- Clears the Bonferroni line (p < 0.0012): fire.total 23872 to 27905 (+16.9%, p 0.0001).
- Under 0.05 only: squadPerformance.meanMission 4408.499999999999 to 4517.9 (+2.5%, p 0.0195); squadPerformance.meanCohesion 5360.000000000002 to 5313.500000000001 (-0.9%, p 0.0488).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **4** · runtime errors off 0 / on 0 · wall time on/off x0.997 (gate 1.25)
- the 47 changed records first part at simulated second: min 160.05, p10 180, median 234, p90 280.05, max 302.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1033 | 1024 | -0.15 | 41 | 22 | 19 | 0.7552 |
| `usKills` | 462 | 433 | -0.4833 | 37 | 15 | 22 | 0.324 |
| `geKills` | 571 | 591 | 0.3333 | 39 | 23 | 16 | 0.3368 |
| `fire.total` | 23872 | 27905 | 67.2167 | 48 | 38 | 10 | 0.0001 |
| `fire.hits` | 2178 | 2135 | -0.7167 | 46 | 23 | 23 | 1 |
| `retreatSamples` | 5680 | 4881 | -13.3167 | 40 | 15 | 25 | 0.1539 |
| `movementResolver.changes` | 204608 | 204370 | -3.9667 | 46 | 21 | 25 | 0.6587 |
| `grenades.throws` | 17 | 11 | -0.1 | 7 | 1 | 6 | 0.125 |
| `grenades.bursts` | 13 | 9 | -0.0667 | 3 | 0 | 3 | 0.25 |
| `grenades.wounded` | 10 | 9 | -0.0167 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 2 | 1 | -0.0167 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 22 | 18 | -0.0667 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 13 | 14 | 0.0167 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 805 | 802 | -0.05 | 27 | 13 | 14 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 34 | 38 | 0.0667 | 19 | 11 | 8 | 0.6476 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1311 | 1320 | 0.15 | 23 | 14 | 9 | 0.4049 |
| `recon.contacts` | 77 | 70 | -0.1167 | 16 | 5 | 11 | 0.2101 |
| `recon.noContact` | 700 | 704 | 0.0667 | 5 | 4 | 1 | 0.375 |
| `recon.timeouts` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 515 | 520 | 0.0833 | 18 | 10 | 8 | 0.8145 |
| `recon.reportsDelivered` | 438 | 384 | -0.9 | 17 | 5 | 12 | 0.1435 |
| `recon.retriggerBlocked` | 1093 | 1088 | -0.0833 | 19 | 8 | 11 | 0.6476 |
| `squadPerformance.meanOverall` | 5081.199999999999 | 5104.9 | 0.395 | 43 | 28 | 15 | 0.066 |
| `squadPerformance.p10Overall` | 4666.700000000002 | 4660.200000000001 | -0.1083 | 40 | 18 | 22 | 0.6358 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4408.499999999999 | 4517.9 | 1.8233 | 42 | 29 | 13 | 0.0195 |
| `squadPerformance.meanMovement` | 5918.700000000003 | 5913.500000000002 | -0.0867 | 39 | 17 | 22 | 0.5224 |
| `squadPerformance.meanControl` | 5473.600000000002 | 5453.100000000002 | -0.3417 | 42 | 17 | 25 | 0.28 |
| `squadPerformance.meanCohesion` | 5360.000000000002 | 5313.500000000001 | -0.775 | 44 | 15 | 29 | 0.0488 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c701b-0020 160.05 s (timeline) · c701b-0060 172.05 s (timeline) · c701b-0044 177 s (timeline) · c701b-0041 178.05 s (stress) · c701b-0037 180 s (stress) · c701b-0031 184.05 s (timeline) · c701b-0042 187.05 s (timeline) · c701b-0053 194.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1512&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c701b-a71f322e/ai_flow_live.html?bench=1512&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1512`); it opens the seed that parts earliest, and the dropdowns choose another.

