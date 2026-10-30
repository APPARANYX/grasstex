# Benchmark run #1422 · 60 seeds from `controller-pacing-20261030` (us-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-f4174a32 @ f4174a3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40984572945) · build v29-dev

## Verdict

**MOVED: 53 of 53 pairs changed (median first part 1.05 s); 20 of 42 counters under p 0.05 (about 2.1 by chance), 17 under 0.0012; casualties -8.6% (p 0.1189)**

- Clears the Bonferroni line (p < 0.0012): fire.total 12204 to 16549 (+35.6%, p 0); retreatSamples 5811 to 10801 (+85.9%, p 0); movementResolver.changes 72977 to 95588 (+31.0%, p 0); loopAlerts.length 159 to 624 (+292.5%, p 0); writerConflicts 0 to 112 (new, p 0); stallOutcomes.wakes 0 to 52 (new, p 0); recon.orders 815 to 420 (-48.5%, p 0); recon.contacts 89 to 6 (-93.3%, p 0); recon.noContact 487 to 198 (-59.3%, p 0); recon.reportsDelivered 453 to 25 (-94.5%, p 0); recon.retriggerBlocked 444 to 255 (-42.6%, p 0); squadPerformance.meanOverall 4645.100000000001 to 4492.400000000001 (-3.3%, p 0); squadPerformance.p10Overall 4171.499999999999 to 4026.5999999999995 (-3.5%, p 0); squadPerformance.meanMission 4198.300000000001 to 3788 (-9.8%, p 0); squadPerformance.meanControl 5197.5 to 4947 (-4.8%, p 0); squadPerformance.meanCohesion 4663.400000000001 to 4895.900000000001 (+5.0%, p 0); recon.timeouts 23 to 0 (-100.0%, p 0.0001).
- Under 0.05 only: fire.hits 2144 to 1668 (-22.2%, p 0.0012); recon.cancelled 171 to 207 (+21.1%, p 0.0213); stallOutcomes.repeats 0 to 6 (new, p 0.0313).
- Wall time on/off x1.97 is over the 1.25 gate.
- Runtime errors: off 2, on 1.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 2 / on 1 · wall time on/off x1.97 (gate 1.25)
- the 53 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 925 | 845 | -1.5094 | 50 | 19 | 31 | 0.1189 |
| `usKills` | 442 | 389 | -1 | 49 | 18 | 31 | 0.0854 |
| `geKills` | 483 | 456 | -0.5094 | 52 | 22 | 30 | 0.3317 |
| `fire.total` | 12204 | 16549 | 81.9811 | 52 | 41 | 11 | 0 |
| `fire.hits` | 2144 | 1668 | -8.9811 | 52 | 14 | 38 | 0.0012 |
| `retreatSamples` | 5811 | 10801 | 94.1509 | 53 | 46 | 7 | 0 |
| `movementResolver.changes` | 72977 | 95588 | 426.6226 | 53 | 51 | 2 | 0 |
| `grenades.throws` | 7 | 10 | 0.0566 | 4 | 3 | 1 | 0.625 |
| `grenades.bursts` | 5 | 10 | 0.0943 | 4 | 3 | 1 | 0.625 |
| `grenades.wounded` | 0 | 11 | 0.2075 | 3 | 3 | 0 | 0.25 |
| `grenades.casualties` | 0 | 4 | 0.0755 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 0 | 17 | 0.3208 | 3 | 3 | 0 | 0.25 |
| `grenades.friendlyWounded` | 0 | 1 | 0.0189 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 5 | 0.0755 | 3 | 3 | 0 | 0.25 |
| `loopAlerts.length` | 159 | 624 | 8.7736 | 52 | 49 | 3 | 0 |
| `writerConflicts` | 0 | 112 | 2.1132 | 21 | 21 | 0 | 0 |
| `regroups.entries` | 64 | 61 | -0.0566 | 37 | 20 | 17 | 0.7428 |
| `stallOutcomes.wakes` | 0 | 52 | 0.9811 | 48 | 48 | 0 | 0 |
| `stallOutcomes.repeats` | 0 | 6 | 0.1132 | 6 | 6 | 0 | 0.0313 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 815 | 420 | -7.4528 | 52 | 0 | 52 | 0 |
| `recon.contacts` | 89 | 6 | -1.566 | 44 | 3 | 41 | 0 |
| `recon.noContact` | 487 | 198 | -5.4528 | 53 | 0 | 53 | 0 |
| `recon.timeouts` | 23 | 0 | -0.434 | 15 | 0 | 15 | 0.0001 |
| `recon.cancelled` | 171 | 207 | 0.6792 | 49 | 33 | 16 | 0.0213 |
| `recon.reportsDelivered` | 453 | 25 | -8.0755 | 40 | 3 | 37 | 0 |
| `recon.retriggerBlocked` | 444 | 255 | -3.566 | 51 | 0 | 51 | 0 |
| `squadPerformance.meanOverall` | 4645.100000000001 | 4492.400000000001 | -2.8811 | 52 | 5 | 47 | 0 |
| `squadPerformance.p10Overall` | 4171.499999999999 | 4026.5999999999995 | -2.734 | 49 | 10 | 39 | 0 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4198.300000000001 | 3788 | -7.7415 | 53 | 11 | 42 | 0 |
| `squadPerformance.meanMovement` | 5276.000000000002 | 5271.4 | -0.0868 | 46 | 19 | 27 | 0.302 |
| `squadPerformance.meanControl` | 5197.5 | 4947 | -4.7264 | 53 | 2 | 51 | 0 |
| `squadPerformance.meanCohesion` | 4663.400000000001 | 4895.900000000001 | 4.3868 | 52 | 44 | 8 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing-20261030-0001 1.05 s (timeline) · controller-pacing-20261030-0002 1.05 s (timeline) · controller-pacing-20261030-0003 1.05 s (timeline) · controller-pacing-20261030-0004 1.05 s (timeline) · controller-pacing-20261030-0006 1.05 s (timeline) · controller-pacing-20261030-0007 1.05 s (timeline) · controller-pacing-20261030-0009 1.05 s (timeline) · controller-pacing-20261030-0010 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1422&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-f4174a32/ai_flow_live.html?bench=1422&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1422`); it opens the seed that parts earliest, and the dropdowns choose another.

