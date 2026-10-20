#!/usr/bin/env python3
"""Write the explicitly requested audit deliverables from measured artifact summaries."""
import json
from pathlib import Path
root=Path('docs/audits/2026-10-20-grasstex/runtime-verification');s=json.loads((root/'artifacts/campaign-summary.json').read_text())
def write(name,text):
 for p in root.rglob('*.gz'):
  rel=str(p.relative_to(root));text=text.replace(']('+rel[:-3]+')',']('+rel+')')
 (root/name).write_text(text.strip()+'\n')
rows='\n'.join(f"| {c['name']} | {c['battles']} | {c['simulatedSeconds']:.2f} | {c['outcomes']} | {sum(c['captures'])} | {c['movementAlerts']}/{c['routeAlerts']}/{c['loopAlerts']} | {c['runtimeErrors']} |"for c in s['campaigns'])
write('runtime-verification.md',f'''
# Runtime verification — 2026-10-20

**Verdict: substantial verified functionality, with bounded robustness defects and significant remaining coverage gaps. No basis for an unconditional correctness or efficiency certification.** The evidence supports incremental corrections, not a rewrite.

## Reproduction and scope

Frozen gameplay baseline: `f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`. Audit parent `5945793baa5a78762a4105039f23857115b1cac0` differs only in five existing audit documents. Branch `audit/runtime-verification-20261020`. Current upstream main at start: `fa99ec8f15acf0f76d83e7f5a4317191ab5a61e5`; its newer defaults are **not** the baseline. [Environment and open PR inventory](artifacts/environment.json), [default-drift execution](artifacts/default-drift.json).

Success criteria: fresh deterministic-seed executions; measured runtime/CPU evidence; explicit composed flag checks; isolated reproducible failures; committed reports and artifacts; no gameplay edits, test weakening, merge or deployment. Execution evidence is delivered; exhaustive coverage and live production certification are not achieved.

{ s['benchmarkBattles'] } standard benchmark battles, {s['profileBattles']} repeated profile battles, and {s['nativeInterceptionBattles']} native interception battles: **{s['fixedStepBattleExecutions']} fixed-step battle executions**. Short rendered smoke/5 km checks, lifecycle pulses and unit-test fixtures are counted separately. Benchmark battles alone cover **{s['benchmarkSimulatedSeconds']:.2f} simulated seconds**. Five seeds per main scenario class; the original six paired native long battles are supplemented by five observe-only runs across five unique seeds; this is not five native seeds per defensive deployment. Each benchmark seed and exact query is saved in [campaign summary](artifacts/campaign-summary.json) and batch manifests. Prefixes differ between scenario classes: these are coverage runs, not paired tactical effect estimates.

| Campaign | Battles | Sim seconds | Outcomes | Total captures | Movement/route/loop alerts | Runtime errors |
|---|---:|---:|---|---:|---|---:|
{rows}

## What actually ran

- Existing `run_battle_benchmark.mjs`: full shipping simulation, procedural soldier rigs, 0.15 s fixed steps and 0.45 s commander updates, existing timeline/evidence diagnostics. Rendering stopped during battle stepping; live telemetry writes disabled; policy endpoint deliberately unavailable, falling back to stashed runtime defaults. This is not the native render-loop scheduler.
- Existing `probe_strategic_5km.cjs`: real Chromium/Babylon terrain, 5 km bounds, 12 objectives, six base routes, simulation advancement, classic map control, and **explicitly forced** road-handoff fixture. Private audio replaced with the probe's existing silent WAV fixture; navigation and AI are real. No claim that the forced re-task was a natural command decision.
- Existing native interception probe: shipping 5 km sim, 900 s per case, paired interception gates, fleet/reserve/planner/physical timing traces. Media-only preload uses the same silent WAV method as the 5 km probe; no synthetic enemies or hits. See [native evidence](artifacts/native-interception/native-interception-evidence.json), [execution manifest](artifacts/extra-executions.json).
- Existing browser smoke: constructed and advanced to 4.25 s, but exited nonzero on absent private MP3 assets. That infrastructure failure remains recorded in [log](artifacts/browser-smoke.log); it was not converted into a pass.
- {s['harnessRuns']} existing harness invocations passed: 219 `*-check.js` files plus `run.js` at seeds 12345,1,2,3,5,8,13,21. The harness extracts production movement code while stubbing animation/local steering and Babylon; never equate these checks with browser battles. [Results](artifacts/checks.json).
- {s['staticChecks']} syntax/loader/strategic checks passed. These include tracked JS/PHP syntax, preview launcher and strategic script contracts, not a GitHub CI run. Private-audio mastering, deployment and secret-dependent jobs were not run. The follow-up also reran strategic-interception-check.js successfully after adding optional probe seed/mode selection. [Results](artifacts/static-checks.json).

The pinned hosted stage returned HTTP 404. Local unpushed-checkout fallback used PHP 8 and Playwright 1.55.0 / Chromium 140.0.7339.16 on Apple M1, 16 GiB, macOS (exact versions in environment artifact). No preview launcher staging, branch push or deployment was performed. SwiftShader and missing assets limit rendering/device conclusions.

## Findings and confidence limits

Normal benchmark records reported zero non-asset browser runtime errors and zero writer conflicts. Stall/loop alerts are triage evidence, **not confirmed bugs**: motor and interception short runs contain movement alerts; long all-intended runs contain route/vacancy alerts. Preserve the seeds and inspect their windows before changing tactics. Short classic battles often had no captures because movement had not reached objectives; strategic initial captures include own-side base objectives.

Repeated same-seed profiling runs agree on their captured final counters/fleet/recon state across plain, wrapped and CDP runs. This is coarse replay consistency, not byte-identical internal-state or cross-browser determinism. Independent fresh-session full-state replay remains outstanding.

The ineffective `soldiers=200` query was detected from actual roster counts (100). That campaign and its profile are retained as a 100-soldier control. Real 200-soldier stress uses five production infantry reinforcements per faction and verifies 100+100 actors before measurement.

Failure classification: no existing harness/static baseline failures were observed; the original smoke/full-fidelity failures were missing-private-audio infrastructure failures; the full-fidelity follow-up passed with the explicit silent-media fixture. The first native launch failed before browser execution because NODE_OPTIONS split a path containing spaces; the launch was corrected to pass --require as a separate argv element and all six native cases then passed. That first diagnostic launch failure is retained in native-interception-first-launch.log and native-interception-launch-failure.json. No test was disabled or weakened, no identified flaky test was relabeled as a pass, and injected failure-path results are separate from natural battle behavior.

No exhaustive soldier/geometry penetration census, every-frame seat ownership census, every mission-version transition, heap-retention proof, all 174 query candidates' semantics, or deployed effective configuration was established. No experimental simplifications were merged or gameplay behavior altered. See [defects](confirmed-defects.md), [CPU](cpu-performance.md), [state machines](state-machines.md), [flags](feature-flags.md), and [roadmap](architecture-simplification-roadmap.md).
''')
pr='\n'.join(f"| {p['name']} | {sum(p['roster'])} | {p['requested']['seconds']} | {p['plainMedianMs']:.1f} | {p['mainTaskMedianMs']:.1f} | {p['wrapperOverheadPct']:.1f}% | {p['plainTickMs']['mean']:.2f}/{p['plainTickMs']['p50']:.2f}/{p['plainTickMs']['p95']:.2f}/{p['plainTickMs']['p99']:.2f} |" for p in s['profiles'])
hot=''
for p in s['profiles']:
 if p['name']=='stress':continue
 hot+=f"\n### {p['name']} — median of three wrapped runs\n\n| Entry point | Inclusive ms | Calls | Mean µs | Max ms | Wrapped wall % |\n|---|---:|---:|---:|---:|---:|\n"
 hot+='\n'.join(f"| `{r['label']}` | {r['totalMs']:.1f} | {r['calls']:.0f} | {r['avgUs']:.2f} | {r['maxMs']:.2f} | {r['wallPct']:.1f}% |"for r in p['hotpaths'][:22])+'\n'
write('cpu-performance.md',f'''
# CPU performance report

**100 soldiers take 2.18 s median to execute 120 simulated seconds; 200 take 5.79 s.** This measures fixed-step simulation on one M1 host, not production FPS or a hardware-independent performance target. The larger roster uses the production reinforcement API; its different squad/spawn structure makes the 2.65× cost increase a scaling observation, not a controlled complexity proof.

[Raw runs](artifacts/profiles/runs.json) preserve every tick duration, inclusive function total/call count/max, heap samples, Chrome performance metrics and final counters. [Derived summary](artifacts/campaign-summary.json) includes hot paths and sampled self time. CDP `.cpuprofile` files beside the raw runs open in Chrome DevTools and preserve call stacks. Large raw artifacts are gzip-compressed; decompress before opening CPU profiles in DevTools. Profile script: `node scripts/audit/profile-runtime.cjs`; `--load-only` appends the real 200-soldier workload after existing profiles.

Three plain and three wrapped runs alternate for each workload; one additional CDP-sampled run per workload. Same seed `runtime-profile`, 0.15 s fixed step, runtime-default stashed policy, rendering stopped, procedural animation. Runs execute serially after the battle batches. Timing clock resolution is approximately 0.1 ms; individual tiny hook timings are coarse. Full per-function latency histograms were not measured.

| Workload | Actual actors | Sim s/run | Plain median wall ms | Main-task delta median ms | Wrapper overhead | Step mean/p50/p95/p99 ms |
|---|---:|---:|---:|---:|---:|---|
{pr}

`stress` is the ineffective query control and remains at 100 actors. Tick distribution pools three plain runs (2400 steps for 120 s, 3600 for 180 s); it includes commander work when due. Main-task deltas are Chrome `TaskDuration` around the evaluation and include bridge/cleanup work; they are an approximation to browser main-thread CPU, not total CPU across renderer/GPU/driver/worker processes. No credible total-process CPU sum was obtained. No per-subsystem p99 is invented from max/mean aggregates. Inclusive entries overlap and percentages must not be summed.

The instrumentation penalty is real (~9–14%). CDP run wall times and raw heap deltas are provided separately; warm-up/JIT/GC and ordering mean these small samples do not identify an exact sampling-only overhead. First repetitions are slower. The wrappers preserve their captured final counters, but this does not prove hidden-state parity.
{hot}
## Measured opportunities

At 200 actors, sampled `publicRecord` in `18-command-reception.js:504` costs about 539 ms self time; `detectionRange` in `squad-ai.js:304` about 433 ms; `destinationFree` in `51-soldier-personal-space.js:108` about 254 ms. These are sampled costs in the CDP workload, not projected savings. Command-reception DTO construction/copying, repeated perception queries and personal-space candidate queries warrant narrowly scoped experiments with unchanged semantics. Preserve immutable/public snapshot contracts and cache invalidation. Do not remove command reception or navigation features.

Vehicle transport and aerial-recon hooks are small in the measured 180 s profile (about 14 ms and 4.7 ms inclusive), while movement resolution, squad/soldier work and hook observers are larger. This does not measure the worst interception combat phase. Order-provenance commander hooks are about 9–19 ms per run; no evidence supports deleting provenance to cure the main cost. Hook dispatch time includes all hooked systems and is not wrapper overhead alone.

## Rendering, memory and omissions

Separate five-second native-render CPU samples cover scene/FBX/animation/browser work before fixed-step runs. They include startup shader/texture compilation, idle time and SwiftShader driver calls; they are neither steady-state production render costs nor directly comparable to procedural simulation CPU. The existing full-fidelity runner measured 44 frames over 10.086 wall seconds with 100/100 FBX actors after 90 s simulated warm-up. Mean scene render cost was 187.56 ms/frame; simulation 5.70 ms/frame; FBX pose 1.70 ms/frame (45 pose observations). Frame CPU p50/p95/p99 was 209.71/245.49/670.02 ms, heavily dominated by software WebGL. That initial run exited 1 on five missing-private-audio page errors. The follow-up fixed media-fixture route precedence and the same full-fidelity assertions then passed; both original failure and fresh pass are preserved. The fresh pass used 100 FBX actors and recorded 31 frames over 15.023 s: mean scene render 77.29 ms, simulation 13.78 ms and pose 3.79 ms per observed frame. These short software-renderer samples vary substantially and do not establish a performance improvement. See [follow-up execution](artifacts/full-fidelity-followup/execution.json) and [raw measurements](artifacts/full-fidelity-followup/full-fidelity.json). See [raw full-fidelity output](artifacts/full-fidelity/full-fidelity.json). Do not infer a 60 FPS guarantee from these simulation timings.

Heap deltas and sampled GC are preserved, but no forced-GC retained-heap analysis or allocation-by-stack trace was obtained. Repeated procedural runs keep observer counts stable (114 legacy, 122 strategic, 214 for the reinforced load). Synchronous imported-model restarts initially appeared to accumulate observers; public lifecycle revalidation with actual rendered frames keeps total/active observers at 13 across three public restarts. Yielding alone did not drain the render-dependent cleanup. This is not a confirmed leak; see observer-retention.json.

Scheduling, collision/ballistics, terrain, objective hooks and observer work are represented by existing wrappers/CDP samples where active. Zero/absent timing rows mean unobserved or inaccessible work, not zero cost. Fixed-clock debt under long native rendering, worker/GPU time, driver attribution and every optional module's peak remain unmeasured.
''')
write('confirmed-defects.md','''
# Confirmed defect and robustness register

All source references below refer to baseline `f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`. No production correction is included.

| ID | Severity | Confirmed result | Reproduction and evidence | Correction and regression gate |
|---|---|---|---|---|
| PREV-01 | Medium | Unchanged PHP allowlist forwards only strategicInterception from all five requested strategic flags. | `preview.php:378–384`; `artifacts/preview-propagation.json`; run the fragment with PHP CLI and query shown in the artifact. Seed irrelevant; no live endpoint mutation. Browser API matrix independently proves omitted prerequisites keep baseline subsystems inactive. | Share declared flag metadata between loader and QA; allow intended flags through, reject unsupported dependencies in QA, and assert effective APIs after redirect. End-to-end preview regression for each independent opt-out/on dependency. |
| BALL-01 | Medium robustness; natural occurrence unproven | A normal obstructed ray returns blocked; after obstacle and navigation services both throw, it returns unblocked. | `battle/modules/14-z-ballistic-raycast.js:271–287`; `node scripts/audit/verify-runtime-contracts.cjs`; `artifacts/fault-injection.json`. Flat terrain, elevated ray, injected throws; no seed dependence. | Define fail-safe unknown-geometry behavior and bounded diagnostics. Regression: each query throws alone/both; obstacle-free ordinary rays stay clear; known walls stay blocked. Gameplay impact needs paired benchmark before a fix ships. |
| TRN-01 | Medium liveness; controlled obstruction only | With truckAccess=1 and every exit rejected, 10 passengers and truck reservation remain in disembarking for 600 s. Removing the obstruction recovers to dismounted with zero passengers. | `battle/modules/58-strategic-abstract-transport.js:874–882`; `node scripts/audit/verify-blocked-dismount.cjs`; `artifacts/blocked-dismount.json`. Existing transport fixture, motorTransport=1&truckAccess=1, deterministic ticks, stub navigation denies all exits. | Bounded alternate-exit/relocation/retry policy owned by transport. Never teleport through geometry or release occupied seats. Regression: persistent block, transient block, death during exit, mission interruption, restart and vehicle reuse. Natural incidence and acceptable tactical wait remain unmeasured. |

QA-CFG-01 is a **low-severity developer-tool configuration discrepancy**, not a natural battle defect: `battle/modules/98-damage-range.js:35–37` converts absent query values to zero before clamping. Thus `rangeInterval` defaults to 0.35 s despite a 1.25 s fallback argument, and `rangeDist` to 2.5 m despite a 5.4 m fallback. `node scripts/audit/execute-loader-range-flags.cjs` executes the original helper for absent, empty, zero, valid numeric and invalid inputs; see [numeric cases](artifacts/loader-range-flag-executions.json). Confirm the intended absent-value contract before correcting it; preserve valid explicit zero/minimum and invalid-value fallback semantics. This does not justify a production gameplay change.

LIFE-01 is **confirmed containment behavior, not a demonstrated production lifecycle defect**: an injected restart-hook failure is logged, swallowed, and the next hook runs. `battle/module-registry.js:131–140`; `artifacts/fault-injection.json`. Define which hooks are essential and aggregate failures before reporting lifecycle success; maintain intentional best-effort presentation hooks. Regression must distinguish essential state failure from optional observer failure.

No naturally occurring soldier-through-truck, blocked-projectile penetration, duplicate passenger/seat corruption, failed public restart, permanently stuck squad, invalid objective transition or contradictory authoritative order was established by this campaign. Existing checks exercise some of those boundaries, but they do not certify every-frame live behavior.

SEC-01 from the original audit remains a source-confirmed authentication concern, outside this runtime campaign's destructive endpoint testing. No persistent production POST was sent, so live exploitability is not certified. PHY-01 remains layered geometry coupling: the composed rotated-truck fixture passed movement, ballistic stop, detour, roof-clearance and complete transport assertions. PHASE-01/STATE-01 remain architectural debt, not newly reproduced corruption. Tactical stalls/loops and declined interception plans are suspicious only when mission-specific evidence rules out valid tactical behavior.
''')
write('state-machines.md','''
# State-machine validation

## Executed coverage

[227 harness invocations](artifacts/checks.json) ran every existing check, including Engagement transitions, Meso phases, Macro lifecycle, ownership/writer ratchets, movement recovery, command adoption, transport reuse/resume, collision, reconnaissance, interception, restart isolation and fixed-step clocks. These are mixed static assertions and runtime fixtures, not uniformly real browser state machines. The authoritative ownership model remains in the existing architecture audit; no new parallel authority was introduced.

| System | Authority and derived state | Fresh evidence | Remaining uncertainty |
|---|---|---|---|
| Engagement/movement | Engagement state/stance; resolver destination; navigation route | engagement-state, movement-state/recovery, arrival-adoption, command-movement and ownership checks passed | Every-frame geometry and dead-actor invariants in all optional flags |
| Squad mission | Meso commandPhase and local plan; Macro brief/version and target | squad-phase, macro-state, strategic-chain/recovery checks passed; browser timeline and conflict rows captured | Fully connected phase adjacency does not itself validate every semantic transition; no evidence justifies collapsing phase labels |
| Command reception | Authoritative per-recipient envelope/adoption; public copies derived | command checks passed; CPU sampling identifies publicRecord copying as material | Cache immutable derived records only after version/recipient semantics are covered |
| Vehicle/transport | Fleet allocation and squad task; seat order, boarded/exited IDs and passenger classification overlap | transport fixture covers exclusive allocation, serial entry/exit, interruption, reuse, collision and own-body exclusion; extended all-exits-blocked case reproduces missing bounded recovery | Full live seat census and indefinite obstruction prevalence not measured |
| Recon/interception | Faction-local bounded report; General owns issued mission | aerial-recon and interception checks passed; native long-run evidence records planner attempts, actual dispatches and physical arrival separately | Planner enabled or declined is not successful interception; three natural seeds do not certify all tactical opportunities |
| Objectives | Objective system owner/pressure; visual state derived | objective-nav, faction-progress and strategic-front-line checks passed; benchmark final objectives and captures recorded | Alert rows and initial own-base captures need contextual interpretation |
| Battle lifecycle | Core sim plus public control wrappers; scene/model observers and module resets | public End/resume/restart stress artifact, terminal no-advance checks, old roots disposed and roster identity checked | Headless raw restart bypasses operator state by design; it cannot certify public UI reset or retained heap |
| Rendering/models | FBX backend owns rigs; LOD list/observers derive presentation | FBX cleanup checks and native render samples; media-only fixtures do not substitute geometry/AI | Deferred observer removal must be allowed to drain; no retained-heap proof |

## Lifecycle experiment interpretation

`node scripts/audit/verify-public-lifecycle.cjs` executes ten cycles per legacy/combined page. Each cycle uses public restart, steps briefly, ends early, calls resume and step, then restarts again. Results are in [public-lifecycle.json](artifacts/public-lifecycle.json): compare time before/after terminal step, manualEnded/winner after restart, old actor references, disposed roots, roster, fleet, transport/recon reset, total and active observer counts. Expected: terminal resume false, stable terminal time, cleared terminal flags, fresh actors and no stale transport tasks.

The first synchronous test is retained in [public-lifecycle-synchronous.json](artifacts/public-lifecycle-synchronous.json). It stopped rendering and performed all cycles in one JS task; counts rose by 200 per two restarts. Yielding alone did not clear them. A follow-up attribution probe performed four real rendered frames plus an asynchronous wait between each public restart: total and active observers stayed at 13 for all three restarts. See [observer-retention.json](artifacts/observer-retention.json). The stopped-render count is not evidence of a live retained-observer leak. Raw profiler restarts similarly leave operator manualEnded unchanged; public control explicitly clears it. Neither result should be promoted into a gameplay defect.

The dismount extension blocks all exits for 600 s, then releases geometry. It proves missing bounded recovery, preserves the important no-penetration invariant, and proves recovery on transient obstruction. It does not justify forced ejection or premature seat release.

The five-run follow-up captures squad eligibility at the actual Macro maybeIssue boundary without issuing orders or re-running the planner. At 70.2 s, capture squads were embarked, screen squads were boarding and transportUsed=true, while defending squads were prepared garrisons. The real guard therefore rejects them before ETA evaluation; no eligible squad reaches path/transport quoting. See [follow-up traces](artifacts/interception-followup/native-interception-evidence.json) and [three repeated-seed counter comparisons](artifacts/interception-followup-summary.json). The one-shot report becomes available while the force is already committed. This explains the declines but does not establish a tactical defect or justify stealing valid missions.

No state-machine refactor was attempted. Preserve Macro→Meso→Engagement→Resolver ownership and replace duplicate representations only after a migration test proves mission adoption, seat ownership, interruptions and replay remain equivalent. Hook fault containment needs a declared criticality policy; silent success after essential-hook failure is a reliability risk, even though no natural hook exception occurred in normal benchmark records.
''')
write('feature-flags.md',f'''
# Feature-flag verification

**64 composed activation cases passed**: all 32 combinations of five strategic switches on strategic and legacy fixture profiles. This is exhaustive for those gates only, not for all gameplay interactions. Hooks and public production APIs initialize fleets/colliders and expose recon/interception state; no regex-only fake activation result is substituted. [Matrix](artifacts/strategic-flag-matrix.json), runner `scripts/audit/verify-runtime-contracts.cjs`.

| Flag | Baseline default | Prerequisites and activated owner | Preview allowlist | Observed/source result |
|---|---|---|---|---|
| strategicInterception | Off; classic map | Scenario selector; recon/interception additionally depend on strategic profile | Forwarded | Distinct scenario switch, not an alias of interception |
| motorTransport | Off | strategic profile; transport owner 58 | Dropped | Fleet allocated only when effective gate true |
| aerialRecon | Off | strategic profile + strategicInterception=1; owner 59 | Dropped | status.enabled checked in every gate case; immutable report tests passed |
| interception | Off | strategic profile + all preceding switches; owner 59b | Dropped | enabled checked; native probe records actual decisions separately |
| truckCollision | Off | Live transport fleet; transport + obstacle/physicality owners | Dropped | Collider count equals fleet count only when enabled; composed collision fixture passed |

These five names are separate switches, with dependency-driven inactive combinations. The shipping loader silently accepts incomplete combinations instead of rejecting them. Those cases are recorded as inactive-by-prerequisite, not ordinary gameplay failures. A QA/configuration validator should reject a request claiming interception without its prerequisites.

Baseline no-query production source defaults to classic gameplay with these features off. Preview forwarding means asking the launcher for all five still activates only the map selector at this baseline. Direct local URLs used the full explicit query. **Actual deployed production/preview effective values were not certified.** The pinned hosted stage was unavailable; source defaults are not a deployment attestation.

Current-main source at `fa99ec8f1` changes these defaults to on and changes strategic layout/access/reinforcement defaults too. [Six source-executed drift cases](artifacts/default-drift.json) use exact Git objects in an isolated strategic fixture: absent queries produce no baseline fleet/recon/interception but produce four fixture trucks/recon/interception/colliders on current main. Explicit 0 controls still disable them. This is not a fresh browser campaign on current main. The preview allowlist is unchanged, so dropping explicit opt-outs is also a current-main risk.

## Broader inventory and tested interactions

[Query-read inventory](artifacts/query-read-inventory.json) records **{s['queryCandidates']} discovered candidates** with source/line snippets and preview forwarding status. It scans battle JS/HTML, loaders and preview PHP for literal query reads, regex gates and selected helper calls. Numeric controls, enums and developer modes are included; indirect dynamic keys and hard-coded switches need additional manual review. Defaults/effective deployed values marked unresolved remain unresolved. This is deliberately a candidate inventory, **not a complete semantic feature catalog**.

Other reviewed strategic controls: truckAccess is baseline opt-in; truckPhysics, truckVisual, crewEyes, reconCorridors and reconOverflight are default-on refinements with their own prerequisites. frontLines/reinforcements/reinforcementSortie are explicitly enabled in the all-intended batch. Parked Phase C local* experiments and diagnostic/editor modes are not intended default gameplay and were not blindly enabled. ACTION_DOCTRINE_ON=false and stashed genome policy are hard-coded policy controls, not URL aliases.

Five seeds each cover map-only, motor, aerial, interception, five-switch combined and expanded all-intended configurations. The expanded query includes truckAccess=1, frontLines=1, reinforcements=1 and reinforcementSortie=1. The real baseline five-switch profile observed 12 live colliders and enabled recon/interception; native traces establish actual fleet and planner execution. All eleven 900 s native executions produced zero interception dispatches and zero physically early interceptions. Enabled cases did issue eight forward screens that reached their posts (11 ground reports), so forward screening executed; second-truck support remained zero. Successful natural interception is not established. Existing harness tests include command/stance/perception/grenade defaults and strategic flag isolation. They do not provide exhaustive cross-product coverage of 174 candidates.

The follow-up executes literal predicates, original initializers/helpers and unchanged PHP loader fragments: 172 of 174 inventory names have an executed read. `infantry` was a non-query Map lookup and is excluded; `grass` is a preview-only candidate with no discovered runtime reader. See [read coverage](artifacts/flag-read-coverage.json), [740 predicate cases plus initializer/helper evaluations](artifacts/flag-predicate-executions.json), and [12 PHP, 21 numeric and 35 extra expression cases](artifacts/loader-range-flag-executions.json). These establish read behavior in explicit fixtures, not every module's effective activation or dependency compatibility.

Absent `rangeInterval` and `rangeDist` resolve to 0.35 s and 2.5 m because `+URLSearchParams.get(...)` coerces null to zero before clamping. The apparent fallback constants 1.25 s and 5.4 m apply only to nonnumeric values. This confirmed developer-tool default discrepancy needs an explicit policy decision before changing behavior. PHP also confirms that `off`/`false` do not disable autonomousMovement/smartIndoorIngress; those opt-outs require the exact string `0`.

A complete dependency/module/effective-deployment mapping, broad pairwise optional-module interactions and deployed preview flag introspection remain outstanding. Do not interpret query acceptance as activation: soldiers=200 failed to increase the roster and is retained as evidence of that exact pitfall.
''')
write('architecture-simplification-roadmap.md','''
# Evidence-ranked engineering changes

No simplification was implemented in gameplay and no savings below are claimed as achieved. Use narrow PRs with their own head CI, composed runtime tests and the standard remote paired benchmark before considering a merge. No merge or deployment is authorized by this campaign.

| Rank | Narrow PR | Evidence / value | CPU potential | Complexity reduction | Implementation / regression risk | Effort / acceptance |
|---|---|---|---|---|---|---|
| 1 | One declared strategic flag contract shared by preview and QA | PHP drops four requested switches; current main also changes omission semantics | Negligible direct CPU; large verification reliability value | Remove duplicate allowlists/default assumptions | Low–medium / medium (historical controls must survive) | Small; all 64 gates plus real redirect effective-state checks and explicit opt-outs |
| 2 | Explicit blocked-dismount recovery owned by transport | Ten passengers/reservation persist at blocked exit for 600 s; transient clear recovers | Unknown; avoid repeated futile checks where safe | Bounded exit/relocation policy, explicit wait/recovery states | Medium / high (no teleport, penetration or duplicate seats) | Medium; persistent/transient block, death, restart, reuse, moving collider tests |
| 3 | Fail-safe geometry error result with bounded diagnostics | Injected dual-query failure falsely returns clear ray | Unknown; normal-path speed must remain equivalent | Replace swallowed exceptions with declared obstruction/unknown result | Medium / medium–high (ballistics behavior) | Small–medium; fault injection plus ordinary window/terrain/vehicle rays and benchmark |
| 4 | Declared essential versus observational lifecycle hooks | Injected restart failure logs then continues; no natural crash reproduced | Unknown; do not claim wrapper removal savings | Explicit lifecycle failure aggregation and reset success criteria | Medium / high (presentation hooks need best-effort isolation) | Medium; injected per-hook failures, native public restart, terminal and observer checks |
| 5 | Cache immutable command-reception records and reduce repeated hot queries | publicRecord ~539 ms sampled self time at 200 actors; detectionRange ~433 ms; destinationFree ~254 ms | Material candidate, savings unmeasured | Avoid repeated DTO construction and redundant same-epoch queries | Medium / medium–high (adoption/version/recipient invalidation) | Medium; unchanged snapshots/adoption/replay, 100/200 actor CPU profiles with overhead controls |

## PR coverage refresh — 2026-10-20

This section supersedes the earlier suggestion to start five independent symptom fixes. The assignment is architectural consolidation, supported by measured correctness/performance evidence. [Review snapshot](artifacts/pr-coverage-review.json) records the checked heads, files, statuses and scope; this was a source/diff review, not a fresh execution of those PR heads.

| Existing work | Verified overlap | Consequence for this audit |
|---|---|---|
| [Open #595](https://github.com/APPARANYX/grasstex/pull/595), reviewed head `2c658b9a` | Diff adds independent safe exits and reachable alternate assembly points; fixes own-carrier sight exclusion and seated mesh detail. Its two returned Chromium checks were queued at review. | Do not open a competing dismount/crew/visual fix. Reassess transport architecture against its final accepted head. It does not add an all-exits-unsafe timeout or consolidate fleet/task/seat state. |
| [Open #594](https://github.com/APPARANYX/grasstex/pull/594) | Adds four opt-in observer probes and their harness check; no gameplay runtime owner changes. | Reuse its evidence tools rather than creating duplicates. It does not address lifecycle ownership or command allocation. |
| [Merged #591](https://github.com/APPARANYX/grasstex/pull/591) | Turns strategic features on by default and retains explicit 0 controls. Current main still has the separate preview allowlist and omits the four strategic prerequisites/controls. | Default enablement is already done. Shared configuration declaration, dependency validation and explicit preview opt-out propagation remain open. |
| [Merged #590](https://github.com/APPARANYX/grasstex/pull/590) | Shared truck collision volumes are already present in the audited baseline. | Do not propose adding truck collision again. Assess consistency of movement/sight/shot query contracts and geometry error handling. |
| [Merged #592](https://github.com/APPARANYX/grasstex/pull/592), [#593](https://github.com/APPARANYX/grasstex/pull/593) | Benchmark-launch archival/cleanup and bounded housekeeping scans with evidence retention. | Infrastructure coverage only; no simulation ownership consolidation. |
| [Parked #527](https://github.com/APPARANYX/grasstex/pull/527), [campaign #299](https://github.com/APPARANYX/grasstex/pull/299) | Tactical experiments and previously accepted slices are tracked here. #527's reception patch adds bounded nested payload copying, not caching of publicRecord. | Respect parked scope and existing ownership; do not treat historical campaign checklists as missing architecture work or import them wholesale. |

Current main at review was `fbf9cea3e54e46fe565d977cea3050da93f61048`. Relative to the audited baseline it has not changed preview.php, module-registry.js, ballistic-raycast error handling, or command-reception.js. None of the reviewed new diffs supplies the shared configuration contract, essential-hook lifecycle policy, ballistic fault policy, or the measured command-record allocation optimization.

## Architecture work that remains

1. **Configuration:** one versioned declaration of supported flags, defaults and dependencies tied to the runtime ref. Preview and QA consume that contract and assert effective values. Preserve explicit legacy controls and pinned historical replays. This is the smallest evidence-backed first architectural slice.
2. **Lifecycle:** one authoritative start/end/restart sequence, declared reset ordering and essential-versus-observational hook failure behavior. Remove replaced wrappers only after public restart, termination and retained-state tests establish equivalence. Existing observer tests did not establish a live leak; wrapper cost savings remain unmeasured.
3. **Transport and geometry:** one authoritative vehicle/seat/journey lifecycle with derived squad/fleet views, and a documented common query contract for movement, sight and shots, including legitimate own-carrier exclusions. Build on #595. Waiting when every exit is unsafe is not itself proof that forced ejection or timeout is correct; define the collision-safe recovery contract before adding more branches.
4. **Command read models:** retain authoritative version/adoption ownership and cache immutable derived records where profiling justifies it. Validate invalidation and recipient semantics, then measure allocation/CPU improvement. Avoid a new cache or wrapper layered over stale representations.

Every proposed slice should identify the duplicated state/wrapper it removes, the owner that remains, the invariant preserved and the before/after evidence. Fewer phase labels or wrappers alone is not an architectural success. No general rewrite, tactical-policy change, merge or deployment follows from this review.

The original unauthenticated policy/learning POST concern remains a separate high-priority security review; this campaign did not exercise persistent endpoints. It should not be dismissed because normal battles passed.

Do not replace physical navigation with a static-only facade: composed rotated-truck movement/shot/detour tests passed. Consolidate its geometry contract only after a mismatch or measured cost justifies migration. Do not remove transport/recon because their state is complex: real journeys and planner work executed and measured strategic hooks were relatively small. Do not remove provenance based on inclusive hook-dispatch totals: dispatch includes all systems and direct provenance hooks were modest. Do not collapse all Squad Leader phase labels because the table is fully connected: enforce semantic guards and coverage first.

No isolated architectural A/B simplification was attempted; preserving the audited behavior took priority over speculative optimization. Follow-up acceptance must quantify retained functionality and actual savings, not merely fewer wrappers or labels. The follow-up explains native interception declines and executes reads for 172 flag candidates, with one Map lookup excluded. The remaining work is full activation/dependency semantics, deployed/browser parity, every-frame invariants, retained-heap analysis and scenarios with genuinely available interception forces.
''')
