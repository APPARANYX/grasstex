# Benchmark run #1477 · 60 seeds from `controller-fin-20261031` (ge-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0&tacticalController=new&rosterKeep=0&noHopStall=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/final662-31f9d9e5 @ 31f9d9e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41190284120) · build v29-dev

## Verdict

**WEAK: 52 of 52 pairs changed (median first part 172.05 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.8% (p 0.2327)**

- Under 0.05 only: loopAlerts.length 460 to 373 (-18.9%, p 0.0019); squadPerformance.meanControl 4913.799999999999 to 4959.6 (+0.9%, p 0.0046); recon.orders 1195 to 1244 (+4.1%, p 0.0436).

## Paired comparison (off against on)

- **52** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.971 (gate 1.25)
- the 52 changed records first part at simulated second: min 115.05, p10 135, median 172.05, p90 212.1, max 298.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 753 | 759 | 0.1154 | 45 | 27 | 18 | 0.2327 |
| `usKills` | 289 | 307 | 0.3462 | 42 | 24 | 18 | 0.4408 |
| `geKills` | 464 | 452 | -0.2308 | 47 | 24 | 23 | 1 |
| `fire.total` | 18668 | 17542 | -21.6538 | 52 | 22 | 30 | 0.3317 |
| `fire.hits` | 1750 | 1585 | -3.1731 | 50 | 23 | 27 | 0.6718 |
| `retreatSamples` | 4644 | 4412 | -4.4615 | 47 | 17 | 30 | 0.0789 |
| `movementResolver.changes` | 92728 | 90737 | -38.2885 | 52 | 21 | 31 | 0.2116 |
| `grenades.throws` | 20 | 20 | 0 | 4 | 1 | 3 | 0.625 |
| `grenades.bursts` | 19 | 18 | -0.0192 | 3 | 1 | 2 | 1 |
| `grenades.wounded` | 12 | 9 | -0.0577 | 4 | 2 | 2 | 1 |
| `grenades.casualties` | 4 | 4 | 0 | 4 | 3 | 1 | 0.625 |
| `grenades.suppressed` | 49 | 58 | 0.1731 | 4 | 3 | 1 | 0.625 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 7 | 4 | -0.0577 | 2 | 0 | 2 | 0.5 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 0 | -0.0192 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 460 | 373 | -1.6731 | 43 | 11 | 32 | 0.0019 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 147 | 157 | 0.1923 | 33 | 18 | 15 | 0.7283 |
| `stallOutcomes.wakes` | 45 | 45 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1195 | 1244 | 0.9423 | 42 | 28 | 14 | 0.0436 |
| `recon.contacts` | 168 | 192 | 0.4615 | 35 | 23 | 12 | 0.0895 |
| `recon.noContact` | 316 | 322 | 0.1154 | 14 | 10 | 4 | 0.1796 |
| `recon.timeouts` | 28 | 25 | -0.0577 | 3 | 0 | 3 | 0.25 |
| `recon.cancelled` | 637 | 657 | 0.3846 | 40 | 24 | 16 | 0.2682 |
| `recon.reportsDelivered` | 739 | 870 | 2.5192 | 37 | 22 | 15 | 0.324 |
| `recon.retriggerBlocked` | 430 | 426 | -0.0769 | 24 | 11 | 13 | 0.8388 |
| `squadPerformance.meanOverall` | 4529.299999999998 | 4538.400000000001 | 0.175 | 49 | 29 | 20 | 0.2529 |
| `squadPerformance.p10Overall` | 4123.000000000001 | 4114.299999999999 | -0.1673 | 45 | 24 | 21 | 0.766 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4071.299999999999 | 4068.3999999999996 | -0.0558 | 48 | 26 | 22 | 0.6655 |
| `squadPerformance.meanMovement` | 5174.299999999999 | 5174.100000000001 | -0.0038 | 41 | 22 | 19 | 0.7552 |
| `squadPerformance.meanControl` | 4913.799999999999 | 4959.6 | 0.8808 | 51 | 36 | 15 | 0.0046 |
| `squadPerformance.meanCohesion` | 4594.3 | 4575.499999999999 | -0.3615 | 49 | 25 | 24 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-fin-20261031-0026 115.05 s (timeline) · controller-fin-20261031-0022 127.05 s (timeline) · controller-fin-20261031-0036 128.1 s (timeline) · controller-fin-20261031-0004 130.05 s (timeline) · controller-fin-20261031-0014 132 s (timeline) · controller-fin-20261031-0028 135 s (timeline) · controller-fin-20261031-0001 138 s (timeline) · controller-fin-20261031-0037 140.1 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1477&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-final662-31f9d9e5/ai_flow_live.html?bench=1477&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1477`); it opens the seed that parts earliest, and the dropdowns choose another.

