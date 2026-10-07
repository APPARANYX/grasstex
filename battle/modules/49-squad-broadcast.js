/* Phase 0F — Inter-squad tactical broadcast.

   Nearby squads share tactical contact beyond the General's stale intel rollup. Today a squad
   creeping up a hill, a squad watching from a distance, and a squad fighting for its life from
   sniper fire each act on their own picture. 0F adds a Meso-layer broadcast channel: when a
   squad's contact picture changes meaningfully (new contact, contact upgraded from heard to
   seen, sniper/MG identified, taking fire from a new sector) it publishes a tactical broadcast
   to nearby squads within BROADCAST_RANGE.

   Slices:
   - 0F1 (shipped, legacy ?squadBroadcast=0 control): behavior-neutral telemetry. Broadcasts
     are computed and logged but NOT consumed; squad.contact on receiving squads is unchanged.
   - 0F2 (shipped default): a receiving squad merges the broadcast into its squad.contact
     picture if it has no fresher first-hand contact for the same enemy.
   - 0F3 (shipped default): when a broadcast is applied to a
     receiving squad, the module emits a 'squad-broadcast-reaction' telemetry event and stamps
     sq._broadcastReactAt so the Squad Leader and diagnostics can see that the squad reacted
     to a broadcast. With personal beliefs enabled, reception enters through Perception's
     reported-contact API; squad.contact remains the upward aggregate picture.

   Ownership: squad-to-squad, not Macro (General) and not Micro (individual soldier). Does not
   bypass Movement Resolver or Engagement ownership. When 0F2 is on, this module writes
   squad.contact on receiving squads as a documented sibling layer (the same role as
   squadSenses in squad-ai.js); it never writes soldier.destination, soldier.target, or any
   engagement state. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleSquadBroadcast) return;

  /* Broadcast reception is default-on after the current-main 100-seed #342 gate. Keep
     ?squadBroadcast=0/off/false as the telemetry-only legacy control for paired A/B work. */
  var BROADCAST_ON = !(
    typeof location !== 'undefined' && /[?&]squadBroadcast=(?:0|off|false)\b/i.test(location.search || '')
  );

  /* Range at which a squad's broadcast reaches another squad. Longer than SquadAI.RELAY_RANGE
     (50, within-squad relay) because squads operate spread out; shorter than vision range so a
     broadcast is tactical (nearby squads) not strategic (the whole side). */
  var BROADCAST_RANGE = 120;
  /* A broadcast is stale after this many seconds. Shorter than CONTACT_STALE_SECS (30, the
     General's rollup filter) because tactical info decays fast: "sniper at X 20s ago" is less
     actionable than "sniper at X right now." */
  var BROADCAST_TTL = 20;
  /* Min interval between broadcasts from the same squad for the same contact key. Prevents a
     squad under continuous fire from spamming the channel every tick. */
  var BROADCAST_COOLDOWN = 3.0;

  function dist2(ax, az, bx, bz) {
    var dx = ax - bx,
      dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function squadCentre(sq) {
    if (!sq || !sq.members) return null;
    var x = 0,
      z = 0,
      n = 0;
    for (var i = 0; i < sq.members.length; i++) {
      var s = sq.members[i];
      if (!s || s.dead || !s.root) continue;
      x += +s.root.position.x || 0;
      z += +s.root.position.z || 0;
      n++;
    }
    return n ? { x: x / n, z: z / n } : null;
  }

  /* Look up a unit by id in the enemy faction's roster. Returns null if not found
     (the unit may have died or the id may be a sector key rather than a unit id). */
  function lookupUnit(sim, unitId, faction) {
    if (!unitId || !sim || !sim.factions) return null;
    var enemy = faction === 'us' ? 'ge' : 'us',
      roster = sim.factions[enemy],
      units = (roster && (roster.units || roster.members)) || [];
    /* Check both _roster (battle-sim) and faction.squads (module-registry). */
    if (sim._roster && sim._roster[enemy]) {
      var r = sim._roster[enemy];
      for (var i = 0; i < r.length; i++) if (r[i].id === unitId) return r[i];
    }
    for (var j = 0; j < units.length; j++) if (units[j].id === unitId) return units[j];
    /* Fall back to scanning squads. */
    var squads = (roster && roster.squads) || [];
    for (var k = 0; k < squads.length; k++) {
      var members = squads[k].members || [];
      for (var m = 0; m < members.length; m++) if (members[m].id === unitId) return members[m];
    }
    return null;
  }

  function snapshotContact(sq) {
    var c = sq && sq.contact;
    if (!c || !isFinite(+c.x) || !isFinite(+c.z) || !isFinite(+c.at)) return null;
    return {
      x: +c.x,
      z: +c.z,
      at: +c.at,
      unitId: c.unit && c.unit.id != null ? c.unit.id : null,
      firstHandAt: c.firstHandAt == null ? null : +c.firstHandAt,
      broadcast: !!c.broadcast,
      precision: c.precision || null
    };
  }

  function contactChange(c, prev) {
    if (!c) return null;
    if (!prev)
      return {
        kind: 'new-contact',
        x: c.x,
        z: c.z,
        at: c.at,
        unitId: c.unitId,
        firstHand: c.firstHandAt != null,
        precision: c.precision
      };
    if (prev.firstHandAt == null && c.firstHandAt != null)
      return {
        kind: 'upgraded-to-firsthand',
        x: c.x,
        z: c.z,
        at: c.at,
        unitId: c.unitId,
        firstHand: true,
        precision: c.precision
      };
    var prevSec = Math.round(prev.x / 20) + ':' + Math.round(prev.z / 20),
      curSec = Math.round(c.x / 20) + ':' + Math.round(c.z / 20);
    if (prevSec !== curSec)
      return {
        kind: 'sector-change',
        x: c.x,
        z: c.z,
        at: c.at,
        unitId: c.unitId,
        firstHand: c.firstHandAt != null,
        precision: c.precision
      };
    if (c.at > prev.at + BROADCAST_TTL)
      return {
        kind: 're-acquired',
        x: c.x,
        z: c.z,
        at: c.at,
        unitId: c.unitId,
        firstHand: c.firstHandAt != null,
        precision: c.precision
      };
    return null;
  }

  function nearbySquads(sim, sq, range) {
    var side = sim && sim.factions && sim.factions[sq.faction],
      squads = (side && side.squads) || [],
      here = squadCentre(sq),
      out = [];
    if (!here) return out;
    for (var i = 0; i < squads.length; i++) {
      var o = squads[i];
      if (o === sq || o.disbanded) continue;
      var there = squadCentre(o);
      if (!there) continue;
      var d = dist2(here.x, here.z, there.x, there.z);
      if (d <= range) out.push({ squad: o, distance: d });
    }
    return out;
  }

  function stateFor(sim) {
    if (!sim._squadBroadcast) {
      sim._squadBroadcast = {
        sent: 0,
        received: 0,
        suppressed: 0,
        bySquad: {} /* squadId -> { sent, received, suppressed, lastBroadcastAt, lastContactSig } */,
        broadcasts: [] /* rolling log of recent broadcasts, capped at 100 */
      };
    }
    return sim._squadBroadcast;
  }

  function squadState(st, sq) {
    var key = String(sq.id);
    if (!st.bySquad[key]) {
      st.bySquad[key] = { sent: 0, received: 0, suppressed: 0, lastBroadcastAt: -999, lastContactSig: null };
    }
    return st.bySquad[key];
  }

  function contactSig(c) {
    if (!c) return null;
    return Math.round(c.x / 20) + ':' + Math.round(c.z / 20) + ':' + (c.unitId == null ? '?' : c.unitId);
  }

  function tick(sim) {
    if (!sim || sim.winner) return;
    var st = stateFor(sim),
      now = +sim.time || 0;
    ['us', 'ge'].forEach(function (f) {
      var squads = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [],
        sources = squads.map(function (sq) {
          return { squad: sq, contact: snapshotContact(sq) };
        });
      for (var i = 0; i < sources.length; i++) {
        var sq = sources[i].squad,
          contact = sources[i].contact;
        if (!sq || sq.disbanded || !contact || contact.broadcast) continue;
        var ss = squadState(st, sq),
          change = contactChange(contact, ss.lastContact);
        if (!change) continue;
        /* A cooldown suppression does not consume the change. lastContact tracks the
           last successfully sent report, so a still-current change retries later. */
        if (now - ss.lastBroadcastAt < BROADCAST_COOLDOWN) {
          ss.suppressed++;
          st.suppressed++;
          continue;
        }
        var recipients = nearbySquads(sim, sq, BROADCAST_RANGE);
        ss.lastBroadcastAt = now;
        ss.lastContactSig = contactSig(contact);
        ss.lastContact = {
          x: contact.x,
          z: contact.z,
          at: contact.at,
          firstHandAt: contact.firstHandAt,
          unitId: contact.unitId
        };
        ss.sent++;
        st.sent++;
        var broadcast = {
          at: now,
          observedAt: change.at,
          sourceSquad: sq.id,
          faction: f,
          kind: change.kind,
          x: change.x,
          z: change.z,
          unitId: change.unitId || null,
          recipientCount: recipients.length,
          recipients: recipients.map(function (r) {
            return { squad: r.squad.id, distance: +r.distance.toFixed(1) };
          })
        };
        /* Log to telemetry (behavior-neutral: nobody consumes this yet). */
        if (root.BattleTelemetry) {
          root.BattleTelemetry.record(
            'squad-broadcast',
            {
              sourceSquad: sq.id,
              faction: f,
              kind: change.kind,
              x: +change.x.toFixed(1),
              z: +change.z.toFixed(1),
              observedAt: change.at,
              unitId: change.unitId || null,
              recipientCount: recipients.length,
              recipients: broadcast.recipients
            },
            sim
          );
        }
        /* Track receive counts on recipient squads. */
        for (var j = 0; j < recipients.length; j++) {
          var rs = squadState(st, recipients[j].squad);
          rs.received++;
          st.received++;
          /* 0F2: when broadcast reception is enabled (the default), apply it to the receiving squad's
             contact picture. Only apply if the squad does not already have a fresher first-hand
             contact for the same enemy. A broadcast is never first-hand: it is tagged
             relayedFrom the source squad, same as the existing squadSenses relay path. This
             means the receiving squad's perception will still upgrade it to first-hand when one
             of its own men actually sees the enemy. */
          if (BROADCAST_ON) {
            /* Use 'squad' as the variable name so the wire-map scanner recognizes
               the receiver (SQUAD_NAMES = {'sq','squad'}). This is the receiving
               squad, not the broadcasting squad (which is 'sq' above). */
            var squad = recipients[j].squad,
              held = squad.contact,
              A = root.SquadAI,
              hasOwnFresh =
                A && A.hasFirstHandMemory
                  ? A.hasFirstHandMemory(held, sim)
                  : !!(held && held.firstHandAt != null && now - held.firstHandAt <= BROADCAST_TTL);
            if (hasOwnFresh) continue;
            /* Compare source observation age, not dispatch time. */
            if (held && isFinite(+held.at) && +held.at > change.at) continue;
            /* Don't apply if the squad is retreating or regrouping (different priorities). */
            if (squad.state === 'retreat' || squad.commandPhase === 'regroup') continue;
            var unit = change.unitId ? lookupUnit(sim, change.unitId, f) : null;
            squad.contact = {
              unit: unit,
              x: change.x,
              z: change.z,
              at: change.at,
              seenBy: null,
              stance: null,
              relayedFrom: sq.id,
              broadcast: true,
              firstHandAt: null,
              precision: change.precision || 'reported-position'
            };
            rs.applied = (rs.applied || 0) + 1;
            st.applied = (st.applied || 0) + 1;
            var beliefApplies = 0;
            if (A && A.rememberReportedContact) {
              var members = squad.members || [];
              for (var mi = 0; mi < members.length; mi++) {
                var man = members[mi];
                if (!man || man.dead) continue;
                if (
                  A.rememberReportedContact(man, sim, {
                    unit: unit,
                    targetId: change.unitId,
                    otherFaction: f === 'us' ? 'ge' : 'us',
                    x: change.x,
                    z: change.z,
                    observedAt: change.at,
                    reportedAt: now,
                    sourceId: 'squad:' + String(sq.id),
                    reportId:
                      'broadcast:' +
                      String(sq.id) +
                      ':' +
                      String(change.at) +
                      ':' +
                      String(change.unitId == null ? contactSig(contact) : change.unitId),
                    confidence: change.firstHand ? 0.78 : 0.62,
                    precision: change.precision || 'reported-position',
                    reason: 'squad-broadcast:' + change.kind
                  })
                )
                  beliefApplies++;
              }
            }
            rs.beliefsApplied = (rs.beliefsApplied || 0) + beliefApplies;
            st.beliefsApplied = (st.beliefsApplied || 0) + beliefApplies;
            /* Phase 0F3: stamp the reaction timestamp and emit telemetry so the
               Squad Leader and diagnostics can see that this squad reacted to a
               broadcast. The reaction itself is the existing squadSenses ->
               soldierContact -> alert() path: individual soldiers orient toward
               the broadcast contact because squad.contact now holds it. */
            squad._broadcastReactAt = now;
            squad._broadcastReactFrom = sq.id;
            if (root.BattleTelemetry) {
              root.BattleTelemetry.record(
                'squad-broadcast-reaction',
                {
                  receivingSquad: squad.id,
                  faction: squad.faction,
                  sourceSquad: sq.id,
                  kind: change.kind,
                  x: +change.x.toFixed(1),
                  z: +change.z.toFixed(1),
                  observedAt: change.at,
                  distance: +recipients[j].distance.toFixed(1),
                  beliefsApplied: beliefApplies
                },
                sim
              );
            }
          }
        }
        /* Rolling log, capped. */
        st.broadcasts.unshift(broadcast);
        if (st.broadcasts.length > 100) st.broadcasts.length = 100;
      }
    });
  }

  function reset(sim) {
    sim._squadBroadcast = null;
  }

  root.BattleModules.registerSystem('squad-broadcast', {
    version: BROADCAST_ON ? '0f2-broadcast-reception' : '0f1-telemetry-only',
    onBattleStart: reset,
    onBattleRestart: reset,
    onCommanderTick: tick
  });

  root.BattleSquadBroadcast = {
    version: BROADCAST_ON ? '0f2-broadcast-reception' : '0f1-telemetry-only',
    broadcastOn: function () {
      return BROADCAST_ON;
    },
    tuning: {
      BROADCAST_RANGE: BROADCAST_RANGE,
      BROADCAST_TTL: BROADCAST_TTL,
      BROADCAST_COOLDOWN: BROADCAST_COOLDOWN
    },
    summary: function (sim) {
      var st = sim && sim._squadBroadcast;
      if (!st) return null;
      return {
        sent: st.sent,
        received: st.received,
        suppressed: st.suppressed,
        applied: st.applied || 0,
        beliefsApplied: st.beliefsApplied || 0,
        bySquad: Object.keys(st.bySquad).map(function (id) {
          var s = st.bySquad[id];
          return {
            squad: id,
            sent: s.sent,
            received: s.received,
            suppressed: s.suppressed,
            applied: s.applied || 0,
            beliefsApplied: s.beliefsApplied || 0
          };
        }),
        recentBroadcasts: st.broadcasts.slice(0, 20)
      };
    }
  };
  if (typeof console !== 'undefined')
    root.GTLog(
      '[SQUAD] Phase 0F inter-squad tactical broadcast ' +
        (BROADCAST_ON
          ? '0F2 active (reception default-on, ?squadBroadcast=0 for telemetry-only, range=' +
            BROADCAST_RANGE +
            'm)'
          : '0F1 active (telemetry-only legacy control, range=' + BROADCAST_RANGE + 'm)')
    );
})(typeof window !== 'undefined' ? window : globalThis);
