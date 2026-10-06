/* Tactical symbol catalog for the operator overlay.

   Deliberately declarative: adding a new formation type is data, not renderer surgery. Unit modules
   may either set squad.tacticalSymbol directly or declare tacticalSymbol on their BattleModules
   unit-type spec. Geometry is expressed with a small SVG primitive schema consumed by module 41.

   Historical provenance is per symbol. Only marks with verifiedHistorical:true should be described
   to players as period-authentic; the others are readable starter marks ready to be replaced by a
   faction/era-specific researched variant without changing the overlay. */
(function(root){
  'use strict';
  if(!root.BattleModules || !root.BattleModules.registerTacticalSymbol || root.BattleTacticalSymbols)return;

  function reg(id,spec){
    spec=spec||{};
    spec.version=spec.version||'1.0';
    root.BattleModules.registerTacticalSymbol(id,spec);
    return spec;
  }
  function rectFrame(){
    return {tag:'rect',attrs:{x:-27,y:-16,width:54,height:32,rx:1.5,'class':'sso-frame'}};
  }
  function path(d,cls){return {tag:'path',attrs:{d:d,'class':cls||'sso-symbol-stroke'}};}
  function circle(cx,cy,r,cls){return {tag:'circle',attrs:{cx:cx,cy:cy,r:r,'class':cls||'sso-symbol-stroke'}};}
  function ellipse(cx,cy,rx,ry,cls){return {tag:'ellipse',attrs:{cx:cx,cy:cy,rx:rx,ry:ry,'class':cls||'sso-symbol-stroke'}};}
  function textGlyph(value,size){
    return {tag:'text',attrs:{x:0,y:5,'class':'sso-symbol-text','font-size':size||13},text:value};
  }

  reg('infantry',{
    label:'Infantry',
    domain:'ground',
    verifiedHistorical:true,
    historicalBasis:'U.S. War Department FM 21-30 (1941): infantry X in unit frame; squad echelon dot above',
    frame:rectFrame(),
    primitives:[path('M-24 -13 L24 13 M24 -13 L-24 13')],
    echelon:{kind:'dots',count:1,y:-22}
  });

  reg('airborne-infantry',{
    label:'Airborne infantry',
    domain:'ground',
    verifiedHistorical:false,
    historicalBasis:'Reference-derived starter mark; replace with researched faction/era variant before claiming period authenticity',
    frame:rectFrame(),
    primitives:[
      path('M-24 -13 L24 13 M24 -13 L-24 13'),
      path('M-9 12 Q0 2 9 12 M-5 12 Q0 7 5 12')
    ],
    echelon:{kind:'dots',count:1,y:-22}
  });

  reg('machine-gun',{
    label:'Machine-gun team',
    domain:'ground',
    verifiedHistorical:false,
    historicalBasis:'Reference-derived starter mark',
    frame:rectFrame(),
    primitives:[textGlyph('MG',13)],
    echelon:{kind:'dots',count:1,y:-22}
  });

  reg('mortar',{
    label:'Mortar team',
    domain:'ground',
    verifiedHistorical:false,
    historicalBasis:'Reference-derived starter mark',
    frame:rectFrame(),
    primitives:[
      path('M0 10 L0 -10 M-6 -4 L0 -10 L6 -4'),
      circle(0,9,3,'sso-symbol-fill')
    ],
    echelon:{kind:'dots',count:1,y:-22}
  });

  reg('engineer',{
    label:'Engineer / sapper',
    domain:'ground',
    verifiedHistorical:false,
    historicalBasis:'Reference-derived starter mark',
    frame:rectFrame(),
    primitives:[path('M-11 8 L-11 -3 L11 -3 L11 8 M-7 -3 L-7 3 M7 -3 L7 3')],
    echelon:{kind:'dots',count:1,y:-22}
  });

  reg('sniper',{
    label:'Sniper / marksman team',
    domain:'ground',
    verifiedHistorical:false,
    historicalBasis:'Readable placeholder; no universal WWII sniper formation mark is asserted here',
    frame:rectFrame(),
    primitives:[
      circle(0,0,8),
      path('M-13 0 L13 0 M0 -13 L0 13')
    ],
    echelon:{kind:'dots',count:1,y:-22}
  });

  reg('armor',{
    label:'Armor',
    domain:'ground',
    verifiedHistorical:false,
    historicalBasis:'Reference-derived armored-unit starter mark',
    frame:rectFrame(),
    primitives:[ellipse(0,0,17,9)],
    echelon:{kind:'dots',count:1,y:-22}
  });

  reg('artillery',{
    label:'Artillery',
    domain:'ground',
    verifiedHistorical:false,
    historicalBasis:'Readable placeholder pending weapon/faction-specific historical mark',
    frame:rectFrame(),
    primitives:[
      circle(0,6,4,'sso-symbol-fill'),
      path('M0 2 L0 -11 M-7 -5 L0 -11 L7 -5')
    ],
    echelon:{kind:'dots',count:1,y:-22}
  });

  reg('aircraft',{
    label:'Aircraft',
    domain:'air',
    verifiedHistorical:false,
    historicalBasis:'Screen-readable aircraft silhouette; not asserted as a WWII ground-map formation symbol',
    frame:null,
    primitives:[
      path('M0 -15 L4 -3 L20 2 L20 6 L4 4 L3 14 L9 18 L9 21 L0 18 L-9 21 L-9 18 L-3 14 L-4 4 L-20 6 L-20 2 L-4 -3 Z','sso-symbol-fill')
    ],
    echelon:{kind:'dots',count:1,y:-25}
  });

  function resolveId(entity){
    if(!entity)return 'infantry';
    var explicit=entity.tacticalSymbol||entity.symbolType;
    if(explicit && root.BattleModules.getTacticalSymbol(explicit))return String(explicit);
    var unitType=entity.unitType||entity.type;
    if(unitType){
      var unitSpec=root.BattleModules.getUnitType&&root.BattleModules.getUnitType(unitType);
      if(unitSpec&&unitSpec.tacticalSymbol&&root.BattleModules.getTacticalSymbol(unitSpec.tacticalSymbol))
        return String(unitSpec.tacticalSymbol);
      if(root.BattleModules.getTacticalSymbol(unitType))return String(unitType);
    }
    return 'infantry';
  }
  function resolve(entity){
    var id=resolveId(entity);
    return root.BattleModules.getTacticalSymbol(id)||root.BattleModules.getTacticalSymbol('infantry');
  }

  root.BattleTacticalSymbols={
    version:'1.0',
    resolveId:resolveId,
    resolve:resolve,
    get:function(id){return root.BattleModules.getTacticalSymbol(id);},
    list:function(){return root.BattleModules.listTacticalSymbols();},
    register:function(id,spec){return root.BattleModules.registerTacticalSymbol(id,spec);}
  };
  root.GTLog('[UI] tactical symbol catalog active: '+root.BattleModules.listTacticalSymbols().length+' symbol types');
})(typeof window!=='undefined'?window:globalThis);
