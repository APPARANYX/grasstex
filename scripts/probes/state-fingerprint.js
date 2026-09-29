/* Exact legacy AI state and combat event times for neutral-refactor comparisons. Observe only:
   the fire callback is chained without changing arguments or drawing random numbers. The snapshot
   also works without starting the probe, so run_probe's probe-free control compares the same state.
   Presentation clocks/rigs and additive transition diagnostics are deliberately outside the schema. */
(function (root) {
  'use strict';
  var events, seenDead;
  var OMIT = new Set([
    'walkPhase',
    'voiceCooldown',
    'stanceBlend',
    'deathClock',
    'deathVariant',
    'deathSide',
    'deathTag',
    '_animFireKick',
    '_animReloadClock',
    '_stanceSupport',
    // The event queue's own bookkeeping (modules/08-soldier-events.js), absent before it existed.
    '_casualtyLogged'
  ]);
  /* Bookkeeping of the soldier-condition module that depends on WHEN an event is read, not on what
     happened: the log cursor and logged flag went with the queue; the fields below mirror what the
     queue holds until the man's next tick. What they cause (stress, gains, band time, shocks) is
     compared exactly. */
  var MIND_TIMING = [
    'cursor',
    'logged',
    'pinnedUntil',
    'incoming',
    'incomingRounds',
    'lastIncomingAt',
    'wounds'
  ];
  var SOLDIER_OBJECTS = [
    'eng',
    'mind',
    'weapon',
    'secondary',
    'destination',
    'orderDestination',
    '_movementResolver',
    '_movementProgress',
    '_movementOrder',
    '_movementRecovery',
    '_tacticalRoute',
    '_ammoState',
    '_wounds',
    'wounds',
    '_navPath',
    '_navGoal',
    '_bound',
    '_physicalPoint'
  ];
  function scalar(value) {
    return value === null || ['string', 'number', 'boolean'].indexOf(typeof value) >= 0;
  }
  function exact(value) {
    return typeof value === 'number' && !Number.isFinite(value) ? { number: String(value) } : value;
  }
  function plain(value, seen, at) {
    if (scalar(value)) return exact(value);
    if (typeof value !== 'object') return undefined;
    if (value.root && value.squad && value.id != null) return { soldier: value.id };
    if (Array.isArray(value.members) && value.faction && value.id != null) return { squad: value.id };
    seen = seen || new Set();
    if (seen.has(value)) return '[cycle]';
    var proto = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && proto !== Object.prototype && proto !== null) return undefined;
    seen.add(value);
    var out = Array.isArray(value) ? [] : {};
    Object.keys(value)
      .sort()
      .forEach(function (key) {
        // The only simulation `transition` records are the Phase 1 diagnostics. Mission objects can
        // also appear through _lastMacroMission and _missionExecution, so omit the record by name
        // wherever the same object is reached. Legacy since/until/status remain exact.
        if (key === 'transition') return;
        var item = plain(value[key], seen, at ? at + '.' + key : key);
        if (item !== undefined) out[key] = item;
      });
    seen.delete(value);
    return out;
  }
  function primitives(object) {
    var out = {};
    Object.keys(object)
      .sort()
      .forEach(function (key) {
        if (
          !OMIT.has(key) &&
          !/^_?(?:fbx|anim|pose|stanceVisual|voice|callout)/i.test(key) &&
          scalar(object[key])
        )
          out[key] = exact(object[key]);
      });
    return out;
  }
  function soldier(s) {
    var out = primitives(s);
    out.position = s.root ? [s.root.position.x, s.root.position.y, s.root.position.z] : null;
    out.yaw = s.root ? s.root.rotation.y : null;
    out.squad = s.squad ? s.squad.id : null;
    out.target = s.target ? s.target.id : null;
    SOLDIER_OBJECTS.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(s, key)) out[key] = plain(s[key], null, key);
    });
    if (out.mind)
      MIND_TIMING.forEach(function (key) {
        delete out.mind[key];
      });
    return out;
  }
  function squad(sq) {
    var out = {};
    Object.keys(sq)
      .sort()
      .forEach(function (key) {
        if (key === '_commandPhaseTransition') return;
        if (key === 'members')
          out.members = sq.members.map(function (s) {
            return s.id;
          });
        else {
          var value = plain(sq[key], null, key);
          if (value !== undefined) out[key] = value;
        }
      });
    return out;
  }
  function snapshot(sim) {
    var factions = {};
    ['us', 'ge'].forEach(function (side) {
      var f = sim.factions[side];
      factions[side] = { alive: f.alive, kills: f.kills, squads: f.squads.map(squad) };
    });
    return {
      schema: 1,
      time: sim.time,
      winner: sim.winner || null,
      winReason: sim.winReason || null,
      factions: factions,
      soldiers: (sim._roster.us || []).concat(sim._roster.ge || []).map(soldier),
      objectives: plain(sim.objectiveControl),
      ammunition: root.BattleAmmunition ? root.BattleAmmunition.summary(sim) : null
    };
  }
  root.BattleStateFingerprint = { snapshot: snapshot };
  (root.BattleProbes = root.BattleProbes || {})['state-fingerprint'] = {
    every: 0,
    start: function (sim) {
      events = { fire: [], deaths: [] };
      seenDead = new Set();
      var old = sim.onFire;
      sim.onFire = function (s, delay) {
        events.fire.push([sim.time, s.id, s.weapon.kind, delay || 0]);
        if (old) return old.apply(this, arguments);
      };
    },
    sample: function (sim) {
      (sim._roster.us || []).concat(sim._roster.ge || []).forEach(function (s) {
        if (s.dead && !seenDead.has(s.id)) {
          seenDead.add(s.id);
          events.deaths.push([sim.time, s.id]);
        }
      });
    },
    report: function (sim) {
      return { state: snapshot(sim), events: events };
    }
  };
})(window);
