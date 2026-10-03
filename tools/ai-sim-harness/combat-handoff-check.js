#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),H=require('./harness');
H.resetIds();const r=H.bootstrap(),b=H.makeBattle(r,{seed:+(process.env.HARNESS_SEED||12345)});
const q=H.addSquad(r,b,{id:'us-3',faction:'us',x:0,z:0,objective:{x:0,z:100}}),s=q.members[1],E=r.BattleEngagement,e=E.stateOf(s);
assert.equal(E.parseCombatHandoff('?combatHandoff=0'),false);assert.equal(E.parseCombatHandoff(''),true);
q.state='advance';q.inContact=false;q.contact=null;s.target=null;e.state='alert';e.engaged=true;e.until=100;
b.time=1;E.updateSoldier(s,b);assert.equal(e.engaged,true);assert.equal(e.handoffQuietSince,1);
b.time=2;E.updateSoldier(s,b);assert.equal(e.engaged,true,'one quiet tick cannot yield combat movement');
q.inContact=true;b.time=2.2;E.updateSoldier(s,b);assert.equal(e.engaged,true);assert.equal(e.handoffQuietSince,null,'renewed squad contact cancels the handoff clock');
q.inContact=false;b.time=3;E.updateSoldier(s,b);assert.equal(e.handoffQuietSince,3);
b.time=5.4;E.updateSoldier(s,b);assert.equal(e.engaged,true,'2.4 seconds quiet is still Micro-owned');
b.time=5.6;E.updateSoldier(s,b);assert.equal(e.engaged,false,'continuous quiet releases movement after the bounded handoff');
console.log('PASS US-3-style Micro to formation handoff requires continuous quiet');
