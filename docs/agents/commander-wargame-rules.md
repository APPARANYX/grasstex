# GRASSTEX Commander Wargame — Rules of Play (v1)

**Type:** qualitative, turn-based, AI-vs-AI commander ideation exercise. This is **not** the GRASSTEX runtime battle simulation, a validated military model, or a claim of actual in-game combat success.

**Canonical location:** one GitHub Discussion per battle, titled \`[WARGAME] <scenario> | <match ID>\`. This rules file is reusable; copy the [discussion starter](commander-wargame-discussion-starter.md) for an individual match. Record the rules revision and game commit/ref in every match.

## 1. Purpose and hard boundaries

Discover **which decisions the General should be able to make**, not only how to tune existing decisions. Evaluate strategic adaptability, objective selection, reconnaissance requests, vehicle allocation, reserve commitment, mission changes, and contingency orders. Catalog missing **game command capabilities** without pretending they are already implemented.

The General issues **mission intent and priorities**. Squad Leaders handle local planning. Soldiers own individual movement/combat choices. An AI General may propose a missing action at any layer but does not get to directly operate individual soldiers or bypass GRASSTEX decision ownership.

Each match produces (a) a trace of decisions, (b) game-state narrative and outcome with explicit uncertainty, and (c) a capability backlog for later verification in the actual GRASSTEX simulator. A theoretical win is NOT a passed benchmark.

## 2. Roles

- **US General:** one separate ChatGPT or other model session. Receives only the public state and US-only intelligence.
- **GE General:** one separate Claude or other model session. Receives only the public state and GE-only intelligence.
- **Neutral Umpire:** a third isolated chat, with complete game-state truth; records resource/time consequences, uncertainty and adjudication.
- **Coordinator:** human/operator who collects sealed orders from both sessions and publishes the common Discussion transcript. They must not coach either side.

Use independent chats, not one shared prompt containing both generals' private positions. Neither commander may read the other commander's **current** orders before submitting its own.

For meaningful comparisons, repeat paired scenarios with models swapped between sides, the same initial conditions and rules, and record the model/version/session effort level. Both commanders may see prior **revealed** actions and public results.

## 3. Match setup (required)

Each Discussion must declare:

1. Match ID; rules version; status (\`SETUP\`, \`ACTIVE\`, \`PAUSED\`, \`COMPLETE\`); turn cap (default **8**, allowed 2–15); game-reference branch and pinned commit SHA.
2. Scenario size; named objectives with locations/routes and victory points; meaningful terrain/roads/cover; turn duration (default **10 abstract minutes**); starting faction forces, home bases, vehicles, resources and readiness.
3. Initial PUBLIC information; starting US-private and GE-private intelligence delivered separately; *umpire-only truth* (never published to the Discussion).
4. Victory conditions, ties, what information may be obtained, capabilities/constraints available to **both** generals, and whether special assets are limited.
5. Mode: \`NATIVE_ONLY\` (no effect from proposed actions) or \`DISCOVERY\` (umpire may test bounded hypothetical effects).

**Feature authority:** pin the inventory of actually supported commands to source files on the declared ref. If the runner, commander AI, or strategic branch does not implement an action, mark it **PROPOSED**, even when it is discussed in a design document or draft PR. Never assume #527, #545, #548, or later feature branches were merged to main.

**No initial omniscience:** a General knows own starting strength/locations and public objectives; enemy location, strength, movement and intent are unknown unless scenario intel or valid later reporting supplies them.

## 4. Round protocol (simultaneous sealed orders)

A round advances both factions together. The published record must follow this precise order:

1. **Umpire — BRIEF Tn:** posts public map/objective/clock/resource changes and sends **private faction briefs** independently to the two commander chats. Private briefs never go into public GitHub text.
2. **Commanders — SEALED ORDERS Tn:** both privately formulate orders without access to their opponent's same-round answer. The coordinator holds them until **both are finalized**. During this step the opponent's orders are not posted to the public Discussion. An optional independently verifiable SHA-256 commit/reveal may replace coordinator custody if both tools support it.
3. **Coordinator — REVEAL Tn:** posts both *unchanged* order payloads together in one Discussion comment. No edit or retroactive counterorder after reveal.
4. **Umpire — RESOLVE Tn:** resolves simultaneous actions against the complete prior state, preserves fog of war, ages intelligence, applies movement/setup/costs, assesses contention, and updates hidden state. The referee posts the **public** outcome and transmits new side-private briefs separately.
5. **Umpire — LOG Tn:** records new proposed command IDs, feasibility/adjudication, assumptions and whether any hypothetical effect influenced the outcome; then either begins the next turn or closes the match.

If a commander fails to submit, pause rather than fabricating its strategy. Use an explicit \`NO_ORDER\` only when that side elects to hold. If sessions lose context, restore from public history plus **only that faction's** private brief and its own previous orders. Do not supply referee truth.

**GitHub Discussions are public on a public repo.** The Discussion is the **public journal**, not secure private storage. Hidden state and faction briefs must stay in their respective chats or another protected store. Avoid pasting hidden information into the Discussion, including in base64 or simple Markdown spoilers.

**Polling:** chats can check for a fresh turn **when prompted**, but normal ChatGPT/Claude conversations cannot independently poll forever or wake up to resume. The operator may tell each chat to take its turn. API orchestration would be a separate, potentially billable automation mode.

## 5. Orders and command-budget constraints

Each General submits one ORDER payload per turn using this shape:

    TURN: Tn
    SIDE: US | GE
    SITUATION: <what I think is happening; known vs inferred>
    INTENT: <desired effect and why>
    COMMANDS (up to five: at most one primary mission per squad):
      - ACTOR: <squad / available support asset>
        TYPE: NATIVE | PROPOSED
        ORDER: <mission, target and priority>
        TRIGGER / EXPIRY: <optional bounded contingency>
        COST / TIMING: <known, estimated or requested>
    SUPPORT: <at most one extra strategic resource request if available>
    PROPOSED CAPABILITIES: <action ID, purpose, constraints, authority layer>
    CONFIDENCE: LOW | MEDIUM | HIGH
    IF PLAN FAILS: <next likely adaptation>

No free extra squads, instant base reinforcements, unlimited trucks or magical repositioning. Moving a squad/vehicle or establishing a position takes an umpire-adjudicated, map-consistent amount of time; route uncertainty matters. No explicit order instantly grants a combat hit, objective capture, accurate enemy identity or perfect sensor contact. Existing game concepts such as air reconnaissance, truck transport or interception only exist as **native** actions when verified for that pinned ref.

The General may change an existing mission, but the umpire must charge plausible communications, acknowledgment, travel and reorganization delay. There is no zero-cost every-turn teleport/re-tasking.

## 6. Neutral adjudication

The Umpire **may NOT** adjudicate by inventing outcomes specifically to reward a compelling narrative. It must:

- Start from previous shared and hidden state, process *both* orders **simultaneously**, track time, resource consumption, routes, objective state and uncertainty.
- Distinguish **observed**, **reported**, **inferred**, and **unknown** intelligence; contacts can become stale. Reconciliation cannot silently reveal hidden enemy ground truth.
- Classify resolution: \`CONFIRMED_IN_ABSTRACTION\`, \`PLAUSIBLE_BUT_UNCERTAIN\`, \`BLOCKED\`, or \`UNRESOLVED\` with reasons. These are **thought-game** judgments, not real-engine simulation outcomes.
- Avoid deterministic tactical kills, perfect ambushes, suppression effects or ballistic assertions unsupported by the abstraction.
- When contested effects are unknowable, state what assumptions would change the result; do not select an outcome solely to make the story interesting.
- Record a time/cost for issued orders, even unsuccessful ones. Maintain a consistent resource ledger.
- Apply equal criteria to both factions and expose significant assumptions publicly without leaking private state.

### Proposed missing commands in DISCOVERY mode

An AI may **propose and attempt** a new command. The Umpire marks it \`APPROVED_HYPOTHETICAL\`, \`PARTIAL\`, \`DEFERRED\` or \`DENIED\`; records prerequisites, delays, resource cost, observation requirements, command authority, counterplay and uncertainty. A hypothetical effect may be included only if bounded and plausible in the game's abstraction; the record clearly flags every such effect. A newly allowed *capability type* becomes available to **either** side under the same rules from the next round, not retroactively.

An invented action does **not** become native just because it helped win a thought battle. All such wins are exploratory. After the match, replay under NATIVE_ONLY or use the real sim to evaluate the feature independently.

## 7. Victory, termination, and assessment

Use **scenario-specific objectives and point values**, declared before turn 1. Default tiebreak order: objective points at the final turn, objectives held for at least one full resolved round, then relative combat-effective squads/resources; otherwise draw. Early victory requires the declared scenario condition, not a persuasive umpire argument. No unannounced victory criteria.

The referee reports separate axes rather than a single misleading numerical “AI score”:

- **Objective result:** US win, GE win, draw, or inconclusive.
- **Decision quality:** whether each commitment responded coherently to information available *at decision time*.
- **Adaptability:** response to changed information, contested objectives and opponent counterplay.
- **Operational consistency:** overcommitment, stale targets, wasted transport, ignored resource constraints.
- **Capability gaps:** requested commands unavailable in pinned runtime; high-value potential improvements.
- **Evidence:** hypothetical-only vs later verified in shipping battle benchmark.

Do not rank ChatGPT vs Claude from one battle. Run paired scenario swaps and multiple independent turns/scenarios before comparing strategic performance.

## 8. Required public Discussion format

Use these headings in sequence. Each post starts with an unambiguous prefix so future automation can parse it:

- \`[WARGAME][SETUP]\` — scenario, rules, roles, refs, starting public state, victory points, mode.
- \`[WARGAME][BRIEF][T01]\` — public turn briefing; private notes sent out of band.
- \`[WARGAME][ORDERS][T01]\` — both commanders' locked, verbatim orders **posted together**.
- \`[WARGAME][RESOLVE][T01]\` — public world-state change, time/costs, objective ownership, confidence and proposed-action rulings.
- \`[WARGAME][DEBRIEF]\` — winner if justified; turn-by-turn decisive choices; command capability ledger; verification roadmap.

Capability ledger entry:

    ID: CAP-001
    REQUESTED BY: US | GE (round)
    OPERATIONAL NEED: <situation/problem>
    CANDIDATE ACTION: <bounded semantic game command>
    OWNER: Force Command | Squad Leader | Soldier | Other
    NATIVE ON PINNED REF?: yes | no | uncertain
    HYPOTHETICAL EFFECT USED?: yes | no
    PREREQUISITES / COST / COUNTERPLAY: ...
    EXPECTED VALUE / FAILURE CONDITIONS: ...
    FOLLOW-UP: verify code -> prototype -> actual seeded battle A/B

## 9. Match hygiene

- The Umpire must preserve its private state across turns in the same third chat. On context loss, pause and reconstruct only from a securely held checkpoint.
- Review the *actual* current command inventory before a native-only run. Give each side identical baseline capability semantics, not identical knowledge.
- Avoid editing previous orders and outcomes; append corrections with a clear timestamp and reason.
- If adjudication is disputed, pause, post the competing interpretations, resolve consistently, and tag the result as disputed.
- Keep the native-only vs discovery comparison under the same scenario/rules and do not promote hypothetical success to actual gameplay evidence.
- **No GitHub Action, API credit, workflow or repository merge is necessary for the manual three-chat exercise.**
