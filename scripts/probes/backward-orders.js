/* Are men sent behind the squad's line while it advances? (AGENTS.md open issue "Forward movement:
   no backward orders while the squad advances"). Measure before fixing: every new destination the
   Movement Resolver commits is projected on the squad's objective axis (objective minus order anchor,
   or `_formationForward` when the anchor sits on the objective, as `16` `commandForward` does).
   `behindLine` means more than ALLOW metres behind the man's line: his fireteam's forward line
   (`sq._forwardLine.teams[key]`, the Squad Leader's forward-majority point, where most of the team
   actually is), else the squad's forward line; on code without `_forwardLine`, his fireteam's order
   anchor (`sq._fireteamOrders[key].anchor`), else the squad order anchor. The report says which
   (`lineSource`). `backStep` means more than ALLOW
   metres behind where the man stands; `behindAndBack` is both at once (walked back behind the
   line), the case the open issue is about, since a man already behind who is told to hold is
   `behindLine` without stepping back. All are counted by producer (`_movementProposalOwner` /
   resolver `last.kind`) and by command phase. Squads retreating and men in `withdraw` are excluded:
   backward is their order. Observe only. */
(function (root) {
  var ALLOW = 3,
    c,
    seen,
    anchors;
  function axis(sq) {
    var fl = sq._forwardLine;
    if (fl && fl.axis) return fl.axis;
    var a = sq.orderAnchor || sq.rally,
      g = sq.objective || sq.home;
    if (!a || !g) return null;
    var dx = g.x - a.x,
      dz = g.z - a.z,
      l = Math.hypot(dx, dz);
    if (l < 0.1) {
      var f = sq._formationForward;
      l = f ? Math.hypot(+f.x || 0, +f.z || 0) : 0;
      return l > 1e-6 ? { x: f.x / l, z: f.z / l } : null;
    }
    return { x: dx / l, z: dz / l };
  }
  function line(s, sq) {
    var fl = sq._forwardLine;
    if (fl) {
      var t = fl.teams && s._fireteamKey && fl.teams[s._fireteamKey];
      c.lineSource['forward-majority']++;
      return (t && t.point) || fl.point;
    }
    c.lineSource['order-anchor']++;
    var o = sq._fireteamOrders && s._fireteamKey && sq._fireteamOrders[s._fireteamKey];
    return (o && o.anchor) || sq.orderAnchor || sq.rally;
  }
  function add(map, k, field) {
    var b = (map[k] = map[k] || { changes: 0, behindLine: 0, backStep: 0, behindAndBack: 0, behindLineM: 0 });
    b.changes++;
    if (field) {
      b[field.kind]++;
      if (field.kind === 'behindLine') b.behindLineM += field.m;
    }
  }
  (root.BattleProbes = root.BattleProbes || {})['backward-orders'] = {
    every: 0,
    start: function () {
      seen = new Map();
      anchors = new Map();
      c = { changes: 0, excluded: 0, behindLine: 0, backStep: 0, behindAndBack: 0, byProducer: {}, byPhase: {}, behindAndBackBy: {}, formationCause: {}, formationKind: {}, formationExamples: [], examples: [], lineSource: { 'forward-majority': 0, 'order-anchor': 0 } };
    },
    sample: function (sim) {
      var men = root.BattleModules.unitsFor(sim);
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!s || s.dead || !s.root || !s.destination) continue;
        var d = s.destination,
          prev = seen.get(s);
        if (prev && prev.x === d.x && prev.z === d.z) continue;
        seen.set(s, { x: d.x, z: d.z });
        if (!prev) continue; // the spawn destination is not an order
        var sq = s.squad,
          e = s.eng || {};
        if (!sq || sq.state === 'retreat' || sq.commandPhase === 'retreat' || e.state === 'withdraw') {
          c.excluded++;
          continue;
        }
        var f = axis(sq),
          l = line(s, sq);
        if (!f || !l) {
          c.excluded++;
          continue;
        }
        var last = (s._movementResolver && s._movementResolver.last) || {},
          producer = (s._movementProposalOwner || last.owner || '?') + '/' + (last.kind || '?'),
          phase = sq.commandPhase || '?',
          p = s.root.position,
          vsLine = (d.x - l.x) * f.x + (d.z - l.z) * f.z,
          vsMan = (d.x - p.x) * f.x + (d.z - p.z) * f.z,
          hit = null;
        c.changes++;
        if (vsLine < -ALLOW) {
          c.behindLine++;
          hit = { kind: 'behindLine', m: -vsLine };
        }
        add(c.byProducer, producer, hit);
        add(c.byPhase, phase, hit);
        if (vsMan < -ALLOW) {
          c.backStep++;
          c.byProducer[producer].backStep++;
          c.byPhase[phase].backStep++;
          if (hit) {
            c.behindAndBack++;
            c.byProducer[producer].behindAndBack++;
            c.byPhase[phase].behindAndBack++;
            /* Why the producer sent him back: its stated reason, and whether he was under fire. */
            var why = producer + ' | ' + (last.reason || '?') + (s.suppressedUntil > sim.time ? ' | suppressed' : '');
            c.behindAndBackBy[why] = (c.behindAndBackBy[why] || 0) + 1;
            /* A formation order sent him back: did his team's anchor just move (a new lease), or is
               the anchor unchanged (the slot alone changed) and is the man himself already past his
               team's line (he ran ahead of a held anchor)? */
            if (producer === 'squad-stability/formation') {
              var o = sq._fireteamOrders && s._fireteamKey && sq._fireteamOrders[s._fireteamKey],
                ak = sq.id + '|' + s._fireteamKey,
                pa = anchors.get(ak),
                moved = !!(o && o.anchor && (!pa || pa.x !== o.anchor.x || pa.z !== o.anchor.z)),
                manVsLine = (p.x - l.x) * f.x + (p.z - l.z) * f.z,
                cause = (moved ? 'anchor-moved' : 'same-anchor') + (manVsLine > ALLOW ? ' | man ahead of line' : ' | man on line');
              c.formationCause[cause] = (c.formationCause[cause] || 0) + 1;
              var pk = String(s._fireteamPublishKey || '').split('|'),
                anchorVsLine = o && o.anchor ? (o.anchor.x - l.x) * f.x + (o.anchor.z - l.z) * f.z : null,
                fx = c.formationExamples;
              c.formationKind[pk[pk.length - 1] || '?'] = (c.formationKind[pk[pk.length - 1] || '?'] || 0) + 1;
              if (fx.length < 25)
                fx.push({
                  t: +sim.time.toFixed(2), soldier: s.id, squad: sq.id, team: s._fireteamKey, phase: phase,
                  state: sq.state, inContact: !!sq.inContact, eng: e.state || null, kind: pk[pk.length - 1],
                  anchorVsLineM: anchorVsLine == null ? null : +anchorVsLine.toFixed(1),
                  publishedVsLineM: s._fireteamDestination
                    ? +((s._fireteamDestination.x - l.x) * f.x + (s._fireteamDestination.z - l.z) * f.z).toFixed(1)
                    : null,
                  publishedToDestM: s._fireteamDestination
                    ? +Math.hypot(s._fireteamDestination.x - d.x, s._fireteamDestination.z - d.z).toFixed(1)
                    : null,
                  lineAge: sq._forwardLine ? +(sim.time - sq._forwardLine.t).toFixed(2) : null,
                  hasTeamLine: !!(sq._forwardLine && sq._forwardLine.teams && sq._forwardLine.teams[s._fireteamKey]),
                  manVsLineM: +manVsLine.toFixed(1), leaseLeft: o ? +(o.until - sim.time).toFixed(1) : null,
                  teamSize: sq.members.filter(function (m) { return !m.dead && m._fireteamKey === s._fireteamKey; }).length
                });
            }
          }
        }
        if (hit && c.examples.length < 25)
          c.examples.push({
            t: +sim.time.toFixed(2), soldier: s.id, role: s.role, faction: s.faction, squad: sq.id, phase: phase,
            producer: producer, reason: last.reason || null, eng: e.state || null,
            behindLineM: +(-vsLine).toFixed(1), behindManM: +(-vsMan).toFixed(1)
          });
      }
      /* After the pass, so the next sample compares against this one. */
      for (i = 0; i < men.length; i++) {
        var q = men[i] && men[i].squad,
          fo = q && q._fireteamOrders && men[i]._fireteamKey && q._fireteamOrders[men[i]._fireteamKey];
        if (fo && fo.anchor) anchors.set(q.id + '|' + men[i]._fireteamKey, { x: fo.anchor.x, z: fo.anchor.z });
      }
    },
    report: function () {
      var round = function (m) {
        Object.keys(m).forEach(function (k) {
          var b = m[k];
          b.behindLineMeanM = b.behindLine ? +(b.behindLineM / b.behindLine).toFixed(1) : 0;
          delete b.behindLineM;
        });
        return m;
      };
      return {
        allowM: ALLOW,
        lineSource: c.lineSource,
        changes: c.changes,
        excludedRetreatOrNoAxis: c.excluded,
        behindLine: c.behindLine,
        behindLineRate: c.changes ? +(c.behindLine / c.changes).toFixed(4) : 0,
        backStep: c.backStep,
        behindAndBack: c.behindAndBack,
        byProducer: round(c.byProducer),
        byPhase: round(c.byPhase),
        behindAndBackBy: c.behindAndBackBy,
        formationCause: c.formationCause,
        formationKind: c.formationKind,
        formationExamples: c.formationExamples,
        examples: c.examples
      };
    }
  };
})(window);
