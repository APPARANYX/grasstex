# Benchmark run #379 · 60 seeds from `hill` (meeting), windows `every120`

- **OFF** flags: `unreachableAnchor=0` · **ON** flags: `none`
- claude/fix-stale-ack-anchor @ 3004ab0 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37735972550) · build v29-dev

## Verdict

**WEAK: 161 of 282 pairs changed (median first part 278.1 s); 4 of 32 counters under p 0.05 (about 1.6 by chance); casualties -2.1% (p 0.0559)**

- Under 0.05 only: recon.noContact 4325 to 4379 (+1.2%, p 0.0017); geKills 3845 to 3670 (-4.6%, p 0.0027); recon.timeouts 216 to 203 (-6.0%, p 0.0241); recon.orders 6349 to 6412 (+1.0%, p 0.0402).
- Unpaired records: off 1, on 3 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **282** pairs (unpaired: off 1, on 3) · identical in every field: **121** · runtime errors off 0 / on 0 · wall time on/off x1.013 (gate 1.25)
- the 91 changed records first part at simulated second: min 65.1, p10 119.1, median 278.1, p90 464.1, max 587.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7335 | 7178 | -0.5567 | 62 | 23 | 39 | 0.0559 |
| `usKills` | 3490 | 3508 | 0.0638 | 58 | 36 | 22 | 0.0869 |
| `geKills` | 3845 | 3670 | -0.6206 | 60 | 18 | 42 | 0.0027 |
| `fire.total` | 18500 | 18322 | -0.6312 | 66 | 30 | 36 | 0.5386 |
| `fire.hits` | 6403 | 6275 | -0.4539 | 65 | 27 | 38 | 0.2145 |
| `retreatSamples` | 86525 | 85461 | -3.773 | 70 | 36 | 34 | 0.905 |
| `movementResolver.changes` | 604759 | 603134 | -5.7624 | 85 | 48 | 37 | 0.278 |
| `movementStalls.length` | 36 | 39 | 0.0106 | 7 | 4 | 3 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 276 | 262 | -0.0496 | 41 | 18 | 23 | 0.5327 |
| `loopAlerts.length` | 206 | 208 | 0.0071 | 42 | 26 | 16 | 0.1641 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 542 | 539 | -0.0106 | 39 | 18 | 21 | 0.7493 |
| `stallOutcomes.wakes` | 54 | 55 | 0.0035 | 19 | 10 | 9 | 1 |
| `stallOutcomes.repeats` | 28 | 29 | 0.0035 | 11 | 6 | 5 | 1 |
| `timeline.stalledOnsets` | 132 | 132 | 0 | 8 | 5 | 3 | 0.7266 |
| `timeline.stalledSamples` | 6730 | 7072 | 1.2128 | 11 | 8 | 3 | 0.2266 |
| `recon.orders` | 6349 | 6412 | 0.2234 | 54 | 35 | 19 | 0.0402 |
| `recon.contacts` | 235 | 224 | -0.039 | 33 | 13 | 20 | 0.2962 |
| `recon.noContact` | 4325 | 4379 | 0.1915 | 38 | 29 | 9 | 0.0017 |
| `recon.timeouts` | 216 | 203 | -0.0461 | 29 | 8 | 21 | 0.0241 |
| `recon.cancelled` | 1393 | 1406 | 0.0461 | 48 | 26 | 22 | 0.6655 |
| `recon.reportsDelivered` | 1152 | 1084 | -0.2411 | 35 | 14 | 21 | 0.3105 |
| `recon.retriggerBlocked` | 4911 | 4933 | 0.078 | 46 | 23 | 23 | 1 |
| `squadPerformance.meanOverall` | 24437.79999999999 | 24419.499999999993 | -0.0649 | 74 | 31 | 43 | 0.2007 |
| `squadPerformance.p10Overall` | 23030.09999999998 | 22995.29999999998 | -0.1234 | 52 | 21 | 31 | 0.2116 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20462.999999999993 | 20392.39999999999 | -0.2504 | 73 | 32 | 41 | 0.3492 |
| `squadPerformance.meanMovement` | 27750.599999999984 | 27749.599999999988 | -0.0035 | 65 | 35 | 30 | 0.6201 |
| `squadPerformance.meanControl` | 27799.700000000004 | 27801.099999999995 | 0.005 | 67 | 28 | 39 | 0.2215 |
| `squadPerformance.meanCohesion` | 24734.900000000016 | 24769.700000000008 | 0.1234 | 74 | 38 | 36 | 0.9076 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0016 65.1 s (timeline) · hill-0017 72 s (timeline) · hill-0046 119.1 s (timeline) · hill-0052 133.05 s (timeline) · hill-0059 141 s (timeline) · hill-0031 143.1 s (timeline) · hill-0050 172.05 s (timeline) · hill-0057 211.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=379&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=379`); it opens the seed that parts earliest, and the dropdowns choose another.

