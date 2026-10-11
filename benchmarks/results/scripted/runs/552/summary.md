# Benchmark run #552 · 2 seeds from `phase-a-control` (us-defend), windows `contact+120`

- **OFF** flags: `localPlan=0` · **ON** flags: `localPlan=1`
- work/tactics-c1-situational-arbitration @ d73bf23 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38161505596) · build v29-dev

## Verdict

**QUIET: 2 of 2 pairs changed (median first part 183.075 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +11.8% (p 0.5)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.009 (gate 1.25)
- the 2 changed records first part at simulated second: min 172.05, p10 172.05, median 183.075, p90 194.1, max 194.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 51 | 57 | 3 | 2 | 2 | 0 | 0.5 |
| `usKills` | 22 | 25 | 1.5 | 2 | 2 | 0 | 0.5 |
| `geKills` | 29 | 32 | 1.5 | 2 | 2 | 0 | 0.5 |
| `fire.total` | 248 | 224 | -12 | 2 | 1 | 1 | 1 |
| `fire.hits` | 110 | 110 | 0 | 2 | 1 | 1 | 1 |
| `retreatSamples` | 334 | 213 | -60.5 | 2 | 0 | 2 | 0.5 |
| `movementResolver.changes` | 2874 | 2691 | -91.5 | 2 | 0 | 2 | 0.5 |
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
| `loopAlerts.length` | 2 | 1 | -0.5 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 3 | -0.5 | 1 | 0 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 25 | 21 | -2 | 2 | 0 | 2 | 0.5 |
| `recon.contacts` | 4 | 0 | -2 | 2 | 0 | 2 | 0.5 |
| `recon.noContact` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 4 | 4 | 0 | 2 | 1 | 1 | 1 |
| `recon.reportsDelivered` | 19 | 0 | -9.5 | 2 | 0 | 2 | 0.5 |
| `recon.retriggerBlocked` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 174.2 | 179.3 | 2.55 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.p10Overall` | 150.89999999999998 | 151.60000000000002 | 0.35 | 2 | 1 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 149.3 | 165.3 | 8 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanMovement` | 199.7 | 199.6 | -0.05 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanControl` | 198.1 | 197.8 | -0.15 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanCohesion` | 191.9 | 190.4 | -0.75 | 2 | 1 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-a-control-0001 172.05 s (timeline) · phase-a-control-0002 194.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=552&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactics-c1-situational-arbitration/ai_flow_live.html?bench=552&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=552`); it opens the seed that parts earliest, and the dropdowns choose another.

