<?php
/* Fixed referee regression: V1 siege stalemate preserved; V2 resolves a 50:40
   contest by symmetric abstract attrition and sustained control pressure. */
function fail_api($status,$msg) { throw new Exception($msg); }
require __DIR__ . '/../wargame/engine.php';
function check($v,$msg) { if (!$v) throw new Exception($msg); }
function match_state($v2) {
    $world=ie_world(array('objectives'=>array(
      array('id'=>'central','x'=>2500,'z'=>2500,'points'=>3),
      array('id'=>'north','x'=>2500,'z'=>3750,'points'=>1),
      array('id'=>'south','x'=>2500,'z'=>1250,'points'=>1)
    )));
    foreach ($world['units'] as $id=>&$u) {
        if ($u['side']==='us' || $id!=='GE-5') {
            $u['x']=2500;$u['z']=2500;
        }
    }
    unset($u);
    $world['objectives']['central']['owner']='ge';
    return array('world'=>$world,'turn'=>1,'turn_limit'=>15,
      'phase'=>'orders','history'=>array(),'mode'=>'discovery',
      'winner'=>null,'rules_revision'=>$v2?2:1,
      'current'=>array('us'=>null,'ge'=>null));
}
function step(&$g) {
    foreach (array('us','ge') as $side) $g['current'][$side]=array('order'=>array(
      'side'=>$side,'turn'=>$g['turn'],'intent'=>'Hold the contested junction',
      'actions'=>array(),'support'=>'none','proposals'=>array()));
    return ie_resolve($g);
}
$v1=match_state(false);
step($v1);step($v1);
check($v1['world']['objectives']['central']['owner']==='ge',
    'V1 unexpectedly changed historic contested owner');
check($v1['world']['units']['GE-1']['strength']===10,
    'V1 strength must not be reduced retroactively');

$v2=match_state(true);
$r1=step($v2);
check($v2['world']['objectives']['central']['owner']==='ge',
    'V2 should require sustained pressure, not switch on first contested turn');
check($v2['world']['objectives']['central']['siege_turns']===1,
    'V2 siege should record one contested round');
$r2=step($v2);
check($v2['world']['objectives']['central']['owner']==='us',
    'V2 should break 40 defenders against 50 attackers after sustained pressure');
check($v2['world']['units']['GE-1']['strength']<10,
    'V2 must reduce some defender effectiveness');
check($v2['world']['units']['US-1']['strength']<10,
    'V2 must reduce some attacker effectiveness');
check($r2['objective_points']['us']===3,'V2 should score central for the challenger');
check($v2['history'][1]['world_snapshot']['objectives']['central']['owner']==='us',
    'V2 private replay snapshot must preserve resolved owner');
// A neutral contested junction at 50:40 must NOT be frozen forever in V5.
// V1 stays unchanged and V2 retains its historical threshold.
$v2neutral=match_state(true);
$v2neutral['world']['objectives']['central']['owner']='neutral';
step($v2neutral);step($v2neutral);
check($v2neutral['world']['objectives']['central']['owner']==='neutral',
    'V2 neutral objective behavior changed retroactively');
$v5=match_state(true);
$v5['rules_revision']=5;
$v5['world']['objectives']['central']['owner']='neutral';
$r1=step($v5);
check($v5['world']['objectives']['central']['owner']==='neutral',
    'V5 neutral contested objective must not change after one close contest');
check($v5['world']['objectives']['central']['siege_side']==='us' &&
    $v5['world']['objectives']['central']['siege_turns']===1,
    'V5 must track neutral contested majority without revealing private movement');
$r2=step($v5);
check($v5['world']['objectives']['central']['owner']==='us',
    'V5 must capture neutral contested objective after two superior rounds');
check($v5['world']['units']['GE-1']['strength']<10 &&
    $v5['world']['units']['US-1']['strength']<10,
    'V5 contested attrition must apply to both factions');
check($r2['objective_points']['us']===3,
    'V5 neutral contested objective must score correctly');
echo "PASS: V1 frozen, V2 frozen, V5 neutral siege, balanced attrition and snapshots\n";
