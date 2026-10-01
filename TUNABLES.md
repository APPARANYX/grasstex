# Grasstex AI Tunable Inventory

**Phase 5 work-in-progress.** Every tunable number by layer, for the future genome rewrite.
Generated 2026-09-29 from the merged `main` branch (post #118-#121).

**Checked 2026-09-30, once, by script (nothing in CI enforces it):** all 67 entries name a constant that
exists in the file they are listed under, and all 52 plain-number values equal the code. The 15 compound
entries (objects, several numbers on one line) were not compared, and completeness was not checked. Known
gap: the Squad Leader's retreat threshold is a bare `0.6` in `updateSquadState` (`modules/16`), not a named
constant; `RETREAT_CASUALTY_FRAC` below is `squad-ai.js`'s fallback for a squad with no Squad Leader module.

## Core

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
- `RECON_STRENGTH = 10` — recon squad size
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

### 17-soldier-mind.js
- `TAU = 22` — stress decay time constant (s)
- `CASUALTY_RANGE = 30` — casualty observation range (m)
- `LEADER_CALM = 0.65` — leader calming effect
- `REACT_GAIN = 0.6` — reaction time gain (up to 1.6x)
- `CALM_AFTER = 12` — stress-memory `lasting` (default on): seconds out of contact and out of fire before stress drains (s)
- `FLED_FLOOR = 0.2` — a man who has fled never calms below this stress, at base or anywhere; `BattleSoldierMind.tuning.FLED_FLOOR`
- `RELIEF = { kill: 0.12, objective: 0.15, cover: 0.06, survived: 0.05 }` — stress-memory `relief` (default on): stress taken off by each kind, times his nerve

### 10-soldier-stats.js
- `EFFECTS` — stat effect multipliers (see file)
- `MIN_MEN = 3` — minimum men per squad

### 14-wound-model.js
- `BLEED_TAU = 30` — bleed-out time constant (s)
- `ZONES`, `ZONE_ODDS` — wound zone definitions and probabilities

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
