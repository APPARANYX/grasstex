/* Read-only native causal probe. Wrap calls without changing arguments, results or RNG. */
(function (root) {
  root.installCoveredManeuverObserver = function (sim) {
    const events = [], attempts = [], windows = [], histories = new Set();
    const E = root.BattleEngagement, Q = root.BattleSquadStability, C = root.BattleCoverPositions;
    let current = null, currentWindow = null;
    const now = () => +sim.time.toFixed(3);
    const point = p => p ? {x:p.x,z:p.z,slotId:p.slotId || p.id} : null;
    function actor(s) {
      return {id:String(s.id), squad:s.squad.id, faction:s.faction, team:Q.teamKeyFor(s),
        position:point(s.root.position), moving:!!s.moving, dead:!!s.dead,
        state:s.eng?.state, suppressedUntil:s.suppressedUntil, reloading:!!s.reloading,
        reacting:E.reacting(s), claim:point(C.current(s,sim)?.slot),
        publishKey:s._fireteamPublishKey, adoptedEnvelope:s._fireteamAdoptedEnvelope?.id,
        resolver:s._movementResolver ? {kind:s._movementResolver.lastKind,reason:s._movementResolver.lastReason} : null};
    }
    function wrap(obj, name, call) { const old=obj[name]; obj[name]=function(...args){return call(old,this,args);}; }
    wrap(E.controllerCombat,'bound',(old,self,args)=>{
      const [s,b,p,id]=args, h=Q.controllerBound.current(s.squad,b);
      current={at:now(),actionId:id,...actor(s),destination:point(p), role:Q.controllerBound.role(s,b),
        windowSince:h?.lease.since, holders:(h?.holders||[]).map(m=>({id:String(m.id),team:Q.teamKeyFor(m),shot:root.BattleAmmunition.shotEvidence(m,b),qualified:E.supportDischarged(m,b,h.lease.since-3)})), gates:[]};
      const result=old.apply(self,args); current.accepted=!!result;
      if(result){current.claim=point(result.claim?.slot); current.orderKey=result.order?.key;}
      attempts.push(current); current=null; return result;
    });
    for(const [obj,name,label] of [[Q.controllerBound,'arm','support-arm'],[C,'candidates','cover-candidates'],[root.BattleTacticalContactRoute,'evaluate','route'],[C,'reserve','reservation'],[Q.controllerMovement,'publish','meso-publication']])
      wrap(obj,name,(old,self,args)=>{const r=old.apply(self,args);if(current)current.gates.push({gate:label,result:Array.isArray(r)?r.map(point):name==='evaluate'?{eligible:r.eligible,reason:r.reason}:!!r});return r;});
    wrap(Q.controllerBound,'begin',(old,self,args)=>{const r=old.apply(self,args); windows.push({at:now(),squad:args[0].id,params:args[2],accepted:!!r});return r;});
    wrap(E.controllerCombat,'stage',(old,self,args)=>{const r=old.apply(self,args);const t=args[2];if(t.drill==='bound'){
      const a=attempts.findLast(a=>a.accepted&&a.id===String(args[0].id)&&a.at===+t.since.toFixed(3));
      if(a && a.lastStage!==r.stage){(a.stages||=[]).push({at:now(),...r,...actor(args[0])});a.lastStage=r.stage;}
    }return r;});
    wrap(E.controllerCombat,'end',(old,self,args)=>{const t=args[2];if(t.drill==='bound'){
      const a=attempts.findLast(a=>a.accepted&&a.id===String(args[0].id)&&a.at===+t.since.toFixed(3));
      if(a){a.end={at:now(),arrived:!!t.arrived,executed:!!t.executed,reason:t.reason,...actor(args[0])};}
    }return old.apply(self,args);});
    wrap(root.BattleTacticalCoveredManeuver,'update',(old,self,args)=>{
      const ctx=args[0];const originalFinish=ctx.finish;
      const traced=Object.assign({},ctx,{finish(id,reason){events.push({at:now(),squad:ctx.squad.id,kind:'finish',actionId:id,reason});return originalFinish(id,reason);}});
      const r=old.call(self,traced), st=root.BattleTacticalCoveredManeuver.summary(ctx.squad);
      for(const h of st?.history||[]){const k=ctx.squad.id+JSON.stringify(h);if(!histories.has(k)){histories.add(k);events.push({squad:ctx.squad.id,kind:'history',...h});}}
      return r;
    });
    return {events,attempts,windows};
  };
})(window);
