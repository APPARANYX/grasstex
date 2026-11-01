/* Why does a squad's order anchor stop advancing? For a squad in an advancing phase, out of contact whose men all stand still for
   60 s, dumps what orderCanAdvance sees per living man: the latest movement record Command Reception holds for him
   (envelope, stage, unreachable, when it was due) against the envelope he last adopted, and his distance to the order
   destination. Observe only: reads the reception state directly (no settle), draws no RNG, writes nothing. */
(function (root) {
  var ADVANCE = { approach: 1, assault: 1, capture: 1, 'clear-town': 1, flank: 1 },
    seen,
    dumps,
    still;
  (root.BattleProbes = root.BattleProbes || {})['ack-state'] = {
    every: 5,
    start: function () {
      seen = {};
      still = {};
      dumps = [];
    },
    sample: function (sim) {
      var st = sim._commandReception;
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          var id = String(sq.id),
            men = (sq.members || []).filter(function (s) {
              return !s.dead && s.root && !s.isPlayer;
            }),
            moving = men.some(function (s) {
              return (+s.moveSpeed || 0) > 0.35;
            });
          if (!men.length || moving || sq.inContact || !ADVANCE[sq.commandPhase]) {
            delete still[id];
            return;
          }
          if (still[id] == null) still[id] = sim.time;
          if (sim.time - still[id] < 60 || seen[id]) return;
          seen[id] = 1;
          dumps.push({
            squad: id,
            faction: f,
            t: +sim.time.toFixed(0),
            phase: sq.commandPhase,
            state: sq.state,
            orderVersion: sq._orderVersion,
            anchor: sq._orderAnchor || null,
            men: men.map(function (s) {
              var by = st && st.bySoldier[String(s.id)],
                rec = by && by['movement|soldier:' + s.id],
                od = s.orderDestination;
              return {
                id: s.id,
                rec: rec
                  ? {
                      env: rec.envelopeId,
                      stage: rec.phase,
                      unreachable: !!rec.unreachable,
                      channel: rec.channel,
                      issuedAt: rec.issuedAt,
                      adoptedAt: rec.adoptedAt,
                      retryAt: rec.retryAt || null,
                      action: rec.action
                    }
                  : null,
                adopted: s._fireteamAdoptedEnvelope || null,
                current: !!(rec && rec.envelopeId === s._fireteamAdoptedEnvelope),
                arriveDist: od
                  ? +Math.hypot(s.root.position.x - od.x, s.root.position.z - od.z).toFixed(1)
                  : null,
                dest: s.destination ? [Math.round(s.destination.x), Math.round(s.destination.z)] : null
              };
            })
          });
        });
      });
    },
    report: function () {
      return { dumps: dumps };
    }
  };
})(window);
