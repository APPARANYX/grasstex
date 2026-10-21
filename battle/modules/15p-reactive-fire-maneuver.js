/* Opt-in, read-only reactive fire-and-maneuver policy.
   The Squad Leader remains the sole bound lease writer and native Engagement
   chooses cover and fires; Movement Resolver alone moves the soldiers.
   This is NOT a deliberate ambush and never creates contact or firing receipts. */
(function (root) {
  'use strict';
  var query = (root.location && root.location.search) || '';
  var on =
    /[?&]reactiveFireManeuver=(?:1|on|true)(?:&|#|$)/i.test(query) &&
    /[?&]localPlan=(?:1|on|true)(?:&|#|$)/i.test(query) &&
    /[?&]coveredBounds=(?:1|on|true)(?:&|#|$)/i.test(query);
  function canTask(sq, inputs) {
    var mission = sq && sq._macroMission,
      resources = inputs && inputs.resources;
    return !!(
      on &&
      sq &&
      sq.state !== 'retreat' &&
      ['assault', 'capture', 'clear-town'].indexOf(sq.commandPhase) >= 0 &&
      mission &&
      mission.status === 'executing' &&
      inputs &&
      inputs.contact &&
      inputs.confidence >= 0.5 &&
      Number.isFinite(inputs.pressure) &&
      inputs.pressure < 0.75 &&
      inputs.supporting >= 2 &&
      (!resources || (resources.status !== 'over-budget' && resources.moverIds.length > 0))
    );
  }
  /* Engagement supplies this list; validate recent DISTINCT real shots and
     current live firing ability. Being armed or merely facing the enemy is not
     proof that suppression has started. */
  function supporters(battle, sq, report, movers) {
    var A = root.SquadAI,
      E = root.BattleEngagement,
      list = report && report.fireSupport;
    if (!on || !battle || !sq || !A || !A.shotReceipt || !E || !E.supportReady || !Array.isArray(list))
      return [];
    return list.filter(function (s, i) {
      var shot = s && A.shotReceipt(s, battle);
      return (
        s &&
        list.indexOf(s) === i &&
        sq.members.indexOf(s) >= 0 &&
        (!movers || movers.indexOf(s) < 0) &&
        !s.dead &&
        !s.isPlayer &&
        E.supportReady(s, battle) &&
        shot &&
        Number.isFinite(shot.at) &&
        battle.time >= shot.at &&
        battle.time - shot.at <= 5
      );
    });
  }
  function canBoundTeam(battle, sq, movers, report) {
    var C = root.BattleCoverPositions;
    if (
      !on ||
      !C ||
      !C.coveredBoundsOn ||
      !C.coveredBoundsOn() ||
      !C.boundThreats ||
      !C.boundRoute ||
      !C.candidates ||
      !Array.isArray(movers) ||
      !movers.length ||
      supporters(battle, sq, report, movers).length < 2
    )
      return false;
    return movers.every(function (s) {
      var threats = C.boundThreats(s, battle);
      if (!threats.length) return false;
      var possibilities = C.candidates(
        s,
        battle,
        { root: { position: threats[0] } },
        C.boundTuning().maxDistance
      );
      return (
        Array.isArray(possibilities) &&
        possibilities.length <= 256 &&
        possibilities.slice(0, 48).some(function (p) {
          return C.boundRoute(s, battle, p, threats, 'reactive').eligible;
        })
      );
    });
  }
  root.BattleReactiveFireManeuver = Object.freeze({
    on: on,
    canTask: canTask,
    supporters: supporters,
    canBoundTeam: canBoundTeam
  });
})(typeof window !== 'undefined' ? window : globalThis);
