# Benchmark run #1269 · 100 seeds from `gap-hold-20261022` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1`
- work/gap-holding-20261022 @ 3b1b1a2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39830765670) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 184.05 s); 2 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.2% (p 0.3099)**

- Under 0.05 only: regroups.entries 391 to 453 (+15.9%, p 0.0106); recon.reportsDelivered 577 to 759 (+31.5%, p 0.0273).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.923 (gate 1.25)
- the 100 changed records first part at simulated second: min 151.05, p10 166.05, median 184.05, p90 221.1, max 256.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5412 | 5399 | -0.13 | 97 | 43 | 54 | 0.3099 |
| `usKills` | 2553 | 2634 | 0.81 | 96 | 52 | 44 | 0.4752 |
| `geKills` | 2859 | 2765 | -0.94 | 96 | 47 | 49 | 0.9188 |
| `fire.total` | 25574 | 25919 | 3.45 | 99 | 54 | 45 | 0.4215 |
| `fire.hits` | 10467 | 10213 | -2.54 | 96 | 43 | 53 | 0.3584 |
| `retreatSamples` | 140497 | 140206 | -2.91 | 100 | 51 | 49 | 0.9204 |
| `movementResolver.changes` | 324568 | 317572 | -69.96 | 100 | 47 | 53 | 0.6173 |
| `grenades.throws` | 18 | 25 | 0.07 | 20 | 11 | 9 | 0.8238 |
| `grenades.bursts` | 18 | 25 | 0.07 | 20 | 11 | 9 | 0.8238 |
| `grenades.wounded` | 8 | 18 | 0.1 | 9 | 5 | 4 | 1 |
| `grenades.casualties` | 3 | 6 | 0.03 | 5 | 3 | 2 | 1 |
| `grenades.suppressed` | 31 | 43 | 0.12 | 15 | 8 | 7 | 1 |
| `grenades.friendlyWounded` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 2 | 0.02 | 2 | 2 | 0 | 0.5 |
| `movementStalls.length` | 2 | 1 | -0.01 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 581 | 548 | -0.33 | 87 | 38 | 49 | 0.2836 |
| `loopAlerts.length` | 709 | 712 | 0.03 | 90 | 43 | 47 | 0.752 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 391 | 453 | 0.62 | 82 | 53 | 29 | 0.0106 |
| `stallOutcomes.wakes` | 15 | 6 | -0.09 | 15 | 4 | 11 | 0.1185 |
| `stallOutcomes.repeats` | 6 | 3 | -0.03 | 5 | 2 | 3 | 1 |
| `timeline.stalledOnsets` | 2 | 1 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 36 | 12 | -0.24 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 1 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 36 | 12 | -0.24 | 1 | 0 | 1 | 1 |
| `recon.orders` | 3087 | 3082 | -0.05 | 89 | 46 | 43 | 0.8323 |
| `recon.contacts` | 140 | 157 | 0.17 | 47 | 30 | 17 | 0.0789 |
| `recon.noContact` | 1923 | 1926 | 0.03 | 84 | 48 | 36 | 0.2299 |
| `recon.timeouts` | 27 | 23 | -0.04 | 27 | 12 | 15 | 0.7011 |
| `recon.cancelled` | 878 | 852 | -0.26 | 88 | 37 | 51 | 0.1654 |
| `recon.reportsDelivered` | 577 | 759 | 1.82 | 60 | 39 | 21 | 0.0273 |
| `recon.retriggerBlocked` | 2400 | 2426 | 0.26 | 84 | 44 | 40 | 0.7436 |
| `squadPerformance.meanOverall` | 8164.300000000001 | 8171.100000000002 | 0.068 | 99 | 51 | 48 | 0.8408 |
| `squadPerformance.p10Overall` | 7504.200000000002 | 7524.599999999999 | 0.204 | 59 | 34 | 25 | 0.2976 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6756.699999999999 | 6805.599999999999 | 0.489 | 95 | 54 | 41 | 0.2181 |
| `squadPerformance.meanMovement` | 9971.999999999998 | 9972.699999999995 | 0.007 | 64 | 34 | 30 | 0.708 |
| `squadPerformance.meanControl` | 9402.299999999997 | 9368.000000000004 | -0.343 | 99 | 51 | 48 | 0.8408 |
| `squadPerformance.meanCohesion` | 8958.499999999998 | 8923.899999999996 | -0.346 | 100 | 46 | 54 | 0.4841 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

gap-hold-20261022-0086 151.05 s (timeline) · gap-hold-20261022-0032 158.1 s (timeline) · gap-hold-20261022-0033 158.1 s (timeline) · gap-hold-20261022-0020 160.05 s (timeline) · gap-hold-20261022-0017 161.1 s (stress) · gap-hold-20261022-0016 162 s (timeline) · gap-hold-20261022-0091 163.05 s (timeline) · gap-hold-20261022-0046 164.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1269&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/gap-holding-20261022/ai_flow_live.html?bench=1269&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1269`); it opens the seed that parts earliest, and the dropdowns choose another.

