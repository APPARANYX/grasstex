# Benchmark run #465 · 60 seeds from `exec361p` (meeting), windows `contact+600`

- **OFF** flags: `retreatPosture=0` · **ON** flags: `none`
- claude/stale-withdraw @ cc84371 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37852746692) · build v29-dev

## Verdict

**QUIET: 6 of 60 pairs changed (median first part 523.575 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **54** · runtime errors off 0 / on 0 · wall time on/off x1.01 (gate 1.25)
- the 4 changed records first part at simulated second: min 465, p10 465, median 523.575, p90 581.1, max 581.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3151 | 3151 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1389 | 1389 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1762 | 1762 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 20845 | 20845 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 7444 | 7444 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 95335 | 95335 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 190698 | 190686 | -0.2 | 2 | 0 | 2 | 0.5 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 272 | 272 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 242 | 242 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 163 | 161 | -0.0333 | 1 | 0 | 1 | 1 |
| `stallOutcomes.wakes` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2164 | 2166 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `recon.contacts` | 106 | 106 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1279 | 1281 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `recon.timeouts` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 622 | 622 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 514 | 514 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1512 | 1513 | 0.0167 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanOverall` | 4894.8 | 4894.8 | 0 | 2 | 1 | 1 | 1 |
| `squadPerformance.p10Overall` | 4503.700000000001 | 4503.700000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3903.500000000001 | 3903.500000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5936.299999999998 | 5936.399999999999 | 0.0017 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanControl` | 5778.200000000001 | 5778.200000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5383.5999999999985 | 5383.899999999999 | 0.005 | 3 | 2 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 4 seeds that part earliest (simulated seconds)

exec361p-0030 465 s (timeline) · exec361p-0048 509.1 s (timeline) · exec361p-0059 538.05 s (timeline) · exec361p-0044 581.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=465&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=465`); it opens the seed that parts earliest, and the dropdowns choose another.

