'use strict';
/* No LLM API or browser-side referee. The site stores all state in the PHP backend. */
(function(){
  const el=id=>document.getElementById(id);
  let last=null, template=null, timer=null;
  function status(message,error=false){
    el('message').textContent=message||'';
    el('message').className=error?'error':'good';
  }
  function json(value){return JSON.stringify(value,null,2);}
  function fullURL(op,extras={}){
    const u=new URL('./api.php',location.href);
    u.searchParams.set('op',op);
    for(const [k,v] of Object.entries(extras))u.searchParams.set(k,String(v));
    return u.toString();
  }
  function roleHeaders(){
    const headers={};
    if(el('role').value!=='public')headers['X-Ideation-Key']=el('key').value;
    return headers;
  }
  async function request(op,extras={},payload=null,admin=false){
    const options={cache:'no-store',headers:admin?
      {'Content-Type':'application/json','X-Ideation-Key':el('adminKey').value}:
      Object.assign({'Accept':'application/json'},roleHeaders())};
    if(payload!==null){
      options.method='POST';
      options.headers['Content-Type']='application/json';
      options.body=JSON.stringify(payload);
    }
    const response=await fetch(fullURL(op,extras),options);
    let data;
    try {data=await response.json();} catch (_) {throw Error('Server response was not JSON (HTTP '+response.status+')');}
    if(!response.ok||!data.ok)throw Error(data.error||('HTTP '+response.status));
    return data;
  }
  function render(data){
    last=data;
    el('dashboard').classList.remove('hidden');
    el('matchTitle').textContent=data.title;
    el('phase').textContent=data.phase.toUpperCase()+' · Round '+data.turn+'/'+data.turn_limit;
    el('meta').textContent='Match ID '+data.id+' · Mode '+data.mode+' · Revision '+data.revision+
      (data.winner?' · Result '+data.winner.toUpperCase():'');
    el('publicBrief').textContent=data.public_brief+'\n\n'+json(data.public_world||{});
    const role=el('role').value, privateInfo=role==='us'||role==='ge';
    el('privateTitle').textContent=privateInfo?role.toUpperCase()+' PRIVATE state':'Private state hidden from public';
    el('privateBrief').textContent=privateInfo?
      ((data.private_brief||'')+'\n\n'+json(data.own_state||{})) :
      'Choose US or GE and enter that side’s role key to view its own private briefing.';
    el('rules').textContent=data.rules;
    el('scenario').textContent=data.scenario;
    el('history').textContent=(data.history||[]).length?json(data.history):'No completed rounds yet.';
    el('orderStatus').textContent='US '+(data.submitted?.us?'SEALED':'not submitted')+
      ' · GE '+(data.submitted?.ge?'SEALED':'not submitted')+
      '. Both orders become visible only after automatic resolution.';
    el('currentOrders').textContent=privateInfo&&data.own_pending_order?
      'Your submitted order (sealed):\n'+json(data.own_pending_order):
      'No orders are publicly visible until resolution.';
    const canSubmit=privateInfo&&data.phase==='orders'&&!data.submitted[role];
    el('commander').classList.toggle('hidden',!canSubmit);
    if(canSubmit){
      let prev=null;
      try{prev=JSON.parse(el('orders').value);}catch(_){}
      if(!prev||prev.turn!==data.turn||prev.side!==role) el('orders').value=json({
        turn:data.turn,side:role,intent:'',
        actions:[{squad:role.toUpperCase()+'-1',type:'move',target:'central'}],
        support:'none',proposals:[],contingency:''
      });
    }
  }
  async function load(silent=false){
    const id=el('match').value.trim();
    if(!/^[0-9a-f]{24}$/.test(id)){if(!silent)status('Enter a 24-character match ID.',true);return;}
    const role=el('role').value;
    const op=role==='public'?'public':'brief';
    try{
      const data=await request(op,{id,...(role==='public'?{}:{side:role})});
      render(data);
      if(!silent)status('Match loaded. Latest revision '+data.revision+'.');
      const url=new URL(location.href);url.searchParams.set('id',id);
      history.replaceState(null,'',url.toString());
    }catch(e){if(!silent)status(e.message,true);}
  }
  async function templateLoad(){
    try{
      const data=await request('template');
      template=data.template;
      el('newRules').value=template.rules||'';
      el('newScenario').value=template.scenario||'';
      el('newPublic').value=template.public_brief||'';
      el('newUS').value=template.us_brief||'';
      el('newGE').value=template.ge_brief||'';
      el('newLimit').value=template.turn_limit||8;
      el('newMode').value=template.mode||'discovery';
    }catch(e){status('Could not load site template: '+e.message,true);}
  }
  async function create(){
    try{
      const body={title:el('newTitle').value,turn_limit:Number(el('newLimit').value),
        mode:el('newMode').value,rules:el('newRules').value,
        scenario:el('newScenario').value,public_brief:el('newPublic').value,
        us_brief:el('newUS').value,ge_brief:el('newGE').value,
        config:template.config};
      const data=await request('create',{},body,true);
      el('match').value=data.id;
      el('created').classList.remove('hidden');
      el('createdOutput').textContent=json({match_id:data.id,
        us_key:data.keys.us,ge_key:data.keys.ge,
        public_url:fullURL('public',{id:data.id}),
        browser_url:new URL('./index.html?id='+data.id,location.href).toString()});
      el('key').value='';
      el('role').value='public';
      status('Match created. Save the separate role keys before leaving this screen.');
      await load(true);
    }catch(e){status('Create failed: '+e.message,true);}
  }
  async function submit(){
    if(!last||el('role').value==='public')return;
    const role=el('role').value;
    let order;
    try{order=JSON.parse(el('orders').value);}
    catch(e){status('Orders must be valid JSON: '+e.message,true);return;}
    if(order.turn!==last.turn||order.side!==role){
      status('Order side/turn must match loaded session.',true);return;
    }
    if(!confirm('Seal your '+role.toUpperCase()+' orders for round '+last.turn+
      '? They cannot be edited.'))return;
    try{
      const data=await request('submit',{},{
        id:last.id,turn:last.turn,side:role,order});
      status(data.resolved?'Both orders sealed; deterministic referee resolved the round.':
        'Your order is sealed. Awaiting the other commander.');
      el('orders').value='';
      await load(true);
    }catch(e){status('Submission failed: '+e.message,true);}
  }
  function packet(){
    if(!last){status('Load a match first.',true);return;}
    const role=el('role').value;
    const data={guide:'GRASSTEX hypothetical board-game benchmark. Your action is to produce JSON orders only. Do not infer hidden opponent information.',
      match_id:last.id,round:last.turn,role:role==='public'?'spectator':role,
      mode:last.mode,rules:last.rules,scenario:last.scenario,
      public_brief:last.public_brief,public_world:last.public_world,
      past_resolved_rounds:last.history,
      ...(role==='us'||role==='ge'?{
        own_private_brief:last.private_brief,own_state:last.own_state,
        own_pending_order:last.own_pending_order
      }:{}),
      order_format:{turn:last.turn,side:role==='public'?'us or ge':role,
        intent:'...',actions:[{squad:'US-1',type:'move',target:'central'}],
        support:'none',proposals:[{name:'Missing game action',reason:'Why needed'}],
        contingency:'...'},
      command_types:['move','transport','hold','reserve'],
      target_ids:Object.keys(last.public_world?.objectives||{}).length?
        last.public_world.objectives.map(o=>o.id):['central','north','south'],
      special:'Proposed actions have NO referee effect yet; they are recorded as capability ideas. Both factions submit independently.'};
    navigator.clipboard.writeText(json(data)).then(()=>status('Faction-safe briefing copied. Paste into your AI chat.'))
      .catch(()=>status('Clipboard unavailable; copy the briefing from the panels instead.',true));
  }
  el('load').addEventListener('click',()=>load());
  el('role').addEventListener('change',()=>{last=null;el('dashboard').classList.add('hidden');
    el('commander').classList.add('hidden');if(el('match').value)load();});
  el('copyPacket').addEventListener('click',packet);
  el('submit').addEventListener('click',submit);
  el('create').addEventListener('click',create);
  const urlid=new URL(location.href).searchParams.get('id');
  if(urlid&&/^[0-9a-f]{24}$/.test(urlid))el('match').value=urlid;
  templateLoad();
  if(urlid)load();
  timer=setInterval(()=>{if(last&&el('dashboard').offsetParent!==null)load(true);},12000);
})();
