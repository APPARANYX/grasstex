(function (root) {
  'use strict';
  root.BattleAISkills.registerSkill({
    id: 'squad.prepare-firing-line',
    scope: 'squad',
    requires: ['perceived-threat', 'current-mission', 'adopted-movement'],
    resources: ['team'],
    parameters: {},
    evaluate: function (s) {
      return {
        eligible: s.stage === 'prepare' && !!s.preparationAllowed,
        score: 0.8,
        reason: 'prepare-masked-line',
        evidence: []
      };
    },
    createPlan: function (s, a) {
      return a.timeout(28, a.owner('squad.prepare-firing-line'));
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
