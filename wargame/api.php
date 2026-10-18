<?php
/*
 * GRASSTEX Commander Ideation Exchange V1.
 * Shared-hosting PHP/JSON thought-game; no calls to real battle simulation or LLM APIs.
 * The hosting site is canonical for rules, scenario, orders, private briefs and history.
 */
require_once __DIR__.'/engine.php';
// Increment for client/server contract releases, independently of match rules.
const IDEATION_API_VERSION = '0.4.0';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Ideation-API-Version: '.IDEATION_API_VERSION);
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
function public_events($events,$side=null,$admin=false) {
    if ($admin) return array_values((array)$events);
    $safe=array();
    foreach ((array)$events as $event) {
        if (!is_string($event)) continue;
        if ($side!==null && preg_match('/^(US|GE)-[0-9]+:/', $event, $m) &&
            strtoupper($side)===$m[1]) { $safe[]=$event; continue; }
        if ($side!==null && preg_match('/^(us|ge):/', $event, $m) &&
            $side===$m[1]) { $safe[]=$event; continue; }
        // Explicit allowlist: only objective transfers are global events.
        // Unknown new event types stay private until deliberately classified.
        if (preg_match('/^[A-Za-z0-9 _-]{1,90}: abstract control (?:neutral|us|ge) -> (?:neutral|us|ge)$/D',$event))
            $safe[]=$event;
    }
    return $safe;
}
function history_for($g,$side=null,$admin=false) {
    $history=array();
    $legacyObjectives=ie_config($g['config']);
    foreach ($g['history'] as $round) {
        // Legacy V1 games did not persist a per-round objective snapshot.
        // Rebuild ONLY publicly reported captures from the original log;
        // never infer historic enemy coordinates or contested status.
        $events=isset($round['resolution']['events'])?$round['resolution']['events']:array();
        foreach ($events as $event) {
            if (!is_string($event)) continue;
            foreach ($legacyObjectives as &$obj) {
                $prefix=$obj['name'].': abstract control ';
                if (strncmp($event,$prefix,strlen($prefix))!==0) continue;
                if (preg_match('/^(?:neutral|us|ge) -> (neutral|us|ge)$/D',
                    substr($event,strlen($prefix)),$m)) {
                    $obj['owner']=$m[1];
                }
            }
            unset($obj);
        }
        $r=isset($round['resolution']) && is_array($round['resolution'])?$round['resolution']:array();
        // All pre-V2 historical events and orders MUST pass through this filter too.
        $r['events']=public_events(isset($r['events'])?$r['events']:array(),$side,$admin);
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
        else $item['public_snapshot']=array(
            'objectives'=>array_values($legacyObjectives),
            'clock_minutes'=>10*(int)$round['turn'],
            'outcome'=>isset($r['outcome'])?$r['outcome']:'ongoing',
            'snapshot_kind'=>'legacy_public_capture_reconstruction',
            'note'=>'Historic objective ownership only; contested state is unavailable.');
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

/* A best-of-three series counts decisive results only. Draws replay the same
   numbered leg, and faction assignments alternate after every match attempt.
   Admin-only rematches never mutate a completed game's winner or world state. */
function series_info($g) {
    $s=isset($g['series']) && is_array($g['series'])?$g['series']:array(
        'id'=>$g['id'], 'attempt'=>1, 'game_number'=>1,
        'base_title'=>$g['title'], 'player_a'=>'Player A', 'player_b'=>'Player B',
        'us_player'=>'a','ge_player'=>'b','prior_results'=>array());
    $results=isset($s['prior_results'])?$s['prior_results']:array();
    if ($g['phase']==='complete') {
        $winner=isset($g['winner'])?$g['winner']:'draw';
        $player=($winner==='us' || $winner==='ge')?
            $s[$winner.'_player']:null;
        $results[]=array('match_id'=>$g['id'],'game_number'=>$s['game_number'],
            'attempt'=>$s['attempt'],'winner_side'=>$winner,'winner_player'=>$player);
    }
    $scores=array('a'=>0,'b'=>0);
    foreach ($results as $r) {
        if (isset($r['winner_player']) && isset($scores[$r['winner_player']]))
            $scores[$r['winner_player']]++;
    }
    $champion=$scores['a']>=2?'a':($scores['b']>=2?'b':null);
    return array('id'=>$s['id'],'best_of'=>3,'game_number'=>$s['game_number'],
        'attempt'=>$s['attempt'], 'players'=>array('a'=>$s['player_a'],'b'=>$s['player_b']),
        'assignments'=>array('us'=>$s['us_player'],'ge'=>$s['ge_player']),
        'score'=>$scores,'results'=>$results,'champion'=>$champion,
        'next_match_id'=>isset($g['next_match_id'])?$g['next_match_id']:null,
        'can_rematch'=>$g['phase']==='complete' && $champion===null &&
            empty($g['next_match_id']));
}
function write_new_game($g) {
    $path=game_path($g['id']);
    $f=@fopen($path,'x');
    if (!$f) fail_api(500,'Could not create match');
    $encoded=encode_game($g);
    $written=fwrite($f,$encoded);
    fclose($f);
    if ($written!==strlen($encoded)) {
        @unlink($path);
        fail_api(500,'Could not save match');
    }
    @chmod($path,0600);
}

function public_game($g,$side=null,$admin=false) {
    $count=array('us'=>$g['current']['us']!==null,'ge'=>$g['current']['ge']!==null);
    return array('ok'=>true,'api_version'=>IDEATION_API_VERSION,
        'id'=>$g['id'],'title'=>$g['title'],'rules'=>$g['rules'],
        'scenario'=>$g['scenario'],'mode'=>$g['mode'],'turn_limit'=>$g['turn_limit'],
        'turn'=>$g['turn'],'phase'=>$g['phase'],'winner'=>$g['winner'],
        'public_brief'=>$g['public_brief'],'submitted'=>$count,
        'current_orders'=>null,'public_world'=>ie_public_world($g['world']),
        'history'=>history_for($g,$side,$admin),'series'=>series_info($g),
        'revision'=>$g['revision'],
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
    if ($op==='version') reply(200,array('ok'=>true,'api_version'=>IDEATION_API_VERSION));
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
            if ($role==='admin') fail_api(426,'Outdated spectator script. Reload the latest wargame page and use Protected observer; administrator credentials belong in X-Ideation-Key.');
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
        $replay=ie_legacy_replay($g);
        if ($replay['ok']) {
            foreach ($data['history'] as $index=>&$turn)
                if (!isset($turn['world_snapshot']) && isset($replay['snapshots'][$index]))
                    $turn['world_snapshot']=$replay['snapshots'][$index];
            unset($turn);
            $data['replay_source']='reconstructed_verified_v1';
        } else if (isset($replay['snapshots']) && is_array($replay['snapshots'])) {
            // Only the password-protected observer receives an illustrative
            // trace. Do not present re-simulated positions as historic facts.
            foreach ($data['history'] as $index=>&$turn) {
                if (!isset($turn['world_snapshot']) && isset($replay['snapshots'][$index]))
                    $turn['world_snapshot']=$replay['snapshots'][$index];
            }
            unset($turn);
            $data['replay_source']='illustrative_unverified_v1';
            $data['replay_note']='UNVERIFIED movement reconstruction: the original V1 game did not save exact turn-by-turn unit positions. This trace is a what-if replay of sealed orders and diverges from the recorded outcome; original objective ownership and final result remain authoritative.';
        } else {
            $data['replay_source']=isset($g['history'][0]['world_snapshot'])?
                'stored_snapshots':'latest_only';
            if ($data['replay_source']==='latest_only')
                $data['replay_note']=$replay['reason'];
        }
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
      'initial_public_brief'=>isset($body['public_brief'])?request_value($body,'public_brief',10000):$tpl['public_brief'],
      'series'=>array('id'=>null,'game_number'=>1,'attempt'=>1,
        'base_title'=>request_value($body,'title',180),
        'player_a'=>isset($body['player_a'])?request_value($body,'player_a',60):'Player A',
        'player_b'=>isset($body['player_b'])?request_value($body,'player_b',60):'Player B',
        'us_player'=>'a','ge_player'=>'b','prior_results'=>array()),
      'key_hashes'=>array('us'=>hash('sha256',$tokens['us']),'ge'=>hash('sha256',$tokens['ge'])),
      'updated_at'=>gmdate('c'));
    $g['series']['id']=$g['id'];
    write_new_game($g);
    reply(201,array('ok'=>true,'id'=>$g['id'],'keys'=>$tokens,'turn'=>1,
      'notice'=>'Copy these keys now. They cannot be retrieved later. Never post them publicly.'));
}
if ($op==='rematch') {
    check_admin();
    $id=isset($body['id'])?$body['id']:'';
    $result=with_game($id,function(&$g)use($body){
        if ($g['phase']!=='complete') fail_api(409,'Finish this game before requesting a rematch');
        $info=series_info($g);
        if (!$info['can_rematch']) fail_api(409,'Series already won or rematch already created');
        $s=isset($g['series'])?$g['series']:array(
            'id'=>$g['id'],'attempt'=>1,'game_number'=>1,
            'base_title'=>$g['title'],'player_a'=>'Player A','player_b'=>'Player B',
            'us_player'=>'a','ge_player'=>'b','prior_results'=>array());
        if (!isset($g['series']) || ($s['attempt']===1 && !$s['prior_results'])) {
            $s['player_a']=isset($body['player_a'])?request_value($body,'player_a',60):$s['player_a'];
            $s['player_b']=isset($body['player_b'])?request_value($body,'player_b',60):$s['player_b'];
        }
        $tokens=array('us'=>bin2hex(random_bytes(24)),'ge'=>bin2hex(random_bytes(24)));
        $tpl=json_decode(@file_get_contents(__DIR__.'/scenario.json'),true);
        if (!is_array($tpl)) fail_api(500,'No site rules template available');
        $decisive=0;
        foreach ($info['results'] as $r) if ($r['winner_player']!==null) $decisive++;
        $newNumber=1+$decisive;
        if ($newNumber>3) fail_api(409,'The best-of-three series has ended');
        $newSeries=array(
            'id'=>$s['id'],'attempt'=>$s['attempt']+1,'game_number'=>$newNumber,
            'base_title'=>$s['base_title'],
            'player_a'=>$s['player_a'],'player_b'=>$s['player_b'],
            'us_player'=>$s['ge_player'],'ge_player'=>$s['us_player'],
            'prior_results'=>$info['results']);
        // Deterministically reset the same scenario, not the completed battle.
        // Upgrading a legacy V1 match to new V2 rules happens only on rematch.
        $new=array('id'=>bin2hex(random_bytes(12)),'v'=>1,
            'title'=>$s['base_title'].' — Game '.$newNumber.'/3',
            'config'=>$g['config'],'world'=>ie_world($g['config']),
            'rules'=>$tpl['rules'],'scenario'=>$g['scenario'],
            'mode'=>$g['mode'],'turn_limit'=>$g['turn_limit'],
            'turn'=>1,'phase'=>'orders','winner'=>null,
            'public_brief'=>isset($g['initial_public_brief'])?
                $g['initial_public_brief']:$tpl['public_brief'],
            'initial_public_brief'=>isset($g['initial_public_brief'])?
                $g['initial_public_brief']:$tpl['public_brief'],
            'private_briefs'=>isset($g['private_briefs'])?$g['private_briefs']:
                array('us'=>'','ge'=>''),
            'current'=>array('us'=>null,'ge'=>null),'history'=>array(),
            'revision'=>0,'rules_revision'=>2,'series'=>$newSeries,
            'key_hashes'=>array('us'=>hash('sha256',$tokens['us']),
                'ge'=>hash('sha256',$tokens['ge'])),
            'updated_at'=>gmdate('c'));
        $g['series']=$s;
        $g['next_match_id']=$new['id'];
        $g['revision']++;
        $g['updated_at']=gmdate('c');
        write_new_game($new);
        return array('updated'=>true,'body'=>array('ok'=>true,'id'=>$new['id'],
            'game_number'=>$newNumber,'series'=>series_info($new),
            'keys'=>$tokens,'notice'=>'Save new role keys now; they cannot be recovered.'));
    });
    reply(201,$result);
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
