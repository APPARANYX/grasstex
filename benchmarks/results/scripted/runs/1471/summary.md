# Benchmark run #1471 · 60 seeds from `pr698-sw` (ge-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&supportWait=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- claude/project-thread-jxet0c @ 58bef7c · [run](https://github.com/APPARANYX/grasstex/actions/runs/41189569316) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x1.015 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2251 | 2251 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1016 | 1016 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1235 | 1235 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 51184 | 51184 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 5033 | 5033 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 132768 | 132768 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 189168 | 189168 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 55 | 55 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 55 | 55 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 77 | 77 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 96 | 96 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 881 | 881 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 213 | 213 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2841 | 2841 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 653 | 653 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 604 | 604 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 34 | 34 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1501 | 1501 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 2746 | 2746 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 822 | 822 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4924.799999999997 | 4924.799999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4559.2 | 4559.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3932.699999999999 | 3932.699999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5991.499999999999 | 5991.499999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5724.199999999999 | 5724.199999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5519.6 | 5519.6 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr698-sw-0001 (identical) · pr698-sw-0002 (identical) · pr698-sw-0003 (identical) · pr698-sw-0004 (identical) · pr698-sw-0005 (identical) · pr698-sw-0006 (identical) · pr698-sw-0007 (identical) · pr698-sw-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1471&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1471`); it opens the seed that parts earliest, and the dropdowns choose another.

