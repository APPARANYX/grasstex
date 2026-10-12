/* #299 C foundation: one opt-in Meso arbitration policy, not another command
   system. Inputs are own men and reported beliefs, never enemy transforms.
   Existing recon/cohesion/Engagement owners execute the result. This does not
   assess covered routes or implement ambush/fire-and-maneuver postures. */
(function (root) {
  'use strict';
  if (root._squadLeaderLocalPlan) return;
  root._squadLeaderLocalPlan = function (ctx) {
    var A = root.SquadAI,
      L = root.BattleLeases,
      on = /[?&]localPlan=(?:1|on|true)(?:&|#|$)/i.test((root.location && root.location.search) || ''),
      resourcesOn =
        on &&
        /[?&]localResources=(?:1|on|true)(?:&|#|$)/i.test((root.location && root.location.search) || ''),
      degradationOn =
        on && /[?&]localDegrade=(?:1|on|true)(?:&|#|$)/i.test((root.location && root.location.search) || ''),
      tasksOn =
        on && /[?&]localTasks=(?:1|on|true)(?:&|#|$)/i.test((root.location && root.location.search) || ''),
      structuresOn =
        tasksOn &&
        /[?&]localStructures=(?:1|on|true)(?:&|#|$)/i.test((root.location && root.location.search) || ''),
      entryOn =
        structuresOn &&
        /[?&]localEntry=(?:1|on|true)(?:&|#|$)/i.test((root.location && root.location.search) || ''),
      entryGateOn =
        entryOn &&
        /[?&]localEntryGate=(?:1|on|true)(?:&|#|$)/i.test((root.location && root.location.search) || ''),
      surveyOn =
        entryGateOn &&
        /[?&]localSurvey=(?:1|on|true)(?:&|#|$)/i.test((root.location && root.location.search) || ''),
      watchOn =
        surveyOn &&
        /[?&]localWatch=(?:1|on|true)(?:&|#|$)/i.test((root.location && root.location.search) || ''),
      contactResumeOn =
        watchOn &&
        /[?&]localContactResume=(?:1|on|true)(?:&|#|$)/i.test((root.location && root.location.search) || ''),
      continuityOn =
        contactResumeOn &&
        /[?&]localContinuity=(?:1|on|true)(?:&|#|$)/i.test((root.location && root.location.search) || ''),
      presence = new WeakMap(),
      revokedPresence = new WeakMap(),
      structureOrdersOn =
        continuityOn &&
        /[?&]localStructureOrders=(?:1|on|true)(?:&|#|$)/i.test(
          (root.location && root.location.search) || ''
        ),
      structureOrders = new WeakMap(),
      tuning = {
        pressureEnter: 0.45,
        pressureExit: 0.25,
        emergency: 0.75,
        contactAge: 10,
        confidence: 0.5,
        resourceLimit: 32,
        minimumSupport: 2,
        presenceGap: 1.5,
        presenceSpeed: 7,
        presenceSlack: 0.15
      };
    function point(p) {
      return p && typeof p.x === 'number' && typeof p.z === 'number' && isFinite(p.x) && isFinite(p.z)
        ? { x: p.x, z: p.z }
        : null;
    }

    /* Navigation alone describes a doorway, not an occupied or cleared room.
       Only annotate an already accepted, versioned route leg which terminates
       inside a real ground-floor footprint. All coordinates are from the
       shipping Navigation and own-roster/report owners, never enemy transforms. */
    function insideBuilding(b, p) {
      if (!b || !p || !point(b) || !(+b.w > 0) || !(+b.d > 0) || !isFinite(+b.rot || 0)) return false;
      var dx = p.x - b.x,
        dz = p.z - b.z,
        c = Math.cos(+b.rot || 0),
        si = Math.sin(+b.rot || 0);
      return Math.abs(dx * c - dz * si) < b.w / 2 - 0.05 && Math.abs(dx * si + dz * c) < b.d / 2 - 0.05;
    }
    function combatHeld(sq) {
      var p = sq._engagementPlan;
      return !!sq.inContact || !!(continuityOn && p && (p.status === 'active' || p.status === 'quiet'));
    }
    function controlEpoch(s) {
      return s && s.eng ? +s.eng.possessionEpoch || 0 : 0;
    }
    function presenceValid(sim, sq, state) {
      var N = root.BattleNavigation,
        leader = A.leaderOf(sq),
        m = sq._macroMission,
        ex = sq._missionExecution,
        target = point((sq.route || [])[+sq.routeIndex]),
        meta = sim.scene && sim.scene.metadata,
        scene = meta && (meta.battleScenario || meta.battleTown),
        now = +sim.time || 0;
      if (
        !state ||
        !N ||
        !m ||
        !ex ||
        ex.mission !== m ||
        m.status !== 'executing' ||
        state.mission !== m ||
        state.missionVersion !== ctx.missionVersion(sq) ||
        state.leg !== +sq.routeIndex ||
        !target ||
        target.x !== state.target.x ||
        target.z !== state.target.z ||
        ctx.commanded(sq).length > tuning.resourceLimit ||
        state.scene !== scene ||
        N.scenario !== scene ||
        state.navigationVersion !== N.version ||
        sq.state === 'retreat' ||
        ctx.leaderlessActive(sq) ||
        leader !== state.leader ||
        controlEpoch(leader) !== state.leaderEpoch ||
        !leader ||
        leader.dead ||
        leader.hp <= 0 ||
        leader.incapacitated ||
        leader.isPlayer ||
        !leader.root ||
        !point(leader.root.position) ||
        !insideBuilding(state.building, leader.root.position) ||
        now < state.observedAt ||
        now - state.observedAt > tuning.presenceGap ||
        !N.movementClear(state.position, leader.root.position) ||
        Math.hypot(leader.root.position.x - state.position.x, leader.root.position.z - state.position.z) >
          tuning.presenceSlack + tuning.presenceSpeed * (now - state.observedAt)
      )
        return false;
      if (state.observations) {
        var witness = ctx.commanded(sq).find(function (s) {
          return String(s.id) === state.witnessId;
        });
        if (
          !witness ||
          witness === leader ||
          witness.dead ||
          witness.hp <= 0 ||
          witness.incapacitated ||
          witness.isPlayer ||
          controlEpoch(witness) !== state.witnessEpoch ||
          !witness.root ||
          !point(witness.root.position) ||
          !insideBuilding(state.building, witness.root.position) ||
          !N.movementClear(state.witnessPosition, witness.root.position) ||
          Math.hypot(
            witness.root.position.x - state.witnessPosition.x,
            witness.root.position.z - state.witnessPosition.z
          ) >
            tuning.presenceSlack + tuning.presenceSpeed * (now - state.observedAt) ||
          typeof A.hasLineOfSight !== 'function' ||
          typeof sim.heightAt !== 'function' ||
          !A.hasLineOfSight(witness, leader, sim.heightAt, sim.obstacles)
        )
          return false;
      }
      return true;
    }
    /* Separate provenance, never a synthesized crossing. Only this update hook
       advances the bounded observation chain. Read-only arrival queries cannot
       refresh it. A missing tick, impossible delta or lost witness is terminal. */
    function observePresence(sim, sq, structure) {
      if (!continuityOn) return;
      var old = presence.get(sq),
        now = +sim.time || 0;
      if (old && !presenceValid(sim, sq, old)) {
        revokedPresence.set(sq, old);
        presence.delete(sq);
        return;
      }
      var evidence = structure && structure.entryEvidence,
        N = root.BattleNavigation,
        meta = sim.scene && sim.scene.metadata,
        scene = meta && (meta.battleScenario || meta.battleTown),
        leader = A.leaderOf(sq);
      if (!old) {
        if (!evidence || !evidence.entryVerified || combatHeld(sq) || !scene || !leader || leader.isPlayer)
          return;
        var revoked = revokedPresence.get(sq);
        if (
          revoked &&
          revoked.mission === sq._macroMission &&
          revoked.leader === leader &&
          revoked.enteredAt === evidence.enteredAt
        )
          return;
        var b = scene.buildings.find(function (b) {
          return b.id === structure.buildingId;
        });
        old = {
          mission: sq._macroMission,
          missionVersion: ctx.missionVersion(sq),
          leg: +sq.routeIndex,
          target: point(sq.route[+sq.routeIndex]),
          scene: scene,
          building: b,
          navigationVersion: N.version,
          doorwayId: structure.doorwayId,
          leader: leader,
          leaderEpoch: controlEpoch(leader),
          enteredAt: evidence.enteredAt,
          observedAt: now,
          position: point(leader.root.position),
          observations: 0,
          interrupted: false,
          reassessmentAt: null
        };
      }
      var witness = ctx.commanded(sq).find(function (s) {
        return (
          s !== leader &&
          (!old.observations || String(s.id) === old.witnessId) &&
          !s.dead &&
          s.hp > 0 &&
          !s.incapacitated &&
          !s.isPlayer &&
          s.root &&
          point(s.root.position) &&
          insideBuilding(old.building, s.root.position) &&
          typeof A.hasLineOfSight === 'function' &&
          typeof sim.heightAt === 'function' &&
          A.hasLineOfSight(s, leader, sim.heightAt, sim.obstacles)
        );
      });
      if (!witness || !presenceValid(sim, sq, old)) {
        if (old.observations) revokedPresence.set(sq, old);
        presence.delete(sq);
        return;
      }
      if (now > old.observedAt || !old.observations) old.observations = Math.min(8, old.observations + 1);
      old.observedAt = now;
      old.position = point(leader.root.position);
      old.witnessId = String(witness.id);
      old.witnessEpoch = controlEpoch(witness);
      old.witnessPosition = point(witness.root.position);
      if (combatHeld(sq)) {
        old.interrupted = true;
        old.reassessmentAt = null;
      } else if (old.interrupted && old.reassessmentAt == null) old.reassessmentAt = now;
      presence.set(sq, old);
    }
    function reassessmentEvidence(sim, sq, b, entry) {
      var state = continuityOn && presence.get(sq);
      if (
        !presenceValid(sim, sq, state) ||
        state.building !== b ||
        state.doorwayId !== entry.id ||
        !state.interrupted ||
        state.observations < 2 ||
        state.reassessmentAt == null ||
        combatHeld(sq)
      )
        return null;
      return {
        provenance: 'continuous-interior-presence',
        observerId: String(state.leader.id),
        observerEpoch: state.leaderEpoch,
        missionVersion: state.missionVersion,
        leg: state.leg,
        enteredAt: state.reassessmentAt,
        physicalEntryAt: state.enteredAt,
        observedAt: state.observedAt,
        witnessId: state.witnessId,
        observations: state.observations,
        presenceVerified: true
      };
    }
    function authorizedEvidence(e) {
      return !!(e && (e.entryVerified || e.presenceVerified));
    }
    /* Tactical assignments are proposals consumed by the existing fireteam
       publisher, never destinations or firing orders. Navigation describes one
       footprint, so this is observation/security, not a room-clearing graph. */
    function updateStructureOrders(sim, sq, inputs) {
      if (!structureOrdersOn) return null;
      var m = sq._macroMission,
        ex = sq._missionExecution,
        N = root.BattleNavigation,
        leader = A.leaderOf(sq),
        target = point((sq.route || [])[+sq.routeIndex]),
        men = ctx.commanded(sq),
        now = +sim.time || 0,
        route = inputs.execution && inputs.execution.kind === 'structure-handoff',
        resume = ex && ex.contactRouteResume;
      if (
        !m ||
        m.status !== 'executing' ||
        !ex ||
        ex.mission !== m ||
        !isFinite(ex.acceptedAt) ||
        ex.acceptedAt > now ||
        !target ||
        !leader ||
        leader.isPlayer ||
        sq.state === 'retreat' ||
        ctx.leaderlessActive(sq) ||
        inputs.pressure >= tuning.pressureEnter ||
        L.get(sq, 'regroup') ||
        L.get(sq, 'recon') ||
        (!route &&
          !(
            resume &&
            resume.missionVersion === ctx.missionVersion(sq) &&
            resume.leg === +sq.routeIndex &&
            point(resume.target) &&
            resume.target.x === target.x &&
            resume.target.z === target.z &&
            N &&
            resume.navigationVersion === N.version &&
            isFinite(resume.interruptedAt) &&
            resume.interruptedAt <= now
          ))
      ) {
        structureOrders.delete(sq);
        return null;
      }
      var st = structureInterface(sim, sq, target, men),
        meta = sim.scene && sim.scene.metadata,
        scene = meta && (meta.battleScenario || meta.battleTown),
        b =
          st &&
          scene.buildings.find(function (b) {
            return b.id === st.buildingId;
          }),
        door =
          st &&
          N.doorPortals.find(function (p) {
            return p.id === st.doorwayId && p.building === st.buildingId;
          });
      if (!st || !b || !door || b.w < 4 || b.w > 30 || b.d < 4 || b.d > 30) {
        structureOrders.delete(sq);
        return null;
      }
      var readyMen = men.filter(function (s) {
          return (
            s &&
            s.hp > 0 &&
            !s.incapacitated &&
            !s.isPlayer &&
            s.root &&
            point(s.root.position) &&
            !(s.suppressedUntil > now) &&
            !(root.BattleTacticalPositions && root.BattleTacticalPositions.current(s))
          );
        }),
        buddy = readyMen.find(function (s) {
          return s !== leader && !A.isMachineGun(s);
        });
      if (readyMen.indexOf(leader) < 0 || !buddy) {
        structureOrders.delete(sq);
        return null;
      }
      var old = structureOrders.get(sq),
        same =
          old &&
          old.mission === m &&
          old.leader === leader &&
          old.buddy === buddy &&
          old.leg === +sq.routeIndex &&
          old.navigationVersion === N.version &&
          old.building === b,
        held =
          combatHeld(sq) ||
          (A.squadContactsMap(sq, sim) || []).some(function (c) {
            return (
              point(c) &&
              isFinite(c.at) &&
              c.at <= now &&
              now - c.at <= tuning.contactAge &&
              c.confidence >= tuning.confidence &&
              Math.hypot(c.x - b.x, c.z - b.z) <= Math.max(b.w, b.d) / 2 + 15
            );
          }),
        entered = authorizedEvidence(st.presenceEvidence || st.entryEvidence),
        stage = held
          ? 'contact-security'
          : !entered
            ? Math.hypot(leader.root.position.x - door.outside.x, leader.root.position.z - door.outside.z) >
                0.6 &&
              !insideBuilding(b, leader.root.position) &&
              !(same && old.stage === 'cross-door')
              ? 'approach-door'
              : 'cross-door'
            : !st.survey.complete
              ? 'observe-footprint'
              : 'watch-doorway',
        co = Math.cos(+b.rot || 0),
        si = Math.sin(+b.rot || 0),
        middlePost = { x: b.x + 0.2 * b.w * co, z: b.z - 0.2 * b.w * si },
        mask = st.survey ? st.survey.sectorMask : 0,
        sector = 0;
      while (sector < 3 && mask & (1 << sector)) sector++;
      function sectorPoint(i) {
        var lx = (i % 2 ? 0.23 : -0.23) * b.w,
          lz = (i >= 2 ? 0.23 : -0.23) * b.d;
        return { x: b.x + lx * co + lz * si, z: b.z - lx * si + lz * co };
      }
      var dx = door.inside.x - door.outside.x,
        dz = door.inside.z - door.outside.z,
        len = Math.hypot(dx, dz),
        orders = [];
      readyMen.forEach(function (s, i) {
        var role = s === leader ? 'door-guard' : s === buddy ? 'interior-observer' : 'exterior-security',
          p =
            s === leader
              ? stage === 'approach-door'
                ? door.outside
                : door.inside
              : s === buddy && entered
                ? middlePost
                : {
                    x: door.outside.x - (dz / len) * (i % 2 ? -1 : 1) * (2 + i),
                    z: door.outside.z + (dx / len) * (i % 2 ? -1 : 1) * (2 + i)
                  },
          watch =
            s === leader
              ? stage === 'observe-footprint'
                ? sectorPoint(sector)
                : door.outside
              : s === buddy
                ? stage === 'observe-footprint'
                  ? sectorPoint((sector + 2) % 4)
                  : { x: b.x, z: b.z }
                : door.outside;
        if (held) {
          var prior =
            same &&
            old.orders.find(function (o) {
              return o.soldierId === String(s.id);
            });
          // Do not manufacture a new exposed security move during contact.
          p =
            prior && Math.hypot(s.root.position.x - prior.point.x, s.root.position.z - prior.point.z) < 0.7
              ? prior.point
              : point(s.root.position);
        }
        if (!point(p) || !N.movementClear(p, p)) return;
        var cached =
            same &&
            old.orders.find(function (o) {
              return o.soldierId === String(s.id);
            }),
          here = point(s.root.position),
          reused =
            cached &&
            cached.point.x === p.x &&
            cached.point.z === p.z &&
            N.movementClear(cached.observedPosition, here) &&
            Math.hypot(cached.observedPosition.x - here.x, cached.observedPosition.z - here.z) <=
              tuning.presenceSlack + tuning.presenceSpeed * (now - old.at),
          path = reused ? [p] : N.findPath(here, p),
          previous = here;
        if (
          !Array.isArray(path) ||
          !path.length ||
          path.length > 24 ||
          (!reused &&
            path.some(function (p) {
              var clear = N.movementClear(previous, p);
              previous = p;
              return !clear;
            }))
        )
          return;
        orders.push({
          soldierId: String(s.id),
          role: role,
          point: point(p),
          observedPosition: here,
          watchPoint: point(watch),
          key: [
            'structure',
            ctx.missionVersion(sq),
            +sq.routeIndex,
            N.version,
            b.id,
            stage,
            stage === 'observe-footprint' ? mask : '',
            role
          ].join('|')
        });
      });
      if (
        !orders.some(function (o) {
          return o.soldierId === String(leader.id);
        }) ||
        !orders.some(function (o) {
          return o.soldierId === String(buddy.id);
        })
      ) {
        structureOrders.delete(sq);
        return null;
      }
      structureOrders.set(sq, {
        mission: m,
        missionVersion: ctx.missionVersion(sq),
        leader: leader,
        buddy: buddy,
        leaderEpoch: controlEpoch(leader),
        buddyEpoch: controlEpoch(buddy),
        building: b,
        target: target,
        scene: scene,
        leg: +sq.routeIndex,
        navigationVersion: N.version,
        at: now,
        orders: orders,
        stage: stage
      });
      return {
        buildingId: b.id,
        doorwayId: door.id,
        stage: stage,
        orders: orders,
        missionVersion: ctx.missionVersion(sq),
        leg: +sq.routeIndex,
        at: now,
        owner: 'squad-leader/fireteam-publisher',
        clearance: 'not-assessed'
      };
    }
    function currentStructureOrders(sim, sq) {
      var st = structureOrdersOn && structureOrders.get(sq),
        N = root.BattleNavigation,
        target = point((sq.route || [])[+sq.routeIndex]),
        meta = sim.scene && sim.scene.metadata,
        scene = meta && (meta.battleScenario || meta.battleTown);
      return st &&
        st.mission === sq._macroMission &&
        sq._macroMission.status === 'executing' &&
        st.missionVersion === ctx.missionVersion(sq) &&
        target &&
        target.x === st.target.x &&
        target.z === st.target.z &&
        st.scene === scene &&
        N &&
        N.scenario === scene &&
        st.leader === A.leaderOf(sq) &&
        st.leaderEpoch === controlEpoch(st.leader) &&
        st.buddyEpoch === controlEpoch(st.buddy) &&
        !st.leader.dead &&
        !st.leader.isPlayer &&
        st.leader.hp > 0 &&
        !st.leader.incapacitated &&
        !st.buddy.dead &&
        !st.buddy.isPlayer &&
        !st.buddy.incapacitated &&
        st.leg === +sq.routeIndex &&
        N &&
        st.navigationVersion === N.version &&
        sim.time >= st.at &&
        sim.time - st.at <= 0.5 &&
        sq.state !== 'retreat' &&
        !ctx.leaderlessActive(sq) &&
        !L.get(sq, 'regroup') &&
        !L.get(sq, 'recon')
        ? st
        : null;
    }
    function structureSoldierOrder(s, sim) {
      var st = s && s.squad && currentStructureOrders(sim, s.squad);
      if (!st || s.dead || s.incapacitated || s.isPlayer || s.suppressedUntil > sim.time) return null;
      var o = st.orders.find(function (o) {
        return o.soldierId === String(s.id);
      });
      return o && s._fireteamPublishKey === o.key ? o : null;
    }
    /* #299 C footprint-only security observation. Four inward ground-floor
       sightline samples are NOT enemy detection, room clearance or control.
       Require the original physical doorway crossing, two independent living
       members inside, their actual look direction, and shipping terrain/obstacle
       /Navigation LOS. Evidence is bounded in the current local-task snapshot:
       no second commander, fire, position or mission writer. */
    function interiorSurvey(sim, sq, b, men, entryEvidence, prior, threats) {
      var now = +sim.time || 0,
        verified = authorizedEvidence(entryEvidence),
        eligible =
          verified &&
          !combatHeld(sq) &&
          !threats &&
          b.w >= 4 &&
          b.w <= 30 &&
          b.d >= 4 &&
          b.d <= 30 &&
          typeof sim.heightAt === 'function' &&
          typeof A.lookYaw === 'function' &&
          typeof A.hasLineOfSight === 'function',
        inside = eligible
          ? men.filter(function (s) {
              return (
                s &&
                s.squad === sq &&
                !s.dead &&
                s.hp > 0 &&
                !s.incapacitated &&
                !s.isPlayer &&
                s.root &&
                s.root.position &&
                point(s.root.position) &&
                insideBuilding(b, s.root.position)
              );
            })
          : [],
        previous = prior && prior.survey,
        previousEntry = prior && (prior.presenceEvidence || prior.entryEvidence),
        continuity =
          eligible &&
          previous &&
          previousEntry &&
          authorizedEvidence(previousEntry) &&
          previousEntry.enteredAt === entryEvidence.enteredAt &&
          previous.observedAt <= now &&
          now - previous.observedAt <= 3,
        mask = continuity ? previous.sectorMask | 0 : 0,
        contributors =
          continuity && Array.isArray(previous.contributors) ? previous.contributors.slice(0, 32) : [],
        epochs = continuityOn && continuity ? Object.assign({}, previous.observerEpochs) : {},
        sectorAt =
          structureOrdersOn && continuity && Array.isArray(previous.sectorObservedAt)
            ? previous.sectorObservedAt.slice(0, 4)
            : [],
        sectorObservers =
          structureOrdersOn && continuity && Array.isArray(previous.sectorObservers)
            ? previous.sectorObservers.slice(0, 4)
            : [],
        contributorAt =
          structureOrdersOn && continuity ? Object.assign({}, previous.contributorObservedAt) : {};
      if (structureOrdersOn) {
        for (var sector = 0; sector < 4; sector++) {
          if (
            !isFinite(sectorAt[sector]) ||
            sectorAt[sector] > now ||
            now - sectorAt[sector] > 3 ||
            !inside.some(function (s) {
              return String(s.id) === sectorObservers[sector];
            })
          )
            mask &= ~(1 << sector);
        }
        contributors = contributors.filter(function (id) {
          return isFinite(contributorAt[id]) && contributorAt[id] <= now && now - contributorAt[id] <= 3;
        });
      }
      /* A lost or exited observer cannot carry a fictitious sector survey forward. */
      if (
        contributors.some(function (id) {
          return !inside.some(function (s) {
            return String(s.id) === id && (!continuityOn || epochs[id] === controlEpoch(s));
          });
        })
      ) {
        mask = 0;
        contributors = [];
        epochs = {};
      }
      if (inside.length >= 2) {
        var co = Math.cos(+b.rot || 0),
          si = Math.sin(+b.rot || 0),
          offsets = [
            [-0.23, -0.23],
            [0.23, -0.23],
            [-0.23, 0.23],
            [0.23, 0.23]
          ];
        offsets.forEach(function (offset, i) {
          if (mask & (1 << i) && contributors.length >= 2) return;
          var lx = offset[0] * b.w,
            lz = offset[1] * b.d,
            p = { x: b.x + lx * co + lz * si, z: b.z - lx * si + lz * co };
          if (!insideBuilding(b, p)) return;
          var marker = { root: { position: p } };
          for (var j = 0; j < inside.length; j++) {
            var member = inside[j],
              pos = member.root.position,
              d = Math.hypot(p.x - pos.x, p.z - pos.z),
              angle = Math.atan2(p.x - pos.x, p.z - pos.z),
              yaw = A.lookYaw(member, sim),
              off = Math.abs(Math.atan2(Math.sin(angle - yaw), Math.cos(angle - yaw)));
            if (
              (mask & (1 << i) && contributors.indexOf(String(member.id)) >= 0) ||
              d < 1 ||
              d > 22 ||
              off > Math.PI / 3 ||
              !A.hasLineOfSight(member, marker, sim.heightAt, sim.obstacles)
            )
              continue;
            mask |= 1 << i;
            var id = String(member.id);
            if (contributors.indexOf(id) < 0) contributors.push(id);
            if (continuityOn) epochs[id] = controlEpoch(member);
            if (structureOrdersOn) {
              sectorAt[i] = now;
              sectorObservers[i] = id;
              contributorAt[id] = now;
            }
            break;
          }
        });
      }
      var observed = 0;
      for (var n = 0; n < 4; n++) if (mask & (1 << n)) observed++;
      var complete =
        eligible &&
        inside.length >= 2 &&
        contributors.length >= 2 &&
        mask === 15 &&
        now - entryEvidence.enteredAt >= 0.45;
      return {
        status: !verified
          ? 'awaiting-verified-entry'
          : sq.inContact || threats
            ? 'paused-by-contact'
            : !eligible || inside.length < 2
              ? 'insufficient-interior-observers'
              : complete
                ? 'ground-footprint-surveyed'
                : 'observing',
        sectorMask: eligible ? mask : 0,
        observedSectors: eligible ? observed : 0,
        observersInside: inside.length,
        contributors: eligible ? contributors : [],
        observerEpochs: continuityOn ? epochs : undefined,
        sectorObservedAt: structureOrdersOn ? sectorAt : undefined,
        sectorObservers: structureOrdersOn ? sectorObservers : undefined,
        contributorObservedAt: structureOrdersOn ? contributorAt : undefined,
        complete: !!complete,
        observedAt: now,
        scope: 'four-facing-and-los-ground-footprint-samples',
        clearance: 'not-assessed',
        control: 'unknown'
      };
    }
    /* Post-survey doorway security is a read of real existing men, not an
       independent move/fire order. An interior guard must look through the
       actual Navigation doorway while a separated teammate watches inward.
       At least 0.6 s of uninterrupted, physically stationary cover is needed
       before Mission Execution may advance this structure-bound route leg.
       This is guarded *handoff*, never inferred structure control/clearance. */
    function doorwayWatch(sim, sq, b, entry, men, evidence, survey, prior, threats) {
      var now = +sim.time || 0,
        N = root.BattleNavigation,
        eligible = !!(
          evidence &&
          authorizedEvidence(evidence) &&
          survey &&
          survey.complete &&
          !combatHeld(sq) &&
          !threats &&
          N &&
          N.movementClear &&
          N.movementClear(entry.outside, entry.inside) &&
          typeof A.lookYaw === 'function' &&
          typeof A.hasLineOfSight === 'function' &&
          typeof sim.heightAt === 'function'
        ),
        inside = eligible
          ? men.filter(function (s) {
              return (
                s &&
                s.squad === sq &&
                !s.dead &&
                s.hp > 0 &&
                !s.incapacitated &&
                !s.isPlayer &&
                s.root &&
                point(s.root.position) &&
                insideBuilding(b, s.root.position)
              );
            })
          : [],
        outer = { root: { position: entry.outside } },
        middle = { root: { position: { x: b.x, z: b.z } } },
        chosen = null;
      function watching(s, marker, minDist, maxDist) {
        if (structureOrdersOn) {
          var post = structureSoldierOrder(s, sim);
          if (
            !post ||
            s.moving ||
            Math.hypot(s.root.position.x - post.point.x, s.root.position.z - post.point.z) > 0.7
          )
            return false;
        }
        var p = s.root.position,
          q = marker.root.position,
          d = Math.hypot(q.x - p.x, q.z - p.z);
        if (d < minDist || d > maxDist) return false;
        var aim = Math.atan2(q.x - p.x, q.z - p.z),
          off = Math.abs(Math.atan2(Math.sin(aim - A.lookYaw(s, sim)), Math.cos(aim - A.lookYaw(s, sim))));
        return off <= Math.PI / 3 && A.hasLineOfSight(s, marker, sim.heightAt, sim.obstacles);
      }
      if (inside.length >= 2) {
        for (var i = 0; i < inside.length && !chosen; i++) {
          var doorGuard = inside[i];
          if (!watching(doorGuard, outer, 1, 12)) continue;
          for (var j = 0; j < inside.length; j++) {
            var other = inside[j];
            if (
              other === doorGuard ||
              Math.hypot(
                other.root.position.x - doorGuard.root.position.x,
                other.root.position.z - doorGuard.root.position.z
              ) < 1.5 ||
              !watching(other, middle, 1, 14)
            )
              continue;
            chosen = [doorGuard, other];
            break;
          }
        }
      }
      var old = prior && prior.watch,
        same = !!(
          chosen &&
          old &&
          old.status !== 'interrupted' &&
          old.entryAt === evidence.enteredAt &&
          old.doorwayId === entry.id &&
          old.observedAt <= now &&
          now - old.observedAt <= 2 &&
          old.doorGuardId === String(chosen[0].id) &&
          old.interiorGuardId === String(chosen[1].id) &&
          (!continuityOn ||
            (old.doorGuardEpoch === controlEpoch(chosen[0]) &&
              old.interiorGuardEpoch === controlEpoch(chosen[1]))) &&
          point(old.doorGuardPosition) &&
          point(old.interiorGuardPosition) &&
          Math.hypot(
            (old.doorGuardAnchorPosition || old.doorGuardPosition).x - chosen[0].root.position.x,
            (old.doorGuardAnchorPosition || old.doorGuardPosition).z - chosen[0].root.position.z
          ) < 1 &&
          Math.hypot(
            (old.interiorGuardAnchorPosition || old.interiorGuardPosition).x - chosen[1].root.position.x,
            (old.interiorGuardAnchorPosition || old.interiorGuardPosition).z - chosen[1].root.position.z
          ) < 1
        ),
        since = same && isFinite(old.since) && old.since <= now ? old.since : now,
        ready = !!(chosen && now - since >= 0.6);
      return {
        status: !eligible
          ? 'interrupted'
          : !chosen
            ? 'awaiting-posts'
            : ready
              ? 'doorway-watch-confirmed'
              : 'observing-posts',
        doorwayId: entry.id,
        entryAt: evidence && evidence.enteredAt,
        doorGuardId: chosen ? String(chosen[0].id) : null,
        interiorGuardId: chosen ? String(chosen[1].id) : null,
        doorGuardEpoch: continuityOn && chosen ? controlEpoch(chosen[0]) : undefined,
        interiorGuardEpoch: continuityOn && chosen ? controlEpoch(chosen[1]) : undefined,
        doorGuardPosition: chosen ? point(chosen[0].root.position) : null,
        interiorGuardPosition: chosen ? point(chosen[1].root.position) : null,
        doorGuardAnchorPosition:
          structureOrdersOn && chosen
            ? (same && old.doorGuardAnchorPosition) || point(chosen[0].root.position)
            : undefined,
        interiorGuardAnchorPosition:
          structureOrdersOn && chosen
            ? (same && old.interiorGuardAnchorPosition) || point(chosen[1].root.position)
            : undefined,
        since: since,
        observedAt: now,
        ready: ready,
        clearance: 'not-assessed',
        control: 'unknown'
      };
    }
    function structureInterface(sim, sq, target, men) {
      if (!structuresOn || !target || !men || men.length > tuning.resourceLimit) return null;
      var N = root.BattleNavigation,
        meta = sim.scene && sim.scene.metadata,
        scene = meta && (meta.battleScenario || meta.battleTown);
      /* The navigation graph may survive a same-page scenario replacement;
         a graph from a different map can never authorize an interface. */
      if (!N || !scene || N.scenario !== scene || !N.movementClear) return null;
      var buildings = scene.buildings || [],
        portals = N.doorPortals;
      if (
        !Array.isArray(buildings) ||
        buildings.length > 32 ||
        !Array.isArray(portals) ||
        portals.length > 64
      )
        return null;
      var candidates = buildings.filter(function (b) {
        return b && typeof b.id === 'string' && b.id && insideBuilding(b, target);
      });
      if (candidates.length !== 1) return null;
      var b = candidates[0];
      if (
        buildings.filter(function (entry) {
          return entry && entry.id === b.id;
        }).length !== 1
      )
        return null;
      var observer = A.leaderOf(sq);
      if (!observer || men.indexOf(observer) < 0 || !observer.root || !point(observer.root.position))
        return null;
      if (continuityOn && (observer.isPlayer || observer.incapacitated || observer.hp <= 0)) return null;
      var pos = point(observer.root.position),
        within = insideBuilding(b, pos);
      if (!within && Math.hypot(pos.x - target.x, pos.z - target.z) > 80) return null;
      var entry = null,
        cost = Infinity;
      portals.forEach(function (p) {
        if (
          !p ||
          p.building !== b.id ||
          !point(p.inside) ||
          !point(p.outside) ||
          !N.movementClear(p.outside, p.inside) ||
          !N.movementClear(p.inside, target)
        )
          return;
        if (!N.movementClear(pos, within ? p.inside : p.outside)) return;
        var distance = Math.hypot(pos.x - p.outside.x, pos.z - p.outside.z);
        if (distance < cost) {
          cost = distance;
          entry = p;
        }
      });
      if (!entry) return null;
      var reports = root.SquadAI.squadContactsMap(sq, sim) || [],
        now = +sim.time || 0,
        threats = 0;
      /* Lack of reported contacts is NOT evidence that the room is clear. */
      if (!Array.isArray(reports) || reports.length > 32) return null;
      reports.slice(0, 32).forEach(function (c) {
        if (
          c &&
          point(c) &&
          isFinite(c.at) &&
          c.at <= now &&
          now - c.at <= tuning.contactAge &&
          insideBuilding(b, c)
        )
          threats++;
      });
      var entryEvidence = null;
      if (entryOn) {
        /* Only an already observed, same-mission exterior approach can be
           promoted to confirmed entry. One near-door pose or a timer is not
           a crossing; the physical delta must fit the same Navigation portal. */
        var old = sq._localTask,
          prior =
            old &&
            (old.kind === 'structure-handoff' || continuityOn) &&
            old.inputs &&
            old.inputs.execution &&
            old.inputs.execution.structure,
          evidence = prior && prior.entryEvidence,
          version = ctx.missionVersion(sq),
          leg = +sq.routeIndex,
          same =
            evidence &&
            old.missionVersion === version &&
            evidence.missionVersion === version &&
            evidence.leg === leg &&
            prior.navigationVersion === N.version &&
            prior.buildingId === b.id &&
            prior.doorwayId === entry.id &&
            evidence.observerId === String(observer.id) &&
            (!continuityOn || evidence.observerEpoch === controlEpoch(observer)) &&
            isFinite(evidence.observedAt) &&
            evidence.observedAt <= now &&
            now - evidence.observedAt <= 3,
          prev = same && point(evidence.observerPosition),
          retain = !!(
            within &&
            same &&
            evidence.enteredAt != null &&
            isFinite(evidence.enteredAt) &&
            evidence.enteredAt <= now
          ),
          crossed = !!(
            within &&
            prev &&
            !insideBuilding(b, prev) &&
            now > evidence.observedAt &&
            Math.hypot(prev.x - entry.outside.x, prev.z - entry.outside.z) <= 2.5 &&
            Math.hypot(pos.x - entry.inside.x, pos.z - entry.inside.z) <= 2.5 &&
            Math.hypot(pos.x - prev.x, pos.z - prev.z) <= 4.5 &&
            N.movementClear(prev, pos)
          ),
          confirmed = retain || crossed;
        entryEvidence = {
          observerId: String(observer.id),
          observerEpoch: continuityOn ? controlEpoch(observer) : undefined,
          observerPosition: pos,
          observedAt: now,
          missionVersion: version,
          leg: leg,
          enteredAt: confirmed ? (retain ? evidence.enteredAt : now) : null,
          entryVerified: confirmed,
          handoff: confirmed ? 'interior-observation-required' : 'awaiting-physical-entry'
        };
      }
      var continuous = reassessmentEvidence(sim, sq, b, entry),
        authorization = continuous || entryEvidence,
        surveyed = surveyOn ? interiorSurvey(sim, sq, b, men, authorization, prior, threats) : null;
      return {
        buildingId: b.id,
        doorwayId: entry.id,
        navigationVersion: N.version,
        stage: within ? 'friendly-inside-observed' : 'doorway-approach',
        reportedThreats: threats,
        control: 'unknown',
        clearance: 'not-assessed',
        provenance: 'navigation-door/own-position/reported-beliefs',
        entryEvidence: entryEvidence || undefined,
        presenceEvidence: continuous || undefined,
        survey: surveyed || undefined,
        watch: watchOn
          ? doorwayWatch(sim, sq, b, entry, men, authorization, surveyed, prior, threats)
          : undefined
      };
    }
    /* Join actual execution, not a proximity-based substitute for its owner.
       This does not claim that an observed route or objective is safe/cleared. */
    function execution(sim, sq, ownMen) {
      if (!tasksOn) return null;
      var now = +sim.time || 0,
        version = ctx.missionVersion(sq),
        recovery = L.get(sq, 'rally-recovery');
      if (sq.state === 'retreat') {
        var rally = recovery && recovery.data && point(recovery.data.point);
        return rally && recovery.since <= now && now < recovery.until
          ? {
              kind: 'recover',
              owner: 'rally-recovery',
              status: 'reforming',
              target: rally,
              stableSince: recovery.data.stableSince,
              missionVersion: version
            }
          : {
              kind: 'recover',
              owner: 'retreat',
              status: 'withdrawing',
              target: point(A.retreatGoal(sq)),
              missionVersion: version
            };
      }
      var m = sq._macroMission,
        ex = sq._missionExecution;
      if (
        !m ||
        m.status !== 'executing' ||
        !ex ||
        ex.mission !== m ||
        !isFinite(ex.acceptedAt) ||
        ex.acceptedAt > now
      )
        return null;
      var defending = m.intent === 'defend' && sq.commandPhase === 'defend',
        O = root.BattleObjectiveSystem,
        objective = defending && m.objectiveId && O && O.get && O.get(sim, m.objectiveId),
        status = objective && O.status && O.status(sim, m.objectiveId),
        target = point(m.point),
        men = defending ? ownMen || ctx.commanded(sq) : [];
      if (
        m.intent === 'defend' &&
        sq.commandPhase === 'defend' &&
        status &&
        status.owner === sq.faction &&
        target &&
        men.length &&
        men.length <= tuning.resourceLimit &&
        men.every(function (s) {
          return s.root && point(s.root.position);
        })
      ) {
        var x = 0,
          z = 0;
        men.forEach(function (s) {
          x += s.root.position.x;
          z += s.root.position.z;
        });
        var radius = +(objective.def && objective.def.radius) || 30;
        if (Math.hypot(x / men.length - target.x, z / men.length - target.z) <= radius)
          return {
            kind: 'objective-security',
            owner: 'mission-execution',
            status: 'defending',
            objectiveId: m.objectiveId,
            target: target,
            missionVersion: version,
            control: 'owned',
            clearance: 'not-assessed'
          };
      }
      var route = L.get(sq, 'route-transition'),
        d = route && route.data,
        wp = point((sq.route || [])[+sq.routeIndex || 0]);
      if (
        route &&
        route.since <= now &&
        now < route.until &&
        d &&
        d.missionVersion === version &&
        d.leg === +sq.routeIndex &&
        wp &&
        point(d.target) &&
        wp.x === +d.target.x &&
        wp.z === +d.target.z
      ) {
        var structure = structureInterface(sim, sq, wp, ownMen || ctx.commanded(sq));
        return {
          kind: structure ? 'structure-handoff' : 'route-transition',
          owner: 'mission-execution',
          status: 'traversing',
          leg: d.leg,
          target: wp,
          missionVersion: version,
          distance: d.distance,
          distanceMoved: d.traveled,
          lastProgressAt: d.lastProgressAt,
          clearance: 'not-assessed',
          structure: structure || undefined
        };
      }
      return null;
    }
    /* Route ownership stays with mission execution. This read-only bridge prevents
       a structure-bound leg from being declared 'arrived' while its leader is
       merely near the wall. Only previously confirmed, current-leg evidence
       may permit the original Mission Execution owner to advance. */
    function entryRequired(sim, sq, target) {
      if (continuityOn && sq && point(target)) {
        var meta = sim.scene && sim.scene.metadata,
          scene = meta && (meta.battleScenario || meta.battleTown);
        /* Loss of a usable portal/observer is failed authorization, never a
           reason to remove the arrival gate for a known building target. */
        if (
          scene &&
          Array.isArray(scene.buildings) &&
          scene.buildings.some(function (b) {
            return insideBuilding(b, target);
          })
        )
          return true;
      }
      return !!(
        entryGateOn &&
        sq &&
        sq.state !== 'retreat' &&
        !ctx.leaderlessActive(sq) &&
        structureInterface(sim, sq, point(target), ctx.commanded(sq))
      );
    }
    function entrySatisfied(sim, sq, target) {
      if (!entryRequired(sim, sq, target)) return false;
      var N = root.BattleNavigation,
        version = ctx.missionVersion(sq),
        task = sq._localTask,
        ex = task && task.inputs && task.inputs.execution,
        structure = ex && ex.structure,
        evidence = structure && (structure.presenceEvidence || structure.entryEvidence),
        leader = A.leaderOf(sq),
        now = +sim.time || 0,
        endpoint = structureInterface(sim, sq, point(target), ctx.commanded(sq));
      return !!(
        task &&
        task.kind === 'structure-handoff' &&
        task.missionVersion === version &&
        ex &&
        ex.kind === 'structure-handoff' &&
        ex.missionVersion === version &&
        ex.leg === +sq.routeIndex &&
        point(ex.target) &&
        ex.target.x === target.x &&
        ex.target.z === target.z &&
        endpoint &&
        structure &&
        structure.buildingId === endpoint.buildingId &&
        structure.doorwayId === endpoint.doorwayId &&
        structure.navigationVersion === N.version &&
        evidence &&
        authorizedEvidence(evidence) &&
        !combatHeld(sq) &&
        evidence.missionVersion === version &&
        evidence.leg === +sq.routeIndex &&
        evidence.observerId === String(leader && leader.id) &&
        isFinite(evidence.enteredAt) &&
        evidence.enteredAt <= now &&
        isFinite(evidence.observedAt) &&
        evidence.observedAt <= now &&
        now - evidence.observedAt <= 3 &&
        endpoint.stage === 'friendly-inside-observed' &&
        (!surveyOn ||
          (structure.survey && structure.survey.complete && endpoint.survey && endpoint.survey.complete)) &&
        (!watchOn || (structure.watch && structure.watch.ready && endpoint.watch && endpoint.watch.ready))
      );
    }
    /* Bounded own-roster resources, not a second station/ammunition owner. A
       report names actual supporters; a cached count cannot survive roster or
       readiness changes. No geometric safety claim is made at this layer. */
    function ready(s, sq, sim) {
      var E = root.BattleEngagement,
        ammo = root.BattleAmmunition;
      return !!(
        s &&
        sq.members.indexOf(s) >= 0 &&
        s.squad === sq &&
        !s.dead &&
        s.hp > 0 &&
        !s.incapacitated &&
        !s.isPlayer &&
        s.root &&
        s.root.position &&
        !(s.suppressedUntil > sim.time) &&
        !s.reloading &&
        !s.clearingStoppage &&
        !s.outOfAmmo &&
        !(E && E.reacting && E.reacting(s)) &&
        !(E && E.fledPhase && E.fledPhase(s)) &&
        ammo &&
        ammo.available &&
        ammo.available(s)
      );
    }
    function moverEligible(s, sq, sim) {
      return (
        ready(s, sq, sim) &&
        !A.isMachineGun(s) &&
        !(root.BattleTacticalPositions && root.BattleTacticalPositions.current(s))
      );
    }
    function supportMembers(sim, sq, report) {
      if (!sq.members || sq.members.length > tuning.resourceLimit) return [];
      var support = report && report.fireSupport;
      if (!Array.isArray(support) || support.length > tuning.resourceLimit) return [];
      return support.filter(function (s, i) {
        return support.indexOf(s) === i && ready(s, sq, sim);
      });
    }
    function resources(sim, sq, report) {
      if (!sq.members || sq.members.length > tuning.resourceLimit)
        return { status: 'over-budget', supportingIds: [], moverIds: [], observedAt: null };
      var now = +sim.time || 0,
        prior = sq._localTask,
        cached = prior && prior.inputs.resources,
        current = report && Array.isArray(report.fireSupport),
        reusable =
          cached &&
          prior.missionVersion === ctx.missionVersion(sq) &&
          cached.observedAt != null &&
          now >= cached.observedAt &&
          now - cached.observedAt <= ctx.BOUND_DURATION &&
          cached.supportingIds.length <= tuning.resourceLimit,
        support = current
          ? supportMembers(sim, sq, report)
          : reusable
            ? sq.members.filter(function (s) {
                return cached.supportingIds.indexOf(String(s.id)) >= 0 && ready(s, sq, sim);
              })
            : [],
        movers = sq.members.filter(function (s) {
          return moverEligible(s, sq, sim);
        });
      return {
        status:
          current && report.fireSupport.length > tuning.resourceLimit
            ? 'over-budget'
            : current
              ? 'reported'
              : reusable
                ? 'revalidated'
                : 'unknown',
        supportingIds: support.map(function (s) {
          return String(s.id);
        }),
        moverIds: movers.map(function (s) {
          return String(s.id);
        }),
        observedAt: current ? now : reusable ? cached.observedAt : null
      };
    }
    function read(sim, sq, report) {
      var men = ctx.commanded(sq),
        pinned = 0,
        firedOn = 0,
        E = root.BattleEngagement,
        now = +sim.time || 0;
      men.forEach(function (s) {
        if ((+s.suppressedUntil || 0) > now) pinned++;
        if (E && E.underFireNow && E.underFireNow(s, sim)) firedOn++;
      });
      var contacts = A.squadContactsMap(sq, sim) || [],
        confidence = 0,
        youngestAge = null,
        sources = {};
      contacts.forEach(function (c) {
        if (!isFinite(c.at) || c.at > now) return;
        var age = now - c.at;
        if (age > tuning.contactAge) return;
        confidence = Math.max(confidence, Math.min(1, Math.max(0, +c.confidence || 0)));
        youngestAge = youngestAge == null ? age : Math.min(youngestAge, age);
        sources[c.source || 'unknown'] = true;
      });
      /* Legacy upward reports can establish contact, but cannot invent confidence. */
      var c = sq.contact;
      if (!contacts.length && c && isFinite(c.at) && now >= c.at && now - c.at <= tuning.contactAge) {
        youngestAge = now - c.at;
        sources[c.source || 'squad-report'] = true;
      }
      var limit = ctx.policy(sim, sq).cohesionRadius || 34,
        cohesion = ctx.cohesionAssessment(sq, limit),
        pressure = Math.max(pinned, firedOn, report ? +report.underFire || 0 : 0) / Math.max(1, men.length);
      var resource = resourcesOn ? resources(sim, sq, report) : null,
        prior = sq._localTask && sq._localTask.inputs,
        currentSupport = report && report.fireSupport,
        reuseSupport =
          prior &&
          prior.missionVersion === ctx.missionVersion(sq) &&
          prior.supportObservedAt != null &&
          now - prior.supportObservedAt <= ctx.BOUND_DURATION;
      return {
        pressure: Math.min(1, pressure),
        confidence: confidence,
        youngestAge: youngestAge,
        sources: Object.keys(sources).sort(),
        provenance: 'own-members/reported-beliefs',
        dispersed: cohesion.dispersed,
        contact: !!sq.inContact || youngestAge != null,
        supporting: resource
          ? resource.observedAt == null
            ? null
            : resource.supportingIds.length
          : currentSupport
            ? currentSupport.length
            : reuseSupport
              ? prior.supporting
              : null,
        supportObservedAt: resource
          ? resource.observedAt
          : currentSupport
            ? now
            : reuseSupport
              ? prior.supportObservedAt
              : null,
        resources: resource || undefined,
        execution: tasksOn ? execution(sim, sq, men) : undefined,
        missionVersion: ctx.missionVersion(sq)
      };
    }
    function decide(sq, inputs, now) {
      var old = sq._localTask,
        same = old && old.missionVersion === inputs.missionVersion,
        pressured =
          inputs.pressure >= tuning.pressureEnter ||
          (same && old.pressured && inputs.pressure > tuning.pressureExit),
        uncertain = inputs.confidence < tuning.confidence && !inputs.contact,
        regroup = L.get(sq, 'regroup'),
        recon = L.get(sq, 'recon'),
        reconTask = sq._reconTask,
        scores = { approach: 0.1 },
        eligible = { approach: !inputs.contact };
      eligible.protect = pressured;
      scores.protect = 1 + inputs.pressure;
      eligible.regroup =
        !inputs.contact &&
        !pressured &&
        !!regroup &&
        regroup.data &&
        regroup.data.missionVersion === inputs.missionVersion;
      scores.regroup = 0.7 + (inputs.dispersed ? 0.25 : 0);
      eligible.recon =
        uncertain &&
        !pressured &&
        !!recon &&
        !!reconTask &&
        reconTask.missionVersion === inputs.missionVersion;
      scores.recon = 0.6 + (1 - inputs.confidence) * 0.3;
      eligible.support = inputs.contact && !pressured;
      scores.support = 0.4 + inputs.pressure;
      eligible.maneuver =
        inputs.contact &&
        !pressured &&
        inputs.supporting != null &&
        inputs.supporting >= tuning.minimumSupport &&
        (!resourcesOn || (inputs.resources.status !== 'over-budget' && inputs.resources.moverIds.length > 0));
      scores.maneuver = 0.6 + 0.25 * inputs.confidence - inputs.pressure;
      if (tasksOn) {
        var active = inputs.execution;
        eligible['route-transition'] =
          !!active && active.kind === 'route-transition' && !inputs.contact && !pressured;
        scores['route-transition'] = 0.55;
        eligible['structure-handoff'] =
          !!active && active.kind === 'structure-handoff' && !inputs.contact && !pressured;
        scores['structure-handoff'] = 0.65;
        eligible['structure-security'] = !!(
          structureOrdersOn &&
          inputs.structureExecution &&
          inputs.structureExecution.stage === 'contact-security' &&
          !pressured
        );
        scores['structure-security'] = 0.9;
        if (eligible['structure-security']) eligible.maneuver = false;
        eligible['objective-security'] = !!active && active.kind === 'objective-security' && !pressured;
        scores['objective-security'] = 0.8;
        eligible.recover = !!active && active.kind === 'recover';
        scores.recover = 2;
        if (eligible['objective-security'] || eligible.recover) eligible.maneuver = false;
        if (eligible.recover) {
          eligible.approach = false;
          // Retreat/rally already owns the response to pressure. Micro emergency
          // protection stays independent; do not rename recovery on a score tie.
          eligible.protect = false;
        }
      }
      var kind = 'approach',
        best = -Infinity;
      Object.keys(scores).forEach(function (k) {
        if (eligible[k] && scores[k] > best) {
          kind = k;
          best = scores[k];
        }
      });
      /* Preserve a still-eligible commitment for the existing bound duration.
         Mission replacement, lost eligibility and immediate pressure bypass it. */
      if (
        same &&
        !pressured &&
        eligible[old.kind] &&
        now - old.since < ctx.BOUND_DURATION &&
        !(continuityOn && old.kind === 'approach' && eligible['structure-handoff']) &&
        !(old.inputs.contact && old.inputs.supporting == null && inputs.supporting != null)
      )
        kind = old.kind;
      return {
        kind: kind,
        pressured: pressured,
        emergency: inputs.pressure >= tuning.emergency,
        scores: scores,
        eligible: eligible,
        boundsAllowed: kind === 'maneuver',
        reconAllowed: uncertain && !pressured && !eligible.regroup && !eligible.recover,
        coverRoute: 'not-assessed'
      };
    }
    /* Revalidate the frozen choice without choosing a replacement commander.
       This only governs unconsumed authorization; Micro owns moves it adopted. */
    function degradation(sim, sq, inherited, report) {
      if (!degradationOn) return null;
      var old = sq._localTask,
        now = +sim.time || 0,
        version = ctx.missionVersion(sq),
        bound = L.get(sq, 'bound'),
        reason = null;
      if (sq.state === 'retreat') reason = 'retreat';
      else if (!inherited || !old) reason = 'no-local-task';
      else if (inherited.missionVersion !== version || old.missionVersion !== version)
        reason = 'mission-replaced';
      else if (old.serial !== inherited.serial || old.kind !== inherited.kind) reason = 'task-replaced';
      else if (!isFinite(old.at) || old.at > now) reason = 'invalid-task-time';
      else {
        var inputs = read(sim, sq, report),
          choice = decide(sq, inputs, now);
        if (!choice.eligible[old.kind]) reason = choice.pressured ? 'pressure' : 'lost-eligibility';
        else if (old.kind === 'maneuver') {
          if (!bound || now < bound.since || now >= bound.until) reason = 'bound-expired';
          else if (
            !bound.data ||
            bound.data.missionVersion !== version ||
            bound.data.localTaskSerial !== old.serial
          )
            reason = 'unmatched-bound';
        }
      }
      return {
        kind: inherited ? inherited.kind : null,
        serial: inherited ? inherited.serial : null,
        missionVersion: inherited ? inherited.missionVersion : null,
        status: reason ? 'hold' : 'inherited',
        reason: reason || 'valid-task',
        at: now,
        finishBound: !reason && old.kind === 'maneuver',
        boundsAllowed: false,
        reconAllowed: false
      };
    }
    function update(sim, sq, report) {
      if (!on || !sim || !sq) return null;
      /* Existing succession/retreat owners retain their authority, including an
         inherited committed move. Never publish a new local command here. */
      if (ctx.leaderlessActive(sq) || (sq.state === 'retreat' && !execution(sim, sq))) {
        if (presence.has(sq)) revokedPresence.set(sq, presence.get(sq));
        presence.delete(sq);
        return null;
      }
      if (continuityOn) {
        var target = point((sq.route || [])[+sq.routeIndex]);
        observePresence(sim, sq, target && structureInterface(sim, sq, target, ctx.commanded(sq)));
      }
      var inputs = read(sim, sq, report);
      if (structureOrdersOn) inputs.structureExecution = updateStructureOrders(sim, sq, inputs) || undefined;
      var now = +sim.time || 0,
        choice = decide(sq, inputs, now),
        old = sq._localTask,
        changed = !old || old.kind !== choice.kind || old.missionVersion !== inputs.missionVersion,
        history = old ? old.history.slice() : [],
        serial = old ? old.serial : 0,
        counts = Object.assign({}, old && old.counts);
      if (changed) {
        serial++;
        counts[choice.kind] = (counts[choice.kind] || 0) + 1;
        var event = { at: now, kind: choice.kind, missionVersion: inputs.missionVersion, serial: serial };
        history.push(event);
        if (history.length > 8) history.shift();
        ctx.telemetry(
          sim,
          'decision-local-task',
          Object.assign({ faction: sq.faction, squad: sq.id }, event)
        );
      }
      sq._localTask = Object.assign(choice, {
        missionVersion: inputs.missionVersion,
        since: changed ? now : old.since,
        at: now,
        serial: serial,
        inputs: inputs,
        history: history,
        counts: counts
      });
      return sq._localTask;
    }
    function reset(sq) {
      sq._localTask = null;
      presence.delete(sq);
      revokedPresence.delete(sq);
      structureOrders.delete(sq);
    }
    function summary(sim) {
      if (!on) return null;
      var counts = {},
        transitions = 0;
      ['us', 'ge'].forEach(function (f) {
        var squads = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
        squads.forEach(function (sq) {
          var task = sq._localTask;
          if (!task) return;
          transitions += task.serial;
          Object.keys(task.counts).forEach(function (k) {
            counts[k] = (counts[k] || 0) + task.counts[k];
          });
        });
      });
      return { transitions: transitions, choices: counts };
    }
    return {
      on: on,
      resourcesOn: resourcesOn,
      degradationOn: degradationOn,
      tasksOn: tasksOn,
      structuresOn: structuresOn,
      entryOn: entryOn,
      entryGateOn: entryGateOn,
      surveyOn: surveyOn,
      watchOn: watchOn,
      contactResumeOn: contactResumeOn,
      continuityOn: continuityOn,
      structureOrdersOn: structureOrdersOn,
      currentStructureOrders: currentStructureOrders,
      structureSoldierOrder: structureSoldierOrder,
      execution: execution,
      entryRequired: entryRequired,
      entrySatisfied: entrySatisfied,
      degradation: degradation,
      tuning: tuning,
      read: read,
      supportMembers: supportMembers,
      moverEligible: moverEligible,
      decide: decide,
      update: update,
      reset: reset,
      summary: summary
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
