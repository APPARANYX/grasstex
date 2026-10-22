# Benchmark run #1224 · 100 seeds from `contact-prone-support-20261021` (meeting), windows `0+600`

- **OFF** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&firingCover=25` · **ON** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&firingCover=40`
- work/squad-firing-positions-20261021 @ 81cbcfd · [run](https://github.com/APPARANYX/grasstex/actions/runs/39705200154) · build v29-dev

## Verdict

**INERT: all 100 pairs identical in every field**


## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **100** · runtime errors off 0 / on 0 · wall time on/off x0.97 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3252 | 3252 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1760 | 1760 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1492 | 1492 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 15201 | 15201 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 6715 | 6715 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 94343 | 94343 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 132239 | 132239 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 47 | 47 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 115 | 115 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 43 | 43 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 140 | 140 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 323 | 323 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 983 | 983 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 169 | 169 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1976 | 1976 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1976 | 1976 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1730 | 1730 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 132 | 132 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 392 | 392 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 504 | 504 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 603 | 603 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 547 | 547 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 920 | 920 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8547.800000000001 | 8547.800000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 7498.500000000002 | 7498.500000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7117.399999999999 | 7117.399999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 9793.600000000004 | 9793.600000000004 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 9521.9 | 9521.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 9680.9 | 9680.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

contact-prone-support-20261021-0001 (identical) · contact-prone-support-20261021-0002 (identical) · contact-prone-support-20261021-0003 (identical) · contact-prone-support-20261021-0004 (identical) · contact-prone-support-20261021-0005 (identical) · contact-prone-support-20261021-0006 (identical) · contact-prone-support-20261021-0007 (identical) · contact-prone-support-20261021-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1224&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-firing-positions-20261021/ai_flow_live.html?bench=1224&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1224`); it opens the seed that parts earliest, and the dropdowns choose another.

