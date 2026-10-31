# Benchmark run #1469 · 60 seeds from `pr698-rl` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&releasedOrder=0` · **ON** flags: `strategicInterception=0`
- claude/project-thread-jxet0c @ 58bef7c · [run](https://github.com/APPARANYX/grasstex/actions/runs/41189534000) · build v29-dev

## Verdict

**QUIET: 60 of 60 pairs changed (median first part 0.15 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.999 (gate 1.25)
- the 60 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2219 | 2218 | -0.0167 | 47 | 24 | 23 | 1 |
| `usKills` | 1039 | 1057 | 0.3 | 49 | 26 | 23 | 0.7754 |
| `geKills` | 1180 | 1161 | -0.3167 | 46 | 23 | 23 | 1 |
| `fire.total` | 35317 | 36265 | 15.8 | 49 | 29 | 20 | 0.2529 |
| `fire.hits` | 5021 | 5081 | 1 | 48 | 24 | 24 | 1 |
| `retreatSamples` | 107348 | 110431 | 51.3833 | 49 | 26 | 23 | 0.7754 |
| `movementResolver.changes` | 153668 | 155687 | 33.65 | 57 | 35 | 22 | 0.1112 |
| `grenades.throws` | 39 | 43 | 0.0667 | 18 | 10 | 8 | 0.8145 |
| `grenades.bursts` | 38 | 43 | 0.0833 | 17 | 10 | 7 | 0.6291 |
| `grenades.wounded` | 27 | 33 | 0.1 | 5 | 3 | 2 | 1 |
| `grenades.casualties` | 8 | 12 | 0.0667 | 4 | 3 | 1 | 0.625 |
| `grenades.suppressed` | 71 | 83 | 0.2 | 9 | 4 | 5 | 1 |
| `grenades.friendlyWounded` | 5 | 0 | -0.0833 | 2 | 0 | 2 | 0.5 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 5 | 1 | -0.0667 | 3 | 0 | 3 | 0.25 |
| `movementStalls.length` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 94 | 86 | -0.1333 | 40 | 15 | 25 | 0.1539 |
| `loopAlerts.length` | 650 | 630 | -0.3333 | 39 | 21 | 18 | 0.7493 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 234 | 213 | -0.35 | 42 | 16 | 26 | 0.1641 |
| `stallOutcomes.wakes` | 7 | 5 | -0.0333 | 8 | 3 | 5 | 0.7266 |
| `stallOutcomes.repeats` | 2 | 3 | 0.0167 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 31 | 0 | -0.5167 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 31 | 0 | -0.5167 | 1 | 0 | 1 | 1 |
| `recon.orders` | 1547 | 1489 | -0.9667 | 47 | 21 | 26 | 0.5601 |
| `recon.contacts` | 221 | 222 | 0.0167 | 42 | 22 | 20 | 0.8776 |
| `recon.noContact` | 708 | 688 | -0.3333 | 44 | 21 | 23 | 0.8804 |
| `recon.timeouts` | 65 | 65 | 0 | 25 | 12 | 13 | 1 |
| `recon.cancelled` | 473 | 437 | -0.6 | 43 | 20 | 23 | 0.7608 |
| `recon.reportsDelivered` | 807 | 933 | 2.1 | 48 | 25 | 23 | 0.8854 |
| `recon.retriggerBlocked` | 690 | 679 | -0.1833 | 45 | 22 | 23 | 1 |
| `squadPerformance.meanOverall` | 4962.100000000002 | 4956.199999999999 | -0.0983 | 49 | 21 | 28 | 0.3916 |
| `squadPerformance.p10Overall` | 4594.7 | 4597.200000000001 | 0.0417 | 26 | 12 | 14 | 0.845 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4092.799999999999 | 4045 | -0.7967 | 49 | 19 | 30 | 0.1524 |
| `squadPerformance.meanMovement` | 5992.000000000001 | 5992 | 0 | 26 | 11 | 15 | 0.5572 |
| `squadPerformance.meanControl` | 5733.2 | 5750.800000000001 | 0.2933 | 47 | 29 | 18 | 0.1439 |
| `squadPerformance.meanCohesion` | 5385.2 | 5418.599999999999 | 0.5567 | 49 | 29 | 20 | 0.2529 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr698-rl-0001 0.15 s (timeline) · pr698-rl-0002 0.15 s (timeline) · pr698-rl-0003 0.15 s (timeline) · pr698-rl-0004 0.15 s (timeline) · pr698-rl-0005 0.15 s (timeline) · pr698-rl-0006 0.15 s (timeline) · pr698-rl-0007 0.15 s (timeline) · pr698-rl-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1469&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1469`); it opens the seed that parts earliest, and the dropdowns choose another.

