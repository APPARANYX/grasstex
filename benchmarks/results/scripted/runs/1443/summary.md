# Benchmark run #1443 · 60 seeds from `controller-pacing4-20261030` (us-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-946eaa95 @ 946eaa9 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41059148268) · build v29-dev

## Verdict

**MOVED: 55 of 55 pairs changed (median first part 1.05 s); 18 of 42 counters under p 0.05 (about 2.1 by chance), 13 under 0.0012; casualties -12.2% (p 0.1263)**

- Clears the Bonferroni line (p < 0.0012): fire.total 11713 to 17581 (+50.1%, p 0); movementResolver.changes 75945 to 99521 (+31.0%, p 0); loopAlerts.length 145 to 519 (+257.9%, p 0); stallOutcomes.wakes 0 to 54 (new, p 0); recon.orders 871 to 1347 (+54.6%, p 0); recon.contacts 102 to 231 (+126.5%, p 0); recon.noContact 497 to 408 (-17.9%, p 0); recon.cancelled 197 to 627 (+218.3%, p 0); squadPerformance.meanOverall 4787.999999999998 to 4665.3 (-2.6%, p 0); squadPerformance.meanMission 4271.2 to 3882.000000000001 (-9.1%, p 0); squadPerformance.meanControl 5395.500000000001 to 5254.3 (-2.6%, p 0); recon.reportsDelivered 463 to 922 (+99.1%, p 0.0001); retreatSamples 7123 to 10313 (+44.8%, p 0.0004).
- Under 0.05 only: squadPerformance.meanCohesion 4864.699999999999 to 5000.9 (+2.8%, p 0.0027); fire.hits 2074 to 1838 (-11.4%, p 0.03); vacantObjectiveStalls.length 0 to 6 (new, p 0.0313); squadPerformance.p10Overall 4278.599999999999 to 4204.799999999998 (-1.7%, p 0.0444); usKills 484 to 404 (-16.5%, p 0.0489).
- Wall time on/off x1.767 is over the 1.25 gate.
- Runtime errors: off 1, on 0.

## Paired comparison (off against on)

- **55** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 1 / on 0 · wall time on/off x1.767 (gate 1.25)
- the 55 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 956 | 839 | -2.1273 | 52 | 20 | 32 | 0.1263 |
| `usKills` | 484 | 404 | -1.4545 | 51 | 18 | 33 | 0.0489 |
| `geKills` | 472 | 435 | -0.6727 | 51 | 21 | 30 | 0.2624 |
| `fire.total` | 11713 | 17581 | 106.6909 | 54 | 49 | 5 | 0 |
| `fire.hits` | 2074 | 1838 | -4.2909 | 55 | 19 | 36 | 0.03 |
| `retreatSamples` | 7123 | 10313 | 58 | 55 | 41 | 14 | 0.0004 |
| `movementResolver.changes` | 75945 | 99521 | 428.6545 | 55 | 52 | 3 | 0 |
| `grenades.throws` | 3 | 8 | 0.0909 | 3 | 3 | 0 | 0.25 |
| `grenades.bursts` | 3 | 8 | 0.0909 | 3 | 3 | 0 | 0.25 |
| `grenades.wounded` | 3 | 8 | 0.0909 | 3 | 3 | 0 | 0.25 |
| `grenades.casualties` | 0 | 2 | 0.0364 | 2 | 2 | 0 | 0.5 |
| `grenades.suppressed` | 5 | 18 | 0.2364 | 3 | 3 | 0 | 0.25 |
| `grenades.friendlyWounded` | 0 | 1 | 0.0182 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 2 | 0.0364 | 2 | 2 | 0 | 0.5 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 6 | 0.1091 | 6 | 6 | 0 | 0.0313 |
| `loopAlerts.length` | 145 | 519 | 6.8 | 53 | 50 | 3 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 57 | 120 | 1.1455 | 41 | 27 | 14 | 0.0596 |
| `stallOutcomes.wakes` | 0 | 54 | 0.9818 | 53 | 53 | 0 | 0 |
| `stallOutcomes.repeats` | 0 | 5 | 0.0909 | 5 | 5 | 0 | 0.0625 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 871 | 1347 | 8.6545 | 54 | 52 | 2 | 0 |
| `recon.contacts` | 102 | 231 | 2.3455 | 47 | 42 | 5 | 0 |
| `recon.noContact` | 497 | 408 | -1.6182 | 49 | 4 | 45 | 0 |
| `recon.timeouts` | 24 | 23 | -0.0182 | 9 | 4 | 5 | 1 |
| `recon.cancelled` | 197 | 627 | 7.8182 | 54 | 52 | 2 | 0 |
| `recon.reportsDelivered` | 463 | 922 | 8.3455 | 51 | 40 | 11 | 0.0001 |
| `recon.retriggerBlocked` | 465 | 482 | 0.3091 | 43 | 24 | 19 | 0.5424 |
| `squadPerformance.meanOverall` | 4787.999999999998 | 4665.3 | -2.2309 | 55 | 10 | 45 | 0 |
| `squadPerformance.p10Overall` | 4278.599999999999 | 4204.799999999998 | -1.3418 | 49 | 17 | 32 | 0.0444 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4271.2 | 3882.000000000001 | -7.0764 | 55 | 10 | 45 | 0 |
| `squadPerformance.meanMovement` | 5480 | 5477.000000000001 | -0.0545 | 42 | 18 | 24 | 0.4408 |
| `squadPerformance.meanControl` | 5395.500000000001 | 5254.3 | -2.5673 | 55 | 7 | 48 | 0 |
| `squadPerformance.meanCohesion` | 4864.699999999999 | 5000.9 | 2.4764 | 55 | 39 | 16 | 0.0027 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing4-20261030-0001 1.05 s (timeline) · controller-pacing4-20261030-0002 1.05 s (timeline) · controller-pacing4-20261030-0003 1.05 s (timeline) · controller-pacing4-20261030-0004 1.05 s (timeline) · controller-pacing4-20261030-0005 1.05 s (timeline) · controller-pacing4-20261030-0006 1.05 s (timeline) · controller-pacing4-20261030-0007 1.05 s (timeline) · controller-pacing4-20261030-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1443&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-946eaa95/ai_flow_live.html?bench=1443&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1443`); it opens the seed that parts earliest, and the dropdowns choose another.

