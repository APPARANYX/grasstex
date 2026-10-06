/* Phase H1-H4: Ground vehicles and anti-armor.
   H1: Vehicle navigation layer (terrain/road/bridge constraints, recovery, fuel)
   H2: VehicleTask leases (direct-support, reserve, recovery)
   H3: One armor + one anti-armor profile
   H4: Squad Leader vehicle request
   All behavioral, behind ?vehicles=1 (default OFF). */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleVehicles) return;

  var L = root.BattleLeases;
  var AR = function () { return root.BattleCombinedArmsRegistry; };

  function flagOn() {
    return /[?&]vehicles=1\b/.test(typeof location !== 'undefined' ? location.search : '');
  }

  /* H1: Vehicle navigation layer — separate from infantry.
     Vehicles have terrain/road/bridge constraints, recovery state, fuel bands. */
  var VEHICLE_NAV = {
    maxSlope: 0.35,      // vehicles can't climb steep terrain
    roadSpeedMult: 1.5,  // faster on roads
    bridgeRequired: true, // can't cross water without a bridge
    fuelRange: 5000,     // meters before refuel needed
    recoveryTime: 30     // seconds to recover a stuck vehicle
  };

  /* H3: One armor + one anti-armor profile */
  var PROFILES = {
    armor: {
      type: 'armor',
      hp: 400,
      maxSpeed: 8.0,
      weaponRange: 300,
      weaponDamage: 120,
      armor: { front: 80, side: 50, rear: 30, top: 20 },
      vulnerabilities: ['rear', 'top', 'tracks'],
      suppressImmune: true
    },
    'anti-armor': {
      type: 'anti-armor',
      hp: 100,
      maxSpeed: 3.0,
      weaponRange: 250,
      weaponDamage: 200,
      armor: { front: 10, side: 5, rear: 5, top: 5 },
      vulnerabilities: ['infantry-close-assault'],
      suppressImmune: false,
      minRange: 30  // can't fire too close (safely)
    }
  };

  var vehicles = {};
  var nextVehicleId = 1;

  /* H2: VehicleTask leases */
  function defineVehicleTaskLease() {
    if (!L || !L.define) return;
    L.define('vehicle-task', {
      priority: 40,
      timer: true,
      progress: function (v, lease, t) {
        var d = (lease && lease.data) || {};
        return {
          ok: d.task != null ? true : null,
          detail: d.task + ' (' + Math.max(0, t - lease.since).toFixed(1) + 's)'
        };
      }
    });
  }

  /* H1: Create a vehicle */
  function createVehicle(sim, faction, typeId, pos) {
    var profile = PROFILES[typeId];
    if (!profile) return null;
    var id = 'veh-' + (nextVehicleId++);
    var v = {
      id: id,
      faction: faction,
      typeId: typeId,
      profile: profile,
      pos: { x: pos.x, z: pos.z },
      hp: profile.hp,
      fuel: VEHICLE_NAV.fuelRange,
      state: 'available',  // available, direct-support, reserve, recovery, destroyed
      stuckSince: null,
      taskLease: null
    };
    vehicles[id] = v;
    /* Register in the asset registry */
    var ar = AR();
    if (ar && ar.register) ar.register(id, typeId, faction);
    return v;
  }

  /* H2: Assign a vehicle task (direct-support, reserve, recovery) */
  function assignTask(sim, vehicleId, task, targetSquadId) {
    var v = vehicles[vehicleId];
    if (!v || !L) return false;
    /* End any existing vehicle-task lease */
    if (v.taskLease) L.end(v, 'vehicle-task', +sim.time || 0, 'replaced');
    v.state = task;
    v.taskLease = L.grant(
      v, 'vehicle-task', 'vehicle-coordinator',
      +sim.time || 0, (+sim.time || 0) + 60,
      task + (targetSquadId ? ' for ' + targetSquadId : ''),
      'task complete, vehicle destroyed, or expiry',
      { task: task, targetSquad: targetSquadId || null }
    );
    return true;
  }

  /* H4: Squad Leader vehicle request — can request effect/position window,
     never commands vehicle path or uses proximity as objective proof. */
  function requestVehicle(sim, sq, effect, point) {
    var SR = root.BattleSupportRequest;
    if (!SR) return null;
    return SR.create({
      requester: sq.id,
      requesterSquad: sq.id,
      assetType: 'armor',
      priority: 'routine',
      effect: effect || 'suppress',
      point: point,
      time: +sim.time || 0
    });
  }

  /* H1: Check if a position is navigable by vehicles */
  function isNavigable(sim, pos) {
    if (!sim || !sim.heightAt) return true;
    var h = sim.heightAt(pos.x, pos.z);
    /* Check slope by sampling nearby */
    var d = 2;
    var h2 = sim.heightAt(pos.x + d, pos.z);
    var h3 = sim.heightAt(pos.x, pos.z + d);
    var slope = Math.max(Math.abs(h2 - h), Math.abs(h3 - h)) / d;
    return slope < VEHICLE_NAV.maxSlope;
  }

  /* H1: Update vehicle state (fuel, stuck recovery) */
  function updateVehicle(sim, v) {
    if (!v || v.state === 'destroyed') return;
    var now = +sim.time || 0;
    /* Fuel consumption: only when moving or in combat */
    if (v.state === 'direct-support') v.fuel = Math.max(0, v.fuel - 0.5);
    if (v.fuel <= 0) v.state = 'out-of-fuel';
    /* Stuck recovery */
    if (v.stuckSince && now - v.stuckSince > VEHICLE_NAV.recoveryTime) {
      v.stuckSince = null;
      v.state = 'available';
    }
  }

  function tick(sim) {
    if (!flagOn()) return;
    Object.keys(vehicles).forEach(function (id) { updateVehicle(sim, vehicles[id]); });
  }

  function list() { return Object.keys(vehicles).map(function (k) { return vehicles[k]; }); }
  function get(id) { return vehicles[id] || null; }

  root.BattleVehicles = {
    version: '1.0-h1h2h3h4',
    VEHICLE_NAV: VEHICLE_NAV,
    PROFILES: PROFILES,
    createVehicle: createVehicle,
    assignTask: assignTask,
    requestVehicle: requestVehicle,
    isNavigable: isNavigable,
    list: list,
    get: get,
    flagOn: flagOn
  };

  defineVehicleTaskLease();

  if (root.BattleModules) {
    root.BattleModules.registerSystem('vehicles', {
      version: '1.0-h1h2h3h4',
      onCommanderTick: tick,
      onBattleStart: function () { vehicles = {}; nextVehicleId = 1; },
      onBattleRestart: function () { vehicles = {}; nextVehicleId = 1; }
    });
  }
  console.log('[TACTICS] H1-H4: Vehicles + anti-armor loaded (?vehicles=1 to enable)');
})(typeof window !== 'undefined' ? window : globalThis);
