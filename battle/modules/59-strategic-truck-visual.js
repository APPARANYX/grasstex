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
  /* Phone memory and draw calls (owner's iPhone reloads after a few minutes): the truck FBX is 191
     meshes with 138 materials and 136 textures, and a full clone per truck made 12 x 191 draws.
     Light trucks (default; ?truckLite=0 restores full clones):
     - every truck is an instance of the one imported model, so each of its meshes is one draw for
       the whole fleet, not one per truck;
     - on a phone (coarse primary pointer) its textures are capped at TRUCK_TEXTURE_PHONE px
       (?truckTex=<px> sets the cap, 2048 keeps them full size), like the soldiers' ?soldierTex=;
     - a truck model too far from the camera to cover MIN_TRUCK_PIXELS on screen is not drawn
       (its riders and the vehicle itself are untouched).
     Presentation only: no movement, transport, sight or fire reads any of it. */
  var MIN_TRUCK_PIXELS = 3,
    TRUCK_TEXTURE_PHONE = 256;
  var TEXTURE_SLOTS = [
    'diffuseTexture',
    'albedoTexture',
    'bumpTexture',
    'emissiveTexture',
    'opacityTexture',
    'specularTexture',
    'ambientTexture',
    'metallicTexture',
    'reflectivityTexture',
    'lightmapTexture'
  ];
  function liteOn() {
    return !/(?:^|[?&])truckLite=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  function textureCap() {
    if (!liteOn()) return 0;
    var q = /[?&]truckTex=(\d+)/.exec((root.location && root.location.search) || '');
    if (q) return +q[1] >= 2048 ? 0 : Math.max(32, +q[1]);
    return root.matchMedia && root.matchMedia('(pointer:coarse)').matches ? TRUCK_TEXTURE_PHONE : 0;
  }
  /* A resized copy replaces each oversized texture once it is ready, as the soldiers' textures do
     (53-fbx-soldier-backend.js shrinkSoldierTexture); the original is then freed. */
  function shrinkTextures(meshes, cap) {
    var TT = root.BABYLON && BABYLON.TextureTools,
      done = new Set();
    if (!cap || !TT || !TT.CreateResizedCopy) return;
    meshes.forEach(function (mesh) {
      var mat = mesh.material;
      if (!mat || done.has(mat)) return;
      done.add(mat);
      TEXTURE_SLOTS.forEach(function (slot) {
        var t = mat[slot];
        if (!t || typeof t.getSize !== 'function' || t.isCube) return;
        function go() {
          var size = t.getSize(),
            k = Math.min(1, cap / Math.max(size.width, size.height));
          if (!(k < 1) || mat[slot] !== t) return;
          var copy;
          try {
            copy = TT.CreateResizedCopy(t, Math.round(size.width * k), Math.round(size.height * k), true);
          } catch (e) {
            return;
          }
          copy.name = t.name + '@' + Math.round(size.width * k);
          copy.gammaSpace = t.gammaSpace;
          copy.hasAlpha = t.hasAlpha;
          copy.wrapU = t.wrapU;
          copy.wrapV = t.wrapV;
          copy.coordinatesIndex = t.coordinatesIndex;
          var scene = t.getScene(),
            obs = scene.onBeforeRenderObservable.add(function () {
              var it = copy.getInternalTexture();
              if (!it || !it.isReady) return;
              scene.onBeforeRenderObservable.remove(obs);
              if (mat[slot] !== t) {
                copy.dispose();
                return;
              }
              mat[slot] = copy;
              t.dispose();
            });
        }
        if (t.isReady()) go();
        else if (t.onLoadObservable) t.onLoadObservable.addOnce(go);
      });
    });
  }
  /* Farthest distance at which the truck still covers MIN_TRUCK_PIXELS of the render height. */
  function drawDistance(scene) {
    var camera = scene.activeCamera,
      engine = scene.getEngine && scene.getEngine(),
      height = engine && engine.getRenderHeight ? engine.getRenderHeight() : 0,
      fov = camera && camera.fov;
    if (!camera || !height || !(fov > 0) || camera.mode === 1) return Infinity;
    return (TRUCK_LENGTH * height) / (2 * Math.tan(fov / 2) * MIN_TRUCK_PIXELS);
  }
  var stores = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var assetFiles = {};
  function enabled(sim) {
    var scenario = sim && sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario;
    var search = (root.location && root.location.search) || '';
    return !!(
      scenario &&
      scenario.profile === 'strategic' &&
      !/(?:^|[?&])strategicInterception=0(?:&|$)/.test(search) &&
      !/(?:^|[?&])motorTransport=0(?:&|$)/.test(search) &&
      !/(?:^|[?&])truckVisual=0(?:&|$)/.test(search)
    );
  }
  function seatsFor(squad) {
    var task = squad && squad._transport,
      live = ((squad && squad.members) || [])
        .filter(function (s) {
          return !s.dead;
        })
        .slice(0, SEATS.length);
    return live.map(function (s, i) {
      var index = task && task.access ? task.seatIds.indexOf(s.id) : i,
        seat =
          task && task.access && index === task.seatIds.length - 1 && index > 0 ? SEATS[9] : SEATS[index];
      return { soldier: s, seat: seat, index: index };
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
        // Meshes remain presentation only. Opt-in physical truck volumes are
        // simulation-owned, independent of asset loading and render distance.
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
        shrinkTextures(renderMeshes, textureCap());
        st.source = { template: template, result: result, count: renderMeshes.length, lite: liteOn() };
        // Every frame, so a paused battle with a moving camera still shows the near trucks.
        if (st.source.lite)
          st.visibility = scene.onBeforeRenderObservable.add(function () {
            showNear(scene, st);
          });
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
  // Wheels are presentation-only, like the truck mesh: this module never
  // changes movement, collision, formation or transport mission decisions.
  // The FBX exporter preserves Blender's FrontWheels / RearWheels groups.
  // A single pivot per axle turns both tyres around the shared axle line.
  function wheelRoots(visual, name) {
    var matches = (visual.getDescendants ? visual.getDescendants(false) : []).filter(function (n) {
      var label = String(n.name || '')
        .split(/[|/]/)
        .pop();
      return (
        label === name ||
        label.indexOf(name + '_') === 0 ||
        label.indexOf(name + '.') === 0 ||
        label.indexOf(name + '(') === 0 ||
        // Babylon prefixes descendants with the clone's full FBX path:
        // strategicTruckModel-us-0.__fbx_root__.FrontWheels.Geom3D.362
        // Collections survived export; only their runtime names changed.
        label.indexOf('.' + name) >= 0
      );
    });
    var named = new Set(matches);
    return matches.filter(function (node) {
      for (var p = node.parent; p; p = p.parent) if (named.has(p)) return false;
      return true;
    });
  }
  function wheelBounds(roots) {
    var meshes = [];
    roots.forEach(function (node) {
      if (node.getTotalVertices && node.getTotalVertices() > 0) meshes.push(node);
      if (node.getChildMeshes)
        node.getChildMeshes(false).forEach(function (mesh) {
          if (mesh.getTotalVertices && mesh.getTotalVertices() > 0 && meshes.indexOf(mesh) < 0)
            meshes.push(mesh);
        });
    });
    return meshes.length ? bounds(meshes) : null;
  }
  function attachAxlePivots(entry) {
    entry.axles = {};
    entry.lastWheelPosition = null;
    if (!entry.root || !entry.visual) return;
    entry.root.computeWorldMatrix(true);
    var inv = entry.root.getWorldMatrix().clone().invert();
    ['front', 'rear'].forEach(function (side) {
      var roots = wheelRoots(entry.visual, side === 'front' ? 'FrontWheels' : 'RearWheels');
      if (!roots.length) return;
      var box = wheelBounds(roots);
      if (!box) return;
      var centerWorld = new BABYLON.Vector3(
        (box.low.x + box.high.x) * 0.5,
        (box.low.y + box.high.y) * 0.5,
        (box.low.z + box.high.z) * 0.5
      );
      var center = BABYLON.Vector3.TransformCoordinates(centerWorld, inv);
      var pivot = new BABYLON.TransformNode('truckAxle-' + side + '-' + entry.id, entry.root.getScene());
      pivot.parent = entry.root;
      pivot.position.copyFrom(center);
      pivot.rotationQuaternion = BABYLON.Quaternion.Identity();
      pivot.computeWorldMatrix(true);
      // setParent preserves the original imported wheel pose, including
      // the truck template's normalization scale and Blender mesh transforms.
      roots.forEach(function (node) {
        node.setParent(pivot);
      });
      var radius = Math.max(0.25, Math.min(0.95, Math.min(box.height, box.depth) * 0.5));
      entry.axles[side] = {
        pivot: pivot,
        roots: roots,
        axis: 'x',
        radius: radius,
        angle: 0,
        center: [center.x, center.y, center.z]
      };
    });
  }
  function spinAxles(entry, transport, position) {
    if (!entry.axles) return;
    // Initial placement, restart and teleport never introduce an arbitrary
    // rotation; only measured carrier translation counts as driving.
    var prev = entry.lastWheelPosition;
    entry.lastWheelPosition = { x: position.x, z: position.z };
    if (!prev || transport.phase !== 'embarked') return;
    var dx = position.x - prev.x,
      dz = position.z - prev.z;
    var traveled = Math.hypot(dx, dz);
    if (!isFinite(traveled) || traveled < 0.00001 || traveled > 30) return;
    var h = transport.heading || { x: 0, z: 1 };
    var sign = dx * (+h.x || 0) + dz * (+h.z || 0) < 0 ? -1 : 1;
    ['front', 'rear'].forEach(function (side) {
      var wheel = entry.axles[side];
      if (!wheel || !wheel.pivot || wheel.pivot.isDisposed()) return;
      wheel.angle =
        (((wheel.angle + (sign * traveled) / wheel.radius) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      var vector = wheel.axis === 'z' ? BABYLON.Axis.Z : BABYLON.Axis.X;
      wheel.pivot.rotationQuaternion = BABYLON.Quaternion.RotationAxis(vector, wheel.angle);
    });
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
    spinAxles(entry, transport, p);
    entry.phase = transport.phase;
  }
  function instantiateTruck(sim, st, entry) {
    if (entry.root || entry.pending || !st.source) return;
    var scene = sim.scene,
      rootNode = new BABYLON.TransformNode('strategicTruck-' + entry.faction + '-' + entry.id, scene);
    var clone = st.source.lite
      ? st.source.template.instantiateHierarchy(rootNode, undefined, function (source, made) {
          made.name = source.name;
          if ('isPickable' in made) made.isPickable = false;
        })
      : st.source.template.clone('strategicTruckModel-' + entry.id, rootNode, false);
    if (!clone) {
      rootNode.dispose(false, false);
      throw new Error('could not clone truck FBX');
    }
    if (st.source.lite) {
      clone.name = 'strategicTruckModel-' + entry.id;
      // The copied nodes keep the hidden template's disabled flag; the clone itself decides.
      clone.getDescendants(false).forEach(function (node) {
        node.setEnabled(true);
      });
    }
    clone.setEnabled(true);
    entry.root = rootNode;
    entry.visual = clone;
    attachAxlePivots(entry);
  }
  function showNear(scene, st) {
    var far = drawDistance(scene);
    st.trucks.forEach(function (entry) {
      if (!entry.visual || entry.visual.isDisposed()) return;
      var near = !scene.activeCamera || cameraNear(scene, entry, far);
      if (entry.visual.isEnabled(false) === near) return;
      entry.visual.setEnabled(near);
      Object.keys(entry.axles || {}).forEach(function (side) {
        entry.axles[side].pivot.setEnabled(near);
      });
    });
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
    entry.axles = null;
    entry.lastWheelPosition = null;
  }
  function teardown(sim) {
    // BattleSim.restart disposes the OLD soldier roots before spawning a new
    // roster. Release seats in beforeBattleRestart, otherwise the real soldier
    // FBX holder and weapon socket remain parented to the truck and survive
    // root.dispose(), leaving a pile of floating guns/stray rig meshes.
    var st = stateFor(sim);
    st.generation++;
    st.trucks.forEach(removeEntry);
    st.trucks.clear();
    if (st.source) {
      if (!st.source.template.isDisposed()) st.source.template.dispose(false, false);
      disposeImport(st.source.result);
    }
    if (st.visibility) st.scene.onBeforeRenderObservable.remove(st.visibility);
    st.visibility = null;
    st.source = null;
    st.pending = null;
    st.errors = [];
    st.poseReady = false;
    st.poseLoading = null;
  }
  function reset(sim) {
    teardown(sim);
    // Only strategic motor-transport scenes incur Truck FBX work. Prewarm the
    // shared vehicle and all four poses during battle setup, not on the first
    // live boarding frame, so first-use GPU/FBX stalls are amortized.
    if (enabled(sim)) {
      var st = stateFor(sim);
      prepareSharedSeatPoses(sim, st);
      loadTruckSource(sim, st).then(function () {
        // Parked vehicles materialize as soon as their shared asset is ready,
        // not as a side effect of a mission grant or passenger boarding.
        if (st.scene === sim.scene && enabled(sim)) step(sim);
      });
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
    if (entry.showcase || ['boarding', 'embarked', 'disembarking'].indexOf(entry.phase) < 0) {
      if (entry.riders.length) disposeRiders(entry);
      return;
    }
    if (!st.poseReady || !entry.root) return;
    if (entry.seatedIds) {
      entry.riders = entry.riders.filter(function (rider) {
        if (entry.seatedIds.indexOf(rider.soldier.id) >= 0 && !rider.soldier.dead) return true;
        releaseRider(rider);
        return false;
      });
    }
    // Only the occupants already admitted by the transport controller can
    // switch into their ORIGINAL animated seat rig. Driver first, one seat
    // at a time; no ten-soldier pop-in when the final member is ready.
    entry.members.forEach(function (member) {
      if (
        entry.seatedIds
          ? entry.seatedIds.indexOf(member.soldier.id) < 0
          : entry.phase === 'boarding' && member.index >= entry.boardedCount
      )
        return;
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
      fleet = root.BattleSquadTransport && root.BattleSquadTransport.fleetSummary(sim),
      active = new Set();
    if (!st.poseReady && !st.poseLoading) prepareSharedSeatPoses(sim, st);
    // Every vehicle has a stable base-owned identity, even if no General
    // has ever granted a journey. Occupancy changes; truck identity does not.
    (fleet || []).forEach(function (vehicle) {
      var key = vehicle.id,
        squad = null,
        task = null;
      if (vehicle.squadId && sim.factions && sim.factions[vehicle.faction]) {
        squad = (sim.factions[vehicle.faction].squads || []).find(function (sq) {
          return sq.id === vehicle.squadId;
        });
        task = squad && squad._transport && squad._transport.vehicleId === key ? squad._transport : null;
      }
      active.add(key);
      var entry = st.trucks.get(key);
      if (!entry) {
        entry = {
          id: key,
          faction: vehicle.faction,
          baseId: vehicle.baseId,
          root: null,
          visual: null,
          phase: 'parked',
          members: [],
          riders: [],
          finishedAt: null,
          showcase: false,
          squadId: null
        };
        st.trucks.set(key, entry);
      }
      entry.phase = task ? task.phase : vehicle.phase;
      entry.squadId = task ? squad.id : null;
      entry.members = task ? seatsFor(squad) : [];
      entry.boardedCount = task ? task.boardedCount || 0 : 0;
      entry.seatedIds =
        task && task.access
          ? (task.boardedIds || task.boardingOrder.slice(0, task.boardedCount)).filter(function (id) {
              return (task.exitedIds || []).indexOf(id) < 0;
            })
          : null;
      if (['boarding', 'embarked', 'disembarking'].indexOf(entry.phase) < 0 && entry.riders.length)
        disposeRiders(entry);
      if (st.source && !entry.root) {
        try {
          instantiateTruck(sim, st, entry);
        } catch (err) {
          recordError(st, 'instantiate ' + key, err);
        }
      }
      if (entry.root) {
        updateVehiclePose(sim, entry, task || vehicle);
        updateRiders(sim, st, entry);
      }
    });
    // Preserve scene teardown safety if a later garage system genuinely
    // decommissions a vehicle. Never delete a truck simply because its squad
    // dismounted or received a replacement mission.
    st.trucks.forEach(function (entry, key) {
      if (!active.has(key)) {
        removeEntry(entry);
        st.trucks.delete(key);
      }
    });
    if (
      (fleet || []).length &&
      !st.source &&
      !st.pending &&
      !st.errors.some(function (e) {
        return e.indexOf('truck FBX:') === 0;
      })
    )
      loadTruckSource(sim, st);
  }
  root.BattleModules.registerSystem('strategic-truck-visual', {
    version: '0.3-persistent-depot-fleet',
    onBattleStart: reset,
    beforeBattleRestart: teardown,
    onBattleRestart: reset,
    onSimulationStep: step
  });
  root.BattleTransportVehicleVisual = {
    version: '0.3-persistent-depot-fleet',
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
    lite: { on: liteOn, textureCap: textureCap, drawDistance: drawDistance },
    summary: function (sim) {
      var st = stateFor(sim);
      return Array.from(st.trucks.values()).map(function (entry) {
        return {
          faction: entry.faction,
          squad: entry.squadId,
          vehicleId: entry.id,
          baseId: entry.baseId,
          phase: entry.phase,
          model: MODEL,
          showcase: false,
          parked: entry.phase === 'parked',
          seats: entry.members.length,
          boardedCount: entry.boardedCount || 0,
          renderedRiders: entry.riders.length,
          liveModels: entry.riders.map(function (r) {
            return r.fx.lib.file;
          }),
          riderIds: entry.riders.map(function (r) {
            return r.soldier.id;
          }),
          meshReady: !!entry.root,
          wheels: Object.fromEntries(
            ['front', 'rear'].map(function (side) {
              var axle = entry.axles && entry.axles[side];
              return [
                side,
                axle
                  ? {
                      nodes: axle.roots.length,
                      radius: +axle.radius.toFixed(3),
                      rotation: +axle.angle.toFixed(3),
                      axis: axle.axis,
                      center: axle.center.map(function (n) {
                        return +n.toFixed(3);
                      })
                    }
                  : null
              ];
            })
          ),
          posesReady: !!st.poseReady,
          errors: st.errors.slice(0, 8)
        };
      });
    }
  };
  if (typeof root.GTLog === 'function')
    root.GTLog('[STRATEGIC] persistent base trucks, original crews and prewarmed vehicle poses');
})(typeof window !== 'undefined' ? window : globalThis);
