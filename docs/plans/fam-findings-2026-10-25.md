# Fire-and-manoeuvre findings (2026-10-25)

Evidence behind `coordinated-advance-and-retreat.md`. Paired probe packs (fresh seeds, 120 battles per arm pair unless noted;
2 km = `strategicInterception=0`, 5 km = strategic map). "Live" means the on arm's counter moved and the off arm's did not.

## What blocks a squad from bounding (attackers, 5 km, measured)

In contact time: retreat 35%, fire control HOLD or PRECISION 34%, not authorized 28%. Once authorized, 98.7% of samples wait on
the 7 s `bound-cycle` lease (`BOUND_CYCLE` 7 s against `BOUND_DURATION` 4.5 s, re-armed at four sites in 15j). About 90% of bound
episodes are individual cover moves; 44% to 73% reach cover; many die before arriving.

## Experiments

| Draft | Flag                              | Result                                                                                                                                  |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| #646  | `coverRelay` (heard base of fire) | 2 km neutral; 5 km US kills -11%, rounds -12%                                                                                           |
| #647  | `peelBack`                        | inert: skipped squads in `retreat` (35% of contact time) and needed half the squad pinned (my design error)                             |
| #648  | `maneuverFirst`                   | changed task labels only, outcomes identical                                                                                            |
| #649  | `coverStagger`                    | individual cover moves -60%, no gain; objectives held -14% on 2 km                                                                      |
| #650  | `retreatTeams`                    | live: 638 holds in 60 two-km battles, 66 holder deaths; kills, alive, held flat. Holds cover about 20% of retreat contact time          |
| #652  | `precisionRelease`                | live (10,649 ticks released, 0 in off arm); PRECISION is past the 6 s window for 31% of its ticks; outcomes identical to the last digit |
| #653  | `holdKeepClock`                   | live (restarts 5,461 to 0); HOLD ticks -27%; US kills +4.5% (p 0.075), GE flat, bound episodes +6% (not significant)                    |

## Conclusions

1. Releasing HOLD or PRECISION frees nothing because the next gate still blocks: `r.effective < 2`. During HOLD and PRECISION nobody
   fires (PRECISION: only the marksman), so there is no base of fire to start a bound. This is the binding gate, then `bound-cycle`.
2. Retreat has no covering element (all members enter `withdraw`, suppressors are excluded, fire only inside 35 m). A retreat-only change
   (#650) works but touches too little of the battle to move outcomes.
3. Waiting for a heard base of fire before individual cover moves (#649) makes men move less and fight worse; individual cover orders
   while others fire is the intent.
4. The reactive coordinator and `execute-covered-bound` live only in Draft #630; none of #645 to #653 contained them.

## Verified code issues (z.ai review, confirmed on main)

- Target change during preparation restarts HOLD (`setFireControl(..., null, 'hold', ...)` in 15a); PRECISION has no time budget.
- `precisionShooter` (15a) ranges to the enemy's live position, not the recorded contact point.
- `threatDisposition(unit)` reads the enemy's live reaction state (freeze, flee, rage) inside `hasFirstHandMemory` and `firstHandContact`
  (an omniscient read; the belief is clean, this bypasses it).
- `sq._multiContactSectors` is written in 15j and read nowhere.
- Four `bound-cycle` re-arm sites in 15j (contact start, multi-contact, stress hold, after a bound); the multi-contact one re-grants every
  tick while two sectors are in contact.

## Next

FAM PR (one skill, both directions, built on #630): base-of-fire count from men ordered to cover and heard firing, `bound-cycle` derived
from `BOUND_DURATION`, no fire-control gate (see "Separation" in the design doc), fighting withdrawal on the same skill. A separate small PR
for the two omniscient reads. #647 to #650, #652 and #653 stay Drafts as evidence.
