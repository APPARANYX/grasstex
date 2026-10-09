#!/usr/bin/env node
'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const source = fs.readFileSync(
  path.join(__dirname, '../../battle/modules/41-squad-status-overlay.js'),
  'utf8'
);

let registered = null;
const ctx = {
  console: { log() {}, error() {}, warn() {} },
  BattleModules: {
    registerSystem(id, spec) {
      registered = { id, spec };
    },
    listTacticalOverlayProviders() {
      return [
        {
          id: 'vehicles',
          entities(sim, faction) {
            return faction === 'us'
              ? [
                  {
                    id: 'tank-1',
                    faction: 'us',
                    root: { position: { x: 12, z: 34 } },
                    unitType: 'armor'
                  }
                ]
              : [];
          },
          view(v) {
            return {
              id: v.id,
              faction: v.faction,
              root: v.root,
              tacticalSymbol: 'armor',
              overlayStatus: 'ADVANCE',
              overlayDestination: { x: 250, z: 34, id: 'road-1' },
              overlayMoving: true
            };
          }
        }
      ];
    }
  },
  SquadAI: {
    leaderOf(sq) {
      return sq._leader || null;
    }
  },
  BattleLeases: {
    get(sq, kind) {
      return (sq._leases && sq._leases.live && sq._leases.live[kind]) || null;
    }
  },
  BattleObjectiveSystem: {
    get(sim, id) {
      return (sim.objectives && sim.objectives[id]) || null;
    }
  }
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const coreRuntime = fs.readFileSync(path.join(__dirname, '../../battle/core-runtime.js'), 'utf8');
vm.runInContext(coreRuntime, ctx, { filename: 'battle/core-runtime.js' });
vm.runInContext(source, ctx, { filename: '41-squad-status-overlay.js' });

const O = ctx.BattleSquadStatusOverlay;
assert(O, 'overlay API exported');
assert(registered && registered.id === 'squad-status-overlay', 'system registered');
assert.strictEqual(O.longArrowWorld, 150, 'long command arrows require a 150 m destination');

/* Camera-relative world bearings remain meaningful when a squad is behind the camera. */
const viewport = { left: 10, top: 20, width: 1000, height: 600 };
const edgeCamera = {
  position: { x: 0, z: 0 },
  getForwardRay() {
    return { direction: { x: 0, z: 1 } };
  }
};
const directions = [
  ['front', { x: 0, z: 100 }, 510, 82, 0],
  ['right', { x: 100, z: 0 }, 942, 320, 90],
  ['behind', { x: 0, z: -100 }, 510, 558, 180],
  ['left', { x: -100, z: 0 }, 78, 320, -90]
];
for (const [side, location, x, y, angle] of directions) {
  const p = O.edgeDirection(location, edgeCamera, viewport);
  assert(p, side + ' pointer must resolve');
  assert(
    Math.abs(p.x - x) < 0.01 && Math.abs(p.y - y) < 0.01,
    side + ' pointer must be inside the proper viewport edge'
  );
  assert(Math.abs(p.angle - angle) < 0.01, side + ' arrow must face the squad');
}
assert.strictEqual(O.edgeDirection({ x: 1, z: 0 }, edgeCamera, { width: 0, height: 0 }), null);
assert(
  source.includes('edge || screen') && source.includes('targetEdge || targetScreen'),
  'command arrows use clamped anchors for offscreen squads and destinations'
);

const fallbackSymbol = JSON.parse(JSON.stringify(O.symbolSpec({})));
assert.strictEqual(fallbackSymbol.id, 'infantry');
assert.strictEqual(fallbackSymbol.verifiedHistorical, true);
assert(Array.isArray(fallbackSymbol.primitives) && fallbackSymbol.primitives.length > 0);

function base() {
  return {
    id: 1,
    faction: 'us',
    state: 'advance',
    commandPhase: 'approach',
    inContact: false,
    orderAnchor: { x: 10, z: 20 },
    objective: { x: 30, z: 40 },
    members: [],
    _leases: { live: {} }
  };
}

const sim = {
  time: 12,
  factions: { us: { squads: [] }, ge: { squads: [] } },
  objectives: { A: { def: { x: 100, z: 200 } } }
};

const providerRows = O.overlayEntities(sim, 'us');
assert.strictEqual(providerRows.length, 1, 'non-squad provider contributes overlay entity');
assert.strictEqual(providerRows[0].key, 'provider:vehicles:us:tank-1');
assert.strictEqual(O.statusFor(providerRows[0].entity, sim).label, 'ADVANCE');
assert.deepStrictEqual(JSON.parse(JSON.stringify(O.arrowTarget(providerRows[0].entity, sim))), {
  x: 250,
  z: 34,
  id: 'road-1'
});

let q = base();
assert.strictEqual(O.statusFor(q, sim).label, 'ADVANCE');
q.inContact = true;
q.coa = 'assault';
assert.strictEqual(O.statusFor(q, sim).label, 'ASSAULT');
q.fireControl = { state: 'hold' };
assert.strictEqual(O.statusFor(q, sim).label, 'HOLD FIRE');
q._leases.live.bound = { until: 20, data: { team: 'bravo' } };
assert.strictEqual(O.statusFor(q, sim).label, 'BOUND BRAVO');
delete q._leases.live.bound;
q._reconTask = { point: { x: 50, z: 60 } };
assert.strictEqual(O.statusFor(q, sim).label, 'SCOUTS FORWARD');
q.state = 'retreat';
q._assembly = { phase: 'to-rally' };
assert.strictEqual(O.statusFor(q, sim).label, 'RECONSTITUTE', 'survival retreat outranks recon display');

q = base();
q.state = 'retreat';
q.commandPhase = 'assault';
assert.strictEqual(
  O.statusFor(q, sim).label,
  'RETREAT',
  'a live withdrawal outranks the stale mission phase'
);
q._leases.live['rally-recovery'] = { until: 20, data: { point: { x: 14, z: 24 } } };
assert.strictEqual(
  O.statusFor(q, sim).label,
  'RALLYING',
  'post-retreat physical reform is not mislabeled as continued retreat'
);
assert.deepStrictEqual(JSON.parse(JSON.stringify(O.movementTarget(q, sim))), { x: 14, z: 24 });
assert.deepStrictEqual(JSON.parse(JSON.stringify(O.arrowTarget(q, sim))), { x: 14, z: 24 });
q.state = 'advance';
q.inContact = true;
q.coa = 'assault';
assert.strictEqual(
  O.statusFor(q, sim).label,
  'ASSAULT',
  'once recovery hands command back, the overlay follows the active assault'
);

q = base();
q.commandPhase = 'regroup';
q.objective = { x: 7, z: 8 };
assert.deepStrictEqual(JSON.parse(JSON.stringify(O.movementTarget(q, sim))), { x: 7, z: 8 });

q = base();
q._reconTask = { point: { x: 77, z: 88 } };
assert.deepStrictEqual(JSON.parse(JSON.stringify(O.movementTarget(q, sim))), { x: 77, z: 88 });

q = base();
q.state = 'retreat';
q._assembly = { phase: 'to-rally' };
q._macroMission = { point: { x: 3, z: 4 } };
assert.deepStrictEqual(JSON.parse(JSON.stringify(O.movementTarget(q, sim))), { x: 3, z: 4 });

q = base();
q._macroMission = { version: 4, objectiveId: 'A', point: { x: 5, z: 6 } };
assert.deepStrictEqual(JSON.parse(JSON.stringify(O.missionObjective(q, sim))), {
  x: 100,
  z: 200,
  id: 'A'
});
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(O.arrowTarget(q, sim))),
  {
    x: 100,
    z: 200,
    id: 'A'
  },
  'long arrow uses the issued mission destination, not the short orderAnchor'
);
const sig1 = O.arrowSignature(q, O.arrowTarget(q, sim));
q.orderAnchor = { x: 99, z: 99 };
assert.strictEqual(
  O.arrowSignature(q, O.arrowTarget(q, sim)),
  sig1,
  'local Squad Leader anchor updates do not retrigger the long-range command arrow'
);
q.commandPhase = 'assault';
q._macroMission.version = 5;
assert.strictEqual(
  O.arrowSignature(q, O.arrowTarget(q, sim)),
  sig1,
  'phase changes and revised briefs for the same objective do not replay the arrow'
);
q._macroMission.objectiveId = null;
q._macroMission.point = { x: 155, z: 205 };
const movedSig = O.arrowSignature(q, O.arrowTarget(q, { time: 12, objectives: {} }));
assert.notStrictEqual(
  movedSig,
  sig1,
  'a materially different destination can trigger a fresh command-arrow wipe'
);

q = base();
q._macroMission = { point: { x: 5, z: 6 } };
assert.deepStrictEqual(JSON.parse(JSON.stringify(O.missionObjective(q, sim))), {
  x: 5,
  z: 6,
  id: null
});

q = base();
const before = JSON.stringify(q);
O.statusFor(q, sim);
O.movementTarget(q, sim);
O.arrowTarget(q, sim);
O.arrowSignature(q, O.arrowTarget(q, sim));
O.missionObjective(q, sim);
O.symbolSpec(q);
assert.strictEqual(JSON.stringify(q), before, 'read model is observe-only');

console.log('squad-status-overlay-check: PASS');
