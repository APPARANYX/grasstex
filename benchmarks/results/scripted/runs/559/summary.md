# Benchmark run #559 · 2 seeds from `phase-a-control` (meeting), windows `contact+120`

- **OFF** flags: `localPlan=1&coveredBounds=0` · **ON** flags: `localPlan=1&coveredBounds=1`
- work/tactics-c-covered-bounds @ a713813 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38166561659) · build v29-dev

## Verdict

**QUIET: 2 of 2 pairs changed (median first part 275.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.956 (gate 1.25)
- the 1 changed records first part at simulated second: min 275.1, p10 275.1, median 275.1, p90 275.1, max 275.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 65 | 65 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 34 | 34 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 376 | 376 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 154 | 154 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 224 | 224 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 4763 | 4760 | -1.5 | 1 | 0 | 1 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 35 | 35 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 169.2 | 169.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 148.5 | 148.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 145.9 | 145.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 197.60000000000002 | 197.60000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 190.2 | 190.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 179.4 | 179.2 | -0.1 | 1 | 0 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

phase-a-control-0001 275.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=559&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactics-c-covered-bounds/ai_flow_live.html?bench=559&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=559`); it opens the seed that parts earliest, and the dropdowns choose another.

