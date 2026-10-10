/* Read-only per-tick physical/navigation forensic for #361 meeting:hill-0008 GE-4.
 * Sampling three short windows prevents a full 900-second, all-actor memory dump.
 * Never mutates battle, soldier, waypoint or navigation state. */
(function (root) {
  'use strict';
  var windows = [
    [126, 129],
    [139, 143],
    [179, 183],
    [299, 301]
  ];
  var samples = [],
    markers = [],
    lastMarked = -Infinity;
  function p(v) {
    return v && isFinite(+v.x) && isFinite(+v.z) ? { x: +(+v.x).toFixed(5), z: +(+v.z).toFixed(5) } : null;
  }
  function d(a, b) {
    return a && b ? +Math.hypot(a.x - b.x, a.z - b.z).toFixed(4) : null;
  }
  function sample(sim) {
    var q =
      sim.factions &&
      sim.factions.ge &&
      (sim.factions.ge.squads || []).find(function (s) {
        return s.id === 'ge-4';
      });
    if (!q) return;
    var t = +sim.time.toFixed(3),
      full = windows.some(function (w) {
        return t >= w[0] && t <= w[1];
      });
    if (!full && t - lastMarked < 20) return;
    var m = (q.members || []).filter(function (s) {
      return !s.dead && (s.id === 92 || s.id === 98 || s.id === 96 || s.id === 99);
    });
    var row = {
      t: t,
      mission: q._macroMission && {
        version: q._macroMission.version,
        intent: q._macroMission.intent,
        status: q._macroMission.status
      },
      objective: p(q.objective),
      anchor: p(q.orderAnchor),
      contact: !!q.inContact,
      members: m.map(function (s) {
        var h = p(s.root && s.root.position),
          dest = p(s.destination),
          nav = s._physicalPath,
          N = root.BattleNavigation,
          wp = p(s._movementWaypoint),
          wx = wp && h ? wp.x - h.x : 0,
          wz = wp && h ? wp.z - h.z : 0,
          wd = Math.hypot(wx, wz),
          stride = wd ? Math.min(wd, (+s.moveSpeed || 0) * 0.15) : 0,
          forward = wd ? { x: h.x + (wx / wd) * stride, z: h.z + (wz / wd) * stride } : null,
          directLegal = !!(N && N.movementClear && forward && N.movementClear(h, forward)),
          standingLegal = !!(N && N.movementClear && h && N.movementClear(h, h)),
          staticNear = ((sim.obstacles && sim.obstacles.__physicalFootprints) || [])
            .filter(function (ob) {
              return h && Math.hypot(ob.x - h.x, ob.z - h.z) < 5;
            })
            .slice(0, 12)
            .map(function (ob) {
              return {
                id: ob.id,
                type: ob.type,
                shape: ob.shape,
                x: +ob.x.toFixed(3),
                z: +ob.z.toFixed(3),
                radius: ob.radius,
                hx: ob.hx,
                hz: ob.hz
              };
            }),
          obstacleNear = (sim.obstacles || [])
            .filter(function (ob) {
              return h && Math.hypot(ob.x - h.x, ob.z - h.z) < 6;
            })
            .slice(0, 15)
            .map(function (ob) {
              return { type: ob.type, x: +ob.x.toFixed(3), z: +ob.z.toFixed(3), radius: ob.radius };
            }),
          res = s._movementResolver,
          C = root.BattleCommandReception,
          rec = C && C.peek && C.peek(s, sim, 'movement', 'soldier:' + s.id);
        return {
          id: s.id,
          position: h,
          goalDistance: d(h, p(q.objective)),
          destination: dest,
          destinationDistance: d(h, dest),
          waypoint: p(s._movementWaypoint),
          waypointDistance: d(h, p(s._movementWaypoint)),
          order: p(s.orderDestination),
          fireteam: p(s._fireteamDestination),
          speed: +(+s.moveSpeed || 0).toFixed(3),
          moving: !!s.moving,
          stop: s._movementStopReason || null,
          steer: s._steer361Diag || null,
          directLegal: directLegal,
          standingLegal: standingLegal,
          physicalStep: p(forward),
          footprints: staticNear,
          obstacles: obstacleNear,
          detour: p(s._fieldDetour),
          personalSpace: p(s._personalSpaceDestination),
          resolver: res &&
            res.last && { owner: res.last.owner, kind: res.last.kind, point: p(res.last.point) },
          receipt: rec && { phase: rec.phase, envelope: rec.envelopeId, point: p(rec.point) },
          route: nav && {
            blocked: !!nav.blocked,
            createdAt: +nav.createdAt.toFixed(3),
            replanAt: +nav.replanAt.toFixed(3),
            final: p({ x: nav.finalGoalX, z: nav.finalGoalZ }),
            stand: p(nav.standGoal),
            points: (nav.points || []).slice(0, 4).map(p)
          }
        };
      })
    };
    if (full && samples.length < 150) samples.push(row);
    else if (!full && markers.length < 70) {
      markers.push(row);
      lastMarked = t;
    }
  }
  (root.BattleProbes = root.BattleProbes || {})['route-361'] = {
    every: 0,
    start: function () {
      samples = [];
      markers = [];
      lastMarked = -Infinity;
    },
    sample: sample,
    report: function () {
      return { schema: 'route-361-v1', windows: windows, markers: markers, samples: samples };
    }
  };
})(window);
