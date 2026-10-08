/* Why is a man still in Engagement's alert state? Every 2 s, for each living man in alert or suppress, which term of
   `engagementLive` keeps the ALERT_LATCH on (squad in contact, squad clearing, first-hand memory of the contact), or none
   (the 2.5 s quiet handoff is running, or he is not latched), and whether he has a live personal contact. Man-seconds,
   split by whether his only aim point is an old sighting (`lastSeen` older than 10 s with no live contact).
   Observe only: reads state, draws no RNG, writes nothing. */
(function (root) {
  var out;
  function add(k, n) {
    out[k] = (out[k] || 0) + n;
  }
  (root.BattleProbes = root.BattleProbes || {})['hold-reason'] = {
    every: 2,
    start: function () {
      out = {};
    },
    sample: function (sim) {
      var SA = root.SquadAI;
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          (sq.members || []).forEach(function (s) {
            if (s.dead || !s.root || s.isPlayer || !s.eng) return;
            var e = s.eng;
            if (e.state !== 'alert' && e.state !== 'suppress') return;
            var c = null,
              first = false,
              sc = null;
            try {
              c = SA && SA.soldierContact ? SA.soldierContact(s, sim) : null;
              sc = SA && SA.squadContact ? SA.squadContact(sq, sim) : sq.contact;
              first = !!(sc && SA.hasFirstHandMemory && SA.hasFirstHandMemory(sc, sim));
            } catch (_) {}
            var stale = !c && e.lastSeen && sim.time - (+e.lastSeenAt || 0) > 10,
              why = sq.inContact
                ? 'squadInContact'
                : sq.clearContact
                  ? 'clearContact'
                  : first
                    ? 'firstHand'
                    : 'none';
            add((stale ? 'stale:' : c ? 'live:' : 'nolive:') + why + (e.engaged ? '' : ':unlatched'), 2);
          });
        });
      });
    },
    report: function () {
      return out;
    }
  };
})(window);
