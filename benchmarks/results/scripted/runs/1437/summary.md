# Benchmark run #1437 · 60 seeds from `controller-pacing2-20261030` (ge-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-7a4c33ee @ 7a4c33e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41003813718) · build v29-dev

## Verdict

**MOVED: 53 of 53 pairs changed (median first part 1.05 s); 19 of 42 counters under p 0.05 (about 2.1 by chance), 16 under 0.0012; casualties -14.8% (p 0.3817)**

- Clears the Bonferroni line (p < 0.0012): retreatSamples 4905 to 9402 (+91.7%, p 0); movementResolver.changes 68615 to 95207 (+38.8%, p 0); loopAlerts.length 179 to 553 (+208.9%, p 0); writerConflicts 0 to 97 (new, p 0); stallOutcomes.wakes 0 to 50 (new, p 0); recon.orders 823 to 429 (-47.9%, p 0); recon.contacts 81 to 14 (-82.7%, p 0); recon.noContact 470 to 119 (-74.7%, p 0); recon.reportsDelivered 388 to 85 (-78.1%, p 0); recon.retriggerBlocked 425 to 279 (-34.4%, p 0); squadPerformance.meanControl 5165.500000000003 to 4967.399999999999 (-3.8%, p 0); squadPerformance.meanOverall 4666.799999999999 to 4549.8 (-2.5%, p 0.0001); squadPerformance.meanMission 4308.8 to 3938.4 (-8.6%, p 0.0001); recon.timeouts 24 to 0 (-100.0%, p 0.0005); recon.cancelled 213 to 290 (+36.2%, p 0.0006); stallOutcomes.repeats 0 to 12 (new, p 0.001).
- Under 0.05 only: squadPerformance.meanCohesion 4623.999999999999 to 4839.800000000002 (+4.7%, p 0.0012); squadPerformance.p10Overall 4242.000000000001 to 4098.899999999999 (-3.4%, p 0.0032); fire.total 12004 to 16329 (+36.0%, p 0.0055).
- Wall time on/off x1.758 is over the 1.25 gate.
- Runtime errors: off 0, on 3.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 3 · wall time on/off x1.758 (gate 1.25)
- the 53 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1007 | 858 | -2.8113 | 47 | 20 | 27 | 0.3817 |
| `usKills` | 393 | 347 | -0.8679 | 50 | 22 | 28 | 0.4799 |
| `geKills` | 614 | 511 | -1.9434 | 49 | 24 | 25 | 1 |
| `fire.total` | 12004 | 16329 | 81.6038 | 53 | 37 | 16 | 0.0055 |
| `fire.hits` | 2086 | 1779 | -5.7925 | 49 | 19 | 30 | 0.1524 |
| `retreatSamples` | 4905 | 9402 | 84.8491 | 52 | 43 | 9 | 0 |
| `movementResolver.changes` | 68615 | 95207 | 501.7358 | 53 | 51 | 2 | 0 |
| `grenades.throws` | 5 | 12 | 0.1321 | 9 | 7 | 2 | 0.1797 |
| `grenades.bursts` | 5 | 12 | 0.1321 | 9 | 7 | 2 | 0.1797 |
| `grenades.wounded` | 1 | 15 | 0.2642 | 3 | 3 | 0 | 0.25 |
| `grenades.casualties` | 0 | 8 | 0.1509 | 3 | 3 | 0 | 0.25 |
| `grenades.suppressed` | 1 | 37 | 0.6792 | 5 | 4 | 1 | 0.375 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 3 | 2 | -0.0189 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 7 | 0.0943 | 5 | 4 | 1 | 0.375 |
| `loopAlerts.length` | 179 | 553 | 7.0566 | 52 | 47 | 5 | 0 |
| `writerConflicts` | 0 | 97 | 1.8302 | 25 | 25 | 0 | 0 |
| `regroups.entries` | 65 | 97 | 0.6038 | 42 | 25 | 17 | 0.28 |
| `stallOutcomes.wakes` | 0 | 50 | 0.9434 | 48 | 48 | 0 | 0 |
| `stallOutcomes.repeats` | 0 | 12 | 0.2264 | 11 | 11 | 0 | 0.001 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 823 | 429 | -7.434 | 53 | 0 | 53 | 0 |
| `recon.contacts` | 81 | 14 | -1.2642 | 41 | 3 | 38 | 0 |
| `recon.noContact` | 470 | 119 | -6.6226 | 53 | 0 | 53 | 0 |
| `recon.timeouts` | 24 | 0 | -0.4528 | 12 | 0 | 12 | 0.0005 |
| `recon.cancelled` | 213 | 290 | 1.4528 | 51 | 38 | 13 | 0.0006 |
| `recon.reportsDelivered` | 388 | 85 | -5.717 | 34 | 3 | 31 | 0 |
| `recon.retriggerBlocked` | 425 | 279 | -2.7547 | 50 | 3 | 47 | 0 |
| `squadPerformance.meanOverall` | 4666.799999999999 | 4549.8 | -2.2075 | 52 | 12 | 40 | 0.0001 |
| `squadPerformance.p10Overall` | 4242.000000000001 | 4098.899999999999 | -2.7 | 52 | 15 | 37 | 0.0032 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4308.8 | 3938.4 | -6.9887 | 53 | 12 | 41 | 0.0001 |
| `squadPerformance.meanMovement` | 5277.799999999999 | 5277.000000000001 | -0.0151 | 47 | 25 | 22 | 0.7709 |
| `squadPerformance.meanControl` | 5165.500000000003 | 4967.399999999999 | -3.7377 | 53 | 7 | 46 | 0 |
| `squadPerformance.meanCohesion` | 4623.999999999999 | 4839.800000000002 | 4.0717 | 52 | 38 | 14 | 0.0012 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing2-20261030-0001 1.05 s (timeline) · controller-pacing2-20261030-0002 1.05 s (timeline) · controller-pacing2-20261030-0003 1.05 s (timeline) · controller-pacing2-20261030-0004 1.05 s (timeline) · controller-pacing2-20261030-0005 1.05 s (timeline) · controller-pacing2-20261030-0006 1.05 s (timeline) · controller-pacing2-20261030-0007 1.05 s (timeline) · controller-pacing2-20261030-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1437&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-7a4c33ee/ai_flow_live.html?bench=1437&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1437`); it opens the seed that parts earliest, and the dropdowns choose another.

