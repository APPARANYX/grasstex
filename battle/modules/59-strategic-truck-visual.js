/* Opt-in 5 km troop-truck presentation. No movement, collision, knowledge,
   fire, path, transport scheduling or soldier positions are written here.
   Both factions temporarily share german_transport.fbx; seated riders use
   their OWN faction's FBX model and the supplied 10-seat calibration. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleTransportVehicleVisual) return;
  var MODEL = 'german_transport.fbx';
  // Actual squad members already have role-specific FBX rigs and equipment.
  // The truck never imports its own soldier model or creates a second unit.
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
  var TRUCK_LENGTH = 6.2;
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
  function clipFor(soldier, seat) {
    return root.BattleFbxSoldier && root.BattleFbxSoldier.vehiclePoseClip
      ? root.BattleFbxSoldier.vehiclePoseClip(soldier, seat.clip)
      : null;
  }
  function copyTransform(node) {
    return {
      parent: node.parent,
      position: node.position.clone(),
      rotation: node.rotation.clone(),
      quaternion: node.rotationQuaternion ? node.rotationQuaternion.clone() : null,
      scaling: node.scaling.clone()
    };
  }
  function restoreTransform(node, snapshot) {
    if (!node || node.isDisposed() || !snapshot) return;
    node.parent = snapshot.parent;
    node.position.copyFrom(snapshot.position);
    node.rotation.copyFrom(snapshot.rotation);
    if (snapshot.quaternion) {
      if (!node.rotationQuaternion) node.rotationQuaternion = snapshot.quaternion.clone();
      else node.rotationQuaternion.copyFrom(snapshot.quaternion);
    } else node.rotationQuaternion = null;
    node.scaling.copyFrom(snapshot.scaling);
  }
  var mixer = root.BattleFbxClipMixer && root.BattleFbxClipMixer.create(30);
  function seatedPose(fx, presentation) {
    var clip = presentation.clip,
      layer = presentation.layer;
    // Start beyond the FBX's initial neutral/rest frame, so the first seated
    // render never exposes a T-pose or a standing-to-sitting tween.
    layer.entries[0].t =
      clip.duration > 0
        ? (((presentation.sim.time - presentation.boardedAt + presentation.phaseOffset) % clip.duration) +
            clip.duration) %
          clip.duration
        : 0;
    var bones = fx.st.animated,
      nodes = fx.nodes,
      q = presentation.q,
      p = presentation.p;
    for (var j = 0; j < bones.length; j++) {
      var i = bones[j],
        node = nodes[i];
      if (!node || !clip.channels[i]) continue;
      var channels = mixer.sampleLayer(layer, i, q, p);
      if (channels) node.rotationQuaternion.copyFrom(q);
      if (channels === 2) node.position.copyFrom(p);
    }
  }
  function attachRealRider(sim, entry, member) {
    var soldier = member.soldier,
      fx = soldier && soldier._fbx,
      clip = clipFor(soldier, member.seat);
    if (!fx || !clip || !fx.holder || fx.holder.isDisposed() || !mixer) return false;
    if (fx._vehicleSeat) return fx._vehicleSeat.vehicleId === entry.id;
    var scene = sim.scene,
      anchor = new BABYLON.TransformNode('truckSeat-' + entry.id + '-' + member.index, scene),
      seat = member.seat;
    anchor.parent = entry.root;
    anchor.position.set.apply(anchor.position, seat.position);
    anchor.rotation.y = (seat.yaw * Math.PI) / 180;
    // The soldier's real actor owns his role-based scale (gunner, engineer,
    // captain etc.). The visual anchor inherits it without moving his root.
    anchor.scaling.copyFrom(soldier.root.scaling);
    var holderSnapshot = copyTransform(fx.holder),
      socketSnapshot = copyTransform(fx.socket);
    var presentation = {
      vehicleId: entry.id,
      seatIndex: member.index,
      seatName: seat.name,
      animation: seat.clip,
      phase: 'embarked',
      soldierId: soldier.id,
      originalModel: fx.lib.file,
      anchor: anchor,
      sim: sim,
      clip: clip,
      boardedAt: sim.time,
      phaseOffset: Math.min(0.35, clip.duration * 0.6),
      q: new BABYLON.Quaternion(),
      p: new BABYLON.Vector3(),
      layer: { entries: [{ clip: clip, t: 0, rate: 1, w: 1 }] },
      holderSnapshot: holderSnapshot,
      socketSnapshot: socketSnapshot
    };
    presentation.applyPose = function (actual) {
      seatedPose(actual, presentation);
    };
    // Set the target pose BEFORE revealing the actual actor inside the truck.
    // No extra FBX models, skeletons, animation groups, or visible tween.
    fx.holder.parent = anchor;
    fx.holder.position.set(0, 0, 0);
    fx.holder.rotation.set(0, 0, 0);
    if (fx.holder.rotationQuaternion) fx.holder.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
    // Keep the same issued rifle/weapon mesh with its real soldier. Park it
    // across his lap while seated rather than leave it at the simulated root.
    fx.socket.parent = anchor;
    fx.socket.position.set(0.08, 0.53, 0.23);
    fx.socket.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(-0.16, 1.48, 0.1);
    fx.socket.scaling.setAll(1);
    fx._vehicleSeat = presentation;
    soldier._vehiclePresentation = presentation;
    seatedPose(fx, presentation);
    fx.poseRef.serial++;
    entry.riders.push({ soldier: soldier, fx: fx, anchor: anchor, presentation: presentation });
    return true;
  }
  function releaseRider(rider) {
    var soldier = rider.soldier,
      fx = rider.fx,
      p = rider.presentation;
    if (fx && fx._vehicleSeat === p) {
      delete fx._vehicleSeat;
      if (soldier && soldier._vehiclePresentation === p) delete soldier._vehiclePresentation;
      restoreTransform(fx.holder, p.holderSnapshot);
      restoreTransform(fx.socket, p.socketSnapshot);
      fx.poseRef.serial++;
    }
    if (rider.anchor && !rider.anchor.isDisposed()) rider.anchor.dispose(false, false);
  }
  function disposeRiders(entry) {
    entry.riders.forEach(releaseRider);
    entry.riders = [];
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
    st.poseReady = false;
    st.poseLoading = null;
    // Only strategic motor-transport scenes incur Truck FBX work. Prewarm the
    // shared vehicle and all four poses during battle setup, not on the first
    // live boarding frame, so first-use GPU/FBX stalls are amortized.
    if (enabled(sim)) {
      prepareSharedSeatPoses(sim, st);
      loadTruckSource(sim, st);
    }
  }
  function prepareSharedSeatPoses(sim, st) {
    if (
      st.poseReady ||
      st.poseLoading ||
      st.errors.some(function (e) {
        return e.indexOf('truck-seat clips:') === 0;
      })
    )
      return;
    var api = root.BattleFbxSoldier;
    if (!api || !api.prepareVehicleClips) return;
    var generation = st.generation;
    st.poseLoading = api
      .prepareVehicleClips(sim.scene)
      .then(function () {
        if (st.generation === generation) st.poseReady = true;
      })
      .catch(function (err) {
        if (st.generation === generation) recordError(st, 'truck-seat clips', err);
      })
      .finally(function () {
        if (st.generation === generation) st.poseLoading = null;
      });
  }
  function updateRiders(sim, st, entry) {
    if (entry.showcase || entry.phase !== 'embarked') {
      if (entry.riders.length) disposeRiders(entry);
      return;
    }
    if (!st.poseReady || !entry.root) return;
    // All of the actual squad's already-loaded meshes snap into their seats
    // in ONE render update. No per-seat FBX loading or staggered emergence.
    entry.members.forEach(function (member) {
      if (
        entry.riders.some(function (r) {
          return r.soldier === member.soldier;
        })
      )
        return;
      if (!attachRealRider(sim, entry, member))
        recordError(st, 'real seat ' + member.index, 'missing live role rig or compatible Truck pose');
    });
  }
  function step(sim) {
    if (!enabled(sim) || !root.BABYLON || !BABYLON.SceneLoader || !sim || !sim.scene) return;
    var st = stateFor(sim),
      active = new Set();
    if (!st.poseReady && !st.poseLoading) prepareSharedSeatPoses(sim, st);
    ['us', 'ge'].forEach(function (faction) {
      ((sim.factions[faction] && sim.factions[faction].squads) || []).forEach(function (sq) {
        var transport = sq._transport;
        if (!transport) return;
        var key = faction + '/' + sq.id;
        active.add(key);
        var entry = st.trucks.get(key);
        if (!entry) {
          entry = {
            id: sq.id,
            faction: faction,
            root: null,
            visual: null,
            phase: transport.phase,
            members: seatsFor(sq),
            riders: [],
            finishedAt: null,
            showcase: false
          };
          st.trucks.set(key, entry);
        }
        if (transport.phase !== 'boarding' && transport.phase !== 'embarked') {
          if (entry.finishedAt == null) entry.finishedAt = sim.time;
          disposeRiders(entry);
        }
        if (st.source && !entry.root) {
          try {
            instantiateTruck(sim, st, entry);
          } catch (err) {
            recordError(st, 'instantiate ' + key, err);
          }
        }
        if (entry.root) {
          updateVehiclePose(sim, entry, transport);
          updateRiders(sim, st, entry);
        }
      });
    });
    // The showcase is a parked, EMPTY display vehicle. It deliberately
    // does not borrow a live combat soldier from a different squad/location.
    if (/(?:^|[?&])truckShowcase=1(?:&|$)/.test((root.location && root.location.search) || '')) {
      var scenario = sim.scene.metadata && sim.scene.metadata.battleScenario;
      ['us', 'ge'].forEach(function (faction) {
        var bases =
          scenario &&
          scenario.spawnZones &&
          scenario.spawnZones[faction] &&
          scenario.spawnZones[faction].bases;
        if (!bases || !bases[0]) return;
        var key = 'showcase/' + faction,
          base = bases[0],
          entry = st.trucks.get(key);
        var display = {
          phase: 'showcase',
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
            phase: display.phase,
            members: [],
            riders: [],
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
        if (entry.root) updateVehiclePose(sim, entry, display);
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
      if (!active.has(key)) {
        removeEntry(entry);
        st.trucks.delete(key);
      }
    });
  }
  root.BattleModules.registerSystem('strategic-truck-visual', {
    version: '0.2-live-squad-crew',
    onBattleStart: reset,
    onBattleRestart: reset,
    onSimulationStep: step
  });
  root.BattleTransportVehicleVisual = {
    version: '0.2-live-squad-crew',
    vehicleForFaction: function (faction) {
      return faction === 'us' || faction === 'ge' ? MODEL : null;
    },
    soldierModelForFaction: function (faction) {
      var models = root.BattleFbxSoldier && root.BattleFbxSoldier.models;
      return models && models[faction] ? models[faction].default : null;
    },
    modelForSoldier: function (soldier) {
      return soldier && soldier._fbx && soldier._fbx.lib ? soldier._fbx.lib.file : null;
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
    seatForSoldier: function (soldier) {
      var p = soldier && soldier._vehiclePresentation;
      return p
        ? {
            vehicleId: p.vehicleId,
            seatIndex: p.seatIndex,
            seatName: p.seatName,
            animation: p.animation,
            model: p.originalModel,
            phase: p.phase
          }
        : null;
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
          showcase: !!entry.showcase,
          seats: entry.members.length,
          renderedRiders: entry.riders.length,
          liveModels: entry.riders.map(function (r) {
            return r.fx.lib.file;
          }),
          riderIds: entry.riders.map(function (r) {
            return r.soldier.id;
          }),
          meshReady: !!entry.root,
          posesReady: !!st.poseReady,
          errors: st.errors.slice(0, 8)
        };
      });
    }
  };
  if (typeof root.GTLog === 'function')
    root.GTLog('[STRATEGIC] real squad soldiers and prewarmed Truck poses in 5km transport');
})(typeof window !== 'undefined' ? window : globalThis);
