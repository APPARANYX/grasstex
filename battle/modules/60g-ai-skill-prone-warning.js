/* Independent opt-in soldier skill: react to fresh, high-confidence danger.
   Evaluation sees detached reported facts only; execution uses Engagement's
   existing lowering-only requestStance through the shared skills effector. */
(function (root) {
  'use strict';
  root.BattleAISkills.registerSkill({
    id: 'soldier.prone-on-fresh-warning',
    scope: 'soldier',
    requires: ['perceived-threat', 'current-mission', 'adopted-movement'],
    resources: ['posture'],
    parameters: {
      confidence: { type: 'number', min: 0, max: 1, default: 0.9 },
      maxAge: { type: 'number', min: 0, max: 10, default: 3 }
    },
    evaluate: function (snapshot, parameters) {
      var urgent = snapshot.facts.some(function (fact) {
        return (
          fact.confidence >= parameters.confidence &&
          snapshot.now - fact.observedAt <= parameters.maxAge
        );
      });
      return {
        eligible: urgent,
        score: urgent ? 1 : 0,
        reason: urgent ? 'fresh-critical-warning' : 'no-fresh-critical-warning',
        evidence: []
      };
    },
    createPlan: function (snapshot, actions) {
      return actions.timeout(1.5, actions.posture('prone'));
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
