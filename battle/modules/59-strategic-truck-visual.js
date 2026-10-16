/* Opt-in 5 km troop-truck presentation. No movement, collision, knowledge,
   fire, path, transport scheduling or soldier positions are written here.
   Both factions temporarily share german_transport.fbx; seated riders use
   their OWN faction's FBX model and the supplied 10-seat calibration. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleTransportVehicleVisual) return;
  var MODEL = 'german_transport.fbx';
  var SOLDIER = { us: 'us-paratrooper.fbx', ge: 'ge-paratrooper.fbx' };
  var SEATS = [
    ['Driver', 'driver', [-0.45, 0.95, 0.7], 0, 'Truck - Driving.fbx'],
    ['Right 1', 'passenger', [0.65, 1.3, -0.333], -90, 'Truck - Sitting 1.fbx'],
    ['Right 2', 'passenger', [0.9, 1.3, -1.027], -90, 'Truck - Sitting 2.fbx'],
    ['Right 3', 'passenger', [0.9, 1.3, -1.8], -90, 'Truck - Sitting 3.fbx'],
    ['Right 4', 'passenger', [0.55, 1.3, -2.483], -90, 'Truck - Sitting 1.fbx'],
    ['Left 1', 'passenger', [-0.9, 1.3, -0.335], 90, 'Truck - Sitting 3.fbx'],
    ['Left 2', 'passenger', [-0.9, 1.3, -1.053], 90, 'Truck - Sitting 2.fbx'],
    ['Left 3', 'passenger', [-0.55, 1.3, -1.875], 90, 'Truck - Sitting 1.fbx'],
    ['Left 4', 'passenger', [-0.9, 1.3, -2.565], 90, 'Truck - Sitting 3.fbx'],
    ['Front', 'passenger', [0.4, 0.95, 0.7], 0, 'Truck - Sitting 3.fbx']
  ].map(function (s) {
    return { name: s[0], role: s[1], position: s[2], yaw: s[3], occupied: true, clip: s[4] };
  });
  var TRUCK_LENGTH = 6.2,
    RENDER_CREW_RADIUS = 230,
    DROP_CREW_RADIUS = 310;
  var stores = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var assetFiles = {};
  function enabled(sim) {
    var scenario = sim && sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario;
    var search = (root.location && root.location.search) || '';
    return !!(
      scenario &&
      scenario.profile === 'strategic' &&
      /(?:^|[?&])strategicInterception=1(?:&|$)/.test(search) &&
      /(?:^|[?&])motorTransport=1(?:&|$)/.test(search) &&
      !/(?:^|[?&])truckVisual=0(?:&|$)/.test(search)
    );
  }
  function seatsFor(squad) {
    return ((squad && squad.members) || [])
      .filter(function (s) {
        return !s.dead;
      })
      .slice(0, SEATS.length)
      .map(function (s, i) {
        return { soldier: s, seat: SEATS[i], index: i };
      });
  }
  function stateFor(sim) {
    if (!stores) {
      if (!sim._truckVisualState)
        sim._truckVisualState = {
          scene: sim.scene,
          trucks: new Map(),
          generation: 0,
          source: null,
          pending: null,
          animationQueue: Promise.resolve(),
          errors: []
        };
      return sim._truckVisualState;
    }
    var st = stores.get(sim);
    if (!st) {
      st = {
        scene: sim.scene,
        trucks: new Map(),
        generation: 0,
        source: null,
        pending: null,
        animationQueue: Promise.resolve(),
        errors: []
      };
      stores.set(sim, st);
    }
    return st;
  }
  function baseUrl() {
    var base = root.BATTLE_SOLDIER_ASSET_BASE || root.BATTLE_ASSET_BASE || '/grasstex/Assets/';
    return String(base).replace(/\/?$/, '/');
  }
  function fetchAsset(category, name) {
    var key = baseUrl() + category + '/' + name;
    if (!assetFiles[key]) {
      assetFiles[key] = fetch(baseUrl() + category + '/' + encodeURIComponent(name))
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status + ' loading ' + category + '/' + name);
          return response.blob();
        })
        .then(function (blob) {
          return new File([blob], name);
        })
        .catch(function (err) {
          delete assetFiles[key];
          throw err;
        });
    }
    return assetFiles[key];
  }
  function membersOf(result) {
    return (result.meshes || []).concat(result.transformNodes || []);
  }
  function attachImport(result, parent) {
    var nodes = membersOf(result),
      owned = new Set(nodes);
    nodes
      .filter(function (node) {
        return !node.parent || !owned.has(node.parent);
      })
      .forEach(function (node) {
        node.parent = parent;
      });
  }
  function bounds(meshes) {
    var low = { x: Infinity, y: Infinity, z: Infinity },
      high = { x: -Infinity, y: -Infinity, z: -Infinity },
      found = false;
    meshes.forEach(function (mesh) {
      if (!mesh.getTotalVertices || mesh.getTotalVertices() <= 0) return;
      mesh.computeWorldMatrix(true);
      var b = mesh.getBoundingInfo().boundingBox,
        min = b.minimumWorld,
        max = b.maximumWorld;
      ['x', 'y', 'z'].forEach(function (axis) {
        low[axis] = Math.min(low[axis], min[axis]);
        high[axis] = Math.max(high[axis], max[axis]);
      });
      found = true;
    });
    return found
      ? { low: low, high: high, width: high.x - low.x, height: high.y - low.y, depth: high.z - low.z }
      : null;
  }
  function materialBothSides(meshes) {
    var seen = new Set();
    function visit(mat) {
      if (!mat || seen.has(mat)) return;
      seen.add(mat);
      if (mat.subMaterials) mat.subMaterials.forEach(visit);
      mat.backFaceCulling = false;
      if ('twoSidedLighting' in mat) mat.twoSidedLighting = true;
      if (typeof mat.markAsDirty === 'function') mat.markAsDirty(BABYLON.Material.AllDirtyFlag);
    }
    meshes.forEach(function (mesh) {
      visit(mesh.material);
    });
  }
  function disposeImport(result) {
    if (!result) return;
    (result.animationGroups || []).forEach(function (group) {
      try {
        group.stop();
        group.dispose();
      } catch (_) {}
    });
    (result.meshes || []).forEach(function (mesh) {
      if (!mesh.isDisposed()) mesh.dispose(false, false);
    });
    (result.transformNodes || []).forEach(function (node) {
      if (!node.isDisposed()) node.dispose(false, false);
    });
    (result.skeletons || []).forEach(function (sk) {
      sk.dispose();
    });
  }
  function recordError(st, label, err) {
    var message = label + ': ' + String((err && (err.stack || err.message)) || err).slice(0, 1800);
    if (st.errors.indexOf(message) < 0) {
      st.errors.push(message);
      console.warn('[TRUCK VISUAL] ' + message);
    }
  }
  async function loadTruckSource(sim, st) {
    if (st.source) return st.source;
    if (st.pending) return st.pending;
    var generation = st.generation,
      scene = sim.scene;
    st.pending = fetchAsset('vehicles', MODEL)
      .then(function (file) {
        return BABYLON.SceneLoader.ImportMeshAsync('', 'file:', file, scene, undefined, '.fbx');
      })
      .then(function (result) {
        if (st.generation !== generation || st.scene !== scene) {
          disposeImport(result);
          return null;
        }
        var template = new BABYLON.TransformNode('strategicTruckTemplate', scene);
        attachImport(result, template);
        var renderMeshes = (result.meshes || []).filter(function (m) {
          return m.getTotalVertices && m.getTotalVertices() > 0;
        });
        var box = bounds(renderMeshes);
        if (!box) {
          template.dispose(false, false);
          disposeImport(result);
          throw new Error('truck FBX contains no meshes');
        }
        materialBothSides(renderMeshes);
        // Meshes are presentation only. No new ray-pickable armor, bullet
        // blockers, AI vision occluders or colliders are introduced in V1.
        renderMeshes.forEach(function (mesh) {
          mesh.isPickable = false;
          mesh.checkCollisions = false;
        });
        var scale = TRUCK_LENGTH / Math.max(box.width, box.depth, 0.001);
        template.scaling.setAll(scale);
        template.position.set(
          -(box.low.x + box.high.x) * 0.5 * scale,
          -box.low.y * scale,
          -(box.low.z + box.high.z) * 0.5 * scale
        );
        template.setEnabled(false);
        st.source = { template: template, result: result, count: renderMeshes.length };
        return st.source;
      })
      .catch(function (err) {
        recordError(st, 'truck FBX', err);
        return null;
      })
      .finally(function () {
        st.pending = null;
      });
    return st.pending;
  }
  function locationFor(sim, transport) {
    var p = transport.position || transport.boardingCenter;
    if (!p || !isFinite(p.x) || !isFinite(p.z)) return null;
    return { x: +p.x, y: +sim.heightAt(+p.x, +p.z), z: +p.z };
  }
  function updateVehiclePose(sim, entry, transport) {
    if (!entry.root || entry.root.isDisposed()) return;
    var p = locationFor(sim, transport);
    if (!p) return;
    entry.root.position.set(p.x, p.y, p.z);
    var h = transport.heading || { x: 0, z: 1 };
    entry.root.rotation.y = Math.atan2(+h.x || 0, +h.z || 0);
    entry.phase = transport.phase;
  }
  function instantiateTruck(sim, st, entry) {
    if (entry.root || entry.pending || !st.source) return;
    var scene = sim.scene,
      rootNode = new BABYLON.TransformNode('strategicTruck-' + entry.faction + '-' + entry.id, scene);
    var clone = st.source.template.clone('strategicTruckModel-' + entry.id, rootNode, false);
    if (!clone) {
      rootNode.dispose(false, false);
      throw new Error('could not clone truck FBX');
    }
    clone.setEnabled(true);
    entry.root = rootNode;
    entry.visual = clone;
  }
  function cameraNear(scene, entry, radius) {
    var camera = scene.activeCamera;
    if (!camera || !entry.root) return false;
    var at = camera.globalPosition || camera.position;
    if (!at) return false;
    return Math.hypot(at.x - entry.root.position.x, at.z - entry.root.position.z) <= radius;
  }
  function originalVisual(soldier) {
    // The FBX backend binds on the soldier actor, not on soldier.model.
    return (soldier && soldier._fbx && soldier._fbx.holder) || null;
  }
  function conceal(entry, soldier) {
    var holder = originalVisual(soldier);
    if (!holder || holder.isDisposed()) return;
    if (!entry.hidden.has(soldier)) entry.hidden.set(soldier, { holder: holder, active: holder.isEnabled() });
    holder.setEnabled(false);
  }
  function reveal(entry) {
    entry.hidden.forEach(function (value) {
      if (value.holder && !value.holder.isDisposed()) value.holder.setEnabled(value.active);
    });
    entry.hidden.clear();
  }
  function disposeRiders(entry) {
    entry.token++;
    entry.riders.forEach(function (r) {
      if (r.group) {
        try {
          r.group.stop();
          r.group.dispose();
        } catch (_) {}
      }
      disposeImport(r.result);
      if (r.anchor && !r.anchor.isDisposed()) r.anchor.dispose(false, false);
    });
    entry.riders = [];
    entry.busy = false;
    entry.nextRider = 0;
    reveal(entry);
  }
  function removeEntry(entry) {
    disposeRiders(entry);
    if (entry.root && !entry.root.isDisposed()) entry.root.dispose(false, false);
    entry.root = null;
    entry.visual = null;
  }
  function reset(sim) {
    var st = stateFor(sim);
    st.generation++;
    st.trucks.forEach(removeEntry);
    st.trucks.clear();
    if (st.source) {
      if (!st.source.template.isDisposed()) st.source.template.dispose(false, false);
      disposeImport(st.source.result);
    }
    st.source = null;
    st.pending = null;
    st.errors = [];
  }
  function canonTarget(name) {
    // FBX imports can prefix the same Mixamo bone with namespaces or
    // transform-helper suffixes. Canonical names are a fallback to exact names.
    return String(name || '')
      .split(/[|:]/)
      .pop()
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase()
      .replace(/^mixamorig/, '');
  }
  function targetsFor(result) {
    var targets = new Map(),
      normalized = new Map();
    function add(target) {
      if (!target || !target.name) return;
      targets.set(target.name, target);
      var key = canonTarget(target.name);
      if (key && !normalized.has(key)) normalized.set(key, target);
    }
    (result.meshes || []).forEach(function (mesh) {
      add(mesh);
      if (mesh.skeleton) mesh.skeleton.bones.forEach(add);
    });
    (result.transformNodes || []).forEach(add);
    return {
      get: function (name) {
        return targets.get(name) || normalized.get(canonTarget(name)) || null;
      },
      size: targets.size
    };
  }
  async function loadRider(sim, st, entry, member, token) {
    var scene = sim.scene,
      result = null,
      anchor = null,
      groups = [],
      stage = 'fetch soldier FBX';
    try {
      var file = await fetchAsset('soldiers', SOLDIER[entry.faction]);
      if (token !== entry.token || entry.phase !== 'embarked') return;
      stage = 'import soldier FBX';
      result = await BABYLON.SceneLoader.ImportMeshAsync('', 'file:', file, scene, undefined, '.fbx');
      if (token !== entry.token || entry.phase !== 'embarked') {
        disposeImport(result);
        return;
      }
      stage = 'create seat anchor';
      anchor = new BABYLON.TransformNode('truckSeat-' + entry.id + '-' + member.index, scene);
      anchor.parent = entry.root;
      anchor.position.set.apply(anchor.position, member.seat.position);
      anchor.rotation.y = (member.seat.yaw * Math.PI) / 180;
      var body = new BABYLON.TransformNode('truckPassenger-' + entry.id + '-' + member.index, scene);
      body.parent = anchor;
      // Measure the freshly imported FBX while it is still at its own
      // unparented origin. Measuring after parenting to a truck at x=±1700m
      // would bake battlefield coordinates into the seat's local offset and
      // send the rider thousands of metres away from the vehicle.
      var mesh = (result.meshes || []).filter(function (m) {
        return m.getTotalVertices && m.getTotalVertices() > 0;
      });
      stage = 'measure and normalize soldier';
      var b = bounds(mesh);
      if (!b) throw new Error('empty soldier FBX');
      mesh.forEach(function (m) {
        m.isPickable = false;
        m.checkCollisions = false;
      });
      var k = 1.8 / Math.max(0.1, b.height);
      body.scaling.setAll(k);
      body.position.set(-(b.low.x + b.high.x) * 0.5 * k, -b.low.y * k, -(b.low.z + b.high.z) * 0.5 * k);
      attachImport(result, body);
      var targets = targetsFor(result);
      var mappedTargets = 0,
        unmappedTargets = [];
      stage = 'fetch Truck animation';
      var clipFile = await fetchAsset('animations', member.seat.clip);
      if (token !== entry.token || entry.phase !== 'embarked') {
        disposeImport(result);
        anchor.dispose(false, false);
        return;
      }
      // SceneLoader inserts groups into a shared scene array. Serialize imports
      // across ALL trucks: otherwise simultaneous US/GE imports could attach
      // another rider's animation group to this soldier.
      stage = 'import and retarget Truck animation';
      var previous = st.animationQueue || Promise.resolve();
      var importTask = previous
        .catch(function () {})
        .then(async function () {
          if (token !== entry.token || entry.phase !== 'embarked') return [];
          var before = new Set(scene.animationGroups);
          await BABYLON.SceneLoader.ImportAnimationsAsync(
            'file:',
            clipFile,
            scene,
            false,
            BABYLON.SceneLoaderAnimationGroupLoadingMode.NoSync,
            function (target) {
              var resolved = targets.get(target && target.name);
              if (resolved) mappedTargets++;
              else if (unmappedTargets.length < 8)
                unmappedTargets.push((target && target.name) || '(unknown)');
              return resolved;
            }
          );
          return scene.animationGroups.filter(function (g) {
            return !before.has(g);
          });
        });
      st.animationQueue = importTask.catch(function () {});
      groups = await importTask;
      // Babylon does not tolerate targetedAnimations entries whose target is null:
      // Animation._preparePath reads target.position and crashes on group.start.
      // Drop only unresolved tracks; never synthesize substitute bone transforms.
      groups.forEach(function (group) {
        var tracks = group.targetedAnimations || [];
        for (var i = tracks.length - 1; i >= 0; i--) {
          if (!tracks[i] || !tracks[i].target) tracks.splice(i, 1);
        }
      });
      var playable = groups.find(function (g) {
        return g.targetedAnimations && g.targetedAnimations.length > 0;
      });
      groups
        .filter(function (g) {
          return g !== playable;
        })
        .forEach(function (g) {
          g.dispose();
        });
      if (!playable)
        throw new Error(
          'No compatible Truck animation targets for ' +
            SOLDIER[entry.faction] +
            ' (rig nodes=' +
            targets.size +
            ', matched=' +
            mappedTargets +
            ', missing examples=' +
            unmappedTargets.join(', ') +
            ')'
        );
      if (token !== entry.token || entry.phase !== 'embarked') {
        if (playable) playable.dispose();
        disposeImport(result);
        anchor.dispose(false, false);
        return;
      }
      playable.start(true);
      entry.riders.push({ result: result, anchor: anchor, group: playable, soldier: member.soldier });
      if (!entry.showcase) conceal(entry, member.soldier);
    } catch (err) {
      if (groups.length)
        groups.forEach(function (g) {
          try {
            g.dispose();
          } catch (_) {}
        });
      if (result) disposeImport(result);
      if (anchor && !anchor.isDisposed()) anchor.dispose(false, false);
      recordError(st, 'seat ' + member.index + ' ' + entry.faction + ' [' + stage + ']', err);
    }
  }
  function updateRiders(sim, st, entry, transport) {
    if (transport.phase !== 'embarked') {
      if (entry.riders.length || entry.busy) disposeRiders(entry);
      return;
    }
    if (!cameraNear(sim.scene, entry, RENDER_CREW_RADIUS)) {
      if (entry.riders.length && !cameraNear(sim.scene, entry, DROP_CREW_RADIUS)) disposeRiders(entry);
      return;
    }
    if (
      entry.busy ||
      entry.nextRider >= entry.members.length ||
      st.errors.some(function (e) {
        return e.indexOf('seat ') === 0;
      })
    )
      return;
    var member = entry.members[entry.nextRider++];
    var token = entry.token;
    entry.busy = true;
    loadRider(sim, st, entry, member, token).finally(function () {
      if (token === entry.token) entry.busy = false;
    });
  }
  function step(sim) {
    if (!enabled(sim) || !root.BABYLON || !BABYLON.SceneLoader || !sim || !sim.scene) return;
    var st = stateFor(sim),
      active = new Set();
    ['us', 'ge'].forEach(function (faction) {
      ((sim.factions[faction] && sim.factions[faction].squads) || []).forEach(function (sq) {
        var t = sq._transport;
        if (!t) return;
        var key = faction + '/' + sq.id;
        active.add(key);
        var entry = st.trucks.get(key);
        if (!entry) {
          entry = {
            id: sq.id,
            faction: faction,
            root: null,
            visual: null,
            phase: t.phase,
            members: seatsFor(sq),
            riders: [],
            nextRider: 0,
            busy: false,
            token: 0,
            hidden: new Map(),
            finishedAt: null
          };
          st.trucks.set(key, entry);
        }
        if (t.phase !== 'boarding' && t.phase !== 'embarked') {
          if (entry.finishedAt == null) entry.finishedAt = sim.time;
          if (entry.riders.length || entry.busy) disposeRiders(entry);
        }
        if (st.source && !entry.root) {
          try {
            instantiateTruck(sim, st, entry);
          } catch (err) {
            recordError(st, 'instantiate ' + key, err);
          }
        }
        if (entry.root) {
          updateVehiclePose(sim, entry, t);
          if (t.phase === 'embarked' || t.phase === 'boarding') updateRiders(sim, st, entry, t);
        }
      });
    });
    // Optional spectator showroom: one stationary model per faction at its
    // base. No transport authorization, AI actor or combat unit is created.
    // This makes the shared truck testable before the first real Macro grant.
    if (/(?:^|[?&])truckShowcase=1(?:&|$)/.test((root.location && root.location.search) || '')) {
      var scenario = sim.scene.metadata && sim.scene.metadata.battleScenario;
      ['us', 'ge'].forEach(function (faction) {
        var bases =
          scenario &&
          scenario.spawnZones &&
          scenario.spawnZones[faction] &&
          scenario.spawnZones[faction].bases;
        var sq = sim.factions[faction] && sim.factions[faction].squads && sim.factions[faction].squads[0];
        if (!bases || !bases[0] || !sq) return;
        var key = 'showcase/' + faction,
          base = bases[0],
          entry = st.trucks.get(key);
        var t = {
          phase: 'embarked',
          position: { x: +base.x + 12, z: +base.z + (faction === 'us' ? 16 : -16) },
          heading: { x: 0, z: faction === 'us' ? 1 : -1 }
        };
        active.add(key);
        if (!entry) {
          entry = {
            id: key,
            faction: faction,
            root: null,
            visual: null,
            phase: t.phase,
            members: seatsFor(sq),
            riders: [],
            nextRider: 0,
            busy: false,
            token: 0,
            hidden: new Map(),
            finishedAt: null,
            showcase: true
          };
          st.trucks.set(key, entry);
        }
        if (st.source && !entry.root) {
          try {
            instantiateTruck(sim, st, entry);
          } catch (err) {
            recordError(st, 'showcase ' + key, err);
          }
        }
        if (entry.root) {
          updateVehiclePose(sim, entry, t);
          updateRiders(sim, st, entry, t);
        }
      });
    }
    if (
      active.size &&
      !st.source &&
      !st.pending &&
      !st.errors.some(function (e) {
        return e.indexOf('truck FBX:') === 0;
      })
    )
      loadTruckSource(sim, st);
    st.trucks.forEach(function (entry, key) {
      if (entry.phase === 'embarked')
        entry.hidden.forEach(function (value) {
          if (value.holder && !value.holder.isDisposed()) value.holder.setEnabled(false);
        });
      if (!active.has(key)) {
        removeEntry(entry);
        st.trucks.delete(key);
      }
    });
  }
  root.BattleModules.registerSystem('strategic-truck-visual', {
    version: '0.1-shared-truck',
    onBattleStart: reset,
    onBattleRestart: reset,
    onSimulationStep: step
  });
  root.BattleTransportVehicleVisual = {
    version: '0.1-shared-truck',
    vehicleForFaction: function (faction) {
      return faction === 'us' || faction === 'ge' ? MODEL : null;
    },
    soldierModelForFaction: function (faction) {
      return SOLDIER[faction] || null;
    },
    seats: function () {
      return SEATS.map(function (s) {
        return {
          name: s.name,
          role: s.role,
          position: s.position.slice(),
          yaw: s.yaw,
          occupied: s.occupied,
          clip: s.clip
        };
      });
    },
    assignmentCount: function (squad) {
      return seatsFor(squad).length;
    },
    enabled: enabled,
    summary: function (sim) {
      var st = stateFor(sim);
      return Array.from(st.trucks.values()).map(function (entry) {
        return {
          faction: entry.faction,
          squad: entry.id,
          phase: entry.phase,
          model: MODEL,
          seats: entry.members.length,
          renderedRiders: entry.riders.length,
          meshReady: !!entry.root,
          errors: st.errors.slice(0, 8)
        };
      });
    }
  };
  if (typeof root.GTLog === 'function')
    root.GTLog('[STRATEGIC] 5km shared German truck visual enabled with ten-seat calibration');
})(typeof window !== 'undefined' ? window : globalThis);
