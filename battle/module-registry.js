/* Battle Sim v19 extension registry.
   New units/objectives/systems register here instead of hard-coding themselves into the
   commander or operator UI. Files under battle/modules/ are discovered and loaded by PHP. */
(function (root) {
  'use strict';

  var registries = {
    unitTypes: Object.create(null),
    objectiveTypes: Object.create(null),
    systems: Object.create(null),
    tacticalSymbols: Object.create(null),
    tacticalOverlayProviders: Object.create(null)
  };

  function assertId(id) {
    id = String(id || '').trim();
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(id)) throw new Error('Invalid battle module id: ' + id);
    return id;
  }
  function register(kind, id, spec) {
    id = assertId(id);
    spec = spec || {};
    if (registries[kind][id]) throw new Error('Battle module already registered: ' + kind + '/' + id);
    spec.id = id;
    registries[kind][id] = spec;
    root.GTLog('[MODULE] registered ' + kind + '/' + id + (spec.version ? ' v' + spec.version : ''));
    return spec;
  }
  function list(kind) {
    return Object.keys(registries[kind])
      .sort()
      .map(function (id) {
        return registries[kind][id];
      });
  }
  function get(kind, id) {
    return registries[kind][id] || null;
  }

  function registerUnitType(id, spec) {
    return register('unitTypes', id, spec);
  }
  function registerObjectiveType(id, spec) {
    return register('objectiveTypes', id, spec);
  }
  function registerSystem(id, spec) {
    return register('systems', id, spec);
  }
  function registerTacticalSymbol(id, spec) {
    return register('tacticalSymbols', id, spec);
  }
  function registerTacticalOverlayProvider(id, spec) {
    return register('tacticalOverlayProviders', id, spec);
  }

  function addUnit(sim, unit, meta) {
    if (!sim || !unit) return unit;
    sim._moduleUnits = sim._moduleUnits || [];
    /* Use a Set for O(1) membership test instead of indexOf's O(n). The
       _moduleUnitSet is the authoritative lookup; _moduleUnits stays as
       the ordered array for unitsFor() iteration. */
    if (!sim._moduleUnitSet) {
      sim._moduleUnitSet = new Set(sim._moduleUnits);
    }
    if (!sim._moduleUnitSet.has(unit)) {
      sim._moduleUnitSet.add(unit);
      sim._moduleUnits.push(unit);
    }
    unit.unitType = unit.unitType || (meta && meta.unitType) || 'unknown';
    if (unit.captureWeight == null)
      unit.captureWeight = meta && meta.captureWeight != null ? +meta.captureWeight : 1;
    return unit;
  }
  function unitsFor(sim) {
    /* Use a Set for O(1) dedup instead of indexOf's O(n) per check.
       With 100+ units the old version did 10,000+ comparisons per call;
       this version does 100 Set.has() calls. */
    var out = [],
      seen = new Set();
    function push(u) {
      if (!u || seen.has(u)) return;
      seen.add(u);
      out.push(u);
    }
    if (sim && sim._roster) {
      (sim._roster.us || []).forEach(push);
      (sim._roster.ge || []).forEach(push);
    }
    if (sim && sim._moduleUnits) (sim._moduleUnits || []).forEach(push);
    return out;
  }
  function nextEntityId(sim) {
    var max = -1;
    unitsFor(sim).forEach(function (u) {
      var n = +u.id;
      if (isFinite(n)) max = Math.max(max, n);
    });
    return max + 1;
  }
  function spawnUnitType(id, sim, faction, opts) {
    var spec = get('unitTypes', id);
    if (!spec || typeof spec.spawn !== 'function') throw new Error('Unit module cannot spawn: ' + id);
    var result = spec.spawn(sim, faction, opts || {});
    if (root.BattleTelemetry)
      root.BattleTelemetry.record(
        'module-spawn',
        { unitType: id, faction: faction, label: spec.label || id },
        sim
      );
    return result;
  }

  /* Cached sorted system list. Systems are registered once at module load,
     so the cache is stable for the page lifetime. Invalidated if a new system
     is registered after the first runHook call (rare, but handled). */
  var systemsCache = null,
    systemsCacheCount = -1;
  function systemsList() {
    var reg = registries.systems;
    var keys = Object.keys(reg);
    if (systemsCache && keys.length === systemsCacheCount) return systemsCache;
    systemsCache = keys.sort().map(function (id) {
      return reg[id];
    });
    systemsCacheCount = keys.length;
    return systemsCache;
  }
  function runHook(name, sim, payload) {
    systemsList().forEach(function (system) {
      var fn = system && system[name];
      if (typeof fn === 'function') {
        try {
          fn(sim, payload || {});
        } catch (e) {
          console.error('[MODULE] ' + system.id + '.' + name + ' failed', e);
        }
      }
    });
  }

  root.BattleModules = {
    registerUnitType: registerUnitType,
    registerObjectiveType: registerObjectiveType,
    registerSystem: registerSystem,
    registerTacticalSymbol: registerTacticalSymbol,
    registerTacticalOverlayProvider: registerTacticalOverlayProvider,
    getUnitType: function (id) {
      return get('unitTypes', id);
    },
    getObjectiveType: function (id) {
      return get('objectiveTypes', id);
    },
    getSystem: function (id) {
      return get('systems', id);
    },
    getTacticalSymbol: function (id) {
      return get('tacticalSymbols', id);
    },
    getTacticalOverlayProvider: function (id) {
      return get('tacticalOverlayProviders', id);
    },
    listUnitTypes: function () {
      return list('unitTypes');
    },
    listSystems: function () {
      return list('systems');
    },
    listTacticalSymbols: function () {
      return list('tacticalSymbols');
    },
    listTacticalOverlayProviders: function () {
      return list('tacticalOverlayProviders');
    },
    addUnit: addUnit,
    unitsFor: unitsFor,
    nextEntityId: nextEntityId,
    spawnUnitType: spawnUnitType,
    runHook: runHook
  };
  root.GTLog('[MODULE] registry v20 loaded');
})(typeof window !== 'undefined' ? window : globalThis);
