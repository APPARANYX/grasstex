/* Observe-only attribution at the real public Macro interception boundary.
   Does not issue orders, re-run choose(), draw RNG or change input/output values. */
(function(root){
'use strict';
const api=root.BattleStrategicInterception;if(!api||root.BattleInterceptionAudit)return;
const before=api.maybeIssue,rows=[];
api.maybeIssue=function(sim,faction){
 const previous=sim._strategicInterception?.[faction]?.last;
 const squads=(sim.factions[faction]?.squads||[]).map(sq=>({id:sq.id,state:sq.state,inContact:!!sq.inContact,isPlayer:!!sq.isPlayer,transportUsed:!!sq._transportUsed,preparedDefense:!!sq._preparedDefenseRequest,transportPhase:sq._transport?.phase||null,mission:sq._macroMission?{intent:sq._macroMission.intent,status:sq._macroMission.status,version:sq._macroMission.version,reason:sq._macroMission.reason}:null}));
 const result=before.apply(this,arguments),last=sim._strategicInterception?.[faction]?.last;
 if(last&&last!==previous&&rows.length<200) rows.push({time:sim.time,faction,result:JSON.parse(JSON.stringify(last)),squads});
 return result;
};
root.BattleInterceptionAudit={report:()=>rows};
})(window);
