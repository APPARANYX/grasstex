/* Read-only squad-local objective-starvation observer.
   A faction may keep capturing while a different squad is stationary on a remote
   executing CAPTURE mission. Soldier-level movement probes miss this when the
   individual resolver correctly arrives at a nearby formation waypoint.
   Episodes are diagnostic CANDIDATES, not permission to reissue a brief. */
(function (root) {
  'use strict';
  var tracks, episodes;
  var WINDOW = 45,
    CLOSURE = 2,
    NET = 3,
    FAR = 35,
    LIMIT = 80;
  var options = new URLSearchParams((root.location && root.location.search) || '');
  var filter = String(options.get('probeSquads') || '')
    .split(',')
    .filter(Boolean);
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function point(v) {
    return v && isFinite(+v.x) && isFinite(+v.z) ? { x: +v.x, z: +v.z } : null;
  }
  function centroid(members) {
    if (!members.length) return null;
    return members.reduce(
      function (out, man) {
        out.x += man.root.position.x / members.length;
        out.z += man.root.position.z / members.length;
        return out;
      },
      { x: 0, z: 0 }
    );
  }
  function reason(sq, mission) {
    if (sq.state === 'retreat' || sq.commandPhase === 'retreat') return 'retreat';
    if (sq._reconTask) return 'active-recon';
    if (sq.inContact || sq.contact) return 'contact';
    if (sq._preparedDefenseRequest || sq._captureZoneDefenseRequest) return 'defensive-obligation';
    if (mission.action === 'hold' || mission.role === 'support') return 'intentional-support-hold';
    if (sq.commandPhase === 'regroup' || sq.commandPhase === 'reconstitute') return 'reconstitution';
    return null;
  }
  (root.BattleProbes = root.BattleProbes || {})['squad-local-starvation'] = {
    every: 1,
    start: function () {
      tracks = {};
      episodes = [];
    },
    sample: function (sim) {
      ['us', 'ge'].forEach(function (side) {
        var groups = (sim.factions && sim.factions[side] && sim.factions[side].squads) || [];
        groups.forEach(function (sq) {
          var id = side + ':' + sq.id,
            m = sq._macroMission,
            members = (sq.members || []).filter(function (s) {
              return s && !s.dead && s.root && s.root.position;
            });
          if (filter.length && filter.indexOf(String(sq.id)) < 0) return;
          /* Own mission target, never local formation / path / order waypoint. */
          var goal = m && point(m.point),
            centre = centroid(members);
          if (
            !m ||
            m.intent !== 'capture' ||
            m.status !== 'executing' ||
            !goal ||
            !centre ||
            members.length < 2 ||
            distance(centre, goal) <= FAR
          ) {
            delete tracks[id];
            return;
          }
          var key = String(m.version) + ':' + goal.x.toFixed(2) + ':' + goal.z.toFixed(2),
            track = tracks[id],
            gap = distance(centre, goal);
          if (
            !track ||
            track.key !== key ||
            track.living !== members.length ||
            track.startGap - gap >= CLOSURE ||
            distance(track.start, centre) >= NET
          ) {
            tracks[id] = {
              key: key,
              living: members.length,
              since: sim.time,
              start: centre,
              startGap: gap,
              reported: false
            };
            return;
          }
          if (track.reported || sim.time - track.since < WINDOW) return;
          track.reported = true;
          var protectedBy = reason(sq, m),
            pending = [],
            arrived = 0,
            owners = {};
          members.forEach(function (s) {
            var r = s._movementResolver && s._movementResolver.last;
            if (r && r.owner) owners[r.owner] = (owners[r.owner] || 0) + 1;
            if (s._movementStopReason === 'arrived') arrived++;
            var receipt =
              sim._commandReception &&
              sim._commandReception.bySoldier &&
              sim._commandReception.bySoldier[String(s.id)];
            if (
              receipt &&
              Object.keys(receipt).some(function (slot) {
                return receipt[slot] && receipt[slot].phase === 'unreachable';
              })
            )
              pending.push(s.id);
          });
          if (episodes.length < LIMIT)
            episodes.push({
              kind: 'squad-local-mission-starvation',
              squad: id,
              missionVersion: m.version,
              intent: m.intent,
              at: +sim.time.toFixed(2),
              seconds: +(sim.time - track.since).toFixed(2),
              objective: goal,
              position: centre,
              distanceToMission: +gap.toFixed(2),
              netTravel: +distance(track.start, centre).toFixed(2),
              objectiveClosure: +(track.startGap - gap).toFixed(2),
              living: members.length,
              protectedBy: protectedBy,
              resolverOwners: owners,
              arrivedAtInterimWaypoint: arrived,
              unreachableRecipients: pending,
              conclusion: protectedBy ? 'possible-lawful-hold' : 'requires-command-or-route-review'
            });
        });
      });
    },
    report: function () {
      return {
        schema: 'squad-local-starvation-v1',
        window: WINDOW,
        episodes: episodes,
        omitted: Math.max(0, Object.keys(tracks).length - LIMIT)
      };
    }
  };
})(window);
