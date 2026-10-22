# Grasstex AI Tunable Inventory

**Phase 5 work-in-progress.** Every tunable number by layer, for the future genome rewrite.
Generated 2026-09-29 from the merged `main` branch (post #118-#121).

**Checked 2026-09-30, once, by script (nothing in CI enforces it):** all 67 entries name a constant that
exists in the file they are listed under, and all 52 plain-number values equal the code. The 15 compound
entries (objects, several numbers on one line) were not compared, and completeness was not checked. Known
gap: the Squad Leader's retreat threshold is a bare `0.6` in `updateSquadState` (`modules/16`), not a named
constant; `RETREAT_CASUALTY_FRAC` below is `squad-ai.js`'s fallback for a squad with no Squad Leader module.

## Core

### battle/modules/21b-strategic-front-lines.js
- Exposed-line security retains **one** present squad while another active squad remains available and the enemy may attack that held line. Eligibility uses the objective's `minPresence` (fallback **2**) and `radius` (fallback **20 m**); the existing capture-security release band is **1.35 × radius**. An established defender is preferred, and front advancement/loss releases the guard without a new timer.

### battle/squad-ai.js
- `RETREAT_CASUALTY_FRAC = 0.6` — flat retreat threshold (superseded by `?morale=1`)
- `DESTINATION_COMMIT = 1.35` — seconds before destination commitment
- `EYE_HEIGHT = 1.55` — soldier eye height (m)
- `SCAN_INTERVAL = 0.3` — perception scan interval (s)
- `VISIBILITY = { stand: 1, crouch: 0.72, prone: 0.45 }` — visibility multipliers by stance
- `FOCUS_HALF = Math.PI / 3` — 60° half-angle, 120° focus cone
- `HEAR_RANGE = 120` — hearing range (m)
- `CONTACT_MEMORY = 12` — contact memory duration (s)
- `SCAN_SWEEP = 40°` — scan sweep angle
- `CONTACT_REFRESH = 2` — contact refresh interval (s)
- `SENIORITY = { sergeant: 0, rifleman: 1, scout: 2, gunner: 9 }` — role seniority for command

### battle/commander-ai.js
- `COMMAND_TICK = 0.45` — commander AI tick interval (s)
- `STRATEGIC_STALL_REPLAN = 120` — first strategic-stall recovery wake (s), and the review-pass cadence once the recovery ladder is exhausted: the General re-runs the reset population every 120 s of continued stall
- `STRATEGIC_STALL_RECOVERY = { reconcile: 120, release: 180, mainEffort: 240, reset: 300, progressWindow: 60, progressDistance: 6, mainEffortFraction: 0.6, mainEffortMin: 2 }` — staged Macro recovery for one no-objective-progress episode: repair assignments, release stale holds/support, mass a reachable main effort, then reset squads that are neither useful defenders nor making measurable mission progress. `progressWindow` is also the adoption window: a later stage holds while a previous stage's brief is still younger than it and unaccepted. A same-objective reset re-briefs through the objective's flank point instead of deduping into a no-op; a re-derived identical brief is a recorded ineffective wake, never churn
- `RECON_STRENGTH = 10` — preferred/full reconstitution target and rebuilt squad establishment
- `RECON_MIN_STRENGTH = 6` — minimum combined survivors from at least two at-base remnants that may form a viable rebuilt squad
- `REMNANT_EXTRACTION_MAX = 4` (`SquadAI`; exposed to Force Command as `RECON_POOL_MAX`) — 1–4 survivors extract independently to home with no local regroup/recentring until reconstitution; 5+ survivors remain a viable squad and use ordinary retreat/morale recovery
- `RECON_MAX_CENTER_TRAVEL = 300` — maximum distance any source remnant may be from its neutral geographic rendezvous (m)
- `RECON_FORWARD_DETOUR = 1.15` — frontward rendezvous slide may lengthen each source's route by at most 15% versus the neutral centre
- `RECON_FORWARD_MAX = 180` — absolute maximum frontward rendezvous slide (m)
- `FLED_PICKUP_RANGE = 50` — a retreating squad out of contact this near a fled man waiting at his refuge takes him in (m); `BattleCommanderAI.fledPickupRange`

### battle/battle-sim.js
- `AI_TICK = 0.15` — main AI tick interval (s)
- `FIELD_W = 2000, FIELD_D = 1200` — battlefield dimensions (m)
- `AVOID_LOOKAHEAD = 1.8, AVOID_MARGIN = 0.5, AVOID_QUERY = 8` — avoidance parameters
- `NAV_REPLAN_HOLD = 1.5` — nav replan hold time (s)

### battle/engagement.js
- `REACT = { sergeant: 0.55, rifleman: 0.7, gunner: 0.85, scout: 0.45 }` — reaction times by role (s)
- `AIM_CONE = 0.22` — aim cone angle (~12.6°)
- `AIM_SETTLE = 0.4` — aim settle time after stance change (s)
- `MOVE_FIRE_FRACTION = 0.12` — max speed fraction for firing
- `ALERT_HOLD = 4.5` — threat sector hold time (s)
- `ENGAGE_REVIEW = 7.0` — cover re-evaluation interval (s)
- `STANCE_HOLD = 4.0` — stance hold time (s)
- `COVER_RANGE = 26` — cover search range (m)
- `GUNNER_SETUP = 1.4` — gunner setup time (s)
- `BOUND_METERS = 6.5` — bound distance (m)
- `MAX_SUPPRESSORS = 2` — max suppressors per target
- `PREWARNED_REACT = 0.55` — pre-warned reaction time (s)
- `ACT_TUNING = { COWER_QUIET: 3, REACT_MIN: 4, FLEE_ARRIVED: 1.5, FLEE_REPICK: 4, FLEE_TRIES: 2, FLED_WAIT: 180, FLED_ENEMY_NEAR: 80, FLED_SAFE: 80, FLED_HOME_RADIUS: 12, FLEE_NO_THREAT: 0.3, FREEZE_NOT_UNDER_FIRE: 0.7, TROUBLE_AGE: 20, RAGE_RANGE: 120, RAGE_REACH: 160, MELEE_RANGE: 2.2, MELEE_PERIOD: 1.4, MELEE_HIT: 0.6, MELEE_ENERGY: 0.8, MELEE_POWER: 0.6, RAGE_GUARD_SECONDS: 5, RAGE_GUARD_SCALE: 0.25 }` — stress reactions (all four on by default; `?stressAct=0` disables them and a comma list selects exact reactions; s, m, weights, chances; the guard is the share of a hit a berserk man takes for the first seconds; `FLED_*` are a fled man's wait at his refuge, how near an enemy sends him home, how near a known enemy makes a refuge unsafe, and how near home he is at base); exposed as `BattleEngagement.tuning.ACT_TUNING`

### battle/movement-resolver.js
- `ORDER_COMMIT = 1.35` — order commitment time (s)
- `INTENT_REFRESH = 0.55` — intent refresh interval (s)

### battle/battle-navigation.js
- `DOOR_PAD = 1.55, DOOR_CLEARANCE = 0.48, CORNER_PAD = 2.4` — navigation clearances (m)
- `MAX_EDGE = 300` — max nav edge length (m)

## Modules

### 16-squad-plan-stability.js
- `ASSAULT_LEASE = 26` — assault lease duration (s)
- `REGROUP_ENTER = 1.35` — regroup enter threshold
- `STRAGGLER_BYPASS = 2.8` — straggler bypass distance
- `BOUND_CYCLE = 9.0` — bound cycle time (s)
- `ASSEMBLY_HOME_RADIUS = 20` — assembly radius (m)
- `ORDER_STRIDE = 13` — order stride distance (m)
- `COVER_BAND = 5` — cover band width (m)
- `MORALE_TUNING = { breakBase: 0.6, breakSlope: 0.3, breakMin: 0.25, rallyStress: 0.15, rallyCasualty: 0.5 }` — group morale thresholds (`?morale=1`)
- `COA_WEIGHTS` — deterministic COA scoring weights (COA on by default; `?coa=0` disables it)

- `FIRE_CONTROL_TUNING = { prepMin: 1.2, readyFraction: 0.7, minReady: 3, longRange: 140, closeRange: 85, minStrength: 0.55, minMarksmanship: 0.42, precisionMarksmanship: 0.62, maxHold: 6, crestStep: 0.75, crestMax: 6, returnFireWindow: 3 }` — Squad Leader hold/prepare/reposition/open-fire decision, long-range designated marksman, local crest preparation, terrain-deadlock escape, and return-fire exception (`?fireControl=0` control).
- `LEAD_TUNING = { holdAt: 0.3, reviewAt: 1/3, reviewAfter: 10, reviewMin: 3 }` — Squad Leader stress in local execution (`?slStress=pick,hold,review`, all three on by default, `?slStress=0` none): the shaken band at which every team that could bound holds the cycle, and the squad mean, seconds in contact and living men at which a hold/support/regroup brief asks for a doctrine review.
- `localPlan=1` (default OFF), `BattleSquadStability.localPlan.tuning = { pressureEnter: 0.45, pressureExit: 0.25, emergency: 0.75, contactAge: 10, confidence: 0.5 }` — C situational arbitration: pressure is the fraction of own commanded men pinned/under fire; protection hysteresis bypasses ordinary commitments. Eligible choices score approach `0.1`, regroup `0.7 + 0.25 * dispersed`, recon `0.6 + 0.3 * (1-confidence)`, support `0.4 + pressure`, maneuver `0.6 + 0.25 * confidence - pressure`, protect `1 + pressure`. A still-eligible choice holds for the existing `BOUND_DURATION` (4.5 s), unless pressured or superseded. Fresh recon requires no contact, insufficient reported confidence and no valid regroup. Maneuver still requires every existing fire-control/phase/COA/base-of-fire gate; covered-route safety is explicitly unassessed. No new movement, stance or strategic owner.
- `localPlan=1&localDegrade=1` (both required, default OFF) — validate inherited local-task identity/current mission and situational eligibility during the existing six-second succession gap. Maneuver also requires a live bound with matching mission version/task serial; first invalidation holds until successor handback. Reuses existing pressure/resource/lease thresholds; no new timer or movement authority.
- `localPlan=1&localResources=1` (both required, default OFF), `localPlan.tuning.resourceLimit = 32`, `minimumSupport = 2` — bound resource gate: assess at most 32 own roster/report entries, require two unique ready supporters outside the selected movers; cached supporter identities expire after the existing `BOUND_DURATION` (4.5 s) and are revalidated against current membership, possession, condition and Ammunition readiness. No station/route safety assessment.
- `RETREAT_ANCHOR_LEASE = 6`, `RETREAT_ANCHOR_ARRIVE = 5`, `RETREAT_PROGRESS_EPS = 0.75`, `RETREAT_GOAL_EPS = 6`, `RETREAT_NO_PROGRESS = 6`, `RETREAT_RECOVERY_STRIDE = 0.5` — Squad Leader retreat-anchor stability: one leased endpoint while useful progress continues; arrival advances it, material goal change / blocked-or-unsafe route / no-progress may rebase it; recovery uses half of `ORDER_STRIDE`.

- `localPlan=1&localTasks=1` (both required, default OFF) — join mission execution to local route-transition (`0.55`), objective-security (`0.8`) and recover (`2`) choices. Uses the existing route progress lease, actual defend phase/public objective ownership/own presence, and retreat/rally recovery owners. Contact/pressure, real recon and regroup retain situational arbitration; security/recovery cannot authorize bounds. No new recovery timer, rearm or clearance claim.

### Engagement — contact cover first

- `contactCoverFirst` defaults ON; `contactCoverFirst=0/off/false` preserves the legacy contact-orient/hold-preparation sequence. Before orienting, a newly contacted advancing/alert soldier uses the existing native cover search (**26 m**, **42 m** under incoming fire/suppression). A delivered personal report requires confidence **0.5**, age at most **10 s**, finite coordinates/time, and a source other than raw `heard`. These thresholds do not create contact or authorize squad movement. Existing useful cover is retained; on first live contact without a usable slot, all roles initially go prone under the existing **2 s** low-posture commitment before orienting, without renewing the lease each alert tick or overriding remembered-warning transit. Open-ground fighting/sector hold prefers prone for all roles; native seeing-stance and ballistic gates still decide whether he can fire. Genuine prone shooters contribute to the existing base-of-fire report, with no bypass of Meso support, movement or resource checks. Arrival or failed ingress starts the native recognition window before combat resumes. Collision, reachability, claim spacing, route recovery and fire permission remain native.

### 15p-reactive-fire-maneuver.js — opt-in reactive coordination

- `reactiveFireManeuver=1&localPlan=1&coveredBounds=1` (all required, default OFF) selects native reactive coordination instead of deliberate ambush preparation and the squad AI Skills adapter. Requires an executing offensive mission (`assault`, `capture`, `clear-town`), credible reported contact (confidence **0.5**), coherent own roster, pressure below **0.75**, and a viable moving element. Maneuver score is `1.8 + 0.25 * confidence - 0.1 * pressure`; a qualified maneuver releases an ordinary support commitment immediately. Recovery/security, COA, fire control, multi-contact, stress and lease-conflict gates remain native.
- At least **2** distinct current native supporters outside the moving element must have actual own-discharge receipts (the Perception receipt expires after **4.5 s**) and current Engagement firing capability. Native Engagement rechecks support and mission/task identity before adoption. Contact flicker does not start another blind bound-cycle delay; the native **7 s** after-bound cycle remains. Before team preflight, **all** current living combat-capable members must be stopped in useful cover, a live occupied native slot (within the owner’s **0.45 m** occupancy tolerance), or prone. Individual cover ingress is not readiness; dead/incapacitated members are excluded. At adoption, holders are rechecked while movers on the same committed lease are exempt. After two verified supporters establish fire, a fresh credible personal report also settles report-only advancing members through native `alert`/hold and prone fallback; it never creates a target. Existing alert expiry and personal-contact freshness govern release. No timeout waives the squad gate and no new stance/movement writer is added. Team preflight examines at most **48** slots from a maximum **256** candidates per mover; native Engagement independently selects and reserves the actual destination.

### 19-engagement-cover-positions.js — opt-in covered bounds

- `localContinuity=1` (default OFF; full structure/watch/contact-resume flag chain required) — separate post-contact presence provenance: `localPlan.tuning.presenceGap = 1.5` simulated seconds, `presenceSpeed = 7` m/s and `presenceSlack = 0.15` m for each leader/witness delta. Requires the same own living AI leader and witness, inside-footprint Navigation legality and current witness LOS. At least two different-time observations (count bounded to eight) derive only from earlier real doorway entry; missing/invalid evidence revokes permanently until another entry. Every firefight starts a fresh survey/watch epoch. These are discontinuity rejection bounds, not evidence of enemy absence.
- `localPlan=1&coveredBounds=1` (both required, default OFF); `BattleCoverPositions.boundTuning()` exposes maximum straight bound distance **12 m**, sample spacing **0.75 m**, maximum sampled exposed gap **1.5 m** (including the closing interval), reported-contact age **10 s**, confidence floor **0.5**, and maximum **3** distinct reported threat coordinates. Unknown or over-budget knowledge fails closed. LOS uses the Perception owner's public `eyeHeight` API: crouched bound height **1.05 m** and standing reported-threat height **1.55 m** above terrain, never a hidden unit's current stance. Both endpoints must be concealed. These are concealment eligibility thresholds, not ballistic-protection claims; no new cooldown or movement writer.

- For a native lease explicitly tagged `reactiveFireManeuver`, the same physical route sampler allows an exposed starting point and at most **8 m** per sampled exposed gap, including its closing interval. The destination must remain concealed. The **12 m** straight-route limit, **0.75 m** sampling, fresh personal reported threats, collision/navigation legality and native standing firing-ray gate remain. Ordinary covered and ambush movement retain the **1.5 m** limit and concealed start; there is no exposed destination/rush fallback.

- Firing-position setup (`firingPositionPlan`, read-only, same flags): a settled member who lacks a firing line is leased one covered slot. No new cooldown or distance: the lease reuses `BOUND_DURATION` and `BOUND_CYCLE`, the **12 m** bound distance and the reactive route policy above. A line needs a clear sight and ballistic ray from some stance, with the target inside that man's `engageRange` (weapon-specific, e.g. a sergeant **90 m**) and a fresh personal reported contact (**10 s**, confidence **0.5**, never a `heard` source). Candidate work is bounded: more than **256** cover candidates fails closed, and only the first **48** are inspected. At least two supporters other than the assignee must remain. No assignment is made when the squad is pinned, below two effective members or under emergency pressure, and an unassignable man never blocks the ordinary reactive path.

### 15o-squad-leader-tactical-postures.js — opt-in concealed ambush

- `localAmbush=1` requires `localPlan=1` and fire control enabled; default OFF. Minimum stopped masked hold **4 s**, preparation budget **12 s**, ready-without-contact budget **12 s**, pressure entry **0.25**, exit **0.1** with **3 s** low-pressure dwell, current-evidence read age **0.5 s**, rearm cooldown **8 s**. At most **32** own soldiers/reports and **3** fresh reported sectors (age **10 s**, confidence **0.5**); at most **16** candidate cover slots per soldier within **6 m**, masked approach sampling **0.5 m**, post separation **1.5 m**, settled arrival **0.5 m**. Native firing still requires personal LOS, existing readiness/aim/fire permission. Masking is concealment, not proof of ballistic protection.

### 17-soldier-mind.js

- `TAU = 22` — stress decay time constant (s)
- `CASUALTY_RANGE = 30` — casualty observation range (m)
- `LEADER_CALM = 0.65` — leader calming effect
- `REACT_GAIN = 0.6` — reaction time gain (up to 1.6x)
- `CALM_AFTER = 12` — stress-memory `lasting` (default on): seconds out of contact and out of fire before stress drains (s)
- `FLED_FLOOR = 0.2` — a man who has fled never calms below this stress, at base or anywhere; `BattleSoldierMind.tuning.FLED_FLOOR`
- `RELIEF = { kill: 0.12, objective: 0.15, cover: 0.06, survived: 0.05 }` — stress-memory `relief` (default on): stress taken off by each kind, times his nerve
- `FREEZE_MIN = 12`, `FREEZE_MAX = 48` — bounded dazed/freeze duration (s), selected once from recent stress-dose concentration when the freeze begins

### 10-soldier-stats.js
- `EFFECTS` — stat effect multipliers (see file)
- `MIN_MEN = 3` — minimum men per squad

### 14-wound-model.js
- `BLEED_TAU = 30` — bleed-out time constant (s)
- `ZONES`, `ZONE_ODDS` — wound zone definitions and probabilities

### 23-grenades.js (on by default; `?grenades=0` disables)
- `SquadAI.LOADOUTS.*.grenades = { sergeant: 2, rifleman: 2, gunner: 1, scout: 2, engineer: 3 }`, `LOADOUT_MAX = 3` — carried inventory; no refill on possession/rearm
- `RANGE = 30`, `CONF_MIN = 0.5`, `CONTACT_FRESH = 6`, `DECISION_EVERY = 1.5`, `FRIEND_CLEAR = 13` — throw range (m), personal-contact confidence/age (s), remembered-contact review cadence (s), friendly clearance including scatter (m)
- `WINDUP = 0.9`, `COOLDOWN = 18`, `FUSE = 3.6` — decision-to-release, release cooldown, landed fuse (s)
- `SCATTER = 3.5`, `FLIGHT_MIN = 0.7`, `FLIGHT_PER_M = 1/18`, `FLIGHT_MAX = 2.4` — independent-stream landing scatter (m) and flight-time bounds/range slope (s, s/m)
- `SUPPRESS_RADIUS = 16`, `PIN_MIN = 1.6`, `PIN_MAX = 4.2` — burst suppression radius (m) and pin hold (s)
- `FRAG_SEVERITY = 40`, `FRAG_POWER = 0.85`, `BLAST_SEVERITY = 60`, `FRAG_MAX_RANGE = 22`, `FRAG_MIN_RANGE = 0.6`, `FRAG_MAX_HITS = 8` — per-fragment and overpressure wound severity (scaled by range-decayed energy through `BattleWounds`), drop class, fragment reach (m), range floor (m) and hit cap
- `KINDS.mk2 = { hits5: 2, spread: 1.25, reach: 17, blast: 1.8 }` (US, 57 g TNT) and `KINDS.m24 = { hits5: 1.6, spread: 1.55, reach: 12, blast: 3 }` (German, 170 g TNT, thin steel head) — mean fragment hits on a standing man at 5 m, density falloff exponent, fragment energy decay length (m), overpressure injury radius (m). Hits are Poisson with mean `hits5 × STANCE_AREA × (5 / d)^spread`; fitted so a standing man in the open is a casualty ~95 % at 2 m, ~50 % at 5 m (Mk 2) and ~5 % at 15 m
- `STANCE_AREA = { stand: 1, crouch: 0.6, prone: 0.3 }`, `FRAG_ZONES = leg .40, abdomen .16, chest .22, arm .18, head .04` — silhouette share presented to a ground burst; zone odds of a fragment hit
- `ARC_STEPS = 24`, `ARC_MIN = 1.3`, `ARC_MAX = 7`, `ARC_PER_M = 0.24`, `REST_Y = 0.12`, `SETTLE_TIME = 0.35`, `BURST_Y = 0.5`, `VICTIM_Y = 0.9` — deterministic physical arc samples, arc apex bounds/slope, rest/fragment/body heights (m), settling time (s)
- `RELEASE_ORIGIN = { stand: [.22,1.7,.02], crouch: [.32,1.2,.45], prone: [.16,.75,.27] }` — measured semantic palm offsets (right, up, forward; m), rotated by the soldier's yaw at release

### 14-z-ballistic-raycast.js
- `EPS = 0.08` — raycast epsilon
- `MUZZLE_HEIGHT = { stand: 1.55, crouch: 1.05, prone: 0.42 }` — muzzle heights (m)
- `THROUGH = { head: 0.75, chest: 0.7, abdomen: 0.75, arm: 0.95, leg: 0.85 }` — through-and-through probabilities

### 11-soldier-individuality.js
- `CROUCH_FACTOR = 0.58, CRAWL_FACTOR = 0.23` — movement speed factors
- `RUN_DISTANCE = 7.5` — run distance threshold (m)

### 44-combat-urgency.js
- `MIN_COVER_FORWARD = 1.5` — min forward cover (m)
- `COVER_SEARCH = 22` — cover search radius (m)

### 47-sidearm-switch.js
- `T = { DRAW: 0.7, CLEAR: 1.2, NEAR: 20, CLOSE: 8, HOLD: 3, LEAVE: 35 }` — sidearm switch timings and ranges

### 51-soldier-personal-space.js
- `MIN = 0.90` — minimum personal space (m)
- `MAX_PUSH = 0.18` — max push distance (m)

### 52-survival-tactical-route.js
- `ARRIVE = 0.95` — arrival threshold
- `SAMPLE_DT = 0.5` — route sampling interval (s)

### 53-fbx-soldier-backend.js
- `REACTION_ANIM = { fade: 0.32, cowerEnterRate: 3, cowerExitRate: 3, freezeEnterRate: 5, fleeEnterRate: 1, dropSide: 0.88, dropBack: 0.08, dropLift: 0.055, dropYaw: 0.35 }` — presentation-only stress-reaction cross-fade, authored-clip playback rates and discarded-weapon placement (m/rad); freeze holds are a deterministic visual choice, never an RNG draw

### 39-navigation-physicality-debug.js
- `BODY_RADIUS = 0.45` — soldier body radius (m)
- `LOOKAHEAD_DISTANCE = 105` — path lookahead (m)
- `WAYPOINT_SPACING = 10` — waypoint spacing (m)
- `REPLAN_SECONDS = 5.0` — replan interval (s)

### 43-squad-forward-progress.js
- `WINDOW = 15` — progress window (s)
- `MIN_TRAVEL = 12, MIN_NET = 2.5, MIN_EFF = 0.15` — progress thresholds

### 47-contextual-voice-behavior.js
- `SAMPLE = 0.45` — voice sample interval (s)
- `CONTACT_GRACE = 12, TACTICAL_GAP = 8` — voice timing (s)

## Notes
- This is a living document. New tunables go in the owning layer's `tuning` object per AGENTS.md.
- The genome (`battle/ai-policy.js`) remains stashed; these are the code defaults.
- Group morale and COA are shipping defaults; `?morale=0` and `?coa=0` are their A/B controls. Full stress memory and stat-based roster dealing are also defaults. The genome remains stashed.
