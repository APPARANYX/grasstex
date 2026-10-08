/* Order execution outcome: what became of the order a man was given.

   Read-only. This module owns no state, writes no field and draws no random number. It joins the
   records that already exist at each handoff and names the result, so a commanding layer can tell
   an order that has not arrived from one that is being carried out, held by a higher obligation,
   blocked, or finished:

     Meso publication   Command Reception envelope (id, version, mission version in its data)
     Personal adoption  Command Reception record phase, and `_fireteamAdoptedEnvelope` (the envelope
                        Squad Command actually applied)
     Arbitration        the Movement Resolver's last winner (`_movementResolver.last`: owner, kind)
     Physical result    `_movementProgress` (Movement Execution's own stuck episode) and position

   An outcome always names the envelope and the mission version of the order it describes. A caller
   that remembers `envelopeId` / `missionVersion` from the moment it acted can compare them with a
   later read: an outcome for a replaced order is a different envelope and never describes the new
   one. Command Reception only ever keeps the newest record per man, so there is no stale outcome
   to misread, only an earlier one to recognise.

   States (a man's movement order):
     none       no Meso movement order was addressed to him (leaderless, player, unassigned)
     pending    published, not yet adopted by him (`why`: in-transit phase, or `undeliverable`)
     adopted    he has adopted it and Squad Command has not applied it to the resolver yet
     held       applied, and a higher-priority movement authority owns him (`by`: its kind);
                a prepared post, reload, contact reaction or retreat is a justified hold
     executing  applied and the resolver is steering him to it; `progressing` is true while his
                recent samples close on the goal
     blocked    applied and chosen, but Movement Execution found no progress (`terminal` once its
                recovery rounds are spent)
     completed  he is at the order's point

   The mission-level result, `squad`, counts those states for the men holding the squad's CURRENT
   mission version only. */
(function (root) {
  'use strict';
  if (root.BattleExecutionOutcome) return;

  var ARRIVED = 1.8; // Movement Resolver's ARRIVAL
  /* Resolver kinds that are a deliberate obligation, not a failure to execute the formation slot. */
  var LAWFUL = {
    'firing-station': 'post',
    'reload-hold': 'weapon',
    hold: 'hold',
    'contact-reaction': 'contact',
    retreat: 'retreat',
    regroup: 'regroup',
    flee: 'flee',
    player: 'player',
    'cover-bound': 'bound',
    'assault-rush': 'assault'
  };
  function point(v) {
    return v && isFinite(+v.x) && isFinite(+v.z) ? { x: +v.x, z: +v.z } : null;
  }
  function pos(s) {
    return s && s.root && s.root.position ? point(s.root.position) : null;
  }
  function dist(a, b) {
    return a && b ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity;
  }
  function alive(sq) {
    return ((sq && sq.members) || []).filter(function (s) {
      return s && !s.dead;
    });
  }
  function missionVersionOf(sq) {
    return sq && sq._macroMission ? +sq._macroMission.version || 0 : 0;
  }
  /* `peek` never settles Command Reception: reading an outcome must not advance any lifecycle. */
  function movementRecord(s, battle) {
    var CR = root.BattleCommandReception;
    if (!CR || !CR.movementEnabled || !CR.movementEnabled() || !CR.peek) return null;
    return CR.peek(s, battle, 'movement', 'soldier:' + String(s.id));
  }
  /* Is the man closing on his goal? Movement Execution keeps the samples it judges him by. */
  function closing(s, goal) {
    var p = s._movementProgress,
      a = p && p.samples;
    if (!a || a.length < 2 || !goal) return false;
    return dist(a[0], goal) - dist(a[a.length - 1], goal) >= 1.5;
  }
  function man(s, battle) {
    if (!s || !battle) return null;
    var rec = movementRecord(s, battle),
      sq = s.squad,
      out = {
        id: String(s.id),
        state: 'none',
        envelopeId: null,
        version: null,
        missionVersion: null,
        current: false,
        publishKey: null,
        why: null,
        by: null,
        owner: null,
        kind: null,
        progressing: false,
        terminal: false,
        distance: null
      };
    if (!rec) return out;
    out.envelopeId = rec.envelopeId;
    out.version = rec.version;
    out.missionVersion = rec.data && rec.data.missionVersion != null ? +rec.data.missionVersion : null;
    out.publishKey = (rec.data && rec.data.publishKey) || null;
    /* Is this the order of the squad's standing brief? A record from an older brief, or one that names none
       (published before the brief carried its version), is not: it is never counted as this brief's outcome,
       even when the slot happens to be unchanged. */
    out.current = out.missionVersion != null && out.missionVersion === missionVersionOf(sq);
    if (rec.unreachable) {
      out.state = 'pending';
      out.why = 'undeliverable';
      return out;
    }
    if (rec.phase !== 'adopted') {
      out.state = 'pending';
      out.why = rec.phase;
      return out;
    }
    /* A remnant extracting home is locally authoritative: Squad Command never applies the adopted
       tactical envelope to the resolver while its survival movement key stands. */
    if (s._survivalMovementKey) {
      out.state = 'held';
      out.by = 'survival';
      return out;
    }
    if (s._fireteamAdoptedEnvelope !== rec.envelopeId) {
      out.state = 'adopted';
      return out;
    }
    var last = s._movementResolver && s._movementResolver.last,
      goal = point(rec.point),
      here = pos(s);
    out.distance = goal && here ? +dist(here, goal).toFixed(1) : null;
    if (last) {
      out.owner = last.owner;
      out.kind = last.kind;
    }
    if (last && last.kind !== 'formation') {
      out.state = 'held';
      out.by = LAWFUL[last.kind] || last.kind;
      return out;
    }
    if (out.distance != null && out.distance <= ARRIVED) {
      out.state = 'completed';
      return out;
    }
    var p = s._movementProgress;
    if (p && p.stuck && p.kind === 'formation') {
      out.state = 'blocked';
      out.why = 'no-progress';
      out.terminal = !!p.terminal;
      return out;
    }
    out.state = 'executing';
    out.progressing = closing(s, goal);
    return out;
  }
  /* The squad's picture of its current mission: how many of its men hold an order from this
     mission version and in what state. Men whose order predates the mission (an identical slot the
     new brief left in place) are counted as carried, not as replaced. */
  function squad(sq, battle) {
    if (!sq || !battle) return null;
    var version = missionVersionOf(sq),
      counts = {
        none: 0,
        pending: 0,
        adopted: 0,
        held: 0,
        executing: 0,
        blocked: 0,
        completed: 0,
        notCurrent: 0
      },
      heldBy = {},
      men = [];
    alive(sq).forEach(function (s) {
      var o = man(s, battle);
      men.push(o);
      /* A man with no order has nothing to be current about; any other state counts only for the brief it
         came from. An older brief's order is reported as notCurrent, never blended into this one. */
      if (o.state !== 'none' && !o.current) {
        counts.notCurrent++;
        return;
      }
      counts[o.state]++;
      if (o.state === 'held') heldBy[o.by] = (heldBy[o.by] || 0) + 1;
    });
    return {
      squad: String(sq.faction) + ':' + String(sq.id),
      missionVersion: version,
      living: men.length,
      counts: counts,
      heldBy: heldBy,
      recon: recon(sq),
      men: men
    };
  }
  /* Movement Execution has found his formation order physically blocked and has spent both recovery
     rounds. The Squad Leader's own reading of the same fact as `man().state === 'blocked'` + terminal. */
  function blocked(s) {
    var p = s && s._movementProgress;
    return !!(p && p.stuck && p.terminal && p.kind === 'formation');
  }
  /* The same fact, bound to the squad's standing brief: the man's applied order is from this brief. */
  function blockedForBrief(s, battle) {
    if (!blocked(s)) return false;
    var o = man(s, battle);
    return !!(o && o.current && o.state !== 'pending');
  }
  /* The scouting detail's result for the squad's current brief, read from Squad Leader's own recon records
     (`_reconTask` while underway, `_reconLast` once ended; both are written by module 15c, nothing is added). It
     names a no-contact completion as such: neither a failure nor progress, and not the same as a timeout. */
  var RECON_OUTCOME = {
    'scout-contact': 'contact',
    'observed-no-contact': 'no-contact',
    timeout: 'timeout'
  };
  function recon(sq) {
    if (!sq) return null;
    var m = sq._macroMission,
      since = m ? +m.issuedAt || 0 : 0;
    if (sq._reconTask) return { outcome: 'underway', scouts: (sq._reconTask.scoutIds || []).length };
    var last = sq._reconLast;
    if (!last || !(+last.endedAt >= since)) return null;
    return {
      outcome: RECON_OUTCOME[last.reason] || 'cancelled',
      reason: last.reason,
      endedAt: +last.endedAt,
      scouts: (last.scoutIds || []).length
    };
  }
  root.BattleExecutionOutcome = {
    recon: recon,
    version: '1-derived',
    blocked: blocked,
    blockedForBrief: blockedForBrief,
    man: man,
    squad: squad
  };
  if (root.GTLog) root.GTLog('[COMMAND] execution outcome reader (derived, no state)');
})(typeof window !== 'undefined' ? window : globalThis);
