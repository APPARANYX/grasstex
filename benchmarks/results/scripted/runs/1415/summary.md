# Benchmark run #1415 · 60 seeds from `pr683-gate-20261029` (meeting), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pr683-f845a2d6 @ f845a2d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40944250654) · build v29-dev

## Verdict

**MOVED: 60 of 60 pairs changed (median first part 1.05 s); 21 of 42 counters under p 0.05 (about 2.1 by chance), 14 under 0.0012; casualties +16.2% (p 0.0032)**

- Clears the Bonferroni line (p < 0.0012): fire.total 7049 to 18438 (+161.6%, p 0); movementResolver.changes 123258 to 70440 (-42.9%, p 0); loopAlerts.length 162 to 782 (+382.7%, p 0); regroups.entries 96 to 0 (-100.0%, p 0); recon.orders 1213 to 147 (-87.9%, p 0); recon.contacts 55 to 0 (-100.0%, p 0); recon.noContact 834 to 0 (-100.0%, p 0); recon.cancelled 304 to 147 (-51.6%, p 0); recon.reportsDelivered 220 to 0 (-100.0%, p 0); recon.retriggerBlocked 991 to 0 (-100.0%, p 0); squadPerformance.meanOverall 5142.399999999997 to 4859.1 (-5.5%, p 0); squadPerformance.meanControl 5829.099999999999 to 5462 (-6.3%, p 0); squadPerformance.meanCohesion 5335.7 to 4184.100000000001 (-21.6%, p 0); vacantObjectiveStalls.length 17 to 45 (+164.7%, p 0.0002).
- Under 0.05 only: retreatSamples 8327 to 10709 (+28.6%, p 0.0015); squadPerformance.p10Overall 4603.2 to 4480.3 (-2.7%, p 0.0015); casualties 1549 to 1800 (+16.2%, p 0.0032); geKills 814 to 1042 (+28.0%, p 0.0105); fire.hits 3023 to 3443 (+13.9%, p 0.0119); squadPerformance.meanMovement 5939 to 5937.699999999999 (-0.0%, p 0.0145); squadPerformance.meanMission 4493.600000000001 to 4351.2 (-3.2%, p 0.0273).
- Wall time on/off x1.58 is over the 1.25 gate.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.58 (gate 1.25)
- the 60 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1549 | 1800 | 4.1833 | 57 | 40 | 17 | 0.0032 |
| `usKills` | 735 | 758 | 0.3833 | 57 | 30 | 27 | 0.7914 |
| `geKills` | 814 | 1042 | 3.8 | 56 | 38 | 18 | 0.0105 |
| `fire.total` | 7049 | 18438 | 189.8167 | 60 | 58 | 2 | 0 |
| `fire.hits` | 3023 | 3443 | 7 | 58 | 39 | 19 | 0.0119 |
| `retreatSamples` | 8327 | 10709 | 39.7 | 59 | 42 | 17 | 0.0015 |
| `movementResolver.changes` | 123258 | 70440 | -880.3 | 60 | 0 | 60 | 0 |
| `grenades.throws` | 8 | 7 | -0.0167 | 6 | 4 | 2 | 0.6875 |
| `grenades.bursts` | 8 | 7 | -0.0167 | 6 | 4 | 2 | 0.6875 |
| `grenades.wounded` | 8 | 3 | -0.0833 | 4 | 2 | 2 | 1 |
| `grenades.casualties` | 3 | 1 | -0.0333 | 3 | 1 | 2 | 1 |
| `grenades.suppressed` | 14 | 5 | -0.15 | 5 | 3 | 2 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 3 | 0.0333 | 4 | 3 | 1 | 0.625 |
| `movementStalls.length` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 17 | 45 | 0.4667 | 25 | 22 | 3 | 0.0002 |
| `loopAlerts.length` | 162 | 782 | 10.3333 | 59 | 57 | 2 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 96 | 0 | -1.6 | 43 | 0 | 43 | 0 |
| `stallOutcomes.wakes` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1213 | 147 | -17.7667 | 60 | 0 | 60 | 0 |
| `recon.contacts` | 55 | 0 | -0.9167 | 39 | 0 | 39 | 0 |
| `recon.noContact` | 834 | 0 | -13.9 | 60 | 0 | 60 | 0 |
| `recon.timeouts` | 5 | 0 | -0.0833 | 5 | 0 | 5 | 0.0625 |
| `recon.cancelled` | 304 | 147 | -2.6167 | 57 | 6 | 51 | 0 |
| `recon.reportsDelivered` | 220 | 0 | -3.6667 | 30 | 0 | 30 | 0 |
| `recon.retriggerBlocked` | 991 | 0 | -16.5167 | 60 | 0 | 60 | 0 |
| `squadPerformance.meanOverall` | 5142.399999999997 | 4859.1 | -4.7217 | 60 | 1 | 59 | 0 |
| `squadPerformance.p10Overall` | 4603.2 | 4480.3 | -2.0483 | 54 | 15 | 39 | 0.0015 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4493.600000000001 | 4351.2 | -2.3733 | 60 | 21 | 39 | 0.0273 |
| `squadPerformance.meanMovement` | 5939 | 5937.699999999999 | -0.0217 | 55 | 18 | 37 | 0.0145 |
| `squadPerformance.meanControl` | 5829.099999999999 | 5462 | -6.1183 | 60 | 2 | 58 | 0 |
| `squadPerformance.meanCohesion` | 5335.7 | 4184.100000000001 | -19.1933 | 60 | 0 | 60 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr683-gate-20261029-0001 1.05 s (timeline) · pr683-gate-20261029-0002 1.05 s (timeline) · pr683-gate-20261029-0003 1.05 s (timeline) · pr683-gate-20261029-0004 1.05 s (timeline) · pr683-gate-20261029-0005 1.05 s (timeline) · pr683-gate-20261029-0006 1.05 s (timeline) · pr683-gate-20261029-0007 1.05 s (timeline) · pr683-gate-20261029-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1415&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pr683-f845a2d6/ai_flow_live.html?bench=1415&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1415`); it opens the seed that parts earliest, and the dropdowns choose another.

