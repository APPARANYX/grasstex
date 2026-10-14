# Phase C: Squad Leader fire-and-maneuver operation lifecycle (proposal)

Status: **design and validation only**. This file does **not** authorize or implement
new battle behavior. The shipping tactical implementation remains
`battle/modules/15o-squad-leader-tactical-postures.js`; all ROE, contact,
fire, covered-route, and movement-owner checks remain authoritative.

## Why a separate operation state?

The current tactical posture couples independent, asynchronous events:
General mission phase, adopted posts, a stationary four-second hold,
whole-fireteam reserve arrival, firsthand/squad reports, real fire support,
and a covered route. An event can be valid and useful for several seconds
without simultaneously satisfying the next event's predicates.

This is a **Meso operation**, not a new soldier controller or tactical hive
mind. It preserves relevant verified commitments and transition history
without persisting stale **authorization**.

Baseline: the identical 54-battle autonomy-ON run, before versus after the
credible-firing-base/specialist-role corrections, recorded:

| Measurement | Before | Corrected |
| --- | ---: | ---: |
| Ambush attempts | 105 | 107 |
| Prepared postures | 23 | 25 |
| Intact reserves staged | 22 | 37 |
| All reserve members arrived | 15 | 19 |
| Arrived reserves overlapping contact | 0 | 3 |
| Arrived reserves with two *effective* supporters | 0 | 0 |
| Complete same-squad natural chains | 0 | 0 |

Within the 107 corrected attempts, 46 ended due to lost firing-station
masking/ray and 22 due to no fresh reported threat. Of 22 attempts that
entered a three-man hold but never achieved readiness, 18 released before
four seconds of that hold. These are observations, **not acceptance-policy
changes or evidence that any aborted operation should have continued**.

Data sources: GitHub Actions runs
[38564569759](https://github.com/APPARANYX/grasstex/actions/runs/38564569759)
and [38581695964](https://github.com/APPARANYX/grasstex/actions/runs/38581695964).

## Ownership

- **General (Macro):** mission, phase, COA, emergency/retreat override.
- **Squad Leader (Meso):** one versioned tactical operation, squad/fireteam
  selection, post/reserve intent, reconsideration and abort.
- **Soldiers (Micro):** independent observation, callouts, target acquisition,
  aiming, shots, suppression, posture and self-defense.
- **Movement Resolver / Engagement:** sole committed movement destination,
  stand/crawl behavior, safe covered-bound contract and actual shots.

No cross-owner writing of enemy memory, soldier aim, player possession,
macro authority, firing evidence, or movement endpoints.

## Proposed state and guard flow

```text
PLAN -> STAGE -> PREPARE -> OBSERVE --(real contact)--> SUPPORT
             |          |                    |            |
             +--> REPLAN/ABORT                |            +--(now >=2 effective supporters
                                            |                + authorized assault
                                            |                + safe bound)--> BOUND
                                            |                               |
                                            +<------- HOLD/REPLAN -----------+
                                                                             |
                                                           physical arrival -> CONSOLIDATE
                                                                                 |
                                                           continue/replan/withdraw/complete
```

All transitions also allow **HOLD / REPLAN / ABORT**. HOLD means no new
fire or movement authority; it is not permission to preserve an exposed
unprepared line or to ignore an invalid mission. Any emergency or
invalidated roster, post owner, macro mission or command epoch aborts the
affected operation.

| Stage | Entry evidence | Persisted commitment | Check again before action |
| --- | --- | --- | --- |
| PLAN | Valid squad mission and detached report | Mission/route version and intended elements | General phase and local control |
| STAGE | Real masked/safe post and intact native reserve options | Orders, selected team IDs, adopted command keys | Actual physical arrival and terrain |
| PREPARE | Same three men at their real masked posts | Their identities and continuous dwell start | Full uninterrupted 4 s, stable body positions |
| OBSERVE | Prepared line with valid mission | Verified posts, independent observation task | Contact freshness before firing or moving |
| SUPPORT | Fresh firsthand/squad contact + live fire-control evidence | Current real supporter identities and time | Two **actually effective** non-movers, weapon/ROE |
| BOUND | Assault authority + intact arrived reserve + native route | One lease and native movement order | Exposed-start/end policy unchanged; engagement rechecks |
| CONSOLIDATE | Physical mover arrival | New verified post and status | Fresh contact and support before another bound |

## Identity and evidence invariants

1. Track `operationSerial` and `missionVersion` separately from a
   transient UI/Engagement state. An aborted serial never lends its dwell,
   supporters, reserve orders or waypoints to the next attempt.
2. Freeze held-core IDs and verified real posts once preparation starts.
   A moved, dead, possessed, reassigned or otherwise invalid held actor
   invalidates preparation. Substitutes start their own full dwell.
3. Keep reserve membership a single **native whole fireteam**. No partial
   teams, no teammate borrowed from held core or current effective support.
   `staged`, `adopted`, `physically arrived` and `eligible to bound`
   are separate evidence states.
4. Separate posture lifetime from **intel freshness**. No stale sighting,
   told report, remembered target, or model enemy truth can open fire
   control or authorize a covered bound. A mission-valid quiet observation
   task may continue only while its *current real posts remain safe* and
   the actual Squad Leader mission owns that observation commitment.
   No arbitrary 30-second grace or manufactured reacquisition.
5. `General defend` is an explicit bound veto even if `COA=assault`.
   Separate legal **self-defense** from authority to assault.
6. Keep actual support as two independently eligible soldier identities:
   no role-only counts, proxy supporters, duplicate references or shots
   attributed to another squad. The planning ballistic-ray test predicts
   potential posts, not effective fire.
7. Use existing `boundRoute`, `coveredTeam`, Engagement and Resolver at
   the *moment of bound*. Do not make an exposed origin legal by renaming
   the maneuver state; a separate suppressive-dash doctrine would need its
   own explicit decision and acceptance tests.
8. Do not allow the operation state to become a second movement writer
   or a synchronized fire scheduler.

## Instrumentation contract (read-only first)

Each transition should record:

```text
battleSeed, faction, squadId, operationSerial, missionVersion,
fromState, toState, simTime, reason,
heldActorIds, dwellSeconds,
reserveTeam, reserveActorIds, fullyAdopted, fullyArrived,
reportAge, firsthandContactAvailable,
effectiveSupporterIds, actualSupportCount,
generalPhase, coa, routeSafetyReason, movementLease,
physicalArrival, aborted
```

Telemetry should emit **candidate-windows** only when all necessary
same-serial gates coincide. Independent preconditions may be measured
separately, but their counts must **never** be summed into a fictional
complete maneuver.

The read-only companion
`scripts/probes/analyze_phase_c_lifecycle.cjs` reconstructs initial
state/termination evidence from existing native probe artifacts. The
first iteration needs no change to gameplay and can be validated against
both fixed full-battle reports.

## Suggested implementation order

1. Keep credible firing-post/real-specialist support corrections
   independent and verify the existing 54-battle benchmark.
2. Add a **read-only, per-squad operation ledger** derived from existing
   posture serials, held IDs and real reserve arrivals; cross-check with
   natural replay traces. No extra gameplay state writer yet.
3. Introduce explicit Meso state transitions with one owner and
   versioned leases, preserving all fail-closed checks.
4. Handle observation/reacquisition continuity without redefining
   fresh contact or minimum dwell; evaluate matched before/after seeds.
5. Only after evidence shows a genuine authorized covered bound should
   native Engagement/Movement execution be wired to the new coordinator.

Acceptance remains exactly one real natural same-squad sequence:
prepared three-man line, **two live independent supporters**, lawful
covered-movement order, shots during physical mover travel, physical
arrival. Full CI + browser QA must stay green, and the result must be
reproducible with matching battle fingerprints. Draft/no merge until then.
