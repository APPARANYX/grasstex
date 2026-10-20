# Benchmark run #1057 · 3 seeds from `audit-transport-reads-20261020` (meeting), windows `0+600`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ 43248a3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39517113159) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x1.02 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 123 | 123 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 65 | 65 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 58 | 58 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 590 | 590 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 257 | 257 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 4460 | 4460 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 4099 | 4099 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 63 | 63 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 63 | 63 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 51 | 51 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 245.6 | 245.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 220.4 | 220.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 185.1 | 185.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 293 | 293 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 290.8 | 290.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 289.4 | 289.4 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

audit-transport-reads-20261020-0001 (identical) · audit-transport-reads-20261020-0002 (identical) · audit-transport-reads-20261020-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1057&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1057`); it opens the seed that parts earliest, and the dropdowns choose another.

