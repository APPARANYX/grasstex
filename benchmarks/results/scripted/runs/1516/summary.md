# Benchmark run #1516 · 60 seeds from `c701b` (ge-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerGunner=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c701b-a71f322e @ a71f322 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41242494787) · build v29-dev

## Verdict

**QUIET: 36 of 55 pairs changed (median first part 167.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -1.5% (p 0.845)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **55** pairs (unpaired: off 0, on 0) · identical in every field: **19** · runtime errors off 0 / on 0 · wall time on/off x0.977 (gate 1.25)
- the 29 changed records first part at simulated second: min 102, p10 127.05, median 167.1, p90 239.1, max 278.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 778 | 766 | -0.2182 | 26 | 12 | 14 | 0.845 |
| `usKills` | 262 | 270 | 0.1455 | 21 | 13 | 8 | 0.3833 |
| `geKills` | 516 | 496 | -0.3636 | 28 | 11 | 17 | 0.3449 |
| `fire.total` | 20099 | 21672 | 28.6 | 28 | 19 | 9 | 0.0872 |
| `fire.hits` | 1824 | 1780 | -0.8 | 26 | 8 | 18 | 0.0755 |
| `retreatSamples` | 5831 | 5637 | -3.5273 | 27 | 12 | 15 | 0.7011 |
| `movementResolver.changes` | 107486 | 107011 | -8.6364 | 28 | 10 | 18 | 0.1849 |
| `grenades.throws` | 9 | 8 | -0.0182 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 8 | 8 | 0 | 2 | 1 | 1 | 1 |
| `grenades.wounded` | 2 | 4 | 0.0364 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 0 | 2 | 0.0364 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 4 | 9 | 0.0909 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 1 | 0.0182 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 469 | 479 | 0.1818 | 25 | 14 | 11 | 0.69 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 90 | 86 | -0.0727 | 7 | 2 | 5 | 0.4531 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1414 | 1395 | -0.3455 | 23 | 12 | 11 | 1 |
| `recon.contacts` | 243 | 230 | -0.2364 | 21 | 10 | 11 | 1 |
| `recon.noContact` | 402 | 403 | 0.0182 | 7 | 4 | 3 | 1 |
| `recon.timeouts` | 17 | 16 | -0.0182 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 693 | 685 | -0.1455 | 21 | 9 | 12 | 0.6636 |
| `recon.reportsDelivered` | 1059 | 987 | -1.3091 | 22 | 9 | 13 | 0.5235 |
| `recon.retriggerBlocked` | 512 | 509 | -0.0545 | 13 | 5 | 8 | 0.5811 |
| `squadPerformance.meanOverall` | 4749.2 | 4751.400000000001 | 0.04 | 27 | 15 | 12 | 0.7011 |
| `squadPerformance.p10Overall` | 4299.299999999999 | 4305.5 | 0.1127 | 20 | 11 | 9 | 0.8238 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4253.6 | 4255.200000000001 | 0.0291 | 24 | 10 | 14 | 0.5413 |
| `squadPerformance.meanMovement` | 5475.600000000001 | 5473.500000000001 | -0.0382 | 22 | 12 | 10 | 0.8318 |
| `squadPerformance.meanControl` | 5222 | 5223.799999999999 | 0.0327 | 27 | 15 | 12 | 0.7011 |
| `squadPerformance.meanCohesion` | 4754.4 | 4737.5 | -0.3073 | 26 | 11 | 15 | 0.5572 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c701b-0005 102 s (timeline) · c701b-0008 119.1 s (timeline) · c701b-0056 127.05 s (timeline) · c701b-0053 133.05 s (timeline) · c701b-0059 133.05 s (timeline) · c701b-0009 135 s (stress) · c701b-0010 136.05 s (stress) · c701b-0058 142.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1516&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c701b-a71f322e/ai_flow_live.html?bench=1516&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1516`); it opens the seed that parts earliest, and the dropdowns choose another.

