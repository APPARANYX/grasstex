# Benchmark run #385 · 60 seeds from `hill` (meeting), windows `every120`

- **OFF** flags: `unreachableAnchor=0` · **ON** flags: `none`
- claude/fix-stale-ack-anchor @ 5193c96 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37738993606) · build v29-dev

## Verdict

**QUIET: 166 of 283 pairs changed (median first part 281.1 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties -1.6% (p 0.0817)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Unpaired records: off 1, on 2 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **283** pairs (unpaired: off 1, on 2) · identical in every field: **117** · runtime errors off 0 / on 0 · wall time on/off x1.001 (gate 1.25)
- the 94 changed records first part at simulated second: min 65.1, p10 119.1, median 281.1, p90 462, max 587.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7447 | 7328 | -0.4205 | 65 | 25 | 40 | 0.0817 |
| `usKills` | 3678 | 3584 | -0.3322 | 63 | 32 | 31 | 1 |
| `geKills` | 3769 | 3744 | -0.0883 | 60 | 26 | 34 | 0.3663 |
| `fire.total` | 18420 | 18223 | -0.6961 | 69 | 29 | 40 | 0.2284 |
| `fire.hits` | 6387 | 6321 | -0.2332 | 69 | 31 | 38 | 0.4704 |
| `retreatSamples` | 88294 | 87001 | -4.5689 | 72 | 36 | 36 | 1 |
| `movementResolver.changes` | 607033 | 609225 | 7.7456 | 88 | 48 | 40 | 0.4557 |
| `movementStalls.length` | 14 | 18 | 0.0141 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 294 | 279 | -0.053 | 44 | 19 | 25 | 0.4514 |
| `loopAlerts.length` | 227 | 256 | 0.1025 | 44 | 25 | 19 | 0.4514 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 514 | 526 | 0.0424 | 35 | 18 | 17 | 1 |
| `stallOutcomes.wakes` | 55 | 61 | 0.0212 | 24 | 14 | 10 | 0.5413 |
| `stallOutcomes.repeats` | 28 | 32 | 0.0141 | 12 | 7 | 5 | 0.7744 |
| `timeline.stalledOnsets` | 15 | 19 | 0.0141 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 593 | 692 | 0.3498 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 55 | 59 | 0.0141 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1886 | 1992 | 0.3746 | 3 | 3 | 0 | 0.25 |
| `recon.orders` | 6421 | 6438 | 0.0601 | 59 | 36 | 23 | 0.1175 |
| `recon.contacts` | 254 | 252 | -0.0071 | 32 | 16 | 16 | 1 |
| `recon.noContact` | 4361 | 4382 | 0.0742 | 44 | 27 | 17 | 0.1742 |
| `recon.timeouts` | 223 | 215 | -0.0283 | 36 | 15 | 21 | 0.405 |
| `recon.cancelled` | 1404 | 1389 | -0.053 | 47 | 24 | 23 | 1 |
| `recon.reportsDelivered` | 1304 | 1269 | -0.1237 | 35 | 17 | 18 | 1 |
| `recon.retriggerBlocked` | 4965 | 4970 | 0.0177 | 53 | 27 | 26 | 1 |
| `squadPerformance.meanOverall` | 24518.199999999983 | 24501.29999999998 | -0.0597 | 76 | 32 | 44 | 0.2067 |
| `squadPerformance.p10Overall` | 23131.09999999998 | 23100.59999999998 | -0.1078 | 53 | 22 | 31 | 0.2717 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20497.999999999996 | 20459.399999999983 | -0.1364 | 74 | 35 | 39 | 0.7275 |
| `squadPerformance.meanMovement` | 27870.199999999993 | 27852.999999999996 | -0.0608 | 66 | 34 | 32 | 0.9022 |
| `squadPerformance.meanControl` | 27893.099999999995 | 27891.59999999999 | -0.0053 | 68 | 29 | 39 | 0.275 |
| `squadPerformance.meanCohesion` | 24820.700000000023 | 24820.800000000007 | 0.0004 | 78 | 38 | 40 | 0.9099 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0016 65.1 s (timeline) · hill-0017 72 s (timeline) · hill-0046 119.1 s (timeline) · hill-0052 133.05 s (timeline) · hill-0059 141 s (timeline) · hill-0031 143.1 s (timeline) · hill-0050 172.05 s (timeline) · hill-0041 206.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=385&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=385`); it opens the seed that parts earliest, and the dropdowns choose another.

