/* One-shot faction-local aerial reconnaissance for the opt-in 5 km battlefield.
   Only an authorized request samples hostile actor truth. The resulting immutable
   snapshot is uncertain, expires, and cannot authorize targeting or firing. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleAerialRecon) return;

  var MIN_REQUEST_AT = 120,
    INTERCEPTION_RECON_AT = 40,
    VALID_SECONDS = 45,
    MIN_GROUND_SPEED = 0.8,
    POSITION_GRID = 35,
    HEADING_STEP = Math.PI / 12,
    // Air-intelligence corridor analysis (the report's own road projection).
    CORRIDOR_ROAD_PROXIMITY = 110,
    CORRIDOR_ALIGNMENT = 0.58,
    CORRIDOR_MIN_EDGE = 300,
    CORRIDOR_HOPS = 2,
    // A single pass forecasts no further than the report's interception
    // horizon; beyond it the column has had time to turn off any road.
    CORRIDOR_HORIZON_SECONDS = 600,
    // Time over target of the General's doctrine sortie: three fixes, the
    // track taken from the last two, so a column that set off during the
    // pass is reported with its real road speed.
    OVERFLIGHT_SECONDS = 30,
    OVERFLIGHT_FIXES = 3;

  function enabled(sim) {
    var town = sim && sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario,
      search = (root.location && root.location.search) || '';
    return !!(
      town &&
      town.profile === 'strategic' &&
      !root.PHASE_C_COMBAT_LAB &&
      !/(?:^|[?&])strategicInterception=0(?:&|$)/.test(search) &&
      !/(?:^|[?&])aerialRecon=0(?:&|$)/.test(search)
    );
  }
  function flagOff(name) {
    return new RegExp('(?:^|[?&])' + name + '=0(?:&|$)').test((root.location && root.location.search) || '');
  }
  function interceptionOn() {
    return !/(?:^|[?&])interception=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  /* ?reconCorridors=0 restores reports without corridors (the General then
     projects roads itself); ?reconOverflight=0 restores the instant snapshot. */
  function corridorsOn() {
    return interceptionOn() && !flagOff('reconCorridors');
  }
  /* Ambushes sit between the column and the objective it is heading for:
     corridors stop at that objective. ?ambushBeforeObjective=0 restores the
     forks beyond it. */
  function beforeObjectiveOn() {
    return !flagOff('ambushBeforeObjective');
  }
  /* With ambushes before an objective, the report covers the approach to the
     column's first objective and the road on from it to the next one it is
     heading for: each watch point stands between the column and an
     objective. ?ambushNextObjective=0 keeps only the first approach. */
  function corridorHopLimit() {
    if (!beforeObjectiveOn()) return CORRIDOR_HOPS;
    return flagOff('ambushNextObjective') ? 0 : 1;
  }
  /* Front-lines layout: on the road from a line to the next, also watch the point where the
     column must leave its trucks short of that next line (the transport's own dismount
     distance). It lies between the line behind and the contested one, and is reached earlier
     by the defender of that ground. ?lineApproachPost=0 keeps the 1/3 and 2/3 points only. */
  function lineApproachMetres(town) {
    if (!town || !town.frontLines || flagOff('lineApproachPost')) return 0;
    var transport = root.BattleSquadTransport;
    return (transport && transport.tuning && transport.tuning.dismountMetres) || 180;
  }
  function overflightOn() {
    return interceptionOn() && !flagOff('reconOverflight');
  }
  function validFaction(f) {
    return f === 'us' || f === 'ge';
  }
  function state(sim) {
    return (
      sim._strategicAerialRecon ||
      (sim._strategicAerialRecon = {
        us: { used: false, event: null },
        ge: { used: false, event: null }
      })
    );
  }
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    }
    return h >>> 0;
  }
  function uncertainty(seed, faction, id, axis) {
    return ((hash(seed + '|' + faction + '|' + id + '|' + axis) % 2001) / 1000 - 1) * 12;
  }
  function round(v, n) {
    var p = Math.pow(10, n || 0);
    return Math.round(v * p) / p;
  }
  function hidden(sq) {
    if (
      sq.hidden ||
      sq.isHidden ||
      sq.concealed ||
      sq._concealed ||
      sq._ambushTask ||
      sq._ambushPlan ||
      sq._preparedAmbush ||
      /ambush|conceal|hide/.test(String(sq.commandPhase || '').toLowerCase())
    )
      return true;
    var living = (sq.members || []).filter(function (s) {
      return s && !s.dead;
    });
    return living.some(function (s) {
      return s.hidden || s.isHidden || s.concealed || s._concealed || s._ambushTask || s._ambushPlan;
    });
  }
  /* The reporting branch's own analysis, delivered with the report: every
     moving fix is projected onto the PUBLIC road net from the report's own
     rounded position, heading and speed (never the hostile actor). Each
     corridor names the road it is on or will reach, a watch point, how far
     the column must travel to it and a conservative arrival estimate. Forks
     downstream split the likelihood. The General is handed these; he does
     not re-derive them. Stationary fixes have no direction and no corridor. */
  function objectiveById(town, id) {
    return (
      (town.objectives || []).find(function (o) {
        return o.id === id;
      }) || null
    );
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function corridorsFor(town, contact, observer) {
    if (
      !town ||
      !contact ||
      !(contact.speedMps >= MIN_GROUND_SPEED) ||
      contact.headingRadians == null ||
      !isFinite(contact.headingRadians)
    )
      return [];
    var hostile = observer === 'us' ? 'ge' : 'us',
      p = { x: +contact.x, z: +contact.z },
      h = { x: Math.sin(contact.headingRadians), z: Math.cos(contact.headingRadians) },
      fast = Math.max(MIN_GROUND_SPEED, contact.speedMps + (contact.speedUncertaintyMps || 0)),
      slow = Math.max(MIN_GROUND_SPEED, contact.speedMps - (contact.speedUncertaintyMps || 0)),
      slack = contact.positionUncertaintyM || 40,
      roads = (town.roads || [])
        .map(function (road) {
          var a = objectiveById(town, road.fromObjectiveId),
            b = objectiveById(town, road.toObjectiveId);
          return a && b ? { road: road, a: a, b: b, len: dist(a, b) } : null;
        })
        .filter(function (e) {
          return e && e.len > 1;
        }),
      out = [];
    var hopLimit = corridorHopLimit(),
      approach = lineApproachMetres(town);
    function eta(metres) {
      return round(Math.max(0, metres - slack) / fast, 1);
    }
    // The slowest plausible arrival: how long a watch point must be held.
    function latest(metres) {
      return round((metres + slack) / slow, 1);
    }
    function emit(edge, from, to, fraction, travelled, hop, likelihood, alignment, offRoad, toward) {
      if (eta(travelled) > CORRIDOR_HORIZON_SECONDS) return;
      var point = {
        x: round(from.x + (to.x - from.x) * fraction, 1),
        z: round(from.z + (to.z - from.z) * fraction, 1)
      };
      out.push(
        Object.freeze({
          roadId: edge.road.id,
          anchorIds: Object.freeze([edge.a.id, edge.b.id]),
          likelyObjectiveId: (toward || to).id,
          point: Object.freeze(point),
          leadMetres: round(travelled, 0),
          enemyEtaSeconds: eta(travelled),
          enemyLatestSeconds: latest(travelled),
          hop: hop,
          likelihood: round(likelihood, 2),
          alignment: round(alignment, 2),
          offRoadM: round(offRoad, 0)
        })
      );
    }
    /* Continue along the graph from the node the column is heading for. */
    function downstream(node, cameFrom, travelled, hop, likelihood, alignment, offRoad) {
      // The observer's own base is the column's destination, not a waypoint.
      if (hop > hopLimit || node.baseFaction === observer) return;
      if (eta(travelled) > CORRIDOR_HORIZON_SECONDS) return;
      var next = roads.filter(function (e) {
        if (e.road === cameFrom || e.len < CORRIDOR_MIN_EDGE) return false;
        if (e.a.id !== node.id && e.b.id !== node.id) return false;
        var far = e.a.id === node.id ? e.b : e.a;
        return far.baseFaction !== hostile;
      });
      next.forEach(function (e) {
        var far = e.a.id === node.id ? e.b : e.a,
          share = likelihood / next.length;
        var fractions = [1 / 3, 2 / 3];
        if (approach && (e.len - approach) / e.len > 2 / 3) fractions.push((e.len - approach) / e.len);
        fractions.forEach(function (f) {
          emit(e, node, far, f, travelled + e.len * f, hop, share, alignment, offRoad);
        });
        downstream(far, e.road, travelled + e.len, hop + 1, share, alignment, offRoad);
      });
    }
    roads.forEach(function (e) {
      if (e.len <= CORRIDOR_MIN_EDGE) return;
      var vx = (e.b.x - e.a.x) / e.len,
        vz = (e.b.z - e.a.z) / e.len,
        t = Math.max(0, Math.min(1, ((p.x - e.a.x) * vx + (p.z - e.a.z) * vz) / e.len)),
        foot = { x: e.a.x + vx * e.len * t, z: e.a.z + vz * e.len * t },
        off = dist(p, foot),
        alignment = vx * h.x + vz * h.z;
      if (off > CORRIDOR_ROAD_PROXIMITY + slack) return;
      for (var dir = -1; dir <= 1; dir += 2) {
        var dot = alignment * dir,
          node = dir > 0 ? e.b : e.a,
          remaining = dir > 0 ? e.len * (1 - t) : e.len * t;
        if (dot < CORRIDOR_ALIGNMENT) continue;
        // A column is not predicted to drive into its own home base.
        if (node.baseFaction === hostile) continue;
        var before = beforeObjectiveOn(),
          leads = before
            ? // Watch points along the approach, the last just short of the objective.
              [320, 550, remaining * 0.5, remaining * 0.77, remaining - 80]
            : [320, 550, Math.min(remaining * 0.77, remaining - 80)],
          used = {};
        leads.forEach(function (raw) {
          var lead = Math.min(remaining - 80, raw),
            key = Math.round(lead / 20);
          if (lead < 200 || used[key]) return;
          used[key] = true;
          var along = dir > 0 ? t + lead / e.len : t - lead / e.len;
          emit(e, e.a, e.b, along, lead, 0, 1, dot, off, node);
        });
        downstream(node, e.road, remaining, 1, 1, dot, off);
      }
    });
    return out;
  }
  function withCorridors(contact, town, observer) {
    if (!contact || !corridorsOn()) return contact;
    var copy = Object.assign({}, contact);
    copy.corridors = Object.freeze(corridorsFor(town, contact, observer));
    return Object.freeze(copy);
  }
  function sampleSquad(sq, faction, seed, at) {
    if (!sq || hidden(sq)) return null;
    var men = (sq.members || []).filter(function (s) {
        return s && !s.dead && s.root && s.root.position;
      }),
      n = men.length,
      x = 0,
      z = 0,
      vx = 0,
      vz = 0,
      measured = 0,
      vehicle = sq._transport;
    if (n < 2) return null;
    for (var i = 0; i < n; i++) {
      var p = men[i].root.position;
      if (!isFinite(+p.x) || !isFinite(+p.z)) return null;
      x += +p.x;
      z += +p.z;
    }
    x /= n;
    z /= n;
    /* The opposing home territory, not all enemy actors throughout the field. */
    if ((faction === 'us' && z < 0) || (faction === 'ge' && z > 0)) return null;
    if (vehicle && vehicle.phase === 'embarked' && vehicle.heading) {
      var leg = vehicle.path && vehicle.path[vehicle.leg],
        speed = leg && +leg.speed;
      if (isFinite(speed) && speed > 0 && isFinite(+vehicle.heading.x) && isFinite(+vehicle.heading.z)) {
        vx = +vehicle.heading.x * speed;
        vz = +vehicle.heading.z * speed;
        measured = n;
      }
    } else {
      /* Snapshot instantaneous physical gait, never the intended destination or
         the hidden mission brief. Require agreement across moving soldiers. */
      for (var j = 0; j < n; j++) {
        var s = men[j],
          speedNow = +s.moveSpeed,
          yaw = s.root.rotation && +s.root.rotation.y;
        if (!s.moving || !isFinite(speedNow) || speedNow < MIN_GROUND_SPEED || !isFinite(yaw)) continue;
        vx += Math.sin(yaw) * speedNow;
        vz += Math.cos(yaw) * speedNow;
        measured++;
      }
      if (measured >= Math.ceil(n * 0.6)) {
        vx /= measured;
        vz /= measured;
      } else {
        // A stationary, exposed formation is observable from the air even
        // when no direction/speed can be inferred. Never forge a velocity.
        vx = vz = 0;
      }
    }
    var speedMps = Math.hypot(vx, vz),
      moving = speedMps >= MIN_GROUND_SPEED,
      headingRadians = moving ? Math.atan2(vx, vz) : null,
      confidence = moving ? round(Math.min(0.85, 0.55 + 0.3 * (measured / n)), 2) : 0.48,
      id = String(sq.id);
    return Object.freeze({
      squadId: id,
      source: 'aerial',
      observedAt: at,
      validUntil: at + VALID_SECONDS,
      x: Math.round((x + uncertainty(seed, faction, id, 'x')) / POSITION_GRID) * POSITION_GRID,
      z: Math.round((z + uncertainty(seed, faction, id, 'z')) / POSITION_GRID) * POSITION_GRID,
      observation: moving ? 'moving' : 'stationary',
      headingRadians: moving ? round(Math.round(headingRadians / HEADING_STEP) * HEADING_STEP, 3) : null,
      speedMps: moving ? round(Math.round(speedMps * 2) / 2, 1) : 0,
      positionUncertaintyM: 40,
      headingUncertaintyRadians: round(HEADING_STEP, 3),
      speedUncertaintyMps: 0.75,
      confidence: confidence
    });
  }
  /* One overflight fix: where each exposed hostile formation stood. */
  function fix(sim, faction) {
    var hostile = faction === 'us' ? 'ge' : 'us',
      out = {};
    ((sim.factions[hostile] && sim.factions[hostile].squads) || []).forEach(function (sq) {
      if (!sq || hidden(sq)) return;
      var men = (sq.members || []).filter(function (s) {
        return s && !s.dead && s.root && s.root.position;
      });
      if (men.length < 2) return;
      var x = 0,
        z = 0;
      for (var i = 0; i < men.length; i++) {
        x += +men[i].root.position.x;
        z += +men[i].root.position.z;
      }
      if (!isFinite(x) || !isFinite(z)) return;
      out[String(sq.id)] = { x: x / men.length, z: z / men.length };
    });
    return out;
  }
  /* Report entry from the last two fixes of the pass: displacement over the
     interval is the observed track. Nothing reads intent, brief or vehicle. */
  function trackContact(id, faction, seed, before, last, interval, at) {
    if (!last) return null;
    if ((faction === 'us' && last.z < 0) || (faction === 'ge' && last.z > 0)) return null;
    var vx = before ? (last.x - before.x) / interval : 0,
      vz = before ? (last.z - before.z) / interval : 0,
      speedMps = Math.hypot(vx, vz),
      moving = speedMps >= MIN_GROUND_SPEED,
      headingRadians = moving ? Math.atan2(vx, vz) : null;
    return Object.freeze({
      squadId: id,
      source: 'aerial',
      observedAt: at,
      validUntil: at + VALID_SECONDS,
      x: Math.round((last.x + uncertainty(seed, faction, id, 'x')) / POSITION_GRID) * POSITION_GRID,
      z: Math.round((last.z + uncertainty(seed, faction, id, 'z')) / POSITION_GRID) * POSITION_GRID,
      observation: moving ? 'moving' : 'stationary',
      headingRadians: moving ? round(Math.round(headingRadians / HEADING_STEP) * HEADING_STEP, 3) : null,
      speedMps: moving ? round(Math.round(speedMps * 2) / 2, 1) : 0,
      positionUncertaintyM: 40,
      headingUncertaintyRadians: round(HEADING_STEP, 3),
      speedUncertaintyMps: 0.75,
      confidence: moving ? 0.8 : 0.48
    });
  }
  function publish(sim, faction, contacts, at, extra) {
    var own = state(sim)[faction],
      town = sim.scene.metadata.battleScenario;
    contacts = contacts
      .filter(Boolean)
      .map(function (c) {
        return withCorridors(c, town, faction);
      })
      .sort(function (a, b) {
        return a.squadId.localeCompare(b.squadId);
      });
    own.event = Object.freeze(
      Object.assign(
        {
          source: 'aerial',
          faction: faction,
          observedAt: at,
          validUntil: at + VALID_SECONDS,
          contacts: Object.freeze(contacts)
        },
        extra || {}
      )
    );
    if (root.BattleTelemetry && root.BattleTelemetry.record)
      root.BattleTelemetry.record(
        'strategic-aerial-recon',
        {
          faction: faction,
          at: at,
          contacts: contacts.length,
          corridors: contacts.reduce(function (n, c) {
            return n + ((c.corridors && c.corridors.length) || 0);
          }, 0),
          expiresAt: at + VALID_SECONDS
        },
        sim
      );
    return own.event;
  }
  /* The doctrine sortie's pass continues on the General's own command tick;
     the report reaches him when the pass ends. */
  function advanceSortie(sim, faction) {
    var own = state(sim)[faction],
      pass = own.pass;
    if (!pass || own.event) return null;
    var step = OVERFLIGHT_SECONDS / (OVERFLIGHT_FIXES - 1),
      due = pass.startedAt + step * pass.fixes.length;
    if (!(+sim.time >= due - 1e-6)) return null;
    pass.fixes.push({ at: round(+sim.time, 2), positions: fix(sim, faction) });
    if (pass.fixes.length < OVERFLIGHT_FIXES) return null;
    var last = pass.fixes[pass.fixes.length - 1],
      before = pass.fixes[pass.fixes.length - 2],
      interval = Math.max(1, last.at - before.at),
      seed = String(sim.scene.metadata.battleScenario.seed || 'default');
    own.pass = null;
    return publish(
      sim,
      faction,
      Object.keys(last.positions).map(function (id) {
        return trackContact(id, faction, seed, before.positions[id], last.positions[id], interval, last.at);
      }),
      last.at,
      {
        sortieStartedAt: pass.startedAt,
        overflightSeconds: round(last.at - pass.startedAt, 2),
        // A sortie after the first was earned by a line changing hands (front lines).
        sortie: own.sorties || 1
      }
    );
  }
  function request(sim, faction, options) {
    if (!enabled(sim) || !validFaction(faction) || !sim.factions || !sim.factions[faction]) return null;
    /* With an explicit interception mission, reconnaissance must occur while
       an opponent is still outbound. This is a clock/doctrine decision by
       our General, not a hostile-motion trigger or privileged enemy lookup.
       Standalone aerialRecon retains its original 120s behavior. */
    var strategicEarly = !/(?:^|[?&])interception=0(?:&|$)/.test(
      (root.location && root.location.search) || ''
    );
    var playerOrdered = options && options.playerOrdered === true;
    // A player may spend their single reconnaissance sortie early, after
    // deployment starts. AI doctrine still retains its conservative clock.
    var earliest = playerOrdered ? 5 : strategicEarly ? INTERCEPTION_RECON_AT : MIN_REQUEST_AT;
    if (!(sim.time >= earliest) || sim.macroCommandEnabled === false || (playerOrdered && sim.paused))
      return null;
    var own = state(sim)[faction];
    var again = own.used ? frontMoved(sim, own, faction) : null;
    if (own.used && !again) return null;
    /* Only the General's own active strategic briefs can trigger a sortie.
       This decision never inspects hostile actor state. */
    var ready = (sim.factions[faction].squads || []).some(function (sq) {
      var m = sq._macroMission;
      return sq.state !== 'retreat' && m && m.owner === 'force-command' && m.status === 'executing';
    });
    if (!ready) return null;
    if (again) rearm(sim, faction, own, again);
    own.used = true;
    own.frontKey = frontKey(sim, own, faction);
    var at = round(+sim.time, 2);
    if (overflightOn() && !playerOrdered) {
      own.pass = { startedAt: at, fixes: [{ at: at, positions: fix(sim, faction) }] };
      if (root.BattleTelemetry && root.BattleTelemetry.record)
        root.BattleTelemetry.record(
          'strategic-aerial-recon-launched',
          { faction: faction, at: at, reportDueAt: at + OVERFLIGHT_SECONDS },
          sim
        );
      return null;
    }
    var hostile = faction === 'us' ? 'ge' : 'us',
      town = sim.scene.metadata.battleScenario,
      seed = String(town.seed || 'default');
    return publish(
      sim,
      faction,
      ((sim.factions[hostile] && sim.factions[hostile].squads) || []).map(function (sq) {
        return sampleSquad(sq, faction, seed, at);
      }),
      at
    );
  }
  /* Front lines: a line changing hands earns each side one new sortie (the report of the old
     front is superseded when the new pass launches). ?lineSortie=0 keeps one per battle. */
  /* A line changes hands when an objective gets a new owner; an objective that is only being
     neutralised keeps the owner it had, so a capture earns one sortie, not two. */
  /* A fresh reinforcement squad of this side (21c-strategic-reinforcements.js) also earns a
     sortie: the key counts them. */
  function frontKey(sim, own, faction) {
    var lines = root.BattleFrontLines,
      summary = lines && lines.active(sim) ? lines.summary(sim) : null;
    if (!summary) return null;
    var held = (own.heldOwners = own.heldOwners || {}),
      R = root.BattleStrategicReinforcements,
      fresh = R && R.sortiesEarned ? R.sortiesEarned(sim, faction) : 0;
    return (
      (fresh ? 'r' + fresh + '|' : '') +
      summary.lines
        .map(function (l, li) {
          return l.owners
            .map(function (o, k) {
              var key = li + ':' + k;
              if (o !== 'neutral') held[key] = o;
              return held[key] || 'neutral';
            })
            .join(',');
        })
        .join('|')
    );
  }
  function frontMoved(sim, own, faction) {
    if (flagOff('lineSortie') || own.pass || own.frontKey == null) return null;
    var key = frontKey(sim, own, faction);
    return key != null && key !== own.frontKey ? key : null;
  }
  function rearm(sim, faction, own, key) {
    own.event = null;
    own.sorties = (own.sorties || 1) + 1;
    if (root.BattleTelemetry && root.BattleTelemetry.record)
      root.BattleTelemetry.record(
        'strategic-aerial-recon-rearmed',
        { faction: faction, at: round(+sim.time, 2), sortie: own.sorties, front: key },
        sim
      );
  }
  function forGeneral(sim, faction) {
    if (!enabled(sim) || !validFaction(faction)) return null;
    var own = state(sim)[faction],
      ev = own.event;
    if (!ev || sim.time > ev.validUntil) return null;
    return ev;
  }
  function status(sim, faction) {
    if (!enabled(sim) || !validFaction(faction)) return { enabled: false, used: false };
    var own = state(sim)[faction],
      event = own.event;
    return Object.freeze({
      enabled: true,
      used: !!own.used,
      readyAt: 5,
      observedAt: event ? event.observedAt : null,
      expiresAt: event ? event.validUntil : null,
      contacts: event ? event.contacts.length : 0,
      live: !!(event && sim.time <= event.validUntil),
      inFlight: !!own.pass,
      reportDueAt: own.pass ? own.pass.startedAt + OVERFLIGHT_SECONDS : null
    });
  }
  function reset(sim) {
    sim._strategicAerialRecon = null;
  }
  root.BattleModules.registerSystem('strategic-aerial-recon', {
    version: '0.1-independent',
    onBattleStart: reset,
    onBattleRestart: reset,
    onCommanderTick: function (sim, p) {
      if (!p || !p.macroCommandEnabled || !enabled(sim)) return;
      request(sim, 'us');
      request(sim, 'ge');
      advanceSortie(sim, 'us');
      advanceSortie(sim, 'ge');
    }
  });
  root.BattleAerialRecon = {
    version: '0.1-independent',
    request: request,
    forGeneral: forGeneral,
    status: status,
    corridorsFor: corridorsFor,
    tuning: Object.freeze({
      earliestRequestSeconds: MIN_REQUEST_AT,
      interceptionRequestSeconds: INTERCEPTION_RECON_AT,
      validitySeconds: VALID_SECONDS,
      overflightSeconds: OVERFLIGHT_SECONDS
    })
  };
  if (typeof root.GTLog === 'function') root.GTLog('[STRATEGIC] one-shot aerial recon ready');
})(typeof window !== 'undefined' ? window : globalThis);
