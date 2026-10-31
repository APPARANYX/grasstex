# Benchmark run #1506 · 60 seeds from `ncs-l` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&navCornerStand=0` · **ON** flags: `strategicInterception=0`
- work/pin/ncs-7e1ed1e1 @ 7e1ed1e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41234066678) · build v29-dev

## Verdict

**QUIET: 13 of 60 pairs changed (median first part 300 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.7% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **47** · runtime errors off 0 / on 0 · wall time on/off x0.993 (gate 1.25)
- the 9 changed records first part at simulated second: min 175.05, p10 175.05, median 300, p90 474, max 474

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2674 | 2692 | 0.3 | 7 | 4 | 3 | 1 |
| `usKills` | 1188 | 1210 | 0.3667 | 6 | 4 | 2 | 0.6875 |
| `geKills` | 1486 | 1482 | -0.0667 | 7 | 4 | 3 | 1 |
| `fire.total` | 42064 | 42219 | 2.5833 | 7 | 5 | 2 | 0.4531 |
| `fire.hits` | 6130 | 6127 | -0.05 | 7 | 4 | 3 | 1 |
| `retreatSamples` | 104077 | 104351 | 4.5667 | 7 | 3 | 4 | 1 |
| `movementResolver.changes` | 217590 | 217443 | -2.45 | 7 | 3 | 4 | 1 |
| `grenades.throws` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 48 | 48 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 90 | 90 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 4 | 0 | -0.0667 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 273 | 277 | 0.0667 | 5 | 3 | 2 | 1 |
| `loopAlerts.length` | 703 | 720 | 0.2833 | 6 | 5 | 1 | 0.2188 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 237 | 242 | 0.0833 | 4 | 3 | 1 | 0.625 |
| `stallOutcomes.wakes` | 11 | 9 | -0.0333 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 6 | 0 | -0.1 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 367 | 0 | -6.1167 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 6 | 0 | -0.1 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 367 | 0 | -6.1167 | 1 | 0 | 1 | 1 |
| `recon.orders` | 1770 | 1781 | 0.1833 | 7 | 6 | 1 | 0.125 |
| `recon.contacts` | 92 | 94 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `recon.noContact` | 1127 | 1123 | -0.0667 | 5 | 1 | 4 | 0.375 |
| `recon.timeouts` | 20 | 21 | 0.0167 | 2 | 1 | 1 | 1 |
| `recon.cancelled` | 466 | 478 | 0.2 | 5 | 5 | 0 | 0.0625 |
| `recon.reportsDelivered` | 409 | 409 | 0 | 6 | 3 | 3 | 1 |
| `recon.retriggerBlocked` | 1367 | 1372 | 0.0833 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.meanOverall` | 4809.199999999998 | 4806.199999999997 | -0.05 | 7 | 2 | 5 | 0.4531 |
| `squadPerformance.p10Overall` | 4484.799999999999 | 4483.9 | -0.015 | 2 | 1 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3730.9 | 3732.5000000000005 | 0.0267 | 6 | 3 | 3 | 1 |
| `squadPerformance.meanMovement` | 5983.200000000002 | 5985.300000000001 | 0.035 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanControl` | 5621.700000000003 | 5617.9000000000015 | -0.0633 | 7 | 2 | 5 | 0.4531 |
| `squadPerformance.meanCohesion` | 5466.200000000001 | 5462.9 | -0.055 | 7 | 2 | 5 | 0.4531 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

ncs-l-0021 175.05 s (timeline) · ncs-l-0027 185.1 s (timeline) · ncs-l-0035 198 s (timeline) · ncs-l-0002 289.05 s (stress) · ncs-l-0004 300 s (timeline) · ncs-l-0051 302.1 s (timeline) · ncs-l-0018 352.05 s (timeline) · ncs-l-0042 392.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1506&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-ncs-7e1ed1e1/ai_flow_live.html?bench=1506&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1506`); it opens the seed that parts earliest, and the dropdowns choose another.

