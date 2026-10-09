/* Built-in modular objective: timed occupation/capture zone.
   Capture zones own marker/control state and publish a short post-capture security request. Force
   Command consumes that request and remains the sole writer of squad objective/phase/target fields. */
(function (root) {
  'use strict';
  if (!root.BattleModules) return;

  var POST_CAPTURE_HOLD = 18,
    DEFENSE_ENTER_RATIO = 0.92,
    DEFENSE_RELEASE_RATIO = 1.35;
  var COLOR_NEUTRAL = { r: 1, g: 0.76, b: 0.16 },
    COLOR_US = { r: 0.2, g: 0.56, b: 1 },
    COLOR_GE = { r: 1, g: 0.25, b: 0.18 },
    COLOR_CONTESTED = { r: 1, g: 1, b: 1 };

  function distance2(a, b) {
    var dx = a.x - b.x,
      dz = a.z - b.z;
    return dx * dx + dz * dz;
  }
  function distance(a, b) {
    return Math.sqrt(distance2(a, b));
  }
  function color3(c) {
    return new BABYLON.Color3(c.r, c.g, c.b);
  }
  function objectivePoint(instance) {
    var d = (instance && instance.def) || {};
    return { x: +d.x || 0, z: +d.z || 0 };
  }
  function enemyFaction(f) {
    return f === 'us' ? 'ge' : 'us';
  }
  function squadAverage(sq) {
    var alive = [],
      x = 0,
      z = 0;
    for (var i = 0; i < (sq.members || []).length; i++) if (!sq.members[i].dead) alive.push(sq.members[i]);
    if (!alive.length) return sq.rally ? { x: sq.rally.x, z: sq.rally.z } : { x: 0, z: 0 };
    for (i = 0; i < alive.length; i++) {
      x += alive[i].root.position.x;
      z += alive[i].root.position.z;
    }
    return { x: x / alive.length, z: z / alive.length };
  }

  function countPresence(instance, sim, helpers) {
    var def = instance.def,
      r = +def.radius || 20,
      r2 = r * r,
      weights = {};
    helpers.unitsFor(sim).forEach(function (unit) {
      var f = unit.faction;
      if (!f) return;
      if (distance2(unit.root.position, def) > r2) return;
      var w = unit.captureWeight == null ? 1 : +unit.captureWeight;
      if (!(w > 0)) return;
      weights[f] = (weights[f] || 0) + w;
    });
    return weights;
  }
  function leadingFaction(weights, minPresence) {
    var ranked = Object.keys(weights)
      .map(function (f) {
        return { faction: f, weight: weights[f] };
      })
      .sort(function (a, b) {
        return b.weight - a.weight;
      });
    if (!ranked.length || ranked[0].weight < minPresence) return null;
    if (ranked[1] && ranked[0].weight <= ranked[1].weight) return null;
    return ranked[0];
  }
  /* The men of the side that just took (or took back) the zone, standing in it, are told: something went their way.
     Nothing is queued unless a layer reads `objective` (the soldier condition, behind ?stressMem=relief). */
  function tellTakers(instance, sim, helpers, faction) {
    var E = root.BattleSoldierEvents;
    if (!E) return;
    var r = +instance.def.radius || 20,
      r2 = r * r;
    helpers.unitsFor(sim).forEach(function (unit) {
      if (unit.faction === faction && distance2(unit.root.position, instance.def) <= r2)
        E.post(unit, sim, 'objective', { objective: instance.id });
    });
  }
  function init(instance) {
    return {
      owner: instance.def.initialOwner || 'neutral',
      active: null,
      lastActive: null,
      progress: 0,
      progressBy: null,
      phase: 'idle',
      weights: {}
    };
  }
  function tick(instance, sim, dt, helpers) {
    var def = instance.def,
      state = instance.state,
      captureSeconds = +def.captureSeconds || 12,
      minPresence = +def.minPresence || 2;
    var weights = countPresence(instance, sim, helpers),
      leader = leadingFaction(weights, minPresence),
      active = (leader && leader.faction) || null;
    state.weights = weights;

    if (active !== state.lastActive) {
      if (active)
        helpers.telemetry(sim, 'objective-pressure', {
          objective: instance.id,
          sector: instance.id,
          faction: active,
          weights: weights,
          owner: state.owner
        });
      state.lastActive = active;
    }
    state.active = active;

    /* Losing the lead is not the same as losing the ground.
       This used to slam progress to zero on every change of `active`, including the change to
       nobody - and `active` goes to nobody whenever presence dips under minPresence for a moment
       or the two sides momentarily tie, which is constantly. Twelve seconds of work was wiped by
       one man stepping outside the ring or one casualty, so a contested zone could never be taken
       and the decay below was unreachable dead code. Progress now decays while the zone is empty
       and is only cancelled outright when the other side actually takes over the work. */
    if (!active) {
      state.phase = 'idle';
      state.progress = Math.max(0, state.progress - dt * 0.35);
      if (state.progress <= 0) state.progressBy = null;
      return;
    }
    if (state.progressBy && state.progressBy !== active) state.progress = 0;
    state.progressBy = active;
    if (state.owner === active) {
      state.phase = 'held';
      state.progress = 0;
      state.progressBy = null;
      return;
    }

    var opposition = 0;
    Object.keys(weights).forEach(function (f) {
      if (f !== active) opposition += weights[f] || 0;
    });
    var advantage = Math.max(1, (weights[active] || 0) - opposition),
      rate = 1 + Math.min(2, Math.max(0, advantage - 1)) * 0.25;
    state.phase = state.owner === 'neutral' ? 'capturing' : 'neutralizing';
    state.progress += dt * rate;
    helpers.stats.pressureSecondsByFaction[active] =
      (helpers.stats.pressureSecondsByFaction[active] || 0) + dt;

    if (state.progress < captureSeconds) return;
    if (state.owner !== 'neutral') {
      var previous = state.owner;
      state.owner = 'neutral';
      state.progress = 0;
      state.progressBy = null;
      helpers.stats.neutralizations++;
      helpers.stats.neutralizationsByFaction[active] =
        (helpers.stats.neutralizationsByFaction[active] || 0) + 1;
      helpers.telemetry(sim, 'objective-neutralized', {
        objective: instance.id,
        sector: instance.id,
        by: active,
        previousOwner: previous
      });
      tellTakers(instance, sim, helpers, active);
      return;
    }
    state.owner = active;
    state.progress = 0;
    state.progressBy = null;
    state.phase = 'held';
    helpers.stats.captures++;
    helpers.stats.capturesByFaction[active] = (helpers.stats.capturesByFaction[active] || 0) + 1;
    helpers.telemetry(sim, 'objective-captured', {
      objective: instance.id,
      sector: instance.id,
      faction: active,
      seconds: captureSeconds
    });
    tellTakers(instance, sim, helpers, active);
  }
  function status(instance) {
    var s = instance.state,
      captureSeconds = +instance.def.captureSeconds || 12,
      pct = Math.round(Math.min(100, (s.progress / captureSeconds) * 100));
    return {
      owner: s.owner,
      active: s.active,
      progress: pct,
      phase: s.phase,
      weights: Object.assign({}, s.weights),
      us: s.weights.us || 0,
      ge: s.weights.ge || 0,
      radius: +instance.def.radius || 20
    };
  }

  var FLAG_POLE_HEIGHT = 8,
    FLAG_WIDTH = 3.2,
    FLAG_HEIGHT = 1.65,
    FLAG_LOW = 2.35,
    FLAG_HIGH = 7.15,
    SANDBAG_CLUSTERS = 6,
    SANDBAGS_PER_CLUSTER = 3;

  function disposeMarkers(sim) {
    var markers = sim && sim._captureZoneMarkers;
    if (!markers) return;
    Object.keys(markers).forEach(function (id) {
      var m = markers[id];
      if (!m) return;
      try {
        if (m.waveObserver && sim.scene && sim.scene.onBeforeRenderObservable)
          sim.scene.onBeforeRenderObservable.remove(m.waveObserver);
      } catch (_) {}
      ['pole', 'flag', 'sandbags'].forEach(function (k) {
        try {
          if (m[k]) m[k].dispose();
        } catch (_) {}
      });
      ['poleMaterial', 'flagMaterial', 'sandbagMaterial'].forEach(function (k) {
        try {
          if (m[k]) m[k].dispose();
        } catch (_) {}
      });
    });
    sim._captureZoneMarkers = null;
    sim._captureZoneMarkerScenario = null;
  }
  function markerScenarioId(sim, payload) {
    var town =
      (payload && payload.town) ||
      (sim &&
        sim.scene &&
        sim.scene.metadata &&
        (sim.scene.metadata.battleScenario || sim.scene.metadata.battleTown));
    return (town && town.id) || 'default';
  }
  function markerColor(st) {
    var us = +((st && st.us) || 0),
      ge = +((st && st.ge) || 0);
    if (st && st.owner === 'us') return COLOR_US;
    if (st && st.owner === 'ge') return COLOR_GE;
    if (st && st.active === 'us') return COLOR_US;
    if (st && st.active === 'ge') return COLOR_GE;
    if (us > 0 && ge > 0) return COLOR_CONTESTED;
    return COLOR_NEUTRAL;
  }
  function flagTargetY(marker, st) {
    var low = marker.lowY,
      high = marker.highY,
      pct = Math.max(0, Math.min(1, +((st && st.progress) || 0) / 100)),
      owned = st && (st.owner === 'us' || st.owner === 'ge');
    if (owned) {
      if (st.phase === 'neutralizing' && st.active && st.active !== st.owner)
        return high - (high - low) * pct;
      return high;
    }
    if (st && st.phase === 'capturing' && st.active) return low + (high - low) * pct;
    return low;
  }
  function flagPaths() {
    var top = [],
      bottom = [],
      cols = 7;
    for (var i = 0; i < cols; i++) {
      var x = (i / (cols - 1)) * FLAG_WIDTH;
      top.push(new BABYLON.Vector3(x, 0, 0));
      bottom.push(new BABYLON.Vector3(x, -FLAG_HEIGHT, 0));
    }
    return [top, bottom];
  }
  /* The rendered ground mesh is the authority for ground-contact presentation:
     it has the final interpolated triangles after scenario terrain is applied.
     The simulation height sample remains the fallback for headless tests. */
  function markerSurfaceY(sim, x, z) {
    var mesh = sim && sim.scene && sim.scene.getMeshByName && sim.scene.getMeshByName('battleField');
    if (mesh && typeof mesh.getHeightAtCoordinates === 'function') {
      var h = mesh.getHeightAtCoordinates(x, z);
      if (isFinite(h)) return h;
    }
    return sim.heightAt(x, z);
  }
  function markerFootprintClear(sim, x, z, hx, hz, rotation, onRoad) {
    var T = root.BattleTerrainFeatures,
      fp = T && T.rectFootprint && T.rectFootprint(x, z, hx, hz, rotation);
    if (!fp || !T.placementClear) return true;
    var obstacles = (sim && sim.obstacles) || [],
      physical = obstacles.__physicalFootprints || [];
    if (!T.placementClear(physical, fp, 0.45)) return false;
    var scenario = sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario,
      buildings = (scenario && scenario.buildings) || [];
    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i],
        building = T.rectFootprint(b.x, b.z, b.w / 2, b.d / 2, b.rot || 0);
      if (T.footprintOverlap(fp, building, 0.5)) return false;
    }
    if (onRoad && T.roadClear && !T.roadClear((scenario && scenario.roads) || [], fp, 0.8))
      return false;
    return true;
  }
  function markerAnchor(sim, cx, cz) {
    if (markerFootprintClear(sim, cx, cz, 0.48, 0.48, 0, false)) return { x: cx, z: cz };
    /* A rare objective generated in a building must put its visual pole in legal
       ground nearby, without changing the tactical objective's actual coordinate. */
    for (var r = 3; r <= 21; r += 3)
      for (var n = 0; n < 24; n++) {
        var a = 2 * Math.PI * n / 24,
          x = cx + r * Math.cos(a), z = cz + r * Math.sin(a);
        if (markerFootprintClear(sim, x, z, 0.48, 0.48, 0, false))
          return { x: x, z: z };
      }
    return null;
  }
  function objectiveSandbags(scene, sim, obj, cx, cz, radius, material) {
    var parts = [],
      boundary = Math.max(7, radius * 0.9),
      spacing = 1.55,
      step = spacing / boundary;
    for (var cluster = 0; cluster < SANDBAG_CLUSTERS; cluster++) {
      var centerA = Math.PI / 6 + (cluster / SANDBAG_CLUSTERS) * Math.PI * 2;
      for (var j = 0; j < SANDBAGS_PER_CLUSTER; j++) {
        var off = j - (SANDBAGS_PER_CLUSTER - 1) / 2,
          a = centerA + off * step,
          x = cx + Math.cos(a) * boundary,
          z = cz + Math.sin(a) * boundary,
          rot = Math.PI / 2 - a;
        /* Decorative walls must not intersect houses, solid cover, or approach
           roads; rejected pieces leave additional usable infantry gaps. */
        if (!markerFootprintClear(sim, x, z, 0.75, 0.36, rot, true)) continue;
        var y = Math.min(
            markerSurfaceY(sim, x, z),
            markerSurfaceY(sim, x + Math.cos(rot) * 0.75, z - Math.sin(rot) * 0.75),
            markerSurfaceY(sim, x - Math.cos(rot) * 0.75, z + Math.sin(rot) * 0.75)
          ),
          bag = BABYLON.MeshBuilder.CreateBox(
            'objective-sandbag-part-' + obj.id,
            { width: 1.5, height: 0.58, depth: 0.72 },
            scene
          );
        bag.position.set(x, y + 0.24, z);
        /* The box bottom is buried 5cm, avoiding hovering on sloping terrain.
           Box width follows the tangent, leaving broad approach gaps. */
        bag.rotation.y = rot;
        parts.push(bag);
      }
    }
    var merged =
      parts.length > 1 ? BABYLON.Mesh.MergeMeshes(parts, true, true, undefined, false, false) : parts[0];
    if (merged) {
      merged.name = 'objective-sandbags-' + obj.id;
      merged.material = material;
      merged.isPickable = false;
      if (merged.freezeWorldMatrix) merged.freezeWorldMatrix();
    }
    return merged;
  }
  function createMarker(sim, obj) {
    if (typeof BABYLON === 'undefined' || !sim || !sim.scene) return null;
    if (!BABYLON.MeshBuilder || typeof BABYLON.MeshBuilder.CreateRibbon !== 'function') return null;
    var scene = sim.scene,
      def = obj.def || {},
      anchor = markerAnchor(sim, +def.x || 0, +def.z || 0);
    if (!anchor) return null;
    var cx = anchor.x,
      cz = anchor.z,
      r = +def.radius || 20,
      y = markerSurfaceY(sim, cx, cz),
      pole = BABYLON.MeshBuilder.CreateCylinder(
        'objective-pole-' + obj.id,
        { height: FLAG_POLE_HEIGHT, diameter: 0.28, tessellation: 10 },
        scene
      );
    pole.position.set(cx, y + FLAG_POLE_HEIGHT / 2 - 0.15, cz);
    pole.isPickable = false;

    var poleMaterial = new BABYLON.StandardMaterial('objective-pole-mat-' + obj.id, scene);
    poleMaterial.diffuseColor = new BABYLON.Color3(0.26, 0.27, 0.25);
    poleMaterial.specularColor = BABYLON.Color3.Black();
    pole.material = poleMaterial;

    var flagMaterial = new BABYLON.StandardMaterial('objective-flag-mat-' + obj.id, scene);
    flagMaterial.diffuseColor = color3(COLOR_NEUTRAL);
    flagMaterial.emissiveColor = color3(COLOR_NEUTRAL).scale(0.3);
    flagMaterial.specularColor = BABYLON.Color3.Black();
    flagMaterial.backFaceCulling = false;
    var flag = BABYLON.MeshBuilder.CreateRibbon(
      'objective-flag-' + obj.id,
      { pathArray: flagPaths(), closeArray: false, closePath: false, updatable: true },
      scene
    );
    flag.position.set(cx, y + FLAG_LOW, cz);
    flag.rotation.y = -0.58;
    flag.isPickable = false;
    flag.material = flagMaterial;
    flag._targetY = y + FLAG_LOW;

    var sandbagMaterial = new BABYLON.StandardMaterial('objective-sandbag-mat-' + obj.id, scene);
    sandbagMaterial.diffuseColor = new BABYLON.Color3(0.57, 0.51, 0.36);
    sandbagMaterial.ambientColor = new BABYLON.Color3(0.34, 0.3, 0.2);
    sandbagMaterial.specularColor = BABYLON.Color3.Black();
    var sandbags = objectiveSandbags(scene, sim, obj, cx, cz, r, sandbagMaterial);

    var base = flag.getVerticesData(BABYLON.VertexBuffer.PositionKind).slice(),
      waved = base.slice(),
      phase = 0;
    for (var h = 0; h < String(obj.id || '').length; h++)
      phase = (phase * 31 + String(obj.id).charCodeAt(h)) % 628;
    phase /= 100;
    var waveObserver = scene.onBeforeRenderObservable.add(function () {
      if (!flag || (flag.isDisposed && flag.isDisposed())) return;
      var engine = scene.getEngine && scene.getEngine(),
        dt = Math.min(0.05, ((engine && engine.getDeltaTime && engine.getDeltaTime()) || 16) / 1000),
        targetY = flag._targetY == null ? y + FLAG_LOW : flag._targetY,
        now =
          (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000 +
          phase;
      flag.position.y += (targetY - flag.position.y) * Math.min(1, dt * 4.5);
      for (var v = 0; v < base.length / 3; v++) {
        var vx = base[v * 3],
          reach = FLAG_WIDTH ? vx / FLAG_WIDTH : 0;
        waved[v * 3] = vx;
        waved[v * 3 + 1] = base[v * 3 + 1];
        waved[v * 3 + 2] =
          (Math.sin(now * 3.6 + vx * 2.15) * 0.15 + Math.sin(now * 2.2 + vx * 4.1) * 0.035) * reach;
      }
      flag.updateVerticesData(BABYLON.VertexBuffer.PositionKind, waved, false, false);
    });
    return {
      pole: pole,
      flag: flag,
      sandbags: sandbags,
      poleMaterial: poleMaterial,
      flagMaterial: flagMaterial,
      sandbagMaterial: sandbagMaterial,
      lowY: y + FLAG_LOW,
      highY: y + FLAG_HIGH,
      waveObserver: waveObserver
    };
  }
  function ensureMarkers(sim, payload) {
    if (!sim || !sim._objectives || typeof BABYLON === 'undefined') return;
    var scenarioId = markerScenarioId(sim, payload);
    if (sim._captureZoneMarkerScenario !== scenarioId) {
      disposeMarkers(sim);
      sim._captureZoneMarkerScenario = scenarioId;
      sim._captureZoneMarkers = {};
    }
    var markers = sim._captureZoneMarkers || (sim._captureZoneMarkers = {});
    sim._objectives.forEach(function (obj) {
      if (obj.type === 'capture-zone' && !markers[obj.id]) markers[obj.id] = createMarker(sim, obj);
    });
  }
  function updateMarkers(sim, payload) {
    ensureMarkers(sim, payload);
    var markers = sim && sim._captureZoneMarkers;
    if (!markers) return;
    (sim._objectives || []).forEach(function (obj) {
      var marker = markers[obj.id];
      if (!marker) return;
      var st =
          (root.BattleObjectiveSystem && root.BattleObjectiveSystem.status(sim, obj.id)) || obj.state || {},
        c = markerColor(st),
        col = color3(c),
        active = st.phase === 'capturing' || st.phase === 'neutralizing',
        glow = active ? 0.42 + (Math.sin((sim.time || 0) * 5) + 1) * 0.08 : 0.3;
      marker.flagMaterial.diffuseColor = col;
      marker.flagMaterial.emissiveColor = col.scale(glow);
      marker.flag._targetY = flagTargetY(marker, st);
    });
  }

  function objectiveForSquad(sim, sq) {
    var request = sq._captureZoneDefenseRequest,
      preferred = (request && request.objectiveId) || sq._objectiveDefenseId || sq.targetObjective,
      objs = sim._objectives || [],
      i,
      obj,
      p,
      r,
      d,
      best = null;
    if (preferred && root.BattleObjectiveSystem) {
      obj = root.BattleObjectiveSystem.get(sim, preferred);
      if (obj && obj.type === 'capture-zone') return obj;
    }
    p = squadAverage(sq);
    for (i = 0; i < objs.length; i++) {
      obj = objs[i];
      if (obj.type !== 'capture-zone') continue;
      r = +obj.def.radius || 20;
      d = distance(p, objectivePoint(obj));
      if (d <= r * DEFENSE_ENTER_RATIO && (!best || d < best.distance)) best = { instance: obj, distance: d };
    }
    return (best && best.instance) || null;
  }
  function requestDefense(sim, sq, obj, p, why) {
    var point = objectivePoint(obj),
      prior = sq._captureZoneDefenseRequest,
      changed = !prior || prior.objectiveId !== obj.id;
    sq._captureZoneDefenseRequest = {
      objectiveId: obj.id,
      point: { x: point.x, z: point.z },
      anchor: changed ? { x: p.x, z: p.z } : prior.anchor,
      requestedAt: +(sim.time || 0),
      reason: why || 'secure'
    };
    if (changed) {
      if (root.BattleTelemetry)
        root.BattleTelemetry.record(
          'objective-defense-request',
          { faction: sq.faction, squad: sq.id, objective: obj.id, reason: why || 'secure' },
          sim
        );
    }
  }
  function releaseDefense(sim, sq, reason) {
    var request = sq._captureZoneDefenseRequest;
    if (!request) return;
    if (root.BattleTelemetry)
      root.BattleTelemetry.record(
        'objective-defense-release',
        { faction: sq.faction, squad: sq.id, objective: request.objectiveId, reason: reason || 'released' },
        sim
      );
    sq._captureZoneDefenseRequest = null;
    if (root.BattleLeases)
      root.BattleLeases.end(sq, 'objective-security', +(sim.time || 0), reason || 'released');
  }
  /* Objective security is not a pure timer: its expired record marks the 18 s window as used, so a
     squad already holding the zone is not granted a fresh one. It is never pruned. */
  if (root.BattleLeases)
    root.BattleLeases.define('objective-security', {
      priority: 80,
      progress: function (sq) {
        var r = sq._captureZoneDefenseRequest;
        return { ok: null, detail: r ? r.reason : 'no defense request' };
      }
    });
  function defendCaptureZones(sim) {
    var L = root.BattleLeases;
    ['us', 'ge'].forEach(function (faction) {
      var squads = (sim.factions && sim.factions[faction] && sim.factions[faction].squads) || [];
      squads.forEach(function (sq) {
        if (!sq || sq.state === 'retreat') {
          releaseDefense(sim, sq, 'retreat');
          return;
        }
        var obj = objectiveForSquad(sim, sq);
        if (!obj) {
          releaseDefense(sim, sq, 'left objective');
          return;
        }
        var st =
            (root.BattleObjectiveSystem && root.BattleObjectiveSystem.status(sim, obj.id)) || obj.state || {},
          p = squadAverage(sq),
          point = objectivePoint(obj),
          r = +obj.def.radius || 20,
          d = distance(p, point),
          enemy = enemyFaction(faction),
          friendlyWeight = +(st[faction] || 0),
          enemyWeight = +(st[enemy] || 0);
        var request = sq._captureZoneDefenseRequest,
          already = !!(request && request.objectiveId === obj.id),
          inside = d <= r * (already ? DEFENSE_RELEASE_RATIO : DEFENSE_ENTER_RATIO),
          enemyPresent = enemyWeight > 0,
          ours = st.owner === faction,
          taking = !ours && inside && (friendlyWeight > 0 || st.active === faction),
          contested = inside && friendlyWeight > 0 && enemyPresent;
        /* Taking or holding a contested zone keeps the squad on it for POST_CAPTURE_HOLD seconds after
           the last pressure; Force Command reads the defense request this lease keeps alive. */
        if (taking || contested) {
          L.extend(
            sq,
            'objective-security',
            'capture-zone',
            sim.time || 0,
            (sim.time || 0) + POST_CAPTURE_HOLD,
            'securing ' + obj.id,
            'expiry with no enemy present, leaving the zone, losing it, or retreat'
          );
          requestDefense(sim, sq, obj, p, contested ? 'contested objective' : 'capturing objective');
          return;
        }
        if (ours && inside) {
          if (!L.get(sq, 'objective-security'))
            L.grant(
              sq,
              'objective-security',
              'capture-zone',
              sim.time || 0,
              (sim.time || 0) + POST_CAPTURE_HOLD,
              'securing captured ' + obj.id,
              'expiry with no enemy present, leaving the zone, losing it, or retreat'
            );
          if (enemyPresent || (already && L.holds(sq, 'objective-security', sim.time || 0))) {
            requestDefense(
              sim,
              sq,
              obj,
              p,
              enemyPresent ? 'defending pressure' : 'securing captured objective'
            );
            return;
          }
        }
        releaseDefense(sim, sq, ours ? 'objective secure' : 'objective lost');
      });
    });
  }

  /* Pure location helpers exposed for geometry fixtures; no runtime reads this API. */
  root.BattleCaptureMarkerGeometry = {
    surfaceY: markerSurfaceY,
    footprintClear: markerFootprintClear,
    anchor: markerAnchor
  };
  root.BattleModules.registerObjectiveType('capture-zone', {
    version: '30-objective-flags',
    label: 'Timed capture zone',
    init: init,
    tick: tick,
    status: status
  });
  root.BattleModules.registerSystem('capture-zone-tactics', {
    version: '30-objective-flags',
    onBattleStart: function (sim, payload) {
      ensureMarkers(sim, payload);
      updateMarkers(sim, payload);
    },
    onBattleRestart: function (sim, payload) {
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions && sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          sq._captureZoneDefenseRequest = null;
          if (root.BattleLeases)
            root.BattleLeases.end(sq, 'objective-security', +(sim.time || 0), 'battle restart');
        });
      });
      updateMarkers(sim, payload);
    },
    onCommanderTick: function (sim, payload) {
      defendCaptureZones(sim);
      updateMarkers(sim, payload);
    }
  });
  root.GTLog('[OBJECTIVE] capture zones v30: waving raise/lower flags + open sandbag boundary active');
})(typeof window !== 'undefined' ? window : globalThis);
