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
      tuning = {
        pressureEnter: 0.45,
        pressureExit: 0.25,
        emergency: 0.75,
        contactAge: 10,
        confidence: 0.5,
        resourceLimit: 32,
        minimumSupport: 2
      };
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
        reconAllowed: uncertain && !pressured && !eligible.regroup,
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
      if (sq.state === 'retreat' || ctx.leaderlessActive(sq)) return null;
      var inputs = read(sim, sq, report),
        now = +sim.time || 0,
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
