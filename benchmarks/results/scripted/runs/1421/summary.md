# Benchmark run #1421 · 60 seeds from `controller-pacing-20261030` (meeting), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-f4174a32 @ f4174a3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40984571121) · build v29-dev

## Verdict

**MOVED: 60 of 60 pairs changed (median first part 1.05 s); 14 of 42 counters under p 0.05 (about 2.1 by chance), 13 under 0.0012; casualties -4.2% (p 0.2976)**

- Clears the Bonferroni line (p < 0.0012): fire.total 15186 to 22371 (+47.3%, p 0); retreatSamples 6223 to 12044 (+93.5%, p 0); movementResolver.changes 129159 to 178048 (+37.9%, p 0); loopAlerts.length 223 to 807 (+261.9%, p 0); stallOutcomes.wakes 3 to 26 (+766.7%, p 0); recon.orders 1222 to 954 (-21.9%, p 0); recon.noContact 867 to 513 (-40.8%, p 0); recon.retriggerBlocked 1004 to 899 (-10.5%, p 0); squadPerformance.meanOverall 5128.2 to 4983.200000000001 (-2.8%, p 0); squadPerformance.meanMission 4481.300000000001 to 3978.399999999999 (-11.2%, p 0); squadPerformance.meanControl 5786.300000000001 to 5590.199999999999 (-3.4%, p 0); squadPerformance.meanCohesion 5261.299999999999 to 5525.800000000001 (+5.0%, p 0); vacantObjectiveStalls.length 11 to 38 (+245.5%, p 0.0009).
- Under 0.05 only: recon.cancelled 286 to 376 (+31.5%, p 0.0038).
- Wall time on/off x2.099 is over the 1.25 gate.
- Runtime errors: off 0, on 1.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 1 · wall time on/off x2.099 (gate 1.25)
- the 60 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1183 | 1133 | -0.8333 | 59 | 25 | 34 | 0.2976 |
| `usKills` | 512 | 453 | -0.9833 | 53 | 24 | 29 | 0.5831 |
| `geKills` | 671 | 680 | 0.15 | 57 | 30 | 27 | 0.7914 |
| `fire.total` | 15186 | 22371 | 119.75 | 60 | 51 | 9 | 0 |
| `fire.hits` | 2576 | 2444 | -2.2 | 58 | 28 | 30 | 0.8957 |
| `retreatSamples` | 6223 | 12044 | 97.0167 | 60 | 46 | 14 | 0 |
| `movementResolver.changes` | 129159 | 178048 | 814.8167 | 60 | 60 | 0 | 0 |
| `grenades.throws` | 16 | 15 | -0.0167 | 8 | 5 | 3 | 0.7266 |
| `grenades.bursts` | 14 | 15 | 0.0167 | 8 | 5 | 3 | 0.7266 |
| `grenades.wounded` | 22 | 27 | 0.0833 | 6 | 4 | 2 | 0.6875 |
| `grenades.casualties` | 5 | 6 | 0.0167 | 5 | 3 | 2 | 1 |
| `grenades.suppressed` | 43 | 55 | 0.2 | 7 | 4 | 3 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 0 | -0.0333 | 2 | 0 | 2 | 0.5 |
| `movementStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 11 | 38 | 0.45 | 25 | 21 | 4 | 0.0009 |
| `loopAlerts.length` | 223 | 807 | 9.7333 | 58 | 57 | 1 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 102 | 94 | -0.1333 | 43 | 22 | 21 | 1 |
| `stallOutcomes.wakes` | 3 | 26 | 0.3833 | 24 | 23 | 1 | 0 |
| `stallOutcomes.repeats` | 0 | 2 | 0.0333 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 7 | 24 | 0.2833 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 7 | 24 | 0.2833 | 2 | 1 | 1 | 1 |
| `recon.orders` | 1222 | 954 | -4.4667 | 57 | 2 | 55 | 0 |
| `recon.contacts` | 50 | 53 | 0.05 | 36 | 21 | 15 | 0.405 |
| `recon.noContact` | 867 | 513 | -5.9 | 60 | 0 | 60 | 0 |
| `recon.timeouts` | 5 | 1 | -0.0667 | 6 | 1 | 5 | 0.2188 |
| `recon.cancelled` | 286 | 376 | 1.5 | 54 | 38 | 16 | 0.0038 |
| `recon.reportsDelivered` | 248 | 289 | 0.6833 | 41 | 24 | 17 | 0.3489 |
| `recon.retriggerBlocked` | 1004 | 899 | -1.75 | 49 | 7 | 42 | 0 |
| `squadPerformance.meanOverall` | 5128.2 | 4983.200000000001 | -2.4167 | 59 | 8 | 51 | 0 |
| `squadPerformance.p10Overall` | 4643.2 | 4570.799999999999 | -1.2067 | 57 | 24 | 33 | 0.2892 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4481.300000000001 | 3978.399999999999 | -8.3817 | 60 | 9 | 51 | 0 |
| `squadPerformance.meanMovement` | 5923.400000000001 | 5936.5 | 0.2183 | 56 | 34 | 22 | 0.1409 |
| `squadPerformance.meanControl` | 5786.300000000001 | 5590.199999999999 | -3.2683 | 60 | 8 | 52 | 0 |
| `squadPerformance.meanCohesion` | 5261.299999999999 | 5525.800000000001 | 4.4083 | 59 | 47 | 12 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing-20261030-0001 1.05 s (timeline) · controller-pacing-20261030-0002 1.05 s (timeline) · controller-pacing-20261030-0003 1.05 s (timeline) · controller-pacing-20261030-0004 1.05 s (timeline) · controller-pacing-20261030-0005 1.05 s (timeline) · controller-pacing-20261030-0006 1.05 s (timeline) · controller-pacing-20261030-0007 1.05 s (timeline) · controller-pacing-20261030-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1421&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-f4174a32/ai_flow_live.html?bench=1421&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1421`); it opens the seed that parts earliest, and the dropdowns choose another.

