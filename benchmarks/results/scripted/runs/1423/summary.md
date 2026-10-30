# Benchmark run #1423 · 60 seeds from `controller-pacing-20261030` (ge-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-f4174a32 @ f4174a3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40984576858) · build v29-dev

## Verdict

**MOVED: 53 of 53 pairs changed (median first part 1.05 s); 18 of 42 counters under p 0.05 (about 2.1 by chance), 15 under 0.0012; casualties -11.2% (p 0.0649)**

- Clears the Bonferroni line (p < 0.0012): movementResolver.changes 69447 to 96503 (+39.0%, p 0); loopAlerts.length 158 to 637 (+303.2%, p 0); writerConflicts 0 to 278 (new, p 0); stallOutcomes.wakes 0 to 49 (new, p 0); recon.orders 866 to 428 (-50.6%, p 0); recon.contacts 114 to 5 (-95.6%, p 0); recon.noContact 493 to 105 (-78.7%, p 0); recon.cancelled 201 to 313 (+55.7%, p 0); recon.reportsDelivered 556 to 34 (-93.9%, p 0); recon.retriggerBlocked 466 to 279 (-40.1%, p 0); squadPerformance.meanControl 5171.799999999998 to 4881.699999999999 (-5.6%, p 0); squadPerformance.meanCohesion 4503.200000000001 to 4803.500000000001 (+6.7%, p 0); retreatSamples 5005 to 8913 (+78.1%, p 0.0003); squadPerformance.meanOverall 4653.099999999999 to 4547.9 (-2.3%, p 0.0008); squadPerformance.meanMission 4324.400000000001 to 3972.500000000001 (-8.1%, p 0.0008).
- Under 0.05 only: fire.total 10697 to 16308 (+52.5%, p 0.0055); recon.timeouts 22 to 2 (-90.9%, p 0.0129); stallOutcomes.repeats 0 to 7 (new, p 0.0313).
- Wall time on/off x1.894 is over the 1.25 gate.
- Runtime errors: off 1, on 0.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 1 / on 0 · wall time on/off x1.894 (gate 1.25)
- the 53 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 974 | 865 | -2.0566 | 50 | 18 | 32 | 0.0649 |
| `usKills` | 383 | 341 | -0.7925 | 52 | 19 | 33 | 0.0704 |
| `geKills` | 591 | 524 | -1.2642 | 48 | 20 | 28 | 0.3123 |
| `fire.total` | 10697 | 16308 | 105.8679 | 53 | 37 | 16 | 0.0055 |
| `fire.hits` | 1873 | 1948 | 1.4151 | 53 | 21 | 32 | 0.169 |
| `retreatSamples` | 5005 | 8913 | 73.7358 | 53 | 40 | 13 | 0.0003 |
| `movementResolver.changes` | 69447 | 96503 | 510.4906 | 53 | 51 | 2 | 0 |
| `grenades.throws` | 6 | 15 | 0.1698 | 8 | 7 | 1 | 0.0703 |
| `grenades.bursts` | 6 | 14 | 0.1509 | 7 | 6 | 1 | 0.125 |
| `grenades.wounded` | 4 | 23 | 0.3585 | 4 | 3 | 1 | 0.625 |
| `grenades.casualties` | 1 | 7 | 0.1132 | 4 | 3 | 1 | 0.625 |
| `grenades.suppressed` | 21 | 40 | 0.3585 | 5 | 4 | 1 | 0.375 |
| `grenades.friendlyWounded` | 1 | 8 | 0.1321 | 2 | 1 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 2 | 0.0377 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 5 | 0.0566 | 5 | 3 | 2 | 1 |
| `loopAlerts.length` | 158 | 637 | 9.0377 | 51 | 48 | 3 | 0 |
| `writerConflicts` | 0 | 278 | 5.2453 | 25 | 25 | 0 | 0 |
| `regroups.entries` | 75 | 140 | 1.2264 | 41 | 26 | 15 | 0.1173 |
| `stallOutcomes.wakes` | 0 | 49 | 0.9245 | 46 | 46 | 0 | 0 |
| `stallOutcomes.repeats` | 0 | 7 | 0.1321 | 6 | 6 | 0 | 0.0313 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 866 | 428 | -8.2642 | 53 | 0 | 53 | 0 |
| `recon.contacts` | 114 | 5 | -2.0566 | 40 | 0 | 40 | 0 |
| `recon.noContact` | 493 | 105 | -7.3208 | 53 | 0 | 53 | 0 |
| `recon.timeouts` | 22 | 2 | -0.3774 | 14 | 2 | 12 | 0.0129 |
| `recon.cancelled` | 201 | 313 | 2.1132 | 49 | 42 | 7 | 0 |
| `recon.reportsDelivered` | 556 | 34 | -9.8491 | 37 | 0 | 37 | 0 |
| `recon.retriggerBlocked` | 466 | 279 | -3.5283 | 50 | 0 | 50 | 0 |
| `squadPerformance.meanOverall` | 4653.099999999999 | 4547.9 | -1.9849 | 53 | 14 | 39 | 0.0008 |
| `squadPerformance.p10Overall` | 4218.4 | 4102.699999999999 | -2.183 | 52 | 21 | 31 | 0.2116 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4324.400000000001 | 3972.500000000001 | -6.6396 | 53 | 14 | 39 | 0.0008 |
| `squadPerformance.meanMovement` | 5276.699999999999 | 5275.599999999999 | -0.0208 | 48 | 24 | 24 | 1 |
| `squadPerformance.meanControl` | 5171.799999999998 | 4881.699999999999 | -5.4736 | 52 | 3 | 49 | 0 |
| `squadPerformance.meanCohesion` | 4503.200000000001 | 4803.500000000001 | 5.666 | 51 | 42 | 9 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing-20261030-0001 1.05 s (timeline) · controller-pacing-20261030-0002 1.05 s (timeline) · controller-pacing-20261030-0003 1.05 s (timeline) · controller-pacing-20261030-0004 1.05 s (timeline) · controller-pacing-20261030-0006 1.05 s (timeline) · controller-pacing-20261030-0007 1.05 s (timeline) · controller-pacing-20261030-0009 1.05 s (timeline) · controller-pacing-20261030-0010 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1423&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-f4174a32/ai_flow_live.html?bench=1423&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1423`); it opens the seed that parts earliest, and the dropdowns choose another.

