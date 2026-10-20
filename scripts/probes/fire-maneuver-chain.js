/* Read-only, single-seed trace of the personal-knowledge -> support -> bound
   chain. Run with scripts/run_probe.cjs; never supplies tactical evidence. */
(function (root) {
  'use strict';
  let rows = [],
    last = new Map();
  const pt = p => (p ? { x: +p.x.toFixed(2), z: +p.z.toFixed(2) } : null);
  (root.BattleProbes = root.BattleProbes || {})['fire-maneuver-chain'] = {
    every: 0.45,
    start() {
      rows = [];
      last = new Map();
    },
    sample(b) {
      for (const side of ['us', 'ge'])
        for (const sq of b.factions[side].squads) {
          const p = root.BattleSquadStability.tacticalPostures.current(b, sq);
          const key = side + ':' + sq.id;
          if (!p && !last.get(key)) continue;
          last.set(key, !!p);
          if (rows.length >= 2000) continue;
          rows.push({
            t: +b.time.toFixed(2),
            squad: key,
            mode: p?.mode,
            stage: p?.stage,
            serial: p?.serial,
            readyAt: p?.readyAt,
            held: p?.heldActorIds,
            decision: p?.lastManeuverDecision && JSON.parse(JSON.stringify(p.lastManeuverDecision)),
            fireControl:
              sq.fireControl &&
              JSON.parse(JSON.stringify(sq.fireControl, (k, v) => (k === 'target' ? undefined : v))),
            members: sq.members
              .filter(s => !s.dead)
              .map(s => {
                const E = root.BattleEngagement,
                  e = E.stateOf(s),
                  A = root.SquadAI;
                const c = A.soldierContact(s, b),
                  d = root.BattleCallouts.heardBy(b, s);
                return {
                  id: s.id,
                  pos: pt(s.root.position),
                  state: e.state,
                  stance: A.stanceOf(s),
                  moving: !!s.moving,
                  suppressed: s.suppressedUntil > b.time,
                  incoming: E.underFireNow(s, b),
                  authorized: E.fireAuthorized(s, b),
                  support: E.supportReady(s, b),
                  target: s.target?.id,
                  bound: !!e.boundOrder,
                  cover: pt(e.cover),
                  defence: E.squadDefensiveContact(s, b),
                  selected: c && {
                    source: c.source,
                    at: c.at,
                    point: pt(c),
                    precision: c.precision,
                    confidence: c.confidence
                  },
                  beliefs: A.beliefSnapshot(s, b)?.beliefs,
                  heard: d && {
                    kind: d.msg.kind,
                    from: d.msg.from,
                    squad: d.msg.fromSquad,
                    at: d.msg.fact.at,
                    precision: d.msg.fact.precision,
                    point: pt(d.msg.fact),
                    confidence: d.confidence
                  }
                };
              })
          });
        }
    },
    report() {
      return rows;
    }
  };
})(window);
