# Benchmark run #1023 · scripted scenario `live-mvfk4j06-117yk` (meeting), windows `contact+60,every60`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1`
- claude/strategic-preview-hye9fi @ dae631a · [run](https://github.com/APPARANYX/grasstex/actions/runs/39301246449) · build v29-dev

## Verdict

**INERT: all 6 pairs identical in every field**


## Paired comparison (off against on)

- **6** pairs (unpaired: off 0, on 0) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x1.008 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 58 | 58 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 114 | 114 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 4532 | 4532 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 28 | 28 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 542.6 | 542.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 474.6 | 474.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 512.2 | 512.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 549.7 | 549.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 574.3000000000001 | 574.3000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 542.4 | 542.4 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

live-mvfk4j06-117yk (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1023&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1023`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

