/* How long is a squad's last word on the enemy still true, and does a remembered sector get cleared while
   the enemy is still there? Built for the sector memory of PR #632 (15p `noteSectors`), but it keeps its
   own table so it also runs on builds without it.
   The probe's table: per squad, one entry per 20 m cell (the same floor grid as 15p) holding the newest
   told/seen report from `SquadAI.squadContactsMap`, updated every step and never cleared. On it:
   - truth by age: the share of time a living enemy is within 10 m / 20 m of the reported point, by the
     age of the newest report for that cell (how long a last-known position stays true);
   - a spotting-faithful clearing rule, run as a shadow that never acts: a cell is cleared only when one of
     the squad's men could have spotted a still, prone man on the point (Perception's own range, view cone
     and line of sight: SquadAI.detectionRange, lookYaw, hasLineOfSight) for DWELL seconds in a row,
     CLEAR_AFTER s after the report and with no newer sighting within 25 m;
   - for each clear: is an enemy still within 10 m / 20 m, how long after the report, and was the squad's
     own report still trusted (an unexpired belief within 25 m, confidence >= 0.5); and whether the cell
     was still uncleared when that report stopped being trusted (the only moment memory adds anything).
   When the build has `sq._sectorMemory`, the shipped clearing rule is booked the same way from its cells,
   plus how far the nearest man inside its range was compared with his vision range.
   Also: verify-contact leases (how far the point is from what he is sent to verify, against his vision
   range; the memory-aimed ones with the truth at issue), and the reactive gates (`taskReason`,
   `firingTaskReason`) in squad-seconds with contact, including the time the firing-position gate is shut
   only for want of a credible contact while the shadow memory (report < 60 s) holds a cell.
   One seed per scenario. Observe only: reads state, draws no RNG, writes nothing. */
(function (root) {
  var CELL = 20,
    CLEAR_AFTER = 3,
    DWELL = 1,
    MEMORY_WINDOW = 60,
    FOCUS_HALF = Math.PI / 3,
    PERIPHERAL_HALF = (100 * Math.PI) / 180,
    PERIPHERAL_RANGE = 0.35,
    BEHIND_RANGE = 10,
    DELAY_BANDS = [3, 4, 6, 12, 30, 60, 120, 240, 481],
    AGE_BANDS = [3, 6, 12, 30, 60, 120, 240, 481];
  var out, tables, shipped, leases, lastT;
  function angleBetween(a, b) {
    var d = a - b;
    return Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
  }
  function stanceOf(s) {
    return s.prone ? 'prone' : s.crouching || s.tacticalCrouch ? 'crouch' : 'stand';
  }
  function band(bands, v) {
    for (var i = 0; i < bands.length; i++) if (v < bands[i]) return (i ? bands[i - 1] : 0) + '-' + bands[i];
    return bands[bands.length - 1] + '+';
  }
  function add(map, key, v) {
    map[key] = (map[key] || 0) + v;
  }
  function nearestEnemy(sim, side, x, z) {
    var roster = (sim._roster && sim._roster[side === 'us' ? 'ge' : 'us']) || [],
      best = null;
    for (var i = 0; i < roster.length; i++) {
      var e = roster[i];
      if (!e || e.dead || !e.root) continue;
      var d = Math.hypot(e.root.position.x - x, e.root.position.z - z);
      if (!best || d < best.d) best = { d: d, stance: stanceOf(e), moving: !!e.moving };
    }
    return best;
  }
  function bucket() {
    return { n: 0, within10: 0, within20: 0, moving20: 0, stance20: {} };
  }
  function truth(b, e) {
    b.n++;
    if (e && e.d <= 10) b.within10++;
    if (e && e.d <= 20) {
      b.within20++;
      add(b.stance20, e.stance, 1);
      if (e.moving) b.moving20++;
    }
  }
  function trustedReport(sq, sim, x, z) {
    var best = 0;
    (sq.members || []).forEach(function (m) {
      var store = m && !m.dead && m._beliefs;
      if (!store || !store.byKey) return;
      Object.keys(store.byKey).forEach(function (k) {
        var r = store.byKey[k];
        if (!r || r.combatThreat === false || r.source === 'heard' || sim.time >= r.expiresAt) return;
        if (Math.hypot(r.x - x, r.z - z) > 25) return;
        var span = Math.max(0.001, r.expiresAt - r.observedAt),
          c = (+r.baseConfidence || 0) * (1 - Math.max(0, sim.time - r.observedAt) / span);
        if (c > best) best = c;
      });
    });
    return best;
  }
  function able(m, sim) {
    return m && !m.dead && !(m.hp <= 0) && !m.incapacitated && m.root && !(m.suppressedUntil > sim.time);
  }
  /* Could any of the squad's men have spotted a still, prone man on the point right now? */
  function couldSpotProne(sq, sim, x, z) {
    var SA = root.SquadAI,
      stats = root.BattleSoldierStats,
      proxy = { root: { position: { x: x, y: sim.heightAt(x, z), z: z } }, prone: true, moving: false };
    for (var i = 0; i < (sq.members || []).length; i++) {
      var m = sq.members[i];
      if (!able(m, sim)) continue;
      var p = m.root.position,
        d = Math.hypot(p.x - x, p.z - z),
        role = SA.ROLES[m.role];
      if (!role) continue;
      var full = SA.detectionRange(role, proxy) * (stats && stats.scale ? stats.scale(m, 'sight') : 1);
      if (d > full) continue;
      if (d > BEHIND_RANGE) {
        var off = angleBetween(Math.atan2(x - p.x, z - p.z), SA.lookYaw(m, sim)),
          reach = off <= FOCUS_HALF ? 1 : off <= PERIPHERAL_HALF ? PERIPHERAL_RANGE : 0;
        if (!reach || d > full * reach) continue;
      }
      if (SA.hasLineOfSight(m, proxy, sim.heightAt, sim.obstacles)) return true;
    }
    return false;
  }
  /* The nearest man the shipped rule counts (inside 0.6 of his weapon range), against his vision range. */
  function shippedObserver(sq, sim, x, z) {
    var SA = root.SquadAI,
      best = null;
    (sq.members || []).forEach(function (m) {
      if (!able(m, sim)) return;
      var d = Math.hypot(m.root.position.x - x, m.root.position.z - z),
        range = SA.engageRange(m);
      if (!(range > 0) || d > range * 0.6) return;
      if (!best || d < best.d)
        best = { d: +d.toFixed(1), engageRange: range, visionRange: (SA.ROLES[m.role] || {}).visionRange };
    });
    return best;
  }
  function ruleOut() {
    return { clears: 0, delay: {}, truth: bucket(), whileTrusted: 0, reportLapses: 0, outlivedReport: 0 };
  }
  function bookClear(rule, sim, side, sq, cell, delay) {
    rule.clears++;
    add(rule.delay, band(DELAY_BANDS, delay), 1);
    var e = nearestEnemy(sim, side, cell.x, cell.z);
    truth(rule.truth, e);
    if (trustedReport(sq, sim, cell.x, cell.z) >= 0.5) rule.whileTrusted++;
    return e;
  }
  function gate(sq, dt, mem) {
    var P = root.BattleReactiveFireManeuver,
      inputs = sq._localTask && sq._localTask.inputs,
      g = out.gates;
    if (!dt || !P || !P.taskReason || !inputs || !inputs.contact || sq.state === 'retreat') return;
    g.contactSeconds += dt;
    var mr = P.taskReason(sq, inputs),
      fr = P.firingTaskReason(sq, inputs);
    add(g.maneuverReason, mr, dt);
    add(g.firingReason, fr, dt);
    if (
      fr === 'credible-contact' &&
      P.firingTaskReason(sq, Object.assign({}, inputs, { confidence: 0.9 })) === 'eligible'
    ) {
      g.firingOnlyCredible += dt;
      if (mem.n) {
        g.firingOnlyCredibleWithMemory += dt;
        if (mem.true20) g.firingOnlyCredibleWithMemoryTrue20 += dt;
      }
    }
  }
  function verifyLease(sim, side, sq, lease) {
    var pt = lease.data.point,
      v = out.verifyLeases;
    if (pt.aim) {
      v.memoryAimed++;
      truth(v.atMemoryAim, nearestEnemy(sim, side, pt.aim.x, pt.aim.z));
    }
    var id = lease.data.moverIds && lease.data.moverIds[0],
      man = (sq.members || []).filter(function (m) {
        return m && String(m.id) === String(id);
      })[0],
      c = man && root.SquadAI.soldierContact(man, sim),
      aim = pt.aim || (c && Number.isFinite(c.x) ? { x: c.x, z: c.z } : null),
      vision = man && (root.SquadAI.ROLES[man.role] || {}).visionRange;
    v.n++;
    if (!aim || !vision) {
      v.unknown++;
      return;
    }
    var d = Math.hypot(aim.x - pt.x, aim.z - pt.z);
    if (v.distances.length < 200) v.distances.push(Math.round(d));
    if (d <= vision * 0.35) v.withinProneSight++;
    else if (d <= vision) v.withinStandingSightOnly++;
    else v.beyondSight++;
  }
  (root.BattleProbes = root.BattleProbes || {})['sector-memory-truth'] = {
    every: 0,
    start: function () {
      tables = new Map();
      shipped = new Map();
      leases = new WeakSet();
      lastT = null;
      out = {
        table: { created: 0, refreshed: 0, atCreate: bucket() },
        byAge: {},
        shadow: ruleOut(),
        shipped: ruleOut(),
        shippedNearestBeyondVision: 0,
        shippedExamples: [],
        verifyLeases: {
          n: 0,
          memoryAimed: 0,
          atMemoryAim: bucket(),
          withinProneSight: 0,
          withinStandingSightOnly: 0,
          beyondSight: 0,
          unknown: 0,
          distances: []
        },
        gates: {
          contactSeconds: 0,
          maneuverReason: {},
          firingReason: {},
          firingOnlyCredible: 0,
          firingOnlyCredibleWithMemory: 0,
          firingOnlyCredibleWithMemoryTrue20: 0
        }
      };
    },
    sample: function (sim) {
      var dt = lastT == null ? 0 : Math.max(0, sim.time - lastT),
        SA = root.SquadAI;
      lastT = sim.time;
      ['us', 'ge'].forEach(function (side) {
        ((sim.factions[side] && sim.factions[side].squads) || []).forEach(function (sq) {
          var lease = root.BattleLeases && root.BattleLeases.get(sq, 'bound');
          if (lease && lease.data && lease.data.firingPosition && lease.data.point && !leases.has(lease)) {
            leases.add(lease);
            if (lease.data.point.verify) verifyLease(sim, side, sq, lease);
          }
          var rows = (SA.squadContactsMap && SA.squadContactsMap(sq, sim)) || [],
            table = tables.get(sq) || new Map(),
            memNow = { n: 0, true20: 0 },
            mem = sq._sectorMemory && sq._sectorMemory.cells;
          tables.set(sq, table);
          rows.forEach(function (c) {
            if (
              !c ||
              c.source === 'heard' ||
              !Number.isFinite(c.x) ||
              !Number.isFinite(c.z) ||
              !Number.isFinite(c.at)
            )
              return;
            var key = Math.floor(c.x / CELL) + ',' + Math.floor(c.z / CELL),
              cell = table.get(key);
            if (cell && !(c.at > cell.at)) return;
            if (!cell) {
              out.table.created++;
              truth(out.table.atCreate, nearestEnemy(sim, side, c.x, c.z));
            } else out.table.refreshed++;
            table.set(key, {
              x: c.x,
              z: c.z,
              at: c.at,
              shadowAt: cell && cell.shadowAt != null && !(c.at > cell.shadowAt) ? cell.shadowAt : null,
              dwellFrom: null,
              lapsed: false
            });
          });
          table.forEach(function (cell, key) {
            var age = sim.time - cell.at,
              e = nearestEnemy(sim, side, cell.x, cell.z),
              ab =
                out.byAge[band(AGE_BANDS, age)] ||
                (out.byAge[band(AGE_BANDS, age)] = { s: 0, within10: 0, within20: 0 });
            ab.s += dt;
            if (e && e.d <= 10) ab.within10 += dt;
            if (e && e.d <= 20) ab.within20 += dt;
            if (cell.shadowAt == null && age >= CLEAR_AFTER) {
              var seen = rows.some(function (c) {
                return (
                  c && c.source === 'seen' && c.at > cell.at && Math.hypot(c.x - cell.x, c.z - cell.z) <= 25
                );
              });
              if (!seen && couldSpotProne(sq, sim, cell.x, cell.z)) {
                if (cell.dwellFrom == null) cell.dwellFrom = sim.time;
                if (sim.time - cell.dwellFrom >= DWELL) {
                  cell.shadowAt = sim.time;
                  bookClear(out.shadow, sim, side, sq, cell, sim.time - cell.at);
                }
              } else cell.dwellFrom = null;
            }
            if (cell.shadowAt == null && age <= MEMORY_WINDOW) {
              memNow.n++;
              if (e && e.d <= 20) memNow.true20++;
            }
            if (!cell.lapsed && trustedReport(sq, sim, cell.x, cell.z) < 0.5) {
              cell.lapsed = true;
              out.shadow.reportLapses++;
              if (cell.shadowAt == null) out.shadow.outlivedReport++;
              if (mem) {
                out.shipped.reportLapses++;
                if (mem[key] && mem[key].clearedAt == null) out.shipped.outlivedReport++;
              }
            }
          });
          if (mem)
            Object.keys(mem).forEach(function (key) {
              var cell = mem[key],
                id = side + ':' + sq.id + ':' + key,
                was = shipped.get(id);
              if (!was || was.at !== cell.at)
                shipped.set(id, (was = { at: cell.at, clearedAt: cell.clearedAt }));
              if (cell.clearedAt != null && was.clearedAt == null) {
                was.clearedAt = cell.clearedAt;
                var delay = cell.clearedAt - cell.at,
                  en = bookClear(out.shipped, sim, side, sq, cell, delay),
                  obs = shippedObserver(sq, sim, cell.x, cell.z);
                if (obs && obs.d > obs.visionRange) out.shippedNearestBeyondVision++;
                if (en && en.d <= 10 && out.shippedExamples.length < 6)
                  out.shippedExamples.push({
                    t: +sim.time.toFixed(2),
                    squad: sq.id,
                    delay: +delay.toFixed(2),
                    enemy: { d: +en.d.toFixed(1), stance: en.stance, moving: en.moving },
                    nearestCountedObserver: obs
                  });
              }
            });
          gate(sq, dt, memNow);
        });
      });
    },
    report: function () {
      Object.keys(out.byAge).forEach(function (k) {
        var b = out.byAge[k];
        b.share10 = b.s ? +(b.within10 / b.s).toFixed(3) : null;
        b.share20 = b.s ? +(b.within20 / b.s).toFixed(3) : null;
        b.s = +b.s.toFixed(1);
        b.within10 = +b.within10.toFixed(1);
        b.within20 = +b.within20.toFixed(1);
      });
      var g = out.gates;
      [
        'contactSeconds',
        'firingOnlyCredible',
        'firingOnlyCredibleWithMemory',
        'firingOnlyCredibleWithMemoryTrue20'
      ].forEach(function (k) {
        g[k] = +g[k].toFixed(1);
      });
      [g.maneuverReason, g.firingReason].forEach(function (m) {
        Object.keys(m).forEach(function (k) {
          m[k] = +m[k].toFixed(1);
        });
      });
      var P = root.BattleReactiveFireManeuver;
      out.flags = {
        reactive: !!(P && P.on),
        sectorMemory: !!(P && P.sectorMemory),
        shippedRuleBooked: out.shipped.clears > 0 || out.shipped.reportLapses > 0,
        query: root.location.search
      };
      return out;
    }
  };
})(window);
