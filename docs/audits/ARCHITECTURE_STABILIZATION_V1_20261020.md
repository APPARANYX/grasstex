# GRASSTEX architecture stabilization V1 — acceptance register

**Status: OPEN / integration acceptance pending.** This register links the source-level October 20 architecture audit to corrective work. It is not an assertion that the original audit exhaustively exercised the runtime, and it is not a deploy authorization.

- Initial audit: [October 20 executive report](https://github.com/APPARANYX/grasstex/blob/audit/comprehensive-integrity-20261020/docs/audits/2026-10-20-grasstex/README.md), with [findings](https://github.com/APPARANYX/grasstex/blob/audit/comprehensive-integrity-20261020/docs/audits/2026-10-20-grasstex/findings.md) and [roadmap](https://github.com/APPARANYX/grasstex/blob/audit/comprehensive-integrity-20261020/docs/audits/2026-10-20-grasstex/roadmap.md).
- Original audited baseline: `main@f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`. Working integration baseline before the pending PRs: `main@43248a346ebb69afeb23a69ed535ce8b696c38ad` (PR #604).
- Related separate work: [AI Skills V1 #602](https://github.com/APPARANYX/grasstex/issues/602) is **not** part of the completed audit remediation.

## Implemented, merged and validated in their own scopes

| PR | Contract established | Remaining scope |
| --- | --- | --- |
| [#596](https://github.com/APPARANYX/grasstex/pull/596) | Shared server module-selection/preview flag forwarding | Runtime gameplay flag ownership was separate |
| [#597](https://github.com/APPARANYX/grasstex/pull/597) | Shared immutable adopted-order read models | Broader command ownership unchanged |
| [#598](https://github.com/APPARANYX/grasstex/pull/598), [#599](https://github.com/APPARANYX/grasstex/pull/599) | Fixed clock and Commander restart stages move into core lifecycle | Other startup wrappers remain |
| [#600](https://github.com/APPARANYX/grasstex/pull/600) | Diagnostics use published live session; one startup wrapper removed | Unrelated startup wrappers remain |
| [#601](https://github.com/APPARANYX/grasstex/pull/601) | Terrain/relief settlement occurs after Commander reset through core hook | Exact runtime parity still needs final integration run |
| [#603](https://github.com/APPARANYX/grasstex/pull/603) | Operator preparation/completion belongs to core restart; original `sim.restart` not replaced | BattleControl still wraps initial `BattleSim.start` |
| [#604](https://github.com/APPARANYX/grasstex/pull/604) | Ten strategic feature defaults/dependencies owned by pinned runtime, 4,096 case flag contract | Other independent tactical/developer flags intentionally separate |

These PRs had green applicable own-head GitHub Actions checks and documented paired seed comparisons. **A merged PR's green checks do not establish final combined acceptance** or infer CPU improvement.

## Remaining audit slices and acceptance blockers

| PR | What it establishes | Current gate / remaining limitation |
| --- | --- | --- |
| [#605](https://github.com/APPARANYX/grasstex/pull/605) | Single transport owner for passenger/capture, own-carrier LOS and renderer seat projections | Verify full head CI and post-composition parity; a truly canonical occupancy transaction ledger remains future structural work |
| [#606](https://github.com/APPARANYX/grasstex/pull/606) | Authenticated policy/learning POST; no-key fail-closed, GET unchanged | PHP CI executes; verify host deploy state and that no plaintext secret is shipped. No server key is needed if writes should remain disabled |
| [#607](https://github.com/APPARANYX/grasstex/pull/607) | Alternative physically safe door/flank for blocked first dismount exit; one exit per tick | Test all-exit obstruction and assembly stalls separately; no fabricated guaranteed exit when no legal physical location exists. Verify `blockedExit=0` flag stays a deliberate reversible diagnostic control |
| [#608](https://github.com/APPARANYX/grasstex/pull/608) | Reports hook and ballistic query failures; follow-up closes ballistic query-failure rays rather than authorizing clear shots | Confirm CI on changed head, including injected one/both-provider failures; hook criticality and partial initialization failure policy need explicit authoritative-owner review |
| [#609](https://github.com/APPARANYX/grasstex/pull/609) | Composed physicality/OBB route, movement, LOS and projectile invariants against actual modules | Test-only; does not itself replace physicality wrapper or establish every door/seat self-exclusion case |

**No outstanding draft PR should be considered part of production `main` solely because its individual CI is green.** Do not close SEC-01, BALL-01, HOOK-01, TRN-01 or PHY-01 without scope-specific evidence. In particular, throwing geometry queries historically failed open, and a truck physically surrounded on *all* exits cannot be made to dismount lawfully by declaring success.

## Final integration gate (execute on exact combined SHA)

- [ ] Resolve independent PR changes and dependencies; review overlap and check every merge against its expected immutable PR head. Re-run exact-HEAD CI following each change.
- [ ] Run full syntax, `tools/ai-sim-harness/*-check.js` regression family, state ownership/wire maps, tactical and strategic scenario QA.
- [ ] Run native browser restart/end/continue tests through repeated same-page cycles; confirm hook order, one-time setup/teardown, no observer leaks, pause and terminal protections, restored terrain height, and published diagnostics equality.
- [ ] Run composed geometry contract with static and moving rotated OBBs, named-carrier self-exclusion, route, LOS, ballistic stop, and explicit fault injection. Confirm no unverified clear shot on an exception.
- [ ] Run transport lifecycle through boarding, occupation, serial dismount, one blocked exit, all exits blocked, blocker removal/death, abort, mission change, squad death, restart, and nearby truck reuse; assert zero leaked seats/reservations or through-body release.
- [ ] Test all strategic default-on/runtime-profile/preview opt-out combinations, Combat Lab isolation, and same-page repeat configuration; validate the source-owned activation snapshot against active transport, recon, interception and collider systems.
- [ ] Run paired 600/900-second meeting, US-defend and GE-defend replay fingerprints and objective/casualty/mission outcomes at exact seed/flags/clock policy; preserve all artifacts and negative results.
- [ ] On a separately authorized host deployment, test unauthenticated and forged-Origin POST denial to both endpoints, authenticated writes *only if enabled*, GET compatibility, and absence of publicly served write-key files.
- [ ] Record measured p50/p95/p99 simulation-frame cost and rendering/heap overhead on representative hosts/devices before claiming any optimization. Historical headless Chromium FPS samples are not a valid causal performance baseline.
- [ ] Update this register with commit SHA, run URLs, evidence by scenario, and remaining verified defects; only then mark V1 accepted.

## Decision boundary

Treat 600/601/603/604 as merged coherent improvements, **not as authorization for wholesale lifecycle replacement, broad code deletion, benchmark artifact deletion, or automatic merging of drafts**. Stabilization V1 should be accepted only when the final combined runtime satisfies the above gates. Performance and the modular Utility AI/Behavior Tree pathway remain independently measured/approved initiatives.
