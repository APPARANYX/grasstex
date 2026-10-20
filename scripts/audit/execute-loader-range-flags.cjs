/* Execute original PHP query fragments and JS numeric/helper readers in fixtures. */
const fs=require('node:fs'),cp=require('node:child_process'),acorn=require('acorn');
const {loadModule}=require('../../tools/ai-sim-harness/module-loader');
const out='docs/audits/2026-10-20-grasstex/runtime-verification/artifacts/';
const php=fs.readFileSync('battle_sim_local.php','utf8'),selection=php.slice(php.indexOf('$requestedSeed='),php.indexOf('/* An explicit live Combat Lab'));
const moduleCode=php.slice(php.indexOf('$allDevModules ='),php.indexOf('$moduleAllowed ='));
const proxy=fs.readFileSync('battle_sim.php','utf8'),pin=proxy.slice(proxy.indexOf('$pinRequested ='),proxy.indexOf('$root ='));
const cases=[];
for(const query of ['', 'autonomousMovement=0&smartIndoorIngress=0','autonomousMovement=false&smartIndoorIngress=off','combatLab=1','devModules=1','editor=ai','bench=1','damageRange=1','pin=1&ref=f89939f2','ref=f89939f2','defender=ge','defender=invalid']){
 const code='parse_str('+JSON.stringify(query)+',$_GET);\n'+selection+moduleCode+pin+'\necho json_encode(get_defined_vars());';
 const r=cp.spawnSync('php',['-r',code],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);
 const all=JSON.parse(r.stdout);cases.push({query,effective:Object.fromEntries(['requestedSeed','requestedDefender','autonomousMovement','smartIndoorIngress','labRequested','allDevModules','graphUiRequested','deviceBenchRequested','damageRangeRequested','pinRequested','requestedRef'].map(k=>[k,all[k]]))});
}
const core={location:{search:'?log=0'}};loadModule(core,'battle/core-runtime.js');
const rangeSource=fs.readFileSync('battle/modules/98-damage-range.js','utf8');const ast=acorn.parse(rangeSource,{ecmaVersion:'latest',locations:true});let numSource;
function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&n.id.name==='num')numSource=rangeSource.slice(n.start,n.end);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v)}walk(ast);
const range=[];for(const [name,fallback,min,max]of [['rangeInterval',1.25,.35,8],['rangeDist',5.4,2.5,14],['rangeTarget',0,0,9]])for(const value of [null,'','0','1','off','false','100']){
 const query=value===null?'':'?'+name+'='+value,q=new URLSearchParams(query),effective=new Function('q','clamp','return ('+numSource+');')(q,core.GTMath.clamp)(name,fallback,min,max);range.push({name,query,fallback,min,max,effective});
}
function find(file,predicate){const source=fs.readFileSync(file,'utf8'),ast=acorn.parse(source,{ecmaVersion:'latest',locations:true});let result;function visit(n){if(!n||typeof n!=='object')return;if(!result&&predicate(n))result={source:source.slice(n.start,n.end),line:n.loc.start.line};for(const v of Object.values(n))if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v)}visit(ast);if(!result)throw Error('Missing expected source node in '+file);return result;}
function initializer(file,name){const found=find(file,n=>n.type==='VariableDeclarator'&&n.id.name===name);const ast=acorn.parse('var '+found.source,{ecmaVersion:'latest'});return{source:found.source.slice(ast.body[0].declarations[0].init.start-4),line:found.line};}
const device='battle/modules/97-device-benchmark.js',session='battle/modules/97z-damage-range-session.js';
const aliases=initializer(device,'HIDE_ALIAS'),zones=initializer('battle/modules/98-damage-range.js','ZONES');
const aliasValue=new Function('return ('+aliases.source+')')(),zoneValue=new Function('return ('+zones.source+')')();
const expressions=[['benchHide',device,initializer(device,'HIDE')],['rangeZone',session,initializer(session,'zone')],['rangeUi',session,initializer(session,'panelCollapsed')],['pinSeed','battle/scenario-generator.js',initializer('battle/scenario-generator.js','autoUrlSeed')],['editor','battle/modules/30-ai-graph-editor.js',find('battle/modules/30-ai-graph-editor.js',n=>n.type==='LogicalExpression'&&n.operator==='||'&&n.left?.type==='BinaryExpression'&&n.left.left?.type==='CallExpression'&&n.left.left.arguments?.[0]?.value==='editor')]];
const extra=[];
for(const [name,file,expression]of expressions)for(const prefix of (name==='pinSeed'?['seed=runtime-audit','seed=live-abc-def']:name==='rangeUi'?['','rangeAuto=1']:['']))for(const value of [null,'0','1','off','false']){
 const query='?'+[prefix,value===null?'':name+'='+value].filter(Boolean).join('&'),q=new URLSearchParams(query),location={search:query,hash:''};
 const effective=new Function('q','params','location','HIDE_ALIAS','ZONES','auto','urlSeed','return ('+expression.source+')')(q,q,location,aliasValue,zoneValue,q.get('rangeAuto')==='1',q.get('seed')||'');
 extra.push({name,file,line:expression.line,expression:expression.source,query,effective});
}
fs.writeFileSync(out+'loader-range-flag-executions.json',JSON.stringify({sourceBaseline:'f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9',phpCases:cases,extraReadCases:extra,rangeReader:{source:'battle/modules/98-damage-range.js:35',expression:numSource,cases:range},classificationNotes:{infantry:'Map lookup in tactical-map rendering; excluded from runtime URL flag semantics',grass:'preview allowlist candidate without discovered runtime reader; activation unresolved'}},null,2));
console.log('Executed',cases.length,'PHP loader cases and',range.length,'original numeric-reader cases.');console.log('Additional original read expressions:',extra.length);console.log(range.filter(x=>x.query===''));
