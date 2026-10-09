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

/* Screen-center rays own pointer placement; no flat compass ellipse may make
   a projected ground unit appear to arrive from the sky. */
const viewport = { left: 10, top: 20, right: 1010, bottom: 620, width: 1000, height: 600 };
const edgeCamera = {
  position: { x: 0, y: 3, z: 0 },
  getForwardRay() {
    return { direction: { x: 0, y: 0, z: 1 } };
  }
};
const samePoint = (actual, x, y, angle, label) => {
  assert(actual, label + ' must produce an edge ray');
  assert(
    Math.abs(actual.x - x) < 0.02 && Math.abs(actual.y - y) < 0.02,
    label + ' should hit exact rectangular inset edge, not a compass ellipse'
  );
  assert(Math.abs(actual.angle - angle) < 0.03, label + ' must rotate toward indicated screen direction');
};
const radiusX = 422,
  radiusY = 238,
  cx = 510,
  cy = 320;
samePoint(O.edgeRay(viewport, 400, 0), cx + radiusX, cy, 90, 'right');
samePoint(O.edgeRay(viewport, -400, 0), cx - radiusX, cy, -90, 'left');
samePoint(O.edgeRay(viewport, 0, -400), cx, cy - radiusY, 0, 'top');
samePoint(O.edgeRay(viewport, 0, 400), cx, cy + radiusY, 180, 'bottom');
const diag = O.edgeRay(viewport, 300, 180),
  diagonalScale = Math.min(radiusX / 300, radiusY / 180);
samePoint(
  diag,
  cx + 300 * diagonalScale,
  cy + 180 * diagonalScale,
  (Math.atan2(300, -180) * 180) / Math.PI,
  'diagonal ray'
);

/* Most important regression: the same world-forward unit can project right
   or even down while the camera is pitched/panned. The screen location must win. */
samePoint(
  O.edgeDirection({ x: 0, z: 100 }, edgeCamera, viewport, { x: 1500, y: 320 }),
  cx + radiusX,
  cy,
  90,
  'forward unit projecting right'
);
samePoint(
  O.edgeDirection({ x: 0, z: 100 }, edgeCamera, viewport, { x: 510, y: 1000 }),
  cx,
  cy + radiusY,
  180,
  'forward unit projecting below camera'
);
samePoint(
  O.edgeDirection({ x: 100, z: 100 }, edgeCamera, viewport, { x: 510, y: -300 }),
  cx,
  cy - radiusY,
  0,
  'forward-right unit projecting above camera'
);

/* A perspective-projected point behind the camera is inverted; never follow
   its screen-space X/Y or we would point up instead of toward the rear. */
samePoint(
  O.edgeDirection({ x: 0, z: -100 }, edgeCamera, viewport, { x: 510, y: -999 }),
  cx,
  cy + radiusY,
  180,
  'behind unit projects to bottom'
);
const rearRight = O.edgeDirection({ x: 100, z: -100 }, edgeCamera, viewport, { x: 10, y: -200 });
samePoint(rearRight, cx + radiusY, cy + radiusY, 135, 'rear-right unit');
const rearLeft = O.edgeDirection({ x: -100, z: -100 }, edgeCamera, viewport, { x: 2010, y: -200 });
samePoint(rearLeft, cx - radiusY, cy + radiusY, -135, 'rear-left unit');
samePoint(
  O.edgeDirection({ x: 100, z: 0 }, edgeCamera, viewport),
  cx + radiusX,
  cy,
  90,
  'side bearing if projection unavailable'
);
samePoint(
  O.edgeDirection({ x: 0, z: 100 }, edgeCamera, viewport),
  cx,
  cy - radiusY,
  0,
  'forward fallback if projection unavailable'
);
assert.strictEqual(
  O.edgeDirection({ x: 0, z: -100 }, edgeCamera, { left: 0, top: 0, width: 0, height: 0 }),
  null
);
assert.strictEqual(O.edgeRay(viewport, NaN, 5), null);
assert.strictEqual(O.edgeRay(viewport, 0, 0), null);

/* Squads and mission objectives share the projected bearing. Movement arcs
   are drawn only between two real onscreen symbols; no painted route is
   allowed to enter the screen from an offscreen fake world endpoint. */
assert(source.includes('screenEdge(sim, at, screen)'), 'squad offscreen arrow uses projection');
assert(source.includes('screenEdge(sim, obj, objScreen)'), 'objective offscreen diamond uses projection');
assert(
  source.includes('longMove && screen.visible && targetScreen && targetScreen.visible'),
  'command paths require both endpoints onscreen'
);
assert(!source.includes('edge || screen'), 'edge chevrons cannot become movement path origins');
assert(!source.includes('targetEdge || targetScreen'), 'edge points cannot become movement path endpoints');
assert(!source.includes('OFFSCREEN_PAD'), 'projected symbols may not display beyond canvas');
assert(source.includes('!behind &&'), 'behind-camera symbols cannot be treated as onscreen projections');
assert(
  source.includes('m.arrowStartedAt == null'),
  'command cue starts when previously offscreen endpoints enter view'
);
assert(
  source.includes('var insetX = Math.min(SYMBOL_INSET_X'),
  'onscreen bounds include symbol label clearance'
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
