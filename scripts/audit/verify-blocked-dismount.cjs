/* Reuse the existing fixture unchanged; expose its local make() for one liveness experiment. */
const fs=require('node:fs'),Module=require('node:module'),path=require('node:path'),assert=require('node:assert/strict');
const file=path.resolve('tools/ai-sim-harness/strategic-transport-check.js');
const fixture=new Module(file,module);fixture.filename=file;fixture.paths=Module._nodeModulePaths(path.dirname(file));
fixture._compile(fs.readFileSync(file,'utf8')+'\nmodule.exports={make};',file);
const a=fixture.exports.make('strategic','?motorTransport=1&truckAccess=1');
const mission=a.brief();assert(a.api.considerMission(a.sim,a.squad,mission));mission.status='executing';
for(let i=0;i<800&&a.squad._transport.phase==='boarding';i++)a.run(.15);
assert.equal(a.squad._transport.phase,'embarked');
a.api.finish(a.sim,a.squad,'arrival');a.walls.after=-Infinity;
const start=a.sim.time;a.run(600);
const blocked={elapsed:a.sim.time-start,phase:a.squad._transport.phase,exited:a.squad._transport.exitedIds.length,passengers:a.members.filter(s=>a.api.isPassenger(s)).length,vehicle:a.api.fleetSummary(a.sim).find(v=>v.id===a.squad._transport.vehicleId)};
assert.equal(blocked.phase,'disembarking');assert.equal(blocked.exited,0);assert.equal(blocked.passengers,10);
a.walls.after=Infinity;a.run(60);
const recovered={phase:a.squad._transport.phase,passengers:a.members.filter(s=>a.api.isPassenger(s)).length};
assert.equal(recovered.phase,'dismounted');assert.equal(recovered.passengers,0);
fs.writeFileSync('docs/audits/2026-10-20-grasstex/runtime-verification/artifacts/blocked-dismount.json',JSON.stringify({fixture:'shipping transport; stub navigation rejects all exits for 600s, then permits them',query:'?motorTransport=1&truckAccess=1',blocked,recovered},null,2));
console.log('REPRO blocked dismount persists for 600s; removing obstruction recovers without leaked passengers.');
