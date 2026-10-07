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
     to a broadcast. The reaction itself is the existing squadSenses -> soldierContact -> alert()
     path: individual soldiers orient toward the broadcast contact because squad.contact now
     holds it. This slice makes the reaction visible and measurable.

   Ownership: squad-to-squad, not Macro (General) and not Micro (individual soldier). Does not
   bypass Movement Resolver or Engagement ownership. When 0F2 is on, this module writes
   squad.contact on receiving squads as a documented sibling layer (the same role as
   squadSenses in squad-ai.js). Personal reaction is delivered only through SquadAI's
   Perception-owned rememberReported API; this module never writes soldier._beliefs,
   soldier.destination, soldier.target, or any engagement state. */
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

  /* What changed about a squad's contact that is worth broadcasting. Returns null if nothing
     meaningful changed (same contact, same sector, no upgrade). */
  function contactChange(c, prev, battle) {
    if (!c || !isFinite(+c.x) || !isFinite(+c.z) || !isFinite(+c.at)) return null;
    /* A relayed fact may be consumed locally, but it is never a new broadcast source. This keeps
       one commander tick and later ticks from turning a 120 m tactical channel into an
       order-dependent multi-hop faction network. A later first-hand sighting replaces the relayed
       aggregate and may then be broadcast normally. */
    if (c.broadcast || c.relayedFrom != null) return null;
    var fact = {
      x: +c.x,
      z: +c.z,
      at: +c.at,
      unitId: c.unit && c.unit.id,
      stance: c.stance || null,
      precision: c.precision || (c.heard ? 'imprecise-sound' : 'reported-position')
    };
    /* First-ever locally originated contact is always meaningful. Observation time belongs to
       the evidence; dispatch time is recorded separately by the broadcast record. */
    if (!prev) return Object.assign({ kind: 'new-contact', seenBy: c.seenBy }, fact);
    /* Contact upgraded from heard/local uncertainty to first-hand. */
    if (!prev.firstHandAt && c.firstHandAt)
      return Object.assign({ kind: 'upgraded-to-firsthand' }, fact);
    /* Contact moved to a new 20 m sector (significant position change). */
    var prevSec = Math.round(+prev.x / 20) + ':' + Math.round(+prev.z / 20),
      curSec = Math.round(+c.x / 20) + ':' + Math.round(+c.z / 20);
    if (prevSec !== curSec)
      return Object.assign({ kind: 'sector-change', fromSector: prevSec, toSector: curSec }, fact);
    /* A fresh observation in the same sector eventually refreshes the report. This compares
       against the last SUCCESSFULLY broadcast observation, so cooldown-suppressed changes retry. */
    if (+c.at > +prev.at + BROADCAST_TTL) return Object.assign({ kind: 're-acquired' }, fact);
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
    return Math.round(+c.x / 20) + ':' + Math.round(+c.z / 20) + ':' + ((c.unit && c.unit.id) || '?');
  }

  function contactSnapshot(c) {
    return c
      ? {
          x: +c.x,
          z: +c.z,
          at: +c.at,
          firstHandAt: c.firstHandAt,
          heard: !!c.heard,
          relayedFrom: c.relayedFrom == null ? null : c.relayedFrom,
          broadcast: !!c.broadcast
        }
      : null;
  }

  function tick(sim) {
    if (!sim || sim.winner) return;
    var st = stateFor(sim),
      now = +sim.time || 0,
      A = root.SquadAI;
    ['us', 'ge'].forEach(function (f) {
      var squads = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      for (var i = 0; i < squads.length; i++) {
        var sq = squads[i];
        if (!sq || sq.disbanded) continue;
        /* Read through Perception's aggregate API so an already-expired source contact is pruned
           before transport. */
        var c = A && A.squadContact ? A.squadContact(sq, sim) : sq.contact;
        if (!c || c.broadcast || c.relayedFrom != null) continue;
        var ss = squadState(st, sq),
          sig = contactSig(c),
          change = contactChange(c, ss.lastContact, sim);
        if (!sig || !change) continue;
        /* Suppression does NOT advance the last-sent baseline. The same meaningful change will
           therefore retry after cooldown instead of disappearing forever. */
        if (now - ss.lastBroadcastAt < BROADCAST_COOLDOWN) {
          ss.suppressed++;
          st.suppressed++;
          continue;
        }

        var recipients = nearbySquads(sim, sq, BROADCAST_RANGE);
        ss.lastBroadcastAt = now;
        ss.lastContactSig = sig;
        ss.lastContact = contactSnapshot(c);
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

        for (var j = 0; j < recipients.length; j++) {
          var squad = recipients[j].squad,
            rs = squadState(st, squad);
          rs.received++;
          st.received++;
          if (!BROADCAST_ON) continue;

          var held = A && A.squadContact ? A.squadContact(squad, sim) : squad.contact;
          /* Never replace own first-hand memory or a newer aggregate with an older report. */
          if (held && A && A.hasFirstHandMemory && A.hasFirstHandMemory(held, sim)) continue;
          if (held && +held.at > +change.at) continue;
          if (squad.state === 'retreat' || squad.commandPhase === 'regroup') continue;

          var reportedUnit = change.unitId ? lookupUnit(sim, change.unitId, f) : null;
          squad.contact = {
            unit: reportedUnit,
            x: change.x,
            z: change.z,
            at: change.at,
            seenBy: null,
            stance: change.stance || null,
            relayedFrom: sq.id,
            broadcast: true,
            firstHandAt: null,
            precision: change.precision || 'reported-position'
          };
          rs.applied = (rs.applied || 0) + 1;
          st.applied = (st.applied || 0) + 1;

          /* Transport hands the same dated fact to Perception, which alone owns personal beliefs.
             This makes the advertised "reaction" real under shipping soldier-belief defaults while
             preserving personal sight as stronger/fresher truth. */
          if (A && A.rememberReported) {
            for (var mi = 0; squad.members && mi < squad.members.length; mi++) {
              var man = squad.members[mi];
              if (!man || man.dead) continue;
              A.rememberReported(
                man,
                sim,
                {
                  unit: reportedUnit,
                  x: change.x,
                  z: change.z,
                  at: change.at,
                  precision: change.precision || 'reported-position'
                },
                {
                  sourceSquadId: sq.id,
                  reportedAt: now,
                  reason: 'squad-broadcast:' + String(sq.id)
                }
              );
            }
          }

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
                distance: +recipients[j].distance.toFixed(1)
              },
              sim
            );
          }
        }
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
        bySquad: Object.keys(st.bySquad).map(function (id) {
          var s = st.bySquad[id];
          return {
            squad: id,
            sent: s.sent,
            received: s.received,
            suppressed: s.suppressed,
            applied: s.applied || 0
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
