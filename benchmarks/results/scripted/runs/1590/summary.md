# Benchmark run #1590 · 3 seeds from `meso706-transport-20261101` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1` · **ON** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1&tacticalController=new`
- work/controller-meso-wrap-20261101 @ 2e4086d · [run](https://github.com/APPARANYX/grasstex/actions/runs/41312028700) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 0.15 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -35.3% (p 0.25)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x1.357 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.357 (gate 1.25)
- the 3 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 102 | 66 | -12 | 3 | 0 | 3 | 0.25 |
| `usKills` | 63 | 24 | -13 | 3 | 1 | 2 | 1 |
| `geKills` | 39 | 42 | 1 | 3 | 2 | 1 | 1 |
| `fire.total` | 1009 | 1699 | 230 | 3 | 3 | 0 | 0.25 |
| `fire.hits` | 242 | 144 | -32.6667 | 3 | 0 | 3 | 0.25 |
| `retreatSamples` | 1639 | 2361 | 240.6667 | 3 | 3 | 0 | 0.25 |
| `movementResolver.changes` | 4339 | 5659 | 440 | 3 | 3 | 0 | 0.25 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 5 | 0 | -1.6667 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 1 | 0 | -0.3333 | 1 | 0 | 1 | 1 |
| `vacantObjectiveStalls.length` | 8 | 7 | -0.3333 | 3 | 2 | 1 | 1 |
| `loopAlerts.length` | 34 | 55 | 7 | 3 | 2 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 3 | 12 | 3 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 8 | 1 | -2.3333 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 28 | 2 | -8.6667 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 8 | 1 | -2.3333 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 28 | 2 | -8.6667 | 2 | 1 | 1 | 1 |
| `recon.orders` | 58 | 77 | 6.3333 | 3 | 3 | 0 | 0.25 |
| `recon.contacts` | 7 | 12 | 1.6667 | 2 | 2 | 0 | 0.5 |
| `recon.noContact` | 8 | 16 | 2.6667 | 3 | 3 | 0 | 0.25 |
| `recon.timeouts` | 16 | 14 | -0.6667 | 3 | 1 | 2 | 1 |
| `recon.cancelled` | 25 | 31 | 2 | 3 | 3 | 0 | 0.25 |
| `recon.reportsDelivered` | 11 | 48 | 12.3333 | 3 | 2 | 1 | 1 |
| `recon.retriggerBlocked` | 28 | 36 | 2.6667 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanOverall` | 260.1 | 254.70000000000002 | -1.8 | 3 | 1 | 2 | 1 |
| `squadPerformance.p10Overall` | 224.89999999999998 | 227.5 | 0.8667 | 2 | 1 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 227.70000000000002 | 215.6 | -4.0333 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanMovement` | 291.1 | 293.2 | 0.7 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanControl` | 280.8 | 273.6 | -2.4 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanCohesion` | 290.5 | 288.2 | -0.7667 | 3 | 1 | 2 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

meso706-transport-20261101-0001 0.15 s (timeline) · meso706-transport-20261101-0002 0.15 s (timeline) · meso706-transport-20261101-0003 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1590&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/controller-meso-wrap-20261101/ai_flow_live.html?bench=1590&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1590`); it opens the seed that parts earliest, and the dropdowns choose another.

