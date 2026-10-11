# Benchmark run #550 · 2 seeds from `phase-a-control` (meeting), windows `contact+120`

- **OFF** flags: `localPlan=0` · **ON** flags: `localPlan=1`
- work/tactics-c1-situational-arbitration @ d73bf23 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38161501529) · build v29-dev

## Verdict

**QUIET: 2 of 2 pairs changed (median first part 215.025 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +41.3% (p 0.5)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.05 (gate 1.25)
- the 2 changed records first part at simulated second: min 205.05, p10 205.05, median 215.025, p90 225, max 225

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 46 | 65 | 9.5 | 2 | 2 | 0 | 0.5 |
| `usKills` | 21 | 34 | 6.5 | 2 | 2 | 0 | 0.5 |
| `geKills` | 25 | 31 | 3 | 2 | 1 | 1 | 1 |
| `fire.total` | 258 | 376 | 59 | 2 | 2 | 0 | 0.5 |
| `fire.hits` | 95 | 154 | 29.5 | 2 | 2 | 0 | 0.5 |
| `retreatSamples` | 214 | 224 | 5 | 2 | 2 | 0 | 0.5 |
| `movementResolver.changes` | 4635 | 4763 | 64 | 2 | 2 | 0 | 0.5 |
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
| `vacantObjectiveStalls.length` | 0 | 1 | 0.5 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 5 | 11 | 3 | 1 | 1 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 7 | 4 | -1.5 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 45 | 42 | -1.5 | 2 | 0 | 2 | 0.5 |
| `recon.contacts` | 5 | 3 | -1 | 2 | 0 | 2 | 0.5 |
| `recon.noContact` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 11 | 10 | -0.5 | 1 | 0 | 1 | 1 |
| `recon.reportsDelivered` | 18 | 15 | -1.5 | 2 | 1 | 1 | 1 |
| `recon.retriggerBlocked` | 36 | 35 | -0.5 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanOverall` | 169.9 | 169.2 | -0.35 | 2 | 1 | 1 | 1 |
| `squadPerformance.p10Overall` | 150.5 | 148.5 | -1 | 2 | 1 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 144.7 | 145.9 | 0.6 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanMovement` | 197.39999999999998 | 197.60000000000002 | 0.1 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanControl` | 193.7 | 190.2 | -1.75 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanCohesion` | 178.5 | 179.4 | 0.45 | 2 | 2 | 0 | 0.5 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-a-control-0001 205.05 s (timeline) · phase-a-control-0002 225 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=550&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactics-c1-situational-arbitration/ai_flow_live.html?bench=550&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=550`); it opens the seed that parts earliest, and the dropdowns choose another.

