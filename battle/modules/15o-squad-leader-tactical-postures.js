/* One opt-in Squad Leader posture policy. No destinations, fire permissions,
   stance, strategic intent or Navigation geometry are written here. Existing
   personal-command, fire-control and Engagement owners execute this evidence. */
(function (root) {
  'use strict';
  if (root._squadLeaderTacticalPostures) return;
  root._squadLeaderTacticalPostures = function (ctx) {
    var A = root.SquadAI,
      L = root.BattleLeases,
      query = (root.location && root.location.search) || '',
      on = !!(
        ctx.localPlan &&
        ctx.localPlan.on &&
        ctx.FIRE_CONTROL_ON &&
        /[?&]localAmbush=(?:1|on|true)(?:&|#|$)/i.test(query)
      ),
      maneuverOn =
        on &&
        /[?&]localManeuver=(?:1|on|true)(?:&|#|$)/i.test(query) &&
        /[?&]coveredBounds=(?:1|on|true)(?:&|#|$)/i.test(query),
      operationOn = maneuverOn && /[?&]fireManeuverOperation=(?:1|on|true)(?:&|#|$)/i.test(query),
      states = new WeakMap(),
      cooldown = new WeakMap(),
      counters = new WeakMap(),
      tuning = {
        minimumHold: 4,
        preparationBudget: 12,
        observationBudget: 12,
        pressureEnter: 0.25,
        pressureExit: 0.1,
        pressureDwell: 3,
        maneuverWindow: 14,
        minSupport: 2,
        readAge: 0.5
      };
    /* One Meso-owned, serial-bound operation ledger. It records verified
       phases but cannot write a soldier destination, shot or bound lease.
       Actual authorization remains the current native fire/route gates. */
    function operationTransition(b, sq, st, phase, reason) {
      if (!operationOn || !st || !st.operation || st.operation.phase === phase) return;
      var op = st.operation;
      op.transitions.push({ from: op.phase, to: phase, at: b.time, reason: reason });
      if (op.transitions.length > 24) op.transitions.shift();
      op.phase = phase;
      op.at = b.time;
      ctx.telemetry(b, 'decision-fire-maneuver-operation', {
        squad: sq.id,
        faction: sq.faction,
        serial: st.serial,
        phase: phase,
        reason: reason
      });
    }
    /* A verified three-person line may keep QUIETLY OBSERVING under the
       SAME valid mission after its original sighting expires. Only detached
       geometry anchors are retained for a physical concealment check; no
       stale report can grant firing or maneuver, and no expired coordinates
       are passed to reserveStage, coveredTeam or fire control. */
    function quietOperationSafe(b, sq, st, a) {
      if (
        !operationOn ||
        !st ||
        !st.operation ||
        st.mode !== 'ambush' ||
        st.readyAt == null ||
        sq.inContact ||
        ambiguousPicture(b, sq) ||
        (sq._localTask && sq._localTask.emergency) ||
        a.some(function (s) { return !!s.target; }) ||
        !st.observationGeometry ||
        !st.observationGeometry.length ||
        st.compromisedAt != null ||
        !heldCore(b, sq, st, a)
      ) return false;
      var C = root.BattleCoverPositions;
      return !!(
        C &&
        st.heldActorIds.every(function (id) {
          var s = a.find(function (man) { return String(man.id) === id; });
          return s && C.maskedPost(b, s.root.position, st.observationGeometry);
        })
      );
    }
    function point(p) {
      return p && Number.isFinite(p.x) && Number.isFinite(p.z) ? { x: p.x, z: p.z } : null;
    }
    function epoch(s) {
      return +(s.eng && s.eng.possessionEpoch) || 0;
    }
    function men(sq) {
      /* An occupied weapon emplacement or separate positional commitment
         belongs to its own owner. Exclude that soldier rather than vetoing
         the entire remainder of a squad; never issue a posture order to him.
         If a station is adopted or released, member identity validation below
         revokes the old posture before anything can act on stale membership. */
      var a = ctx.commanded(sq).filter(function (s) {
        return !(root.BattleTacticalPositions && root.BattleTacticalPositions.current(s));
      });
      return a.length >= 3 &&
        a.length <= 32 &&
        a.every(function (s) {
          return s.root && point(s.root.position) && !s.incapacitated && !s.isPlayer && s.hp > 0;
        })
        ? a
        : null;
    }
    function threatCopy(r) {
      return {
        x: r.x,
        z: r.z,
        at: r.at,
        confidence: r.confidence,
        targetId: r.targetId == null ? null : String(r.targetId),
        sector: r.sector == null ? null : String(r.sector),
        source: r.source || null
      };
    }
    function freshReports(b, sq) {
      var reports = A.squadContactsMap(sq, b),
        out = [];
      if (!Array.isArray(reports) || reports.length > 32) return out;
      reports.forEach(function (r) {
        if (
          point(r) &&
          Number.isFinite(r.at) &&
          b.time >= r.at &&
          b.time - r.at <= 10 &&
          Number.isFinite(r.confidence) &&
          r.confidence >= 0.5
        )
          out.push(threatCopy(r));
      });
      return out;
    }
    /* More than three fresh confident sectors is an ambiguous picture: no
       post or route can be judged against it. That is distinct from having no
       fresh report at all; a prepared line in contact keeps its posts through
       the former and the maneuver route simply stays unknown. */
    function threats(b, sq) {
      var out = freshReports(b, sq);
      return out.length <= 3 ? out : [];
    }
    function ambiguousPicture(b, sq) {
      return freshReports(b, sq).length > 3;
    }
    function continuingThreats(b, sq, st, selected) {
      /* 0.5 is an ENTRY/selection threshold. Once the Squad Leader has
         issued a preparation order from a valid report, deterministic belief
         confidence decay must not revoke that same report before the mandatory
         four-second dwell can finish. Continuity is still fail-closed: the
         underlying combat-threat belief must still exist, retain the same
         target/sector identity and remain inside the existing 10 s age cap.
         Any current >=0.5 report supersedes the preparation snapshot normally. */
      var raw = A.squadContactsMap(sq, b);
      if (!Array.isArray(raw) || raw.length > 32 || !st || !st.threats || !st.threats.length) return [];
      var confidentCount = raw.filter(function (r) {
        return (
          point(r) &&
          Number.isFinite(r.at) &&
          b.time >= r.at &&
          b.time - r.at <= 10 &&
          Number.isFinite(r.confidence) &&
          r.confidence >= 0.5
        );
      }).length;
      /* More than three current confident sectors remains a hard ambiguity
         veto. A normal new confident set supersedes the detached snapshot. */
      if (confidentCount > 3) return [];
      if (confidentCount > 0) return selected;
      var out = [];
      st.threats.forEach(function (old) {
        var match = raw.find(function (r) {
          if (
            !point(r) ||
            !Number.isFinite(r.at) ||
            b.time < r.at ||
            b.time - r.at > 10 ||
            !Number.isFinite(r.confidence)
          )
            return false;
          if (old.targetId != null && r.targetId != null) return String(r.targetId) === String(old.targetId);
          if (old.sector != null && r.sector != null) return String(r.sector) === String(old.sector);
          return Math.abs((+r.at || 0) - (+old.at || 0)) <= 0.5 && Math.hypot(r.x - old.x, r.z - old.z) <= 20;
        });
        if (match) {
          /* A sub-threshold belief may prove that the original observation
             still exists, but it is not confident enough to drag a prepared
             firing line toward a new coordinate. Retain the detached location
             and original timestamp until a new >=0.5 report supersedes it. */
          out.push({
            x: old.x,
            z: old.z,
            at: old.at,
            confidence: old.confidence,
            targetId: old.targetId,
            sector: old.sector,
            source: old.source
          });
        }
      });
      return out.length && out.length <= 3 ? out : [];
    }
    /* This is a read-only preflight. Actual move eligibility, reservations,
       route selection and firing remain with native Engagement and Movement.
       Never treat visibility masking as ballistic protection; reuse the
       physicality-aware 0.75 m covered bound sampler for every candidate. */
    /* Engagement reports an identity-based base of fire. Duplicate entries,
       stale roster members and non-firing men cannot manufacture two rifles. */
    function supportingCount(a, movers, support, now, battle) {
      if (!Array.isArray(support) || support.length > 32) return 0;
      var seen = [];
      return support.filter(function (s) {
        if (!s || seen.indexOf(s) >= 0) return false;
        seen.push(s);
        return (
          a.indexOf(s) >= 0 &&
          (!movers || movers.indexOf(s) < 0) &&
          !s.dead &&
          !s.reloading &&
          !s.outOfAmmo &&
          !(s.suppressedUntil > now) &&
          !s.moving &&
          (!root.BattleEngagement ||
            !root.BattleEngagement.effectiveFireOn ||
            !root.BattleEngagement.effectiveFireOn() ||
            root.BattleEngagement.supportReady(s, battle))
        );
      }).length;
    }
    /* Read-only proof of the SAME three adopted, stationary riflemen. A large
       squad may have additional men still finding cover; that cannot reset a
       genuine held fireteam or count a rotating set of arrivals as a 4s hold. */
    function settledActors(b, st, a, reports) {
      var C = root.BattleCoverPositions,
        O = root.BattleExecutionOutcome;
      return st.orders
        .filter(function (o) {
          /* The maneuver reserve receives real Meso movement orders but cannot
             claim the three-man firing-line dwell merely by occupying cover. */
          if (o.reserve) return false;
          var s = a.find(function (man) {
            return String(man.id) === o.soldierId;
          });
          if (!s || s._fireteamPublishKey !== o.key || s.moving || !O || !O.man) return false;
          var body = point(s.root && s.root.position),
            last = s._movementResolver && s._movementResolver.last,
            intent = last && point(last.intentPoint),
            CR = root.BattleCommandReception,
            receivedMovement = CR && CR.movementEnabled && CR.movementEnabled(),
            outcome = receivedMovement && O && O.man ? O.man(s, b) : null,
            anchor = st.heldPositions && st.heldPositions[o.soldierId],
            engagement = root.BattleEngagement && root.BattleEngagement.stateOf(s),
            contactHold = !!(
              st.readyAt != null &&
              anchor &&
              body &&
              Math.hypot(body.x - anchor.x, body.z - anchor.z) <= 0.5 &&
              last &&
              last.owner === 'engagement' &&
              last.kind === 'hold' &&
              engagement &&
              ['advance', 'alert', 'orient', 'engage', 'suppress'].indexOf(engagement.state) >= 0 &&
              (!receivedMovement ||
                (CR.executionCurrent &&
                  CR.executionCurrent(
                    s,
                    b,
                    'movement',
                    'soldier:' + String(s.id),
                    s._fireteamAdoptedEnvelope
                  )))
            ),
            completed = receivedMovement
              ? !!(
                  outcome &&
                  outcome.current &&
                  outcome.state === 'completed' &&
                  outcome.publishKey === o.key
                )
              : !!(body && Math.hypot(body.x - o.point.x, body.z - o.point.z) <= 0.5);
          /* With personal command reception enabled, Command Reception +
             Movement Execution own the definition of an adopted formation
             order completing (including the Resolver's 1.8 m arrival
             tolerance). Reuse that canonical outcome rather than maintaining
             a second, stricter production rule. When movement reception is
             explicitly disabled, preserve the legacy direct-publish 0.5 m
             behavior exactly. In both modes the posture still independently
             requires the exact publish key, Squad Stability ownership, the
             original ambush intent, a stationary body and concealment at the
             man's REAL position before any dwell can accrue. */
          return !!(
            body &&
            (contactHold ||
              (completed &&
                last &&
                last.owner === 'squad-stability' &&
                last.kind === 'formation' &&
                intent &&
                Math.hypot(intent.x - o.point.x, intent.z - o.point.z) <= 0.05)) &&
            C &&
            C.maskedPost(b, body, reports)
          );
        })
        .map(function (o) {
          return o.soldierId;
        });
    }
    /* Firing-line continuity once the prepared line is in contact. Engagement
       owns each man's stance, aim, shots and short survival shuffles at his
       post, so its movement labels and a one-tick `moving` flag are not
       evidence that he left. The SAME verified identity must still be alive,
       commanded, under his own posture order, within the settled tolerance of
       his verified post and free of any committed displacement or retreat.
       Concealment is not required here: the enemy who is shooting at a post
       can see it, and the posture only ever reads detached reported points. */
    function lineHolds(b, st, a, quiet) {
      if (!st || st.readyAt == null || !st.heldActorIds || st.heldActorIds.length < 3) return false;
      return st.heldActorIds.every(function (id) {
        var o = st.orders.find(function (order) {
            return order.soldierId === id;
          }),
          s = a.find(function (man) {
            return String(man.id) === id;
          }),
          anchor = st.heldPositions && st.heldPositions[id],
          body = s && point(s.root && s.root.position),
          engagement = s && root.BattleEngagement && root.BattleEngagement.stateOf(s);
        return !!(
          o &&
          s &&
          anchor &&
          body &&
          !s.dead &&
          s.hp > 0 &&
          !s.isPlayer &&
          s._fireteamPublishKey === o.key &&
          /* A quiet ready line is silent and still: a man who starts moving
             before contact is leaving it. In contact Engagement owns his
             shuffles at the post, so only his position counts. */
          !(quiet && s.moving) &&
          Math.hypot(body.x - anchor.x, body.z - anchor.z) <= 0.5 &&
          !(engagement && ['bound', 'assault', 'withdraw'].indexOf(engagement.state) >= 0) &&
          !(root.BattleEngagement && root.BattleEngagement.fledPhase && root.BattleEngagement.fledPhase(s))
        );
      });
    }
    /* A man already selected into the held core stays held while he CLOSES
       on his ordered post: Movement reports completion inside its own
       arrival tolerance and then keeps closing the last metre, so his
       `moving` flag flickers for ticks at a time. That is not leaving the
       line and must not restart the dwell or rotate the core. He still needs
       his own publish key, canonical completion, concealment at his real
       body and may never be farther from the post than when he was chosen. */
    function closingOnPost(b, st, a, id, reports) {
      var C = root.BattleCoverPositions,
        O = root.BattleExecutionOutcome,
        CR = root.BattleCommandReception,
        o = st.orders.find(function (order) {
          return order.soldierId === id;
        }),
        s = a.find(function (man) {
          return String(man.id) === id;
        }),
        anchor = st.heldPositions && st.heldPositions[id],
        body = s && point(s.root && s.root.position);
      if (!o || !s || !anchor || !body || !C || s._fireteamPublishKey !== o.key) return false;
      var receivedMovement = CR && CR.movementEnabled && CR.movementEnabled(),
        outcome = receivedMovement && O && O.man ? O.man(s, b) : null,
        completed = receivedMovement
          ? !!(outcome && outcome.current && outcome.state === 'completed' && outcome.publishKey === o.key)
          : Math.hypot(body.x - o.point.x, body.z - o.point.z) <= 0.5,
        allowed = Math.max(0.5, Math.hypot(anchor.x - o.point.x, anchor.z - o.point.z) + 0.25);
      return !!(
        completed &&
        Math.hypot(body.x - o.point.x, body.z - o.point.z) <= allowed &&
        C.maskedPost(b, body, reports)
      );
    }
    function inContactLine(sq, st) {
      return !!(st && st.readyAt != null && (sq.inContact || st.stage === 'contact' || st.mode === 'hold'));
    }
    function heldCore(b, sq, st, a) {
      return lineHolds(b, st, a, !inContactLine(sq, st));
    }
    /* Squad Leader staging is PRE-contact planning, never a covered bound.
       A reserve position needs a crouch-masked real terrain ray against EACH
       own-squad reported threat. Standing firing visibility is deliberately
       not required for the MOVING team; the other fireteams provide the base
       of fire. Threats remain detached beliefs, never live enemy transforms. */
    function reserveMasked(b, p, reports) {
      return !!(
        p &&
        reports &&
        reports.length &&
        reports.length <= 3 &&
        root.SquadAI &&
        root.SquadAI.hasLineOfSight &&
        reports.every(function (r) {
          return !root.SquadAI.hasLineOfSight(
            { root: { position: p }, crouching: true },
            { root: { position: r } },
            b.heightAt,
            b.obstacles
          );
        })
      );
    }
    function reserveStage(b, sq, a, orders, reports, held, support) {
      var C = root.BattleCoverPositions,
        N = root.BattleNavigation;
      if (
        !maneuverOn ||
        !C ||
        !C.boundRoute ||
        !N ||
        !N.movementClear ||
        !reports ||
        !reports.length ||
        reports.length > 3
      )
        return 'no-reliable-route-or-threat-geometry';
      /* A real fireteam, not a hand-picked individual, owns a covered bound.
         Try alpha first, then intact follow-on teams if alpha is attrited or
         separately station-owned. No team may lose a soldier to this posture,
         and the non-moving element retains >=3 actual firing posts and >=2
         independently shootable riflemen from the ordered positions. */
      var teams = ['alpha', 'bravo', 'charlie'],
        available = ctx.commanded(sq),
        missingBase = null,
        missingStage = null;
      for (var teamIndex = 0; teamIndex < teams.length; teamIndex++) {
        var team = teams[teamIndex],
          roster = available.filter(function (s) {
            return s._fireteamKey === team;
          }),
          reserve = a.filter(function (s) {
            return s._fireteamKey === team && !(root.SquadAI.isMachineGun && root.SquadAI.isMachineGun(s));
          }),
          other = orders.filter(function (o) {
            return !reserve.some(function (s) {
              return String(s.id) === o.soldierId;
            });
          }),
          credibleRifles = other.filter(function (o) {
            var soldier = a.find(function (s) {
              return String(s.id) === o.soldierId;
            });
            /* The support gate counts actual independent shooters, not an infantry
               role label. A scout, gunner or engineer with a viable weapon and
               real fire evidence can hold the base while an intact team stages.
               Pre-contact geometry is only a potential: contact still requires
               native effective fire from two separate stationary actors. */
            if (
              !soldier ||
              soldier.dead ||
              !(soldier.hp > 0) ||
              soldier.isPlayer ||
              soldier.reloading ||
              soldier.outOfAmmo ||
              soldier.suppressedUntil > b.time
            )
              return false;
            if (held)
              return support.indexOf(soldier) >= 0 && supportingCount(a, null, [soldier], b.time, b) === 1;
            if (!root.SquadAI.canSuppressStanding) return false;
            var proxy = Object.assign({}, soldier, {
              root: Object.assign({}, soldier.root, { position: o.point })
            });
            return reports.some(function (r) {
              return root.SquadAI.canSuppressStanding(proxy, r, b);
            });
          });
        if (
          reserve.length < 2 ||
          reserve.length > 4 ||
          reserve.length !== roster.length ||
          other.length < 3 ||
          credibleRifles.length < 2
        ) {
          if (!missingBase)
            missingBase =
              'reserve-team-or-firing-base-unavailable:' +
              reserve.length +
              ':' +
              other.length +
              ':' +
              credibleRifles.length;
          continue;
        }
        /* A late base may wake planning, but cannot borrow the verified
           firing line's dwell or move either of its effective supporters. */
        if (
          held &&
          (reserve.some(function (s) {
            return held.indexOf(String(s.id)) >= 0;
          }) ||
            supportingCount(a, reserve, support, b.time, b) < tuning.minSupport)
        ) {
          if (!missingStage) missingStage = 'reserve-overlaps-held-line-or-support';
          continue;
        }
        /* Stage the selected team all-or-nothing. Every man must personally
           reach his own masked post with a real native covered next segment;
           considering bravo does not alter alpha's own standing orders. */
        var targets = [],
          failedMan = null;
        for (var i = 0; i < reserve.length; i++) {
          var man = reserve[i],
            here = point(man.root && man.root.position),
            match = null;
          if (!here) {
            failedMan = String(man.id);
            break;
          }
          for (var distanceIndex = 0; distanceIndex < 4 && !match; distanceIndex++) {
            var radius = [0, 3, 6, 9][distanceIndex];
            for (var k = 0; k < (radius ? 8 : 1); k++) {
              var theta = (Math.PI * 2 * k) / 8,
                origin = {
                  x: here.x + Math.sin(theta) * radius,
                  z: here.z + Math.cos(theta) * radius
                };
              if (
                !N.movementClear(here, origin) ||
                !reserveMasked(b, origin, reports) ||
                /* Once contact exists, even the staging approach must be
                   covered from the actual body, not just from its endpoint. */
                (held && radius > 0 && !C.boundRoute(man, b, origin, reports).eligible) ||
                orders.some(function (o) {
                  return (
                    !reserve.some(function (s) {
                      return String(s.id) === o.soldierId;
                    }) && Math.hypot(o.point.x - origin.x, o.point.z - origin.z) < 1.5
                  );
                }) ||
                targets.some(function (p) {
                  return Math.hypot(p.x - origin.x, p.z - origin.z) < 1.5;
                })
              )
                continue;
              var proxy = Object.assign({}, man, {
                root: Object.assign({}, man.root, { position: origin })
              });
              if (held) {
                /* Radial terrain exits do not imply an Engagement cover slot.
                   The native owner still rechecks from the live body at bound time. */
                var slots = C.candidates(
                  proxy,
                  b,
                  { root: { position: reports[0] } },
                  C.boundTuning().maxDistance
                );
                if (
                  Array.isArray(slots) &&
                  slots.length <= 256 &&
                  slots.slice(0, 48).some(function (p) {
                    return (
                      point(p) &&
                      Math.hypot(p.x - origin.x, p.z - origin.z) > 1 &&
                      C.boundRoute(proxy, b, p, reports).eligible
                    );
                  })
                )
                  match = origin;
                if (match) break;
                continue;
              }
              for (var step of [3, 6]) {
                for (var direction = 0; direction < 8; direction++) {
                  var angle = (Math.PI * 2 * direction) / 8,
                    exit = {
                      x: origin.x + Math.sin(angle) * step,
                      z: origin.z + Math.cos(angle) * step
                    };
                  if (!C.boundRoute(proxy, b, exit, reports).eligible) continue;
                  match = origin;
                  break;
                }
                if (match) break;
              }
              if (match) break;
            }
          }
          if (!match) {
            failedMan = String(man.id);
            break;
          }
          targets.push(match);
        }
        if (failedMan) {
          if (!missingStage) missingStage = 'no-safe-precontact-stage:' + failedMan;
          continue;
        }
        reserve.forEach(function (s, i) {
          var id = String(s.id),
            existing = orders.find(function (o) {
              return o.soldierId === id;
            });
          if (existing) {
            existing.point = targets[i];
            existing.reserve = true;
            existing.role = 'maneuver-reserve';
          } else
            orders.push({
              soldierId: id,
              point: targets[i],
              watchPoint: point(reports[0]),
              reserve: true,
              role: 'maneuver-reserve'
            });
        });
        return 'whole-team-staged:' + team;
      }
      return missingStage || missingBase || 'reserve-team-or-firing-base-unavailable:0:0:0';
    }
    function reviewReserve(b, sq, st, a, report) {
      if (
        !maneuverOn ||
        st.reserveTeam ||
        st.readyAt == null ||
        !report ||
        !Array.isArray(report.fireSupport) ||
        report.fireSupport.length > 32
      )
        return;
      var support = a.filter(function (s) {
          return report.fireSupport.indexOf(s) >= 0 && supportingCount(a, null, [s], b.time, b) === 1;
        }),
        ids = support
          .map(function (s) {
            return String(s.id);
          })
          .sort(),
        previous = st.reserveSupportIds || [];
      st.reserveSupportIds = ids;
      /* Edge-triggered by a newly effective identity, never polling geometry
         on every tick or treating a commander tick without a report as loss. */
      if (
        ids.length < tuning.minSupport ||
        !ids.some(function (id) {
          return previous.indexOf(id) < 0;
        })
      )
        return;
      var rs = threats(b, sq);
      if (
        !rs.length ||
        st.readyAt == null ||
        !heldCore(b, sq, st, a) ||
        b.time - st.readyAt > tuning.observationBudget ||
        (sq._localTask && sq._localTask.emergency)
      )
        return;
      var orders = st.orders.map(function (o) {
          return Object.assign({}, o);
        }),
        verdict = reserveStage(b, sq, a, orders, rs, st.heldActorIds, support);
      st.reserveReview = { at: b.time, supportIds: ids, reason: verdict };
      st.reservePlan = verdict;
      if (!/^whole-team-staged:(alpha|bravo|charlie)$/.test(verdict)) return;
      st.reserveTeam = verdict.split(':')[1];
      st.reserveActorIds = [];
      orders.forEach(function (o) {
        if (!o.reserve) return;
        st.reserveActorIds.push(o.soldierId);
        o.key = 'tactical-posture|' + st.serial + '|reserve|' + o.soldierId;
      });
      st.orders = orders;
    }
    function coveredTeam(b, sq, movers, report) {
      var C = root.BattleCoverPositions,
        a = men(sq),
        rs = threats(b, sq),
        support = report && report.fireSupport,
        N = root.BattleNavigation;
      if (
        !maneuverOn ||
        !a ||
        !movers ||
        !movers.length ||
        !C ||
        !C.coveredBoundsOn ||
        !C.coveredBoundsOn() ||
        !C.boundRoute ||
        !C.candidates ||
        !N ||
        N.scenario !==
          (b.scene && b.scene.metadata && (b.scene.metadata.battleScenario || b.scene.metadata.battleTown)) ||
        !rs.length ||
        supportingCount(a, movers, support, b.time, b) < tuning.minSupport
      )
        return false;
      for (var i = 0; i < movers.length; i++) {
        var s = movers[i];
        if (a.indexOf(s) < 0 || s.moving || s.reloading || s.suppressedUntil > b.time || s.dead) return false;
        var possible = C.candidates(s, b, { root: { position: rs[0] } }, C.boundTuning().maxDistance);
        if (!Array.isArray(possible) || possible.length > 256) return false;
        var eligible = possible.slice(0, 48).some(function (p) {
          var here = s.root.position,
            target = point(p);
          return !!(
            target &&
            Math.hypot(target.x - here.x, target.z - here.z) > 1 &&
            C.boundRoute(s, b, target, rs).eligible
          );
        });
        if (!eligible) return false;
      }
      return true;
    }
    function valid(b, sq, st) {
      var a = men(sq),
        fullRoster = ctx.commanded(sq),
        m = sq._macroMission,
        ex = sq._missionExecution,
        nav = root.BattleNavigation;
      return !!(
        st &&
        a &&
        Number.isFinite(b.time) &&
        b.time >= st.at &&
        b.time - st.at <= tuning.readAge &&
        m === st.mission &&
        m.version === st.version &&
        ex === st.execution &&
        ex.mission === m &&
        m.status === 'executing' &&
        +sq.routeIndex === st.leg &&
        point((sq.route || [])[st.leg]) &&
        sq.route[st.leg].x === st.target.x &&
        sq.route[st.leg].z === st.target.z &&
        sq.route === st.route &&
        b.scene === st.scene &&
        nav &&
        nav.scenario === st.scenario &&
        nav.version === st.navigationVersion &&
        A.leaderOf(sq) === st.leader &&
        st.leader &&
        !st.leader.dead &&
        !ctx.leaderlessActive(sq) &&
        sq.state !== 'retreat' &&
        !L.get(sq, 'regroup') &&
        !L.get(sq, 'recon') &&
        !(ctx.localPlan.structureOrdersOn && ctx.localPlan.currentStructureOrders(b, sq)) &&
        fullRoster.length === st.members.length &&
        fullRoster.every(function (s, i) {
          return s === st.members[i] && epoch(s) === st.epochs[i];
        })
      );
    }
    function current(b, sq) {
      if (!on) return null;
      var st = states.get(sq);
      return valid(b, sq, st) ? st : null;
    }
    function invalidReason(b, sq, st) {
      var a = men(sq),
        fullRoster = ctx.commanded(sq),
        m = sq._macroMission,
        ex = sq._missionExecution,
        nav = root.BattleNavigation,
        p = (sq.route || [])[+sq.routeIndex];
      if (!a) return 'too-few-uncommitted-riflemen';
      if (
        fullRoster.length !== st.members.length ||
        fullRoster.some(function (s, i) {
          return s !== st.members[i] || epoch(s) !== st.epochs[i];
        })
      )
        return 'squad-roster-or-possession';
      if (m !== st.mission || !m || m.version !== st.version || m.status !== 'executing')
        return 'mission-changed';
      if (ex !== st.execution || !ex || ex.mission !== m) return 'execution-changed';
      if (
        sq.route !== st.route ||
        +sq.routeIndex !== st.leg ||
        !p ||
        p.x !== st.target.x ||
        p.z !== st.target.z
      )
        return 'route-changed';
      if (
        b.scene !== st.scene ||
        !nav ||
        nav.scenario !== st.scenario ||
        nav.version !== st.navigationVersion
      )
        return 'navigation-changed';
      if (A.leaderOf(sq) !== st.leader || !st.leader || st.leader.dead || ctx.leaderlessActive(sq))
        return 'leader-changed';
      if (sq.state === 'retreat' || L.get(sq, 'regroup') || L.get(sq, 'recon')) return 'override-lease';
      if (ctx.localPlan.structureOrdersOn && ctx.localPlan.currentStructureOrders(b, sq))
        return 'structure-override';
      return 'stale-time-or-authority';
    }
    function end(b, sq, why) {
      var st = states.get(sq);
      if (st) {
        var counts = st.stats;
        if (!counts.releaseReasons) counts.releaseReasons = {};
        counts.releaseReasons[why] = (counts.releaseReasons[why] || 0) + 1;
        if (!counts.releases) counts.releases = [];
        operationTransition(b, sq, st, 'abort', why);
        counts.releases.push({
          serial: st.serial,
          reason: why,
          at: b.time,
          mode: st.mode,
          stage: st.stage,
          prepared: st.readyAt != null,
          compromisedAt: st.compromisedAt == null ? null : st.compromisedAt
        });
        if (counts.releases.length > 8) counts.releases.splice(0, counts.releases.length - 8);
        ctx.telemetry(b, 'decision-tactical-posture', {
          squad: sq.id,
          faction: sq.faction,
          mode: 'released',
          reason: why,
          serial: st.serial
        });
        cooldown.set(sq, { mission: st.mission, until: b.time + 8 });
      }
      states.delete(sq);
      return null;
    }
    function update(b, sq, report) {
      if (!on || !b || !sq) return null;
      var st = states.get(sq),
        a = men(sq),
        m = sq._macroMission,
        ex = sq._missionExecution,
        C = root.BattleCoverPositions,
        nav = root.BattleNavigation,
        task = sq._localTask,
        pressure = task && task.inputs ? task.inputs.pressure : 1,
        rs = threats(b, sq),
        now = b.time;
      if (st && (st.mode === 'ambush' || (st.mode === 'hold' && st.orders.length)))
        rs = continuingThreats(b, sq, st, rs);
      if (st && !valid(b, sq, st)) return end(b, sq, invalidReason(b, sq, st));
      if (st && st.orders.length && a) {
        var reassigned = st.orders.filter(function (o) {
          return !a.some(function (s) {
            return String(s.id) === o.soldierId;
          });
        });
        if (reassigned.length) {
          var held = st.heldActorIds || [];
          if (
            reassigned.some(function (o) {
              return held.indexOf(o.soldierId) >= 0;
            })
          )
            return end(b, sq, 'prepared fireteam actor reassigned');
          /* A separately owned tactical station wins for that individual.
             Before the stable three-man core exists, drop only that extra
             participant instead of destroying an otherwise valid preparation.
             The fireteam publisher reads this same orders array, so the
             posture immediately stops publishing movement to the reassigned
             man. A selected/held core actor is never silently substituted. */
          var removed = Object.create(null);
          reassigned.forEach(function (o) {
            removed[o.soldierId] = 1;
          });
          st.orders = st.orders.filter(function (o) {
            return !removed[o.soldierId];
          });
          if (st.orders.length < 3) return end(b, sq, 'ambush element lost eligibility');
        }
      }
      var blocker = !a
        ? 'too-few-uncommitted-riflemen'
        : !m || !ex || ex.mission !== m || m.status !== 'executing'
          ? 'mission-not-executing'
          : !A.leaderOf(sq) || A.leaderOf(sq).dead || ctx.leaderlessActive(sq)
            ? 'leader-unavailable'
            : sq.state === 'retreat' || L.get(sq, 'recon') || L.get(sq, 'regroup')
              ? 'override-lease'
              : !nav ||
                  !b.scene ||
                  !b.scene.metadata ||
                  nav.scenario !== (b.scene.metadata.battleScenario || b.scene.metadata.battleTown)
                ? 'navigation-unavailable'
                : !C
                  ? 'no-cover-owner'
                  : !point((sq.route || [])[+sq.routeIndex])
                    ? 'no-route-leg'
                    : (task && task.inputs.execution && task.inputs.execution.kind === 'structure-handoff') ||
                        (ctx.localPlan.structureOrdersOn && ctx.localPlan.currentStructureOrders(b, sq))
                      ? 'structure-override'
                      : !Number.isFinite(pressure)
                        ? 'unknown-pressure'
                        : null;
      if (blocker) return end(b, sq, blocker);
      if (!rs.length) {
        /* A line that is already fighting keeps its posts when the fresh
           picture is ambiguous (more than three confident sectors) or when
           the triggering report has aged out while Engagement still reports
           contact: the men are at verified posts under fire, and sending them
           back into formation is the exposed move. Without a fresh detached
           coordinate no route can be judged, so no maneuver follows from it.
           A line that is not in contact still fails closed on stale intel. */
        if (!(st && inContactLine(sq, st)) && !quietOperationSafe(b, sq, st, a))
          return end(
            b,
            sq,
            ambiguousPicture(b, sq) ? 'ambiguous-threat-picture' : 'no-fresh-reported-threat'
          );
        /* A mission-owned quiet observer can retain actual verified posts,
           but the report is STILL absent: downstream fire-control, support
           and bound decisions must see rs=[] and cannot act on anchors. */
        if (!rs.length && st && st.operation && quietOperationSafe(b, sq, st, a))
          operationTransition(b, sq, st, 'observe', 'report-expired-observation-only');
      }
      /* A prepared assault that has established its own REAL two-rifle base
         of fire need not wait to be hit before considering a covered bound.
         This is not permission to move: the existing General, COA, held-core,
         report, effective-support and physical route gates all recheck below.
         Neither relayed pressure nor nominal/supporter assignments qualify. */
      var liveAssaultSupport = !!(
        st &&
        st.readyAt != null &&
        sq.inContact &&
        rs.length &&
        ctx.ASSAULT_PHASES &&
        ctx.ASSAULT_PHASES[sq.commandPhase || ''] &&
        (!ctx.COA_ON || !sq.coa || !ctx.COAS || !ctx.COAS[sq.coa] || ctx.COAS[sq.coa].bounds) &&
        report &&
        Array.isArray(report.fireSupport) &&
        supportingCount(a, null, report.fireSupport, now, b) >= tuning.minSupport
      );
      if (st && (st.mode === 'ambush' || (st.mode === 'hold' && st.orders.length)))
        reviewReserve(b, sq, st, a, report);
      if (
        st &&
        (st.mode === 'ambush' || (st.mode === 'hold' && st.orders.length)) &&
        (pressure >= tuning.pressureEnter || (report && report.underFire > 0) || liveAssaultSupport)
      ) {
        /* An already-held masked line may transition to ONE covered-maneuver
           posture, never a second command stream. Without real support and a
           fully covered route, stay put and let Engagement fight defensively. */
        var coreReady = heldCore(b, sq, st, a),
          phaseAllowsBound = !!(ctx.ASSAULT_PHASES && ctx.ASSAULT_PHASES[sq.commandPhase || '']),
          coaAllowsBound = !(
            ctx.COA_ON &&
            sq.coa &&
            ctx.COAS &&
            ctx.COAS[sq.coa] &&
            !ctx.COAS[sq.coa].bounds
          ),
          supportCount =
            report && Array.isArray(report.fireSupport)
              ? supportingCount(a, null, report.fireSupport, now, b)
              : 0,
          safeMovers = [];
        if (
          maneuverOn &&
          phaseAllowsBound &&
          coaAllowsBound &&
          !(task && task.emergency) &&
          coreReady &&
          sq.inContact &&
          report &&
          Array.isArray(report.fireSupport) &&
          supportCount >= tuning.minSupport
        ) {
          if (st.reserveTeam) {
            /* The actual live covered-route gate must approve the entire
               staged team; a safe-looking singleton cannot silently redirect
               its base-of-fire partner into a different bounding rotation. */
            var staged = a.filter(function (s) {
              return st.reserveActorIds.indexOf(String(s.id)) >= 0 && s._fireteamKey === st.reserveTeam;
            });
            if (
              staged.length >= 2 &&
              staged.length === st.reserveActorIds.length &&
              staged.every(function (s) {
                return st.orders.some(function (o) {
                  if (!o.reserve || o.soldierId !== String(s.id)) return false;
                  /* Late revisions need their own receipt and arrival, not a
                     stationary body still obeying the previous firing post. */
                  if (!st.reserveReview) return true;
                  var CR = root.BattleCommandReception,
                    outcome = root.BattleExecutionOutcome && root.BattleExecutionOutcome.man(s, b),
                    atPost = Math.hypot(s.root.position.x - o.point.x, s.root.position.z - o.point.z) <= 0.5;
                  return (
                    s._fireteamPublishKey === o.key &&
                    (CR && CR.movementEnabled && CR.movementEnabled()
                      ? outcome &&
                        outcome.current &&
                        outcome.publishKey === o.key &&
                        (outcome.state === 'completed' ||
                          (atPost &&
                            outcome.state === 'held' &&
                            outcome.owner === 'engagement' &&
                            outcome.kind === 'hold' &&
                            CR.executionCurrent &&
                            CR.executionCurrent(
                              s,
                              b,
                              'movement',
                              'soldier:' + String(s.id),
                              s._fireteamAdoptedEnvelope
                            )))
                      : atPost)
                  );
                });
              }) &&
              coveredTeam(b, sq, staged, report)
            )
              safeMovers = staged.map(function (s) {
                return String(s.id);
              });
          } else
            a.forEach(function (s) {
              if (coveredTeam(b, sq, [s], report)) safeMovers.push(String(s.id));
            });
        }
        var possible = !!(
          maneuverOn &&
          phaseAllowsBound &&
          coaAllowsBound &&
          !(task && task.emergency) &&
          coreReady &&
          sq.inContact &&
          report &&
          Array.isArray(report.fireSupport) &&
          supportCount >= tuning.minSupport &&
          safeMovers.length
        );
        st.lastManeuverDecision = {
          at: now,
          possible: possible,
          phaseAllowsBound: phaseAllowsBound,
          coaAllowsBound: coaAllowsBound,
          emergency: !!(task && task.emergency),
          coreReady: coreReady,
          inContact: !!sq.inContact,
          reportPresent: !!report,
          supportArray: !!(report && Array.isArray(report.fireSupport)),
          supportCount: supportCount,
          stagedReserveTeam: st.reserveTeam || null,
          safeMoverIds: safeMovers,
          reason: !maneuverOn
            ? 'maneuver-disabled'
            : !phaseAllowsBound
              ? 'general-phase-holds'
              : !coaAllowsBound
                ? 'defensive-coa-holds'
                : task && task.emergency
                  ? 'emergency'
                  : !coreReady
                    ? 'held-core-invalid'
                    : !sq.inContact
                      ? 'no-current-contact'
                      : !(report && Array.isArray(report.fireSupport))
                        ? 'no-fire-support-report'
                        : supportCount < tuning.minSupport
                          ? 'insufficient-support'
                          : !safeMovers.length
                            ? 'no-safe-covered-mover'
                            : 'authorized'
        };
        /* Commander observation does not supply an Engagement report. Keep
           a genuinely ready line in place until the native fire-and-movement
           tick can evaluate its fresh base of fire. No report grants no move. */
        if (coreReady && !(task && task.emergency) && !(report && Array.isArray(report.fireSupport))) {
          st.at = now;
          st.threats = rs;
          return st;
        }
        st.threats = rs;
        var previousMode = st.mode;
        st.mode = possible ? 'maneuver' : 'hold';
        st.stage = possible ? 'supporting-fire' : 'pressure-hold';
        operationTransition(
          b, sq, st,
          possible ? 'bound' : supportCount >= tuning.minSupport ? 'support' : 'contact',
          possible ? 'native-covered-bound-authorized' : 'native-support-or-pressure-hold'
        );
        st.pressureAt = now;
        /* A prepared pressure hold keeps the same adopted posts while the
           existing policy rechecks support/route conditions. Do not destroy
           the firing line merely because rifles are still aiming/reloading,
           or because one held man's position reads unsettled for a tick:
           the posts are where Engagement fights from, and once the publisher
           stops reissuing them the formation order reclaims the men and the
           line can never recover. Emergency and unprepared holds relinquish
           preparation immediately; an authorized maneuver hands the posts to
           the native bound/support owners. */
        if (possible || st.readyAt == null || (task && task.emergency)) st.orders = [];
        if (possible) {
          st.maneuverUntil = now + tuning.maneuverWindow;
          st.lastSupportAt = now;
          st.stats.coveredManeuvers = (st.stats.coveredManeuvers || 0) + 1;
        } else if (previousMode !== 'hold') st.stats.pressureHolds++;
        if (previousMode !== st.mode)
          ctx.telemetry(b, 'decision-tactical-posture', {
            squad: sq.id,
            faction: sq.faction,
            mode: st.mode,
            reason: st.stage,
            serial: st.serial
          });
      }
      if (st && st.mode === 'maneuver') {
        st.at = now;
        /* The ordinary commander tick calls the posture before the next
           Engagement report. Do not throw away an active covered maneuver
           in that read-only gap; the subsequent fire-and-movement tick must
           refresh actual support within a bounded observation window. */
        if (report && Array.isArray(report.fireSupport))
          st.lastSupportAt =
            supportingCount(a, null, report.fireSupport, now, b) >= tuning.minSupport ? now : -Infinity;
        if (
          !sq.inContact ||
          (task && task.emergency) ||
          !maneuverOn ||
          now >= st.maneuverUntil ||
          !isFinite(st.lastSupportAt) ||
          now - st.lastSupportAt > 0.65
        ) {
          st.mode = 'hold';
          st.stage = task && task.emergency ? 'emergency-hold' : 'maneuver-closed';
          st.pressureAt = now;
        } else {
          st.stage = L.holds(sq, 'bound', now) ? 'covered-bound' : 'supporting-fire';
          return st;
        }
      }
      if (st && st.mode === 'hold') {
        st.at = now;
        if (pressure > tuning.pressureExit) st.pressureAt = now;
        return now - st.pressureAt >= tuning.pressureDwell ? end(b, sq, 'pressure subsided') : st;
      }
      if (!st) {
        var cd = cooldown.get(sq);
        if (
          sq.inContact ||
          (sq._engagementPlan && ['active', 'quiet'].indexOf(sq._engagementPlan.status) >= 0) ||
          a.some(function (s) {
            return !!s.target;
          }) ||
          pressure > tuning.pressureExit ||
          (cd && cd.mission === m && now < cd.until)
        )
          return null;
        var orders = [];
        for (var i = 0; i < a.length; i++) {
          var s = a[i],
            here = point(s.root.position),
            candidate = null,
            firingQualified = false,
            options = [here].concat(C.candidates(s, b, { root: { position: rs[0] } }, 6).slice(0, 16));
          for (var j = 0; j < options.length; j++) {
            var p = point(options[j]);
            if (
              !p ||
              orders.some(function (o) {
                return Math.hypot(o.point.x - p.x, o.point.z - p.z) < 1.5;
              })
            )
              continue;
            if (!C.maskedPost(b, p, rs) || !C.maskedApproach(s, b, p, rs)) continue;
            /* A masked post can still be entirely unable to fire over its
               crest. Prefer a second safe post with a physically viable
               standing ray toward a detached squad report, but never
               weaken masking, approach or fire-authorization gates. */
            if (!candidate) candidate = p;
            if (maneuverOn && A.canSuppressStanding) {
              var proxy = Object.assign({}, s, {
                root: Object.assign({}, s.root, { position: p })
              });
              if (
                rs.some(function (r) {
                  return A.canSuppressStanding(proxy, r, b);
                })
              ) {
                candidate = p;
                firingQualified = true;
                break;
              }
            } else break;
          }
          /* Cover-slot rings can all lie just behind a crest: a standing
             eye sees the reported sector but the lower ballistic aim ray
             cannot clear the same terrain. Before accepting observation
             only, inspect a bounded 0.75/1.5 m adjustment about the selected
             masked slot. Every alternative must independently pass the
             SAME masking, safe-approach and native standing-shot predicates.
             No terrain, target truth or movement ownership is bypassed. */
          if (candidate && !firingQualified && maneuverOn && A.canSuppressStanding) {
            var originalPost = candidate;
            for (var ring = 0; ring < 2 && !firingQualified; ring++) {
              var step = ring === 0 ? 0.75 : 1.5;
              for (var bearing = 0; bearing < 8; bearing++) {
                var angle = (Math.PI * 2 * bearing) / 8,
                  trial = {
                    x: originalPost.x + Math.sin(angle) * step,
                    z: originalPost.z + Math.cos(angle) * step
                  };
                if (
                  orders.some(function (o) {
                    return Math.hypot(o.point.x - trial.x, o.point.z - trial.z) < 1.5;
                  }) ||
                  !C.maskedPost(b, trial, rs) ||
                  !C.maskedApproach(s, b, trial, rs)
                )
                  continue;
                var trialShooter = Object.assign({}, s, {
                  root: Object.assign({}, s.root, { position: trial })
                });
                if (
                  rs.some(function (r) {
                    return A.canSuppressStanding(trialShooter, r, b);
                  })
                ) {
                  candidate = trial;
                  firingQualified = true;
                  break;
                }
              }
            }
          }
          /* Do not place this soldier at an exposed default slot. A masked
             fireteam is useful even when another eligible squad member has
             no concealed post; that man remains under his existing orders. */
          if (candidate)
            orders.push({
              soldierId: String(s.id),
              point: candidate,
              watchPoint: point(rs[0]),
              /* This is a pre-contact ballistic preflight, NOT fire permission.
                 Masked eye-line posts without a usable shot remain observers. */
              firingQualified: firingQualified
            });
        }
        if (orders.length < 3) return null; // Never publish an understrength ambush element.
        /* Two physically shootable posts are the minimum potential base for
           fire-and-maneuver. A concealed observation-only line must not be
           published as a three-man firing base that can never support a bound.
           The live support gate still needs two independently effective men. */
        var plannedFireBaseRifles = orders.filter(function (o) {
          return o.firingQualified;
        }).length;
        /* A masked observation line may legitimately become a firing base
           after acquiring better firsthand geometry. Keep the native hold,
           but NEVER stage a reserve based on two imaginary firing posts. */
        var reservePlan =
            maneuverOn && plannedFireBaseRifles < tuning.minSupport
              ? 'observation-only-no-two-ballistic-posts'
              : reserveStage(b, sq, a, orders, rs),
          reserveTeam = /^whole-team-staged:(alpha|bravo|charlie)$/.test(reservePlan)
            ? reservePlan.split(':')[1]
            : null;
        var counts = counters.get(sq) || {
          ambushes: 0,
          pressureHolds: 0,
          coordinatedContacts: 0,
          coveredManeuvers: 0,
          rejectedUnsafeBounds: 0,
          compromisedLines: 0,
          releaseReasons: {}
        };
        counters.set(sq, counts);
        counts.ambushes++;
        st = {
          mode: 'ambush',
          stage: 'assemble',
          serial: counts.ambushes,
          at: now,
          since: now,
          mission: m,
          version: m.version,
          execution: ex,
          leg: +sq.routeIndex,
          route: sq.route,
          target: point(sq.route[+sq.routeIndex]),
          scene: b.scene,
          scenario: nav.scenario,
          navigationVersion: nav.version,
          leader: A.leaderOf(sq),
          /* Preserve the complete commanded roster to detect casualties
             and possession, not temporary station claims by bystanders. */
          members: ctx.commanded(sq).slice(),
          epochs: ctx.commanded(sq).map(epoch),
          orders: orders,
          threats: rs,
          reservePlan: reservePlan,
          plannedFireBaseRifles: plannedFireBaseRifles,
          observationGeometry: rs.map(function (r) {
            return { x: r.x, z: r.z };
          }),
          operation: operationOn
            ? {
                serial: counts.ambushes,
                phase: 'stage',
                at: now,
                missionVersion: m.version,
                transitions: [{ from: 'plan', to: 'stage', at: now, reason: 'native-ambush-selected' }]
              }
            : null,
          /* Keep only Squad Leader intent through the posture-to-bound handoff.
             Physical endpoints and bound commands remain Engagement/Resolver owned. */
          reserveTeam: reserveTeam,
          reserveActorIds: orders
            .filter(function (o) {
              return !!o.reserve;
            })
            .map(function (o) {
              return o.soldierId;
            }),
          heldSince: null,
          heldActorIds: [],
          heldPositions: {},
          readyAt: null,
          compromisedAt: null,
          stats: counts
        };
        st.orders.forEach(function (o) {
          o.key = 'tactical-posture|' + st.serial + '|' + o.soldierId;
        });
        states.set(sq, st);
        ctx.telemetry(b, 'decision-tactical-posture', {
          squad: sq.id,
          faction: sq.faction,
          mode: st.mode,
          reason: st.stage,
          serial: st.serial
        });
      }
      st.at = now;
      st.threats = rs;
      var observationSafe = !rs.length && quietOperationSafe(b, sq, st, a),
        geometryReports = rs.length ? rs : observationSafe ? st.observationGeometry : [],
        exposedOrders =
          geometryReports.length > 0
            ? st.orders.filter(function (o) {
                return o.reserve
                  ? !reserveMasked(b, o.point, geometryReports)
                  : !C.maskedPost(b, o.point, geometryReports);
              })
            : st.orders.slice();
      if (exposedOrders.length) {
        /* Before readiness the selected three-man core must remain truly
           concealed. But a fifth participant's exposed post is not a reason
           to dissolve three other, independently concealed stations. Remove
           only the extra orders; the existing publisher then stops issuing
           them. Never substitute a held man or inherit his dwell time. */
        if (st.readyAt == null) {
          var coreCompromised = exposedOrders.some(function (o) {
            return st.heldActorIds.indexOf(o.soldierId) >= 0;
          });
          var realFiringPosts = st.orders.filter(function (o) {
            return !o.reserve && exposedOrders.indexOf(o) < 0;
          });
          if (coreCompromised || realFiringPosts.length < 3)
            return end(b, sq, 'firing station lost masking/ray');
          st.orders = st.orders.filter(function (o) {
            return exposedOrders.indexOf(o) < 0;
          });
        } else if (st.compromisedAt == null) {
          /* After readiness concealment can be lost to enemy contact, but
             the same verified men hold their posts until combat resolves. */
          st.compromisedAt = now;
          st.stats.compromisedLines = (st.stats.compromisedLines || 0) + 1;
        }
      }
      /* Masked canonical completion establishes the hold; once the line is
         ready, the same identities at their verified posts keep it. */
      var settled = settledActors(b, st, a, rs),
        coreHeld =
          st.readyAt != null
            ? heldCore(b, sq, st, a)
            : st.heldActorIds.length >= 3 &&
              st.heldActorIds.every(function (id) {
                return settled.indexOf(id) >= 0 || closingOnPost(b, st, a, id, rs);
              });
      if (!coreHeld && st.readyAt != null) return end(b, sq, 'prepared fireteam left firing line');
      if (!coreHeld) {
        /* Select three genuinely adopted masked posts ONCE, then measure the
           continuous hold by their stable IDs; newcomers cannot borrow dwell
           from one another. Other men keep trying their ordinary commands. */
        st.heldActorIds = settled.slice(0, 3);
        st.heldPositions = {};
        st.heldActorIds.forEach(function (id) {
          var soldier = a.find(function (s) {
            return String(s.id) === id;
          });
          st.heldPositions[id] = point(soldier.root.position);
        });
        st.heldSince = st.heldActorIds.length >= 3 ? now : null;
        st.stage = st.heldSince == null ? 'assemble' : 'hold';
        operationTransition(b, sq, st, st.heldSince == null ? 'stage' : 'prepare', 'real-core-held');
        if (st.heldSince == null && now - st.since > tuning.preparationBudget)
          return end(b, sq, 'preparation timed out');
      } else if (st.readyAt == null && now - st.heldSince >= tuning.minimumHold) {
        st.stage = 'ready';
        st.readyAt = now;
        operationTransition(b, sq, st, 'observe', 'four-second-verified-core');
        /* The verified posts the line is held to from now on are where the
           men actually stand at readiness, after any closing on the order. */
        st.heldActorIds.forEach(function (id) {
          var soldier = a.find(function (man) {
            return String(man.id) === id;
          });
          if (soldier) st.heldPositions[id] = point(soldier.root.position);
        });
      }
      if (
        st.readyAt != null &&
        (sq.inContact ||
          a.some(function (s) {
            return !!s.target;
          }))
      ) {
        if (st.stage !== 'contact') {
          st.stats.coordinatedContacts++;
          st.stage = 'contact';
          operationTransition(b, sq, st, 'contact', 'independent-contact');
        }
      } else if (st.stage === 'contact') return end(b, sq, 'contact ended');
      if (st.stage === 'ready' && now - st.readyAt > tuning.observationBudget) {
        if (!quietOperationSafe(b, sq, st, a)) return end(b, sq, 'no firsthand contact');
        operationTransition(b, sq, st, 'observe', 'quiet-mission-continues-no-authorization');
      }
      return st;
    }
    function soldierOrder(s, b) {
      var st = s && s.squad && current(b, s.squad);
      if (!st || (st.mode !== 'ambush' && !(st.mode === 'hold' && st.orders.length))) return null;
      if (!men(s.squad) || men(s.squad).indexOf(s) < 0) return null;
      var o = st.orders.find(function (o) {
        return o.soldierId === String(s.id);
      });
      return o && s._fireteamPublishKey === o.key
        ? Object.assign(
            { stage: st.stage, readyAt: st.readyAt, arrivalPoint: st.heldPositions[o.soldierId] || null },
            o
          )
        : null;
    }
    return {
      on: on,
      maneuverOn: maneuverOn,
      operationOn: operationOn,
      tuning: tuning,
      coveredTeam: coveredTeam,
      update: update,
      current: current,
      soldierOrder: soldierOrder,
      summary: function (sim) {
        if (!on) return null;
        var total = {
          ambushes: 0,
          pressureHolds: 0,
          coordinatedContacts: 0,
          coveredManeuvers: 0,
          rejectedUnsafeBounds: 0,
          compromisedLines: 0,
          active: 0,
          releaseReasons: {}
        };
        ['us', 'ge'].forEach(function (f) {
          ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
            var c = counters.get(sq);
            if (c)
              Object.keys(c).forEach(function (k) {
                if (k === 'releaseReasons') {
                  Object.keys(c[k]).forEach(function (why) {
                    total.releaseReasons[why] = (total.releaseReasons[why] || 0) + c[k][why];
                  });
                } else if (k === 'releases') return;
                else total[k] = (total[k] || 0) + c[k];
              });
            if (current(sim, sq)) total.active++;
          });
        });
        return total;
      },
      releases: function (sq) {
        var c = counters.get(sq);
        return c && c.releases ? c.releases.slice() : [];
      },
      reset: function (sq) {
        states.delete(sq);
        cooldown.delete(sq);
        counters.delete(sq);
      }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
