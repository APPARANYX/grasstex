#!/usr/bin/env node
'use strict';
const H=require('./harness'),SEED=12345,MIN_GAP=5;
function arm(search){
  H.resetIds();const root=H.bootstrap({search}),battle=H.makeBattle(root,{obstacles:[],seed:SEED});
  const us=H.addSquad(root,battle,{id:'us-0',faction:'us',x:0,z:-60,objective:{x:0,z:60},facing:0,seed:SEED});
  H.addSquad(root,battle,{id:'ge-0',faction:'ge',x:0,z:60,objective:{x:0,z:-60},facing:Math.PI,seed:SEED+1});
  const out={samples:0,close:0,min:Infinity};
  H.run(root,battle,40,()=>{
    if(battle.time<=2)return;
    const o=us._fireteamOrders||{},keys=Object.keys(o).filter(k=>o[k]&&o[k].anchor&&us.members.some(s=>!s.dead&&s._fireteamKey===k));
    for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){const a=o[keys[i]].anchor,b=o[keys[j]].anchor,d=Math.hypot(a.x-b.x,a.z-b.z);out.samples++;if(d<MIN_GAP)out.close++;out.min=Math.min(out.min,d);}
  });
  out.rate=out.samples?out.close/out.samples:0;return out;
}
const on=arm(''),off=arm('?combatHandoff=0');
console.log('combat-handoff frontage AB '+JSON.stringify({on,off}));
