# [WARGAME] Junction Corridor 001 — ChatGPT vs Claude (starter)

<!-- Copy the title above into a new GitHub Discussion and use the body below. Remove this note. -->
<!-- Use the rulebook docs/agents/commander-wargame-rules.md as the permanent authority. -->

[WARGAME][SETUP]

## Governing protocol

Rulebook: [Commander Wargame Rules of Play v1](./commander-wargame-rules.md).
This is a qualitative **thought wargame**, not a real GRASSTEX runtime battle.
This Discussion is the **PUBLIC** match record. Never publish umpire truth or faction-private reports.

- Match ID: JC-001
- Status: SETUP
- Turn limit: 8
- Abstract time: 10 minutes per round
- Mode: DISCOVERY (bounded proposed capabilities allowed; tracked as hypothetical)
- Game code ref: \`<PIN REPOSITORY BRANCH AND SHA BEFORE FIRST TURN>\`
- Roles: ChatGPT = US General, Claude = GE General, third independent chat = neutral Umpire, human = coordinator
- Paired follow-up: repeat same scenario with ChatGPT = GE, Claude = US
- Authority: Force Command / General sets mission priorities; Squad Leader decides local implementation; individual soldiers act autonomously

## Objective and victory conditions

Fictional 5 km x 5 km open-country sector. Coordinate origin southwest;
roads include west/east trunk line and branches to the north/south crossings.

| Objective | Approx. location (x,z meters) | Value | Initial control |
|---|---|---:|---|
| Central Junction | (2500,2500) | 3 | Neutral |
| North Crossing | (2500,3750) | 1 | Neutral |
| South Crossing | (2500,1250) | 1 | Neutral |

Decisive victory requires control of Central Junction **and** one crossing for
two consecutive resolved rounds. Otherwise compare end-state objective points,
then sustained control, then remaining effective squad strength; otherwise draw.
No game ends early just because an umpire describes the position as hopeless.

## Starting public world

- Both factions control three rear bases on their own sides of the map.
- Each General commands **five infantry squads** of nominal ten soldiers.
- Main east–west highway approaches Central Junction. Secondary roads fork
  toward North and South Crossings. Wooded concealment and broken fields lie
  off the highways. Specific approach delays are umpire-adjudicated, not exact
  imported GRASSTEX navigation.
- Vehicles: each faction has two trucks at home bases, each can carry one
  squad and remains in the world when dismounted. This is a **scenario
  assumption**, not proof of what is merged to main.
- Optional aerial recon: one bounded request per General for this entire
  thought battle. Observations are stale by the next round and never reveal
  permanent exact positions.
- Starting contact: no confirmed hostile squad positions. Opposing base
  regions are broadly known, not the exact squad deployments.

## Command vocabulary

**Before battle:** Umpire or coordinator checks the chosen game ref and
lists actual native commands with file paths or cites. Mark every other
command \`PROPOSED\` even if referenced in draft features/design docs.

Minimum abstract scenario permissions (not automatically GRASSTEX native):
allocate a squad to an objective; hold or redirect a squad; request a
limited recon; request use of a physically available truck. These permissions
allow a thought-game strategy, but any unsupported game action still goes in
the missing-capability ledger. Do not quietly promote proposals to native.

Budgets: max five squad mission orders, one primary mission per squad,
plus at most one additional support/recon request per round; bounded actions
must take time and consume real stated resources.

## Secret setup (OUT OF BAND — do not paste in this public Discussion)

Umpire prepares a private starting record for both sides including exact
friendly squad-to-base assignments, local supply/readiness and any asymmetric
reported observations. The coordinator copies **US-only** briefing to
ChatGPT and **GE-only** briefing to Claude. Hidden ground truth stays with
the Umpire. Neither General is sent the other's initial deployment.

## Round lifecycle

1. \`[WARGAME][BRIEF][T01]\`: Umpire posts public world changes and private
   messages are sent individually.
2. ChatGPT and Claude independently write orders in **their own** chats.
   Coordinator holds both until both are final. Do not reveal one early.
3. \`[WARGAME][ORDERS][T01]\`: Coordinator posts both verbatim simultaneously,
   as a single comment, with declared \`NATIVE\` / \`PROPOSED\` labels.
4. \`[WARGAME][RESOLVE][T01]\`: Umpire evaluates both against the prior
   state, timestamps changes, records uncertainty and new capability gaps.
5. Repeat T02–T08 or stop at the declared victory condition.
6. \`[WARGAME][DEBRIEF]\`: decisions, objective result, new capabilities,
   failures and hypotheses for subsequent actual GRASSTEX simulation testing.

A completed hypothetical action is **not proof** it works in the live game.

## Commander order form

    TURN:
    SIDE:
    SITUATION (confirmed facts vs inference):
    INTENT:
    COMMANDS (max five):
      - ACTOR:
        TYPE: NATIVE | PROPOSED
        ORDER / DESTINATION:
        TRIGGER / EXPIRY:
        TIME & RESOURCE COST:
    SUPPORT REQUEST (max one):
    NEW CAPABILITIES NEEDED (IDs, prerequisites, tradeoffs):
    CONFIDENCE:
    IF PLAN FAILS:

## Umpire resolution form

    ROUND:
    BOTH ORDERS RECEIVED AND SEALED?:
    PUBLIC WORLD / OBJECTIVE CHANGES:
    ACTIONS COMPLETED / IN PROGRESS / BLOCKED:
    TIME, RESOURCE AND INTEL CHANGES:
    UNKNOWN / CONTESTED EFFECTS AND ASSUMPTIONS:
    PROPOSED ACTION RULINGS (with equal rules for both sides):
    CAPABILITY LEDGER ADDITIONS:
    VICTORY STATUS:
    PRIVATE BRIEFS DELIVERED OUT OF BAND?:
    NEXT ROUND:

## Match report requirements

Report the objective outcome, decision quality, adaptability, resource
discipline, unsupported actions actually requested, and exact sources/refs
needed to implement them. Use the companion match with swapped model sides
before drawing conclusions about model quality. Never merge or enable a new
feature from thought-game evidence alone.
