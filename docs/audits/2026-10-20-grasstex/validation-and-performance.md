# Test/CI evidence, security boundaries, and performance baseline

Source baseline `f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`. CI evidence below is from PR head `3e84245026c1ae990d088f892371db48f038f32b`, which preceded the merge. Do **not** attribute the PR-head results to an independently executed audit or to a clean isolated test of the exact merge commit.

## What was and was not run

| Validation | Actual evidence | Interpretation |
| --- | --- | --- |
| Main `f89939f2f6e8` deployment | [Deploy Battle Runtime to 50webs, success](https://github.com/APPARANYX/grasstex/actions/runs/39371356554) | Deployment success, not a fresh full regression on merge SHA |
| PR-head CI | [CI run 39370831889](https://github.com/APPARANYX/grasstex/actions/runs/39370831889): Syntax and Sim regressions succeeded | Regression harness passed on parent PR head |
| PR-head 5 km browser QA | [Run 39370831855](https://github.com/APPARANYX/grasstex/actions/runs/39370831855): success, artifact `strategic-5km-browser-evidence` (ID 12240589480) | Browser loading, routes, vehicle/animation checks exercised. Limited scenario/timescale coverage. |
| PR-head native interception QA | [Run 39370831965](https://github.com/APPARANYX/grasstex/actions/runs/39370831965): success, artifact `native-strategic-interception-evidence` (ID 12241616874) | 900-s scenario runs exist, but *actual interceptions absent* in examined three ON arms |
| PR-head causal benchmark | [Run 39370831953](https://github.com/APPARANYX/grasstex/actions/runs/39370831953): success, 3 artifacts | Causal variants succeeded; does not prove full long-run mission closure |
| This audit's own execution | **Source/static and workflow review only** | No local checkout, new benchmark, instrumented battle, browser control, p95/p99 or full-system replay executed |

### Important existing numeric evidence — **not a new audit benchmark**

The [Strategic 5 km / Chromium job](https://github.com/APPARANYX/grasstex/actions/runs/39370831855) printed `STRATEGIC CHROMIUM PASS` with the following one-run telemetry:

| Metric | Recorded value | Qualification |
| --- | ---: | --- |
| Scenario extent | 5000 × 5000 m | CI fixture |
| Combatants | 50 US + 50 GE | Spawn data |
| Objectives / roads | 12 / 21 | Browser scenario data |
| Obstacles | 1,938 | Browser scenario data |
| Terrain vertices | 83,521 | Browser scenario data |
| Meshes / active meshes | 756 / 396 | Snapshot, not distribution |
| Reported FPS | **2.974** | One CI browser sample, not consumer hardware |
| FPS after five wall seconds | **1.634** | Same single CI browser sample |
| Simulation time after five wall seconds | **1.742 s** | Shows headless QA is not a realistic live-speed throughput baseline |
| Boot time | **5,968 ms** | Fixture-specific, includes page initialization |
| Reported JS heap | **39,600,000 bytes** | Single snapshot, no allocation/GC trend |
| Strategic/legacy FPS ratio | **0.551** | CI's own scenarios differ; **not** a valid architecture A/B effect estimate |

These measurements **do not establish a general frame rate or root-cause hotspot**. The job also uses a *silent PCM mock fixture* for absent private audio. Before choosing performance refactors, run real GPU/device/browser profiles and long-scenario captured distributions. Historical numbers are best used as warning that browser QA may be performance-limited.

### Interception success is not equivalent to functional intercept outcomes

The [Native 5km battle / interception ON-OFF job](https://github.com/APPARANYX/grasstex/actions/runs/39370831965) logged three independent ON/OFF 900-s simulations:

| Seed | ON-side forward screens | ON-side ground reports | ON-side **actual interceptions** | General's rejection evidence |
| --- | ---: | ---: | ---: | --- |
| `strategic-diag-001-meeting-0001` | 4 | 11 | **0** | two `declined` outcomes; 250 / 245 unavailable-squad evaluations, zero eligible-squad evaluations |
| `strategic-diag-001-ge-defend-0001` | 2 | 0 | **0** | `declined` with 295 unavailable-squad evaluations on GE, zero eligible |
| `strategic-diag-001-us-defend-0005` | 2 | 0 | **0** | `declined` with 335 unavailable-squad evaluations on US, zero eligible |

This is a **confirmed test-result coverage gap**, NOT definitive evidence the interception algorithm is broken. Screens and forward posts occurred in ON arms. But if a test is intended to establish successful interception, a pass that never attempts an eligible interception cannot establish that behavior. Add a separate **interception outcome gate** requiring at least one reproducible scenario with a viable squad, a feasible ETA, a granted interception, actual troop movement and an outcome report (plus negative/expired-intel controls). Do not fudge data or force success by weakening realistic eligibility rules. Test disabled and enabled flags explicitly.

## Existing regression surface and its strengths

- The repository contains 236 files under `tools/ai-sim-harness/` (includes fixtures/loader files, so **not 236 independent tests**).
- `tools/ai-sim-harness/state-ownership-check.js`: targeted mutation scanner for selected authoritative fields; catches direct and several indirect ownership violations, but is not a language-level type system.
- `tools/ai-sim-harness/squad-phase-check.js`: verifies single phase writer, all permitted phase labels, same-phase idempotence and mutation-specific behaviors.
- `tools/ai-sim-harness/start-wrapper-contract-check.js`: validates source shapes and wrapper order. Useful guard but not sufficient proof of actual start/restart semantics.
- `tools/ai-sim-harness/strategic-transport-check.js`: detailed boarding/reservation/arrival/reuse behavior; core fixture's `BattleNavigation.movementClear` is a stub at lines 63–66, so the physical contract must ALSO be checked with shipping navigation and obstacle code.
- `tools/ai-sim-harness/transport-resume-check.js`: verifies Meso anchor/route continuation for selected final phases, not a true browser physical interaction.
- `tools/ai-sim-harness/sight-query-check.js`: compares pruned/unpruned wall and LOS queries, but does not by itself establish moving-truck navigation/ballistics consistency.
- `tools/ai-sim-harness/benchmark-restart-isolation-check.js`, `fbx-restart-cleanup-check.js`, `player-restart-possession-check.js`, `module-unit-set-restart-check.js` cover diverse restart dimensions.
- `scripts/check-strategic-5km.cjs` validates 40 deterministic strategic generator seeds, graph, road topology, layout and scenario flags; **seeded generation != deterministic full battle replay**.

Representative references: [transport fixture](https://github.com/APPARANYX/grasstex/blob/f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9/tools/ai-sim-harness/strategic-transport-check.js#L56-L130), [state ownership checker](https://github.com/APPARANYX/grasstex/blob/f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9/tools/ai-sim-harness/state-ownership-check.js), [phase checker](https://github.com/APPARANYX/grasstex/blob/f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9/tools/ai-sim-harness/squad-phase-check.js), [strategic generator check](https://github.com/APPARANYX/grasstex/blob/f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9/scripts/check-strategic-5km.cjs).

## Correctness and determinism test matrix to run on a future authorized PR

| Case | Required assertions |
| --- | --- |
| Board → abort → dismount → new mission | All occupied seats released; no phantom reservation; stable individual position; new mission accepted |
| Travel → vehicle lost / route invalidated | Passengers dismount safely and continue last valid foot mission, or explicit failure reason; no teleport |
| Capture → order replacement → nearby truck reuse | Previous vehicle remains at real location; preferred reused vehicle not double-booked; objective remains authoritative |
| Death during seat entry/exit | Deceased actor no seat claim; survivor exit cursor progresses; vehicle eventually releasable |
| Permanently occupied exit | Bounded explicit recovery; no forever-`disembarking` state and no through-truck passage |
| Pause mid-boarding / mid-drive / mid-exit | No simulation-state mutation while paused; after resume exactly one logical step is applied |
| Manual end → restart → same seed | All generation-bound observers, caches, FX timers, meshes, occupancy and source-state reset; deterministic comparable outcome |
| Two squads request same truck on same tick | Exactly one claimant wins; loser retains valid foot mission without leaking reservation |
| Dynamic geometry off/on | Real collision, LOS, and ballistic query contract consistent within each declared profile; player and passenger exemptions explicit |
| Commander report withheld/stale | No access to hostile ground truth or interception proposal from unavailable intel |
| Launcher vs direct staged URL | Effective flags match requested profile, no silently dropped prerequisites |
| Optional hook throws during restart | Observer failure visible but authoritative sim recovers; **critical hook** failure blocks invalid resume |

**Execution strategy:** deterministic seed with recorded commands and flags; per-transition invariant snapshots; metamorphic tests for restart parity, observer enable/disable neutrality, both factions, and differing frame rates. Include 60-s, 600-s, 900-s and multi-restart same-page tests, following existing #430 and #361 hard gates. Test a 5 km scenario for 30 simulated minutes where suitable, not only scene boot and first seconds.

## Performance measurement design

Use [`scripts/battle-hotpath-profiler.cjs`](https://github.com/APPARANYX/grasstex/blob/f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9/scripts/battle-hotpath-profiler.cjs) (records inclusive wall times for core methods, hooks and navigation). It wraps methods and therefore incurs its own cost; measure with and without it. Follow existing repo standard benchmark protocol, rather than one-off local A/B fingerprint arms.

1. **Profiles:** standard tactical, 5 km strategic all features ON, 5 km with recon/interception OFF, transport/collision ON and OFF, late-game high-contact, and restart endurance.
2. **Runs:** matched fixed seeds/scenario sizes, same build/device and fixed query flags, warm/cold boots, ≥3 runs per profile for distributions; add older/main control when comparing a PR.
3. **Per-tick:** 50th/95th/99th-percentile wall duration of full simulation step, commander tick and movement resolution; max stall and backlog debt.
4. **By subsystem:** exclusive CPU ms and call count for macro, Meso, Engagement, perception, nav routing, obstacle query, ballistic LOS/fire, transport, render pose/LOD, telemetry/provenance and map.
5. **Memory/render:** heap and retained entity counts at 0/5/15/30 simulated min, allocation per tick, GC events/pauses, renderer draw calls/active mesh and texture memory, frame-time p50/p95.
6. **Scaling:** same 5 km world at 50,100,200 soldiers, fixed proportion trucks/obstacles with matched seeds; fit cost vs N, NlogN and N², measure rather than infer.
7. **Hard invariants:** zero infinite liveness loops or invalid collisions, unchanged deterministic replay if instrument-only, no decrease in objective progress/decision fidelity from throttling.
8. **Artifacts:** store JSON profiles, signed commit + flags + seed + clock policy + browser/device info with GitHub Actions artifacts; preserve historical results.

**No p95/p99 simulation-tick baseline, CPU hotspot breakdown, actual diagnostic overhead, or allocation churn was obtained by this audit.** Do not assign a performance benefit number or change decision frequency without this baseline.

### Plausible hotspot candidates (all UNMEASURED)

- Multiple wall/geometry queries in the soldier path [`battle-sim.js:768–835`](https://github.com/APPARANYX/grasstex/blob/f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9/battle/battle-sim.js#L768-L835).
- Per-frame transport fleet and visual state scanning [`59-strategic-truck-visual.js:708+`](https://github.com/APPARANYX/grasstex/blob/f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9/battle/modules/59-strategic-truck-visual.js#L708-L727); fleet is 12 vehicles under current strategic defaults, so optimization may have trivial effect.
- Bullet obstruction refine passes + repeated `segmentBlocked` [`14-z-ballistic-raycast.js:289–300`](https://github.com/APPARANYX/grasstex/blob/f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9/battle/modules/14-z-ballistic-raycast.js#L289-L300).
- Source-provenance field setter instrumentation [`36-order-provenance.js:308–345`](https://github.com/APPARANYX/grasstex/blob/f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9/battle/modules/36-order-provenance.js#L308-L345).
- Report/corridor search and full-world scans in interception planning; only optimize after measured call counts and decision fidelity comparison.
- Mesh imports, seat animation prep, soldier pose scheduling, visibility/culling; current truck visual already instances shared imported source and texture caps, so do not revert known improvements.
- Existing Command Reception once-per-time settlement is a **corrected** prior O(N²) issue, not a newly measured current hotspot [`18-command-reception.js:512–540`](https://github.com/APPARANYX/grasstex/blob/f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9/battle/modules/18-command-reception.js#L512-L540).

## PHP, deployment, and security assessment

| Boundary | Observed contract | Outstanding proof |
| --- | --- | --- |
| Persistent policy/learning POST | Origin-only validation + schema bounds; no caller auth | Restrict/disable server writes, verify external host policies. SEC-01 |
| Wargame referee API | Role/admin keys and hashes plus same-origin write protection | Input/rate-limit/retention audit not exhaustive |
| FBX calibration upload | `X-Lab-Key` server hash and strict filename parsing | Resource/size limits and deployment permissions not exhaustively tested |
| Preview launcher | Same-repo branch/PR validation, path filtering and staging | Flag loss PREV-01; same-origin privilege and preview storage/access to confirm |
| Main deployment | Merge gate and FTP upload protections; branch previews isolated conceptually | Actual installed PHP/asset build hash vs source + every script verified on host; failover equivalence |
| Module import source | GitHub raw source and host local fallback | Host cache/module source mismatch can create version skew; log exact module manifest/hash in exports |
| Source policy genome | Stashed by code-default configuration | POST remains active server-side unless separately disabled |

No production security exploit was attempted. Sensitive GitHub Actions secrets were not requested or inspected; protect existing deployment and historical artifacts.
