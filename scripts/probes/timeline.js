/* Export the built-in one-second AI timeline through the generic observe-only probe runner.
   The runtime recorder lives in battle/modules/97-ai-timeline-recorder.js so diagnostics exports and
   benchmark runs use the exact same schema. */
(function(root){
  (root.BattleProbes=root.BattleProbes||{}).timeline={
    every:0,
    start:function(){},
    sample:function(){},
    report:function(sim){
      return root.BattleAITimeline&&root.BattleAITimeline.snapshot?root.BattleAITimeline.snapshot(sim):null;
    }
  };
})(window);
