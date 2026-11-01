# GRASSTEX AI Skills V1 — Architecture Roadmap and Evidence Register

**Status snapshot:** 2026-10-25 (America/New_York)  
**Track:** [Issue #602 — AI Skills V1](https://github.com/APPARANYX/grasstex/issues/602)  
**Integration candidate:** [Draft PR #630 — consolidated AI re-architecture](https://github.com/APPARANYX/grasstex/pull/630)  
**Related tactical design:** [Draft PR #651 — coordinated advance and retreat](https://github.com/APPARANYX/grasstex/pull/651)  
**Decision:** Do **not** merge, deploy, or enable new gameplay by default solely because an implementation or unit test exists. Separate *implemented*, *natural-battle validated*, *accepted*, and *merged*.

> This document is a point-in-time status and forward roadmap, not a claim that draft branches are deployed. Check linked PRs and benchmark artifacts when updating it. The architectural A/B/C phase names below are different from the older #299 tactical “Phase C” label.

## 1. Target architecture and non-negotiable boundaries

Introduce a **modular hierarchical Utility AI + bounded Behavior Tree skill system + existing authoritative effectors**, preserving the current Macro → Meso → Micro command chain rather than replacing it wholesale.

- **Scoped, immutable facts / blackboards:** an individual sees personal observations and properly received reports; a squad sees legitimately transmitted/adopted information; command sees upward reports. Never hand a skill hidden enemy transforms.
- **Utility selector:** deterministic, pure, bounded eligibility/score/reason computation. Hard authority, mission, ROE, freshness and safety guards cannot be overridden by utility scores.
- **Behavior Tree executor and lifecycle:** committed skill runs in bounded steps with receipts, cancellation, suspension, resource conflicts, timeouts and restart isolation; no new sprawling global state machine.
- **Shared effectors and owner seams:** Squad Leader/Meso owns squad plans and native bound leases; Engagement owns stance, fire and physical cover decisions; Movement Resolver remains the sole normal destination writer; Navigation, transport, communications and per-person Command Reception retain their owners.
- **Skill modularity contract:** ideally add one descriptor/module, one focused test, and one central manifest/config entry to introduce a skill. Skills request existing owner actions instead of modifying many unrelated owner state machines. No new parallel leases, hidden writers, flag parsers, timers or mirrored global state.
- **Modes/rollback:** legacy default; shadow evaluation changes no gameplay; narrowly scoped pilots are opt-in. Unsupported features fail closed. An off/rollback configuration must restore legacy behavior and pass deterministic comparisons.

See the detailed [AI skills contract on #630's branch](https://github.com/APPARANYX/grasstex/blob/work/ai-rearch-consolidated-20261022/docs/architecture/ai-skills-v1.md).

## 2. Phase status (implementation is not acceptance)

| Architectural phase | Code status | Evidence/status as of snapshot | Acceptance / merge status |
| --- | --- | --- | --- |
| **A — contract and ownership map** | **Implemented** in #613; consolidated into #630 | Architecture contract, loader/lifecycle, owner/provenance and invariant tests; passing checks reported by #613 | Original PR closed unmerged; consolidated stack is **draft, not on main** |
| **B — registry, immutable facts, Utility AI shadow selector** | **Implemented** in #614; consolidated into #630 | Exact legacy/shadow gameplay + complete command-history parity at one 600-s seed for meeting, US defend, GE defend; hosted restart/observer checks passed | Strong foundational evidence, but **not independently released to main** |
| **C — bounded BT scheduler and soldier pilot** | **Implemented** in #615; consolidated into #630 | Scoped soldier.crouch-on-warning actually requested one Engagement-owned crouch; local/hosted/paired checks; default-mode comparisons passed | Narrow soldier pilot validated, **not a proof of squad fire-and-maneuver**; draft |
| **D — squad skills / tactical Phase C migration** | **Implemented experimentally** in #616 plus #626–#628 and later tactical drafts | Controlled tests demonstrate firing lines, real supporters, owned bounds, arrivals and alternating teams; natural battles show *very few or zero* adopted coordinated bounds | **BLOCKED** pending representative natural same-squad chains and acceptable results |
| **E — measurable replacement and retirement of legacy decision paths** | **Not started** | No qualifying D sign-off or migration/parity gate | **BLOCKED on D**; separate approval required |

**PR lineage:** #613–#616 and #626–#628 were closed without merging because their history was consolidated into **open draft #630**. No claim that those earlier PRs or #630 are on main. #527 remains parked. #299's separate tactics work must not be implicitly declared accepted by an architectural pilot.

## 3. Evidence register — what has actually happened

### Proven platform capabilities (A–C)

- #614 reports exact shadow-versus-legacy equality for **three 600-s scenarios** with complete contiguous command publication histories. Hosted observer/read neutrality, restarts, stale actor rejection and default rollback passed. This is **one seed per scenario**, not a broad tactical performance result.
- #615 reports the native soldier posture request (US31 at 549.00 simulated seconds in one natural meeting battle), with opt-in side effects traced and unchanged Macro mission history. The pilot only exposes a limited stance effector; movement/fire/orders/vehicles are not thereby ported.
- #616 composes squad preparation, support and covered-bound skill descriptors using Meso authority, but its own acceptance notes explicitly state natural tactical completion is not established.

### Phase D: controlled success has not turned into reliable natural behavior

- #626 controlled fixtures execute native supported moves and rotation; its revised **100 paired-seed / 200 natural-battle** comparison recorded **zero authorized, adopted or physically completed reactive bounds**. Runtime gate and default-off checks passed, but tactical success did not.
- #627 recorded real preparation progress in **100-pair comparisons**: the ON arm had two verified supporters in 94/100 battles and a settled squad plus supporters in 88/100; **natural reactive bound authorizations remained zero**. Natural cover arrivals and actual prone shots were observed. This narrowed the downstream blockage to authorization/handoff rather than simply inability to take cover.
- #628 added leader-assigned firing positions behind safe cover and fixed an Engagement firing-line API arity mismatch. Its local controlled fixture demonstrates assignment, native walking and re-measured line; no standalone natural maneuver acceptance.
- #630 is the consolidated, opt-in integration candidate, not a completed end-to-end benchmark. Its description notes verify-contact only saw an enemy in **21 of 74 arrivals** and flat outcomes at 100 pairs; known lease timing/stale-versus-blocked/confidence review remains.
- #635 instrumentation identifies short squad contact episodes (median **3.4–3.9 s**) and short gaps (median **2.6–3.2 s**); fire control clears on every gap in the measured samples, then HOLD starts over. In #630 comparisons there were only **2–3 bound authorizations per 100 natural battles, with zero adoptions**. The relevant gate chain remains fire control → support/readiness → phase/task → Meso lease → command adoption → cover route/physical arrival.

### New October 25 probe pack (2 km / 5 km)

The [coordinated-bound design snapshot in #651](https://github.com/APPARANYX/grasstex/blob/work/advance-retreat-design-20261025/docs/plans/coordinated-advance-and-retreat.md) and associated probe drafts #645–#649 report:

| Contact-time / movement observation | Approximate measured result | Interpretation |
| --- | --- | --- |
| Squad-time already retreating | **35%** | Forward assault-only tactics exclude much of contact time |
| Fire control HOLD/PRECISION | **34%** | A major pre-lease gate |
| Phase/COA/task not authorized | **28%** | Maneuver cannot be selected just by adding a movement skill |
| Leader-ordered bound open | **0.09%** | End-to-end authorization remains the bottleneck |
| Already-authorized observations waiting on bound-cycle | **98.7%** of the applicable samples | Existing 7-s lease/cadence needs a precise ownership-aware investigation; do not simply delete it |
| Bound episodes that are *individual* cover moves | **~90%** | Observed movement is largely not alternating fireteam maneuver |
| Arrival at cover during these movements | **44–73%** depending on scenario | A command/target alone cannot count as successful movement |
| Casualties among moving men in meeting engagements | **~25%** | Prioritize physical survival and movement exposure |

These percentages are from particular configurations/probe windows, **not** universal probabilities or acceptance results. The categories do not form an exact 100% exhaustive partition. Retain seeds, controls, effective flags, map, combat clock and source SHA with subsequent measurements.

### Experimental findings to carry forward, not prematurely merge

| PR | Finding / test | Status and caution |
| --- | --- | --- |
| [#646 — heard cover-fire relay](https://github.com/APPARANYX/grasstex/pull/646) | Support counted only from authentic delivered fire reports | Draft; #651's evidence summary reports neutral 2-km outcomes and ~11% fewer US kills at 5 km: **not accepted as universally better** |
| [#647 — peel-back](https://github.com/APPARANYX/grasstex/pull/647) | Proposed backward covered movement using the existing bound author | Draft; often inert because pre-authority gates prevent entering it |
| [#648 — maneuver-first](https://github.com/APPARANYX/grasstex/pull/648) | Exposes a utility score competition that favors support even when maneuver is eligible | Draft; removes confidence sensitivity from that contest, which could authorize low-quality contact; requires outcome tests |
| [#649 — cover stagger](https://github.com/APPARANYX/grasstex/pull/649) | Prevents non-pinned individual moves without two heard shooters | Draft; #651 summary reports ~60% fewer individual cover moves without gain. Holding exposed men may worsen losses |
| [#650 — retreat teams](https://github.com/APPARANYX/grasstex/pull/650) | Alternating fireteam hold-and-withdraw can occur under a retreat order | Draft; #651 snapshot reports **638 holds in 60 two-km battles**, 2,646 holder-man-seconds and 66 holder deaths, with little outcome change. The PR itself still marks its paired benchmarks pending; confirm artifact provenance before claiming acceptance |
| [#651 — unified directional design](https://github.com/APPARANYX/grasstex/pull/651) | **Decision:** one execute-covered-bound skill, with forward/back direction, not separate independent algorithms | Design only; no runtime change |
| [#652 — PRECISION release](https://github.com/APPARANYX/grasstex/pull/652) | PRECISION could indefinitely block maneuver. Opt-in gate release after the existing 6-s maxHold while preserving the shooting order | Targeted local harness passed; **2-km/5-km paired battles pending** |
| [#653 — retain HOLD clock](https://github.com/APPARANYX/grasstex/pull/653) | Target change could restart the 6-s HOLD clock repeatedly; opt-in fix preserves elapsed preparation | Targeted local harness passed; stacked on #652; **paired benchmarks pending** |

**Current interpretation:** the existence of a utility-selected skill, good cover, suppression, or a retreat holding team **does not** by itself prove coordinated maneuver. The most recent targeted fixes resolve plausible time-gate defects in unit tests, not yet in natural-battle outcomes.

## 4. Remaining roadmap (ordered)

### D1 — Make the decision gates observable, correct and non-starving

**Next action:** benchmark #652+#653 against pinned controls on both the compact tactical 2-km map and normal 5-km map. Verify effective runtime flags and actual code SHAs.

- Record time in HOLD/PRECISION, number/length of rearmed fire-control episodes, support capacity, local-plan authorization, open/blocked leases, and physical bounds by direction.
- Investigate the **bound-cycle 7-s gate** using a precise lease timeline: who owns it, first publication/adoption, expiry, retry and conflict. Only change the gate if evidence shows it unfairly starves ready teams; preserve safety/real command cadence and avoid duplicate leases.
- Preserve contact confidence and received-report provenance; don't bypass mission/COA/ROE restrictions to manufacture movement.
- Re-run negative fixture tests, full owner/mission/receipt checks and default-off parity.

**D1 exit:** demonstrated removal of pathological indefinite/repeating gate delays **and** materially more qualified authorizations *without* illegal leases, fabricated supporter counts or unacceptable combat regressions. A passing local test alone does not meet this gate.

### D2 — Implement one coordinated skill for forward and backward movement

Build on #630 and #651. Name the capability **execute-covered-bound(direction)** with **direction=forward|back**, shared readiness/holder/mover/resource/action receipts, and bounded cancellation/retry/rotation.

- **Meso 15j is the sole native bound-lease author**; 15n/the proper owner scores lawful options. Existing Engagement, command reception, resolver, Navigation, cover and route owners execute the request.
- **Real base of fire:** at least two independently effective non-moving shooters with recent real discharge/callout provenance; preserve current authorization and actual ammunition, LOS and target/sector knowledge.
- **Forward:** one designated fireteam advances along a genuinely reachable covered route while the others hold and shoot; verify physically reached destination before crediting success.
- **Backward:** one designated element provides cover while the other withdraws toward lawful retreat anchors; rotate the holding team on the existing bounded cadence. Do not redefine ordinary retreat authority.
- Where fewer than four combat-capable survivors or meaningful contact is absent, return safely to the owner-defined ordinary behavior. No forced rush to exposed cover, hidden-info reads, invented weapons, teleport or duplicate movement writer.
- Keep experimental candidate flags isolated while evaluating, then **consolidate approved behavior through the central AI-skills manifest**; do not institutionalize one URL flag per final skill.

**D2 exit:** one tested, registered skill and a small number of properly owned action adapters implement both directions with traceable real movement receipts; no new owner bypass or permanent monkey-patch seam.

### D3 — Natural-battle acceptance, not staged-fixture acceptance

Use paired immutable-head **meeting / US defend / GE defend** battles at 2 km and 5 km, including the normal full-ON strategic configuration when appropriate. Record seeds/clock/config/control SHA, compare default legacy, shadow, pilot and behavior-enabled modes on the same benchmark runner.

Must show, within the **same squad and command serial**:

1. Perceived or legitimately transmitted contact and lawful task/ROE.
2. Cover/firing-line preparation, physical settlement and command adoption.
3. Two distinct qualified supporters **actually firing**.
4. A leader-authorized, personally adopted, **physically completed** covered bound while independent support continues.
5. Repeated alternating movement where conditions allow, including **controlled withdrawal** in natural retreat situations.
6. Failure paths that release resources, terminate bounded attempts, avoid unsupported rushes and preserve fallback behavior.

Report **attempts, authorizations, adoptions, arrivals, successive rotations, cover geometry/route exposure, mover and holder deaths, retreat completion time, squad losses, kills, objective captures and wall-clock cost**. Count tactical success only from natural logs, not fixture setup or a debug UI indicator.

**D3 exit:** reproducible natural-battle coordination beyond isolated rare events, with acceptable tactical/casualty/CPU tradeoffs versus the pinned control. A numerically specified acceptance threshold should be chosen using representative baseline distributions before merging; do not invent a pass threshold after seeing results.

### D4 — Consolidate and accept the integration branch

- Rebase or rebuild the reviewed stack on current main only after handling other active work and conflicts explicitly.
- Inspect every new writer/owner seam, load order, flags/profile, lifecycle, restarts, telemetry and feature rollback. Eliminate duplicate alternative tactical branches where equivalent behavior exists.
- Run the full native harness, ownership/wire map, CI, hosted browser QA, multi-scenario paired benchmarks and shadow/default identity tests on the exact final commit.
- Document decisions about #646–#650 and #652–#653: **accept, revise, replace, or reject** with evidence rather than automatically aggregating every experiment.
- Merge #630 or an explicitly chosen successor **only with approval**. No “tests green therefore merge” shortcut.

**D4 exit:** reviewed, approved, correctly integrated gameplay behavior with a documented rollback and credible natural-battle acceptance.

### E — Measured migration and legacy retirement (after D4)

- Inventory legacy soldier/squad skills and state-machine transitions by ownership, test coverage and observed runtime usage.
- Prioritize one capability at a time (e.g. seek-cover, support fire, regroup, sector verification, retreat coordination); migrate **decision ownership** while reusing physical executors.
- Enforce single-authority behavior and measure fewer cross-file changes, duplicate timers/flags, state mirrors and fallback branches.
- Establish deterministic fallback/default parity and per-skill opt-in checks, profile disable/cancel/restart tests and benchmark/CPU impacts.
- Delete obsolete code, old flags or state branches **only after** equivalent evidence and separate authorization; keep a migration/rollback ledger.

**E exit:** the new skill platform is the ordinary owner of migrated decisions, old duplicated decision logic is measurably removed, new skills are demonstrably modular, and legacy mode can be retired without breaking authoritative effects or replay determinism.

## 5. Questions / decisions still open

- Should covered withdrawal start **only once the squad enters retreat**, or should a separately authorized planned fighting withdrawal be eligible earlier? Do not quietly bypass existing 60%-casualty retreat logic.
- Is the existing forward **4.5-s** holder window sufficient for retreat, or does an evidence-backed variant need a longer window? Reuse established clock/lease ownership rather than adding a parallel timer.
- Following D1 benchmarks, implement the forward-half fix first or integrate both directions in one explicitly reviewed D2 PR? The **end state remains one skill** either way.
- Confirm what counts as *independent supporting fire* under heard relay versus real discharge and how near-current believed sector reports remain actionable without omniscient targeting.

## 6. Maintenance rule and source links

Update this document when a PR changes a **phase verdict**, closes a **gate**, or provides a **benchmark-backed result**. Each update must include date, PR/commit SHA, scenario, effective flags, seed count, sim duration, comparison runner, numerical outcome, failure modes and whether it is **draft, merged or deployed**. Keep contradicted or failed experiments in the evidence table; don't rewrite history as success.

**Primary sources:** [#602 specification](https://github.com/APPARANYX/grasstex/issues/602) · [#630 integration](https://github.com/APPARANYX/grasstex/pull/630) · [#635 gate probe](https://github.com/APPARANYX/grasstex/pull/635) · [#645–#649 probes/alternatives](https://github.com/APPARANYX/grasstex/pull/645) · [#650 retreat pilot](https://github.com/APPARANYX/grasstex/pull/650) · [#651 directional design](https://github.com/APPARANYX/grasstex/pull/651) · [#652 fire-control PRECISION](https://github.com/APPARANYX/grasstex/pull/652) · [#653 HOLD clock](https://github.com/APPARANYX/grasstex/pull/653).

**Current executive verdict:** A–C **implemented in the draft integration**; D **experimentally implemented but natural-battle acceptance blocked**; E **not started**. Priority = evidence-backed D1 gate fixes → one directional bound skill D2 → repeatable natural validation D3 → reviewed integration D4 → measured retirement E.
