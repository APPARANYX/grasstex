(function (root) {
  'use strict';
  root.BattleAISkills.registerSkill({
    id: 'squad.coordinate-support-fire',
    scope: 'squad',
    requires: ['perceived-threat', 'current-mission', 'masked-line'],
    resources: ['team'],
    parameters: {},
    evaluate: function (s) {
      return {
        eligible: s.stage === 'support',
        score: 0.8,
        reason: 'coordinate-independent-fire',
        evidence: []
      };
    },
    createPlan: function (s, a) {
      return a.timeout(24, a.owner('squad.coordinate-support-fire'));
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
