# Benchmark run #387 · 60 seeds from `hill` (us-defend), windows `every120`

- **OFF** flags: `unreachableAnchor=0` · **ON** flags: `none`
- claude/fix-stale-ack-anchor @ 5193c96 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37738999941) · build v29-dev

## Verdict

**WEAK: 73 of 275 pairs changed (median first part 234 s); 1 of 34 counters under p 0.05 (about 1.7 by chance); casualties -1.0% (p 0.69)**

- Under 0.05 only: recon.cancelled 2116 to 2062 (-2.6%, p 0.0347).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 0) · identical in every field: **202** · runtime errors off 0 / on 0 · wall time on/off x0.998 (gate 1.25)
- the 33 changed records first part at simulated second: min 19.05, p10 19.05, median 234, p90 395.1, max 577.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5987 | 5929 | -0.2109 | 25 | 11 | 14 | 0.69 |
| `usKills` | 2392 | 2362 | -0.1091 | 25 | 9 | 16 | 0.2295 |
| `geKills` | 3595 | 3567 | -0.1018 | 28 | 14 | 14 | 1 |
| `fire.total` | 13766 | 13906 | 0.5091 | 29 | 15 | 14 | 1 |
| `fire.hits` | 4865 | 4868 | 0.0109 | 29 | 14 | 15 | 1 |
| `retreatSamples` | 81983 | 82040 | 0.2073 | 25 | 13 | 12 | 1 |
| `movementResolver.changes` | 437851 | 437896 | 0.1636 | 32 | 16 | 16 | 1 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 31 | 31 | 0 | 3 | 1 | 2 | 1 |
| `loopAlerts.length` | 185 | 186 | 0.0036 | 12 | 6 | 6 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 353 | 354 | 0.0036 | 12 | 6 | 6 | 1 |
| `stallOutcomes.wakes` | 82 | 79 | -0.0109 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 116 | 116 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11909 | 11835 | -0.2691 | 26 | 10 | 16 | 0.3269 |
| `recon.contacts` | 742 | 740 | -0.0073 | 17 | 9 | 8 | 1 |
| `recon.noContact` | 4102 | 4104 | 0.0073 | 21 | 11 | 10 | 1 |
| `recon.timeouts` | 4497 | 4486 | -0.04 | 25 | 11 | 14 | 0.69 |
| `recon.cancelled` | 2116 | 2062 | -0.1964 | 23 | 6 | 17 | 0.0347 |
| `recon.reportsDelivered` | 3206 | 3170 | -0.1309 | 23 | 12 | 11 | 1 |
| `recon.retriggerBlocked` | 4758 | 4773 | 0.0545 | 22 | 13 | 9 | 0.5235 |
| `squadPerformance.meanOverall` | 24316.4 | 24320.9 | 0.0164 | 29 | 17 | 12 | 0.4583 |
| `squadPerformance.p10Overall` | 22679.99999999999 | 22683.599999999988 | 0.0131 | 20 | 9 | 11 | 0.8238 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21729.799999999996 | 21727.49999999999 | -0.0084 | 27 | 14 | 13 | 1 |
| `squadPerformance.meanMovement` | 27329.20000000002 | 27341.300000000017 | 0.044 | 23 | 13 | 10 | 0.6776 |
| `squadPerformance.meanControl` | 27340.699999999997 | 27338.999999999993 | -0.0062 | 19 | 8 | 11 | 0.6476 |
| `squadPerformance.meanCohesion` | 23033.90000000002 | 23049.90000000002 | 0.0582 | 29 | 15 | 14 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0001 19.05 s (timeline) · hill-0052 137.1 s (timeline) · hill-0007 187.05 s (timeline) · hill-0050 234 s (timeline) · hill-0057 307.05 s (timeline) · hill-0008 351 s (timeline) · hill-0023 353.1 s (timeline) · hill-0029 364.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=387&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=387`); it opens the seed that parts earliest, and the dropdowns choose another.

