/* Observe-only buddy-pair dose/separation probe (?buddyPairs=1).
   Reads module 16 snapshots only: unique pair identities, state sample share, cover/move activations,
   separation/route-gap maxima, and pair transition reasons. It never writes simulation state. */
(function(root){
  'use strict';
  var c,seenHistory,pairMax;
  function inc(m,k,n){k=String(k||'unknown');m[k]=(m[k]||0)+(n==null?1:n);}
  (root.BattleProbes=root.BattleProbes||{})['buddy-pairs']={
    every:0,
    start:function(){c={samples:0,pairs:{},byState:{},transitionReasons:{},maxSeparation:0,maxRouteGap:0,coverMoves:0};seenHistory={};pairMax={};},
    sample:function(sim){
      var S=root.BattleSquadStability;if(!S||!S.buddySnapshot)return;
      ['us','ge'].forEach(function(f){
        var squads=sim.factions&&sim.factions[f]&&sim.factions[f].squads||[];
        squads.forEach(function(sq){
          var snap=S.buddySnapshot(sq);if(!snap)return;
          snap.pairs.forEach(function(p){
            c.samples++;c.pairs[p.id]=1;inc(c.byState,p.state);
            c.maxSeparation=Math.max(c.maxSeparation,+p.separation||0);
            c.maxRouteGap=Math.max(c.maxRouteGap,+p.routeGap||0);
            pairMax[p.id]=Math.max(pairMax[p.id]||0,+p.coverMoves||0);
          });
          snap.history.forEach(function(h){
            var k=[sq.id,h.at,h.pair,h.from,h.to,h.reason].join('|');if(seenHistory[k])return;seenHistory[k]=1;
            inc(c.transitionReasons,h.reason||h.to);
          });
        });
      });
    },
    report:function(sim){
      Object.keys(pairMax).forEach(function(k){c.coverMoves+=pairMax[k];});
      var telemetry=root.BattleSquadStability&&root.BattleSquadStability.buddyTelemetry?root.BattleSquadStability.buddyTelemetry(sim):null;
      return Object.assign({},c,{uniquePairs:Object.keys(c.pairs).length,telemetry:telemetry});
    }
  };
})(window);
