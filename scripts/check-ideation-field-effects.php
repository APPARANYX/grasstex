<?php
// Deterministic field-object effect checks. No real battle runtime required.
function fail_api($code,$message) { throw new RuntimeException($message); }
require __DIR__.'/../wargame/engine.php';
function check($condition,$message) {
    if (!$condition) throw new RuntimeException($message);
}
$wire=array('kind'=>'wire','side'=>'ge','x'=>200,'z'=>0,'created_turn'=>1);
$roadblock=array('kind'=>'roadblock','side'=>'ge','x'=>200,'z'=>0,'created_turn'=>1);
$mine=array('kind'=>'minefield','side'=>'ge','x'=>200,'z'=>0,'created_turn'=>1);
$fort=array('kind'=>'fortification','side'=>'us','x'=>100,'z'=>0,'created_turn'=>1);
$smoke=array('kind'=>'smoke','side'=>'ge','x'=>100,'z'=>0,'created_turn'=>1);
$unit=array('id'=>'US-1','side'=>'us','x'=>0,'z'=>0,'strength'=>10);
$goal=array('x'=>800,'z'=>0);
check(ie_field_stats('minefield')['damage_strength']===1,'Mine strength point mismatch');
check(ie_field_stats('wire')['blocks_fire']===false,'Do not claim projectile LOS');
check(!ie_field_active($wire,1) && ie_field_active($wire,2),'Construction activates next turn');
check(ie_field_speed(array('field_objects'=>array($wire)),$unit,$goal,800,2,false)===400,
    'Enemy wire should halve crossing foot speed');
check(ie_field_speed(array('field_objects'=>array($wire)),$unit,$goal,800,1,false)===800,
    'Wire must not work on its creation turn');
check(ie_field_speed(array('field_objects'=>array($wire)),$unit,$goal,800,2,true)===800,
    'Wire must not slow vehicles');
check(ie_field_speed(array('field_objects'=>array($roadblock)),$unit,$goal,2500,2,true)===1250,
    'Roadblock should halve vehicle movement');
check(ie_field_speed(array('field_objects'=>array($roadblock)),$unit,$goal,800,2,false)===800,
    'Roadblock must not slow infantry');
$world=array('field_objects'=>array('F-0001'=>$mine),
    'units'=>array('US-1'=>array('id'=>'US-1','side'=>'us','x'=>500,'z'=>0,'strength'=>10)));
$events=array();
$prior=array('US-1'=>$unit);
ie_field_damage($world,2,$prior,$events);
check($world['units']['US-1']['strength']===9,'Crossing minefield must cost one strength point');
ie_field_damage($world,3,$prior,$events);
check($world['units']['US-1']['strength']===9,'Same squad cannot retrigger same field');
$world['units']['US-1']['strength']=10;
$world['field_objects']['F-0001']['side']='us';
$world['field_triggers']=array();
ie_field_damage($world,2,$prior,$events);
check($world['units']['US-1']['strength']===10,'Friendly minefield must not damage own side');
$objective=array('x'=>100,'z'=>0);
$world['field_objects']=array($fort,$smoke);
check(ie_field_defense($world,$unit,$objective,2)===1,'Friendly fortification protects');
$world['field_objects']=array($smoke);
check(ie_field_defense($world,$unit,$objective,2)===1,'Smoke protects either side');
check(!ie_field_active($smoke,4),'Smoke expires after two turns');
check(ie_field_stats('other')['effect']==='information','Unclassified marker has no effect');
echo "Field effects: PASS\n";
