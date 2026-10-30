# Benchmark run #1442 · 60 seeds from `controller-pacing4-20261030` (meeting), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-946eaa95 @ 946eaa9 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41059139581) · build v29-dev

## Verdict

**MOVED: 60 of 60 pairs changed (median first part 1.05 s); 17 of 42 counters under p 0.05 (about 2.1 by chance), 13 under 0.0012; casualties -10.1% (p 0.0145)**

- Clears the Bonferroni line (p < 0.0012): fire.total 14098 to 22052 (+56.4%, p 0); movementResolver.changes 129342 to 177929 (+37.6%, p 0); vacantObjectiveStalls.length 4 to 45 (+1025.0%, p 0); loopAlerts.length 218 to 816 (+274.3%, p 0); stallOutcomes.wakes 2 to 29 (+1350.0%, p 0); recon.noContact 890 to 581 (-34.7%, p 0); recon.cancelled 314 to 529 (+68.5%, p 0); squadPerformance.meanOverall 5107 to 5008.700000000001 (-1.9%, p 0); squadPerformance.meanMission 4439.800000000001 to 4084.3999999999996 (-8.0%, p 0); squadPerformance.meanControl 5808.500000000002 to 5556.4000000000015 (-4.3%, p 0); squadPerformance.meanCohesion 5251.799999999999 to 5500.4 (+4.7%, p 0); fire.hits 2666 to 2254 (-15.5%, p 0.0011); retreatSamples 7189 to 10248 (+42.6%, p 0.0011).
- Under 0.05 only: recon.orders 1292 to 1219 (-5.7%, p 0.0015); recon.retriggerBlocked 1049 to 1002 (-4.5%, p 0.0055); casualties 1249 to 1123 (-10.1%, p 0.0145); usKills 577 to 452 (-21.7%, p 0.0183).
- Wall time on/off x2.016 is over the 1.25 gate.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x2.016 (gate 1.25)
- the 60 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1249 | 1123 | -2.1 | 55 | 18 | 37 | 0.0145 |
| `usKills` | 577 | 452 | -2.0833 | 59 | 20 | 39 | 0.0183 |
| `geKills` | 672 | 671 | -0.0167 | 56 | 27 | 29 | 0.8939 |
| `fire.total` | 14098 | 22052 | 132.5667 | 60 | 52 | 8 | 0 |
| `fire.hits` | 2666 | 2254 | -6.8667 | 60 | 17 | 43 | 0.0011 |
| `retreatSamples` | 7189 | 10248 | 50.9833 | 60 | 43 | 17 | 0.0011 |
| `movementResolver.changes` | 129342 | 177929 | 809.7833 | 60 | 60 | 0 | 0 |
| `grenades.throws` | 6 | 13 | 0.1167 | 8 | 6 | 2 | 0.2891 |
| `grenades.bursts` | 5 | 11 | 0.1 | 5 | 4 | 1 | 0.375 |
| `grenades.wounded` | 11 | 17 | 0.1 | 4 | 2 | 2 | 1 |
| `grenades.casualties` | 2 | 4 | 0.0333 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 22 | 37 | 0.25 | 4 | 3 | 1 | 0.625 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 4 | 0.05 | 3 | 3 | 0 | 0.25 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 4 | 45 | 0.6833 | 26 | 24 | 2 | 0 |
| `loopAlerts.length` | 218 | 816 | 9.9667 | 59 | 57 | 2 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 97 | 150 | 0.8833 | 55 | 34 | 21 | 0.1048 |
| `stallOutcomes.wakes` | 2 | 29 | 0.45 | 27 | 26 | 1 | 0 |
| `stallOutcomes.repeats` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1292 | 1219 | -1.2167 | 54 | 15 | 39 | 0.0015 |
| `recon.contacts` | 71 | 93 | 0.3667 | 39 | 24 | 15 | 0.1996 |
| `recon.noContact` | 890 | 581 | -5.15 | 60 | 0 | 60 | 0 |
| `recon.timeouts` | 9 | 9 | 0 | 14 | 8 | 6 | 0.7905 |
| `recon.cancelled` | 314 | 529 | 3.5833 | 57 | 54 | 3 | 0 |
| `recon.reportsDelivered` | 409 | 429 | 0.3333 | 47 | 24 | 23 | 1 |
| `recon.retriggerBlocked` | 1049 | 1002 | -0.7833 | 48 | 14 | 34 | 0.0055 |
| `squadPerformance.meanOverall` | 5107 | 5008.700000000001 | -1.6383 | 60 | 12 | 48 | 0 |
| `squadPerformance.p10Overall` | 4638.5 | 4588.4 | -0.835 | 54 | 27 | 27 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4439.800000000001 | 4084.3999999999996 | -5.9233 | 60 | 10 | 50 | 0 |
| `squadPerformance.meanMovement` | 5931.100000000001 | 5942.5999999999985 | 0.1917 | 56 | 34 | 22 | 0.1409 |
| `squadPerformance.meanControl` | 5808.500000000002 | 5556.4000000000015 | -4.2017 | 60 | 4 | 56 | 0 |
| `squadPerformance.meanCohesion` | 5251.799999999999 | 5500.4 | 4.1433 | 60 | 47 | 13 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing4-20261030-0001 1.05 s (timeline) · controller-pacing4-20261030-0002 1.05 s (timeline) · controller-pacing4-20261030-0003 1.05 s (timeline) · controller-pacing4-20261030-0004 1.05 s (timeline) · controller-pacing4-20261030-0005 1.05 s (timeline) · controller-pacing4-20261030-0006 1.05 s (timeline) · controller-pacing4-20261030-0007 1.05 s (timeline) · controller-pacing4-20261030-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1442&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-946eaa95/ai_flow_live.html?bench=1442&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1442`); it opens the seed that parts earliest, and the dropdowns choose another.

