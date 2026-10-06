# AI Battle Tactics Campaign — v1

## Status

**Phase 0 (command reception prerequisite): ✅ Complete**

All seven sub-phases shipped and default-on:
- 0A: Receipt telemetry (#212)
- 0B: Posture/fire-control adoption (#214, default-on)
- 0C: Movement adoption (#215, default-on)
- 0D1: Orientation references (#216)
- 0D2: Relay topology (#223, default-on)
- 0E: Bypass ratchet + validation (#264, all three flags default-on)
- 0F: Inter-squad tactical broadcast (0F1/0F2/0F3 shipped)
- 0G: Multi-contact awareness (0G1/0G2/0G3 shipped)

**File split: ✅ Complete**

`16-squad-plan-stability.js` decomposed from 4,274 → 1,747 lines across 13 sub-modules (15a–15m).
`engagement.js` split into 19 (cover-positions) + 19a (stress-reactions).
`commander-ai.js` split into 22 (reconstitution) + 22a (strategic-recovery).

**Combat bug fixes shipped this session:**
- Hedgerow blind spot (soldiers reposition when no LOS)
- Barrier shooting (fire gate checks obstacles on bullet line)
- Flee orbiting (per-soldier refuge offset)
- Bound distance (BOUND_METERS 22m, BOUND_CYCLE 7s, BOUND_DURATION 4.5s)
- canCrawlTo (real crawl speed from gait table)
- Defend scouting (defendScoutDirection + recon at objective)
- Defend stalemate (usefulDefender expires after 180s; force capture on re-task)
- Retreat stuck (solo-redeploy after 120s at base for small squads)
- LOS gate cache (per-shooter-per-target, 0.1s TTL)
- Loop-watch false positives (posture-churn filter, scaled threshold, maxP 5)

---

## Phase A — Instrument and model (behavior-neutral)

**Goal:** A replay explains why a squad selected a route/structure and who owned each order.

### A1 — TacticalSituation (behavior-neutral, read-only)

Add a `TacticalSituation` record per faction per commander tick that captures:
- **Force posture:** attacking, defending, mixed, stalled (derived from existing squad phases/states)
- **Contact picture:** aggregate of all squad contacts (first-hand, heard, broadcast), with staleness
- **Threat sectors:** 8-directional sector map of known enemy activity (from `squadContactsMap` + `reportedContacts`)
- **Objective pressure:** which objectives are under active contest, and by whom
- **Available reserves:** count and readiness of uncommitted squads

**Owner:** new module `35-tactical-situation.js`. Read-only — no squad/soldier writes. Consumes existing state from `squad.contact`, `sq._contacts`, `sq.inContact`, `sq._macroMission`, `sim.objectiveControl`.

**Validation:** harness check that the record is populated and stable (no churn without state change). Benchmark: INERT (read-only).

### A2 — UrbanOperatingPicture (behavior-neutral, read-only)

Add a `UrbanOperatingPicture` that captures:
- **Building cells:** which buildings are occupied, by whom, observation age
- **Street segments:** which streets are contested/cleared/unknown
- **Sector visibility:** which sectors each squad can observe (from terrain + obstacles)
- **Confidence decay:** how stale each observation is

**Owner:** extends `35-tactical-situation.js`. Reads from `BattleNavigation` (building graph, street graph), `BattleObstacleField`, and soldier positions. No writes.

**Validation:** harness check that the picture updates when squads move. Benchmark: INERT.

### A3 — Diagnostics integration

Render `TacticalSituation` + `UrbanOperatingPicture` in:
- The AI graph (`ai_flow_live.html`) as a new panel
- The session diagnostics export (`99-session-diagnostics-export.js`)
- The timeline recorder (`97-ai-timeline-recorder.js`) as a per-tick snapshot

**Owner:** UI modules only. No sim writes.

**Validation:** visual check that the panel populates. Benchmark: INERT.

---

## Phase B — Versioned intent and leases

**Goal:** Conflict telemetry reports zero strategic-field ownership conflicts in a normal match.

### B1 — SquadIntent contract

Extend the macro mission brief with `reason` and `confidence` metadata:
- `reason`: why this brief was issued (initial-mission, strategic-stall, objective-control-changed, reserve-commit, etc.)
- `confidence`: 0–1 based on intel quality (first-hand sightings vs heard vs stale)
- `observations`: what the General saw when issuing the brief (enemy strength, objective status, squad fit)

**Owner:** `commander-ai.js` `issueMission()` — adds fields to the mission object. No new writes to squad/soldier state.

**Validation:** telemetry events carry the new fields. Benchmark: INERT (metadata only).

### B2 — Named route-transition lease

Add a `route-transition` lease that tracks:
- Which route leg the squad is transitioning through
- Progress (distance traveled, time elapsed)
- Abort reason (contact, blocked, superseded, stalled)
- Release condition (arrival at next leg, or abort)

**Owner:** `15l-squad-leader-mission-execution.js` — wraps the existing route-advancement logic in a named lease. The lease is diagnostic (it doesn't change behavior — it just makes the transition visible and traceable).

**Validation:** lease appears in `BattleLeases.active()`, progress updates per tick, abort reason is recorded. Benchmark: INERT (diagnostic lease, no behavior change).

### B3 — Lease conflict resolution

Centralize lease conflict resolution so incompatible intents don't race:
- `bound` vs `regroup` — regroup wins (cohesion first)
- `tactical-plan` vs `corner-hold` — corner-hold wins (urban commitment)
- `recon` vs `bound` — recon wins (scouts out before bounding)

**Owner:** `16-squad-plan-stability.js` — formalizes existing implicit precedence into a single resolution function. No new writes.

**Validation:** `writerConflicts` stays 0 in benchmarks. Existing lease checks pass.

---

## Phase C — Squad Leader local planner

**Goal:** Force Command selects *what* to seize/secure; Squad Leader selects *how locally* without changing the strategic objective.

### C1 — Local plan module

Create `15n-squad-leader-local-plan.js` that consumes Force Intent + `TacticalSituation` and produces a local task:
- **Approach:** navigate to the objective using the best available route (considering terrain, known enemies, cohesion)
- **Support:** hold position and provide overwatch/fire support for another squad's approach
- **Route-transition:** move through a specific route segment (street, building) with progress tracking
- **Structure-control:** clear and hold a specific building
- **Objective-security:** establish defensive positions around a captured objective
- **Recover:** regroup and rearm after casualties
- **Handoff:** transfer responsibility for an objective to another squad

**Owner:** new module. Reads `TacticalSituation`, `sq._macroMission`, `sq._contacts`. Writes `sq._localTask` (new field, owned by this module). Does NOT write `sq.commandPhase`, `sq.objective`, `sq.orderAnchor` — those stay with the existing mission-execution module.

**Validation:** harness check that the local task is selected based on the situation. Benchmark: behavioral change (behind a flag `?localPlan=1`).

### C2 — Graceful degradation

When the Squad Leader is unavailable (dead, fled, succession gap):
- Retain the current valid local task
- Fall back to a conservative hold (engage from cover, no bounding)
- Do not invent new tasks

**Owner:** `15d-squad-leader-leaderless-intent.js` — extends the existing leaderless-intent system to preserve the local task.

**Validation:** harness check that leaderless squads hold position and don't invent tasks. Benchmark: INERT (degradation only).

---

## Phase D — Streets and structures

**Goal:** Squads stop oscillating at corners/windows; can confirm structure control; can explain reroutes/aborts.

### D1 — Street segment graph

Build a street-segment graph from the existing navigation/building data:
- Each street segment has: start, end, width, ownership (none/us/ge/contested), observation age
- Segments connect at intersections
- A segment is "cleared" only if a squad has traversed it and no enemy has been seen since

**Owner:** new module `36-street-segment-graph.js`. Reads from `BattleNavigation`. Writes `battle._streetGraph` (new field, owned by this module).

**Validation:** harness check that the graph builds from scenario data. Benchmark: INERT (read-only construction).

### D2 — Building cell graph

Build a layered building-cell graph:
- Each building is divided into cells (rooms/floors)
- Cells have: entrance, exit, layer connection (stairs), observation age, control status
- A building is "controlled" only if all cells are cleared and held

**Owner:** extends `36-street-segment-graph.js`. Reads from `BattleNavigation` building data. Writes `battle._buildingGraph`.

**Validation:** harness check that the graph builds. Benchmark: INERT.

### D3 — Route-transition state machine

When a squad transitions between route segments:
1. **Enter:** squad arrives at segment start, begins traversal
2. **Traverse:** squad moves through segment, checking for enemies
3. **Clear:** squad reaches segment end, marks segment as cleared
4. **Hold:** squad holds the segment exit until the next segment is ready

Abort conditions: contact, blocked path, superseded by new brief, stall timeout.

**Owner:** `15l-squad-leader-mission-execution.js` — wraps route advancement in the state machine. Uses the `route-transition` lease from B2.

**Validation:** harness check that transitions are tracked. Benchmark: behavioral change (behind a flag `?streetControl=1`).

### D4 — Structure-control state machine

When a squad clears a building:
1. **Enter:** squad enters building through a designated entrance
2. **Clear:** squad clears each cell (room-by-room)
3. **Secure:** squad holds the building, marks it as controlled
4. **Release:** squad hands off to another squad or moves on

**Owner:** new module `37-structure-control.js`. Reads building graph, writes `battle._buildingGraph` cell states.

**Validation:** harness check. Benchmark: behavioral change (behind a flag `?structureControl=1`).

---

## Phase E — Secure and exploit

**Goal:** Captured objectives receive appropriate coverage while available units continue toward the next decisive point.

### E1 — Sectorized security

After capturing an objective, the Squad Leader assigns sectors:
- Each fireteam covers a sector (8-directional)
- Sectors with known enemy activity get priority
- Gaps are identified and flagged

**Owner:** `15h-squad-leader-fireteams.js` — extends fireteam publishing to include security sectors.

**Validation:** harness check. Benchmark: behavioral change (behind a flag).

### E2 — Successor handoff

When a squad is relieved at an objective:
- The relieving squad inherits the security plan
- The original squad is released to the General for a new mission
- Handoff is tracked in telemetry

**Owner:** `commander-ai.js` — extends mission assignment to support handoff.

**Validation:** harness check. Benchmark: behavioral change.

### E3 — Reserve commitment

The General commits reserves based on:
- Objective pressure (from `TacticalSituation`)
- Squad availability (not in contact, not retreating, not reconstituting)
- Strategic priority (main effort gets reserves first)

**Owner:** `commander-ai.js` — extends existing `reserveDue` logic.

**Validation:** harness check. Benchmark: behavioral change.

### E4 — Exploit-after-success

After a successful capture:
- Force Command has a deadline (30s) to choose: secure, exploit, or release
- **Secure:** assign a squad to defend the objective
- **Exploit:** push the capturing squad forward to the next objective
- **Release:** return the squad to reserve

**Owner:** `commander-ai.js` — extends `wakeReason()` to include post-capture deadline.

**Validation:** harness check. Benchmark: behavioral change.

---

## Phase F — Train, evaluate, tune

**Goal:** A new policy improves mission score without increasing loops, stale orders, or unexplained order conflicts.

### F1 — Deterministic scenario suite

Build a suite of 9 deterministic scenarios:
1. Open-ground objective
2. Contested intersection
3. Blocked street
4. Single structure
5. Multi-structure objective
6. Hidden upper/lower route
7. Counterattack
8. Squad Leader loss
9. Post-capture exploitation

**Owner:** new `tools/ai-sim-harness/scenarios/` directory with fixture JSONs + a runner.

**Validation:** each scenario runs to completion with no runtime errors.

### F2 — Scoring system

Score each scenario on:
- Mission completion (did the objective get captured/held?)
- Casualties (fewer is better, but not at the cost of mission)
- Time (faster is better, but not at the cost of caution)
- Plan churn (fewer replans is better)
- Invalid movement ownership (zero is the only acceptable value)
- Objective security (did the captured objective stay captured?)

**Owner:** extends `scripts/run_battle_benchmark.mjs` with a scenario-scoring mode.

**Validation:** scores are deterministic across runs.

### F3 — Replay corpus

Keep a corpus of replays from each scenario, comparing policy revisions against the same seeds.

**Owner:** extends `97-ai-timeline-recorder.js` to export per-scenario replays.

**Validation:** replays are byte-identical for the same seed + policy.

---

## Phase G — Combined-arms control plane (behavior-neutral)

**Goal:** A replay explains which main effort received a scarce asset, why another was denied/delayed, and that no asset controller changed an infantry destination.

### G1 — Asset registry

Register available assets:
- Vehicle types (armor, transport, gun)
- Fire support (mortar, artillery, air)
- Sustainment (supply, medical, recovery)

**Owner:** new module `40-combined-arms-registry.js`. Data-only — no combat effects.

### G2 — SupportRequest lifecycle

A `SupportRequest` has:
- Requester (squad)
- Asset type requested
- Priority (urgent, priority, routine)
- Status (pending, approved, denied, in-flight, completed, cancelled)
- Effect card (suppress, obscure, interdict, protect)
- Result confidence (observed, inferred, unknown)

**Owner:** new module `41-support-request.js`. No combat effects — just the request lifecycle.

### G3 — CombinedArmsCoordinator

A scheduler that:
- Accepts/denies/expire/traces support requests
- Resolves conflicts (two squads request the same asset)
- Publishes the decision to the AI graph

**Owner:** new module `42-combined-arms-coordinator.js`. No combat effects.

**Validation:** harness check that requests are tracked and conflicts resolved. Benchmark: INERT (no combat effects).

---

## Phase H — Ground vehicles and anti-armor

**Goal:** Vehicles support/constrain a local plan without colliding with infantry movement ownership; failed mobility is reasoned state, not a stalled unit.

### H1 — Vehicle navigation layer

Separate vehicle navigation from infantry:
- Terrain/road/bridge constraints (vehicles can't go where infantry can)
- Recovery (stuck vehicles can be recovered)
- Fuel/readiness bands

### H2 — VehicleTask leases

Vehicles operate on `VehicleTask` leases:
- Direct support (provide fire/transport to a specific squad)
- Reserve (held back for commitment)
- Recovery (returning to base for repair/resupply)

### H3 — One armor + one anti-armor profile

Start with one direct-support armor profile and one anti-armor profile before expanding the roster.

### H4 — Squad Leader vehicle request

The Squad Leader's local plan can request a vehicle effect/position window, but never commands a vehicle path or uses vehicle proximity as proof of objective control.

---

## Phase I — Mortars, artillery, and air as delayed effects

**Goal:** Planners wait for/adapt to/abandon delayed support rationally; the graph separates a requested effect from an observed mission advantage.

### I1 — Fires Controller

One common Fires Controller with effect cards:
- Suppress (pin enemy in area)
- Obscure (smoke screen)
- Interdict (deny area to enemy movement)
- Protect (defensive fires around friendly position)

Test status, latency, cancellation, friendly-risk, result confidence, and expiry before tuning damage values.

### I2 — Recon/spotting

Reconnaissance and spotting feed observed results back to the common picture. Requests alone never update route or objective control.

### I3 — Bounded air support

One bounded air-support mission:
- Sortie availability
- Weather/visibility
- Air-defense risk
- Request delay
- Observation decay

---

## Phase J — Sustainment, service, and roster breadth

**Goal:** Scenario designers compose historically flavored forces through data while the same command/request/vehicle/effect contracts remain valid.

### J1 — Sustainment state

Transport, towing, resupply, medical evacuation, maintenance, recovery, and static-obstacle state — only where each changes a tactical or operational choice.

### J2 — Roster variants

Add roster variants as capability data, not new command code paths:
- Light/medium/heavy armor
- Armored cars, assault guns, tank destroyers
- Mortar and artillery classes
- Fighter/recon/strike aircraft
- Scenario-appropriate naval/coastal support

### J3 — Larger scenarios

- Armored exploitation
- Delayed counterattack
- Bridge loss
- Convoy disruption
- Contested airspace
- Artillery allocation
- Combined-arms objective handoff

---

## Implementation priority

| Priority | Phase | Why |
|---|---|---|
| 1 | A1-A3 | Instrumentation is behavior-neutral and unblocks everything else |
| 2 | B1-B2 | Versioned intent + route-transition lease make decisions traceable |
| 3 | C1-C2 | Local planner lets the Squad Leader choose *how*, not just *what* |
| 4 | D1-D4 | Streets and structures are the core urban tactics |
| 5 | E1-E4 | Secure and exploit makes captures meaningful |
| 6 | F1-F3 | Training/evaluation validates the whole campaign |
| 7 | G1-G3 | Combined-arms control plane (behavior-neutral) |
| 8 | H1-H4 | Vehicles and anti-armor |
| 9 | I1-I3 | Mortars, artillery, and air |
| 10 | J1-J3 | Sustainment and roster breadth |

Each phase ships behind a flag, validates with the standard benchmark, and merges only when CI is green. The genome stays stashed until Phase F validates the scoring system.
