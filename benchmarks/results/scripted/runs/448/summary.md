# Benchmark run #448 · 60 seeds from `scripted-seeds` (us-defend), windows `contact+120`

- **OFF** flags: `garrisonRelease=0` · **ON** flags: `none`
- claude/project-thread-9tosy9-engineer-garrison @ 5932572 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37825949443) · build v29-dev

## Verdict

**MOVED: 34 of 54 pairs changed (median first part 244.05 s); 6 of 34 counters under p 0.05 (about 1.7 by chance), 5 under 0.0015; casualties +1.8% (p 0.0215)**

- Clears the Bonferroni line (p < 0.0015): movementResolver.changes 74568 to 75319 (+1.0%, p 0); squadPerformance.meanOverall 4813.9 to 4803.3 (-0.2%, p 0); squadPerformance.meanMission 4485.900000000001 to 4464.200000000002 (-0.5%, p 0); squadPerformance.meanControl 5357.400000000001 to 5349.000000000001 (-0.2%, p 0); recon.cancelled 259 to 273 (+5.4%, p 0.0005).
- Under 0.05 only: casualties 712 to 725 (+1.8%, p 0.0215).

## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **20** · runtime errors off 0 / on 0 · wall time on/off x0.975 (gate 1.25)
- the 24 changed records first part at simulated second: min 243.6, p10 244.05, median 244.05, p90 246, max 251.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 712 | 725 | 0.2407 | 10 | 9 | 1 | 0.0215 |
| `usKills` | 283 | 286 | 0.0556 | 9 | 6 | 3 | 0.5078 |
| `geKills` | 429 | 439 | 0.1852 | 10 | 8 | 2 | 0.1094 |
| `fire.total` | 4658 | 4732 | 1.3704 | 18 | 13 | 5 | 0.0963 |
| `fire.hits` | 1790 | 1802 | 0.2222 | 15 | 11 | 4 | 0.1185 |
| `retreatSamples` | 2717 | 2728 | 0.2037 | 7 | 5 | 2 | 0.4531 |
| `movementResolver.changes` | 74568 | 75319 | 13.9074 | 24 | 22 | 2 | 0 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 29 | 28 | -0.0185 | 2 | 1 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 46 | 47 | 0.0185 | 1 | 1 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2080 | 2082 | 0.037 | 19 | 10 | 9 | 1 |
| `recon.contacts` | 114 | 113 | -0.0185 | 5 | 2 | 3 | 1 |
| `recon.noContact` | 927 | 926 | -0.0185 | 6 | 3 | 3 | 1 |
| `recon.timeouts` | 719 | 712 | -0.1296 | 6 | 1 | 5 | 0.2188 |
| `recon.cancelled` | 259 | 273 | 0.2593 | 16 | 15 | 1 | 0.0005 |
| `recon.reportsDelivered` | 568 | 584 | 0.2963 | 6 | 3 | 3 | 1 |
| `recon.retriggerBlocked` | 846 | 845 | -0.0185 | 7 | 3 | 4 | 1 |
| `squadPerformance.meanOverall` | 4813.9 | 4803.3 | -0.1963 | 23 | 1 | 22 | 0 |
| `squadPerformance.p10Overall` | 4391.5999999999985 | 4386.699999999999 | -0.0907 | 10 | 4 | 6 | 0.7539 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4485.900000000001 | 4464.200000000002 | -0.4019 | 23 | 1 | 22 | 0 |
| `squadPerformance.meanMovement` | 5387.1 | 5387.000000000001 | -0.0019 | 8 | 3 | 5 | 0.7266 |
| `squadPerformance.meanControl` | 5357.400000000001 | 5349.000000000001 | -0.1556 | 24 | 1 | 23 | 0 |
| `squadPerformance.meanCohesion` | 4465.599999999999 | 4473.099999999999 | 0.1389 | 14 | 9 | 5 | 0.424 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

scripted-seeds-0053 243.6 s (timeline) · scripted-seeds-0001 244.05 s (timeline) · scripted-seeds-0002 244.05 s (timeline) · scripted-seeds-0006 244.05 s (timeline) · scripted-seeds-0007 244.05 s (timeline) · scripted-seeds-0008 244.05 s (timeline) · scripted-seeds-0009 244.05 s (timeline) · scripted-seeds-0013 244.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=448&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=448`); it opens the seed that parts earliest, and the dropdowns choose another.

