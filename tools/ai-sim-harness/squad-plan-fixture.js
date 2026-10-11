'use strict';
/* Shared test-only Squad Leader plan-load fixture. Preserve the original
   explicit lexical module order and per-world flag/console bindings.
   Each call evaluates fresh source; scenarios retain independent stubs. */
const { loadModule } = require('./module-loader');
const PLAN_CORE = Object.freeze([
  'battle/modules/15a-squad-leader-fire-control.js',
  'battle/modules/15b-squad-leader-buddy-pairs.js',
  'battle/modules/15c-squad-leader-scouts-forward.js',
  'battle/modules/15d-squad-leader-leaderless-intent.js',
  'battle/modules/15e-squad-leader-morale-coa.js'
]);
const FIRE_MOVEMENT = 'battle/modules/15j-squad-leader-fire-and-movement.js';
const STABILITY = 'battle/modules/16-squad-plan-stability.js';

function loadSquadPlan(root, opts = {}) {
  const submoduleLocation = Object.prototype.hasOwnProperty.call(opts, 'submoduleLocation')
    ? opts.submoduleLocation
    : root.location;
  const submoduleConsole = opts.submoduleConsole || console;
  for (const file of PLAN_CORE) {
    loadModule(root, file, { console: submoduleConsole, location: submoduleLocation });
  }
  if (opts.withFireAndMovement) {
    loadModule(root, FIRE_MOVEMENT, {
      console: submoduleConsole,
      location: submoduleLocation
    });
  }
  loadModule(root, STABILITY, {
    console: opts.stabilityConsole || console,
    location: opts.stabilityLocation
  });
}
module.exports = { PLAN_CORE, FIRE_MOVEMENT, STABILITY, loadSquadPlan };
