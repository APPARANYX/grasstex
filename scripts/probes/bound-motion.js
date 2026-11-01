/* How a man moves while he bounds to cover (AGENTS.md: "the matrix dodge": a man on his way into a
   cover position lurching sideways, spinning or sliding before he arrives).
   Sampled every step for each man whose Engagement state is `bound`:
   - `reversals`: a step that turns his direction of travel by more than 100 degrees against the previous
     step (both at least MOVE_EPS long), by the destination kind the resolver held at the time;
   - `yawSwings`: a body yaw change of more than 1 rad in one step while he moves;
   - `goalFlips`: the resolver's winning goal kind or point changed and changed back (A -> B -> A) inside 2 s
     while he was bounding: two owners taking turns with his legs;
   - `slides`: a change of shown stance to prone or crawl while he is still moving faster than 1.5 m/s
     (the dive clip plays while the body carries on), with the speed and the bound's distance to cover;
   - `dithering`: bounds that walked more than 2.5x the straight distance to their cover and took over 6 s;
   - per-bound length distribution for scale.
   `traces`: the per-step state of the first dithering bounds (position, yaw, destination, waypoint, resolver goal, stop reason).
   Observe only: reads positions, `eng`, `_movementResolver.goal` and stance flags. */
(function (root) {
  var MOVE_EPS = 0.12,
    men,
    c;
  function bump(map, k) {
    map[k] = (map[k] || 0) + 1;
  }
  function kindOf(s) {
    var g = s._movementResolver && s._movementResolver.goal;
    return (g && g.kind) || 'none';
  }
  function shown(s) {
    return s.prone ? (s.crawling ? 'crawl' : 'prone') : s.tacticalCrouch || s.crouching ? 'crouch' : 'stand';
  }
  function keep(list, item, n) {
    if (list.length < n) list.push(item);
  }
  (root.BattleProbes = root.BattleProbes || {})['bound-motion'] = {
    every: 0,
    start: function () {
      men = new Map();
      c = {
        boundSteps: 0,
        moveSteps: 0,
        reversals: 0,
        reversalsByKind: {},
        reversalsByReason: {},
        yawSwings: 0,
        goalFlips: 0,
        goalFlipPairs: {},
        slides: 0,
        slideSpeeds: [],
        slidesByStance: {},
        bounds: 0,
        endedBy: {},
        lostAtCover: 0,
        lostLos: {},
        lostBlockers: {},
        lostDist: [],
        lostDur: [],
        earlyAlert: 0,
        dithering: 0,
        lengths: { '<3s': 0, '3-6s': 0, '6-12s': 0, '>=12s': 0 },
        traces: [],
        revTraces: [],
        examples: { reversals: [], goalFlips: [], slides: [], dithering: [] }
      };
    },
    sample: function (sim) {
      var units = root.BattleModules.unitsFor(sim);
      for (var i = 0; i < units.length; i++) {
        var s = units[i];
        if (!s || s.dead || !s.root) continue;
        var e = s.eng,
          bounding = !!(e && e.state === 'bound'),
          p = s.root.position,
          yaw = s.root.rotation.y || 0,
          m = men.get(s);
        if (!m) {
          men.set(s, { t: sim.time, x: p.x, z: p.z, yaw: yaw, dx: 0, dz: 0, stance: shown(s), goals: [], b: null });
          continue;
        }
        var dx = p.x - m.x,
          dz = p.z - m.z,
          len = Math.hypot(dx, dz),
          now = shown(s);
        if (bounding) {
          c.boundSteps++;
          var reason = String((e.transition && e.transition.reason) || '').slice(0, 40);
          if (!m.b) {
            m.dx = 0; /* a reversal is a turn inside one bound, never against how he moved before it */
            m.dz = 0;
            m.b = { t: sim.time, walked: 0, trace: [], from: { x: m.x, z: m.z }, cover: e.cover ? { x: e.cover.x, z: e.cover.z } : null };
          }
          m.b.walked += len;
          if (m.b.trace.length < 260) {
            var wp = s._movementWaypoint,
              gl = s._movementResolver && s._movementResolver.goal;
            m.b.trace.push({
              t: +sim.time.toFixed(2),
              at: [+p.x.toFixed(2), +p.z.toFixed(2)],
              yawDeg: +((yaw * 180) / Math.PI).toFixed(0),
              stepM: +len.toFixed(2),
              moveSpeed: +(s.moveSpeed || 0).toFixed(2),
              stance: now,
              goal: gl ? gl.kind + '@' + Math.round(gl.point.x) + ',' + Math.round(gl.point.z) : null,
              dest: s.destination ? [+s.destination.x.toFixed(1), +s.destination.z.toFixed(1)] : null,
              waypoint: wp ? [+wp.x.toFixed(1), +wp.z.toFixed(1)] : null,
              stop: s._movementStopReason || null,
              cover: e.cover ? [+e.cover.x.toFixed(1), +e.cover.z.toFixed(1), e.cover.slotId || null] : null
            });
          }
          if (e.cover) m.b.cover = { x: e.cover.x, z: e.cover.z };
          if (len > MOVE_EPS) {
            c.moveSteps++;
            if (m.dx * m.dx + m.dz * m.dz > MOVE_EPS * MOVE_EPS) {
              var cos = (dx * m.dx + dz * m.dz) / (len * Math.hypot(m.dx, m.dz));
              if (cos < Math.cos((100 * Math.PI) / 180)) {
                c.reversals++;
                if (m.b.trace.length && m.b.rev == null) {
                  m.b.rev = m.b.trace.length - 1;
                  /* what the soft avoidance could see: the obstacles within 5 m, relative to the man */
                  var F0 = root.BattleObstacleField;
                  m.b.near = F0 && F0.nearby
                    ? F0.nearby(sim.obstacles, p.x, p.z, 5).map(function (o) {
                        return { kind: o.kind || o.type || null, dx: +(o.x - p.x).toFixed(2), dz: +(o.z - p.z).toFixed(2), r: +(+o.radius).toFixed(2), cover: o.cover, h: +(+F0.obstacleHeight(o)).toFixed(1), phys: o.physicalId != null };
                      })
                    : null;
                }
                bump(c.reversalsByKind, kindOf(s));
                bump(c.reversalsByReason, reason || 'none');
                keep(c.examples.reversals, {
                  t: +sim.time.toFixed(2), soldier: s.id, role: s.role, kind: kindOf(s), reason: reason,
                  stepM: +len.toFixed(2), turnDeg: +((Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI).toFixed(0),
                  cover: m.b.cover && { dx: +(m.b.cover.x - p.x).toFixed(1), dz: +(m.b.cover.z - p.z).toFixed(1) }
                }, 12);
              }
            }
            var dy = Math.atan2(Math.sin(yaw - m.yaw), Math.cos(yaw - m.yaw));
            if (Math.abs(dy) > 1) c.yawSwings++;
            m.dx = dx;
            m.dz = dz;
          }
          var k = kindOf(s),
            g = s._movementResolver && s._movementResolver.goal,
            pt = g && g.point ? Math.round(g.point.x) + ',' + Math.round(g.point.z) : '';
          var sig = k + '@' + pt;
          if (!m.goals.length || m.goals[m.goals.length - 1].sig !== sig) {
            m.goals.push({ t: sim.time, sig: sig, kind: k });
            if (m.goals.length > 4) m.goals.shift();
            var n = m.goals.length;
            if (n >= 3 && m.goals[n - 3].sig === sig && sim.time - m.goals[n - 3].t < 2) {
              c.goalFlips++;
              bump(c.goalFlipPairs, m.goals[n - 2].kind + ' <-> ' + k);
              keep(c.examples.goalFlips, {
                t: +sim.time.toFixed(2), soldier: s.id, role: s.role, pair: m.goals[n - 2].sig + ' <-> ' + sig,
                seconds: +(sim.time - m.goals[n - 3].t).toFixed(2)
              }, 12);
            }
          }
          if ((now === 'prone' || now === 'crawl') && m.stance !== now && m.stance !== 'prone' && m.stance !== 'crawl') {
            var sp = len / Math.max(1e-6, sim.time - m.t);
            if (sp > 1.5) {
              c.slides++;
              c.slideSpeeds.push(+sp.toFixed(2));
              bump(c.slidesByStance, m.stance + '->' + now);
              keep(c.examples.slides, {
                t: +sim.time.toFixed(2), soldier: s.id, role: s.role, speed: +sp.toFixed(2), stance: m.stance + '->' + now,
                coverM: e.cover ? +Math.hypot(e.cover.x - p.x, e.cover.z - p.z).toFixed(1) : null
              }, 12);
            }
          }
        } else if (m.b) {
          var dur = sim.time - m.b.t,
            straight = m.b.cover ? Math.hypot(m.b.cover.x - m.b.from.x, m.b.cover.z - m.b.from.z) : 0;
          c.bounds++;
          var tr = e && e.transition,
            endKey = tr ? tr.from + ' -> ' + tr.to + ': ' + String(tr.reason || '').slice(0, 44) : 'none';
          bump(c.endedBy, endKey);
          if (tr && tr.from === 'engage' && tr.to === 'alert' && /target lost/.test(String(tr.reason)) && e.lastSeen) {
            var SA = root.SquadAI,
              F = root.BattleObstacleField,
              me = function (crouch, prone) {
                return { root: { position: { x: p.x, z: p.z } }, crouching: !!crouch, prone: !!prone };
              },
              foe = { root: { position: { x: e.lastSeen.x, z: e.lastSeen.z } }, crouching: true },
              los = function (o) {
                return SA.hasLineOfSight(o, foe, sim.heightAt, sim.obstacles);
              },
              stand = los(me(false)),
              crouch = los(me(true)),
              prone = los(me(true, true)),
              key = 'stand:' + (stand ? 'sees' : 'blind') + ' crouch:' + (crouch ? 'sees' : 'blind') + ' prone:' + (prone ? 'sees' : 'blind');
            c.lostAtCover++;
            bump(c.lostLos, key);
            if (!crouch && F) {
              var a = { x: p.x, z: p.z, y: sim.heightAt(p.x, p.z) + 1.05 },
                b = { x: e.lastSeen.x, z: e.lastSeen.z, y: sim.heightAt(e.lastSeen.x, e.lastSeen.z) + 1.05 },
                ob = F.sightBlocker(sim.obstacles, a, b);
              bump(c.lostBlockers, ob ? (ob.kind || ob.type || 'obstacle') + ' h=' + (+F.obstacleHeight(ob)).toFixed(1) : 'terrain/nav');
            }
            c.lostDist.push(Math.hypot(p.x - e.lastSeen.x, p.z - e.lastSeen.z));
            c.lostDur.push(dur);
          }
          if (tr && tr.to === 'alert' && dur < 6) c.earlyAlert++;
          c.lengths[dur < 3 ? '<3s' : dur < 6 ? '3-6s' : dur < 12 ? '6-12s' : '>=12s']++;
          if (dur > 6 && straight > 0.5 && m.b.walked > 2.5 * straight) {
            c.dithering++;
            keep(c.examples.dithering, {
              soldier: s.id, role: s.role, seconds: +dur.toFixed(1), walkedM: +m.b.walked.toFixed(1), straightM: +straight.toFixed(1)
            }, 12);
            keep(c.traces, { soldier: s.id, role: s.role, seconds: +dur.toFixed(1), steps: m.b.trace }, 3);
          }
          if (m.b.rev != null)
            keep(c.revTraces, {near: m.b.near, soldier: s.id, role: s.role, seconds: +dur.toFixed(1), steps: m.b.trace.slice(Math.max(0, m.b.rev - 8), m.b.rev + 14) }, 40);
          m.b = null;
          m.goals = [];
        }
        m.t = sim.time;
        m.x = p.x;
        m.z = p.z;
        m.yaw = yaw;
        m.stance = now;
      }
    },
    report: function () {
      function med(a) {
        var b = a.slice().sort(function (x, y) {
          return x - y;
        });
        return b.length ? +b[Math.floor(b.length / 2)].toFixed(1) : 0;
      }
      var sp = c.slideSpeeds.slice().sort(function (a, b) {
        return a - b;
      });
      return {
        boundSteps: c.boundSteps,
        movingBoundSteps: c.moveSteps,
        bounds: c.bounds,
        boundLengths: c.lengths,
        endedBy: c.endedBy,
        targetLost: {
          n: c.lostAtCover,
          lineOfSightAtCover: c.lostLos,
          crouchedBlockedBy: c.lostBlockers,
          medianDistToLastSeenM: med(c.lostDist),
          medianBoundSeconds: med(c.lostDur)
        },
        endedInAlertUnder6s: c.earlyAlert,
        reversals: c.reversals,
        reversalsPer1000MovingSteps: c.moveSteps ? +((c.reversals * 1000) / c.moveSteps).toFixed(1) : 0,
        reversalsByKind: c.reversalsByKind,
        reversalsByReason: c.reversalsByReason,
        yawSwings: c.yawSwings,
        goalFlips: c.goalFlips,
        goalFlipPairs: c.goalFlipPairs,
        slides: c.slides,
        slidesByStance: c.slidesByStance,
        slideSpeedMedian: sp.length ? sp[Math.floor(sp.length / 2)] : 0,
        slideSpeedMax: sp.length ? sp[sp.length - 1] : 0,
        dithering: c.dithering,
        examples: c.examples,
        traces: c.traces,
        reversalTraces: c.revTraces
      };
    }
  };
})(window);
