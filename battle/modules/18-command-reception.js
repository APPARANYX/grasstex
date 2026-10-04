/* Individual command-reception state.
   Phase 0A records deterministic per-man receipt/adoption telemetry. Phase 0B optionally lets
   Engagement consume the personally adopted posture/fire-control version. Phase 0C exposes the same
   adopted-command boundary to the Meso movement publisher; this module still never writes stance,
   fire permission, targets, paths, destinations or movement itself.

   Owns only battle._commandReception. Timing is deterministic and uses no combat RNG. */
(function(root){
  'use strict';
  if(root.BattleCommandReception)return;

  var SEARCH=typeof location!=='undefined'?location.search||'':'',
    ON=!/[?&]commandReception=(?:0|off|false)(?:&|#|$)/i.test(SEARCH),
    POSTURE_ON=ON&&/[?&]commandPosture=(?:1|on|true)(?:&|#|$)/i.test(SEARCH),
    MOVEMENT_ON=ON&&/[?&]commandMovement=(?:1|on|true)(?:&|#|$)/i.test(SEARCH);
  var FORMAT=3;
  var TUNING={
    SOUND:343,
    SPEAK_SIMPLE:.35,
    SPEAK_SPATIAL:.55,
    ATTENTION:.08,
    ATTENTION_SPREAD:.28,
    PROCESS:.16,
    PROCESS_SPREAD:.34,
    ORIENT:.20,
    ORIENT_SPREAD:.30,
    LOG:300
  };

  function hash01(a,b){
    var s=String(a)+'|'+String(b),h=2166136261>>>0;
    for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return(h>>>0)/4294967296;
  }
  function point(v){
    return v&&isFinite(+v.x)&&isFinite(+v.z)?{x:+v.x,z:+v.z}:null;
  }
  function copyData(v){
    if(!v||typeof v!=='object')return null;
    var out={};
    Object.keys(v).forEach(function(k){
      var x=v[k];
      if(x==null||typeof x==='string'||typeof x==='number'||typeof x==='boolean')out[k]=x;
    });
    return out;
  }
  function pos(v){
    return v&&v.root&&v.root.position?point(v.root.position):null;
  }
  function distance(a,b){
    if(!a||!b)return null;
    return Math.hypot(a.x-b.x,a.z-b.z);
  }
  function leaderOf(sq){
    var S=root.SquadAI;
    if(S&&typeof S.leaderOf==='function')return S.leaderOf(sq);
    var m=(sq&&sq.members)||[];
    for(var i=0;i<m.length;i++)if(m[i]&&!m[i].dead&&S&&S.isLeader&&S.isLeader(m[i]))return m[i];
    return null;
  }
  function squadKey(sq){
    return String((sq&&sq.faction)||'?')+':'+String((sq&&sq.id)||'?');
  }
  function battleState(battle){
    if(!ON||!battle)return null;
    return battle._commandReception||(battle._commandReception={
      format:FORMAT,
      serial:0,
      versions:Object.create(null),
      current:Object.create(null),
      bySoldier:Object.create(null),
      adoptedBySoldier:Object.create(null),
      recent:[],
      counts:{
        envelopes:0,
        recipients:0,
        adopted:0,
        byCategory:Object.create(null),
        latencySum:0,
        latencyMax:0
      }
    });
  }
  function recognitionScale(s){
    var scale=1,St=root.BattleSoldierStats,M=root.BattleSoldierMind;
    if(St&&typeof St.scale==='function')scale*=Math.max(.25,+St.scale(s,'recognition')||1);
    if(M&&typeof M.reactScale==='function')scale*=Math.max(.25,+M.reactScale(s)||1);
    return scale;
  }
  function liveRecipients(list){
    var out=[],seen=Object.create(null),m=list||[];
    for(var i=0;i<m.length;i++){
      var s=m[i],id=s&&s.id!=null?String(s.id):'';
      if(!s||s.dead||s.isPlayer||!id||seen[id])continue;
      seen[id]=1;out.push(s);
    }
    return out;
  }
  function stage(rec,now){
    if(now+1e-9<rec.receivedAt)return'issued';
    if(now+1e-9<rec.processedAt)return'received';
    if(now+1e-9<rec.adoptedAt)return rec.needsOrientation?'orienting':'processing';
    return'adopted';
  }
  function planRecipient(st,envelope,soldier,sender,battle){
    var id=String(soldier.id),from=pos(sender),to=pos(soldier),d=distance(from,to),
      self=!!(sender&&String(sender.id)===id),
      h1=hash01(envelope.id,id+':attention'),
      h2=hash01(envelope.id,id+':process'),
      h3=hash01(envelope.id,id+':orient'),
      speak=self?0:(envelope.spatial?TUNING.SPEAK_SPATIAL:TUNING.SPEAK_SIMPLE),
      travel=self||d==null?0:d/TUNING.SOUND,
      receive=envelope.issuedAt+speak+travel+(self?0:TUNING.ATTENTION+h1*TUNING.ATTENTION_SPREAD),
      scale=recognitionScale(soldier),
      processed=receive+(TUNING.PROCESS+h2*TUNING.PROCESS_SPREAD)*scale,
      orient=envelope.spatial?(TUNING.ORIENT+h3*TUNING.ORIENT_SPREAD)*scale:0,
      adopted=processed+orient,
      rec={
        envelopeId:envelope.id,
        version:envelope.version,
        category:envelope.category,
        scope:envelope.scope,
        action:envelope.action,
        signature:envelope.signature,
        sourceId:envelope.sourceId,
        channel:sender?'direct-voice-model':'command-model',
        issuedAt:envelope.issuedAt,
        receivedAt:+receive.toFixed(3),
        processedAt:+processed.toFixed(3),
        adoptedAt:+adopted.toFixed(3),
        legacyExecutionAt:envelope.issuedAt,
        distance:d==null?null:+d.toFixed(2),
        needsOrientation:!!envelope.spatial,
        point:envelope.point?{x:envelope.point.x,z:envelope.point.z}:null,
        data:copyData(envelope.data),
        phase:'issued',
        countedAdopted:false
      },
      slot=envelope.category+'|'+envelope.scope,
      by=st.bySoldier[id]||(st.bySoldier[id]=Object.create(null)),
      latency=adopted-envelope.issuedAt;
    rec.phase=stage(rec,+battle.time||0);
    by[slot]=rec;
    st.counts.recipients++;
    st.counts.latencySum+=latency;
    st.counts.latencyMax=Math.max(st.counts.latencyMax,latency);
    return rec;
  }
  function publish(sq,battle,category,recipients,meta){
    if(!ON||!sq||!battle)return null;
    meta=meta||{};
    var st=battleState(battle),scope=String(meta.scope||'squad'),
      key=squadKey(sq)+'|'+String(category||'command')+'|'+scope,
      signature=String(meta.signature||meta.action||'command'),
      current=st.current[key];
    if(current&&current.signature===signature){
      settle(battle);
      return current;
    }
    var version=(st.versions[key]||0)+1;
    st.versions[key]=version;
    var sender=meta.sender||leaderOf(sq),
      envelope={
        id:'cmd-'+(++st.serial),
        squad:squadKey(sq),
        category:String(category||'command'),
        scope:scope,
        action:String(meta.action||category||'command'),
        version:version,
        signature:signature,
        issuedAt:+battle.time||0,
        sourceId:sender&&sender.id!=null?String(sender.id):null,
        reason:meta.reason||null,
        spatial:!!meta.spatial,
        point:point(meta.point),
        data:copyData(meta.data),
        recipients:[]
      },
      men=liveRecipients(recipients||sq.members);
    st.current[key]=envelope;
    st.counts.envelopes++;
    st.counts.byCategory[envelope.category]=(st.counts.byCategory[envelope.category]||0)+1;
    for(var i=0;i<men.length;i++){
      planRecipient(st,envelope,men[i],sender,battle);
      envelope.recipients.push(String(men[i].id));
    }
    st.recent.push({
      id:envelope.id,squad:envelope.squad,category:envelope.category,scope:envelope.scope,
      action:envelope.action,version:envelope.version,issuedAt:envelope.issuedAt,
      sourceId:envelope.sourceId,reason:envelope.reason,spatial:envelope.spatial,
      point:envelope.point,data:copyData(envelope.data),recipients:envelope.recipients.slice()
    });
    if(st.recent.length>TUNING.LOG)st.recent.splice(0,st.recent.length-TUNING.LOG);
    return envelope;
  }
  function publicRecord(rec){
    if(!rec)return null;
    var out=Object.assign({},rec);
    delete out.countedAdopted;
    out.data=copyData(rec.data);
    if(rec.point)out.point={x:rec.point.x,z:rec.point.z};
    return out;
  }
  function settle(battle){
    var st=battle&&battle._commandReception;
    if(!ON||!st)return st||null;
    var now=+battle.time||0,ids=Object.keys(st.bySoldier);
    for(var i=0;i<ids.length;i++){
      var id=ids[i],by=st.bySoldier[id],slots=Object.keys(by),
        active=st.adoptedBySoldier[id]||(st.adoptedBySoldier[id]=Object.create(null));
      for(var j=0;j<slots.length;j++){
        var slot=slots[j],rec=by[slot],next=stage(rec,now);
        rec.phase=next;
        if(next==='adopted'&&!rec.countedAdopted){
          rec.countedAdopted=true;
          st.counts.adopted++;
          active[slot]=publicRecord(rec);
        }
      }
    }
    return st;
  }
  function adopted(soldier,battle,category,scope){
    if(!ON||!soldier||!battle)return null;
    var st=settle(battle),by=st&&st.adoptedBySoldier[String(soldier.id)],
      slot=String(category||'command')+'|'+String(scope||'squad');
    return by&&by[slot]?publicRecord(by[slot]):null;
  }
  function snapshot(soldier,battle){
    if(!ON||!soldier||!battle)return null;
    var st=settle(battle),id=String(soldier.id),by=st&&st.bySoldier[id],
      active=st&&st.adoptedBySoldier[id],out={},adoptedOut={};
    if(by)Object.keys(by).forEach(function(k){out[k]=publicRecord(by[k]);});
    if(active)Object.keys(active).forEach(function(k){adoptedOut[k]=publicRecord(active[k]);});
    return{enabled:true,postureAdoption:POSTURE_ON,records:out,adopted:adoptedOut};
  }
  function squadSnapshot(sq,battle){
    if(!ON||!sq||!battle)return null;
    var st=settle(battle),prefix=squadKey(sq)+'|',out=[];
    Object.keys(st.current).forEach(function(k){
      if(k.indexOf(prefix)!==0)return;
      var e=st.current[k];
      out.push({
        id:e.id,category:e.category,scope:e.scope,action:e.action,version:e.version,
        signature:e.signature,issuedAt:e.issuedAt,sourceId:e.sourceId,reason:e.reason,
        spatial:e.spatial,point:e.point,data:copyData(e.data),recipients:e.recipients.slice()
      });
    });
    return out;
  }
  function telemetry(battle){
    if(!ON||!battle)return null;
    var st=settle(battle);
    if(!st)return null;
    var c=st.counts;
    return{
      format:FORMAT,
      behaviorNeutral:!(POSTURE_ON||MOVEMENT_ON),
      postureAdoption:POSTURE_ON,
      movementAdoption:MOVEMENT_ON,
      envelopes:c.envelopes,
      recipients:c.recipients,
      adopted:c.adopted,
      byCategory:Object.assign({},c.byCategory),
      meanPlannedLatency:c.recipients?+(c.latencySum/c.recipients).toFixed(3):0,
      maxPlannedLatency:+c.latencyMax.toFixed(3),
      recent:st.recent.slice(-40)
    };
  }
  function reset(battle){
    if(battle)delete battle._commandReception;
  }

  if(root.BattleModules)root.BattleModules.registerSystem('command-reception',{
    version:'0C-movement-optin',
    onBattleStart:reset,
    onBattleRestart:reset,
    onSimulationStep:settle
  });

  root.BattleCommandReception={
    version:'0C-movement-optin',
    enabled:function(){return ON;},
    postureEnabled:function(){return POSTURE_ON;},
    movementEnabled:function(){return MOVEMENT_ON;},
    tuning:TUNING,
    publish:publish,
    settle:settle,
    adopted:adopted,
    snapshot:snapshot,
    squadSnapshot:squadSnapshot,
    telemetry:telemetry,
    reset:reset
  };
  if(typeof console!=='undefined')console.log('[COMMAND] individual receipt '+(ON?'active':'off')+'; posture '+(POSTURE_ON?'on':'off')+'; movement '+(MOVEMENT_ON?'on':'off'));
})(typeof window!=='undefined'?window:globalThis);
