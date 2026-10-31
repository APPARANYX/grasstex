# Benchmark run #1523 · 60 seeds from `nse-c` (meeting), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&navStationExit=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/nse-c4a65b24 @ c4a65b2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41243536093) · build v29-dev

## Verdict

**QUIET: 10 of 60 pairs changed (median first part 278.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **50** · runtime errors off 0 / on 0 · wall time on/off x1.002 (gate 1.25)
- the 5 changed records first part at simulated second: min 235.05, p10 235.05, median 278.1, p90 442.05, max 442.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2373 | 2374 | 0.0167 | 3 | 2 | 1 | 1 |
| `usKills` | 1084 | 1083 | -0.0167 | 2 | 1 | 1 | 1 |
| `geKills` | 1289 | 1291 | 0.0333 | 3 | 2 | 1 | 1 |
| `fire.total` | 59809 | 60605 | 13.2667 | 4 | 4 | 0 | 0.125 |
| `fire.hits` | 5449 | 5471 | 0.3667 | 4 | 3 | 1 | 0.625 |
| `retreatSamples` | 128058 | 127022 | -17.2667 | 4 | 0 | 4 | 0.125 |
| `movementResolver.changes` | 288677 | 288957 | 4.6667 | 4 | 3 | 1 | 0.625 |
| `grenades.throws` | 51 | 51 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 51 | 51 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 31 | 30 | -0.0167 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 61 | 63 | 0.0333 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 16 | 17 | 0.0167 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 319 | 313 | -0.1 | 4 | 1 | 3 | 0.625 |
| `loopAlerts.length` | 958 | 955 | -0.05 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 284 | 280 | -0.0667 | 4 | 2 | 2 | 1 |
| `stallOutcomes.wakes` | 8 | 7 | -0.0167 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1889 | 1898 | 0.15 | 4 | 2 | 2 | 1 |
| `recon.contacts` | 138 | 139 | 0.0167 | 3 | 2 | 1 | 1 |
| `recon.noContact` | 924 | 921 | -0.05 | 4 | 2 | 2 | 1 |
| `recon.timeouts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 743 | 757 | 0.2333 | 3 | 2 | 1 | 1 |
| `recon.reportsDelivered` | 755 | 757 | 0.0333 | 3 | 1 | 2 | 1 |
| `recon.retriggerBlocked` | 1501 | 1507 | 0.1 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.meanOverall` | 4775.0999999999985 | 4775.999999999998 | 0.015 | 4 | 2 | 2 | 1 |
| `squadPerformance.p10Overall` | 4469.8 | 4471.6 | 0.03 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3561.7999999999997 | 3562.4 | 0.01 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanMovement` | 5982.9000000000015 | 5982.6 | -0.005 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanControl` | 5626.200000000002 | 5625.100000000002 | -0.0183 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.meanCohesion` | 5565.6 | 5568.6 | 0.05 | 4 | 3 | 1 | 0.625 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 5 seeds that part earliest (simulated seconds)

nse-c-0009 235.05 s (timeline) · nse-c-0047 259.05 s (timeline) · nse-c-0042 278.1 s (timeline) · nse-c-0050 331.05 s (timeline) · nse-c-0005 442.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1523&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-nse-c4a65b24/ai_flow_live.html?bench=1523&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1523`); it opens the seed that parts earliest, and the dropdowns choose another.

