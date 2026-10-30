# Benchmark run #1444 · 60 seeds from `controller-pacing4-20261030` (ge-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-946eaa95 @ 946eaa9 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41059152312) · build v29-dev

## Verdict

**MOVED: 55 of 55 pairs changed (median first part 1.05 s); 19 of 42 counters under p 0.05 (about 2.1 by chance), 17 under 0.0012; casualties -17.9% (p 0.0005)**

- Clears the Bonferroni line (p < 0.0012): fire.total 11247 to 16598 (+47.6%, p 0); movementResolver.changes 68985 to 97858 (+41.9%, p 0); loopAlerts.length 184 to 495 (+169.0%, p 0); regroups.entries 75 to 184 (+145.3%, p 0); stallOutcomes.wakes 0 to 52 (new, p 0); recon.orders 891 to 1393 (+56.3%, p 0); recon.contacts 93 to 226 (+143.0%, p 0); recon.noContact 520 to 352 (-32.3%, p 0); recon.cancelled 197 to 736 (+273.6%, p 0); squadPerformance.meanOverall 4851.5999999999985 to 4743.900000000001 (-2.2%, p 0); squadPerformance.meanControl 5357.4000000000015 to 5229.9 (-2.4%, p 0); recon.reportsDelivered 448 to 1039 (+131.9%, p 0.0001); squadPerformance.meanMission 4493.700000000002 to 4171.900000000001 (-7.2%, p 0.0004); casualties 1050 to 862 (-17.9%, p 0.0005); squadPerformance.p10Overall 4405.3 to 4258.6 (-3.3%, p 0.0009); fire.hits 2139 to 1787 (-16.5%, p 0.001); retreatSamples 5193 to 8272 (+59.3%, p 0.001).
- Under 0.05 only: squadPerformance.meanCohesion 4766.7 to 4890.900000000001 (+2.6%, p 0.0027); usKills 377 to 325 (-13.8%, p 0.0444).
- Wall time on/off x1.675 is over the 1.25 gate.
- Runtime errors: off 0, on 1.

## Paired comparison (off against on)

- **55** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 1 · wall time on/off x1.675 (gate 1.25)
- the 55 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1050 | 862 | -3.4182 | 54 | 14 | 40 | 0.0005 |
| `usKills` | 377 | 325 | -0.9455 | 49 | 17 | 32 | 0.0444 |
| `geKills` | 673 | 537 | -2.4727 | 50 | 19 | 31 | 0.1189 |
| `fire.total` | 11247 | 16598 | 97.2909 | 55 | 46 | 9 | 0 |
| `fire.hits` | 2139 | 1787 | -6.4 | 55 | 15 | 40 | 0.001 |
| `retreatSamples` | 5193 | 8272 | 55.9818 | 55 | 40 | 15 | 0.001 |
| `movementResolver.changes` | 68985 | 97858 | 524.9636 | 55 | 54 | 1 | 0 |
| `grenades.throws` | 2 | 7 | 0.0909 | 6 | 5 | 1 | 0.2188 |
| `grenades.bursts` | 2 | 7 | 0.0909 | 6 | 5 | 1 | 0.2188 |
| `grenades.wounded` | 2 | 2 | 0 | 3 | 2 | 1 | 1 |
| `grenades.casualties` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `grenades.suppressed` | 2 | 7 | 0.0909 | 5 | 4 | 1 | 0.375 |
| `grenades.friendlyWounded` | 1 | 0 | -0.0182 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 1 | 0.0182 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 4 | 0.0727 | 4 | 4 | 0 | 0.125 |
| `loopAlerts.length` | 184 | 495 | 5.6545 | 48 | 41 | 7 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 75 | 184 | 1.9818 | 47 | 38 | 9 | 0 |
| `stallOutcomes.wakes` | 0 | 52 | 0.9455 | 51 | 51 | 0 | 0 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 891 | 1393 | 9.1273 | 54 | 51 | 3 | 0 |
| `recon.contacts` | 93 | 226 | 2.4182 | 47 | 43 | 4 | 0 |
| `recon.noContact` | 520 | 352 | -3.0545 | 55 | 1 | 54 | 0 |
| `recon.timeouts` | 22 | 17 | -0.0909 | 10 | 2 | 8 | 0.1094 |
| `recon.cancelled` | 197 | 736 | 9.8 | 55 | 53 | 2 | 0 |
| `recon.reportsDelivered` | 448 | 1039 | 10.7455 | 48 | 38 | 10 | 0.0001 |
| `recon.retriggerBlocked` | 468 | 482 | 0.2545 | 38 | 21 | 17 | 0.6271 |
| `squadPerformance.meanOverall` | 4851.5999999999985 | 4743.900000000001 | -1.9582 | 55 | 11 | 44 | 0 |
| `squadPerformance.p10Overall` | 4405.3 | 4258.6 | -2.6673 | 50 | 13 | 37 | 0.0009 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4493.700000000002 | 4171.900000000001 | -5.8509 | 55 | 14 | 41 | 0.0004 |
| `squadPerformance.meanMovement` | 5478.4 | 5483.400000000001 | 0.0909 | 43 | 23 | 20 | 0.7608 |
| `squadPerformance.meanControl` | 5357.4000000000015 | 5229.9 | -2.3182 | 55 | 12 | 43 | 0 |
| `squadPerformance.meanCohesion` | 4766.7 | 4890.900000000001 | 2.2582 | 55 | 39 | 16 | 0.0027 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing4-20261030-0001 1.05 s (timeline) · controller-pacing4-20261030-0002 1.05 s (timeline) · controller-pacing4-20261030-0003 1.05 s (timeline) · controller-pacing4-20261030-0004 1.05 s (timeline) · controller-pacing4-20261030-0005 1.05 s (timeline) · controller-pacing4-20261030-0006 1.05 s (timeline) · controller-pacing4-20261030-0007 1.05 s (timeline) · controller-pacing4-20261030-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1444&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-946eaa95/ai_flow_live.html?bench=1444&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1444`); it opens the seed that parts earliest, and the dropdowns choose another.

