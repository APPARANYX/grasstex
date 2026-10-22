/* One soldier skill: data-only evaluation and tree construction. No world/owner access. */
(function (root) {
  'use strict';
  root.BattleAISkills.registerSkill({
    id: 'soldier.crouch-on-warning',
    scope: 'soldier',
    requires: ['perceived-threat', 'current-mission', 'adopted-movement'],
    resources: ['posture'],
    parameters: { confidence: { type: 'number', min: 0, max: 1, default: 0.25 } },
    evaluate: function (snapshot, parameters) {
      var warning = snapshot.facts.reduce(function (best, fact) {
        return Math.max(best, fact.confidence);
      }, 0);
      return {
        eligible: warning >= parameters.confidence,
        score: warning,
        reason: warning >= parameters.confidence ? 'perceived-warning' : 'low-confidence',
        evidence: []
      };
    },
    createPlan: function (snapshot, actions) {
      return actions.timeout(2, actions.sequence(actions.wait(0.45), actions.posture()));
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
