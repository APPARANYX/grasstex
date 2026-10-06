/* Individual command-reception state.
   Phase 0A records deterministic per-man receipt/adoption telemetry. Phase 0B optionally lets
   Engagement consume the personally adopted posture/fire-control version. Phase 0C exposes the same
   adopted-command boundary to the Meso movement publisher. Phase 0D1 distinguishes simple,
   directional, point and object references so "get down" does not pay the same orient/locate cost
   as "shift left" or "get in that building". Phase 0D2 optionally routes referenced team orders
   through a deterministic fireteam relay and bounds direct links to voice/visual range. This module
   still never writes stance, fire permission, targets, paths, destinations or movement itself.

   Owns only battle._commandReception. Timing is deterministic and uses no combat RNG. */
(function (root) {
  'use strict';
  if (root.BattleCommandReception) return;

  var SEARCH = typeof location !== 'undefined' ? location.search || '' : '',
    ON = !/[?&]commandReception=(?:0|off|false)(?:&|#|$)/i.test(SEARCH),
    /* Phase 0E: all three command-reception flags are now default-on after 100-seed paired
       benchmarks confirmed them safe:
       - commandRelay=1 was INERT across 100 seeds (all 100 pairs identical)
       - commandMovement=1 was QUIET/WEAK (0-4 of 32 counters significant, casualties not significant)
       - commandPosture=1 was QUIET across 100 seeds (0 of 32 counters significant, casualties -9.3% p=1)
       after a settle() cache fix eliminated the wall-time gate. ?commandPosture=0, ?commandMovement=0
       and ?commandRelay=0 remain as legacy control arms for A/B benchmark work. */
    POSTURE_ON = ON && !/[?&]commandPosture=(?:0|off|false)(?:&|#|$)/i.test(SEARCH),
    MOVEMENT_ON = ON && !/[?&]commandMovement=(?:0|off|false)(?:&|#|$)/i.test(SEARCH),
    RELAY_ON = ON && !/[?&]commandRelay=(?:0|off|false)(?:&|#|$)/i.test(SEARCH);
  var FORMAT = 4;
  var TUNING = {
    SOUND: 343,
    VOICE_RANGE: 45,
    VISUAL_RANGE: 90,
    VISUAL_SIGNAL: 0.22,
    RELAY_PAUSE: 0.18,
    SPEAK_SIMPLE: 0.35,
    SPEAK_SPATIAL: 0.55,
    ATTENTION: 0.08,
    ATTENTION_SPREAD: 0.28,
    PROCESS: 0.16,
    PROCESS_SPREAD: 0.34,
    ORIENT_DIRECTION: 0.08,
    ORIENT_DIRECTION_SPREAD: 0.16,
    ORIENT_POINT: 0.2,
    ORIENT_POINT_SPREAD: 0.3,
    ORIENT_OBJECT: 0.28,
    ORIENT_OBJECT_SPREAD: 0.4,
    LOG: 300
  };

  function hash01(a, b) {
    var s = String(a) + '|' + String(b),
      h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
  }
  function point(v) {
    return v && isFinite(+v.x) && isFinite(+v.z) ? { x: +v.x, z: +v.z } : null;
  }
  function referenceKind(meta) {
    var r = String((meta && meta.reference) || '').toLowerCase();
    if (r === 'none' || r === 'direction' || r === 'point' || r === 'object') return r;
    return meta && meta.spatial ? 'point' : 'none';
  }
  function orientationSeconds(envelope, scale, h) {
    var r = envelope.reference;
    if (r === 'direction') return (TUNING.ORIENT_DIRECTION + h * TUNING.ORIENT_DIRECTION_SPREAD) * scale;
    if (r === 'point') return (TUNING.ORIENT_POINT + h * TUNING.ORIENT_POINT_SPREAD) * scale;
    if (r === 'object') return (TUNING.ORIENT_OBJECT + h * TUNING.ORIENT_OBJECT_SPREAD) * scale;
    return 0;
  }
  function copyData(v) {
    if (!v || typeof v !== 'object') return null;
    var out = {};
    Object.keys(v).forEach(function (k) {
      var x = v[k];
      if (x == null || typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') out[k] = x;
    });
    return out;
  }
  function pos(v) {
    return v && v.root && v.root.position ? point(v.root.position) : null;
  }
  function distance(a, b) {
    if (!a || !b) return null;
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function leaderOf(sq) {
    var S = root.SquadAI;
    if (S && typeof S.leaderOf === 'function') return S.leaderOf(sq);
    var m = (sq && sq.members) || [];
    for (var i = 0; i < m.length; i++)
      if (m[i] && !m[i].dead && S && S.isLeader && S.isLeader(m[i])) return m[i];
    return null;
  }
  function squadKey(sq) {
    return String((sq && sq.faction) || '?') + ':' + String((sq && sq.id) || '?');
  }
  function battleState(battle) {
    if (!ON || !battle) return null;
    return (
      battle._commandReception ||
      (battle._commandReception = {
        format: FORMAT,
        serial: 0,
        versions: Object.create(null),
        current: Object.create(null),
        bySoldier: Object.create(null),
        adoptedBySoldier: Object.create(null),
        recent: [],
        counts: {
          envelopes: 0,
          recipients: 0,
          adopted: 0,
          byCategory: Object.create(null),
          byChannel: Object.create(null),
          reachable: 0,
          relayed: 0,
          unreachable: 0,
          latencySum: 0,
          latencyMax: 0
        }
      })
    );
  }
  function recognitionScale(s) {
    var scale = 1,
      St = root.BattleSoldierStats,
      M = root.BattleSoldierMind;
    if (St && typeof St.scale === 'function') scale *= Math.max(0.25, +St.scale(s, 'recognition') || 1);
    if (M && typeof M.reactScale === 'function') scale *= Math.max(0.25, +M.reactScale(s) || 1);
    return scale;
  }
  function liveRecipients(list) {
    var out = [],
      seen = Object.create(null),
      m = list || [];
    for (var i = 0; i < m.length; i++) {
      var s = m[i],
        id = s && s.id != null ? String(s.id) : '';
      if (!s || s.dead || s.isPlayer || !id || seen[id]) continue;
      seen[id] = 1;
      out.push(s);
    }
    return out;
  }
  function stage(rec, now) {
    if (rec.unreachable) return 'unreachable';
    if (now + 1e-9 < rec.receivedAt) return 'issued';
    if (now + 1e-9 < rec.processedAt) return 'received';
    if (now + 1e-9 < rec.adoptedAt) return rec.needsOrientation ? 'orienting' : 'processing';
    return 'adopted';
  }
  function teamKeyFor(s) {
    var Q = root.BattleSquadStability;
    if (Q && typeof Q.teamKeyFor === 'function') return Q.teamKeyFor(s);
    return (s && s._fireteamKey) || null;
  }
  function relayFor(sq, soldier, sender) {
    if (!sq || !soldier) return null;
    var key = teamKeyFor(soldier);
    if (!key || key === 'command') return null;
    var a = (sq.members || [])
      .filter(function (s) {
        return s && !s.dead && !s.isPlayer && teamKeyFor(s) === key;
      })
      .sort(function (a, b) {
        var slot = (+a.slotIndex || 0) - (+b.slotIndex || 0);
        if (slot) return slot;
        var ai = String(a.id),
          bi = String(b.id);
        return ai < bi ? -1 : ai > bi ? 1 : 0;
      });
    var relay = a[0] || null;
    if (!relay || relay === soldier || relay === sender) return null;
    return relay;
  }
  function visualClear(a, b, battle) {
    var S = root.SquadAI;
    if (!a || !b) return false;
    if (S && typeof S.hasLineOfSight === 'function') {
      try {
        return !!S.hasLineOfSight(a, b, battle && battle.heightAt, battle && battle.obstacles);
      } catch (_) {
        return false;
      }
    }
    return true;
  }
  function transport(envelope, from, to, battle, start) {
    var a = pos(from),
      b = pos(to),
      d = distance(a, b),
      self = !!(from && to && String(from.id) === String(to.id));
    if (self) return { kind: 'self', at: start, distance: 0 };
    if (d == null) return null;
    if (d <= TUNING.VOICE_RANGE)
      return {
        kind: 'voice',
        at:
          start +
          (envelope.reference === 'none' ? TUNING.SPEAK_SIMPLE : TUNING.SPEAK_SPATIAL) +
          d / TUNING.SOUND,
        distance: d
      };
    if (d <= TUNING.VISUAL_RANGE && visualClear(from, to, battle))
      return { kind: 'visual', at: start + TUNING.VISUAL_SIGNAL, distance: d };
    return null;
  }
  function recipientTiming(envelope, soldier, from, battle, start, suffix) {
    var id = String(soldier.id),
      hop = transport(envelope, from, soldier, battle, start);
    if (!hop) return null;
    var self = hop.kind === 'self',
      h1 = hash01(envelope.id, id + ':attention' + suffix),
      h2 = hash01(envelope.id, id + ':process' + suffix),
      h3 = hash01(envelope.id, id + ':orient' + suffix),
      receive = hop.at + (self ? 0 : TUNING.ATTENTION + h1 * TUNING.ATTENTION_SPREAD),
      scale = recognitionScale(soldier),
      processed = receive + (TUNING.PROCESS + h2 * TUNING.PROCESS_SPREAD) * scale,
      orient = orientationSeconds(envelope, scale, h3);
    return {
      channel: hop.kind,
      distance: hop.distance,
      receivedAt: receive,
      processedAt: processed,
      adoptedAt: processed + orient,
      orientationSeconds: orient
    };
  }
  function legacyTiming(envelope, soldier, sender, battle) {
    var id = String(soldier.id),
      from = pos(sender),
      to = pos(soldier),
      d = distance(from, to),
      self = !!(sender && String(sender.id) === id),
      h1 = hash01(envelope.id, id + ':attention'),
      h2 = hash01(envelope.id, id + ':process'),
      h3 = hash01(envelope.id, id + ':orient'),
      speak = self ? 0 : envelope.reference === 'none' ? TUNING.SPEAK_SIMPLE : TUNING.SPEAK_SPATIAL,
      travel = self || d == null ? 0 : d / TUNING.SOUND,
      receive =
        envelope.issuedAt + speak + travel + (self ? 0 : TUNING.ATTENTION + h1 * TUNING.ATTENTION_SPREAD),
      scale = recognitionScale(soldier),
      processed = receive + (TUNING.PROCESS + h2 * TUNING.PROCESS_SPREAD) * scale,
      orient = orientationSeconds(envelope, scale, h3);
    return {
      channel: sender ? 'direct-voice-model' : 'command-model',
      hops: 1,
      relayId: null,
      distance: d,
      receivedAt: receive,
      processedAt: processed,
      adoptedAt: processed + orient,
      orientationSeconds: orient
    };
  }
  function routedTiming(envelope, soldier, sender, battle, sq) {
    if (!sender) return null;
    var relay =
      envelope.reference !== 'none' && envelope.relayPolicy !== 'never'
        ? relayFor(sq, soldier, sender)
        : null;
    if (relay) {
      var first = recipientTiming(envelope, relay, sender, battle, envelope.issuedAt, ':relay');
      if (first) {
        var second = recipientTiming(
          envelope,
          soldier,
          relay,
          battle,
          first.adoptedAt + TUNING.RELAY_PAUSE,
          ':member'
        );
        if (second)
          return {
            channel: first.channel === second.channel ? first.channel + '-relay' : 'mixed-relay',
            hops: 2,
            relayId: String(relay.id),
            relayReceivedAt: first.receivedAt,
            relayReadyAt: first.adoptedAt,
            distance: second.distance,
            receivedAt: second.receivedAt,
            processedAt: second.processedAt,
            adoptedAt: second.adoptedAt,
            orientationSeconds: second.orientationSeconds
          };
      }
    }
    var direct = recipientTiming(envelope, soldier, sender, battle, envelope.issuedAt, ':direct');
    if (!direct) return null;
    direct.channel = direct.channel === 'self' ? 'self-command' : direct.channel + '-direct';
    direct.hops = 1;
    direct.relayId = null;
    return direct;
  }
  function planRecipient(st, envelope, soldier, sender, battle, sq) {
    var id = String(soldier.id),
      timing = RELAY_ON
        ? routedTiming(envelope, soldier, sender, battle, sq)
        : legacyTiming(envelope, soldier, sender, battle),
      unreachable = !timing,
      rec = {
        envelopeId: envelope.id,
        version: envelope.version,
        category: envelope.category,
        scope: envelope.scope,
        action: envelope.action,
        signature: envelope.signature,
        sourceId: envelope.sourceId,
        relayPolicy: envelope.relayPolicy,
        channel: unreachable ? 'unreachable' : timing.channel,
        hops: unreachable ? 0 : timing.hops,
        relayId: unreachable ? null : timing.relayId,
        relayReceivedAt: unreachable
          ? null
          : timing.relayReceivedAt == null
            ? null
            : +timing.relayReceivedAt.toFixed(3),
        relayReadyAt: unreachable
          ? null
          : timing.relayReadyAt == null
            ? null
            : +timing.relayReadyAt.toFixed(3),
        issuedAt: envelope.issuedAt,
        receivedAt: unreachable ? null : +timing.receivedAt.toFixed(3),
        processedAt: unreachable ? null : +timing.processedAt.toFixed(3),
        adoptedAt: unreachable ? null : +timing.adoptedAt.toFixed(3),
        legacyExecutionAt: envelope.issuedAt,
        distance: unreachable || timing.distance == null ? null : +timing.distance.toFixed(2),
        reference: envelope.reference,
        needsOrientation: envelope.reference !== 'none',
        orientationSeconds: unreachable ? 0 : +timing.orientationSeconds.toFixed(3),
        point: envelope.point ? { x: envelope.point.x, z: envelope.point.z } : null,
        data: copyData(envelope.data),
        unreachable: unreachable,
        phase: unreachable ? 'unreachable' : 'issued',
        countedAdopted: false
      },
      slot = envelope.category + '|' + envelope.scope,
      by = st.bySoldier[id] || (st.bySoldier[id] = Object.create(null));
    if (!unreachable) rec.phase = stage(rec, +battle.time || 0);
    by[slot] = rec;
    st.counts.recipients++;
    st.counts.byChannel[rec.channel] = (st.counts.byChannel[rec.channel] || 0) + 1;
    if (unreachable) st.counts.unreachable++;
    else {
      var latency = timing.adoptedAt - envelope.issuedAt;
      st.counts.reachable++;
      if (timing.hops > 1) st.counts.relayed++;
      st.counts.latencySum += latency;
      st.counts.latencyMax = Math.max(st.counts.latencyMax, latency);
    }
    return rec;
  }
  function publish(sq, battle, category, recipients, meta) {
    if (!ON || !sq || !battle) return null;
    meta = meta || {};
    var st = battleState(battle),
      scope = String(meta.scope || 'squad'),
      key = squadKey(sq) + '|' + String(category || 'command') + '|' + scope,
      signature = String(meta.signature || meta.action || 'command'),
      current = st.current[key];
    if (current && current.signature === signature) {
      settle(battle);
      return current;
    }
    var version = (st.versions[key] || 0) + 1;
    st.versions[key] = version;
    var sender = meta.sender || leaderOf(sq),
      envelope = {
        id: 'cmd-' + ++st.serial,
        squad: squadKey(sq),
        category: String(category || 'command'),
        scope: scope,
        action: String(meta.action || category || 'command'),
        version: version,
        signature: signature,
        issuedAt: +battle.time || 0,
        sourceId: sender && sender.id != null ? String(sender.id) : null,
        reason: meta.reason || null,
        relayPolicy: meta.relay === false || meta.relay === 'never' ? 'never' : 'auto',
        reference: referenceKind(meta),
        spatial: referenceKind(meta) !== 'none',
        point: point(meta.point),
        data: copyData(meta.data),
        recipients: []
      },
      men = liveRecipients(recipients || sq.members);
    st.current[key] = envelope;
    st.counts.envelopes++;
    st.counts.byCategory[envelope.category] = (st.counts.byCategory[envelope.category] || 0) + 1;
    for (var i = 0; i < men.length; i++) {
      planRecipient(st, envelope, men[i], sender, battle, sq);
      envelope.recipients.push(String(men[i].id));
    }
    st.recent.push({
      id: envelope.id,
      squad: envelope.squad,
      category: envelope.category,
      scope: envelope.scope,
      action: envelope.action,
      version: envelope.version,
      issuedAt: envelope.issuedAt,
      sourceId: envelope.sourceId,
      reason: envelope.reason,
      relayPolicy: envelope.relayPolicy,
      reference: envelope.reference,
      spatial: envelope.spatial,
      point: envelope.point,
      data: copyData(envelope.data),
      recipients: envelope.recipients.slice()
    });
    if (st.recent.length > TUNING.LOG) st.recent.splice(0, st.recent.length - TUNING.LOG);
    return envelope;
  }
  function publicRecord(rec) {
    if (!rec) return null;
    var out = Object.assign({}, rec);
    delete out.countedAdopted;
    out.data = copyData(rec.data);
    if (rec.point) out.point = { x: rec.point.x, z: rec.point.z };
    return out;
  }
  function settle(battle) {
    var st = battle && battle._commandReception;
    if (!ON || !st) return st || null;
    var now = +battle.time || 0;
    /* Cache: settle iterates all soldiers x all slots. With posture on, fireControlOf calls
       adopted() per-soldier per-tick, which called settle() each time — O(N^2) per tick.
       The stage transitions only depend on (rec, now), so one settle per battle.time is enough. */
    if (st.settledAt === now) return st;
    st.settledAt = now;
    var ids = Object.keys(st.bySoldier);
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i],
        by = st.bySoldier[id],
        slots = Object.keys(by),
        active = st.adoptedBySoldier[id] || (st.adoptedBySoldier[id] = Object.create(null));
      for (var j = 0; j < slots.length; j++) {
        var slot = slots[j],
          rec = by[slot],
          next = stage(rec, now);
        rec.phase = next;
        if (next === 'adopted' && !rec.countedAdopted) {
          rec.countedAdopted = true;
          st.counts.adopted++;
          active[slot] = publicRecord(rec);
        }
      }
    }
    return st;
  }
  function adopted(soldier, battle, category, scope) {
    if (!ON || !soldier || !battle) return null;
    var st = settle(battle),
      by = st && st.adoptedBySoldier[String(soldier.id)],
      slot = String(category || 'command') + '|' + String(scope || 'squad');
    return by && by[slot] ? publicRecord(by[slot]) : null;
  }
  // Issuer-side acknowledgement query. No settlement/copy of every soldier is needed:
  // execution can acknowledge only the latest personally published envelope.
  function executionCurrent(soldier, battle, category, scope, envelopeId) {
    var st = battle && battle._commandReception,
      by = st && soldier && st.bySoldier[String(soldier.id)],
      rec = by && by[String(category || 'command') + '|' + String(scope || 'squad')];
    return !!(rec && rec.envelopeId === envelopeId);
  }
  function snapshot(soldier, battle) {
    if (!ON || !soldier || !battle) return null;
    var st = settle(battle),
      id = String(soldier.id),
      by = st && st.bySoldier[id],
      active = st && st.adoptedBySoldier[id],
      out = {},
      adoptedOut = {};
    if (by)
      Object.keys(by).forEach(function (k) {
        out[k] = publicRecord(by[k]);
      });
    if (active)
      Object.keys(active).forEach(function (k) {
        adoptedOut[k] = publicRecord(active[k]);
      });
    return {
      enabled: true,
      postureAdoption: POSTURE_ON,
      movementAdoption: MOVEMENT_ON,
      relayTopology: RELAY_ON,
      records: out,
      adopted: adoptedOut
    };
  }
  function squadSnapshot(sq, battle) {
    if (!ON || !sq || !battle) return null;
    var st = settle(battle),
      prefix = squadKey(sq) + '|',
      out = [];
    Object.keys(st.current).forEach(function (k) {
      if (k.indexOf(prefix) !== 0) return;
      var e = st.current[k];
      out.push({
        id: e.id,
        category: e.category,
        scope: e.scope,
        action: e.action,
        version: e.version,
        signature: e.signature,
        issuedAt: e.issuedAt,
        sourceId: e.sourceId,
        reason: e.reason,
        relayPolicy: e.relayPolicy,
        reference: e.reference,
        spatial: e.spatial,
        point: e.point,
        data: copyData(e.data),
        recipients: e.recipients.slice()
      });
    });
    return out;
  }
  function telemetry(battle) {
    if (!ON || !battle) return null;
    var st = settle(battle);
    if (!st) return null;
    var c = st.counts;
    return {
      format: FORMAT,
      behaviorNeutral: !(POSTURE_ON || MOVEMENT_ON),
      postureAdoption: POSTURE_ON,
      movementAdoption: MOVEMENT_ON,
      relayTopology: RELAY_ON,
      envelopes: c.envelopes,
      recipients: c.recipients,
      adopted: c.adopted,
      byCategory: Object.assign({}, c.byCategory),
      byChannel: Object.assign({}, c.byChannel),
      reachable: c.reachable,
      relayed: c.relayed,
      unreachable: c.unreachable,
      meanPlannedLatency: c.reachable ? +(c.latencySum / c.reachable).toFixed(3) : 0,
      maxPlannedLatency: +c.latencyMax.toFixed(3),
      recent: st.recent.slice(-40)
    };
  }
  function reset(battle) {
    if (battle) delete battle._commandReception;
  }

  if (root.BattleModules)
    root.BattleModules.registerSystem('command-reception', {
      version: '0D2-relay-topology',
      onBattleStart: reset,
      onBattleRestart: reset,
      onSimulationStep: settle
    });

  root.BattleCommandReception = {
    version: '0D2-relay-topology',
    enabled: function () {
      return ON;
    },
    postureEnabled: function () {
      return POSTURE_ON;
    },
    movementEnabled: function () {
      return MOVEMENT_ON;
    },
    relayEnabled: function () {
      return RELAY_ON;
    },
    tuning: TUNING,
    publish: publish,
    settle: settle,
    adopted: adopted,
    executionCurrent: executionCurrent,
    snapshot: snapshot,
    squadSnapshot: squadSnapshot,
    telemetry: telemetry,
    reset: reset
  };
  if (typeof console !== 'undefined')
    root.GTLog(
      '[COMMAND] individual receipt ' +
        (ON ? 'active' : 'off') +
        '; posture ' +
        (POSTURE_ON ? 'on' : 'off') +
        '; movement ' +
        (MOVEMENT_ON ? 'on' : 'off') +
        '; relay ' +
        (RELAY_ON ? 'on' : 'off')
    );
})(typeof window !== 'undefined' ? window : globalThis);
