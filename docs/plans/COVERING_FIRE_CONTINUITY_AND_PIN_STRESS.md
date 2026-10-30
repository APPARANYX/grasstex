# Covering-fire continuity and suppression stress — 2026-10-29

## Decision: measure natural overlap before adding Talking Guns

**Do not import the old `?talkingGuns=1` implementation (#642) into the replacement Tactical Controller yet.**

The replacement controller already has much of the intended coordination:
- Soldiers take individual, often asynchronous routes to cover; arrival, stance, weapon readiness, target acquisition, firing cooldown and reloads vary per soldier.
- Native contact skills select eligible suppressors and prefer machine-gun capability.
- Covered maneuver requires real **independent supporting-weapon discharge** before authorizing movement.
- A live covering assignment is retained while movers complete their personal routes; physical check-in, not a timer, ends the window.
- Once forward riflemen have discharged, the support element may relocate in turn.

This can create *emergent* (unscripted) overlapping fire, but **does not guarantee** that two suppressors never pause simultaneously. #642 explicitly phase-shifted the second suppressor by half of the first gun's actual burst/pause cycle. It was stacked on the abandoned legacy suppression work and is **not** present in the merged #687 tree.

**Acceptance question:** During a live individual bound, how many seconds or episodes have *no capable designated covering soldier actually firing*, and are these gaps associated with mover exposure, incoming hits, casualties, or aborted bounds? Break down by US/GE, weapon, cover layout, distance and controller mode. Avoid conflating an assigned support role with fired rounds or assuming a zero-gap ideal. Compare same-seed controls and measure the impact on battle outcomes, not merely shots fired.

Add observation-only instrumentation to the Skills Lab and natural-battle benchmarks before considering any timing change. If gaps materially harm bounding soldiers, try a small Engagement-owned fire-cadence intervention; do not introduce another squad movement owner or transplant the legacy suppressor job stack.

## Separate question: Pin Nerve cap (#644)

The unmerged `?pinNerve=1` experiment limits the *Soldier Mind stress increment* from a continuous suppression episode, not pin duration or Engagement's ability to move/shoot. Without a cap, `SUPPRESSED_RATE=0.05` per second continues for as long as the pin is renewed. The original proposal charged at most `1.25 * SquadAI.SUPPRESSION_TIME` (currently 1.625 seconds), then continued to respect the pin as a tactical state. Incoming fire, wounds and casualties still cause separate stress.

#644 responded to #641 (`pinBridge`) greatly extending pins; its original paired observations cited increases in retreats and freeze/flee reactions, but #644's own battle-level validation was pending. The new controller does **not** imply that the same pin-duration distribution exists today. An independent port of the cap should be judged on the current main baseline. **Owner decision (2026-10-29):** enable the isolated cap by default via #688, keep `?pinNerve=0` as an exact A/B rollback, and do not import the old `pinBridge` suppression logic. Original outcome evidence came from the earlier Phase C experiments, not from a completed same-seed benchmark of #688.

Recommended post-merge A/B: explicit legacy `pinNerve=0` control; suppression stress accrued in one uninterrupted pin; new pin after a verified quiet gap; repeated pins versus other incoming-round stress; deterministic replay/RNG; pin hold and movement eligibility invariant; 2 km and 5 km same-seed outcomes plus stress, fire activity, casualty and retreat/freeze/flee distributions. Do **not** merge #641's `pinBridge` or alter suppression timers while isolating #644.

References: #642, #644, #641, #674, #679, #681, merged #687.
