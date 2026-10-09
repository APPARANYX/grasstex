/* Squad Leader fireteam publishing sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   The per-fireteam order lifecycle (updateFireteams), the committed command signature
   (fireteamSignature) and the defensive post latch (holdPost) are here. The parent file
   calls the factory with its closure utilities and re-attaches the returned functions as
   closure variables, so the squadCommand slot and the public API export see the same
   functions as before. 16 remains the only writer of _fireteamDestination; Movement
   Resolver remains the only physical endpoint arbiter. The flags and tuning
   (BUDDY_PAIRS_ON, DEFENSIVE, REGROUP_RELEASE, TEAM_LEASE, ORDER_PUBLISH_EPS) stay in 16
   and are passed into the factory via ctx. */
(function (root) {
  'use strict';
  if (root._squadLeaderFireteams) return;

  /* Factory: called by 16-squad-plan-stability.js after the buddy-pairs, scouts-forward
     and formation re-attaches are in scope. */
  root._squadLeaderFireteams = function (ctx) {
    var root = ctx.root,
      L = ctx.root.BattleLeases,
      point = ctx.point,
      dist = ctx.dist,
      copy = ctx.copy,
      aliveTeam = ctx.aliveTeam,
      averageMembers = ctx.averageMembers,
      signature = ctx.signature,
      cfg = ctx.cfg,
      publishStats = ctx.publishStats,
      publishPersonalMovement = ctx.publishPersonalMovement,
      movementExecutionCurrent = ctx.movementExecutionCurrent,
      executionBlocked =
        ctx.executionBlocked ||
        function () {
          return false;
        },
      DEFENSIVE = ctx.DEFENSIVE,
      REGROUP_RELEASE = ctx.REGROUP_RELEASE,
      TEAM_LEASE = ctx.TEAM_LEASE,
      ORDER_PUBLISH_EPS = ctx.ORDER_PUBLISH_EPS,
      BUDDY_PAIRS_ON = ctx.BUDDY_PAIRS_ON,
      updateBuddyPairs = ctx.updateBuddyPairs,
      publishReconOrders = ctx.publishReconOrders,
      leaderlessActive = ctx.leaderlessActive,
      desiredAnchor = ctx.desiredAnchor,
      teamSlot = ctx.teamSlot,
      forward = ctx.forward,
      followTeamForward = ctx.followTeamForward,
      /* Promoted after exact-seed recovery, red/green fixture and 36 paired
         default-inert regression controls; ?retreatLostContact=0 restores legacy. */
      LOST_CONTACT_RETREAT_ON = !/[?&]retreatLostContact=(?:0|off|false)(?:&|#|$)/i.test(
        (root.location && root.location.search) || ''
      );
    /* A defensive post belongs to the Squad Leader's command intent, not to a contact serial. Once a man has
   settled into his post, target acquisition/loss must not throw him back into formation and then
   recreate the same post a second later. It is released only when the defensive command signature
   materially changes. */
    function holdPost(s, key) {
      var p = s._defensePost;
      if (p && p.commandKey === key) return p;
      if (!s.orderDestination || dist(s.root.position, s.orderDestination) > 2.6) return null;
      s._defensePost = { x: s.root.position.x, z: s.root.position.z, commandKey: key };
      return s._defensePost;
    }
    /* Fireteam commitment is a meso command signature. Its anchor AND formation frame are committed:
   live command-ray jitter must not rotate individual slots underneath a still-valid Squad Leader order.
   Engagement-plan serials are micro/contact state and deliberately do not belong here. */
    function fireteamSignature(sq) {
      var p = sq.objective || {};
      return [
        sq.commandPhase || '',
        sq.targetObjective || '',
        Math.round((+p.x || 0) / 4),
        Math.round((+p.z || 0) / 4),
        (sq._regroupRecovery && sq._regroupRecovery.serial) || 0
      ].join('|');
    }

    function updateFireteams(sq, battle) {
      sq._fireteamOrders = sq._fireteamOrders || {};
      if (leaderlessActive(sq) && sq.state !== 'retreat') {
        if (BUDDY_PAIRS_ON) updateBuddyPairs(sq, battle);
        return;
      }
      if (sq._reconTask && L.get(sq, 'recon')) {
        publishReconOrders(sq, battle);
        return;
      }
      /* A 1-4 man retreating remnant is extracting, not maneuvering as fireteams. Do not manufacture
       formation slots or a local regroup geometry around the slowest survivor: every living man gets
       the same homeward retreat intent and Navigation/Movement Resolver may route him there independently.
       Once Macro changes the assembly phase to a legitimate reconstitution rally this branch turns off
       and ordinary grouped movement resumes toward that rally. */
      if (root.SquadAI.isExtractionToHome(sq)) {
        var home = copy(root.SquadAI.extractionHome ? root.SquadAI.extractionHome(sq) : sq.home),
          extractKey =
            'remnant-extract|' + Math.round((+home.x || 0) * 2) + '|' + Math.round((+home.z || 0) * 2),
          extractStats = publishStats(battle);
        sq._fireteamOrders = {};
        (sq.members || []).forEach(function (s) {
          if (!s || s.dead) return;
          s._fireteamKey = null;
          s._defensePost = null;
          extractStats.intentChecks++;
          var previous = point(s._fireteamDestination);
          if (
            previous &&
            dist(previous, home) <= ORDER_PUBLISH_EPS &&
            s._fireteamPublishKey === extractKey &&
            movementExecutionCurrent(s, battle)
          ) {
            extractStats.intentCoalesced++;
            return;
          }
          publishPersonalMovement(
            sq,
            battle,
            s,
            home,
            extractKey,
            true,
            'retreat',
            'remnant extraction home',
            extractStats,
            { survivalFallback: true }
          );
        });
        if (BUDDY_PAIRS_ON) updateBuddyPairs(sq, battle);
        return;
      }
      /* A squad in retreat is not defending, whatever its commandPhase still says: a prepared defender falling back (or
         marching to a reconstitution rally) would otherwise be ordered back to the post he just left. */
      var defensive = !!DEFENSIVE[sq.commandPhase] && sq.state !== 'retreat',
        defenseKey = signature(sq),
        regroup = sq.commandPhase === 'regroup' && sq.state !== 'retreat',
        stats = publishStats(battle);
      ['command', 'alpha', 'bravo', 'charlie'].forEach(function (key) {
        var m = aliveTeam(sq, key);
        if (!m.length) return;
        var desired = desiredAnchor(sq, key);
        if (!desired) return;
        /* The team's renewal waits for its men to close on the anchor. A man the Squad Leader's reading of
         Movement Execution (executionBlocked) has found physically unable to arrive is not waited for:
         counting him would hold his whole fireteam on its old anchor for as long as he stays stuck. */
        var able = m.filter(function (s) {
            return !executionBlocked(s, battle);
          }),
          live = averageMembers(able.length ? able : m),
          sig = fireteamSignature(sq),
          cur = sq._fireteamOrders[key],
          urgent = sq.state === 'retreat',
          issued = false;
        if (!cur || cur.signature !== sig || (urgent && dist(cur.anchor, desired) > ORDER_PUBLISH_EPS)) {
          cur = sq._fireteamOrders[key] = {
            anchor: copy(desired),
            origin: copy(live),
            forward: forward(sq),
            signature: sig,
            until: battle.time + (urgent ? 0 : TEAM_LEASE),
            blocked: false
          };
          issued = true;
        } else if (regroup) cur.until = battle.time + TEAM_LEASE;
        else if (battle.time >= cur.until || dist(cur.anchor, desired) > 20) {
          var arrived = live && dist(live, cur.anchor) <= 4.5;
          if (arrived) {
            cur = sq._fireteamOrders[key] = {
              anchor: copy(desired),
              origin: copy(live),
              forward: forward(sq),
              signature: sig,
              until: battle.time + (urgent ? 0 : TEAM_LEASE),
              blocked: false
            };
            issued = true;
          } else cur.until = battle.time + TEAM_LEASE;
        }
        if (!defensive && !regroup && !urgent) followTeamForward(sq, key, m, cur);
        var CR = root.BattleCommandReception;
        if (issued && CR && CR.publish)
          CR.publish(sq, battle, 'movement', m, {
            scope: 'fireteam:' + key,
            action: urgent ? 'retreat' : regroup ? 'regroup' : defensive ? 'hold-position' : 'formation',
            signature:
              sig + '|' + key + '|' + Math.round(cur.anchor.x * 2) + '|' + Math.round(cur.anchor.z * 2),
            reason: urgent ? 'squad retreat' : regroup ? 'squad regroup' : 'fireteam order',
            spatial: true,
            reference: 'point',
            point: cur.anchor
          });
        for (var i = 0; i < m.length; i++) {
          var s = m[i],
            d = teamSlot(sq, key, s, i, m.length, cur.anchor, cur.forward),
            rallyAnchor = regroup && L.get(sq, 'regroup'),
            rallyPoint = rallyAnchor && rallyAnchor.data && rallyAnchor.data.anchor,
            rallyRadius = rallyPoint
              ? Math.max(4, (+cfg(battle, sq).cohesionRadius || 34) * REGROUP_RELEASE)
              : 0;
          /* Each man can satisfy a regroup anywhere inside the rally area. Choose his
           personal point once per regroup lease and keep it stable while he approaches.
           Recomputing the near-edge point from his current position every Squad Leader
           tick made delayed command adoption chase a moving sequence of equally-valid
           regroup points (A -> B -> A position seeking) even though the rally area itself
           never moved. The lease is the Squad Leader's regroup authority, so its data owns
           these transient targets and they disappear automatically when the regroup ends. */
          if (rallyPoint) {
            var rallyData = rallyAnchor.data || (rallyAnchor.data = {}),
              rallyTargets = rallyData.targets || (rallyData.targets = {}),
              rallyId = String(s.id),
              stableRally = point(rallyTargets[rallyId]);
            if (!stableRally) {
              var here = point(s.root.position),
                away = here ? dist(here, rallyPoint) : 0,
                existing = point(s._fireteamDestination);
              stableRally =
                away <= rallyRadius
                  ? existing && dist(existing, rallyPoint) <= rallyRadius
                    ? existing
                    : here
                  : away > 0
                    ? {
                        x: rallyPoint.x + (here.x - rallyPoint.x) * ((rallyRadius * 0.65) / away),
                        z: rallyPoint.z + (here.z - rallyPoint.z) * ((rallyRadius * 0.65) / away)
                      }
                    : copy(rallyPoint);
              rallyTargets[rallyId] = copy(stableRally);
            }
            d = stableRally;
          }
          var prepared = defensive && s._preparedDefensePost,
            post = prepared ? null : defensive ? holdPost(s, defenseKey) : null,
            next = prepared ? copy(prepared) : post ? { x: post.x, z: post.z } : d,
            kind = prepared ? 'prepared' : post ? 'defense-post' : 'formation',
            publishKey = sig + '|' + key + '|' + kind,
            previous = point(s._fireteamDestination);
          s._fireteamKey = key;
          if (!defensive) s._defensePost = null;
          stats.intentChecks++;
          /* With reception enabled the publisher must also supersede a pending
           command, even when a restored mission reuses the executed destination. */
          if (
            previous &&
            dist(previous, next) <= ORDER_PUBLISH_EPS &&
            s._fireteamPublishKey === publishKey &&
            movementExecutionCurrent(s, battle)
          ) {
            stats.intentCoalesced++;
            continue;
          }
          var applied = publishPersonalMovement(
            sq,
            battle,
            s,
            next,
            publishKey,
            urgent,
            urgent ? 'retreat' : regroup ? 'regroup' : defensive ? 'hold-position' : 'formation',
            urgent ? 'squad retreat' : regroup ? 'squad regroup' : 'fireteam order',
            stats
          );
          if (LOST_CONTACT_RETREAT_ON) {
            /* The Squad Leader cannot speak through walls or over unlimited distance.
               Only a man who personally adopted RETREAT, physically finished that
               earlier instruction, and now has an UNREACHABLE replacement may rely
               on his *pre-known* base after six seconds waiting for orders. Never
               assign the current moving formation/rally via this autonomy path. */
            var C = root.BattleCommandReception,
              here = point(s.root && s.root.position),
              base = point(sq.baseHome),
              previousRetreat = C && C.adopted && C.adopted(s, battle, 'movement', 'soldier:' + s.id),
              pendingRetreat = C && C.peek && C.peek(s, battle, 'movement', 'soldier:' + s.id),
              stranded =
                urgent &&
                !applied &&
                !s.isPlayer &&
                !s._survivalMovementKey &&
                s._movementStopReason === 'arrived' &&
                here &&
                base &&
                previousRetreat &&
                previousRetreat.action === 'retreat' &&
                previousRetreat.envelopeId === s._fireteamAdoptedEnvelope &&
                pendingRetreat &&
                pendingRetreat.unreachable &&
                previous &&
                dist(here, previous) <= 0.5 &&
                dist(here, base) > 20;
            if (!stranded) {
              s._lostContactRetreatSince = null;
            } else {
              if (s._lostContactRetreatSince == null) s._lostContactRetreatSince = battle.time;
              if (battle.time - s._lostContactRetreatSince >= 6) {
                publishPersonalMovement(
                  sq,
                  battle,
                  s,
                  base,
                  'lost-contact-retreat-base',
                  true,
                  'retreat',
                  'soldier initiative: return to known base after lost contact',
                  stats,
                  { survivalFallback: true, lostContactRetreat: true }
                );
                s._lostContactRetreatSince = null;
              }
            }
          }
        }
      });
      if (BUDDY_PAIRS_ON) updateBuddyPairs(sq, battle);
    }

    return {
      holdPost: holdPost,
      fireteamSignature: fireteamSignature,
      updateFireteams: updateFireteams
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
