# Benchmark run #471 · 60 seeds from `exec361p` (meeting), windows `contact+600`

- **OFF** flags: `fledWaitMerge=0` · **ON** flags: `none`
- claude/fled-refuge-group @ e20424b · [run](https://github.com/APPARANYX/grasstex/actions/runs/37857437841) · build v29-dev

## Verdict

**QUIET: 4 of 60 pairs changed (median first part 534 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.1% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **56** · runtime errors off 0 / on 0 · wall time on/off x1.002 (gate 1.25)
- the 1 changed records first part at simulated second: min 534, p10 534, median 534, p90 534, max 534

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3151 | 3154 | 0.05 | 1 | 1 | 0 | 1 |
| `usKills` | 1389 | 1392 | 0.05 | 1 | 1 | 0 | 1 |
| `geKills` | 1762 | 1762 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 20845 | 20840 | -0.0833 | 1 | 0 | 1 | 1 |
| `fire.hits` | 7444 | 7437 | -0.1167 | 1 | 0 | 1 | 1 |
| `retreatSamples` | 95335 | 95339 | 0.0667 | 1 | 1 | 0 | 1 |
| `movementResolver.changes` | 190698 | 190638 | -1 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 272 | 272 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 242 | 241 | -0.0167 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 163 | 163 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2164 | 2164 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 106 | 106 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1279 | 1279 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 622 | 622 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 514 | 514 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1512 | 1512 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4894.8 | 4894.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4503.700000000001 | 4503.700000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3903.500000000001 | 3903.7000000000007 | 0.0033 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMovement` | 5936.299999999998 | 5936.399999999999 | 0.0017 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanControl` | 5778.200000000001 | 5778.6 | 0.0067 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5383.5999999999985 | 5383.5999999999985 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

exec361p-0006 534 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=471&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=471`); it opens the seed that parts earliest, and the dropdowns choose another.

