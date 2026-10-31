# Benchmark run #1470 · 60 seeds from `pr698-sw` (us-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&supportWait=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- claude/project-thread-jxet0c @ 58bef7c · [run](https://github.com/APPARANYX/grasstex/actions/runs/41189547350) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2207 | 2207 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1016 | 1016 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1191 | 1191 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 55804 | 55804 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 4844 | 4844 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 146374 | 146374 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 203946 | 203946 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 54 | 54 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 53 | 53 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 41 | 41 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 91 | 91 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 90 | 90 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 900 | 900 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 237 | 237 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2659 | 2659 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 599 | 599 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 694 | 694 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1294 | 1294 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 2506 | 2506 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 805 | 805 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4893.299999999999 | 4893.299999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4543.299999999999 | 4543.299999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3797.400000000001 | 3797.400000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5991.699999999999 | 5991.699999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5748.8 | 5748.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5584.599999999999 | 5584.599999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr698-sw-0001 (identical) · pr698-sw-0002 (identical) · pr698-sw-0003 (identical) · pr698-sw-0004 (identical) · pr698-sw-0005 (identical) · pr698-sw-0006 (identical) · pr698-sw-0007 (identical) · pr698-sw-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1470&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1470`); it opens the seed that parts earliest, and the dropdowns choose another.

