# Benchmark run #1439 · 60 seeds from `controller-pacing3-20261030` (meeting), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-c75d7825 @ c75d782 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41005401330) · build v29-dev

## Verdict

**MOVED: 60 of 60 pairs changed (median first part 1.05 s); 19 of 42 counters under p 0.05 (about 2.1 by chance), 12 under 0.0012; casualties -13.4% (p 0.0183)**

- Clears the Bonferroni line (p < 0.0012): fire.total 14593 to 20655 (+41.5%, p 0); retreatSamples 5154 to 9528 (+84.9%, p 0); movementResolver.changes 127007 to 176173 (+38.7%, p 0); loopAlerts.length 221 to 822 (+271.9%, p 0); stallOutcomes.wakes 2 to 29 (+1350.0%, p 0); recon.noContact 853 to 580 (-32.0%, p 0); recon.cancelled 325 to 499 (+53.5%, p 0); squadPerformance.meanOverall 5147.900000000001 to 5018.1 (-2.5%, p 0); squadPerformance.meanMission 4522.4 to 4118 (-8.9%, p 0); squadPerformance.meanControl 5776.6 to 5540.700000000002 (-4.1%, p 0); recon.retriggerBlocked 1024 to 949 (-7.3%, p 0.0001); squadPerformance.meanCohesion 5264 to 5478.800000000001 (+4.1%, p 0.0001).
- Under 0.05 only: regroups.entries 64 to 139 (+117.2%, p 0.0021); fire.hits 2606 to 2189 (-16.0%, p 0.0032); recon.orders 1266 to 1181 (-6.7%, p 0.0038); squadPerformance.p10Overall 4697.400000000001 to 4590.599999999999 (-2.3%, p 0.0054); usKills 519 to 390 (-24.9%, p 0.0065); vacantObjectiveStalls.length 9 to 38 (+322.2%, p 0.0066); casualties 1178 to 1020 (-13.4%, p 0.0183).
- Wall time on/off x2.128 is over the 1.25 gate.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x2.128 (gate 1.25)
- the 60 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1178 | 1020 | -2.6333 | 59 | 20 | 39 | 0.0183 |
| `usKills` | 519 | 390 | -2.15 | 55 | 17 | 38 | 0.0065 |
| `geKills` | 659 | 630 | -0.4833 | 51 | 25 | 26 | 1 |
| `fire.total` | 14593 | 20655 | 101.0333 | 60 | 47 | 13 | 0 |
| `fire.hits` | 2606 | 2189 | -6.95 | 57 | 17 | 40 | 0.0032 |
| `retreatSamples` | 5154 | 9528 | 72.9 | 60 | 47 | 13 | 0 |
| `movementResolver.changes` | 127007 | 176173 | 819.4333 | 60 | 60 | 0 | 0 |
| `grenades.throws` | 2 | 5 | 0.05 | 6 | 4 | 2 | 0.6875 |
| `grenades.bursts` | 1 | 5 | 0.0667 | 5 | 4 | 1 | 0.375 |
| `grenades.wounded` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 0 | 2 | 0.0333 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 3 | 0.05 | 3 | 3 | 0 | 0.25 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 9 | 38 | 0.4833 | 24 | 19 | 5 | 0.0066 |
| `loopAlerts.length` | 221 | 822 | 10.0167 | 60 | 59 | 1 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 64 | 139 | 1.25 | 48 | 35 | 13 | 0.0021 |
| `stallOutcomes.wakes` | 2 | 29 | 0.45 | 27 | 26 | 1 | 0 |
| `stallOutcomes.repeats` | 0 | 2 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1266 | 1181 | -1.4167 | 54 | 16 | 38 | 0.0038 |
| `recon.contacts` | 71 | 82 | 0.1833 | 39 | 23 | 16 | 0.3368 |
| `recon.noContact` | 853 | 580 | -4.55 | 60 | 1 | 59 | 0 |
| `recon.timeouts` | 8 | 5 | -0.05 | 8 | 3 | 5 | 0.7266 |
| `recon.cancelled` | 325 | 499 | 2.9 | 52 | 47 | 5 | 0 |
| `recon.reportsDelivered` | 312 | 415 | 1.7167 | 48 | 29 | 19 | 0.1934 |
| `recon.retriggerBlocked` | 1024 | 949 | -1.25 | 53 | 12 | 41 | 0.0001 |
| `squadPerformance.meanOverall` | 5147.900000000001 | 5018.1 | -2.1633 | 60 | 11 | 49 | 0 |
| `squadPerformance.p10Overall` | 4697.400000000001 | 4590.599999999999 | -1.78 | 58 | 18 | 40 | 0.0054 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4522.4 | 4118 | -6.74 | 59 | 7 | 52 | 0 |
| `squadPerformance.meanMovement` | 5929.7999999999965 | 5939.299999999999 | 0.1583 | 53 | 33 | 20 | 0.0984 |
| `squadPerformance.meanControl` | 5776.6 | 5540.700000000002 | -3.9317 | 60 | 3 | 57 | 0 |
| `squadPerformance.meanCohesion` | 5264 | 5478.800000000001 | 3.58 | 59 | 45 | 14 | 0.0001 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing3-20261030-0001 1.05 s (timeline) · controller-pacing3-20261030-0002 1.05 s (timeline) · controller-pacing3-20261030-0003 1.05 s (timeline) · controller-pacing3-20261030-0004 1.05 s (timeline) · controller-pacing3-20261030-0005 1.05 s (timeline) · controller-pacing3-20261030-0006 1.05 s (timeline) · controller-pacing3-20261030-0007 1.05 s (timeline) · controller-pacing3-20261030-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1439&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-c75d7825/ai_flow_live.html?bench=1439&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1439`); it opens the seed that parts earliest, and the dropdowns choose another.

