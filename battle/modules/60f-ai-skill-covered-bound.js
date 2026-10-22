(function (root) {
  'use strict';
  root.BattleAISkills.registerSkill({
    id: 'squad.execute-covered-bound',
    scope: 'squad',
    requires: ['perceived-threat', 'current-mission', 'masked-line', 'support-ready', 'covered-maneuver'],
    resources: ['team'],
    parameters: {},
    evaluate: function (s) {
      return {
        eligible: s.stage === 'bound',
        score: 0.8,
        reason: 'execute-native-covered-bound',
        evidence: []
      };
    },
    createPlan: function (s, a) {
      return a.timeout(14, a.owner('squad.execute-covered-bound'));
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
