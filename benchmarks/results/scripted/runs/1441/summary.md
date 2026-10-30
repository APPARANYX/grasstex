# Benchmark run #1441 · 60 seeds from `controller-pacing3-20261030` (ge-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-c75d7825 @ c75d782 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41005411251) · build v29-dev

## Verdict

**MOVED: 57 of 57 pairs changed (median first part 1.05 s); 17 of 42 counters under p 0.05 (about 2.1 by chance), 15 under 0.0012; casualties -11.1% (p 0.0534)**

- Clears the Bonferroni line (p < 0.0012): fire.total 11684 to 17913 (+53.3%, p 0); retreatSamples 5018 to 8443 (+68.3%, p 0); movementResolver.changes 75147 to 102534 (+36.4%, p 0); loopAlerts.length 209 to 533 (+155.0%, p 0); regroups.entries 99 to 213 (+115.2%, p 0); stallOutcomes.wakes 0 to 51 (new, p 0); recon.orders 946 to 1419 (+50.0%, p 0); recon.contacts 108 to 231 (+113.9%, p 0); recon.noContact 548 to 366 (-33.2%, p 0); recon.cancelled 221 to 731 (+230.8%, p 0); recon.reportsDelivered 525 to 947 (+80.4%, p 0); squadPerformance.meanOverall 5011.800000000002 to 4899 (-2.3%, p 0); squadPerformance.p10Overall 4554.4 to 4418.699999999999 (-3.0%, p 0); squadPerformance.meanMission 4669.8 to 4318.3 (-7.5%, p 0); squadPerformance.meanControl 5536.500000000003 to 5419.600000000001 (-2.1%, p 0).
- Under 0.05 only: squadPerformance.meanMovement 5674.6 to 5684.500000000002 (+0.2%, p 0.0055); usKills 417 to 331 (-20.6%, p 0.0175).
- Wall time on/off x1.573 is over the 1.25 gate.

## Paired comparison (off against on)

- **57** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.573 (gate 1.25)
- the 57 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1090 | 969 | -2.1228 | 53 | 19 | 34 | 0.0534 |
| `usKills` | 417 | 331 | -1.5088 | 52 | 17 | 35 | 0.0175 |
| `geKills` | 673 | 638 | -0.614 | 53 | 26 | 27 | 1 |
| `fire.total` | 11684 | 17913 | 109.2807 | 56 | 44 | 12 | 0 |
| `fire.hits` | 2096 | 2031 | -1.1404 | 57 | 26 | 31 | 0.5966 |
| `retreatSamples` | 5018 | 8443 | 60.0877 | 57 | 48 | 9 | 0 |
| `movementResolver.changes` | 75147 | 102534 | 480.4737 | 57 | 55 | 2 | 0 |
| `grenades.throws` | 14 | 12 | -0.0351 | 8 | 4 | 4 | 1 |
| `grenades.bursts` | 13 | 11 | -0.0351 | 8 | 4 | 4 | 1 |
| `grenades.wounded` | 12 | 7 | -0.0877 | 5 | 2 | 3 | 1 |
| `grenades.casualties` | 4 | 1 | -0.0526 | 3 | 0 | 3 | 0.25 |
| `grenades.suppressed` | 20 | 21 | 0.0175 | 7 | 3 | 4 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 4 | 0 | 6 | 3 | 3 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 2 | 0.0351 | 2 | 2 | 0 | 0.5 |
| `loopAlerts.length` | 209 | 533 | 5.6842 | 54 | 49 | 5 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 99 | 213 | 2 | 42 | 36 | 6 | 0 |
| `stallOutcomes.wakes` | 0 | 51 | 0.8947 | 51 | 51 | 0 | 0 |
| `stallOutcomes.repeats` | 0 | 2 | 0.0351 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 946 | 1419 | 8.2982 | 55 | 55 | 0 | 0 |
| `recon.contacts` | 108 | 231 | 2.1579 | 50 | 42 | 8 | 0 |
| `recon.noContact` | 548 | 366 | -3.193 | 56 | 1 | 55 | 0 |
| `recon.timeouts` | 28 | 23 | -0.0877 | 10 | 3 | 7 | 0.3438 |
| `recon.cancelled` | 221 | 731 | 8.9474 | 57 | 57 | 0 | 0 |
| `recon.reportsDelivered` | 525 | 947 | 7.4035 | 54 | 43 | 11 | 0 |
| `recon.retriggerBlocked` | 493 | 492 | -0.0175 | 41 | 17 | 24 | 0.3489 |
| `squadPerformance.meanOverall` | 5011.800000000002 | 4899 | -1.9789 | 57 | 12 | 45 | 0 |
| `squadPerformance.p10Overall` | 4554.4 | 4418.699999999999 | -2.3807 | 55 | 11 | 44 | 0 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4669.8 | 4318.3 | -6.1667 | 57 | 11 | 46 | 0 |
| `squadPerformance.meanMovement` | 5674.6 | 5684.500000000002 | 0.1737 | 48 | 34 | 14 | 0.0055 |
| `squadPerformance.meanControl` | 5536.500000000003 | 5419.600000000001 | -2.0509 | 55 | 9 | 46 | 0 |
| `squadPerformance.meanCohesion` | 4859.999999999998 | 4978.599999999999 | 2.0807 | 56 | 34 | 22 | 0.1409 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing3-20261030-0001 1.05 s (timeline) · controller-pacing3-20261030-0002 1.05 s (timeline) · controller-pacing3-20261030-0003 1.05 s (timeline) · controller-pacing3-20261030-0004 1.05 s (timeline) · controller-pacing3-20261030-0005 1.05 s (timeline) · controller-pacing3-20261030-0006 1.05 s (timeline) · controller-pacing3-20261030-0007 1.05 s (timeline) · controller-pacing3-20261030-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1441&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-c75d7825/ai_flow_live.html?bench=1441&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1441`); it opens the seed that parts earliest, and the dropdowns choose another.

