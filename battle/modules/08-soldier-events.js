/* Soldier events: one queue per man, one declared vocabulary, fixed priorities.

   What happens to a man used to reach the layer that reads it by several roads: a slot call (`aimedAt`),
   a shared log each reader walked with its own cursor (casualties), a timestamp the reader polled
   (`suppressedUntil`) and a list whose length the reader compared with its last count (`wounds`). Each
   was right; none could be listed, ordered or extended without reading every reader. This module is the
   one road. A producer posts an event about a man; the layer that reads it drains its own kinds, in
   priority order, at its own tick.

   Owner: this module writes `soldier._eventQueue` and the casualty log; nothing else does. A producer
   posts what its own writer already computed (a suppression event carries the `until` `SquadAI.pin`
   set after the fortitude scale, never a recomputation); a reader decides what an event costs the man.
   It draws nothing from the combat RNG and writes no stance, destination, target or timer.

   Order: a reader drains by priority (the numbers in KINDS), then by posting order. The priorities
   reproduce the order in which the soldier's condition (module 17) used to add what it lived through:
   what happened around him, then to him, then the fire on him. A kind nobody reads is not queued
   (`?mind=0` queues nothing), so a queue never grows for want of a reader. The queue is bounded: past
   CAPACITY the lowest-priority, oldest event is dropped and counted (`stats(battle).dropped`).

   Kinds:
     casualty   0  a man of his side went down within `reach`; posted by `announceCasualties` (once per AI
                   time, from the readers' tick), payload {id, faction, squad, x, z, leader, unit}
     wound      1  a hit he survived; posted by the wound model, payload {count}
     suppressed 2  pinned until `until`; posted by SquadAI.pin, payload {until, seconds}
     aimed      3  a trigger pull had him as its target; posted from SquadAI's `aimedAt` slot,
                   payload {from, rounds, d}
   Relief (read by the soldier condition only behind `?stressMem=relief`; each is something that went well for him):
     kill       4  he put a man down; posted by the wound model to the shooter, payload {victim, zone}
     objective  5  his side took an objective he stood in; posted by the capture zone, payload {objective}
     cover      6  he reached cover while under fire; posted by Engagement, payload {seconds}
     survived   7  a spell of fire on him ended and it did not wound him; posted by Engagement, payload {seconds}
   Not queued: the urgent status (`_combatUrgentUntil`), a timestamp module 11 and 44 poll, has no reader
   that wants an event. It joins when one does (the callout channel). */
(function (root) {
  'use strict';
  if (!root.SquadAI || !root.BattleModules || root.BattleSoldierEvents) return;

  var KINDS = {
    // reach: the reader's furthest (the leader heard within 60 m) plus a man's step inside one AI tick
    casualty: {
      priority: 0,
      reach: 62,
      producer: 'announceCasualties',
      payload: 'id, faction, squad, x, z, leader, unit'
    },
    wound: { priority: 1, producer: 'wound model', payload: 'count' },
    suppressed: { priority: 2, producer: 'SquadAI.pin', payload: 'until, seconds' },
    aimed: { priority: 3, producer: 'SquadAI aimedAt slot', payload: 'from, rounds, d' },
    kill: { priority: 4, producer: 'wound model', payload: 'victim, zone' },
    objective: { priority: 5, producer: 'capture zone', payload: 'objective' },
    cover: { priority: 6, producer: 'Engagement', payload: 'seconds' },
    survived: { priority: 7, producer: 'Engagement', payload: 'seconds' }
  };
  var CAPACITY = 128,
    readers = {}; // kind -> { readerId: true }

  function shared(battle) {
    return (
      battle._soldierEvents ||
      (battle._soldierEvents = { log: [], scanAt: -1, casualties: 0, dropped: 0, posted: 0 })
    );
  }
  /* A layer that reads a kind says so once, at load; an event with no reader is not queued. */
  function subscribe(reader, kinds) {
    for (var i = 0; i < kinds.length; i++) {
      if (!KINDS[kinds[i]]) throw new Error('unknown soldier event kind: ' + kinds[i]);
      (readers[kinds[i]] || (readers[kinds[i]] = {}))[reader] = true;
    }
  }
  function wanted(kind) {
    if (!KINDS[kind]) throw new Error('unknown soldier event kind: ' + kind);
    return !!readers[kind];
  }
  function post(s, battle, kind, payload) {
    if (!wanted(kind) || !s || s.dead) return false;
    var q = s._eventQueue || (s._eventQueue = []),
      st = shared(battle),
      ev = {
        kind: kind,
        priority: KINDS[kind].priority,
        seq: st.posted++,
        at: +battle.time || 0,
        data: payload
      };
    if (q.length >= CAPACITY) {
      var drop = 0;
      for (var i = 1; i < q.length; i++) if (q[i].priority > q[drop].priority) drop = i;
      q.splice(drop, 1);
      st.dropped++;
    }
    q.push(ev);
    return true;
  }
  /* The reader takes its own kinds out, in priority order then posting order, and handles each. */
  function drain(s, reader, handle) {
    var q = s._eventQueue;
    if (!q || !q.length) return 0;
    var mine = [],
      rest = [],
      i;
    for (i = 0; i < q.length; i++)
      (readers[q[i].kind] && readers[q[i].kind][reader] ? mine : rest).push(q[i]);
    if (!mine.length) return 0;
    s._eventQueue = rest;
    mine.sort(function (a, b) {
      return a.priority - b.priority || a.seq - b.seq;
    });
    for (i = 0; i < mine.length; i++) handle(mine[i].kind, mine[i].data, mine[i].at);
    return mine.length;
  }
  function pending(s) {
    return s && s._eventQueue ? s._eventQueue.length : 0;
  }

  function wasLeader(s) {
    var q = s.squad;
    return !!q && (q.leaderId != null ? q.leaderId === s.id : s.role === 'sergeant');
  }
  /* One pass per AI time over the rosters: every man who has newly gone down (dead or incapacitated,
     both go through killSoldier) is logged once, where he lies, and announced to each living man of his
     side within `reach`. Whether it matters to that man (distance, sight, squad) is the reader's call. */
  function announceCasualties(battle, now) {
    var st = shared(battle);
    if (st.scanAt === now) return;
    st.scanAt = now;
    var sides = ['us', 'ge'];
    for (var f = 0; f < sides.length; f++) {
      var roster = (battle.rosterOf && battle.rosterOf(sides[f])) || [];
      for (var i = 0; i < roster.length; i++) {
        var s = roster[i];
        if (!s || !s.dead || !s.root || s._casualtyLogged) continue;
        s._casualtyLogged = true;
        st.casualties++;
        var c = {
          id: s.id,
          faction: s.faction,
          squad: s.squad ? s.squad.id : null,
          x: s.root.position.x,
          z: s.root.position.z,
          at: now,
          leader: wasLeader(s),
          unit: s
        };
        st.log.push(c);
        if (!wanted('casualty')) continue;
        var near = KINDS.casualty.reach * KINDS.casualty.reach;
        for (var j = 0; j < roster.length; j++) {
          var o = roster[j];
          if (!o || o.dead || !o.root) continue; // the fallen is dead, so he is never his own witness
          var dx = o.root.position.x - c.x,
            dz = o.root.position.z - c.z;
          if (dx * dx + dz * dz <= near) post(o, battle, 'casualty', c);
        }
      }
    }
  }

  function reset(sim) {
    sim._soldierEvents = null;
    var units = root.BattleModules.unitsFor(sim);
    for (var i = 0; i < units.length; i++) {
      units[i]._eventQueue = null;
      units[i]._casualtyLogged = false;
    }
  }
  root.SquadAI.extend('aimedAt', 'soldier-events', function (victim, battle, info) {
    if (!victim || victim.dead || !victim.squad || !info) return;
    post(victim, battle, 'aimed', info);
  });
  root.BattleModules.registerSystem('soldier-events', {
    version: '1.0',
    onBattleStart: reset,
    onBattleRestart: reset
  });
  root.BattleSoldierEvents = {
    version: '1.0',
    KINDS: KINDS,
    capacity: CAPACITY,
    subscribe: subscribe,
    post: post,
    wanted: wanted,
    drain: drain,
    pending: pending,
    announceCasualties: announceCasualties,
    reset: reset,
    stats: shared
  };
})(typeof window !== 'undefined' ? window : globalThis);
