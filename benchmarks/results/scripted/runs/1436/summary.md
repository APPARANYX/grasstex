# Benchmark run #1436 · 60 seeds from `controller-pacing2-20261030` (us-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-7a4c33ee @ 7a4c33e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41003808608) · build v29-dev

## Verdict

**MOVED: 53 of 53 pairs changed (median first part 1.05 s); 19 of 42 counters under p 0.05 (about 2.1 by chance), 18 under 0.0012; casualties -17.0% (p 0.0009)**

- Clears the Bonferroni line (p < 0.0012): fire.total 12069 to 17474 (+44.8%, p 0); retreatSamples 6164 to 10029 (+62.7%, p 0); movementResolver.changes 73781 to 99234 (+34.5%, p 0); loopAlerts.length 170 to 645 (+279.4%, p 0); writerConflicts 0 to 192 (new, p 0); stallOutcomes.wakes 0 to 58 (new, p 0); recon.orders 780 to 409 (-47.6%, p 0); recon.contacts 72 to 7 (-90.3%, p 0); recon.noContact 461 to 215 (-53.4%, p 0); recon.reportsDelivered 333 to 34 (-89.8%, p 0); recon.retriggerBlocked 420 to 273 (-35.0%, p 0); squadPerformance.meanOverall 4618.6 to 4503.400000000001 (-2.5%, p 0); squadPerformance.meanMission 4212.4 to 3832.399999999999 (-9.0%, p 0); squadPerformance.meanControl 5172.900000000001 to 4907.399999999999 (-5.1%, p 0); squadPerformance.meanCohesion 4584.4 to 4862.400000000001 (+6.1%, p 0); recon.timeouts 31 to 1 (-96.8%, p 0.0005); usKills 545 to 409 (-25.0%, p 0.0007); casualties 1025 to 851 (-17.0%, p 0.0009).
- Under 0.05 only: stallOutcomes.repeats 0 to 6 (new, p 0.0313).
- Wall time on/off x1.889 is over the 1.25 gate.
- Runtime errors: off 1, on 0.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 1 / on 0 · wall time on/off x1.889 (gate 1.25)
- the 53 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1025 | 851 | -3.283 | 50 | 13 | 37 | 0.0009 |
| `usKills` | 545 | 409 | -2.566 | 48 | 12 | 36 | 0.0007 |
| `geKills` | 480 | 442 | -0.717 | 52 | 20 | 32 | 0.1263 |
| `fire.total` | 12069 | 17474 | 101.9811 | 53 | 45 | 8 | 0 |
| `fire.hits` | 2142 | 1820 | -6.0755 | 52 | 19 | 33 | 0.0704 |
| `retreatSamples` | 6164 | 10029 | 72.9245 | 52 | 43 | 9 | 0 |
| `movementResolver.changes` | 73781 | 99234 | 480.2453 | 53 | 52 | 1 | 0 |
| `grenades.throws` | 8 | 14 | 0.1132 | 11 | 7 | 4 | 0.5488 |
| `grenades.bursts` | 5 | 12 | 0.1321 | 10 | 7 | 3 | 0.3438 |
| `grenades.wounded` | 5 | 4 | -0.0189 | 6 | 4 | 2 | 0.6875 |
| `grenades.casualties` | 2 | 0 | -0.0377 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 8 | 11 | 0.0566 | 7 | 5 | 2 | 0.4531 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 6 | 0.0943 | 3 | 2 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 7 | 0.1321 | 5 | 5 | 0 | 0.0625 |
| `loopAlerts.length` | 170 | 645 | 8.9623 | 52 | 52 | 0 | 0 |
| `writerConflicts` | 0 | 192 | 3.6226 | 36 | 36 | 0 | 0 |
| `regroups.entries` | 60 | 62 | 0.0377 | 34 | 18 | 16 | 0.8642 |
| `stallOutcomes.wakes` | 0 | 58 | 1.0943 | 51 | 51 | 0 | 0 |
| `stallOutcomes.repeats` | 0 | 6 | 0.1132 | 6 | 6 | 0 | 0.0313 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 780 | 409 | -7 | 53 | 0 | 53 | 0 |
| `recon.contacts` | 72 | 7 | -1.2264 | 39 | 3 | 36 | 0 |
| `recon.noContact` | 461 | 215 | -4.6415 | 53 | 0 | 53 | 0 |
| `recon.timeouts` | 31 | 1 | -0.566 | 12 | 0 | 12 | 0.0005 |
| `recon.cancelled` | 170 | 176 | 0.1132 | 46 | 26 | 20 | 0.4614 |
| `recon.reportsDelivered` | 333 | 34 | -5.6415 | 36 | 4 | 32 | 0 |
| `recon.retriggerBlocked` | 420 | 273 | -2.7736 | 50 | 1 | 49 | 0 |
| `squadPerformance.meanOverall` | 4618.6 | 4503.400000000001 | -2.1736 | 52 | 8 | 44 | 0 |
| `squadPerformance.p10Overall` | 4161.799999999999 | 4061.999999999999 | -1.883 | 50 | 18 | 32 | 0.0649 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4212.4 | 3832.399999999999 | -7.1698 | 53 | 6 | 47 | 0 |
| `squadPerformance.meanMovement` | 5279.4 | 5273.099999999999 | -0.1189 | 44 | 16 | 28 | 0.0961 |
| `squadPerformance.meanControl` | 5172.900000000001 | 4907.399999999999 | -5.0094 | 52 | 0 | 52 | 0 |
| `squadPerformance.meanCohesion` | 4584.4 | 4862.400000000001 | 5.2453 | 53 | 50 | 3 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing2-20261030-0001 1.05 s (timeline) · controller-pacing2-20261030-0002 1.05 s (timeline) · controller-pacing2-20261030-0003 1.05 s (timeline) · controller-pacing2-20261030-0004 1.05 s (timeline) · controller-pacing2-20261030-0005 1.05 s (timeline) · controller-pacing2-20261030-0006 1.05 s (timeline) · controller-pacing2-20261030-0007 1.05 s (timeline) · controller-pacing2-20261030-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1436&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-7a4c33ee/ai_flow_live.html?bench=1436&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1436`); it opens the seed that parts earliest, and the dropdowns choose another.

