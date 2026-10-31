# Benchmark run #1508 · 60 seeds from `c701` (meeting), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerGunner=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c701-168cf070 @ 168cf07 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41237454153) · build v29-dev

## Verdict

**MOVED: 52 of 60 pairs changed (median first part 230.025 s); 1 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties +2.1% (p 0.8746)**

- Clears the Bonferroni line (p < 0.0012): fire.total 24749 to 29373 (+18.7%, p 0).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **8** · runtime errors off 0 / on 0 · wall time on/off x0.96 (gate 1.25)
- the 46 changed records first part at simulated second: min 172.05, p10 191.1, median 230.025, p90 262.05, max 310.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 993 | 1014 | 0.35 | 40 | 21 | 19 | 0.8746 |
| `usKills` | 434 | 448 | 0.2333 | 40 | 21 | 19 | 0.8746 |
| `geKills` | 559 | 566 | 0.1167 | 39 | 19 | 20 | 1 |
| `fire.total` | 24749 | 29373 | 77.0667 | 46 | 41 | 5 | 0 |
| `fire.hits` | 2241 | 2292 | 0.85 | 42 | 22 | 20 | 0.8776 |
| `retreatSamples` | 6497 | 6407 | -1.5 | 44 | 22 | 22 | 1 |
| `movementResolver.changes` | 202247 | 202926 | 11.3167 | 46 | 23 | 23 | 1 |
| `grenades.throws` | 22 | 19 | -0.05 | 5 | 2 | 3 | 1 |
| `grenades.bursts` | 17 | 14 | -0.05 | 5 | 2 | 3 | 1 |
| `grenades.wounded` | 16 | 12 | -0.0667 | 2 | 0 | 2 | 0.5 |
| `grenades.casualties` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 31 | 21 | -0.1667 | 2 | 0 | 2 | 0.5 |
| `grenades.friendlyWounded` | 3 | 2 | -0.0167 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 3 | 2 | -0.0167 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 11 | 11 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 765 | 743 | -0.3667 | 26 | 10 | 16 | 0.3269 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 42 | 42 | 0 | 19 | 8 | 11 | 0.6476 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 90 | 97 | 0.1167 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 90 | 97 | 0.1167 | 1 | 1 | 0 | 1 |
| `recon.orders` | 1277 | 1269 | -0.1333 | 23 | 11 | 12 | 1 |
| `recon.contacts` | 61 | 64 | 0.05 | 12 | 7 | 5 | 0.7744 |
| `recon.noContact` | 717 | 715 | -0.0333 | 5 | 2 | 3 | 1 |
| `recon.timeouts` | 2 | 3 | 0.0167 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 484 | 472 | -0.2 | 26 | 10 | 16 | 0.3269 |
| `recon.reportsDelivered` | 333 | 365 | 0.5333 | 15 | 10 | 5 | 0.3018 |
| `recon.retriggerBlocked` | 1075 | 1071 | -0.0667 | 18 | 7 | 11 | 0.4807 |
| `squadPerformance.meanOverall` | 5056.099999999999 | 5063.099999999999 | 0.1167 | 43 | 22 | 21 | 1 |
| `squadPerformance.p10Overall` | 4629.4000000000015 | 4641.900000000001 | 0.2083 | 37 | 19 | 18 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4318.500000000001 | 4314.599999999998 | -0.065 | 43 | 23 | 20 | 0.7608 |
| `squadPerformance.meanMovement` | 5922.2 | 5921.800000000001 | -0.0067 | 45 | 24 | 21 | 0.766 |
| `squadPerformance.meanControl` | 5524.399999999998 | 5532.699999999999 | 0.1383 | 44 | 26 | 18 | 0.2912 |
| `squadPerformance.meanCohesion` | 5391.599999999999 | 5414.5999999999985 | 0.3833 | 44 | 28 | 16 | 0.0961 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c701-0018 172.05 s (timeline) · c701-0029 173.1 s (timeline) · c701-0047 179.1 s (stress) · c701-0037 185.1 s (timeline) · c701-0030 191.1 s (stress) · c701-0010 195 s (timeline) · c701-0025 196.05 s (timeline) · c701-0041 198 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1508&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c701-168cf070/ai_flow_live.html?bench=1508&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1508`); it opens the seed that parts earliest, and the dropdowns choose another.

