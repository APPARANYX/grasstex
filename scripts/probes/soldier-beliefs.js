/* Observe-only personal-belief dose probe (?soldierBeliefs=1).
   Reads Perception snapshots/telemetry only. It never prunes, updates, or otherwise writes belief state. */
(function(root){
  'use strict';
  var out;
  function inc(m,k,n){k=String(k||'unknown');m[k]=(m[k]||0)+(n==null?1:n);}
  (root.BattleProbes=root.BattleProbes||{})['soldier-beliefs']={
    every:1,
    start:function(){
      out={samples:0,unknownSamples:0,selected:{seen:0,told:0,heard:0},ageSum:{seen:0,told:0,heard:0},confidenceSum:{seen:0,told:0,heard:0},maxAge:{seen:0,told:0,heard:0}};
    },
    sample:function(sim){
      var S=root.SquadAI;
      if(!S||!S.beliefSnapshot||!S.soldierBeliefsOn||!S.soldierBeliefsOn())return;
      ['us','ge'].forEach(function(f){
        var a=sim._roster&&sim._roster[f]||[];
        for(var i=0;i<a.length;i++){
          var s=a[i];if(!s||s.dead)continue;
          var snap=S.beliefSnapshot(s,sim);if(!snap)continue;
          out.samples++;
          if(snap.unknown){out.unknownSamples++;continue;}
          var rec=null;
          for(var j=0;j<snap.beliefs.length;j++)if(snap.beliefs[j].key===snap.selectedKey){rec=snap.beliefs[j];break;}
          if(!rec)continue;
          inc(out.selected,rec.source);
          out.ageSum[rec.source]=(out.ageSum[rec.source]||0)+(+rec.age||0);
          out.confidenceSum[rec.source]=(out.confidenceSum[rec.source]||0)+(+rec.confidence||0);
          out.maxAge[rec.source]=Math.max(out.maxAge[rec.source]||0,+rec.age||0);
        }
      });
    },
    report:function(sim){
      var result=JSON.parse(JSON.stringify(out)),T=root.SquadAI&&root.SquadAI.beliefTelemetry?root.SquadAI.beliefTelemetry(sim):null;
      result.unknownShare=result.samples?+(result.unknownSamples/result.samples).toFixed(4):0;
      result.meanAge={};result.meanConfidence={};
      ['seen','told','heard'].forEach(function(k){
        var n=result.selected[k]||0;
        result.meanAge[k]=n?+(result.ageSum[k]/n).toFixed(3):0;
        result.meanConfidence[k]=n?+(result.confidenceSum[k]/n).toFixed(3):0;
      });
      result.telemetry=T;
      return result;
    }
  };
})(window);
