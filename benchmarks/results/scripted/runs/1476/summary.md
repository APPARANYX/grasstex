# Benchmark run #1476 · 60 seeds from `controller-fin-20261031` (us-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0&tacticalController=new&rosterKeep=0&noHopStall=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/final662-31f9d9e5 @ 31f9d9e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41190174452) · build v29-dev

## Verdict

**MOVED: 52 of 52 pairs changed (median first part 172.5 s); 4 of 42 counters under p 0.05 (about 2.1 by chance), 3 under 0.0012; casualties -0.3% (p 0.883)**

- Clears the Bonferroni line (p < 0.0012): squadPerformance.meanControl 4937.700000000003 to 4998.2 (+1.2%, p 0); movementResolver.changes 95730 to 91859 (-4.0%, p 0.0001); loopAlerts.length 464 to 372 (-19.8%, p 0.0008).
- Under 0.05 only: fire.total 19265 to 17521 (-9.1%, p 0.0046).

## Paired comparison (off against on)

- **52** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.956 (gate 1.25)
- the 52 changed records first part at simulated second: min 103.05, p10 134.1, median 172.5, p90 214.05, max 258

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 734 | 732 | -0.0385 | 46 | 22 | 24 | 0.883 |
| `usKills` | 320 | 353 | 0.6346 | 42 | 25 | 17 | 0.28 |
| `geKills` | 414 | 379 | -0.6731 | 39 | 16 | 23 | 0.3368 |
| `fire.total` | 19265 | 17521 | -33.5385 | 51 | 15 | 36 | 0.0046 |
| `fire.hits` | 1667 | 1597 | -1.3462 | 52 | 20 | 32 | 0.1263 |
| `retreatSamples` | 5962 | 6169 | 3.9808 | 51 | 28 | 23 | 0.5758 |
| `movementResolver.changes` | 95730 | 91859 | -74.4423 | 52 | 12 | 40 | 0.0001 |
| `grenades.throws` | 11 | 9 | -0.0385 | 8 | 3 | 5 | 0.7266 |
| `grenades.bursts` | 9 | 9 | 0 | 8 | 3 | 5 | 0.7266 |
| `grenades.wounded` | 9 | 8 | -0.0192 | 4 | 2 | 2 | 1 |
| `grenades.casualties` | 2 | 3 | 0.0192 | 4 | 2 | 2 | 1 |
| `grenades.suppressed` | 24 | 17 | -0.1346 | 4 | 2 | 2 | 1 |
| `grenades.friendlyWounded` | 3 | 2 | -0.0192 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 1 | 0 | -0.0192 | 1 | 0 | 1 | 1 |
| `grenades.aborted` | 1 | 4 | 0.0577 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 1 | 0.0192 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 464 | 372 | -1.7692 | 45 | 11 | 34 | 0.0008 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 155 | 172 | 0.3269 | 19 | 12 | 7 | 0.3593 |
| `stallOutcomes.wakes` | 53 | 53 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1205 | 1204 | -0.0192 | 46 | 18 | 28 | 0.1839 |
| `recon.contacts` | 170 | 155 | -0.2885 | 41 | 18 | 23 | 0.5327 |
| `recon.noContact` | 432 | 430 | -0.0385 | 14 | 7 | 7 | 1 |
| `recon.timeouts` | 19 | 20 | 0.0192 | 3 | 2 | 1 | 1 |
| `recon.cancelled` | 524 | 541 | 0.3269 | 44 | 22 | 22 | 1 |
| `recon.reportsDelivered` | 793 | 692 | -1.9423 | 40 | 16 | 24 | 0.2682 |
| `recon.retriggerBlocked` | 431 | 427 | -0.0769 | 23 | 10 | 13 | 0.6776 |
| `squadPerformance.meanOverall` | 4466.3 | 4479.399999999999 | 0.2519 | 50 | 30 | 20 | 0.2026 |
| `squadPerformance.p10Overall` | 4029.399999999999 | 4040.799999999999 | 0.2192 | 49 | 26 | 23 | 0.7754 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3900.2999999999993 | 3901.8999999999987 | 0.0308 | 50 | 26 | 24 | 0.8877 |
| `squadPerformance.meanMovement` | 5178.600000000001 | 5180.599999999999 | 0.0385 | 39 | 21 | 18 | 0.7493 |
| `squadPerformance.meanControl` | 4937.700000000003 | 4998.2 | 1.1635 | 50 | 40 | 10 | 0 |
| `squadPerformance.meanCohesion` | 4586.899999999999 | 4607.700000000002 | 0.4 | 51 | 31 | 20 | 0.1608 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-fin-20261031-0043 103.05 s (timeline) · controller-fin-20261031-0052 110.1 s (timeline) · controller-fin-20261031-0019 114 s (timeline) · controller-fin-20261031-0039 116.1 s (timeline) · controller-fin-20261031-0049 124.05 s (timeline) · controller-fin-20261031-0020 134.1 s (timeline) · controller-fin-20261031-0017 135 s (timeline) · controller-fin-20261031-0011 139.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1476&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-final662-31f9d9e5/ai_flow_live.html?bench=1476&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1476`); it opens the seed that parts earliest, and the dropdowns choose another.

