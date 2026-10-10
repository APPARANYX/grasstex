'use strict';
/* Regression fixture declaration; see squad-command-stack-check.js. */
/* Canonical shipping Squad Leader submodule load stack, shared by the
   deterministic fixture family. Keep the exact order. Per-check doctrines,
   mock policies and optional supporting modules remain check-specific. */
const files = Object.freeze([
  'battle/modules/15a-squad-leader-fire-control.js',
  'battle/modules/15b-squad-leader-buddy-pairs.js',
  'battle/modules/15c-squad-leader-scouts-forward.js',
  'battle/modules/15d-squad-leader-leaderless-intent.js',
  'battle/modules/15e-squad-leader-morale-coa.js',
  'battle/modules/15f-squad-leader-retreat-anchor.js',
  'battle/modules/15g-squad-leader-formation.js',
  'battle/modules/15h-squad-leader-fireteams.js',
  'battle/modules/15i-squad-leader-clear-contact.js',
  'battle/modules/15j-squad-leader-fire-and-movement.js',
  'battle/modules/15k-squad-leader-reconstitution.js',
  'battle/modules/15l-squad-leader-mission-execution.js',
  'battle/modules/15m-squad-leader-cohesion-regroup.js',
  'battle/modules/16-squad-plan-stability.js'
]);
function loadSquadCommandStack(load, root) {
  for (const file of files) load(root, file);
}
module.exports = { files, loadSquadCommandStack };
