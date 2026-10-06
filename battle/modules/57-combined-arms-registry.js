/* Phase G1: Asset registry — data-only, no combat effects.
   Registers available assets: vehicle types, fire support, sustainment. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleCombinedArmsRegistry) return;

  var ASSET_TYPES = {
    /* Vehicle types */
    armor: { category: 'vehicle', label: 'Armor', capabilities: ['direct-fire', 'shock', 'mobile-cover'] },
    transport: { category: 'vehicle', label: 'Transport', capabilities: ['troop-carry', 'logistics'] },
    gun: { category: 'vehicle', label: 'Assault Gun', capabilities: ['direct-fire', 'infantry-support'] },
    /* Fire support */
    mortar: { category: 'fires', label: 'Mortar', capabilities: ['suppress', 'illuminate', 'smoke'] },
    artillery: { category: 'fires', label: 'Artillery', capabilities: ['suppress', 'interdict', 'illuminate'] },
    air: { category: 'fires', label: 'Air Support', capabilities: ['recon', 'strike', 'interdict'] },
    /* Sustainment */
    supply: { category: 'sustainment', label: 'Supply', capabilities: ['resupply'] },
    medical: { category: 'sustainment', label: 'Medical', capabilities: ['casualty-evac'] },
    recovery: { category: 'sustainment', label: 'Recovery', capabilities: ['vehicle-recovery'] }
  };

  var registry = {};

  function register(id, typeId, faction) {
    var spec = ASSET_TYPES[typeId];
    if (!spec) return false;
    registry[id] = {
      id: id,
      typeId: typeId,
      category: spec.category,
      label: spec.label,
      capabilities: spec.capabilities.slice(),
      faction: faction || 'neutral',
      status: 'available',
      registeredAt: Date.now()
    };
    return true;
  }

  function get(id) { return registry[id] || null; }
  function list() { return Object.keys(registry).map(function (k) { return registry[k]; }); }
  function byCategory(cat) {
    return Object.keys(registry)
      .filter(function (k) { return registry[k].category === cat; })
      .map(function (k) { return registry[k]; });
  }
  function byFaction(f) {
    return Object.keys(registry)
      .filter(function (k) { return registry[k].faction === f; })
      .map(function (k) { return registry[k]; });
  }

  root.BattleCombinedArmsRegistry = {
    version: '1.0-g1',
    ASSET_TYPES: ASSET_TYPES,
    register: register,
    get: get,
    list: list,
    byCategory: byCategory,
    byFaction: byFaction
  };

  if (root.BattleModules) {
    root.BattleModules.registerSystem('combined-arms-registry', {
      version: '1.0-g1',
      onBattleStart: function () { /* registry is populated by scenario data */ }
    });
  }
  console.log('[TACTICS] G1: Combined arms registry loaded (data-only, no combat effects)');
})(typeof window !== 'undefined' ? window : globalThis);
