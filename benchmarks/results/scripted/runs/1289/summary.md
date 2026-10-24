# Benchmark run #1289 · 100 seeds from `cleared-20261024-g` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&squadCleared=1`
- work/squad-cleared-20261024 @ 0b99876 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40058416982) · build v29-dev

## Verdict

**QUIET: 2 of 100 pairs changed (median first part 313.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **98** · runtime errors off 0 / on 0 · wall time on/off x0.993 (gate 1.25)
- the 1 changed records first part at simulated second: min 313.05, p10 313.05, median 313.05, p90 313.05, max 313.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4671 | 4671 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2035 | 2021 | -0.14 | 1 | 0 | 1 | 1 |
| `geKills` | 2636 | 2650 | 0.14 | 1 | 1 | 0 | 1 |
| `fire.total` | 35291 | 35295 | 0.04 | 1 | 1 | 0 | 1 |
| `fire.hits` | 8502 | 8501 | -0.01 | 1 | 0 | 1 | 1 |
| `retreatSamples` | 185173 | 185169 | -0.04 | 1 | 0 | 1 | 1 |
| `movementResolver.changes` | 225368 | 224996 | -3.72 | 1 | 0 | 1 | 1 |
| `grenades.throws` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 204 | 204 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 630 | 630 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 411 | 408 | -0.03 | 1 | 0 | 1 | 1 |
| `stallOutcomes.wakes` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1998 | 1987 | -0.11 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 204 | 202 | -0.02 | 1 | 0 | 1 | 1 |
| `recon.noContact` | 1198 | 1196 | -0.02 | 1 | 0 | 1 | 1 |
| `recon.timeouts` | 101 | 101 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 421 | 417 | -0.04 | 1 | 0 | 1 | 1 |
| `recon.reportsDelivered` | 756 | 752 | -0.04 | 1 | 0 | 1 | 1 |
| `recon.retriggerBlocked` | 1199 | 1194 | -0.05 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 8396.000000000002 | 8396.600000000002 | 0.006 | 1 | 1 | 0 | 1 |
| `squadPerformance.p10Overall` | 7670.7000000000035 | 7672.800000000004 | 0.021 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7149.199999999999 | 7150.299999999998 | 0.011 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMovement` | 9984.599999999991 | 9984.599999999991 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 9650.9 | 9651.3 | 0.004 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 8895.6 | 8895.699999999999 | 0.001 | 1 | 1 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

cleared-20261024-g-0044 313.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1289&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-cleared-20261024/ai_flow_live.html?bench=1289&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1289`); it opens the seed that parts earliest, and the dropdowns choose another.

