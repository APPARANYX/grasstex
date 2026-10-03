/* Shared screen-space LOD scaling.

   LOD should track how large an object appears on screen, not whether the browser happens to be on a
   phone or desktop. Existing Grasstex soldier thresholds were tuned at 1080 px vertical resolution
   with Babylon's default 0.8 rad perspective FOV. This helper converts those reference distances to
   the current render height and projection scale, so a larger/narrower view keeps detail farther out
   and a smaller/wider view sheds detail sooner.

   The battle page currently does not opt into device-pixel-ratio scaling, so getRenderHeight() tracks
   the effective canvas resolution rather than blindly treating a Retina phone as a huge desktop. */
(function(root){
  'use strict';
  if(root.BattleScreenSpaceLod)return;

  var REFERENCE_HEIGHT=1080,
    REFERENCE_FOV=.8,
    REFERENCE_Y_SCALE=1/Math.tan(REFERENCE_FOV/2);

  function positive(v,fallback){
    v=+v;
    return isFinite(v)&&v>0?v:fallback;
  }
  function scaleFromMetrics(renderHeight,projectionYScale){
    var h=positive(renderHeight,REFERENCE_HEIGHT),
      y=positive(projectionYScale,REFERENCE_Y_SCALE);
    return h*y/(REFERENCE_HEIGHT*REFERENCE_Y_SCALE);
  }
  function projectionYScale(camera){
    try{
      var p=camera&&camera.getProjectionMatrix&&camera.getProjectionMatrix(),
        m=p&&p.m;
      if(m&&isFinite(+m[5])&&+m[5]>0)return +m[5];
    }catch(_){}
    var fov=camera&&+camera.fov;
    return isFinite(fov)&&fov>0&&fov<Math.PI?1/Math.tan(fov/2):REFERENCE_Y_SCALE;
  }
  function sceneMetrics(scene){
    var engine=scene&&scene.getEngine&&scene.getEngine(),
      camera=scene&&scene.activeCamera,
      height=engine&&engine.getRenderHeight?engine.getRenderHeight():REFERENCE_HEIGHT,
      yScale=projectionYScale(camera);
    return{
      renderHeight:positive(height,REFERENCE_HEIGHT),
      projectionYScale:yScale,
      scale:scaleFromMetrics(height,yScale)
    };
  }
  function scale(scene){
    return sceneMetrics(scene).scale;
  }
  function distance(referenceDistance,scene){
    return positive(referenceDistance,0)*scale(scene);
  }

  root.BattleScreenSpaceLod={
    version:'1.0',
    referenceHeight:REFERENCE_HEIGHT,
    referenceFov:REFERENCE_FOV,
    referenceYScale:REFERENCE_Y_SCALE,
    scaleFromMetrics:scaleFromMetrics,
    projectionYScale:projectionYScale,
    sceneMetrics:sceneMetrics,
    scale:scale,
    distance:distance
  };
  console.log('[LOD] screen-space scaling active: 1080p / 0.8 rad reference');
})(typeof window!=='undefined'?window:globalThis);
