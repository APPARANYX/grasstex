# Benchmark run #581 · 2 seeds from `phase-a-control` (us-defend), windows `contact+120`

- **OFF** flags: `localPlan=1&localResources=1&coveredBounds=1&localDegrade=0` · **ON** flags: `localPlan=1&localResources=1&coveredBounds=1&localDegrade=1`
- work/tactics-c-leaderless-validity @ 8d96997 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38173938258) · build v29-dev

## Verdict

**QUIET: 1 of 2 pairs changed; 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.967 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 57 | 57 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 224 | 224 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 110 | 110 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 213 | 213 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 2691 | 2691 | 0 | 0 | 0 | 0 | 1 |
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
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 179.3 | 179.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 151.60000000000002 | 151.60000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 165.3 | 165.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 199.6 | 199.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 197.8 | 197.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 190.4 | 190.4 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-a-control-0001 (identical) · phase-a-control-0002 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=581&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactics-c-leaderless-validity/ai_flow_live.html?bench=581&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=581`); it opens the seed that parts earliest, and the dropdowns choose another.

