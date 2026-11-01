/* Read-only exposed-region geometry witness for exact-seed causal investigations.
 * The shipping ballistic gate is NEVER invoked by this observer. */
(function (root) {
  'use strict';
  var params = new URLSearchParams(root.location.search || '');
  var ids = (params.get('probeIds') || '').split(',').filter(Boolean);
  var squads = (params.get('probeSquads') || '').split(',').filter(Boolean);
  var side = params.get('probeSide') || 'all';
  var events = [], MAX = 500, last = {};
  function r(n) { return +(+n).toFixed(3); }
  function vec(p) { return { x:r(p.x), y:r(p.y), z:r(p.z) }; }
  function firstTerrain(o, a, sim) {
    var n = 192, prev = null, worst = -Infinity, point = null;
    for (var i = 1; i <= n; i++) {
      var f = i / n, x = o.x + (a.x-o.x)*f, z = o.z + (a.z-o.z)*f;
      var y = o.y + (a.y-o.y)*f, h = sim.heightAt(x,z) + 0.08, depth = h-y;
      if (depth > worst) { worst = depth; point = { x:r(x), y:r(y), z:r(z), terrainY:r(h), fraction:r(f) }; }
      if (prev === null && depth >= 0) prev = { x:r(x), y:r(y), z:r(z), terrainY:r(h), fraction:r(f) };
    }
    return { blocked:!!prev, first:prev, maxIntrusion:r(worst), closest:point };
  }
  function candidate(o,e,s,sim,zone,fx,fy,fz) {
    var aim = {x:e.cx+fx*e.rx,y:e.cy+fy*e.ry,z:e.cz+fz*e.rz};
    return {zone:zone,aim:vec(aim),terrain:firstTerrain(o,aim,sim)};
  }
  (root.BattleProbes=root.BattleProbes||{})['crest-geometry'] = {
    every:0.3,
    start:function(){ events=[]; last={}; },
    sample:function(sim) {
      var B=root.BattleBallistics;
      if(!B || !B.muzzleOrigin || !B.bodyShape) return;
      var units=root.BattleModules.unitsFor(sim);
      for(var i=0;i<units.length;i++){
        var s=units[i];
        if(!s || s.dead || !s.root || !s.target || s.target.dead ||
          (side!=='all' && side!==s.faction) ||
          (ids.length && ids.indexOf(String(s.id))<0) ||
          (squads.length && (!s.squad || squads.indexOf(String(s.squad.id))<0))) continue;
        var counter=+s._crestBlockedFire||0, key=s.faction+':'+s.id+'>'+s.target.id;
        if(counter <= (last[key]||0)) { last[key]=counter; continue; }
        last[key]=counter;
        if(events.length>=MAX) continue;
        var target=s.target, origin=B.muzzleOrigin(s,target,sim),shape=B.bodyShape(target,sim);
        var aims=[
          candidate(origin,shape,s,sim,'center',0,0,0),
          candidate(origin,shape,s,sim,'upper-torso',0,0.45,0),
          candidate(origin,shape,s,sim,'shoulder',0,0.72,0),
          candidate(origin,shape,s,sim,'upper-body',0,0.9,0)
        ];
        var p=s.root.position, t=target.root.position;
        events.push({t:r(sim.time),actor:s.faction+':'+s.id,target:target.faction+':'+target.id,
          stance:root.SquadAI.stanceOf?root.SquadAI.stanceOf(s):null,
          origin:vec(origin), shooterGround:r(sim.heightAt(p.x,p.z)),
          targetGround:r(sim.heightAt(t.x,t.z)), shape:shape,
          range:r(Math.hypot(p.x-t.x,p.z-t.z)),crestRejects:counter,
          regions:aims});
      }
    },
    report:function(){return {schema:'crest-geometry-v1',events:events,omitted:Math.max(0,Object.keys(last).length-events.length)};}
  };
})(window);
