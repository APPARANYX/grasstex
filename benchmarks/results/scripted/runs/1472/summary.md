# Benchmark run #1472 · 60 seeds from `pr698-ro` (ge-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&releasedOrder=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- claude/project-thread-jxet0c @ 58bef7c · [run](https://github.com/APPARANYX/grasstex/actions/runs/41189595379) · build v29-dev

## Verdict

**WEAK: 60 of 60 pairs changed (median first part 0.15 s); 2 of 42 counters under p 0.05 (about 2.1 by chance); casualties +4.1% (p 0.4188)**

- Under 0.05 only: grenades.throws 24 to 50 (+108.3%, p 0.0146); grenades.bursts 24 to 50 (+108.3%, p 0.0146).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.997 (gate 1.25)
- the 60 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2121 | 2207 | 1.4333 | 55 | 31 | 24 | 0.4188 |
| `usKills` | 827 | 851 | 0.4 | 52 | 29 | 23 | 0.4885 |
| `geKills` | 1294 | 1356 | 1.0333 | 54 | 31 | 23 | 0.3409 |
| `fire.total` | 53299 | 52375 | -15.4 | 56 | 27 | 29 | 0.8939 |
| `fire.hits` | 4690 | 5196 | 8.4333 | 55 | 32 | 23 | 0.2806 |
| `retreatSamples` | 134593 | 125990 | -143.3833 | 56 | 22 | 34 | 0.1409 |
| `movementResolver.changes` | 184584 | 182818 | -29.4333 | 59 | 28 | 31 | 0.7948 |
| `grenades.throws` | 24 | 50 | 0.4333 | 25 | 19 | 6 | 0.0146 |
| `grenades.bursts` | 24 | 50 | 0.4333 | 25 | 19 | 6 | 0.0146 |
| `grenades.wounded` | 15 | 28 | 0.2167 | 16 | 11 | 5 | 0.2101 |
| `grenades.casualties` | 6 | 11 | 0.0833 | 9 | 6 | 3 | 0.5078 |
| `grenades.suppressed` | 29 | 50 | 0.35 | 19 | 13 | 6 | 0.1671 |
| `grenades.friendlyWounded` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 5 | 14 | 0.15 | 14 | 11 | 3 | 0.0574 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 64 | 65 | 0.0167 | 31 | 16 | 15 | 1 |
| `loopAlerts.length` | 847 | 866 | 0.3167 | 19 | 11 | 8 | 0.6476 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 238 | 244 | 0.1 | 46 | 23 | 23 | 1 |
| `stallOutcomes.wakes` | 6 | 3 | -0.05 | 8 | 3 | 5 | 0.7266 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2685 | 2696 | 0.1833 | 55 | 24 | 31 | 0.4188 |
| `recon.contacts` | 577 | 581 | 0.0667 | 50 | 23 | 27 | 0.6718 |
| `recon.noContact` | 623 | 633 | 0.1667 | 51 | 26 | 25 | 1 |
| `recon.timeouts` | 51 | 50 | -0.0167 | 22 | 10 | 12 | 0.8318 |
| `recon.cancelled` | 1388 | 1391 | 0.05 | 54 | 27 | 27 | 1 |
| `recon.reportsDelivered` | 2244 | 2316 | 1.2 | 56 | 28 | 28 | 1 |
| `recon.retriggerBlocked` | 767 | 780 | 0.2167 | 49 | 25 | 24 | 1 |
| `squadPerformance.meanOverall` | 4926.900000000002 | 4933.8 | 0.115 | 55 | 31 | 24 | 0.4188 |
| `squadPerformance.p10Overall` | 4545.4 | 4555.899999999998 | 0.175 | 33 | 21 | 12 | 0.1628 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3935.4999999999986 | 3972.8999999999996 | 0.6233 | 56 | 34 | 22 | 0.1409 |
| `squadPerformance.meanMovement` | 5991.799999999998 | 5992.9 | 0.0183 | 22 | 16 | 6 | 0.0525 |
| `squadPerformance.meanControl` | 5709.6 | 5692.5 | -0.285 | 56 | 23 | 33 | 0.2288 |
| `squadPerformance.meanCohesion` | 5512.799999999999 | 5477.4 | -0.59 | 56 | 24 | 32 | 0.3497 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr698-ro-0001 0.15 s (timeline) · pr698-ro-0002 0.15 s (timeline) · pr698-ro-0003 0.15 s (timeline) · pr698-ro-0004 0.15 s (timeline) · pr698-ro-0005 0.15 s (timeline) · pr698-ro-0006 0.15 s (timeline) · pr698-ro-0007 0.15 s (timeline) · pr698-ro-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1472&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1472`); it opens the seed that parts earliest, and the dropdowns choose another.

