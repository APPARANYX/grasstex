/* Experimental physical movement precision; no new AI decisions.
   Default is legacy 1x0.15s. Opt into ?movementSubsteps=2 or =3 for
   2x0.075s or 3x0.05s physical integration respectively. */
(function (root) {
  'use strict';
  if (!root.BattleSim || root.BattleMovementSubsteps) return;

  function valid(value) {
    return value === 2 || value === 3 ? value : 1;
  }

  function selected() {
    if (typeof location === 'undefined') return 1;
    var match = /[?&]movementSubsteps=([^&]*)/.exec(location.search || '');
    return valid(match ? Number(match[1]) : 1);
  }

  var configured = selected();
  var oldStart = root.BattleSim.start;
  root.BattleSim.start = function (scene, opts) {
    var sim = oldStart(scene, opts);
    sim._movementSubsteps = configured;
    return sim;
  };

  root.BattleMovementSubsteps = {
    selected: configured,
    set: function (sim, value) {
      sim._movementSubsteps = valid(value);
      return sim._movementSubsteps;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
