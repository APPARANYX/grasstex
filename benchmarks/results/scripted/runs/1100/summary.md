# Benchmark run #1100 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/issue-602-ai-skills-squad @ a140743 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39597105392) · build v29-dev

## Verdict

**WEAK: 20 of 20 pairs changed (median first part 334.05 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +2.2% (p 1)**

- Under 0.05 only: recon.cancelled 95 to 89 (-6.3%, p 0.0313).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.051 (gate 1.25)
- the 5 changed records first part at simulated second: min 334.05, p10 334.05, median 334.05, p90 334.05, max 334.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 316 | 323 | 0.35 | 3 | 2 | 1 | 1 |
| `usKills` | 191 | 196 | 0.25 | 3 | 2 | 1 | 1 |
| `geKills` | 125 | 127 | 0.1 | 2 | 2 | 0 | 0.5 |
| `fire.total` | 513 | 545 | 1.6 | 2 | 1 | 1 | 1 |
| `fire.hits` | 221 | 231 | 0.5 | 2 | 1 | 1 | 1 |
| `retreatSamples` | 2713 | 2725 | 0.6 | 2 | 1 | 1 | 1 |
| `movementResolver.changes` | 13999 | 13768 | -11.55 | 5 | 1 | 4 | 0.375 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 1 | 0.05 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 31 | 32 | 0.05 | 1 | 1 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 15 | 12 | -0.15 | 3 | 0 | 3 | 0.25 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 1 | 0.05 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 3 | 0.15 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 1 | 0.05 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 3 | 0.15 | 1 | 1 | 0 | 1 |
| `recon.orders` | 301 | 298 | -0.15 | 8 | 2 | 6 | 0.2891 |
| `recon.contacts` | 19 | 15 | -0.2 | 4 | 0 | 4 | 0.125 |
| `recon.noContact` | 84 | 88 | 0.2 | 3 | 3 | 0 | 0.25 |
| `recon.timeouts` | 64 | 64 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 95 | 89 | -0.3 | 6 | 0 | 6 | 0.0313 |
| `recon.reportsDelivered` | 120 | 104 | -0.8 | 4 | 0 | 4 | 0.125 |
| `recon.retriggerBlocked` | 147 | 146 | -0.05 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 1794.8999999999999 | 1791.4 | -0.175 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.p10Overall` | 1614.6999999999998 | 1613.1999999999998 | -0.075 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1586.5000000000002 | 1584.7 | -0.09 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanMovement` | 1955 | 1949.2999999999997 | -0.285 | 4 | 0 | 4 | 0.125 |
| `squadPerformance.meanControl` | 1978.8999999999999 | 1978.3 | -0.03 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanCohesion` | 1802.8 | 1795.6000000000001 | -0.36 | 4 | 1 | 3 | 0.625 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

phase-c-natural-20261012-0002 334.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1100&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue-602-ai-skills-squad/ai_flow_live.html?bench=1100&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1100`); it opens the seed that parts earliest, and the dropdowns choose another.

