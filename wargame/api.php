<?php
/*
 * GRASSTEX Commander Ideation Exchange V1.
 * Shared-hosting PHP/JSON thought-game; no calls to real battle simulation or LLM APIs.
 * The hosting site is canonical for rules, scenario, orders, private briefs and history.
 */
require_once __DIR__.'/engine.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex');
header('Referrer-Policy: no-referrer');

function reply($status, $data) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function fail_api($code, $message) { reply($code, array('ok'=>false, 'error'=>$message)); }
function is_object_arr($x) { return is_array($x) && (!array_key_exists(0,$x) || count($x)===0); }
function limited($val, $max, $label, $required=true) {
    if (!is_string($val) || strlen($val)>$max || ($required && trim($val)==='')) fail_api(400,'Invalid '.$label);
    return trim($val);
}
function host_key() {
    $path = dirname(__DIR__).'/state/ideation-admin-key.php';
    $secret = is_file($path) ? @include $path : null;
    if (!is_string($secret) || strlen($secret)<24) fail_api(503,'Match creation disabled: install server-only admin password hash');
    return trim($secret);
}
function match_secret($secret,$stored) {
    if (!is_string($secret) || $secret==='') return false;
    if (strlen($stored)===64 && ctype_xdigit($stored))
        return hash_equals(strtolower($stored), hash('sha256',$secret));
    return password_verify($secret,$stored);
}
function header_key() {
    $key = isset($_SERVER['HTTP_X_IDEATION_KEY']) ? $_SERVER['HTTP_X_IDEATION_KEY'] : '';
    if (!is_string($key) || strlen($key)>256) fail_api(401,'Valid X-Ideation-Key required');
    return $key;
}
function check_role($g,$role) {
    if (!in_array($role,array('us','ge'),true)) fail_api(400,'Invalid role');
    $stored=isset($g['key_hashes'][$role])?$g['key_hashes'][$role]:'';
    if (!is_string($stored) || !match_secret(header_key(),$stored)) fail_api(401,'Invalid role key');
}
function check_admin() {
    if (!match_secret(header_key(),host_key())) fail_api(401,'Invalid administrator key');
}
function public_events($events,$side=null) {
    $safe=array();
    foreach ((array)$events as $event) {
        if (!is_string($event)) continue;
        if (preg_match('/^(US|GE)-[0-9]+:/', $event, $m)) {
            if ($side===null || strtoupper($side)!==$m[1]) continue;
        } elseif (preg_match('/^(us|ge):/', $event, $m)) {
            if ($side===null || $side!==$m[1]) continue;
        }
        $safe[]=$event;
    }
    return $safe;
}
function history_for($g,$side=null,$admin=false) {
    $history=array();
    foreach ($g['history'] as $round) {
        $r=isset($round['resolution']) && is_array($round['resolution'])?$round['resolution']:array();
        // All pre-V2 historical events and orders MUST pass through this filter too.
        $r['events']=public_events(isset($r['events'])?$r['events']:array(),$admin?'all':$side);
        if ($admin) $r['events']=isset($round['resolution']['events'])?$round['resolution']['events']:array();
        $item=array('turn'=>$round['turn'],'resolution'=>$r,
            'capabilities'=>array_values(array_filter(
                isset($round['capabilities'])?$round['capabilities']:array(),
                function($cap)use($side,$admin){
                    if ($admin) return true;
                    return $side!==null && isset($cap['side']) && $cap['side']===$side;
                })),
            'winner'=>isset($round['winner'])?$round['winner']:null,
            'resolved_at'=>isset($round['resolved_at'])?$round['resolved_at']:null);
        // A commander sees only its own complete orders. Never publish enemy missions
        // just because a round resolved: planned travel may span several more turns.
        if ($side!==null && $side!=='all' && isset($round['orders'][$side]))
            $item['own_order']=$round['orders'][$side];
        if ($admin) {
            $item['orders']=isset($round['orders'])?$round['orders']:array();
            if (isset($round['world_snapshot'])) $item['world_snapshot']=$round['world_snapshot'];
        }
        if (isset($round['public_snapshot'])) $item['public_snapshot']=$round['public_snapshot'];
        $history[]=$item;
    }
    return $history;
}
function json_body() {
    $raw=file_get_contents('php://input');
    if (!is_string($raw) || strlen($raw)<2 || strlen($raw)>90000) fail_api(400,'Invalid request size');
    $body=json_decode($raw,true);
    if (!is_object_arr($body)) fail_api(400,'JSON object required');
    return $body;
}
function storage_dir() {
    $dir=dirname(__DIR__).'/state/ideation-v1';
    if (!is_dir($dir) && !@mkdir($dir,0700,true)) fail_api(503,'Private state storage unavailable');
    // Defense in depth. Records also contain a PHP execution guard, never plain JSON.
    $deny=$dir.'/.htaccess';
    if (!is_file($deny)) @file_put_contents($deny,"Require all denied\nDeny from all\n",LOCK_EX);
    return $dir;
}
function game_path($id) {
    if (!is_string($id) || !preg_match('/^[a-f0-9]{24}$/D',$id)) fail_api(400,'Invalid match id');
    return storage_dir().'/'.$id.'.php';
}
function encode_game($g) {
    $encoded=json_encode($g,JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if (!is_string($encoded) || strlen($encoded)>1500000) fail_api(413,'Match state too large');
    return "<?php http_response_code(404); exit; ?>\n".$encoded;
}
function decode_game($raw) {
    $prefix="<?php http_response_code(404); exit; ?>\n";
    if (substr($raw,0,strlen($prefix))!==$prefix) fail_api(500,'Invalid private game format');
    $g=json_decode(substr($raw,strlen($prefix)),true);
    if (!is_array($g) || !isset($g['id']) || !isset($g['turn'])) fail_api(500,'Invalid private match state');
    return $g;
}
function with_game($id,$mutator) {
    $f=@fopen(game_path($id),'r+');
    if (!$f) fail_api(404,'Match not found');
    if (!flock($f,LOCK_EX)) { fclose($f); fail_api(503,'Unable to lock match'); }
    rewind($f);
    $g=decode_game(stream_get_contents($f));
    $result=$mutator($g);
    if (isset($result['updated']) && $result['updated']) {
        $serialized=encode_game($g);
        rewind($f);
        if (fwrite($f,$serialized)!==strlen($serialized) || !ftruncate($f,strlen($serialized))) {
            flock($f,LOCK_UN);fclose($f);fail_api(500,'Could not save match');
        }
        fflush($f);
    }
    flock($f,LOCK_UN);fclose($f);
    return $result['body'];
}
function public_game($g,$side=null,$admin=false) {
    $count=array('us'=>$g['current']['us']!==null,'ge'=>$g['current']['ge']!==null);
    return array('ok'=>true,'id'=>$g['id'],'title'=>$g['title'],'rules'=>$g['rules'],
        'scenario'=>$g['scenario'],'mode'=>$g['mode'],'turn_limit'=>$g['turn_limit'],
        'turn'=>$g['turn'],'phase'=>$g['phase'],'winner'=>$g['winner'],
        'public_brief'=>$g['public_brief'],'submitted'=>$count,
        'current_orders'=>null,'public_world'=>ie_public_world($g['world']),
        'history'=>history_for($g,$side,$admin),'revision'=>$g['revision'],
        'updated_at'=>$g['updated_at']);
}
function request_value($body,$field,$max,$required=true) {
    return limited(isset($body[$field])?$body[$field]:'',$max,$field,$required);
}
function validate_turn($g,$body) {
    $turn=isset($body['turn'])?intval($body['turn']):0;
    if ($turn!==$g['turn']) fail_api(409,'Turn mismatch; refresh match');
}
function valid_origin() {
    $origin=isset($_SERVER['HTTP_ORIGIN'])?$_SERVER['HTTP_ORIGIN']:'';
    if ($origin==='') return; // Non-browser API clients, protected by bearer role/admin keys.
    $site=isset($_SERVER['HTTP_HOST'])?explode(':',$_SERVER['HTTP_HOST'])[0]:'';
    if (!is_string($site) || strcasecmp((string)parse_url($origin,PHP_URL_HOST),$site)!==0)
        fail_api(403,'Cross-origin writes disabled');
}
$method=isset($_SERVER['REQUEST_METHOD'])?$_SERVER['REQUEST_METHOD']:'GET';
$op=isset($_GET['op'])?strval($_GET['op']):'public';
if ($method==='GET') {
    if ($op==='template') {
        $tpl=json_decode(@file_get_contents(__DIR__.'/scenario.json'),true);
        if (!is_array($tpl)) fail_api(500,'Missing scenario template');
        reply(200,array('ok'=>true,'template'=>$tpl));
    }
    $id=isset($_GET['id'])?$_GET['id']:'';
    if ($op==='public') reply(200,with_game($id,function(&$g){
        return array('body'=>public_game($g));
    }));
    if ($op==='brief') {
        $role=isset($_GET['side'])?$_GET['side']:'';
        reply(200,with_game($id,function(&$g)use($role){
            if (!in_array($role,array('us','ge'),true)) fail_api(400,'Invalid side');
            check_role($g,$role);
            $public=public_game($g,$role);
            $public['side']=$role;
            $public['private_brief']=$g['private_briefs'][$role];
            $public['own_state']=ie_side_view($g['world'],$role);
            $public['own_pending_order']=$g['current'][$role]===null?null:$g['current'][$role]['order'];
            return array('body'=>$public);
        }));
    }
    if ($op==='observer') reply(200,with_game($id,function(&$g){
        check_admin();
        $data=public_game($g,null,true);
        $data['observer_world']=$g['world'];
        return array('body'=>$data);
    }));
    fail_api(404,'Unknown GET operation');
}
if ($method!=='POST') fail_api(405,'GET or POST required');
valid_origin();
$body=json_body();
if ($op==='create') {
    if (!match_secret(header_key(),host_key())) fail_api(401,'Invalid match administrator key');
    $tpl=json_decode(@file_get_contents(__DIR__.'/scenario.json'),true);
    if (!is_array($tpl)) fail_api(500,'Missing site scenario template');
    $limit=isset($body['turn_limit'])?intval($body['turn_limit']):8;
    if ($limit<2 || $limit>15) fail_api(400,'Turn limit must be 2-15');
    $mode=isset($body['mode'])?$body['mode']:'discovery';
    if (!in_array($mode,array('discovery','native_only'),true)) fail_api(400,'Invalid mode');
    $tokens=array('us'=>bin2hex(random_bytes(24)),'ge'=>bin2hex(random_bytes(24)));
    $g=array('id'=>bin2hex(random_bytes(12)),'v'=>1,
      'title'=>request_value($body,'title',180),
      'config'=>isset($body['config'])?$body['config']:$tpl['config'],
      'world'=>ie_world(isset($body['config'])?$body['config']:$tpl['config']),
      'rules'=>isset($body['rules'])?request_value($body,'rules',18000):$tpl['rules'],
      'scenario'=>isset($body['scenario'])?request_value($body,'scenario',20000):$tpl['scenario'],
      'mode'=>$mode,'turn_limit'=>$limit,'turn'=>1,'phase'=>'orders','winner'=>null,
      'public_brief'=>isset($body['public_brief'])?request_value($body,'public_brief',10000):$tpl['public_brief'],
      'private_briefs'=>array('us'=>request_value($body,'us_brief',10000,false),
                              'ge'=>request_value($body,'ge_brief',10000,false)),
      'current'=>array('us'=>null,'ge'=>null),'history'=>array(),'revision'=>0,
      'rules_revision'=>2,
      'key_hashes'=>array('us'=>hash('sha256',$tokens['us']),'ge'=>hash('sha256',$tokens['ge'])),
      'updated_at'=>gmdate('c'));
    $path=game_path($g['id']);
    $f=@fopen($path,'x');
    if (!$f) fail_api(500,'Could not create match');
    $text=encode_game($g);
    $ok=fwrite($f,$text)===strlen($text); fclose($f);
    if (!$ok) { @unlink($path); fail_api(500,'Could not write match'); }
    @chmod($path,0600);
    reply(201,array('ok'=>true,'id'=>$g['id'],'keys'=>$tokens,'turn'=>1,
      'notice'=>'Copy these keys now. They cannot be retrieved later. Never post them publicly.'));
}
if ($op==='submit') {
    $id=isset($body['id'])?$body['id']:'';
    $side=isset($body['side'])?$body['side']:'';
    if (!in_array($side,array('us','ge'),true)) fail_api(400,'Invalid side');
    $result=with_game($id,function(&$g)use($body,$side){
        check_role($g,$side);validate_turn($g,$body);
        if ($g['phase']!=='orders') fail_api(409,'Turn no longer accepting orders');
        $order=ie_validate_order(isset($body['order'])?$body['order']:null,
            $side,$g['turn'],$g['world'],$g['mode']);
        $digest=hash('sha256',json_encode($order,JSON_UNESCAPED_SLASHES));
        if ($g['current'][$side]!==null) {
            if (hash_equals($g['current'][$side]['digest'],$digest))
                return array('body'=>array('ok'=>true,'accepted'=>true,
                    'duplicate'=>true,'turn'=>$g['turn'],'both_ready'=>false));
            fail_api(409,'Orders sealed; changes are prohibited');
        }
        $g['current'][$side]=array('order'=>$order,'digest'=>$digest,
            'submitted_at'=>gmdate('c'));
        $resolved=null;
        if ($g['current']['us']!==null && $g['current']['ge']!==null)
            $resolved=ie_resolve($g);
        $g['revision']++;$g['updated_at']=gmdate('c');
        return array('updated'=>true,'body'=>array('ok'=>true,'accepted'=>true,
            'resolved'=>$resolved!==null,
            'public_result'=>$resolved===null?null:array(
                'turn'=>$resolved['turn'],'objective_points'=>$resolved['objective_points'],
                'outcome'=>$resolved['outcome']),
            'turn'=>$g['turn'],'phase'=>$g['phase'],'winner'=>$g['winner']));
    });
    reply(200,$result);
}
fail_api(404,'Unknown operation');
