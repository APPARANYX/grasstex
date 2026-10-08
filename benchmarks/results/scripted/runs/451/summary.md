# Benchmark run #451 · 60 seeds from `scripted-seeds` (us-defend), windows `contact+600`

- **OFF** flags: `garrisonRelease=0` · **ON** flags: `none`
- claude/project-thread-9tosy9-engineer-garrison @ 5932572 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37828086170) · build v29-dev

## Verdict

**MOVED: 54 of 54 pairs changed (median first part 244.05 s); 9 of 34 counters under p 0.05 (about 1.7 by chance), 5 under 0.0015; casualties +12.9% (p 0.0012)**

- Clears the Bonferroni line (p < 0.0015): geKills 1357 to 1612 (+18.8%, p 0); squadPerformance.meanControl 5284.000000000001 to 5235.599999999999 (-0.9%, p 0); vacantObjectiveStalls.length 84 to 162 (+92.9%, p 0.0006); recon.orders 3336 to 3110 (-6.8%, p 0.0008); casualties 2477 to 2797 (+12.9%, p 0.0012).
- Under 0.05 only: loopAlerts.length 175 to 221 (+26.3%, p 0.0137); recon.contacts 325 to 259 (-20.3%, p 0.0186); recon.timeouts 1093 to 969 (-11.3%, p 0.0259); fire.hits 6057 to 6700 (+10.6%, p 0.027).

## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.979 (gate 1.25)
- the 53 changed records first part at simulated second: min 244.05, p10 244.05, median 244.05, p90 251.1, max 408

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2477 | 2797 | 5.9259 | 52 | 38 | 14 | 0.0012 |
| `usKills` | 1120 | 1185 | 1.2037 | 50 | 31 | 19 | 0.1189 |
| `geKills` | 1357 | 1612 | 4.7222 | 52 | 41 | 11 | 0 |
| `fire.total` | 17499 | 19004 | 27.8704 | 53 | 33 | 20 | 0.0984 |
| `fire.hits` | 6057 | 6700 | 11.9074 | 53 | 35 | 18 | 0.027 |
| `retreatSamples` | 96939 | 95681 | -23.2963 | 53 | 28 | 25 | 0.7838 |
| `movementResolver.changes` | 154874 | 157921 | 56.4259 | 53 | 31 | 22 | 0.2717 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 84 | 162 | 1.4444 | 43 | 33 | 10 | 0.0006 |
| `loopAlerts.length` | 175 | 221 | 0.8519 | 43 | 30 | 13 | 0.0137 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 226 | 261 | 0.6481 | 45 | 28 | 17 | 0.1352 |
| `stallOutcomes.wakes` | 10 | 9 | -0.0185 | 9 | 5 | 4 | 1 |
| `stallOutcomes.repeats` | 6 | 1 | -0.0926 | 4 | 0 | 4 | 0.125 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3336 | 3110 | -4.1852 | 53 | 14 | 39 | 0.0008 |
| `recon.contacts` | 325 | 259 | -1.2222 | 47 | 15 | 32 | 0.0186 |
| `recon.noContact` | 1170 | 1160 | -0.1852 | 48 | 22 | 26 | 0.6655 |
| `recon.timeouts` | 1093 | 969 | -2.2963 | 46 | 15 | 31 | 0.0259 |
| `recon.cancelled` | 684 | 647 | -0.6852 | 48 | 18 | 30 | 0.1114 |
| `recon.reportsDelivered` | 1383 | 1197 | -3.4444 | 51 | 19 | 32 | 0.0919 |
| `recon.retriggerBlocked` | 1294 | 1275 | -0.3519 | 48 | 23 | 25 | 0.8854 |
| `squadPerformance.meanOverall` | 4432.600000000001 | 4423.200000000001 | -0.1741 | 51 | 21 | 30 | 0.2624 |
| `squadPerformance.p10Overall` | 4039.0999999999995 | 4042.5999999999995 | 0.0648 | 30 | 15 | 15 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3575.3000000000006 | 3619.200000000001 | 0.813 | 53 | 29 | 24 | 0.5831 |
| `squadPerformance.meanMovement` | 5375.199999999999 | 5378 | 0.0519 | 36 | 21 | 15 | 0.405 |
| `squadPerformance.meanControl` | 5284.000000000001 | 5235.599999999999 | -0.8963 | 52 | 10 | 42 | 0 |
| `squadPerformance.meanCohesion` | 4741.2 | 4701.399999999999 | -0.737 | 53 | 24 | 29 | 0.5831 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

scripted-seeds-0001 244.05 s (timeline) · scripted-seeds-0002 244.05 s (timeline) · scripted-seeds-0003 244.05 s (timeline) · scripted-seeds-0006 244.05 s (timeline) · scripted-seeds-0007 244.05 s (timeline) · scripted-seeds-0008 244.05 s (timeline) · scripted-seeds-0009 244.05 s (timeline) · scripted-seeds-0010 244.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=451&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=451`); it opens the seed that parts earliest, and the dropdowns choose another.

