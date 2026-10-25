# Coordinated advance and retreat (one fire-and-manoeuvre skill)

> Status: design draft for Ivan's review. Nothing here is implemented on main. Written 2026-10-25 after reading the
> AI Skills V1 spec (#602), the tactics outline (0G fire and movement), the execution contract and the reactive
> fire-and-manoeuvre notes (branches `work/reactive-fire-maneuver-20261021`, `work/reactive-gates-20261022`).

## Decision (Ivan, 2026-10-25)

1. Advance and retreat are the **same skill** (`execute-covered-bound`), one with a direction. Retreat is the assault
   bound reversed, not a second skill.
2. It is built on the Draft #630 skills (reactive coordinator, `coordinate-support-fire`, `execute-covered-bound`),
   with the Squad Leader (15j) as the only owner that grants the native `bound` lease.
3. No existing document specified coordinated retreat. This is that document.

## What the existing docs already say (reuse, do not redo)

- **Owner.** 15n scores the choice, 15j `fireAndMovement` alone grants the `bound` lease and orders it, Engagement
  chooses the physical cover and the Movement Resolver moves. A skill adds no writer, timer or lease type (AI Skills V1).
- **Stage model** (reactive notes, `BattleReactiveFireManeuver.squadStage`, diagnostics only): cover, then support,
  then positions, then advance. Every combat-capable man reaches useful cover; two real supporters fire (own-discharge
  receipts, not posture); only then does the leader lease a bound to a settled man.
- **Overwatch rule** (outline 0G2/0G3): one fireteam holds in overwatch while the other bounds.
- **Retreat authority** (#351, #356, #375): a retreating squad is never defensive; retreat orders reach leaderless
  squads; the squad-command owner moves everyone.

## What is missing (measured, 5 km and 2 km, 2026-10-25)

- Retreat has no alternating covering element: every ordinary member enters `withdraw`, supporters are excluded and
  only opportunistic fire inside 35 m happens.
- Forward bounds are rarely authorized. In contact time: retreat 35%, fire control HOLD or PRECISION 34%,
  not authorized 28%. Once authorized, 98.7% of samples wait on the 7 s `bound-cycle` lease.
- ~90% of bound episodes are individual cover moves. 44% to 73% reach cover and many die before arriving.

## Design

One skill, two directions, same gates:

|           | forward                                                    | back                                                                                      |
| --------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Trigger   | assault or maneuver task authorized                        | squad state `retreat` and in contact                                                      |
| Holders   | at least 2 able shooters, heard (`?coverRelay=1`)          | same                                                                                      |
| Movers    | one fireteam, along the covered route toward the objective | one fireteam, along the covered route away from the threat toward the retreat anchor      |
| Lease     | native `bound`, `BOUND_DURATION`                           | same lease, `data.back = true`                                                            |
| Next      | rotate team on window end                                  | same rotation, the team that held now moves                                               |
| Authority | phase, COA, resources, adoption                            | retreat (#375, #351/#356) stays the owner; the skill only chooses who holds and who moves |

Rules that must hold:

- Reuse `orderBound`, the cover search, the covered-route gate and the callout relay. No new movement writer or timer.
- A holder fires at any range and keeps its ground until the window ends or the squad stops retreating.
- Fewer than 4 living or no contact: a plain retreat or a plain advance, as today.
- Derive constants from `BOUND_CYCLE`, `BOUND_DURATION` and `BOUND_TEAMS`; add none.

## How it is judged

Paired flag runs on 2 km and 5 km (fresh seeds, pinned control SHA, `strategicInterception=0` for 2 km). Report:
bound episodes by direction, men who reached cover, deaths of movers and of holders, retreat completion time, kills,
alive, objectives held. No merge without an end-to-end improvement and Ivan's word naming the PR.

## State of the evidence

- #650 (`?retreatTeams=1`, retreat only) fires: 638 holds in 60 two-km battles, holders on the line 2646 man-seconds,
  66 holder deaths. Outcomes unchanged (kills 1419 to 1433 US, 1482 to 1487 GE). Retreat holds covered about 20% of
  retreat contact time, so a retreat-only change is a small share of a battle.
- #646 (`?coverRelay=1`) gives the heard base of fire; neutral on 2 km, US kills -11% on 5 km.
- #649 (cover stagger) cut individual cover moves by about 60% with no gain: waiting on a heard base of fire is not
  the fix. Orders to individual men to take cover while others fire is the intent.

## Open questions for Ivan

1. Should the retreat skill start only when the squad is already in `retreat`, or also as a planned fighting
   withdrawal before the 60% casualty rule?
2. Is the holder window the same as the forward bound window (4.5 s), or longer when no enemy is within weapon range?
3. Do you want the forward half first (fix the HOLD/PRECISION and `bound-cycle` gates) or both directions in one PR?
