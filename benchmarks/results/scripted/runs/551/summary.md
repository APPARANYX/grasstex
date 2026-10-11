# Benchmark run #551 · 2 seeds from `phase-a-control` (ge-defend), windows `contact+120`

- **OFF** flags: `localPlan=0` · **ON** flags: `localPlan=1`
- work/tactics-c1-situational-arbitration @ d73bf23 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38161504925) · build v29-dev

## Verdict

**QUIET: 2 of 2 pairs changed (median first part 120.525 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.965 (gate 1.25)
- the 2 changed records first part at simulated second: min 114, p10 114, median 120.525, p90 127.05, max 127.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 43 | 43 | 0 | 2 | 1 | 1 | 1 |
| `usKills` | 23 | 19 | -2 | 1 | 0 | 1 | 1 |
| `geKills` | 20 | 24 | 2 | 2 | 2 | 0 | 0.5 |
| `fire.total` | 233 | 200 | -16.5 | 2 | 0 | 2 | 0.5 |
| `fire.hits` | 85 | 77 | -4 | 1 | 0 | 1 | 1 |
| `retreatSamples` | 400 | 334 | -33 | 2 | 0 | 2 | 0.5 |
| `movementResolver.changes` | 2538 | 2551 | 6.5 | 2 | 1 | 1 | 1 |
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
| `recon.orders` | 37 | 29 | -4 | 2 | 0 | 2 | 0.5 |
| `recon.contacts` | 4 | 2 | -1 | 2 | 0 | 2 | 0.5 |
| `recon.noContact` | 21 | 22 | 0.5 | 1 | 1 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 11 | 5 | -3 | 2 | 0 | 2 | 0.5 |
| `recon.reportsDelivered` | 18 | 9 | -4.5 | 1 | 0 | 1 | 1 |
| `recon.retriggerBlocked` | 21 | 19 | -1 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 170.7 | 174.6 | 1.95 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.p10Overall` | 151 | 153.1 | 1.05 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 142.7 | 152.2 | 4.75 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanMovement` | 199.8 | 199.7 | -0.05 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanControl` | 198.8 | 198.89999999999998 | 0.05 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 182.8 | 181.2 | -0.8 | 1 | 0 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-a-control-0002 114 s (timeline) · phase-a-control-0001 127.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=551&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactics-c1-situational-arbitration/ai_flow_live.html?bench=551&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=551`); it opens the seed that parts earliest, and the dropdowns choose another.

