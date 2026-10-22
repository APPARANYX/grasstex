/* Read-only benchmark observer. No gameplay hooks, contact writes, RNG or orders. */
(function (root) {
  'use strict';
  function create(R, b, options = {}) {
    const E = R.BattleEngagement,
      P = R.BattleReactiveFireManeuver;
    const stages = {},
      stageReasons = {},
      slotAudit = {},
      active = new Map(),
      positioning = new Map(),
      seenLeases = new WeakSet(),
      squads = new Map(),
      rows = [],
      rejected = new WeakMap();
    const counts = {
      authorized: 0,
      adopted: 0,
      completed: 0,
      interrupted: 0,
      supportShotsDuringMovement: 0,
      adoptionRejected: 0,
      positionPendingSamples: 0,
      positionReadySamples: 0,
      positionedSupportSamples: 0,
      // Squad Leader firing-position assignments, kept apart from team bounds above.
      firingAssigned: 0,
      firingAdopted: 0,
      firingArrived: 0,
      firingLineGained: 0,
      firingInterrupted: 0,
      firingSupportShots: 0,
      firingPendingSamples: 0,
      firingNoSlotSamples: 0
    };
    let nextDiagnostic = 0;
    function shot(s) {
      for (const [man, row] of positioning)
        if (man !== s && man.squad === s.squad && man.moving && E.stateOf(man).state === 'bound') {
          row.supportShots++;
          counts.firingSupportShots++;
          break;
        }
      for (const [man, row] of active)
        if (man !== s && man.squad === s.squad && man.moving && E.stateOf(man).state === 'bound') {
          row.supportShots++;
          counts.supportShotsDuringMovement++;
          break;
        }
    }
    function sample() {
      for (const f of ['us', 'ge'])
        for (const q of b.factions[f].squads) {
          const key = f + ':' + q.id;
          let state = squads.get(key);
          if (!state) {
            state = {
              squad: key,
              contactAt: null,
              supportAt: null,
              maxSupporters: 0,
              positionReadyAt: null,
              positionedSupportAt: null,
              completedLeases: new Set(),
              denials: {}
            };
            squads.set(key, state);
          }
          if (q.inContact && state.contactAt == null) state.contactAt = b.time;
          const lease = R.BattleLeases.get(q, 'bound');
          if (lease && lease.data && lease.data.reactiveFireManeuver && !seenLeases.has(lease)) {
            seenLeases.add(lease);
            if (lease.data.firingPosition) counts.firingAssigned++;
            else counts.authorized++;
          }
          for (const man of q.members) {
            const e = man.eng;
            const n = (e && e.coveredBound && e.coveredBound.rejected) || 0;
            counts.adoptionRejected += Math.max(0, n - (rejected.get(man) || 0));
            rejected.set(man, n);
            if (
              e &&
              e.state === 'bound' &&
              e.moveReason === 'assigned firing position: cover' &&
              !positioning.has(man)
            ) {
              counts.firingAdopted++;
              positioning.set(man, {
                id: man.id,
                squad: key,
                at: b.time,
                start: { x: man.root.position.x, z: man.root.position.z },
                goal: e.cover && { x: e.cover.x, z: e.cover.z },
                supportShots: 0
              });
            }
            if (
              e &&
              e.state === 'bound' &&
              e.moveReason === 'authorized fireteam bound: cover' &&
              !active.has(man)
            ) {
              counts.adopted++;
              active.set(man, {
                id: man.id,
                squad: key,
                team: man._fireteamKey,
                leaseAt: lease && lease.since,
                at: b.time,
                start: { x: man.root.position.x, z: man.root.position.z },
                goal: e.cover && { x: e.cover.x, z: e.cover.z },
                supportShots: 0
              });
            }
          }
          if (b.time >= nextDiagnostic) {
            const support = P.supporters(b, q, { fireSupport: q.members }, []).length,
              task = q._localTask;
            state.maxSupporters = Math.max(state.maxSupporters, support);
            if (q.inContact && support >= 2 && state.supportAt == null) state.supportAt = b.time;
            const positions = P.defensiveReadiness(b, q);
            state.positions = positions;
            if (q.inContact && typeof P.squadStage === 'function') {
              const stage = P.squadStage(b, q, { fireSupport: q.members });
              stages[stage.stage] = (stages[stage.stage] || 0) + 1;
              const sr = stage.stage + ':' + stage.reason;
              stageReasons[sr] = (stageReasons[sr] || 0) + 1;
            }
            if (q.inContact) {
              if (positions.ready) {
                counts.positionReadySamples++;
                if (state.positionReadyAt == null) state.positionReadyAt = b.time;
                if (support >= 2) {
                  counts.positionedSupportSamples++;
                  if (state.positionedSupportAt == null) state.positionedSupportAt = b.time;
                }
              } else counts.positionPendingSamples++;
              // The same read-only plan the Squad Leader consults; absent on older runtimes.
              if (positions.ready && support >= 2 && typeof P.firingPositionPlan === 'function') {
                const plan = P.firingPositionPlan(b, q, { fireSupport: q.members });
                for (const [key, n] of Object.entries(plan.audit || {}))
                  slotAudit[key] = (slotAudit[key] || 0) + n;
                if (plan.pending) counts.firingPendingSamples++;
                if (plan.reason === 'no-safe-firing-position') counts.firingNoSlotSamples++;
              }
            }
            let reason = !q.inContact
              ? 'no-contact'
              : !task
                ? 'no-local-task'
                : !P.canTask(q, task.inputs)
                  ? P.taskReason(q, task.inputs) + ':' + task.kind
                  : support < 2
                    ? 'no-effective-support'
                    : !positions.ready
                      ? 'squad-not-settled'
                      : 'eligible';
            state.denials[reason] = (state.denials[reason] || 0) + 1;
            if (reason === 'eligible') {
              const gate = !task.boundsAllowed
                ? 'local-commitment'
                : !q._assaultAuthorized
                  ? 'assault-authority'
                  : R.BattleLeases.holds(q, 'bound-cycle', b.time)
                    ? 'bound-cycle'
                    : R.BattleLeases.holds(q, 'bound', b.time)
                      ? 'bound-active'
                      : 'team-selection';
              const g = 'native:' + gate;
              state.denials[g] = (state.denials[g] || 0) + 1;
            }

            if (options.routes && reason === 'eligible') {
              for (const team of ['alpha', 'bravo', 'charlie']) {
                const movers = q.members.filter(
                  s => !s.dead && !R.SquadAI.isMachineGun(s) && s._fireteamKey === team
                );
                const gate = P.assessTeam(b, q, movers, {
                  fireSupport: q.members.filter(s => E.supportReady(s, b))
                });
                const key = 'team:' + gate.reason;
                state.denials[key] = (state.denials[key] || 0) + 1;
                if (
                  !gate.eligible &&
                  gate.reason === 'no-usable-cover' &&
                  !(state.coverSurveys || []).some(x => x.team === team)
                ) {
                  const C = R.BattleCoverPositions;
                  const survey = { team, at: b.time, men: [] };
                  for (const man of movers) {
                    const threats = C.boundThreats(man, b);
                    const slots = threats.length
                      ? C.candidates(man, b, { root: { position: threats[0] } }, 40)
                      : [];
                    survey.men.push({
                      id: man.id,
                      x: man.root.position.x,
                      z: man.root.position.z,
                      candidates12: slots.filter(c => c.distance <= 12).length,
                      candidates20: slots.filter(c => c.distance <= 20).length,
                      candidates40: slots.length,
                      nearest: slots.length ? Math.min(...slots.map(c => c.distance)) : null
                    });
                  }
                  (state.coverSurveys ||= []).push(survey);
                }
              }
            }
          }
        }
      for (const [man, row] of active) {
        const e = man.eng,
          d = row.goal
            ? Math.hypot(man.root.position.x - row.goal.x, man.root.position.z - row.goal.z)
            : Infinity;
        if (d < 0.45 || man.dead || !e || e.state !== 'bound') {
          row.end = b.time;
          row.metres = Math.hypot(man.root.position.x - row.start.x, man.root.position.z - row.start.z);
          row.arrived = !man.dead && d < 0.45 && row.metres > 0.75;
          row.reason = man.dead ? 'casualty' : e && e.state;
          if (row.arrived) {
            counts.completed++;
            squads.get(row.squad).completedLeases.add(row.leaseAt);
          } else counts.interrupted++;
          if (rows.length < 500) rows.push(row);
          active.delete(man);
        }
      }
      for (const [man, row] of positioning) {
        const e = man.eng,
          d = row.goal
            ? Math.hypot(man.root.position.x - row.goal.x, man.root.position.z - row.goal.z)
            : Infinity;
        if (d < 0.45 || man.dead || !e || e.state !== 'bound') {
          if (!man.dead && d < 0.45) {
            counts.firingArrived++;
            if (P.firingLineAt(man, b, man.root.position)) counts.firingLineGained++;
          } else counts.firingInterrupted++;
          positioning.delete(man);
        }
      }
      if (b.time >= nextDiagnostic) nextDiagnostic = b.time + 1.5;
    }
    function snapshot() {
      const summary = [...squads.values()].map(s => ({
        ...s,
        completedLeases: s.completedLeases.size,
        contactToSupport: s.contactAt != null && s.supportAt != null ? s.supportAt - s.contactAt : null
      }));
      return {
        ...counts,
        stages: { ...stages },
        stageReasons: { ...stageReasons },
        slotAudit: { ...slotAudit },
        successiveSquads: summary.filter(s => s.completedLeases > 1).length,
        active: active.size,
        rowsOmitted: counts.completed + counts.interrupted - rows.length,
        squads: summary,
        bounds: rows.map(r => ({ ...r }))
      };
    }
    return { sample, shot, snapshot };
  }
  const api = { create };
  if (typeof module !== 'undefined') module.exports = api;
  else root.BattleBenchmarkReactiveManeuver = api;
})(typeof window !== 'undefined' ? window : globalThis);
