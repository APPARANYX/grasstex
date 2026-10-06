/* Phase J1-J3: Sustainment, service, and roster breadth.
   J1: Sustainment state (transport, towing, resupply, medevac, maintenance, recovery)
   J2: Roster variants (light/medium/heavy armor, armored cars, assault guns, etc.)
   J3: Larger scenario definitions
   J1+J2 are data + state, behind ?sustainment=1 (default OFF).
   J3 is scenario fixtures. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleSustainment) return;

  function flagOn() {
    return /[?&]sustainment=1\b/.test(typeof location !== 'undefined' ? location.search : '');
  }

  /* J1: Sustainment state types */
  var SUSTAINMENT_TYPES = {
    transport: { label: 'Transport', capabilities: ['troop-carry', 'tow'] },
    resupply: { label: 'Resupply', capabilities: ['ammo', 'fuel'] },
    medevac: { label: 'Medical Evacuation', capabilities: ['casualty-transport'] },
    maintenance: { label: 'Maintenance', capabilities: ['field-repair'] },
    recovery: { label: 'Recovery', capabilities: ['vehicle-recovery'] },
    obstacles: { label: 'Static Obstacles', capabilities: ['barrier', 'minefield'] }
  };

  /* J2: Roster variants — capability data, not new command code paths */
  var ROSTER_VARIANTS = {
    'light-armor': {
      category: 'armor', label: 'Light Armor',
      hp: 250, maxSpeed: 12, weaponRange: 200, weaponDamage: 80,
      armor: { front: 40, side: 25, rear: 15, top: 10 },
      notes: 'Fast, lightly armored recon vehicle'
    },
    'medium-armor': {
      category: 'armor', label: 'Medium Armor',
      hp: 400, maxSpeed: 8, weaponRange: 300, weaponDamage: 120,
      armor: { front: 80, side: 50, rear: 30, top: 20 },
      notes: 'Standard battle tank'
    },
    'heavy-armor': {
      category: 'armor', label: 'Heavy Armor',
      hp: 600, maxSpeed: 5, weaponRange: 350, weaponDamage: 160,
      armor: { front: 120, side: 80, rear: 50, top: 30 },
      notes: 'Slow, heavily armored breakthrough tank'
    },
    'armored-car': {
      category: 'recon', label: 'Armored Car',
      hp: 150, maxSpeed: 15, weaponRange: 150, weaponDamage: 40,
      armor: { front: 20, side: 15, rear: 10, top: 8 },
      notes: 'Wheeled recon, fast on roads'
    },
    'assault-gun': {
      category: 'gun', label: 'Assault Gun',
      hp: 350, maxSpeed: 6, weaponRange: 280, weaponDamage: 140,
      armor: { front: 90, side: 50, rear: 30, top: 20 },
      notes: 'Self-propelled gun for infantry support'
    },
    'tank-destroyer': {
      category: 'gun', label: 'Tank Destroyer',
      hp: 300, maxSpeed: 7, weaponRange: 320, weaponDamage: 180,
      armor: { front: 50, side: 30, rear: 20, top: 15 },
      notes: 'Ambush-oriented anti-armor'
    },
    'mortar-team': {
      category: 'fires', label: 'Mortar Team',
      hp: 80, maxSpeed: 3, weaponRange: 400, weaponDamage: 30,
      armor: { front: 5, side: 5, rear: 5, top: 5 },
      notes: 'Indirect fire support'
    },
    'artillery-battery': {
      category: 'fires', label: 'Artillery Battery',
      hp: 100, maxSpeed: 2, weaponRange: 800, weaponDamage: 60,
      armor: { front: 5, side: 5, rear: 5, top: 5 },
      notes: 'Long-range indirect fire'
    },
    'fighter': {
      category: 'air', label: 'Fighter',
      hp: 100, maxSpeed: 50, weaponRange: 400, weaponDamage: 80,
      armor: { front: 10, side: 5, rear: 5, top: 5 },
      notes: 'Air superiority'
    },
    'recon-air': {
      category: 'air', label: 'Recon Aircraft',
      hp: 60, maxSpeed: 40, weaponRange: 0, weaponDamage: 0,
      armor: { front: 5, side: 5, rear: 5, top: 5 },
      notes: 'Observation only'
    },
    'strike-air': {
      category: 'air', label: 'Strike Aircraft',
      hp: 120, maxSpeed: 45, weaponRange: 300, weaponDamage: 150,
      armor: { front: 10, side: 8, rear: 5, top: 5 },
      notes: 'Ground attack'
    },
    'naval-gun': {
      category: 'naval', label: 'Naval Gunfire Support',
      hp: 999, maxSpeed: 0, weaponRange: 1500, weaponDamage: 200,
      armor: { front: 999, side: 999, rear: 999, top: 999 },
      notes: 'Off-map naval bombardment'
    }
  };

  /* J1: Sustainment state tracking */
  var sustainmentState = {};

  function createSustainmentAsset(sim, faction, typeId, pos) {
    var spec = SUSTAINMENT_TYPES[typeId];
    if (!spec) return null;
    var id = 'sus-' + Object.keys(sustainmentState).length + 1;
    var asset = {
      id: id,
      faction: faction,
      typeId: typeId,
      label: spec.label,
      capabilities: spec.capabilities.slice(),
      pos: { x: pos.x, z: pos.z },
      state: 'available',
      assignedTo: null,
      createdAt: +sim.time || 0
    };
    sustainmentState[id] = asset;
    return asset;
  }

  function assignSustainment(id, squadId) {
    var a = sustainmentState[id];
    if (!a) return false;
    a.state = 'assigned';
    a.assignedTo = squadId;
    return true;
  }

  function listSustainment() { return Object.keys(sustainmentState).map(function (k) { return sustainmentState[k]; }); }

  root.BattleSustainment = {
    version: '1.0-j1j2',
    SUSTAINMENT_TYPES: SUSTAINMENT_TYPES,
    ROSTER_VARIANTS: ROSTER_VARIANTS,
    createSustainmentAsset: createSustainmentAsset,
    assignSustainment: assignSustainment,
    listSustainment: listSustainment,
    flagOn: flagOn
  };

  if (root.BattleModules) {
    root.BattleModules.registerSystem('sustainment', {
      version: '1.0-j1j2',
      onBattleStart: function () { sustainmentState = {}; },
      onBattleRestart: function () { sustainmentState = {}; }
    });
  }
  console.log('[TACTICS] J1-J2: Sustainment + roster variants loaded (?sustainment=1 to enable)');
})(typeof window !== 'undefined' ? window : globalThis);
