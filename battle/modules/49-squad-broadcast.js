/* Phase 0F1 — Inter-squad tactical broadcast telemetry (behavior-neutral).

   Nearby squads share tactical contact beyond the General's stale intel rollup. Today a squad
   creeping up a hill, a squad watching from a distance, and a squad fighting for its life from
   sniper fire each act on their own picture. 0F adds a Meso-layer broadcast channel: when a
   squad's contact picture changes meaningfully (new contact, contact upgraded from heard to
   seen, sniper/MG identified, taking fire from a new sector) it publishes a tactical broadcast
   to nearby squads within BROADCAST_RANGE.

   This slice (0F1) is behavior-neutral: broadcasts are computed and logged but NOT consumed.
   squad.contact on receiving squads is unchanged. No combat-RNG draw. The telemetry records
   what WOULD be broadcast so the dose can be measured before 0F2 makes it behavioral.

   Ownership: squad-to-squad, not Macro (General) and not Micro (individual soldier). Does not
   bypass Movement Resolver or Engagement ownership. This module writes only its own diagnostics
   state (sim._squadBroadcast) and telemetry; it never writes squad.contact, soldier.destination,
   soldier.target, or any engagement state. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleSquadBroadcast) return;

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
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function squadCentre(sq) {
    if (!sq || !sq.members) return null;
    var x = 0, z = 0, n = 0;
    for (var i = 0; i < sq.members.length; i++) {
      var s = sq.members[i];
      if (!s || s.dead || !s.root) continue;
      x += +s.root.position.x || 0;
      z += +s.root.position.z || 0;
      n++;
    }
    return n ? { x: x / n, z: z / n } : null;
  }

  /* What changed about a squad's contact that is worth broadcasting. Returns null if nothing
     meaningful changed (same contact, same sector, no upgrade). */
  function contactChange(sq, prev, battle) {
    var c = sq.contact;
    if (!c || !isFinite(+c.x) || !isFinite(+c.z)) return null;
    var now = +battle.time || 0;
    /* First-ever contact for this squad is always meaningful. */
    if (!prev) {
      return { kind: 'new-contact', x: +c.x, z: +c.z, at: now, unitId: c.unit && c.unit.id, seenBy: c.seenBy };
    }
    /* Contact upgraded from heard/relayed to first-hand. */
    if (!prev.firstHandAt && c.firstHandAt) {
      return { kind: 'upgraded-to-firsthand', x: +c.x, z: +c.z, at: now, unitId: c.unit && c.unit.id };
    }
    /* Contact moved to a new 20m sector (significant position change). */
    var prevSec = Math.round(+prev.x / 20) + ':' + Math.round(+prev.z / 20),
      curSec = Math.round(+c.x / 20) + ':' + Math.round(+c.z / 20);
    if (prevSec !== curSec) {
      return { kind: 'sector-change', x: +c.x, z: +c.z, at: now, unitId: c.unit && c.unit.id, fromSector: prevSec, toSector: curSec };
    }
    /* Contact is significantly fresher (a new sighting of the same enemy in the same sector
       after a gap). */
    if (c.at > prev.at + BROADCAST_TTL) {
      return { kind: 're-acquired', x: +c.x, z: +c.z, at: now, unitId: c.unit && c.unit.id };
    }
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
        sent: 0, received: 0, suppressed: 0,
        bySquad: {}, /* squadId -> { sent, received, suppressed, lastBroadcastAt, lastContactSig } */
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

  function contactSig(sq) {
    var c = sq.contact;
    if (!c) return null;
    return Math.round(+c.x / 20) + ':' + Math.round(+c.z / 20) + ':' + (c.unit && c.unit.id || '?');
  }

  function tick(sim) {
    if (!sim || sim.winner) return;
    var st = stateFor(sim),
      now = +sim.time || 0;
    ['us', 'ge'].forEach(function (f) {
      var squads = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      for (var i = 0; i < squads.length; i++) {
        var sq = squads[i];
        if (!sq || sq.disbanded) continue;
        var ss = squadState(st, sq),
          sig = contactSig(sq),
          prevSig = ss.lastContactSig;
        /* Track the contact signature for next tick's change detection. */
        ss.lastContactSig = sig;
        /* No contact or no change in signature = no broadcast. */
        if (!sig) continue;
        if (sig === prevSig) continue;
        /* Cooldown: don't re-broadcast the same sector+unit too often. */
        if (now - ss.lastBroadcastAt < BROADCAST_COOLDOWN) {
          ss.suppressed++;
          st.suppressed++;
          continue;
        }
        var change = contactChange(sq, ss.lastContact, sim);
        ss.lastContact = sq.contact ? { x: +sq.contact.x, z: +sq.contact.z, at: +sq.contact.at, firstHandAt: sq.contact.firstHandAt } : null;
        if (!change) continue;
        /* Compute recipients. */
        var recipients = nearbySquads(sim, sq, BROADCAST_RANGE);
        ss.lastBroadcastAt = now;
        ss.sent++;
        st.sent++;
        var broadcast = {
          at: now,
          sourceSquad: sq.id,
          faction: f,
          kind: change.kind,
          x: change.x,
          z: change.z,
          unitId: change.unitId || null,
          recipientCount: recipients.length,
          recipients: recipients.map(function (r) { return { squad: r.squad.id, distance: +r.distance.toFixed(1) }; })
        };
        /* Log to telemetry (behavior-neutral: nobody consumes this yet). */
        if (root.BattleTelemetry) {
          root.BattleTelemetry.record('squad-broadcast', {
            sourceSquad: sq.id,
            faction: f,
            kind: change.kind,
            x: +change.x.toFixed(1),
            z: +change.z.toFixed(1),
            unitId: change.unitId || null,
            recipientCount: recipients.length,
            recipients: broadcast.recipients
          }, sim);
        }
        /* Track receive counts on recipient squads (they would receive it in 0F2). */
        for (var j = 0; j < recipients.length; j++) {
          var rs = squadState(st, recipients[j].squad);
          rs.received++;
          st.received++;
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
    version: '0f1-telemetry-only',
    onBattleStart: reset,
    onBattleRestart: reset,
    onCommanderTick: tick
  });

  root.BattleSquadBroadcast = {
    version: '0f1-telemetry-only',
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
        bySquad: Object.keys(st.bySquad).map(function (id) {
          var s = st.bySquad[id];
          return { squad: id, sent: s.sent, received: s.received, suppressed: s.suppressed };
        }),
        recentBroadcasts: st.broadcasts.slice(0, 20)
      };
    }
  };
  if (typeof console !== 'undefined') console.log('[SQUAD] Phase 0F1 inter-squad tactical broadcast telemetry active (behavior-neutral, range=' + BROADCAST_RANGE + 'm)');
})(typeof window !== 'undefined' ? window : globalThis);
