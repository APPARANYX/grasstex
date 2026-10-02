/* Voice observations: the scripted lines of PR #170 (shotsHeard ... fallBackByTeams in Assets/audio/manifest.json),
   each tied to the simulation state that should make a man say it.

   Presentation only, like module 47 (whose `BattleContextVoice.say` it speaks through, with the same cooldowns): it
   samples the battle every SAMPLE simulated seconds, compares what it reads with what it read last time, and speaks
   on the change. It never draws from the combat RNG (every chance is a hash of the seed, the squad or man and the
   simulated second), never writes a squad, a soldier, an Engagement record or `mind`, and keeps its own memory in
   `sim._voiceObs`. Dormant without the audio manifest (headless runs, the harness). It does not read `mind` or
   `BattleSoldierMind`: stress is seen only as what Engagement made of it (cower, freeze, flee, rage). */
(function (root) {
  'use strict';
  if (!root.BattleModules || !root.BattleContextVoice || root.BattleVoiceObservations) return;

  var SYSTEM = 'voice-observations';
  var SAMPLE = 0.45,
    CLOSE = 30, // m: an enemy this close is "right there"
    SNIPER_RANGE = 200, // m: a wound from a scout this far off is a sniper
    QUIET = 12, // s out of contact before the squad stands down
    BUNCHED = 2.2, // m: mean nearest-neighbour distance that is bunching up
    STRUNG = 40, // m: a man this far from the squad's centre on the march is strung out
    NEAR_MISS = 3, // m: a man this close to a mate who was hit
    WOUNDED_FRIEND = 10, // m
    ENEMY_RUN_RANGE = 150, // m
    OBJECTIVE_RANGE = 120; // m

  function V() {
    return root.BattleContextVoice;
  }
  function hash(s) {
    s = String(s);
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function chance(sim, k, p) {
    var sc = sim && sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario;
    return hash(((sc && sc.seed) || 'battle') + '|obs|' + k) / 4294967296 < p;
  }
  function alive(sq) {
    return ((sq && sq.members) || []).filter(function (s) {
      return s && !s.dead && s.root;
    });
  }
  function leader(sq) {
    var l = root.SquadAI && root.SquadAI.leaderOf ? root.SquadAI.leaderOf(sq) : null;
    return l && !l.dead && l.root ? l : null;
  }
  function isLeader(s) {
    return !!(root.SquadAI && root.SquadAI.isLeader && root.SquadAI.isLeader(s));
  }
  function pos(s) {
    return s && s.root && s.root.position;
  }
  function dist(a, b) {
    return a && b ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity;
  }
  function centre(list) {
    if (!list.length) return null;
    var x = 0,
      z = 0;
    list.forEach(function (s) {
      x += pos(s).x;
      z += pos(s).z;
    });
    return { x: x / list.length, z: z / list.length };
  }
  function engState(s) {
    try {
      var e =
        root.BattleEngagement && root.BattleEngagement.stateOf ? root.BattleEngagement.stateOf(s) : s.eng;
      return String((e && e.state) || '');
    } catch (_) {
      return String((s.eng && s.eng.state) || '');
    }
  }
  function isMG(s) {
    return !!(s && root.SquadAI && root.SquadAI.isMachineGun && root.SquadAI.isMachineGun(s));
  }
  /* One of the squad: not `exclude`, the non-leaders first, chosen by a hash. */
  function someone(sq, seed, exclude) {
    var a = alive(sq).filter(function (s) {
        return s !== exclude && !isLeader(s);
      }),
      pool = a.length
        ? a
        : alive(sq).filter(function (s) {
            return s !== exclude;
          });
    return pool.length ? pool[hash(sq.id + '|' + seed) % pool.length] : null;
  }
  function nearestMate(s, range, exclude) {
    var best = null,
      bd = range;
    alive(s.squad).forEach(function (o) {
      if (o === s || o === exclude) return;
      var d = dist(pos(o), pos(s));
      if (d <= bd) {
        bd = d;
        best = o;
      }
    });
    return best;
  }
  function say(sim, s, event, cooldown) {
    return !!(s && V().say(sim, s, event, { cooldown: cooldown == null ? 8 : cooldown }));
  }

  function state(sim) {
    return (
      sim._voiceObs ||
      (sim._voiceObs = {
        squads: Object.create(null),
        men: Object.create(null),
        next: 0,
        objectives: Object.create(null)
      })
    );
  }
  function squadMemo(sim, sq) {
    var all = state(sim).squads,
      k = sq.faction + ':' + sq.id;
    return (
      all[k] ||
      (all[k] = {
        seen: false,
        phase: null,
        fc: null,
        fcSince: 0,
        waited: false,
        inContact: false,
        quietSince: null,
        hadFire: false,
        lossesInContact: 0,
        heardAt: null,
        calloutId: null,
        closeId: null,
        mgCalledAt: -1e9,
        mgTargetAt: -1e9,
        leaderRef: null,
        leaderless: false,
        living: 0,
        members: 0,
        state: null,
        coa: null,
        brief: null,
        approachSince: null,
        quietCalled: false,
        lastSpread: -1e9,
        lastCloseUp: -1e9,
        lastWatch: -1e9,
        lastHelp: -1e9,
        lostAt: null
      })
    );
  }
  function manMemo(sim, s) {
    var all = state(sim).men,
      k = s.faction + ':' + s.id;
    return all[k] || (all[k] = { seen: false });
  }

  /* The squad as a whole: its orders, its fire control, its contact, what has happened to it. */
  function squadTick(sim, sq, m) {
    var t = +sim.time || 0,
      men = alive(sq),
      lead = leader(sq),
      phase = String(sq.commandPhase || ''),
      fc = (sq.fireControl && sq.fireControl.state) || null,
      c = sq.contact,
      fresh = !!(c && c.unit && t - (+c.at || 0) <= QUIET),
      mid = centre(men),
      brief = sq._macroMission || null;
    if (!m.seen) {
      m.seen = true;
      m.phase = phase;
      m.fc = fc;
      m.leaderRef = lead;
      m.living = men.length;
      m.members = (sq.members || []).length;
      m.state = sq.state;
      m.coa = sq.coa || null;
      m.brief = brief;
      m.inContact = !!sq.inContact;
      if (phase === 'approach') m.approachSince = t;
      return;
    }

    /* Orders: the phase the Squad Leader just entered (module 47 already says regroup, hold and push). */
    if (phase !== m.phase) {
      var k = sq.id + '|phase|' + phase + '|' + Math.floor(t),
        enemyNear = fresh && mid && dist(c, mid) <= 80;
      if (phase === 'approach' && (!m.phase || m.phase === 'reserve' || m.phase === 'regroup'))
        say(sim, lead, 'moveOut', 12);
      else if (phase === 'flank' && chance(sim, k, 0.7)) say(sim, lead, 'flankOrder', 12);
      else if (phase === 'corner-check' && chance(sim, k, 0.7)) say(sim, lead, 'cornerCheck', 12);
      else if (phase === 'clear-town') say(sim, lead, 'clearHouse', 15);
      else if (phase === 'capture') say(sim, lead, 'captureOrder', 15);
      else if (phase === 'reserve') say(sim, lead, 'reserveWait', 20);
      else if (phase === 'defend') say(sim, lead, 'digIn', 15);
      else if (phase === 'assault' && enemyNear && chance(sim, k, 0.6)) say(sim, lead, 'assault', 15);
      m.phase = phase;
      m.approachSince = phase === 'approach' ? t : null;
      m.quietCalled = false;
    }
    if (brief !== m.brief) {
      if (m.brief && brief && sq.state !== 'retreat' && chance(sim, sq.id + '|brief|' + Math.floor(t), 0.5))
        say(sim, lead, 'newOrders', 15);
      m.brief = brief;
    }
    if (phase === 'approach' && !fresh && !sq.inContact) {
      if (!m.quietCalled && m.approachSince != null && t - m.approachSince >= 20) {
        m.quietCalled = true;
        if (chance(sim, sq.id + '|quiet|' + Math.floor(t / 30), 0.5))
          say(sim, lead || someone(sq, 'quiet'), 'moveQuiet', 30);
      }
      if (men.length >= 4 && mid) {
        var nn = 0,
          far = 0;
        men.forEach(function (s) {
          var o = nearestMate(s, 1e9);
          nn += o ? dist(pos(o), pos(s)) : 0;
          far = Math.max(far, dist(pos(s), mid));
        });
        nn /= men.length;
        if (
          nn < BUNCHED &&
          t - m.lastSpread > 60 &&
          chance(sim, sq.id + '|spread|' + Math.floor(t / 10), 0.4)
        ) {
          if (say(sim, lead, 'spreadOut', 60)) m.lastSpread = t;
        } else if (
          far > STRUNG &&
          t - m.lastCloseUp > 60 &&
          chance(sim, sq.id + '|close|' + Math.floor(t / 10), 0.4)
        ) {
          if (say(sim, lead, 'closeUp', 60)) m.lastCloseUp = t;
        }
      }
    }

    /* Fire control: the Squad Leader's hold, preparation, precision shot, reposition and open fire. */
    if (fc !== m.fc) {
      var fk = sq.id + '|fc|' + fc + '|' + Math.floor(t);
      if (fc === 'hold') say(sim, lead, chance(sim, fk, 0.6) ? 'holdFire' : 'takeCover', 10);
      else if (fc === 'precision') say(sim, lead, 'takeTheShot', 10);
      else if (fc === 'reposition') say(sim, lead, 'reposition', 10);
      else if (fc === 'open' && chance(sim, fk, 0.7)) say(sim, lead, 'engage', 10);
      if (m.fc === 'open' && fc === 'hold') say(sim, lead, 'ceaseFire', 10);
      if (fc === 'open') m.hadFire = true;
      m.fc = fc;
      m.fcSince = t;
      m.waited = false;
    } else if (fc === 'hold' && !m.waited && t - m.fcSince >= 2.5) {
      m.waited = true;
      if (chance(sim, sq.id + '|wait|' + Math.floor(m.fcSince), 0.6)) say(sim, lead, 'waitForIt', 10);
    }

    /* What the squad knows of the enemy. */
    if (c && c.unit) {
      if (c.heard && c.at !== m.heardAt && !m.inContact) {
        m.heardAt = c.at;
        if (chance(sim, sq.id + '|heard|' + Math.floor(t / 5), 0.6))
          say(sim, someone(sq, 'heard|' + Math.floor(t)), 'shotsHeard', 15);
      }
      if (c.callout != null && c.callout !== m.calloutId) {
        m.calloutId = c.callout;
        if (chance(sim, sq.id + '|ack|' + c.callout, 0.5))
          say(sim, someone(sq, 'callheard|' + c.callout), 'callHeard', 6);
      }
      if (fresh && mid && dist(c, mid) <= CLOSE && m.closeId !== c.unit.id) {
        m.closeId = c.unit.id;
        say(
          sim,
          (c.seenBy != null &&
            alive(sq).filter(function (s) {
              return String(s.id) === String(c.seenBy);
            })[0]) ||
            someone(sq, 'close|' + c.unit.id),
          'enemyClose',
          10
        );
      }
      if (fresh && isMG(c.unit) && t - m.mgCalledAt > 40) {
        var pinnedMate = men.filter(function (s) {
          return (+s.suppressedUntil || 0) > t;
        })[0];
        if (pinnedMate && say(sim, pinnedMate, 'enemyMG', 20)) m.mgCalledAt = t;
      }
    }
    if (!sq.inContact && !fresh && c && c.unit && !m.lostAt && t - (+c.at || 0) > 6) {
      m.lostAt = c.at;
      if (
        men.filter(function (s) {
          return engState(s) === 'alert';
        }).length &&
        chance(sim, sq.id + '|where|' + Math.floor(c.at), 0.5)
      )
        say(sim, someone(sq, 'where|' + Math.floor(t)), 'whereAreThey', 20);
    }
    if (fresh) m.lostAt = null;
    var alert = men.filter(function (s) {
      return engState(s) === 'alert';
    }).length;
    if (
      men.length >= 3 &&
      alert * 2 >= men.length &&
      t - m.lastWatch > 40 &&
      chance(sim, sq.id + '|watch|' + Math.floor(t / 10), 0.5)
    ) {
      if (say(sim, lead, 'watchSectors', 40)) m.lastWatch = t;
    }

    /* In and out of contact: stand down once it has been quiet for a while. */
    if (sq.inContact) {
      m.inContact = true;
      m.quietSince = null;
    } else if (m.inContact) {
      if (m.quietSince == null) m.quietSince = t;
      else if (t - m.quietSince >= QUIET && !fresh) {
        m.inContact = false;
        m.quietSince = null;
        var who = lead || someone(sq, 'clear');
        if (m.hadFire && chance(sim, sq.id + '|cease|' + Math.floor(t), 0.5)) say(sim, who, 'ceaseFire', 20);
        else say(sim, who, 'allClear', 20);
        var after = m.lossesInContact > 0 ? 'soundOff' : 'checkAmmo';
        if (who && chance(sim, sq.id + '|after|' + Math.floor(t), 0.7))
          state(sim).later.push({ sq: sq, s: who, event: after, at: t + 3 });
        m.hadFire = false;
        m.lossesInContact = 0;
      }
    }

    /* Command: succession, a squad cut to pieces, the last man, a rally, men taken in. */
    var living = men.length,
      members = (sq.members || []).length;
    /* Succession: the leader was killed, and a man of the squad has taken over (not a merge). */
    if (m.leaderRef && m.leaderRef.dead) m.leaderless = true;
    if (lead && lead !== m.leaderRef) {
      if (m.leaderless && members === m.members) say(sim, lead, 'takingCommand', 15);
      m.leaderless = false;
    }
    m.leaderRef = lead || m.leaderRef;
    if (living < m.living && m.inContact) m.lossesInContact += m.living - living;
    if ((sq.coa || null) !== m.coa) {
      var est = +sq.establishment || members || 10;
      if (
        sq.coa === 'defend' &&
        1 - living / est >= 0.4 &&
        t - m.lastHelp > 60 &&
        say(sim, lead || someone(sq, 'help'), 'needHelp', 30)
      )
        m.lastHelp = t;
      m.coa = sq.coa || null;
    }
    if (living === 1 && m.living >= 2 && members >= 4 && !sq.fledId) say(sim, men[0], 'lastMan', 30);
    if (sq.state !== m.state) {
      if (m.state === 'retreat' && sq.state !== 'retreat' && !sq.disbanded) say(sim, lead, 'rallied', 20);
      else if (sq.state === 'retreat' && sq.inContact && !sq.fledId) say(sim, lead, 'fallBackByTeams', 20);
      m.state = sq.state;
    }
    if (members > m.members && m.members > 0 && !sq.fledId) {
      if (members - m.members === 1 && sq.state === 'retreat')
        say(sim, lead || someone(sq, 'pickup'), 'pickUp', 15);
      else say(sim, lead, 'reinforced', 20);
    }
    m.living = living;
    m.members = members;
  }

  /* One man: what Engagement made of him, his wounds, his weapon. */
  function manTick(sim, s, m, bounding) {
    var t = +sim.time || 0,
      st = engState(s),
      w = s.weapon,
      e = s.eng || {},
      kind = w ? w.kind : null,
      k = s.faction + s.id + '|' + Math.floor(t);
    if (!m.seen) {
      m.seen = true;
      m.state = st;
      m.hp = +s.hp || 0;
      m.jammed = !!(w && w.jammed);
      m.kind = kind;
      m.armed = !!w;
      m.out = !!s.outOfAmmo;
      m.strikeAt = e.strikeAt || 0;
      m.setUp = !!s.setUp;
      m.medic = false;
      return;
    }
    if (st !== m.state) {
      var prev = m.state;
      if (st === 'bound') bounding.push(s);
      if (prev === 'engage' && st === 'alert' && chance(sim, k + '|lost', 0.3)) say(sim, s, 'lostHim', 12);
      else if (st === 'suppress') {
        if (
          isMG(s) &&
          t - squadMemo(sim, s.squad).mgTargetAt > 30 &&
          leader(s.squad) &&
          leader(s.squad) !== s
        ) {
          if (say(sim, leader(s.squad), 'mgTarget', 20)) squadMemo(sim, s.squad).mgTargetAt = t;
        } else if (chance(sim, k + '|sup', 0.25)) say(sim, s, 'suppress', 10);
      } else if (st === 'station' && chance(sim, k + '|win', 0.5)) say(sim, s, 'takeWindow', 15);
      else if (st === 'cower') {
        var lead = leader(s.squad);
        if (chance(sim, k + '|cow', 0.5)) say(sim, s, 'cowering', 10);
        else if (lead && lead !== s && dist(pos(lead), pos(s)) <= 15) say(sim, lead, 'steady', 15);
        else say(sim, nearestMate(s, 10), 'stayDown', 10);
      } else if (st === 'freeze') say(sim, s, 'dazed', 15);
      else if (st === 'flee') {
        say(sim, s, 'breaking', 15);
        enemyRunning(sim, s);
      } else if (st === 'rage') say(sim, s, 'berserk', 10);
      else if (
        prev === 'bound' &&
        (st === 'engage' || st === 'station' || st === 'alert') &&
        (+s.suppressedUntil || 0) > t &&
        chance(sim, k + '|made', 0.4)
      )
        say(sim, s, 'madeIt', 10);
      m.state = st;
    }
    if ((e.strikeAt || 0) !== m.strikeAt) {
      if ((e.strikeAt || 0) > m.strikeAt && chance(sim, k + '|melee', 0.6)) say(sim, s, 'melee', 1.5);
      m.strikeAt = e.strikeAt || 0;
    }
    var hp = +s.hp || 0;
    if (hp < m.hp - 0.5) {
      if (chance(sim, k + '|hit', 0.6)) say(sim, s, 'wounded', 8);
      var mate = nearestMate(s, WOUNDED_FRIEND);
      if (mate && chance(sim, k + '|friend', 0.35)) say(sim, mate, 'woundedFriend', 10);
      sniper(sim, s);
      nearMiss(sim, s, mate);
    }
    if (!m.medic && (+s.bleedRate || 0) > 0.4 && t > (+s.voiceCooldown || 0)) {
      m.medic = true;
      if (chance(sim, k + '|medic', 0.6)) say(sim, s, 'medic', 15);
    }
    m.hp = hp;
    var jammed = !!(w && w.jammed);
    if (jammed !== m.jammed) {
      if (jammed) say(sim, s, 'jammed', 6);
      else if (kind === m.kind && chance(sim, k + '|clr', 0.5)) say(sim, s, 'jamCleared', 6);
      m.jammed = jammed;
    }
    if (!!s.outOfAmmo !== m.out) {
      if (s.outOfAmmo) say(sim, s, 'outOfAmmo', 15);
      m.out = !!s.outOfAmmo;
    }
    if (kind !== m.kind) {
      if (kind === 'pistol' && m.kind && chance(sim, k + '|pistol', 0.5)) say(sim, s, 'sidearm', 10);
      m.kind = kind;
    }
    if (!!w !== m.armed) {
      if (w && st !== 'flee') say(sim, s, 'rearmed', 20);
      m.armed = !!w;
    }
    if (!!s.setUp !== m.setUp) {
      if (s.setUp && isMG(s) && chance(sim, k + '|mg', 0.6)) say(sim, s, 'mgSetUp', 20);
      m.setUp = !!s.setUp;
    }
  }
  /* A wound from a scout far off: a sniper. */
  function sniper(sim, s) {
    var c = s.squad && s.squad.contact,
      u = c && c.unit;
    if (!u || u.dead || (u.role !== 'scout' && u.role !== 'sniper')) return;
    if (dist(pos(u), pos(s)) < SNIPER_RANGE) return;
    say(sim, nearestMate(s, 30) || s, 'sniper', 30);
  }
  function nearMiss(sim, s, except) {
    var t = +sim.time || 0;
    alive(s.squad).forEach(function (o) {
      if (o === s || o === except || dist(pos(o), pos(s)) > NEAR_MISS) return;
      if (chance(sim, o.faction + o.id + '|miss|' + Math.floor(t), 0.3)) say(sim, o, 'nearMiss', 10);
    });
  }
  /* An enemy who breaks and runs: the nearest squad of the other side that can see it says so. */
  function enemyRunning(sim, s) {
    var other = s.faction === 'us' ? 'ge' : 'us',
      squads = (sim.factions && sim.factions[other] && sim.factions[other].squads) || [],
      best = null,
      bd = ENEMY_RUN_RANGE;
    squads.forEach(function (sq) {
      var c = centre(alive(sq)),
        d = dist(c, pos(s));
      if (d < bd) {
        bd = d;
        best = sq;
      }
    });
    if (best && chance(sim, 'run|' + s.faction + s.id, 0.5))
      say(sim, someone(best, 'run|' + s.id), 'enemyRunning', 15);
  }
  /* An objective a side holds with the enemy on it: the nearest squad of the holders says so. */
  function objectives(sim) {
    var t = +sim.time || 0,
      memo = state(sim).objectives,
      ctl = (sim.objectiveControl && sim.objectiveControl.objectives) || {};
    Object.keys(ctl).forEach(function (id) {
      var o = ctl[id],
        owner = o && o.owner;
      if (owner !== 'us' && owner !== 'ge') return;
      var enemy = owner === 'us' ? 'ge' : 'us',
        on = (+o[enemy] || 0) > 0;
      if (!on) {
        memo[id] = false;
        return;
      }
      if (memo[id]) return;
      memo[id] = true;
      var src = (sim._objectives || []).filter(function (x) {
          return x.id === id;
        })[0],
        p = src && src.def,
        squads = (sim.factions && sim.factions[owner] && sim.factions[owner].squads) || [],
        best = null,
        bd = OBJECTIVE_RANGE;
      if (!p) return;
      squads.forEach(function (sq) {
        var d = dist(centre(alive(sq)), p);
        if (d < bd) {
          bd = d;
          best = sq;
        }
      });
      if (best) say(sim, leader(best) || someone(best, 'obj|' + id), 'enemyOnObjective', 20);
    });
  }

  function tick(sim) {
    if (!root.BATTLE_AUDIO_MANIFEST || typeof sim.onCallout !== 'function') return;
    var st = state(sim),
      t = +sim.time || 0;
    if (!st.later) st.later = [];
    if (t < st.next) return;
    st.next = t + SAMPLE;
    st.later = st.later.filter(function (l) {
      if (t < l.at) return true;
      if (!l.s.dead && !l.sq.inContact) say(sim, l.s, l.event, 30);
      return false;
    });
    ['us', 'ge'].forEach(function (f) {
      var squads = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      squads.forEach(function (sq) {
        if (!sq || sq.disbanded) return;
        var bounding = [];
        alive(sq).forEach(function (s) {
          manTick(sim, s, manMemo(sim, s), bounding);
        });
        /* A fireteam sent forward: the leader sends it, a man who stays covers it. */
        if (bounding.length >= 2 && sq.inContact && chance(sim, sq.id + '|team|' + Math.floor(t), 0.6)) {
          say(sim, leader(sq), 'teamMove', 8);
          var base = alive(sq).filter(function (s) {
            return bounding.indexOf(s) < 0 && s !== leader(sq) && engState(s) === 'engage';
          })[0];
          if (base && chance(sim, sq.id + '|base|' + Math.floor(t), 0.5)) say(sim, base, 'baseOfFire', 8);
        }
        squadTick(sim, sq, squadMemo(sim, sq));
      });
    });
    objectives(sim);
  }
  function reset(sim) {
    sim._voiceObs = null;
  }

  root.BattleModules.registerSystem(SYSTEM, {
    version: '1.0',
    onBattleStart: reset,
    onBattleRestart: reset,
    onSimulationStep: tick
  });
  root.BattleVoiceObservations = { version: '1.0' };
})(typeof window !== 'undefined' ? window : globalThis);
