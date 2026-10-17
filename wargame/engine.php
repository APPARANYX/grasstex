<?php
/* GRASSTEX Commander Ideation Exchange: deterministic, high-level referee.
   This is a qualitative board-game abstraction, NOT the real battle engine.
   No network access, code execution, or autonomous LLM calls. */

function ie_fail($message) { fail_api(400, $message); }
function ie_config($config) {
    if (!is_array($config) || !isset($config['objectives']) || !is_array($config['objectives']) ||
        count($config['objectives']) < 2 || count($config['objectives']) > 8) ie_fail('2-8 configured objectives required');
    $seen = array(); $objectives = array();
    foreach ($config['objectives'] as $o) {
        if (!is_array($o) || !isset($o['id'], $o['x'], $o['z'], $o['points']) ||
            !is_string($o['id']) || !preg_match('/^[a-z][a-z0-9_-]{1,24}$/D',$o['id']) ||
            isset($seen[$o['id']]) ||
            !is_numeric($o['x']) || !is_numeric($o['z']) ||
            (float)$o['x'] < 100 || (float)$o['x'] > 4900 ||
            (float)$o['z'] < 100 || (float)$o['z'] > 4900 ||
            !is_int($o['points']) || $o['points'] < 1 || $o['points'] > 5)
            ie_fail('Invalid objective config');
        $seen[$o['id']] = true;
        $objectives[$o['id']] = array('id'=>$o['id'], 'name'=>isset($o['name'])?substr((string)$o['name'],0,80):$o['id'],
            'x'=>(float)$o['x'],'z'=>(float)$o['z'],'points'=>$o['points'],
            'owner'=>'neutral','streak'=>0,'contested'=>false);
    }
    return $objectives;
}
function ie_world($config) {
    $objectives=ie_config($config);
    $bases=array('us'=>array(array(450,1200),array(550,2500),array(450,3800)),
                 'ge'=>array(array(4550,1200),array(4450,2500),array(4550,3800)));
    $units=array();$trucks=array();$intel=array('us'=>array(),'ge'=>array());
    foreach (array('us','ge') as $side) {
        for ($i=1;$i<=5;$i++) {
            $pos=$bases[$side][($i-1)%3];
            $id=strtoupper($side).'-'.$i;
            $units[$id]=array('id'=>$id,'side'=>$side,'x'=>$pos[0]+($i%2)*30,'z'=>$pos[1],
                'strength'=>10,'mission'=>null,'transport'=>null,'arrived'=>false);
        }
        for ($i=1;$i<=2;$i++) {
            $pos=$bases[$side][$i-1];
            $trucks[$side.'-'.$i]=array('id'=>$side.'-'.$i,'side'=>$side,'x'=>$pos[0],'z'=>$pos[1],
                'squad'=>null,'status'=>'parked');
        }
    }
    return array('objectives'=>$objectives,'units'=>$units,'trucks'=>$trucks,
        'recon_used'=>array('us'=>false,'ge'=>false),'intel'=>$intel,
        'history'=>array(),'clock_minutes'=>0,'outcome'=>'ongoing');
}
function ie_validate_order($order,$side,$turn,$world,$mode) {
    if (!is_array($order) || ($order['side']??null)!==$side ||
        ($order['turn']??null)!==$turn || !is_int($order['turn']) ||
        !isset($order['intent']) || !is_string($order['intent']) ||
        trim($order['intent'])==='' || strlen($order['intent'])>1500)
        ie_fail('Order must include matching side, integer turn and intent');
    $actions=isset($order['actions'])?$order['actions']:array();
    $proposals=isset($order['proposals'])?$order['proposals']:array();
    if (!is_array($actions) || count($actions)>5 || !is_array($proposals) || count($proposals)>5)
        ie_fail('Maximum five squad orders and five proposals');
    $seen=array();
    foreach ($actions as $a) {
        if (!is_array($a) || !isset($a['squad'],$a['type']) ||
            !is_string($a['squad']) || !is_string($a['type']) ||
            !isset($world['units'][$a['squad']]) ||
            $world['units'][$a['squad']]['side']!==$side ||
            isset($seen[$a['squad']]) ||
            !in_array($a['type'],array('move','hold','reserve','transport'),true)) ie_fail('Invalid native squad order');
        if (in_array($a['type'],array('move','transport'),true) &&
            (!isset($a['target']) || !is_string($a['target']) ||
              !isset($world['objectives'][$a['target']]))) ie_fail('Unknown target objective');
        $seen[$a['squad']]=true;
    }
    foreach ($proposals as $p) {
        if (!is_array($p) || !isset($p['name'],$p['reason']) ||
            !is_string($p['name']) || strlen($p['name'])<3 || strlen($p['name'])>120 ||
            !is_string($p['reason']) || strlen($p['reason'])<4 || strlen($p['reason'])>600)
            ie_fail('Proposals must have a short name and reason');
    }
    $support=isset($order['support'])?$order['support']:'none';
    if (!in_array($support,array('none','recon'),true)) ie_fail('Only none/recon support is implemented');
    return array('turn'=>$turn,'side'=>$side,'intent'=>trim($order['intent']),
      'actions'=>$actions,'support'=>$support,'proposals'=>$proposals,
      'contingency'=>isset($order['contingency'])?substr((string)$order['contingency'],0,800):'');
}
function ie_distance($a,$b) {
    return hypot((float)$a['x']-(float)$b['x'],(float)$a['z']-(float)$b['z']);
}
function ie_move(&$u,$goal,$meters) {
    $d=ie_distance($u,$goal);
    if ($d<0.001) return 0.0;
    $step=min((float)$meters,$d);
    $u['x']+=(($goal['x']-$u['x'])/$d)*$step;
    $u['z']+=(($goal['z']-$u['z'])/$d)*$step;
    return $step;
}
function ie_side_view($world,$side) {
    $squads=array();$trucks=array();
    foreach ($world['units'] as $id=>$u) if ($u['side']===$side) $squads[$id]=$u;
    foreach ($world['trucks'] as $id=>$v) if ($v['side']===$side) $trucks[$id]=$v;
    return array('squads'=>$squads,'trucks'=>$trucks,
        'recon_remaining'=>!$world['recon_used'][$side],
        'intel_reports'=>$world['intel'][$side],
        'clock_minutes'=>$world['clock_minutes']);
}
function ie_public_world($world) {
    return array('objectives'=>array_values($world['objectives']),
        'clock_minutes'=>$world['clock_minutes'],
        'outcome'=>$world['outcome']);
}
function ie_resolve(&$g) {
    $w=&$g['world'];
    $turn=$g['turn'];
    $orders=array('us'=>$g['current']['us']['order'],'ge'=>$g['current']['ge']['order']);
    $events=array();$proposals=array();
    // Commit both missions before advancing the same shared abstract clock.
    foreach (array('us','ge') as $side) {
        foreach ($orders[$side]['actions'] as $a) {
            $u=&$w['units'][$a['squad']];
            $u['mission']=array('type'=>$a['type'],'target'=>isset($a['target'])?$a['target']:null);
            $u['arrived']=false;
            unset($u);
        }
        foreach ($orders[$side]['proposals'] as $proposal) {
            $proposals[]=array('side'=>$side,'turn'=>$turn,'name'=>$proposal['name'],
                'reason'=>$proposal['reason'],'status'=>$g['mode']==='native_only'?
                'LOGGED_NO_EFFECT':'PROPOSED_NO_AUTOMATIC_EFFECT');
        }
    }
    $w['clock_minutes']+=10;
    // Gameplay abstraction: foot 800 m/turn; truck up to 2500 m/turn. Truck dismounts
    // around 180 m from an objective; the remaining approach needs foot travel.
    foreach ($w['units'] as $id=>&$u) {
        if (!$u['mission'] || in_array($u['mission']['type'],array('hold','reserve'),true)) continue;
        $target=$u['mission']['target'];
        if (!$target || !isset($w['objectives'][$target])) continue;
        $o=$w['objectives'][$target];$usingTruck=false;$truckId=null;
        if ($u['mission']['type']==='transport') {
            foreach ($w['trucks'] as $vid=>$v) {
                if ($v['side']!==$u['side']) continue;
                if ($v['squad']===$id || ($v['squad']===null && ie_distance($u,$v)<=200)) {
                    $truckId=$vid;break;
                }
            }
            if ($truckId!==null) {
                $w['trucks'][$truckId]['squad']=$id;
                $w['trucks'][$truckId]['status']='moving';
                $usingTruck=true;
            } else {
                $events[]=$id.': transport unavailable within 200 m; using foot movement';
            }
        }
        if ($usingTruck) {
            $dx=$u['x']-$o['x']; $dz=$u['z']-$o['z']; $len=max(0.0001,hypot($dx,$dz));
            $stop=array('x'=>$o['x']+$dx/$len*180,'z'=>$o['z']+$dz/$len*180);
            $distance=ie_move($u,$stop,2500);
            $w['trucks'][$truckId]['x']=$u['x'];$w['trucks'][$truckId]['z']=$u['z'];
            if (ie_distance($u,$stop)<1) {
                $w['trucks'][$truckId]['squad']=null;
                $w['trucks'][$truckId]['status']='parked';
                $u['mission']['type']='move'; // dismount then complete infantry approach next round
                $events[]=$id.': truck dismounted 180 m from '.$target.'; infantry approach pending';
            } else {
                $events[]=$id.': vehicle advance '.(int)$distance.' m toward '.$target;
            }
        } else {
            $distance=ie_move($u,$o,800);
            if (ie_distance($u,$o)<=150) {
                $u['arrived']=true;
                $events[]=$id.': within objective control area of '.$target;
            } else {
                $events[]=$id.': foot advance '.(int)$distance.' m toward '.$target;
            }
        }
    }
    unset($u);
    // Objective occupation is abstract: no weapon/damage simulation.
    // No control transfer when similarly sized forces contest the same objective.
    foreach ($w['objectives'] as $oid=>&$o) {
        $presence=array('us'=>0,'ge'=>0);
        foreach ($w['units'] as $u) if (ie_distance($u,$o)<=150)
            $presence[$u['side']]+=$u['strength'];
        $previous=$o['owner'];$new=$previous;
        if ($presence['us']>0 || $presence['ge']>0) {
            if ($presence['us']>$presence['ge']*1.5) $new='us';
            elseif ($presence['ge']>$presence['us']*1.5) $new='ge';
        }
        $o['contested']=$presence['us']>0 && $presence['ge']>0;
        if ($new!==$previous) {
            $events[]=$o['name'].': abstract control '.$previous.' -> '.$new;
            $o['owner']=$new;$o['streak']=$new==='neutral'?0:1;
        } else if ($new!=='neutral' && !$o['contested']) $o['streak']++;
        else if ($o['contested']) $o['streak']=0;
    }
    unset($o);
    // Recon generates a bounded, rounded, one-time report AFTER movement. It has no automatic
    // renewal: future rounds carry a timestamp and the commander must account for staleness.
    foreach (array('us','ge') as $side) {
        if ($orders[$side]['support']!=='recon') continue;
        if ($w['recon_used'][$side]) {
            $events[]=$side.': aerial reconnaissance denied (already used)';
            continue;
        }
        $w['recon_used'][$side]=true;$contacts=array();
        foreach ($w['units'] as $u) if ($u['side']!==$side) {
            $contacts[]=array('reported_sector_x'=>round($u['x']/500)*500,
                'reported_sector_z'=>round($u['z']/500)*500,'confidence'=>'coarse',
                'observed_turn'=>$turn);
        }
        $w['intel'][$side][]=array('turn'=>$turn,'source'=>'limited_aerial',
            'contacts'=>$contacts,'expires_note'=>'stale next turn; no perfect tracking');
        $events[]=$side.': bounded aerial report delivered privately';
    }
    $control=array('us'=>0,'ge'=>0);
    foreach ($w['objectives'] as $o) if (isset($control[$o['owner']]))
        $control[$o['owner']]+=$o['points'];
    $central=isset($w['objectives']['central'])?$w['objectives']['central']:null;
    $win='ongoing';
    foreach (array('us','ge') as $side) {
        if ($central && $central['owner']===$side && $central['streak']>=2) {
            $other=false;
            foreach ($w['objectives'] as $o) if ($o['id']!=='central' &&
                $o['owner']===$side && $o['streak']>=2) $other=true;
            if ($other) $win=$side;
        }
    }
    if ($turn >= $g['turn_limit'] && $win==='ongoing') {
        $win=$control['us']===$control['ge']?'draw':
            ($control['us']>$control['ge']?'us':'ge');
    }
    $w['outcome']=$win;
    $result=array('turn'=>$turn,'elapsed_minutes'=>$w['clock_minutes'],
       'events'=>$events,'objective_points'=>$control,'outcome'=>$win,
       'note'=>'Fixed-rule abstract referee. No real combat, navigation or kill simulation.');
    $w['history'][]=$result;
    $g['history'][]=array('turn'=>$turn,
        'orders'=>array('us'=>$orders['us'],'ge'=>$orders['ge']),
        'resolution'=>$result,'capabilities'=>$proposals,
        'winner'=>$win,'resolved_at'=>gmdate('c'));
    $g['phase']=$win==='ongoing'?'orders':'complete';
    $g['winner']=$win==='ongoing'?null:$win;
    if ($win==='ongoing') $g['turn']++;
    $g['current']=array('us'=>null,'ge'=>null);
    $g['public_brief']='Round '.$turn.' resolved; objective points US '.$control['us'].
      ' / GE '.$control['ge'].'. Consult the objective board and your faction briefing.';
    return $result;
}
