# Reinforcement and forward-spawn architecture (draft)

Status: design-first, no runtime behavior changes. Depends on stabilization/integration of #299. Feature default OFF.

## Product invariants

1. Each NPC and human player is an independent deployment candidate; wave membership does not imply same-squad grouping.
2. Each spawn anchor owns its **simulation-time** wave schedule, capacity and availability. Players may choose a valid anchor and deploy on its next wave.
3. A dead NPC retains original soldier identity/role/squad assignment through the casualty->queued->deployed cycle as far as roster semantics permit. No duplicate live identity or phantom squad member.
4. NPCs deployed via reinforcement enter a dedicated `REINFORCING` lifecycle and are excluded from squad readiness, formation, regroup, order-recipient, reserve-allocation, and command-movement eligibility until physically rejoined.
5. A reinforcing soldier's only mission is to survive and get back to their assigned **living squad**. Track the squad's changing rendezvous position; use cover/pathfinding; do not actively seek fights; permit immediate self-defense/suppression/death. The squad does not affect or command the reinforcing soldier until rejoin completion.
6. Arrival and reintegration happen atomically: prevent both squad AI and reinforcement AI writing movement or state in the same tick. Explicit owner handoff and a bounded proximity/viable-route requirement.
7. Humans use common spawn anchor queue/scheduler but **not** NPC autonomous rejoin control; support player-test mode without taking over input.
8. No wave may spawn into an invalid, destroyed, enemy-contested, or disconnected anchor. Block based on authoritative enemy positions, not only faction tactical beliefs; reassess at deployment boundary.
9. Spawn anchors are destroyable, and can be retired by friendly SLs. No instant deletion of existing hard-points when objective ownership decreases; over-cap only blocks new construction.
10. All timers, cooldowns, and scheduled transitions use simulation time. A coarse 4x/8x advance must process every eligible wave boundary or explicitly preserve backlog without silent loss.

## State / ownership sketch

Roster: ALIVE -> DEAD/QUEUED -> SPAWNED_REINFORCING -> REJOINED_ALIVE; cancellation when battle ends or assigned squad is irrecoverable. Keep deployment queue state distinct from tactical state.

NPC movement ownership: reinforcement movement resolver only during SPAWNED_REINFORCING; squad resolver only after REJOINED_ALIVE. Exclude reinforcing NPC from regroup/retreat/attack actor selectors and tactical counts. Reinforcement controller cannot override animation physics, collision, player control, or combat damage.

Spawn anchor: id, faction, type (hq, hardpoint, future garrison, future airhead), position, health, active/disabled/destroyed state, createdBy, waveIntervalSimSeconds, nextWaveSimTime, queue/capacity, placementCooldown, contestedReason. Separately track faction build allowance and construction eligibility. Apply immutable per-wave candidate snapshot and independent soldier spawn resolution.

## Candidate baseline balancing (tunable; not shipped)

Objective count 0-1/2/3/4/5+ -> faction hardpoint cap 6/8/10/12/15. SLs place freely subject to valid terrain, ownership, cooldown and cap. Spawn interval according to nearest authoritative enemy: >200m 60s; 100-200m 90s; 50-100m 120s; <50m blocked. Use clear hysteresis to avoid interval thrash; timer policy explicitly specifies whether elapsed progress is retained on contested/uncontested transition. Cap is team-wide, not per-squad. HQ is always valid barring end-of-battle rules and does not consume hardpoint cap.

## Roadmap / PR slices

- R0 (this draft PR): architecture and ownership contract, tests/fixture plan, current-code integration audit. No feature flags enabled or gameplay mutation.
- R1: opt-in queue, pure sim-time scheduler, fixed HQ anchor, mixed-faction-appropriate per-soldier waves; deterministic boundary tests 1x/4x/8x; no squad controller takeover.
- R2: dedicated reinforcing movement owner and atomic rejoin; independent NPC state with self-preservation/self-defense. Validate role/identity retention and missing/dead squad leader/squad handling.
- R3: SL-built forward hardpoints, terrain validation, cooldown, faction objective-scaled cap, destroy/retire/overrun and threat-aware spawn selection; no simultaneous-battle order ownership conflicts.
- R4: player-test integration and UI selection, explicit shared clock queue semantics. Verify controls stay with human input.
- R5 (future): general-ordered airhead; actual aircraft route/model and parachuting paratroopers, landing dispersion, assembly, temporary anchor semantics. Avoid abstract teleporting.

## Causal benchmark and diagnostics requirements

Emit lifecycle events: reinforcement_queued, wave_due, wave_processed, wave_deferred(reason), spawn_anchor_selected/rejected(reason), reinforcing_started, rejoin_attempted, rejoin_completed, reinforcing_killed, reinforcing_stranded, hardpoint_placed/contested/disabled/destroyed/retired, build_rejected(reason), player_spawn_selected.

Track queue wait sim-seconds, anchor availability, repeated rejoin path failure, travel time, reinforcement casualty count, successfully rejoined rate, multiple-writer contention, live roster invariants and squad tactical behavior. Compare feature OFF to main for exact baseline behavior, and ON to controlled fixtures; no changed reinforcement population in existing #299 comparator arms.

Required tests: mixed squads in a single wave; partial wave; no double deployments; destroyed anchor at wave boundary; contested anchor; maximum 15 hardpoints and objective cap decreases; cooldowns; SL death while building; soldier dies while rejoining; squad relocation, regroup ignored until rejoin; group leader death and squad disappearance; player mode handoff; sim-time step sizes 1x/4x/8x; reload/snapshot consistency if snapshots supported. Provide reproducible causal traces with reasons, not just counters.

## Dependencies / gating

#299 is presently Draft and blocked by current-main integration concerns. Do not merge reinforcement gameplay while its movement ownership, command hierarchy, and tactical baselines remain unresolved. A documentation-only draft may coexist with it. Reassess integration points against current main before R1. Airborne remains out of scope for near-term implementation.
