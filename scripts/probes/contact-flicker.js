/* Contact flicker: a squad that is "executing" an advancing phase but whose centroid stays flat while its contact flag
   keeps toggling. Per squad every 2 s: contact flag, the men by Engagement state, how many have only an old sighting
   (no live squad contact) and its age, centroid. A window of 60 s with at least 3 contact toggles and less than 15 m of
   centroid travel is reported once, with the 2 s trace. Observe only: reads state, draws no RNG, writes nothing. */
(function (root) {
  var ADV = { approach: 1, assault: 1, capture: 1, 'clear-town': 1, flank: 1 },
    hist,
    found,
    done;
  (root.BattleProbes = root.BattleProbes || {})['contact-flicker'] = {
    every: 2,
    start: function () {
      hist = {};
      found = [];
      done = {};
    },
    sample: function (sim) {
      var SA = root.SquadAI;
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          var men = (sq.members || []).filter(function (s) {
            return !s.dead && s.root && !s.isPlayer;
          });
          if (!men.length) return;
          var cx = 0,
            cz = 0,
            states = {},
            lastOnly = 0,
            ageSum = 0,
            live = 0;
          men.forEach(function (s) {
            cx += s.root.position.x;
            cz += s.root.position.z;
            var e = s.eng || {},
              k = e.state || '?';
            states[k] = (states[k] || 0) + 1;
            var c = null;
            try {
              c = SA && SA.soldierContact ? SA.soldierContact(s, sim) : null;
            } catch (_) {}
            if (c) live++;
            else if (e.lastSeen) {
              lastOnly++;
              ageSum += sim.time - (+e.lastSeenAt || 0);
            }
          });
          var id = f + ':' + sq.id,
            h = hist[id] || (hist[id] = []);
          h.push({
            t: +sim.time.toFixed(0),
            c: sq.inContact ? 1 : 0,
            n: men.length,
            x: cx / men.length,
            z: cz / men.length,
            ph: sq.commandPhase,
            st: states,
            live: live,
            old: lastOnly,
            age: lastOnly ? Math.round(ageSum / lastOnly) : 0
          });
          if (h.length > 40) h.shift();
          if (done[id] && sim.time - done[id] < 120) return;
          var w = h.filter(function (p) {
            return p.t >= sim.time - 60;
          });
          if (w.length < 25 || !ADV[sq.commandPhase] || sq.state === 'retreat') return;
          var toggles = 0;
          for (var i = 1; i < w.length; i++) if (w[i].c !== w[i - 1].c) toggles++;
          var moved = Math.hypot(w[w.length - 1].x - w[0].x, w[w.length - 1].z - w[0].z);
          if (toggles >= 3 && moved < 15) {
            done[id] = sim.time;
            found.push({
              squad: id,
              t: +sim.time.toFixed(0),
              toggles: toggles,
              moved: +moved.toFixed(1),
              phase: sq.commandPhase,
              trace: w.map(function (p) {
                return [p.t, p.c, p.live, p.old, p.age, JSON.stringify(p.st)];
              })
            });
          }
        });
      });
    },
    report: function () {
      return { count: found.length, episodes: found.slice(0, 6) };
    }
  };
})(window);
