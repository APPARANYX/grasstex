/* Perception budget (squad-ai.js `PERCEPTION_BUDGET`, 40 findTarget scans per AI tick): does the cap
   ever bind, and how many scans does it refuse? Observe only: reads what the sim already keeps.

   A man who scans stamps `_scanAt` before the budget test, and `perceive` is the only writer of it, so
   the number of men whose `_scanAt` changed since the last sample is the scan attempts of that step;
   `sim._perceptionCount` is how many the budget let through. Attempts minus that is refused. Assumes
   one AI tick per sample (AI_TICK 0.15 s = the runner's step). `_frame` walks every US man and then
   every German man on each AI tick, so the budget goes to the US first: refusals are split by faction
   on that walk order (US takes up to the cap, the Germans get the rest). It is an inference, not an
   observation of who was refused. A build without the budget leaves
   `_perceptionCount` undefined: `budgetInCode` is false and nothing is counted as refused. */
(function (root) {
  var CAP = 40,
    prev = new WeakMap(),
    steps = 0,
    scanTicks = 0,
    attempts = 0,
    scans = 0,
    refused = 0,
    ticksAtCap = 0,
    ticksRefusing = 0,
    maxAttempts = 0,
    firstRefusedAt = null,
    hist = { '1-9': 0, '10-19': 0, '20-29': 0, '30-39': 0, '40': 0, '41-59': 0, '60+': 0 },
    seenBudget = false,
    byFaction = { us: { tried: 0, refused: 0 }, ge: { tried: 0, refused: 0 } };
  function bucket(n) {
    return n < 10 ? '1-9' : n < 20 ? '10-19' : n < 30 ? '20-29' : n < 40 ? '30-39' : n === 40 ? '40' : n < 60 ? '41-59' : '60+';
  }
  (root.BattleProbes = root.BattleProbes || {})['perception-budget'] = {
    every: 0,
    start: function (sim) {
      prev = new WeakMap();
      steps = scanTicks = attempts = scans = refused = ticksAtCap = ticksRefusing = maxAttempts = 0;
      firstRefusedAt = null;
      seenBudget = false;
      byFaction = { us: { tried: 0, refused: 0 }, ge: { tried: 0, refused: 0 } };
      Object.keys(hist).forEach(function (k) { hist[k] = 0; });
      var men = root.BattleModules.unitsFor(sim);
      for (var i = 0; i < men.length; i++) if (men[i]) prev.set(men[i], men[i]._scanAt);
    },
    sample: function (sim) {
      steps++;
      var men = root.BattleModules.unitsFor(sim),
        tried = 0,
        triedUs = 0;
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!s) continue;
        if (prev.has(s) && prev.get(s) !== s._scanAt) {
          tried++;
          if (s.faction === 'us') triedUs++;
        }
        prev.set(s, s._scanAt);
      }
      if (!tried) return;
      var allowed = typeof sim._perceptionCount === 'number' ? sim._perceptionCount : tried;
      if (typeof sim._perceptionCount === 'number') seenBudget = true;
      var lost = Math.max(0, tried - allowed),
        allowedUs = Math.min(triedUs, allowed),
        triedGe = tried - triedUs,
        allowedGe = allowed - allowedUs;
      byFaction.us.tried += triedUs;
      byFaction.us.refused += triedUs - allowedUs;
      byFaction.ge.tried += triedGe;
      byFaction.ge.refused += Math.max(0, triedGe - allowedGe);
      scanTicks++;
      attempts += tried;
      scans += allowed;
      refused += lost;
      if (tried > maxAttempts) maxAttempts = tried;
      hist[bucket(tried)]++;
      if (allowed >= CAP) ticksAtCap++;
      if (lost > 0) {
        ticksRefusing++;
        if (firstRefusedAt == null) firstRefusedAt = +(+sim.time).toFixed(2);
      }
    },
    report: function () {
      return {
        budgetInCode: seenBudget,
        cap: CAP,
        steps: steps,
        scanTicks: scanTicks,
        attempts: attempts,
        scansAllowed: scans,
        scansRefused: refused,
        refusedShare: attempts ? +(refused / attempts).toFixed(4) : 0,
        ticksAtCap: ticksAtCap,
        ticksRefusing: ticksRefusing,
        maxAttemptsInOneTick: maxAttempts,
        firstRefusedAt: firstRefusedAt,
        attemptsPerTick: hist,
        byFactionByWalkOrder: {
          us: { attempts: byFaction.us.tried, refused: byFaction.us.refused,
            refusedShare: byFaction.us.tried ? +(byFaction.us.refused / byFaction.us.tried).toFixed(4) : 0 },
          ge: { attempts: byFaction.ge.tried, refused: byFaction.ge.refused,
            refusedShare: byFaction.ge.tried ? +(byFaction.ge.refused / byFaction.ge.tried).toFixed(4) : 0 }
        }
      };
    }
  };
})(window);
