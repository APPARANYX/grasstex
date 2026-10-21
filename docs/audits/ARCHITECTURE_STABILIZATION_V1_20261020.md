# GRASSTEX architecture stabilization V1 — acceptance register

**Status: OPEN / integration acceptance pending.** This register links the source-level October 20 architecture audit to corrective work. It is not an assertion that the original audit exhaustively exercised the runtime, and it is not a deploy authorization.

- Initial audit: [October 20 executive report](https://github.com/APPARANYX/grasstex/blob/audit/comprehensive-integrity-20261020/docs/audits/2026-10-20-grasstex/README.md), with [findings](https://github.com/APPARANYX/grasstex/blob/audit/comprehensive-integrity-20261020/docs/audits/2026-10-20-grasstex/findings.md) and [roadmap](https://github.com/APPARANYX/grasstex/blob/audit/comprehensive-integrity-20261020/docs/audits/2026-10-20-grasstex/roadmap.md).
- Original audited baseline: `main@f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`. Pre-integration baseline: `main@43248a346ebb69afeb23a69ed535ce8b696c38ad` (PR #604). The combined code commit after sequential merges #605–#609 is `main@9a11e6acedeed2cead539f6584476988c5c62cd3` (before this documentation PR).
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

## Additional remediation now merged; acceptance limitations remain

| PR | What it establishes | Current gate / remaining limitation |
| --- | --- | --- |
| [#605](https://github.com/APPARANYX/grasstex/pull/605) | Single transport owner for passenger/capture, own-carrier LOS and renderer seat projections | Merged `3206bf52`; full PR CI green; combined-main parity still pending; canonical occupancy transaction ledger remains future structural work |
| [#606](https://github.com/APPARANYX/grasstex/pull/606) | Authenticated policy/learning POST; no-key fail-closed, GET unchanged | Merged `75cc4c7f`; PHP CI verified; separately verify deployed host and absence of plaintext secrets. No key needed when writes should stay disabled |
| [#607](https://github.com/APPARANYX/grasstex/pull/607) | Alternative physically safe door/flank for blocked first dismount exit; one exit per tick | Merged `bb13610e`; PR CI green, includes every-exit-blocked wait-and-recover regression and preview rollback forwarding. Permanent all-exit obstruction remains an unresolved liveness design case |
| [#608](https://github.com/APPARANYX/grasstex/pull/608) | Reports hook and ballistic query failures; follow-up closes ballistic query-failure rays rather than authorizing clear shots | Merged `42a583cb`; corrected-head CI green including failure injection; hook criticality and partial initialization failure policy remain a separate architectural decision |
| [#609](https://github.com/APPARANYX/grasstex/pull/609) | Composed physicality/OBB route, movement, LOS and projectile invariants against actual modules | Merged `9a11e6ac`; PR CI green. Test-only; does not replace physicality wrapper or establish every door/seat self-exclusion case |

**#605–#609 have been merged individually into `main` after verifying each immutable PR head and its applicable passing PR CI. This does not substitute for final combined-main acceptance.** Do not close SEC-01, BALL-01, HOOK-01, TRN-01 or PHY-01 without scope-specific evidence. The BALL-01 exception path now fails closed, but hook criticality still needs an authoritative policy; a truck physically surrounded on *all* exits cannot be made to dismount lawfully by declaring success.

## Final integration gate (execute on exact combined SHA)

- [x] Resolve independent PR changes and dependencies; check #605–#609 against their expected immutable PR heads and each PR's applicable passing checks. Final combined-main CI and acceptance remain separate gates.
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

Treat 600/601/603/604 and 605–609 as merged scoped improvements, **not as authorization for wholesale lifecycle replacement, broad code deletion, benchmark artifact deletion, or automatic merging of future drafts**. Stabilization V1 should be accepted only when the final combined runtime satisfies the above gates. Performance and the modular Utility AI/Behavior Tree pathway remain independently measured/approved initiatives.
