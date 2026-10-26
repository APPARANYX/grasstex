# Benchmark run #1400 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/tactical-contact-route-graph-20261026 @ 3193dec · [run](https://github.com/APPARANYX/grasstex/actions/runs/40338840092) · build v29-dev

## Verdict

**WEAK: 14 of 14 pairs changed (median first part 334.05 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +3.1% (p 1)**

- Under 0.05 only: recon.cancelled 78 to 72 (-7.7%, p 0.0313).

## Paired comparison (off against on)

- **14** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.094 (gate 1.25)
- the 5 changed records first part at simulated second: min 334.05, p10 334.05, median 334.05, p90 334.05, max 334.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 223 | 230 | 0.5 | 3 | 2 | 1 | 1 |
| `usKills` | 115 | 120 | 0.3571 | 3 | 2 | 1 | 1 |
| `geKills` | 108 | 110 | 0.1429 | 2 | 2 | 0 | 0.5 |
| `fire.total` | 261 | 293 | 2.2857 | 2 | 1 | 1 | 1 |
| `fire.hits` | 115 | 125 | 0.7143 | 2 | 1 | 1 | 1 |
| `retreatSamples` | 1352 | 1364 | 0.8571 | 2 | 1 | 1 | 1 |
| `movementResolver.changes` | 9463 | 9232 | -16.5 | 5 | 1 | 4 | 0.375 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 1 | 0.0714 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 19 | 20 | 0.0714 | 1 | 1 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 13 | 10 | -0.2143 | 3 | 0 | 3 | 0.25 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 1 | 0.0714 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 3 | 0.2143 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 1 | 0.0714 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 3 | 0.2143 | 1 | 1 | 0 | 1 |
| `recon.orders` | 221 | 218 | -0.2143 | 8 | 2 | 6 | 0.2891 |
| `recon.contacts` | 14 | 10 | -0.2857 | 4 | 0 | 4 | 0.125 |
| `recon.noContact` | 62 | 66 | 0.2857 | 3 | 3 | 0 | 0.25 |
| `recon.timeouts` | 41 | 41 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 78 | 72 | -0.4286 | 6 | 0 | 6 | 0.0313 |
| `recon.reportsDelivered` | 80 | 64 | -1.1429 | 4 | 0 | 4 | 0.125 |
| `recon.retriggerBlocked` | 98 | 97 | -0.0714 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 1271.2 | 1267.7000000000003 | -0.25 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.p10Overall` | 1142.6 | 1141.1 | -0.1071 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1158.8999999999999 | 1157.0999999999997 | -0.1286 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanMovement` | 1365.4 | 1359.6999999999998 | -0.4071 | 4 | 0 | 4 | 0.125 |
| `squadPerformance.meanControl` | 1384.7 | 1384.1000000000001 | -0.0429 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanCohesion` | 1249.3 | 1242.1000000000001 | -0.5143 | 4 | 1 | 3 | 0.625 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

phase-c-natural-20261012-0002 334.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1400&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactical-contact-route-graph-20261026/ai_flow_live.html?bench=1400&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1400`); it opens the seed that parts earliest, and the dropdowns choose another.

