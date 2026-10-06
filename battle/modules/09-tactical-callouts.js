/* Tactical callouts: what one soldier tells another, as a simulated message (on by default since 2026-10-02, owner's
   decision on PR #170; `?callouts=0` is the old free relay). A callout has a sender, an audience, a kind, the fact it carries, the simulated time it was sent, the time
   each listener would hear it and whether he did. Voice is presentation and stays separate: an MP3 never creates a fact.

   First kind, `contact`: a squad that sees the enemy first-hand calls it out. With personal beliefs enabled,
   friendly men in the caller's own squad as well as other squads within CALL_RANGE may hear it; with beliefs off,
   the old cross-squad-only audience is preserved. Delivery takes SPEAK + distance / sound + REACT, and listeners
   may miss it: deterministically (a hash of the message and the listener, never the combat RNG), more often far off,
   in gunfire and under fire; a man frozen or fleeing does not listen and a dead one hears nothing. When a listener hears
   it, Perception may update that listener's personal belief only after this delivery settles. Cross-squad delivery
   may also update the aggregate squad picture through `squadSenses`; same-squad delivery does not loop back into
   `squad.contact`. Voice remains presentation only.

   Owns only `battle._callouts`. Reads positions, the gunfire log, `suppressedUntil` and the Engagement state. */
(function (root) {
  'use strict';
  if (root.BattleCallouts) return;

  var ON = !(typeof location !== 'undefined' && /[?&]callouts=(0|off|none)\b/.test(location.search || ''));

  var KINDS = {
    contact: { carries: 'unit, x, z, at, stance', consumer: 'Perception squadSenses (relayed contact)' },
    incomingFire: {
      carries: 'unit, x, z, at, stance, precision, reason',
      consumer: 'Perception personal beliefs (shooter firing origin)'
    }
  };
  var TUNING = {
    CALL_RANGE: 60, // m: a shout carries this far to be understood
    CALL_REPEAT: 4, // s: a squad that keeps seeing the enemy calls it again this often
    SPEAK: 0.9, // s: saying the call
    REACT: 0.3, // s: hearing and understanding it
    SOUND: 343, // m/s
    MISS_BASE: 0.05,
    MISS_FAR: 0.45, // x (d / CALL_RANGE)^2
    NOISE_RANGE: 25, // m: gunfire this close drowns a call
    NOISE_MEMORY: 1.5, // s
    MISS_NOISE: 0.25,
    MISS_UNDER_FIRE: 0.2,
    MISS_MAX: 0.9,
    KEEP: 12, // s: a sighting older than this is not worth passing (Perception's CONTACT_MEMORY)
    LOG: 400 // listener records kept for diagnostics
  };
  var NOT_LISTENING = { freeze: 1, flee: 1 };

  function hash01(a, b) {
    var s = String(a) + '|' + String(b),
      h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
  }
  function beliefsOn() {
    var S = root.SquadAI;
    return !!(S && S.soldierBeliefsOn && S.soldierBeliefsOn());
  }
  function state(battle) {
    return (
      battle._callouts ||
      (battle._callouts = {
        serial: 0,
        pending: [],
        processedAt: -1,
        bySquad: Object.create(null), // squad id -> freshest cross-squad message heard
        bySoldier: Object.create(null), // soldier id -> freshest actually delivered message
        lastCall: Object.create(null), // squad id -> {at, unitId}
        log: [],
        overflow: 0,
        counts: {
          sent: 0,
          addressed: 0,
          heard: 0,
          missed: 0,
          dead: 0,
          notListening: 0,
          stale: 0,
          applied: 0,
          beliefApplied: 0,
          sameSquadAddressed: 0,
          sameSquadHeard: 0,
          delaySum: 0
        }
      })
    );
  }
  function engState(s) {
    return (s.eng && s.eng.state) || '';
  }
  function threat(unit) {
    var S = root.SquadAI;
    return !!(unit && !unit.dead && (!S || !S.threatDisposition || S.threatDisposition(unit).combatThreat));
  }
  function noiseNear(battle, p, t) {
    var shots = battle._gunfire;
    if (!shots) return false;
    var r2 = TUNING.NOISE_RANGE * TUNING.NOISE_RANGE;
    for (var i = 0; i < shots.length; i++) {
      var g = shots[i];
      if (t - g.at > TUNING.NOISE_MEMORY) continue;
      var dx = g.x - p.x,
        dz = g.z - p.z;
      if (dx * dx + dz * dz <= r2) return true;
    }
    return false;
  }
  function record(st, msg, man, fields) {
    if (st.log.length >= TUNING.LOG) {
      st.log.shift();
      st.overflow++;
    }
    var r = {
      id: msg.id,
      kind: msg.kind,
      from: msg.from,
      fromSquad: msg.fromSquad,
      to: man.id,
      toSquad: man.squad && man.squad.id
    };
    for (var k in fields) r[k] = fields[k];
    st.log.push(r);
  }

  /* Who hears what was said, and when; settled lazily up to battle.time. */
  function settle(battle) {
    var st = state(battle);
    if (st.processedAt === battle.time) return st;
    st.processedAt = battle.time;
    var keep = [];
    for (var i = 0; i < st.pending.length; i++) {
      var d = st.pending[i];
      if (d.at > battle.time) {
        keep.push(d);
        continue;
      }
      var man = d.man,
        msg = d.msg,
        c = st.counts,
        outcome;
      if (man.dead) outcome = 'dead';
      else if (NOT_LISTENING[engState(man)]) outcome = 'not-listening';
      else if (d.miss) outcome = 'missed';
      else if (battle.time - msg.fact.at > TUNING.KEEP || (!beliefsOn() && !threat(msg.fact.unit)))
        outcome = 'stale';
      else outcome = 'heard';
      if (outcome === 'heard') {
        c.heard++;
        c.delaySum += d.at - msg.sentAt;
        var sq = man.squad,
          delivery = {
            msg: msg,
            at: d.at,
            confidence: d.confidence,
            sameSquad: !!(sq && msg.fromSquad != null && String(sq.id) === String(msg.fromSquad))
          };
        var current = st.bySoldier[String(man.id)];
        if (
          !current ||
          msg.fact.at > current.msg.fact.at + 1e-6 ||
          (Math.abs(msg.fact.at - current.msg.fact.at) <= 1e-6 && d.at >= current.at)
        )
          st.bySoldier[String(man.id)] = delivery;
        if (delivery.sameSquad) c.sameSquadHeard++;
        var best = sq && !delivery.sameSquad && st.bySquad[sq.id];
        if (sq && !delivery.sameSquad && (!best || msg.fact.at > best.fact.at)) st.bySquad[sq.id] = msg;
      } else if (outcome === 'dead') c.dead++;
      else if (outcome === 'not-listening') c.notListening++;
      else if (outcome === 'missed') c.missed++;
      else c.stale++;
      record(st, msg, man, { sentAt: msg.sentAt, at: d.at, confidence: d.confidence, outcome: outcome });
    }
    st.pending = keep;
    return st;
  }

  function send(battle, sender, kind, fact) {
    if (!KINDS[kind] || !sender || sender.dead || !sender.root) return null;
    var st = settle(battle),
      side = battle.rosterOf ? battle.rosterOf(sender.faction) : [],
      p = sender.root.position,
      msg = {
        id: ++st.serial,
        kind: kind,
        from: sender.id,
        fromSquad: sender.squad && sender.squad.id,
        sentAt: battle.time,
        x: p.x,
        z: p.z,
        fact: fact
      },
      R = TUNING.CALL_RANGE;
    st.counts.sent++;
    for (var i = 0; i < side.length; i++) {
      var man = side[i];
      if (
        !man ||
        man.dead ||
        man === sender ||
        !man.root ||
        !man.squad ||
        (!beliefsOn() && man.squad === sender.squad) ||
        man.squad.disbanded
      )
        continue;
      var q = man.root.position,
        d = Math.hypot(q.x - p.x, q.z - p.z);
      if (d > R) continue;
      var pMiss =
        TUNING.MISS_BASE +
        TUNING.MISS_FAR * (d / R) * (d / R) +
        (noiseNear(battle, q, battle.time) ? TUNING.MISS_NOISE : 0) +
        ((+man.suppressedUntil || 0) > battle.time ? TUNING.MISS_UNDER_FIRE : 0);
      pMiss = Math.min(TUNING.MISS_MAX, pMiss);
      st.counts.addressed++;
      if (man.squad === sender.squad) st.counts.sameSquadAddressed++;
      st.pending.push({
        msg: msg,
        man: man,
        at: battle.time + TUNING.SPEAK + d / TUNING.SOUND + TUNING.REACT,
        miss: hash01(msg.id + ':' + msg.from, man.id) < pMiss,
        confidence: +(1 - pMiss).toFixed(3)
      });
    }
    return msg;
  }

  /* Perception asks this for a squad that sees the enemy first-hand: call it when it is new or CALL_REPEAT old. */
  function report(battle, sq, contact) {
    if (!ON || !sq || !contact || !contact.unit) return null;
    var st = settle(battle),
      last = st.lastCall[sq.id],
      uid = contact.unit.id;
    if (last && last.unitId === uid && battle.time - last.at < TUNING.CALL_REPEAT) return null;
    var caller = null;
    for (var i = 0; i < sq.members.length; i++) {
      var s = sq.members[i];
      if (s && !s.dead && String(s.id) === String(contact.seenBy)) caller = s;
    }
    if (!caller || NOT_LISTENING[engState(caller)]) return null;
    st.lastCall[sq.id] = { at: battle.time, unitId: uid };
    return send(battle, caller, 'contact', {
      unit: contact.unit,
      x: contact.x,
      z: contact.z,
      at: contact.at,
      stance: contact.stance
    });
  }

  /* The freshest message this particular man actually heard. Personal belief consumption is age-only:
     later changes to the hidden referenced unit do not retroactively erase what he heard. */
  function heardBy(battle, man) {
    if (!ON || !man) return null;
    var d = settle(battle).bySoldier[String(man.id)];
    if (!d || !d.msg || battle.time - d.msg.fact.at > TUNING.KEEP) return null;
    return d;
  }

  /* The freshest cross-squad contact one of this squad's men has heard called, while it is still worth acting on.
     This legacy aggregate path retains the existing threat validation; personal belief reads do not use it. */
  function heard(battle, sq) {
    if (!ON || !sq) return null;
    var msg = settle(battle).bySquad[sq.id];
    if (!msg || battle.time - msg.fact.at > TUNING.KEEP || !threat(msg.fact.unit)) return null;
    return msg;
  }

  function telemetry(battle) {
    if (!ON || !battle || !battle._callouts) return null;
    var c = battle._callouts.counts;
    return {
      format: 'grasstex-callouts-v1',
      sent: c.sent,
      addressed: c.addressed,
      heard: c.heard,
      missed: c.missed,
      dead: c.dead,
      notListening: c.notListening,
      stale: c.stale,
      applied: c.applied,
      beliefApplied: c.beliefApplied,
      sameSquadAddressed: c.sameSquadAddressed,
      sameSquadHeard: c.sameSquadHeard,
      meanDelay: c.heard ? +(c.delaySum / c.heard).toFixed(3) : 0
    };
  }
  function diagnostics(battle) {
    var st = battle && battle._callouts;
    return st ? { counts: telemetry(battle), recent: st.log.slice(-60), overflow: st.overflow } : null;
  }
  function reset(battle) {
    if (!battle) return;
    delete battle._callouts;
    if (root.SquadAI && root.SquadAI.resetPerceptionBattleState)
      root.SquadAI.resetPerceptionBattleState(battle);
  }

  function noteApplied(battle) {
    state(battle).counts.applied++;
  }
  function noteBeliefApplied(battle) {
    state(battle).counts.beliefApplied++;
  }

  if (root.BattleModules && root.BattleModules.registerSystem)
    root.BattleModules.registerSystem('tactical-callouts', {
      version: '1.2-restart-clean',
      onBattleStart: reset,
      onBattleRestart: reset
    });

  root.BattleCallouts = {
    version: '1.2-restart-clean',
    reset: reset,
    enabled: function () {
      return ON;
    },
    KINDS: KINDS,
    tuning: TUNING,
    send: send,
    report: report,
    heard: heard,
    heardBy: heardBy,
    noteApplied: noteApplied,
    noteBeliefApplied: noteBeliefApplied,
    telemetry: telemetry,
    diagnostics: diagnostics
  };
})(typeof window !== 'undefined' ? window : globalThis);
